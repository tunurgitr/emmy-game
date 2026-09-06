// ==========================================================================
//  Emmy's Arcade 3D — first-person games, part 1
//  (Ticket Wheel, Claw Machine, VR Blaster, Turbo Racer, Laser Tag)
//
//  Contract: def.create(api) → { scene, camera, update(dt), onDown(p), onMove(p),
//  onUp(p), onKey(k), dispose() }.  p = { x, y (NDC), sx, sy (px), ray, W, H }
//  api = { W, H, sfx, tone, keys, setScore, setTip, finish(tickets,title,detail), hud }
// ==========================================================================
import { THREE, rnd, ri, clamp, pick, lerp, fmtT, mat, box, cyl, sphere, torus, emojiSprite, emojiPlane, textPlane, textTexture, blobShadow, makeParticles, disposeScene, lightScene, fpCamera, hitTest, hitPlane, approach, makeKid, makePlush, PLUSH_KINDS, PLUSH_INFO } from "./lib.js";

const baseScene = (bg = 0x0b0620) => { const s = new THREE.Scene(); s.background = new THREE.Color(bg); return s; };
const std = (ctrl, scene) => ({ ...ctrl, dispose() { ctrl.dispose && ctrl.dispose(); disposeScene(scene); } });

// ==========================================================================
//  🎡 TICKET WHEEL — a real prize wheel; flick it sideways or tap SPIN.
// ==========================================================================
const WHEEL_SEGS = [
  { v: 5, c: 0xff3dd6 }, { v: 20, c: 0x3d8bfd }, { v: 2, c: 0xffd54a }, { v: 50, c: 0x00c853 }, { v: 10, c: 0xff9800 }, { v: 5, c: 0x7a3cff },
  { v: 200, c: 0xffffff, jackpot: true }, { v: 10, c: 0x00e5ff }, { v: 25, c: 0xf4433f }, { v: 5, c: 0x3d8bfd }, { v: 100, c: 0xffd54a }, { v: 15, c: 0xff3dd6 },
];
export const wheel = {
  id: "wheel", name: "Ticket Wheel", emoji: "🎡", cost: 2, color: 0xff3dd6, cabinet: "wheel", payout: "2–200 🎟️",
  tip: "👆 Swipe across the wheel to spin it (or tap SPIN). Tickets where the pointer stops!",
  create(api) {
    const scene = baseScene(0x1a0f3a); lightScene(scene, { ambient: 0.8, pos: [2, 6, 6] });
    const camera = fpCamera(api.W, api.H, [0, 1.9, 4.2], [0, 1.9, 0], 50);
    const parts = makeParticles(scene);
    // backdrop wall with lights
    scene.add(box(10, 6, 0.2, mat.std(0x2a1a5e), 0, 3, -0.6));
    for (let i = 0; i < 24; i++) { const a = (i / 24) * Math.PI * 2; scene.add(sphere(0.06, mat.neon(i % 2 ? 0xffd54a : 0xffffff, 1.5), Math.cos(a) * 1.75, 1.9 + Math.sin(a) * 1.75, -0.4)); }
    // wheel
    const W = new THREE.Group(); W.position.set(0, 1.9, 0); scene.add(W);
    const n = WHEEL_SEGS.length, seg = (Math.PI * 2) / n;
    WHEEL_SEGS.forEach((s, i) => {
      const m = new THREE.Mesh(new THREE.CylinderGeometry(1.5, 1.5, 0.16, 16, 1, false, i * seg, seg), mat.gloss(s.c)); m.rotation.x = -Math.PI / 2; W.add(m);
      const a = i * seg + seg / 2; // label (cylinder theta 0 = +z after rotation → map to xy)
      const lbl = textPlane([s.jackpot ? "★" : String(s.v)], 0.5, 0.36, { bg: null, color: s.c === 0xffd54a || s.c === 0xffffff ? "#4a2b00" : "#fff", size: 120 });
      lbl.position.set(Math.sin(a) * 1.05, Math.cos(a) * 1.05, 0.09); lbl.rotation.z = -a; W.add(lbl);
      W.add(cyl(0.05, 0.05, 0.14, mat.metal(0xffd54a), 8, Math.sin(i * seg) * 1.45, Math.cos(i * seg) * 1.45, 0.1).rotateX(Math.PI / 2));
    });
    W.add(torus(1.5, 0.06, mat.metal(0xffd54a), 0, 0, 0)); W.add(cyl(0.22, 0.22, 0.2, mat.metal(0xffffff), 24, 0, 0, 0.02).rotateX(Math.PI / 2));
    const star = emojiSprite("⭐", 0.4); star.position.z = 0.15; W.add(star);
    // pointer (flapper) at the top
    const flap = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.45, 8), mat.gloss(0xf4433f)); flap.position.set(0, 1.9 + 1.62, 0.12); flap.rotation.x = Math.PI; scene.add(flap);
    // SPIN button
    const btn = cyl(0.3, 0.3, 0.12, mat.neon(0x00c853, 0.9), 24, 0, 0.35, 1.6); scene.add(btn); const btnLbl = textPlane(["SPIN"], 0.5, 0.25, { bg: null, color: "#fff", size: 100 }); btnLbl.position.set(0, 0.42, 1.6); btnLbl.rotation.x = -Math.PI / 2; scene.add(btnLbl);
    scene.add(box(6, 0.6, 3.5, mat.std(0x2a1a5e), 0, 0.05, 1.2));
    let ang = 0, vel = 0, spinning = false, done = false, result = null, endT = 0, drag = null, tick = 0;
    const startSpin = (v) => { vel = v; spinning = true; api.sfx.spin(); api.setTip("🎡 Round and round it goes…"); };
    return std({
      scene, camera,
      onDown(p) { if (done || spinning) return; if (hitTest(p.ray, [btn])) { startSpin(rnd(9, 15)); return; } drag = { x: p.sx, t: performance.now(), v: 0 }; },
      onMove(p) { if (!drag) return; const now = performance.now(), dt = Math.max(0.008, (now - drag.t) / 1000); const dx = p.sx - drag.x; ang -= dx * 0.01; drag.v = drag.v * 0.5 + (-dx * 0.01 / dt) * 0.5; drag.x = p.sx; drag.t = now; },
      onUp() { if (!drag) return; if (Math.abs(drag.v) > 2) startSpin(clamp(drag.v, -18, 18)); drag = null; },
      onKey(k) { if (k === " " && !spinning && !done) startSpin(rnd(9, 15)); },
      update(dt) {
        parts.update(dt);
        if (spinning) {
          ang += vel * dt; vel *= Math.pow(0.35, dt);
          const idx = Math.floor(((ang % seg) + seg) % seg / seg * 2); if (idx !== tick) { tick = idx; api.sfx.tick(); flap.rotation.z = 0.35 * Math.sign(vel); }
          if (Math.abs(vel) < 0.2) { spinning = false; vel = 0; done = true;
            // segment i covers angles [i*seg,(i+1)*seg) in wheel space where angle is measured from +y clockwise (we placed labels at (sin a, cos a)).
            const under = ((-ang) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2); result = WHEEL_SEGS[Math.floor(under / seg)];
            parts.burst(new THREE.Vector3(0, 3.5, 0.3), result.c, 60, 3, 1.2);
            api.setTip(result.jackpot ? "🎉 JACKPOT!!! 🎉" : `You won ${result.v} tickets!`); (result.v >= 50 ? api.sfx.win : api.sfx.ding)(); endT = 1.5;
          }
        }
        flap.rotation.z = approach(flap.rotation.z, 0, 12, dt);
        W.rotation.z = -ang; star.material.rotation = ang;
        btn.material.emissiveIntensity = spinning || done ? 0.2 : 0.9 + Math.sin(performance.now() / 200) * 0.4;
        if (done && endT > 0) { endT -= dt; if (endT <= 0) api.finish(result.v, result.jackpot ? "🎉 JACKPOT! 🎉" : "The wheel says…", `${result.v} tickets!`); }
      },
    }, scene);
  },
};

