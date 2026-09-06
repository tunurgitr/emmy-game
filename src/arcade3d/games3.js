// ==========================================================================
//  Emmy's Arcade 3D — first-person games, part 3
//  (Coin Pusher, Balloon Darts, Bowling, Dance Floor, Rock Wall) + the two JOBS
//  (Snack Shack shift, Prize Booth shift) that pay real money in Regular mode.
// ==========================================================================
import { THREE, rnd, ri, clamp, pick, lerp, fmtT, mat, box, cyl, sphere, torus, emojiSprite, textPlane, blobShadow, makeParticles, disposeScene, lightScene, fpCamera, hitTest, hitPlane, approach, makeKid, makePlush, PLUSH_KINDS, PLUSH_INFO } from "./lib.js";

const baseScene = (bg = 0x0b0620) => { const s = new THREE.Scene(); s.background = new THREE.Color(bg); return s; };
const std = (ctrl, scene) => ({ ...ctrl, dispose() { ctrl.dispose && ctrl.dispose(); disposeScene(scene); } });

// ==========================================================================
//  🪙 COIN PUSHER — drop coins, the pusher shoves the pile off the edge.
// ==========================================================================
export const pusher = {
  id: "pusher", name: "Coin Pusher", emoji: "🪙", cost: 2, color: 0xffd54a, cabinet: "pusher", payout: "up to 120 🎟️",
  tip: "👆 Tap where to drop a coin! Coins pushed off the front edge win tickets. Gold 🎟️ bundles are worth 15! 20 coins.",
  create(api) {
    const scene = baseScene(0x1a0f3a); lightScene(scene, { ambient: 0.8, pos: [0, 6, 4] });
    const TW = 2.4, TL = 2.6, TOP = 1.0;
    const camera = fpCamera(api.W, api.H, [0, 2.7, TL / 2 + 1.4], [0, TOP - 0.2, -0.3], 55);
    const parts = makeParticles(scene);
    scene.add(box(TW + 0.4, TOP, TL + 0.4, mat.gloss(0x2a1a5e), 0, TOP / 2, 0)); scene.add(box(TW, 0.04, TL, mat.gloss(0x3949ab), 0, TOP, 0));
    for (const s of [-1, 1]) scene.add(box(0.08, 0.5, TL, mat.glass(0xaee8ff, 0.2), s * (TW / 2 + 0.04), TOP + 0.25, 0));
    scene.add(box(TW, 0.5, 0.04, mat.glass(0xaee8ff, 0.15), 0, TOP + 0.25, -TL / 2));
    const tray = box(TW + 0.4, 0.06, 0.6, mat.gloss(0xffd54a), 0, TOP - 0.35, TL / 2 + 0.45); scene.add(tray); const trayLbl = textPlane(["WIN ZONE 🎟️"], 1.6, 0.25, { bg: null, color: "#fff", size: 80 }); trayLbl.position.set(0, TOP - 0.31, TL / 2 + 0.45); trayLbl.rotation.x = -Math.PI / 2; scene.add(trayLbl);
    const pusherM = box(TW, 0.16, 0.6, mat.metal(0xb0bec5), 0, TOP + 0.08, -TL / 2 + 0.3); scene.add(pusherM); const pFace = box(TW, 0.16, 0.02, mat.neon(0xffd54a, 0.8), 0, TOP + 0.08, -TL / 2 + 0.61); scene.add(pFace);
    for (let i = 0; i < 10; i++) scene.add(sphere(0.04, mat.neon(i % 2 ? 0xff3dd6 : 0x00e5ff, 1.4), -TW / 2 + 0.15 + i * (TW - 0.3) / 9, TOP + 0.55, -TL / 2, 6));
    const sign = textPlane(["🪙 COIN PUSHER"], 2.2, 0.45, { bg: "#ffd54a", color: "#4a2b00", size: 90 }); sign.position.set(0, 2.3, -TL / 2 - 0.3); scene.add(sign);
    const coinGeo = new THREE.CylinderGeometry(0.11, 0.11, 0.03, 20), coinMat = mat.gloss(0xffd54a, { metalness: 0.55, roughness: 0.25, emissive: 0xffb300, emissiveIntensity: 0.35 }), bundleMat = mat.gloss(0xff3dd6, { emissive: 0xff3dd6, emissiveIntensity: 0.3 });
    const coins = []; const addCoin = (x, z, bundle = false, y = TOP + 0.02) => { const m = new THREE.Mesh(bundle ? new THREE.BoxGeometry(0.28, 0.05, 0.16) : coinGeo, bundle ? bundleMat : coinMat); m.position.set(x, y, z); if (bundle) { const t = emojiSprite("🎟️", 0.2); t.position.y = 0.06; m.add(t); } scene.add(m); coins.push({ m, x, z, vx: 0, vz: 0, r: bundle ? 0.15 : 0.11, v: bundle ? 15 : 3, bundle, y, falling: false }); };
    for (let i = 0; i < 26; i++) addCoin(rnd(-TW / 2 + 0.2, TW / 2 - 0.2), rnd(-TL / 2 + 0.9, TL / 2 - 0.15), i % 9 === 0);
    let left = 20, won = 0, pushT = 0, over = false, dropQueue = [];
    const score = () => api.setScore(`🪙 ${left} coins   🎟️ ${won}`); score();
    return std({
      scene, camera,
      onDown(p) { if (over || left <= 0) return; const pt = hitPlane(p.ray, [0, 1, 0], -(TOP + 0.02)); if (!pt) return; left--; score(); api.sfx.coin(); dropQueue.push({ x: clamp(pt.x, -TW / 2 + 0.15, TW / 2 - 0.15), z: clamp(pt.z, -TL / 2 + 0.9, TL / 2 - 0.2) }); },
      update(dt) {
        if (over) return; parts.update(dt); pushT += dt;
        const pz = -TL / 2 + 0.3 + (Math.sin(pushT * 1.3) * 0.5 + 0.5) * 0.7; pusherM.position.z = pz; pFace.position.z = pz + 0.31;
        while (dropQueue.length) { const d = dropQueue.shift(); addCoin(d.x, d.z, false, TOP + 1.0); }
        for (const c of coins) {
          if (c.y > TOP + 0.02 && !c.falling) { c.y -= 3 * dt; if (c.y <= TOP + 0.02) { c.y = TOP + 0.02; api.sfx.tick(); } }
          // pusher shoves coins forward
          const front = pz + 0.31; if (c.z - c.r < front && c.z > pz - 0.3 && !c.falling) c.z = front + c.r;
          c.x += c.vx * dt; c.z += c.vz * dt; c.vx *= Math.pow(0.05, dt); c.vz *= Math.pow(0.05, dt);
          c.x = clamp(c.x, -TW / 2 + c.r, TW / 2 - c.r);
          if (c.z + c.r * 0.6 > TL / 2 && !c.falling) { c.falling = true; api.sfx.ding(); won += c.v; score(); parts.burst(new THREE.Vector3(c.x, TOP, TL / 2), c.bundle ? 0xff3dd6 : 0xffd54a, c.bundle ? 30 : 12, 2); if (c.bundle) api.setTip("💖 TICKET BUNDLE! +15"); }
          if (c.falling) { c.y -= 4 * dt; c.z += 0.6 * dt; }
          c.m.position.set(c.x, c.y, c.z);
        }
        // coin-coin separation (simple)
        for (let i = 0; i < coins.length; i++) for (let j = i + 1; j < coins.length; j++) { const a = coins[i], b = coins[j]; if (a.falling || b.falling || Math.abs(a.y - b.y) > 0.1) continue; const dx = b.x - a.x, dz = b.z - a.z, d = Math.hypot(dx, dz), min = a.r + b.r; if (d < min && d > 0.001) { const push = (min - d) / 2, nx = dx / d, nz = dz / d; a.x -= nx * push; a.z -= nz * push; b.x += nx * push; b.z += nz * push; b.vz += nz * 0.3; } }
        for (let i = coins.length - 1; i >= 0; i--) if (coins[i].y < TOP - 0.6) { scene.remove(coins[i].m); coins.splice(i, 1); }
        if (left <= 0 && !dropQueue.length && !this.endT) this.endT = 4;
        if (this.endT) { this.endT -= dt; if (this.endT <= 0) { over = true; const tix = clamp(won, 0, 120); api.finish(tix, won >= 60 ? "🪙 Jackpot pusher!" : "Clink clink!", `${tix} tickets won`); } }
      },
    }, scene);
  },
};

