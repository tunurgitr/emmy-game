// ==========================================================================
//  Emmy's Blind Bag Town 3D — the opening table.
//
//  createOpen(item, envMap, opts) → controller for town.setOverride():
//    { scene, camera, update, onDown, onMove, onUp, tear(), phase, dispose }
//  With opts.bag the toy starts hidden in a foil blind bag: swipe across the
//  top (or tap it a few times) to tear it open — the top flies off and the toy
//  pops out. Then: drag to spin, press & hold to squish, tap for a hop.
// ==========================================================================
import { THREE, rnd, clamp, approach, makeParticles, emojiSprite } from "../arcade3d/lib.js";
import { buildItem, makeBag, RARITY } from "./models.js";
import { createMode } from "./play.js";

export function createOpen(item, envMap, { bag = null, glam = null, sfx = {}, onReveal, onTap, onStatus, onCoins } = {}) {
  const scene = new THREE.Scene(); scene.environment = envMap; scene.environmentIntensity = 0.55; scene.background = bgTexture();
  const camera = new THREE.PerspectiveCamera(36, 1, 0.05, 60); const lookHome = new THREE.Vector3(0, 0.95, 0), camHome = new THREE.Vector3(0, 1.75, 4.6);
  camera.position.copy(camHome); camera.lookAt(lookHome);
  scene.add(new THREE.HemisphereLight(0xfff6ff, 0x7a5a8a, 0.7));
  const key = new THREE.DirectionalLight(0xffffff, 1.8); key.position.set(2.5, 5, 3.5); key.castShadow = true; key.shadow.mapSize.set(1024, 1024); key.shadow.radius = 5; key.shadow.bias = -0.0005; Object.assign(key.shadow.camera, { left: -3, right: 3, top: 3, bottom: -3, near: 0.5, far: 15 }); scene.add(key);
  const rim = new THREE.DirectionalLight(0xffd9f2, 1.0); rim.position.set(-3, 3, -4); scene.add(rim);
  // a round pastel stage with a rarity glow
  const stage = new THREE.Mesh(new THREE.CylinderGeometry(1.5, 1.6, 0.18, 64), new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.45 })); stage.position.y = -0.09; stage.receiveShadow = true; scene.add(stage);
  const stageRim = new THREE.Mesh(new THREE.TorusGeometry(1.55, 0.05, 10, 80), new THREE.MeshStandardMaterial({ color: 0xff8ac8, roughness: 0.3 })); stageRim.rotation.x = Math.PI / 2; stageRim.position.y = 0.0; scene.add(stageRim);
  const floor = new THREE.Mesh(new THREE.CircleGeometry(12, 48), new THREE.MeshStandardMaterial({ color: 0xf3dcef, roughness: 0.9 })); floor.rotation.x = -Math.PI / 2; floor.position.y = -0.18; floor.receiveShadow = true; scene.add(floor);
  const R = RARITY[item.rarity];
  const glow = new THREE.Mesh(new THREE.CircleGeometry(1.45, 48), new THREE.MeshBasicMaterial({ map: glowTexture(R.color), transparent: true, depthWrite: false, opacity: 0 })); glow.rotation.x = -Math.PI / 2; glow.position.y = 0.012; scene.add(glow);
  const parts = makeParticles(scene, 320);

  // ---- the toy --------------------------------------------------------------
  const holder = new THREE.Group(); scene.add(holder); const toy = buildItem(item, { glam }); castAll(toy); holder.add(toy);
  const H = toy.userData.H || 1; const fit = clamp(1.25 / H, 0.55, 1.15); toy.scale.setScalar(fit); const chicken = toy.userData.chicken;
  let spin = 0, spinV = 0.35, squish = 0, squishV = 0, holding = false, hop = 0;

  // ---- the bag ----------------------------------------------------------------
  let phase = bag ? "bag" : "play", pt = 0, tearK = 0, tearShown = 0;
  const bagG = bag ? makeBag(bag) : null; let topV = null;
  const scissors = emojiSprite("✂️", 0.32); scissors.visible = false; scene.add(scissors);
  const tearLine = new THREE.Mesh(new THREE.PlaneGeometry(1, 0.025), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.9, depthWrite: false })); tearLine.visible = false; scene.add(tearLine);
  if (bagG) { castAll(bagG); bagG.position.set(0, 0.05, 0); scene.add(bagG); holder.visible = false; glow.material.opacity = 0; scissors.visible = true; }
  else glow.material.opacity = 0.4;

  function tear() {
    if (phase !== "bag") return; phase = "tearing"; pt = 0; scissors.visible = false; tearLine.visible = false; sfx.tear && sfx.tear();
    topV = new THREE.Vector3(rnd(1.4, 2.0), 3.2, rnd(-0.4, 0.4));
  }

  // ---- how this series plays (see play.js) ----------------------------------------
  let revealed = false;
  const ctx = { scene, holder, toy, parts, camera, item, sfx, fit, H, fromBag: !!bag, setStatus: (s) => onStatus && onStatus(s), onCoins: (n, why) => onCoins && onCoins(n, why),
    reveal() { if (revealed) return; revealed = true; revealFx(); onReveal && onReveal(); }, hop() { hop = 1; squishV = -3; }, kick(v) { spinV += v; } };
  const mode = createMode(item, ctx);

  // ---- input -------------------------------------------------------------------
  let down = null;
  // a forgiving invisible ball round the toy, so a tap near it (or through a donut hole!) still counts
  const proxy = new THREE.Mesh(new THREE.SphereGeometry(0.5, 12, 8), new THREE.MeshBasicMaterial({ colorWrite: false, depthWrite: false })); proxy.scale.set(0.55 * fit, 0.62 * H * fit, 0.55 * fit); proxy.position.y = H * fit * 0.5; holder.add(proxy);
  const hitToy = (p) => (toy.visible ? p.ray.intersectObject(toy, true)[0] || p.ray.intersectObject(proxy, false)[0] : null); ctx.hitToy = hitToy;
  function onDown(p) {
    if (phase === "bag") { down = { x: p.sx, y: p.sy, lastX: p.sx, moved: 0, t: performance.now() }; return; }
    if (phase !== "play") return;
    down = { x: p.sx, y: p.sy, lastX: p.sx, lastY: p.sy, moved: 0, t: performance.now(), squish: false };
    const hit = hitToy(p);
    if (mode.down && mode.down(p, hit)) { down.mode = true; return; }
    if (hit && !mode.ownsSquish) { holding = true; down.squish = true; sfx.squish && sfx.squish(); }
  }
  function onMove(p) {
    if (!down) { phase === "play" && mode.hover && mode.hover(p); return; }
    const dx = p.sx - down.lastX, dy = p.sy - (down.lastY ?? p.sy); down.lastX = p.sx; down.lastY = p.sy; down.moved += Math.abs(dx) + Math.abs(dy);
    if (phase === "bag") { tearK = clamp(tearK + Math.abs(dx) / Math.max(150, p.W * 0.22), 0, 1); if (Math.random() < 0.3) sfx.crinkle && sfx.crinkle(); if (tearK >= 1) tear(); return; }
    if (phase !== "play") return;
    if (mode.move && mode.move(p, dx, dy)) return;
    if (down.squish && down.moved > 16) { holding = false; down.squish = false; }
    if (!down.squish) { spinV = dx * 0.6; spin += dx * 0.012; }
  }
  function onUp(p) {
    if (!down) return; const was = down; down = null;
    if (phase === "bag") { if (tearK >= 0.6 && was.moved >= 10) { tear(); return; } if (was.moved < 10) { tearK = clamp(tearK + 0.34, 0, 1); shakeT = 0.35; sfx.crinkle && sfx.crinkle(); if (tearK >= 0.99) tear(); } return; }
    if (phase !== "play") return;
    const tap = was.moved < 10 && performance.now() - was.t < 350;
    if (mode.up && mode.up(p, tap, tap ? hitToy(p) : null)) { holding = false; return; }
    if (was.squish) { holding = false; if (tap) { hop = 1; squishV = -3; } sfx.unsquish && sfx.unsquish(); onTap && onTap(); if (chicken) chicken.flapNow(); }
  }

  // ---- update --------------------------------------------------------------------
  let t = 0, shakeT = 0; const _home = new THREE.Vector3();
  const home = () => _home.subVectors(camHome, lookHome).multiplyScalar(Math.pow(Math.max(1, 1.15 / camera.aspect), 0.85)).add(lookHome);
  function update(dt) {
    t += dt; parts.update(dt); camera.position.lerp(home(), Math.min(1, dt * 3)); camera.lookAt(lookHome);
    if (phase === "bag") {
      shakeT = Math.max(0, shakeT - dt); const wob = Math.sin(t * 2) * 0.05 + (shakeT > 0 ? Math.sin(t * 50) * 0.08 * (shakeT / 0.35) : 0);
      bagG.rotation.y = wob; bagG.rotation.z = Math.sin(t * 1.6) * 0.03; bagG.position.y = 0.05 + Math.sin(t * 2.2) * 0.03;
      tearShown = approach(tearShown, tearK, 10, dt); const cy = bagG.userData.cutY + 0.05;
      tearLine.visible = tearShown > 0.01; tearLine.scale.x = Math.max(0.001, tearShown * 1.0); tearLine.position.set(-0.5 + tearShown * 0.5, cy, 0.2); tearLine.rotation.z = bagG.rotation.z;
      scissors.position.set(-0.55 + tearShown * 1.05, cy + 0.02, 0.32); scissors.material.rotation = -0.4 + Math.sin(t * 8) * 0.25;
    }
    if (phase === "tearing") {
      pt += dt; const top = bagG.userData.top; top.position.addScaledVector(topV, dt); topV.y -= 9 * dt; top.rotation.z -= dt * 6; top.rotation.x += dt * 2;
      if (pt > 0.25 && !holder.visible) { holder.visible = true; parts.burst(new THREE.Vector3(0, 1.3, 0), 0xffffff, 24, 2.2, 0.8, 3); sfx.pop && sfx.pop(); }
      const k = clamp((pt - 0.25) / 0.7, 0, 1), e = 1 - (1 - k) ** 3;
      holder.position.y = k < 1 ? 1.1 + Math.sin(k * Math.PI) * 0.9 - k * 1.1 : 0; toy.scale.setScalar(fit * (0.35 + 0.65 * e)); spin = e * Math.PI * 2; // up out of the bag, then down onto the stage
      bagG.position.z = -e * 2.4; bagG.position.x = -e * 1.6; bagG.position.y = 0.05 - e * 0.4; bagG.rotation.z = e * 0.9; bagG.userData.body.children.forEach((m) => { if (m.material) { m.material.transparent = true; m.material.opacity = 1 - e; } });
      if (k >= 1) { phase = "play"; holder.position.y = 0; bagG.visible = false; squishV = -4; mode.start && mode.start(); if (!mode.deferReveal) ctx.reveal(); }
    }
    if (phase === "play") {
      if (!mode.ownsHolder) { if (!down || down.squish || down.mode) { spin += spinV * dt; spinV = approach(spinV, 0.3, 1.2, dt); } hop = Math.max(0, hop - dt * 2.4); holder.position.y = Math.sin(hop * Math.PI) * 0.35 + (mode.lift || 0); }
      if (revealed || !bag) glow.material.opacity = 0.32 + Math.sin(t * 2.4) * 0.12;
      if (mode.slowRise) { if (holding) { squish += (0.55 - squish) * Math.min(1, dt * 9); squishV = 0; } else { squish -= squish * Math.min(1, dt * 0.7); squishV = 0; } } // slow-rise squishies take their time
      else { const target = holding ? 0.38 : 0; squishV += ((target - squish) * 70 - squishV * 7) * dt; squish += squishV * dt; }
      if (chicken && !mode.handlesChicken) chicken.update(dt, t, 0, Math.sin(t * 0.8) > 0.6);
    }
    const sq = clamp(squish, -0.25, 0.6); toy.scale.set(fit * (1 + sq * 0.55), fit * (1 - sq), fit * (1 + sq * 0.55));
    if (phase === "tearing") toy.scale.setScalar(toy.scale.y);
    if (!(phase === "play" && mode.ownsHolder)) holder.rotation.y = spin;
    if (phase === "play" && mode.update) mode.update(dt, t);
  }
  function revealFx() {
    const c = new THREE.Color(R.color), at = new THREE.Vector3(0, 0.8, 0), big = R.order >= 3;
    parts.burst(at, c, big ? 110 : 50, big ? 3.6 : 2.6, 1.3, 3); parts.burst(at, 0xffffff, 34, 2, 1, 2); if (item.rarity === "rainbow") for (const col of [0xff5d8f, 0xffd54a, 0x7cffb0, 0x6ec6ff, 0xb18cff]) parts.burst(at, col, 30, 3.2, 1.4, 2.5);
    glow.material.opacity = 0.7; stageRim.material.color.set(R.color);
  }
  return {
    scene, camera, update, onDown, onMove, onUp, tear, mode,
    get phase() { return phase; }, get revealed() { return revealed; }, toy,
    dispose() { scene.traverse((o) => { if (o.geometry) o.geometry.dispose(); }); parts.dispose(); },
  };
}