// ==========================================================================
//  🦾 CLAW MACHINE — a real claw crane: glass cabinet, joystick, rails, and a
//  pile of plush prizes with different shapes. What you grab goes on your shelf!
// ==========================================================================
export const claw = {
  id: "claw", name: "Claw Machine", emoji: "🦾", cost: 3, color: 0x00e5ff, cabinet: "claw", payout: "plushies + up to 120 🎟️",
  tip: "👆 Drag anywhere to steer the claw over a prize, let go to drop it! 3 tries. Grabbed prizes go on your shelf!",
  create(api) {
    const scene = baseScene(0x0b1a2a); lightScene(scene, { ambient: 0.75, pos: [1, 5, 3] });
    const camera = fpCamera(api.W, api.H, [0, 2.3, 3.4], [0, 1.15, 0], 52);
    const parts = makeParticles(scene);
    const BW = 2.4, BD = 2.0, floorY = 0.9; // glass box interior
    // cabinet body: dark base with lit panel, coin slot, joystick & button
    scene.add(box(BW + 0.4, floorY, BD + 0.4, mat.gloss(0x1b1340), 0, floorY / 2, 0));
    const panel = textPlane(["🦾 CLAW MACHINE"], BW, 0.36, { bg: "#00e5ff", color: "#1a1040", size: 80 }); panel.position.set(0, floorY - 0.35, BD / 2 + 0.21); scene.add(panel);
    scene.add(box(BW + 0.4, 0.08, 0.5, mat.gloss(0x2a1a5e), 0, floorY + 0.02, BD / 2 + 0.35)); // control ledge
    const stick = cyl(0.03, 0.03, 0.28, mat.metal(), 10, -0.5, floorY + 0.16, BD / 2 + 0.38); scene.add(stick); const knob = sphere(0.07, mat.gloss(0xf4433f), -0.5, floorY + 0.32, BD / 2 + 0.38); scene.add(knob);
    const btn = cyl(0.09, 0.09, 0.05, mat.neon(0x00c853, 0.8), 20, 0.4, floorY + 0.08, BD / 2 + 0.38); scene.add(btn);
    scene.add(box(0.05, 0.14, 0.02, mat.std(0x111), 0.9, floorY - 0.2, BD / 2 + 0.22)); // coin slot
    // prize floor (pink with confetti)
    scene.add(box(BW, 0.04, BD, mat.std(0xe91e63), 0, floorY, 0));
    for (let i = 0; i < 40; i++) scene.add(sphere(0.04, mat.gloss(pick([0xff9ec7, 0xffd54a, 0x00e5ff, 0xffffff])), rnd(-BW / 2, BW / 2), floorY + 0.03, rnd(-BD / 2, BD / 2), 6));
    // glass walls + chrome posts + lit top
    for (const [x, z, w, d] of [[0, -BD / 2, BW, 0.02], [-BW / 2, 0, 0.02, BD], [BW / 2, 0, 0.02, BD], [0, BD / 2, BW, 0.02]]) scene.add(box(w, 2.0, d, mat.glass(0xaee8ff, 0.12), x, floorY + 1.0, z));
    for (const [x, z] of [[-BW / 2, -BD / 2], [BW / 2, -BD / 2], [-BW / 2, BD / 2], [BW / 2, BD / 2]]) { scene.add(box(0.1, 2.0, 0.1, mat.metal(0xdfe6ee), x, floorY + 1.0, z)); scene.add(box(0.04, 2.0, 0.04, mat.neon(0x00e5ff, 1.2), x, floorY + 1.0, z)); }
    scene.add(box(BW + 0.4, 0.3, BD + 0.4, mat.gloss(0x1b1340), 0, floorY + 2.15, 0)); const marquee = textPlane(["WIN A PLUSHIE!"], BW, 0.3, { bg: "#ff3dd6", color: "#fff", size: 80 }); marquee.position.set(0, floorY + 2.15, BD / 2 + 0.21); scene.add(marquee);
    for (let i = 0; i < 8; i++) scene.add(sphere(0.04, mat.neon(i % 2 ? 0xffd54a : 0xffffff, 1.5), -BW / 2 + 0.2 + i * (BW - 0.4) / 7, floorY + 1.98, BD / 2 - 0.02, 6));
    const lamp = new THREE.PointLight(0xffffff, 6, 6); lamp.position.set(0, floorY + 1.9, 0); scene.add(lamp);
    // chute (front-left corner) with a flap
    const chute = { x: -BW / 2 + 0.38, z: BD / 2 - 0.32 }; scene.add(box(0.62, 0.05, 0.55, mat.std(0x111), chute.x, floorY + 0.03, chute.z)); scene.add(box(0.62, 0.3, 0.02, mat.gloss(0x2a1a5e), chute.x, floorY + 0.15, chute.z - 0.28)); scene.add(box(0.02, 0.3, 0.55, mat.gloss(0x2a1a5e), chute.x + 0.31, floorY + 0.15, chute.z));
    const chuteLbl = textPlane(["PRIZE ↓"], 0.6, 0.18, { bg: "#ffd54a", color: "#4a2b00", size: 70 }); chuteLbl.position.set(chute.x, floorY + 0.32, chute.z - 0.27); scene.add(chuteLbl);
    // prizes: plush shapes, piled up
    const prizes = []; const kinds = [...PLUSH_KINDS].sort(() => Math.random() - 0.5).slice(0, 8).concat(pick(PLUSH_KINDS), pick(PLUSH_KINDS));
    for (const kind of kinds) { const g = makePlush(kind, 0.9); let x, z, tries = 0;
      do { x = rnd(-BW / 2 + 0.3, BW / 2 - 0.3); z = rnd(-BD / 2 + 0.3, BD / 2 - 0.3); tries++; } while ((Math.hypot(x - chute.x, z - chute.z) < 0.65 || prizes.some((q) => Math.hypot(q.g.position.x - x, q.g.position.z - z) < 0.42)) && tries < 60);
      g.position.set(x, floorY + 0.02, z); g.rotation.y = rnd(0, Math.PI * 2); scene.add(g); prizes.push({ kind, ...PLUSH_INFO[kind], g }); }
    // claw rig: gantry rail + carriage + cable + 3-finger claw
    const rail = box(BW, 0.06, 0.06, mat.metal(), 0, floorY + 1.9, 0); scene.add(rail);
    for (const x of [-BW / 2 + 0.05, BW / 2 - 0.05]) scene.add(box(0.06, 0.06, BD, mat.metal(0x8899aa), x, floorY + 1.93, 0));
    const carriage = box(0.22, 0.12, 0.22, mat.metal(0x8899aa), 0, floorY + 1.85, 0); scene.add(carriage);
    const cable = cyl(0.012, 0.012, 1, mat.std(0xdddddd), 6); scene.add(cable);
    const clawG = new THREE.Group(); scene.add(clawG); clawG.add(sphere(0.09, mat.metal(0xdfe6ee)));
    const fingers = [0, 2.1, 4.2].map((a) => { const f = new THREE.Group(); f.rotation.y = a; const seg = box(0.035, 0.34, 0.035, mat.metal(0xc0c8d0), 0.1, -0.17, 0); seg.rotation.z = -0.35; f.add(seg); const tip = box(0.035, 0.18, 0.035, mat.metal(0xc0c8d0), 0.19, -0.4, 0); tip.rotation.z = 0.55; f.add(tip); clawG.add(f); return f; });
    const cl = { x: 0, z: 0, y: floorY + 1.75, tx: 0, tz: 0, open: 1 };
    let phase = "aim", tries = 3, won = 0, grabbed = null, t = 0, drag = null; const gotPrizes = [];
    const score = () => api.setScore(`🎟️ ${won}   •   ${"🕹️".repeat(tries)}   ${gotPrizes.map((k) => PLUSH_INFO[k].emoji).join("")}`); score();
    const finish = () => api.finish(won, gotPrizes.length ? "Nice grabbing!" : "The claw was slippery…", gotPrizes.length ? `You won: ${gotPrizes.map((k) => PLUSH_INFO[k].emoji + " " + PLUSH_INFO[k].name).join(", ")} — they're on your prize shelf! (+${won} tickets)` : `${won} tickets`);
    return std({
      scene, camera,
      onDown(p) { if (phase !== "aim") return; drag = { x: p.sx, y: p.sy }; api.sfx.motor(); },
      onMove(p) { if (!drag || phase !== "aim") return; cl.tx = clamp(cl.tx + (p.sx - drag.x) * 0.006, -BW / 2 + 0.25, BW / 2 - 0.25); cl.tz = clamp(cl.tz + (p.sy - drag.y) * 0.006, -BD / 2 + 0.25, BD / 2 - 0.25); drag = { x: p.sx, y: p.sy }; },
      onUp() { if (drag && phase === "aim") { drag = null; phase = "drop"; api.sfx.tap(); btn.material.emissiveIntensity = 2; } },
      onKey(k) { if (k === "ArrowLeft") cl.tx -= 0.15; if (k === "ArrowRight") cl.tx += 0.15; if (k === "ArrowUp") cl.tz -= 0.15; if (k === "ArrowDown") cl.tz += 0.15; cl.tx = clamp(cl.tx, -BW / 2 + 0.25, BW / 2 - 0.25); cl.tz = clamp(cl.tz, -BD / 2 + 0.25, BD / 2 - 0.25); if ((k === " " || k === "Enter") && phase === "aim") phase = "drop"; },
      update(dt) {
        t += dt; parts.update(dt); btn.material.emissiveIntensity = approach(btn.material.emissiveIntensity, 0.8, 4, dt);
        if (phase === "aim" || phase === "carry" || phase === "return") { cl.x = approach(cl.x, cl.tx, 6, dt); cl.z = approach(cl.z, cl.tz, 6, dt); }
        if (phase === "drop") { cl.y -= 1.4 * dt; cl.open = 1; if (cl.y <= floorY + 0.5) { phase = "grab"; t = 0; } }
        else if (phase === "grab") { cl.open = Math.max(0, cl.open - dt * 3); if (cl.open === 0 && t > 0.5) {
          let best = null, bd = 0.32; for (const p of prizes) { const d = Math.hypot(p.g.position.x - cl.x, p.g.position.z - cl.z); if (d < bd) { bd = d; best = p; } }
          if (best && Math.random() < best.grip * (1 - bd / 0.5) + 0.15) { grabbed = best; api.sfx.ding(); api.setTip(`Got the ${best.name}! Hold on tight…`); } else { api.setTip("Missed! Try again…"); api.sfx.miss(); }
          phase = "lift"; t = 0; } }
        else if (phase === "lift") { cl.y += 1.2 * dt; if (grabbed && Math.random() < 0.001) { grabbed = null; api.setTip("Oh no, it slipped! 😱"); api.sfx.miss(); } if (cl.y >= floorY + 1.75) { cl.y = floorY + 1.75; phase = "carry"; cl.tx = chute.x; cl.tz = chute.z; } }
        else if (phase === "carry") { if (Math.hypot(cl.x - cl.tx, cl.z - cl.tz) < 0.03) { phase = "release"; t = 0; } }
        else if (phase === "release") { cl.open = Math.min(1, cl.open + dt * 3);
          if (grabbed) { grabbed.g.position.y -= 2.5 * dt; if (grabbed.g.position.y < floorY - 0.6) { won += grabbed.v; gotPrizes.push(grabbed.kind); api.awardPrize && api.awardPrize("plush_" + grabbed.kind); api.sfx.win(); parts.burst(new THREE.Vector3(chute.x, floorY + 0.3, chute.z), 0xffd54a, 40, 2.5); api.setTip(`${grabbed.emoji} ${grabbed.name} is yours! +${grabbed.v} tickets 🎟️`); scene.remove(grabbed.g); prizes.splice(prizes.indexOf(grabbed), 1); grabbed = null; score(); } }
          else if (cl.open >= 1) { tries--; score(); if (tries <= 0 || prizes.length === 0) finish(); else { phase = "return"; cl.tx = 0; cl.tz = 0; } } }
        else if (phase === "return") { if (Math.hypot(cl.x - cl.tx, cl.z - cl.tz) < 0.05) { phase = "aim"; api.setTip("👆 Drag to steer the claw, let go to drop it!"); } }
        if (grabbed && phase !== "release") { grabbed.g.position.set(cl.x, cl.y - 0.55, cl.z); grabbed.g.rotation.z = Math.sin(t * 6) * 0.15; }
        carriage.position.set(cl.x, floorY + 1.85, cl.z); rail.position.z = cl.z; clawG.position.set(cl.x, cl.y, cl.z);
        const len = floorY + 1.85 - cl.y; cable.scale.y = Math.max(0.01, len); cable.position.set(cl.x, cl.y + len / 2, cl.z);
        fingers.forEach((f) => (f.rotation.z = -0.15 - cl.open * 0.55));
        stick.rotation.z = (cl.tx / BW) * 0.6; stick.rotation.x = -(cl.tz / BD) * 0.6; knob.position.set(-0.5 + (cl.tx / BW) * 0.16, floorY + 0.32, BD / 2 + 0.38 + (cl.tz / BD) * 0.16);
      },
    }, scene);
  },
};

