// ==========================================================================
//  Emmy's Arcade 3D — first-person games, part 4
//  (Shooting Gallery, Strongman Hammer, Ring Toss, Memory Match, Penalty Kick)
// ==========================================================================
import { THREE, rnd, ri, clamp, pick, lerp, fmtT, mat, box, cyl, sphere, torus, emojiSprite, textPlane, blobShadow, makeParticles, disposeScene, lightScene, fpCamera, hitTest, hitPlane, approach, makeKid } from "./lib.js";

const baseScene = (bg = 0x0b0620) => { const s = new THREE.Scene(); s.background = new THREE.Color(bg); return s; };
const std = (ctrl, scene) => ({ ...ctrl, dispose() { ctrl.dispose && ctrl.dispose(); disposeScene(scene); } });

// ==========================================================================
//  🦆 SHOOTING GALLERY — ducks and targets glide by on rails; tap to hit them.
// ==========================================================================
export const gallery = {
  id: "gallery", name: "Shooting Gallery", emoji: "🦆", cost: 2, color: 0x8d6e63, cabinet: "gallery", payout: "up to 90 🎟️",
  tip: "👆 Tap the ducks and targets as they slide past! Gold stars are worth 5. 40 seconds.",
  create(api) {
    const scene = baseScene(0x2a1a0a); lightScene(scene, { ambient: 0.9, pos: [2, 6, 5] });
    const camera = fpCamera(api.W, api.H, [0, 1.6, 3.4], [0, 1.6, -2], 58);
    const parts = makeParticles(scene);
    scene.add(box(7, 4.2, 0.2, mat.wood(0x6d4c41), 0, 2.2, -3)); const back = textPlane(["🎯 SHOOTING GALLERY 🦆"], 5, 0.7, { bg: "#ffd54a", color: "#4a2b00", size: 100 }); back.position.set(0, 4.05, -2.85); scene.add(back);
    for (let i = 0; i < 3; i++) scene.add(box(6.4, 0.06, 0.4, mat.std(0x3e2723), 0, 0.9 + i * 0.9, -2.6 + i * 0.15));
    scene.add(box(3.0, 0.9, 0.8, mat.wood(0x8d5a2b), 0, 0.45, 2.4));
    const water = box(6.6, 0.08, 0.5, mat.gloss(0x26c6da, { transparent: true, opacity: 0.8 }), 0, 0.8, -2.55); scene.add(water);
    const rails = [{ y: 1.05, z: -2.6, dir: 1, sp: 1.6 }, { y: 1.95, z: -2.45, dir: -1, sp: 2.1 }, { y: 2.85, z: -2.3, dir: 1, sp: 2.8 }];
    const targets = []; let time = 40, hits = 0, over = false, spawnT = 0, shots = [];
    const mk = (rail) => { const kind = Math.random() < 0.15 ? "star" : Math.random() < 0.3 ? "target" : "duck"; const g = new THREE.Group();
      if (kind === "duck") { g.add(sphere(0.2, mat.gloss(0xffeb3b), 0, 0.2, 0)); g.add(sphere(0.14, mat.gloss(0xffeb3b), rail.dir * 0.16, 0.42, 0)); const beak = new THREE.Mesh(new THREE.ConeGeometry(0.05, 0.12, 8), mat.gloss(0xff9800)); beak.position.set(rail.dir * 0.3, 0.4, 0); beak.rotation.z = -rail.dir * Math.PI / 2; g.add(beak); g.add(sphere(0.025, mat.std(0x111), rail.dir * 0.2, 0.46, 0.1)); }
      else if (kind === "target") { [[0.28, 0xffffff], [0.2, 0xef5350], [0.12, 0xffffff], [0.05, 0xef5350]].forEach(([r, c], i) => g.add(cyl(r, r, 0.03 + i * 0.01, mat.gloss(c), 24, 0, 0.3, 0).rotateX(Math.PI / 2))); }
      else { const s = new THREE.Shape(); for (let i = 0; i < 10; i++) { const r = i % 2 ? 0.12 : 0.28, a = (i / 10) * Math.PI * 2 - Math.PI / 2; i ? s.lineTo(Math.cos(a) * r, Math.sin(a) * r) : s.moveTo(Math.cos(a) * r, Math.sin(a) * r); } const st = new THREE.Mesh(new THREE.ExtrudeGeometry(s, { depth: 0.05, bevelEnabled: false }), mat.gloss(0xffd54a, { emissive: 0xffb300, emissiveIntensity: 0.4 })); st.position.y = 0.3; g.add(st); }
      g.position.set(-rail.dir * 3.6, rail.y, rail.z); scene.add(g); targets.push({ g, rail, kind, v: kind === "star" ? 5 : kind === "target" ? 2 : 1, alive: true }); };
    const gun = new THREE.Group(); gun.position.set(0.35, -0.35, -1); gun.scale.setScalar(0.4); camera.add(gun); scene.add(camera); gun.add(box(0.16, 0.16, 0.9, mat.wood(0x8d5a2b))); gun.add(cyl(0.035, 0.035, 0.6, mat.metal(0x555), 10, 0, 0.08, -0.5).rotateX(Math.PI / 2));
    return std({
      scene, camera,
      onDown(p) {
        if (over) return; api.sfx.laser(); gun.position.z = -0.85;
        const hit = p.ray.intersectObjects(targets.filter((t) => t.alive).map((t) => t.g), true)[0];
        if (hit) { let o = hit.object, t = null; while (o) { t = targets.find((q) => q.g === o); if (t) break; o = o.parent; } if (t) { t.alive = false; hits += t.v; parts.burst(t.g.position.clone().setY(t.g.position.y + 0.3), t.kind === "star" ? 0xffd54a : 0xffffff, 24, 3); scene.remove(t.g); (t.kind === "star" ? api.sfx.win : api.sfx.ding)(); api.setTip(t.kind === "star" ? "⭐ GOLD STAR! +5" : t.kind === "target" ? "Bullseye! +2" : "Quack! +1"); } }
        else api.sfx.tap();
      },
      onKey(k) { if (k === " ") this.onDown({ ray: new THREE.Raycaster(camera.position, camera.getWorldDirection(new THREE.Vector3())) }); },
      update(dt) {
        if (over) return; time -= dt; parts.update(dt); gun.position.z = approach(gun.position.z, -1, 14, dt);
        spawnT -= dt; if (spawnT <= 0) { spawnT = rnd(0.45, 0.9); mk(pick(rails)); }
        for (let i = targets.length - 1; i >= 0; i--) { const t = targets[i]; t.g.position.x += t.rail.dir * t.rail.sp * dt; t.g.position.y = t.rail.y + Math.sin(performance.now() / 300 + i) * 0.02; if (Math.abs(t.g.position.x) > 3.7) { scene.remove(t.g); targets.splice(i, 1); } }
        api.setScore(`🎯 ${hits}   ${fmtT(time)}`);
        if (time <= 0) { over = true; const tix = clamp(hits * 2, 0, 90); api.finish(tix, hits >= 30 ? "🦆 Sharpshooter!" : "Good shooting!", `${hits} points → ${tix} tickets`); }
      },
    }, scene);
  },
};

