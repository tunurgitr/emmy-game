// ==========================================================================
//  Emmy's Pizza Plus 3D — the toon kit.
//
//  Everything in Pizza Plus is cel-shaded (MeshToonMaterial with a chunky
//  3-step gradient) and wears a soft brown cartoon outline (an "inverted
//  hull": the same mesh, drawn inside-out and pushed out along its normals).
//  Shapes are rounded on purpose (rounded boxes, lathed "pills") so the
//  outlines stay smooth and everything looks like a squishy toy.
// ==========================================================================
import * as THREE from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
export { THREE };

export const LOW_TIER = (("ontouchstart" in window) || navigator.maxTouchPoints > 0) && !/Windows NT/.test(navigator.userAgent);
export const rnd = (a, b) => a + Math.random() * (b - a);
export const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
export const pick = (a) => a[Math.floor(Math.random() * a.length)];
export const approach = (v, t, k, dt) => v + (t - v) * Math.min(1, k * dt);
export const INK = 0x4a2a1a; // the outline colour: warm chocolate, never pure black

// --------------------------------------------------------------------------
//  Materials
// --------------------------------------------------------------------------
let GRAD = null;
export function gradientMap() {
  if (GRAD) return GRAD;
  const d = new Uint8Array([120, 200, 255]); // shadow, mid, lit — light shadows keep it cute
  GRAD = new THREE.DataTexture(d, d.length, 1, THREE.RedFormat); GRAD.minFilter = GRAD.magFilter = THREE.NearestFilter; GRAD.generateMipmaps = false; GRAD.needsUpdate = true;
  return GRAD;
}
const toonCache = new Map();
export function toon(color, { emissive = 0, map = null, transparent = false, opacity = 1, side = THREE.FrontSide } = {}) {
  const key = map ? null : `${color}|${emissive}|${transparent}|${opacity}|${side}`;
  if (key && toonCache.has(key)) return toonCache.get(key);
  const m = new THREE.MeshToonMaterial({ color, gradientMap: gradientMap(), emissive, map, transparent, opacity, side });
  if (key) toonCache.set(key, m); return m;
}
const OUTLINE_VS = `uniform float w;
#include <common>
#include <fog_pars_vertex>
void main() { vec4 mvPosition = modelViewMatrix * vec4(position, 1.0); vec3 n = normalize(normalMatrix * normal); mvPosition.xyz += n * w * clamp(-mvPosition.z, 1.5, 40.0); gl_Position = projectionMatrix * mvPosition;
#include <fog_vertex>
}`;
const OUTLINE_FS = `uniform vec3 color;
#include <common>
#include <fog_pars_fragment>
void main() { gl_FragColor = vec4(color, 1.0);
#include <colorspace_fragment>
#include <fog_fragment>
}`;
const olCache = new Map();
export function outlineMat(color = INK, w = 1) {
  const key = `${color}|${w}`; if (olCache.has(key)) return olCache.get(key);
  const m = new THREE.ShaderMaterial({ uniforms: THREE.UniformsUtils.merge([THREE.UniformsLib.fog, { color: { value: new THREE.Color(color) }, w: { value: 0.0042 * w } }]), vertexShader: OUTLINE_VS, fragmentShader: OUTLINE_FS, side: THREE.BackSide, fog: true });
  olCache.set(key, m); return m;
}