// ==========================================================================
//  🎈 BALLOON DARTS — swipe to throw darts at drifting balloons.
// ==========================================================================
export const darts = {
  id: "darts", name: "Balloon Darts", emoji: "🎈", cost: 2, color: 0xef5350, cabinet: "darts", payout: "up to 80 🎟️",
  tip: "👆 Swipe toward a balloon to throw a dart! Gold balloons = 10 tickets. 8 darts.",
  create(api) {
    const scene = baseScene(0x3e1b1b); lightScene(scene, { ambient: 0.9, pos: [2, 6, 5] });
    const camera = fpCamera(api.W, api.H, [0, 1.6, 3.2], [0, 1.8, -2], 58);
    const parts = makeParticles(scene);
    scene.add(box(6, 4, 0.2, mat.std(0xd84315), 0, 2.2, -2.6)); for (let i = 0; i < 12; i++) scene.add(box(0.06, 4, 0.02, mat.std(0xffab91), -2.9 + i * 0.52, 2.2, -2.48));
    const sign = textPlane(["🎈 BALLOON DARTS 🎯"], 4, 0.6, { bg: "#ffd54a", color: "#4a2b00", size: 100 }); sign.position.set(0, 4.5, -2.45); scene.add(sign);
    scene.add(box(2.4, 0.9, 0.8, mat.wood(0x8d5a2b), 0, 0.45, 2.2)); // counter
    const COLORS = [{ c: 0xef5350, v: 3 }, { c: 0x42a5f5, v: 3 }, { c: 0x66bb6a, v: 3 }, { c: 0xab47bc, v: 5 }, { c: 0xffd54a, v: 10, gold: true }];
    const balloons = []; const mkBalloon = (x, y) => { const col = pick(COLORS); const g = new THREE.Group(); const b = sphere(0.22, mat.gloss(col.c, { emissive: col.c, emissiveIntensity: col.gold ? 0.3 : 0.05 })); b.scale.set(1, 1.15, 1); g.add(b); const knot = new THREE.Mesh(new THREE.ConeGeometry(0.04, 0.08, 6), mat.gloss(col.c)); knot.position.y = -0.27; knot.rotation.x = Math.PI; g.add(knot); const str = cyl(0.005, 0.005, 0.5, mat.std(0xffffff), 4, 0, -0.55, 0); g.add(str); g.add(sphere(0.06, mat.basic(0xffffff, { transparent: true, opacity: 0.5 }), -0.08, 0.1, 0.17, 8)); g.position.set(x, y, -2.3); scene.add(g); balloons.push({ g, v: col.v, gold: !!col.gold, ph: rnd(0, 6), bx: x, by: y, alive: true }); };
    for (let r = 0; r < 3; r++) for (let c = 0; c < 6; c++) mkBalloon(-2.2 + c * 0.88, 1.2 + r * 0.95);
    const dartsArr = []; let left = 8, score = 0, down = null, over = false;
    const hud = () => api.setScore(`🎯 ${left} darts   🎟️ ${score}`); hud();
    const mkDart = () => { const g = new THREE.Group(); g.add(cyl(0.012, 0.012, 0.3, mat.metal(0xffd54a), 8).rotateX(Math.PI / 2)); g.add(new THREE.Mesh(new THREE.ConeGeometry(0.012, 0.08, 8), mat.metal(0xcccccc)).rotateX(-Math.PI / 2).translateY(-0.19)); for (const a of [0, Math.PI / 2]) { const fin = box(0.002, 0.08, 0.08, mat.gloss(0xef5350), 0, 0, 0.16); fin.rotation.z = a; g.add(fin); } return g; };
    const ready = mkDart(); ready.position.set(0.3, 1.3, 2.2); ready.rotation.x = -0.3; scene.add(ready);
    return std({
      scene, camera,
      onDown(p) { if (!over && left > 0) down = { x: p.sx, y: p.sy, t: performance.now(), ray: p.ray }; },
      onUp(p) {
        if (!down || over) return; const dy = down.y - p.sy, dt = Math.max(0.04, (performance.now() - down.t) / 1000); const d0 = down; down = null; if (dy < 10 && Math.abs(p.sx - d0.x) < 10) return;
        // aim at where the release point projects on the board plane, power from swipe speed
        const target = hitPlane(p.ray, [0, 0, 1], 2.3) || new THREE.Vector3(0, 1.8, -2.3); const wobble = clamp(0.12 - dy / dt / 6000, 0, 0.12); target.x += rnd(-wobble, wobble); target.y += rnd(-wobble, wobble);
        const g = mkDart(); g.position.set(0.3, 1.3, 2.0); scene.add(g); dartsArr.push({ g, from: g.position.clone(), to: target, k: 0, stuck: false }); left--; hud(); api.sfx.laser(); ready.visible = left > 0;
      },
      update(dt) {
        if (over) return; parts.update(dt);
        for (const b of balloons) if (b.alive) { b.g.position.x = b.bx + Math.sin(performance.now() / 900 + b.ph) * 0.12; b.g.position.y = b.by + Math.sin(performance.now() / 700 + b.ph) * 0.08; }
        for (const d of dartsArr) { if (d.stuck) continue; d.k = Math.min(1, d.k + dt * 2.2); d.g.position.lerpVectors(d.from, d.to, d.k); d.g.position.y += Math.sin(d.k * Math.PI) * 0.35; d.g.lookAt(d.to.x, d.to.y - 0.1, d.to.z - 1);
          if (d.k >= 1) { d.stuck = true; let hit = null; for (const b of balloons) if (b.alive && Math.hypot(b.g.position.x - d.g.position.x, b.g.position.y - d.g.position.y) < 0.27) hit = b;
            if (hit) { hit.alive = false; scene.remove(hit.g); score += hit.v; parts.burst(hit.g.position, hit.g.children[0].material.color.getHex(), 30, 3, 0.7); api.sfx.pop(); api.setTip(hit.gold ? "✨ GOLD BALLOON! +10" : `POP! +${hit.v}`); hud(); }
            else { api.sfx.tap(); api.setTip("Thunk… missed!"); }
            if (left <= 0 && !this.endT) this.endT = 1.2; } }
        if (this.endT) { this.endT -= dt; if (this.endT <= 0) { over = true; const tix = clamp(score * 2, 0, 80); api.finish(tix, score >= 25 ? "🎈 Sharp shooter!" : "Pop pop!", `${score} points → ${tix} tickets`); } }
      },
    }, scene);
  },
};