// ==========================================================================
//  🔨 STRONGMAN HAMMER — tap when the power meter is at the top; ring the bell!
// ==========================================================================
export const hammer = {
  id: "hammer", name: "Strongman Hammer", emoji: "🔨", cost: 2, color: 0xf4433f, cabinet: "hammer", payout: "up to 80 🎟️",
  tip: "💪 Tap when the swinging power meter is in the RED zone to swing the hammer! 3 swings — ring the bell for the jackpot.",
  create(api) {
    const scene = baseScene(0x1a0f3a); lightScene(scene, { ambient: 0.85, pos: [2, 8, 4] });
    const camera = fpCamera(api.W, api.H, [0, 1.9, 4.6], [0, 2.6, 0], 60);
    const parts = makeParticles(scene);
    const TH = 5.2;
    scene.add(box(0.5, TH, 0.3, mat.wood(0x8d5a2b), 0, TH / 2, 0)); for (let i = 0; i < 10; i++) { const y = 0.6 + i * (TH - 1.2) / 9; scene.add(box(0.56, 0.06, 0.34, mat.neon(i >= 8 ? 0xf4433f : i >= 5 ? 0xffd54a : 0x00c853, 0.6), 0, y, 0)); }
    const labels = ["WIMPY", "OK", "STRONG", "MIGHTY", "SUPER!"]; labels.forEach((l, i) => { const t = textPlane([l], 0.9, 0.22, { bg: null, color: "#fff", size: 70 }); t.position.set(0.85, 0.8 + i * 1.0, 0.1); scene.add(t); });
    const bell = new THREE.Group(); bell.add(new THREE.Mesh(new THREE.ConeGeometry(0.3, 0.4, 16), mat.metal(0xffd54a))); bell.add(sphere(0.07, mat.metal(0xffd54a), 0, -0.22, 0)); bell.position.set(0, TH + 0.3, 0); scene.add(bell);
    const puck = box(0.4, 0.14, 0.3, mat.gloss(0xff3dd6), 0, 0.5, 0.02); scene.add(puck);
    const pad = box(1.4, 0.2, 0.6, mat.metal(0x666), 0.9, 0.1, 1.4); scene.add(pad); const lever = box(0.5, 0.1, 0.3, mat.gloss(0xef5350), 0.4, 0.25, 1.4); scene.add(lever);
    const hammerG = new THREE.Group(); hammerG.position.set(1.5, 0.2, 0.9); hammerG.scale.setScalar(0.8); scene.add(hammerG); hammerG.add(cyl(0.04, 0.04, 1.4, mat.wood(0x8d5a2b), 8, 0, 0.7, 0)); hammerG.add(box(0.5, 0.3, 0.3, mat.metal(0x546e7a), 0, 1.45, 0)); hammerG.rotation.z = 0.6;
    // power meter (floating)
    const meter = new THREE.Group(); meter.position.set(-1.6, 2.4, 0.4); scene.add(meter); meter.add(box(0.3, 3.0, 0.08, mat.std(0x111, { transparent: true, opacity: 0.7 }))); for (let i = 0; i < 12; i++) meter.add(box(0.26, 0.22, 0.09, mat.neon(i >= 10 ? 0xf4433f : i >= 7 ? 0xffd54a : 0x00c853, 0.5), 0, -1.38 + i * 0.25, 0.01));
    const needle = box(0.44, 0.06, 0.12, mat.neon(0xffffff, 2), 0, -1.4, 0.03); meter.add(needle);
    let swings = 3, best = 0, total = 0, over = false, t = 0, phase = "aim", power = 0, puckV = 0, puckY = 0.5, hitT = 0;
    const hud = () => api.setScore(`🔨 ${swings} swings   ⭐ ${total}`); hud();
    const swing = () => { if (phase !== "aim" || over) return; phase = "swing"; hitT = 0; power = (Math.sin(t * 3.2) + 1) / 2; swings--; hud(); api.sfx.whoosh && api.sfx.whoosh(); };
    return std({
      scene, camera,
      onDown() { swing(); }, onKey(k) { if (k === " ") swing(); },
      update(dt) {
        if (over) return; t += dt; parts.update(dt);
        if (phase === "aim") { needle.position.y = -1.4 + ((Math.sin(t * 3.2) + 1) / 2) * 2.8; }
        else if (phase === "swing") { hitT += dt; hammerG.rotation.z = 0.6 - Math.min(1, hitT / 0.25) * 1.9; lever.position.y = hitT > 0.2 ? 0.14 : 0.25;
          if (hitT >= 0.25) { phase = "fly"; const pts = Math.round(power * 100); puckV = 3 + power * 8.2; api.sfx.bonk(); parts.burst(new THREE.Vector3(0.4, 0.3, 1.4), 0xffd54a, 20, 3); this.pts = pts; } }
        else if (phase === "fly") { puckY += puckV * dt; puckV -= 9.8 * dt; if (puckY >= TH) { puckY = TH; api.sfx.win(); parts.burst(bell.position, 0xffd54a, 80, 5, 1.4); api.setTip("🔔 DING DING DING! You rang the bell! +30"); total += 30 + this.pts; this.pts = 0; phase = "fall"; bell.userData.ring = 1; }
          if (puckV <= 0 && phase === "fly") { const lvl = Math.min(4, Math.floor((puckY / TH) * 5)); total += this.pts; api.setTip(`${labels[lvl]} — ${this.pts} power`); api.sfx.ding(); phase = "fall"; } puck.position.y = puckY; }
        else if (phase === "fall") { puckY = Math.max(0.5, puckY - 6 * dt); puck.position.y = puckY; hammerG.rotation.z = approach(hammerG.rotation.z, 0.6, 4, dt); if (puckY <= 0.5) { hud(); if (swings <= 0) { over = true; const tix = clamp(Math.round(total / 3), 0, 80); api.finish(tix, total >= 150 ? "💪 Strongest kid in the arcade!" : "Nice swings!", `${total} power → ${tix} tickets`); } else { phase = "aim"; api.setTip("Tap when the meter hits the RED zone!"); } } }
        if (bell.userData.ring) { bell.userData.ring -= dt; bell.rotation.z = Math.sin(performance.now() / 50) * 0.3 * Math.max(0, bell.userData.ring); }
      },
    }, scene);
  },
};