// --------------------------------------------------------------------------
//  Geometry — rounded and toy-like (cached so a town full of them is cheap)
// --------------------------------------------------------------------------
const geoCache = new Map();
const cached = (key, make) => { if (!geoCache.has(key)) geoCache.set(key, make()); return geoCache.get(key); };
export const rbox = (w, h, d, r = 0.12) => cached(`rb${w}|${h}|${d}|${r}`, () => new RoundedBoxGeometry(w, h, d, 3, Math.min(r, w / 2 - 0.001, h / 2 - 0.001, d / 2 - 0.001)));
export const ball = (r, ws = 22, hs = 16) => cached(`b${r}|${ws}`, () => new THREE.SphereGeometry(r, ws, hs));
export const capsule = (r, len) => cached(`c${r}|${len}`, () => new THREE.CapsuleGeometry(r, len, 6, 14));
export const torus = (R, r, arc = Math.PI * 2) => cached(`t${R}|${r}|${arc}`, () => new THREE.TorusGeometry(R, r, 12, 32, arc));
// a "pill": a cylinder (or cone) with rounded rims, lathed so its normals are smooth for the outline
export function pill(rTop, rBot, h, round = 0.08, seg = 28) {
  return cached(`p${rTop}|${rBot}|${h}|${round}|${seg}`, () => {
    const rr = Math.min(round, h / 2 - 0.001, rTop - 0.001, rBot - 0.001), pts = [new THREE.Vector2(0, -h / 2)];
    for (let i = 0; i <= 5; i++) { const a = -Math.PI / 2 + (i / 5) * (Math.PI / 2); pts.push(new THREE.Vector2(rBot - rr + Math.cos(a) * rr, -h / 2 + rr + Math.sin(a) * rr)); }
    for (let i = 0; i <= 5; i++) { const a = (i / 5) * (Math.PI / 2); pts.push(new THREE.Vector2(rTop - rr + Math.cos(a) * rr, h / 2 - rr + Math.sin(a) * rr)); }
    pts.push(new THREE.Vector2(0, h / 2)); return new THREE.LatheGeometry(pts, seg);
  });
}
// a rounded triangle slab (pizza slices!) — extruded with a bevel
export function sliceGeo(len = 1, wid = 0.9, th = 0.14) {
  return cached(`s${len}|${wid}|${th}`, () => { const s = new THREE.Shape(); const r = 0.08; s.moveTo(0, -len / 2 + r); s.lineTo(wid / 2 - r, len / 2 - r); s.quadraticCurveTo(wid / 2, len / 2, wid / 2 - r * 2, len / 2); s.lineTo(-wid / 2 + r * 2, len / 2); s.quadraticCurveTo(-wid / 2, len / 2, -wid / 2 + r, len / 2 - r); s.lineTo(0, -len / 2 + r);
    const g = new THREE.ExtrudeGeometry(s, { depth: th, bevelEnabled: true, bevelThickness: 0.05, bevelSize: 0.05, bevelSegments: 3, curveSegments: 6 }); g.translate(0, 0, -th / 2); g.computeVertexNormals(); return g; });
}

// a mesh with its outline (ol = outline thickness multiplier, 0 = none)
export function part(geo, color, { ol = 1, olColor = INK, x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0, s = 1, sx, sy, sz, emissive = 0, mat = null } = {}) {
  const m = new THREE.Mesh(geo, mat || toon(color, { emissive })); m.position.set(x, y, z); m.rotation.set(rx, ry, rz); m.scale.set(sx ?? s, sy ?? s, sz ?? s);
  if (ol) { const o = new THREE.Mesh(geo, outlineMat(olColor, ol)); o.userData.outline = true; o.raycast = () => {}; m.add(o); }
  return m;
}
export function group(...kids) { const g = new THREE.Group(); kids.forEach((k) => k && g.add(k)); return g; }

