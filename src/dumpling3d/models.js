// ==========================================================================
//  Emmy's Dumpling Town — procedural 3D squishy dumplings (no model files).
//
//  Every dumpling is a parametric "dough" surface (lathe or crescent) with
//  hand-made wobble, pleats, a kawaii face and toppings — all baked into the
//  group's own space so the whole thing can be squished on the CPU (slow
//  rise!) and sliced in half with clipping planes to peek at the filling.
// ==========================================================================
import { THREE, rnd, LOW_TIER, mergeStatic } from "../arcade3d/lib.js";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";

const TAU = Math.PI * 2;
const V3 = THREE.Vector3;
const sat = (x) => Math.max(0, Math.min(1, x));
const smooth = (a, b, x) => { const t = sat((x - a) / (b - a)); return t * t * (3 - 2 * t); };
const angDist = (a, b) => { let d = (a - b) % TAU; if (d > Math.PI) d -= TAU; if (d < -Math.PI) d += TAU; return d; };
function hash(str) { let h = 2166136261; for (const c of str) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; }
function rng(seed) { let s = seed >>> 0 || 1; return () => ((s = (Math.imul(s, 1664525) + 1013904223) >>> 0) / 4294967296); }

// ---- textures --------------------------------------------------------------
const texCache = new Map();
function canvasTex(key, size, draw, { repeat = 1, srgb = true } = {}) {
  if (texCache.has(key)) return texCache.get(key);
  const c = document.createElement("canvas"); c.width = c.height = size; draw(c.getContext("2d"), size);
  const t = new THREE.CanvasTexture(c); if (srgb) t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(repeat, repeat); t.anisotropy = 4; texCache.set(key, t); return t;
}
const css = (c) => `#${new THREE.Color(c).getHexString()}`;
// fine pores in the dough (bump)
const poreTex = () => canvasTex("pores", 256, (g, n) => { g.fillStyle = "#808080"; g.fillRect(0, 0, n, n); for (let i = 0; i < 3000; i++) { const v = (128 + rnd(-46, 40)) | 0; g.fillStyle = `rgb(${v},${v},${v})`; g.beginPath(); g.arc(rnd(0, n), rnd(0, n), rnd(0.4, 1.8), 0, TAU); g.fill(); } }, { repeat: 4, srgb: false });
// flour / sugar dusting (mochi)
const flourTex = () => canvasTex("flour", 256, (g, n) => { g.fillStyle = "#f2f2f2"; g.fillRect(0, 0, n, n); for (let i = 0; i < 2200; i++) { g.fillStyle = `rgba(255,255,255,${rnd(0.4, 1)})`; g.beginPath(); g.arc(rnd(0, n), rnd(0, n), rnd(0.5, 2.2), 0, TAU); g.fill(); } }, { repeat: 3 });
// sparkle flakes suspended in the skin
const glitterTex = (key, cols) => canvasTex(`glit:${key}`, 256, (g, n) => { g.fillStyle = "#ffffff"; g.fillRect(0, 0, n, n); for (let i = 0; i < 1400; i++) { g.fillStyle = cols[i % cols.length]; const s = rnd(1, 3.2); g.save(); g.translate(rnd(0, n), rnd(0, n)); g.rotate(rnd(0, 3)); g.fillRect(-s / 2, -s / 2, s, s); g.restore(); } }, { repeat: 3 });
const chipTex = () => canvasTex("chips", 256, (g, n) => { g.fillStyle = "#ffffff"; g.fillRect(0, 0, n, n); for (let i = 0; i < 70; i++) { g.fillStyle = i % 3 ? "#3b2216" : "#5a331f"; g.beginPath(); g.ellipse(rnd(0, n), rnd(0, n), rnd(3, 7), rnd(2.5, 5), rnd(0, 3), 0, TAU); g.fill(); } }, { repeat: 2 });
function galaxyTex() { return canvasTex("galaxy", 512, (g, n) => {
  g.fillStyle = "#1a1040"; g.fillRect(0, 0, n, n);
  for (const [c, k] of [["#6b2fd6", 9], ["#ff3dd6", 6], ["#2f80ed", 7], ["#00e5ff", 3]]) for (let i = 0; i < k; i++) { const x = rnd(0, n), y = rnd(0, n), r = rnd(50, 140); const gr = g.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, c + "aa"); gr.addColorStop(1, c + "00"); g.fillStyle = gr; g.fillRect(0, 0, n, n); }
  for (let i = 0; i < 500; i++) { g.fillStyle = `rgba(255,255,255,${rnd(0.4, 1)})`; g.beginPath(); g.arc(rnd(0, n), rnd(0, n), rnd(0.4, 1.6), 0, TAU); g.fill(); }
}, { repeat: 1 }); }
const starTex = () => canvasTex("stars", 512, (g, n) => { g.fillStyle = "#000"; g.fillRect(0, 0, n, n); for (let i = 0; i < 260; i++) { g.fillStyle = `rgba(255,255,255,${rnd(0.5, 1)})`; g.beginPath(); g.arc(rnd(0, n), rnd(0, n), rnd(0.5, 1.8), 0, TAU); g.fill(); } });

// ---- surfaces --------------------------------------------------------------
// grid surface: fn(u, v) → [x, y, z, accent?]; u ∈ [0,1] wraps around, v ∈ [0,1] runs pole → pole
let LOD = 1; // < 1 builds lighter meshes (shelf displays, the catch game)
function surf(fn, nu = 96, nv = 56) {
  nu = Math.max(16, Math.round(nu * LOD)); nv = Math.max(10, Math.round(nv * LOD));
  const n = (nu + 1) * (nv + 1), pos = new Float32Array(n * 3), uv = new Float32Array(n * 2), acc = new Float32Array(n), idx = [];
  let k = 0;
  for (let j = 0; j <= nv; j++) for (let i = 0; i <= nu; i++, k++) { const p = fn(i / nu, j / nv); pos[k * 3] = p[0]; pos[k * 3 + 1] = p[1]; pos[k * 3 + 2] = p[2]; acc[k] = p[3] || 0; uv[k * 2] = i / nu; uv[k * 2 + 1] = j / nv; }
  for (let j = 0; j < nv; j++) for (let i = 0; i < nu; i++) { const a = j * (nu + 1) + i, b = a + 1, c = a + nu + 1, d = c + 1; idx.push(a, b, d, a, d, c); }
  const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.BufferAttribute(pos, 3)); g.setAttribute("uv", new THREE.BufferAttribute(uv, 2)); g.setIndex(idx); g.userData.accent = acc;
  // make sure the normals point outward (flip the winding if the parametrisation ran the other way)
  g.computeVertexNormals(); g.computeBoundingBox(); const ctr = g.boundingBox.getCenter(new V3()); let dot = 0; const nn = g.attributes.normal;
  for (let i = 0; i < n; i += 7) dot += (pos[i * 3] - ctr.x) * nn.getX(i) + (pos[i * 3 + 1] - ctr.y) * nn.getY(i) + (pos[i * 3 + 2] - ctr.z) * nn.getZ(i);
  if (dot < 0) { const ix = g.index.array; for (let i = 0; i < ix.length; i += 3) { const t = ix[i + 1]; ix[i + 1] = ix[i + 2]; ix[i + 2] = t; } g.index.needsUpdate = true; }
  finishNormals(g); return g;
}
// vertices sharing a position (seams, poles) get one averaged normal so the dough looks seamless
function seamGroups(g) { const p = g.attributes.position, map = new Map(); for (let i = 0; i < p.count; i++) { const k = `${Math.round(p.getX(i) * 1e4)},${Math.round(p.getY(i) * 1e4)},${Math.round(p.getZ(i) * 1e4)}`; const a = map.get(k); a ? a.push(i) : map.set(k, [i]); } return [...map.values()].filter((a) => a.length > 1); }
function finishNormals(g) {
  g.computeVertexNormals(); const n = g.attributes.normal; const groups = g.userData.seams || (g.userData.seams = seamGroups(g));
  for (const ids of groups) { let x = 0, y = 0, z = 0; for (const i of ids) { x += n.getX(i); y += n.getY(i); z += n.getZ(i); } const l = Math.hypot(x, y, z) || 1; for (const i of ids) n.setXYZ(i, x / l, y / l, z / l); }
  n.needsUpdate = true;
}
// lathe body from an [r, y] profile (bottom → top) with a shaper (th, v, r, y) → [r, y, accent]
function lathe(pts, shaper, nu = 112, nv = 64) {
  const curve = new THREE.SplineCurve(pts.map(([r, y]) => new THREE.Vector2(r, y)));
  let lv = -1, lp = null;
  return surf((u, v) => { if (v !== lv) { lp = curve.getPointAt(v); lv = v; } const th = u * TAU; let r = Math.max(0, lp.x), y = lp.y, a = 0; if (shaper) [r, y, a = 0] = shaper(th, v, r, y); return [Math.cos(th) * r, y, -Math.sin(th) * r, a]; }, nu, nv);
}
// crescent family: a squashed spindle bent round a centre, pinched into a crest along the top, optional pleats
function crescent({ len = 1.2, h = 0.5, w = 0.5, bend = 1.0, pleats = 0, pAmp = 0.07, crest = 0.16, flat = 0.32, lift = 0 }, rand) {
  const ph = rand() * 6;
  return surf((u, v) => {
    const t = Math.PI * v, s = Math.sin(t), xl = -Math.cos(t), body = Math.pow(s, 0.9);
    const th = u * TAU, c = Math.cos(th), sn = Math.sin(th);
    const top = sat(c);
    let Y = c * body * h, Z = sn * body * w * (1 - 0.82 * Math.pow(top, 1.3)); if (c < 0) Y *= flat; // teardrop cross-section: wide base…
    Y += crest * Math.pow(top, 9) * body;                  // …pinched up into a thin raised seam
    if (pleats) { const ridge = Math.pow(Math.abs(Math.sin(xl * Math.PI * pleats * 0.5 + ph)), 0.5); const m = smooth(0.3, 0.85, c) * smooth(-0.2, 0.3, sn) * body; Z += pAmp * m * ridge; Y += pAmp * 0.9 * Math.pow(top, 6) * ridge * body; }
    Y += 0.018 * Math.sin(xl * 5 + ph) * body; Z *= 1 + 0.03 * Math.sin(xl * 3.3 + ph * 2);   // hand-made unevenness
    Y += lift * Math.pow(Math.abs(xl), 2.5);              // ends curl up (gold ingot)
    const a = xl * bend, Rc = len / bend;                  // bend the spindle round an arc (half-length = len)
    return [Math.sin(a) * (Rc + Z), Y, Math.cos(a) * (Rc + Z) - Rc];
  }, 96, 84);
}
function groundIt(g) { g.computeBoundingBox(); g.translate(0, -g.boundingBox.min.y, 0); g.computeBoundingBox(); return g; }