// ==========================================================================
//  🍾 RING TOSS — swipe to toss rings onto the bottle necks. 8 rings.
// ==========================================================================
export const rings = {
  id: "rings", name: "Ring Toss", emoji: "🍾", cost: 2, color: 0x26a69a, cabinet: "rings", payout: "up to 70 🎟️",
  tip: "👆 Swipe UP to toss a ring! Land it on a bottle: back rows score more, the gold bottle is worth 10. 8 rings.",
  create(api) {
    const scene = baseScene(0x0b3d3a); lightScene(scene, { ambient: 0.9, pos: [2, 6, 4] });
    const camera = fpCamera(api.W, api.H, [0, 1.7, 3.0], [0, 0.9, -1.4], 58);
    const parts = makeParticles(scene);
    scene.add(box(3.6, 0.9, 3.4, mat.wood(0x8d5a2b), 0, 0.45, -1.2)); scene.add(box(3.6, 0.04, 3.4, mat.std(0x26a69a), 0, 0.92, -1.2));
    scene.add(box(4, 3, 0.2, mat.std(0x00695c), 0, 2.3, -3.1)); const sign = textPlane(["🍾 RING TOSS 🍾"], 3.4, 0.6, { bg: "#ffd54a", color: "#4a2b00", size: 100 }); sign.position.set(0, 3.4, -2.95); scene.add(sign);
    const bottles = []; const gold = ri(0, 15);
    for (let r = 0; r < 4; r++) for (let c = 0; c < 4; c++) { const i = r * 4 + c; const isGold = i === gold; const g = new THREE.Group(); const col = isGold ? 0xffd54a : pick([0x4caf50, 0x2196f3, 0x9c27b0, 0xff7043]); g.add(cyl(0.11, 0.13, 0.36, mat.gloss(col, { transparent: true, opacity: 0.9 }), 14, 0, 0.18, 0)); g.add(cyl(0.045, 0.09, 0.16, mat.gloss(col, { transparent: true, opacity: 0.9 }), 12, 0, 0.44, 0)); g.add(cyl(0.05, 0.05, 0.06, mat.metal(0xffd54a), 10, 0, 0.55, 0)); g.position.set(-0.75 + c * 0.5, 0.94, -0.3 - r * 0.55); scene.add(g); bottles.push({ g, v: isGold ? 10 : 1 + r, ringed: false }); }
    const ringGeo = new THREE.TorusGeometry(0.17, 0.03, 10, 24), ringMat = mat.gloss(0xef5350); const ready = new THREE.Mesh(ringGeo, ringMat); ready.position.set(0.3, 1.1, 2.0); ready.rotation.x = Math.PI / 2 - 0.3; scene.add(ready);
    const flying = []; let left = 8, score = 0, down = null, over = false;
    const hud = () => api.setScore(`⭕ ${left} rings   🎟️ ${score}`); hud();
    return std({
      scene, camera,
      onDown(p) { if (!over && left > 0) down = { x: p.sx, y: p.sy, t: performance.now() }; },
      onUp(p) { if (!down || over) return; const dy = down.y - p.sy, dx = p.sx - down.x, dt = Math.max(0.05, (performance.now() - down.t) / 1000); down = null; if (dy < 20) return;
        const pw = clamp(dy / dt / 900, 0.55, 1.4); const m = new THREE.Mesh(ringGeo, ringMat); m.position.set(0.3, 1.1, 2.0); m.rotation.x = Math.PI / 2; scene.add(m);
        flying.push({ m, vx: clamp(dx / dt / 600, -1.4, 1.4), vy: 3.2 * pw, vz: -3.0 * pw, done: false }); left--; hud(); api.sfx.tap(); ready.visible = left > 0; },
      update(dt) {
        parts.update(dt);
        for (let i = flying.length - 1; i >= 0; i--) { const f = flying[i]; if (f.done) continue; const P = f.m.position; P.x += f.vx * dt; P.y += f.vy * dt; P.z += f.vz * dt; f.vy -= 9.8 * dt; f.m.rotation.z += dt * 3;
          if (P.y <= 1.0 && f.vy < 0) { let hit = null; for (const b of bottles) if (!b.ringed && Math.hypot(b.g.position.x - P.x, b.g.position.z - P.z) < 0.14) hit = b;
            if (hit) { hit.ringed = true; score += hit.v; P.set(hit.g.position.x, 1.3, hit.g.position.z); f.m.rotation.set(Math.PI / 2, 0, 0); parts.burst(P.clone(), hit.v >= 10 ? 0xffd54a : 0xffffff, 24, 3); (hit.v >= 10 ? api.sfx.win : api.sfx.ding)(); api.setTip(hit.v >= 10 ? "✨ GOLD BOTTLE! +10" : `Ringed it! +${hit.v}`); }
            else { P.y = 0.96; f.m.rotation.set(Math.PI / 2, 0, rnd(0, 3)); api.sfx.click(); api.setTip("Clink… missed!"); if (P.z > 0.6 || Math.abs(P.x) > 1.8) { scene.remove(f.m); } }
            f.done = true; hud(); if (left <= 0 && !this.endT) this.endT = 1.2; } }
        if (this.endT) { this.endT -= dt; if (this.endT <= 0 && !over) { over = true; const tix = clamp(score * 3, 0, 70); api.finish(tix, score >= 15 ? "🍾 Ring master!" : "Clink clink!", `${score} points → ${tix} tickets`); } }
      },
    }, scene);
  },
};