function castAll(g) { g.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } }); }
let bgTex = null;
export function bgTexture() { if (bgTex) return bgTex; const c = document.createElement("canvas"); c.width = 512; c.height = 512; const g = c.getContext("2d"); const gr = g.createRadialGradient(256, 200, 20, 256, 256, 420); gr.addColorStop(0, "#fff6fb"); gr.addColorStop(0.55, "#ffd9ef"); gr.addColorStop(1, "#b9a8ff"); g.fillStyle = gr; g.fillRect(0, 0, 512, 512); for (let i = 0; i < 60; i++) { g.fillStyle = `rgba(255,255,255,${Math.random() * 0.5 + 0.2})`; g.beginPath(); g.arc(Math.random() * 512, Math.random() * 512, Math.random() * 3 + 1, 0, Math.PI * 2); g.fill(); } bgTex = new THREE.CanvasTexture(c); bgTex.colorSpace = THREE.SRGBColorSpace; return bgTex; }
const glowCache = new Map();
function glowTexture(color) { if (glowCache.has(color)) return glowCache.get(color); const c = document.createElement("canvas"); c.width = c.height = 128; const g = c.getContext("2d"); const gr = g.createRadialGradient(64, 64, 10, 64, 64, 64); gr.addColorStop(0, color); gr.addColorStop(0.5, color + "88"); gr.addColorStop(1, color + "00"); g.fillStyle = gr; g.fillRect(0, 0, 128, 128); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; glowCache.set(color, t); return t; }