// ---- shapes ----------------------------------------------------------------
//  build(rand) → { body, H, faceY, extra?(group, body, mats, kind) , accent? }
const lump = (rand) => { const a = rand() * 6, b = rand() * 6; return (th, v) => 1 + 0.028 * Math.sin(2 * th + a) * Math.sin(Math.PI * v) + 0.016 * Math.sin(5 * th + b + 3 * v); };
export const SHAPES = {
  xlb: { name: "Swirly Soup Bao", build(rand) {
    const L = lump(rand), tw = 0.6 + rand() * 0.4;
    const body = lathe([[0, 0], [0.55, 0], [0.88, 0.05], [1.0, 0.2], [0.98, 0.36], [0.86, 0.52], [0.64, 0.66], [0.4, 0.77], [0.2, 0.85], [0.09, 0.92], [0.05, 0.98], [0, 1.0]],
      (th, v, r, y) => { const a = smooth(0.4, 0.93, v) * 0.18; const ridge = Math.pow(Math.abs(Math.sin(9 * (th + tw * v * 2.2))), 0.55); return [r * (1 - a * (1 - ridge)) * L(th, v), y + a * 0.14 * ridge]; });
    return { body: groundIt(body), faceY: 0.3 };
  } },
  bao: { name: "Puffy Bao Bun", build(rand) {
    const L = lump(rand), rot = rand() * TAU;
    // a split top that shows the filling peeking out (accent = filling colour)
    const body = lathe([[0, 0], [0.7, 0], [0.98, 0.06], [1.06, 0.24], [1.0, 0.45], [0.82, 0.64], [0.52, 0.78], [0.22, 0.85], [0, 0.86]],
      (th, v, r, y) => { let crack = 0; for (let k = 0; k < 3; k++) crack = Math.max(crack, Math.exp(-((angDist(th, rot + (k * TAU) / 3) / 0.13) ** 2))); const m = smooth(0.72, 0.98, v) * crack; return [r * L(th, v), y - m * 0.07, smooth(0.25, 0.6, m)]; });
    return { body: groundIt(body), faceY: 0.32 };
  } },
  momo: { name: "Topknot Momo", build(rand) {
    const L = lump(rand);
    const body = lathe([[0, 0], [0.6, 0], [0.9, 0.06], [0.98, 0.22], [0.92, 0.42], [0.74, 0.6], [0.48, 0.76], [0.26, 0.9], [0.12, 1.02], [0.06, 1.1], [0, 1.13]],
      (th, v, r, y) => { const a = smooth(0.3, 0.9, v) * 0.2; const ridge = Math.pow(Math.abs(Math.sin(8 * (th + v * 3.4))), 0.5); return [r * (1 - a * (1 - ridge)) * L(th, v), y + a * 0.1 * ridge]; });
    return { body: groundIt(body), faceY: 0.3 };
  } },
  tangyuan: { name: "Bouncy Tangyuan", force: "glossy", build(rand) {
    const L = lump(rand);
    const body = lathe([[0, 0], [0.55, 0.01], [0.88, 0.12], [1.0, 0.36], [0.96, 0.6], [0.74, 0.82], [0.4, 0.94], [0, 0.98]], (th, v, r, y) => [r * L(th, v) * 0.92, y * 0.95]);
    return { body: groundIt(body), faceY: 0.36 };
  } },
  mochi: { name: "Snowy Mochi", force: "powder", stretchy: true, build(rand) {
    const L = lump(rand);
    const body = lathe([[0, 0], [0.72, 0.0], [0.98, 0.12], [1.04, 0.3], [0.9, 0.52], [0.6, 0.66], [0.3, 0.72], [0, 0.73]], (th, v, r, y) => [r * L(th, v), y]);
    return { body: groundIt(body), faceY: 0.26 };
  } },
  shumai: { name: "Flower Shumai", build(rand) {
    const ph = rand() * 6;
    // an open cup: frilly flared rim, gathered waist — the filling dome sits in the top
    const body = lathe([[0, 0], [0.5, 0], [0.66, 0.03], [0.72, 0.18], [0.67, 0.4], [0.62, 0.55], [0.7, 0.68], [0.86, 0.78], [0.92, 0.8]],
      (th, v, r, y) => { const rim = smooth(0.62, 1, v); const waist = smooth(0.25, 0.5, v) * (1 - smooth(0.7, 0.9, v)); return [r * (1 + 0.09 * Math.sin(11 * th + ph) * rim - 0.05 * Math.pow(Math.abs(Math.sin(7 * th + ph)), 3) * waist), y + 0.05 * Math.sin(11 * th + ph + 1) * rim]; }, 112, 48);
    return { body: groundIt(body), faceY: 0.26, open: true,
      extra(g, b, m) { const dome = new THREE.Mesh(new THREE.SphereGeometry(0.66, 48, 24, 0, TAU, 0, Math.PI / 2), m.fill); dome.scale.set(1, 0.32, 1); dome.position.y = 0.66; dome.userData.section = true; bake(g, dome);
        const roe = new THREE.Mesh(new THREE.SphereGeometry(0.11, 20, 12), m.roe); roe.scale.y = 0.6; roe.position.y = 0.87; bake(g, roe); } };
  } },
  wonton: { name: "Frilly Wonton", build(rand) {
    const L = lump(rand), ph = rand() * 6;
    const body = lathe([[0, 0], [0.4, 0.0], [0.56, 0.12], [0.6, 0.32], [0.48, 0.52], [0.24, 0.62], [0, 0.64]], (th, v, r, y) => [r * L(th, v), y]);
    groundIt(body);
    return { body, faceY: 0.24,
      extra(g, b, m) { // the ruffled wrapper skirt draped over the filling
        const sheet = surf((u, v) => { const th = u * TAU; const sq = 1 / Math.pow(Math.max(Math.abs(Math.cos(th + 0.785)), Math.abs(Math.sin(th + 0.785))), 0.55); const r = (0.16 + v * 0.86) * (1 + 0.18 * (sq - 1)); const y = 0.52 - 0.42 * Math.pow(v, 1.5) + 0.07 * Math.sin(3 * th + ph) * v + 0.06 * Math.sin(9 * th + ph) * v * v; return [Math.cos(th) * r, Math.max(0.02, y), -Math.sin(th) * r]; }, 128, 22);
        const s = new THREE.Mesh(sheet, m.sheet); s.userData.skin = true; bake(g, s); } };
  } },
  gyoza: { name: "Crescent Gyoza", build(rand) { return { body: groundIt(crescent({ pleats: 7, pAmp: 0.09, bend: 1.0, len: 1.3, h: 0.62 }, rand)), faceY: 0.24, crescent: true }; } },
  potsticker: { name: "Crispy Potsticker", crispy: true, build(rand) { return { body: groundIt(crescent({ pleats: 6, pAmp: 0.08, bend: 0.75, flat: 0.1, h: 0.62, len: 1.35, w: 0.56 }, rand)), faceY: 0.24, crescent: true }; } },
  hargow: { name: "Crystal Har Gow", force: "crystal", build(rand) {
    const shape = { pleats: 10, pAmp: 0.07, bend: 1.1, h: 0.66, w: 0.56, crest: 0.18, len: 1.15 };
    const r2 = rng(Math.floor(rand() * 1e9));
    return { body: groundIt(crescent(shape, rand)), faceY: 0.25, crescent: true,
      extra(g, b, m) { // the plump filling you can see through the skin
        const inner = crescent({ ...shape, pleats: 0, crest: 0.02, h: 0.48, w: 0.42, len: 0.95 }, r2); groundIt(inner).translate(0, 0.06, 0);
        const mesh = new THREE.Mesh(inner, m.fill); mesh.userData.noSquishNormals = true; bake(g, mesh); } };
  } },
};
SHAPES.peach = { name: "Peach Bun", blush: true, build(rand) {
  const L = lump(rand);
  // a longevity peach bun: pointy tip, a crease down one side, a pink blush on top and two leaves
  const body = lathe([[0, 0], [0.6, 0], [0.92, 0.1], [1.0, 0.32], [0.94, 0.56], [0.74, 0.78], [0.46, 0.96], [0.2, 1.1], [0.04, 1.2], [0, 1.22]],
    (th, v, r, y) => [r * L(th, v) * (1 - 0.08 * Math.exp(-((angDist(th, Math.PI / 2) / 0.2) ** 2)) * smooth(0.15, 0.6, v)), y]);
  return { body: groundIt(body), faceY: 0.3,
    extra(g, b) { const leafM = new THREE.MeshStandardMaterial({ color: 0x4caf50, roughness: 0.6 }); for (const s of [-1, 1]) { const leaf = new THREE.Mesh(new THREE.SphereGeometry(0.3, 16, 10), leafM); leaf.scale.set(1.4, 0.12, 0.6); leaf.position.set(s * 0.55, 0.06, 0.75); leaf.rotation.y = s * 0.5; bake(g, leaf); } } };
} };
SHAPES.ingot = { name: "Gold Ingot Dumpling", build(rand) { return { body: groundIt(crescent({ pleats: 0, crest: 0.05, bend: 1.5, lift: 0.42, h: 0.56, w: 0.58, len: 1.05, flat: 0.25 }, rand)), faceY: 0.3, crescent: true }; } };
export const SHAPE_IDS = Object.keys(SHAPES);

