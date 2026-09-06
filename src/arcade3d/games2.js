// ==========================================================================
//  Emmy's Arcade 3D — first-person games, part 2
//  (Air Hockey, Gone Fishin', Skee-Ball, Whack-a-Mole, Hoop Shot)
// ==========================================================================
import { THREE, rnd, ri, clamp, pick, lerp, fmtT, mat, box, cyl, sphere, torus, emojiSprite, emojiPlane, textPlane, blobShadow, makeParticles, disposeScene, lightScene, fpCamera, hitTest, hitPlane, approach, makeKid } from "./lib.js";

const baseScene = (bg = 0x0b0620) => { const s = new THREE.Scene(); s.background = new THREE.Color(bg); return s; };
const std = (ctrl, scene) => ({ ...ctrl, dispose() { ctrl.dispose && ctrl.dispose(); disposeScene(scene); } });
const weighted = (arr) => { const tot = arr.reduce((s, f) => s + f.w, 0); let r = Math.random() * tot; for (const f of arr) { r -= f.w; if (r <= 0) return f; } return arr[0]; };

// ==========================================================================
//  🏒 AIR HOCKEY — a real table; drag your red paddle. First to 5.
// ==========================================================================
export const hockey = {
  id: "hockey", name: "Air Hockey", emoji: "🏒", cost: 3, color: 0x3d8bfd, cabinet: "table", payout: "up to 60 🎟️",
  tip: "🖐️ Drag on the table to move your red paddle. First to 5 wins!",
  create(api) {
    const scene = baseScene(0x1a1040); lightScene(scene, { ambient: 0.9, sun: 1.0, pos: [0, 8, 3] });
    const TW = 2.2, TL = 4.4, R = 0.11, PR = 0.17, GOAL = 0.8, TOP = 0.9;
    const camera = fpCamera(api.W, api.H, [0, 2.9, TL / 2 + 1.3], [0, TOP, -0.4], 55);
    const parts = makeParticles(scene);
    scene.add(box(TW + 0.3, 0.75, TL + 0.3, mat.gloss(0x1e3a8a), 0, 0.4, 0)); scene.add(box(TW, 0.05, TL, mat.gloss(0xeaf6ff), 0, TOP - 0.02, 0));
    for (const s of [-1, 1]) { scene.add(box(0.1, 0.16, TL + 0.3, mat.gloss(0x14102a), s * (TW / 2 + 0.1), TOP + 0.06, 0)); for (const q of [-1, 1]) scene.add(box((TW - GOAL) / 2 + 0.2, 0.16, 0.1, mat.gloss(0x14102a), q * (GOAL / 2 + (TW - GOAL) / 4 + 0.05), TOP + 0.06, s * (TL / 2 + 0.1))); }
    // markings
    const line = new THREE.Mesh(new THREE.PlaneGeometry(TW, 0.03), mat.basic(0x3d8bfd)); line.rotation.x = -Math.PI / 2; line.position.y = TOP + 0.001; scene.add(line);
    const circ = torus(0.45, 0.015, mat.basic(0x3d8bfd), 0, TOP + 0.001, 0); circ.rotation.x = Math.PI / 2; scene.add(circ);
    for (const s of [-1, 1]) { const g = box(GOAL, 0.02, 0.12, mat.basic(0x111), 0, TOP, s * (TL / 2 + 0.02)); scene.add(g); }
    for (let i = 0; i < 12; i++) for (let j = 0; j < 22; j++) scene.add(sphere(0.006, mat.basic(0xc8ddf5), -TW / 2 + 0.1 + i * (TW - 0.2) / 11, TOP + 0.001, -TL / 2 + 0.1 + j * (TL - 0.2) / 21, 6));
    const mkPaddle = (c) => { const g = new THREE.Group(); g.add(cyl(PR, PR, 0.05, mat.gloss(c), 24, 0, 0.025, 0)); g.add(cyl(0.06, 0.08, 0.1, mat.gloss(c), 16, 0, 0.09, 0)); return g; };
    const me = mkPaddle(0xf4433f), ai = mkPaddle(0x3d8bfd); me.position.set(0, TOP, TL / 2 - 0.5); ai.position.set(0, TOP, -TL / 2 + 0.5); scene.add(me, ai);
    const puck = cyl(R, R, 0.03, mat.gloss(0x111), 24, 0, TOP + 0.015, 0.6); scene.add(puck);
    const scoreBoard = textPlane(["YOU 0 — 0 🤖"], 2.4, 0.5, { bg: "#14102a", color: "#ffd54a", size: 90 }); scoreBoard.position.set(0, 2.4, -TL / 2 - 1.2); scene.add(scoreBoard);
    let you = 0, bot = 0, over = false, pause = 0.8, msg = "Ready?";
    const pv = { x: 0, z: 0 }, mv = { x: 0, z: 0, tx: 0, tz: TL / 2 - 0.5, px: 0, pz: 0, vx: 0, vz: 0 }, av = { vx: 0, vz: 0 };
    const setBoard = (txt) => { scoreBoard.material.map.dispose(); const t = textPlane([txt], 2.4, 0.5, { bg: "#14102a", color: "#ffd54a", size: 90 }); scoreBoard.material.map = t.material.map; t.geometry.dispose(); };
    const reset = (toMe) => { puck.position.set(0, TOP + 0.015, toMe ? 0.6 : -0.6); pv.x = pv.z = 0; pause = 0.8; setBoard(`YOU ${you} — ${bot} 🤖`); api.setScore(`YOU ${you} — ${bot} 🤖`); };
    const collide = (pad, vel) => { const dx = puck.position.x - pad.position.x, dz = puck.position.z - pad.position.z, d = Math.hypot(dx, dz); if (d < R + PR && d > 0) { const nx = dx / d, nz = dz / d; puck.position.x = pad.position.x + nx * (R + PR + 0.005); puck.position.z = pad.position.z + nz * (R + PR + 0.005); const rel = (pv.x - vel.vx) * nx + (pv.z - vel.vz) * nz; if (rel < 0) { pv.x -= 2 * rel * nx; pv.z -= 2 * rel * nz; } pv.x += vel.vx * 0.6; pv.z += vel.vz * 0.6; api.sfx.click(); } };
    let drag = false;
    const aim = (p) => { const pt = hitPlane(p.ray, [0, 1, 0], -TOP); if (pt) { mv.tx = clamp(pt.x, -TW / 2 + PR, TW / 2 - PR); mv.tz = clamp(pt.z, PR + 0.05, TL / 2 - PR); } };
    return std({
      scene, camera,
      onDown(p) { drag = true; aim(p); }, onMove(p) { if (drag) aim(p); }, onUp() { drag = false; },
      update(dt) {
        if (over) return; parts.update(dt);
        mv.px = me.position.x; mv.pz = me.position.z; me.position.x = approach(me.position.x, mv.tx, 18, dt); me.position.z = approach(me.position.z, mv.tz, 18, dt); mv.vx = (me.position.x - mv.px) / dt; mv.vz = (me.position.z - mv.pz) / dt;
        const target = puck.position.z < 0 ? { x: puck.position.x, z: puck.position.z - 0.05 } : { x: puck.position.x * 0.5, z: -TL / 2 + 0.5 };
        const ox = ai.position.x, oz = ai.position.z; ai.position.x += clamp(target.x - ai.position.x, -1, 1) * Math.min(Math.abs(target.x - ai.position.x), 2.6 * dt); ai.position.z += clamp(target.z - ai.position.z, -1, 1) * Math.min(Math.abs(target.z - ai.position.z), 2.0 * dt); ai.position.z = clamp(ai.position.z, -TL / 2 + PR, -PR - 0.05); ai.position.x = clamp(ai.position.x, -TW / 2 + PR, TW / 2 - PR); av.vx = (ai.position.x - ox) / dt; av.vz = (ai.position.z - oz) / dt;
        if (pause > 0) { pause -= dt; return; }
        puck.position.x += pv.x * dt; puck.position.z += pv.z * dt; pv.x *= Math.pow(0.75, dt); pv.z *= Math.pow(0.75, dt);
        const sp = Math.hypot(pv.x, pv.z); if (sp > 7) { pv.x *= 7 / sp; pv.z *= 7 / sp; }
        if (puck.position.x < -TW / 2 + R) { puck.position.x = -TW / 2 + R; pv.x = Math.abs(pv.x); api.sfx.tap(); } if (puck.position.x > TW / 2 - R) { puck.position.x = TW / 2 - R; pv.x = -Math.abs(pv.x); api.sfx.tap(); }
        const inGoal = Math.abs(puck.position.x) < GOAL / 2;
        if (puck.position.z < -TL / 2 + R) { if (inGoal) { you++; api.sfx.win(); parts.burst(puck.position.clone(), 0xffd54a, 40, 3); reset(false); msg = "GOAL! 🎉"; api.setTip("GOAL! 🎉"); } else { puck.position.z = -TL / 2 + R; pv.z = Math.abs(pv.z); } }
        if (puck.position.z > TL / 2 - R) { if (inGoal) { bot++; api.sfx.miss(); reset(true); api.setTip("Robot scores 🤖"); } else { puck.position.z = TL / 2 - R; pv.z = -Math.abs(pv.z); } }
        collide(me, mv); collide(ai, av);
        if (you >= 5 || bot >= 5) { over = true; const win = you > bot; const tix = 5 + you * 5 + (win ? 25 : 0); api.finish(tix, win ? "🏆 You win!" : "So close!", `${you}–${bot} → ${tix} tickets`); }
      },
    }, scene);
  },
};

