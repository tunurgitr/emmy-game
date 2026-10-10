// ==========================================================================
//  Emmy's Pizza Plus 3D — opening a mystery box.
//
//  createOpen(game, kind, { sfx, rarity, onTap, onReveal }) → override for town.setOverride
//    Tap the box (3 taps — it wobbles, glows and steams more each time), then
//    the lid flies open, a beam in the rarity colour shoots up and the game's
//    shiny token floats out and spins.  ctrl.open() skips straight to the pop.
// ==========================================================================
import { THREE, part, ball, pill, rbox, toon, COL, addLights, makeFace, emojiTex, canvasTex, rnd, makePizza, signTex } from "./toon.js";
import { makeBox } from "./models.js";

export function createOpen(game, kind, { sfx, rarity, onTap, onReveal } = {}) {
  const scene = new THREE.Scene(); scene.background = new THREE.Color(0xfff0e0);
  const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 80); camera.position.set(0, 3.4, 6.2); camera.lookAt(0, 1.0, 0);
  addLights(scene, { key: 2.2, fill: 1.4 });
  // a cosy kitchen corner: checkered table, a brick wall, a window
  const cloth = canvasTex(256, 256, (g, w) => { const n = 8, s = w / n; for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) { g.fillStyle = (i + j) % 2 ? "#fff3e2" : "#ff6f61"; g.fillRect(i * s, j * s, s, s); } }, 1.5);
  const table = new THREE.Mesh(new THREE.CircleGeometry(4.2, 48), toon(0xffffff, { map: cloth })); table.rotation.x = -Math.PI / 2; scene.add(table);
  scene.add(part(pill(4.25, 4.25, 0.3, 0.12), COL.crust, { y: -0.16 }));
  const wall = new THREE.Mesh(new THREE.PlaneGeometry(40, 20), toon(0xffffff, { map: canvasTex(256, 256, (g, w) => { g.fillStyle = "#ffd9c7"; g.fillRect(0, 0, w, w); g.fillStyle = "#ffc3ab"; for (let r = 0; r < 8; r++) for (let c = 0; c < 5; c++) g.fillRect(c * 56 + (r % 2) * 28 - 20, r * 32 + 3, 50, 26); }, 4) })); wall.position.set(0, 4, -6); scene.add(wall);
  const sign = new THREE.Mesh(new THREE.PlaneGeometry(4, 1), new THREE.MeshBasicMaterial({ map: signTex(["🍕 What's in the box? 🍕"], { w: 512, h: 128, size: 52 }), transparent: true })); sign.position.set(0, 4.1, -5.9); scene.add(sign);
  const R = rarity || { color: "#ffc93c", order: 0 };
  const rc = new THREE.Color(R.rainbow ? "#ffd23f" : R.color);

  const box = makeBox(kind); box.group.position.y = 0.02; scene.add(box.group); const S0 = kind === "bag" ? 1.25 : 1.35; box.group.scale.setScalar(S0);
  // the glow that leaks out of the box more with every tap
  const glow = new THREE.Mesh(new THREE.SphereGeometry(1, 20, 14), new THREE.MeshBasicMaterial({ color: rc, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending })); glow.position.y = 0.7; glow.scale.setScalar(1.6); scene.add(glow);
  const beam = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 1.2, 12, 24, 1, true), new THREE.MeshBasicMaterial({ color: rc, transparent: true, opacity: 0, depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending })); beam.position.y = 6; scene.add(beam);
  // the game token: a fat round coin with the game's picture on both sides
  const token = new THREE.Group(); token.visible = false; scene.add(token);
  const ttex = canvasTex(256, 256, (g) => { const gr = g.createRadialGradient(128, 110, 10, 128, 128, 128); gr.addColorStop(0, "#fffaf0"); gr.addColorStop(1, "#ffe2b8"); g.fillStyle = gr; g.beginPath(); g.arc(128, 128, 126, 0, 7); g.fill(); g.font = `150px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif`; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText(game.ico, 128, 138); });
  ttex.wrapS = ttex.wrapT = THREE.ClampToEdgeWrapping;
  token.add(part(pill(1.0, 1.0, 0.26, 0.11), rc.getHex(), { rx: Math.PI / 2, emissive: 0x201000 }));
  for (const s of [1, -1]) { const f = new THREE.Mesh(new THREE.CircleGeometry(0.84, 40), new THREE.MeshBasicMaterial({ map: ttex })); f.position.z = s * 0.135; if (s < 0) f.rotation.y = Math.PI; token.add(f); }
  // sparkles & steam
  const bits = []; const sparkleMat = (c) => toon(c, { emissive: 0x202020 });
  function burst(n, colors, power = 1) { for (let i = 0; i < n; i++) { const m = part(i % 3 ? ball(rnd(0.06, 0.12), 8, 6) : rbox(0.18, 0.18, 0.05, 0.03), 0, { mat: sparkleMat(colors[i % colors.length]), ol: 0.5 }); m.position.set(rnd(-0.3, 0.3), 1.2, rnd(-0.3, 0.3)); scene.add(m); bits.push({ m, v: new THREE.Vector3(rnd(-3, 3) * power, rnd(4, 8) * power, rnd(-3, 3) * power), life: rnd(1.4, 2.4), spin: rnd(-8, 8) }); } }
  const steam = []; for (let i = 0; i < 6; i++) { const s = part(ball(0.3, 10, 8), 0xffffff, { ol: 0.6, olColor: 0xd8c8c0 }); s.visible = false; scene.add(s); steam.push({ s, t: i / 6 }); }

  let taps = 0, phase = "box", t = 0, popT = 0, revealed = false;
  const NEED = 3;
  function tap() {
    if (phase !== "box") return; taps++; box.shake(1 + taps * 0.4); sfx && (taps < NEED ? sfx.boxTap(taps) : null); onTap && onTap(taps, NEED);
    burst(4 + taps * 2, [rc.getHex(), 0xffffff, COL.cheese], 0.5);
    if (taps >= NEED) open();
  }
  function open() {
    if (phase !== "box") return; phase = "pop"; popT = 0; sfx && sfx.boxOpen(R.order || 0);
    burst(26 + (R.order || 0) * 8, R.rainbow ? [0xff5d8f, 0xffb347, 0xffe066, 0x7cffb0, 0x6ec6ff, 0xb18cff] : [rc.getHex(), 0xffffff, COL.cheese, COL.tomato], 1);
  }
  const ctrl = {
    scene, camera, game, get phase() { return phase; }, tap, open,
    onDown(e) { if (phase === "box") { const hit = e.ray.intersectObject(box.group, true)[0]; tap(); } else if (phase === "done") { token.userData.spinV = 14; sfx && sfx.boing(); } },
    update(dt) {
      t += dt; box.update(dt, t);
      const want = phase === "box" ? taps / NEED : 0; glow.material.opacity += (want * 0.35 + Math.sin(t * 6) * 0.04 * (taps > 0) - glow.material.opacity) * Math.min(1, dt * 6); glow.scale.setScalar(1.5 + taps * 0.25);
      steam.forEach((o, i) => { o.s.visible = phase === "box" && taps > 0; o.t = (o.t + dt * (0.3 + taps * 0.15)) % 1; o.s.position.set(Math.sin(o.t * 7 + i) * 0.3, 1.0 + o.t * 2.6, Math.cos(i) * 0.3); o.s.scale.setScalar((0.25 + o.t * 0.6) * (0.5 + taps * 0.12)); });
      if (phase === "pop" || phase === "done") {
        popT += dt;
        if (box.lid) { box.lid.rotation.x = Math.max(box.lid.rotation.x - dt * 14, kind === "bag" ? -0.2 : -2.2); if (kind === "bag") { box.lid.position.y += dt * 5; box.lid.rotation.z += dt * 6; } }
        box.group.scale.setScalar(S0 * (1 - Math.min(1, Math.max(0, popT - 0.6) * 2) * 0.3)); box.group.position.y = -Math.max(0, popT - 0.6) * 0.6;
        beam.material.opacity = Math.min(0.35 + (R.order || 0) * 0.05, popT * 1.2) * (phase === "done" ? 0.7 + Math.sin(t * 3) * 0.15 : 1); beam.rotation.y += dt;
        token.visible = true; const k = Math.min(1, popT / 0.9), ease = 1 - Math.pow(1 - k, 3);
        token.position.set(0, 0.6 + ease * 1.05 + Math.sin(t * 2) * 0.08 * k, 1.55 * ease); token.scale.setScalar(0.2 + ease * 0.62);
        if (phase === "pop") { token.userData.spinV = Math.max(0, (token.userData.spinV ?? 16) - dt * 9); token.rotation.y += dt * token.userData.spinV; } else { token.userData.spinV = Math.max(0, (token.userData.spinV || 0) - dt * 6); token.userData.spin = (token.userData.spin || 0) + dt * token.userData.spinV; token.rotation.y += ((Math.sin(t * 1.5) * 0.45 + token.userData.spin) - token.rotation.y) * Math.min(1, dt * 4); }
        if (popT > 0.9 && !revealed) { revealed = true; phase = "done"; onReveal && onReveal(); }
      }
      for (let i = bits.length - 1; i >= 0; i--) { const b = bits[i]; b.life -= dt; b.v.y -= 12 * dt; b.m.position.addScaledVector(b.v, dt); if (b.m.position.y < 0.05) { b.m.position.y = 0.05; b.v.y *= -0.4; b.v.x *= 0.7; b.v.z *= 0.7; } b.m.rotation.x += b.spin * dt; b.m.rotation.z += b.spin * dt; if (b.life < 0.4) b.m.scale.setScalar(Math.max(0.01, b.life / 0.4)); if (b.life <= 0) { scene.remove(b.m); bits.splice(i, 1); } }
      const back = Math.max(1, 0.95 / Math.max(0.3, camera.aspect)); camera.position.set(Math.sin(t * 0.4) * 0.25, 3.4 * Math.sqrt(back), 6.2 * back); camera.lookAt(0, 1.05, 0);
    },
    dispose() { scene.traverse((o) => { if (o.material && o.material.map && o.material.map !== ttex) {} }); ttex.dispose(); },
  };
  return ctrl;
}