// ==========================================================================
//  🎳 BOWLING — swipe to roll; curve with a sideways swipe. 3 rolls.
// ==========================================================================
export const bowling = {
  id: "bowling", name: "Bowling", emoji: "🎳", cost: 3, color: 0x5c6bc0, cabinet: "bowl", payout: "up to 90 🎟️",
  tip: "👆 Swipe UP to roll! Swipe a little sideways to curve. 3 rolls — strikes pay big!",
  create(api) {
    const scene = baseScene(0x12122a); lightScene(scene, { ambient: 0.85, pos: [0, 8, 2] });
    const LANE_L = 14, LW = 1.6;
    const camera = fpCamera(api.W, api.H, [0, 1.6, 2.2], [0, 0.5, -LANE_L * 0.6], 55);
    const parts = makeParticles(scene);
    scene.add(box(LW, 0.05, LANE_L, mat.wood(0xd9a066), 0, 0, -LANE_L / 2 + 1.5)); for (const s of [-1, 1]) { scene.add(box(0.35, 0.02, LANE_L, mat.std(0x222), s * (LW / 2 + 0.18), 0, -LANE_L / 2 + 1.5)); scene.add(box(0.1, 0.25, LANE_L, mat.gloss(0x5c6bc0), s * (LW / 2 + 0.38), 0.12, -LANE_L / 2 + 1.5)); }
    scene.add(box(LW + 1, 2.2, 0.3, mat.gloss(0x1a1040), 0, 1.1, -LANE_L + 1.0)); const sign = textPlane(["🎳 STRIKE ZONE 🎳"], 2.4, 0.5, { bg: "#5c6bc0", color: "#fff", size: 90 }); sign.position.set(0, 2.6, -LANE_L + 1.2); scene.add(sign);
    for (let i = 0; i < 6; i++) scene.add(box(0.14, 0.02, 0.5, mat.basic(0x333), -0.5 + i * 0.2, 0.03, -3)); // arrows
    const pinGeo = new THREE.CapsuleGeometry(0.07, 0.25, 6, 12), pinMat = mat.gloss(0xffffff), stripeMat = mat.gloss(0xef5350);
    const PINZ = -LANE_L + 2.2; const pinPos = []; for (let r = 0; r < 4; r++) for (let c = 0; c <= r; c++) pinPos.push({ x: (c - r / 2) * 0.32, z: PINZ - r * 0.28 });
    const pins = []; const setPins = () => { for (const p of pins) scene.remove(p.g); pins.length = 0; for (const pp of pinPos) { const g = new THREE.Group(); g.add(new THREE.Mesh(pinGeo, pinMat).translateY(0.2)); g.add(torus(0.072, 0.012, stripeMat, 0, 0.3, 0).rotateX(Math.PI / 2)); g.position.set(pp.x, 0, pp.z); scene.add(g); pins.push({ g, up: true, vx: 0, vz: 0, fall: 0, ax: 0 }); } };
    setPins();
    const ballGeo = new THREE.SphereGeometry(0.16, 20, 14); const ballMat = mat.gloss(0x7a3cff, { roughness: 0.15 }); const ready = new THREE.Mesh(ballGeo, ballMat); ready.position.set(0, 0.16, 1.2); scene.add(ready);
    let ball = null, rolls = 3, knocked = 0, total = 0, down = null, over = false, settle = 0;
    const hud = () => api.setScore(`🎳 ${rolls} rolls   pins: ${total}`); hud();
    return std({
      scene, camera,
      onDown(p) { if (!ball && rolls > 0 && !over) down = { x: p.sx, y: p.sy, t: performance.now() }; },
      onUp(p) { if (!down || ball) return; const dy = down.y - p.sy, dx = p.sx - down.x, dt = Math.max(0.05, (performance.now() - down.t) / 1000); down = null; if (dy < 25) return;
        const pw = clamp(dy / dt / 700, 0.6, 1.3); ball = { m: new THREE.Mesh(ballGeo, ballMat), x: clamp(dx / 400, -0.5, 0.5) * 0.4, z: 1.2, vx: clamp(dx / dt / 1500, -0.6, 0.6), vz: -11 * pw, curve: -clamp(dx / dt / 3000, -0.5, 0.5) }; ball.m.position.set(ball.x, 0.16, ball.z); scene.add(ball.m); ready.visible = false; rolls--; hud(); api.sfx.roll(); settle = 0; },
      update(dt) {
        parts.update(dt);
        if (ball) { ball.vx += ball.curve * dt * 2; ball.x += ball.vx * dt; ball.z += ball.vz * dt; ball.m.position.set(ball.x, 0.16, ball.z); ball.m.rotation.x += ball.vz * dt * 6;
          if (Math.abs(ball.x) > LW / 2 - 0.1) { ball.vx = 0; ball.curve = 0; ball.x = Math.sign(ball.x) * (LW / 2 + 0.2); ball.m.position.y = 0.05; api.setTip("Gutter ball… 😅"); }
          for (const p of pins) if (p.up && Math.hypot(p.g.position.x - ball.x, p.g.position.z - ball.z) < 0.26) { p.up = false; p.vx = (p.g.position.x - ball.x) * 6 + ball.vx; p.vz = -rnd(2, 5); p.ax = rnd(-3, 3); knocked++; total++; api.sfx.bonk(); parts.burst(p.g.position.clone().setY(0.3), 0xffffff, 10, 2); }
          if (ball.z < PINZ - 2) { scene.remove(ball.m); ball = null; settle = 1.4; } }
        for (const p of pins) if (!p.up) { p.fall = Math.min(1, p.fall + dt * 3); p.g.position.x += p.vx * dt; p.g.position.z += p.vz * dt; p.vx *= 0.9; p.vz *= 0.9; p.g.rotation.x = -p.fall * 1.5; p.g.rotation.z = p.fall * p.ax * 0.3;
          for (const q of pins) if (q.up && q !== p && Math.hypot(q.g.position.x - p.g.position.x, q.g.position.z - p.g.position.z) < 0.3 && Math.random() < 0.6) { q.up = false; q.vx = (q.g.position.x - p.g.position.x) * 4; q.vz = -rnd(1, 4); q.ax = rnd(-3, 3); total++; knocked++; } }
        if (settle > 0) { settle -= dt; if (settle <= 0) { const strike = knocked === 10; if (strike) { api.setTip("💥 STRIKE! +30 bonus"); total += 10; api.sfx.win(); parts.burst(new THREE.Vector3(0, 1, PINZ), 0xffd54a, 60, 4, 1.2); } else api.setTip(`${knocked} pins!`);
          knocked = 0; hud(); if (rolls <= 0) { over = true; const tix = clamp(total * 3, 0, 90); api.finish(tix, total >= 20 ? "🎳 Bowling champ!" : "Nice rolling!", `${total} pins → ${tix} tickets`); } else { setPins(); ready.visible = true; } } }
      },
    }, scene);
  },
};

