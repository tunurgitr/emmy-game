// ==========================================================================
//  Emmy's Arcade 3D — the walkable arcade (Langers-style timber hall).
//
//  createWorld(canvas, { games, ui, onPrompt, onInteract }) → world
//    world.start() / stop()
//    world.setOverride({ scene, camera, update, onDown, onMove, onUp }) — while
//      set, the renderer shows the override (a first-person game) instead.
//    world.enterGame(id) → Promise (camera flies into the cabinet's screen)
//    world.exitGame() → camera returns to third-person
//    world.keys — Set of held keys (shared with games)
// ==========================================================================
import { THREE, rnd, ri, clamp, pick, lerp, mat, box, cyl, sphere, torus, emojiSprite, emojiPlane, textPlane, textTexture, carpetTexture, woodTexture, blobShadow, makeKid, approach, makePlush, PLUSH_KINDS, LOW_TIER, mergeStatic } from "./lib.js";

const ROOM_W = 46, ROOM_D = 36; // x, z extents
const EYE = 1.55;

export function createWorld(canvas, { games, ui, onPrompt, onInteract, avatar = {} }) {
  // quality: touch devices (iPad) render at 1x with no MSAA and adapt resolution to hit 60fps
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: !LOW_TIER, powerPreference: "high-performance" });
  const basePR = LOW_TIER ? 1.0 : Math.min(1.75, window.devicePixelRatio || 1); let resScale = 1, emaDt = 1 / 60, adaptT = 0;
  renderer.setPixelRatio(basePR);
  renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.05;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  const scene = new THREE.Scene(); scene.background = new THREE.Color(0x2a1d14); scene.fog = new THREE.Fog(0x2a1d14, 30, 70);
  const camera = new THREE.PerspectiveCamera(60, 1, 0.1, 150);

  const obstacles = []; // {x,z,w,d}
  const interactables = []; // {id, kind, front:Vector3, eye:Vector3, look:Vector3, label, group, hit:[meshes]}
  const animated = []; // fns(dt, t)

  buildRoom(scene, obstacles, animated, interactables);
  buildKiosk(scene, obstacles, interactables, animated);
  buildPrizeCounter(scene, obstacles, interactables, animated);
  layoutCabinets(scene, games, obstacles, interactables, animated);
  // collapse static geometry into a few draw calls (room shell, cabinets, counters)
  let mergedCount = mergeStatic(scene);
  const groups = []; scene.traverse((o) => { if (o.isGroup && o !== scene && o.children.length > 3 && !o.userData.noMerge) groups.push(o); }); for (const g of groups) mergedCount += mergeStatic(g);

  // ---- player -------------------------------------------------------------
  const kid = makeKid(avatar); scene.add(kid.group);
  const player = { x: 0, z: 13, yaw: Math.PI, speed: 0 };
  kid.group.position.set(player.x, 0, player.z);
  let camYaw = 0, camPitch = 0.38, camDist = 5.6;
  let autoTarget = null, autoInteract = null;

  // ---- input --------------------------------------------------------------
  const keys = new Set();
  const move = { x: 0, y: 0 }; // joystick vector (-1..1)
  let override = null, transition = null, running = false, paused = false, docked = false, focus = false;
  const pointers = new Map(); let joyPid = null, lookPid = null, joyOrigin = null, downInfo = null;
  const isTouch = ("ontouchstart" in window) || navigator.maxTouchPoints > 0;
  const joy = document.createElement("div"); joy.className = "joy"; joy.innerHTML = `<div class="knob"></div>`; ui.appendChild(joy); const knob = joy.firstElementChild;
  // on touch devices the joystick base is always visible bottom-left (it re-centers under your thumb when you touch)
  const restJoy = () => { if (isTouch) { joy.style.display = "block"; joy.style.left = "26px"; joy.style.top = ""; joy.style.bottom = "max(30px, env(safe-area-inset-bottom))"; joy.classList.add("rest"); knob.style.transform = ""; } else joy.style.display = "none"; };
  const setJoy = (visible, cx, cy, dx = 0, dy = 0) => { if (!visible) { restJoy(); return; } joy.classList.remove("rest"); joy.style.display = "block"; joy.style.bottom = ""; joy.style.left = `${cx - 60}px`; joy.style.top = `${cy - 60}px`; knob.style.transform = `translate(${dx}px, ${dy}px)`; };
  restJoy();
  const ndc = new THREE.Vector2(); const ray = new THREE.Raycaster();
  const evt = (e) => { const r = canvas.getBoundingClientRect(); ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1); const cam = override ? override.camera : camera; ray.setFromCamera(ndc, cam); return { x: ndc.x, y: ndc.y, sx: e.clientX - r.left, sy: e.clientY - r.top, ray, id: e.pointerId, W: r.width, H: r.height }; };

  canvas.addEventListener("pointerdown", (e) => {
    canvas.setPointerCapture(e.pointerId); pointers.set(e.pointerId, { x: e.clientX, y: e.clientY, sx: e.clientX, sy: e.clientY, moved: 0 });
    if (override) { override.onDown && override.onDown(evt(e)); return; }
    if (transition) return;
    const touch = e.pointerType === "touch";
    if (touch && e.clientX < innerWidth * 0.45 && joyPid === null) { joyPid = e.pointerId; joyOrigin = { x: e.clientX, y: e.clientY }; setJoy(true, e.clientX, e.clientY); autoTarget = null; return; }
    if (lookPid === null) { lookPid = e.pointerId; downInfo = { x: e.clientX, y: e.clientY, t: performance.now() }; }
  });
  canvas.addEventListener("pointermove", (e) => {
    const p = pointers.get(e.pointerId); if (!p) return; p.moved += Math.hypot(e.clientX - p.x, e.clientY - p.y); p.x = e.clientX; p.y = e.clientY;
    if (override) { override.onMove && override.onMove(evt(e)); return; }
    if (e.pointerId === joyPid) { let dx = e.clientX - joyOrigin.x, dy = e.clientY - joyOrigin.y; const l = Math.hypot(dx, dy), m = 48; if (l > m) { dx *= m / l; dy *= m / l; } move.x = dx / m; move.y = dy / m; setJoy(true, joyOrigin.x, joyOrigin.y, dx, dy); }
    if (e.pointerId === lookPid) { const dx = e.movementX ?? 0, dy = e.movementY ?? 0; if (p.moved > 6) { camYaw -= dx * 0.006; camPitch = clamp(camPitch - dy * 0.004, 0.08, 1.1); } }
  });
  const up = (e) => {
    const p = pointers.get(e.pointerId); pointers.delete(e.pointerId);
    if (override) { override.onUp && override.onUp(evt(e)); return; }
    if (e.pointerId === joyPid) { joyPid = null; move.x = move.y = 0; setJoy(false); }
    if (e.pointerId === lookPid) { lookPid = null; if (p && p.moved < 8 && !transition) tapToWalk(evt(e)); downInfo = null; }
  };
  canvas.addEventListener("pointerup", up); canvas.addEventListener("pointercancel", up);
  window.addEventListener("keydown", (e) => { if (["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", " "].includes(e.key)) e.preventDefault(); if (e.repeat) return; keys.add(e.key.length === 1 ? e.key.toLowerCase() : e.key); if (override) { override.onKey && override.onKey(e.key); return; } if ((e.key === "e" || e.key === "E" || e.key === "Enter" || e.key === " ") && nearest && !transition) onInteract(nearest); });
  window.addEventListener("keyup", (e) => keys.delete(e.key.length === 1 ? e.key.toLowerCase() : e.key));
  window.addEventListener("blur", () => keys.clear());

  // ---- gamepad (any standard controller): left stick walks, right stick looks, A interacts ----
  const pad = { lx: 0, ly: 0, rx: 0, ry: 0, buttons: [], connected: false };
  const prevBtn = []; const cursor = document.createElement("div"); cursor.className = "padcursor"; cursor.style.display = "none"; ui.appendChild(cursor); let cur = { x: 0.5, y: 0.5 };
  const dz = (v) => (Math.abs(v) < 0.14 ? 0 : v);
  function pollPad() {
    const gps = navigator.getGamepads ? navigator.getGamepads() : []; let gp = null; for (const g of gps) if (g && g.connected) { gp = g; break; }
    pad.connected = !!gp; if (!gp) { cursor.style.display = "none"; return; }
    pad.lx = dz(gp.axes[0] || 0); pad.ly = dz(gp.axes[1] || 0); pad.rx = dz(gp.axes[2] || 0); pad.ry = dz(gp.axes[3] || 0);
    const pressed = gp.buttons.map((b) => b.pressed); const edges = pressed.map((p, i) => p && !prevBtn[i]); const released = pressed.map((p, i) => !p && prevBtn[i]); prevBtn.length = 0; prevBtn.push(...pressed); pad.buttons = pressed;
    if (override) { // virtual cursor: right stick (or left) moves it, A taps at it
      const W = canvas.clientWidth || innerWidth, H = canvas.clientHeight || innerHeight; const mx = pad.rx || pad.lx, my = pad.ry || pad.ly;
      cur.x = clamp(cur.x + mx * 0.9 / 60, 0.02, 0.98); cur.y = clamp(cur.y + my * 0.9 / 60, 0.02, 0.98);
      cursor.style.display = "block"; cursor.style.left = `${cur.x * W}px`; cursor.style.top = `${cur.y * H}px`; cursor.classList.toggle("down", !!pressed[0]);
      const fake = { clientX: canvas.getBoundingClientRect().left + cur.x * W, clientY: canvas.getBoundingClientRect().top + cur.y * H, pointerId: 999 };
      if (edges[0]) override.onDown && override.onDown(evt(fake)); else if (pressed[0]) override.onMove && override.onMove(evt(fake)); if (released[0]) override.onUp && override.onUp(evt(fake));
      edges.forEach((e, i) => { if (e && override.onPad) override.onPad(i); }); if (edges[1] && onPadBack) onPadBack();
    } else {
      cursor.style.display = "none"; camYaw -= pad.rx * 2.4 / 60; camPitch = clamp(camPitch - pad.ry * 1.6 / 60, 0.08, 1.1);
      if (edges[0] && nearest && !transition) onInteract(nearest); if (edges[1] && onPadBack) onPadBack();
    }
  }
  let onPadBack = null;
  const floorPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0), tmpV = new THREE.Vector3();
  function tapToWalk(p) {
    const meshes = interactables.flatMap((i) => i.hit);
    const hit = p.ray.intersectObjects(meshes, true)[0];
    if (hit) { let o = hit.object; while (o && !o.userData.interactable) o = o.parent; const it = o?.userData.interactable; if (it) { autoTarget = it.front.clone(); autoInteract = it; return; } }
    if (p.ray.ray.intersectPlane(floorPlane, tmpV)) { autoTarget = tmpV.clone(); autoInteract = null; }
  }

  // ---- update -------------------------------------------------------------
  let nearest = null, last = performance.now(), t = 0;
  const camPos = new THREE.Vector3(), camLook = new THREE.Vector3();
  function update(dt) {
    t += dt;
    for (const f of animated) f(dt, t);
    if (transition) { transition(dt); return; }
    if (docked) return; // parked in front of a machine (camera stays put until exitGame)
    if (focus) { // "My look" preview: face the camera and hold still
      kid.group.rotation.y = camYaw; kid.walk(t, 0, dt); camPos.set(player.x + Math.sin(camYaw) * 3.2, 1.7, player.z + Math.cos(camYaw) * 3.2); camera.position.lerp(camPos, Math.min(1, dt * 6)); camLook.set(player.x, 1.05, player.z); camera.lookAt(camLook); return; }
    // movement input (joystick / keys / gamepad left stick)
    let mx = move.x + (pad.connected ? pad.lx : 0), mz = move.y + (pad.connected ? pad.ly : 0);
    if (keys.has("w") || keys.has("ArrowUp")) mz -= 1; if (keys.has("s") || keys.has("ArrowDown")) mz += 1;
    if (keys.has("a") || keys.has("ArrowLeft")) mx -= 1; if (keys.has("d") || keys.has("ArrowRight")) mx += 1;
    if (keys.has("q")) camYaw += 1.8 * dt; if (keys.has("e") && !nearest) camYaw -= 1.8 * dt;
    let l = Math.hypot(mx, mz); if (l > 1) { mx /= l; mz /= l; l = 1; }
    if (l > 0.05) autoTarget = null;
    // camera-relative → world
    const sy = Math.sin(camYaw), cy = Math.cos(camYaw);
    let vx = 0, vz = 0;
    if (l > 0.05) { vx = mx * cy + mz * sy; vz = -mx * sy + mz * cy; } // camera-relative: up on the stick = away from the camera
    else if (autoTarget) { const dx = autoTarget.x - player.x, dz = autoTarget.z - player.z, d = Math.hypot(dx, dz); if (d < 0.25) { autoTarget = null; if (autoInteract) { const it = autoInteract; autoInteract = null; if (near(it) < 2.6) onInteract(it); } } else { vx = dx / d; vz = dz / d; l = Math.min(1, d); } }
    const SP = 4.6;
    const targetSpeed = l > 0.05 || autoTarget ? SP * Math.max(0.35, l) : 0;
    player.speed = approach(player.speed, targetSpeed, 10, dt);
    if (player.speed > 0.01 && (vx || vz)) { player.x += vx * player.speed * dt; player.z += vz * player.speed * dt; player.yaw = Math.atan2(vx, vz); }
    // collisions
    player.x = clamp(player.x, -ROOM_W / 2 + 1, ROOM_W / 2 - 1); player.z = clamp(player.z, -ROOM_D / 2 + 1, ROOM_D / 2 - 1);
    for (const o of obstacles) { const R = 0.45; const nx = clamp(player.x, o.x - o.w / 2, o.x + o.w / 2), nz = clamp(player.z, o.z - o.d / 2, o.z + o.d / 2); let dx = player.x - nx, dz = player.z - nz; const d = Math.hypot(dx, dz);
      if (d < R) { if (d < 1e-4) { const px = Math.min(Math.abs(player.x - (o.x - o.w / 2)), Math.abs(o.x + o.w / 2 - player.x)), pz = Math.min(Math.abs(player.z - (o.z - o.d / 2)), Math.abs(o.z + o.d / 2 - player.z)); if (px < pz) player.x = player.x < o.x ? o.x - o.w / 2 - R : o.x + o.w / 2 + R; else player.z = player.z < o.z ? o.z - o.d / 2 - R : o.z + o.d / 2 + R; } else { player.x = nx + dx / d * R; player.z = nz + dz / d * R; } if (autoTarget && !autoInteract) autoTarget = null; } }
    kid.group.position.set(player.x, 0, player.z);
    let dy = player.yaw - kid.group.rotation.y; while (dy > Math.PI) dy -= Math.PI * 2; while (dy < -Math.PI) dy += Math.PI * 2; kid.group.rotation.y += dy * Math.min(1, dt * 12);
    kid.walk(t, player.speed / SP, dt);
    // camera follow (with wall clamp)
    camPos.set(player.x + Math.sin(camYaw) * Math.cos(camPitch) * camDist, EYE + Math.sin(camPitch) * camDist, player.z + Math.cos(camYaw) * Math.cos(camPitch) * camDist);
    camPos.x = clamp(camPos.x, -ROOM_W / 2 + 0.5, ROOM_W / 2 - 0.5); camPos.z = clamp(camPos.z, -ROOM_D / 2 + 0.5, ROOM_D / 2 - 0.5);
    camera.position.lerp(camPos, Math.min(1, dt * 8)); camLook.set(player.x, 1.3, player.z); camera.lookAt(camLook);
    // nearest interactable
    let best = null, bd = 2.6; for (const it of interactables) { const d = near(it); if (d < bd) { bd = d; best = it; } }
    if (best !== nearest) { nearest = best; onPrompt(best); }
  }
  const near = (it) => Math.hypot(it.front.x - player.x, it.front.z - player.z);

  // ---- loop ---------------------------------------------------------------
  function resize() { const w = canvas.clientWidth || innerWidth, h = canvas.clientHeight || innerHeight; renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix(); if (override?.camera) { override.camera.aspect = w / h; override.camera.updateProjectionMatrix(); } }
  window.addEventListener("resize", resize); resize();
  function adaptResolution(dt) { // dynamic resolution: keep frames under ~20ms
    emaDt = emaDt * 0.9 + dt * 0.1; adaptT += dt; if (adaptT < 1.2) return; adaptT = 0;
    let next = resScale; if (emaDt > 1 / 40) next = Math.max(0.55, resScale * 0.85); else if (emaDt < 1 / 56) next = Math.min(1, resScale * 1.08);
    if (Math.abs(next - resScale) > 0.01) { resScale = next; renderer.setPixelRatio(basePR * resScale); resize(); }
  }
  function frame(now) {
    if (!running) return; requestAnimationFrame(frame);
    const dt = Math.min(0.05, (now - last) / 1000); last = now; if (paused) return;
    adaptResolution(dt); pollPad();
    if (override) { try { override.update(dt); renderer.render(override.scene, override.camera); } catch (err) { console.error(err); } }
    else { update(dt); renderer.render(scene, camera); }
  }

  // ---- camera fly-in / out ------------------------------------------------
  function enterGame(id) {
    const it = interactables.find((i) => i.id === id); if (!it) return Promise.resolve();
    onPrompt(null); nearest = null; autoTarget = null; move.x = move.y = 0; setJoy(false); savedYaw = camYaw; docked = true;
    // turn the kid toward the machine
    return new Promise((res) => {
      const from = camera.position.clone(), fromQ = camera.quaternion.clone(); const tmpCam = camera.clone(); tmpCam.position.copy(it.eye); tmpCam.lookAt(it.look); const toQ = tmpCam.quaternion.clone();
      let k = 0; transition = (dt) => { k = Math.min(1, k + dt / 0.8); const s = k * k * (3 - 2 * k); camera.position.lerpVectors(from, it.eye, s); camera.quaternion.slerpQuaternions(fromQ, toQ, s); kid.group.rotation.y = Math.atan2(it.look.x - player.x, it.look.z - player.z); if (k >= 1) { transition = null; res(); } };
    });
  }
  let savedYaw = 0;
  function exitGame() { override = null; docked = false; transition = null; camYaw = savedYaw; camera.position.set(player.x + Math.sin(camYaw) * camDist, EYE + 2, player.z + Math.cos(camYaw) * camDist); resize(); }

  return {
    renderer, scene, camera, keys, interactables, pad,
    onPadBack(fn) { onPadBack = fn; },
    start() { if (!running) { running = true; last = performance.now(); requestAnimationFrame(frame); } },
    stop() { running = false; },
    pause(v) { paused = v; if (!v) last = performance.now(); },
    setOverride(o) { override = o; if (o) { o.camera.aspect = (canvas.clientWidth || innerWidth) / (canvas.clientHeight || innerHeight); o.camera.updateProjectionMatrix(); } },
    enterGame, exitGame, resize,
    setAvatar(a) { const ry = kid.group.rotation.y; scene.remove(kid.group); const k = makeKid(a); kid.group = k.group; kid.walk = k.walk; kid.parts = k.parts; kid.group.position.set(player.x, 0, player.z); kid.group.rotation.y = ry; scene.add(kid.group); },
    focusPlayer(on) { focus = on; if (on) { player.yaw = camYaw + Math.PI; } },
    playerPos: () => ({ x: player.x, z: player.z }),
    size: () => ({ W: canvas.clientWidth || innerWidth, H: canvas.clientHeight || innerHeight }),
    stats: () => ({ calls: renderer.info.render.calls, triangles: renderer.info.render.triangles, merged: mergedCount, resScale, lowTier: LOW_TIER, fps: Math.round(1 / emaDt) }),
  };
}

