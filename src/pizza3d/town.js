// ==========================================================================
//  Emmy's Pizza Plus 3D — a teeny cute pizza plaza.
//
//  createTown(canvas, { ui, avatar, name, onPrompt, onInteract, onPickup, onNear }) → town
//    town.start() / pause(v) / sleep(v)  — sleep stops drawing while a clicker game covers the screen
//    town.setOverride({ scene, camera, update, onDown, onMove, onUp }) — the box-opening table
//    town.goTo(shopId)   — quick-travel: pop right in front of a shop
//    town.say(who, text) — a speech bubble over a shopkeeper (shop id) or a townsperson
//    town.setAvatar(look) / town.setName(name) / town.teleport(x, z)
//
//  Everything stands in one small circle so there's hardly any walking:
//  five shops round the edge, a cheese fountain in the middle.
// ==========================================================================
import { THREE, rnd, clamp, pick, approach, LOW_TIER, part, group, rbox, ball, capsule, pill, torus, sliceGeo, makeFace, updateBlinks, toon, COL, INK, makePizza, makeCoin, signBoard, blobShadow, canvasTex, addLights, rrect, emojiSprite, dyn, mergeStatic } from "./toon.js";
import { makeBuddy, makeKeeper, makeCritter, makeBox, makeHat, CHICKEN_LOOKS } from "./models.js";

const R_FRONT = 8.6, R_KEEP = 11.2, R_SHOP = 14.2, R_WALK = 10.4;
export const SHOPS = [
  { id: "boxes", name: "Box-O-Rama", ico: "📦", angle: 0, keeper: "slice", who: "Papa Pepperoni" },
  { id: "toppings", name: "Topping Tower", ico: "🧀", angle: 72, keeper: "mouse", who: "Mozzy" },
  { id: "soda", name: "Fizzy Pop Soda", ico: "🥤", angle: 144, keeper: "soda", who: "Fizz" },
  { id: "oven", name: "The Game Oven", ico: "🔥", angle: 216, keeper: "garlic", who: "Granny Garlic" },
  { id: "hats", name: "Hat Hut", ico: "👒", angle: 288, keeper: "meatball", who: "Sir Meatball" },
];
const polar = (deg, r) => { const a = (deg * Math.PI) / 180; return { x: Math.sin(a) * r, z: -Math.cos(a) * r, yaw: -a }; }; // yaw: facing the middle