// ---- flavours (themes) -----------------------------------------------------
//  finish: dough | glossy | shimmer | powder | crystal | jelly | glitter | galaxy | glow | gold | holo
export const FLAVOURS = {
  classic:    { name: "Classic",            color: 0xf1e2c8, finish: "dough",   face: false, rarity: "common",   fill: "soup" },
  strawberry: { name: "Strawberry Sparkle", color: 0xffb3c6, finish: "shimmer", glit: ["#ff4f7a", "#ffffff", "#ff9ab8"], rarity: "common", fill: "berry" },
  lemon:      { name: "Lemon Sunshine",     color: 0xffe36b, finish: "glossy",  rarity: "common",   fill: "sunbeam" },
  blueberry:  { name: "Blueberry Bubble",   color: 0x93a8ff, finish: "dough",   rarity: "uncommon", fill: "beads" },
  choco:      { name: "Choco Chip",         color: 0xa9734b, finish: "dough",   chips: true, rarity: "uncommon", fill: "choco" },
  cotton:     { name: "Cotton Candy Cloud", color: 0xffffff, finish: "powder",  vc: "cotton", rarity: "uncommon", fill: "cotton" },
  ocean:      { name: "Ocean Wave",         color: 0x56d4cf, finish: "jelly",   rarity: "rare",     fill: "ocean" },
  rainbow:    { name: "Rainbow Swirl",      color: 0xffffff, finish: "glossy",  vc: "rainbow", rarity: "rare", fill: "rainbow" },
  galaxy:     { name: "Grape Galaxy",       color: 0xffffff, finish: "galaxy",  rarity: "super",    fill: "galaxy" },
  mango:      { name: "Mango Tango",        color: 0xffb84d, finish: "glossy",  rarity: "uncommon", fill: "mango" },
  mint:       { name: "Mint Chip",          color: 0xaef0d0, finish: "dough",   chips: true, rarity: "uncommon", fill: "mint" },
  bubbletea:  { name: "Bubble Tea",         color: 0xd9a77a, finish: "glossy",  rarity: "rare",     fill: "boba" },
  watermelon: { name: "Watermelon Splash",  color: 0xff8098, finish: "shimmer", glit: ["#1a1a1a", "#ffffff", "#7ed957"], rarity: "rare", fill: "watermelon" },
  frosty:     { name: "Frosty Snowflake",   color: 0xdff4ff, finish: "glitter", glit: ["#ffffff", "#bfe9ff", "#8fd3ff"], rarity: "super", fill: "frosty" },
  sunset:     { name: "Sunset Dream",       color: 0xffffff, finish: "glossy",  vc: "sunset", rarity: "epic", fill: "sunset" },
  neon:       { name: "Neon Glow",          color: 0x5dff9e, finish: "glow",    rarity: "epic",     fill: "neon" },
  opal:       { name: "Opal Shimmer",       color: 0xfff6fb, finish: "holo",    rarity: "mythic",   fill: "opal" },
};
export const RARITY = {
  common:   { name: "Common",     color: "#8f9bab", value: 4,   order: 0 },
  uncommon: { name: "Uncommon",   color: "#3ea16a", value: 8,   order: 1 },
  rare:     { name: "Rare",       color: "#2f80ed", value: 16,  order: 2 },
  super:    { name: "Super Rare", color: "#9b51e0", value: 35,  order: 3 },
  epic:     { name: "Epic",       color: "#ff7a1a", value: 50,  order: 4 },
  mythic:   { name: "Mythic",     color: "#00b3a4", value: 80,  order: 5 },
  secret:   { name: "Secret",     color: "#ff4fa3", value: 100, order: 6 },
  golden:   { name: "Golden",     color: "#f5b700", value: 150, order: 7 },
  diamond:  { name: "Diamond",    color: "#38c7ff", value: 300, order: 8 },
};
const MOODS = ["smile", "smile", "wink", "sleepy", "surprised", "happy"];

// ---- the catalog: 12 shapes × 17 flavours + 17 specials ---------------------
const SPECIALS = [
  { id: "golden-bao", name: "Golden Lucky Bao", shape: "xlb", color: 0xffc94a, finish: "gold", rarity: "golden", fill: "gold", mood: "happy", tops: ["crown"], blurb: "The luckiest dumpling in town! Something shiny is hiding inside…" },
  { id: "starlight", name: "Starlight Dumpling", shape: "momo", color: 0xfff6fb, finish: "holo", rarity: "golden", fill: "holo", mood: "smile", blurb: "A holographic chase dumpling that twinkles like the night sky." },
  { id: "glow-wonton", name: "Glow-Night Wonton", shape: "wonton", color: 0xb6ff9e, finish: "glow", rarity: "secret", fill: "glow", mood: "sleepy", blurb: "It glows softly — perfect for a sleepover!" },
  { id: "mood-mochi", name: "Mood Mochi", shape: "mochi", color: 0xc9a7ff, color2: 0xff8fc7, finish: "powder", rarity: "secret", fill: "mood", mood: "smile", blurb: "Squeeze it and watch it change colour!" },
  { id: "shades-bao", name: "Seashell Shades Bao", shape: "bao", color: 0x6fc3ff, finish: "glitter", glit: ["#ffffff", "#bfe8ff", "#2f80ed"], rarity: "secret", fill: "shell", mood: "shades", blurb: "Too cool for the steamer. Sunglasses on, always." },
  { id: "unicorn", name: "Rainbow Unicorn Dumpling", shape: "tangyuan", color: 0xffffff, finish: "glossy", vc: "pastel", rarity: "secret", fill: "rainbow", mood: "happy", tops: ["horn"], blurb: "A magical pastel dumpling with a golden horn." },
  { id: "panda-bao", name: "Panda Bao", shape: "bao", color: 0xffffff, finish: "dough", rarity: "secret", fill: "choco", mood: "smile", tops: ["panda"], blurb: "A sleepy panda who loves bamboo… and chocolate." },
  { id: "bunny-mochi", name: "Bunny Mochi", shape: "mochi", color: 0xffeef4, finish: "powder", rarity: "secret", fill: "berry", mood: "happy", tops: ["bunny"], blurb: "Hop hop! Soft, floppy ears and a strawberry heart." },
  { id: "kitty-bao", name: "Kitty Bao", shape: "tangyuan", color: 0xffcf9e, finish: "dough", rarity: "secret", fill: "ocean", mood: "wink", tops: ["kitty"], blurb: "Meow! Guess what this kitty keeps inside… a fishy friend!" },
  { id: "froggy-momo", name: "Froggy Momo", shape: "momo", color: 0x8bd66b, finish: "glossy", rarity: "epic", fill: "mint", mood: "happy", tops: ["frog"], blurb: "Ribbit! It has eyes on top AND eyes on the front. Very good at looking." },
  { id: "piggy-bao", name: "Piggy Bao", shape: "bao", color: 0xffb8c8, finish: "dough", rarity: "epic", fill: "berry", mood: "smile", tops: ["pig"], blurb: "Oink! The roundest, pinkest bao in town." },
  { id: "pearl-princess", name: "Pearl Princess Mochi", shape: "mochi", color: 0xfff6fb, finish: "holo", rarity: "mythic", fill: "opal", mood: "happy", tops: ["bow", "crown"], blurb: "A shimmering pearl mochi wearing a tiny crown and a bow." },
  { id: "cosmic-dragon", name: "Cosmic Dragon Bao", shape: "xlb", color: 0xffffff, finish: "galaxy", rarity: "mythic", fill: "galaxy", mood: "surprised", tops: ["horns"], blurb: "A baby dragon made of stars. Rawr (but a friendly rawr)." },
  { id: "royal-ingot", name: "Royal Gold Ingot", shape: "ingot", color: 0xffc93c, finish: "gold", rarity: "golden", fill: "gold", mood: "happy", tops: ["crown"], blurb: "A lucky gold ingot dumpling fit for a king or queen!" },
  { id: "diamond-dumpling", name: "Diamond Dumpling", shape: "xlb", color: 0xe8f9ff, finish: "diamond", rarity: "diamond", fill: "diamond", mood: "smile", tops: ["crown"], blurb: "The rarest dumpling of all. It sparkles like a real diamond!" },
  { id: "wish-peach", name: "Rainbow Wish Peach", shape: "peach", color: 0xffffff, finish: "glossy", vc: "rainbow", rarity: "diamond", fill: "rainbow", mood: "happy", tops: ["bow"], blurb: "Legend says every wish made on this peach comes true." },
  { id: "chicky", name: "Chicky Bao", shape: "tangyuan", color: 0xffe066, finish: "dough", rarity: "secret", fill: "chick", mood: "smile", tops: ["chick"], blurb: "Bawk! A dumpling that thinks it's a chicken. There might be a baby chick inside!" },
];
export const CATALOG = [];
for (const s of SHAPE_IDS) for (const f of Object.keys(FLAVOURS)) {
  const F = FLAVOURS[f], id = `${f}-${s}`, r = rng(hash(id));
  CATALOG.push({ id, name: `${F.name} ${SHAPES[s].name}`, shape: s, flavour: f, color: F.color, finish: F.finish, vc: F.vc, glit: F.glit, chips: F.chips, rarity: F.rarity, fill: F.fill, mood: F.face === false ? null : MOODS[Math.floor(r() * MOODS.length)] });
}
for (const sp of SPECIALS) CATALOG.push({ ...sp });
export const byId = (id) => CATALOG.find((k) => k.id === id);

// ---- fillings (what you see when you pull one apart) -----------------------
export const FILLS = {
  soup:    { name: "juicy soup filling", base: "#c98e6a", gel: false, bits: ["#9a5b3c", "#7a4a30", "#5e8f3a"], pool: "#f2c66d" },
  berry:   { name: "red glitter gel", base: "#e8264f", gel: true, glit: ["#ffd1dc", "#ffffff", "#ff7a9a"] },
  sunbeam: { name: "sunbeam glitter", base: "#ffc21a", gel: true, glit: ["#fff6b0", "#ffffff", "#ff9e00"] },
  beads:   { name: "bubbly blue beads", base: "#3f6cf0", gel: true, glit: ["#c9d6ff", "#ffffff"], extra: "beads" },
  choco:   { name: "melty chocolate", base: "#4a2716", gel: true, glit: ["#6b3a22", "#2e170c"], extra: "chips" },
  cotton:  { name: "fluffy cotton candy", base: "#ffb6e1", swirl: "#a8d8ff", gel: false },
  ocean:   { name: "ocean gel (with a fishy friend!)", base: "#1fb5c9", gel: true, glit: ["#ffffff", "#bff7ff"], extra: "fish" },
  rainbow: { name: "rainbow layers", rainbow: true, gel: true, glit: ["#ffffff"] },
  galaxy:  { name: "star-sprinkle space gel", base: "#24124f", gel: true, glit: ["#ffffff", "#ffe066", "#ff8ad8"], stars: true },
  gold:    { name: "gold glitter (and a lucky coin!)", base: "#e8a400", gel: true, glit: ["#fff3b0", "#ffffff", "#b07800"], extra: "coin" },
  holo:    { name: "holographic shimmer", base: "#d9c7ff", gel: true, glit: ["#a8fff0", "#ffb6ff", "#ffffff", "#fff3a0"], holo: true },
  glow:    { name: "glowing goo", base: "#7dff6a", gel: true, glit: ["#eaffd9"], glow: true },
  mood:    { name: "colour-changing gel", base: "#b06bff", swirl: "#ff7ac0", gel: true, glit: ["#ffffff"] },
  shell:   { name: "sea glitter (and a seashell!)", base: "#2f80ed", gel: true, glit: ["#ffffff", "#bfe8ff"], extra: "shell" },
  chick:   { name: "a baby chick!", base: "#fff2b3", gel: false, extra: "chick" },
  mango:   { name: "mango jelly", base: "#ffb21a", gel: true, glit: ["#fff2a8", "#ff8a00"] },
  mint:    { name: "minty choc-chip cream", base: "#9ef0c8", gel: false, bits: ["#3b2216", "#2e170c"] },
  boba:    { name: "brown sugar boba pearls", base: "#c8874f", gel: true, glit: ["#f3d9b5"], extra: "boba" },
  watermelon: { name: "juicy watermelon gel", base: "#ff4d6d", gel: true, bits: ["#1a1a1a"], glit: ["#ffd1dc"] },
  frosty:  { name: "sparkly snow gel", base: "#bfe9ff", gel: true, glit: ["#ffffff", "#e0f7ff", "#8fd3ff"], stars: true },
  sunset:  { name: "sunset swirl", base: "#ff7a59", swirl: "#b36bff", gel: true, glit: ["#ffe3a3"] },
  neon:    { name: "neon glow goo", base: "#39ff88", gel: true, glit: ["#ffffff", "#ff3dd6"], glow: true },
  opal:    { name: "opal shimmer", base: "#e9d9ff", gel: true, glit: ["#a8fff0", "#ffb6ff", "#ffffff"], holo: true },
  diamond: { name: "diamond sparkle (and a real gem!)", base: "#d8f6ff", gel: true, glit: ["#ffffff", "#a8eaff", "#ffd6ff"], holo: true, extra: "gem" },
};
function fillTex(key) {
  const F = FILLS[key];
  return canvasTex(`fill:${key}`, 256, (g, n) => {
    if (F.rainbow) { ["#ff5a5a", "#ff9f40", "#ffe14d", "#5fd35f", "#4aa3ff", "#9b6bff"].forEach((c, i) => { g.fillStyle = c; g.fillRect(0, (i * n) / 6, n, n / 6 + 1); }); }
    else { g.fillStyle = F.base; g.fillRect(0, 0, n, n); }
    if (F.swirl) { g.strokeStyle = F.swirl; g.lineWidth = 18; g.lineCap = "round"; g.beginPath(); for (let a = 0; a < 18; a += 0.1) { const r = a * 7; g.lineTo(n / 2 + Math.cos(a) * r, n / 2 + Math.sin(a) * r); } g.stroke(); }
    if (F.pool) { const gr = g.createRadialGradient(n / 2, n * 0.4, 4, n / 2, n * 0.4, n * 0.4); gr.addColorStop(0, F.pool); gr.addColorStop(1, F.pool + "00"); g.fillStyle = gr; g.fillRect(0, 0, n, n); }
    // mottled texture
    for (let i = 0; i < 600; i++) { g.fillStyle = `rgba(${Math.random() < 0.5 ? "255,255,255" : "0,0,0"},${rnd(0.02, 0.08)})`; g.beginPath(); g.arc(rnd(0, n), rnd(0, n), rnd(2, 10), 0, TAU); g.fill(); }
    if (F.bits) for (let i = 0; i < 90; i++) { g.fillStyle = F.bits[i % F.bits.length]; g.beginPath(); g.ellipse(rnd(0, n), rnd(0, n), rnd(2, 6), rnd(2, 4), rnd(0, 3), 0, TAU); g.fill(); }
    if (F.glit) for (let i = 0; i < 700; i++) { g.fillStyle = F.glit[i % F.glit.length]; const s = rnd(1, 3); g.fillRect(rnd(0, n), rnd(0, n), s, s); }
    if (F.stars) { g.fillStyle = "#fff"; for (let i = 0; i < 14; i++) { const x = rnd(10, n - 10), y = rnd(10, n - 10), r = rnd(4, 9); g.beginPath(); for (let k = 0; k < 10; k++) { const rr = k % 2 ? r * 0.45 : r, a = (k / 10) * TAU - Math.PI / 2; g.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); } g.fill(); } }
  });
}
export const fillColor = (key) => (FILLS[key].rainbow ? 0xff9f40 : new THREE.Color(FILLS[key].base).getHex());

