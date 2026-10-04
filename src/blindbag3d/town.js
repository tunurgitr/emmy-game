// ==========================================================================
//  Emmy's Blind Bag Town 3D — a walkable town of silly shops.
//
//  createTown(canvas, { ui, avatar, name, onPrompt, onInteract, onPickup,
//                       onChickenTap, onDoor, onArea, onNear, onCarts, getOwned, getGlam }) → town
//    town.start() / stop() / pause(v)
//    town.setOverride({ scene, camera, update, onDown, onMove, onUp }) — while set,
//      the renderer shows the override (opening a bag, the Glow-Up station).
//    town.enter(id) / town.exit() — step through a shop door (the hub fades the screen)
//    town.say(who, text) — a speech bubble over a shopkeeper ("keeper") or a townsperson
//    town.setName(name) — your name on your house
//    town.setFlock(hens) — pet chickens that follow you around
//
//  Same engine as Dumpling Town: outdoors and each interior are groups in one
//  scene and only the area you're in is visible.
// ==========================================================================
import { THREE, rnd, clamp, pick, mat, box, cyl, sphere, textPlane, textTexture, emojiSprite, blobShadow, makeKid, makePlush, approach, LOW_TIER, mergeStatic } from "../arcade3d/lib.js";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { buildItem, makeBag, makeChicken, CHICKEN_COLORS, CATALOG, SERIES_IDS } from "./models.js";
import { makeCoin, makeEgg } from "../dumpling3d/models.js";

const OUT = { minX: -46, maxX: 46, minZ: -44, maxZ: 42 };
const EYE = 1.55;
const SKY = 0xbfe3ff;