// --------------------------------------------------------------------------
//  Cute faces — a canvas sticker that blinks
// --------------------------------------------------------------------------
const faceCache = new Map();
export function faceTexture(mood = "happy", closed = false, { blush = true, eye = "#3a1d12" } = {}) {
  const key = `${mood}|${closed}|${blush}|${eye}`; if (faceCache.has(key)) return faceCache.get(key);
  const c = document.createElement("canvas"); c.width = c.height = 256; const g = c.getContext("2d"); g.lineCap = g.lineJoin = "round";
  const ex = 62, ey = 112;
  if (blush) { g.fillStyle = "rgba(255,120,150,.55)"; for (const s of [-1, 1]) { g.beginPath(); g.ellipse(128 + s * 92, 150, 26, 15, 0, 0, 7); g.fill(); } }
  g.fillStyle = eye; g.strokeStyle = eye; g.lineWidth = 12;
  for (const s of [-1, 1]) {
    const x = 128 + s * ex;
    if (closed || mood === "sleep") { g.beginPath(); g.arc(x, ey, 20, Math.PI * 0.15, Math.PI * 0.85); g.stroke(); continue; }
    if (mood === "joy") { g.beginPath(); g.arc(x, ey + 10, 22, Math.PI * 1.15, Math.PI * 1.85); g.stroke(); continue; }
    g.beginPath(); g.ellipse(x, ey, 19, 25, 0, 0, 7); g.fill(); g.fillStyle = "#fff"; g.beginPath(); g.arc(x - 6, ey - 9, 7, 0, 7); g.fill(); g.beginPath(); g.arc(x + 6, ey + 7, 3.5, 0, 7); g.fill(); g.fillStyle = eye;
    if (mood === "grumpy") { g.lineWidth = 10; g.beginPath(); g.moveTo(x - 24 * s * -1, ey - 42); g.lineTo(x + 20 * s * -1, ey - 30); g.stroke(); g.lineWidth = 12; }
  }
  g.lineWidth = 11;
  if (mood === "wow") { g.fillStyle = "#7a2a2a"; g.beginPath(); g.ellipse(128, 170, 18, 22, 0, 0, 7); g.fill(); }
  else if (mood === "grumpy") { g.beginPath(); g.arc(128, 188, 26, Math.PI * 1.2, Math.PI * 1.8); g.stroke(); }
  else { g.fillStyle = "#7a2a2a"; g.beginPath(); g.moveTo(98, 158); g.quadraticCurveTo(128, 205, 158, 158); g.closePath(); g.fill(); g.stroke(); g.fillStyle = "#ff8aa0"; g.beginPath(); g.ellipse(128, 180, 13, 7, 0, 0, 7); g.fill(); }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; faceCache.set(key, t); return t;
}
const blinkers = new Set();
export function makeFace(size = 1, mood = "happy", opts = {}) {
  const open = faceTexture(mood, false, opts), shut = faceTexture(mood, true, opts);
  const m = new THREE.Mesh(new THREE.PlaneGeometry(size, size), new THREE.MeshBasicMaterial({ map: open, transparent: true, alphaTest: 0.4, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -4 }));
  m.renderOrder = 2; m.userData.face = { open, shut, t: rnd(1, 4), mood, opts }; blinkers.add(m); m.raycast = () => {};
  m.setMood = (md) => { m.userData.face.open = faceTexture(md, false, opts); m.userData.face.shut = faceTexture(md, true, opts); m.material.map = m.userData.face.open; };
  return m;
}
export function updateBlinks(dt) { for (const m of blinkers) { const f = m.userData.face; f.t -= dt; if (f.t < 0) { m.material.map = f.shut; if (f.t < -0.13) { m.material.map = f.open; f.t = rnd(2, 5); } } } }
export function forgetFace(root) { root.traverse((o) => blinkers.delete(o)); }

