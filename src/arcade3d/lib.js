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
export function makeParticles(scene, max = 300) {
  const geo = new THREE.BufferGeometry(); const pos = new Float32Array(max * 3), col = new Float32Array(max * 3);
  geo.setAttribute("position", new THREE.BufferAttribute(pos, 3)); geo.setAttribute("color", new THREE.BufferAttribute(col, 3));
  const pts = new THREE.Points(geo, new THREE.PointsMaterial({ size: 0.12, vertexColors: true, transparent: true, opacity: 0.95, sizeAttenuation: true, depthWrite: false })); pts.frustumCulled = false; scene.add(pts);
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

// ---- a little kid character (used in the arcade + laser tag friends) -------
export function makeKid({ shirt = 0xff3dd6, pants = 0x3d8bfd, skin = 0xffd6b8, hair = 0x6b3e1e, face = "😊" } = {}) {
  const g = new THREE.Group();
  const legL = cyl(0.11, 0.1, 0.5, mat.std(pants), 12, -0.14, 0.25, 0), legR = legL.clone(); legR.position.x = 0.14; g.add(legL, legR);
  const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.28, 0.42, 6, 14), mat.std(shirt)); body.position.y = 0.85; g.add(body);
  const armL = cyl(0.07, 0.06, 0.5, mat.std(shirt), 10, -0.38, 0.85, 0), armR = armL.clone(); armR.position.x = 0.38; g.add(armL, armR);
  const head = sphere(0.3, mat.std(skin), 0, 1.5, 0); g.add(head);
  const hairM = sphere(0.31, mat.std(hair), 0, 1.58, -0.04); hairM.scale.set(1, 0.7, 1); g.add(hairM);
  const faceS = emojiSprite(face, 0.4); faceS.position.set(0, 1.48, 0.3); g.add(faceS);
  g.add(blobShadow(0.55, 0.4));
  return { group: g, parts: { legL, legR, armL, armR, head, body }, walk(t, speed) { const s = Math.sin(t * 10) * Math.min(1, speed) * 0.6; legL.rotation.x = s; legR.rotation.x = -s; armL.rotation.x = -s; armR.rotation.x = s; body.position.y = 0.85 + Math.abs(Math.sin(t * 10)) * 0.04 * Math.min(1, speed); } };
}