// ==========================================================================
//  🎣 GONE FISHIN' — on a dock. Tap to cast, tap on the bite, hold to reel.
// ==========================================================================
const FISH = [
  { e: "🐟", v: 5, name: "Little fish", w: 5, sp: 0.6 }, { e: "🐠", v: 10, name: "Tropical fish", w: 3, sp: 0.9 }, { e: "🐡", v: 12, name: "Puffer", w: 2.5, sp: 0.75 }, { e: "🦑", v: 15, name: "Squid", w: 2, sp: 1.2 },
  { e: "🦈", v: 25, name: "Shark!", w: 1, sp: 1.6 }, { e: "🐙", v: 18, name: "Octopus", w: 1.5, sp: 1.0 }, { e: "👢", v: 1, name: "Old boot", w: 1.5, sp: 0.3 }, { e: "🐳", v: 40, name: "WHALE!", w: 0.4, sp: 1.9 },
];
export const fish = {
  id: "fish", name: "Gone Fishin'", emoji: "🎣", cost: 2, color: 0x26c6da, cabinet: "booth", payout: "up to 100 🎟️",
  tip: "👆 Tap to cast. When the bobber goes ❗, tap fast! Then HOLD to keep the green bar on the fish. 60 seconds.",
  create(api) {
    const scene = baseScene(0xffcf9a); scene.fog = new THREE.Fog(0xffcf9a, 30, 80); lightScene(scene, { ambient: 0.9, sun: 1.1, color: 0xffe0b0, pos: [-10, 8, -6] });
    const camera = fpCamera(api.W, api.H, [0, 1.7, 2.5], [0, 0.4, -5], 60);
    const parts = makeParticles(scene);
    // water + dock + scenery
    const water = new THREE.Mesh(new THREE.PlaneGeometry(80, 80, 40, 40), mat.gloss(0x26a6c8, { transparent: true, opacity: 0.92, roughness: 0.15 })); water.rotation.x = -Math.PI / 2; scene.add(water); const wpos = water.geometry.attributes.position; const base = wpos.array.slice();
    const dock = box(3, 0.2, 4, mat.wood(0x8d5a2b), 0, 0.3, 2.5); scene.add(dock); for (const [x, z] of [[-1.3, 0.8], [1.3, 0.8], [-1.3, 4], [1.3, 4]]) scene.add(cyl(0.12, 0.12, 1.2, mat.wood(0x6d4520), 10, x, -0.2, z));
    const sunS = emojiSprite("☀️", 6); sunS.position.set(12, 14, -40); scene.add(sunS); for (let i = 0; i < 5; i++) { const c = emojiSprite("☁️", rnd(4, 7)); c.position.set(rnd(-30, 30), rnd(8, 14), -45); scene.add(c); }
    for (let i = 0; i < 12; i++) { const t = emojiSprite(pick(["🌲", "🌳"]), rnd(3, 5)); t.position.set(rnd(-30, 30), 2, -38 + rnd(-3, 3)); scene.add(t); }
    const hills = new THREE.Mesh(new THREE.SphereGeometry(30, 24, 12), mat.std(0x2e7d32)); hills.position.set(-25, -24, -50); scene.add(hills); const hills2 = hills.clone(); hills2.position.set(28, -25, -55); scene.add(hills2);
    // rod (fixed to camera) + line + bobber
    const rod = new THREE.Group(); rod.position.set(0.5, -0.4, -0.6); rod.rotation.set(-0.9, 0.1, -0.3); camera.add(rod); scene.add(camera); rod.add(cyl(0.012, 0.025, 2.2, mat.std(0x5a3a1a), 8, 0, 1.1, 0)); rod.add(cyl(0.05, 0.05, 0.12, mat.metal(), 12, 0, 0.35, 0.05).rotateX(Math.PI / 2));
    const tipW = new THREE.Vector3(); const lineGeo = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), new THREE.Vector3()]); const lineM = new THREE.Line(lineGeo, new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.8 })); scene.add(lineM);
    const bob = new THREE.Group(); bob.add(sphere(0.09, mat.gloss(0xf4433f), 0, 0.05, 0)); bob.add(sphere(0.09, mat.gloss(0xffffff), 0, -0.05, 0)); bob.visible = false; scene.add(bob);
    const alert = emojiSprite("❗", 0.7); alert.visible = false; scene.add(alert);
    // reel minigame gauges (3D, floating at the right)
    const gauge = new THREE.Group(); gauge.position.set(1.6, 1.3, -1.8); gauge.visible = false; scene.add(gauge); const GH = 1.6;
    gauge.add(box(0.28, GH, 0.05, mat.std(0x111, { transparent: true, opacity: 0.7 }), 0, 0, 0)); const greenBar = box(0.24, GH * 0.26, 0.06, mat.neon(0x00e676, 0.6), 0, 0, 0.01); gauge.add(greenBar); const fishIcon = emojiSprite("🐟", 0.3); fishIcon.position.z = 0.08; gauge.add(fishIcon);
    gauge.add(box(0.1, GH, 0.05, mat.std(0x111, { transparent: true, opacity: 0.7 }), -0.26, 0, 0)); const progBar = box(0.08, GH, 0.06, mat.neon(0xffd54a, 0.8), -0.26, 0, 0.01); gauge.add(progBar);
    const holdLbl = textPlane(["HOLD ☝️"], 0.7, 0.2, { bg: null, color: "#fff", size: 80 }); holdLbl.position.set(-0.1, -GH / 2 - 0.2, 0); gauge.add(holdLbl);
    const swimmers = []; for (let i = 0; i < 8; i++) { const f = emojiSprite(pick(["🐟", "🐠"]), 0.5); f.position.set(rnd(-8, 8), -0.3, rnd(-10, -2)); f.userData.d = pick([-1, 1]); f.userData.s = rnd(0.5, 1.2); f.material.opacity = 0.6; scene.add(f); swimmers.push(f); }
    let time = 60, tickets = 0, caught = [], phase = "ready", t = 0, biteAt = 0, cur = null, over = false, tt = 0; const flyers = [];
    let bar = 0.5, barV = 0, fishPos = 0.5, fishT = 0, fishTarget = 0.5, prog = 0.3, holding = false;
    const castTarget = new THREE.Vector3(0.6, 0, -5); let castK = 0;
    const score = () => api.setScore(`🎟️ ${tickets}   🐟 ${caught.length}   ${fmtT(time)}`);
    const setPhase = (p, tip) => { phase = p; t = 0; if (tip) api.setTip(tip); gauge.visible = p === "reel"; alert.visible = p === "bite"; if (p === "ready") bob.visible = false; };
    return std({
      scene, camera,
      onDown() {
        if (over) return;
        if (phase === "ready") { castTarget.set(rnd(-1.5, 1.5), 0, rnd(-6.5, -4)); castK = 0; bob.visible = true; bob.position.set(0.5, 1.2, 1.9); setPhase("cast", "Splash! Now wait for a bite… 🎣"); biteAt = rnd(1.6, 4.5); api.sfx.splash(); }
        else if (phase === "bite") { cur = weighted(FISH); fishIcon.material.map = emojiSprite(cur.e).material.map; setPhase("reel", `Something's on! HOLD to lift the bar, keep the ${cur.e} inside it!`); bar = 0.5; barV = 0; fishPos = 0.5; prog = 0.35; holding = true; api.sfx.ding(); }
        else if (phase === "reel") holding = true;
        else if (phase === "cast" && t > 0.6) { setPhase("ready", "Too early! Wait for the ❗ then tap. Tap to cast again."); api.sfx.miss(); }
      },
      onUp() { holding = false; }, onKey(k) { if (k === " ") this.onDown(); },
      update(dt) {
        if (over) return; time -= dt; t += dt; tt += dt; parts.update(dt);
        // water waves
        for (let i = 0; i < wpos.count; i++) { const x = base[i * 3], y = base[i * 3 + 1]; wpos.array[i * 3 + 2] = Math.sin(x * 0.6 + tt * 1.4) * 0.06 + Math.cos(y * 0.5 + tt) * 0.06; } wpos.needsUpdate = true;
        for (const s of swimmers) { s.position.x += s.userData.d * s.userData.s * dt; if (Math.abs(s.position.x) > 10) s.userData.d *= -1; }
        // rod tip world pos → line
        rod.localToWorld(tipW.set(0, 2.2, 0)); lineGeo.attributes.position.setXYZ(0, tipW.x, tipW.y, tipW.z); lineGeo.attributes.position.setXYZ(1, bob.position.x, bob.position.y, bob.position.z); lineGeo.attributes.position.needsUpdate = true; lineM.visible = bob.visible;
        if (phase === "cast") { if (castK < 1) { castK = Math.min(1, castK + dt * 1.6); const k = castK; bob.position.lerpVectors(new THREE.Vector3(0.5, 1.2, 1.9), castTarget, k); bob.position.y = 1.2 * (1 - k) + Math.sin(k * Math.PI) * 1.6; if (castK >= 1) parts.burst(castTarget, 0x9fdfff, 20, 1.5, 0.6, 3); } else bob.position.y = Math.sin(t * 3) * 0.03; if (t >= biteAt + 0.6) { setPhase("bite", "❗ BITE! TAP NOW! ❗"); api.sfx.pop(); } }
        else if (phase === "bite") { bob.position.y = -0.12 + Math.sin(t * 20) * 0.05; alert.position.copy(bob.position).add(new THREE.Vector3(0, 0.7 + Math.sin(t * 25) * 0.05, 0)); if (t > 0.9) { setPhase("ready", "It got away… Tap to cast again!"); api.sfx.miss(); } }
        else if (phase === "reel") {
          barV += (holding ? 1.6 : -1.6) * dt * 2.2; barV *= 0.9; bar = clamp(bar + barV * dt * 3, 0.1, 0.9); if (bar === 0.1 || bar === 0.9) barV = 0;
          fishT -= dt; if (fishT <= 0) { fishT = rnd(0.4, 1.1) / cur.sp; fishTarget = rnd(0.08, 0.92); }
          fishPos += clamp(fishTarget - fishPos, -1, 1) * Math.min(Math.abs(fishTarget - fishPos), cur.sp * dt * 0.9);
          const inside = Math.abs(fishPos - bar) < 0.13; prog += (inside ? 0.28 : -0.2) * dt; if (inside && Math.random() < dt * 4) api.sfx.tick();
          greenBar.position.y = (0.5 - bar) * GH; fishIcon.position.y = (0.5 - fishPos) * GH; progBar.scale.y = Math.max(0.01, prog); progBar.position.y = -GH / 2 + GH * prog / 2; greenBar.material.emissiveIntensity = inside ? 1.2 : 0.4;
          bob.position.y = -0.1 + Math.sin(t * 15) * 0.06; bob.position.x += Math.sin(t * 6) * dt * 0.4;
          if (prog >= 1) { tickets += cur.v; caught.push(cur); parts.burst(bob.position.clone().setY(0.5), 0xffd54a, 40, 3); (cur.v >= 25 ? api.sfx.win : api.sfx.ding)(); const f = emojiSprite(cur.e, 0.8); f.position.copy(bob.position); scene.add(f); const start = f.position.clone(); let k = 0; const fly = { update(d) { k = Math.min(1, k + d * 1.6); f.position.lerpVectors(start, new THREE.Vector3(0.6, 1.4, 1.6), k); f.position.y += Math.sin(k * Math.PI) * 1.4; if (k >= 1) { scene.remove(f); flyers.splice(flyers.indexOf(fly), 1); } } }; flyers.push(fly); setPhase("ready", `You caught a ${cur.name} ${cur.e} +${cur.v} 🎟️  — tap to cast again!`); }
          if (prog <= 0) { api.sfx.miss(); setPhase("ready", `The ${cur.name} got away! Tap to cast again.`); }
        }
        for (const f of [...flyers]) f.update(dt);
        score();
        if (time <= 0) { over = true; api.finish(tickets, caught.length ? "🎣 Great catch!" : "Nothing biting today…", `${caught.length} fish → ${tickets} tickets`); }
      },
    }, scene);
  },
};