// ==========================================================================
//  🧠 MEMORY MATCH — flip the glowing tiles, find the pairs before time runs out.
// ==========================================================================
export const memory = {
  id: "memory", name: "Memory Match", emoji: "🧠", cost: 2, color: 0x7e57c2, cabinet: "memory", payout: "up to 80 🎟️",
  tip: "🧠 Tap two tiles to flip them. Match all 8 pairs before the clock runs out — fewer flips = more tickets!",
  create(api) {
    const scene = baseScene(0x1a1040); lightScene(scene, { ambient: 0.9, pos: [0, 8, 3] });
    const camera = fpCamera(api.W, api.H, [0, 3.0, 2.6], [0, 0.9, -0.3], 55);
    const parts = makeParticles(scene);
    scene.add(box(3.6, 0.9, 2.6, mat.gloss(0x2a1a5e), 0, 0.45, -0.2)); scene.add(box(3.6, 0.05, 2.6, mat.gloss(0x14102a), 0, 0.92, -0.2));
    const ICONS = ["🍓", "🌈", "⭐", "🐸", "🚀", "🎈", "🦄", "🍕"]; const deck = [...ICONS, ...ICONS].sort(() => Math.random() - 0.5);
    const tiles = deck.map((ic, i) => { const g = new THREE.Group(); const back = box(0.66, 0.06, 0.5, mat.gloss(0x7e57c2, { emissive: 0x7e57c2, emissiveIntensity: 0.25 }), 0, 0, 0); g.add(back); const face = box(0.66, 0.06, 0.5, mat.gloss(0xfff8e1), 0, -0.001, 0); face.visible = false; g.add(face); const sp = emojiSprite(ic, 0.36); sp.position.y = -0.1; sp.visible = false; g.add(sp);
      const q = textPlane(["?"], 0.3, 0.3, { bg: null, color: "#fff", size: 100 }); q.rotation.x = -Math.PI / 2; q.position.y = 0.035; g.add(q); g.position.set(-1.26 + (i % 4) * 0.84, 0.98, -0.95 + Math.floor(i / 4) * 0.62); scene.add(g); return { g, back, face, sp, q, ic, up: false, done: false, flip: 0 }; });
    let open = [], flips = 0, pairs = 0, time = 60, over = false, lock = 0;
    const hud = () => api.setScore(`🧠 ${pairs}/8   🔁 ${flips}   ${fmtT(time)}`); hud();
    return std({
      scene, camera,
      onDown(p) {
        if (over || lock > 0) return; const hit = hitTest(p.ray, tiles.filter((t) => !t.up && !t.done).map((t) => t.back)); if (!hit) return;
        const t = tiles.find((q) => q.back === hit.object); t.up = true; open.push(t); flips++; api.sfx.flip(); hud();
        if (open.length === 2) { lock = 0.9; const [a, b] = open; if (a.ic === b.ic) { a.done = b.done = true; pairs++; api.sfx.ding(); parts.burst(a.g.position.clone().setY(1.3), 0xffd54a, 20, 2.5); parts.burst(b.g.position.clone().setY(1.3), 0xffd54a, 20, 2.5); api.setTip(`Match! ${a.ic}${b.ic}`); if (pairs >= 8) { over = true; api.sfx.win(); const tix = clamp(Math.round(80 - (flips - 16) * 2.5 + time * 0.3), 20, 80); setTimeout(() => api.finish(tix, "🧠 All pairs found!", `${flips} flips with ${Math.ceil(time)}s left → ${tix} tickets`), 700); } }
          else api.setTip("Not a match — remember where they are!"); }
      },
      update(dt) {
        if (!over) time -= dt; parts.update(dt);
        if (lock > 0) { lock -= dt; if (lock <= 0) { for (const t of open) if (!t.done) t.up = false; open = []; } }
        for (const t of tiles) { const target = t.up || t.done ? Math.PI : 0; t.flip = approach(t.flip, target, 10, dt); t.g.rotation.z = t.flip; const showFace = t.flip > Math.PI / 2; t.face.visible = showFace; t.sp.visible = showFace; t.back.visible = !showFace; t.q.visible = !showFace; t.g.position.y = 0.98 + Math.sin(t.flip) * 0.25; if (t.done) t.face.material.emissive?.setHex?.(0x00c853); }
        hud();
        if (time <= 0 && !over) { over = true; const tix = clamp(pairs * 6, 0, 80); api.finish(tix, "Time's up!", `${pairs} pairs → ${tix} tickets`); }
      },
    }, scene);
  },
};

