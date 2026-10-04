// ==========================================================================
//  Emmy's Blind Bag Town 3D — the Glow-Up station.
//
//  createGlow(item, envMap, opts) → controller for town.setOverride():
//    { scene, camera, update, onDown, onMove, onUp, setTool(t), cycleAcc(),
//      toggleBlush(), remaining(), cleanAll(), glam, dispose }
//  A Glow-Up Face comes out of its bag a bit messy from playing outside —
//  mud, paint splats, cookie crumbs, leaves and tangled fluff. Scrub with the
//  🧽 sponge, comb with the 🪮 brush, then decorate: blush, stickers, a bow.
// ==========================================================================
import { THREE, rnd, clamp, makeParticles, emojiSprite, emojiTexture } from "../arcade3d/lib.js";
import { buildItem, addGlam, GLAM_ACCS, CRITTERS } from "./models.js";
import { bgTexture } from "./open.js";

export const STICKERS = ["✨", "💖", "⭐", "🌸", "🦋", "🌈", "🍓", "💎"];

export function createGlow(item, envMap, { sfx = {}, glam: startGlam = null, messy = true, onProgress, onClean } = {}) {
  const scene = new THREE.Scene(); scene.environment = envMap; scene.environmentIntensity = 0.55; scene.background = bgTexture();
  const camera = new THREE.PerspectiveCamera(34, 1, 0.05, 50); const look = new THREE.Vector3(0, 0.86, 0); camera.position.set(0, 1.05, 3.3); camera.lookAt(look);
  scene.add(new THREE.HemisphereLight(0xffffff, 0x8a6a9a, 0.9)); const key = new THREE.DirectionalLight(0xffffff, 1.6); key.position.set(1.5, 3, 3); scene.add(key); const rim = new THREE.DirectionalLight(0xffd0f0, 0.8); rim.position.set(-2, 2, -2); scene.add(rim);
  // a salon mirror ring of bulbs behind the face
  const bulbM = new THREE.MeshStandardMaterial({ color: 0xfff6d0, emissive: 0xffe9a0, emissiveIntensity: 1.2 });
  for (let i = 0; i < 18; i++) { const a = (i / 18) * Math.PI * 2; const b = new THREE.Mesh(new THREE.SphereGeometry(0.06, 12, 8), bulbM); b.position.set(Math.cos(a) * 1.25, 0.8 + Math.sin(a) * 1.05, -0.9); scene.add(b); }
  const frame = new THREE.Mesh(new THREE.TorusGeometry(1.15, 0.05, 10, 80), new THREE.MeshStandardMaterial({ color: 0xffc93c, metalness: 0.8, roughness: 0.25 })); frame.scale.y = 0.9; frame.position.set(0, 0.8, -0.95); scene.add(frame);
  const counter = new THREE.Mesh(new THREE.BoxGeometry(4, 0.2, 2), new THREE.MeshStandardMaterial({ color: 0xffe0f0, roughness: 0.5 })); counter.position.y = -0.1; scene.add(counter);
  const parts = makeParticles(scene, 300);

  const glam = { blush: false, acc: null, stickers: [], ...(startGlam || {}) }; glam.stickers = [...(glam.stickers || [])];
  const toy = buildItem(item, { glam }); scene.add(toy); const hc = new THREE.Vector3(...toy.userData.hc), hr = toy.userData.hr, head = toy.userData.head;
  toy.scale.setScalar(0.01);

  // ---- the mess (only on the front of the face, never over the eyes) ---------
  const messes = [], tufts = []; const A = CRITTERS[item.p.a] || {};
  const fur = new THREE.Color(A.c || 0xffffff).offsetHSL(0, 0, -0.12).getHex();
  const onFace = (yaw, pitch, out = 0) => { const cp = Math.cos(pitch), R = hr + out; return new THREE.Vector3(hc.x + Math.sin(yaw) * cp * R * 1.04, hc.y + Math.sin(pitch) * R * 0.97, hc.z + Math.cos(yaw) * cp * R); };
  const Z = new THREE.Vector3(0, 0, 1);
  const place = (o, yaw, pitch, out) => { o.position.copy(onFace(yaw, pitch, out)); o.quaternion.setFromUnitVectors(Z, onFace(yaw, pitch, out + 1).sub(o.position).normalize()); toy.add(o); return o; };
  const spots = [];
  const okSpot = (yaw, pitch) => { const eyeY = 0.03, eyeX = 0.36; if (Math.hypot(Math.abs(yaw) - eyeX, pitch - eyeY) < 0.27) return false; if (Math.hypot(yaw, pitch + 0.24) < 0.22) return false; return spots.every(([y, p]) => Math.hypot(y - yaw, p - pitch) > 0.36); };
  if (messy) {
    const kinds = item.p.a === "dragon" ? ["glitter", "glitter", "paint", "mud", "crumbs", "glitter", "paint"] : item.p.a === "unicorn" ? ["paint", "paint", "paint", "mud", "crumbs", "paint", "leaf"] : ["mud", "mud", "paint", "crumbs", "leaf", "mud", "crumbs"];
    for (const kind of kinds) {
      let yaw = 0, pitch = 0, tries = 0; do { yaw = rnd(-1.0, 1.0); pitch = rnd(-0.55, 0.62); tries++; } while (!okSpot(yaw, pitch) && tries < 40); spots.push([yaw, pitch]);
      const r = rnd(0.085, 0.13); let obj;
      if (kind === "crumbs") { obj = new THREE.Group(); const m = new THREE.MeshStandardMaterial({ color: 0xd9a35a, roughness: 0.9, transparent: true }); for (let i = 0; i < 7; i++) { const c = new THREE.Mesh(new THREE.DodecahedronGeometry(rnd(0.012, 0.022)), m); c.position.set(rnd(-r, r) * 0.7, rnd(-r, r) * 0.7, 0.01); obj.add(c); } obj.userData.mat = m; }
      else { const col = kind === "mud" ? "#7a4a26" : kind === "paint" ? ["#ff3d7a", "#3d8bfd", "#ffd23a", "#2fae66", "#9b59ff"][messes.length % 5] : kind === "glitter" ? "#ffe066" : "#4caf50"; const m = new THREE.MeshStandardMaterial({ map: kind === "leaf" ? emojiTexture("🍃", 128) : splatTex(col, kind === "glitter"), transparent: true, depthWrite: false, roughness: kind === "mud" ? 0.95 : 0.4, polygonOffset: true, polygonOffsetFactor: -2 }); obj = new THREE.Mesh(new THREE.PlaneGeometry(r * 2.2, r * 2.2), m); obj.userData.mat = m; obj.rotation.z = rnd(0, 6); }
      place(obj, yaw, pitch, kind === "crumbs" ? 0.0 : 0.006); if (kind !== "crumbs") obj.rotateZ(rnd(0, 6));
      messes.push({ obj, kind, at: obj.position.clone(), r: r + 0.04, dirt: 1 });
    }
    for (let i = 0; i < 6; i++) { const yaw = -1.1 + i * 0.44 + rnd(-0.1, 0.1), pitch = rnd(0.62, 0.95); const t = new THREE.Group(); const geo = new THREE.ConeGeometry(0.045, 0.22, 8); geo.rotateX(Math.PI / 2); geo.translate(0, 0, 0.09); const cone = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color: fur, roughness: 0.9 })); t.add(cone); place(t, yaw, pitch, -0.02); t.rotateX(rnd(-0.6, 0.6)); t.rotateY(rnd(-0.6, 0.6)); t.userData.q0 = t.quaternion.clone(); tufts.push({ obj: t, at: t.position.clone(), combed: 0 }); }
  }
  const total = messes.length + tufts.length; let cleaned = 0, done = !messy;
  const remaining = () => ({ dirt: messes.filter((m) => m.dirt > 0).length, fluff: tufts.filter((t) => t.combed < 1).length, total });

  // ---- tools ------------------------------------------------------------------
  let tool = messy ? "sponge" : "sticker", stickerI = 0;
  const cursor = emojiSprite("🧽", 0.22); cursor.visible = false; scene.add(cursor);
  const CURSOR = { sponge: "🧽", brush: "🪮", sticker: "✨", blush: "💗" };
  function setTool(t) { tool = t; cursor.material.map = emojiTexture(t === "sticker" ? STICKERS[stickerI % STICKERS.length] : CURSOR[t] || "✨"); cursor.material.needsUpdate = true; }
  setTool(tool);
  const ray = new THREE.Raycaster(); let down = null; const tmp = new THREE.Vector3();
  function hitFace(p) { const targets = [head, ...tufts.filter((t) => t.combed < 1).map((t) => t.obj)]; const h = p.ray.intersectObjects(targets, true)[0]; return h || null; }
  function work(p, moved) {
    const h = hitFace(p); if (!h) { cursor.visible = false; return; }
    cursor.visible = true; cursor.position.copy(h.point).add(tmp.set(0, 0.02, 0.12));
    const local = toy.worldToLocal(h.point.clone());
    if (tool === "sponge") {
      if (Math.random() < 0.5) parts.burst(h.point, 0xffffff, 2, 0.6, 0.6, -0.5); if (Math.random() < 0.18) sfx.scrub && sfx.scrub();
      for (const m of messes) { if (m.dirt <= 0) continue; if (local.distanceTo(m.at) < m.r + 0.05) { m.dirt -= 0.05 + moved * 0.004; setDirt(m); if (m.dirt <= 0) clearOne(m); } }
    } else if (tool === "brush") {
      if (Math.random() < 0.15) sfx.brush && sfx.brush();
      for (const t of tufts) { if (t.combed >= 1) continue; if (local.distanceTo(t.at) < 0.2) { t.combed = Math.min(1, t.combed + 0.06 + moved * 0.004); combT(t); if (t.combed >= 1) clearOne(t); } }
    }
  }
  function setDirt(m) { const k = Math.max(0, m.dirt); m.obj.userData.mat.opacity = k; if (m.kind === "crumbs") m.obj.scale.setScalar(Math.max(0.01, k)); }
  function combT(t) { const k = t.combed; t.obj.scale.set(1 - k * 0.4, 1 - k * 0.4, Math.max(0.05, 1 - k)); }
  function clearOne(o) { o.obj.visible = false; cleaned++; parts.burst(toy.localToWorld(o.at.clone()), 0xfff3a0, 16, 1.4, 0.8, 1); parts.burst(toy.localToWorld(o.at.clone()), 0xff8ac8, 8, 1.2, 0.7, 1); sfx.sparkle && sfx.sparkle(); onProgress && onProgress(remaining());
    if (!done && cleaned >= total) { done = true; setTimeout(() => { burstAll(); onClean && onClean(); }, 250); } }
  function burstAll() { for (const c of [0xff8ac8, 0xffd54a, 0x7ad3ff, 0xffffff]) parts.burst(hc.clone().add(new THREE.Vector3(0, 0.1, 0.3)), c, 30, 2.4, 1.2, 1.5); }
  function decorateAt(p) {
    const h = p.ray.intersectObject(head, false)[0]; if (!h) return false;
    if (tool === "sticker") { if (glam.stickers.length >= 14) glam.stickers.shift(); const d = toy.worldToLocal(h.point.clone()).sub(hc); d.x /= 1.04; d.y /= 0.97; d.normalize(); glam.stickers.push({ yaw: Math.atan2(d.x, d.z), pitch: Math.asin(clamp(d.y, -1, 1)), e: STICKERS[stickerI % STICKERS.length] }); stickerI++; setTool("sticker"); addGlam(toy, glam); sfx.sparkle && sfx.sparkle(); parts.burst(h.point, 0xffe066, 10, 1, 0.6, 1); return true; }
    if (tool === "blush") { toggleBlush(); return true; }
    return false;
  }
  function resetGlam() { glam.blush = false; glam.acc = null; glam.stickers.length = 0; addGlam(toy, glam); }
  function toggleBlush() { glam.blush = !glam.blush; addGlam(toy, glam); sfx.sparkle && sfx.sparkle(); }
  function cycleAcc() { const i = GLAM_ACCS.indexOf(glam.acc); glam.acc = GLAM_ACCS[(i + 1) % GLAM_ACCS.length]; addGlam(toy, glam); sfx.pop && sfx.pop(); parts.burst(hc.clone().add(new THREE.Vector3(0, hr, 0)), 0xff8ac8, 18, 1.4, 0.8, 1); return glam.acc; }

  function onDown(p) { down = { x: p.sx, y: p.sy, lastX: p.sx, lastY: p.sy, moved: 0 }; if (tool === "sponge" || tool === "brush") work(p, 0); }
  function onMove(p) { const h = p.ray; if (!down) { const hit = hitFace(p); cursor.visible = !!hit; if (hit) cursor.position.copy(hit.point).add(tmp.set(0, 0.02, 0.12)); return; } const mv = Math.hypot(p.sx - down.lastX, p.sy - down.lastY); down.moved += mv; down.lastX = p.sx; down.lastY = p.sy; if (tool === "sponge" || tool === "brush") work(p, mv); }
  function onUp(p) { const was = down; down = null; if (!was) return; if (was.moved < 10 && (tool === "sticker" || tool === "blush")) decorateAt(p); }

  // ---- update ---------------------------------------------------------------------
  let t = 0, pop = 0; const _home = new THREE.Vector3(), camHome = new THREE.Vector3(0, 1.05, 3.3);
  function update(dt) {
    t += dt; parts.update(dt); pop = Math.min(1, pop + dt * 2.2); const e = 1 - Math.pow(1 - pop, 3); toy.scale.setScalar(Math.max(0.01, e * (1 + Math.sin(pop * Math.PI) * 0.12)));
    toy.rotation.y = Math.sin(t * 0.6) * 0.1; toy.position.y = Math.sin(t * 1.3) * 0.015;
    _home.subVectors(camHome, look).multiplyScalar(Math.pow(Math.max(1, 1.0 / camera.aspect), 0.9)).add(look); camera.position.lerp(_home, Math.min(1, dt * 4)); camera.lookAt(look);
    for (const m of messes) if (m.kind === "glitter" && m.dirt > 0) m.obj.material.emissive?.setHex(Math.sin(t * 6 + m.r * 50) > 0.6 ? 0x554400 : 0x000000);
  }
  return {
    scene, camera, update, onDown, onMove, onUp, setTool, cycleAcc, toggleBlush, resetGlam, remaining, glam,
    get tool() { return tool; }, get clean() { return done; },
    cleanAll() { for (const m of messes) if (m.dirt > 0) { m.dirt = 0; setDirt(m); clearOne(m); } for (const tf of tufts) if (tf.combed < 1) { tf.combed = 1; combT(tf); clearOne(tf); } },
    dispose() { scene.traverse((o) => { if (o.geometry) o.geometry.dispose(); }); parts.dispose(); },
  };
}