// ---- materials -------------------------------------------------------------
const glossBlack = () => new THREE.MeshPhysicalMaterial({ color: 0x1b1310, roughness: 0.18, clearcoat: 1, clearcoatRoughness: 0.1 });
let FM = null; // shared face materials
const faceMats = () => FM || (FM = { eye: glossBlack(), shine: new THREE.MeshBasicMaterial({ color: 0xffffff }), blush: new THREE.MeshBasicMaterial({ color: 0xff8fa8, transparent: true, opacity: 0.55, depthWrite: false }), mouth: new THREE.MeshStandardMaterial({ color: 0x5a2230, roughness: 0.5 }), tongue: new THREE.MeshStandardMaterial({ color: 0xff7b8f, roughness: 0.5 }), shades: new THREE.MeshPhysicalMaterial({ color: 0x111122, roughness: 0.05, metalness: 0.4, clearcoat: 1 }), gold: new THREE.MeshPhysicalMaterial({ color: 0xffc93c, metalness: 1, roughness: 0.22, clearcoat: 1 }), red: new THREE.MeshStandardMaterial({ color: 0xe8322f, roughness: 0.5 }), orange: new THREE.MeshStandardMaterial({ color: 0xff9a1f, roughness: 0.4 }), pink: new THREE.MeshStandardMaterial({ color: 0xffb6d1, roughness: 0.6 }) });
export function skinMaterial(finish, k) {
  const o = { color: 0xffffff, vertexColors: true, roughness: 0.62, metalness: 0, sheen: 0.55, sheenRoughness: 0.45, sheenColor: 0xffffff, bumpMap: poreTex(), bumpScale: 0.35 };
  switch (finish) {
    case "glossy": Object.assign(o, { roughness: 0.34, clearcoat: 0.7, clearcoatRoughness: 0.22 }); break;
    case "shimmer": Object.assign(o, { roughness: 0.32, clearcoat: 0.8, clearcoatRoughness: 0.2, map: glitterTex(k.id, k.glit || ["#ffffff"]) }); break;
    case "powder": Object.assign(o, { roughness: 0.95, sheen: 1, sheenRoughness: 0.8, map: flourTex(), bumpScale: 0.5 }); break;
    case "crystal": Object.assign(o, LOW_TIER ? { transparent: true, opacity: 0.68, roughness: 0.22, clearcoat: 0.8 } : { transmission: 0.72, thickness: 0.7, ior: 1.33, roughness: 0.25, clearcoat: 0.6, attenuationColor: 0xfff4e8, attenuationDistance: 2.5 }); break;
    case "jelly": Object.assign(o, LOW_TIER ? { transparent: true, opacity: 0.78, roughness: 0.1, clearcoat: 1 } : { transmission: 0.88, thickness: 1.2, ior: 1.4, roughness: 0.08, clearcoat: 1, clearcoatRoughness: 0.05, sheen: 0, bumpScale: 0.1 }); break;
    case "glitter": Object.assign(o, { roughness: 0.28, metalness: 0.35, clearcoat: 1, clearcoatRoughness: 0.08, map: glitterTex(k.id, k.glit || ["#ffffff"]), sheen: 0.2 }); break;
    case "galaxy": Object.assign(o, { map: galaxyTex(), emissive: 0xffffff, emissiveMap: starTex(), emissiveIntensity: 0.9, roughness: 0.3, clearcoat: 1, clearcoatRoughness: 0.15, sheen: 0.3 }); break;
    case "glow": Object.assign(o, { emissive: new THREE.Color(k.color), emissiveIntensity: 0.55, roughness: 0.4, clearcoat: 0.6 }); break;
    case "gold": Object.assign(o, { metalness: 1, roughness: 0.2, clearcoat: 1, clearcoatRoughness: 0.08, sheen: 0, bumpScale: 0.15 }); break;
    case "diamond": Object.assign(o, LOW_TIER ? { transparent: true, opacity: 0.8, roughness: 0.05, clearcoat: 1, iridescence: 1, map: glitterTex("diamond", ["#ffffff", "#a8eaff", "#ffd6ff"]) } : { transmission: 0.6, thickness: 0.8, ior: 2.0, roughness: 0.04, clearcoat: 1, iridescence: 1, iridescenceIOR: 2.0, map: glitterTex("diamond", ["#ffffff", "#a8eaff", "#ffd6ff"]), emissive: 0xffffff, emissiveMap: starTex(), emissiveIntensity: 0.6, sheen: 0 }); break;
    case "holo": Object.assign(o, { roughness: 0.18, metalness: 0.2, clearcoat: 1, iridescence: 1, iridescenceIOR: 1.7, iridescenceThicknessRange: [180, 900], sheen: 0.3, emissive: 0xffffff, emissiveMap: starTex(), emissiveIntensity: 0.5 }); break;
  }
  return new THREE.MeshPhysicalMaterial(o);
}
function vertexColours(geo, k, shape) {
  const p = geo.attributes.position, acc = geo.userData.accent, H = geo.boundingBox.max.y || 1, n = p.count, col = new Float32Array(n * 3);
  const base = new THREE.Color(k.color), c = new THREE.Color(), fillC = new THREE.Color(fillColor(k.fill)), brown = new THREE.Color(0xb7712c), dark = new THREE.Color(0x7a4316);
  const pink = new THREE.Color(0xffb6e1), blue = new THREE.Color(0xa8d8ff);
  for (let i = 0; i < n; i++) {
    const y = p.getY(i), t = y / H, x = p.getX(i), z = p.getZ(i);
    if (k.vc === "rainbow") c.setHSL(((t * 0.9 + Math.atan2(z, x) / TAU * 0.15) % 1 + 1) % 1, 0.8, 0.72);
    else if (k.vc === "pastel") c.setHSL(((t * 0.8 + 0.55) % 1), 0.75, 0.86);
    else if (k.vc === "sunset") c.setHSL(((0.08 - t * 0.28) % 1 + 1) % 1, 0.85, 0.66 - t * 0.08);
    else if (k.vc === "cotton") c.copy(pink).lerp(blue, smooth(0.25, 0.8, t + 0.08 * Math.sin(x * 6 + z * 4)));
    else c.copy(base);
    if (k.finish === "gold" || k.finish === "galaxy" || k.finish === "holo" || k.id === "mood-mochi") c.set(k.finish === "gold" ? 0xffc93c : 0xffffff);
    if (shape.blush && !k.vc) c.lerp(new THREE.Color(0xff8fa8), smooth(0.55, 1.0, t) * 0.75);
    if (shape.crispy) { const b = smooth(0.14, 0.0, y + 0.02 * Math.sin(x * 23) * Math.sin(z * 17)); c.lerp(brown, b * 0.9); c.lerp(dark, smooth(0.035, 0, y) * 0.6); }
    if (acc && acc[i]) c.lerp(fillC, acc[i]);
    col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b;
  }
  geo.setAttribute("color", new THREE.BufferAttribute(col, 3));
}

// ---- building ----------------------------------------------------------------
// bake a mesh's transform into its geometry so the group is all one coordinate space
function bake(g, mesh) { mesh.updateMatrix(); mesh.geometry.applyMatrix4(mesh.matrix); mesh.position.set(0, 0, 0); mesh.rotation.set(0, 0, 0); mesh.scale.set(1, 1, 1); mesh.updateMatrix(); g.add(mesh); return mesh; }
const _ray = new THREE.Raycaster();
function surfaceHit(body, origin, dir) { _ray.set(origin, dir.clone().normalize()); const h = _ray.intersectObject(body, false)[0]; if (!h) return null; const n = h.face.normal.clone(); return { p: h.point.clone(), n }; }
function stick(g, mesh, hit, lift = 0.005, spin = 0) { mesh.position.copy(hit.p).addScaledVector(hit.n, lift); mesh.lookAt(mesh.position.clone().add(hit.n)); if (spin) mesh.rotateZ(spin); return bake(g, mesh); }
const front = (body, x, y) => surfaceHit(body, new V3(x, y, 6), new V3(0, 0, -1));
const topAt = (body, x, z) => surfaceHit(body, new V3(x, 6, z), new V3(0, -1, 0));

