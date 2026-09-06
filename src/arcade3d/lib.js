// ==========================================================================
//  Emmy's Arcade 3D — shared helpers (Three.js, procedural only, no assets).
// ==========================================================================
import * as THREE from "three";
export { THREE };

export const rnd = (a, b) => a + Math.random() * (b - a);
export const ri = (a, b) => Math.floor(rnd(a, b + 1));
export const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
export const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
export const lerp = (a, b, t) => a + (b - a) * t;
export const fmtT = (t) => `⏱ ${Math.max(0, Math.ceil(t))}s`;

// ---- canvas textures --------------------------------------------------------
const EMOJI_FONT = '"Segoe UI Emoji", "Apple Color Emoji", "Noto Color Emoji", sans-serif';
const texCache = new Map();
export function emojiTexture(e, size = 128) {
  const key = `${e}@${size}`; if (texCache.has(key)) return texCache.get(key);
  const c = document.createElement("canvas"); c.width = c.height = size; const g = c.getContext("2d");
  g.font = `${size * 0.78}px ${EMOJI_FONT}`; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText(e, size / 2, size * 0.56);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; texCache.set(key, t); return t;
}
// billboard sprite showing an emoji; `s` = world size
export function emojiSprite(e, s = 1) {
  const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: emojiTexture(e), transparent: true, depthWrite: false }));
  sp.scale.set(s, s, 1); return sp;
}
// flat plane with an emoji (for wall art / cabinet sides)
export function emojiPlane(e, s = 1) {
  const m = new THREE.Mesh(new THREE.PlaneGeometry(s, s), new THREE.MeshBasicMaterial({ map: emojiTexture(e, 256), transparent: true, side: THREE.DoubleSide, depthWrite: false }));
  return m;
}
export function textTexture(lines, { w = 512, h = 256, bg = "#1a1040", color = "#fff", size = 64, font = "900 %spx system-ui, sans-serif", glow = null, pad = 0 } = {}) {
  const c = document.createElement("canvas"); c.width = w; c.height = h; const g = c.getContext("2d");
  if (bg) { g.fillStyle = bg; g.fillRect(0, 0, w, h); }
  const arr = Array.isArray(lines) ? lines : [lines];
  g.textAlign = "center"; g.textBaseline = "middle"; g.fillStyle = color;
  if (glow) { g.shadowColor = glow; g.shadowBlur = 24; }
  arr.forEach((ln, i) => { const isEmoji = /\p{Extended_Pictographic}/u.test(ln) && ln.length <= 4; let fs = size; g.font = isEmoji ? `${fs}px ${EMOJI_FONT}` : font.replace("%s", fs);
    // shrink to fit the canvas width
    while (!isEmoji && fs > 10 && g.measureText(ln).width > w * 0.92) { fs -= 2; g.font = font.replace("%s", fs); }
    g.fillText(ln, w / 2, pad + (h - pad * 2) * ((i + 0.5) / arr.length)); });
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t;
}
export function textPlane(lines, w, h, opts = {}) {
  const t = textTexture(lines, { w: Math.round(w * 256), h: Math.round(h * 256), ...opts });
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: t, transparent: !opts.bg, toneMapped: false }));
  return m;
}