// ==========================================================================
//  🎳 SKEE-BALL — a real lane. Swipe up to roll the ball. 9 balls.
// ==========================================================================
export const skee = {
  id: "skee", name: "Skee-Ball", emoji: "🎳", cost: 2, color: 0xff9800, cabinet: "lane", payout: "up to 60 🎟️",
  tip: "👆 Swipe UP to roll the ball. Harder swipe = further up the lane! 9 balls.",
  create(api) {
    const scene = baseScene(0x2a160c); lightScene(scene, { ambient: 0.8, pos: [2, 8, 4] });
    const camera = fpCamera(api.W, api.H, [0, 1.7, 3.2], [0, 1.0, -4], 55);
    const parts = makeParticles(scene);
    const LANE_L = 6, LW = 1.2;
    scene.add(box(LW + 0.3, 0.8, LANE_L + 0.3, mat.gloss(0x5d4037), 0, 0.4, -LANE_L / 2 + 1.5));
    const lane = box(LW, 0.05, LANE_L - 1.6, mat.wood(0xc68642), 0, 0.82, 1.5 - (LANE_L - 1.6) / 2 + 0.0); scene.add(lane);
    for (const s of [-1, 1]) scene.add(box(0.08, 0.2, LANE_L, mat.gloss(0x3e2723), s * (LW / 2 + 0.04), 0.9, -LANE_L / 2 + 1.5));
    const rampZ = -LANE_L + 1.5 + 0.8; const ramp = box(LW, 0.05, 1.2, mat.wood(0xc68642), 0, 1.05, rampZ); ramp.rotation.x = 0.45; scene.add(ramp);
    // rings board (tilted toward player)
    const board = new THREE.Group(); board.position.set(0, 1.9, -LANE_L + 1.5 - 0.5); board.rotation.x = -0.55; scene.add(board);
    const BN = new THREE.Vector3(0, Math.sin(0.55), Math.cos(0.55)), BY = new THREE.Vector3(0, Math.cos(0.55), -Math.sin(0.55)), BC = new THREE.Vector3(0, 1.9 + 0.2 * Math.cos(0.55), -LANE_L + 1.5 - 0.5 - 0.2 * Math.sin(0.55)), tmpV = new THREE.Vector3();
    board.add(box(1.4, 1.5, 0.1, mat.gloss(0x3e2723), 0, 0.2, -0.05));
    const RINGS = [{ r: 0.1, pts: 100, c: 0xffd54a }, { r: 0.2, pts: 50, c: 0xff3dd6 }, { r: 0.3, pts: 40, c: 0x7a3cff }, { r: 0.42, pts: 30, c: 0x3d8bfd }, { r: 0.54, pts: 20, c: 0x00c853 }, { r: 0.66, pts: 10, c: 0xff9800 }];
    for (let i = RINGS.length - 1; i >= 0; i--) { const r = RINGS[i]; board.add(cyl(r.r, r.r, 0.03 + i * 0.002, mat.gloss(r.c), 32, 0, 0.2, 0.01 + (RINGS.length - i) * 0.004).rotateX(Math.PI / 2)); const lbl = textPlane([String(r.pts)], 0.2, 0.09, { bg: null, color: "#222", size: 60 }); lbl.position.set(0, 0.2 + r.r - 0.055, 0.06); if (r.pts === 100) lbl.position.y = 0.2; board.add(lbl); }
    scene.add(textPlane(["🎳 SKEE-BALL"], 1.6, 0.4, { bg: "#ff9800", color: "#fff", size: 90 }).translateY(3.1).translateZ(-LANE_L + 1.5 - 0.6));
    const ballMat = mat.gloss(0xeeeeee); const ballGeo = new THREE.SphereGeometry(0.11, 20, 14);
    const rack = []; for (let i = 0; i < 9; i++) { const b = new THREE.Mesh(ballGeo, ballMat); b.position.set(-LW / 2 - 0.35, 0.5 + i * 0.0, 2.2 - i * 0.24); scene.add(b); rack.push(b); }
    const ready = new THREE.Mesh(ballGeo, ballMat); ready.position.set(0, 0.95, 1.6); scene.add(ready);
    let balls = 9, score = 0, down = null, ball = null, over = false, endT = 0;
    const scoreTxt = () => api.setScore(`⭐ ${score}   🎳 ${balls}`); scoreTxt();
    return std({
      scene, camera,
      onDown(p) { if (!ball && balls > 0 && !over) down = { x: p.sx, y: p.sy, t: performance.now() }; },
      onUp(p) {
        if (!down || ball) return; const dy = down.y - p.sy, dx = p.sx - down.x, dt = Math.max(0.05, (performance.now() - down.t) / 1000); down = null; if (dy < 25) return;
        const power = clamp(dy / dt / 700, 0.55, 1.25); ball = { m: new THREE.Mesh(ballGeo, ballMat), x: 0, y: 0.95, z: 1.6, vx: clamp(dx / dt / 900, -0.9, 0.9), vy: 0, vz: -power * 7.2, air: false, t: 0 }; ball.m.position.set(0, 0.95, 1.6); scene.add(ball.m); ready.visible = false; balls--; scene.remove(rack.pop()); api.sfx.roll(); scoreTxt();
      },
      update(dt) {
        parts.update(dt);
        if (ball) { const b = ball; b.t += dt;
          if (!b.air) { b.x += b.vx * dt; b.z += b.vz * dt; b.vz *= Math.pow(0.85, dt); if (Math.abs(b.x) > LW / 2 - 0.11) { b.x = Math.sign(b.x) * (LW / 2 - 0.11); b.vx *= -0.5; }
            if (b.z < rampZ + 0.6) { b.air = true; const sp = -b.vz; b.vy = sp * 0.62; b.vz = -sp * 0.55; api.sfx.tap(); } if (b.vz > -0.3 && !b.air) { this.settle(0); } }
          else { b.x += b.vx * dt; b.y += b.vy * dt; b.z += b.vz * dt; b.vy -= 9.8 * dt;
            tmpV.set(b.x, b.y, b.z).sub(BC); const dn = tmpV.dot(BN), vn = b.vy * BN.y + b.vz * BN.z;
            if (dn < 0.12 && vn < 0) { const d = Math.hypot(b.x, tmpV.dot(BY)); let pts = 0; for (const r of RINGS) if (d < r.r + 0.04) { pts = r.pts; break; } this.settle(pts); }
            else if (b.y < 0.3 || b.z < BC.z - 1.5) this.settle(0); }
          b.m.position.set(b.x, b.y, b.z); b.m.rotation.x -= (b.vz || 0) * dt * 9; }
        if (over) { endT -= dt; if (endT <= 0 && !this.fin) { this.fin = true; const tix = clamp(Math.round(score / 10), 0, 60); api.finish(tix, score >= 300 ? "🎳 Skee-Ball star!" : "Good rolling!", `${score} points → ${tix} tickets`); } }
      },
      settle(pts) { const b = ball; score += pts; if (pts) { parts.burst(b.m.position, pts >= 50 ? 0xffd54a : 0xffffff, 30, 2.5); (pts >= 50 ? api.sfx.win : api.sfx.ding)(); api.setTip(pts >= 100 ? "💯 BULLSEYE!" : `+${pts}!`); } else { api.sfx.miss(); api.setTip("Gutter… try again!"); }
        scene.remove(b.m); ball = null; ready.visible = balls > 0; scoreTxt(); if (balls <= 0) { over = true; endT = 1; } },
    }, scene);
  },
};