// ==========================================================================
//  🕺 DANCE FLOOR — rhythm game: tap the arrow lane when the note hits the line.
// ==========================================================================
export const dance = {
  id: "dance", name: "Dance Floor", emoji: "🕺", cost: 2, color: 0xe040fb, cabinet: "dance", payout: "up to 90 🎟️",
  tip: "🎵 Tap the glowing pad (or arrow key) when a note reaches the line! 40 seconds of dancing.",
  create(api) {
    const scene = baseScene(0x0b0620); scene.add(new THREE.AmbientLight(0xffffff, 0.6)); const pl = new THREE.PointLight(0xe040fb, 30, 20); pl.position.set(0, 4, 0); scene.add(pl);
    const camera = fpCamera(api.W, api.H, [0, 3.2, 4.2], [0, 0.5, -2], 58);
    const parts = makeParticles(scene);
    const LANES = [{ x: -1.5, key: "ArrowLeft", e: "⬅️", c: 0x00e5ff }, { x: -0.5, key: "ArrowDown", e: "⬇️", c: 0xff3dd6 }, { x: 0.5, key: "ArrowUp", e: "⬆️", c: 0x00e676 }, { x: 1.5, key: "ArrowRight", e: "➡️", c: 0xffd54a }];
    // dance floor tiles
    const tiles = []; for (let i = -3; i <= 3; i++) for (let j = -6; j <= 2; j++) { const t = box(0.96, 0.05, 0.96, mat.std(0x220a44, { emissive: 0x220a44, emissiveIntensity: 0.6 }), i, 0, j); scene.add(t); tiles.push(t); }
    const pads = LANES.map((l) => { const p = box(0.9, 0.08, 0.9, mat.neon(l.c, 0.5), l.x, 0.06, 1.5); scene.add(p); const s = emojiSprite(l.e, 0.5); s.position.set(l.x, 0.35, 1.5); scene.add(s); return p; });
    scene.add(box(4.2, 0.02, 0.06, mat.neon(0xffffff, 2), 0, 0.1, 1.5));
    const disco = sphere(0.4, mat.metal(0xffffff, { roughness: 0.1 }), 0, 4.5, -1); scene.add(disco);
    const notes = []; let time = 40, beat = 0, nextNote = 1.0, hits = 0, combo = 0, misses = 0, over = false, songT = 0;
    const MEL = [523, 659, 784, 659, 880, 784, 659, 523, 587, 698, 880, 698, 784, 659, 587, 523];
    const spawn = () => { const l = pick(LANES); const g = new THREE.Group(); g.add(box(0.7, 0.12, 0.5, mat.neon(l.c, 1.4))); const s = emojiSprite(l.e, 0.45); s.position.y = 0.35; g.add(s); g.position.set(l.x, 0.2, -6); scene.add(g); notes.push({ g, lane: l, z: -6, hit: false }); };
    const judge = (lane) => { let best = null, bd = 0.55; for (const n of notes) if (!n.hit && n.lane === lane) { const d = Math.abs(n.z - 1.5); if (d < bd) { bd = d; best = n; } }
      const pad = pads[LANES.indexOf(lane)]; pad.material.emissiveIntensity = 2.5;
      if (best) { best.hit = true; scene.remove(best.g); const perfect = bd < 0.2; hits += perfect ? 2 : 1; combo++; parts.burst(new THREE.Vector3(lane.x, 0.3, 1.5), lane.c, perfect ? 30 : 15, 3, 0.6); api.tone(MEL[beat % MEL.length] * (perfect ? 2 : 1), 0.12, { type: "triangle", vol: 0.15 }); api.setTip(perfect ? `✨ PERFECT! ${combo}x` : `Good! ${combo}x`); }
      else { combo = 0; misses++; api.sfx.miss(); api.setTip("Whoops — off beat!"); }
      api.setScore(`🎵 ${hits}   🔥 ${combo}x   ${fmtT(time)}`); };
    return std({
      scene, camera,
      onDown(p) { if (over) return; const hit = hitTest(p.ray, pads); const idx = hit ? pads.indexOf(hit.object) : (p.x < -0.5 ? 0 : p.x < 0 ? 1 : p.x < 0.5 ? 2 : 3); judge(LANES[idx]); },
      onKey(k) { const l = LANES.find((q) => q.key === k); if (l && !over) judge(l); },
      onPad(btn) { const map = { 14: 0, 13: 1, 12: 2, 15: 3, 2: 0, 0: 1, 3: 2, 1: 3 }; if (btn in map && !over) judge(LANES[map[btn]]); },
      update(dt) {
        if (over) return; time -= dt; songT += dt; parts.update(dt); disco.rotation.y += dt;
        // backing beat
        nextNote -= dt; if (nextNote <= 0) { beat++; nextNote = 0.5 - Math.min(0.15, (40 - time) * 0.004); spawn(); api.tone(beat % 2 ? 110 : 165, 0.1, { type: "square", vol: 0.06 }); }
        tiles.forEach((t, i) => { const f = (Math.sin(songT * 4 + i * 0.7) + 1) / 2; t.material.emissive.setHSL((songT * 0.1 + i * 0.02) % 1, 0.8, 0.15 + f * 0.25); });
        for (const pd of pads) pd.material.emissiveIntensity = approach(pd.material.emissiveIntensity, 0.5, 6, dt);
        for (let i = notes.length - 1; i >= 0; i--) { const n = notes[i]; n.z += 3.2 * dt; n.g.position.z = n.z; if (n.z > 2.4) { if (!n.hit) { misses++; combo = 0; } scene.remove(n.g); notes.splice(i, 1); } }
        api.setScore(`🎵 ${hits}   🔥 ${combo}x   ${fmtT(time)}`);
        if (time <= 0) { over = true; const tix = clamp(hits * 2 - misses, 0, 90); api.finish(tix, hits >= 40 ? "🕺 Dance legend!" : "Nice moves!", `${hits} notes, ${misses} misses → ${tix} tickets`); }
      },
    }, scene);
  },
};

