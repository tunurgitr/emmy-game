// ==========================================================================
//  Emmy's Dumpling Town 3D — the play table.
//
//  createTable(kind, envMap, opts) → controller for town.setOverride():
//    { scene, camera, update, onDown, onMove, onUp, peek(on), dispose }
//  With opts.fromSteamer the dumpling starts hidden in a bamboo steamer: tap
//  the lid, steam puffs out and the dumpling hops onto the table. Then:
//    • press & hold on it → squish (it slowly rises back when you let go)
//    • drag → spin it round
//    • peek(true) / drag sideways in peek mode → pull it apart to see inside
// ==========================================================================
import { THREE, rnd, clamp, approach, makeParticles, woodTexture } from "../arcade3d/lib.js";
import { buildDumpling, makeSquish, makeHalves, makeSteamer, byId, RARITY } from "./models.js";

const SCALE = 0.85;

export function createTable(kindId, envMap, { fromSteamer = false, sfx = {}, onReveal, onSquish, onOpen, onPhase } = {}) {
  const kind = byId(kindId);
  const scene = new THREE.Scene(); scene.environment = envMap; scene.environmentIntensity = 0.4;
  scene.background = bgTexture();
  const camera = new THREE.PerspectiveCamera(38, 1, 0.05, 60); const camHome = new THREE.Vector3(0, 1.75, 3.5), lookHome = new THREE.Vector3(0, 0.42, 0.3);
  camera.position.set(0, 1.75, 3.5); camera.lookAt(lookHome);
  // warm soft key light with real shadows, cool fill, back rim
  scene.add(new THREE.HemisphereLight(0xfff6ee, 0x6b4a33, 0.55));
  const key = new THREE.DirectionalLight(0xfff0dd, 1.7); key.position.set(2.5, 5.5, 3.5); key.castShadow = true; key.shadow.mapSize.set(1024, 1024); key.shadow.radius = 6; key.shadow.bias = -0.0005; Object.assign(key.shadow.camera, { left: -3, right: 3, top: 3, bottom: -3, near: 0.5, far: 15 }); scene.add(key);
  const rim = new THREE.DirectionalLight(0xffd9f2, 1.1); rim.position.set(-3, 3, -4); scene.add(rim);
  // the wooden table and a round placemat
  const wood = woodTexture(0xb27a45, 3); const table = new THREE.Mesh(new THREE.PlaneGeometry(24, 16), new THREE.MeshStandardMaterial({ map: wood, roughness: 0.65 })); table.rotation.x = -Math.PI / 2; table.receiveShadow = true; scene.add(table);
  const mat = new THREE.Mesh(new THREE.CircleGeometry(1.75, 64), new THREE.MeshStandardMaterial({ color: 0xf6d9e2, roughness: 0.95 })); mat.rotation.x = -Math.PI / 2; mat.position.set(0, 0.005, 0.3); mat.receiveShadow = true; scene.add(mat);
  const glow = new THREE.Mesh(new THREE.CircleGeometry(1.7, 48), new THREE.MeshBasicMaterial({ map: glowTexture(RARITY[kind.rarity].color), transparent: true, depthWrite: false, opacity: 0 })); glow.rotation.x = -Math.PI / 2; glow.position.set(0, 0.012, 0.3); scene.add(glow);
  const parts = makeParticles(scene, 260); const puffs = makePuffs(scene);

  // ---- the dumpling (whole) -------------------------------------------------
  const holder = new THREE.Group(); holder.position.set(0, 0, 0.3); scene.add(holder);
  const dump = buildDumpling(kind); dump.scale.setScalar(SCALE); holder.add(dump); castAll(dump);
  const squish = makeSquish(dump); const H = dump.userData.H * SCALE;
  let spin = 0.0, spinV = 0.35;

  // ---- the steamer reveal --------------------------------------------------
  let phase = fromSteamer ? "closed" : "play", pt = 0, steamer = null, lidFrom = null;
  if (fromSteamer) {
    steamer = makeSteamer(1.45, 0.62); steamer.position.set(0, 0, 0.3); castAll(steamer); scene.add(steamer);
    dump.scale.setScalar(SCALE * 0.62); holder.position.set(0, 0.07, 0.3); holder.visible = true;
  } else { glow.material.opacity = 0.4; }

  // ---- pull apart -------------------------------------------------------------
  let split = null, splitK = 0, splitTarget = 0, opened = false, peekMode = false; const strands = [];
  function ensureSplit() {
    if (split) return; split = makeHalves(kind);
    for (const h of split.halves) { h.scale.setScalar(SCALE); castAll(h); holder.add(h); h.visible = false; }
    if (split.stretchy) { const m = new THREE.MeshPhysicalMaterial({ color: kind.fill === "cotton" ? 0xffc8e8 : 0xfffaf2, roughness: 0.4, clearcoat: 0.6, transparent: true, opacity: 0.92 }); for (let i = 0; i < split.halves[0].userData.anchors.length; i++) { const s = new THREE.Mesh(new THREE.CylinderGeometry(1, 1, 1, 8), m); s.visible = false; holder.add(s); strands.push(s); } }
  }
  const _a = new THREE.Vector3(), _b = new THREE.Vector3(), _up = new THREE.Vector3(0, 1, 0), _d = new THREE.Vector3();
  function layoutSplit(dt, t) {
    const [L, R] = split.halves, k = splitK, R0 = dump.userData.R * SCALE;
    L.position.set(-k * R0 * 0.75, k * 0.05, 0); L.rotation.y = -k * 0.95; R.position.set(k * R0 * 0.75, k * 0.05, 0); R.rotation.y = k * 0.95;
    for (const [i, h] of split.halves.entries()) { h.updateMatrixWorld(true); const pl = h.userData.plane; pl.normal.set(i ? 1 : -1, 0, 0); pl.constant = 0; pl.applyMatrix4(h.matrixWorld); }
    strands.forEach((s, i) => { const show = k > 0.02 && k < 0.8; s.visible = show; if (!show) return; L.userData.anchors[i].getWorldPosition(_a); R.userData.anchors[i].getWorldPosition(_b); holder.worldToLocal(_a); holder.worldToLocal(_b); _d.subVectors(_b, _a); const len = _d.length(); s.position.addVectors(_a, _b).multiplyScalar(0.5); s.quaternion.setFromUnitVectors(_up, _d.normalize()); const r = 0.06 * (1 - k / 0.8) + 0.008; s.scale.set(r, len, r * 0.8); });
    const f = L.userData.friend; if (f && opened) { f.position.y = (f.userData.baseY ?? (f.userData.baseY = f.position.y)) + Math.abs(Math.sin(t * 3)) * 0.12; if (L.userData.friendAnim) L.userData.friendAnim.update(dt, t, 0, false); else f.rotation.x += dt * 2; }
  }
  function peek(on) {
    if (phase !== "play") return; peekMode = on; ensureSplit();
    if (on) { dump.visible = false; split.halves.forEach((h) => (h.visible = true)); splitK = 0; splitTarget = 1; sfx.tear && sfx.tear(); }
    else { splitTarget = 0; }
  }

  // ---- input ----------------------------------------------------------------
  let down = null; const ray = new THREE.Raycaster();
  function onDown(p) {
    if (phase === "closed") { // tap anywhere to lift the lid
      phase = "lifting"; pt = 0; lidFrom = steamer.userData.lid.position.clone(); sfx.whoosh && sfx.whoosh(); onPhase && onPhase("lifting");
      for (let i = 0; i < 14; i++) puffs.emit(rnd(-1.2, 1.2), 0.9, 0.3 + rnd(-1.2, 1.2), 1.4); return;
    }
    if (phase !== "play") return;
    down = { x: p.sx, y: p.sy, lastX: p.sx, squish: false, moved: 0, t: performance.now() };
    if (peekMode) return;
    const hit = p.ray.intersectObject(dump, true)[0];
    if (hit) { const local = dump.worldToLocal(hit.point.clone()); squish.setPress(local); squish.hold(true); down.squish = true; sfx.squish && sfx.squish(); }
  }
  function onMove(p) {
    if (!down) return; const dx = p.sx - down.lastX; down.lastX = p.sx; down.moved += Math.abs(dx);
    if (peekMode) { splitTarget = clamp(splitTarget + dx / 260 * Math.sign(p.sx - (p.W / 2)) , 0, 1); return; }
    if (down.squish && down.moved > 18) { squish.hold(false); down.squish = false; }
    if (!down.squish) { spinV = dx * 0.6; spin += dx * 0.012; }
  }
  function onUp() {
    if (!down) return;
    if (down.squish) { squish.hold(false); sfx.unsquish && sfx.unsquish(); onSquish && onSquish(squish.amount); }
    if (peekMode && down.moved < 6) splitTarget = splitTarget > 0.5 ? 0 : 1; // tap to toggle open/closed
    down = null;
  }

  // ---- update -----------------------------------------------------------------
  let t = 0; const camTarget = new THREE.Vector3(), _home = new THREE.Vector3();
  // portrait screens (phones) need the camera further back so the whole dumpling fits
  const home = () => _home.subVectors(camHome, lookHome).multiplyScalar(Math.pow(Math.max(1, 1.2 / camera.aspect), 0.85)).add(lookHome);
  function update(dt) {
    t += dt; parts.update(dt); puffs.update(dt);
    if (phase === "closed") {
      const lid = steamer.userData.lid; lid.rotation.z = Math.sin(t * 22) * 0.02 * Math.max(0, Math.sin(t * 2.2)); lid.position.y = 0.62 + Math.max(0, Math.sin(t * 2.2)) * 0.03;
      if (Math.random() < dt * 3) puffs.emit(rnd(-1.3, 1.3), 1.0, 0.3 + rnd(-1.3, 1.3), 0.5);
      camera.position.lerp(camTarget.set(0, 3.2, 5.6), Math.min(1, dt * 2)); camera.lookAt(0, 0.4, 0.3);
    } else if (phase === "lifting") {
      pt += dt; const lid = steamer.userData.lid, k = Math.min(1, pt / 0.9), e = 1 - (1 - k) ** 3;
      lid.position.set(lidFrom.x + e * 2.6, lidFrom.y + Math.sin(k * Math.PI) * 1.4 + e * 0.2, lidFrom.z - e * 1.5); lid.rotation.z = -e * 0.9; lid.rotation.x = -e * 0.4;
      if (pt > 0.35 && pt - dt <= 0.35) { phase = "hop"; pt = 0; sfx.pop && sfx.pop(); }
    }
    if (phase === "hop") { // jump out of the steamer onto the placemat, then land with a squash
      pt += dt; const k = Math.min(1, pt / 0.75); const lid = steamer.userData.lid; const kl = Math.min(1, (pt + 0.55) / 0.9), el = 1 - (1 - kl) ** 3; lid.position.set(lidFrom.x + el * 2.6, lidFrom.y + Math.sin(kl * Math.PI) * 1.4 + el * 0.2, lidFrom.z - el * 1.5); lid.rotation.z = -el * 0.9;
      steamer.position.z = 0.3 - k * 3.2; steamer.position.x = -k * 2.6; steamer.rotation.y = k * 0.4;
      holder.position.set(0, 0.07 + Math.sin(k * Math.PI) * 1.6 + (1 - k) * 0, 0.3); dump.scale.setScalar(SCALE * (0.62 + 0.38 * k)); spin = k * Math.PI * 2;
      camera.position.lerp(home(), Math.min(1, dt * 3)); camera.lookAt(lookHome);
      if (k >= 1) { phase = "play"; holder.position.y = 0; squish.setPress(new THREE.Vector3(0, dump.userData.H, 0)); squish.hold(true); setTimeout(() => squish.hold(false), 120); revealFx(); onReveal && onReveal(); onPhase && onPhase("play"); }
    }
    if (phase === "play") {
      camera.position.lerp(home(), Math.min(1, dt * 3)); camera.lookAt(lookHome);
      
      if (!down || down.squish) { spin += spinV * dt; spinV = approach(spinV, 0.25, 1.2, dt); }
      glow.material.opacity = 0.32 + Math.sin(t * 2.4) * 0.12;
    }
    holder.rotation.y = spin; squish.update(dt);
    if (split) {
      splitK = approach(splitK, splitTarget, 5, dt);
      if (splitK > 0.6 && !opened) { opened = true; sfx.pop && sfx.pop(); parts.burst(new THREE.Vector3(0, H * 0.5, 0.3), 0xffffff, 26, 2.2, 0.8, 3); onOpen && onOpen(split.fill); }
      if (splitK < 0.4) opened = false;
      if (!peekMode && splitK < 0.01) { split.halves.forEach((h) => (h.visible = false)); strands.forEach((s) => (s.visible = false)); dump.visible = true; }
      if (split.halves[0].visible) layoutSplit(dt, t);
    }
  }
  function revealFx() {
    const c = new THREE.Color(RARITY[kind.rarity].color), at = new THREE.Vector3(0, H * 0.6, 0.3), big = RARITY[kind.rarity].order >= 2;
    parts.burst(at, c, big ? 90 : 40, big ? 3.5 : 2.5, 1.2, 3); parts.burst(at, 0xffffff, 30, 2, 1, 2); glow.material.opacity = 0.6;
    for (let i = 0; i < 8; i++) puffs.emit(rnd(-1, 1), 0.3, 0.3 + rnd(-0.8, 0.8), 1);
  }
  return {
    scene, camera, update, onDown, onMove, onUp, peek,
    get phase() { return phase; }, get peeking() { return peekMode; }, get squishAmount() { return squish.amount; },
    openLid() { if (phase === "closed") onDown({}); },
    dispose() { scene.traverse((o) => { if (o.geometry) o.geometry.dispose(); }); parts.dispose(); },
  };
}