// a splat of mud / paint drawn on a canvas (cached per colour)
const splats = new Map();
function splatTex(col, sparkle = false) {
  const key = col + sparkle; if (splats.has(key)) return splats.get(key);
  const c = document.createElement("canvas"); c.width = c.height = 128; const g = c.getContext("2d"); g.fillStyle = col;
  g.beginPath(); g.arc(64, 64, 30, 0, Math.PI * 2); g.fill(); for (let i = 0; i < 9; i++) { const a = rnd(0, 6.28), d = rnd(18, 34); g.beginPath(); g.arc(64 + Math.cos(a) * d, 64 + Math.sin(a) * d, rnd(8, 18), 0, Math.PI * 2); g.fill(); }
  for (let i = 0; i < 6; i++) { const a = rnd(0, 6.28), d = rnd(44, 58); g.beginPath(); g.arc(64 + Math.cos(a) * d, 64 + Math.sin(a) * d, rnd(3, 6), 0, Math.PI * 2); g.fill(); }
  if (sparkle) for (let i = 0; i < 40; i++) { g.fillStyle = i % 2 ? "#ffffff" : "#ff8ac8"; g.fillRect(rnd(20, 108), rnd(20, 108), 3, 3); }
  else { g.fillStyle = "rgba(255,255,255,.25)"; g.beginPath(); g.ellipse(54, 52, 12, 6, -0.5, 0, Math.PI * 2); g.fill(); }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; splats.set(key, t); return t;
}