// ==========================================================================
//  🧗 ROCK WALL — free! Tap the glowing hold to climb; reach the top for tickets.
// ==========================================================================
export const climb = {
  id: "climb", name: "Rock Wall", emoji: "🧗", cost: 0, color: 0x00c853, cabinet: "wall", payout: "up to 60 🎟️", free: true,
  tip: "🧗 Tap the GLOWING hold to climb to it. Get to the bell at the top as fast as you can!",
  create(api) {
    const scene = baseScene(0x2a1d14); lightScene(scene, { ambient: 0.9, pos: [3, 10, 6] });
    const H = 11; const camera = fpCamera(api.W, api.H, [0, 1.6, 3.2], [0, 2.4, 0], 62);
    const parts = makeParticles(scene);
    scene.add(box(6, H + 1, 1.2, mat.std(0xb9a58a, { roughness: 1 }), 0, H / 2, -0.6)); for (let i = 0; i < 60; i++) { const b = box(rnd(0.2, 0.6), rnd(0.1, 0.3), 0.05, mat.std(0xa3907a), rnd(-2.8, 2.8), rnd(0.3, H), 0.01); scene.add(b); }
    scene.add(new THREE.Mesh(new THREE.PlaneGeometry(40, 40), mat.std(0x6f6a75)).rotateX(-Math.PI / 2));
    const bell = new THREE.Group(); bell.add(new THREE.Mesh(new THREE.ConeGeometry(0.25, 0.35, 16), mat.metal(0xffd54a))); bell.add(sphere(0.06, mat.metal(0xffd54a), 0, -0.2, 0)); bell.position.set(0, H + 0.3, 0.25); scene.add(bell); const top = textPlane(["🔔 RING THE BELL!"], 2.2, 0.4, { bg: "#00c853", color: "#fff", size: 80 }); top.position.set(0, H + 0.9, 0.2); scene.add(top);
    // hold path: zig-zag upward
    const holds = []; const cols = [0xff3dd6, 0x00e5ff, 0xffd54a, 0x00c853, 0xf4433f, 0x7a3cff]; let hx = 0;
    for (let i = 0; i < 16; i++) { hx = clamp(hx + rnd(-1.1, 1.1), -2.2, 2.2); const y = 1.0 + i * (H - 1.6) / 15; const m = sphere(0.17, mat.gloss(pick(cols)), hx, y, 0.12); m.scale.set(1.2, 0.8, 0.9); scene.add(m); holds.push(m); }
    for (let i = 0; i < 30; i++) scene.add(sphere(0.12, mat.gloss(pick(cols)), rnd(-2.8, 2.8), rnd(0.5, H), 0.1)); // decoys
    // hands
    const handL = sphere(0.09, mat.std(0xffd6b8), -0.35, 1.2, 0.3), handR = handL.clone(); handR.position.x = 0.35; scene.add(handL, handR);
    let idx = 0, camY = 1.6, time = 0, over = false, wrong = 0, shake = 0;
    const marker = torus(0.3, 0.035, mat.neon(0xffffff, 2)); scene.add(marker); const arrow = emojiSprite("👇", 0.5); scene.add(arrow);
    const glow = () => { holds.forEach((h, i) => { h.material.emissive = new THREE.Color(i === idx ? 0xffffff : 0x000000); h.material.emissiveIntensity = i === idx ? 0.9 : 0; }); const h = holds[Math.min(idx, holds.length - 1)]; marker.position.set(h.position.x, h.position.y, 0.32); arrow.position.set(h.position.x, h.position.y + 0.55, 0.35); marker.visible = arrow.visible = idx < holds.length; };
    glow(); api.setScore(`🧗 ${idx}/${holds.length}   ⏱ 0s`);
    return std({
      scene, camera,
      onDown(p) {
        if (over) return; const hit = hitTest(p.ray, holds);
        if (hit && hit.object === holds[idx]) { const h = holds[idx]; (idx % 2 ? handL : handR).position.set(h.position.x + (idx % 2 ? -0.1 : 0.1), h.position.y, 0.3); idx++; api.sfx.click(); parts.burst(h.position, 0xffffff, 10, 1.5, 0.5); glow(); api.setTip(idx >= holds.length ? "🔔 DING! You made it!" : `Nice grip! ${holds.length - idx} to go`);
          if (idx >= holds.length) { over = true; api.sfx.win(); parts.burst(bell.position, 0xffd54a, 60, 4, 1.2); const tix = clamp(Math.round(60 - time * 1.2), 15, 60); setTimeout(() => api.finish(tix, "🧗 Top of the wall!", `${Math.round(time)}s climb → ${tix} tickets`), 900); } }
        else if (hit) { wrong++; shake = 0.4; api.sfx.miss(); api.setTip("Wrong hold — that one's loose! Tap the GLOWING one."); if (wrong % 3 === 0 && idx > 0) { idx--; glow(); api.setTip("Slipped down one! 😬"); } }
      },
      update(dt) {
        if (!over) time += dt; parts.update(dt); shake = Math.max(0, shake - dt);
        const target = holds[Math.min(idx, holds.length - 1)]; camY = approach(camY, target.position.y + 0.4, 3, dt);
        camera.position.set(Math.sin(shake * 40) * shake * 0.1, camY, 3.2); camera.lookAt(0, camY + 0.7, 0);
        handL.position.y = approach(handL.position.y, Math.max(handL.position.y, camY - 0.6), 4, dt); handR.position.y = approach(handR.position.y, Math.max(handR.position.y, camY - 0.6), 4, dt);
        bell.rotation.z = over ? Math.sin(performance.now() / 60) * 0.3 : 0; marker.scale.setScalar(1 + Math.sin(performance.now() / 150) * 0.12); arrow.position.y = holds[Math.min(idx, holds.length - 1)].position.y + 0.55 + Math.sin(performance.now() / 200) * 0.05;
        api.setScore(`🧗 ${idx}/${holds.length}   ⏱ ${Math.round(time)}s`);
      },
    }, scene);
  },
};