export function createTown(canvas, { ui, avatar = {}, name = "", onPrompt, onInteract, onPickup, onChickenTap, onDoor, onArea, onNear, onCarts, getOwned = () => ({}), getGlam = () => ({}) }) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: !LOW_TIER, powerPreference: "high-performance" });
  const basePR = LOW_TIER ? 1.0 : Math.min(1.75, window.devicePixelRatio || 1); let resScale = 1, emaDt = 1 / 60, adaptT = 0;
  renderer.setPixelRatio(basePR); renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFShadowMap;
  const envMap = new THREE.PMREMGenerator(renderer).fromScene(new RoomEnvironment(), 0.04).texture;
  const scene = new THREE.Scene(); scene.environment = envMap; scene.environmentIntensity = 0.35;
  scene.background = new THREE.Color(SKY); const outFog = new THREE.Fog(0xf3e6f2, 70, 210); scene.fog = outFog;
  const camera = new THREE.PerspectiveCamera(60, 1, 0.1, 260);
  const hemi = new THREE.HemisphereLight(0xdff1ff, 0x8a7a5a, 1.3); scene.add(hemi);
  const sun = new THREE.DirectionalLight(0xfff1dc, 2.0); sun.position.set(18, 30, 14); scene.add(sun);

  const animated = [];
  const outdoor = new THREE.Group(); scene.add(outdoor);
  const areas = { out: { id: "out", group: outdoor, ...OUT, ceil: 99, obstacles: [], interactables: [], doors: [], bg: SKY } };
  buildOutdoor(outdoor, areas.out, animated);
  SHOPS.forEach((S, i) => { const a = buildInterior(S, 300 + i * 60); areas[S.id] = a; scene.add(a.group); a.group.visible = false; });
  for (const a of Object.values(areas)) { mergeStatic(a.group); const groups = []; a.group.traverse((o) => { if (o.isGroup && o !== a.group && o.children.length > 3 && !o.userData.noMerge) groups.push(o); }); for (const g of groups) mergeStatic(g); }
  for (const a of Object.values(areas)) for (const k of a.keepers || []) addKeeper(a, k, animated);
  for (const a of Object.values(areas)) for (const fn of a.late || []) fn(animated);
  const homeSign = { tex: null }; setHouseName(name);
  function setHouseName(n) { const label = n ? `🏠 ${n.toUpperCase()}'S HOUSE` : "🏠 MY HOUSE"; for (const m of [areas.out.homeSign, areas.home.homeSign]) if (m) { m.material.map.dispose(); m.material.map = textTexture([label], { w: m.userData.tw, h: m.userData.th, bg: m.userData.bg, color: m.userData.fg, size: 110 }); m.material.needsUpdate = true; } }

  // ---- townsfolk -----------------------------------------------------------
  const npcs = TOWNSFOLK.map((T, i) => { const kid = liteKid(T.look); kid.group.position.set(T.x, 0, T.z); outdoor.add(kid.group); return { ...T, r: T.r + 3, pace: rnd(2.4, 3.2), kid, hx: T.x, hz: T.z, tx: T.x, tz: T.z, wait: rnd(0, 2), yaw: rnd(0, 6), i, greet: rnd(2, 8) }; });
  // the road chicken: crosses the road. Over and over. Nobody knows why.
  const roadHen = makeChicken({ color: CHICKEN_COLORS[0] }); roadHen.group.scale.setScalar(1.4); roadHen.group.add(blobShadow(0.35, 0.3)); outdoor.add(roadHen.group);
  const road = { x: -14, z: -10.5, dir: 1, wait: 1, greet: 3, name: "Road Chicken", chicken: true, kid: { group: roadHen.group } };

  // ---- player -------------------------------------------------------------
  const kid = makeKid(avatar); scene.add(kid.group);
  const player = { x: 0, z: 37, yaw: Math.PI, speed: 0 };
  let area = areas.out, camYaw = 0, camPitch = 0.36, camDist = 6.4, autoTarget = null, autoInteract = null, doorCool = 0, stuckT = 0, stuckD = Infinity;

  // ---- input (joystick left, drag-look right, tap to walk — same as the other towns) ----
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
    const p = pointers.get(e.pointerId);
    if (override) { if (override.onMove) override.onMove(evt(e)); if (p) { p.x = e.clientX; p.y = e.clientY; } return; }
    if (!p) return; const mx = e.clientX - p.x, my = e.clientY - p.y; p.moved += Math.hypot(mx, my); p.x = e.clientX; p.y = e.clientY;
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
  const dz = (v) => (Math.abs(v) < 0.22 ? 0 : (v - Math.sign(v) * 0.22) / 0.78); let onPadBack = null, onPadButton = null;
  function pollPad() {
    const gps = navigator.getGamepads ? navigator.getGamepads() : []; let gp = null; for (const g of gps) if (g && g.connected) { gp = g; break; }
    pad.connected = !!gp; if (!gp) { cursor.style.display = "none"; return; }
    pad.lx = dz(gp.axes[0] || 0); pad.ly = dz(gp.axes[1] || 0); pad.rx = dz(gp.axes[2] || 0); pad.ry = dz(gp.axes[3] || 0);
    const pressed = gp.buttons.map((b) => b.pressed), edges = pressed.map((p, i) => p && !prevBtn[i]), released = pressed.map((p, i) => !p && prevBtn[i]); prevBtn.length = 0; prevBtn.push(...pressed); pad.buttons = pressed;
    let consumed = false; edges.forEach((e, i) => { if (e && onPadButton && onPadButton(i)) consumed = true; }); if (consumed) return;
    if (override) {
      const W = canvas.clientWidth || innerWidth, H = canvas.clientHeight || innerHeight, mx = pad.rx || pad.lx, my = pad.ry || pad.ly;
      cur.x = clamp(cur.x + (mx * 1.4) / 60, 0.02, 0.98); cur.y = clamp(cur.y + (my * 1.4) / 60, 0.02, 0.98);
      cursor.style.display = "block"; cursor.style.left = `${cur.x * W}px`; cursor.style.top = `${cur.y * H}px`; cursor.classList.toggle("down", !!pressed[0]);
      const r = canvas.getBoundingClientRect(), fake = { clientX: r.left + cur.x * W, clientY: r.top + cur.y * H, pointerId: 999 };
      if (edges[0]) override.onDown && override.onDown(evt(fake)); else override.onMove && override.onMove(evt(fake)); if (released[0]) override.onUp && override.onUp(evt(fake));
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

  // ---- coins, pet chickens and stray shopping carts ---------------------------
  const coins = []; const coinSpots = [[-8, 12], [8, 12], [-14, 2], [14, 2], [-4, -14], [6, -20], [-26, 8], [26, 8], [0, 26], [-23, 29], [18, 30], [-38, -30], [38, -30], [-40, 36], [40, 36], [-24, -10], [24, -10], [20, -36], [-20, -36], [0, -40]];
  for (const [x, z] of coinSpots) { const c = makeCoin(); c.scale.setScalar(1.4); c.position.set(x, 0.65, z); outdoor.add(c); coins.push({ g: c, x, z, t: 0 }); }
  const chickens = [];
  function addChicken(ci = 0, quiet = false) {
    const ch = makeChicken({ color: CHICKEN_COLORS[ci % CHICKEN_COLORS.length] }); ch.group.scale.setScalar(1.25); const lead = chickens.length ? chickens[chickens.length - 1] : player;
    const c = { ch, x: lead.x + rnd(-1, 1), z: lead.z + 1.5, yaw: 0, speed: 0, ci, findT: rnd(40, 80) }; ch.group.position.set(c.x, 0, c.z); ch.group.add(blobShadow(0.35, 0.3)); scene.add(ch.group); chickens.push(c); if (!quiet) ch.flapNow(); return c;
  }
  // the first `follow` chickens walk behind you; the rest live in your chicken yard
  const yardHens = [];
  function setFlock(hens, follow = hens.length) {
    for (const c of chickens) scene.remove(c.ch.group); chickens.length = 0; hens.slice(0, follow).forEach((ci) => addChicken(ci, true));
    for (const y of yardHens) outdoor.remove(y.ch.group); yardHens.length = 0;
    hens.slice(follow, follow + 30).forEach((ci) => { const ch = makeChicken({ color: CHICKEN_COLORS[ci % CHICKEN_COLORS.length] }); ch.group.scale.setScalar(1.15); outdoor.add(ch.group); const st = { ch, x: YARD.x + rnd(-4, 4), z: YARD.z + rnd(-2, 2), wait: rnd(0, 3), ph: rnd(0, 9) }; st.tx = st.x; st.tz = st.z; ch.group.position.set(st.x, 0, st.z); ch.group.rotation.y = rnd(0, 6); yardHens.push(st); });
  }
  function updateYard(dt, t) {
    for (const st of yardHens) { const dx = st.tx - st.x, dz = st.tz - st.z, dd = Math.hypot(dx, dz); let sp = 0;
      if (dd > 0.1) { sp = 1.4; st.x += (dx / dd) * sp * dt; st.z += (dz / dd) * sp * dt; st.ch.group.rotation.y = Math.atan2(dx, dz); } else if ((st.wait -= dt) < 0) { st.wait = rnd(1, 5); st.tx = YARD.x + rnd(-YARD.w / 2 + 2.6, YARD.w / 2 - 0.7); st.tz = YARD.z + rnd(-YARD.d / 2 + 0.7, YARD.d / 2 - 0.7); }
      st.ch.group.position.set(st.x, 0, st.z); st.ch.update(dt, t + st.ph, sp / 1.4, sp === 0); }
  }
  const carts = CART_SPOTS.map(([x, z], i) => { const g = makeCart(); g.position.set(x, 0, z); g.rotation.y = rnd(0, 6); outdoor.add(g); const c = { g, x, z, yaw: g.rotation.y, mode: "stray", t: 0, speed: 0, i }; if (i === 0) { const rider = makeChicken({ color: CHICKEN_COLORS[2] }); rider.group.position.set(0, 0.5, 0.05); rider.group.scale.setScalar(1.1); g.add(rider.group); c.rider = rider; } return c; });
  const train = () => carts.filter((c) => c.mode === "follow").sort((a, b) => a.order - b.order);
  function updateCarts(dt, t) {
    const out = area === areas.out; let order = 0;
    for (const c of carts) {
      if (c.rider) c.rider.update(dt, t, 0, Math.sin(t * 0.9) > 0.4);
      if (c.mode === "gone") { if ((c.t -= dt) <= 0) { const spot = pick(CART_SPOTS.filter(([x, z]) => Math.hypot(x - player.x, z - player.z) > 12)); c.x = spot[0]; c.z = spot[1]; c.g.position.set(c.x, 0, c.z); c.g.visible = true; c.mode = "stray"; } continue; }
      if (c.mode === "stray" && out && Math.hypot(player.x - c.x, player.z - c.z) < 1.5 && train().length < 8) { c.mode = "follow"; c.order = performance.now(); onPickup && onPickup("cart", train().length); }
    }
    const tr = train();
    tr.forEach((c, i) => {
      const lead = i ? tr[i - 1] : player; const dx = lead.x - c.x, dz = lead.z - c.z, d = Math.hypot(dx, dz), gap = i ? 1.15 : 1.4;
      const want = d > gap ? Math.min(11, (d - gap) * 5) : 0; c.speed = approach(c.speed, want, 8, dt);
      if (c.speed > 0.05) { c.x += (dx / d) * c.speed * dt; c.z += (dz / d) * c.speed * dt; c.yaw = Math.atan2(dx, dz); }
      c.g.position.set(c.x, 0, c.z); let dy = c.yaw - c.g.rotation.y; while (dy > Math.PI) dy -= Math.PI * 2; while (dy < -Math.PI) dy += Math.PI * 2; c.g.rotation.y += dy * Math.min(1, dt * 8);
    });
    if (out && tr.length && Math.hypot(player.x - CORRAL.x, player.z - CORRAL.z) < 3.2) { for (const c of tr) { c.mode = "gone"; c.t = rnd(20, 35); c.g.visible = false; } onCarts && onCarts(tr.length); }
  }
  function dropCarts() { for (const c of carts) if (c.mode === "follow") c.mode = "stray"; }
  function updateCritters(dt, t) {
    if (area === areas.out) for (const c of coins) { if (c.t > 0) { c.t -= dt; c.g.visible = c.t <= 0; continue; } c.g.rotation.y += dt * 2.4; c.g.position.y = 0.65 + Math.sin(t * 3 + c.x) * 0.08;
      if (Math.hypot(player.x - c.x, player.z - c.z) < 1.2) { c.t = rnd(18, 30); c.g.visible = false; onPickup && onPickup("coin", 2); } }
    const tr = area === areas.out ? train() : [];
    chickens.forEach((c, i) => {
      const lead = i ? chickens[i - 1] : tr.length ? tr[tr.length - 1] : player; const dx = lead.x - c.x, dz = lead.z - c.z, d = Math.hypot(dx, dz), gap = i ? 1.15 : 1.5;
      const want = d > gap ? Math.min(10.5, (d - gap) * 4.5) : 0; c.speed = approach(c.speed, want, 8, dt);
      if (c.speed > 0.05) { c.x += (dx / d) * c.speed * dt; c.z += (dz / d) * c.speed * dt; c.yaw = Math.atan2(dx, dz); }
      c.x = clamp(c.x, area.minX + 0.6, area.maxX - 0.6); c.z = clamp(c.z, area.minZ + 0.6, area.maxZ - 0.6);
      c.ch.group.position.set(c.x, 0, c.z); let dy = c.yaw - c.ch.group.rotation.y; while (dy > Math.PI) dy -= Math.PI * 2; while (dy < -Math.PI) dy += Math.PI * 2; c.ch.group.rotation.y += dy * Math.min(1, dt * 8);
      c.ch.update(dt, t + i, Math.min(1, c.speed / 3), c.speed < 0.1 && Math.sin(t * 0.7 + i * 2) > 0.3);
      // every so often a chicken pecks up a coin it found. Good chicken!
      if (area === areas.out && (c.findT -= dt) <= 0) { c.findT = rnd(50, 90); c.ch.flapNow(); onPickup && onPickup("henCoin", 1, i); }
    });
  }
  function updateNpcs(dt, t) {
    for (const n of npcs) {
      let sp = 0; const dP = Math.hypot(n.x - player.x, n.z - player.z);
      if (n.talkT > 0) { n.talkT -= dt; n.yaw = Math.atan2(player.x - n.x, player.z - n.z); }
      else { const dx = n.tx - n.x, dz = n.tz - n.z, d = Math.hypot(dx, dz); if (d > 0.15) { sp = n.pace; n.x += (dx / d) * sp * dt; n.z += (dz / d) * sp * dt; n.yaw = Math.atan2(dx, dz); } else if ((n.wait -= dt) < 0) { n.wait = rnd(0.8, 2.5); n.tx = n.hx + rnd(-n.r, n.r); n.tz = n.hz + rnd(-n.r, n.r); } }
      n.kid.group.visible = dP < 36; if (!n.kid.group.visible) continue;
      n.kid.group.position.set(n.x, 0, n.z); let dy = n.yaw - n.kid.group.rotation.y; while (dy > Math.PI) dy -= Math.PI * 2; while (dy < -Math.PI) dy += Math.PI * 2; n.kid.group.rotation.y += dy * Math.min(1, dt * 6);
      n.kid.walk(t + n.i, sp / 3.2, dt); if (n.talkT > 0) n.kid.parts.armR.rotation.x = -2.6 + Math.sin(t * 8) * 0.4; // waving at you!
      n.greet -= dt; if (dP < 2.8 && n.greet <= 0 && !paused) { n.greet = rnd(25, 40); n.talkT = 3.5; onNear && onNear(n); }
    }
    // the road chicken
    if (road.wait > 0) road.wait -= dt; else { road.z += road.dir * 1.6 * dt; if (road.z > 2.5 || road.z < -10.5) { road.dir *= -1; road.wait = rnd(1.5, 4); road.z = clamp(road.z, -10.5, 2.5); } }
    roadHen.group.position.set(road.x, 0, road.z); roadHen.group.rotation.y = road.dir > 0 ? 0 : Math.PI; roadHen.update(dt, t, road.wait > 0 ? 0 : 0.9, road.wait > 0);
    road.greet -= dt; if (Math.hypot(road.x - player.x, road.z - player.z) < 2.6 && road.greet <= 0 && !paused) { road.greet = 20; roadHen.flapNow(); onNear && onNear(road); }
  }

  // ---- speech bubbles ----------------------------------------------------------
  const bubbles = [];
  function say(who, text, secs = 4.5) {
    let target = null, y = 2.55;
    if (who === "keeper") { target = area.keeperKid; } else if (who && who.kid) { target = who.kid.group; if (who.chicken) y = 1.6; }
    if (!target) return; for (let i = bubbles.length - 1; i >= 0; i--) if (bubbles[i].target === target) { bubbles[i].sp.parent?.remove(bubbles[i].sp); bubbles.splice(i, 1); }
    const sp = bubbleSprite(text); sp.position.set(0, y / (target.scale.y || 1), 0); sp.scale.multiplyScalar(1 / (target.scale.y || 1)); target.add(sp); bubbles.push({ target, sp, t: secs });
  }
  function updateBubbles(dt) { for (let i = bubbles.length - 1; i >= 0; i--) { const b = bubbles[i]; b.t -= dt; b.sp.material.opacity = Math.min(1, b.t * 3); if (b.t <= 0) { b.sp.parent?.remove(b.sp); b.sp.material.map.dispose(); b.sp.material.dispose(); bubbles.splice(i, 1); } } }

  // ---- update ---------------------------------------------------------------
  let nearest = null, last = performance.now(), t = 0;
  const camPos = new THREE.Vector3(), camLook = new THREE.Vector3();
  function update(dt) {
    t += dt; for (const f of animated) f(dt, t); updateCritters(dt, t); updateCarts(dt, t); updateBubbles(dt); if (area === areas.out) { updateNpcs(dt, t); updateYard(dt, t); }
    doorCool = Math.max(0, doorCool - dt);
    if (focus) { kid.group.rotation.y = camYaw; kid.walk(t, 0, dt); camPos.set(player.x + Math.sin(camYaw) * 3.2, 1.7, player.z + Math.cos(camYaw) * 3.2); clampCam(camPos); camera.position.lerp(camPos, Math.min(1, dt * 6)); camLook.set(player.x, 1.05, player.z); camera.lookAt(camLook); return; }
    let mx = move.x + (pad.connected ? pad.lx : 0), mz = move.y + (pad.connected ? pad.ly : 0);
    if (!paused) { if (keys.has("w") || keys.has("ArrowUp")) mz -= 1; if (keys.has("s") || keys.has("ArrowDown")) mz += 1; if (keys.has("a") || keys.has("ArrowLeft")) mx -= 1; if (keys.has("d") || keys.has("ArrowRight")) mx += 1; if (keys.has("q")) camYaw += 1.8 * dt; }
    let l = Math.hypot(mx, mz); if (l > 1) { mx /= l; mz /= l; l = 1; } if (l > 0.05) { autoTarget = null; autoInteract = null; }
    const sy = Math.sin(camYaw), cy = Math.cos(camYaw); let vx = 0, vz = 0;
    if (paused) l = 0;
    if (l > 0.05) { vx = mx * cy + mz * sy; vz = -mx * sy + mz * cy; }
    else if (autoTarget && !paused) { const dx = autoTarget.x - player.x, dz = autoTarget.z - player.z, d = Math.hypot(dx, dz); if (d < 0.25) { autoTarget = null; if (autoInteract) { const it = autoInteract; autoInteract = null; if (near(it) < 2.8) onInteract(it); } } else { vx = dx / d; vz = dz / d; l = Math.min(1, d);
      if ((stuckT += dt) > 0.5) { if (d > stuckD - 0.3) { const it = autoInteract; autoTarget = null; autoInteract = null; if (it && near(it) < 2.8) onInteract(it); } stuckT = 0; stuckD = d; } } }
    const SP = (area === areas.out ? 8.2 : 5.4) * speedBoost;
    player.speed = approach(player.speed, l > 0.05 || (autoTarget && !paused) ? SP * Math.max(0.35, l) : 0, 10, dt);
    if (player.speed > 0.01 && (vx || vz)) { player.x += vx * player.speed * dt; player.z += vz * player.speed * dt; player.yaw = Math.atan2(vx, vz); }
    player.x = clamp(player.x, area.minX + 0.6, area.maxX - 0.6); player.z = clamp(player.z, area.minZ + 0.6, area.maxZ - 0.6);
    for (const o of area.obstacles) collide(player, o, () => { if (autoTarget && !autoInteract) autoTarget = null; });
    if (!doorCool && !paused) for (const d of area.doors) if (Math.hypot(player.x - d.x, player.z - d.z) < (d.r || 0.95)) { doorCool = 1.5; autoTarget = null; onDoor && onDoor(d.id, area === areas.out ? "in" : "out"); break; }
    kid.group.position.set(player.x, 0, player.z);
    let dy = player.yaw - kid.group.rotation.y; while (dy > Math.PI) dy -= Math.PI * 2; while (dy < -Math.PI) dy += Math.PI * 2; kid.group.rotation.y += dy * Math.min(1, dt * 12);
    kid.walk(t, player.speed / SP, dt);
    const dist = area === areas.out ? camDist : 5.2;
    camPos.set(player.x + Math.sin(camYaw) * Math.cos(camPitch) * dist, EYE + Math.sin(camPitch) * dist, player.z + Math.cos(camYaw) * Math.cos(camPitch) * dist); clampCam(camPos);
    camera.position.lerp(camPos, Math.min(1, dt * 8)); camLook.set(player.x, area === areas.out ? 1.3 : 1.7, player.z); camera.lookAt(camLook);
    let best = null, bd = 2.8; for (const it of area.interactables) { const d = near(it); if (d < bd) { bd = d; best = it; } }
    if (best !== nearest) { nearest = best; onPrompt(best); }
  }
  let speedBoost = 1;
  const near = (it) => Math.hypot(it.front.x - player.x, it.front.z - player.z);
  function clampCam(p) { if (area === areas.out) { for (let k = 0; k < 14 && area.obstacles.some((o) => o.tall && Math.abs(p.x - o.x) < o.w / 2 + 0.4 && Math.abs(p.z - o.z) < o.d / 2 + 0.4); k++) { p.x += (player.x - p.x) * 0.18; p.z += (player.z - p.z) * 0.18; p.y = Math.max(p.y, EYE + 0.6); } return; } p.x = clamp(p.x, area.minX + 0.35, area.maxX - 0.35); p.z = clamp(p.z, area.minZ + 0.35, area.maxZ - 0.35); p.y = Math.min(p.y, area.ceil - 0.35); }
  function snapCamera() { const dist = area === areas.out ? camDist : 5.2; camPos.set(player.x + Math.sin(camYaw) * Math.cos(camPitch) * dist, EYE + Math.sin(camPitch) * dist, player.z + Math.cos(camYaw) * Math.cos(camPitch) * dist); clampCam(camPos); camera.position.copy(camPos); camera.lookAt(player.x, area === areas.out ? 1.3 : 1.7, player.z); }
  function moveTo(next, x, z, yaw) {
    if (area === areas.out && next !== areas.out) dropCarts();
    area.group.visible = false; area = next; area.group.visible = true;
    player.x = x; player.z = z; player.yaw = yaw; player.speed = 0; kid.group.rotation.y = yaw; camYaw = yaw + Math.PI + (area === areas.out ? 1.0 : 0); camPitch = area === areas.out ? 0.42 : 0.24;
    chickens.forEach((c, i) => { c.x = x - Math.sin(yaw) * (1.5 + i * 1.1); c.z = z - Math.cos(yaw) * (1.5 + i * 1.1); c.speed = 0; });
    const outside = area === areas.out; scene.background = new THREE.Color(area.bg); scene.fog = outside ? outFog : null; hemi.intensity = outside ? 1.3 : 1.05; sun.intensity = outside ? 2.0 : 0.8; scene.environmentIntensity = outside ? 0.35 : 0.5;
    if (area.id === "home") refreshShelf(area, getOwned(), getGlam());
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
    renderer, scene, camera, keys, pad, envMap, chickens, npcs, carts,
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
    say, setName: setHouseName, setSpeedBoost(m) { speedBoost = m; },
    refreshShelf() { if (area.id === "home") refreshShelf(area, getOwned(), getGlam()); },
    addChicken, setFlock, get trainSize() { return train().length; }, get yardCount() { return yardHens.length; },
    setYardEggs(n) { const nest = areas.out.yardEggs; if (nest) nest.children.forEach((e, i) => (e.visible = i < n)); },
    setAvatar(a) { const ry = kid.group.rotation.y; scene.remove(kid.group); const k = makeKid(a); kid.group = k.group; kid.walk = k.walk; kid.parts = k.parts; kid.group.position.set(player.x, 0, player.z); kid.group.rotation.y = ry; scene.add(kid.group); },
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
const plankTex = (c) => canvasTex(256, 256, (g, w) => { const base = new THREE.Color(c); for (let i = 0; i < 8; i++) { const d = base.clone().offsetHSL(0, 0, rnd(-0.05, 0.05)); g.fillStyle = `#${d.getHexString()}`; g.fillRect(0, (i * w) / 8, w, w / 8); g.fillStyle = "rgba(0,0,0,.18)"; g.fillRect(0, (i * w) / 8, w, 2); g.fillRect(rnd(0, w), (i * w) / 8, 2, w / 8); } });
function hitZone(group, it, w, h, d, x, y, z) { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), new THREE.MeshBasicMaterial({ colorWrite: false, depthWrite: false })); m.position.set(x, y, z); m.userData.dyn = true; m.userData.interactable = it; group.add(m); it.hit = m; return m; }
// a mini blind bag for shelves and displays
function miniBag(sid, s, x, y, z, ry = 0) { const b = makeBag(sid); b.scale.setScalar(s); b.position.set(x, y, z); b.rotation.y = ry; b.userData.noMerge = true; return b; }
function decoToy(id, s, x, y, z, ry = 0) { const d = buildItem(id, { lod: 0.4 }); d.scale.setScalar(s); d.position.set(x, y, z); d.rotation.y = ry; d.userData.noMerge = true; return d; }
// a shopping cart (wire basket, red handle, little wheels)
let cartTex = null;
export function makeCart() {
  if (!cartTex) cartTex = canvasTex(128, 128, (g, n) => { g.clearRect(0, 0, n, n); g.strokeStyle = "#d8dde4"; g.lineWidth = 5; for (let i = 4; i < n; i += 16) { g.beginPath(); g.moveTo(i, 0); g.lineTo(i, n); g.stroke(); g.beginPath(); g.moveTo(0, i); g.lineTo(n, i); g.stroke(); } }, 2);
  const g = new THREE.Group(); const wire = new THREE.MeshStandardMaterial({ map: cartTex, transparent: true, alphaTest: 0.4, side: THREE.DoubleSide, metalness: 0.8, roughness: 0.3 }), frame = mat.metal(0xc8ced6), red = mat.std(0xe53935, { roughness: 0.4 }), black = mat.std(0x222222);
  const L = 1.0, W = 0.62, H = 0.5, y0 = 0.38;
  for (const [w, h, x, z, ry] of [[L, H, 0, W / 2, 0], [L, H, 0, -W / 2, 0], [W, H, L / 2, 0, Math.PI / 2], [W, H, -L / 2, 0, Math.PI / 2]]) { const p = new THREE.Mesh(new THREE.PlaneGeometry(w, h), wire); p.position.set(x, y0 + H / 2, z); p.rotation.y = ry; g.add(p); }
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(L, W), wire); floor.rotation.x = -Math.PI / 2; floor.position.y = y0; g.add(floor);
  for (const z of [-W / 2, W / 2]) g.add(box(L, 0.03, 0.03, frame, 0, y0 + H, z), box(L, 0.03, 0.03, frame, 0, y0, z));
  for (const x of [-L / 2, L / 2]) for (const z of [-W / 2, W / 2]) g.add(box(0.03, y0, 0.03, frame, x * 0.85, y0 / 2, z * 0.9));
  g.add(box(0.06, 0.06, W + 0.1, red, -L / 2 - 0.12, y0 + H + 0.12, 0)); g.add(box(0.14, 0.03, 0.03, frame, -L / 2 - 0.05, y0 + H + 0.06, W / 2), box(0.14, 0.03, 0.03, frame, -L / 2 - 0.05, y0 + H + 0.06, -W / 2));
  for (const x of [-L / 2 * 0.85, L / 2 * 0.85]) for (const z of [-W / 2 * 0.9, W / 2 * 0.9]) { const w = cyl(0.07, 0.07, 0.05, black, 12, x, 0.07, z); w.rotation.x = Math.PI / 2; g.add(w); }
  g.add(blobShadow(0.75, 0.25)); g.rotation.order = "YXZ"; const holder = new THREE.Group(); g.children.slice().forEach((c) => holder.add(c)); holder.rotation.y = Math.PI / 2; g.add(holder); // handle toward +z, the way it's being pulled
  return g;
}