// ---- materials -------------------------------------------------------------
export const mat = {
  std: (color, o = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.6, metalness: 0.05, ...o }),
  gloss: (color, o = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.25, metalness: 0.1, ...o }),
  metal: (color = 0xc0c8d0, o = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.3, metalness: 0.9, ...o }),
  neon: (color, i = 1.6) => new THREE.MeshStandardMaterial({ color, emissive: new THREE.Color(color), emissiveIntensity: i, roughness: 0.4, toneMapped: false }),
  glass: (color = 0x9fdfff, opacity = 0.22) => new THREE.MeshPhysicalMaterial({ color, transparent: true, opacity, roughness: 0.05, metalness: 0, transmission: 0, side: THREE.DoubleSide, depthWrite: false }),
  wood: (color = 0xb0783c) => new THREE.MeshStandardMaterial({ map: woodTexture(color), roughness: 0.8 }),
  basic: (color, o = {}) => new THREE.MeshBasicMaterial({ color, ...o }),
};
let woodTexCache = new Map();
export function woodTexture(color = 0xb0783c, repeat = 1) {
  const key = `${color}`; if (woodTexCache.has(key)) return woodTexCache.get(key);
  const c = document.createElement("canvas"); c.width = 256; c.height = 256; const g = c.getContext("2d");
  const base = new THREE.Color(color); g.fillStyle = `#${base.getHexString()}`; g.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 60; i++) { const d = base.clone().offsetHSL(0, 0, rnd(-0.08, 0.06)); g.strokeStyle = `#${d.getHexString()}`; g.lineWidth = rnd(1, 4); g.beginPath(); const y = rnd(0, 256); g.moveTo(0, y); g.bezierCurveTo(80, y + rnd(-8, 8), 170, y + rnd(-8, 8), 256, y + rnd(-6, 6)); g.stroke(); }
  for (let i = 0; i < 8; i++) { g.fillStyle = "rgba(0,0,0,.12)"; g.fillRect(0, i * 32, 256, 1); }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(repeat, repeat); t.anisotropy = 4; woodTexCache.set(key, t); return t;
}
export function carpetTexture() {
  const c = document.createElement("canvas"); c.width = c.height = 512; const g = c.getContext("2d");
  g.fillStyle = "#6f6a75"; g.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 4000; i++) { g.fillStyle = `rgba(${ri(60, 130)},${ri(55, 120)},${ri(70, 140)},.5)`; g.fillRect(rnd(0, 512), rnd(0, 512), 3, 3); }
  g.strokeStyle = "rgba(230,225,240,.55)"; g.lineWidth = 3;
  for (let i = 0; i < 40; i++) { g.beginPath(); let x = rnd(0, 512), y = rnd(0, 512); g.moveTo(x, y); for (let k = 0; k < 6; k++) { x += rnd(-70, 70); y += rnd(-70, 70); g.lineTo(x, y); } g.stroke(); }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 8; return t;
}

// ---- geometry helpers ------------------------------------------------------
export function box(w, h, d, material, x = 0, y = 0, z = 0) { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material); m.position.set(x, y, z); return m; }
export function cyl(rt, rb, h, material, seg = 24, x = 0, y = 0, z = 0) { const m = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, seg), material); m.position.set(x, y, z); return m; }
export function sphere(r, material, x = 0, y = 0, z = 0, seg = 24) { const m = new THREE.Mesh(new THREE.SphereGeometry(r, seg, Math.max(8, seg / 2)), material); m.position.set(x, y, z); return m; }
export function torus(r, tube, material, x = 0, y = 0, z = 0) { const m = new THREE.Mesh(new THREE.TorusGeometry(r, tube, 12, 40), material); m.position.set(x, y, z); return m; }
// soft round contact shadow
let blobTex = null;
export function blobShadow(r = 1, opacity = 0.35) {
  if (!blobTex) { const c = document.createElement("canvas"); c.width = c.height = 128; const g = c.getContext("2d"); const gr = g.createRadialGradient(64, 64, 6, 64, 64, 64); gr.addColorStop(0, "rgba(0,0,0,1)"); gr.addColorStop(1, "rgba(0,0,0,0)"); g.fillStyle = gr; g.fillRect(0, 0, 128, 128); blobTex = new THREE.CanvasTexture(c); }
  const m = new THREE.Mesh(new THREE.CircleGeometry(r, 24), new THREE.MeshBasicMaterial({ map: blobTex, transparent: true, opacity, depthWrite: false }));
  m.rotation.x = -Math.PI / 2; m.position.y = 0.01; return m;
}