function addFace(g, body, mood, y, sc = 1) {
  const M = faceMats(); const ex = 0.2 * sc, ey = y + 0.05 * sc;
  const arc = (r, t, up) => { const m = new THREE.Mesh(new THREE.TorusGeometry(r, t, 8, 20, Math.PI), M.eye); if (!up) m.rotateZ(Math.PI); return m; };
  const dotEye = (x) => { const h = front(body, x, ey); if (!h) return; const e = new THREE.Mesh(new THREE.SphereGeometry(0.068 * sc, 20, 14), M.eye); e.scale.set(0.9, 1.15, 0.45); stick(g, e, h, 0.004); const s = new THREE.Mesh(new THREE.SphereGeometry(0.02 * sc, 8, 6), M.shine); stick(g, s, { p: h.p.clone().add(new V3(0.022 * sc, 0.03 * sc, 0)), n: h.n }, 0.035 * sc); };
  const lineEye = (x, up) => { const h = front(body, x, ey); if (h) stick(g, arc(0.055 * sc, 0.013 * sc, up), h, 0.008); };
  for (const s of [-1, 1]) {
    const x = s * ex;
    if (mood === "sleepy") lineEye(x, false); else if (mood === "happy") lineEye(x, true); else if (mood === "wink" && s > 0) lineEye(x, true); else if (mood !== "shades") dotEye(x);
    const hb = front(body, s * ex * 1.55, ey - 0.09 * sc); if (hb) { const b = new THREE.Mesh(new THREE.CircleGeometry(0.06 * sc, 20), M.blush); b.scale.y = 0.7; b.userData.noSquishNormals = true; stick(g, b, hb, 0.012); }
  }
  const hm = front(body, 0, ey - 0.12 * sc);
  if (hm) {
    if (mood === "surprised") { const o = new THREE.Mesh(new THREE.SphereGeometry(0.04 * sc, 14, 10), M.mouth); o.scale.set(0.9, 1.1, 0.35); stick(g, o, hm, 0.004); }
    else if (mood === "happy") { const o = new THREE.Mesh(new THREE.SphereGeometry(0.055 * sc, 16, 10, 0, TAU, Math.PI / 2, Math.PI / 2), M.mouth); o.scale.set(1.1, 1, 0.35); stick(g, o, hm, 0.004); }
    else { for (const s of [-1, 1]) { const h2 = front(body, s * 0.033 * sc, ey - 0.12 * sc); if (h2) stick(g, arc(0.033 * sc, 0.009 * sc, false), h2, 0.006); } } // little "w" mouth
  }
  if (mood === "shades") { // cool sunglasses
    for (const s of [-1, 1]) { const h = front(body, s * ex, ey); if (!h) continue; const l = new THREE.Mesh(new THREE.CylinderGeometry(0.1 * sc, 0.09 * sc, 0.03, 24), M.shades); l.rotateX(Math.PI / 2); l.scale.set(1.15, 1, 0.85); const grp = new THREE.Object3D(); grp.add(l); l.updateMatrix(); const geo = l.geometry.clone().applyMatrix4(l.matrix); const m = new THREE.Mesh(geo, M.shades); stick(g, m, h, 0.03); }
    const hb = front(body, 0, ey + 0.02); if (hb) { const br = new THREE.Mesh(new THREE.BoxGeometry(0.14 * sc, 0.025, 0.025), M.shades); stick(g, br, hb, 0.04); }
  }
}
function addTops(g, body, k, H) {
  const M = faceMats();
  for (const t of k.tops || []) {
    if (t === "crown") { const h = topAt(body, 0, 0); if (!h) continue; const crown = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.17, 0.14, 10, 1, true), M.gold); crown.position.copy(h.p).add(new V3(0, 0.05, 0)); bake(g, crown); for (let i = 0; i < 5; i++) { const a = (i / 5) * TAU; const sp = new THREE.Mesh(new THREE.ConeGeometry(0.045, 0.1, 6), M.gold); sp.position.set(h.p.x + Math.cos(a) * 0.19, h.p.y + 0.16, h.p.z + Math.sin(a) * 0.19); bake(g, sp); const gem = new THREE.Mesh(new THREE.SphereGeometry(0.025, 8, 6), M.red); gem.position.set(h.p.x + Math.cos(a) * 0.2, h.p.y + 0.06, h.p.z + Math.sin(a) * 0.2); bake(g, gem); } }
    if (t === "horn") { const h = topAt(body, 0, 0.12); if (!h) continue; const horn = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.38, 20, 8), M.gold); horn.position.copy(h.p).add(new V3(0, 0.16, 0.02)); horn.rotation.x = 0.25; bake(g, horn);
      for (const s of [-1, 1]) { const he = topAt(body, s * 0.42, -0.05); if (!he) continue; const ear = new THREE.Mesh(new THREE.ConeGeometry(0.1, 0.22, 16), M.pink); ear.position.copy(he.p).add(new V3(0, 0.06, 0)); ear.rotation.z = -s * 0.4; bake(g, ear); }
      const pal = [0xff9ad5, 0xbfeaff, 0xe6ccff, 0xfff3a0]; pal.forEach((c, i) => { const h2 = surfaceHit(body, new V3(-0.15 + i * 0.1, H * 0.95 - i * 0.12, -6), new V3(0, 0, 1)); if (!h2) return; const m = new THREE.Mesh(new THREE.SphereGeometry(0.11, 16, 12), new THREE.MeshPhysicalMaterial({ color: c, roughness: 0.4, clearcoat: 0.6 })); m.scale.set(1, 1, 0.6); stick(g, m, h2, 0.02); }); }
    if (t === "panda") { const blk = new THREE.MeshStandardMaterial({ color: 0x1d1d22, roughness: 0.8 }); for (const s of [-1, 1]) { const he = topAt(body, s * 0.55, -0.05); if (he) { const ear = new THREE.Mesh(new THREE.SphereGeometry(0.2, 16, 12), blk); ear.scale.z = 0.6; ear.position.copy(he.p).add(new V3(0, 0.08, 0)); bake(g, ear); } const hp = front(body, s * 0.2, H * 0.32 + 0.11); if (hp) { const patch = new THREE.Mesh(new THREE.CircleGeometry(0.1, 20), blk); patch.scale.set(0.85, 1.15, 1); patch.rotation.z = s * 0.5; stick(g, patch, hp, 0.002); } } }
    if (t === "bunny") { const pinkM = new THREE.MeshStandardMaterial({ color: 0xffb6d1, roughness: 0.7 }), wht = new THREE.MeshStandardMaterial({ color: new THREE.Color(k.color), roughness: 0.9 }); for (const s of [-1, 1]) { const he = topAt(body, s * 0.28, 0); if (!he) continue; const ear = new THREE.Mesh(new THREE.CapsuleGeometry(0.11, 0.55, 6, 12), wht); ear.scale.z = 0.5; ear.position.copy(he.p).add(new V3(s * 0.08, 0.35, 0)); ear.rotation.z = -s * 0.3; bake(g, ear); const inner = new THREE.Mesh(new THREE.CapsuleGeometry(0.06, 0.4, 6, 10), pinkM); inner.scale.z = 0.3; inner.position.copy(he.p).add(new V3(s * 0.08, 0.35, 0.05)); inner.rotation.z = -s * 0.3; bake(g, inner); } }
    if (t === "kitty") { const furM = new THREE.MeshStandardMaterial({ color: new THREE.Color(k.color).offsetHSL(0, 0, -0.08), roughness: 0.9 }), pinkM = new THREE.MeshStandardMaterial({ color: 0xffb6d1 }); for (const s of [-1, 1]) { const he = topAt(body, s * 0.42, -0.05); if (!he) continue; const ear = new THREE.Mesh(new THREE.ConeGeometry(0.18, 0.32, 4), furM); ear.position.copy(he.p).add(new V3(0, 0.12, 0)); ear.rotation.z = -s * 0.35; ear.rotation.y = Math.PI / 4; bake(g, ear); const inner = new THREE.Mesh(new THREE.ConeGeometry(0.1, 0.2, 4), pinkM); inner.position.copy(he.p).add(new V3(s * 0.01, 0.11, 0.08)); inner.rotation.z = -s * 0.35; inner.rotation.y = Math.PI / 4; bake(g, inner); } for (const s of [-1, 1]) for (const dy of [-0.03, 0.03]) { const hw = front(body, s * 0.3, H * 0.3 + dy); if (!hw) continue; const wh = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.012, 0.012), FM.eye); stick(g, wh, hw, 0.01, s * dy * 4); } }
    if (t === "frog") { const grn = new THREE.MeshStandardMaterial({ color: new THREE.Color(k.color), roughness: 0.4 }); for (const s of [-1, 1]) { const he = topAt(body, s * 0.25, 0.1); if (!he) continue; const bump = new THREE.Mesh(new THREE.SphereGeometry(0.17, 18, 12), grn); bump.position.copy(he.p).add(new V3(0, 0.08, 0)); bake(g, bump); const w = new THREE.Mesh(new THREE.SphereGeometry(0.11, 14, 10), new THREE.MeshStandardMaterial({ color: 0xffffff })); w.position.copy(he.p).add(new V3(0, 0.13, 0.1)); bake(g, w); const pu = new THREE.Mesh(new THREE.SphereGeometry(0.06, 12, 8), FM.eye); pu.position.copy(he.p).add(new V3(0, 0.14, 0.18)); bake(g, pu); } }
    if (t === "pig") { const pinkM = new THREE.MeshStandardMaterial({ color: new THREE.Color(k.color).offsetHSL(0, 0.1, -0.08), roughness: 0.7 }); for (const s of [-1, 1]) { const he = topAt(body, s * 0.5, -0.05); if (!he) continue; const ear = new THREE.Mesh(new THREE.ConeGeometry(0.15, 0.25, 3), pinkM); ear.position.copy(he.p).add(new V3(0, 0.08, 0.05)); ear.rotation.z = -s * 0.6; ear.rotation.x = 0.4; bake(g, ear); }
      const hs = front(body, 0, H * 0.24); if (hs) { const snout = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.14, 0.08, 24).rotateX(Math.PI / 2), pinkM); stick(g, snout, hs, 0.03); for (const s of [-1, 1]) { const n = new THREE.Mesh(new THREE.SphereGeometry(0.025, 8, 6), FM.mouth); stick(g, n, { p: hs.p.clone().add(new V3(s * 0.045, 0, 0)), n: hs.n }, 0.075); } } }
    if (t === "bow") { const bowM = new THREE.MeshPhysicalMaterial({ color: 0xff5da2, roughness: 0.3, clearcoat: 1 }); const h = topAt(body, 0.35, -0.1); if (h) { for (const s of [-1, 1]) { const loop = new THREE.Mesh(new THREE.SphereGeometry(0.13, 16, 10), bowM); loop.scale.set(1.3, 0.8, 0.45); loop.position.copy(h.p).add(new V3(s * 0.14, 0.1, 0)); loop.rotation.z = s * 0.4; bake(g, loop); } const knot = new THREE.Mesh(new THREE.SphereGeometry(0.06, 12, 8), bowM); knot.position.copy(h.p).add(new V3(0, 0.1, 0.02)); bake(g, knot); } }
    if (t === "horns") { for (const s of [-1, 1]) { const he = topAt(body, s * 0.3, -0.05); if (!he) continue; const horn = new THREE.Mesh(new THREE.ConeGeometry(0.07, 0.3, 14), M.gold); horn.position.copy(he.p).add(new V3(s * 0.04, 0.12, 0)); horn.rotation.z = -s * 0.35; bake(g, horn); } }
    if (t === "chick") { for (let i = -1; i <= 1; i++) { const h = topAt(body, i * 0.09, 0); if (!h) continue; const c = new THREE.Mesh(new THREE.SphereGeometry(0.08 - Math.abs(i) * 0.015, 14, 10), M.red); c.position.copy(h.p).add(new V3(0, 0.05 - Math.abs(i) * 0.015, 0)); bake(g, c); }
      const hb = front(body, 0, H * 0.4); if (hb) { const beak = new THREE.Mesh(new THREE.ConeGeometry(0.07, 0.15, 14).rotateX(Math.PI / 2), M.orange); stick(g, beak, hb, 0.06); }
      for (const s of [-1, 1]) { const hw = surfaceHit(body, new V3(s * 6, H * 0.38, 0), new V3(-s, 0, 0)); if (!hw) continue; const w = new THREE.Mesh(new THREE.SphereGeometry(0.2, 16, 12), new THREE.MeshStandardMaterial({ color: 0xffd23d, roughness: 0.7 })); w.scale.set(0.35, 0.7, 1); w.position.copy(hw.p).addScaledVector(hw.n, 0.02); w.rotation.z = s * 0.4; bake(g, w); } }
  }
}
function addChips(g, body, H) {
  const m = new THREE.MeshStandardMaterial({ color: 0x3b2216, roughness: 0.55 }); const r = rng(42);
  for (let i = 0; i < 26; i++) { const a = r() * TAU, el = r() * 1.3; const d = new V3(Math.cos(a) * Math.cos(el), Math.sin(el), Math.sin(a) * Math.cos(el)); const h = surfaceHit(body, d.clone().multiplyScalar(6).add(new V3(0, H * 0.4, 0)), d.clone().negate()); if (!h) continue; const c = new THREE.Mesh(new THREE.ConeGeometry(0.035, 0.05, 8).rotateX(Math.PI / 2), m); stick(g, c, h, 0.01); }
}

