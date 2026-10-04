// ==========================================================================
//  Emmy's Blind Bag Town 3D — 📦 Stock the Shelves (the job at Ted's).
//
//  createStock({ envMap, sfx, onScore, onEnd }) → controller for town.setOverride()
//  Blind bags ride along a conveyor belt. Drag each one up into the bin for
//  its series before it falls off the end. Sometimes a chicken rides the belt
//  too — tap it to shoo it off (bonus points!). 45 seconds.
// ==========================================================================
import { THREE, rnd, clamp, emojiSprite, makeParticles, textPlane, mat, box } from "../arcade3d/lib.js";
import { makeBag, makeChicken, CHICKEN_COLORS, SERIES, SERIES_IDS } from "./models.js";

const TIME = 45, BELT_Y = 0.55, BIN_Y = 1.75, X0 = -3.6, X1 = 3.6;

export function createStock({ envMap, sfx = {}, onScore, onEnd } = {}) {
  const scene = new THREE.Scene(); scene.environment = envMap; scene.environmentIntensity = 0.5; scene.background = new THREE.Color(0xeaf0ff);
  const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 50); camera.position.set(0, 1.35, 6.2); camera.lookAt(0, 1.2, 0);
  scene.add(new THREE.HemisphereLight(0xffffff, 0x8090b0, 1.1)); const sun = new THREE.DirectionalLight(0xffffff, 1.4); sun.position.set(2, 5, 4); scene.add(sun);
  const parts = makeParticles(scene, 300);
  // the store wall, the belt and three bins
  scene.add(box(14, 6, 0.2, mat.std(0xdfe8ff), 0, 2.5, -1.2)); scene.add(box(14, 0.1, 6, mat.std(0xf6f8ff), 0, -0.05, 1));
  const sign = textPlane(["📦 STOCK THE SHELVES!"], 5, 0.6, { bg: "#3d6bfd", color: "#fff", size: 90 }); sign.position.set(0, 3.55, -1.05); scene.add(sign);
  const beltTex = (() => { const c = document.createElement("canvas"); c.width = 256; c.height = 32; const g = c.getContext("2d"); g.fillStyle = "#3a3e48"; g.fillRect(0, 0, 256, 32); g.fillStyle = "#555a66"; for (let x = 0; x < 256; x += 32) g.fillRect(x, 0, 14, 32); const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(8, 1); return t; })();
  const belt = new THREE.Mesh(new THREE.BoxGeometry(X1 - X0 + 0.6, 0.12, 0.9), new THREE.MeshStandardMaterial({ map: beltTex, roughness: 0.7 })); belt.position.set(0, BELT_Y - 0.08, 0); scene.add(belt);
  scene.add(box(X1 - X0 + 0.8, 0.45, 1.0, mat.metal(0xb0b8c0), 0, BELT_Y - 0.37, 0));
  const series = [...SERIES_IDS].sort(() => Math.random() - 0.5).slice(0, 3);
  const bins = series.map((sid, i) => {
    const g = new THREE.Group(), col = new THREE.Color(SERIES[sid].colors[0]), m = mat.std(col.getHex(), { roughness: 0.5 });
    g.add(box(1.5, 0.08, 0.9, m, 0, 0, 0), box(1.5, 0.9, 0.08, m, 0, 0.45, -0.45), box(0.08, 0.9, 0.9, m, -0.75, 0.45, 0), box(0.08, 0.9, 0.9, m, 0.75, 0.45, 0), box(1.5, 0.25, 0.08, m, 0, 0.12, 0.45));
    const ico = emojiSprite(SERIES[sid].ico, 0.62); ico.position.set(-0.3, 0.42, 0.55); g.add(ico);
    const sample = makeBag(sid); sample.scale.setScalar(0.28); sample.position.set(0.48, 0.12, -0.3); sample.rotation.y = -0.3; g.add(sample);
    g.position.set((i - 1) * 2.4, BIN_Y, -0.2); scene.add(g); return { sid, g, x: (i - 1) * 2.4, n: 0, wig: 0 };
  });
  // ---- things on the belt -----------------------------------------------------
  const items = []; let spawnT = 0.3, t = 0, time = TIME, score = 0, combo = 0, best = 0, over = false, grabbed = null;
  function spawn() {
    if (Math.random() < 0.12) { const ch = makeChicken({ color: CHICKEN_COLORS[Math.floor(Math.random() * CHICKEN_COLORS.length)] }); ch.group.scale.setScalar(1.3); ch.group.rotation.y = Math.PI / 2; ch.group.position.set(X0, BELT_Y, 0.1); scene.add(ch.group); items.push({ g: ch.group, ch, hen: true, x: X0, y: BELT_Y, vy: 0, state: "belt" }); return; }
    const sid = series[Math.floor(Math.random() * 3)], g = makeBag(sid); g.scale.setScalar(0.36); g.position.set(X0, BELT_Y, 0.1); scene.add(g); items.push({ g, sid, x: X0, y: BELT_Y, vy: 0, state: "belt", rz: rnd(-0.2, 0.2) });
  }
  const speed = () => 0.9 + (1 - time / TIME) * 0.9;
  const report = (msg) => onScore && onScore(score, combo, time, msg);
  // ---- input --------------------------------------------------------------------
  const plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), -0.1), hp = new THREE.Vector3();
  function onDown(p) {
    if (over) return; const meshes = []; for (const it of items) if (it.state === "belt") it.g.traverse((o) => { if (o.isMesh) { o.userData.item = it; meshes.push(o); } });
    const hit = p.ray.intersectObjects(meshes, false)[0]; if (!hit) return; const it = hit.object.userData.item;
    if (it.hen) { it.state = "shoo"; it.vy = 4; it.ch.flapNow(); sfx.bawk && sfx.bawk(); score += 2; parts.burst(it.g.position, 0xffffff, 16, 2, 0.8, 4); report(pick(["🐔 Shoo, chicken! +2", "🐔 BAWK! +2", "🐔 Not for sale! +2"])); return; }
    grabbed = it; it.state = "held"; sfx.tap && sfx.tap();
  }
  function onMove(p) { if (!grabbed) return; if (p.ray.ray.intersectPlane(plane, hp)) { grabbed.x = clamp(hp.x, X0, X1); grabbed.y = clamp(hp.y, 0.3, 2.9); } }
  function onUp() {
    if (!grabbed) return; const it = grabbed; grabbed = null; const bin = bins.find((b) => Math.abs(b.x - it.x) < 0.85 && it.y > BIN_Y - 0.35);
    if (bin && bin.sid === it.sid) { it.state = "binned"; it.bin = bin; bin.n++; bin.wig = 1; combo++; best = Math.max(best, combo); const pts = combo >= 5 ? 2 : 1; score += pts; sfx.ding && sfx.ding(); parts.burst(new THREE.Vector3(bin.x, BIN_Y + 0.5, 0), new THREE.Color(SERIES[bin.sid].colors[0]), 20, 2, 0.8, 3); report(combo >= 5 ? `🔥 ${combo} in a row! +2` : combo >= 2 ? `✨ ${combo} in a row!` : null); }
    else { it.state = "belt"; it.vy = 0; if (bin) { combo = 0; sfx.error && sfx.error(); report(`❌ That goes in the ${SERIES[it.sid].ico} bin!`); } }
  }
  const pick = (a) => a[Math.floor(Math.random() * a.length)];
  // ---- update -------------------------------------------------------------------
  function update(dt) {
    t += dt; parts.update(dt); beltTex.offset.x -= dt * speed() * 0.45;
    if (!over) { time -= dt; if ((spawnT -= dt) <= 0) { spawnT = rnd(1.0, 1.5) * (1.2 - (1 - time / TIME) * 0.45); spawn(); } if (Math.floor(time + dt) !== Math.floor(time)) report(); if (time <= 0) { time = 0; over = true; report(); setTimeout(() => onEnd && onEnd({ score, best }), 600); } }
    for (let i = items.length - 1; i >= 0; i--) {
      const it = items[i];
      if (it.state === "belt") { it.x += speed() * dt; if (it.y > BELT_Y) { it.vy -= 9 * dt; it.y = Math.max(BELT_Y, it.y + it.vy * dt); } if (it.x > X1) { it.state = "fall"; if (!it.hen) { combo = 0; sfx.error && sfx.error(); report("😮 Oops, one fell off!"); } } }
      else if (it.state === "fall") { it.vy -= 9 * dt; it.y += it.vy * dt; it.x += dt * 1.2; it.g.rotation.z -= dt * 3; if (it.y < -1) { scene.remove(it.g); items.splice(i, 1); continue; } }
      else if (it.state === "shoo") { it.vy -= 9 * dt; it.y += it.vy * dt; it.x += dt * 2; if (it.y < -1) { scene.remove(it.g); items.splice(i, 1); continue; } }
      else if (it.state === "binned") { const b = it.bin; it.x += (b.x + rnd(-0.3, 0.3) * 0 - it.x) * Math.min(1, dt * 8); it.y += (BIN_Y + 0.25 - it.y) * Math.min(1, dt * 8); it.g.scale.multiplyScalar(1 - dt * 1.5); if (it.g.scale.x < 0.08) { scene.remove(it.g); items.splice(i, 1); continue; } }
      it.g.position.set(it.x, it.y, it.state === "held" ? 0.5 : 0.1); if (it.state === "belt" && !it.hen) it.g.rotation.z = it.rz + Math.sin(t * 3 + i) * 0.03; if (it.state === "held") it.g.rotation.z = Math.sin(t * 10) * 0.1;
      if (it.hen) it.ch.update(dt, t, it.state === "belt" ? 0.5 : 0, false);
    }
    for (const b of bins) { b.wig = Math.max(0, b.wig - dt * 3); b.g.rotation.z = Math.sin(t * 30) * 0.04 * b.wig; }
    const _h = Math.max(1, 1.25 / camera.aspect); camera.position.set(0, 1.35, 6.2 * _h); camera.lookAt(0, 1.2, 0);
  }
  return { scene, camera, update, onDown, onMove, onUp, series, get score() { return score; }, get time() { return time; }, finish() { time = 0.01; }, dispose() { scene.traverse((o) => { if (o.geometry) o.geometry.dispose(); }); parts.dispose(); } };
}