// ==========================================================================
//  🥽 VR BLASTER — you're floating in space; drag to look, tap to blast.
// ==========================================================================
export const vr = {
  id: "vr", name: "VR Blaster", emoji: "🥽", cost: 4, color: 0x00e676, cabinet: "pod", payout: "up to 90 🎟️",
  tip: "🥽 Drag to look around, TAP the space bugs to blast them before they reach you! 40 seconds.",
  create(api) {
    const scene = baseScene(0x020112); scene.add(new THREE.AmbientLight(0xffffff, 0.6)); const sun = new THREE.DirectionalLight(0xffffff, 1.2); sun.position.set(5, 3, 8); scene.add(sun);
    const camera = fpCamera(api.W, api.H, [0, 0, 0], [0, 0, -1], 70);
    const parts = makeParticles(scene, 400);
    // starfield
    const sg = new THREE.BufferGeometry(); const sp = new Float32Array(1500 * 3); for (let i = 0; i < 1500; i++) { const v = new THREE.Vector3().randomDirection().multiplyScalar(rnd(60, 90)); sp.set([v.x, v.y, v.z], i * 3); } sg.setAttribute("position", new THREE.BufferAttribute(sp, 3)); scene.add(new THREE.Points(sg, new THREE.PointsMaterial({ color: 0xffffff, size: 0.5, sizeAttenuation: true })));
    const planet = sphere(14, mat.std(0x3b1f7a, { emissive: 0x2a0f5a, emissiveIntensity: 0.4 }), 20, -22, -50, 32); scene.add(planet); const ring = torus(20, 1.2, mat.std(0xff3dd6, { emissive: 0xff3dd6, emissiveIntensity: 0.5 }), 20, -22, -50); ring.rotation.x = 1.2; scene.add(ring);
    // cockpit frame
    const frame = new THREE.Group(); camera.add(frame); scene.add(camera);
    const guns = [-0.4, 0.4].map((x) => { const g = new THREE.Group(); g.position.set(x, -0.42, -1.7); g.add(cyl(0.025, 0.04, 0.5, mat.metal(0x9aa4b0), 12).rotateX(Math.PI / 2)); g.add(cyl(0.018, 0.018, 0.16, mat.neon(0x00e676, 1.5), 8, 0, 0, -0.3).rotateX(Math.PI / 2)); frame.add(g); return g; });
    const reticle = torus(0.06, 0.006, mat.neon(0x00e676, 2), 0, 0, -2); frame.add(reticle);
    const BUG_BUILD = [
      () => { const g = new THREE.Group(); g.add(sphere(0.6, mat.gloss(0x7a3cff))); g.add(cyl(1.1, 1.1, 0.15, mat.metal(0xc0c8d0), 24)); const f = emojiSprite("👾", 0.9); f.position.z = 0.5; g.add(f); return g; },
      () => { const g = new THREE.Group(); g.add(sphere(0.55, mat.gloss(0xf4433f))); const f = emojiSprite("👽", 0.9); f.position.z = 0.45; g.add(f); return g; },
      () => { const g = new THREE.Group(); const a = new THREE.Mesh(new THREE.IcosahedronGeometry(0.75, 0), mat.std(0x8a7a6a, { roughness: 1 })); g.add(a); return g; },
      () => { const g = new THREE.Group(); g.add(sphere(0.5, mat.gloss(0xffd54a))); const r = torus(0.85, 0.08, mat.gloss(0xff9800)); r.rotation.x = 1.3; g.add(r); return g; },
    ];
    const bugs = [], beams = []; let yaw = 0, pitch = 0, time = 40, score = 0, hp = 3, over = false, spawnT = 0, drag = null, dragDist = 0;
    const euler = new THREE.Euler(0, 0, 0, "YXZ");
    const spawn = () => { const b = pick(BUG_BUILD)(); const a = yaw + rnd(-1.3, 1.3), p = pitch + rnd(-0.6, 0.6); const dist = rnd(40, 55); b.position.set(-Math.sin(a) * Math.cos(p) * dist, Math.sin(p) * dist, -Math.cos(a) * Math.cos(p) * dist); b.userData.sp = rnd(6, 10) + (40 - time) * 0.12; b.userData.spin = rnd(-2, 2); scene.add(b); bugs.push(b); };
    const fire = (p) => {
      api.sfx.laser(); const hit = p.ray.intersectObjects(bugs, true)[0];
      const target = hit ? hit.point : p.ray.ray.at(40, new THREE.Vector3());
      for (const g of guns) { const from = g.getWorldPosition(new THREE.Vector3()); const geo = new THREE.BufferGeometry().setFromPoints([from, target]); const ln = new THREE.Line(geo, new THREE.LineBasicMaterial({ color: 0x00e676, transparent: true, opacity: 1 })); scene.add(ln); beams.push({ ln, t: 0.15 }); }
      if (hit) { let o = hit.object; while (o.parent && !bugs.includes(o)) o = o.parent; const d = o.position.length(); const pts = Math.max(1, Math.round(d / 8)); score += pts; parts.burst(o.position, 0x00e676, 30, 4, 1); scene.remove(o); bugs.splice(bugs.indexOf(o), 1); api.sfx.ding(); api.setTip(`💥 +${pts} (far shots score more!)`); }
      api.setScore(`⭐ ${score}   ❤️ ${hp}`);
    };
    return std({
      scene, camera,
      onDown(p) { drag = { x: p.sx, y: p.sy }; dragDist = 0; },
      onMove(p) { if (!drag) return; yaw -= (p.sx - drag.x) * 0.0035; pitch = clamp(pitch - (p.sy - drag.y) * 0.0035, -1.0, 1.0); dragDist += Math.hypot(p.sx - drag.x, p.sy - drag.y); drag = { x: p.sx, y: p.sy }; },
      onUp(p) { if (!drag) return; drag = null; if (dragDist < 12 && !over) fire(p); },
      onKey(k) { if (k === "ArrowLeft") yaw += 0.2; if (k === "ArrowRight") yaw -= 0.2; if (k === "ArrowUp") pitch = Math.min(1, pitch + 0.15); if (k === "ArrowDown") pitch = Math.max(-1, pitch - 0.15); if (k === " ") { const r = new THREE.Raycaster(camera.position, camera.getWorldDirection(new THREE.Vector3())); fire({ ray: r }); } },
      update(dt) {
        if (over) return; time -= dt; parts.update(dt);
        if (api.pad) { yaw -= api.pad.rx * 2.2 * dt; pitch = clamp(pitch - api.pad.ry * 1.8 * dt, -1, 1); }
        euler.set(pitch, yaw, 0); camera.quaternion.setFromEuler(euler);
        spawnT -= dt; if (spawnT <= 0) { spawnT = rnd(0.5, 1.0); spawn(); }
        for (let i = bugs.length - 1; i >= 0; i--) { const b = bugs[i]; const d = b.position.length(); const step = b.userData.sp * dt; b.position.multiplyScalar(Math.max(0.01, (d - step) / d)); b.rotation.y += b.userData.spin * dt; b.lookAt(0, 0, 0); b.rotateY(b.userData.spin * performance.now() / 1000);
          if (d < 2.5) { scene.remove(b); bugs.splice(i, 1); hp--; api.sfx.crash(); api.setTip("Ouch! One got through! 😵"); api.setScore(`⭐ ${score}   ❤️ ${hp}`); parts.burst(new THREE.Vector3(0, 0, -2), 0xff4444, 40, 3); if (hp <= 0) { over = true; api.finish(clamp(score, 0, 90), "Overrun by space bugs!", `${score} points → ${clamp(score, 0, 90)} tickets`); } } }
        for (let i = beams.length - 1; i >= 0; i--) { const b = beams[i]; b.t -= dt; b.ln.material.opacity = Math.max(0, b.t * 6); if (b.t <= 0) { scene.remove(b.ln); b.ln.geometry.dispose(); beams.splice(i, 1); } }
        planet.rotation.y += dt * 0.05; guns.forEach((g, i) => (g.position.y = -0.42 + Math.sin(performance.now() / 600 + i) * 0.01));
        if (time <= 0) { over = true; const tix = clamp(score, 0, 90); api.finish(tix, score >= 40 ? "🥽 Space hero!" : "Mission complete!", `${score} points → ${tix} tickets`); }
        api.setScore(`⭐ ${score}   ❤️ ${hp}   ${fmtT(time)}`);
      },
    }, scene);
  },
};