// build a dumpling: returns a THREE.Group (≈2 units wide, sitting on y=0)
export function buildDumpling(kind, { lod = 1 } = {}) {
  LOD = lod; try { return build(kind); } finally { LOD = 1; }
}
function build(kind) {
  const k = typeof kind === "string" ? byId(kind) : kind; const shape = SHAPES[k.shape]; const rand = rng(hash(k.id));
  const S = shape.build(rand); const finish = shape.force && !["galaxy", "gold", "holo", "glow", "jelly", "glitter", "diamond"].includes(k.finish) ? (shape.force === "crystal" && k.finish === "powder" ? "crystal" : shape.force) : k.finish;
  const kk = { ...k, finish };
  vertexColours(S.body, kk, shape);
  const g = new THREE.Group(); g.userData.kind = k.id;
  const skin = skinMaterial(finish, kk); if (S.open) skin.side = THREE.DoubleSide; if (k.id === "mood-mochi") skin.color.set(k.color);
  const body = new THREE.Mesh(S.body, skin); body.userData.body = body.userData.section = true; g.add(body); body.updateMatrixWorld();
  const fc = new THREE.Color(fillColor(k.fill));
  const mats = { fill: new THREE.MeshPhysicalMaterial({ color: k.fill === "soup" ? 0xe7a98a : fc, roughness: 0.5, clearcoat: 0.4, map: fillTex(k.fill) }), roe: new THREE.MeshPhysicalMaterial({ color: k.fill === "soup" ? 0xff7a1a : fc.clone().offsetHSL(0, 0, -0.1), roughness: 0.25, clearcoat: 1 }),
    sheet: (() => { const m = skinMaterial(finish === "powder" ? "dough" : finish, kk); m.side = THREE.DoubleSide; m.vertexColors = false; m.color.set(k.vc === "rainbow" ? 0xffe0a8 : k.vc === "pastel" ? 0xffd6f0 : k.vc === "cotton" ? 0xffc8e8 : (finish === "gold" ? 0xffc93c : ["glow", "galaxy", "holo"].includes(finish) ? 0xffffff : k.color)); return m; })() };
  if (S.extra) S.extra(g, body, mats, kk);
  const H = S.body.boundingBox.max.y;
  if (k.chips) addChips(g, body, H);
  if (k.mood) addFace(g, body, k.mood, H * S.faceY + (S.crescent ? 0.02 : 0.06));
  addTops(g, body, k, H);
  const box = new THREE.Box3().setFromObject(g);
  g.userData.H = box.max.y; g.userData.R = Math.max(box.max.x, -box.min.x, box.max.z, -box.min.z); g.userData.skin = skin; g.userData.stretchy = !!shape.stretchy; g.userData.kindDef = k;
  return g;
}

// ---- squish (CPU deformation with a slow rise) ----------------------------------
export function makeSquish(g) {
  const parts = []; g.traverse((o) => { if (o.isMesh && !o.userData.cap) parts.push({ geo: o.geometry, rest: o.geometry.attributes.position.array.slice(), normals: !o.userData.noSquishNormals }); });
  const H = g.userData.H, R = g.userData.R, press = new V3(0, H, 0);
  const k = g.userData.kindDef; const mood = k && k.id === "mood-mochi" ? [new THREE.Color(k.color), new THREE.Color(k.color2)] : null;
  let s = 0, wob = 0, wobV = 0, last = -1, holding = false;
  function apply() {
    const sq = s, ws = wob;
    for (const P of parts) {
      const a = P.geo.attributes.position.array, r = P.rest;
      for (let i = 0; i < a.length; i += 3) {
        const x = r[i], y = r[i + 1], z = r[i + 2], t = Math.min(1, Math.max(0, y / H));
        const squash = 1 - 0.42 * sq + ws * 0.06;                               // flatten…
        const bulge = 1 + (0.34 * sq - ws * 0.05) * (0.25 + 0.75 * Math.sin(Math.PI * t)); // …and spread out round the middle
        const dx = x - press.x, dy = y - press.y, dz = z - press.z; const dent = Math.exp(-(dx * dx + dy * dy + dz * dz) / (0.5 * R * R)) * 0.16 * sq * H;
        a[i] = x * bulge; a[i + 1] = y * squash - dent * t; a[i + 2] = z * bulge;
      }
      P.geo.attributes.position.needsUpdate = true; if (P.normals && P.geo.userData.seams) finishNormals(P.geo); else if (P.normals) P.geo.computeVertexNormals();
    }
    if (mood) g.userData.skin.color.copy(mood[0]).lerp(mood[1], Math.min(1, sq * 1.4));
  }
  return {
    get amount() { return s; },
    setPress(local) { press.copy(local); },
    hold(v) { holding = v; },
    update(dt) {
      if (holding) s += (1 - s) * Math.min(1, dt * 3.2);
      else { const prev = s; s -= s * Math.min(1, dt * 0.85); if (prev > 0.25 && s < 0.25) wobV += 2; } // the slow rise…
      wobV += (-wob * 60 - wobV * 5) * dt; wob += wobV * dt;                    // …with a little jiggle at the end
      if (Math.abs(s - last) > 0.0005 || Math.abs(wob) > 0.002) { apply(); last = s; }
    },
  };
}