// ==========================================================================
//  🐹 WHACK-A-MOLE — a real mole table; tap the moles. 30 seconds.
// ==========================================================================
export const mole = {
  id: "mole", name: "Whack-a-Mole", emoji: "🐹", cost: 2, color: 0x8bc34a, cabinet: "moles", payout: "up to 60 🎟️",
  tip: "🔨 Tap the moles as they pop up! Golden moles are worth 3. 30 seconds.",
  create(api) {
    const scene = baseScene(0x1f3a12); lightScene(scene, { ambient: 0.9, pos: [2, 8, 4] });
    const camera = fpCamera(api.W, api.H, [0, 2.4, 2.6], [0, 0.9, -0.2], 55);
    const parts = makeParticles(scene);
    scene.add(box(3.2, 0.9, 2.6, mat.gloss(0x7cb342), 0, 0.45, 0)); scene.add(box(3.2, 0.06, 2.6, mat.std(0x8bc34a), 0, 0.93, 0));
    for (let i = 0; i < 20; i++) { const f = emojiSprite("🌼", 0.22); f.position.set(rnd(-1.5, 1.5), 1.0, rnd(-1.2, 1.2)); scene.add(f); }
    const holes = []; const hitMeshes = [];
    for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) {
      const x = -0.95 + c * 0.95, z = -0.75 + r * 0.75;
      scene.add(cyl(0.3, 0.3, 0.02, mat.std(0x3e2723), 24, x, 0.96, z)); scene.add(torus(0.3, 0.05, mat.std(0x5d4037), x, 0.97, z).rotateX(Math.PI / 2));
      const g = new THREE.Group(); g.position.set(x, 0.5, z); scene.add(g);
      const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.2, 0.25, 6, 14), mat.std(0x8d6e63, { roughness: 1 })); body.position.y = 0.2; g.add(body);
      const face = emojiSprite("🐹", 0.42); face.position.set(0, 0.32, 0.14); g.add(face); const crown = emojiSprite("👑", 0.3); crown.position.set(0, 0.62, 0.05); crown.visible = false; g.add(crown);
      // clip: moles below the table hide behind an opaque cover cylinder
      holes.push({ g, body, face, crown, x, z, up: 0, alive: false, life: 0, gold: false, bonk: 0 }); hitMeshes.push(body);
    }
    const hammer = new THREE.Group(); hammer.add(cyl(0.03, 0.03, 0.6, mat.wood(0x8d5a2b), 8, 0, 0.3, 0)); hammer.add(cyl(0.12, 0.12, 0.3, mat.gloss(0x546e7a), 16, 0, 0.6, 0).rotateZ(Math.PI / 2)); hammer.position.set(0.7, 1.6, 0.6); hammer.rotation.z = -0.6; scene.add(hammer);
    let time = 30, hits = 0, over = false, spawnT = 0, swing = 0, target = new THREE.Vector3(0.7, 1.6, 0.6); const faceOk = emojiSprite("🐹").material, faceKo = emojiSprite("😵").material;
    return std({
      scene, camera,
      onDown(p) {
        if (over) return; const pt = hitPlane(p.ray, [0, 1, 0], -1.0); if (pt) target.set(pt.x, 1.2, pt.z); swing = 1;
        const hit = p.ray.intersectObjects(holes.filter((h) => h.alive && h.up > 0.3).map((h) => h.body))[0]; let got = false;
        if (hit) { const h = holes.find((q) => q.body === hit.object); if (h) { h.alive = false; h.bonk = 0.35; const pts = h.gold ? 3 : 1; hits += pts; got = true; parts.burst(h.g.position.clone().setY(1.3), h.gold ? 0xffd54a : 0xffffff, 20, 2.5); api.sfx.bonk(); h.face.material = faceKo; if (h.gold) api.setTip("✨ Golden mole! +3"); } }
        if (!got) api.sfx.tap();
      },
      update(dt) {
        if (over) return; time -= dt; parts.update(dt);
        hammer.position.lerp(target, Math.min(1, dt * 14)); swing = Math.max(0, swing - dt * 5); hammer.rotation.x = -swing * 1.4; hammer.rotation.z = -0.6 + swing * 0.3;
        spawnT -= dt; if (spawnT <= 0) { spawnT = rnd(0.35, 0.75) - Math.min(0.2, (30 - time) * 0.006); const h = pick(holes.filter((h) => !h.alive && h.up <= 0)); if (h) { h.alive = true; h.life = rnd(0.7, 1.4); h.gold = Math.random() < 0.15; h.crown.visible = h.gold; h.face.material = faceOk; } }
        for (const h of holes) { if (h.alive) { h.up = Math.min(1, h.up + dt * 6); h.life -= dt; if (h.life <= 0) h.alive = false; } else h.up = Math.max(0, h.up - dt * 5); if (h.bonk > 0) h.bonk -= dt; h.g.position.y = 0.45 + h.up * 0.55; h.g.visible = h.up > 0.05; h.g.scale.y = h.bonk > 0 ? 0.7 : 1; }
        api.setScore(`🐹 ${hits}   ${fmtT(time)}`);
        if (time <= 0) { over = true; const tix = clamp(hits * 2, 0, 60); api.finish(tix, hits >= 20 ? "🔨 Mole master!" : "Time's up!", `${hits} bonks → ${tix} tickets`); }
      },
    }, scene);
  },
};