// ==========================================================================
//  🏎️ TURBO RACER — behind the handlebars on a 3-lane highway.
// ==========================================================================
export const race = {
  id: "race", name: "Turbo Racer", emoji: "🏎️", cost: 3, color: 0xf4433f, cabinet: "racer", payout: "up to 80 🎟️",
  tip: "👈👉 Drag left/right (or arrow keys) to steer. Dodge cars, grab coins! 30 seconds.",
  create(api) {
    const scene = baseScene(0x87ceeb); scene.fog = new THREE.Fog(0x87ceeb, 60, 160); lightScene(scene, { ambient: 0.9, sun: 1.4, pos: [10, 20, -10] });
    const camera = fpCamera(api.W, api.H, [0, 1.6, 0], [0, 1.0, -20], 65);
    const parts = makeParticles(scene);
    const LANES = [-3.2, 0, 3.2], ROADW = 10.5;
    scene.add(new THREE.Mesh(new THREE.PlaneGeometry(400, 400), mat.std(0x4caf50, { roughness: 1 })).rotateX(-Math.PI / 2));
    const road = new THREE.Mesh(new THREE.PlaneGeometry(ROADW, 400), mat.std(0x37474f, { roughness: 0.95 })); road.rotation.x = -Math.PI / 2; road.position.set(0, 0.01, -150); scene.add(road);
    for (const s of [-1, 1]) { const edge = new THREE.Mesh(new THREE.PlaneGeometry(0.3, 400), mat.std(0xffeb3b)); edge.rotation.x = -Math.PI / 2; edge.position.set(s * (ROADW / 2 - 0.2), 0.02, -150); scene.add(edge); }
    const dashes = []; for (let i = 0; i < 40; i++) for (const x of [-1.6, 1.6]) { const d = new THREE.Mesh(new THREE.PlaneGeometry(0.25, 3), mat.std(0xffffff)); d.rotation.x = -Math.PI / 2; d.position.set(x, 0.02, -i * 8); scene.add(d); dashes.push(d); }
    const scenery = []; for (let i = 0; i < 40; i++) { for (const s of [-1, 1]) { const g = new THREE.Group(); g.add(cyl(0.2, 0.3, 1.5, mat.std(0x6d4c41), 8, 0, 0.75, 0)); g.add(new THREE.Mesh(new THREE.ConeGeometry(rnd(1.2, 2), rnd(3, 5), 8), mat.std(pick([0x2e7d32, 0x388e3c, 0x1b5e20]))).translateY(3.5)); g.position.set(s * rnd(8, 16), 0, -i * 9); scene.add(g); scenery.push(g); } }
    const sunS = emojiSprite("☀️", 12); sunS.position.set(-40, 40, -140); scene.add(sunS); for (let i = 0; i < 6; i++) { const c = emojiSprite("☁️", rnd(8, 14)); c.position.set(rnd(-80, 80), rnd(20, 40), -140); scene.add(c); }
    // player bike (handlebars + front) fixed to camera
    const bike = new THREE.Group(); bike.position.set(0, 0.55, -1.9); scene.add(bike);
    bike.add(box(0.34, 0.22, 0.9, mat.gloss(0xff3dd6), 0, 0.3, 0.1)); bike.add(box(0.3, 0.12, 0.3, mat.gloss(0x222), 0, 0.44, 0.35)); const bars = cyl(0.025, 0.025, 0.8, mat.metal(), 8, 0, 0.55, 0.45); bars.rotation.z = Math.PI / 2; bike.add(bars); for (const s of [-1, 1]) bike.add(cyl(0.035, 0.035, 0.16, mat.std(0x111), 8, s * 0.4, 0.55, 0.45).rotateZ(Math.PI / 2));
    const fw = torus(0.3, 0.09, mat.std(0x111), 0, 0.0, -0.55); fw.rotation.y = Math.PI / 2; bike.add(fw); bike.add(torus(0.31, 0.02, mat.neon(0x00e5ff, 1.5), 0, 0.0, -0.55).rotateY(Math.PI / 2)); bike.add(cyl(0.03, 0.03, 0.7, mat.metal(), 8, 0, 0.2, -0.35).rotateX(0.5));
    const mkCar = (color) => { const g = new THREE.Group(); g.add(box(1.8, 0.7, 3.6, mat.gloss(color), 0, 0.6, 0)); g.add(box(1.5, 0.6, 1.8, mat.gloss(0x223344), 0, 1.2, -0.2)); for (const [x, z] of [[-0.9, 1.2], [0.9, 1.2], [-0.9, -1.2], [0.9, -1.2]]) { const w = cyl(0.35, 0.35, 0.3, mat.std(0x111), 12, x, 0.35, z); w.rotation.z = Math.PI / 2; g.add(w); } g.add(box(0.3, 0.2, 0.05, mat.neon(0xff2222, 1.5), -0.6, 0.7, 1.82)); g.add(box(0.3, 0.2, 0.05, mat.neon(0xff2222, 1.5), 0.6, 0.7, 1.82)); g.add(blobShadow(1.8, 0.4)); return g; };
    const cars = [], coins = []; let px = 0, targetX = 0, speed = 28, dist = 0, coinN = 0, time = 30, lives = 3, hurt = 0, spawnT = 0, over = false, tilt = 0;
    const spawn = () => { const lane = ri(0, 2); if (Math.random() < 0.65) { if (!cars.some((c) => c.lane === lane && c.g.position.z < -70)) { const g = mkCar(pick([0x3d8bfd, 0xffd54a, 0xf4433f, 0x9c27b0, 0x00c853])); g.position.set(LANES[lane], 0, -110); scene.add(g); cars.push({ g, lane, sp: rnd(9, 16) }); } } else { const c = cyl(0.4, 0.4, 0.08, mat.metal(0xffd54a, { emissive: 0xffd54a, emissiveIntensity: 0.4 }), 20, LANES[lane], 1.0, -110); c.rotation.x = Math.PI / 2; scene.add(c); coins.push(c); } };
    const end = () => { const tix = clamp(Math.floor(dist / 25) + coinN * 2, 1, 80); api.finish(tix, lives > 0 ? "🏁 Finish line!" : "💥 Crashed out!", `${Math.floor(dist)}m and ${coinN} coins → ${tix} tickets`); };
    return std({
      scene, camera,
      onDown(p) { targetX = clamp(p.x * 7, -4.5, 4.5); }, onMove(p) { targetX = clamp(p.x * 7, -4.5, 4.5); },
      update(dt) {
        if (over) return; parts.update(dt); time -= dt;
        if (api.keys.has("ArrowLeft") || api.keys.has("a")) targetX = clamp(px - 14 * dt * 6, -4.5, 4.5); if (api.keys.has("ArrowRight") || api.keys.has("d")) targetX = clamp(px + 14 * dt * 6, -4.5, 4.5);
        if (api.pad && Math.abs(api.pad.lx) > 0.15) targetX = clamp(px + api.pad.lx * 14 * dt * 6, -4.5, 4.5);
        const opx = px; px = approach(px, targetX, 16, dt); tilt = approach(tilt, (px - opx) / dt * -0.06, 8, dt);
        speed = Math.min(52, speed + 0.6 * dt); if (hurt > 0) hurt -= dt; const s = hurt > 0 ? speed * 0.45 : speed; dist += s * dt;
        camera.position.set(px, 1.6, 0); camera.rotation.set(-0.08, 0, tilt * 0.4); bike.position.x = px; bike.rotation.z = tilt; bike.rotation.y = -tilt * 0.5; fw.rotation.x += s * dt * 3;
        for (const d of dashes) { d.position.z += s * dt; if (d.position.z > 10) d.position.z -= 320; }
        for (const g of scenery) { g.position.z += s * dt; if (g.position.z > 10) g.position.z -= 360; }
        spawnT -= dt; if (spawnT <= 0) { spawn(); spawnT = rnd(0.5, 0.9) * (30 / s); }
        for (let i = cars.length - 1; i >= 0; i--) { const c = cars[i]; c.g.position.z += (s - c.sp) * dt; if (c.g.position.z > 8) { scene.remove(c.g); cars.splice(i, 1); }
          else if (hurt <= 0 && Math.abs(c.g.position.x - px) < 1.3 && Math.abs(c.g.position.z - (-1.3)) < 2.4) { hurt = 1.4; lives--; api.sfx.crash(); parts.burst(new THREE.Vector3(px, 1, -2), 0xff9800, 40, 5); if (lives <= 0) { over = true; end(); } } }
        for (let i = coins.length - 1; i >= 0; i--) { const c = coins[i]; c.position.z += s * dt; c.rotation.z += dt * 4; if (c.position.z > 8) { scene.remove(c); coins.splice(i, 1); } else if (Math.abs(c.position.x - px) < 1.1 && Math.abs(c.position.z - (-1.3)) < 1.6) { scene.remove(c); coins.splice(i, 1); coinN++; api.sfx.coin(); parts.burst(c.position, 0xffd54a, 16, 3, 0.5); } }
        bike.visible = hurt <= 0 || Math.floor(hurt * 10) % 2 === 0;
        api.setScore(`🪙 ${coinN}   📏 ${Math.floor(dist)}m   ${"❤️".repeat(Math.max(0, lives))}   ${fmtT(time)}`);
        if (time <= 0) { over = true; end(); }
      },
    }, scene);
  },
};