// ---- pull-apart halves ------------------------------------------------------------
//  Two copies of the dumpling, each clipped at x=0, with a cross-section "cap" showing the filling.
function outline(g) {
  const pts = [];
  g.traverse((o) => { if (!o.isMesh || !o.userData.section) return; const p = o.geometry.attributes.position, ix = o.geometry.index.array;
    for (let i = 0; i < ix.length; i += 3) for (let e = 0; e < 3; e++) { const a = ix[i + e], b = ix[i + ((e + 1) % 3)]; const xa = p.getX(a), xb = p.getX(b); if ((xa < 0) !== (xb < 0)) { const t = xa / (xa - xb); pts.push([p.getZ(a) + (p.getZ(b) - p.getZ(a)) * t, p.getY(a) + (p.getY(b) - p.getY(a)) * t]); } } });
  if (!pts.length) return null;
  let cz = 0, cy = 0; for (const [z, y] of pts) { cz += z; cy += y; } cz /= pts.length; cy /= pts.length;
  const N = 72, bins = new Array(N).fill(0);
  for (const [z, y] of pts) { const a = Math.atan2(y - cy, z - cz), b = Math.floor(((a + Math.PI) / TAU) * N) % N; bins[b] = Math.max(bins[b], Math.hypot(z - cz, y - cy)); }
  for (let i = 0; i < N; i++) if (!bins[i]) { let l = i, r = i; while (!bins[(l + N) % N] && l > i - N) l--; while (!bins[r % N] && r < i + N) r++; bins[i] = (bins[(l + N) % N] + bins[r % N]) / 2; }
  return { cz, cy, ring: bins.map((r, i) => { const a = ((i + 0.5) / N) * TAU - Math.PI; return [cz + Math.cos(a) * r, cy + Math.sin(a) * r]; }) };
}
function capGeo(ring, cz, cy, scale, side) {
  const sh = new THREE.Shape(ring.map(([z, y]) => new THREE.Vector2(side * (cz + (z - cz) * scale), cy + (y - cy) * scale)));
  const geo = new THREE.ShapeGeometry(sh, 2); geo.computeBoundingBox(); const bb = geo.boundingBox, uv = geo.attributes.uv, p = geo.attributes.position;
  const span = Math.max(bb.max.x - bb.min.x, bb.max.y - bb.min.y); for (let i = 0; i < p.count; i++) uv.setXY(i, (p.getX(i) - bb.min.x) / span, (p.getY(i) - bb.min.y) / span);
  return geo;
}
export function makeHalves(kind) {
  const k = typeof kind === "string" ? byId(kind) : kind; const F = FILLS[k.fill];
  const src = buildDumpling(k); const ol = outline(src);
  const doughC = src.userData.kindDef.finish === "gold" ? 0xffc93c : k.vc ? 0xfff0f6 : ["galaxy", "holo", "glow"].includes(k.finish) ? 0xf3ecff : k.color;
  const halves = [];
  for (const side of [-1, 1]) { // -1 = left (keeps x<0), +1 = right
    const half = new THREE.Group(); const inner = src.clone(true); half.add(inner);
    const plane = new THREE.Plane(new V3(side, 0, 0), 0);
    inner.traverse((o) => { if (o.isMesh) { o.geometry = o.geometry.clone(); o.material = o.material.clone(); o.material.clippingPlanes = [plane]; o.material.side = THREE.DoubleSide; o.material.shadowSide = THREE.DoubleSide; } });
    const anchors = [];
    if (ol) {
      const ringG = capGeo(ol.ring, ol.cz, ol.cy, 0.995, side), fillG = capGeo(ol.ring, ol.cz, ol.cy, 0.82, side);
      const rot = side < 0 ? Math.PI / 2 : -Math.PI / 2;
      const doughM = new THREE.MeshPhysicalMaterial({ color: doughC, roughness: 0.6, sheen: 0.4, side: THREE.DoubleSide, metalness: k.finish === "gold" ? 0.8 : 0 });
      const fillM = new THREE.MeshPhysicalMaterial({ map: fillTex(k.fill), roughness: F.gel ? 0.08 : 0.6, clearcoat: F.gel ? 1 : 0.2, clearcoatRoughness: 0.05, side: THREE.DoubleSide, emissive: F.glow ? 0x7dff6a : 0x000000, emissiveIntensity: F.glow ? 0.7 : 0, iridescence: F.holo ? 1 : 0 });
      const ring = new THREE.Mesh(ringG, doughM); ring.rotation.y = rot; ring.position.x = side * -0.002; ring.userData.cap = true; half.add(ring);
      const fill = new THREE.Mesh(fillG, fillM); fill.rotation.y = rot; fill.position.x = side * -0.006; fill.userData.cap = true; half.add(fill);
      const sx = side * -0.01; const fc = new V3(sx, ol.cy, ol.cz); const rad = Math.min(...ol.ring.map(([z, y]) => Math.hypot(z - ol.cz, y - ol.cy))) * 0.8;
      // gel bulges out of the cut like a jelly dome
      if (F.gel) { const gelM = new THREE.MeshPhysicalMaterial({ color: F.rainbow ? 0xffd0a0 : F.base, transparent: true, opacity: 0.35, roughness: 0.03, clearcoat: 1, clearcoatRoughness: 0.02, depthWrite: false, emissive: F.glow ? 0x7dff6a : 0, emissiveIntensity: F.glow ? 0.5 : 0 }); const dome = new THREE.Mesh(new THREE.SphereGeometry(rad * 0.85, 32, 16, 0, TAU, 0, Math.PI / 2), gelM); dome.rotation.z = side * Math.PI / 2; dome.scale.set(1, 0.18, 1); dome.position.copy(fc); dome.userData.cap = true; half.add(dome); }
      for (let i = 0; i < 6; i++) { const a = new THREE.Object3D(); const ang = (i / 6) * TAU; a.position.set(sx, ol.cy + Math.sin(ang) * rad * 0.6, ol.cz + Math.cos(ang) * rad * 0.6); half.add(a); anchors.push(a); }
      addFillExtra(half, F, fc, rad, side);
    }
    half.userData.plane = plane; half.userData.anchors = anchors; halves.push(half);
  }
  return { halves, stretchy: !!SHAPES[k.shape].stretchy || k.fill === "cotton", fill: F, H: src.userData.H, R: src.userData.R };
}
function addFillExtra(half, F, c, rad, side) {
  const out = new V3(-side, 0, 0); const at = (dy, dz, lift) => c.clone().add(new V3(out.x * lift, dy, dz));
  if (F.extra === "beads") { const m = new THREE.MeshPhysicalMaterial({ color: 0x9fd0ff, roughness: 0.05, clearcoat: 1, transmission: LOW_TIER ? 0 : 0.6, thickness: 0.2 }); for (let i = 0; i < 9; i++) { const b = new THREE.Mesh(new THREE.SphereGeometry(rad * 0.13, 14, 10), m); const a = (i / 9) * TAU; b.position.copy(at(Math.sin(a) * rad * 0.5, Math.cos(a) * rad * 0.5, rad * 0.08)); b.userData.cap = true; half.add(b); } }
  if (F.extra === "boba") { const m = new THREE.MeshPhysicalMaterial({ color: 0x2b1408, roughness: 0.1, clearcoat: 1 }); for (let i = 0; i < 10; i++) { const b = new THREE.Mesh(new THREE.SphereGeometry(rad * 0.12, 14, 10), m); const a = i * 2.4, r = rad * (0.2 + (i % 3) * 0.17); b.position.copy(at(Math.sin(a) * r, Math.cos(a) * r, rad * 0.07)); b.userData.cap = true; half.add(b); } }
  if (F.extra === "chips") { const m = new THREE.MeshStandardMaterial({ color: 0x2e170c, roughness: 0.5 }); for (let i = 0; i < 7; i++) { const b = new THREE.Mesh(new THREE.ConeGeometry(rad * 0.09, rad * 0.12, 8), m); const a = i * 2.4; b.position.copy(at(Math.sin(a) * rad * 0.45, Math.cos(a) * rad * 0.45, rad * 0.1)); b.rotation.z = -side * Math.PI / 2; b.userData.cap = true; half.add(b); } }
  if (side > 0) return; // the surprise friends only sit in the left half
  if (F.extra === "fish") { const fish = makeFish(); fish.scale.setScalar(rad * 0.9); fish.position.copy(at(0, 0, rad * 0.22)); fish.rotation.y = Math.PI / 2; fish.userData.pop = true; half.add(fish); half.userData.friend = fish; }
  if (F.extra === "chick") { const ch = makeChicken({ chick: true }); ch.group.scale.setScalar(rad * 2.6); ch.group.position.copy(at(-rad * 0.75, 0, rad * 0.15)); ch.group.rotation.y = Math.PI / 2; half.add(ch.group); half.userData.friend = ch.group; half.userData.friendAnim = ch; }
  if (F.extra === "gem") { const gem = new THREE.Mesh(new THREE.OctahedronGeometry(rad * 0.38, 0), new THREE.MeshPhysicalMaterial({ color: 0xbff4ff, roughness: 0.02, metalness: 0.1, clearcoat: 1, iridescence: 1, emissive: 0x4fd8ff, emissiveIntensity: 0.25 })); gem.scale.y = 1.3; gem.position.copy(at(0, 0, rad * 0.3)); half.add(gem); half.userData.friend = gem; }
  if (F.extra === "coin") { const coin = makeCoin(); coin.scale.setScalar(rad * 1.3); coin.position.copy(at(0, 0, rad * 0.25)); coin.rotation.z = Math.PI / 2; half.add(coin); half.userData.friend = coin; }
  if (F.extra === "shell") { const sh = makeShell(); sh.scale.setScalar(rad * 0.9); sh.position.copy(at(-rad * 0.2, 0, rad * 0.2)); sh.rotation.y = Math.PI / 2; half.add(sh); half.userData.friend = sh; }
}

// ---- little friends & props -------------------------------------------------------
function makeFish() {
  const g = new THREE.Group(); const m = new THREE.MeshPhysicalMaterial({ color: 0xff8a2a, roughness: 0.35, clearcoat: 1 });
  const b = new THREE.Mesh(new THREE.SphereGeometry(0.3, 20, 14), m); b.scale.set(1.3, 0.85, 0.6); g.add(b);
  const t = new THREE.Mesh(new THREE.ConeGeometry(0.18, 0.26, 3), m); t.rotation.z = Math.PI / 2; t.position.x = -0.46; g.add(t);
  for (const z of [-0.15, 0.15]) { const e = new THREE.Mesh(new THREE.SphereGeometry(0.045, 10, 8), glossBlack()); e.position.set(0.22, 0.06, z); g.add(e); }
  for (const x of [-0.05, 0.12]) { const s = new THREE.Mesh(new THREE.TorusGeometry(0.2, 0.03, 6, 20, Math.PI), new THREE.MeshStandardMaterial({ color: 0xffffff })); s.position.x = x; s.rotation.y = Math.PI / 2; s.scale.set(0.6, 1, 1); g.add(s); }
  return g;
}
function makeShell() {
  const g = new THREE.Group(); const m = new THREE.MeshPhysicalMaterial({ color: 0xffc4d6, roughness: 0.3, clearcoat: 1, iridescence: 0.6 });
  for (let i = 0; i < 7; i++) { const r = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.02, 0.5, 8), m); const a = -0.9 + (i / 6) * 1.8; r.position.set(Math.sin(a) * 0.22, Math.cos(a) * 0.22, 0); r.rotation.z = -a; g.add(r); }
  const fan = new THREE.Mesh(new THREE.CircleGeometry(0.46, 24, Math.PI / 2 - 0.95, 1.9), m); fan.material.side = THREE.DoubleSide; g.add(fan); return g;
}
export function makeCoin() {
  const g = new THREE.Group(); const m = new THREE.MeshPhysicalMaterial({ color: 0xffc93c, metalness: 0.85, roughness: 0.25, clearcoat: 1, emissive: 0xb07800, emissiveIntensity: 0.75 });
  const c = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.06, 32), m); c.rotation.x = Math.PI / 2; g.add(c);
  const rim = new THREE.Mesh(new THREE.TorusGeometry(0.3, 0.025, 8, 32), m); g.add(rim);
  const star = new THREE.Shape(); for (let i = 0; i < 10; i++) { const r = i % 2 ? 0.07 : 0.16, a = (i / 10) * TAU + Math.PI / 2; i ? star.lineTo(Math.cos(a) * r, Math.sin(a) * r) : star.moveTo(Math.cos(a) * r, Math.sin(a) * r); }
  for (const z of [0.031, -0.031]) { const s = new THREE.Mesh(new THREE.ExtrudeGeometry(star, { depth: 0.012, bevelEnabled: false }), m); s.position.z = z > 0 ? z : z - 0.012; g.add(s); }
  // all one material → bake into a single mesh (one draw call per coin)
  const geos = g.children.map((c) => { c.updateMatrix(); const ge = (c.geometry.index ? c.geometry.toNonIndexed() : c.geometry.clone()).applyMatrix4(c.matrix); for (const k of Object.keys(ge.attributes)) if (!['position', 'normal', 'uv'].includes(k)) ge.deleteAttribute(k); return ge; });
  const out = new THREE.Group(); out.add(new THREE.Mesh(mergeGeometries(geos), m)); return out;
}
export function makeEgg(golden = false) {
  const geo = new THREE.SphereGeometry(0.16, 20, 14); const p = geo.attributes.position; for (let i = 0; i < p.count; i++) { const y = p.getY(i); p.setY(i, y * 1.3); const k = 1 - y * 0.9; p.setX(i, p.getX(i) * k); p.setZ(i, p.getZ(i) * k); } geo.computeVertexNormals();
  const m = golden ? new THREE.MeshPhysicalMaterial({ color: 0xffc93c, metalness: 1, roughness: 0.2, clearcoat: 1, emissive: 0x6a4a00, emissiveIntensity: 0.4 }) : new THREE.MeshPhysicalMaterial({ color: 0xf4e3cf, roughness: 0.55, clearcoat: 0.3 });
  const e = new THREE.Mesh(geo, m); e.position.y = 0.2; return e;
}