// ==========================================================================
//  Shops — the store outside (with a door) and the room inside
// ==========================================================================
export const SHOPS = [
  { id: "bulk", name: "Bulk-O-Rama Club", sign: "🛒 BULK-O-RAMA CLUB", x: 0, z: -32, ry: 0, w: 32, d: 12, h: 9, wall: 0xdfe3e8, trim: 0xe53935, roof: 0x8a929c, awning: ["#ffffff", "#e53935"], signFg: "#e53935", signBg: "#ffffff",
    inside: { w: 32, d: 22, h: 9, floor: ["#cfd3d8", "#c4c8ce"], wall: 0xeef0f2, bg: 0x30343a, keeper: { shirt: 0xe53935, hair: 0x6b3e1e, hairStyle: "short", skin: 0xf1c9a5, hat: "🧢" }, counter: "🛒 Buy MEGA packs" } },
  { id: "winwin", name: "Win-Win Grocery", sign: "🥕 WIN-WIN GROCERY", x: -37, z: -4, ry: Math.PI / 2, w: 16, d: 10, h: 6, wall: 0xffd23a, trim: 0xe53935, roof: 0xb71c1c, awning: ["#ffd23a", "#e53935"], signFg: "#e53935", signBg: "#fff4c2",
    inside: { w: 22, d: 16, h: 6.5, floor: ["#fff7e0", "#ffffff"], wall: 0xfff4d6, bg: 0x5a2a10, keeper: { shirt: 0xe53935, hair: 0x222222, hairStyle: "ponytail", skin: 0x8d5a3c }, counter: "🥕 Buy bags (cheap!)" } },
  { id: "teds", name: "Ted's Everything Mart", sign: "🏬 TED'S EVERYTHING MART", x: 37, z: -4, ry: -Math.PI / 2, w: 18, d: 11, h: 7, wall: 0x3d6bfd, trim: 0xffffff, roof: 0x1d3a8a, awning: ["#ffffff", "#3d6bfd"], signFg: "#ffffff", signBg: "#ff3d7a",
    inside: { w: 24, d: 18, h: 7, floor: ["#eef3ff", "#ffffff"], wall: 0xeaf0ff, bg: 0x10204a, keeper: { shirt: 0x3d6bfd, hair: 0xd7ccc8, hairStyle: "short", skin: 0xffd6b8, hat: "🎩" }, counter: "🏬 Buy blind bags" } },
  { id: "cluck", name: "Cluck & Co. Feed", sign: "🐔 CLUCK & CO. FEED", x: -31, z: 16, ry: Math.PI / 2, w: 13, d: 9, h: 6, wall: 0xb5452f, trim: 0xffffff, roof: 0x5b4636, awning: ["#ffffff", "#4caf50"], signFg: "#b5452f", signBg: "#ffffff",
    inside: { w: 18, d: 14, h: 6.5, floor: ["#d9b65e", "#cfa94f"], wall: 0xa8452c, bg: 0x3a2010, keeper: { shirt: 0x4caf50, pants: 0x3d6bfd, hair: 0xa33a1e, hairStyle: "curly", hat: "🤠", skin: 0xffd6b8 }, counter: "🐔 Chickens & Cluck Club" } },
  { id: "salon", name: "Glow-Up Salon", sign: "💖 GLOW-UP SALON", x: 31, z: 22, ry: -Math.PI / 2, w: 13, d: 9, h: 5.5, wall: 0xff8ac8, trim: 0xffffff, roof: 0xb03a8a, awning: ["#ffffff", "#ff8ac8"], signFg: "#ff3d9a", signBg: "#ffffff",
    inside: { w: 18, d: 14, h: 5.5, floor: ["#ffe3f1", "#ffffff"], wall: 0xffeaf5, bg: 0x5a1a40, keeper: { shirt: 0xb18cff, hair: 0xff3dd6, hairStyle: "bun", skin: 0xe0ac8a }, counter: "💖 Glow-Up bags" } },
  { id: "home", name: "My House", sign: "🏠 MY HOUSE", x: -15, z: 33, ry: Math.PI / 2, w: 13, d: 10, h: 6, wall: 0xfff3c4, trim: 0x3d8bfd, roof: 0x3d8bfd, awning: ["#ffffff", "#3d8bfd"], signFg: "#3d8bfd", signBg: "#ffffff",
    inside: { w: 30, d: 24, h: 6.5, floor: null, wall: 0xfff6e8, bg: 0x2a2040, keeper: null, counter: null } },
];
function buildBuilding(S, out, animated) {
  const g = new THREE.Group(); const wallM = mat.std(S.wall, { roughness: 0.8 }), trimM = mat.std(S.trim, { roughness: 0.6 }), roofM = mat.std(S.roof, { roughness: 0.7 });
  const { w, d, h } = S, doorW = S.id === "bulk" ? 4 : 2.4, doorH = S.id === "bulk" ? 4 : 3.2;
  g.add(box(w, h, 0.3, wallM, 0, h / 2, -d / 2), box(0.3, h, d, wallM, -w / 2, h / 2, 0), box(0.3, h, d, wallM, w / 2, h / 2, 0));
  g.add(box((w - doorW) / 2, h, 0.3, wallM, -(w + doorW) / 4, h / 2, d / 2), box((w - doorW) / 2, h, 0.3, wallM, (w + doorW) / 4, h / 2, d / 2), box(doorW, h - doorH, 0.3, wallM, 0, (h + doorH) / 2, d / 2));
  g.add(box(doorW, doorH, 0.05, new THREE.MeshBasicMaterial({ color: 0xffe2b0 }), 0, doorH / 2, d / 2 - 0.3));
  g.add(box(0.22, doorH + 0.2, 0.42, trimM, -doorW / 2 - 0.1, doorH / 2, d / 2), box(0.22, doorH + 0.2, 0.42, trimM, doorW / 2 + 0.1, doorH / 2, d / 2), box(doorW + 0.44, 0.24, 0.42, trimM, 0, doorH + 0.1, d / 2));
  g.add(box(doorW, 0.04, 1.3, mat.std(0x7b4a2a, { roughness: 1 }), 0, 0.02, d / 2 + 0.9));
  const winM = new THREE.MeshStandardMaterial({ color: 0xbfe8ff, emissive: 0xffe6b0, emissiveIntensity: 0.55, roughness: 0.1 });
  const wins = S.id === "bulk" ? [-11, -6, 6, 11] : [-1, 1].map((s) => s * (doorW / 2 + Math.min(2.4, w / 4)));
  for (const x of wins) { g.add(box(1.9, 1.5, 0.06, winM, x, 2.2, d / 2 + 0.16), box(2.1, 0.14, 0.2, trimM, x, 1.4, d / 2 + 0.2), box(2.1, 0.14, 0.2, trimM, x, 3.0, d / 2 + 0.2), box(0.1, 1.5, 0.2, trimM, x, 2.2, d / 2 + 0.2)); }
  g.add(box(w + 0.4, 0.2, 0.4, trimM, 0, h, d / 2), box(w + 0.4, 0.24, 0.36, trimM, 0, 0.12, d / 2 + 0.02));
  if (S.id === "bulk") { g.add(box(w + 0.6, 0.5, d + 0.6, roofM, 0, h + 0.25, 0)); g.add(box(w, 0.9, 0.12, mat.std(0x3d6bfd), 0, h - 2.6, d / 2 + 0.17)); }
  else { const roof = new THREE.Mesh(new THREE.ExtrudeGeometry(new THREE.Shape([new THREE.Vector2(-w / 2 - 0.6, 0), new THREE.Vector2(w / 2 + 0.6, 0), new THREE.Vector2(0, Math.min(3, w * 0.22))]), { depth: d + 1, bevelEnabled: false }), roofM); roof.position.set(0, h, -d / 2 - 0.5); g.add(roof); }
  const aw = new THREE.Mesh(new THREE.PlaneGeometry(doorW + 1.6, 1.3, 1, 4), new THREE.MeshStandardMaterial({ map: stripeTex(...S.awning), side: THREE.DoubleSide, roughness: 0.8 })); aw.position.set(0, doorH + 0.75, d / 2 + 0.6); aw.rotation.x = -1.0; g.add(aw);
  const sw = Math.min(w - 0.8, S.id === "bulk" ? 18 : 9), sh = S.id === "bulk" ? 1.8 : 1.0;
  const sign = textPlane([S.sign], sw, sh, { bg: S.signBg, color: S.signFg, size: 110 }); sign.position.set(0, h - (S.id === "bulk" ? 1.3 : 0.75), d / 2 + 0.18); sign.userData.dyn = true; g.add(sign);
  if (S.id === "home") { sign.userData.tw = Math.round(sw * 256); sign.userData.th = Math.round(sh * 256); sign.userData.bg = S.signBg; sign.userData.fg = S.signFg; out.homeSign = sign; }
  if (S.id === "bulk") { const sub = textPlane(["MEMBERS ONLY* (*everyone is a member)"], 14, 0.6, { bg: "#3d6bfd", color: "#ffffff", size: 80 }); sub.position.set(0, h - 2.6, d / 2 + 0.24); g.add(sub); }
  if (S.id === "winwin") { const sub = textPlane(["WE'RE ALL WINNERS HERE!"], 8, 0.55, { bg: "#e53935", color: "#ffffff", size: 80 }); sub.position.set(0, h - 1.7, d / 2 + 0.2); g.add(sub); }
  if (S.id === "teds") { const sub = textPlane(["Bags · Hats · Socks · A Canoe"], 9, 0.55, { bg: "#ffffff", color: "#3d6bfd", size: 80 }); sub.position.set(0, h - 1.75, d / 2 + 0.2); g.add(sub); }
  g.position.set(S.x, 0, S.z); g.rotation.y = S.ry; out.group.add(g);
  const deco = new THREE.Group(); deco.userData.noMerge = true; deco.position.copy(g.position); deco.rotation.y = S.ry; out.group.add(deco);
  roofDeco(S, deco, animated);
  const c = Math.abs(Math.cos(S.ry)), s = Math.abs(Math.sin(S.ry)); out.obstacles.push({ x: S.x, z: S.z, w: w * c + d * s, d: w * s + d * c, tall: true });
  const fwd = new THREE.Vector3(Math.sin(S.ry), 0, Math.cos(S.ry));
  const door = new THREE.Vector3(S.x, 0, S.z).addScaledVector(fwd, d / 2 + 0.25), outPos = new THREE.Vector3(S.x, 0, S.z).addScaledVector(fwd, d / 2 + 2.6);
  out.doors.push({ id: S.id, x: door.x, z: door.z, outX: outPos.x, outZ: outPos.z, yaw: S.ry, r: doorW > 3 ? 1.6 : 0.95 });
  const it = { id: `door:${S.id}`, kind: "door", door: S.id, label: `🚪 Go inside`, name: S.name, front: outPos.clone() }; hitZone(out.group, it, w, h, d + 0.4, S.x, h / 2, S.z).rotation.y = S.ry; out.interactables.push(it);
}
function roofDeco(S, g, animated) {
  const { h } = S; const onRoof = (obj, s = 1, y = 0) => { obj.scale.setScalar(s); obj.position.set(0, h + 1.6 + y, 0); g.add(obj); return obj; };
  if (S.id === "bulk") { // a GIANT inflatable chicken. Obviously.
    const ch = makeChicken({ color: CHICKEN_COLORS[9] }); ch.group.scale.setScalar(7); ch.group.position.set(-9, h + 0.5, -1); g.add(ch.group); animated.push((dt, t) => { ch.group.scale.set(7 + Math.sin(t * 1.3) * 0.15, 7 - Math.sin(t * 1.3) * 0.12, 7); ch.group.rotation.y = Math.sin(t * 0.5) * 0.25; ch.update(dt, t, 0, Math.sin(t * 0.6) > 0.7); });
    const bag = onRoof(makeBag("mega"), 3.4, 0.2); bag.position.x = 8; animated.push((dt, t) => { bag.rotation.y = Math.sin(t * 0.8) * 0.4; });
  }
  if (S.id === "winwin") { const b = onRoof(makeBag("snacks"), 2.2, 0); animated.push((dt, t) => { b.rotation.y = t * 0.7; }); }
  if (S.id === "teds") { const b = onRoof(makeBag("hunters"), 2.4, 0); animated.push((dt, t) => { b.rotation.y = -t * 0.7; }); }
  if (S.id === "cluck") { const roost = makeChicken({ color: CHICKEN_COLORS[1] }); roost.group.scale.setScalar(2.4); roost.group.position.set(0, h + 1.5, 0); g.add(roost.group); animated.push((dt, t) => roost.update(dt, t, 0, Math.sin(t) > 0.5)); }
  if (S.id === "salon") { const b = onRoof(makeBag("faces"), 2.2, 0); animated.push((dt, t) => { b.rotation.y = Math.sin(t) * 0.5; b.position.y = h + 1.6 + Math.sin(t * 2) * 0.15; }); }
  if (S.id === "home") { onRoof(emojiSprite("🏠", 2), 1, 0.4); g.add(cyl(0.3, 0.3, 1.6, mat.std(0xb5452f), 10, -3, h + 1.4, -1)); }
}
function buildInterior(S, ox) {
  const I = S.inside, { w, d, h } = I, g = new THREE.Group(); g.position.x = ox;
  const a = { id: S.id, group: g, minX: ox - w / 2, maxX: ox + w / 2, minZ: -d / 2, maxZ: d / 2, ceil: h, obstacles: [], interactables: [], doors: [], keepers: [], late: [], bg: I.bg, spawn: { x: ox, z: d / 2 - 4.6 } };
  const obst = (x, z, ww, dd) => a.obstacles.push({ x: ox + x, z, w: ww, d: dd });
  const floorM = new THREE.MeshStandardMaterial({ map: I.floor ? tileTex(...I.floor) : plankTex(0xb8834f), roughness: I.floor ? 0.6 : 0.75 }); floorM.map.repeat.set(w / 4, d / 4);
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(w, d), floorM); floor.rotation.x = -Math.PI / 2; g.add(floor);
  const wallM = mat.std(I.wall, { roughness: 0.9 }), baseM = mat.std(new THREE.Color(I.wall).offsetHSL(0, 0, -0.25).getHex());
  g.add(box(w, h, 0.3, wallM, 0, h / 2, -d / 2), box(0.3, h, d, wallM, -w / 2, h / 2, 0), box(0.3, h, d, wallM, w / 2, h / 2, 0));
  const doorW = 2.4, doorH = 3.2; g.add(box((w - doorW) / 2, h, 0.3, wallM, -(w + doorW) / 4, h / 2, d / 2), box((w - doorW) / 2, h, 0.3, wallM, (w + doorW) / 4, h / 2, d / 2), box(doorW, h - doorH, 0.3, wallM, 0, (h + doorH) / 2, d / 2));
  g.add(box(w, 0.5, 0.32, baseM, 0, 0.25, -d / 2 + 0.01), box(0.32, 0.5, d, baseM, -w / 2 + 0.01, 0.25, 0), box(0.32, 0.5, d, baseM, w / 2 - 0.01, 0.25, 0));
  g.add(box(doorW, doorH, 0.05, new THREE.MeshBasicMaterial({ color: 0xbfe3ff }), 0, doorH / 2, d / 2 + 0.2));
  g.add(box(2.4, 0.04, 1.3, mat.std(0x7b4a2a, { roughness: 1 }), 0, 0.02, d / 2 - 0.9));
  const exitSign = textPlane(["🚪 Exit"], 1.4, 0.45, { bg: "#2e9d6a", color: "#fff", size: 90 }); exitSign.position.set(0, doorH + 0.5, d / 2 - 0.17); exitSign.rotation.y = Math.PI; g.add(exitSign);
  const ceil = new THREE.Mesh(new THREE.PlaneGeometry(w, d), mat.std(new THREE.Color(I.wall).offsetHSL(0, 0, -0.1).getHex())); ceil.rotation.x = Math.PI / 2; ceil.position.y = h; g.add(ceil);
  const winM = new THREE.MeshBasicMaterial({ color: 0xcdeeff }), frameM = mat.std(0xffffff);
  for (const s of [-1, 1]) for (const z of [-d / 4, d / 4]) g.add(box(0.06, 1.6, 2.2, winM, s * (w / 2 - 0.17), 2.4, z), box(0.12, 0.14, 2.4, frameM, s * (w / 2 - 0.2), 1.6, z), box(0.12, 0.14, 2.4, frameM, s * (w / 2 - 0.2), 3.2, z));
  const lampM = new THREE.MeshStandardMaterial({ color: 0xfff3d0, emissive: 0xffe2a0, emissiveIntensity: 1.2 });
  for (const x of [-w / 4, w / 4]) for (const z of [-d / 4, d / 4]) g.add(cyl(0.02, 0.02, 0.8, mat.std(0x333333), 6, x, h - 0.4, z), sphere(0.32, lampM, x, h - 0.9, z, 14));
  a.doors.push({ id: S.id, x: ox, z: d / 2 - 0.3 });
  const counterZ = -d / 2 + 3;
  if (I.counter) {
    const cM = mat.wood(0xc58a4a), topM = mat.std(S.trim === 0xffffff ? S.wall : S.trim, { roughness: 0.4 });
    g.add(box(w * 0.42, 1.2, 1.0, cM, 0, 0.6, counterZ), box(w * 0.42 + 0.2, 0.12, 1.2, topM, 0, 1.26, counterZ)); obst(0, counterZ, w * 0.42, 1.0);
    const it = { id: S.id, kind: "shop", label: I.counter, name: S.name, front: new THREE.Vector3(ox, 0, counterZ + 2.2) }; hitZone(g, it, w * 0.42, 2.4, 1.4, 0, 1.2, counterZ); a.interactables.push(it);
    if (I.keeper) a.keepers.push({ look: I.keeper, x: ox, z: counterZ - 1.3, ry: 0, main: true });
    const shelfM = mat.wood(0xa0703a); for (const y of [2.0, 3.0]) g.add(box(w * 0.6, 0.1, 0.6, shelfM, 0, y, -d / 2 + 0.5));
    const sign = textPlane([S.sign], Math.min(9, w * 0.6), 0.9, { bg: css(S.wall === 0xdfe3e8 ? 0xe53935 : S.wall), color: "#fff", size: 100 }); sign.position.set(0, h - 1.1, -d / 2 + 0.17); g.add(sign);
    // shelves of blind bags behind the counter
    const bags = { bulk: ["mega", "jumbo", "mega", "snacks", "pets", "jumbo"], winwin: ["snacks", "spuds", "snacks", "cluck", "spuds", "snacks"], teds: ["pets", "hunters", "faces", "snacks", "hunters", "pets"], cluck: ["cluck", "cluck", "cluck", "cluck", "cluck", "cluck"], salon: ["faces", "faces", "faces", "faces", "faces", "faces"] }[S.id] || [];
    a.late.push(() => { for (const [r, y] of [[0, 2.06], [1, 3.06]]) bags.forEach((b, i) => g.add(miniBag(i % 2 === r ? b : bags[(i + 3) % bags.length], 0.38, -w * 0.27 + (i + 0.5) * ((w * 0.54) / bags.length), y, -d / 2 + 0.55, (i - 2.5) * 0.08))); });
  }
  interiorDeco(S, g, a, { w, d, h, ox, counterZ, obst });
  return a;
}
function interiorDeco(S, g, a, { w, d, h, ox, counterZ, obst }) {
  const addIt = (it, x, z, hw = 2, hh = 2.5, hd = 1) => { it.front = new THREE.Vector3(ox + it.fx, 0, it.fz); hitZone(g, it, hw, hh, hd, x, hh / 2, z); a.interactables.push(it); };
  const board = (lines, x, y, z, ry, bg = "#2e9d6a", ww = 2.6, hh = 1.6) => { const b = textPlane(lines, ww, hh, { bg, color: "#fff", size: 54 }); b.position.set(x, y, z); b.rotation.y = ry; g.add(b); };
  if (S.id === "bulk") {
    // towering pallet racks full of comically huge boxes
    const up = mat.std(0x3d6bfd, { roughness: 0.4 }), beam = mat.std(0xff8a00, { roughness: 0.4 }), card = mat.std(0xc9a26b, { roughness: 0.9 });
    const LABELS = [["48 PACK", "SOCKS"], ["GIANT", "GUMMY BEAR"], ["300", "CRAYONS"], ["1,000", "BLIND BAGS!"], ["MEGA", "MAYO"], ["5 LB", "SPRINKLES"], ["JUMBO", "TISSUES"], ["BULK", "BUBBLES"]];
    for (const [rx, rz, ry] of [[-w / 2 + 1.2, -2, Math.PI / 2], [w / 2 - 1.2, -2, -Math.PI / 2]]) { const rack = new THREE.Group(); for (const zz of [-6, -2, 2]) for (const yy of [0, 2.4, 4.8]) { rack.add(box(3.6, 0.15, 1.6, beam, 0, yy + 0.1, zz + 2)); } for (const xx of [-1.8, 1.8]) for (const zz of [-4, 0, 4]) rack.add(box(0.15, 7.2, 0.15, up, xx, 3.6, zz)); rack.rotation.y = ry; rack.position.set(rx, 0, rz); g.add(rack); obst(rx, rz, 1.8, 12.6);
      for (let k = 0; k < 9; k++) { const yy = [0.2, 2.6, 5.0][k % 3] + 0.8, zz = rz - 4 + Math.floor(k / 3) * 4; g.add(box(1.4, 1.5, 3.0, card, rx, yy, zz)); const L = LABELS[(k + (rx > 0 ? 4 : 0)) % LABELS.length]; const lb = textPlane(L, 2.6, 1.2, { bg: "#ffffff", color: "#c62828", size: 70 }); lb.position.set(rx + (rx > 0 ? -0.72 : 0.72), yy, zz); lb.rotation.y = rx > 0 ? -Math.PI / 2 : Math.PI / 2; g.add(lb); } }
    // the free samples table (Sample Sally is very generous. Very, VERY tiny samples.)
    g.add(box(2.4, 1.0, 1.0, mat.std(0xffffff), -6, 0.5, 2.5), box(2.6, 0.08, 1.2, mat.std(0xe53935), -6, 1.04, 2.5)); obst(-6, 2.5, 2.4, 1.0);
    for (let i = 0; i < 6; i++) g.add(cyl(0.08, 0.06, 0.06, mat.std(0xffffff), 10, -6.9 + i * 0.36, 1.1, 2.5 + (i % 2) * 0.25));
    board(["🍢 FREE SAMPLES!", "(one per customer)"], -6, 2.6, 2.0, 0, "#e53935", 2.4, 1.0);
    a.keepers.push({ look: { shirt: 0xffffff, hair: 0xd7ccc8, hairStyle: "bun", skin: 0xffd6b8, hat: "👩‍🍳" }, x: ox - 6, z: 1.3, ry: 0 });
    addIt({ id: "samples", kind: "samples", label: "🍢 Try a free sample", fx: -6, fz: 4.4 }, -6, 2.5, 2.6, 2.4, 1.6);
    // a giant teddy bear and a flatbed cart
    a.late.push(() => { const teddy = makePlush("bear", 6); teddy.position.set(8, 0, 2.5); teddy.rotation.y = -0.5; teddy.userData.noMerge = true; g.add(teddy); }); obst(8, 2.5, 2.4, 2.4);
    g.add(box(2.6, 0.12, 1.4, mat.metal(0xb0b8c0), 4, 0.5, 6), box(0.08, 1.2, 1.4, mat.metal(0xb0b8c0), 2.7, 1.1, 6)); obst(4, 6, 2.6, 1.4);
    a.late.push(() => { for (let i = 0; i < 4; i++) g.add(miniBag("mega", 0.5, 3.4 + (i % 2) * 0.9, 0.58, 5.8 + Math.floor(i / 2) * 0.5, 0.2 * i)); });
  }
  if (S.id === "winwin") {
    // bulk bins! scoop out a cheap mystery bag
    const binM = mat.std(0xffffff), lid = new THREE.MeshPhysicalMaterial({ color: 0xdff6ff, transparent: true, opacity: 0.3, roughness: 0.05 });
    const binCols = [0xff8ac8, 0xffd54a, 0x7ad3ff, 0x9ff0c8, 0xb18cff, 0xff8a3d];
    for (let r = 0; r < 2; r++) for (let i = 0; i < 6; i++) { const x = -5 + i * 1.3, z = 1.5 + r * 1.3; g.add(box(1.1, 1.1, 1.1, binM, x, 0.55, z), box(1.0, 0.25, 1.0, mat.std(binCols[(i + r) % 6], { roughness: 0.8 }), x, 1.0, z), box(1.12, 0.06, 1.12, lid, x, 1.16, z)); }
    obst(-1.75, 2.15, 8, 2.4); board(["🥄 BULK BINS", "Scoop a mystery bag!", "Only 🪙 8"], -1.75, 2.6, 0.7, 0, "#e53935", 2.8, 1.5);
    addIt({ id: "bins", kind: "bins", label: "🥄 Scoop from the bulk bins", fx: -1.75, fz: 4.6 }, -1.75, 2.15, 8, 2.5, 2.4);
    // a mountain of potatoes (for science)
    const spud = mat.std(0xc8935a, { roughness: 0.9 }); for (let i = 0; i < 26; i++) { const r = i < 14 ? 1.2 : i < 22 ? 0.7 : 0.25, an = i * 2.4, y = i < 14 ? 0.2 : i < 22 ? 0.5 : 0.8; const p = sphere(0.22, spud, 6.5 + Math.cos(an) * r, y, 3 + Math.sin(an) * r, 10); p.scale.set(1.2, 0.85, 0.9); g.add(p); } obst(6.5, 3, 3, 3);
    board(["🥔 POTATOES", "Not blind bags.", "Probably."], 6.5, 2.4, 1.2, 0, "#8a5a2b", 2.2, 1.3);
  }
  if (S.id === "teds") {
    const shelfM = mat.std(0xffffff, { roughness: 0.6 }), cols = [0xff8ac8, 0xffd54a, 0x7ad3ff, 0x9ff0c8, 0xb18cff, 0xff8a3d, 0xe53935];
    for (const x of [-7, 7]) { g.add(box(1.2, 2.6, 6, shelfM, x, 1.3, 2)); for (let yy = 0; yy < 3; yy++) for (let k = 0; k < 8; k++) for (const s of [-1, 1]) g.add(box(0.2, 0.5, 0.55, mat.std(cols[(k + yy) % cols.length], { roughness: 0.5 }), x + s * 0.65, 0.5 + yy * 0.8, -0.9 + k * 0.72)); obst(x, 2, 1.6, 6.2); }
    board(["AISLE 7", "Socks & Spoons"], -7, 3.1, 2, 0, "#3d6bfd", 1.6, 0.8); board(["AISLE 99", "Rubber Ducks"], 7, 3.1, 2, 0, "#3d6bfd", 1.6, 0.8);
    // the canoe. Ted sells EVERYTHING.
    const canoe = sphere(1, mat.std(0x2e9d6a, { roughness: 0.5 }), w / 2 - 0.6, 4.5, 0, 20); canoe.scale.set(0.35, 0.3, 3); g.add(canoe); board(["🛶 CANOE: 🪙 9,999"], w / 2 - 0.2, 3.3, 0, -Math.PI / 2, "#2e9d6a", 2.2, 0.5);
    // trade-in desk + hat rack
    g.add(box(2.4, 1.1, 1.0, mat.wood(0xc58a4a), -w / 2 + 2.4, 0.55, -2), box(2.6, 0.1, 1.2, mat.std(0x3d6bfd), -w / 2 + 2.4, 1.15, -2)); obst(-w / 2 + 2.4, -2, 2.4, 1);
    board(["🔄 TRADE-IN", "Doubles → coins!"], -w / 2 + 0.2, 2.6, -2, Math.PI / 2, "#ff3d7a", 2.2, 1.2);
    addIt({ id: "tradein", kind: "tradein", label: "🔄 Trade in your doubles", fx: -w / 2 + 2.4, fz: -0.2 }, -w / 2 + 2.4, -2, 2.4, 2.4, 1.4);
    g.add(cyl(0.06, 0.06, 2.4, mat.metal(), 8, w / 2 - 2.4, 1.2, -3), cyl(0.5, 0.5, 0.06, mat.metal(), 16, w / 2 - 2.4, 0.03, -3)); obst(w / 2 - 2.4, -3, 1, 1);
    a.late.push(() => { ["🎩", "👑", "🧢", "🎀"].forEach((e, i) => { const s = emojiSprite(e, 0.6); s.position.set(w / 2 - 2.4 + Math.cos(i * 1.57) * 0.5, 2.0 + (i % 2) * 0.3, -3 + Math.sin(i * 1.57) * 0.5); g.add(s); }); });
    addIt({ id: "hats", kind: "hats", label: "🎩 Try on hats", fx: w / 2 - 2.4, fz: -1.2 }, w / 2 - 2.4, -3, 1.4, 2.6, 1.4);
    // the stocking job: a heap of boxes and a help-wanted sign
    const card = mat.std(0xc9a26b, { roughness: 0.9 }); for (const [x, y, z, sz] of [[0, 0.4, 0, 0.8], [0.9, 0.35, 0.2, 0.7], [0.4, 1.1, 0.1, 0.6], [-0.7, 0.3, 0.4, 0.6]]) g.add(box(sz, sz, sz, card, w / 2 - 2.2 + x, y, 4.4 + z)); obst(w / 2 - 2.2, 4.5, 2.4, 1.6);
    board(["📦 HELP WANTED!", "Stock the shelves", "Earn coins!"], w / 2 - 0.2, 2.6, 4.5, -Math.PI / 2, "#2e9d6a", 2.4, 1.4);
    addIt({ id: "stock", kind: "job", label: "📦 Stock the shelves (job)", fx: w / 2 - 4.4, fz: 4.5 }, w / 2 - 2.2, 4.5, 2.6, 2.4, 1.8);
  }
  if (S.id === "cluck") {
    const hay = mat.std(0xe0c060, { roughness: 1 }), sack = mat.std(0xe8dcc0, { roughness: 1 });
    for (const [x, y, z] of [[-7, 0.35, -4], [-6, 0.35, -4], [-6.5, 1.0, -4], [7, 0.35, 4], [7, 0.35, 3], [-7, 0.35, 4]]) g.add(box(0.95, 0.65, 0.7, hay, x, y, z));
    for (let i = 0; i < 4; i++) g.add(box(0.7, 0.9, 0.45, sack, 5 + (i % 2) * 0.8, 0.45 + Math.floor(i / 2) * 0.9, -4.5)); board(["🌽 CHICKEN FEED", "(chickens only, please)"], 5.4, 2.8, -d / 2 + 0.2, 0, "#4caf50", 2.4, 1.0);
    obst(-6.5, -4, 2.2, 1); obst(7, 3.5, 1, 2); obst(-7, 4, 1, 0.8); obst(5.4, -4.5, 1.8, 0.8);
    a.late.push((anim) => { for (let i = 0; i < 5; i++) { const ch = makeChicken({ color: CHICKEN_COLORS[(i + 1) % CHICKEN_COLORS.length] }); ch.group.scale.setScalar(1.2); g.add(ch.group); const st = { x: rnd(-6, 6), z: rnd(0, 5), tx: 0, tz: 2, wait: rnd(0, 2) }; anim.push((dt, t) => { if (!g.visible) return; const dx = st.tx - st.x, dz = st.tz - st.z, dd = Math.hypot(dx, dz); let sp = 0; if (dd > 0.1) { sp = 1.2; st.x += (dx / dd) * sp * dt; st.z += (dz / dd) * sp * dt; ch.group.rotation.y = Math.atan2(dx, dz); } else if ((st.wait -= dt) < 0) { st.wait = rnd(1, 4); st.tx = rnd(-6, 6); st.tz = rnd(0.5, 5); } ch.group.position.set(st.x, 0, st.z); ch.update(dt, t + i, sp / 1.2, sp === 0); }); } });
  }
  if (S.id === "salon") {
    const chairM = mat.std(0xff8ac8, { roughness: 0.4 }), mirM = new THREE.MeshPhysicalMaterial({ color: 0xe8f4ff, metalness: 1, roughness: 0.04 }), gold = mat.metal(0xffc93c);
    for (const x of [-5.5, 5.5]) { g.add(box(1.0, 0.5, 1.0, chairM, x, 0.55, 1.5), box(1.0, 1.0, 0.25, chairM, x, 1.2, 1.0), cyl(0.12, 0.3, 0.3, gold, 12, x, 0.15, 1.5)); obst(x, 1.4, 1.2, 1.4); const mir = box(1.4, 1.8, 0.06, mirM, x, 2.2, -d / 2 + 0.2); g.add(mir, box(1.6, 2.0, 0.04, gold, x, 2.2, -d / 2 + 0.17)); }
    const sx = -w / 2 + 1.6, sz = 4.4; board(["💆 GLOW-UP STATION", "Pamper your faces!"], -w / 2 + 0.2, 2.6, sz, Math.PI / 2, "#ff3d9a", 2.6, 1.2);
    g.add(box(1.4, 0.9, 2.2, mat.std(0xffffff), sx, 0.45, sz), box(1.6, 0.08, 2.4, mat.std(0xff8ac8), sx, 0.92, sz)); obst(sx, sz, 1.4, 2.2);
    a.late.push(() => { const f = buildItem("faces-bunny", { lod: 0.5, glam: { acc: "bow", blush: true } }); f.scale.setScalar(0.55); f.position.set(sx, 0.96, sz); f.rotation.y = Math.PI / 2; f.userData.noMerge = true; g.add(f); });
    addIt({ id: "spa", kind: "spa", label: "💆 Glow-Up Station", fx: sx + 1.9, fz: sz }, sx, sz, 1.6, 2.4, 2.4);
  }
  if (S.id === "home") {
    const shelfM = mat.wood(0x9c6a3a); a.shelfSlots = [];
    for (const y of [0.7, 1.6, 2.5, 3.4, 4.3]) {
      const backN = 26, sideN = 16;
      g.add(box(w - 3, 0.1, 0.7, shelfM, 0, y, -d / 2 + 0.45)); for (let i = 0; i < backN; i++) a.shelfSlots.push([-(w - 4) / 2 + i * ((w - 4) / (backN - 1)), y + 0.06, -d / 2 + 0.45, 0]);
      for (const s of [-1, 1]) { g.add(box(0.7, 0.1, d - 7, shelfM, s * (w / 2 - 0.45), y, -2)); for (let i = 0; i < sideN; i++) a.shelfSlots.push([s * (w / 2 - 0.45), y + 0.06, -2 - (d - 8) / 2 + i * ((d - 8) / (sideN - 1)), -s * Math.PI / 2]); }
    }
    obst(0, -d / 2 + 0.45, w - 4, 0.8); obst(-(w / 2 - 0.45), -2, 0.8, d - 7); obst(w / 2 - 0.45, -2, 0.8, d - 7);
    const shelfGroup = new THREE.Group(); shelfGroup.userData.noMerge = true; g.add(shelfGroup); a.shelfGroup = shelfGroup;
    const rug = new THREE.Mesh(new THREE.CircleGeometry(3.2, 40), mat.std(0xff9ec6, { roughness: 1 })); rug.rotation.x = -Math.PI / 2; rug.position.set(0, 0.02, 1.5); g.add(rug);
    g.add(box(2.6, 0.6, 4, mat.std(0xffffff), -w / 2 + 2.6, 0.3, d / 2 - 3.4), box(2.6, 0.3, 4, mat.std(0xb18cff), -w / 2 + 2.6, 0.75, d / 2 - 3.4), box(2.2, 0.35, 0.9, mat.std(0xffffff), -w / 2 + 2.6, 0.95, d / 2 - 4.9), box(2.8, 1.4, 0.2, mat.wood(0x9c6a3a), -w / 2 + 2.6, 0.7, d / 2 - 5.5)); obst(-w / 2 + 2.6, d / 2 - 3.5, 2.8, 4.4);
    g.add(box(2.4, 0.1, 1.2, mat.wood(0xc58a4a), w / 2 - 2.4, 1.0, d / 2 - 3), box(0.1, 1, 0.1, mat.std(0x5a3a22), w / 2 - 3.5, 0.5, d / 2 - 3.5), box(0.1, 1, 0.1, mat.std(0x5a3a22), w / 2 - 1.3, 0.5, d / 2 - 2.5)); obst(w / 2 - 2.4, d / 2 - 3, 2.4, 1.2);
    g.add(box(0.7, 0.12, 0.5, mat.std(0xff3d9a), w / 2 - 2.4, 1.11, d / 2 - 3)); a.late.push(() => { const bk = emojiSprite("📖", 0.7); bk.position.set(w / 2 - 2.4, 1.7, d / 2 - 3); g.add(bk); });
    addIt({ id: "book", kind: "book", label: "📖 Open my Collection Book", fx: w / 2 - 2.4, fz: d / 2 - 1.4 }, w / 2 - 2.4, d / 2 - 3, 2.4, 2.2, 1.4);
    // a mirror (change your look) and your name sign (change your name)
    const mirM = new THREE.MeshPhysicalMaterial({ color: 0xe8f4ff, metalness: 1, roughness: 0.04 }); const mir = box(1.6, 2.6, 0.06, mirM, 4, 1.7, d / 2 - 0.25); mir.rotation.y = Math.PI; g.add(mir, box(1.8, 2.8, 0.04, mat.metal(0xffc93c), 4, 1.7, d / 2 - 0.2));
    addIt({ id: "mirror", kind: "look", label: "🪞 Change my look", fx: 4, fz: d / 2 - 2.0 }, 4, d / 2 - 0.5, 1.8, 2.8, 0.6);
    const ns = textPlane(["🏠 MY HOUSE"], 6, 0.8, { bg: "#3d8bfd", color: "#fff", size: 90 }); ns.position.set(0, h - 0.9, -d / 2 + 0.17); ns.userData.dyn = true; ns.userData.tw = 6 * 256; ns.userData.th = Math.round(0.8 * 256); ns.userData.bg = "#3d8bfd"; ns.userData.fg = "#ffffff"; g.add(ns); a.homeSign = ns;
    g.add(box(1.4, 1.0, 0.1, mat.wood(0xc58a4a), -4, 1.6, d / 2 - 0.25)); a.late.push(() => { const pen = emojiSprite("✏️", 0.6); pen.position.set(-4, 1.6, d / 2 - 0.5); g.add(pen); });
    addIt({ id: "name", kind: "name", label: "✏️ Change my name", fx: -4, fz: d / 2 - 2.0 }, -4, d / 2 - 0.5, 1.6, 2.4, 0.6);
  }
}
// parts are baked straight into the geometry: some are skewed, which pos/rot/scale can't represent
function refreshShelf(a, owned, glams) {
  const g = a.shelfGroup; if (!g) return; const have = CATALOG.filter((k) => owned[k.id]); const key = have.map((k) => k.id + (glams[k.id] ? JSON.stringify(glams[k.id]) : "")).join(","); if (key === a.shelfKey) return; a.shelfKey = key;
  while (g.children.length) { const c = g.children.pop(); c.traverse((o) => { if (o.geometry) o.geometry.dispose(); }); }
  have.slice(0, a.shelfSlots.length).forEach((k, i) => { const [x, y, z, ry] = a.shelfSlots[i]; const dm = buildItem(k, { lod: 0.35, glam: glams[k.id] }); const s = 0.6 / Math.max(0.6, dm.userData.H || 1); dm.scale.setScalar(s); dm.position.set(x, y, z); dm.rotation.y = ry; dm.updateMatrixWorld(true); dm.traverse((m) => { if (m.isMesh) { g.add(new THREE.Mesh(m.geometry.clone().applyMatrix4(m.matrixWorld), m.material)); } }); });
  mergeStatic(g);
}
function liteKid(look) { const k = makeKid(look); mergeStatic(k.group); return k; }
function addKeeper(a, k, animated) {
  const group = a.group; const kid = liteKid({ mood: "happy", ...k.look }); kid.group.position.set(k.x - group.position.x, k.main ? 0.35 : 0, k.z); if (k.main) group.add(box(2.2, 0.35, 1.4, mat.std(0x8a5a3a), k.x - group.position.x, 0.175, k.z)); kid.group.rotation.y = k.ry; group.add(kid.group); const ph = Math.random() * 5;
  if (k.main) a.keeperKid = kid.group; else a.sideKid = kid.group;
  animated.push((dt, t) => { if (!group.visible) return; kid.walk(t, 0, dt); kid.group.rotation.y = k.ry + Math.sin(t * 0.5 + ph) * 0.25; });
}
// a speech bubble sprite (canvas), wrapped to a few lines
function bubbleSprite(text) {
  const c = document.createElement("canvas"); c.width = 640; c.height = 300; const g = c.getContext("2d"); g.font = "800 40px system-ui, sans-serif";
  const words = text.split(" "), lines = []; let ln = ""; for (const w of words) { const t = ln ? ln + " " + w : w; if (g.measureText(t).width > 560 && ln) { lines.push(ln); ln = w; } else ln = t; } if (ln) lines.push(ln); const L = lines.slice(0, 4);
  const bh = 40 + L.length * 48; const y0 = 250 - bh; g.fillStyle = "rgba(60,30,60,.25)"; g.beginPath(); g.roundRect(14, y0 + 6, 612, bh, 36); g.fill();
  g.fillStyle = "#fff"; g.strokeStyle = "#ff8ac8"; g.lineWidth = 6; g.beginPath(); g.roundRect(10, y0, 612, bh, 36); g.fill(); g.stroke(); g.beginPath(); g.moveTo(290, y0 + bh - 3); g.lineTo(320, 296); g.lineTo(350, y0 + bh - 3); g.closePath(); g.fill(); g.beginPath(); g.moveTo(290, y0 + bh); g.lineTo(320, 296); g.lineTo(350, y0 + bh); g.stroke();
  g.fillStyle = "#4a2b3b"; g.textAlign = "center"; g.textBaseline = "middle"; L.forEach((l, i) => g.fillText(l, 316, y0 + 44 + i * 48));
  const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace; const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthTest: false, depthWrite: false })); sp.scale.set(3.9, 1.83, 1); sp.center.set(0.5, 0); sp.renderOrder = 10; return sp;
}