// ==========================================================================
//  🔫 LASER TAG — a neon arena; robots pop up behind barriers. Don't tag friends!
// ==========================================================================
export const laser = {
  id: "laser", name: "Laser Tag", emoji: "🔫", cost: 3, color: 0x7a3cff, cabinet: "arena", payout: "up to 75 🎟️",
  tip: "👆 Tap the robots 🤖 to zap them! Don't zap the kids 🧒. 30 seconds.",
  create(api) {
    const scene = baseScene(0x07031a); scene.fog = new THREE.Fog(0x07031a, 20, 45); scene.add(new THREE.AmbientLight(0x8877ff, 0.5)); const pl = new THREE.PointLight(0xff3dd6, 30, 40); pl.position.set(0, 6, -6); scene.add(pl); const pl2 = new THREE.PointLight(0x00e5ff, 30, 40); pl2.position.set(0, 5, 4); scene.add(pl2);
    const camera = fpCamera(api.W, api.H, [0, 1.6, 4], [0, 1.2, -6], 62);
    const parts = makeParticles(scene, 400);
    // neon grid floor
    const grid = new THREE.GridHelper(60, 60, 0x00e5ff, 0x1a2a6a); grid.position.y = 0.01; scene.add(grid); scene.add(new THREE.Mesh(new THREE.PlaneGeometry(60, 60), mat.std(0x0a0a2a)).rotateX(-Math.PI / 2));
    for (let i = 0; i < 8; i++) { const c = 0x000000 + (i % 2 ? 0xff3dd6 : 0x00e5ff); const beam = box(0.08, 0.08, 40, mat.neon(c, 1.5), -12 + i * 3.4, 6, -10); scene.add(beam); }
    // barriers
    const spots = [[-6, -4], [-2, -6], [2, -6], [6, -4], [-4, -10], [0, -12], [4, -10], [-7, -14], [7, -14], [0, -18], [-3, -2], [3, -2]];
    const bots = []; const hitObjs = [];
    for (const [x, z] of spots) { const b = box(2.2, 1.1, 0.5, mat.gloss(0x2a1a6e), x, 0.55, z); scene.add(b); scene.add(box(2.3, 0.06, 0.55, mat.neon(0xff3dd6, 1.5), x, 1.12, z)); }
    const mkBot = () => { const g = new THREE.Group(); g.add(box(0.7, 0.7, 0.5, mat.metal(0xb0bec5), 0, 0.35, 0)); g.add(box(0.5, 0.45, 0.45, mat.metal(0xeceff1), 0, 0.95, 0)); g.add(box(0.36, 0.14, 0.05, mat.neon(0xff2222, 2), 0, 0.98, 0.24)); g.add(cyl(0.02, 0.02, 0.3, mat.metal(), 6, 0, 1.3, 0)); g.add(sphere(0.06, mat.neon(0xff2222, 2), 0, 1.47, 0)); return g; };
    const mkFriend = () => { const k = makeKid({ shirt: pick([0x00c853, 0xffd54a, 0x3d8bfd]), skin: pick([0xffd6b8, 0xe0ac8a, 0x8d5a3c, 0xf1c9a5]), hair: pick([0x6b3e1e, 0x222222, 0xe8c36a, 0xa33a1e]), hairStyle: pick(["short", "long", "ponytail", "curly"]), mood: pick(["happy", "excited"]) }); k.group.scale.setScalar(0.85); return k.group; };
    let time = 30, hits = 0, oops = 0, spawnT = 0, over = false, combo = 0; const beams = [];
    const gun = new THREE.Group(); gun.position.set(0.38, -0.36, -1); gun.scale.setScalar(0.32); camera.add(gun); scene.add(camera); gun.add(box(0.14, 0.2, 0.7, mat.gloss(0x7a3cff))); gun.add(cyl(0.04, 0.04, 0.3, mat.neon(0x00e5ff, 1.5), 8, 0, 0.05, -0.5).rotateX(Math.PI / 2)); gun.add(box(0.1, 0.25, 0.12, mat.gloss(0x222), 0, -0.2, 0.2));
    return std({
      scene, camera,
      onDown(p) {
        if (over) return; api.sfx.laser(); gun.position.z = -0.85;
        const hit = p.ray.intersectObjects(bots.filter((b) => b.alive).map((b) => b.g), true)[0];
        const target = hit ? hit.point : p.ray.ray.at(30, new THREE.Vector3());
        const from = gun.localToWorld(new THREE.Vector3(0, 0.05, -0.65)); const ln = new THREE.Line(new THREE.BufferGeometry().setFromPoints([from, target]), new THREE.LineBasicMaterial({ color: 0x00e5ff, transparent: true })); scene.add(ln); beams.push({ ln, t: 0.14 });
        if (hit) { let o = hit.object; let b = null; while (o) { b = bots.find((q) => q.g === o); if (b) break; o = o.parent; } if (b) { b.alive = false; b.t = 0.35;
          if (b.friend) { oops++; combo = 0; api.sfx.miss(); api.setTip("Oops! That was a friend! 😅 −3"); parts.burst(b.g.position.clone().setY(1.2), 0xf44336, 15, 2); }
          else { combo++; hits++; api.sfx.ding(); parts.burst(b.g.position.clone().setY(1.0), 0x00e5ff, 30, 4); api.setTip(combo >= 3 ? `🔥 ${combo}x combo!` : "Zap! 🤖"); } } }
        else combo = 0;
      },
      onKey(k) { if (k === " ") this.onDown({ ray: new THREE.Raycaster(camera.position, camera.getWorldDirection(new THREE.Vector3())) }); },
      update(dt) {
        if (over) return; time -= dt; parts.update(dt); gun.position.z = approach(gun.position.z, -1, 14, dt);
        spawnT -= dt; if (spawnT <= 0) { spawnT = rnd(0.35, 0.8) - Math.min(0.25, (30 - time) * 0.008); const s = pick(spots); if (!bots.some((b) => b.sx === s[0] && b.sz === s[1])) { const friend = Math.random() < 0.22; const g = friend ? mkFriend() : mkBot(); g.position.set(s[0], -1.6, s[1] - 0.3); scene.add(g); bots.push({ g, sx: s[0], sz: s[1], alive: true, life: rnd(0.9, 1.6), friend, up: 0, t: 0 }); } }
        for (let i = bots.length - 1; i >= 0; i--) { const b = bots[i];
          if (b.alive) { b.up = Math.min(1, b.up + dt * 5); b.life -= dt; if (b.life <= 0) { b.alive = false; b.t = 0.3; } } else { b.t -= dt; b.up = Math.max(0, b.up - dt * 4); if (b.t <= 0) { scene.remove(b.g); bots.splice(i, 1); continue; } }
          b.g.position.y = -1.6 + b.up * 1.6; b.g.lookAt(camera.position.x, b.g.position.y, camera.position.z); }
        for (let i = beams.length - 1; i >= 0; i--) { const b = beams[i]; b.t -= dt; b.ln.material.opacity = Math.max(0, b.t * 7); if (b.t <= 0) { scene.remove(b.ln); b.ln.geometry.dispose(); beams.splice(i, 1); } }
        api.setScore(`🤖 ${hits}   😅 ${oops}   ${fmtT(time)}`);
        if (time <= 0) { over = true; const tix = clamp(hits * 3 - oops * 3, 0, 75); api.finish(tix, hits >= 15 ? "🏆 Laser champion!" : "Game over!", `${hits} robots zapped, ${oops} oopsies → ${tix} tickets`); }
      },
    }, scene);
  },
};
