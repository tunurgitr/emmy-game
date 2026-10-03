// ==========================================================================
//  Emmy's Dumpling Town 3D — a big walkable town with shops you can go inside.
//
//  createTown(canvas, { ui, avatar, onPrompt, onInteract, onPickup, onChickenTap,
//                       onDoor, onArea, getOwned }) → town
//    town.start() / stop() / pause(v)
//    town.setOverride({ scene, camera, update, onDown, onMove, onUp }) — while set, the
//      renderer shows the override (the steamer table, the catch game) instead.
//    town.enter(id) / town.exit() — step through a shop door (the hub fades the screen)
//    town.setDelivery(npc, onArrive) — show a delivery target (beacon, arrow, steamer in hand)
//    town.setFlock(hens, follow) — the first `follow` chickens walk behind you,
//      the rest live in your chicken yard next to your house
//
//  Outdoors and every interior are separate groups in one scene; only the area
//  you're in is visible, so going inside also makes the frame cheaper.
// ==========================================================================
import { THREE, rnd, clamp, pick, mat, box, cyl, sphere, textPlane, emojiSprite, blobShadow, makeKid, makePlush, approach, LOW_TIER, mergeStatic } from "../arcade3d/lib.js";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { buildDumpling, makeSteamer, makeChicken, makeCoin, makeEgg, CHICKEN_COLORS, CATALOG } from "./models.js";

const OUT = { minX: -46, maxX: 46, minZ: -42, maxZ: 42 };
const EYE = 1.55;
const SKY = 0xbfe3ff;

