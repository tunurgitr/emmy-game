// ==========================================================================
//  Dumpling Catch — slide a bamboo steamer left and right to catch dumplings
//  raining down from the kitchen. Golden dumplings are worth 5, a falling
//  chicken (!) is worth 3, and hot peppers break your combo. 45 seconds.
//
//  createCatch({ sfx, pad, keys, onScore, onEnd }) → override controller
// ==========================================================================
import { THREE, rnd, clamp, pick, makeParticles, woodTexture } from "../arcade3d/lib.js";
import { buildDumpling, makeSteamer, makeChicken, CATALOG, CHICKEN_COLORS } from "./models.js";

const W = 5.2, TIME = 45;

export function createCatch({ sfx = {}, pad, keys, envMap, onScore, onEnd }) {
  const scene = new THREE.Scene(); scene.environment = envMap; scene.environmentIntensity = 0.5;
  scene.background = bg();
  const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 80); camera.position.set(0, 4.2, 13); camera.lookAt(0, 4, 0);
  scene.add(new THREE.HemisphereLight(0xfff6ee, 0x7a5a40, 1.1)); const key = new THREE.DirectionalLight(0xfff0dd, 1.8); key.position.set(3, 8, 6); scene.add(key);
  // a kitchen counter at the bottom, a row of steamers at the top
  const counter = new THREE.Mesh(new THREE.BoxGeometry(16, 1, 4), new THREE.MeshStandardMaterial({ map: woodTexture(0xb27a45, 2), roughness: 0.7 })); counter.position.set(0, -0.5, 0); scene.add(counter);
  for (let i = 0; i < 5; i++) { const s = makeSteamer(0.75, 0.35); s.position.set(-W + i * (W / 2), 8.3, -0.6); s.rotation.x = 0.35; scene.add(s); }
  const shelf = new THREE.Mesh(new THREE.BoxGeometry(14, 0.25, 1.6), new THREE.MeshStandardMaterial({ color: 0x8a5a2b })); shelf.position.set(0, 8.2, -0.8); scene.add(shelf);
  const basket = makeSteamer(1.05, 0.5); basket.userData.lid.visible = false; basket.position.set(0, 0, 0.4); scene.add(basket);
  const parts = makeParticles(scene, 300);

  // the falling things — a few prebuilt light models we reuse
  const kinds = CATALOG.filter((k) => !["golden"].includes(k.rarity)).filter((_, i) => i % 7 === 0).slice(0, 10);
  const pool = [];
  const make = (type) => {
    let g;
    if (type === "dumpling") g = buildDumpling(pick(kinds).id, { lod: 0.35 });
    else if (type === "gold") g = buildDumpling("golden-bao", { lod: 0.4 });
    else if (type === "chicken") { const ch = makeChicken({ color: pick(CHICKEN_COLORS) }); g = ch.group; g.userData.ch = ch; g.scale.setScalar(1.6); }
    else { g = pepper(); }
    if (type !== "chicken") g.scale.multiplyScalar(type === "pepper" ? 1.3 : 0.62);
    g.userData.type = type; scene.add(g); return g;
  };
  const items = []; // { g, vy, spin }
  let score = 0, combo = 0, best = 0, time = TIME, spawnT = 0.4, bx = 0, targetX = 0, shake = 0, done = false, caught = 0, t = 0;
  function spawn() {
    const r = Math.random(), elapsed = TIME - time;
    const type = r < 0.06 ? "gold" : r < 0.13 ? "chicken" : r < 0.13 + Math.min(0.22, 0.08 + elapsed * 0.004) ? "pepper" : "dumpling";
    let g = pool.find((p) => !p.visible && p.userData.type === type); if (!g) { g = make(type); pool.push(g); }
    g.visible = true; g.position.set(rnd(-W, W), 8.2, 0.4); g.rotation.set(rnd(-0.5, 0.5), rnd(0, 6), rnd(-0.5, 0.5));
    items.push({ g, vy: rnd(0.5, 1.5), spin: rnd(-3, 3), type });
  }
  function pop(at, color, n = 20) { parts.burst(at, color, n, 2.6, 0.7, 5); }
  function update(dt) {
    t += dt; parts.update(dt);
    if (done) return;
    time -= dt; if (time <= 0) { time = 0; done = true; items.forEach((i) => (i.g.visible = false)); items.length = 0; onEnd && onEnd({ score, best, caught }); return; }
    // move: pointer target, or keys / stick
    let dir = 0; if (keys.has("a") || keys.has("ArrowLeft")) dir -= 1; if (keys.has("d") || keys.has("ArrowRight")) dir += 1; if (pad.connected) dir += pad.lx;
    if (dir) targetX = clamp(targetX + dir * 11 * dt, -W - 0.5, W + 0.5);
    bx += (targetX - bx) * Math.min(1, dt * 14); basket.position.x = bx + (shake > 0 ? Math.sin(t * 60) * shake * 0.3 : 0); basket.rotation.z = (targetX - bx) * -0.06; shake = Math.max(0, shake - dt * 2);
    // spawn faster as time goes on
    spawnT -= dt; if (spawnT <= 0) { spawnT = Math.max(0.32, 0.8 - (TIME - time) * 0.011) * rnd(0.7, 1.2); spawn(); }
    const g = 9 + (TIME - time) * 0.12;
    for (let i = items.length - 1; i >= 0; i--) {
      const it = items[i]; it.vy += g * dt * 0.45; it.g.position.y -= it.vy * dt; it.g.rotation.y += it.spin * dt;
      if (it.type === "chicken") { it.g.userData.ch.update(dt, t, 0, false); if (Math.random() < dt * 3) it.g.userData.ch.flapNow(); it.vy = Math.min(it.vy, 5); }
      const y = it.g.position.y, dx = Math.abs(it.g.position.x - bx);
      if (y < 0.9 && y > 0.1 && dx < 1.15) { // caught!
        items.splice(i, 1); it.g.visible = false; const at = it.g.position.clone();
        if (it.type === "pepper") { combo = 0; shake = 1; sfx.error && sfx.error(); pop(at, 0xff3b1f, 30); onScore && onScore(score, combo, time, "🌶️ Too spicy! Combo lost"); continue; }
        combo++; best = Math.max(best, combo); caught++; const mult = 1 + Math.floor(combo / 5);
        const pts = (it.type === "gold" ? 5 : it.type === "chicken" ? 3 : 1) * mult; score += pts;
        if (it.type === "chicken") sfx.bawk && sfx.bawk(); else if (it.type === "gold") sfx.ding && sfx.ding(); else sfx.pop && sfx.pop();
        pop(at, it.type === "gold" ? 0xffc93c : it.type === "chicken" ? 0xffffff : 0xff8ac8, it.type === "dumpling" ? 14 : 30);
        onScore && onScore(score, combo, time, it.type === "gold" ? `✨ Golden! +${pts}` : it.type === "chicken" ? `🐔 Caught a chicken! +${pts}` : mult > 1 ? `🔥 Combo ×${mult}!` : null);
        continue;
      }
      if (y < -1) { items.splice(i, 1); it.g.visible = false; if (it.type !== "pepper") { if (combo >= 5) onScore && onScore(score, 0, time, "💨 Missed one — combo reset"); combo = 0; } }
    }
    onScore && onScore(score, combo, time);
  }
  const ndcPlane = new THREE.Plane(new THREE.Vector3(0, 0, 1), -0.4), hit = new THREE.Vector3(); let dragging = false;
  const toX = (p) => { if (p.ray.ray.intersectPlane(ndcPlane, hit)) targetX = clamp(hit.x, -W - 0.5, W + 0.5); };
  return {
    scene, camera, update, directPad: true,
    onDown(p) { dragging = true; toX(p); }, onMove(p) { if (dragging || p.id === 999) toX(p); }, onUp() { dragging = false; },
    get score() { return score; },
    dispose() { scene.traverse((o) => { if (o.geometry) o.geometry.dispose(); }); parts.dispose(); },
  };
}
function pepper() {
  const g = new THREE.Group(); const m = new THREE.MeshPhysicalMaterial({ color: 0xe8261b, roughness: 0.25, clearcoat: 1 });
  const geo = new THREE.SphereGeometry(0.28, 20, 14); const p = geo.attributes.position; for (let i = 0; i < p.count; i++) { const y = p.getY(i); p.setY(i, y * 2.4); const k = y < 0 ? 1 + y * 1.6 : 1; p.setX(i, p.getX(i) * Math.max(0.15, k)); p.setZ(i, p.getZ(i) * Math.max(0.15, k)); } geo.computeVertexNormals();
  const body = new THREE.Mesh(geo, m); body.rotation.z = 0.5; g.add(body);
  const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.09, 0.3, 8), new THREE.MeshStandardMaterial({ color: 0x2e9d3a })); stem.position.set(-0.32, 0.6, 0); stem.rotation.z = 0.9; g.add(stem);
  return g;
}
let bgTex = null;
function bg() { if (bgTex) return bgTex; const c = document.createElement("canvas"); c.width = 16; c.height = 256; const g = c.getContext("2d"); const gr = g.createLinearGradient(0, 0, 0, 256); gr.addColorStop(0, "#ffe9c7"); gr.addColorStop(0.6, "#ffd1e3"); gr.addColorStop(1, "#c9b1ff"); g.fillStyle = gr; g.fillRect(0, 0, 16, 256); bgTex = new THREE.CanvasTexture(c); bgTex.colorSpace = THREE.SRGBColorSpace; return bgTex; }