export function createTown(canvas, { ui, avatar = {}, name = "", onPrompt, onInteract, onPickup, onNear }) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: "high-performance" });
  const basePR = LOW_TIER ? Math.min(1.5, window.devicePixelRatio || 1) : Math.min(2, window.devicePixelRatio || 1); let resScale = 1, emaDt = 1 / 60, adaptT = 0;
  renderer.setPixelRatio(basePR); renderer.outputColorSpace = THREE.SRGBColorSpace; renderer.toneMapping = THREE.NoToneMapping;
  const scene = new THREE.Scene(); scene.background = skyTexture(); scene.fog = new THREE.Fog(0xffe9f2, 40, 110);
  const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 200);
  addLights(scene);
  const animated = [], obstacles = [], interactables = [], keepers = {};
  buildGround(scene, animated);
  buildFountain(scene, animated, obstacles);
  for (const S of SHOPS) { const k = buildShop(scene, S, animated, obstacles, interactables); keepers[S.id] = k; }
  buildDecor(scene, animated);
  mergeStatic(scene); // everything that never moves → a handful of draw calls

  // ---- you --------------------------------------------------------------------
  let kid = makeBuddy(avatar); scene.add(kid.group);
  const player = { x: 0, z: 6.4, yaw: Math.PI, speed: 0 };
  let camYaw = 0, camPitch = 0.5, camDist = 10, autoTarget = null, autoInteract = null, stuckT = 0, stuckD = Infinity, speedBoost = 1;

  // ---- townsfolk ------------------------------------------------------------------
  // ...and LOTS of chickens. Hens strut about; each chick follows its mama. Some hens are chefs.
  const HENS = [["Nugget", 0, true], ["Pepper Hen", 1, false], ["Mozzarella", 2, false], ["Princess Cluck", 3, true], ["Blueberry", 4, false], ["Lady Lavender", 5, false], ["Minty", 6, true], ["Sunny Side", 7, false], ["Big Barbara", 1, true], ["Crumbs", 0, false]];
  const CHICKS = [["Peep", 0], ["Pip", 0], ["Tiny Tony", 3], ["Squeaky", 3], ["Bean", 6], ["Dot", 7], ["Mini Barb", 8], ["Pebble", 8]];
  const folkList = [["mushroom", "Mushy"], ["olive", "Olivia"], ["tomato", "Tomasz"], ["pigeon", "Gary the Pigeon"], ...HENS.map(([nm, l, hat]) => ["chicken", nm, { look: CHICKEN_LOOKS[l], hat }]), ...CHICKS.map(([nm, mom]) => ["chick", nm, {}, mom + 4])];
  const folks = folkList.map(([kind, nm, opt, mom], i) => { const c = makeCritter(kind, opt); const a = rnd(0, 6.28), r = rnd(4, 9); const f = { kind, name: nm, c, x: Math.cos(a) * r, z: Math.sin(a) * r, tx: 0, tz: 0, wait: rnd(0, 3), yaw: 0, greet: kind === "chicken" || kind === "chick" ? rnd(10, 60) : rnd(3, 9), talkT: 0, i, pace: { pigeon: 1.6, chicken: 1.5, chick: 2.2 }[kind] || 1.3, mom }; f.tx = f.x; f.tz = f.z; c.group.position.set(f.x, 0, f.z); scene.add(c.group); return f; });
  for (const f of folks) if (f.mom != null) { f.mom = folks[f.mom]; f.x = f.mom.x + rnd(-1, 1); f.z = f.mom.z + rnd(-1, 1); f.tx = f.x; f.tz = f.z; f.off = rnd(0, 6.28); }

  // ---- coins that pop up round the plaza ------------------------------------------
  const coins = []; for (let i = 0; i < 4; i++) { const g = makeCoin(1.1); scene.add(g); const c = { g, t: 0 }; placeCoin(c); coins.push(c); }
  function placeCoin(c) { for (let k = 0; k < 20; k++) { const a = rnd(0, 6.28), r = rnd(3.8, R_WALK - 0.8); c.x = Math.cos(a) * r; c.z = Math.sin(a) * r; if (Math.hypot(c.x - player.x, c.z - player.z) > 3) break; } c.g.position.set(c.x, 0.7, c.z); c.g.visible = true; }

  // ---- input: joystick on the left (touch), drag to look, tap to walk / tap a shop -----
  const keys = new Set(), move = { x: 0, y: 0 };
  let override = null, running = false, paused = false, sleeping = false;
  const pointers = new Map(); let joyPid = null, lookPid = null, joyOrigin = null;
  const isTouch = ("ontouchstart" in window) || navigator.maxTouchPoints > 0;
  const joy = document.createElement("div"); joy.className = "joy"; joy.innerHTML = `<div class="knob"></div>`; ui.appendChild(joy); const knob = joy.firstElementChild;
  const restJoy = () => { if (isTouch && !override && !paused) { joy.style.display = "block"; joy.style.left = "26px"; joy.style.top = ""; joy.style.bottom = "max(30px, env(safe-area-inset-bottom))"; joy.classList.add("rest"); knob.style.transform = ""; } else joy.style.display = "none"; };
  const setJoy = (visible, cx, cy, dx = 0, dy = 0) => { if (!visible) { restJoy(); return; } joy.classList.remove("rest"); joy.style.display = "block"; joy.style.bottom = ""; joy.style.left = `${cx - 60}px`; joy.style.top = `${cy - 60}px`; knob.style.transform = `translate(${dx}px, ${dy}px)`; };
  restJoy();
  const ndc = new THREE.Vector2(), ray = new THREE.Raycaster();
  const evt = (e) => { const r = canvas.getBoundingClientRect(); ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1); ray.setFromCamera(ndc, override ? override.camera : camera); return { x: ndc.x, y: ndc.y, sx: e.clientX - r.left, sy: e.clientY - r.top, ray, id: e.pointerId, W: r.width, H: r.height }; };
  canvas.addEventListener("pointerdown", (e) => {
    try { canvas.setPointerCapture(e.pointerId); } catch {} pointers.set(e.pointerId, { x: e.clientX, y: e.clientY, moved: 0 });
    if (override) { override.onDown && override.onDown(evt(e)); return; }
    if (paused) return;
    if (e.pointerType === "touch" && e.clientX < innerWidth * 0.4 && e.clientY > innerHeight * 0.45 && joyPid === null) { joyPid = e.pointerId; joyOrigin = { x: e.clientX, y: e.clientY }; setJoy(true, e.clientX, e.clientY); autoTarget = null; return; }
    if (lookPid === null) lookPid = e.pointerId;
  });
  canvas.addEventListener("pointermove", (e) => {
    const p = pointers.get(e.pointerId);
    if (override) { if (override.onMove) override.onMove(evt(e)); return; }
    if (!p) return; const mx = e.clientX - p.x, my = e.clientY - p.y; p.moved += Math.hypot(mx, my); p.x = e.clientX; p.y = e.clientY;
    if (e.pointerId === joyPid) { let dx = e.clientX - joyOrigin.x, dy = e.clientY - joyOrigin.y; const l = Math.hypot(dx, dy), m = 48; if (l > m) { dx *= m / l; dy *= m / l; } move.x = dx / m; move.y = dy / m; setJoy(true, joyOrigin.x, joyOrigin.y, dx, dy); }
    if (e.pointerId === lookPid && p.moved > 6) { camYaw -= mx * 0.006; camPitch = clamp(camPitch - my * 0.003, 0.22, 1.05); }
  });
  const up = (e) => {
    const p = pointers.get(e.pointerId); pointers.delete(e.pointerId);
    if (override) { override.onUp && override.onUp(evt(e)); return; }
    if (e.pointerId === joyPid) { joyPid = null; move.x = move.y = 0; setJoy(false); }
    if (e.pointerId === lookPid) { lookPid = null; if (p && p.moved < 8 && !paused) tapToWalk(evt(e)); }
  };
  canvas.addEventListener("pointerup", up); canvas.addEventListener("pointercancel", up);
  canvas.addEventListener("lostpointercapture", (e) => { if (pointers.has(e.pointerId)) up(e); });
  canvas.addEventListener("wheel", (e) => { if (!override) { camDist = clamp(camDist + e.deltaY * 0.01, 7, 16); e.preventDefault(); } }, { passive: false });
  window.addEventListener("keydown", (e) => {
    if (e.target && /INPUT|TEXTAREA/.test(e.target.tagName)) return;
    if (["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", " "].includes(e.key)) e.preventDefault(); if (e.repeat) return;
    keys.add(e.key.length === 1 ? e.key.toLowerCase() : e.key);
    if (override) { override.onKey && override.onKey(e.key, true); return; }
    if ((e.key === "e" || e.key === "E" || e.key === "Enter" || e.key === " ") && nearest && !paused) onInteract(nearest);
  });
  window.addEventListener("keyup", (e) => keys.delete(e.key.length === 1 ? e.key.toLowerCase() : e.key));
  const letGo = () => { keys.clear(); move.x = move.y = 0; joyPid = lookPid = null; pointers.clear(); restJoy(); };
  window.addEventListener("blur", letGo); document.addEventListener("visibilitychange", () => { if (document.hidden) letGo(); });
  const floorPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0), tmpV = new THREE.Vector3();
  function tapToWalk(p) {
    const fh = p.ray.intersectObjects(folks.map((f) => f.c.group), true)[0];
    if (fh) { const f = folks.find((f) => { let o = fh.object; while (o) { if (o === f.c.group) return true; o = o.parent; } return false; }); if (f) { f.greet = 0; f.hop = 0.5; onNear && onNear(f, true); return; } }
    const hit = p.ray.intersectObjects(interactables.map((i) => i.hit), false)[0];
    stuckT = 0; stuckD = Infinity;
    if (hit) { const it = hit.object.userData.interactable; if (it) { if (near(it) < 2.6) { onInteract(it); return; } autoTarget = it.front.clone(); autoInteract = it; return; } }
    if (p.ray.ray.intersectPlane(floorPlane, tmpV)) { autoTarget = tmpV.clone(); autoInteract = null; }
  }

  // ---- speech bubbles ------------------------------------------------------------
  const bubbles = [];
  function say(who, text, secs = 4.5) {
    let target = null, y = 2.3;
    if (typeof who === "string") { const k = keepers[who]; if (k) { target = k.group; y = 3.2; k.wave(2); } } else if (who && who.c) { target = who.c.group; y = { pigeon: 1.5, chicken: 1.7, chick: 1.0 }[who.kind] || 1.9; }
    if (!target) return; for (let i = bubbles.length - 1; i >= 0; i--) if (bubbles[i].target === target) { bubbles[i].sp.parent?.remove(bubbles[i].sp); bubbles.splice(i, 1); }
    const sp = bubbleSprite(text); sp.position.set(0, y, 0); target.add(sp); bubbles.push({ target, sp, t: secs });
  }
  function updateBubbles(dt) { for (let i = bubbles.length - 1; i >= 0; i--) { const b = bubbles[i]; b.t -= dt; b.sp.material.opacity = Math.min(1, b.t * 3); if (b.t <= 0) { b.sp.parent?.remove(b.sp); b.sp.material.map.dispose(); b.sp.material.dispose(); bubbles.splice(i, 1); } } }

  // ---- update ------------------------------------------------------------------------
  let nearest = null, last = performance.now(), t = 0;
  const camPos = new THREE.Vector3(), camLook = new THREE.Vector3();
  const near = (it) => Math.hypot(it.front.x - player.x, it.front.z - player.z);
  function updateFolks(dt) {
    for (const f of folks) {
      let sp = 0; const dP = Math.hypot(f.x - player.x, f.z - player.z);
      if (f.talkT > 0) { f.talkT -= dt; f.yaw = Math.atan2(player.x - f.x, player.z - f.z); }
      else { if (f.mom) { const a = f.off + t * 0.3; f.tx = f.mom.x + Math.cos(a) * 0.9 - Math.sin(f.mom.yaw) * 0.5; f.tz = f.mom.z + Math.sin(a) * 0.9 - Math.cos(f.mom.yaw) * 0.5; } const dx = f.tx - f.x, dz = f.tz - f.z, d = Math.hypot(dx, dz); if (d > 0.15) { sp = f.pace; f.x += (dx / d) * sp * dt; f.z += (dz / d) * sp * dt; f.yaw = Math.atan2(dx, dz); } else if ((f.wait -= dt) < 0) { f.wait = rnd(1, 4); const a = rnd(0, 6.28), r = rnd(3.6, R_WALK - 1); f.tx = Math.cos(a) * r; f.tz = Math.sin(a) * r; } }
      if (dP < 1.1 && f.talkT <= 0) { f.x += ((f.x - player.x) / (dP || 1)) * dt * 2; f.z += ((f.z - player.z) / (dP || 1)) * dt * 2; }
      if (f.hop > 0) f.hop -= dt;
      f.c.group.position.set(f.x, f.hop > 0 ? Math.sin((0.5 - f.hop) * Math.PI * 2) * 0.4 : 0, f.z); let dy = f.yaw - f.c.group.rotation.y; while (dy > Math.PI) dy -= Math.PI * 2; while (dy < -Math.PI) dy += Math.PI * 2; f.c.group.rotation.y += dy * Math.min(1, dt * 6);
      f.c.update(dt, t + f.i, sp / 1.5);
      f.greet -= dt; if (dP < 2.4 && f.greet <= 0 && !paused) { f.greet = f.kind === "chicken" || f.kind === "chick" ? rnd(40, 90) : rnd(25, 45); f.talkT = 3; onNear && onNear(f, false); }
    }
  }
  function update(dt) {
    t += dt; for (const f of animated) f(dt, t); updateBlinks(dt); updateBubbles(dt); updateFolks(dt);
    for (const k of Object.values(keepers)) k.update(dt, t);
    for (const c of coins) { if (c.t > 0) { c.t -= dt; if (c.t <= 0) placeCoin(c); continue; } c.g.rotation.y += dt * 2.6; c.g.position.y = 0.7 + Math.sin(t * 3 + c.x) * 0.1; if (Math.hypot(player.x - c.x, player.z - c.z) < 1.1) { c.t = rnd(40, 70); c.g.visible = false; onPickup && onPickup("coin", 1); } }
    let mx = move.x, mz = move.y;
    if (!paused) { if (keys.has("w") || keys.has("ArrowUp")) mz -= 1; if (keys.has("s") || keys.has("ArrowDown")) mz += 1; if (keys.has("a") || keys.has("ArrowLeft")) mx -= 1; if (keys.has("d") || keys.has("ArrowRight")) mx += 1; if (keys.has("q")) camYaw += 1.8 * dt; if (keys.has("e") && false) camYaw -= 1.8 * dt; }
    let l = Math.hypot(mx, mz); if (l > 1) { mx /= l; mz /= l; l = 1; } if (l > 0.05) { autoTarget = null; autoInteract = null; }
    const sy = Math.sin(camYaw), cy = Math.cos(camYaw); let vx = 0, vz = 0;
    if (paused) l = 0;
    if (l > 0.05) { vx = mx * cy + mz * sy; vz = -mx * sy + mz * cy; }
    else if (autoTarget && !paused) { const dx = autoTarget.x - player.x, dz = autoTarget.z - player.z, d = Math.hypot(dx, dz); if (d < 0.3) { autoTarget = null; if (autoInteract) { const it = autoInteract; autoInteract = null; if (near(it) < 2.6) onInteract(it); } } else { vx = dx / d; vz = dz / d; l = Math.min(1, d);
      // steer round the fountain and counters instead of bonking into them
      for (const o of obstacles) { const ox = o.x - player.x, oz = o.z - player.z, od = Math.hypot(ox, oz), R = o.r + 0.9; if (od < R + 1.6 && od > 0.01 && Math.hypot(autoTarget.x - o.x, autoTarget.z - o.z) > o.r + 0.3) { const dot = (ox * vx + oz * vz) / od; if (dot > 0.2) { const side = ox * vz - oz * vx >= 0 ? 1 : -1, w = Math.min(1.5, ((R + 1.6 - od) / 1.6) * dot * 2); vx += (-oz / od) * side * w; vz += (ox / od) * side * w; const n = Math.hypot(vx, vz); vx /= n; vz /= n; } } }
      if ((stuckT += dt) > 0.5) { if (d > stuckD - 0.3) { const it = autoInteract; autoTarget = null; autoInteract = null; if (it && near(it) < 2.6) onInteract(it); } stuckT = 0; stuckD = d; } } }
    const SP = 6.8 * speedBoost;
    player.speed = approach(player.speed, l > 0.05 || (autoTarget && !paused) ? SP * Math.max(0.35, l) : 0, 10, dt);
    if (player.speed > 0.01 && (vx || vz)) { player.x += vx * player.speed * dt; player.z += vz * player.speed * dt; player.yaw = Math.atan2(vx, vz); }
    const pr = Math.hypot(player.x, player.z); if (pr > R_WALK) { player.x *= R_WALK / pr; player.z *= R_WALK / pr; }
    for (const o of obstacles) { const dx = player.x - o.x, dz = player.z - o.z, d = Math.hypot(dx, dz), R = o.r + 0.4; if (d < R && d > 1e-4) { player.x = o.x + (dx / d) * R; player.z = o.z + (dz / d) * R; } }
    kid.group.position.set(player.x, 0, player.z);
    let dy = player.yaw - kid.group.rotation.y; while (dy > Math.PI) dy -= Math.PI * 2; while (dy < -Math.PI) dy += Math.PI * 2; kid.group.rotation.y += dy * Math.min(1, dt * 12);
    kid.walk(t, player.speed / 6.8, dt);
    placeCam(); camera.position.lerp(camPos, Math.min(1, dt * 7)); camera.lookAt(camLook);
    let best = null, bd = 2.6; for (const it of interactables) { const d = near(it); if (d < bd) { bd = d; best = it; } }
    if (best !== nearest) { nearest = best; onPrompt && onPrompt(best); }
  }
  // the camera floats behind you, looks a little ahead, and never leaves the plaza (so trees and shops can't get in the way)
  function placeCam() {
    let ox = Math.sin(camYaw) * Math.cos(camPitch) * camDist, oz = Math.cos(camYaw) * Math.cos(camPitch) * camDist, oy = 1 + Math.sin(camPitch) * camDist;
    for (let k = 0; k < 14 && Math.hypot(player.x + ox, player.z + oz) > 11.6; k++) { ox *= 0.86; oz *= 0.86; oy += 0.35; }
    camPos.set(player.x + ox, oy, player.z + oz); camLook.set(player.x - Math.sin(camYaw) * 2.2, 1.4, player.z - Math.cos(camYaw) * 2.2);
  }
  function snapCamera() { placeCam(); camera.position.copy(camPos); camera.lookAt(camLook); }

  // ---- loop -----------------------------------------------------------------------
  function resize() { const w = canvas.clientWidth || innerWidth, h = canvas.clientHeight || innerHeight; renderer.setSize(w, h, false); camera.aspect = w / h; camera.fov = w / h < 0.8 ? 66 : 55; camera.updateProjectionMatrix(); if (override?.camera) { override.camera.aspect = w / h; override.camera.updateProjectionMatrix(); } }
  window.addEventListener("resize", resize); resize();
  function adaptResolution(dt) { emaDt = emaDt * 0.9 + dt * 0.1; adaptT += dt; if (adaptT < 1.2) return; adaptT = 0; let next = resScale; if (emaDt > 1 / 40) next = Math.max(0.55, resScale * 0.85); else if (emaDt < 1 / 56) next = Math.min(1, resScale * 1.08); if (Math.abs(next - resScale) > 0.01) { resScale = next; renderer.setPixelRatio(basePR * resScale); resize(); } }
  function frame(now) {
    if (!running) return; requestAnimationFrame(frame);
    const dt = Math.min(0.05, (now - last) / 1000); last = now;
    if (sleeping) return;
    adaptResolution(dt);
    if (override) { try { updateBlinks(dt); override.update(dt); renderer.render(override.scene, override.camera); } catch (err) { console.error(err); } }
    else { update(dt); renderer.render(scene, camera); }
  }
  snapCamera();
  return {
    renderer, scene, camera, keys, folks, keepers, SHOPS,
    get interactables() { return interactables; },
    nearest() { let best = null, bd = 2.8; for (const it of interactables) { const d = near(it); if (d < bd) { bd = d; best = it; } } return best; },
    start() { if (!running) { running = true; last = performance.now(); requestAnimationFrame(frame); } },
    stop() { running = false; },
    pause(v) { paused = v; if (v) { move.x = move.y = 0; autoTarget = null; autoInteract = null; joyPid = null; } restJoy(); },
    sleep(v) { sleeping = v; },
    setOverride(o) { override = o; restJoy(); if (o) { onPrompt && onPrompt(null); nearest = null; const { W, H } = this.size(); o.camera.aspect = W / H; o.camera.updateProjectionMatrix(); } },
    get override() { return override; },
    say, setName() {}, setSpeedBoost(m) { speedBoost = m; },
    goTo(id) { const S = SHOPS.find((s) => s.id === id); if (!S) return; const p = polar(S.angle, R_FRONT - 0.4); player.x = p.x; player.z = p.z; player.yaw = p.yaw + Math.PI; kid.group.rotation.y = player.yaw; camYaw = player.yaw + Math.PI; camPitch = 0.42; autoTarget = null; autoInteract = null; snapCamera(); },
    setAvatar(a) { const ry = kid.group.rotation.y; scene.remove(kid.group); kid = makeBuddy(a); kid.group.position.set(player.x, 0, player.z); kid.group.rotation.y = ry; scene.add(kid.group); },
    teleport(x, z) { player.x = x; player.z = z; snapCamera(); },
    playerPos: () => ({ x: player.x, z: player.z }),
    size: () => ({ W: canvas.clientWidth || innerWidth, H: canvas.clientHeight || innerHeight }),
    stats: () => ({ calls: renderer.info.render.calls, triangles: renderer.info.render.triangles, fps: Math.round(1 / emaDt), resScale }),
  };
}