export function createTown(canvas, { ui, avatar = {}, onPrompt, onInteract, onPickup, onChickenTap, onDoor, onArea, getOwned = () => ({}) }) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: !LOW_TIER, powerPreference: "high-performance" });
  const basePR = LOW_TIER ? 1.0 : Math.min(1.75, window.devicePixelRatio || 1); let resScale = 1, emaDt = 1 / 60, adaptT = 0;
  renderer.setPixelRatio(basePR); renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.localClippingEnabled = true; renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  const envMap = new THREE.PMREMGenerator(renderer).fromScene(new RoomEnvironment(), 0.04).texture;
  const scene = new THREE.Scene(); scene.environment = envMap; scene.environmentIntensity = 0.35;
  scene.background = new THREE.Color(SKY); const outFog = new THREE.Fog(0xf3e6f2, 70, 210); scene.fog = outFog;
  const camera = new THREE.PerspectiveCamera(60, 1, 0.1, 260);
  // one set of lights for every area (so walking through a door never recompiles shaders)
  const hemi = new THREE.HemisphereLight(0xdff1ff, 0x8a7a5a, 1.3); scene.add(hemi);
  const sun = new THREE.DirectionalLight(0xfff1dc, 2.0); sun.position.set(18, 30, 14); scene.add(sun);

  const animated = [];
  const outdoor = new THREE.Group(); scene.add(outdoor);
  const areas = { out: { id: "out", group: outdoor, ...OUT, ceil: 99, obstacles: [], interactables: [], doors: [], bg: SKY } };
  buildOutdoor(outdoor, areas.out, animated);
  SHOPS.forEach((S, i) => { const a = buildInterior(S, 300 + i * 60); areas[S.id] = a; scene.add(a.group); a.group.visible = false; });
  for (const a of Object.values(areas)) { mergeStatic(a.group); const groups = []; a.group.traverse((o) => { if (o.isGroup && o !== a.group && o.children.length > 3 && !o.userData.noMerge) groups.push(o); }); for (const g of groups) mergeStatic(g); }
  const puffs = makePuffs(scene); animated.push((dt) => puffs.update(dt));
  const steamAt = (x, y, z, every, areaId) => { const s = { t: 0 }; animated.push((dt) => { if (area.id !== areaId) return; if ((s.t -= dt) < 0) { s.t = every * rnd(0.7, 1.3); puffs.emit(x + rnd(-0.2, 0.2), y, z + rnd(-0.2, 0.2)); } }); };
  const houseS = SHOPS[0]; steamAt(houseS.x + 4, houseS.h + 2.6, houseS.z - 2, 0.35, "out"); steamAt(0, 2.6, 0, 0.45, "out");
  for (const a of Object.values(areas)) for (const s of a.steam || []) steamAt(...s, 0.3, a.id);
  // after merging: things that move or must keep their own materials
  for (const a of Object.values(areas)) for (const k of a.keepers || []) addKeeper(a.group, k, animated);
  addFountainDumpling(outdoor, animated); addPenChickens(outdoor, animated); addDucks(outdoor, animated);
  for (const a of Object.values(areas)) for (const fn of a.late || []) fn(animated);

  // ---- townsfolk (they wander about, and they're your delivery customers) ----
  const npcs = TOWNSFOLK.map((T, i) => { const kid = liteKid(T.look); kid.group.position.set(T.x, 0, T.z); outdoor.add(kid.group); return { ...T, r: T.r + 3, pace: rnd(2.6, 3.4), kid, hx: T.x, hz: T.z, tx: T.x, tz: T.z, wait: rnd(0, 2), yaw: rnd(0, 6), i }; });

  // ---- player -------------------------------------------------------------
  const kid = makeKid(avatar); scene.add(kid.group);
  const player = { x: 0, z: 36, yaw: Math.PI, speed: 0 };
  let area = areas.out, camYaw = 0, camPitch = 0.36, camDist = 6.4, autoTarget = null, autoInteract = null, doorCool = 0, stuckT = 0, stuckD = Infinity;

  // ---- input (same feel as the arcade: joystick left, drag-look right, tap to walk) ----
  const keys = new Set(), move = { x: 0, y: 0 };
  let override = null, running = false, paused = false, focus = false;
  const pointers = new Map(); let joyPid = null, lookPid = null, joyOrigin = null;
  const isTouch = ("ontouchstart" in window) || navigator.maxTouchPoints > 0;
  const joy = document.createElement("div"); joy.className = "joy"; joy.innerHTML = `<div class="knob"></div>`; ui.appendChild(joy); const knob = joy.firstElementChild;
  const restJoy = () => { if (isTouch && !override) { joy.style.display = "block"; joy.style.left = "26px"; joy.style.top = ""; joy.style.bottom = "max(30px, env(safe-area-inset-bottom))"; joy.classList.add("rest"); knob.style.transform = ""; } else joy.style.display = "none"; };
  const setJoy = (visible, cx, cy, dx = 0, dy = 0) => { if (!visible) { restJoy(); return; } joy.classList.remove("rest"); joy.style.display = "block"; joy.style.bottom = ""; joy.style.left = `${cx - 60}px`; joy.style.top = `${cy - 60}px`; knob.style.transform = `translate(${dx}px, ${dy}px)`; };
  restJoy();
  const ndc = new THREE.Vector2(), ray = new THREE.Raycaster();
  const evt = (e) => { const r = canvas.getBoundingClientRect(); ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1); ray.setFromCamera(ndc, override ? override.camera : camera); return { x: ndc.x, y: ndc.y, sx: e.clientX - r.left, sy: e.clientY - r.top, ray, id: e.pointerId, W: r.width, H: r.height }; };
  canvas.addEventListener("pointerdown", (e) => {
    canvas.setPointerCapture(e.pointerId); pointers.set(e.pointerId, { x: e.clientX, y: e.clientY, moved: 0 });
    if (override) { override.onDown && override.onDown(evt(e)); return; }
    if (e.pointerType === "touch" && e.clientX < innerWidth * 0.45 && joyPid === null) { joyPid = e.pointerId; joyOrigin = { x: e.clientX, y: e.clientY }; setJoy(true, e.clientX, e.clientY); autoTarget = null; return; }
    if (lookPid === null) lookPid = e.pointerId;
  });
  canvas.addEventListener("pointermove", (e) => {
    const p = pointers.get(e.pointerId); if (!p) return; const mx = e.clientX - p.x, my = e.clientY - p.y; p.moved += Math.hypot(mx, my); p.x = e.clientX; p.y = e.clientY;
    if (override) { override.onMove && override.onMove(evt(e)); return; }
    if (e.pointerId === joyPid) { let dx = e.clientX - joyOrigin.x, dy = e.clientY - joyOrigin.y; const l = Math.hypot(dx, dy), m = 48; if (l > m) { dx *= m / l; dy *= m / l; } move.x = dx / m; move.y = dy / m; setJoy(true, joyOrigin.x, joyOrigin.y, dx, dy); }
    if (e.pointerId === lookPid && p.moved > 6) { camYaw -= mx * 0.006; camPitch = clamp(camPitch - my * 0.004, 0.08, 1.1); }
  });
  const up = (e) => {
    const p = pointers.get(e.pointerId); pointers.delete(e.pointerId);
    if (override) { override.onUp && override.onUp(evt(e)); return; }
    if (e.pointerId === joyPid) { joyPid = null; move.x = move.y = 0; setJoy(false); }
    if (e.pointerId === lookPid) { lookPid = null; if (p && p.moved < 8) tapToWalk(evt(e)); }
  };
  canvas.addEventListener("pointerup", up); canvas.addEventListener("pointercancel", up);
  // if the browser ever steals the touch (an overlay, a system gesture), let go of the joystick too
  canvas.addEventListener("lostpointercapture", (e) => { if (pointers.has(e.pointerId)) up(e); });
  window.addEventListener("keydown", (e) => {
    if (e.target && /INPUT|TEXTAREA/.test(e.target.tagName)) return;
    if (["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", " "].includes(e.key)) e.preventDefault(); if (e.repeat) return;
    keys.add(e.key.length === 1 ? e.key.toLowerCase() : e.key);
    if (override) { override.onKey && override.onKey(e.key, true); return; }
    if ((e.key === "e" || e.key === "E" || e.key === "Enter" || e.key === " ") && nearest && !paused) onInteract(nearest);
  });
  window.addEventListener("keyup", (e) => { keys.delete(e.key.length === 1 ? e.key.toLowerCase() : e.key); if (override && override.onKey) override.onKey(e.key, false); });
  const letGo = () => { keys.clear(); move.x = move.y = 0; joyPid = lookPid = null; pointers.clear(); restJoy(); };
  window.addEventListener("blur", letGo); document.addEventListener("visibilitychange", () => { if (document.hidden) letGo(); });

  // ---- gamepad: left stick walks, right stick looks, A interacts, B backs out ----
  const pad = { lx: 0, ly: 0, rx: 0, ry: 0, connected: false, buttons: [] }; const prevBtn = [];
  const cursor = document.createElement("div"); cursor.className = "padcursor"; cursor.style.display = "none"; ui.appendChild(cursor); const cur = { x: 0.5, y: 0.5 };
  // a wide dead zone so a drifting stick doesn't walk you off
  const dz = (v) => (Math.abs(v) < 0.22 ? 0 : (v - Math.sign(v) * 0.22) / 0.78); let onPadBack = null, onPadButton = null;
  function pollPad() {
    const gps = navigator.getGamepads ? navigator.getGamepads() : []; let gp = null; for (const g of gps) if (g && g.connected) { gp = g; break; }
    pad.connected = !!gp; if (!gp) { cursor.style.display = "none"; return; }
    pad.lx = dz(gp.axes[0] || 0); pad.ly = dz(gp.axes[1] || 0); pad.rx = dz(gp.axes[2] || 0); pad.ry = dz(gp.axes[3] || 0);
    const pressed = gp.buttons.map((b) => b.pressed), edges = pressed.map((p, i) => p && !prevBtn[i]), released = pressed.map((p, i) => !p && prevBtn[i]); prevBtn.length = 0; prevBtn.push(...pressed); pad.buttons = pressed;
    let consumed = false; edges.forEach((e, i) => { if (e && onPadButton && onPadButton(i)) consumed = true; }); if (consumed) return;
    if (override) {
      if (override.directPad) { cursor.style.display = "none"; if (edges[1] && onPadBack) onPadBack(); return; } // the game reads the sticks itself
      const W = canvas.clientWidth || innerWidth, H = canvas.clientHeight || innerHeight, mx = pad.rx || pad.lx, my = pad.ry || pad.ly;
      cur.x = clamp(cur.x + (mx * 1.4) / 60, 0.02, 0.98); cur.y = clamp(cur.y + (my * 1.4) / 60, 0.02, 0.98);
      cursor.style.display = "block"; cursor.style.left = `${cur.x * W}px`; cursor.style.top = `${cur.y * H}px`; cursor.classList.toggle("down", !!pressed[0]);
      const r = canvas.getBoundingClientRect(), fake = { clientX: r.left + cur.x * W, clientY: r.top + cur.y * H, pointerId: 999 };
      if (edges[0]) override.onDown && override.onDown(evt(fake)); else if (pressed[0]) override.onMove && override.onMove(evt(fake)); if (released[0]) override.onUp && override.onUp(evt(fake));
      if (edges[1] && onPadBack) onPadBack();
    } else {
      cursor.style.display = "none"; camYaw -= (pad.rx * 2.4) / 60; camPitch = clamp(camPitch - (pad.ry * 1.6) / 60, 0.08, 1.1);
      if (edges[0] && nearest && !paused) onInteract(nearest); if (edges[1] && onPadBack) onPadBack();
    }
  }
  const floorPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0), tmpV = new THREE.Vector3();
  function tapToWalk(p) {
    const ch = p.ray.intersectObjects(chickens.map((c) => c.ch.group), true)[0];
    if (ch) { const c = chickens.find((c) => { let o = ch.object; while (o) { if (o === c.ch.group) return true; o = o.parent; } return false; }); if (c) { c.ch.flapNow(); onChickenTap && onChickenTap(c); return; } }
    const hit = p.ray.intersectObjects(area.interactables.map((i) => i.hit), false)[0];
    stuckT = 0; stuckD = Infinity;
    if (hit) { const it = hit.object.userData.interactable; if (it) { autoTarget = it.front.clone(); autoInteract = it; return; } }
    if (p.ray.ray.intersectPlane(floorPlane, tmpV)) { autoTarget = tmpV.clone(); autoInteract = null; }
  }

  // ---- coins on the ground, chickens and their eggs ------------------------------
  const coins = []; const coinSpots = [[-8, 10], [8, 10], [-12, -6], [12, -6], [-4, -16], [5, -18], [-30, 8], [30, 8], [0, 22], [-16, 26], [16, 24], [0, -39], [-38, -30], [38, -30], [-40, 36], [40, 36], [-28, -8], [28, -8], [20, -32], [-20, -32]];
  for (const [x, z] of coinSpots) { const c = makeCoin(); c.scale.setScalar(1.4); c.position.set(x, 0.65, z); outdoor.add(c); coins.push({ g: c, x, z, t: 0 }); }
  const chickens = [], eggs = [];
  function addChicken(ci = 0, quiet = false) {
    const ch = makeChicken({ color: CHICKEN_COLORS[ci % CHICKEN_COLORS.length] }); ch.group.scale.setScalar(1.25); const lead = chickens.length ? chickens[chickens.length - 1] : player;
    const c = { ch, x: lead.x + rnd(-1, 1), z: lead.z + 1.5, yaw: 0, speed: 0, eggT: rnd(20, 40), ci }; ch.group.position.set(c.x, 0, c.z); ch.group.add(blobShadow(0.35, 0.3)); scene.add(ch.group); chickens.push(c); if (!quiet) ch.flapNow(); return c;
  }
  const yardHens = [];
  function setFlock(hens, follow) {
    for (const c of chickens) scene.remove(c.ch.group); chickens.length = 0;
    for (const y of yardHens) outdoor.remove(y.ch.group); yardHens.length = 0;
    hens.slice(0, follow).forEach((ci) => addChicken(ci, true));
    // the rest potter about the yard (up to 30 shown; the yard is only so big!)
    hens.slice(follow, follow + 30).forEach((ci) => { const ch = makeChicken({ color: CHICKEN_COLORS[ci % CHICKEN_COLORS.length] }); ch.group.scale.setScalar(1.15); outdoor.add(ch.group);
      const st = { ch, x: YARD.x + rnd(-4, 4), z: YARD.z + rnd(-2.4, 2.4), tx: YARD.x, tz: YARD.z, wait: rnd(0, 3), ph: rnd(0, 9) }; st.tx = st.x; st.tz = st.z; ch.group.position.set(st.x, 0, st.z); ch.group.rotation.y = rnd(0, 6); yardHens.push(st); });
  }
  function updateYard(dt, t) {
    for (const st of yardHens) { const dx = st.tx - st.x, dz = st.tz - st.z, dd = Math.hypot(dx, dz); let sp = 0;
      if (dd > 0.1) { sp = 1.4; st.x += (dx / dd) * sp * dt; st.z += (dz / dd) * sp * dt; st.ch.group.rotation.y = Math.atan2(dx, dz); } else if ((st.wait -= dt) < 0) { st.wait = rnd(1, 5); st.tx = YARD.x + rnd(-YARD.w / 2 + 0.7, YARD.w / 2 - 0.7); st.tz = YARD.z + rnd(-YARD.d / 2 + 0.7, YARD.d / 2 - 0.7); }
      st.ch.group.position.set(st.x, 0, st.z); st.ch.update(dt, t + st.ph, sp / 1.4, sp === 0); }
  }
  function updateCritters(dt, t) {
    if (area === areas.out) for (const c of coins) { if (c.t > 0) { c.t -= dt; c.g.visible = c.t <= 0; continue; } c.g.rotation.y += dt * 2.4; c.g.position.y = 0.65 + Math.sin(t * 3 + c.x) * 0.08;
      if (Math.hypot(player.x - c.x, player.z - c.z) < 1.2) { c.t = rnd(18, 30); c.g.visible = false; onPickup && onPickup("coin", 2); } }
    chickens.forEach((c, i) => {
      const lead = i ? chickens[i - 1] : player; const dx = lead.x - c.x, dz = lead.z - c.z, d = Math.hypot(dx, dz), gap = i ? 1.15 : 1.5;
      const want = d > gap ? Math.min(10.5, (d - gap) * 4.5) : 0; c.speed = approach(c.speed, want, 8, dt);
      if (c.speed > 0.05) { c.x += (dx / d) * c.speed * dt; c.z += (dz / d) * c.speed * dt; c.yaw = Math.atan2(dx, dz); }
      c.x = clamp(c.x, area.minX + 0.6, area.maxX - 0.6); c.z = clamp(c.z, area.minZ + 0.6, area.maxZ - 0.6);
      c.ch.group.position.set(c.x, 0, c.z); let dy = c.yaw - c.ch.group.rotation.y; while (dy > Math.PI) dy -= Math.PI * 2; while (dy < -Math.PI) dy += Math.PI * 2; c.ch.group.rotation.y += dy * Math.min(1, dt * 8);
      c.ch.update(dt, t + i, Math.min(1, c.speed / 3), c.speed < 0.1 && Math.sin(t * 0.7 + i * 2) > 0.3);
      if (area === areas.out && (c.eggT -= dt) <= 0) { c.eggT = rnd(25, 45) * Math.max(1, chickens.length / 6); const golden = Math.random() < 0.08; const e = makeEgg(golden); e.position.set(c.x, 0.2, c.z); e.scale.setScalar(1.3); outdoor.add(e); eggs.push({ m: e, golden, x: c.x, z: c.z, age: 0 }); onPickup && onPickup("laid", golden ? 1 : 0); }
    });
    for (let i = eggs.length - 1; i >= 0; i--) { const e = eggs[i]; e.age += dt; e.m.rotation.z = Math.sin(t * 6) * 0.08 * Math.max(0, 1 - e.age); if (area === areas.out && e.age > 0.5 && Math.hypot(player.x - e.x, player.z - e.z) < 1.2) { outdoor.remove(e.m); eggs.splice(i, 1); onPickup && onPickup("egg", 1, e.golden); } }
  }
  function updateNpcs(dt, t) {
    for (const n of npcs) {
      const target = delivery && delivery.npc === n; let sp = 0;
      if (target) n.yaw = Math.atan2(player.x - n.x, player.z - n.z);
      else { const dx = n.tx - n.x, dz = n.tz - n.z, d = Math.hypot(dx, dz); if (d > 0.15) { sp = n.pace; n.x += (dx / d) * sp * dt; n.z += (dz / d) * sp * dt; n.yaw = Math.atan2(dx, dz); } else if ((n.wait -= dt) < 0) { n.wait = rnd(0.8, 2.5); n.tx = n.hx + rnd(-n.r, n.r); n.tz = n.hz + rnd(-n.r, n.r); } }
      n.kid.group.visible = target || Math.hypot(n.x - player.x, n.z - player.z) < 34; if (!n.kid.group.visible) continue;
      n.kid.group.position.set(n.x, 0, n.z); let dy = n.yaw - n.kid.group.rotation.y; while (dy > Math.PI) dy -= Math.PI * 2; while (dy < -Math.PI) dy += Math.PI * 2; n.kid.group.rotation.y += dy * Math.min(1, dt * 6);
      n.kid.walk(t + n.i, sp / 3.2, dt); if (target) n.kid.parts.armR.rotation.x = -2.6 + Math.sin(t * 8) * 0.4; // waving at you!
    }
  }

  // ---- deliveries: a beacon over the customer, an arrow over your head, a steamer in your hands ----
  let delivery = null, speedBoost = 1;
  const beacon = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.7, 14, 20, 1, true), new THREE.MeshBasicMaterial({ color: 0xffd54a, transparent: true, opacity: 0.28, depthWrite: false, side: THREE.DoubleSide, fog: false })); beacon.visible = false; outdoor.add(beacon);
  const bubble = emojiSprite("🥟", 1.1); bubble.visible = false; outdoor.add(bubble);
  const arrow = new THREE.Group(); const arrowM = new THREE.MeshStandardMaterial({ color: 0xffd54a, emissive: 0xffa000, emissiveIntensity: 0.7 }); const head = new THREE.Mesh(new THREE.ConeGeometry(0.28, 0.6, 16), arrowM); head.rotation.x = Math.PI / 2; head.position.z = 0.45; arrow.add(head, box(0.16, 0.08, 0.6, arrowM, 0, 0, 0)); arrow.visible = false; scene.add(arrow);
  const carry = makeSteamer(0.28, 0.14); carry.position.set(0, 0.95, 0.42); carry.visible = false; kid.group.add(carry);
  function updateDelivery(dt, t) {
    const on = !!delivery && area === areas.out; beacon.visible = bubble.visible = arrow.visible = on; carry.visible = !!delivery;
    if (!delivery) return; const n = delivery.npc;
    beacon.position.set(n.x, 7, n.z); beacon.material.opacity = 0.22 + Math.sin(t * 4) * 0.08; bubble.position.set(n.x, 2.6 + Math.sin(t * 4) * 0.12, n.z);
    arrow.position.set(player.x, 2.75 + Math.sin(t * 5) * 0.08, player.z); arrow.rotation.y = Math.atan2(n.x - player.x, n.z - player.z);
    if (on && Math.hypot(player.x - n.x, player.z - n.z) < 1.9) { const cb = delivery.onArrive; delivery = null; cb && cb(n); }
  }

  // ---- update ---------------------------------------------------------------
  let nearest = null, last = performance.now(), t = 0;
  const camPos = new THREE.Vector3(), camLook = new THREE.Vector3();
  function update(dt) {
    t += dt; for (const f of animated) f(dt, t); updateCritters(dt, t); if (area === areas.out) { updateNpcs(dt, t); updateYard(dt, t); } updateDelivery(dt, t);
    doorCool = Math.max(0, doorCool - dt);
    if (focus) { kid.group.rotation.y = camYaw; kid.walk(t, 0, dt); camPos.set(player.x + Math.sin(camYaw) * 3.2, 1.7, player.z + Math.cos(camYaw) * 3.2); clampCam(camPos); camera.position.lerp(camPos, Math.min(1, dt * 6)); camLook.set(player.x, 1.05, player.z); camera.lookAt(camLook); return; }
    let mx = move.x + (pad.connected ? pad.lx : 0), mz = move.y + (pad.connected ? pad.ly : 0);
    if (!paused) { if (keys.has("w") || keys.has("ArrowUp")) mz -= 1; if (keys.has("s") || keys.has("ArrowDown")) mz += 1; if (keys.has("a") || keys.has("ArrowLeft")) mx -= 1; if (keys.has("d") || keys.has("ArrowRight")) mx += 1; if (keys.has("q")) camYaw += 1.8 * dt; }
    let l = Math.hypot(mx, mz); if (l > 1) { mx /= l; mz /= l; l = 1; } if (l > 0.05) { autoTarget = null; autoInteract = null; }
    const sy = Math.sin(camYaw), cy = Math.cos(camYaw); let vx = 0, vz = 0;
    if (paused) l = 0;
    if (l > 0.05) { vx = mx * cy + mz * sy; vz = -mx * sy + mz * cy; }
    else if (autoTarget && !paused) { const dx = autoTarget.x - player.x, dz = autoTarget.z - player.z, d = Math.hypot(dx, dz); if (d < 0.25) { autoTarget = null; if (autoInteract) { const it = autoInteract; autoInteract = null; if (near(it) < 2.8) onInteract(it); } } else { vx = dx / d; vz = dz / d; l = Math.min(1, d);
      // walking into a wall / tree / the pond? if we stop getting closer, give up (and use the shop if we're close enough)
      if ((stuckT += dt) > 0.5) { if (d > stuckD - 0.3) { const it = autoInteract; autoTarget = null; autoInteract = null; if (it && near(it) < 2.8) onInteract(it); } stuckT = 0; stuckD = d; } } }
    const SP = (area === areas.out ? (delivery ? 9.2 : 8.2) : 5.4) * speedBoost;
    player.speed = approach(player.speed, l > 0.05 || (autoTarget && !paused) ? SP * Math.max(0.35, l) : 0, 10, dt);
    if (player.speed > 0.01 && (vx || vz)) { player.x += vx * player.speed * dt; player.z += vz * player.speed * dt; player.yaw = Math.atan2(vx, vz); }
    player.x = clamp(player.x, area.minX + 0.6, area.maxX - 0.6); player.z = clamp(player.z, area.minZ + 0.6, area.maxZ - 0.6);
    for (const o of area.obstacles) collide(player, o, () => { if (autoTarget && !autoInteract) autoTarget = null; });
    // walking through a doorway
    if (!doorCool && !paused) for (const d of area.doors) if (Math.hypot(player.x - d.x, player.z - d.z) < 0.95) { doorCool = 1.5; autoTarget = null; onDoor && onDoor(d.id, area === areas.out ? "in" : "out"); break; }
    kid.group.position.set(player.x, 0, player.z);
    let dy = player.yaw - kid.group.rotation.y; while (dy > Math.PI) dy -= Math.PI * 2; while (dy < -Math.PI) dy += Math.PI * 2; kid.group.rotation.y += dy * Math.min(1, dt * 12);
    kid.walk(t, player.speed / SP, dt);
    const dist = area === areas.out ? camDist : 5.2;
    camPos.set(player.x + Math.sin(camYaw) * Math.cos(camPitch) * dist, EYE + Math.sin(camPitch) * dist, player.z + Math.cos(camYaw) * Math.cos(camPitch) * dist); clampCam(camPos);
    camera.position.lerp(camPos, Math.min(1, dt * 8)); camLook.set(player.x, area === areas.out ? 1.3 : 1.7, player.z); camera.lookAt(camLook);
    let best = null, bd = 2.8; for (const it of area.interactables) { const d = near(it); if (d < bd) { bd = d; best = it; } }
    if (best !== nearest) { nearest = best; onPrompt(best); }
  }
  const near = (it) => Math.hypot(it.front.x - player.x, it.front.z - player.z);
  function clampCam(p) { if (area === areas.out) { for (let k = 0; k < 14 && area.obstacles.some((o) => o.tall && Math.abs(p.x - o.x) < o.w / 2 + 0.4 && Math.abs(p.z - o.z) < o.d / 2 + 0.4); k++) { p.x += (player.x - p.x) * 0.18; p.z += (player.z - p.z) * 0.18; p.y = Math.max(p.y, EYE + 0.6); } return; } p.x = clamp(p.x, area.minX + 0.35, area.maxX - 0.35); p.z = clamp(p.z, area.minZ + 0.35, area.maxZ - 0.35); p.y = Math.min(p.y, area.ceil - 0.35); }
  function snapCamera() { const dist = area === areas.out ? camDist : 5.2; camPos.set(player.x + Math.sin(camYaw) * Math.cos(camPitch) * dist, EYE + Math.sin(camPitch) * dist, player.z + Math.cos(camYaw) * Math.cos(camPitch) * dist); clampCam(camPos); camera.position.copy(camPos); camera.lookAt(player.x, area === areas.out ? 1.3 : 1.7, player.z); }
  function moveTo(next, x, z, yaw) {
    area.group.visible = false; area = next; area.group.visible = true;
    player.x = x; player.z = z; player.yaw = yaw; player.speed = 0; kid.group.rotation.y = yaw; camYaw = yaw + Math.PI + (area === areas.out ? 1.0 : 0); camPitch = area === areas.out ? 0.42 : 0.24;
    chickens.forEach((c, i) => { c.x = x - Math.sin(yaw) * (1.5 + i * 1.1); c.z = z - Math.cos(yaw) * (1.5 + i * 1.1); c.speed = 0; });
    const outside = area === areas.out; scene.background = new THREE.Color(area.bg); scene.fog = outside ? outFog : null; hemi.intensity = outside ? 1.3 : 1.05; sun.intensity = outside ? 2.0 : 0.8; scene.environmentIntensity = outside ? 0.35 : 0.5;
    if (area.id === "home") refreshShelf(area, getOwned());
    nearest = null; onPrompt(null); autoTarget = null; autoInteract = null; doorCool = 1.2; snapCamera(); onArea && onArea(area.id);
  }

  // ---- loop -----------------------------------------------------------------
  function resize() { const w = canvas.clientWidth || innerWidth, h = canvas.clientHeight || innerHeight; renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix(); if (override?.camera) { override.camera.aspect = w / h; override.camera.updateProjectionMatrix(); } }
  window.addEventListener("resize", resize); resize();
  function adaptResolution(dt) { emaDt = emaDt * 0.9 + dt * 0.1; adaptT += dt; if (adaptT < 1.2) return; adaptT = 0; let next = resScale; if (emaDt > 1 / 40) next = Math.max(0.55, resScale * 0.85); else if (emaDt < 1 / 56) next = Math.min(1, resScale * 1.08); if (Math.abs(next - resScale) > 0.01) { resScale = next; renderer.setPixelRatio(basePR * resScale); resize(); } }
  function frame(now) {
    if (!running) return; requestAnimationFrame(frame);
    const dt = Math.min(0.05, (now - last) / 1000); last = now;
    adaptResolution(dt); pollPad();
    if (override) { try { override.update(dt); renderer.render(override.scene, override.camera); } catch (err) { console.error(err); } }
    else { update(dt); renderer.render(scene, camera); }
  }
  snapCamera();
  return {
    renderer, scene, camera, keys, pad, envMap, chickens, npcs,
    get area() { return area.id; },
    get interactables() { return area.interactables; },
    nearest() { let best = null, bd = 3; for (const it of area.interactables) { const d = near(it); if (d < bd) { bd = d; best = it; } } return best; },
    onPadBack(fn) { onPadBack = fn; }, onPadButton(fn) { onPadButton = fn; },
    start() { if (!running) { running = true; last = performance.now(); requestAnimationFrame(frame); } },
    stop() { running = false; },
    pause(v) { paused = v; if (v) { move.x = move.y = 0; autoTarget = null; autoInteract = null; joyPid = null; restJoy(); } },
    setOverride(o) { override = o; restJoy(); if (o) { onPrompt(null); nearest = null; const { W, H } = this.size(); o.camera.aspect = W / H; o.camera.updateProjectionMatrix(); } else cursor.style.display = "none"; },
    get override() { return override; },
    enter(id) { const a = areas[id]; if (!a || !a.spawn) return; moveTo(a, a.spawn.x, a.spawn.z, Math.PI); },
    exit() { const d = areas.out.doors.find((d) => d.id === area.id); if (d) moveTo(areas.out, d.outX, d.outZ, d.yaw); },
    goOutsideTo(id) { const d = areas.out.doors.find((d) => d.id === id); if (d) moveTo(areas.out, d.outX, d.outZ, d.yaw); },
    setSpeedBoost(m) { speedBoost = m; },
    setNests(full) { if (areas.coop.nestEggs) areas.coop.nestEggs.visible = full; },
    setDelivery(npc, onArrive) { delivery = npc ? { npc, onArrive } : null; },
    refreshShelf() { if (area.id === "home") refreshShelf(area, getOwned()); },
    addChicken, setFlock, get yardCount() { return yardHens.length; },
    setAvatar(a) { const ry = kid.group.rotation.y; scene.remove(kid.group); const k = makeKid(a); kid.group = k.group; kid.walk = k.walk; kid.parts = k.parts; kid.group.add(carry); kid.group.position.set(player.x, 0, player.z); kid.group.rotation.y = ry; scene.add(kid.group); },
    focusPlayer(on) { focus = on; if (on) player.yaw = camYaw + Math.PI; },
    teleport(x, z) { player.x = x; player.z = z; },
    playerPos: () => ({ x: player.x, z: player.z }),
    size: () => ({ W: canvas.clientWidth || innerWidth, H: canvas.clientHeight || innerHeight }),
    stats: () => ({ calls: renderer.info.render.calls, triangles: renderer.info.render.triangles, fps: Math.round(1 / emaDt), resScale, area: area.id }),
  };
}
function collide(p, o, onHit) {
  const R = 0.45; const nx = clamp(p.x, o.x - o.w / 2, o.x + o.w / 2), nz = clamp(p.z, o.z - o.d / 2, o.z + o.d / 2); const dx = p.x - nx, dz = p.z - nz, d = Math.hypot(dx, dz);
  if (d >= R) return;
  if (d < 1e-4) { const px = Math.min(Math.abs(p.x - (o.x - o.w / 2)), Math.abs(o.x + o.w / 2 - p.x)), pz = Math.min(Math.abs(p.z - (o.z - o.d / 2)), Math.abs(o.z + o.d / 2 - p.z)); if (px < pz) p.x = p.x < o.x ? o.x - o.w / 2 - R : o.x + o.w / 2 + R; else p.z = p.z < o.z ? o.z - o.d / 2 - R : o.z + o.d / 2 + R; }
  else { p.x = nx + (dx / d) * R; p.z = nz + (dz / d) * R; }
  onHit();
}