// ==========================================================================
//  💼 JOBS — earn money (Regular mode). Do a good job → get paid + tips!
// ==========================================================================
const SNACKS = [{ e: "🍕", n: "Pizza" }, { e: "🌭", n: "Hot dog" }, { e: "🍟", n: "Fries" }, { e: "🍦", n: "Ice cream" }, { e: "🥤", n: "Soda" }, { e: "🍿", n: "Popcorn" }];
const CUSTOMER_LOOKS = () => ({ shirt: pick([0x00c853, 0xffd54a, 0x3d8bfd, 0xff7043, 0xab47bc]), skin: pick([0xffd6b8, 0xe0ac8a, 0x8d5a3c, 0xf1c9a5, 0x6b4226]), hair: pick([0x6b3e1e, 0x222222, 0xe8c36a, 0xa33a1e, 0x4a4a4a]), hairStyle: pick(["short", "long", "ponytail", "curly", "bun"]), mood: pick(["happy", "neutral", "excited"]) });
function bubble(lines) { const b = textPlane(lines, 1.6, 0.55, { bg: "#ffffff", color: "#222", size: 70 }); return b; }

export const snackjob = {
  id: "snackjob", name: "Snack Shack Shift", emoji: "🍕", cost: 0, job: true, color: 0xffd54a, cabinet: "none", payout: "earn $$",
  tip: "🧑‍🍳 Customers order snacks. Tap the items in their order, then tap the 🛎️ bell to serve! Fast + correct = tips. 60 second shift.",
  create(api) {
    const scene = baseScene(0x3a2414); lightScene(scene, { ambient: 0.95, pos: [2, 6, 4] });
    const camera = fpCamera(api.W, api.H, [0, 2.0, 2.2], [0, 1.0, -2.0], 66);
    const parts = makeParticles(scene);
    scene.add(new THREE.Mesh(new THREE.PlaneGeometry(30, 30), mat.std(0x6f6a75)).rotateX(-Math.PI / 2));
    scene.add(box(4.6, 1.0, 1.0, mat.wood(0x9a6234), 0, 0.5, -0.4)); scene.add(box(4.8, 0.08, 1.2, mat.gloss(0xffd54a), 0, 1.02, -0.4));
    const sign = textPlane(["🍕 SNACK SHACK 🥤"], 4, 0.6, { bg: "#ffd54a", color: "#4a2b00", size: 100 }); sign.position.set(0, 2.9, -0.2); scene.add(sign); for (const x of [-2.3, 2.3]) scene.add(cyl(0.06, 0.06, 2.6, mat.wood(0x6d4520), 8, x, 1.6, -0.2));
    const items = SNACKS.map((s, i) => { const plate = cyl(0.24, 0.24, 0.03, mat.gloss(0xffffff), 20, -1.4 + i * 0.56, 1.08, -0.35); scene.add(plate); const sp = emojiSprite(s.e, 0.4); sp.position.set(plate.position.x, 1.32, -0.35); scene.add(sp); return { ...s, plate, sp }; });
    const bellM = new THREE.Group(); bellM.add(new THREE.Mesh(new THREE.SphereGeometry(0.14, 16, 10, 0, Math.PI * 2, 0, Math.PI / 2), mat.metal(0xffd54a))); bellM.add(cyl(0.16, 0.16, 0.03, mat.metal(0x8d6e63), 16)); bellM.position.set(1.7, 1.08, 0.5); scene.add(bellM); const bellLbl = textPlane(["🛎️ SERVE"], 0.7, 0.2, { bg: null, color: "#fff", size: 70 }); bellLbl.position.set(1.7, 1.45, 0.5); scene.add(bellLbl);
    const trayM = box(0.9, 0.04, 0.5, mat.gloss(0xef5350), -1.7, 1.08, 0.5); scene.add(trayM); const trayLbl = textPlane(["TRAY"], 0.6, 0.18, { bg: null, color: "#fff", size: 70 }); trayLbl.position.set(-1.7, 1.38, 0.5); scene.add(trayLbl);
    const traySprites = [];
    let cust = null, custG = null, custBubble = null, order = [], tray = [], served = 0, perfect = 0, pay = 0, time = 60, over = false, waitT = 0, orderT = 0;
    const hud = () => api.setScore(`💵 $${pay.toFixed(2)}   🍽️ ${served}   ${fmtT(time)}`); hud();
    const newCustomer = () => { if (custG) scene.remove(custG); const k = makeKid(CUSTOMER_LOOKS()); custG = k.group; custG.position.set(rnd(-0.5, 0.5), 0, -3.5); custG.rotation.y = 0; scene.add(custG); cust = { k, arriving: true }; order = Array.from({ length: ri(1, 3) }, () => pick(SNACKS)); if (custBubble) scene.remove(custBubble); custBubble = bubble(["I'd like…", order.map((o) => o.e).join(" ")]); custBubble.position.set(0.9, 2.5, -2.4); custBubble.visible = false; scene.add(custBubble); orderT = 0; };
    const clearTray = () => { for (const s of traySprites) scene.remove(s); traySprites.length = 0; tray = []; };
    newCustomer();
    return std({
      scene, camera,
      onDown(p) {
        if (over || !cust || cust.arriving) return;
        const hitItem = hitTest(p.ray, items.flatMap((i) => [i.plate, i.sp])); if (hitItem) { const it = items.find((i) => i.plate === hitItem.object || i.sp === hitItem.object); if (it && tray.length < 4) { tray.push(it); const s = emojiSprite(it.e, 0.3); s.position.set(-2.05 + tray.length * 0.2, 1.22, 0.5); scene.add(s); traySprites.push(s); api.sfx.pop(); } return; }
        if (hitTest(p.ray, [bellM]) || hitTest(p.ray, [trayM])) {
          if (hitTest(p.ray, [trayM]) && !hitTest(p.ray, [bellM])) { clearTray(); api.sfx.tap(); api.setTip("Tray cleared."); return; }
          api.sfx.ding(); bellM.position.y = 1.02;
          const ok = tray.length === order.length && tray.every((t, i) => t.e === order[i].e);
          if (ok) { served++; const tip = orderT < 6 ? 1 : orderT < 10 ? 0.5 : 0; if (tip) perfect++; pay += 2 + tip; api.setTip(tip ? `Perfect order! $2 + $${tip.toFixed(2)} tip 🤩` : "Order served! $2 😊"); parts.burst(new THREE.Vector3(0, 1.8, -1.5), 0x00c853, 30, 2.5); api.sfx.coin(); if (cust) cust.k.parts.armR.rotation.z = -1.5; }
          else { api.setTip("That's not what they ordered! 😬 No pay for that one."); api.sfx.miss(); }
          hud(); clearTray(); cust.leaving = true; if (custBubble) custBubble.visible = false; waitT = 0.8;
        }
      },
      update(dt) {
        if (over) return; time -= dt; parts.update(dt); bellM.position.y = approach(bellM.position.y, 1.08, 10, dt); orderT += dt;
        if (cust) { if (cust.arriving) { custG.position.z += 2.2 * dt; cust.k.walk(performance.now() / 1000, 1, dt); if (custG.position.z >= -1.6) { cust.arriving = false; custBubble.visible = true; orderT = 0; api.setTip(`Order up: ${order.map((o) => o.n).join(" + ")}. Tap the snacks in order, then 🛎️!`); } }
          else if (cust.leaving) { custG.position.x += 2.5 * dt; custG.rotation.y = Math.PI / 2; cust.k.walk(performance.now() / 1000, 1, dt); if (custG.position.x > 4) { cust = null; waitT = 0.5; } }
          else { cust.k.walk(performance.now() / 1000, 0, dt); if (orderT > 14) { api.setTip("Too slow — they left! 😢"); cust.leaving = true; custBubble.visible = false; } } }
        else { waitT -= dt; if (waitT <= 0) newCustomer(); }
        hud();
        if (time <= 0) { over = true; const stars = served >= 6 ? "⭐⭐⭐" : served >= 3 ? "⭐⭐" : "⭐"; api.finish(pay, `Shift over! ${stars}`, `${served} orders served (${perfect} speedy) → you earned $${pay.toFixed(2)}`); }
      },
    }, scene);
  },
};