// ==========================================================================
//  Building the plaza
// ==========================================================================
function skyTexture() { return canvasTex(16, 256, (g, w, h) => { const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, "#8fd3ff"); gr.addColorStop(0.55, "#c9ecff"); gr.addColorStop(1, "#ffe3f0"); g.fillStyle = gr; g.fillRect(0, 0, w, h); }); }
function bubbleSprite(text) {
  const c = document.createElement("canvas"), g = c.getContext("2d"); const fs = 34; g.font = `800 ${fs}px system-ui, sans-serif`;
  const words = text.split(" "), lines = []; let cur = ""; for (const w of words) { const tt = cur ? cur + " " + w : w; if (g.measureText(tt).width > 420 && cur) { lines.push(cur); cur = w; } else cur = tt; } if (cur) lines.push(cur);
  const W = Math.min(480, Math.max(...lines.map((l) => g.measureText(l).width)) + 50), H = lines.length * fs * 1.25 + 46; c.width = W; c.height = H + 22;
  g.font = `800 ${fs}px system-ui, sans-serif`; g.fillStyle = "#4a2a1a"; rrect(g, 0, 0, W, H, 26); g.fill(); g.beginPath(); g.moveTo(W / 2 - 16, H - 2); g.lineTo(W / 2, H + 20); g.lineTo(W / 2 + 16, H - 2); g.fill();
  g.fillStyle = "#fffaf0"; rrect(g, 5, 5, W - 10, H - 10, 22); g.fill(); g.beginPath(); g.moveTo(W / 2 - 10, H - 6); g.lineTo(W / 2, H + 12); g.lineTo(W / 2 + 10, H - 6); g.fill();
  g.fillStyle = "#4a2a1a"; g.textAlign = "center"; g.textBaseline = "middle"; lines.forEach((l, i) => g.fillText(l, W / 2, 23 + fs * 0.62 + i * fs * 1.25));
  const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace;
  const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthTest: false })); const s = 0.0068; sp.scale.set(c.width * s, c.height * s, 1); sp.center.set(0.5, 0); sp.renderOrder = 10; return sp;
}
function buildGround(scene, animated) {
  // the plaza: a giant checkered picnic blanket, with a crust rim
  const checker = canvasTex(512, 512, (g, w) => { const n = 8, s = w / n; for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) { g.fillStyle = (i + j) % 2 ? "#fff3e2" : "#ff6f61"; g.fillRect(i * s, j * s, s, s); } g.fillStyle = "rgba(255,255,255,.12)"; for (let i = 0; i < n; i++) g.fillRect(i * s, 0, s * 0.12, w); }, 3.2);
  const plaza = new THREE.Mesh(new THREE.CircleGeometry(12.6, 64), toon(0xffffff, { map: checker })); plaza.rotation.x = -Math.PI / 2; plaza.position.y = 0.01; scene.add(plaza);
  const rim = part(torus(12.7, 0.32), COL.crust, { rx: Math.PI / 2, y: 0.05, sz: 0.35 }); scene.add(rim);
  const grass = new THREE.Mesh(new THREE.CircleGeometry(90, 48), toon(0x8fdc6a)); grass.rotation.x = -Math.PI / 2; scene.add(grass);
  // rolling hills far away and puffy clouds
  for (let i = 0; i < 16; i++) { const a = (i / 16) * Math.PI * 2 + rnd(-0.1, 0.1), r = rnd(40, 55); scene.add(part(ball(rnd(7, 13), 18, 10), pick([0x7fd35a, 0x95e06f, 0x6fca55]), { x: Math.cos(a) * r, z: Math.sin(a) * r, y: -2, sy: 0.6, ol: 1.5 })); }
  const clouds = dyn(new THREE.Group()); scene.add(clouds);
  for (let i = 0; i < 9; i++) { const c = new THREE.Group(); for (let k = 0; k < 4; k++) c.add(part(ball(rnd(1.4, 2.4), 14, 10), 0xffffff, { x: k * 1.7 - 2.5, y: rnd(-0.3, 0.5), z: rnd(-0.6, 0.6), ol: 1.4, olColor: 0xb8c8e8 })); const a = (i / 9) * Math.PI * 2; c.position.set(Math.cos(a) * rnd(32, 46), rnd(15, 22), Math.sin(a) * rnd(32, 46)); c.lookAt(0, c.position.y, 0); clouds.add(c); }
  animated.push((dt) => { clouds.rotation.y += dt * 0.01; });
  // pepperoni stepping stones round the fountain
  for (let i = 0; i < 12; i++) { const a = (i / 12) * Math.PI * 2; scene.add(part(pill(0.42, 0.42, 0.08, 0.03), COL.pepperoni, { x: Math.cos(a) * 5.4, z: Math.sin(a) * 5.4, y: 0.04, ol: 0.8 })); }
}
function buildFountain(scene, animated, obstacles) {
  const g = new THREE.Group(); g.scale.setScalar(0.78); scene.add(g); obstacles.push({ x: 0, z: 0, r: 2.3 });
  g.add(part(pill(2.9, 3.1, 0.9, 0.3), COL.crust, { y: 0.45 }));
  g.add(part(pill(2.5, 2.5, 0.2, 0.08), COL.cheese, { y: 0.82, ol: 0 })); // a pool of melty cheese
  g.add(part(pill(0.5, 0.7, 2.2, 0.2), COL.crustDeep, { y: 1.8 }));
  const top = dyn(new THREE.Group()); top.position.y = 3.15; g.add(top);
  const pz = makePizza(1.9); pz.rotation.x = 0.25; top.add(pz);
  const face = makeFace(1.1, "joy"); face.position.set(0, 0.6, 1.95); face.rotation.x = -0.1; top.add(face);
  // cheese drips that stretch and boing
  const drips = []; for (let i = 0; i < 8; i++) { const a = (i / 8) * Math.PI * 2; const d = dyn(part(capsule(0.12, 1), COL.cheese, { x: Math.cos(a) * 1.75, z: Math.sin(a) * 1.75, y: 2.6, ol: 0.8 })); g.add(d); drips.push(d); }
  const blobs = []; for (let i = 0; i < 6; i++) { const b = dyn(part(ball(0.18, 10, 8), COL.cheese, { ol: 0.6 })); g.add(b); blobs.push({ b, a: rnd(0, 6.28), t: rnd(0, 1) }); }
  animated.push((dt, t) => { top.rotation.y += dt * 0.45; pz.position.y = Math.sin(t * 1.6) * 0.1; drips.forEach((d, i) => { const s = 0.7 + Math.sin(t * 2 + i) * 0.35; d.scale.y = s; d.position.y = 2.75 - s * 0.6; });
    for (const o of blobs) { o.t += dt * 0.7; if (o.t > 1) { o.t = 0; o.a = rnd(0, 6.28); } const r = 0.6 + o.t * 1.6; o.b.position.set(Math.cos(o.a) * r, 3.2 + Math.sin(o.t * Math.PI) * 1.6 - o.t * 2.2, Math.sin(o.a) * r); } });
  const sign = signBoard(["🧀 The Cheese Fountain 🧀"], 3.6, 0.7, { size: 60 }); sign.position.set(0, 1.2, 3.12); g.add(sign);
}
function buildDecor(scene, animated) {
  // basil trees and tomato bushes between the shops, mushroom lamps and breadstick benches on the plaza
  SHOPS.forEach((S, i) => {
    const mid = S.angle + 36, p = polar(mid, 12.6);
    const tree = new THREE.Group(); tree.position.set(p.x, 0, p.z); scene.add(tree);
    tree.add(part(capsule(0.28, 2.2), 0x8a5a33, { y: 1.3 })); for (const [x, y, z, r] of [[0, 3.2, 0, 1.3], [0.9, 2.7, 0.2, 0.9], [-0.9, 2.8, -0.1, 0.95], [0.1, 4.0, 0.1, 0.8]]) tree.add(part(ball(r, 16, 12), COL.basil, { x, y, z, sy: 0.85 }));
    tree.add(blobShadow(1.4, 0.25));
    const q = polar(mid + 9, 11.3), b = new THREE.Group(); b.position.set(q.x, 0, q.z); scene.add(b);
    for (const [x, z, r] of [[0, 0, 0.7], [0.7, 0.3, 0.5], [-0.6, 0.3, 0.55]]) b.add(part(ball(r, 14, 10), 0x58c063, { x, y: r * 0.8, z })); for (const [x, y, z] of [[0.2, 1.1, 0.4], [-0.4, 0.8, 0.6], [0.7, 0.7, 0.6]]) b.add(part(ball(0.17, 10, 8), COL.tomato, { x, y, z, ol: 0.6 }));
    const l = polar(mid - 12, 10.9), lamp = new THREE.Group(); lamp.position.set(l.x, 0, l.z); scene.add(lamp);
    lamp.add(part(capsule(0.1, 2.4), 0xfff4dc, { y: 1.3 })); lamp.add(part(ball(0.62, 18, 10), i % 2 ? COL.tomato : COL.pink, { y: 2.8, sy: 0.55 })); const bulb = part(ball(0.25, 12, 10), 0xfff3a0, { y: 2.55, emissive: 0x806020, ol: 0 }); lamp.add(bulb);
  });
  for (let i = 0; i < 5; i++) { const p = polar(i * 72 + 36, 7.4), b = new THREE.Group(); b.position.set(p.x, 0, p.z); b.rotation.y = p.yaw; scene.add(b); for (const y of [0.45, 0.62]) b.add(part(capsule(0.1, 1.5), COL.crust, { rz: Math.PI / 2, y, z: y === 0.62 ? -0.28 : 0 })); b.add(part(capsule(0.1, 1.4), COL.crust, { rz: Math.PI / 2, y: 0.95, z: -0.4 })); for (const x of [-0.7, 0.7]) b.add(part(capsule(0.07, 0.35), COL.crustDeep, { x, y: 0.22 })); b.add(blobShadow(1.0, 0.18)); }
  // a giant fork stuck in the grass, because why not
  const fork = new THREE.Group(); fork.position.set(-9, 0, 9.8); fork.rotation.set(0.15, 0.6, 0.1); scene.add(fork);
  fork.add(part(capsule(0.16, 3), 0xd8dde8, { y: 3.2 })); fork.add(part(rbox(1.0, 0.5, 0.2, 0.08), 0xd8dde8, { y: 1.6 })); for (const x of [-0.38, -0.13, 0.13, 0.38]) fork.add(part(capsule(0.07, 1.1), 0xd8dde8, { x, y: 0.75 }));
  fork.add(part(ball(0.35, 12, 10), COL.basil, { y: 1.1, z: 0.25, sy: 0.4, ol: 0.6 }));
}
function buildShop(scene, S, animated, obstacles, interactables) {
  const p = polar(S.angle, R_SHOP), g = new THREE.Group(); g.position.set(p.x, 0, p.z); g.rotation.y = p.yaw; scene.add(g);
  obstacles.push({ x: p.x, z: p.z, r: 4.2 });
  let face = null;
  if (S.id === "boxes") { // a stack of giant pizza boxes with a slice on top
    const cols = [COL.cream, 0xffe7c2, COL.cream];
    [[5.6, 1.4, 4.4, 0.7, 0], [5.0, 1.4, 4.0, 2.1, 0.1], [4.4, 1.4, 3.6, 3.5, -0.08]].forEach(([w, h, d, y, ry], i) => { const b = part(rbox(w, h, d, 0.22), cols[i], { y, ry }); g.add(b); g.add(part(rbox(w + 0.06, 0.22, d + 0.06, 0.08), COL.tomato, { y: y + h / 2 - 0.12, ry, ol: 0 })); });
    const slice = dyn(part(sliceGeo(3.2, 2.8, 0.4), COL.cheese, { rx: -0.3, y: 5.7, z: 0.2 })); g.add(slice);
    slice.add(part(capsule(0.32, 2.4), COL.crust, { rz: Math.PI / 2, y: 1.6, z: 0.1 }));
    for (const [x, y] of [[-0.5, 0.7], [0.4, 0.9], [0, -0.2]]) slice.add(part(pill(0.32, 0.32, 0.1, 0.04), COL.pepperoni, { rx: Math.PI / 2, x, y, z: 0.28, ol: 0.6 }));
    mergeStatic(slice); animated.push((dt, t) => { slice.rotation.z = Math.sin(t * 1.2) * 0.08; slice.position.y = 5.7 + Math.sin(t * 2) * 0.08; });
    face = makeFace(1.6, "happy"); face.position.set(0, 2.1, 2.03); g.add(face);
  } else if (S.id === "toppings") { // a tall cheese tower with a mushroom roof
    g.add(part(pill(2.4, 2.7, 6.2, 0.4), COL.cheese, { y: 3.1 }));
    for (let i = 0; i < 9; i++) { const a = rnd(-1.3, 1.3) + (i % 2 ? Math.PI : 0), y = 0.8 + (i * 0.6) % 5.3; const r = 2.45 + (y < 3 ? 0.2 : 0); g.add(part(ball(rnd(0.25, 0.45), 12, 10), COL.cheeseDeep, { ol: 0, x: Math.sin(a) * r, z: Math.cos(a) * r, y, sz: 0.4, ry: a })); }
    const cap = dyn(new THREE.Group()); cap.position.y = 6.4; g.add(cap); cap.add(part(ball(3.2, 26, 14), COL.tomato, { sy: 0.55 })); for (const [x, y, z] of [[0, 1.7, 0], [1.6, 1.1, 1.8], [-1.8, 1.1, 1.4], [2.3, 0.7, -1], [-1.2, 1.3, -1.8], [0.4, 1.0, 2.4]]) cap.add(part(ball(0.38, 12, 8), 0xffffff, { x, y, z, sy: 0.5, ol: 0.6 }));
    mergeStatic(cap); animated.push((dt, t) => { cap.rotation.y = Math.sin(t * 0.6) * 0.06; cap.scale.y = 1 + Math.sin(t * 2.2) * 0.03; });
    face = makeFace(1.7, "happy"); face.position.set(0, 3.9, 2.62); g.add(face);
  } else if (S.id === "soda") { // a giant soda cup with a bendy straw
    g.add(part(pill(2.7, 2.1, 6, 0.35), COL.soda, { y: 3 }));
    for (const y of [1.4, 3.0, 4.6]) g.add(part(pill(2.7 - (6 - y) * 0.0, 2.6, 0.45, 0.15), 0xffffff, { y, sx: 0.98 + y * 0.012, sz: 0.98 + y * 0.012, ol: 0 }));
    g.add(part(pill(2.95, 2.95, 0.4, 0.18), 0xffffff, { y: 6.1 })); g.add(part(ball(2.6, 24, 12), 0xffffff, { y: 6.2, sy: 0.3 }));
    const straw = dyn(new THREE.Group()); straw.position.set(0.6, 6.4, 0); g.add(straw); straw.add(part(capsule(0.28, 3), 0x4aa8ff, { y: 1.6 })); straw.add(part(capsule(0.28, 1.4), 0x4aa8ff, { rz: -1.0, x: 0.55, y: 3.4 }));
    mergeStatic(straw); const fizz = []; for (let i = 0; i < 8; i++) { const b = dyn(part(ball(rnd(0.15, 0.3), 10, 8), 0xffffff, { ol: 0.5 })); g.add(b); fizz.push({ b, x: rnd(-1.6, 1.6), z: rnd(-1.4, 1.4), t: rnd(0, 1) }); }
    animated.push((dt, t) => { straw.rotation.z = Math.sin(t * 1.5) * 0.08; for (const f of fizz) { f.t += dt * 0.35; if (f.t > 1) f.t = 0; f.b.position.set(f.x, 6.5 + f.t * 3.5, f.z); f.b.scale.setScalar(1 - f.t * 0.8); } });
    face = makeFace(1.7, "happy"); face.position.set(0, 3.75, 2.62); g.add(face);
  } else if (S.id === "oven") { // a round brick pizza oven where you play your games
    g.add(part(ball(3.6, 28, 18), COL.brick, { y: 0.3, sy: 0.92 }));
    for (let i = 0; i < 14; i++) { const a = rnd(-2.6, 2.6), y = rnd(0.8, 3.0), r = Math.sqrt(Math.max(0.1, 3.6 * 3.6 - ((y - 0.3) / 0.92) ** 2)); g.add(part(rbox(0.6, 0.3, 0.12, 0.06), 0xe8875f, { ol: 0, x: Math.sin(a) * r * 0.99, z: Math.cos(a) * r * 0.99, y, ry: a })); }
    g.add(part(pill(0.55, 0.65, 2.4, 0.15), 0xb5553a, { y: 4.2, x: -1.2, z: -0.8 }));
    const mouth = part(pill(1.5, 1.5, 0.6, 0.25), 0x3a1a10, { rx: Math.PI / 2, y: 1.2, z: 3.3, sy: 1, ol: 1.2 }); g.add(mouth);
    const fire = dyn(new THREE.Group()); fire.position.set(0, 0.7, 3.25); g.add(fire); const flames = [0xff8a1f, 0xffc23a, 0xff5a2a].map((c, i) => { const f = part(ball(0.55 - i * 0.1, 12, 10), c, { x: (i - 1) * 0.55, emissive: 0x803000, ol: 0, sy: 1.4 }); fire.add(f); return f; });
    animated.push((dt, t) => flames.forEach((f, i) => { f.scale.y = 1.2 + Math.sin(t * 9 + i * 2) * 0.35; f.position.y = 0.1 + Math.sin(t * 7 + i) * 0.06; }));
    const smoke = []; for (let i = 0; i < 4; i++) { const s = dyn(part(ball(0.5, 10, 8), 0xffffff, { ol: 0.6, olColor: 0xc8c8d8 })); g.add(s); smoke.push({ s, t: i / 4 }); }
    animated.push((dt) => smoke.forEach((o) => { o.t = (o.t + dt * 0.25) % 1; o.s.position.set(-1.2 + Math.sin(o.t * 6) * 0.4, 5.5 + o.t * 4, -0.8); o.s.scale.setScalar(0.5 + o.t * 1.2); }));
    face = makeFace(1.8, "happy"); face.position.set(0, 3.0, 3.18); face.rotation.x = -0.35; g.add(face);
  } else { // the Hat Hut — shaped like a giant chef hat
    g.add(part(pill(2.6, 2.6, 2.8, 0.3), 0xffffff, { y: 1.4 })); g.add(part(pill(2.75, 2.75, 0.5, 0.2), COL.tomato, { y: 2.85 }));
    const puffs = dyn(new THREE.Group()); puffs.position.y = 4.1; g.add(puffs); for (const [x, z, r] of [[0, 0, 2], [1.4, 0.6, 1.4], [-1.4, 0.6, 1.4], [0.8, -1.3, 1.4], [-0.9, -1.2, 1.4], [0, 1.4, 1.3]]) puffs.add(part(ball(r, 18, 12), 0xffffff, { x, z, y: r * 0.3 }));
    mergeStatic(puffs); animated.push((dt, t) => { puffs.scale.set(1 + Math.sin(t * 1.8) * 0.03, 1 - Math.sin(t * 1.8) * 0.03, 1 + Math.sin(t * 1.8) * 0.03); });
    face = makeFace(1.6, "happy"); face.position.set(0, 1.55, 2.64); g.add(face);
    const pom = dyn(makeHat("propeller")); pom.position.set(0, 7, 0); pom.scale.setScalar(2.4); g.add(pom); animated.push((dt) => pom.traverse((o) => { if (o.userData.spin) o.rotation.y += dt * 3; }));
  }
  // the counter + awning out front, with the shopkeeper behind it
  const cnt = polar(S.angle, R_KEEP - 1.1), cg = new THREE.Group(); cg.position.set(cnt.x, 0, cnt.z); cg.rotation.y = cnt.yaw; scene.add(cg); obstacles.push({ x: cnt.x, z: cnt.z, r: 1.4 });
  const awn = [COL.tomato, COL.basil, 0x4aa8ff, COL.purple, COL.pink][SHOPS.indexOf(S)];
  cg.add(part(rbox(3.2, 1.0, 0.9, 0.2), COL.crust, { y: 0.5 })); cg.add(part(rbox(3.4, 0.16, 1.1, 0.06), COL.cream, { y: 1.06 }));
  for (const x of [-1.5, 1.5]) cg.add(part(capsule(0.08, 2.0), 0xfff4dc, { x, y: 2.0, z: -0.3 }));
  for (let i = 0; i < 5; i++) cg.add(part(rbox(0.68, 0.12, 1.4, 0.05), i % 2 ? 0xffffff : awn, { x: -1.36 + i * 0.68, y: 3.15, z: 0.05, rx: 0.32, ol: 0.7 }));
  const sign = signBoard([`${S.ico} ${S.name}`], 3.2, 0.7, { size: 70 }); sign.position.set(0, 0.55, 0.47); cg.add(sign);
  // things on the counter
  if (S.id === "boxes") for (const [k, x] of [["bag", -0.95], ["box", 0.05], ["gold", 0.95]]) { const b = makeBox(k); dyn(b.group); b.group.scale.setScalar(0.3); b.group.position.set(x, 1.14, 0.05); cg.add(b.group); animated.push((dt, t) => b.update(dt, t + x)); }
  if (S.id === "toppings") for (const [e, x] of [["🧀", -1], ["🌿", -0.3], ["🌶️", 0.4], ["🫒", 1.05]]) { const s = emojiSprite(e, 0.55); s.position.set(x, 1.45, 0.1); cg.add(s); }
  if (S.id === "soda") for (const [c, x] of [[COL.soda, -0.9], [0x4aa8ff, 0], [COL.basil, 0.9]]) { cg.add(part(pill(0.2, 0.15, 0.45, 0.06), c, { x, y: 1.36 })); cg.add(part(capsule(0.03, 0.3), 0xffffff, { x: x + 0.05, y: 1.7 })); }
  if (S.id === "oven") { const pz = dyn(makePizza(0.5)); pz.position.set(0, 1.18, 0.1); cg.add(pz); animated.push((dt) => (pz.rotation.y += dt)); const bk = emojiSprite("📖", 0.6); bk.position.set(1.0, 1.5, 0.1); cg.add(bk); }
  if (S.id === "hats") ["crown", "slice", "mushroom"].forEach((h, i) => { const m = dyn(makeHat(h)); m.position.set(-0.9 + i * 0.9, 1.16, 0.05); m.scale.setScalar(0.85); cg.add(m); animated.push((dt, t) => (m.rotation.y = Math.sin(t + i) * 0.5)); });
  const kp = polar(S.angle, R_KEEP + 0.2); const keeper = makeKeeper(S.keeper); dyn(keeper.group); keeper.group.position.set(kp.x, 0, kp.z); keeper.group.rotation.y = kp.yaw; scene.add(keeper.group);
  // where you stand to shop + a big invisible hit box so tapping the shop walks you there
  const f = polar(S.angle, R_FRONT); const it = { id: S.id, label: S.name, ico: S.ico, front: new THREE.Vector3(f.x, 0, f.z) };
  const hit = new THREE.Mesh(new THREE.BoxGeometry(7, 7, 7), new THREE.MeshBasicMaterial({ colorWrite: false, depthWrite: false })); const hp = polar(S.angle, R_SHOP - 1.6); hit.position.set(hp.x, 3, hp.z); hit.rotation.y = hp.yaw; hit.userData.interactable = it; scene.add(hit); it.hit = hit; interactables.push(it);
  return keeper;
}