// ==========================================================================
//  Shared bits
// ==========================================================================
const css = (c) => `#${new THREE.Color(c).getHexString()}`;
function canvasTex(w, h, draw, repeat = 1) { const c = document.createElement("canvas"); c.width = w; c.height = h; draw(c.getContext("2d"), w, h); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(repeat, repeat); t.anisotropy = 8; return t; }
function stripeTex(a, b) { return canvasTex(256, 32, (g, w, h) => { for (let i = 0; i < 8; i++) { g.fillStyle = i % 2 ? b : a; g.fillRect((i * w) / 8, 0, w / 8 + 1, h); } g.fillStyle = "rgba(0,0,0,.08)"; g.fillRect(0, h - 4, w, 4); }); }
const tileTex = (a, b, n = 8) => canvasTex(256, 256, (g, w) => { const s = w / n; for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) { g.fillStyle = (x + y) % 2 ? a : b; g.fillRect(x * s, y * s, s, s); } g.strokeStyle = "rgba(0,0,0,.06)"; for (let i = 0; i <= n; i++) { g.beginPath(); g.moveTo(i * s, 0); g.lineTo(i * s, w); g.stroke(); g.beginPath(); g.moveTo(0, i * s); g.lineTo(w, i * s); g.stroke(); } });
const plankTex = (c) => canvasTex(256, 256, (g, w) => { const base = new THREE.Color(c); for (let i = 0; i < 8; i++) { const d = base.clone().offsetHSL(0, 0, rnd(-0.05, 0.05)); g.fillStyle = `#${d.getHexString()}`; g.fillRect(0, (i * w) / 8, w, w / 8); g.fillStyle = "rgba(0,0,0,.18)"; g.fillRect(0, (i * w) / 8, w, 2); g.fillRect(rnd(0, w), (i * w) / 8, 2, w / 8); } for (let i = 0; i < 300; i++) { g.fillStyle = "rgba(0,0,0,.05)"; g.fillRect(rnd(0, w), rnd(0, w), rnd(10, 40), 1); } });
// an invisible box you can tap / walk up to
function hitZone(group, it, w, h, d, x, y, z) { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), new THREE.MeshBasicMaterial({ colorWrite: false, depthWrite: false })); m.position.set(x, y, z); m.userData.dyn = true; m.userData.interactable = it; group.add(m); it.hit = m; return m; }
function decoDumpling(id, s, x, y, z, ry = 0) { const d = buildDumpling(id, { lod: 0.4 }); d.scale.setScalar(s); d.position.set(x, y, z); d.rotation.y = ry; d.userData.noMerge = true; return d; }
function table(g, x, z, top = 0xffffff, legs = 0x8a5a2b) { g.add(cyl(0.9, 0.9, 0.08, mat.std(top, { roughness: 0.5 }), 24, x, 1.0, z), cyl(0.08, 0.12, 1.0, mat.std(legs), 10, x, 0.5, z), cyl(0.5, 0.5, 0.05, mat.std(legs), 16, x, 0.03, z)); for (const a of [0, Math.PI]) g.add(cyl(0.32, 0.32, 0.08, mat.std(0xff8ac8), 16, x + Math.cos(a) * 1.35, 0.62, z + Math.sin(a) * 1.35), cyl(0.05, 0.05, 0.6, mat.std(legs), 8, x + Math.cos(a) * 1.35, 0.3, z + Math.sin(a) * 1.35)); }
function lantern(g, x, y, z, color = 0xe8322f, s = 1) { const m = new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 0.55, roughness: 0.6 }), cap = mat.gloss(0xd4a017); const b = sphere(0.36 * s, m, x, y, z, 16); b.scale.y = 1.2; g.add(b, cyl(0.2 * s, 0.2 * s, 0.08, cap, 12, x, y + 0.44 * s, z), cyl(0.2 * s, 0.2 * s, 0.08, cap, 12, x, y - 0.44 * s, z), cyl(0.02, 0.02, 0.3, mat.std(0xffd54a), 6, x, y - 0.62 * s, z)); }