// --------------------------------------------------------------------------
//  Canvas textures: signs, checkers, soft shadows
// --------------------------------------------------------------------------
export function canvasTex(w, h, draw, repeat = 1) { const c = document.createElement("canvas"); c.width = w; c.height = h; draw(c.getContext("2d"), w, h); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(repeat, repeat); t.anisotropy = 4; return t; }
export function signTex(lines, { w = 512, h = 160, bg = "#fff4d6", fg = "#a3271b", size = 64, stroke = "#4a2a1a", border = 14 } = {}) {
  return canvasTex(w, h, (g) => {
    g.fillStyle = stroke; rrect(g, 0, 0, w, h, h * 0.3); g.fill(); g.fillStyle = bg; rrect(g, border, border, w - border * 2, h - border * 2, h * 0.24); g.fill();
    const L = Array.isArray(lines) ? lines : [lines]; g.textAlign = "center"; g.textBaseline = "middle";
    L.forEach((s, i) => { const sz = i ? size * 0.6 : size; g.font = `900 ${sz}px system-ui, "Segoe UI", sans-serif`; let f = sz; while (g.measureText(s).width > w - 50 && f > 12) { f -= 2; g.font = `900 ${f}px system-ui, sans-serif`; } g.fillStyle = fg; g.fillText(s, w / 2, h / 2 + (i - (L.length - 1) / 2) * size * 0.95); });
  });
}
export function rrect(g, x, y, w, h, r) { g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); }
export function signBoard(lines, w, h, opts = {}) {
  const tex = signTex(lines, { w: 512, h: Math.round((512 * h) / w), ...opts }); tex.wrapS = tex.wrapT = THREE.ClampToEdgeWrapping;
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: tex, transparent: true, alphaTest: 0.2 })); m.raycast = () => {}; return m;
}
let shadowTex = null;
export function blobShadow(r = 0.6, op = 0.28) {
  if (!shadowTex) shadowTex = canvasTex(128, 128, (g) => { const gr = g.createRadialGradient(64, 64, 4, 64, 64, 62); gr.addColorStop(0, "rgba(90,40,20,1)"); gr.addColorStop(1, "rgba(90,40,20,0)"); g.fillStyle = gr; g.fillRect(0, 0, 128, 128); });
  const m = new THREE.Mesh(new THREE.PlaneGeometry(r * 2, r * 2), new THREE.MeshBasicMaterial({ map: shadowTex, transparent: true, opacity: op, depthWrite: false })); m.rotation.x = -Math.PI / 2; m.position.y = 0.02; m.raycast = () => {}; return m;
}
// an emoji (or any glyph) on a camera-facing sprite
const emoCache = new Map();
export function emojiTex(ch) { if (emoCache.has(ch)) return emoCache.get(ch); const t = canvasTex(128, 128, (g) => { g.font = `100px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif`; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText(ch, 64, 70); }); t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping; emoCache.set(ch, t); return t; }
export function emojiSprite(ch, s = 1) { const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: emojiTex(ch), transparent: true, depthWrite: false })); sp.scale.set(s, s, s); return sp; }

// --------------------------------------------------------------------------
//  Lights — a cosy warm key light + sky fill, no shadow maps (blob shadows instead)
// --------------------------------------------------------------------------
export function addLights(scene, { key = 2.3, fill = 1.25 } = {}) {
  const hemi = new THREE.HemisphereLight(0xfff3e0, 0xffc7a8, fill); scene.add(hemi);
  const sun = new THREE.DirectionalLight(0xfff6e8, key); sun.position.set(6, 12, 8); scene.add(sun);
  return { hemi, sun };
}