// ==========================================================================
//  The hall — carpet, timber walls, pitched wood ceiling with big trusses,
//  warm lights, log columns, windows, a climbing wall and a little cabin.
// ==========================================================================
function buildRoom(scene, obstacles, animated, interactables) {
  const W = ROOM_W, D = ROOM_D, wallH = 7, ridgeH = 12;
  // floor
  const carpet = carpetTexture(); carpet.repeat.set(9, 7);
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(W, D), new THREE.MeshStandardMaterial({ map: carpet, roughness: 1 })); floor.rotation.x = -Math.PI / 2; scene.add(floor);
  // walls (wood planks) + windows on the far wall
  const wallMat = new THREE.MeshStandardMaterial({ map: woodTexture(0xa06a34), roughness: 0.9 }); wallMat.map.repeat.set(6, 2);
  const mkWall = (w, h, x, y, z, ry) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), wallMat); m.position.set(x, y, z); m.rotation.y = ry; scene.add(m); return m; };
  mkWall(W, wallH, 0, wallH / 2, -D / 2, 0); mkWall(W, wallH, 0, wallH / 2, D / 2, Math.PI);
  mkWall(D, wallH, -W / 2, wallH / 2, 0, Math.PI / 2); mkWall(D, wallH, W / 2, wallH / 2, 0, -Math.PI / 2);
  // big windows (glowing daylight) high on the back wall
  const skyMat = new THREE.MeshBasicMaterial({ color: 0xbfe6ff, toneMapped: false });
  for (let i = -2; i <= 2; i++) { const win = box(4.2, 2.6, 0.1, skyMat, i * 6, 5, -D / 2 + 0.06); scene.add(win); const fr = box(4.5, 2.9, 0.08, mat.std(0x4a3520), i * 6, 5, -D / 2 + 0.03); scene.add(fr); const tree = emojiSprite(pick(["🌲", "🌳"]), 1.6); tree.position.set(i * 6 + rnd(-1, 1), 4.6, -D / 2 + 0.12); scene.add(tree); }
  // pitched ceiling: two wood planes
  const ceilMat = new THREE.MeshStandardMaterial({ map: woodTexture(0xc48b4c), roughness: 0.85, side: THREE.DoubleSide }); ceilMat.map.repeat.set(10, 6);
  const half = Math.hypot(W / 2, ridgeH - wallH), ang = Math.atan2(ridgeH - wallH, W / 2);
  for (const s of [-1, 1]) { const c = new THREE.Mesh(new THREE.PlaneGeometry(half, D), ceilMat); c.position.set(s * W / 4, (wallH + ridgeH) / 2, 0); c.rotation.set(-Math.PI / 2, 0, 0); c.rotateOnWorldAxis(new THREE.Vector3(0, 0, 1), s * ang); scene.add(c); }
  // gable ends
  const gableShape = new THREE.Shape(); gableShape.moveTo(-W / 2, wallH); gableShape.lineTo(0, ridgeH); gableShape.lineTo(W / 2, wallH); gableShape.closePath();
  for (const z of [-D / 2, D / 2]) { const g = new THREE.Mesh(new THREE.ShapeGeometry(gableShape), wallMat); g.position.z = z; if (z > 0) g.rotation.y = Math.PI; scene.add(g); }
  // timber trusses
  const beam = mat.std(0x8a5a2b), beamDark = mat.std(0x6e4520);
  for (let i = 0; i <= 6; i++) {
    const z = -D / 2 + i * (D / 6);
    scene.add(box(W, 0.45, 0.4, beam, 0, wallH - 0.3, z)); // tie beam
    scene.add(box(0.4, ridgeH - wallH, 0.4, beamDark, 0, (wallH + ridgeH) / 2, z)); // king post
    for (const s of [-1, 1]) { const r = box(half, 0.32, 0.36, beam, s * W / 4, (wallH + ridgeH) / 2, z); r.rotation.z = s * ang; scene.add(r); const st = box(0.28, 3.2, 0.28, beamDark, s * W / 4, wallH + 1.2, z); st.rotation.z = -s * 0.5; scene.add(st); }
  }
  for (let i = -3; i <= 3; i++) { const x = i * (W / 7); const p = box(0.3, 0.3, D, beamDark, x, wallH + Math.abs(x) * 0 + (ridgeH - wallH) * (1 - Math.abs(x) / (W / 2)) - 0.5, 0); scene.add(p); }
  // ridge lights (warm) + hanging pendant lamps
  scene.add(new THREE.HemisphereLight(0xffe2b8, 0x3a2a4a, LOW_TIER ? 1.35 : 0.95));
  const sun = new THREE.DirectionalLight(0xffffff, LOW_TIER ? 0.8 : 0.55); sun.position.set(6, 14, -8); scene.add(sun);
  const bulbMat = mat.neon(0xffd9a0, 2.2); const lampMat = mat.std(0x333);
  for (let i = -2; i <= 2; i++) { const z = i * 7; if (!LOW_TIER || i % 2 === 0) { const pl = new THREE.PointLight(0xffc98a, LOW_TIER ? 55 : 40, LOW_TIER ? 34 : 26, 1.6); pl.position.set(0, wallH + 1.6, z); scene.add(pl); } scene.add(sphere(0.25, bulbMat, 0, wallH + 1.6, z)); scene.add(cyl(0.01, 0.01, ridgeH - wallH - 2, lampMat, 6, 0, ridgeH - 1.2, z)); }
  for (const [x, z] of [[-14, -6], [14, -6], [-14, 8], [14, 8]]) { if (!LOW_TIER) { const pl = new THREE.PointLight(0xffb070, 22, 18, 1.8); pl.position.set(x, wallH - 0.8, z); scene.add(pl); } scene.add(cyl(0.5, 0.9, 0.7, lampMat, 16, x, wallH - 0.6, z)); scene.add(sphere(0.2, bulbMat, x, wallH - 1, z)); }
  // rope lights + neon rail along the trusses (party feel)
  for (const s of [-1, 1]) { const rope = cyl(0.04, 0.04, D - 2, mat.neon(s > 0 ? 0xff3dd6 : 0x00e5ff, 1.2), 6, s * 9, wallH - 0.6, 0); rope.rotation.x = Math.PI / 2; scene.add(rope); }
  // log columns
  const bark = mat.std(0x4a301c, { roughness: 1 });
  for (const [x, z] of [[-9, -5], [9, -5], [-9, 9], [9, 9]]) { scene.add(cyl(0.55, 0.65, wallH, bark, 14, x, wallH / 2, z)); obstacles.push({ x, z, w: 1.4, d: 1.4 }); scene.add(cyl(0.8, 0.8, 0.3, mat.std(0x3a2414), 14, x, 0.15, z)); }
  // climbing wall (back-left corner)
  const cw = box(6, wallH + 3.5, 1.4, mat.std(0xb9a58a, { roughness: 1 }), -17, (wallH + 3.5) / 2, -D / 2 + 1.4); scene.add(cw); obstacles.push({ x: -17, z: -D / 2 + 1.4, w: 6.4, d: 1.8 });
  const holdCols = [0xff3dd6, 0x00e5ff, 0xffd54a, 0x00c853, 0xf4433f, 0x7a3cff]; const holdMats = holdCols.map((c) => mat.gloss(c));
  for (let i = 0; i < 70; i++) scene.add(sphere(rnd(0.1, 0.18), pick(holdMats), -17 + rnd(-2.7, 2.7), rnd(0.5, wallH + 3), -D / 2 + 2.15));
  const cwSign = textPlane(["🧗 ROCK WALL — FREE!"], 4, 0.8, { bg: "#00c853", color: "#fff", size: 100 }); cwSign.position.set(-17, wallH + 2.6, -D / 2 + 2.15); scene.add(cwSign);
  scene.add(box(3.5, 0.15, 1.2, mat.std(0x3d8bfd), -17, 0.07, -D / 2 + 3.0)); // crash mat
  cw.userData.wallSpot = { x: -17, z: -D / 2 + 2.3 };
  scene.userData.climbWall = cw;
  // little cabin (back-right) — the OPEN "Snack Shack" with a serving window, menu and a worker
  const cx = 16, cz = -D / 2 + 3;
  scene.add(box(7, 3.4, 4.5, mat.wood(0x9a6234), cx, 1.7, cz)); obstacles.push({ x: cx, z: cz, w: 7.4, d: 5 });
  const roof = new THREE.Mesh(new THREE.ConeGeometry(5.4, 2.4, 4), mat.std(0x5a3a22)); roof.position.set(cx, 4.55, cz); roof.rotation.y = Math.PI / 4; roof.scale.set(1, 1, 0.75); scene.add(roof);
  scene.add(box(3.2, 1.6, 0.3, mat.std(0x1a0f0a), cx + 0.4, 1.9, cz + 2.2)); // serving window (dark interior)
  scene.add(box(3.6, 0.12, 0.9, mat.gloss(0xffd54a), cx + 0.4, 1.12, cz + 2.55)); // counter shelf
  for (const dx of [-1.7, 1.7]) scene.add(box(0.12, 1.7, 0.12, mat.std(0x3a2414), cx + 0.4 + dx, 1.95, cz + 2.4));
  const awning = box(4, 0.08, 1.2, mat.std(0xef5350), cx + 0.4, 2.85, cz + 2.7); awning.rotation.x = 0.25; scene.add(awning); for (let i = 0; i < 6; i++) scene.add(box(0.66, 0.06, 1.2, mat.std(i % 2 ? 0xffffff : 0xef5350), cx + 0.4 - 1.65 + i * 0.66, 2.86, cz + 2.7).rotateX(0.25));
  const menu = textPlane(["MENU", "🍕 $3  🌭 $2.50  🍟 $2", "🥤 $1.50  🍦 $2  🍿 $1.50  🍭 $2.50"], 3.0, 1.1, { bg: "#fff8e1", color: "#4a2b00", size: 56 }); menu.position.set(cx - 2.6, 2.0, cz + 2.28); scene.add(menu);
  for (let i = 0; i < 5; i++) { const f = emojiSprite(["🍕", "🌭", "🍟", "🥤", "🍿"][i], 0.42); f.position.set(cx - 1.0 + i * 0.7, 1.4, cz + 2.55); scene.add(f); }
  const chef = makeKid({ shirt: 0xffffff, pants: 0xef5350, hair: 0x222222, hairStyle: "bun", skin: 0xe0ac8a, mood: "excited", hat: "👨‍🍳" }); chef.group.position.set(cx + 0.4, 0.15, cz + 1.4); scene.add(chef.group);
  animated.push((dt, t) => { chef.parts.armL.rotation.x = -0.4 + Math.sin(t * 3) * 0.3; chef.group.position.y = 0.15 + Math.abs(Math.sin(t * 2.5)) * 0.03; });
  const cabinSign = textPlane(["🍕 SNACK SHACK 🥤", "OPEN!"], 5.2, 1.1, { bg: "#ffd54a", color: "#4a2b00", size: 90 }); cabinSign.position.set(cx, 3.5, cz + 2.3); scene.add(cabinSign);
  const shackIt = { id: "snack", kind: "snack", label: "🍕 Snack Shack — buy a snack or work a shift", front: new THREE.Vector3(cx + 0.4, 0, cz + 4.2), eye: new THREE.Vector3(cx + 0.4, 1.7, cz + 4.4), look: new THREE.Vector3(cx + 0.4, 1.6, cz + 2.2), group: null, hit: [] };
  const shackHit = box(4, 3.4, 1, mat.basic(0xffffff, { transparent: true, opacity: 0 }), cx + 0.4, 1.7, cz + 2.4); shackHit.userData.interactable = shackIt; scene.add(shackHit); shackIt.hit.push(shackHit); shackIt.group = shackHit; interactables.push(shackIt);
  // restrooms (right wall, near the entrance): a little building with two doors and a sign
  const rx = W / 2 - 2.6, rz = 6;
  scene.add(box(5, 3.4, 4.2, mat.std(0xe8e0d0), rx, 1.7, rz)); obstacles.push({ x: rx, z: rz, w: 5.4, d: 4.6 }); scene.add(box(5.2, 0.3, 4.4, mat.std(0x5a3a22), rx, 3.5, rz));
  for (const [dz, col, ic] of [[-1.0, 0x3d8bfd, "🚹"], [1.0, 0xff3dd6, "🚺"]]) { scene.add(box(0.1, 2.2, 1.1, mat.gloss(col), rx - 2.55, 1.1, rz + dz)); const sp = emojiSprite(ic, 0.5); sp.position.set(rx - 2.7, 1.9, rz + dz); scene.add(sp); scene.add(sphere(0.05, mat.metal(0xffd54a), rx - 2.65, 1.05, rz + dz + 0.4, 8)); }
  const rrSign = textPlane(["🚻 RESTROOMS"], 2.6, 0.6, { bg: "#3d8bfd", color: "#fff", size: 90 }); rrSign.position.set(rx - 2.62, 2.85, rz); rrSign.rotation.y = -Math.PI / 2; scene.add(rrSign);
  const rrIt = { id: "restroom", kind: "restroom", label: "🚻 Use the restroom", front: new THREE.Vector3(rx - 4.2, 0, rz), eye: new THREE.Vector3(rx - 4.4, 1.6, rz), look: new THREE.Vector3(rx - 2.5, 1.5, rz), hit: [] };
  const rrHit = box(0.4, 3, 3.2, mat.basic(0xffffff, { transparent: true, opacity: 0 }), rx - 2.6, 1.5, rz); rrHit.userData.interactable = rrIt; scene.add(rrHit); rrIt.hit.push(rrHit); rrIt.group = rrHit; interactables.push(rrIt);
  // water fountain beside the restrooms
  const fx = rx - 3.2, fz = rz - 3.4;
  scene.add(box(0.7, 0.9, 0.6, mat.metal(0xb0bec5), fx, 0.45, fz)); scene.add(box(0.7, 0.08, 0.6, mat.gloss(0xeceff1), fx, 0.93, fz)); scene.add(cyl(0.03, 0.03, 0.12, mat.metal(), 8, fx, 1.02, fz + 0.15)); obstacles.push({ x: fx, z: fz, w: 0.9, d: 0.8 });
  const dropMat = mat.gloss(0x9fdfff, { transparent: true, opacity: 0.85 }); const drops = []; for (let i = 0; i < 6; i++) { const dr = sphere(0.02, dropMat, fx, 1.1, fz + 0.15, 6); dr.userData.dyn = true; scene.add(dr); drops.push({ m: dr, t: i / 6 }); }
  animated.push((dt) => { for (const d of drops) { d.t = (d.t + dt * 1.2) % 1; d.m.position.set(fx + d.t * 0.12, 1.1 + Math.sin(d.t * Math.PI) * 0.16 - d.t * 0.05, fz + 0.15 + d.t * 0.05); } });
  const fSign = textPlane(["🚰 WATER"], 1.2, 0.3, { bg: "#00e5ff", color: "#1a1040", size: 70 }); fSign.position.set(fx, 1.5, fz); scene.add(fSign);
  const fIt = { id: "fountain", kind: "fountain", label: "🚰 Drink some water", front: new THREE.Vector3(fx, 0, fz + 1.2), eye: new THREE.Vector3(fx, 1.6, fz + 1.3), look: new THREE.Vector3(fx, 1.0, fz), hit: [] };
  const fHit = box(0.9, 1.4, 0.8, mat.basic(0xffffff, { transparent: true, opacity: 0 }), fx, 0.7, fz); fHit.userData.interactable = fIt; scene.add(fHit); fIt.hit.push(fHit); fIt.group = fHit; interactables.push(fIt);
  // trash cans: by the snack shack, by the entrance, by the prize counter
  for (const [tx, tz] of [[13.5, -D / 2 + 6], [3.5, D / 2 - 3.5], [-6, -D / 2 + 7]]) {
    const can = new THREE.Group(); can.position.set(tx, 0, tz); can.add(cyl(0.32, 0.28, 0.9, mat.std(0x2e7d32), 16, 0, 0.45, 0)); can.add(cyl(0.34, 0.34, 0.08, mat.std(0x1b5e20), 16, 0, 0.92, 0)); can.add(cyl(0.16, 0.16, 0.04, mat.std(0x111), 12, 0, 0.97, 0)); const lbl = textPlane(["🗑️ TRASH"], 0.5, 0.18, { bg: "#fff", color: "#1b5e20", size: 60 }); lbl.position.set(0, 0.55, 0.33); can.add(lbl); scene.add(can); obstacles.push({ x: tx, z: tz, w: 0.8, d: 0.8 });
    const tIt = { id: "trash" + tx, kind: "trash", label: "🗑️ Throw away your trash", front: new THREE.Vector3(tx, 0, tz + 1.0), eye: new THREE.Vector3(tx, 1.5, tz + 1.1), look: new THREE.Vector3(tx, 0.7, tz), hit: [can], group: can }; can.userData.interactable = tIt; interactables.push(tIt);
  }
  // wall art / posters
  const posters = ["🎮", "🕹️", "👾", "🏁", "🎟️", "🎯", "🦖", "🚀"];
  posters.forEach((p, i) => { const pl = emojiPlane(p, 2.2); const left = i % 2 === 0; pl.position.set(left ? -W / 2 + 0.06 : W / 2 - 0.06, 3.6, -12 + Math.floor(i / 2) * 7); pl.rotation.y = left ? Math.PI / 2 : -Math.PI / 2; scene.add(pl); });
  // entrance mat + sign behind the player start
  const entrySign = textPlane(["🕹️ EMMY'S ARCADE 🎟️", "welcome!"], 10, 2.2, { bg: null, color: "#ff3dd6", size: 150, glow: "#ff3dd6" }); entrySign.position.set(0, 4.6, D / 2 - 0.1); entrySign.rotation.y = Math.PI; scene.add(entrySign);
  const doorL = box(0.3, 4, 0.3, mat.std(0x3a2414), -2.4, 2, D / 2 - 0.3), doorR = doorL.clone(); doorR.position.x = 2.4; scene.add(doorL, doorR); scene.add(box(5.1, 0.3, 0.3, mat.std(0x3a2414), 0, 4, D / 2 - 0.3));
  // ambient life: a few floating balloons drifting under the roof
  const balloons = []; for (let i = 0; i < 8; i++) { const b = sphere(0.35, mat.gloss(pick(holdCols)), rnd(-18, 18), rnd(5.5, 6.8), rnd(-12, 12)); b.userData.o = rnd(0, 6); b.userData.dyn = true; scene.add(b); balloons.push(b); const str = cyl(0.008, 0.008, 1.2, mat.std(0xdddddd), 4, 0, -0.9, 0); b.add(str); }
  animated.push((dt, t) => { for (const b of balloons) b.position.y += Math.sin(t * 0.7 + b.userData.o) * 0.002; });
}