// ---- 3D particle bursts ----------------------------------------------------
let dotTex = null;
function dotTexture() { if (!dotTex) { const c = document.createElement("canvas"); c.width = c.height = 32; const g = c.getContext("2d"); const gr = g.createRadialGradient(16, 16, 2, 16, 16, 16); gr.addColorStop(0, "rgba(255,255,255,1)"); gr.addColorStop(0.6, "rgba(255,255,255,.9)"); gr.addColorStop(1, "rgba(255,255,255,0)"); g.fillStyle = gr; g.fillRect(0, 0, 32, 32); dotTex = new THREE.CanvasTexture(c); } return dotTex; }
export function makeParticles(scene, max = 300) {
  const geo = new THREE.BufferGeometry(); const pos = new Float32Array(max * 3), col = new Float32Array(max * 3);
  geo.setAttribute("position", new THREE.BufferAttribute(pos, 3)); geo.setAttribute("color", new THREE.BufferAttribute(col, 3));
  const pts = new THREE.Points(geo, new THREE.PointsMaterial({ size: 0.1, map: dotTexture(), vertexColors: true, transparent: true, opacity: 0.95, sizeAttenuation: true, depthWrite: false, alphaTest: 0.2 })); pts.frustumCulled = false; scene.add(pts);
  const live = []; const tmp = new THREE.Color();
  return {
    burst(p, color, n = 20, speed = 3, life = 0.8, gravity = 6) { tmp.set(color); for (let i = 0; i < n && live.length < max; i++) { live.push({ x: p.x, y: p.y, z: p.z, vx: rnd(-1, 1) * speed, vy: rnd(0.2, 1.4) * speed, vz: rnd(-1, 1) * speed, t: life * rnd(0.5, 1), r: tmp.r, g: tmp.g, b: tmp.b, gr: gravity }); } },
    update(dt) {
      for (let i = live.length - 1; i >= 0; i--) { const q = live[i]; q.t -= dt; if (q.t <= 0) { live.splice(i, 1); continue; } q.x += q.vx * dt; q.y += q.vy * dt; q.z += q.vz * dt; q.vy -= q.gr * dt; }
      for (let i = 0; i < max; i++) { const q = live[i]; if (q) { pos[i * 3] = q.x; pos[i * 3 + 1] = q.y; pos[i * 3 + 2] = q.z; col[i * 3] = q.r; col[i * 3 + 1] = q.g; col[i * 3 + 2] = q.b; } else { pos[i * 3 + 1] = -999; } }
      geo.attributes.position.needsUpdate = true; geo.attributes.color.needsUpdate = true; geo.setDrawRange(0, max);
    },
    dispose() { scene.remove(pts); geo.dispose(); pts.material.dispose(); },
  };
}

// ---- disposal --------------------------------------------------------------
export function disposeScene(scene) {
  scene.traverse((o) => { if (o.geometry) o.geometry.dispose(); if (o.material) { const ms = Array.isArray(o.material) ? o.material : [o.material]; for (const m of ms) { if (m.map && !texCache.has(m.map) && !isCachedTex(m.map)) m.map.dispose?.(); m.dispose?.(); } } });
}
function isCachedTex(t) { for (const v of texCache.values()) if (v === t) return true; for (const v of woodTexCache.values()) if (v === t) return true; return t === blobTex; }

// ---- standard lighting for game scenes ------------------------------------
export function lightScene(scene, { ambient = 0.55, sun = 1.2, color = 0xffffff, pos = [4, 8, 6] } = {}) {
  scene.add(new THREE.HemisphereLight(0xffffff, 0x404060, ambient));
  const d = new THREE.DirectionalLight(color, sun); d.position.set(...pos); scene.add(d);
  return d;
}
// place camera for a first-person game view
export function fpCamera(W, H, pos = [0, 1.6, 4], look = [0, 1, 0], fov = 55) {
  const cam = new THREE.PerspectiveCamera(fov, W / H, 0.05, 200); cam.position.set(...pos); cam.lookAt(...look); return cam;
}
// raycast helper: intersect a list of objects from an event's ray
export function hitTest(ray, objects) { const hits = ray.intersectObjects(objects, true); return hits.length ? hits[0] : null; }
// intersect an infinite plane (normal n, constant c) – returns point or null
const _plane = new THREE.Plane(), _pt = new THREE.Vector3();
export function hitPlane(ray, normal = [0, 1, 0], constant = 0) { _plane.set(new THREE.Vector3(...normal), constant); return ray.ray.intersectPlane(_plane, _pt) ? _pt.clone() : null; }

// simple spring/tween tick
export function approach(cur, target, rate, dt) { return cur + (target - cur) * Math.min(1, rate * dt); }