// --------------------------------------------------------------------------
//  Little pizza bits used all over town
// --------------------------------------------------------------------------
export const COL = { tomato: 0xf2483a, cheese: 0xffd23f, cheeseDeep: 0xf5b52a, basil: 0x4dbb5a, crust: 0xe8b26a, crustDeep: 0xc9894a, cream: 0xfff4dc, pepperoni: 0xd8343a, olive: 0x3b3346, mushroom: 0xf1e2cc, sky: 0xbfe8ff, pink: 0xff86b3, purple: 0x9a6bff, soda: 0xff5a5f, mint: 0x7fe3c4, gold: 0xffc93c, white: 0xffffff, brick: 0xd96b4a };
export function makePizza(r = 1, { slices = 0, toppings = true } = {}) {
  const g = new THREE.Group();
  g.add(part(pill(r, r, 0.16 * r + 0.05, 0.07 * r + 0.02), COL.crust, { ol: 1 }));
  g.add(part(pill(r * 0.86, r * 0.86, 0.06, 0.02), COL.tomato, { ol: 0, y: 0.075 * r + 0.03 }));
  g.add(part(pill(r * 0.8, r * 0.8, 0.06, 0.02), COL.cheese, { ol: 0, y: 0.085 * r + 0.045 }));
  if (toppings) for (let i = 0; i < 7; i++) { const a = i * 2.4 + 0.3, d = r * (i % 3 === 0 ? 0.25 : 0.55); g.add(part(pill(r * 0.13, r * 0.13, 0.04, 0.015), COL.pepperoni, { ol: 0.6, x: Math.cos(a) * d, z: Math.sin(a) * d, y: 0.09 * r + 0.07 })); }
  if (toppings) for (let i = 0; i < 4; i++) { const a = i * 1.6 + 1.1, d = r * 0.42; g.add(part(ball(r * 0.07, 10, 8), COL.basil, { ol: 0.5, x: Math.cos(a) * d, z: Math.sin(a) * d, y: 0.09 * r + 0.08, sy: 0.4 })); }
  mergeStatic(g); return g;
}
export function makeCoin(s = 1) {
  const g = new THREE.Group(); const c = part(pill(0.36 * s, 0.36 * s, 0.12 * s, 0.05 * s), COL.gold, { ol: 1, rx: Math.PI / 2, emissive: 0x3a2400 }); g.add(c);
  const star = new THREE.Mesh(new THREE.PlaneGeometry(0.45 * s, 0.45 * s), new THREE.MeshBasicMaterial({ map: emojiTex("🍕"), transparent: true, depthWrite: false })); star.position.z = 0.075 * s; g.add(star); const s2 = star.clone(); s2.rotation.y = Math.PI; s2.position.z = -0.075 * s; g.add(s2);
  mergeStatic(g); return g;
}

// --------------------------------------------------------------------------
//  Merge everything that never moves into one mesh per material (way fewer
//  draw calls on an iPad). Tag anything that animates with dyn(obj) first.
// --------------------------------------------------------------------------
export const dyn = (o) => { o.userData.dyn = true; return o; };
export function mergeStatic(root) {
  root.updateMatrixWorld(true); const inv = new THREE.Matrix4().copy(root.matrixWorld).invert();
  const ok = new Set();
  root.traverse((o) => { if (!o.isMesh || o.userData.outline || o.userData.face) return; for (let p = o; p && p !== root; p = p.parent) if (p.userData.dyn) return; if (o.children.some((c) => !c.userData.outline)) return; if (o.material.colorWrite === false) return; ok.add(o); });
  const buckets = new Map();
  for (const o of ok) for (const m of [o, ...o.children.filter((c) => c.userData.outline)]) { const k = m.material.uuid; if (!buckets.has(k)) buckets.set(k, { mat: m.material, list: [] }); buckets.get(k).list.push(m); }
  let merged = 0;
  for (const { mat, list } of buckets.values()) {
    if (list.length < 2) continue;
    const geos = list.map((m) => { let g = m.geometry.index ? m.geometry.toNonIndexed() : m.geometry.clone(); for (const k of Object.keys(g.attributes)) if (!["position", "normal", "uv"].includes(k)) g.deleteAttribute(k); if (!g.attributes.uv) g.setAttribute("uv", new THREE.Float32BufferAttribute(new Float32Array(g.attributes.position.count * 2), 2)); g.applyMatrix4(new THREE.Matrix4().multiplyMatrices(inv, m.matrixWorld)); return g; });
    const geo = mergeGeometries(geos, false); geos.forEach((g) => g.dispose()); if (!geo) continue;
    const mesh = new THREE.Mesh(geo, mat); mesh.raycast = () => {}; if (list[0].userData.outline) mesh.renderOrder = list[0].renderOrder; root.add(mesh); merged += list.length;
    for (const m of list) m.userData.mergedAway = true;
  }
  for (const o of ok) {
    if (o.userData.mergedAway) { for (const c of [...o.children]) if (!c.userData.mergedAway) root.attach(c); o.parent && o.parent.remove(o); }
    else for (const c of [...o.children]) if (c.userData.mergedAway) o.remove(c);
  }
  return merged;
}