export const prizejob = {
  id: "prizejob", name: "Prize Booth Shift", emoji: "🎁", cost: 0, job: true, color: 0x7a3cff, cabinet: "none", payout: "earn $$",
  tip: "🎟️ Kids bring their ticket receipts. Tap the prize they won on the shelf and hand it over! 60 second shift.",
  create(api) {
    const scene = baseScene(0x2a1a5e); lightScene(scene, { ambient: 0.95, pos: [2, 6, 4] });
    const camera = fpCamera(api.W, api.H, [0, 1.9, 1.6], [0, 1.2, -3], 70);
    const parts = makeParticles(scene);
    scene.add(new THREE.Mesh(new THREE.PlaneGeometry(30, 30), mat.std(0x6f6a75)).rotateX(-Math.PI / 2));
    scene.add(box(6, 1.0, 1.0, mat.wood(0x7a4a22), 0, 0.5, -1.6)); scene.add(box(6.2, 0.08, 1.2, mat.gloss(0xffd54a), 0, 1.02, -1.6));
    // shelves are BEHIND the player (turn = tap on shelf shown at the sides); simpler: shelves at both sides of view
    const shelfKinds = [...PLUSH_KINDS].slice(0, 8); const shelfItems = [];
    shelfKinds.forEach((k, i) => { const side = i < 4 ? -1 : 1; const g = makePlush(k, 0.9); g.position.set(side * 2.4, 0.62 + (i % 4) * 0.6, -1.6); g.rotation.y = -side * 0.5; scene.add(g); const sh = box(0.8, 0.04, 0.7, mat.wood(0xc48b4c), side * 2.4, 0.6 + (i % 4) * 0.6, -1.6); scene.add(sh); shelfItems.push({ k, g }); });
    for (const side of [-1, 1]) { scene.add(box(0.1, 3, 0.1, mat.neon(0xffd54a, 1), side * 2.85, 1.5, -1.6)); scene.add(box(0.1, 3, 0.1, mat.neon(0xffd54a, 1), side * 1.95, 1.5, -1.6)); }
    const sign = textPlane(["🎟️ PRIZE BOOTH 🎟️"], 4, 0.6, { bg: "#7a3cff", color: "#fff", size: 100 }); sign.position.set(0, 2.9, -1.4); scene.add(sign);
    let cust = null, custG = null, custBubble = null, want = null, served = 0, pay = 0, time = 60, over = false, waitT = 0, orderT = 0, streak = 0; const anims = [];
    const hud = () => api.setScore(`💵 $${pay.toFixed(2)}   🎁 ${served}   ${fmtT(time)}`); hud();
    const newCustomer = () => { if (custG) scene.remove(custG); const k = makeKid(CUSTOMER_LOOKS()); custG = k.group; custG.position.set(rnd(-0.4, 0.4), 0, -5); scene.add(custG); cust = { k, arriving: true }; want = pick(shelfKinds); const info = PLUSH_INFO[want]; if (custBubble) scene.remove(custBubble); custBubble = bubble([`🎟️ ${info.v * 10} tickets`, `${info.emoji} ${info.name} please!`]); custBubble.position.set(0.9, 2.5, -3.2); custBubble.visible = false; scene.add(custBubble); orderT = 0; };
    newCustomer();
    return std({
      scene, camera,
      onDown(p) {
        if (over || !cust || cust.arriving || cust.leaving) return;
        const hit = hitTest(p.ray, shelfItems.map((s) => s.g)); if (!hit) return;
        let o = hit.object; let item = null; while (o) { item = shelfItems.find((s) => s.g === o); if (item) break; o = o.parent; } if (!item) return;
        if (item.k === want) { served++; streak++; const tip = orderT < 4 ? 1 : orderT < 7 ? 0.5 : 0; pay += 2 + tip; api.sfx.coin(); parts.burst(item.g.position.clone(), 0xffd54a, 30, 2.5); api.setTip(tip ? `Right prize, super fast! $2 + $${tip.toFixed(2)} tip 🤩` : "Right prize! $2 😊"); const fly = item.g.clone(); scene.add(fly); const from = fly.position.clone(), to = custG.position.clone().setY(1.2); let k = 0; const anim = { update(d) { k = Math.min(1, k + d * 2); fly.position.lerpVectors(from, to, k); fly.position.y += Math.sin(k * Math.PI) * 0.8; if (k >= 1) { scene.remove(fly); anims.splice(anims.indexOf(anim), 1); } } }; anims.push(anim); }
        else { streak = 0; api.sfx.miss(); api.setTip(`Oops, that's the ${PLUSH_INFO[item.k].name}. They wanted the ${PLUSH_INFO[want].name}! No pay. 😬`); }
        hud(); cust.leaving = true; custBubble.visible = false;
      },
      update(dt) {
        if (over) return; time -= dt; parts.update(dt); orderT += dt; for (const a of [...anims]) a.update(dt);
        if (cust) { if (cust.arriving) { custG.position.z += 2.4 * dt; cust.k.walk(performance.now() / 1000, 1, dt); if (custG.position.z >= -2.8) { cust.arriving = false; custBubble.visible = true; orderT = 0; api.setTip(`They want the ${PLUSH_INFO[want].emoji} ${PLUSH_INFO[want].name} — tap it on the shelf!`); } }
          else if (cust.leaving) { custG.position.x += 2.5 * dt; custG.rotation.y = Math.PI / 2; cust.k.walk(performance.now() / 1000, 1, dt); if (custG.position.x > 4.5) { cust = null; waitT = 0.4; } }
          else { cust.k.walk(performance.now() / 1000, 0, dt); if (orderT > 12) { api.setTip("Too slow — they wandered off! 😢"); cust.leaving = true; custBubble.visible = false; } } }
        else { waitT -= dt; if (waitT <= 0) newCustomer(); }
        hud();
        if (time <= 0) { over = true; const stars = served >= 8 ? "⭐⭐⭐" : served >= 4 ? "⭐⭐" : "⭐"; api.finish(pay, `Shift over! ${stars}`, `${served} happy kids → you earned $${pay.toFixed(2)}`); }
      },
    }, scene);
  },
};