// ==========================================================================
//  🏀 HOOP SHOT — swipe to shoot at a moving hoop. 45 seconds.
// ==========================================================================
export const hoops = {
  id: "hoops", name: "Hoop Shot", emoji: "🏀", cost: 2, color: 0xff7043, cabinet: "hoops", payout: "up to 60 🎟️",
  tip: "👆 Swipe UP to shoot! The hoop moves — time your shot. 45 seconds.",
  create(api) {
    const scene = baseScene(0x1b2a49); lightScene(scene, { ambient: 0.8, pos: [3, 8, 5] });
    const camera = fpCamera(api.W, api.H, [0, 1.6, 3.2], [0, 2.0, -3], 60);
    const parts = makeParticles(scene);
    scene.add(new THREE.Mesh(new THREE.PlaneGeometry(12, 12), mat.wood(0xc68642)).rotateX(-Math.PI / 2));
    scene.add(box(12, 6, 0.2, mat.std(0x263a5e), 0, 3, -4.6)); for (let i = 0; i < 12; i++) scene.add(box(0.9, 0.3, 0.05, mat.neon(i % 2 ? 0xffd54a : 0xf44336, 0.8), -5.5 + i, 5.4, -4.48));
    const rig = new THREE.Group(); scene.add(rig); const HY = 2.55, HZ = -3.2, RR = 0.36;
    rig.add(box(1.6, 1.0, 0.06, mat.gloss(0xeceff1), 0, HY + 0.55, HZ - 0.4)); rig.add(box(0.7, 0.45, 0.02, mat.basic(0xf44336), 0, HY + 0.3, HZ - 0.36));
    const rim = torus(RR, 0.03, mat.gloss(0xff7043), 0, HY, HZ); rim.rotation.x = Math.PI / 2; rig.add(rim);
    const net = cyl(RR, RR * 0.6, 0.45, mat.std(0xffffff, { wireframe: true, transparent: true, opacity: 0.6 }), 12, 0, HY - 0.25, HZ); rig.add(net);
    rig.add(box(0.1, 3.5, 0.1, mat.metal(0x666), 0, 1.75, HZ - 0.5));
    const cage = box(4, 3.5, 4, mat.std(0xffffff, { wireframe: true, transparent: true, opacity: 0.08 }), 0, 1.75, -1.5); scene.add(cage);
    const ballGeo = new THREE.SphereGeometry(0.13, 20, 14), ballMat = mat.gloss(0xff7043); const seamMat = mat.basic(0x111);
    const mkBall = () => { const g = new THREE.Group(); g.add(new THREE.Mesh(ballGeo, ballMat)); g.add(torus(0.13, 0.006, seamMat)); g.add(torus(0.13, 0.006, seamMat).rotateY(Math.PI / 2)); return g; };
    const ready = mkBall(); ready.position.set(0, 0.95, 1.0); scene.add(ready);
    const balls = []; let time = 45, made = 0, streak = 0, over = false, down = null, hoopX = 0, dir = 1, hoopSp = 0.55;
    return std({
      scene, camera,
      onDown(p) { if (!over) down = { x: p.sx, y: p.sy, t: performance.now() }; },
      onUp(p) {
        if (!down || over) return; const dy = down.y - p.sy, dx = p.sx - down.x, dt = Math.max(0.05, (performance.now() - down.t) / 1000); down = null; if (dy < 20) return;
        const pw = clamp(dy / dt / 900, 0.7, 1.35); const b = mkBall(); b.position.set(0, 0.95, 1.0); scene.add(b);
        balls.push({ g: b, vx: clamp(dx / dt / 500, -1.6, 1.6), vy: 6.0 * pw, vz: -3.6 * pw, scored: false, t: 0 }); api.sfx.tap(); ready.visible = false; setTimeout(() => (ready.visible = !over), 500);
      },
      update(dt) {
        if (over) return; time -= dt; parts.update(dt);
        hoopX += dir * hoopSp * dt; if (hoopX > 1.4) dir = -1; if (hoopX < -1.4) dir = 1; rig.position.x = hoopX;
        for (let i = balls.length - 1; i >= 0; i--) { const b = balls[i]; b.t += dt; const P = b.g.position; P.x += b.vx * dt; P.y += b.vy * dt; P.z += b.vz * dt; b.vy -= 9.8 * dt; b.g.rotation.x -= dt * 6;
          const dxr = P.x - hoopX, dzr = P.z - HZ, dr = Math.hypot(dxr, dzr);
          if (!b.scored && b.vy < 0 && Math.abs(P.y - HY) < 0.08 && dr < RR - 0.1) { b.scored = true; made++; streak++; parts.burst(new THREE.Vector3(hoopX, HY, HZ), 0xff7043, 30, 2.5); api.sfx.win(); api.setTip(streak >= 3 ? `🔥 On fire! ${streak} in a row!` : "SWISH! 🏀"); }
          else if (!b.scored && Math.abs(P.y - HY) < 0.1 && Math.abs(dr - RR) < 0.14) { b.vy = Math.abs(b.vy) * 0.35; b.vx += dxr > 0 ? 1.2 : -1.2; b.vz += dzr > 0 ? 0.8 : -0.8; api.sfx.click(); }
          if (!b.scored && P.z < HZ - 0.35 && P.y > HY + 0.1 && P.y < HY + 1.1 && Math.abs(P.x - hoopX) < 0.8) { b.vz = Math.abs(b.vz) * 0.4; P.z = HZ - 0.34; api.sfx.click(); }
          if (P.y < 0.13) { P.y = 0.13; b.vy = Math.abs(b.vy) * 0.5; b.vz *= 0.8; b.vx *= 0.8; if (Math.abs(b.vy) < 0.5) { if (!b.scored) streak = 0; scene.remove(b.g); balls.splice(i, 1); } } }
        api.setScore(`🏀 ${made}   ${fmtT(time)}`);
        if (time <= 0) { over = true; const tix = clamp(made * 4, 0, 60); api.finish(tix, made >= 10 ? "🏀 Sharpshooter!" : "Buzzer!", `${made} baskets → ${tix} tickets`); }
      },
    }, scene);
  },
};