// ==========================================================================
//  Shops — the building outside (with a door you can walk through) and the
//  room inside (keeper, counter, shelves, decorations).
// ==========================================================================
export const SHOPS = [
  { id: "house", name: "Steamy Dumpling House", sign: "🥟 Steamy Dumpling House", x: 0, z: -30, ry: 0, w: 16, d: 9, h: 7, wall: 0xc0392b, trim: 0xffd54a, roof: 0x7b1f1a, awning: ["#ffffff", "#e53935"],
    inside: { w: 20, d: 15, h: 6.5, floor: ["#ffffff", "#e8d8c8"], wall: 0xfff1df, bg: 0x5a2a1a, keeper: { shirt: 0xffffff, hair: 0x222222, hairStyle: "short", skin: 0xf1c9a5 }, counter: "🥟 Buy a steamer" } },
  { id: "cafe", name: "Sweet Mochi Café", sign: "🍡 Sweet Mochi Café", x: -24, z: -13, ry: 0, w: 12, d: 7, h: 5, wall: 0xffb3d1, trim: 0xffffff, roof: 0xff7aa8, awning: ["#ffffff", "#ff8ac8"],
    inside: { w: 18, d: 13, h: 5.5, floor: ["#ffe3ef", "#ffffff"], wall: 0xffe8f1, bg: 0x6a3050, keeper: { shirt: 0xff8ac8, hair: 0xe8c36a, hairStyle: "bun", skin: 0xffd6b8 }, counter: "🍡 Shop sweets" } },
  { id: "lucky", name: "Lucky Lantern Shop", sign: "🏮 Lucky Lantern", x: 24, z: -13, ry: 0, w: 12, d: 7, h: 5.4, wall: 0x8e1b1b, trim: 0xffc93c, roof: 0x3a0f0f, awning: ["#ffc93c", "#c62828"],
    inside: { w: 18, d: 13, h: 6, floor: ["#5a1414", "#6e1a1a"], wall: 0x7a1717, bg: 0x2a0808, keeper: { shirt: 0xffc93c, hair: 0x6b3e1e, hairStyle: "ponytail", skin: 0xc68642 }, counter: "🏮 Lucky steamers" } },
  { id: "coop", name: "Farmer Fran's Barn", sign: "🐔 Farmer Fran's Barn", x: -38, z: 2, ry: Math.PI / 2, w: 13, d: 9, h: 6, wall: 0xb5452f, trim: 0xffffff, roof: 0x5b4636, awning: ["#ffffff", "#4caf50"],
    inside: { w: 18, d: 14, h: 6.5, floor: ["#d9b65e", "#cfa94f"], wall: 0xa8452c, bg: 0x3a2010, keeper: { shirt: 0x4caf50, pants: 0x3d6bfd, hair: 0xa33a1e, hairStyle: "curly", hat: "🧢", skin: 0xffd6b8 }, counter: "🐔 Buy chickens" } },
  { id: "dress", name: "Dress-Up Boutique", sign: "👕 Dress-Up Boutique", x: -24, z: 15, ry: Math.PI, w: 12, d: 7, h: 5, wall: 0x7a3cff, trim: 0xffffff, roof: 0x3d1a8a, awning: ["#ffffff", "#9b6bff"],
    inside: { w: 16, d: 12, h: 5.5, floor: ["#efe6ff", "#ffffff"], wall: 0xf1e8ff, bg: 0x2a1a5e, keeper: { shirt: 0x00c853, hair: 0x222222, hairStyle: "long", skin: 0x8d5a3c }, counter: "👕 Shop hats & outfits" } },
  { id: "swap", name: "Swap Shop", sign: "🔄 Swap Shop", x: 24, z: 15, ry: Math.PI, w: 12, d: 7, h: 5, wall: 0x2e9d6a, trim: 0xfff3c4, roof: 0x1d5e40, awning: ["#fff3c4", "#2e9d6a"],
    inside: { w: 16, d: 12, h: 5.5, floor: ["#e8f5e9", "#ffffff"], wall: 0xe6f6ea, bg: 0x123d2a, keeper: { shirt: 0xffd54a, hair: 0xd7ccc8, hairStyle: "short", skin: 0xe0ac8a, hat: "🎩" }, counter: "🔄 Swap extras for coins" } },
  { id: "home", name: "My House", sign: "🏠 My House", x: 38, z: 2, ry: -Math.PI / 2, w: 13, d: 10, h: 6, wall: 0xfff3c4, trim: 0x3d8bfd, roof: 0x3d8bfd, awning: ["#ffffff", "#3d8bfd"],
    inside: { w: 28, d: 22, h: 6.5, floor: null, wall: 0xfff6e8, bg: 0x2a2040, keeper: null, counter: null } },
];
function buildBuilding(S, out, animated) {
  const g = new THREE.Group(); const wallM = mat.std(S.wall, { roughness: 0.8 }), trimM = mat.std(S.trim, { roughness: 0.6 }), roofM = mat.std(S.roof, { roughness: 0.7 });
  const { w, d, h } = S, doorW = 2.4, doorH = 3.2;
  g.add(box(w, h, 0.3, wallM, 0, h / 2, -d / 2), box(0.3, h, d, wallM, -w / 2, h / 2, 0), box(0.3, h, d, wallM, w / 2, h / 2, 0));
  g.add(box((w - doorW) / 2, h, 0.3, wallM, -(w + doorW) / 4, h / 2, d / 2), box((w - doorW) / 2, h, 0.3, wallM, (w + doorW) / 4, h / 2, d / 2), box(doorW, h - doorH, 0.3, wallM, 0, (h + doorH) / 2, d / 2));
  // doorway: warm glow from inside, a frame, a welcome mat
  g.add(box(doorW, doorH, 0.05, new THREE.MeshBasicMaterial({ color: 0xffd9a0 }), 0, doorH / 2, d / 2 - 0.3));
  g.add(box(0.22, doorH + 0.2, 0.42, trimM, -doorW / 2 - 0.1, doorH / 2, d / 2), box(0.22, doorH + 0.2, 0.42, trimM, doorW / 2 + 0.1, doorH / 2, d / 2), box(doorW + 0.44, 0.24, 0.42, trimM, 0, doorH + 0.1, d / 2));
  g.add(box(2.4, 0.04, 1.3, mat.std(0x7b4a2a, { roughness: 1 }), 0, 0.02, d / 2 + 0.9));
  // windows either side of the door, with flower boxes
  const winM = new THREE.MeshStandardMaterial({ color: 0xbfe8ff, emissive: 0xffe6b0, emissiveIntensity: 0.55, roughness: 0.1 });
  for (const s of [-1, 1]) { const x = s * (doorW / 2 + Math.min(2.4, w / 4)); g.add(box(1.9, 1.5, 0.06, winM, x, 2.2, d / 2 + 0.16), box(2.1, 0.14, 0.2, trimM, x, 1.4, d / 2 + 0.2), box(2.1, 0.14, 0.2, trimM, x, 3.0, d / 2 + 0.2), box(0.1, 1.5, 0.2, trimM, x, 2.2, d / 2 + 0.2));
    g.add(box(2.0, 0.3, 0.4, mat.std(0x8a5a2b), x, 1.2, d / 2 + 0.35)); for (let i = 0; i < 5; i++) g.add(sphere(0.13, mat.std(pick([0xff5d8f, 0xffd54a, 0xffffff, 0xb36bff])), x - 0.6 + i * 0.3, 1.45, d / 2 + 0.4, 8)); }
  g.add(box(w + 0.4, 0.2, 0.4, trimM, 0, h, d / 2), box(w + 0.4, 0.24, 0.36, trimM, 0, 0.12, d / 2 + 0.02));
  const roof = new THREE.Mesh(new THREE.ExtrudeGeometry(new THREE.Shape([new THREE.Vector2(-w / 2 - 0.6, 0), new THREE.Vector2(w / 2 + 0.6, 0), new THREE.Vector2(0, Math.min(3, w * 0.22))]), { depth: d + 1, bevelEnabled: false }), roofM); roof.position.set(0, h, -d / 2 - 0.5); g.add(roof);
  const aw = new THREE.Mesh(new THREE.PlaneGeometry(doorW + 1.6, 1.3, 1, 4), new THREE.MeshStandardMaterial({ map: stripeTex(...S.awning), side: THREE.DoubleSide, roughness: 0.8 })); aw.position.set(0, doorH + 0.75, d / 2 + 0.6); aw.rotation.x = -1.0; g.add(aw);
  const sign = textPlane([S.sign], Math.min(w - 0.8, 8), 1.0, { bg: css(S.trim), color: css(S.wall === 0xfff3c4 ? 0x3d8bfd : S.wall), size: 110 }); sign.position.set(0, h - 0.75, d / 2 + 0.17); g.add(sign);
  g.position.set(S.x, 0, S.z); g.rotation.y = S.ry; out.group.add(g);
  const deco = new THREE.Group(); deco.userData.noMerge = true; deco.position.copy(g.position); deco.rotation.y = S.ry; out.group.add(deco);
  roofDeco(S, deco, animated);
  const c = Math.abs(Math.cos(S.ry)), s = Math.abs(Math.sin(S.ry)); out.obstacles.push({ x: S.x, z: S.z, w: w * c + d * s, d: w * s + d * c, tall: true });
  const fwd = new THREE.Vector3(Math.sin(S.ry), 0, Math.cos(S.ry));
  const door = new THREE.Vector3(S.x, 0, S.z).addScaledVector(fwd, d / 2 + 0.25), outPos = new THREE.Vector3(S.x, 0, S.z).addScaledVector(fwd, d / 2 + 2.6);
  out.doors.push({ id: S.id, x: door.x, z: door.z, outX: outPos.x, outZ: outPos.z, yaw: S.ry });
  const it = { id: `door:${S.id}`, kind: "door", door: S.id, label: `🚪 Go inside`, name: S.name, front: outPos.clone() }; hitZone(out.group, it, w, h, d + 0.4, S.x, h / 2, S.z).rotation.y = S.ry; out.interactables.push(it);
}
function roofDeco(S, g, animated) {
  const { h } = S; const onRoof = (obj, s = 1, y = 0) => { obj.scale.setScalar(s); obj.position.set(0, h + 1.6 + y, 0); g.add(obj); return obj; };
  if (S.id === "house") { const big = onRoof(decoDumpling("classic-xlb", 1, 0, 0, 0), 1.6, 0.4); animated.push((dt, t) => { big.scale.y = 1.6 * (1 + Math.sin(t * 2) * 0.03); }); g.add(cyl(0.35, 0.4, 2, mat.std(0x6d6d6d), 12, 4, h + 1.2, -2)); }
  if (S.id === "cafe") { const m = onRoof(decoDumpling("strawberry-mochi", 1, 0, 0, 0), 1.3, 0.2); animated.push((dt, t) => { m.rotation.y = Math.sin(t * 0.6) * 0.4; }); }
  if (S.id === "lucky") { const m = onRoof(decoDumpling("golden-bao", 1, 0, 0, 0), 1.2, 0.3); animated.push((dt, t) => { m.rotation.y = t * 0.8; m.position.y = h + 1.9 + Math.sin(t * 2) * 0.15; }); }
  if (S.id === "coop") { const roost = makeChicken({ color: CHICKEN_COLORS[0] }); roost.group.scale.setScalar(2.2); roost.group.position.set(0, h + 1.5, 0); g.add(roost.group); animated.push((dt, t) => roost.update(dt, t, 0, Math.sin(t) > 0.5)); }
  if (S.id === "dress") onRoof(emojiSprite("👗", 2), 1, 0.4);
  if (S.id === "swap") onRoof(emojiSprite("🔄", 2), 1, 0.4);
  if (S.id === "home") { onRoof(emojiSprite("🏠", 2), 1, 0.4); g.add(cyl(0.3, 0.3, 1.6, mat.std(0xb5452f), 10, -3, h + 1.4, -1)); }
}
function buildInterior(S, ox) {
  const I = S.inside, { w, d, h } = I, g = new THREE.Group(); g.position.x = ox;
  const a = { id: S.id, group: g, minX: ox - w / 2, maxX: ox + w / 2, minZ: -d / 2, maxZ: d / 2, ceil: h, obstacles: [], interactables: [], doors: [], keepers: [], late: [], steam: [], bg: I.bg, spawn: { x: ox, z: d / 2 - 4.6 } };
  const obst = (x, z, ww, dd) => a.obstacles.push({ x: ox + x, z, w: ww, d: dd });
  // floor, walls, ceiling
  const floorM = new THREE.MeshStandardMaterial({ map: I.floor ? tileTex(...I.floor) : plankTex(0xb8834f), roughness: I.floor ? 0.6 : 0.75 }); floorM.map.repeat.set(w / 4, d / 4);
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(w, d), floorM); floor.rotation.x = -Math.PI / 2; g.add(floor);
  const wallM = mat.std(I.wall, { roughness: 0.9 }), baseM = mat.std(new THREE.Color(I.wall).offsetHSL(0, 0, -0.25).getHex());
  g.add(box(w, h, 0.3, wallM, 0, h / 2, -d / 2), box(0.3, h, d, wallM, -w / 2, h / 2, 0), box(0.3, h, d, wallM, w / 2, h / 2, 0));
  const doorW = 2.4, doorH = 3.2; g.add(box((w - doorW) / 2, h, 0.3, wallM, -(w + doorW) / 4, h / 2, d / 2), box((w - doorW) / 2, h, 0.3, wallM, (w + doorW) / 4, h / 2, d / 2), box(doorW, h - doorH, 0.3, wallM, 0, (h + doorH) / 2, d / 2));
  g.add(box(w, 0.5, 0.32, baseM, 0, 0.25, -d / 2 + 0.01), box(0.32, 0.5, d, baseM, -w / 2 + 0.01, 0.25, 0), box(0.32, 0.5, d, baseM, w / 2 - 0.01, 0.25, 0));
  g.add(box(doorW, doorH, 0.05, new THREE.MeshBasicMaterial({ color: 0xbfe3ff }), 0, doorH / 2, d / 2 + 0.2)); // daylight through the open door
  g.add(box(2.4, 0.04, 1.3, mat.std(0x7b4a2a, { roughness: 1 }), 0, 0.02, d / 2 - 0.9));
  const exitSign = textPlane(["🚪 Exit"], 1.4, 0.45, { bg: "#2e9d6a", color: "#fff", size: 90 }); exitSign.position.set(0, doorH + 0.5, d / 2 - 0.17); exitSign.rotation.y = Math.PI; g.add(exitSign);
  const ceil = new THREE.Mesh(new THREE.PlaneGeometry(w, d), mat.std(new THREE.Color(I.wall).offsetHSL(0, 0, -0.1).getHex())); ceil.rotation.x = Math.PI / 2; ceil.position.y = h; g.add(ceil);
  // windows with daylight and warm ceiling lamps
  const winM = new THREE.MeshBasicMaterial({ color: 0xcdeeff }), frameM = mat.std(0xffffff);
  for (const s of [-1, 1]) for (const z of [-d / 4, d / 4]) g.add(box(0.06, 1.6, 2.2, winM, s * (w / 2 - 0.17), 2.4, z), box(0.12, 0.14, 2.4, frameM, s * (w / 2 - 0.2), 1.6, z), box(0.12, 0.14, 2.4, frameM, s * (w / 2 - 0.2), 3.2, z));
  const lampM = new THREE.MeshStandardMaterial({ color: 0xfff3d0, emissive: 0xffe2a0, emissiveIntensity: 1.2 });
  for (const x of [-w / 4, w / 4]) for (const z of [-d / 4, d / 4]) g.add(cyl(0.02, 0.02, 0.8, mat.std(0x333333), 6, x, h - 0.4, z), sphere(0.32, lampM, x, h - 0.9, z, 14));
  // the exit door trigger + the counter
  a.doors.push({ id: S.id, x: ox, z: d / 2 - 0.3 });
  const counterZ = -d / 2 + 3;
  if (I.counter) {
    const cM = mat.wood(0xc58a4a), topM = mat.std(S.trim === 0xffffff ? 0xffd54a : S.trim, { roughness: 0.4 });
    g.add(box(w * 0.5, 1.2, 1.0, cM, 0, 0.6, counterZ), box(w * 0.5 + 0.2, 0.12, 1.2, topM, 0, 1.26, counterZ)); obst(0, counterZ, w * 0.5, 1.0);
    const it = { id: S.id, kind: "shop", label: I.counter, name: S.name, front: new THREE.Vector3(ox, 0, counterZ + 2.2) }; hitZone(g, it, w * 0.5, 2.4, 1.4, 0, 1.2, counterZ); a.interactables.push(it);
    if (I.keeper) a.keepers.push({ look: I.keeper, x: ox, z: counterZ - 1.3, ry: 0 });
    const shelfM = mat.wood(0xa0703a); for (const y of [2.0, 3.0]) g.add(box(w * 0.7, 0.1, 0.6, shelfM, 0, y, -d / 2 + 0.5));
    const sign = textPlane([S.sign], Math.min(8, w * 0.6), 0.9, { bg: css(S.wall), color: "#fff", size: 100 }); sign.position.set(0, h - 1.1, -d / 2 + 0.17); g.add(sign);
  }
  interiorDeco(S, g, a, { w, d, h, ox, counterZ, obst });
  return a;
}
const MANNEQUINS = [[-4.5, 3.4], [4.5, 3.4], [-4.5, 0.2]];
function interiorDeco(S, g, a, { w, d, h, ox, counterZ, obst }) {
  const shelfItems = (ids, y, s = 0.32) => ids.forEach((id, i) => g.add(decoDumpling(id, s, -w * 0.32 + (i + 0.5) * ((w * 0.64) / ids.length), y + 0.05, -d / 2 + 0.5, 0.3)));
  const addIt = (it, x, z, hw = 2, hh = 2.5, hd = 1) => { it.front = new THREE.Vector3(ox + it.fx, 0, it.fz); hitZone(g, it, hw, hh, hd, x, hh / 2, z); a.interactables.push(it); };
  if (S.id === "house") {
    for (const y of [2.0, 3.0]) for (let i = 0; i < 6; i++) { const st = makeSteamer(0.38, 0.18); st.position.set(-w * 0.3 + i * ((w * 0.6) / 5), y + 0.05, -d / 2 + 0.5); g.add(st); }
    for (let i = 0; i < 4; i++) { const st = makeSteamer(0.45, 0.22); st.position.set(-2.4 + (i % 2) * 0.1, 1.32 + i * 0.27, counterZ); g.add(st); }
    // the kitchen stove with steaming baskets
    g.add(box(4, 1.0, 1.4, mat.metal(0xb0b8c0), w / 2 - 2.4, 0.5, -d / 2 + 0.9)); obst(w / 2 - 2.4, -d / 2 + 0.9, 4, 1.4);
    for (let i = 0; i < 3; i++) { const st = makeSteamer(0.5, 0.24); st.position.set(w / 2 - 3.6 + i * 1.2, 1.0, -d / 2 + 0.9); g.add(st); a.steam.push([ox + w / 2 - 3.6 + i * 1.2, 1.6, -d / 2 + 0.9]); }
    for (const [x, z] of [[-5, 1.5], [5, 1.5], [-5, 4.5], [5, 4.5]]) { table(g, x, z, 0xffffff, 0x7b1f1a); obst(x, z, 1.8, 1.8); g.add(decoDumpling(pick(["classic-xlb", "classic-gyoza", "classic-shumai", "classic-bao"]), 0.28, x, 1.05, z)); }
    for (const x of [-6, -2, 2, 6]) lantern(g, x, h - 1.2, 0);
    // the delivery board (the job!)
    const board = textPlane(["🛵 DELIVERY JOBS", "Help deliver dumplings!", "Earn coins + tips"], 2.6, 1.8, { bg: "#2e9d6a", color: "#fff", size: 54 }); board.position.set(-w / 2 + 0.22, 2.3, -1); board.rotation.y = Math.PI / 2; g.add(board); g.add(box(0.1, 2.0, 2.8, mat.wood(0x8a5a2b), -w / 2 + 0.16, 2.3, -1));
    addIt({ id: "delivery", kind: "job", label: "🛵 Start a delivery job", fx: -w / 2 + 2, fz: -1 }, -w / 2 + 0.5, -1, 1, 2.5, 3);
  }
  if (S.id === "cafe") {
    const glassM = new THREE.MeshPhysicalMaterial({ color: 0xdff6ff, transparent: true, opacity: 0.25, roughness: 0.05 }); g.add(box(4, 1.0, 1.0, mat.std(0xffffff), 6.5, 0.5, counterZ + 2.2), box(4, 0.9, 1.0, glassM, 6.5, 1.45, counterZ + 2.2)); obst(6.5, counterZ + 2.2, 4, 1);
    ["strawberry-mochi", "cotton-tangyuan", "lemon-mochi", "blueberry-mochi", "rainbow-tangyuan"].forEach((id, i) => g.add(decoDumpling(id, 0.22, 4.9 + i * 0.8, 1.05, counterZ + 2.2)));
    shelfItems(["strawberry-bao", "cotton-mochi", "lemon-tangyuan", "choco-mochi", "blueberry-bao", "strawberry-tangyuan"], 2.0); shelfItems(["cotton-bao", "choco-tangyuan", "lemon-bao", "strawberry-momo", "cotton-momo", "choco-bao"], 3.0);
    for (const [x, z] of [[-5.5, 1], [-5.5, 4], [0, 3.8], [5, 4]]) { table(g, x, z, 0xffffff, 0xff8ac8); obst(x, z, 1.8, 1.8); g.add(cyl(0.3, 0.2, 0.05, mat.std(0xffffff), 16, x, 1.06, z)); g.add(decoDumpling(pick(["strawberry-mochi", "cotton-tangyuan", "choco-mochi"]), 0.2, x, 1.08, z)); }
  }
  if (S.id === "lucky") {
    for (let i = 0; i < 14; i++) lantern(g, -w / 2 + 1.5 + ((i % 7) * (w - 3)) / 6, h - 1 - (i % 2) * 0.5, -3 + Math.floor(i / 7) * 5, i % 3 ? 0xe8322f : 0xffc93c);
    const ped = mat.std(0xffc93c, { roughness: 0.3, metalness: 0.6 });
    for (const [i, id] of ["golden-bao", "starlight", "galaxy-momo", "rainbow-xlb"].entries()) { const x = [-6, -3.4, 3.4, 6][i], z = -0.6; g.add(cyl(0.6, 0.7, 1.1, ped, 20, x, 0.55, z)); obst(x, z, 1.3, 1.3); const dm = decoDumpling(id, 0.4, x, 1.12, z); g.add(dm); a.late.push((anim) => anim.push((dt, t) => { dm.rotation.y = t * 0.9 + i; })); }
    shelfItems(["galaxy-xlb", "ocean-mochi", "rainbow-gyoza", "galaxy-bao", "ocean-tangyuan", "rainbow-shumai"], 2.0); shelfItems(["golden-bao", "galaxy-wonton", "rainbow-momo", "ocean-bao", "galaxy-shumai", "rainbow-bao"], 3.0);
  }
  if (S.id === "coop") {
    const hay = mat.std(0xe0c060, { roughness: 1 });
    for (const [x, y, z] of [[-7, 0.35, -4], [-6, 0.35, -4], [-6.5, 1.0, -4], [7, 0.35, 4], [7, 0.35, 3], [-7, 0.35, 4]]) g.add(box(0.95, 0.65, 0.7, hay, x, y, z));
    obst(-6.5, -4, 2.2, 1); obst(7, 3.5, 1, 2); obst(-7, 4, 1, 0.8);
    const nest = new THREE.Group(); nest.userData.noMerge = true; g.add(nest); a.nestEggs = nest;
    for (let i = 0; i < 5; i++) { const x = -w / 2 + 2 + i * 1.3; g.add(box(1.1, 0.8, 0.8, mat.wood(0xb8894a), x, 2.2, -d / 2 + 0.5)); for (let k = 0; k < 2; k++) { const e = makeEgg(i === 2 && k === 0); e.position.set(x - 0.2 + k * 0.4, 2.0, -d / 2 + 0.6); nest.add(e); } }
    addIt({ id: "nests", kind: "nests", label: "🥚 Collect eggs from the nests", fx: -w / 2 + 4.6, fz: -d / 2 + 2.6 }, -w / 2 + 4.6, -d / 2 + 0.5, 6.6, 3, 1.2);
    a.late.push((anim) => { for (let i = 0; i < 4; i++) { const ch = makeChicken({ color: CHICKEN_COLORS[(i + 1) % CHICKEN_COLORS.length] }); ch.group.scale.setScalar(1.2); g.add(ch.group); const st = { x: rnd(-6, 6), z: rnd(0, 5), tx: 0, tz: 2, wait: rnd(0, 2) }; anim.push((dt, t) => { if (!g.visible) return; const dx = st.tx - st.x, dz = st.tz - st.z, dd = Math.hypot(dx, dz); let sp = 0; if (dd > 0.1) { sp = 1.2; st.x += (dx / dd) * sp * dt; st.z += (dz / dd) * sp * dt; ch.group.rotation.y = Math.atan2(dx, dz); } else if ((st.wait -= dt) < 0) { st.wait = rnd(1, 4); st.tx = rnd(-6, 6); st.tz = rnd(0.5, 5); } ch.group.position.set(st.x, 0, st.z); ch.update(dt, t + i, sp / 1.2, sp === 0); }); } });
  }
  if (S.id === "dress") {
    const mirrorM = new THREE.MeshPhysicalMaterial({ color: 0xe8f4ff, metalness: 1, roughness: 0.04 });
    const mir = box(2.2, 3.2, 0.08, mirrorM, w / 2 - 0.25, 1.9, 0); mir.rotation.y = Math.PI / 2; const fr = box(2.5, 3.5, 0.06, mat.gloss(0xffd54a), w / 2 - 0.2, 1.9, 0); fr.rotation.y = Math.PI / 2; g.add(mir, fr);
    addIt({ id: "mirror", kind: "look", label: "🪞 Change my look", fx: w / 2 - 2.2, fz: 0 }, w / 2 - 0.5, 0, 1, 3, 2.5);
    for (const z of [-2, 2]) { const x = -w / 2 + 1.5; const rail = cyl(0.03, 0.03, 3, mat.metal(), 8, x, 2.3, z); rail.rotation.x = Math.PI / 2; g.add(rail); [0xff3dd6, 0x3d8bfd, 0xffd54a, 0x00c853, 0x7a3cff].forEach((c, i) => g.add(box(0.12, 0.8, 0.5, mat.std(c), x, 1.8, z - 1.1 + i * 0.55))); obst(x, z, 0.8, 3.2); }
    a.late.push(() => { [{ shirt: 0xff7043, pants: 0x222244, hairStyle: "bun", hair: 0xff3dd6, hat: "👑" }, { shirt: 0x3d8bfd, pants: 0xeeeeee, hairStyle: "curly", hair: 0xe8c36a, hat: "🎀" }, { shirt: 0xffd54a, pants: 0x00c853, hairStyle: "short", hair: 0x222222, hat: "⭐" }].forEach((lk, i) => { const m = makeKid({ ...lk, skin: 0xeeeeee, mood: "happy" }); const [mx, mz] = MANNEQUINS[i]; m.group.position.set(mx, 0.3, mz); m.group.rotation.y = mx < 0 ? 0.6 : -0.6; m.group.add(cyl(0.45, 0.5, 0.3, mat.std(0xffffff), 20, 0, -0.15, 0)); g.add(m.group); }); });
    for (const [mx, mz] of MANNEQUINS) obst(mx, mz, 1.1, 1.1);
    const rug = new THREE.Mesh(new THREE.CircleGeometry(2.4, 32), mat.std(0xd9c2ff)); rug.rotation.x = -Math.PI / 2; rug.position.set(0, 0.02, 0); g.add(rug);
  }
  if (S.id === "swap") {
    const crate = mat.wood(0xb8894a); for (const [x, z] of [[-5, 2], [-4, 2], [-4.5, 3], [5, 3], [4, 3]]) { g.add(box(0.9, 0.9, 0.9, crate, x, 0.45, z)); obst(x, z, 1, 1); }
    shelfItems(CATALOG.filter((k, i) => i % 9 === 3).slice(0, 6).map((k) => k.id), 2.0); shelfItems(CATALOG.filter((k, i) => i % 11 === 5).slice(0, 6).map((k) => k.id), 3.0);
    const gold = mat.metal(0xffc93c), scale = new THREE.Group(); scale.add(cyl(0.05, 0.05, 1, gold, 8, 0, 0.5, 0), box(1.2, 0.05, 0.05, gold, 0, 1, 0), cyl(0.3, 0.25, 0.08, gold, 16, -0.55, 0.85, 0), cyl(0.3, 0.25, 0.08, gold, 16, 0.55, 0.85, 0)); scale.position.set(3, 1.32, counterZ); g.add(scale);
  }
  if (S.id === "home") {
    // shelves for your collection on three walls (filled in when you walk in)
    const shelfM = mat.wood(0x9c6a3a); a.shelfSlots = [];
    for (const y of [0.7, 1.6, 2.5, 3.4, 4.3]) {
      const backN = 24, sideN = 15;
      g.add(box(w - 3, 0.1, 0.7, shelfM, 0, y, -d / 2 + 0.45)); for (let i = 0; i < backN; i++) a.shelfSlots.push([-(w - 4) / 2 + i * ((w - 4) / (backN - 1)), y + 0.06, -d / 2 + 0.45, 0]);
      for (const s of [-1, 1]) { g.add(box(0.7, 0.1, d - 7, shelfM, s * (w / 2 - 0.45), y, -2)); for (let i = 0; i < sideN; i++) a.shelfSlots.push([s * (w / 2 - 0.45), y + 0.06, -2 - (d - 8) / 2 + i * ((d - 8) / (sideN - 1)), -s * Math.PI / 2]); }
    }
    obst(0, -d / 2 + 0.45, w - 4, 0.8); obst(-(w / 2 - 0.45), -2, 0.8, d - 7); obst(w / 2 - 0.45, -2, 0.8, d - 7);
    const shelfGroup = new THREE.Group(); shelfGroup.userData.noMerge = true; g.add(shelfGroup); a.shelfGroup = shelfGroup;
    // cosy bits: a rug, a bed, a desk with the dumpling book
    const rug = new THREE.Mesh(new THREE.CircleGeometry(3.2, 40), mat.std(0xff9ec6, { roughness: 1 })); rug.rotation.x = -Math.PI / 2; rug.position.set(0, 0.02, 1.5); g.add(rug);
    g.add(box(2.6, 0.6, 4, mat.std(0xffffff), -w / 2 + 2.6, 0.3, d / 2 - 3.4), box(2.6, 0.3, 4, mat.std(0x7ab8ff), -w / 2 + 2.6, 0.75, d / 2 - 3.4), box(2.2, 0.35, 0.9, mat.std(0xffffff), -w / 2 + 2.6, 0.95, d / 2 - 4.9), box(2.8, 1.4, 0.2, mat.wood(0x9c6a3a), -w / 2 + 2.6, 0.7, d / 2 - 5.5)); obst(-w / 2 + 2.6, d / 2 - 3.5, 2.8, 4.4);
    g.add(box(2.4, 0.1, 1.2, mat.wood(0xc58a4a), w / 2 - 2.4, 1.0, d / 2 - 3), box(0.1, 1, 0.1, mat.std(0x5a3a22), w / 2 - 3.5, 0.5, d / 2 - 3.5), box(0.1, 1, 0.1, mat.std(0x5a3a22), w / 2 - 1.3, 0.5, d / 2 - 2.5)); obst(w / 2 - 2.4, d / 2 - 3, 2.4, 1.2);
    g.add(box(0.7, 0.12, 0.5, mat.std(0xe53935), w / 2 - 2.4, 1.11, d / 2 - 3)); const bk = emojiSprite("📖", 0.7); bk.position.set(w / 2 - 2.4, 1.7, d / 2 - 3); g.add(bk);
    addIt({ id: "book", kind: "book", label: "📖 Open my Dumpling Book", fx: w / 2 - 2.4, fz: d / 2 - 1.4 }, w / 2 - 2.4, d / 2 - 3, 2.4, 2.2, 1.4);
    const wel = textPlane(["🥟 My Dumpling Collection 🥟"], 7, 0.8, { bg: "#3d8bfd", color: "#fff", size: 90 }); wel.position.set(0, h - 0.9, -d / 2 + 0.17); g.add(wel);
  }
}
function refreshShelf(a, owned) {
  const g = a.shelfGroup; if (!g) return; const key = CATALOG.filter((k) => owned[k.id]).map((k) => k.id).join(","); if (key === a.shelfKey) return; a.shelfKey = key; while (g.children.length) { const c = g.children.pop(); c.traverse((o) => { if (o.geometry) o.geometry.dispose(); }); }
  const have = CATALOG.filter((k) => owned[k.id]);
  // dumplings built at low detail, then merged by shared material (faces etc.) so the room stays quick
  have.slice(0, a.shelfSlots.length).forEach((k, i) => { const [x, y, z, ry] = a.shelfSlots[i]; const dm = buildDumpling(k.id, { lod: 0.35 }); dm.scale.setScalar(0.36); dm.position.set(x, y, z); dm.rotation.y = ry; dm.updateMatrix(); for (const m of [...dm.children]) { m.applyMatrix4(dm.matrix); g.add(m); } });
  mergeStatic(g);
}
// a townsperson / shopkeeper: the static bits (head, hair, face) merged into a few draw calls
function liteKid(look) { const k = makeKid(look); mergeStatic(k.group); return k; }
function addKeeper(group, k, animated) {
  const kid = liteKid({ mood: "happy", ...k.look }); kid.group.position.set(k.x - group.position.x, 0, k.z); kid.group.rotation.y = k.ry; group.add(kid.group); const ph = Math.random() * 5;
  animated.push((dt, t) => { if (!group.visible) return; kid.walk(t, 0, dt); kid.group.rotation.y = k.ry + Math.sin(t * 0.5 + ph) * 0.25; });
}