// ==========================================================================
//  Card kiosk & prize counter (walk-up spots)
// ==========================================================================
function buildKiosk(scene, obstacles, interactables, animated) {
  const g = new THREE.Group(); const x = -6, z = 10.5; g.position.set(x, 0, z);
  g.add(box(1.4, 1.3, 0.9, mat.gloss(0x2a1a5e), 0, 0.65, 0)); g.add(box(1.5, 0.08, 1, mat.metal(), 0, 1.32, 0));
  const scr = textPlane(["💳 ARCADE CARD", "tap to load credits"], 1.3, 0.8, { bg: "#00e5ff", color: "#1a1040", size: 80 }); scr.position.set(0, 1.9, 0.1); scr.rotation.x = -0.35; g.add(scr);
  g.add(box(1.4, 0.9, 0.12, mat.std(0x111), 0, 1.9, -0.02)); // screen backing
  const card = box(0.9, 0.55, 0.04, mat.neon(0xff3dd6, 0.8), 0, 2.85, 0); g.add(card);
  const pole = cyl(0.06, 0.06, 1.6, mat.metal(), 10, 0, 2.15, -0.35); g.add(pole);
  const sign = textPlane(["GET YOUR CARD HERE"], 2.6, 0.5, { bg: "#ff3dd6", color: "#fff", size: 70 }); sign.position.set(0, 3.4, 0); g.add(sign);
  for (const s of [-1, 1]) g.add(box(0.06, 1.3, 0.9, mat.neon(0x00e5ff, 1.2), s * 0.72, 0.65, 0));
  scene.add(g); obstacles.push({ x, z, w: 1.7, d: 1.2 });
  const it = { id: "kiosk", kind: "kiosk", label: "💳 Load your arcade card", front: new THREE.Vector3(x, 0, z + 1.5), eye: new THREE.Vector3(x, 1.8, z + 1.6), look: new THREE.Vector3(x, 1.7, z), group: g, hit: [g] }; g.userData.interactable = it; interactables.push(it);
  animated.push((dt, t) => { card.rotation.y = t * 1.2; card.position.y = 2.85 + Math.sin(t * 2) * 0.05; });
}
function buildPrizeCounter(scene, obstacles, interactables, animated) {
  const g = new THREE.Group(); const x = 0, z = -ROOM_D / 2 + 3.2; g.position.set(x, 0, z);
  g.add(box(9, 1.1, 1.2, mat.wood(0x7a4a22), 0, 0.55, 1.2)); g.add(box(9.2, 0.1, 1.4, mat.std(0xffd54a), 0, 1.12, 1.2));
  // shelves with prizes
  g.add(box(9, 4.2, 0.4, mat.wood(0x5a3a22), 0, 2.1, -0.6));
  const prizeEmojis = ["🧸", "🦄", "🦎", "🏐", "🪀", "🍬", "🪄", "🃏", "✨", "📱", "🏆", "🫧", "🐙", "🐼", "🎁", "🐳", "🦖", "⭐"];
  for (let r = 0; r < 3; r++) { g.add(box(8.6, 0.08, 0.7, mat.std(0xc48b4c), 0, 1.5 + r * 1.05, -0.3)); for (let i = 0; i < 6; i++) { const sp = emojiSprite(prizeEmojis[(r * 6 + i) % prizeEmojis.length], 0.8); sp.position.set(-3.6 + i * 1.44, 1.95 + r * 1.05, -0.25); g.add(sp); } }
  const sign = textPlane(["🎟️ PRIZE COUNTER 🎟️"], 7, 1, { bg: "#7a3cff", color: "#fff", size: 100, glow: "#fff" }); sign.position.set(0, 4.8, -0.3); g.add(sign);
  for (const s of [-1, 1]) g.add(box(0.1, 4.6, 0.1, mat.neon(0xffd54a, 1), s * 4.55, 2.3, -0.3));
  const clerk = makeKid({ shirt: 0x7a3cff, pants: 0x222244, mood: "excited", hair: 0x222222, hairStyle: "curly", skin: 0x8d5a3c }); clerk.group.position.set(1.2, 0, 0.4); g.add(clerk.group);
  const tag = textPlane(["prizes!"], 1.2, 0.35, { bg: "#fff", color: "#7a3cff", size: 60 }); tag.position.set(1.2, 2.15, 0.6); g.add(tag);
  scene.add(g); obstacles.push({ x, z: z + 1.2, w: 9.4, d: 1.5 }); obstacles.push({ x, z: z - 0.6, w: 9.4, d: 1 });
  const it = { id: "prizes", kind: "prizes", label: "🏪 Trade tickets for prizes", front: new THREE.Vector3(x, 0, z + 2.6), eye: new THREE.Vector3(x, 1.7, z + 2.8), look: new THREE.Vector3(x, 1.8, z - 0.3), group: g, hit: [g] }; g.userData.interactable = it; interactables.push(it);
  animated.push((dt, t) => { clerk.group.position.y = Math.abs(Math.sin(t * 3)) * 0.04; clerk.parts.armR.rotation.z = -0.6 + Math.sin(t * 4) * 0.5; });
}