// ==========================================================================
//  Outdoors — grass, roads, a parking lot full of stray carts, the plaza
// ==========================================================================
const TOWNSFOLK = [
  { name: "Sam", x: -8, z: 10, r: 4, look: { shirt: 0x3d8bfd, hair: 0x222222, hairStyle: "short", skin: 0x8d5a3c } },
  { name: "Mia", x: 10, z: 4, r: 4, look: { shirt: 0xff8ac8, hair: 0xe8c36a, hairStyle: "ponytail", skin: 0xffd6b8 } },
  { name: "Leo", x: -18, z: 18, r: 3, look: { shirt: 0x00c853, hair: 0xa33a1e, hairStyle: "curly", skin: 0xf1c9a5, hat: "🧢" } },
  { name: "Ava", x: 18, z: 30, r: 4, look: { shirt: 0xffd54a, hair: 0x6b3e1e, hairStyle: "bun", skin: 0xc68642 } },
  { name: "Kai", x: 20, z: -18, r: 5, look: { shirt: 0x7a3cff, hair: 0x222222, hairStyle: "short", skin: 0xe0ac8a } },
  { name: "Zoe", x: -20, z: -18, r: 5, look: { shirt: 0xff7043, hair: 0xd7ccc8, hairStyle: "long", skin: 0xffd6b8, hat: "🌸" } },
  { name: "Noah", x: 0, z: 20, r: 5, look: { shirt: 0xffffff, hair: 0x8a5a2b, hairStyle: "short", skin: 0x5c3a21 } },
  { name: "Lily", x: -26, z: 6, r: 3, look: { shirt: 0x00e5ff, hair: 0x3d8bfd, hairStyle: "long", skin: 0xf1c9a5 } },
  { name: "Max", x: 26, z: 8, r: 3, look: { shirt: 0xe53935, hair: 0xe8c36a, hairStyle: "curly", skin: 0xffd6b8, hat: "🎩" } },
];
const CORRAL = { x: 13, z: -16 };
const YARD = { x: -31, z: 35.5, w: 12, d: 7 };
const CART_SPOTS = [[-12, -20], [-6, -13], [7, -22], [-15, -12], [2, -18], [19, -13], [-20, -16], [10, 14], [-11, 24], [24, 2], [-24, -2], [16, -24]];
function buildOutdoor(g, a, animated) {
  const sky = canvasTex(4, 256, (c, w, h) => { const gr = c.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, "#5fb6ff"); gr.addColorStop(0.55, "#bfe3ff"); gr.addColorStop(1, "#ffe6f1"); c.fillStyle = gr; c.fillRect(0, 0, w, h); });
  const dome = new THREE.Mesh(new THREE.SphereGeometry(220, 32, 16), new THREE.MeshBasicMaterial({ map: sky, side: THREE.BackSide, fog: false, depthWrite: false })); dome.userData.dyn = true; g.add(dome);
  const grass = canvasTex(256, 256, (c, w) => { c.fillStyle = "#7cc56a"; c.fillRect(0, 0, w, w); for (let i = 0; i < 3000; i++) { c.fillStyle = `rgba(${rnd(40, 110) | 0},${rnd(140, 200) | 0},${rnd(50, 90) | 0},.5)`; c.fillRect(rnd(0, w), rnd(0, w), 2, rnd(2, 5)); } }, 60);
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(460, 460), new THREE.MeshStandardMaterial({ map: grass, roughness: 1 })); ground.rotation.x = -Math.PI / 2; ground.position.y = -0.01; g.add(ground);
  const paveTex = canvasTex(512, 512, (c, w) => { c.fillStyle = "#cfc6bb"; c.fillRect(0, 0, w, w); const s = 64; for (let y = 0; y < w; y += s) for (let x = 0; x < w; x += s) { const v = rnd(-12, 12); c.fillStyle = `rgb(${226 + v},${218 + v},${208 + v})`; c.fillRect(x + 2, y + 2, s - 4, s - 4); } });
  const asphalt = canvasTex(256, 256, (c, w) => { c.fillStyle = "#5a5e66"; c.fillRect(0, 0, w, w); for (let i = 0; i < 2500; i++) { const v = rnd(70, 120) | 0; c.fillStyle = `rgba(${v},${v},${v + 6},.6)`; c.fillRect(rnd(0, w), rnd(0, w), 2, 2); } });
  const pave = (x, z, w, d, y = 0, tex = paveTex, rep = 5) => { const t = tex.clone(); t.needsUpdate = true; t.repeat.set(w / rep, d / rep); const m = new THREE.Mesh(new THREE.PlaneGeometry(w, d), new THREE.MeshStandardMaterial({ map: t, roughness: 0.9 })); m.rotation.x = -Math.PI / 2; m.position.set(x, y, z); g.add(m); };
  pave(0, 10, 36, 24, 0.004); pave(0, 0, 9, 84, 0.002); pave(0, -4, 92, 9, 0.003);
  // the giant parking lot in front of Bulk-O-Rama (with painted spaces)
  pave(0, -18.5, 40, 15, 0.005, asphalt, 6); const lineM = mat.basic(0xffffff);
  for (let i = -9; i <= 9; i++) for (const z of [-22.5, -14.5]) { const l = box(0.12, 0.01, 3.4, lineM, i * 2, 0.012, z); g.add(l); }
  for (const S of SHOPS) { if (S.id === "bulk") continue; const fx = Math.sin(S.ry), fz = Math.cos(S.ry), L = 8; const cx = S.x + fx * (S.d / 2 + L / 2), cz = S.z + fz * (S.d / 2 + L / 2); pave(cx, cz, Math.abs(fz) > 0.5 ? 4 : L, Math.abs(fz) > 0.5 ? L : 4, 0.001); }
  // the cart corral
  const corM = mat.metal(0xc8ced6); const Cx = CORRAL.x, Cz = CORRAL.z; for (const s of [-1, 1]) g.add(box(0.1, 1.0, 4, corM, Cx + s * 1.2, 0.5, Cz)); g.add(box(2.4, 0.1, 0.1, corM, Cx, 1.0, Cz - 2));
  const cs = textPlane(["🛒 CART CORRAL", "Return carts = 🪙"], 2.6, 1.2, { bg: "#e53935", color: "#fff", size: 70 }); cs.position.set(Cx, 2.1, Cz - 2); g.add(cs); g.add(box(0.1, 1.6, 0.1, corM, Cx - 1.2, 1.4, Cz - 2), box(0.1, 1.6, 0.1, corM, Cx + 1.2, 1.4, Cz - 2));
  const glowRing = new THREE.Mesh(new THREE.RingGeometry(2.4, 2.8, 40), new THREE.MeshBasicMaterial({ color: 0xffd54a, transparent: true, opacity: 0.5, depthWrite: false })); glowRing.rotation.x = -Math.PI / 2; glowRing.position.set(Cx, 0.02, Cz); glowRing.userData.dyn = true; g.add(glowRing); animated.push((dt, t) => { glowRing.material.opacity = 0.3 + Math.sin(t * 3) * 0.2; });
  a.obstacles.push({ x: Cx - 1.2, z: Cz, w: 0.3, d: 4 }, { x: Cx + 1.2, z: Cz, w: 0.3, d: 4 });
  // hedges round the edge, with a gap at the south gate
  const hedgeM = mat.std(0x3f9a4a, { roughness: 1 });
  for (const [x, z, w, d] of [[0, OUT.minZ - 0.5, 94, 1], [OUT.minX - 0.5, 0, 1, 88], [OUT.maxX + 0.5, 0, 1, 88], [-26, OUT.maxZ + 0.5, 42, 1], [26, OUT.maxZ + 0.5, 42, 1]]) g.add(box(w, 1.1, d, hedgeM, x, 0.55, z));
  const hillM = mat.std(0x6db35c, { roughness: 1 }), hillM2 = mat.std(0x8cc97a, { roughness: 1 });
  for (let i = 0; i < 16; i++) { const an = (i / 16) * Math.PI * 2, r = rnd(110, 150); const h = sphere(rnd(22, 38), i % 2 ? hillM : hillM2, Math.cos(an) * r, -8, Math.sin(an) * r, 20); h.scale.y = rnd(0.5, 0.9); g.add(h); }
  const cloudM = mat.std(0xffffff, { roughness: 1, emissive: 0xffffff, emissiveIntensity: 0.25 });
  for (let i = 0; i < 10; i++) { const c = new THREE.Group(); c.userData.dyn = true; c.userData.noMerge = true; for (let k = 0; k < 5; k++) c.add(sphere(rnd(2.5, 4.5), cloudM, k * 3 - 6, rnd(-0.8, 0.8), rnd(-1.5, 1.5), 14)); c.scale.y = 0.6; const an = (i / 10) * Math.PI * 2; c.position.set(Math.cos(an) * 110, rnd(34, 55), Math.sin(an) * 110); g.add(c); animated.push((dt) => { c.position.x += dt * 1.2; if (c.position.x > 150) c.position.x = -150; }); }
  const trunkM = mat.std(0x7a4f2e, { roughness: 1 }), pinkM = mat.std(0xffb7d5, { roughness: 0.9 }), pinkM2 = mat.std(0xff9ec6, { roughness: 0.9 }), leafM = mat.std(0x4caf50, { roughness: 0.9 }), leafM2 = mat.std(0x66bb6a, { roughness: 0.9 });
  const tree = (x, z, blossom, s = 1) => { g.add(cyl(0.22 * s, 0.32 * s, 2.6 * s, trunkM, 10, x, 1.3 * s, z)); for (let k = 0; k < 4; k++) g.add(sphere(rnd(1.1, 1.6) * s, blossom ? (k % 2 ? pinkM : pinkM2) : k % 2 ? leafM : leafM2, x + rnd(-0.9, 0.9) * s, (3.1 + rnd(0, 1.1)) * s, z + rnd(-0.9, 0.9) * s, 14)); const sh = blobShadow(2 * s, 0.3); sh.position.set(x, 0.02, z); g.add(sh); a.obstacles.push({ x, z, w: 0.6 * s, d: 0.6 * s }); };
  [[-43, -40], [-36, -41], [43, -40], [36, -41], [-43, -16], [43, -16], [-43, 12], [43, 12], [-44, 38], [44, 38], [28, 40], [22, 36], [-8, 36], [10, 38], [-22, -26], [22, -26], [-27, 5.5], [30, 8], [14, 22], [-6, 30]].forEach(([x, z], i) => tree(x, z, i % 3 !== 1, rnd(0.9, 1.25)));
  const postM = mat.std(0x2f3542, { roughness: 0.5, metalness: 0.5 }), bulbM = new THREE.MeshStandardMaterial({ color: 0xfff3c4, emissive: 0xffe08a, emissiveIntensity: 1 });
  for (const [x, z] of [[-6, 26], [6, 26], [-6, 38], [6, 38], [-22, -8], [-22, 0], [22, -8], [22, 0], [-18, -24], [18, -24], [-18, -12], [18, -12]]) { g.add(cyl(0.08, 0.12, 4, postM, 8, x, 2, z), sphere(0.3, bulbM, x, 4.15, z, 12), cyl(0.32, 0.18, 0.18, postM, 10, x, 4.45, z)); a.obstacles.push({ x, z, w: 0.3, d: 0.3 }); }
  const benchM = mat.wood(0xa8703a), ironM = mat.std(0x333344, { roughness: 0.5, metalness: 0.6 });
  for (const [x, z, r] of [[-9, 6, 0.6], [9, 6, -0.6], [-9, 16, 2.5], [9, 16, -2.5], [-20, 26, 0.9], [20, 28, 0]]) { const b = new THREE.Group(); b.add(box(2.2, 0.12, 0.6, benchM, 0, 0.55, 0), box(2.2, 0.5, 0.1, benchM, 0, 0.9, -0.28), box(0.1, 0.55, 0.5, ironM, -0.9, 0.27, 0), box(0.1, 0.55, 0.5, ironM, 0.9, 0.27, 0)); b.position.set(x, 0, z); b.rotation.y = r; g.add(b); a.obstacles.push({ x, z, w: 1.6, d: 1.6 }); }
  const fm = [0xff5d8f, 0xffd54a, 0xffffff, 0xb36bff].map((c) => mat.std(c));
  for (let i = 0; i < 160; i++) { const x = rnd(-44, 44), z = rnd(-42, 40); if ((Math.abs(x) < 19 && z > -3 && z < 23) || Math.abs(x) < 5.5 || Math.abs(z + 4) < 5.5 || (Math.abs(x) < 21 && z < -10)) continue; g.add(sphere(0.12, pick(fm), x, 0.12, z, 6)); }
  // the plaza fountain, topped with a giant spinning blind bag
  const stoneM = mat.std(0xd9d2c6, { roughness: 0.8 });
  g.add(new THREE.Mesh(new THREE.LatheGeometry([[0, 0], [3.4, 0], [3.5, 0.2], [3.5, 0.7], [3.2, 0.75], [3.1, 0.3], [0, 0.3]].map(([x, y]) => new THREE.Vector2(x, y)), 48), stoneM).translateZ(10), cyl(0.9, 1.1, 1.0, stoneM, 24, 0, 0.75, 10));
  const water = new THREE.Mesh(new THREE.CircleGeometry(3.15, 48), new THREE.MeshPhysicalMaterial({ color: 0x5ec8f0, roughness: 0.05, clearcoat: 1, transparent: true, opacity: 0.85 })); water.rotation.x = -Math.PI / 2; water.position.set(0, 0.6, 10); water.userData.dyn = true; g.add(water);
  animated.push((dt, t) => { water.position.y = 0.6 + Math.sin(t * 2) * 0.015; });
  a.obstacles.push({ x: 0, z: 10, w: 7, d: 7 });
  const statue = makeBag("snacks"); statue.scale.setScalar(2.2); statue.position.set(0, 1.25, 10); statue.userData.noMerge = true; g.add(statue); animated.push((dt, t) => { statue.rotation.y = t * 0.5; statue.position.y = 1.3 + Math.sin(t * 1.5) * 0.1; });
  // welcome arch over the south gate
  const poleM = mat.std(0xff5da2, { roughness: 0.6 }), capM = mat.gloss(0xffd54a);
  const arch = new THREE.Group(); arch.add(cyl(0.3, 0.3, 5.4, poleM, 12, -3.4, 2.7, 0), cyl(0.3, 0.3, 5.4, poleM, 12, 3.4, 2.7, 0), box(8.4, 0.5, 0.6, poleM, 0, 5.4, 0), box(9.2, 0.25, 0.9, capM, 0, 5.8, 0));
  const sign = textPlane(["🛍️ Blind Bag Town 🛍️"], 6.6, 0.9, { bg: "#7a3cff", color: "#fff3a0", size: 110 }); sign.position.set(0, 4.75, 0.31); arch.add(sign); const sign2 = sign.clone(); sign2.rotation.y = Math.PI; sign2.position.z = -0.31; arch.add(sign2);
  arch.position.set(0, 0, OUT.maxZ - 0.6); g.add(arch); a.obstacles.push({ x: -3.4, z: OUT.maxZ - 0.6, w: 0.7, d: 0.7 }, { x: 3.4, z: OUT.maxZ - 0.6, w: 0.7, d: 0.7 });
  // a "chicken crossing" road sign (very important)
  const xs = new THREE.Group(); xs.add(cyl(0.06, 0.06, 2.4, postM, 8, 0, 1.2, 0)); const dia = box(1.1, 1.1, 0.06, mat.std(0xffd23a), 0, 2.5, 0); dia.rotation.z = Math.PI / 4; xs.add(dia); xs.position.set(-17, 0, 1.6); g.add(xs); a.obstacles.push({ x: -17, z: 1.6, w: 0.3, d: 0.3 });
  const xe = emojiSprite("🐔", 0.75); xe.position.set(-17, 2.5, 1.66); g.add(xe);
  // your chicken yard, next to your house: a fence, a little coop and nests full of eggs
  const Y = YARD, yw = Y.w / 2, yd = Y.d / 2, fenceM = mat.wood(0xf3ead8);
  for (let x = -yw; x <= yw + 0.01; x += 1) for (const z of [-yd, yd]) if (!(z === -yd && Math.abs(x) < 1.1)) g.add(box(0.14, 1.0, 0.14, fenceM, Y.x + x, 0.5, Y.z + z));
  for (let z = -yd + 1; z < yd; z += 1) for (const x of [-yw, yw]) g.add(box(0.14, 1.0, 0.14, fenceM, Y.x + x, 0.5, Y.z + z));
  for (const x of [-yw, yw]) g.add(box(0.08, 0.1, Y.d, fenceM, Y.x + x, 0.75, Y.z)); g.add(box(Y.w, 0.1, 0.08, fenceM, Y.x, 0.75, Y.z + yd)); for (const s of [-1, 1]) g.add(box(yw - 1.1, 0.1, 0.08, fenceM, Y.x + s * (yw + 1.1) / 2, 0.75, Y.z - yd));
  const strawM = mat.std(0xe8cf7a, { roughness: 1 }); const straw = new THREE.Mesh(new THREE.PlaneGeometry(Y.w - 0.3, Y.d - 0.3), strawM); straw.rotation.x = -Math.PI / 2; straw.position.set(Y.x, 0.015, Y.z); g.add(straw);
  const hutM = mat.std(0xff8ac8), hutR = mat.std(0x7a3cff); g.add(box(2.6, 1.8, 2.2, hutM, Y.x - yw + 1.6, 0.9, Y.z)); const hr = new THREE.Mesh(new THREE.ConeGeometry(2.1, 1.1, 4), hutR); hr.position.set(Y.x - yw + 1.6, 2.35, Y.z); hr.rotation.y = Math.PI / 4; g.add(hr); g.add(box(0.05, 0.9, 0.8, mat.std(0x3a2010), Y.x - yw + 2.92, 0.45, Y.z));
  for (let i = 0; i < 3; i++) g.add(box(0.8, 0.5, 0.7, mat.wood(0xb8894a), Y.x - 1 + i * 1.1, 0.25, Y.z + yd - 0.6));
  const nest = new THREE.Group(); nest.userData.noMerge = true; g.add(nest); a.yardEggs = nest; for (let i = 0; i < 9; i++) { const e = makeEgg(i === 4); e.scale.setScalar(0.9); e.position.set(Y.x - 1.2 + (i % 3) * 1.1 + (Math.floor(i / 3) - 1) * 0.18, 0.42, Y.z + yd - 0.6 + (Math.floor(i / 3) - 1) * 0.12); e.visible = false; nest.add(e); }
  const ys = textPlane(["🐔 MY CHICKEN YARD"], 4, 0.7, { bg: "#ff8ac8", color: "#ffffff", size: 90 }); ys.position.set(Y.x, 1.75, Y.z - yd - 0.05); ys.rotation.y = Math.PI; g.add(ys); g.add(box(0.12, 1.7, 0.12, fenceM, Y.x - 1.1, 0.85, Y.z - yd), box(0.12, 1.7, 0.12, fenceM, Y.x + 1.1, 0.85, Y.z - yd));
  a.obstacles.push({ x: Y.x, z: Y.z, w: Y.w + 0.2, d: Y.d + 0.2 });
  const yit = { id: "yard", kind: "yard", label: "🐔 My chicken yard", name: "My Chicken Yard", front: new THREE.Vector3(Y.x, 0, Y.z - yd - 1.6) }; hitZone(g, yit, Y.w, 2, Y.d, Y.x, 1, Y.z); a.interactables.push(yit);
  for (const S of SHOPS) buildBuilding(S, a, animated);
}