// ---- chickens (yes, you can buy a chicken) ----------------------------------------
export const CHICKEN_COLORS = [{ name: "White", body: 0xf7f3ea, wing: 0xe9e2d4 }, { name: "Brown", body: 0xa65a2a, wing: 0x7f3f1b }, { name: "Golden", body: 0xe0a95c, wing: 0xc98c3f }, { name: "Black", body: 0x2a2a30, wing: 0x1a2a24 }, { name: "Speckled", body: 0xd9d2c5, wing: 0x8a8070 }, { name: "Sky Blue", body: 0x8ec5ff, wing: 0x5a9be8 }, { name: "Bubblegum", body: 0xffb3d1, wing: 0xff7fb0 }, { name: "Lavender", body: 0xd2b8ff, wing: 0xa98bea }, { name: "Mint", body: 0xa8f0cf, wing: 0x6fd3a5 }, { name: "Sunshine", body: 0xffe066, wing: 0xffc21a }];
let chickEye = null; const chickMats = new Map(); const chickMat = (c, o = {}) => { const k = `${c}:${JSON.stringify(o)}`; if (!chickMats.has(k)) chickMats.set(k, new THREE.MeshStandardMaterial({ color: c, roughness: 0.92, ...o })); return chickMats.get(k); };
export function makeChicken({ color = CHICKEN_COLORS[0], chick = false } = {}) {
  const g = new THREE.Group(); const soft = (c) => chickMat(c);
  const bodyC = chick ? 0xffe066 : color.body, wingC = chick ? 0xffd23d : color.wing;
  const legM = chickMat(0xf2a33a, { roughness: 0.5 }), beakM = chickMat(0xffb02e, { roughness: 0.4 }), red = chickMat(0xe0312b, { roughness: 0.55 }), shineM = chickMat(0xffffff, { emissive: 0xffffff });
  const rig = new THREE.Group(); g.add(rig);
  const body = new THREE.Mesh(new THREE.SphereGeometry(0.22, 24, 18), soft(bodyC)); body.scale.set(0.95, 0.88, chick ? 1 : 1.25); body.position.y = 0.33; rig.add(body);
  const breast = new THREE.Mesh(new THREE.SphereGeometry(0.15, 18, 12), soft(bodyC)); breast.position.set(0, 0.36, 0.14); rig.add(breast);
  if (!chick) for (let i = 0; i < 4; i++) { const f = new THREE.Mesh(new THREE.SphereGeometry(0.1, 12, 8), soft(i % 2 ? wingC : bodyC)); f.scale.set(0.45, 1.3, 0.6); f.position.set((i - 1.5) * 0.045, 0.46, -0.3); f.rotation.x = -1.05; rig.add(f); }
  const wings = []; for (const s of [-1, 1]) { const piv = new THREE.Group(); piv.position.set(s * 0.19, 0.4, 0); const w = new THREE.Mesh(new THREE.SphereGeometry(0.14, 16, 10), soft(wingC)); w.scale.set(0.3, 0.75, 1.1); w.position.set(0, -0.04, -0.02); piv.add(w); rig.add(piv); wings.push(piv); }
  const head = new THREE.Group(); head.position.set(0, chick ? 0.56 : 0.6, chick ? 0.08 : 0.17); rig.add(head);
  head.add(new THREE.Mesh(new THREE.SphereGeometry(chick ? 0.15 : 0.11, 20, 14), soft(bodyC)));
  const beak = new THREE.Mesh(new THREE.ConeGeometry(0.035, 0.09, 10), beakM); beak.rotation.x = Math.PI / 2; beak.position.set(0, -0.01, chick ? 0.16 : 0.12); head.add(beak);
  if (!chick) { for (let i = 0; i < 3; i++) { const c = new THREE.Mesh(new THREE.SphereGeometry(0.04 - Math.abs(i - 1) * 0.006, 10, 8), red); c.scale.set(0.6, 1, 1); c.position.set(0, 0.11 + (i === 1 ? 0.02 : 0), -0.03 + i * 0.04); head.add(c); }
    const wat = new THREE.Mesh(new THREE.SphereGeometry(0.03, 10, 8), red); wat.scale.set(0.8, 1.4, 0.7); wat.position.set(0, -0.07, 0.09); head.add(wat); }
  const eyeM = chickEye || (chickEye = glossBlack()); for (const s of [-1, 1]) { const e = new THREE.Mesh(new THREE.SphereGeometry(chick ? 0.028 : 0.022, 10, 8), eyeM); e.position.set(s * (chick ? 0.08 : 0.075), 0.03, chick ? 0.11 : 0.06); head.add(e); const sh = new THREE.Mesh(new THREE.SphereGeometry(0.008, 6, 4), shineM); sh.position.set(s * (chick ? 0.088 : 0.082), 0.04, chick ? 0.135 : 0.08); head.add(sh); }
  const legs = []; for (const s of [-1, 1]) { const piv = new THREE.Group(); piv.position.set(s * 0.08, 0.2, 0); const l = new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.016, 0.2, 6), legM); l.position.y = -0.1; piv.add(l); for (const a of [-0.5, 0, 0.5]) { const t = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.01, 0.09, 5), legM); t.rotation.x = Math.PI / 2; t.position.set(Math.sin(a) * 0.04, -0.195, Math.cos(a) * 0.04); t.rotation.y = a; piv.add(t); } rig.add(piv); legs.push(piv); }
  for (const grp of [rig, head, ...legs]) mergeStatic(grp); // one draw per material instead of one per part
  let flap = 0;
  return { group: g, head, flapNow() { flap = 0.7; },
    update(dt, t, speed = 0, peck = false) {
      const ph = t * 14; legs[0].rotation.x = Math.sin(ph) * 0.6 * speed; legs[1].rotation.x = -Math.sin(ph) * 0.6 * speed;
      rig.position.y = Math.abs(Math.sin(ph)) * 0.025 * speed + (flap > 0 ? Math.sin((flap / 0.7) * Math.PI) * 0.25 : 0);
      head.position.z = (chick ? 0.08 : 0.17) + Math.sin(ph) * 0.03 * speed; head.rotation.x = peck ? Math.max(0, Math.sin(t * 9)) * 0.9 : 0;
      flap = Math.max(0, flap - dt); const w = flap > 0 ? Math.sin(t * 40) * 0.9 + 0.6 : 0; wings[0].rotation.z = -w; wings[1].rotation.z = w;
    } };
}

// ---- bamboo steamer (the blind box!) ----------------------------------------------
const bambooTex = () => canvasTex("bamboo", 512, (g, n) => { g.fillStyle = "#d8b475"; g.fillRect(0, 0, n, n); for (let i = 0; i < 64; i++) { const x = (i / 64) * n; const v = rnd(-14, 14); g.fillStyle = `rgb(${200 + v},${165 + v},${100 + v})`; g.fillRect(x, 0, n / 64 - 1.5, n); g.fillStyle = "rgba(90,60,20,.35)"; g.fillRect(x + n / 64 - 1.5, 0, 1.5, n); } for (let i = 0; i < 300; i++) { g.fillStyle = "rgba(120,80,30,.12)"; g.fillRect(rnd(0, n), rnd(0, n), 1, rnd(6, 30)); } });
const weaveTex = () => canvasTex("weave", 512, (g, n) => { g.fillStyle = "#c9a160"; g.fillRect(0, 0, n, n); const s = 16; for (let y = 0; y < n; y += s) for (let x = 0; x < n; x += s) { const h = ((x + y) / s) % 2 === 0; const v = rnd(-12, 12); g.fillStyle = `rgb(${215 + v},${180 + v},${115 + v})`; if (h) g.fillRect(x + 1, y + 3, s - 2, s - 6); else g.fillRect(x + 3, y + 1, s - 6, s - 2); } g.strokeStyle = "rgba(90,60,20,.4)"; for (let i = 0; i < n; i += s) { g.beginPath(); g.moveTo(i, 0); g.lineTo(i, n); g.stroke(); g.beginPath(); g.moveTo(0, i); g.lineTo(n, i); g.stroke(); } });
export function makeSteamer(r = 1.45, h = 0.62) {
  const g = new THREE.Group(); const side = new THREE.MeshStandardMaterial({ map: bambooTex(), roughness: 0.7, side: THREE.DoubleSide }); const woven = new THREE.MeshStandardMaterial({ map: weaveTex(), roughness: 0.85 });
  const band = new THREE.MeshStandardMaterial({ color: 0xb8894a, roughness: 0.6 });
  const base = new THREE.Group(); g.add(base);
  base.add(new THREE.Mesh(new THREE.CylinderGeometry(r, r, h, 48, 1, true), side)).position.y = h / 2;
  const floor = new THREE.Mesh(new THREE.CircleGeometry(r * 0.98, 48), woven); floor.rotation.x = -Math.PI / 2; floor.position.y = 0.06; base.add(floor);
  for (const y of [0.04, h - 0.04]) { const t = new THREE.Mesh(new THREE.TorusGeometry(r + 0.01, 0.045, 8, 64), band); t.rotation.x = Math.PI / 2; t.position.y = y; base.add(t); }
  // parchment liner with little steam holes
  const paperTex = canvasTex("paper", 256, (c, n) => { c.fillStyle = "#fffaf0"; c.fillRect(0, 0, n, n); c.globalCompositeOperation = "destination-out"; for (let y = 16; y < n; y += 28) for (let x = 16 + ((y / 28) % 2) * 14; x < n; x += 28) { c.beginPath(); c.arc(x, y, 3.2, 0, TAU); c.fill(); } });
  const paper = new THREE.Mesh(new THREE.CircleGeometry(r * 0.9, 48), new THREE.MeshStandardMaterial({ map: paperTex, roughness: 0.9, transparent: true, alphaTest: 0.5 })); paper.rotation.x = -Math.PI / 2; paper.position.y = 0.07; base.add(paper);
  const lid = new THREE.Group(); lid.position.y = h; g.add(lid);
  lid.add(new THREE.Mesh(new THREE.CylinderGeometry(r * 1.03, r * 1.03, h * 0.55, 48, 1, true), side)).position.y = h * 0.2;
  const top = new THREE.Mesh(new THREE.CylinderGeometry(r * 1.0, r * 1.03, 0.05, 48), woven); top.position.y = h * 0.47; lid.add(top);
  const dome = new THREE.Mesh(new THREE.SphereGeometry(r, 48, 8, 0, TAU, 0, 0.25), woven); dome.position.y = h * 0.47 - r * Math.cos(0.25) + 0.02; lid.add(dome);
  for (const y of [-0.05, h * 0.46]) { const t = new THREE.Mesh(new THREE.TorusGeometry(r * 1.04, 0.045, 8, 64), band); t.rotation.x = Math.PI / 2; t.position.y = y; lid.add(t); }
  g.userData.lid = lid; g.userData.base = base; return g;
}