// ---- a little kid character with a modelled (human) face ------------------
//  opts: shirt, pants, skin, hair, hairStyle (short|long|ponytail|curly|bun),
//        eyes (color), mood (happy|neutral|excited), shoes, hat (emoji or null)
export function makeKid({ shirt = 0xff3dd6, pants = 0x3d8bfd, skin = 0xffd6b8, hair = 0x6b3e1e, hairStyle = "long", eyes = 0x3b6ea5, mood = "happy", shoes = 0xffffff, hat = null } = {}) {
  const g = new THREE.Group();
  const skinM = mat.std(skin, { roughness: 0.75 }), hairM = mat.std(hair, { roughness: 0.9 });
  const legL = cyl(0.11, 0.1, 0.5, mat.std(pants), 12, -0.14, 0.25, 0), legR = legL.clone(); legR.position.x = 0.14; g.add(legL, legR);
  for (const x of [-0.14, 0.14]) { const sh = new THREE.Mesh(new THREE.CapsuleGeometry(0.09, 0.14, 4, 10), mat.gloss(shoes)); sh.rotation.x = Math.PI / 2; sh.position.set(x, 0.05, 0.05); g.add(sh); }
  const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.28, 0.42, 6, 14), mat.std(shirt)); body.position.y = 0.85; g.add(body);
  const armL = cyl(0.07, 0.06, 0.5, mat.std(shirt), 10, -0.38, 0.85, 0), armR = armL.clone(); armR.position.x = 0.38; g.add(armL, armR);
  for (const x of [-0.38, 0.38]) g.add(sphere(0.075, skinM, x, 0.58, 0, 12));
  g.add(cyl(0.08, 0.1, 0.1, skinM, 12, 0, 1.2, 0)); // neck
  // head — slightly oval, with ears
  const head = sphere(0.3, skinM, 0, 1.52, 0, 28); head.scale.set(1, 1.08, 0.98); g.add(head);
  for (const x of [-0.29, 0.29]) { const ear = sphere(0.07, skinM, x, 1.5, 0, 12); ear.scale.set(0.6, 1, 0.8); g.add(ear); }
  // eyes: white + iris + pupil + highlight, eyebrows
  const eyeParts = [];
  for (const x of [-0.11, 0.11]) {
    const white = sphere(0.05, mat.std(0xffffff, { roughness: 0.3 }), x, 1.56, 0.255, 14); white.scale.set(1, 1.1, 0.55); g.add(white); eyeParts.push(white);
    const iris = sphere(0.032, mat.std(eyes, { roughness: 0.3 }), x, 1.555, 0.278, 12); iris.scale.z = 0.6; g.add(iris);
    const pupil = sphere(0.017, mat.std(0x111111), x, 1.555, 0.292, 8); pupil.scale.z = 0.5; g.add(pupil);
    const hl = sphere(0.007, mat.basic(0xffffff), x + 0.01, 1.568, 0.3, 6); g.add(hl);
    const brow = box(0.08, 0.014, 0.02, hairM, x, 1.63, 0.262); brow.rotation.z = x < 0 ? -0.1 : 0.1; g.add(brow);
  }
  // nose + mouth + cheeks
  const nose = sphere(0.028, skinM, 0, 1.49, 0.29, 10); nose.scale.set(1, 0.8, 0.8); g.add(nose);
  const mouthM = mat.std(0xc94a5a, { roughness: 0.5 });
  if (mood === "excited") { const m = sphere(0.035, mouthM, 0, 1.42, 0.27, 12); m.scale.set(1.4, 1, 0.4); g.add(m); }
  else if (mood === "neutral") { const smile = new THREE.Mesh(new THREE.TorusGeometry(0.045, 0.011, 8, 16, Math.PI), mouthM); smile.position.set(0, 1.44, 0.278); smile.rotation.z = Math.PI; g.add(smile); }
  else { const smile = new THREE.Mesh(new THREE.TorusGeometry(0.055, 0.012, 8, 16, Math.PI), mouthM); smile.position.set(0, 1.44, 0.276); smile.rotation.z = Math.PI; g.add(smile); }
  for (const x of [-0.17, 0.17]) { const ch = new THREE.Mesh(new THREE.CircleGeometry(0.035, 12), mat.basic(0xff9aa8, { transparent: true, opacity: 0.55 })); ch.position.set(x, 1.46, 0.262); ch.lookAt(x * 3, 1.46, 1.2); g.add(ch); }
  // hair
  const cap = sphere(0.315, hairM, 0, 1.58, -0.03, 24); cap.scale.set(1.02, 0.82, 1.02); g.add(cap);
  const fringe = box(0.5, 0.1, 0.12, hairM, 0, 1.75, 0.2); fringe.rotation.x = 0.35; g.add(fringe);
  if (hairStyle === "long") { for (const x of [-0.27, 0.27]) { const side = new THREE.Mesh(new THREE.CapsuleGeometry(0.075, 0.42, 4, 10), hairM); side.position.set(x, 1.32, -0.05); g.add(side); } const back = box(0.5, 0.5, 0.14, hairM, 0, 1.3, -0.24); g.add(back); }
  if (hairStyle === "ponytail") { const tail = new THREE.Mesh(new THREE.CapsuleGeometry(0.07, 0.4, 4, 10), hairM); tail.position.set(0, 1.35, -0.34); tail.rotation.x = 0.3; g.add(tail); g.add(torus(0.075, 0.02, mat.gloss(0xff3dd6), 0, 1.62, -0.3).rotateX(Math.PI / 2)); }
  if (hairStyle === "curly") { for (let i = 0; i < 12; i++) { const a = (i / 12) * Math.PI * 2; g.add(sphere(0.1, hairM, Math.cos(a) * 0.26, 1.66 + Math.sin(i) * 0.04, Math.sin(a) * 0.26 - 0.03, 10)); } }
  if (hairStyle === "bun") { g.add(sphere(0.12, hairM, 0, 1.9, -0.1, 14)); }
  if (hat) { const h = emojiSprite(hat, 0.6); h.position.set(0, 1.98, 0.05); g.add(h); }
  g.add(blobShadow(0.55, 0.4));
  let blinkT = rnd(1, 4);
  return { group: g, parts: { legL, legR, armL, armR, head, body }, walk(t, speed, dt = 0.016) {
    const s = Math.sin(t * 10) * Math.min(1, speed) * 0.6; legL.rotation.x = s; legR.rotation.x = -s; armL.rotation.x = -s; armR.rotation.x = s; body.position.y = 0.85 + Math.abs(Math.sin(t * 10)) * 0.04 * Math.min(1, speed);
    blinkT -= dt; const bl = blinkT < 0 ? Math.max(0.15, 1 - Math.sin(Math.min(1, -blinkT / 0.15) * Math.PI)) : 1; for (const e of eyeParts) e.scale.y = 1.1 * bl; if (blinkT < -0.15) blinkT = rnd(2, 5);
  } };
}