// ==========================================================================
//  ⚽ PENALTY KICK — swipe to kick past the goalie. 6 shots.
// ==========================================================================
export const penalty = {
  id: "penalty", name: "Penalty Kick", emoji: "⚽", cost: 2, color: 0x43a047, cabinet: "goal", payout: "up to 72 🎟️",
  tip: "⚽ Swipe toward a corner to kick! The goalie dives — aim away from them. Top corners score double. 6 shots.",
  create(api) {
    const scene = baseScene(0x87ceeb); lightScene(scene, { ambient: 0.95, sun: 1.2, pos: [5, 10, 5] });
    const camera = fpCamera(api.W, api.H, [0, 1.4, 4.5], [0, 1.2, -4], 60);
    const parts = makeParticles(scene);
    scene.add(new THREE.Mesh(new THREE.PlaneGeometry(40, 40), mat.std(0x4caf50, { roughness: 1 })).rotateX(-Math.PI / 2));
    for (let i = 0; i < 10; i++) { const st = new THREE.Mesh(new THREE.PlaneGeometry(40, 1.5), mat.std(i % 2 ? 0x43a047 : 0x4caf50)); st.rotation.x = -Math.PI / 2; st.position.set(0, 0.005, -12 + i * 1.5); scene.add(st); }
    const GW = 4.4, GH = 2.2, GZ = -5;
    for (const x of [-GW / 2, GW / 2]) scene.add(cyl(0.06, 0.06, GH, mat.gloss(0xffffff), 10, x, GH / 2, GZ)); scene.add(cyl(0.06, 0.06, GW, mat.gloss(0xffffff), 10, 0, GH, GZ).rotateZ(Math.PI / 2));
    scene.add(box(GW, GH, 1.2, mat.std(0xffffff, { wireframe: true, transparent: true, opacity: 0.35 }), 0, GH / 2, GZ - 0.6));
    const crowd = []; for (let i = 0; i < 14; i++) { const k = makeKid({ shirt: pick([0xef5350, 0x3d8bfd, 0xffd54a, 0xab47bc]), skin: pick([0xffd6b8, 0xe0ac8a, 0x8d5a3c]), hairStyle: pick(["short", "long", "curly"]), mood: "excited" }); k.group.position.set(-6.5 + i, 0, GZ - 3.5); k.group.scale.setScalar(0.9); scene.add(k.group); crowd.push(k); }
    const keeper = makeKid({ shirt: 0xff9800, pants: 0x222, hairStyle: "short", hair: 0x222222, mood: "neutral" }); keeper.group.position.set(0, 0, GZ + 0.4); scene.add(keeper.group);
    const ballGeo = new THREE.SphereGeometry(0.16, 20, 14); const mkBall = () => { const g = new THREE.Group(); g.add(new THREE.Mesh(ballGeo, mat.gloss(0xffffff))); for (let i = 0; i < 6; i++) { const a = i * 1.05; g.add(sphere(0.05, mat.std(0x111), Math.cos(a) * 0.15, Math.sin(a * 1.7) * 0.15, Math.sin(a) * 0.15, 8)); } return g; };
    let ball = mkBall(); ball.position.set(0, 0.16, 1.2); scene.add(ball);
    let shots = 6, goals = 0, down = null, over = false, kick = null, keeperT = { x: 0, dive: 0 };
    const hud = () => api.setScore(`⚽ ${goals} goals   🥅 ${shots} shots`); hud();
    return std({
      scene, camera,
      onDown(p) { if (!kick && !over && shots > 0) down = { x: p.sx, y: p.sy, t: performance.now() }; },
      onUp(p) { if (!down || kick) return; const dy = down.y - p.sy, dx = p.sx - down.x, dt = Math.max(0.05, (performance.now() - down.t) / 1000); down = null; if (dy < 20) return;
        const pw = clamp(dy / dt / 900, 0.7, 1.3); const aimX = clamp(dx / 120, -1.9, 1.9), aimY = clamp(0.4 + dy / 220, 0.3, 2.0);
        const T = 0.9; kick = { vx: aimX / T, vy: (aimY - 0.16 + 0.5 * 9.8 * T * T) / T, vz: -(1.2 - GZ) / T, t: 0, scored: false };
        shots--; hud(); api.sfx.bonk(); keeperT = { x: Math.random() < 0.65 ? Math.sign(aimX || 1) * rnd(0.6, 1.7) : rnd(-1.7, 1.7), dive: 0 }; },
      update(dt) {
        parts.update(dt); const now = performance.now() / 1000;
        crowd.forEach((k, i) => { k.group.position.y = Math.max(0, Math.sin(now * 3 + i) * 0.08); k.parts.armL.rotation.x = -2.6 + Math.sin(now * 5 + i) * 0.3; k.parts.armR.rotation.x = -2.6 - Math.sin(now * 5 + i) * 0.3; });
        if (kick) { kick.t += dt; ball.position.x += kick.vx * dt; ball.position.y += kick.vy * dt; ball.position.z += kick.vz * dt; kick.vy -= 9.8 * dt; ball.rotation.x -= dt * 10;
          keeperT.dive = Math.min(1, keeperT.dive + dt * 1.6); keeper.group.position.x = keeperT.x * keeperT.dive; keeper.group.rotation.z = -Math.sign(keeperT.x) * keeperT.dive * 0.9; keeper.group.position.y = keeperT.dive * 0.35;
          if (ball.position.y < 0.16) { ball.position.y = 0.16; kick.vy = Math.abs(kick.vy) * 0.4; }
          if (!kick.scored && ball.position.z <= GZ + 0.3 && ball.position.z > GZ - 0.2) {
            const inGoal = Math.abs(ball.position.x) < GW / 2 - 0.1 && ball.position.y < GH - 0.1;
            const saved = Math.abs(ball.position.x - keeper.group.position.x) < 0.7 && ball.position.y < 1.6;
            if (inGoal && !saved) { kick.scored = true; const top = ball.position.y > 1.3; goals += top ? 2 : 1; api.sfx.win(); parts.burst(ball.position.clone(), 0xffd54a, 40, 3); api.setTip(top ? "⚽ TOP CORNER! GOAL ×2!" : "⚽ GOOOAL!"); }
            else { kick.scored = true; kick.vz = 1.5; kick.vx *= -0.3; api.sfx.miss(); api.setTip(saved ? "🧤 Saved by the goalie!" : "Wide! Missed the goal."); } }
          if (kick.t > 2.2) { scene.remove(ball); ball = mkBall(); ball.position.set(0, 0.16, 1.2); scene.add(ball); kick = null; keeperT = { x: 0, dive: 0 }; keeper.group.position.set(0, 0, GZ + 0.4); keeper.group.rotation.z = 0; hud();
            if (shots <= 0) { over = true; const tix = clamp(goals * 6, 0, 72); api.finish(tix, goals >= 8 ? "⚽ Golden boot!" : "Full time!", `${goals} goal points → ${tix} tickets`); } } }
        else { keeper.group.position.x = Math.sin(now * 1.5) * 0.4; keeper.walk(now, 0.3, dt); }
      },
    }, scene);
  },
};