// ==========================================================================
//  Cabinets — one procedural machine per game, lit up with neon.
// ==========================================================================
const SPOTS = [ // x, z, facing (radians; 0 = faces +z i.e. toward entrance)
  { x: -13, z: 3, ry: Math.PI / 2 }, { x: -13, z: -2, ry: Math.PI / 2 }, { x: -13, z: -7, ry: Math.PI / 2 },
  { x: 13, z: 3, ry: -Math.PI / 2 }, { x: 13, z: -2, ry: -Math.PI / 2 }, { x: 13, z: -7, ry: -Math.PI / 2 },
  { x: -5, z: -9, ry: 0 }, { x: 5, z: -9, ry: 0 },
  { x: -5, z: 3, ry: Math.PI }, { x: 5, z: 3, ry: Math.PI },
  { x: -18, z: 8, ry: Math.PI / 2 }, { x: 18, z: 8, ry: -Math.PI / 2 }, { x: -9, z: -13, ry: 0 }, { x: 9, z: -13, ry: 0 },
  { x: -18, z: -2, ry: Math.PI / 2 }, { x: 18, z: -2, ry: -Math.PI / 2 }, { x: -9, z: 8, ry: Math.PI }, { x: 9, z: 8, ry: Math.PI }, { x: 0, z: -3, ry: Math.PI }, { x: 0, z: 8, ry: 0 },
];
function layoutCabinets(scene, games, obstacles, interactables, animated) {
  let si = 0;
  games.forEach((def) => {
    if (def.cabinet === "none") return; // jobs are started from the shack / counter
    if (def.cabinet === "wall") { const w = scene.userData.climbWall; const sp = w.userData.wallSpot; const it = { id: def.id, kind: "game", def, label: `${def.emoji} Climb the Rock Wall (FREE!)`, front: new THREE.Vector3(sp.x, 0, sp.z + 1.4), eye: new THREE.Vector3(sp.x, 1.6, sp.z + 1.6), look: new THREE.Vector3(sp.x, 4, sp.z - 1), group: w, hit: [w] }; w.userData.interactable = it; interactables.push(it); return; }
    const spot = SPOTS[si++ % SPOTS.length];
    const { group, w, d, screen, neon, viewDist = 0.9, lookY } = buildCabinet(def);
    group.position.set(spot.x, 0, spot.z); group.rotation.y = spot.ry; scene.add(group);
    // footprint (axis-aligned; swap w/d when rotated 90°)
    const rot90 = Math.abs(Math.sin(spot.ry)) > 0.5; obstacles.push({ x: spot.x, z: spot.z, w: rot90 ? d : w, d: rot90 ? w : d });
    const fwd = new THREE.Vector3(Math.sin(spot.ry), 0, Math.cos(spot.ry));
    const front = new THREE.Vector3(spot.x, 0, spot.z).addScaledVector(fwd, d / 2 + 1.1);
    const eye = new THREE.Vector3(spot.x, EYE + (viewDist > 1.5 ? 0.3 : 0), spot.z).addScaledVector(fwd, d / 2 + viewDist);
    const look = new THREE.Vector3(spot.x, lookY ?? (screen ? screen.getWorldPosition(new THREE.Vector3()).y : 1.4), spot.z);
    const it = { id: def.id, kind: "game", def, label: def.cost ? `${def.emoji} Play ${def.name} (🪙 ${def.cost})` : `${def.emoji} Play ${def.name} (FREE!)`, front, eye, look, group, hit: [group] };
    group.userData.interactable = it; interactables.push(it);
    const ph = rnd(0, 6);
    const neonMats = [...new Set(neon.map((n) => n.material))]; animated.push((dt, t) => { for (const m of neonMats) m.emissiveIntensity = 1.2 + Math.sin(t * 3 + ph) * 0.5; });
  });
}
function buildCabinet(def) {
  const g = new THREE.Group(); const c = new THREE.Color(def.color || 0xff3dd6);
  const dark = mat.gloss(0x14102a), body = mat.gloss(c.clone().multiplyScalar(0.55)); const neonShared = mat.neon(c.getHex(), 1.4); const neonM = () => neonShared; g.userData.noMerge = false;
  const neon = []; let screen = null, w = 1.6, d = 1.2, viewDist = 0.9, lookY = null;
  const attract = (lines, sw, sh) => { const s = textPlane(lines, sw, sh, { bg: "#0b0620", color: "#fff", size: 110, glow: `#${c.getHexString()}` }); s.material.toneMapped = false; return s; };
  const marquee = (y, sw = 1.6) => { const m = textPlane([def.name.toUpperCase()], sw, 0.42, { bg: `#${c.getHexString()}`, color: "#fff", size: 78 }); m.position.set(0, y, d / 2 - 0.02); g.add(m); };
  const strip = (x, y, z, h, horizontal = false) => { const s = horizontal ? box(h, 0.06, 0.06, neonM(), x, y, z) : box(0.06, h, 0.06, neonM(), x, y, z); neon.push(s); g.add(s); return s; };
  switch (def.cabinet) {
    case "racer": { // sit-down motorbike racer like the photo
      w = 2.0; d = 2.6;
      g.add(box(1.6, 0.25, 2.4, dark, 0, 0.13, 0));
      g.add(box(1.5, 1.8, 0.6, body, 0, 1.25, -0.9)); screen = attract([def.emoji, def.name], 1.3, 0.95); screen.position.set(0, 1.5, -0.58); g.add(screen);
      marquee(2.35, 1.5); g.add(box(1.5, 0.45, 0.6, dark, 0, 2.35, -0.9));
      // bike
      const bike = new THREE.Group(); bike.position.set(0, 0.25, 0.4);
      bike.add(box(0.5, 0.5, 1.5, mat.gloss(c.getHex()), 0, 0.55, 0)); bike.add(box(0.5, 0.25, 0.7, mat.gloss(0x222), 0, 0.85, 0.25));
      for (const z of [-0.65, 0.65]) { const wh = torus(0.28, 0.1, mat.std(0x111), 0, 0.3, z); wh.rotation.y = Math.PI / 2; bike.add(wh); const rim = torus(0.29, 0.03, neonM(), 0, 0.3, z); rim.rotation.y = Math.PI / 2; neon.push(rim); bike.add(rim); }
      const bars = cyl(0.03, 0.03, 0.7, mat.metal(), 8, 0, 1.0, -0.6); bars.rotation.z = Math.PI / 2; bike.add(bars); g.add(bike);
      strip(-0.78, 1.2, -0.62, 1.9); strip(0.78, 1.2, -0.62, 1.9); break; }
    case "claw": { // a proper claw crane: lit base, glass box on chrome posts, gantry, plush pile, joystick panel
      w = 1.9; d = 1.7;
      g.add(box(1.8, 1.0, 1.6, mat.gloss(0x1b1340), 0, 0.5, 0)); const basePanel = textPlane(["🦾 CLAW"], 1.6, 0.34, { bg: `#${c.getHexString()}`, color: "#1a1040", size: 80 }); basePanel.position.set(0, 0.6, 0.81); g.add(basePanel);
      g.add(box(1.6, 0.04, 1.4, mat.std(0xe91e63), 0, 1.0, 0)); for (let i = 0; i < 10; i++) g.add(sphere(0.03, mat.gloss(pick([0xff9ec7, 0xffd54a, 0x00e5ff])), rnd(-0.7, 0.7), 1.03, rnd(-0.6, 0.6), 6));
      for (const [x, z, bw, bd] of [[0, -0.7, 1.6, 0.02], [-0.8, 0, 0.02, 1.4], [0.8, 0, 0.02, 1.4], [0, 0.7, 1.6, 0.02]]) g.add(box(bw, 1.4, bd, mat.glass(0xaee8ff, 0.14), x, 1.72, z));
      for (const [x, z] of [[-0.8, -0.7], [0.8, -0.7], [-0.8, 0.7], [0.8, 0.7]]) { g.add(box(0.08, 1.4, 0.08, mat.metal(0xdfe6ee), x, 1.72, z)); strip(x, 1.72, z, 1.4); }
      g.add(box(1.8, 0.35, 1.6, mat.gloss(0x1b1340), 0, 2.6, 0)); marquee(2.6, 1.7); for (let i = 0; i < 6; i++) g.add(sphere(0.03, mat.neon(i % 2 ? 0xffd54a : 0xffffff, 1.5), -0.65 + i * 0.26, 2.4, 0.7, 6));
      const pile = [...PLUSH_KINDS].sort(() => Math.random() - 0.5).slice(0, 6); pile.forEach((k, i) => { const pl = makePlush(k, 0.55); pl.position.set(-0.5 + (i % 3) * 0.5, 1.02, -0.35 + Math.floor(i / 3) * 0.6); pl.rotation.y = rnd(0, 6); g.add(pl); });
      g.add(box(1.6, 0.05, 0.05, mat.metal(), 0, 2.35, 0.1)); const carriage = box(0.16, 0.1, 0.16, mat.metal(0x8899aa), 0.2, 2.3, 0.1); g.add(carriage);
      const claw = new THREE.Group(); claw.position.set(0.2, 1.9, 0.1); claw.add(cyl(0.012, 0.012, 0.4, mat.std(0xdddddd), 6, 0, 0.2, 0)); claw.add(sphere(0.06, mat.metal(0xdfe6ee))); for (const a of [0, 2.1, 4.2]) { const f = box(0.03, 0.26, 0.03, mat.metal(), Math.cos(a) * 0.1, -0.13, Math.sin(a) * 0.1); f.rotation.z = Math.cos(a) * 0.45; f.rotation.x = -Math.sin(a) * 0.45; claw.add(f); } g.add(claw); g.userData.claw = claw;
      g.add(box(1.0, 0.1, 0.4, mat.gloss(0x2a1a5e), 0.2, 1.05, 0.95)); g.add(cyl(0.025, 0.025, 0.22, mat.metal(), 8, -0.1, 1.2, 0.95)); g.add(sphere(0.06, mat.gloss(0xf4433f), -0.1, 1.33, 0.95)); g.add(cyl(0.07, 0.07, 0.04, mat.neon(0x00c853, 0.8), 16, 0.4, 1.12, 0.95));
      g.add(box(0.5, 0.35, 0.06, mat.std(0x111), -0.55, 0.45, 0.81)); // prize door
      screen = null; break; }
    case "pod": { // VR pod
      w = 2.2; d = 2.2;
      g.add(cyl(1.0, 1.1, 0.3, dark, 24, 0, 0.15, 0));
      const dome = new THREE.Mesh(new THREE.SphereGeometry(1.0, 24, 16, 0, Math.PI * 2, 0, Math.PI / 2), mat.glass(c.getHex(), 0.28)); dome.position.y = 0.3; g.add(dome);
      const ring = torus(1.0, 0.05, neonM(), 0, 0.32, 0); ring.rotation.x = Math.PI / 2; neon.push(ring); g.add(ring);
      g.add(box(0.7, 0.5, 0.7, mat.gloss(0x222), 0, 0.55, -0.1)); const hs = emojiSprite("🥽", 0.9); hs.position.set(0, 1.25, 0); g.add(hs);
      const post = cyl(0.08, 0.08, 2.4, mat.metal(), 10, 0, 1.2, -1.0); g.add(post);
      screen = attract([def.emoji, def.name], 1.4, 0.9); screen.position.set(0, 2.05, -0.96); g.add(screen); marquee(2.75, 1.5); viewDist = 1.6; lookY = 1.6; break; }
    case "arena": { // laser tag entrance
      w = 3.2; d = 1.6;
      for (const s of [-1, 1]) { g.add(box(0.5, 3.2, 0.5, dark, s * 1.35, 1.6, 0)); strip(s * 1.35, 1.6, 0.27, 3.0); }
      g.add(box(3.2, 0.6, 0.6, dark, 0, 3.5, 0)); marquee(3.5, 3.0);
      screen = attract([def.emoji, "ENTER →"], 2.0, 1.2); screen.position.set(0, 1.6, -0.6); g.add(screen);
      const curtain = box(2.2, 3.0, 0.05, mat.std(0x120820), 0, 1.5, -0.75); g.add(curtain);
      for (let i = 0; i < 6; i++) { const l = box(0.02, 3.0, 0.02, mat.neon(i % 2 ? 0x00e5ff : 0xff3dd6, 2), -1 + i * 0.4, 1.5, -0.7); g.add(l); neon.push(l); }
      break; }
    case "table": { // air hockey
      w = 1.6; d = 2.8;
      g.add(box(1.5, 0.7, 2.7, body, 0, 0.35, 0)); g.add(box(1.5, 0.12, 2.7, mat.gloss(0xeaf6ff), 0, 0.76, 0));
      for (const s of [-1, 1]) { g.add(box(1.5, 0.15, 0.08, dark, 0, 0.88, s * 1.32)); g.add(box(0.08, 0.15, 2.7, dark, s * 0.72, 0.88, 0)); }
      const p1 = cyl(0.12, 0.12, 0.06, mat.gloss(0xf4433f), 16, 0, 0.85, 1.0), p2 = cyl(0.12, 0.12, 0.06, mat.gloss(0x3d8bfd), 16, 0, 0.85, -1.0), puck = cyl(0.08, 0.08, 0.03, mat.gloss(0x111), 16, 0.2, 0.84, 0); g.add(p1, p2, puck);
      strip(0, 0.5, 1.36, 1.4, true); strip(0, 0.5, -1.36, 1.4, true);
      const sign = textPlane(["🏒 AIR HOCKEY"], 1.5, 0.4, { bg: `#${c.getHexString()}`, color: "#fff", size: 78 }); sign.position.set(0, 2.2, 0); g.add(sign); g.add(cyl(0.04, 0.04, 1.4, mat.metal(), 8, 0, 1.5, -0.1)); break; }
    case "booth": { // fishing pond
      w = 2.6; d = 2.4;
      g.add(cyl(1.2, 1.3, 0.6, mat.wood(0x8d5a2b), 24, 0, 0.3, 0)); const water = cyl(1.1, 1.1, 0.05, mat.gloss(0x26c6da, { transparent: true, opacity: 0.85 }), 24, 0, 0.6, 0); g.add(water);
      for (let i = 0; i < 4; i++) { const f = emojiSprite(pick(["🐟", "🐠"]), 0.35); f.position.set(Math.cos(i * 1.6) * 0.6, 0.66, Math.sin(i * 1.6) * 0.6); g.add(f); }
      const rod = cyl(0.02, 0.03, 1.6, mat.std(0x5a3a1a), 6, 0.9, 1.2, 0.9); rod.rotation.z = -0.5; g.add(rod);
      const post = cyl(0.06, 0.06, 2.6, mat.wood(0x8d5a2b), 8, -0.9, 1.3, -0.9); g.add(post); const sign = textPlane(["🎣 GONE FISHIN'"], 1.8, 0.5, { bg: `#${c.getHexString()}`, color: "#fff", size: 78 }); sign.position.set(-0.9, 2.5, -0.85); g.add(sign);
      screen = null; break; }
    case "lane": { // skee-ball
      w = 1.2; d = 3.6;
      g.add(box(1.1, 0.8, 3.4, body, 0, 0.4, 0)); const lane = box(1.0, 0.05, 2.2, mat.wood(0xc68642), 0, 0.82, 0.5); g.add(lane);
      const board = box(1.1, 1.8, 0.2, dark, 0, 1.6, -1.6); g.add(board);
      const cols = [0xff9800, 0x00c853, 0x3d8bfd, 0x7a3cff, 0xff3dd6, 0xffd54a]; cols.forEach((col, i) => { const r = torus(0.75 - i * 0.12, 0.03, mat.neon(col, 1), 0, 1.6, -1.48); neon.push(r); g.add(r); });
      const ramp = box(1.0, 0.05, 0.8, mat.wood(0xc68642), 0, 1.0, -0.9); ramp.rotation.x = -0.45; g.add(ramp);
      g.add(sphere(0.1, mat.gloss(0xeeeeee), 0.3, 0.92, 1.3)); marquee(2.75, 1.1); g.add(box(1.1, 0.5, 0.2, dark, 0, 2.75, -1.6)); break; }
    case "moles": {
      w = 1.6; d = 1.6;
      g.add(box(1.5, 0.9, 1.5, body, 0, 0.45, 0)); g.add(box(1.5, 0.08, 1.5, mat.std(0x7cb342), 0, 0.92, 0));
      for (let r = 0; r < 3; r++) for (let k = 0; k < 3; k++) { g.add(cyl(0.16, 0.16, 0.04, mat.std(0x3e2723), 14, -0.45 + k * 0.45, 0.97, -0.45 + r * 0.45)); }
      const m = emojiSprite("🐹", 0.45); m.position.set(0, 1.2, 0); g.add(m);
      const sign = textPlane(["🐹 WHACK-A-MOLE"], 1.6, 0.45, { bg: `#${c.getHexString()}`, color: "#fff", size: 78 }); sign.position.set(0, 2.0, -0.6); g.add(sign); g.add(cyl(0.04, 0.04, 1.1, mat.metal(), 8, 0, 1.4, -0.6)); strip(0, 0.5, 0.78, 1.4, true); break; }
    case "hoops": {
      w = 1.6; d = 2.4;
      g.add(box(1.5, 0.4, 2.2, body, 0, 0.2, 0)); g.add(box(1.5, 2.4, 0.15, dark, 0, 1.6, -1.05));
      const bb = box(1.2, 0.8, 0.06, mat.gloss(0xeceff1), 0, 2.4, -0.95); g.add(bb); const hoop = torus(0.28, 0.03, mat.gloss(0xff7043), 0, 2.05, -0.65); hoop.rotation.x = Math.PI / 2; g.add(hoop);
      const net = cyl(0.28, 0.18, 0.35, mat.std(0xffffff, { transparent: true, opacity: 0.5, wireframe: true }), 10, 0, 1.87, -0.65); g.add(net);
      for (const s of [-1, 1]) strip(s * 0.74, 1.4, 0.9, 2.4);
      const cage = box(1.5, 2.4, 1.9, mat.std(0xffffff, { transparent: true, opacity: 0.12, wireframe: true }), 0, 1.6, 0); g.add(cage);
      g.add(sphere(0.14, mat.gloss(0xff7043), 0.2, 0.55, 0.7)); marquee(3.0, 1.5); g.add(box(1.5, 0.5, 0.2, dark, 0, 3.0, -1.05)); break; }
    case "pusher": { // coin pusher — glass box over a coin field with a moving bar
      w = 1.8; d = 1.6;
      g.add(box(1.7, 1.0, 1.5, body, 0, 0.5, 0)); g.add(box(1.5, 0.04, 1.3, mat.gloss(0x3949ab), 0, 1.02, 0));
      for (let i = 0; i < 24; i++) g.add(cyl(0.06, 0.06, 0.02, mat.gloss(0xffd54a, { metalness: 0.5, roughness: 0.3, emissive: 0xffb300, emissiveIntensity: 0.3 }), 12, rnd(-0.65, 0.65), 1.04, rnd(-0.5, 0.55)));
      g.add(box(1.5, 0.12, 0.35, mat.metal(0xb0bec5), 0, 1.09, -0.45)); for (const [x, z, bw, bd] of [[0, -0.65, 1.5, 0.02], [-0.75, 0, 0.02, 1.3], [0.75, 0, 0.02, 1.3]]) g.add(box(bw, 0.8, bd, mat.glass(0xaee8ff, 0.14), x, 1.42, z));
      g.add(box(1.7, 0.3, 1.5, dark, 0, 1.95, 0)); marquee(1.95, 1.6); strip(-0.75, 1.42, 0.65, 0.8); strip(0.75, 1.42, 0.65, 0.8);
      g.add(box(1.7, 0.1, 0.5, mat.gloss(0xffd54a), 0, 0.7, 0.9)); viewDist = 1.5; lookY = 1.3; break; }
    case "darts": { // balloon dart booth
      w = 3.0; d = 1.6;
      g.add(box(2.8, 1.0, 0.8, mat.wood(0x8d5a2b), 0, 0.5, 0.3)); g.add(box(2.8, 2.6, 0.2, mat.std(0xd84315), 0, 1.5, -0.6));
      for (let r = 0; r < 3; r++) for (let k = 0; k < 6; k++) { const b = sphere(0.12, mat.gloss(pick([0xef5350, 0x42a5f5, 0x66bb6a, 0xab47bc, 0xffd54a])), -1.1 + k * 0.44, 0.9 + r * 0.55, -0.48); b.scale.set(1, 1.15, 1); g.add(b); }
      for (const dx of [-1.35, 1.35]) g.add(box(0.12, 3.0, 0.12, mat.std(0x3a2414), dx, 1.5, -0.6)); marquee(3.0, 2.8); g.add(box(2.8, 0.5, 0.2, dark, 0, 3.0, -0.6));
      for (let i = 0; i < 3; i++) g.add(cyl(0.01, 0.01, 0.25, mat.metal(0xffd54a), 6, -0.4 + i * 0.4, 1.12, 0.35).rotateX(1.2)); strip(-1.35, 1.5, -0.5, 2.8); strip(1.35, 1.5, -0.5, 2.8); break; }
    case "bowl": { // mini bowling lane
      w = 1.4; d = 4.0;
      g.add(box(1.3, 0.6, 3.8, body, 0, 0.3, 0)); g.add(box(1.0, 0.04, 3.4, mat.wood(0xd9a066), 0, 0.62, 0.1)); for (const s of [-1, 1]) g.add(box(0.1, 0.15, 3.8, dark, s * 0.6, 0.68, 0));
      for (let r = 0; r < 4; r++) for (let k = 0; k <= r; k++) g.add(new THREE.Mesh(new THREE.CapsuleGeometry(0.035, 0.12, 4, 8), mat.gloss(0xffffff)).translateX((k - r / 2) * 0.16).translateY(0.75).translateZ(-1.5 - r * 0.14));
      g.add(sphere(0.09, mat.gloss(0x7a3cff), 0, 0.73, 1.4)); g.add(box(1.3, 1.2, 0.3, dark, 0, 1.3, -1.95)); marquee(1.9, 1.3); g.add(box(1.3, 0.4, 0.3, dark, 0, 1.9, -1.95)); strip(0, 0.5, 1.92, 1.2, true); break; }
    case "dance": { // dance floor pad with a screen tower
      w = 2.6; d = 2.6;
      for (let i = -1; i <= 1; i++) for (let j = -1; j <= 1; j++) g.add(box(0.78, 0.08, 0.78, mat.neon(pick([0x00e5ff, 0xff3dd6, 0x00e676, 0xffd54a]), 0.5), i * 0.82, 0.04, j * 0.82 + 0.3));
      g.add(box(1.6, 2.6, 0.5, dark, 0, 1.3, -1.1)); screen = attract([def.emoji, def.name], 1.4, 1.0); screen.position.set(0, 1.7, -0.84); g.add(screen); marquee(2.85, 1.6); g.add(box(1.6, 0.5, 0.5, dark, 0, 2.85, -1.1));
      for (const dx of [-0.85, 0.85]) { const sp = box(0.3, 0.5, 0.3, mat.std(0x111), dx, 0.35, -1.0); g.add(sp); } strip(-0.8, 1.3, -0.84, 2.6); strip(0.8, 1.3, -0.84, 2.6);
      neon.push(...g.children.filter((m) => m.material && m.material.emissive && m.position.y < 0.1)); break; }
    case "gallery": { // shooting gallery booth: counter + backdrop with ducks on rails
      w = 3.0; d = 1.8;
      g.add(box(2.8, 0.9, 0.7, mat.wood(0x8d5a2b), 0, 0.45, 0.5)); g.add(box(2.8, 2.6, 0.2, mat.wood(0x6d4c41), 0, 1.5, -0.7));
      for (let r = 0; r < 2; r++) { g.add(box(2.6, 0.05, 0.2, mat.std(0x3e2723), 0, 1.0 + r * 0.7, -0.5)); for (let k = 0; k < 4; k++) { const dk = new THREE.Group(); dk.add(sphere(0.1, mat.gloss(0xffeb3b))); dk.add(sphere(0.07, mat.gloss(0xffeb3b), 0.08, 0.12, 0)); dk.position.set(-1.0 + k * 0.66 + r * 0.3, 1.12 + r * 0.7, -0.5); g.add(dk); } }
      g.add(box(2.8, 0.15, 0.3, mat.gloss(0x26c6da), 0, 0.98, -0.5)); marquee(2.95, 2.8); g.add(box(2.8, 0.5, 0.2, dark, 0, 2.95, -0.7)); strip(-1.35, 1.5, -0.6, 2.6); strip(1.35, 1.5, -0.6, 2.6); break; }
    case "hammer": { // strongman tower
      w = 1.6; d = 1.8;
      g.add(box(0.36, 3.6, 0.24, mat.wood(0x8d5a2b), 0, 1.8, -0.4)); for (let i = 0; i < 8; i++) g.add(box(0.42, 0.05, 0.28, mat.neon(i >= 6 ? 0xf4433f : i >= 4 ? 0xffd54a : 0x00c853, 0.6), 0, 0.5 + i * 0.4, -0.4));
      const bl = new THREE.Mesh(new THREE.ConeGeometry(0.2, 0.28, 12), mat.metal(0xffd54a)); bl.position.set(0, 3.8, -0.4); g.add(bl);
      g.add(box(1.0, 0.15, 0.5, mat.metal(0x666), 0.4, 0.08, 0.5)); const hm = new THREE.Group(); hm.position.set(0.9, 0.1, 0.7); hm.add(cyl(0.03, 0.03, 1.1, mat.wood(0x8d5a2b), 8, 0, 0.55, 0)); hm.add(box(0.36, 0.22, 0.22, mat.metal(0x546e7a), 0, 1.15, 0)); hm.rotation.z = 0.5; g.add(hm);
      marquee(4.2, 1.6); g.add(box(1.6, 0.5, 0.2, dark, 0, 4.2, -0.4)); break; }
    case "rings": { // ring toss table with bottles
      w = 2.2; d = 2.0;
      g.add(box(2.0, 0.9, 1.8, mat.wood(0x8d5a2b), 0, 0.45, 0)); g.add(box(2.0, 0.04, 1.8, mat.std(0x26a69a), 0, 0.92, 0));
      for (let r = 0; r < 3; r++) for (let k = 0; k < 4; k++) { const col = pick([0x4caf50, 0x2196f3, 0x9c27b0, 0xff7043]); g.add(cyl(0.06, 0.07, 0.24, mat.gloss(col), 10, -0.6 + k * 0.4, 1.06, -0.4 + r * 0.4)); g.add(cyl(0.025, 0.05, 0.12, mat.gloss(col), 8, -0.6 + k * 0.4, 1.24, -0.4 + r * 0.4)); }
      g.add(torus(0.1, 0.02, mat.gloss(0xef5350), 0.5, 0.95, 0.7).rotateX(Math.PI / 2)); g.add(cyl(0.04, 0.04, 1.8, mat.metal(), 8, -0.9, 1.8, -0.8)); marquee(2.8, 1.8); break; }
    case "memory": { // memory table with glowing tiles
      w = 2.2; d = 1.8;
      g.add(box(2.0, 0.9, 1.6, body, 0, 0.45, 0)); g.add(box(2.0, 0.05, 1.6, mat.gloss(0x14102a), 0, 0.92, 0));
      for (let r = 0; r < 3; r++) for (let k = 0; k < 4; k++) g.add(box(0.36, 0.04, 0.3, mat.neon(0x7e57c2, 0.4), -0.66 + k * 0.44, 0.97, -0.45 + r * 0.42));
      g.add(cyl(0.04, 0.04, 1.6, mat.metal(), 8, 0, 1.7, -0.7)); marquee(2.6, 1.8); strip(0, 0.5, 0.82, 1.9, true); break; }
    case "goal": { // mini soccer goal on turf
      w = 3.2; d = 3.0;
      g.add(box(3.0, 0.06, 2.8, mat.std(0x4caf50, { roughness: 1 }), 0, 0.03, 0)); for (const x of [-1.1, 1.1]) g.add(cyl(0.04, 0.04, 1.4, mat.gloss(0xffffff), 8, x, 0.7, -1.1)); g.add(cyl(0.04, 0.04, 2.2, mat.gloss(0xffffff), 8, 0, 1.4, -1.1).rotateZ(Math.PI / 2));
      g.add(box(2.2, 1.4, 0.7, mat.std(0xffffff, { wireframe: true, transparent: true, opacity: 0.4 }), 0, 0.7, -1.45)); g.add(sphere(0.14, mat.gloss(0xffffff), 0.2, 0.17, 0.8));
      const kp = makeKid({ shirt: 0xff9800, hairStyle: "short", mood: "neutral" }); kp.group.scale.setScalar(0.7); kp.group.position.set(0, 0.06, -0.9); g.add(kp.group);
      g.add(cyl(0.04, 0.04, 2.4, mat.metal(), 8, -1.4, 1.2, 1.2)); marquee(2.5, 2.0); break; }
    case "wheel": {
      w = 2.4; d = 1.2;
      g.add(box(2.0, 0.8, 1.0, body, 0, 0.4, 0)); const wheel = new THREE.Group(); wheel.position.set(0, 2.1, 0.2);
      const segCols = ["#ff3dd6", "#3d8bfd", "#ffd54a", "#00c853", "#ff9800", "#7a3cff", "#ffffff", "#00e5ff", "#f4433f", "#3d8bfd", "#ffd54a", "#ff3dd6"];
      segCols.forEach((col, i) => { const seg = new THREE.Mesh(new THREE.CylinderGeometry(1.1, 1.1, 0.12, 12, 1, false, (i / 12) * Math.PI * 2, Math.PI / 6), mat.gloss(new THREE.Color(col).getHex())); seg.rotation.x = Math.PI / 2; wheel.add(seg); });
      wheel.add(torus(1.1, 0.06, mat.neon(0xffd54a, 1), 0, 0, 0)); g.add(wheel); g.userData.wheel = wheel;
      g.add(cyl(0.08, 0.08, 1.5, mat.metal(), 10, 0, 1.2, -0.2)); const ptr = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.35, 8), mat.gloss(0xf4433f)); ptr.position.set(0, 3.35, 0.2); ptr.rotation.x = Math.PI; g.add(ptr);
      marquee(3.7, 2.0); g.add(box(2.0, 0.5, 0.2, dark, 0, 3.7, -0.1)); strip(-1.0, 0.4, 0.51, 0.7); strip(1.0, 0.4, 0.51, 0.7); viewDist = 3.2; lookY = 2.1; break; }
    default: { // upright cabinet
      w = 1.4; d = 1.2;
      g.add(box(1.3, 2.2, 1.1, body, 0, 1.1, 0)); g.add(box(1.3, 0.5, 1.1, dark, 0, 2.45, 0)); marquee(2.45, 1.3);
      screen = attract([def.emoji, def.name], 1.1, 0.8); screen.position.set(0, 1.5, 0.56); screen.rotation.x = -0.15; g.add(screen);
      g.add(box(1.3, 0.3, 0.5, dark, 0, 0.95, 0.7)); g.add(cyl(0.05, 0.05, 0.25, mat.metal(), 8, -0.3, 1.2, 0.75)); g.add(sphere(0.08, mat.gloss(0xf4433f), -0.3, 1.33, 0.75)); g.add(cyl(0.07, 0.07, 0.03, mat.gloss(0x00c853), 12, 0.2, 1.12, 0.75));
      strip(-0.68, 1.1, 0.56, 2.2); strip(0.68, 1.1, 0.56, 2.2); }
  }
  g.add(blobShadow(Math.max(w, d) * 0.7, 0.35));
  return { group: g, w, d, screen, neon, viewDist, lookY };
}