// ---- plush / claw prizes: distinct little shapes (not just spheres) --------
//  kind: bear | panda | frog | dino | octo | whale | star | gift | unicorn | duck
export const PLUSH_KINDS = ["bear", "panda", "frog", "dino", "octo", "whale", "star", "gift", "unicorn", "duck"];
export function makePlush(kind, s = 1) {
  const g = new THREE.Group(); const soft = (c) => mat.std(c, { roughness: 1 });
  const eye = (x, y, z, r = 0.035) => { g.add(sphere(r, mat.std(0x111111), x, y, z, 10)); g.add(sphere(r * 0.35, mat.basic(0xffffff), x + r * 0.3, y + r * 0.3, z + r * 0.8, 6)); };
  const smile = (y, z, r = 0.05, c = 0x5a2d2d) => { const m = new THREE.Mesh(new THREE.TorusGeometry(r, 0.012, 6, 12, Math.PI), mat.std(c)); m.position.set(0, y, z); m.rotation.z = Math.PI; g.add(m); };
  switch (kind) {
    case "bear": case "panda": {
      const body = kind === "panda" ? soft(0xffffff) : soft(0xc68642), dark = kind === "panda" ? soft(0x222222) : soft(0x8d5a2b);
      const b = sphere(0.2, body, 0, 0.2, 0); b.scale.set(1, 0.9, 0.85); g.add(b); g.add(sphere(0.17, body, 0, 0.47, 0.02));
      for (const x of [-0.12, 0.12]) { g.add(sphere(0.06, dark, x, 0.6, 0)); g.add(sphere(0.07, dark, x * 1.9, 0.14, 0.02)); g.add(sphere(0.06, dark, x * 0.9, 0.02, 0.09)); }
      if (kind === "panda") for (const x of [-0.06, 0.06]) { const p = sphere(0.04, dark, x, 0.49, 0.15); p.scale.set(1, 1.3, 0.6); g.add(p); }
      g.add(sphere(0.07, kind === "panda" ? soft(0xffffff) : soft(0xe6b980), 0, 0.42, 0.14)); g.add(sphere(0.025, mat.std(0x111), 0, 0.44, 0.2, 8));
      eye(-0.06, 0.5, 0.16, 0.022); eye(0.06, 0.5, 0.16, 0.022); break; }
    case "frog": {
      const b = sphere(0.22, soft(0x66bb6a), 0, 0.2, 0); b.scale.set(1.1, 0.8, 1); g.add(b);
      for (const x of [-0.12, 0.12]) { g.add(sphere(0.07, soft(0x66bb6a), x, 0.38, 0.06)); eye(x, 0.4, 0.11, 0.035); g.add(sphere(0.06, soft(0x4caf50), x * 1.9, 0.06, 0.1)); }
      smile(0.22, 0.2, 0.08); g.add(sphere(0.12, soft(0xc5e1a5), 0, 0.14, 0.14)); break; }
    case "dino": {
      const b = new THREE.Mesh(new THREE.CapsuleGeometry(0.16, 0.22, 6, 12), soft(0x7cb342)); b.position.set(0, 0.28, 0); b.rotation.x = 0.3; g.add(b);
      g.add(sphere(0.13, soft(0x7cb342), 0, 0.5, 0.1)); const tail = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.35, 8), soft(0x7cb342)); tail.position.set(0, 0.12, -0.25); tail.rotation.x = -1.9; g.add(tail);
      for (let i = 0; i < 4; i++) { const sp = new THREE.Mesh(new THREE.ConeGeometry(0.035, 0.08, 6), soft(0xffd54a)); sp.position.set(0, 0.6 - i * 0.12, -0.02 - i * 0.07); sp.rotation.x = -0.4; g.add(sp); }
      eye(-0.06, 0.53, 0.2, 0.03); eye(0.06, 0.53, 0.2, 0.03); g.add(sphere(0.1, soft(0xc5e1a5), 0, 0.26, 0.13)); for (const x of [-0.09, 0.09]) g.add(cyl(0.04, 0.05, 0.1, soft(0x7cb342), 8, x, 0.05, 0.02)); break; }
    case "octo": {
      g.add(sphere(0.2, soft(0xab47bc), 0, 0.3, 0)); for (let i = 0; i < 8; i++) { const a = (i / 8) * Math.PI * 2; const t = new THREE.Mesh(new THREE.CapsuleGeometry(0.035, 0.18, 4, 8), soft(0xab47bc)); t.position.set(Math.cos(a) * 0.14, 0.08, Math.sin(a) * 0.14); t.rotation.z = Math.cos(a) * 0.5; t.rotation.x = -Math.sin(a) * 0.5; g.add(t); }
      eye(-0.07, 0.32, 0.17, 0.03); eye(0.07, 0.32, 0.17, 0.03); smile(0.24, 0.19, 0.04); for (const x of [-0.14, 0.14]) g.add(sphere(0.03, mat.basic(0xf48fb1, { transparent: true, opacity: 0.8 }), x, 0.27, 0.14, 6)); break; }
    case "whale": {
      const b = sphere(0.22, soft(0x42a5f5), 0, 0.2, 0); b.scale.set(1, 0.75, 1.3); g.add(b); const belly = sphere(0.18, soft(0xe3f2fd), 0, 0.1, 0.06); belly.scale.set(1, 0.5, 1.2); g.add(belly);
      const tail = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.2, 8), soft(0x42a5f5)); tail.position.set(0, 0.2, -0.32); tail.rotation.x = -Math.PI / 2; g.add(tail); for (const x of [-0.07, 0.07]) { const fl = sphere(0.06, soft(0x42a5f5), x, 0.26, -0.42); fl.scale.set(1.2, 0.4, 1); g.add(fl); }
      eye(-0.12, 0.26, 0.2, 0.028); eye(0.12, 0.26, 0.2, 0.028); const spout = emojiSprite("💦", 0.18); spout.position.set(0, 0.45, 0.05); g.add(spout); break; }
    case "star": {
      const sh = new THREE.Shape(); for (let i = 0; i < 10; i++) { const r = i % 2 ? 0.11 : 0.24, a = (i / 10) * Math.PI * 2 - Math.PI / 2; i ? sh.lineTo(Math.cos(a) * r, Math.sin(a) * r) : sh.moveTo(Math.cos(a) * r, Math.sin(a) * r); } sh.closePath();
      const geo = new THREE.ExtrudeGeometry(sh, { depth: 0.1, bevelEnabled: true, bevelThickness: 0.04, bevelSize: 0.04, bevelSegments: 2 }); geo.center(); const st = new THREE.Mesh(geo, mat.gloss(0xffd54a, { emissive: 0xffb300, emissiveIntensity: 0.25 })); st.position.y = 0.26; g.add(st);
      eye(-0.06, 0.28, 0.1, 0.025); eye(0.06, 0.28, 0.1, 0.025); smile(0.2, 0.1, 0.035, 0xa65e00); break; }
    case "gift": {
      g.add(box(0.34, 0.3, 0.34, mat.gloss(0xef5350), 0, 0.15, 0)); g.add(box(0.36, 0.08, 0.36, mat.gloss(0xc62828), 0, 0.3, 0)); g.add(box(0.37, 0.4, 0.08, mat.gloss(0xffd54a), 0, 0.17, 0)); g.add(box(0.08, 0.4, 0.37, mat.gloss(0xffd54a), 0, 0.17, 0));
      for (const x of [-0.07, 0.07]) { const loop = torus(0.06, 0.02, mat.gloss(0xffd54a), x, 0.4, 0); loop.rotation.y = x < 0 ? 0.6 : -0.6; g.add(loop); } break; }
    case "unicorn": {
      g.add(sphere(0.2, soft(0xfce4ec), 0, 0.2, 0)); g.add(sphere(0.16, soft(0xfce4ec), 0, 0.45, 0.03));
      const horn = new THREE.Mesh(new THREE.ConeGeometry(0.04, 0.2, 8), mat.metal(0xffd76a)); horn.position.set(0, 0.68, 0.05); g.add(horn);
      for (const x of [-0.09, 0.09]) { const ear = new THREE.Mesh(new THREE.ConeGeometry(0.04, 0.1, 8), soft(0xfce4ec)); ear.position.set(x, 0.6, 0); g.add(ear); }
      [0xff8ac8, 0xbfeaff, 0xe6ccff, 0xfff8dc].forEach((c, i) => g.add(sphere(0.05, soft(c), -0.02 + i * 0.015, 0.6 - i * 0.06, -0.14, 8)));
      eye(-0.06, 0.47, 0.14, 0.024); eye(0.06, 0.47, 0.14, 0.024); smile(0.4, 0.15, 0.03); for (const x of [-0.1, 0.1]) g.add(cyl(0.04, 0.045, 0.1, soft(0xfce4ec), 8, x, 0.05, 0.02)); break; }
    case "duck": default: {
      const b = sphere(0.2, soft(0xffeb3b), 0, 0.18, 0); b.scale.set(1, 0.85, 1.15); g.add(b); g.add(sphere(0.14, soft(0xffeb3b), 0, 0.42, 0.1));
      const beak = new THREE.Mesh(new THREE.ConeGeometry(0.05, 0.1, 8), mat.gloss(0xff9800)); beak.position.set(0, 0.4, 0.24); beak.rotation.x = Math.PI / 2; g.add(beak);
      eye(-0.06, 0.46, 0.2, 0.022); eye(0.06, 0.46, 0.2, 0.022); const w = sphere(0.08, soft(0xffe082), 0, 0.2, -0.16); w.scale.set(1.2, 0.6, 1); g.add(w); break; }
  }
  g.scale.setScalar(s); g.userData.plush = kind; return g;
}
export const PLUSH_INFO = {
  bear: { name: "Teddy Bear", emoji: "🧸", v: 20, grip: 0.8 }, panda: { name: "Panda Plush", emoji: "🐼", v: 25, grip: 0.75 }, frog: { name: "Froggy", emoji: "🐸", v: 15, grip: 0.9 },
  dino: { name: "Dino Plush", emoji: "🦖", v: 30, grip: 0.7 }, octo: { name: "Octo Plush", emoji: "🐙", v: 20, grip: 0.85 }, whale: { name: "Whale Plush", emoji: "🐳", v: 22, grip: 0.8 },
  star: { name: "Star Squishy", emoji: "⭐", v: 45, grip: 0.55 }, gift: { name: "Mystery Gift", emoji: "🎁", v: 60, grip: 0.5 }, unicorn: { name: "Mini Unicorn", emoji: "🦄", v: 40, grip: 0.6 }, duck: { name: "Rubber Ducky", emoji: "🐤", v: 12, grip: 0.9 },
};