function castAll(g) { g.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } }); }
let bgTex = null;
function bgTexture() { if (bgTex) return bgTex; const c = document.createElement("canvas"); c.width = 512; c.height = 512; const g = c.getContext("2d"); const gr = g.createRadialGradient(256, 200, 20, 256, 256, 420); gr.addColorStop(0, "#fff3e6"); gr.addColorStop(0.6, "#ffd9e8"); gr.addColorStop(1, "#cfa9d9"); g.fillStyle = gr; g.fillRect(0, 0, 512, 512); bgTex = new THREE.CanvasTexture(c); bgTex.colorSpace = THREE.SRGBColorSpace; return bgTex; }
const glowCache = new Map();
function glowTexture(color) { if (glowCache.has(color)) return glowCache.get(color); const c = document.createElement("canvas"); c.width = c.height = 128; const g = c.getContext("2d"); const gr = g.createRadialGradient(64, 64, 10, 64, 64, 64); gr.addColorStop(0, color); gr.addColorStop(0.5, color + "88"); gr.addColorStop(1, color + "00"); g.fillStyle = gr; g.fillRect(0, 0, 128, 128); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; glowCache.set(color, t); return t; }
function makePuffs(scene) {
  const c = document.createElement("canvas"); c.width = c.height = 64; const g = c.getContext("2d"); const gr = g.createRadialGradient(32, 32, 2, 32, 32, 32); gr.addColorStop(0, "rgba(255,255,255,.85)"); gr.addColorStop(1, "rgba(255,255,255,0)"); g.fillStyle = gr; g.fillRect(0, 0, 64, 64);
  const tex = new THREE.CanvasTexture(c); const live = [];
  return { emit(x, y, z, s = 1) { const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false, opacity: 0.7 })); sp.position.set(x, y, z); sp.scale.setScalar(0.5 * s); scene.add(sp); live.push({ sp, t: 0, s, vx: rnd(-0.2, 0.2) }); },
    update(dt) { for (let i = live.length - 1; i >= 0; i--) { const p = live[i]; p.t += dt; p.sp.position.y += dt * 0.8; p.sp.position.x += p.vx * dt; p.sp.scale.setScalar((0.5 + p.t * 0.8) * p.s); p.sp.material.opacity = Math.max(0, 0.6 - p.t * 0.32); if (p.t > 2) { scene.remove(p.sp); p.sp.material.dispose(); live.splice(i, 1); } } } };
}
