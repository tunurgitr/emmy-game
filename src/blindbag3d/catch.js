// ==========================================================================
//  Emmy's Blind Bag Town 3D — 🛒 Bag Catch (the booth game by the gate).
//
//  createCatch({ sfx, pad, keys, envMap, onScore, onEnd }) → controller for town.setOverride()
//  Push a shopping cart left and right to catch blind bags tumbling off the
//  top shelf. Bags are worth 1, shiny toys 3, a flapping chicken 3 and the
//  Jumbo Gold Bag 5. Catch 5 in a row for a combo — but dodge the 🧦 stinky
//  socks! 45 seconds, and it gets faster as it goes.
// ==========================================================================
import { THREE, rnd, clamp, pick, makeParticles, textPlane, emojiSprite, mat, box } from "../arcade3d/lib.js";
import { makeBag, buildItem, makeChicken, CATALOG, CHICKEN_COLORS, SERIES_IDS, RARITY } from "./models.js";
import { makeCart } from "./town.js";

const W = 5.2, TIME = 45, TOP = 8.2, CART_S = 2.6, RIM = 0.88 * CART_S; // RIM = top of the cart's basket
export const CATCH_POINTS = { bag: 1, toy: 3, chicken: 3, gold: 5 };

export function createCatch({ sfx = {}, pad = { connected: false }, keys = new Set(), envMap, onScore, onEnd } = {}) {
  const scene = new THREE.Scene(); scene.environment = envMap; scene.environmentIntensity = 0.5; scene.background = bg();
  const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 80); camera.position.set(0, 4.2, 13); camera.lookAt(0, 4, 0);
  scene.add(new THREE.HemisphereLight(0xfff6fb, 0x806a90, 1.15)); const key = new THREE.DirectionalLight(0xffffff, 1.7); key.position.set(3, 8, 6); scene.add(key);
  // a shiny store floor, a wall of shelves, and the top shelf the bags fall off
  const floor = box(18, 1, 5, mat.std(0xf6eefa, { roughness: 0.35 }), 0, -0.5, 0); scene.add(floor);
  scene.add(box(18, 10, 0.3, mat.std(0xffb3d9), 0, 4.5, -3));
  const shelfM = mat.std(0xffffff), shelfCols = [0xff3d9a, 0x2f8bff, 0xffb300, 0x16c172, 0x8a4dff];
  for (const y of [1.6, 3.4, 5.2]) { scene.add(box(15, 0.14, 1, shelfM, 0, y, -2.4)); for (let i = 0; i < 14; i++) scene.add(box(0.6, 0.8, 0.5, mat.std(shelfCols[(i + y * 3) % 5 | 0]), -6.5 + i, y + 0.47, -2.4)); }
  const top = box(14.5, 0.25, 1.4, mat.std(0x7a3cff), 0, TOP + 0.05, -0.6); scene.add(top);
  for (let i = 0; i < 7; i++) { const b = makeBag(pick(SERIES_IDS)); b.scale.setScalar(0.45); b.position.set(-6 + i * 2, TOP + 0.18, -0.9); b.rotation.y = rnd(-0.3, 0.3); scene.add(b); }
  const sign = textPlane(["🛒 BAG CATCH!"], 4.2, 0.8, { bg: "#7a3cff", color: "#fff3a0", size: 100 }); sign.position.set(0, 7.0, -2.8); scene.add(sign);
  const cart = makeCart(); cart.scale.setScalar(CART_S); cart.rotation.y = Math.PI / 2; cart.position.set(0, 0, 0.4); scene.add(cart);
  const parts = makeParticles(scene, 300);

  // the falling things: a few prebuilt models we reuse
  const toyKinds = CATALOG.filter((k) => RARITY[k.rarity].order >= 3 && RARITY[k.rarity].order <= 6).filter((_, i) => i % 5 === 0).slice(0, 8);
  const pool = [];
  const make = (type) => {
    let g;
    if (type === "bag") { g = makeBag(pick(SERIES_IDS)); g.scale.setScalar(0.62); }
    else if (type === "gold") { g = makeBag("jumbo"); g.scale.setScalar(0.8); const sp = emojiSprite("✨", 0.9); sp.position.set(0.5, 1.6, 0.2); g.add(sp); }
    else if (type === "toy") { g = new THREE.Group(); const t = buildItem(pick(toyKinds), { lod: 0.4 }); t.scale.setScalar(0.9); g.add(t); const sp = emojiSprite("⭐", 0.6); sp.position.set(0.55, 1.1, 0); g.add(sp); }
    else if (type === "chicken") { const ch = makeChicken({ color: pick(CHICKEN_COLORS) }); g = ch.group; g.userData.ch = ch; g.scale.setScalar(1.6); }
    else g = sock();
    g.userData.type = type; scene.add(g); return g;
  };
  const items = []; // { g, vy, spin, type }
  let score = 0, combo = 0, best = 0, time = TIME, spawnT = 0.4, bx = 0, targetX = 0, shake = 0, done = false, caught = 0, t = 0;
  const counts = { bag: 0, toy: 0, chicken: 0, gold: 0, sock: 0 };
  function spawn() {
    const r = Math.random(), elapsed = TIME - time;
    const type = r < 0.06 ? "gold" : r < 0.15 ? "toy" : r < 0.21 ? "chicken" : r < 0.21 + Math.min(0.22, 0.08 + elapsed * 0.004) ? "sock" : "bag";
    let g = pool.find((p) => !p.visible && p.userData.type === type); if (!g) { g = make(type); pool.push(g); }
    g.visible = true; g.position.set(rnd(-W, W), TOP, 0.4); g.rotation.set(rnd(-0.5, 0.5), rnd(0, 6), rnd(-0.5, 0.5));
    items.push({ g, vy: rnd(0.5, 1.5), spin: rnd(-3, 3), type });
  }
  function pop(at, color, n = 20) { parts.burst(at, color, n, 2.6, 0.7, 5); }
  function update(dt) {
    t += dt; parts.update(dt);
    if (done) return;
    time -= dt; if (time <= 0) { time = 0; done = true; items.forEach((i) => (i.g.visible = false)); items.length = 0; onEnd && onEnd({ score, best, caught, counts }); return; }
    // move: pointer target, or keys / stick
    let dir = 0; if (keys.has("a") || keys.has("ArrowLeft")) dir -= 1; if (keys.has("d") || keys.has("ArrowRight")) dir += 1; if (pad.connected) dir += pad.lx || 0;
    if (dir) targetX = clamp(targetX + dir * 11 * dt, -W - 0.5, W + 0.5);
    bx += (targetX - bx) * Math.min(1, dt * 14); cart.position.x = bx + (shake > 0 ? Math.sin(t * 60) * shake * 0.3 : 0); cart.rotation.z = (targetX - bx) * -0.05; shake = Math.max(0, shake - dt * 2);
    // spawn faster as time goes on
    spawnT -= dt; if (spawnT <= 0) { spawnT = Math.max(0.3, 0.78 - (TIME - time) * 0.011) * rnd(0.7, 1.2); spawn(); }
    const g = 9 + (TIME - time) * 0.12;
    for (let i = items.length - 1; i >= 0; i--) {
      const it = items[i]; it.vy += g * dt * 0.45; it.g.position.y -= it.vy * dt; it.g.rotation.y += it.spin * dt;
      if (it.type === "chicken") { it.g.userData.ch.update(dt, t, 0, false); if (Math.random() < dt * 3) it.g.userData.ch.flapNow(); it.vy = Math.min(it.vy, 5); }
      if (it.type === "sock") it.g.rotation.z += it.spin * dt * 0.6;
      const y = it.g.position.y, dx = Math.abs(it.g.position.x - bx);
      if (y < RIM + 0.05 && y > RIM - 1.1 && dx < CART_S * 0.55) { // caught — into the cart it goes!
        items.splice(i, 1); it.g.visible = false; const at = it.g.position.clone(); counts[it.type]++;
        if (it.type === "sock") { combo = 0; shake = 1; sfx.error && sfx.error(); pop(at, 0x9ccc65, 30); onScore && onScore(score, combo, time, "🧦 PEE-YEW! Stinky sock! Combo lost"); continue; }
        combo++; best = Math.max(best, combo); caught++; const mult = 1 + Math.floor(combo / 5);
        const pts = CATCH_POINTS[it.type] * mult; score += pts;
        if (it.type === "chicken") sfx.bawk && sfx.bawk(); else if (it.type === "gold") sfx.wow ? sfx.wow() : sfx.ding && sfx.ding(); else if (it.type === "toy") sfx.ding && sfx.ding(); else sfx.pop ? sfx.pop() : sfx.tap && sfx.tap();
        pop(at, it.type === "gold" ? 0xffc93c : it.type === "chicken" ? 0xffffff : it.type === "toy" ? 0x6ec6ff : 0xff8ac8, it.type === "bag" ? 14 : 30);
        onScore && onScore(score, combo, time, it.type === "gold" ? `🏆 Jumbo Gold Bag! +${pts}` : it.type === "toy" ? `⭐ A shiny toy! +${pts}` : it.type === "chicken" ? `🐔 Caught a chicken! +${pts}` : mult > 1 && combo % 5 === 0 ? `🔥 Combo ×${mult}!` : null);
        continue;
      }
      if (y < -1) { items.splice(i, 1); it.g.visible = false; if (it.type !== "sock") { if (combo >= 5) onScore && onScore(score, 0, time, "💨 Missed one — combo reset"); combo = 0; } }
    }
    onScore && onScore(score, combo, time);
  }
  const plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), -0.4), hit = new THREE.Vector3(); let dragging = false;
  const toX = (p) => { if (p.ray.ray.intersectPlane(plane, hit)) targetX = clamp(hit.x, -W - 0.5, W + 0.5); };
  return {
    scene, camera, update,
    onDown(p) { dragging = true; toX(p); }, onMove(p) { if (dragging && p.id !== 999) toX(p); }, onUp() { dragging = false; },
    get score() { return score; }, get time() { return time; }, get done() { return done; }, get cartX() { return bx; },
    // automation hook: pretend 45 seconds went by (optionally with a given score)
    finish(s) { if (s != null) score = s; time = 0.0001; },
    dispose() { scene.traverse((o) => { if (o.geometry) o.geometry.dispose(); }); parts.dispose(); },
  };
}
// a stinky striped sock (with a little green stink cloud)
function sock() {
  const g = new THREE.Group(); const c = document.createElement("canvas"); c.width = 16; c.height = 64; const x = c.getContext("2d");
  for (let i = 0; i < 8; i++) { x.fillStyle = i % 2 ? "#ffffff" : "#ff7043"; x.fillRect(0, i * 8, 16, 8); }
  const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace; const m = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.9 });
  const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.9, 14), m); leg.position.y = 0.5; g.add(leg);
  const foot = new THREE.Mesh(new THREE.CapsuleGeometry(0.22, 0.45, 6, 12), m); foot.rotation.z = Math.PI / 2; foot.position.set(0.25, 0.08, 0); g.add(foot);
  const heel = new THREE.Mesh(new THREE.SphereGeometry(0.235, 12, 10), m); heel.position.set(0, 0.08, 0); g.add(heel);
  const stink = emojiSprite("💨", 0.6); stink.position.set(-0.3, 1.2, 0); stink.material.color = new THREE.Color(0xb6ff8a); g.add(stink);
  g.scale.setScalar(1.2); return g;
}
let bgTex = null;
function bg() { if (bgTex) return bgTex; const c = document.createElement("canvas"); c.width = 16; c.height = 256; const g = c.getContext("2d"); const gr = g.createLinearGradient(0, 0, 0, 256); gr.addColorStop(0, "#d9ccff"); gr.addColorStop(0.6, "#ffd1ec"); gr.addColorStop(1, "#fff1c9"); g.fillStyle = gr; g.fillRect(0, 0, 16, 256); bgTex = new THREE.CanvasTexture(c); bgTex.colorSpace = THREE.SRGBColorSpace; return bgTex; }