// ==========================================================================
//  Outdoors — grass, cobbled streets, a central plaza with a fountain,
//  lanterns, a duck pond, trees, lamp posts and the Dumpling Catch booth.
// ==========================================================================
const TOWNSFOLK = [
  { name: "Sam", x: -8, z: 8, r: 4, look: { shirt: 0x3d8bfd, hair: 0x222222, hairStyle: "short", skin: 0x8d5a3c } },
  { name: "Mia", x: 10, z: -6, r: 4, look: { shirt: 0xff8ac8, hair: 0xe8c36a, hairStyle: "ponytail", skin: 0xffd6b8 } },
  { name: "Leo", x: -16, z: 21, r: 3, look: { shirt: 0x00c853, hair: 0xa33a1e, hairStyle: "curly", skin: 0xf1c9a5, hat: "🧢" } },
  { name: "Ava", x: 32, z: 28, r: 4, look: { shirt: 0xffd54a, hair: 0x6b3e1e, hairStyle: "bun", skin: 0xc68642 } },
  { name: "Kai", x: 34, z: -30, r: 5, look: { shirt: 0x7a3cff, hair: 0x222222, hairStyle: "short", skin: 0xe0ac8a } },
  { name: "Zoe", x: -34, z: -30, r: 5, look: { shirt: 0xff7043, hair: 0xd7ccc8, hairStyle: "long", skin: 0xffd6b8, hat: "🌸" } },
  { name: "Noah", x: 0, z: 20, r: 5, look: { shirt: 0xffffff, hair: 0x8a5a2b, hairStyle: "short", skin: 0x5c3a21 } },
  { name: "Lily", x: -14, z: -24, r: 3, look: { shirt: 0x00e5ff, hair: 0x3d8bfd, hairStyle: "long", skin: 0xf1c9a5 } },
  { name: "Max", x: 16, z: -24, r: 3, look: { shirt: 0xe53935, hair: 0xe8c36a, hairStyle: "curly", skin: 0xffd6b8, hat: "🎩" } },
  { name: "Ruby", x: 40, z: 22, r: 3, look: { shirt: 0xff3dd6, hair: 0x222222, hairStyle: "ponytail", skin: 0x8d5a3c } },
];
const POND = { x: -26, z: 31, r: 7 };
const YARD = { x: 36.5, z: -15, w: 11, d: 7 };
function buildOutdoor(g, a, animated) {
  const sky = canvasTex(4, 256, (c, w, h) => { const gr = c.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, "#5fb6ff"); gr.addColorStop(0.55, "#bfe3ff"); gr.addColorStop(1, "#ffe6f1"); c.fillStyle = gr; c.fillRect(0, 0, w, h); });
  const dome = new THREE.Mesh(new THREE.SphereGeometry(220, 32, 16), new THREE.MeshBasicMaterial({ map: sky, side: THREE.BackSide, fog: false, depthWrite: false })); dome.userData.dyn = true; g.add(dome);
  const grass = canvasTex(256, 256, (c, w) => { c.fillStyle = "#7cc56a"; c.fillRect(0, 0, w, w); for (let i = 0; i < 3000; i++) { c.fillStyle = `rgba(${rnd(40, 110) | 0},${rnd(140, 200) | 0},${rnd(50, 90) | 0},.5)`; c.fillRect(rnd(0, w), rnd(0, w), 2, rnd(2, 5)); } }, 60);
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(460, 460), new THREE.MeshStandardMaterial({ map: grass, roughness: 1 })); ground.rotation.x = -Math.PI / 2; ground.position.y = -0.01; g.add(ground);
  const cobble = canvasTex(512, 512, (c, w) => { c.fillStyle = "#b9a58f"; c.fillRect(0, 0, w, w); const s = 32; for (let y = 0; y < w; y += s) for (let x = -s; x < w; x += s) { const ox = (y / s) % 2 ? s / 2 : 0; const v = rnd(-18, 18); c.fillStyle = `rgb(${222 + v},${205 + v},${184 + v})`; c.beginPath(); c.roundRect(x + ox + 2, y + 2, s - 4, s - 4, 7); c.fill(); } });
  const pave = (x, z, w, d, y = 0) => { const t = cobble.clone(); t.needsUpdate = true; t.repeat.set(w / 5, d / 5); const m = new THREE.Mesh(new THREE.PlaneGeometry(w, d), new THREE.MeshStandardMaterial({ map: t, roughness: 0.9 })); m.rotation.x = -Math.PI / 2; m.position.set(x, y, z); g.add(m); };
  pave(0, 0, 40, 34, 0.004); pave(0, 0, 9, 84, 0.002); pave(0, 0, 92, 9, 0.003);
  for (const S of SHOPS) { const fx = Math.sin(S.ry), fz = Math.cos(S.ry), L = 8; const cx = S.x + fx * (S.d / 2 + L / 2), cz = S.z + fz * (S.d / 2 + L / 2); pave(cx, cz, Math.abs(fz) > 0.5 ? 4 : L, Math.abs(fz) > 0.5 ? L : 4, 0.001); }
  // hedges round the edge, with a gap at the south gate
  const hedgeM = mat.std(0x3f9a4a, { roughness: 1 });
  for (const [x, z, w, d] of [[0, OUT.minZ - 0.5, 94, 1], [OUT.minX - 0.5, 0, 1, 86], [OUT.maxX + 0.5, 0, 1, 86], [-26, OUT.maxZ + 0.5, 42, 1], [26, OUT.maxZ + 0.5, 42, 1]]) g.add(box(w, 1.1, d, hedgeM, x, 0.55, z));
  // hills & clouds far away
  const hillM = mat.std(0x6db35c, { roughness: 1 }), hillM2 = mat.std(0x8cc97a, { roughness: 1 });
  for (let i = 0; i < 16; i++) { const an = (i / 16) * Math.PI * 2, r = rnd(110, 150); const h = sphere(rnd(22, 38), i % 2 ? hillM : hillM2, Math.cos(an) * r, -8, Math.sin(an) * r, 20); h.scale.y = rnd(0.5, 0.9); g.add(h); }
  const cloudM = mat.std(0xffffff, { roughness: 1, emissive: 0xffffff, emissiveIntensity: 0.25 });
  for (let i = 0; i < 10; i++) { const c = new THREE.Group(); c.userData.dyn = true; c.userData.noMerge = true; for (let k = 0; k < 5; k++) c.add(sphere(rnd(2.5, 4.5), cloudM, k * 3 - 6, rnd(-0.8, 0.8), rnd(-1.5, 1.5), 14)); c.scale.y = 0.6; const an = (i / 10) * Math.PI * 2; c.position.set(Math.cos(an) * 110, rnd(34, 55), Math.sin(an) * 110); g.add(c); animated.push((dt) => { c.position.x += dt * 1.2; if (c.position.x > 150) c.position.x = -150; }); }
  // trees: cherry blossoms and leafy ones round the edges and the park
  const trunkM = mat.std(0x7a4f2e, { roughness: 1 }), pinkM = mat.std(0xffb7d5, { roughness: 0.9 }), pinkM2 = mat.std(0xff9ec6, { roughness: 0.9 }), leafM = mat.std(0x4caf50, { roughness: 0.9 }), leafM2 = mat.std(0x66bb6a, { roughness: 0.9 });
  const tree = (x, z, blossom, s = 1) => { g.add(cyl(0.22 * s, 0.32 * s, 2.6 * s, trunkM, 10, x, 1.3 * s, z)); for (let k = 0; k < 4; k++) g.add(sphere(rnd(1.1, 1.6) * s, blossom ? (k % 2 ? pinkM : pinkM2) : k % 2 ? leafM : leafM2, x + rnd(-0.9, 0.9) * s, (3.1 + rnd(0, 1.1)) * s, z + rnd(-0.9, 0.9) * s, 14)); const sh = blobShadow(2 * s, 0.3); sh.position.set(x, 0.02, z); g.add(sh); a.obstacles.push({ x, z, w: 0.6 * s, d: 0.6 * s }); };
  [[-43, -38], [-36, -39], [-28, -40], [28, -40], [36, -39], [43, -38], [-43, -20], [43, -20], [-43, 20], [43, 20], [-44, 38], [44, 38], [-12, 40], [12, 40], [-16, -40], [16, -40], [-34, 18], [32, 19], [-12, 33], [14, 36], [36, 37], [-38, 38], [-10, -22], [10, -22], [-40, -16], [44, -26], [8, 30]].forEach(([x, z], i) => tree(x, z, i % 3 !== 1, rnd(0.9, 1.25)));
  // lamp posts along the streets
  const postM = mat.std(0x2f3542, { roughness: 0.5, metalness: 0.5 }), bulbM = new THREE.MeshStandardMaterial({ color: 0xfff3c4, emissive: 0xffe08a, emissiveIntensity: 1 });
  for (const [x, z] of [[-6, -38], [6, -38], [-6, 26], [6, 26], [-6, 38], [6, 38], [-30, -6], [-30, 6], [30, -6], [30, 6], [-43, -6], [43, -6], [-43, 6], [43, 6]]) { g.add(cyl(0.08, 0.12, 4, postM, 8, x, 2, z), sphere(0.3, bulbM, x, 4.15, z, 12), cyl(0.32, 0.18, 0.18, postM, 10, x, 4.45, z)); a.obstacles.push({ x, z, w: 0.3, d: 0.3 }); }
  // benches & flower tubs
  const benchM = mat.wood(0xa8703a), ironM = mat.std(0x333344, { roughness: 0.5, metalness: 0.6 });
  for (const [x, z, r] of [[-9, 6, 0.6], [9, 6, -0.6], [-9, -7, 2.5], [9, -7, -2.5], [-16, 25, 0.9], [-36, 26, -0.9], [16, 30, 0]]) { const b = new THREE.Group(); b.add(box(2.2, 0.12, 0.6, benchM, 0, 0.55, 0), box(2.2, 0.5, 0.1, benchM, 0, 0.9, -0.28), box(0.1, 0.55, 0.5, ironM, -0.9, 0.27, 0), box(0.1, 0.55, 0.5, ironM, 0.9, 0.27, 0)); b.position.set(x, 0, z); b.rotation.y = r; g.add(b); a.obstacles.push({ x, z, w: 1.6, d: 1.6 }); }
  const potM = mat.std(0xc96f4a), flowerCols = [0xff5d8f, 0xffd54a, 0xffffff, 0xb36bff];
  for (const [x, z] of [[-6, 14], [6, 14], [-15, -12], [15, -12], [-14, 12], [14, 12]]) { g.add(cyl(0.7, 0.55, 0.7, potM, 16, x, 0.35, z), cyl(0.65, 0.65, 0.08, mat.std(0x5a3a22), 16, x, 0.7, z)); for (let i = 0; i < 9; i++) g.add(sphere(0.16, mat.std(pick(flowerCols)), x + rnd(-0.45, 0.45), 0.82 + rnd(0, 0.15), z + rnd(-0.45, 0.45), 8)); a.obstacles.push({ x, z, w: 1.4, d: 1.4 }); }
  // little flowers dotted in the grass
  const fm = flowerCols.map((c) => mat.std(c));
  for (let i = 0; i < 180; i++) { const x = rnd(-44, 44), z = rnd(-40, 40); if ((Math.abs(x) < 21 && Math.abs(z) < 18) || Math.abs(x) < 5.5 || Math.abs(z) < 5.5 || Math.hypot(x - POND.x, z - POND.z) < POND.r + 1.5) continue; g.add(sphere(0.12, pick(fm), x, 0.12, z, 6)); }
  // the fountain (a giant soup dumpling statue goes in the middle later)
  const stoneM = mat.std(0xd9d2c6, { roughness: 0.8 });
  g.add(new THREE.Mesh(new THREE.LatheGeometry([[0, 0], [3.4, 0], [3.5, 0.2], [3.5, 0.7], [3.2, 0.75], [3.1, 0.3], [0, 0.3]].map(([x, y]) => new THREE.Vector2(x, y)), 48), stoneM), cyl(0.9, 1.1, 1.0, stoneM, 24, 0, 0.75, 0));
  const water = new THREE.Mesh(new THREE.CircleGeometry(3.15, 48), new THREE.MeshPhysicalMaterial({ color: 0x5ec8f0, roughness: 0.05, clearcoat: 1, transparent: true, opacity: 0.85 })); water.rotation.x = -Math.PI / 2; water.position.y = 0.6; water.userData.dyn = true; g.add(water);
  animated.push((dt, t) => { water.position.y = 0.6 + Math.sin(t * 2) * 0.015; });
  a.obstacles.push({ x: 0, z: 0, w: 7, d: 7 });
  // the duck pond
  const pond = new THREE.Mesh(new THREE.CircleGeometry(POND.r, 48), new THREE.MeshPhysicalMaterial({ color: 0x4fb6e8, roughness: 0.05, clearcoat: 1 })); pond.rotation.x = -Math.PI / 2; pond.position.set(POND.x, 0.05, POND.z); pond.userData.dyn = true; g.add(pond);
  const rim = new THREE.Mesh(new THREE.TorusGeometry(POND.r, 0.35, 8, 48), stoneM); rim.rotation.x = Math.PI / 2; rim.position.set(POND.x, 0.1, POND.z); g.add(rim);
  const padM = mat.std(0x3f9a4a); for (let i = 0; i < 9; i++) { const an = rnd(0, 6.28), r = rnd(1, POND.r - 1.2); g.add(cyl(rnd(0.35, 0.6), rnd(0.35, 0.6), 0.03, padM, 14, POND.x + Math.cos(an) * r, 0.08, POND.z + Math.sin(an) * r)); }
  const reedM = mat.std(0x5d8a3a); for (let i = 0; i < 26; i++) { const an = rnd(0, 6.28); g.add(cyl(0.03, 0.04, rnd(0.8, 1.5), reedM, 5, POND.x + Math.cos(an) * (POND.r + 0.3), 0.6, POND.z + Math.sin(an) * (POND.r + 0.3))); }
  a.obstacles.push({ x: POND.x, z: POND.z, w: POND.r * 1.6, d: POND.r * 1.6 });
  // lantern strings criss-crossing the plaza
  const capM = mat.gloss(0xd4a017), ropeM = mat.std(0x553322), poleM = mat.std(0x8a2a1e, { roughness: 0.6 }), tasselM = mat.std(0xffd54a), lanternM = new THREE.MeshStandardMaterial({ color: 0xe8322f, emissive: 0xff3a1a, emissiveIntensity: 0.55, roughness: 0.6 });
  const poles = [[-14, 12], [14, 12], [-14, -11], [14, -11]];
  for (const [x, z] of poles) { g.add(cyl(0.12, 0.15, 6.2, poleM, 10, x, 3.1, z), sphere(0.22, capM, x, 6.25, z, 10)); a.obstacles.push({ x, z, w: 0.4, d: 0.4 }); }
  for (const [p, q] of [[0, 1], [2, 3], [0, 2], [1, 3], [0, 3], [1, 2]]) {
    const [x1, z1] = poles[p], [x2, z2] = poles[q]; const pts = []; for (let i = 0; i <= 24; i++) { const t = i / 24; pts.push(new THREE.Vector3(x1 + (x2 - x1) * t, 6 - Math.sin(t * Math.PI) * 1.4, z1 + (z2 - z1) * t)); }
    g.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 40, 0.025, 5), ropeM));
    const n = Math.floor(Math.hypot(x2 - x1, z2 - z1) / 2.6);
    for (let i = 1; i < n; i++) { const t = i / n, x = x1 + (x2 - x1) * t, y = 6 - Math.sin(t * Math.PI) * 1.4, z = z1 + (z2 - z1) * t; const body = sphere(0.36, lanternM, x, y - 0.45, z, 16); body.scale.y = 1.2; g.add(body, cyl(0.2, 0.2, 0.08, capM, 12, x, y - 0.02, z), cyl(0.2, 0.2, 0.08, capM, 12, x, y - 0.9, z), cyl(0.02, 0.02, 0.3, tasselM, 6, x, y - 1.08, z)); }
  }
  // welcome arch over the south gate
  const arch = new THREE.Group(); arch.add(cyl(0.3, 0.3, 5.4, poleM, 12, -3.4, 2.7, 0), cyl(0.3, 0.3, 5.4, poleM, 12, 3.4, 2.7, 0), box(8.4, 0.5, 0.6, poleM, 0, 5.4, 0), box(9.2, 0.25, 0.9, capM, 0, 5.8, 0));
  const sign = textPlane(["🥟 Dumpling Town 🥟"], 6, 0.9, { bg: "#c62828", color: "#ffe9a8", size: 120 }); sign.position.set(0, 4.75, 0.31); arch.add(sign); const sign2 = sign.clone(); sign2.rotation.y = Math.PI; sign2.position.z = -0.31; arch.add(sign2);
  arch.position.set(0, 0, OUT.maxZ - 0.6); g.add(arch); a.obstacles.push({ x: -3.4, z: OUT.maxZ - 0.6, w: 0.7, d: 0.7 }, { x: 3.4, z: OUT.maxZ - 0.6, w: 0.7, d: 0.7 });
  // the Dumpling Catch game booth
  const booth = new THREE.Group(), bx = 22, bz = 32; const boothM = mat.std(0x3d8bfd), boothT = mat.std(0xffd54a);
  booth.add(box(6, 1.1, 1.6, boothM, 0, 0.55, 0), box(6.3, 0.14, 1.9, boothT, 0, 1.15, 0), box(0.2, 3.4, 0.2, boothT, -2.9, 1.7, -0.7), box(0.2, 3.4, 0.2, boothT, 2.9, 1.7, -0.7), box(0.2, 3.4, 0.2, boothT, -2.9, 1.7, 0.7), box(0.2, 3.4, 0.2, boothT, 2.9, 1.7, 0.7));
  const bAw = new THREE.Mesh(new THREE.PlaneGeometry(6.6, 2.2, 1, 4), new THREE.MeshStandardMaterial({ map: stripeTex("#ffffff", "#3d8bfd"), side: THREE.DoubleSide })); bAw.rotation.x = -Math.PI / 2 + 0.2; bAw.position.set(0, 3.45, 0); booth.add(bAw);
  const bs = textPlane(["🧺 Dumpling Catch!", "Win coins!"], 4.4, 1.4, { bg: "#ffd54a", color: "#1d4fa8", size: 80 }); bs.position.set(0, 4.3, 0.75); booth.add(bs);
  booth.position.set(bx, 0, bz); booth.rotation.y = Math.PI; g.add(booth); a.obstacles.push({ x: bx, z: bz, w: 6.4, d: 2 });
  const bdeco = new THREE.Group(); bdeco.userData.noMerge = true; bdeco.position.set(bx, 0, bz); bdeco.rotation.y = Math.PI; g.add(bdeco);
  for (let i = 0; i < 3; i++) { const st = makeSteamer(0.4, 0.2); st.position.set(-1.6 + i * 1.6, 1.22, 0); bdeco.add(st); }
  const it = { id: "catch", kind: "game", label: "🧺 Play Dumpling Catch", name: "Dumpling Catch", front: new THREE.Vector3(bx, 0, bz - 2.3) }; hitZone(g, it, 6.4, 3.4, 2, bx, 1.7, bz); a.interactables.push(it);
  // the coop's outdoor pen
  const coop = SHOPS.find((s) => s.id === "coop"), penX = coop.x + 3.5, penZ = coop.z - 11, fenceM = mat.wood(0xf3ead8);
  for (let i = 0; i <= 6; i++) for (const z of [penZ - 3, penZ + 3]) g.add(box(0.14, 1.0, 0.14, fenceM, penX - 3 + i, 0.5, z));
  for (let i = 1; i < 6; i++) for (const x of [penX - 3, penX + 3]) g.add(box(0.14, 1.0, 0.14, fenceM, x, 0.5, penZ - 3 + i));
  for (const z of [penZ - 3, penZ + 3]) g.add(box(6, 0.1, 0.08, fenceM, penX, 0.75, z)); for (const x of [penX - 3, penX + 3]) g.add(box(0.08, 0.1, 6, fenceM, x, 0.75, penZ));
  a.obstacles.push({ x: penX, z: penZ, w: 6.2, d: 6.2 });
  // your own chicken yard, next to your house: chickens that aren't following you live here
  const Y = YARD; const yw = Y.w / 2, yd = Y.d / 2;
  for (let x = -yw; x <= yw + 0.01; x += 1) for (const z of [-yd, yd]) g.add(box(0.14, 1.0, 0.14, fenceM, Y.x + x, 0.5, Y.z + z));
  for (let z = -yd + 1; z < yd; z += 1) for (const x of [-yw, yw]) g.add(box(0.14, 1.0, 0.14, fenceM, Y.x + x, 0.5, Y.z + z));
  for (const z of [-yd, yd]) g.add(box(Y.w, 0.1, 0.08, fenceM, Y.x, 0.75, Y.z + z)); for (const x of [-yw, yw]) g.add(box(0.08, 0.1, Y.d, fenceM, Y.x + x, 0.75, Y.z));
  const hutM = mat.std(0xb5452f), hutR = mat.std(0x5b4636); g.add(box(2.4, 1.6, 1.8, hutM, Y.x + yw - 1.6, 0.8, Y.z - yd + 1.3)); const hr = new THREE.Mesh(new THREE.ConeGeometry(1.9, 1.0, 4), hutR); hr.position.set(Y.x + yw - 1.6, 2.1, Y.z - yd + 1.3); hr.rotation.y = Math.PI / 4; g.add(hr);
  g.add(box(0.8, 0.9, 0.05, mat.std(0x3a2010), Y.x + yw - 1.6, 0.45, Y.z - yd + 2.21));
  const ys = textPlane(["🐔 My Chicken Yard"], 3.6, 0.7, { bg: "#fff3c4", color: "#b5452f", size: 90 }); ys.position.set(Y.x, 1.7, Y.z + yd + 0.05); g.add(ys); g.add(box(0.12, 1.6, 0.12, fenceM, Y.x - 1.6, 0.8, Y.z + yd), box(0.12, 1.6, 0.12, fenceM, Y.x + 1.6, 0.8, Y.z + yd));
  a.obstacles.push({ x: Y.x, z: Y.z, w: Y.w + 0.2, d: Y.d + 0.2 });
  const yit = { id: "yard", kind: "yard", label: "🐔 My chicken yard", name: "My Chicken Yard", front: new THREE.Vector3(Y.x, 0, Y.z + yd + 1.6) }; hitZone(g, yit, Y.w, 2, Y.d, Y.x, 1, Y.z); a.interactables.push(yit);
  for (const S of SHOPS) buildBuilding(S, a, animated);
}
function addFountainDumpling(g, animated) {
  const d = buildDumpling("classic-xlb"); d.scale.setScalar(1.15); d.position.set(0, 1.25, 0); g.add(d);
  animated.push((dt, t) => { const s = 1 + Math.sin(t * 1.6) * 0.04; d.scale.set(1.15 / Math.sqrt(s), 1.15 * s, 1.15 / Math.sqrt(s)); });
}
function addPenChickens(g, animated) {
  const coop = SHOPS.find((s) => s.id === "coop"), cx = coop.x + 3.5, cz = coop.z - 11;
  for (let i = 0; i < 4; i++) { const ch = makeChicken({ color: CHICKEN_COLORS[(i + 1) % CHICKEN_COLORS.length] }); ch.group.scale.setScalar(1.2); g.add(ch.group);
    const st = { x: cx + rnd(-1, 1), z: cz + rnd(-1.5, 1.5), tx: cx, tz: cz, wait: rnd(0, 2) };
    animated.push((dt, t) => { if (!g.visible) return; const dx = st.tx - st.x, dz = st.tz - st.z, dd = Math.hypot(dx, dz); let sp = 0; if (dd > 0.1) { sp = 1.2; st.x += (dx / dd) * sp * dt; st.z += (dz / dd) * sp * dt; ch.group.rotation.y = Math.atan2(dx, dz); } else if ((st.wait -= dt) < 0) { st.wait = rnd(1, 4); st.tx = cx + rnd(-2.2, 2.2); st.tz = cz + rnd(-2.2, 2.2); } ch.group.position.set(st.x, 0, st.z); ch.update(dt, t + i, sp / 1.2, sp === 0); }); }
}
function addDucks(g, animated) {
  for (let i = 0; i < 4; i++) { const d = makePlush("duck", 1.6); g.add(d); const r = rnd(2, POND.r - 1.5), sp = rnd(0.15, 0.3) * (i % 2 ? 1 : -1), ph = rnd(0, 6);
    animated.push((dt, t) => { if (!g.visible) return; const an = ph + t * sp; d.position.set(POND.x + Math.cos(an) * r, 0.02 + Math.sin(t * 2 + i) * 0.03, POND.z + Math.sin(an) * r); d.rotation.y = -an + (sp > 0 ? Math.PI : 0); }); }
}
// soft steam puffs
function makePuffs(scene) {
  const c = document.createElement("canvas"); c.width = c.height = 64; const g = c.getContext("2d"); const gr = g.createRadialGradient(32, 32, 2, 32, 32, 32); gr.addColorStop(0, "rgba(255,255,255,.9)"); gr.addColorStop(1, "rgba(255,255,255,0)"); g.fillStyle = gr; g.fillRect(0, 0, 64, 64);
  const tex = new THREE.CanvasTexture(c); const live = [];
  return { emit(x, y, z) { if (live.length > 60) return; const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false, opacity: 0.8 })); sp.position.set(x, y, z); sp.scale.setScalar(0.6); scene.add(sp); live.push({ sp, t: 0 }); },
    update(dt) { for (let i = live.length - 1; i >= 0; i--) { const p = live[i]; p.t += dt; p.sp.position.y += dt * 0.9; p.sp.position.x += dt * 0.2; p.sp.scale.setScalar(0.6 + p.t * 0.9); p.sp.material.opacity = Math.max(0, 0.75 - p.t * 0.3); if (p.t > 2.5) { scene.remove(p.sp); p.sp.material.dispose(); live.splice(i, 1); } } } };
}
