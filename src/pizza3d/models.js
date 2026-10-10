// ==========================================================================
//  Emmy's Pizza Plus 3D — characters and props, all toon-shaded.
//
//  makeBuddy(look)        → { group, walk(t, speed), parts }  — you! (big head, chunky body)
//  makeKeeper(kind)       → { group, update(dt, t), face }     — the food shopkeepers
//  makeCritter(kind)      → { group, update(dt, t, speed) }    — townsfolk (mushroom kids, a pigeon)
//  makeBox(kind)          → { group, lid, body, shake(), open() } — the mystery bags & boxes
//  makeHat(id)            → Group                               — hats from the Hat Hut
// ==========================================================================
import { THREE, part, group, rbox, ball, capsule, pill, torus, sliceGeo, makeFace, toon, COL, INK, makePizza, signBoard, blobShadow, dyn, mergeStatic } from "./toon.js";

// --------------------------------------------------------------------------
//  Hats
// --------------------------------------------------------------------------
export const HATS = [
  { id: "none", name: "No hat", ico: "🙂", price: 0 },
  { id: "chef", name: "Chef Hat", ico: "👨‍🍳", price: 0 },
  { id: "slice", name: "Pizza Slice Hat", ico: "🍕", price: 20 },
  { id: "crown", name: "Cheese Crown", ico: "👑", price: 35 },
  { id: "propeller", name: "Propeller Cap", ico: "🧢", price: 25 },
  { id: "mushroom", name: "Mushroom Cap", ico: "🍄", price: 20 },
  { id: "olive", name: "Olive Beanie", ico: "🫒", price: 15 },
  { id: "box", name: "Pizza Box Hat", ico: "📦", price: 30 },
];
export function makeHat(id) {
  const g = new THREE.Group();
  if (id === "chef") { g.add(part(pill(0.3, 0.3, 0.16, 0.05), COL.white, { y: 0.06 })); for (const [x, z] of [[0, 0], [0.16, 0.06], [-0.16, 0.06], [0, -0.14]]) g.add(part(ball(0.2), COL.white, { x, y: 0.3, z })); }
  else if (id === "slice") { const s = part(sliceGeo(0.7, 0.6, 0.08), COL.cheese, { rx: -Math.PI / 2, y: 0.08, z: 0.05, rz: Math.PI }); g.add(s); g.add(part(capsule(0.06, 0.5), COL.crust, { rz: Math.PI / 2, y: 0.12, z: -0.3 })); for (const [x, z] of [[0, 0.05], [-0.12, -0.15], [0.12, -0.12]]) g.add(part(pill(0.06, 0.06, 0.03, 0.01), COL.pepperoni, { ol: 0.5, x, y: 0.15, z })); }
  else if (id === "crown") { g.add(part(pill(0.27, 0.27, 0.2, 0.04), COL.cheese, { y: 0.1 })); for (let i = 0; i < 5; i++) { const a = (i / 5) * Math.PI * 2; g.add(part(new THREE.ConeGeometry(0.08, 0.2, 10), COL.cheese, { x: Math.cos(a) * 0.22, z: Math.sin(a) * 0.22, y: 0.28 })); g.add(part(ball(0.035), COL.tomato, { ol: 0.5, x: Math.cos(a) * 0.27, z: Math.sin(a) * 0.27, y: 0.12 })); } }
  else if (id === "propeller") { g.add(part(ball(0.31, 20, 10), COL.tomato, { sy: 0.55, y: 0.02 })); g.add(part(rbox(0.3, 0.04, 0.2, 0.02), COL.basil, { z: 0.3, y: 0.0 })); g.add(part(capsule(0.025, 0.14), COL.gold, { y: 0.26 })); const p = group(part(rbox(0.5, 0.03, 0.09, 0.015), COL.gold), part(rbox(0.09, 0.03, 0.5, 0.015), 0x6ec6ff)); p.position.y = 0.36; p.userData.spin = 9; g.add(p); }
  else if (id === "mushroom") { g.add(part(ball(0.4, 22, 12), COL.tomato, { sy: 0.55, y: 0.06 })); for (const [x, y, z] of [[0, 0.27, 0], [0.24, 0.17, 0.1], [-0.22, 0.18, 0.12], [0.05, 0.17, -0.26]]) g.add(part(ball(0.07, 10, 8), COL.white, { ol: 0.5, x, y, z, sy: 0.5 })); }
  else if (id === "olive") { g.add(part(ball(0.3, 20, 12), COL.olive, { sy: 0.7, y: 0.04 })); g.add(part(torus(0.1, 0.04), 0xff5a5f, { rx: Math.PI / 2, y: 0.24 })); }
  else if (id === "box") { g.add(part(rbox(0.62, 0.14, 0.62, 0.04), COL.cream, { y: 0.08 })); const s = signBoard("PIZZA", 0.5, 0.2, { bg: "#fff4dc", fg: "#e63b2e", size: 90, border: 0, stroke: "#fff4dc" }); s.rotation.x = -Math.PI / 2; s.position.y = 0.16; g.add(s); }
  g.traverse((o) => { if (o.userData.spin) dyn(o); }); mergeStatic(g);
  return g;
}

// --------------------------------------------------------------------------
//  You — a chunky little pizza chef with a big round head
// --------------------------------------------------------------------------
export const LOOK = { skin: [0xffdcc2, 0xf3c39b, 0xe0a57a, 0xc48250, 0x8d5a3c, 0x5c3a21], hair: [0x6b3e1e, 0x2a1a12, 0xf0c35a, 0xb5401f, 0xff7fbf, 0x7a5cff, 0x4aa8ff], hairStyle: ["bob", "pigtails", "bun", "short", "long"], shirt: [0xf2483a, 0xffd23f, 0x4dbb5a, 0x4aa8ff, 0xff86b3, 0x9a6bff, 0xffffff, 0xff9a3c], pants: [0x4a6bd6, 0x3b2b4a, 0xff86b3, 0xe8b26a, 0x4dbb5a] };
export const DEFAULT_LOOK = { skin: 0xffdcc2, hair: 0x6b3e1e, hairStyle: "pigtails", shirt: 0xf2483a, pants: 0x4a6bd6, hat: "chef" };
let hairCap = null; const HAIR_CAP = () => hairCap || (hairCap = new THREE.SphereGeometry(0.46, 26, 14, 0, Math.PI * 2, 0, Math.PI * 0.52));
export function makeBuddy(look = {}) {
  const L = { ...DEFAULT_LOOK, ...look }; const g = new THREE.Group(); const parts = {};
  const body = new THREE.Group(); g.add(body); parts.body = body;
  const legL = part(capsule(0.12, 0.22), L.pants, { x: -0.13, y: 0.24 }), legR = part(capsule(0.12, 0.22), L.pants, { x: 0.13, y: 0.24 });
  legL.add(part(ball(0.14, 14, 10), 0xffffff, { y: -0.3, z: 0.05, sy: 0.6 })); legR.add(part(ball(0.14, 14, 10), 0xffffff, { y: -0.3, z: 0.05, sy: 0.6 }));
  for (const l of [legL, legR]) { l.geometry = l.geometry.clone(); l.geometry.translate(0, -0.1, 0); l.children[0].geometry = l.geometry; l.position.y = 0.42; } // pivot at the hip
  body.add(legL, legR); parts.legL = legL; parts.legR = legR;
  const torso = part(pill(0.27, 0.33, 0.5, 0.16), L.shirt, { y: 0.66 }); body.add(torso);
  torso.add(part(pill(0.3, 0.3, 0.06, 0.03), 0xffffff, { y: -0.08, sx: 1.02 })); // apron band
  torso.add(part(rbox(0.32, 0.26, 0.06, 0.03), 0xffffff, { y: -0.02, z: 0.27 })); // apron
  const armL = new THREE.Group(), armR = new THREE.Group(); armL.position.set(-0.32, 0.86, 0); armR.position.set(0.32, 0.86, 0);
  armL.add(part(capsule(0.08, 0.26), L.shirt, { y: -0.17 })); armL.add(part(ball(0.1, 12, 10), L.skin, { y: -0.36 }));
  armR.add(part(capsule(0.08, 0.26), L.shirt, { y: -0.17 })); armR.add(part(ball(0.1, 12, 10), L.skin, { y: -0.36 }));
  armL.rotation.z = 0.25; armR.rotation.z = -0.25; body.add(armL, armR); parts.armL = armL; parts.armR = armR;
  const head = new THREE.Group(); head.position.y = 1.32; body.add(head); parts.head = head;
  head.add(part(ball(0.44, 26, 18), L.skin, { sy: 0.94 }));
  for (const s of [-1, 1]) head.add(part(ball(0.09, 10, 8), L.skin, { x: s * 0.43, y: -0.02 }));
  const face = makeFace(0.62, "happy"); face.position.set(0, -0.04, 0.42); head.add(face); parts.face = face;
  // hair
  const hc = L.hair, st = L.hairStyle;
  head.add(part(HAIR_CAP(), hc, { y: 0.04, rx: -0.35, sx: 1.02, sz: 1.02 }));
  if (st === "pigtails") for (const s of [-1, 1]) { head.add(part(ball(0.17, 14, 12), hc, { x: s * 0.46, y: 0.06, z: -0.1 })); head.add(part(ball(0.06, 10, 8), COL.cheese, { ol: 0.5, x: s * 0.37, y: 0.14, z: -0.06 })); }
  else if (st === "bun") head.add(part(ball(0.2, 16, 12), hc, { y: 0.48, z: -0.1 }));
  else if (st === "long") head.add(part(rbox(0.8, 0.62, 0.32, 0.15), hc, { y: -0.2, z: -0.22 }));
  else if (st === "bob") head.add(part(rbox(0.94, 0.44, 0.6, 0.2), hc, { y: -0.06, z: -0.1 }));
  if (L.hat && L.hat !== "none") { const h = makeHat(L.hat); h.position.y = 0.36; h.scale.setScalar(1.15); head.add(h); parts.hat = h; }
  g.add(blobShadow(0.5, 0.3));
  for (const o of [legL, legR, armL, armR, head]) dyn(o); if (parts.hat) parts.hat.traverse((o) => { if (o.userData.spin) dyn(o); });
  mergeStatic(body); mergeStatic(head); mergeStatic(armL); mergeStatic(armR); for (const l of [legL, legR]) { l.userData.dyn = false; }
  let bob = 0;
  function walk(t, speed = 0, dt = 0.016) {
    bob += dt * (6 + speed * 8); const sw = Math.sin(bob) * 0.7 * Math.min(1, speed);
    legL.rotation.x = sw; legR.rotation.x = -sw; armL.rotation.x = -sw * 0.8; armR.rotation.x = sw * 0.8;
    body.position.y = Math.abs(Math.sin(bob)) * 0.07 * Math.min(1, speed) + Math.sin(t * 2) * 0.01; head.rotation.z = Math.sin(t * 1.3) * 0.04;
    body.scale.set(1 + Math.sin(t * 2.4) * 0.012, 1 - Math.sin(t * 2.4) * 0.012, 1);
    if (parts.hat) parts.hat.traverse((o) => { if (o.userData.spin) o.rotation.y += dt * o.userData.spin; });
  }
  return { group: g, walk, parts };
}

// --------------------------------------------------------------------------
//  Shopkeepers — food folks with faces
// --------------------------------------------------------------------------
const arm = (c, x, y, side) => { const a = new THREE.Group(); a.position.set(x, y, 0); a.add(part(capsule(0.07, 0.24), c, { y: -0.14 })); a.add(part(ball(0.09, 10, 8), 0xffffff, { y: -0.32 })); a.rotation.z = side * 0.5; return a; };
export function makeKeeper(kind) {
  const g = new THREE.Group(); const body = new THREE.Group(); g.add(body); let face, armL, armR, extra = null;
  if (kind === "slice") { // Papa Pepperoni — a big pizza slice with a moustache
    const s = part(sliceGeo(1.6, 1.3, 0.24), COL.cheese, { rz: Math.PI, y: 1.25 }); body.add(s);
    body.add(part(capsule(0.17, 1.15), COL.crust, { rz: Math.PI / 2, y: 2.05 }));
    for (const [x, y] of [[-0.3, 1.55], [0.32, 1.65], [0.02, 0.85], [-0.12, 1.25]]) body.add(part(pill(0.13, 0.13, 0.05, 0.02), COL.pepperoni, { ol: 0.6, rx: Math.PI / 2, x, y, z: 0.16 }));
    face = makeFace(0.62, "happy"); face.position.set(0.05, 1.45, 0.17); body.add(face);
    const mo = group(part(capsule(0.06, 0.2), 0x5a3220, { rz: 1.2, x: -0.12 }), part(capsule(0.06, 0.2), 0x5a3220, { rz: -1.2, x: 0.12 })); mo.position.set(0.05, 1.33, 0.22); body.add(mo);
    const hat = makeHat("chef"); hat.position.set(0, 2.15, 0); hat.scale.setScalar(1.2); body.add(hat);
    armL = arm(COL.cheese, -0.55, 1.6, 1); armR = arm(COL.cheese, 0.55, 1.6, -1); body.add(armL, armR);
    for (const x of [-0.18, 0.18]) body.add(part(capsule(0.08, 0.3), COL.crustDeep, { x, y: 0.25 }));
  } else if (kind === "mouse") { // Mozzy — a cheese-loving mouse
    body.add(part(ball(0.55, 22, 16), 0xc9c3d6, { y: 0.75, sy: 1.15 }));
    body.add(part(ball(0.42, 22, 16), 0xc9c3d6, { y: 1.55 }));
    for (const s of [-1, 1]) { const e = part(pill(0.26, 0.26, 0.06, 0.03), 0xc9c3d6, { rx: Math.PI / 2, x: s * 0.34, y: 1.95, z: -0.05 }); e.add(part(pill(0.17, 0.17, 0.03, 0.01), COL.pink, { ol: 0, y: 0.03 })); body.add(e); }
    face = makeFace(0.56, "happy"); face.position.set(0, 1.52, 0.4); body.add(face);
    body.add(part(ball(0.08, 10, 8), COL.pink, { ol: 0.6, y: 1.48, z: 0.43 }));
    body.add(part(rbox(0.7, 0.32, 0.12, 0.05), COL.white, { y: 0.85, z: 0.5 })); // apron
    armL = arm(0xc9c3d6, -0.5, 1.05, 1); armR = arm(0xc9c3d6, 0.5, 1.05, -1); body.add(armL, armR);
    const cheese = part(new THREE.CylinderGeometry(0.28, 0.28, 0.22, 3), COL.cheese, { ry: 0.5 }); cheese.position.set(0, -0.36, 0.05); armR.add(cheese);
    const tail = part(torus(0.3, 0.04, Math.PI * 1.3), COL.pink, { y: 0.4, z: -0.5, ry: Math.PI / 2 }); body.add(tail);
  } else if (kind === "soda") { // Fizz — a soda cup with a bendy straw
    body.add(part(pill(0.55, 0.42, 1.3, 0.12), COL.soda, { y: 0.85 }));
    for (const y of [0.55, 0.95]) body.add(part(pill(0.53, 0.5, 0.14, 0.05), 0xffffff, { ol: 0, y, sx: 1.01, sz: 1.01 }));
    body.add(part(pill(0.6, 0.6, 0.12, 0.05), 0xffffff, { y: 1.55 }));
    body.add(part(capsule(0.06, 0.7), 0x4aa8ff, { y: 1.95, x: 0.12, rz: -0.15 }));
    face = makeFace(0.6, "happy"); face.position.set(0, 1.12, 0.52); body.add(face);
    armL = arm(COL.soda, -0.5, 1.05, 1); armR = arm(COL.soda, 0.5, 1.05, -1); body.add(armL, armR);
    const bubbles = new THREE.Group(); for (let i = 0; i < 5; i++) bubbles.add(part(ball(0.06, 8, 6), 0xffffff, { ol: 0.4, x: (Math.random() - 0.5) * 0.6, y: 1.6, z: (Math.random() - 0.5) * 0.4 })); body.add(bubbles); extra = (dt, t) => bubbles.children.forEach((b, i) => { b.position.y = 1.65 + ((t * 0.5 + i * 0.2) % 1) * 0.8; b.scale.setScalar(1 - ((t * 0.5 + i * 0.2) % 1) * 0.7); });
  } else if (kind === "garlic") { // Granny Garlic — a garlic bulb grandma with glasses
    body.add(part(ball(0.62, 22, 16), 0xfaf3e6, { y: 0.8, sy: 1.05 }));
    for (let i = 0; i < 6; i++) { const a = (i / 6) * Math.PI * 2; body.add(part(ball(0.3, 14, 10), 0xf3e8d4, { ol: 0.6, x: Math.cos(a) * 0.42, z: Math.sin(a) * 0.42, y: 0.8, sy: 1.6 })); }
    body.add(part(new THREE.ConeGeometry(0.22, 0.6, 14), 0xf3e8d4, { y: 1.6 }));
    face = makeFace(0.6, "happy"); face.position.set(0, 0.95, 0.66); body.add(face);
    const gl = group(part(torus(0.12, 0.02), 0x8a5a2b, { x: -0.15 }), part(torus(0.12, 0.02), 0x8a5a2b, { x: 0.15 })); gl.position.set(0, 1.0, 0.7); body.add(gl);
    body.add(part(pill(0.4, 0.66, 0.4, 0.1), 0x9a6bff, { y: 0.35 })); // a cosy shawl-skirt
    armL = arm(0xfaf3e6, -0.62, 0.95, 1); armR = arm(0xfaf3e6, 0.62, 0.95, -1); body.add(armL, armR);
  } else { // "meatball" — Sir Meatball, in a top hat
    body.add(part(ball(0.66, 22, 16), 0x9a4a32, { y: 0.85 }));
    for (let i = 0; i < 9; i++) body.add(part(ball(0.07, 8, 6), 0x5aa648, { ol: 0.4, x: Math.sin(i * 2.1) * 0.55, y: 0.85 + Math.cos(i * 1.7) * 0.5, z: Math.cos(i * 2.1) * 0.35 + 0.12 }));
    face = makeFace(0.62, "happy"); face.position.set(0, 0.95, 0.65); body.add(face);
    const top = group(part(pill(0.42, 0.42, 0.06, 0.02), 0x3b2b4a), part(pill(0.27, 0.27, 0.5, 0.05), 0x3b2b4a, { y: 0.27 }), part(pill(0.28, 0.28, 0.1, 0.03), COL.tomato, { y: 0.1, ol: 0 })); top.position.y = 1.45; top.rotation.z = 0.12; body.add(top);
    armL = arm(0x9a4a32, -0.62, 1.0, 1); armR = arm(0x9a4a32, 0.62, 1.0, -1); body.add(armL, armR);
  }
  g.add(blobShadow(0.7, 0.3));
  dyn(armL); dyn(armR); if (kind === "soda") dyn(body.children[body.children.length - 1]); mergeStatic(body); mergeStatic(armL); mergeStatic(armR);
  const ph = Math.random() * 6; let wave = 0;
  function update(dt, t) {
    body.position.y = Math.abs(Math.sin(t * 2.2 + ph)) * 0.06; body.rotation.z = Math.sin(t * 1.1 + ph) * 0.04;
    if (wave > 0) { wave -= dt; armR.rotation.z = -2.4 + Math.sin(t * 12) * 0.35; } else { armR.rotation.z = -0.5 + Math.sin(t * 1.7 + ph) * 0.08; }
    armL.rotation.z = 0.5 + Math.sin(t * 1.5 + ph) * 0.08; extra && extra(dt, t);
  }
  return { group: g, update, face, wave: (s = 2) => (wave = s) };
}

// --------------------------------------------------------------------------
//  Townsfolk — little mushroom kids, an olive and a pigeon who wants your crust
// --------------------------------------------------------------------------
export function makeCritter(kind) {
  const g = new THREE.Group(); const body = new THREE.Group(); g.add(body); let legs = [];
  if (kind === "pigeon") {
    body.add(part(ball(0.32, 16, 12), 0x9aa6c2, { y: 0.42, sz: 1.3 })); body.add(part(ball(0.2, 14, 10), 0x8a96b8, { y: 0.72, z: 0.22 }));
    body.add(part(new THREE.ConeGeometry(0.06, 0.16, 8), COL.gold, { rx: Math.PI / 2, y: 0.7, z: 0.45 }));
    for (const s of [-1, 1]) body.add(part(ball(0.035, 8, 6), 0x222222, { ol: 0, x: s * 0.11, y: 0.77, z: 0.36 }));
    body.add(part(ball(0.14, 12, 8), 0x7fd3b0, { ol: 0, y: 0.6, z: 0.24, sx: 1.2 }));
    for (const s of [-1, 1]) { const l = part(capsule(0.03, 0.16), 0xff8a6a, { x: s * 0.1, y: 0.13 }); legs.push(l); body.add(l); }
  } else {
    const cap = kind === "olive" ? COL.olive : kind === "tomato" ? COL.tomato : 0xd9a26b;
    if (kind === "olive") { body.add(part(ball(0.4, 18, 14), COL.olive, { y: 0.6, sy: 1.2 })); body.add(part(torus(0.12, 0.05), 0xff5a5f, { rx: Math.PI / 2, y: 1.06 })); }
    else if (kind === "tomato") { body.add(part(ball(0.45, 18, 14), COL.tomato, { y: 0.6 })); for (let i = 0; i < 5; i++) body.add(part(capsule(0.04, 0.16), COL.basil, { y: 1.04, x: Math.cos(i * 1.26) * 0.08, z: Math.sin(i * 1.26) * 0.08, rz: Math.cos(i * 1.26) * 1.2, rx: Math.sin(i * 1.26) * 1.2 })); }
    else { body.add(part(pill(0.2, 0.25, 0.5, 0.1), COL.mushroom, { y: 0.45 })); body.add(part(ball(0.46, 20, 12), cap, { y: 0.78, sy: 0.6 })); for (const [x, z] of [[0.2, 0.2], [-0.25, 0.1], [0, -0.3]]) body.add(part(ball(0.06, 8, 6), COL.cream, { ol: 0.4, x, z, y: 1.0 })); }
    const f = makeFace(0.4, "happy"); f.position.set(0, kind === "mushroom" ? 0.5 : 0.62, kind === "mushroom" ? 0.24 : 0.44); body.add(f);
    for (const s of [-1, 1]) { const l = part(capsule(0.06, 0.12), kind === "mushroom" ? COL.mushroom : 0x5a3a2a, { x: s * 0.13, y: 0.12 }); legs.push(l); body.add(l); }
  }
  g.add(blobShadow(0.4, 0.25));
  legs.forEach(dyn); mergeStatic(body);
  let ph = 0;
  function update(dt, t, speed) { ph += dt * (4 + speed * 6); const sw = Math.sin(ph) * 0.6 * Math.min(1, speed); if (legs[0]) { legs[0].rotation.x = sw; legs[1].rotation.x = -sw; } body.position.y = Math.abs(Math.sin(ph)) * 0.06 * Math.min(1, speed); if (kind === "pigeon") body.rotation.x = speed > 0.1 ? Math.sin(ph * 2) * 0.12 : Math.max(0, Math.sin(t * 1.4)) * 0.5; }
  return { group: g, update };
}

// --------------------------------------------------------------------------
//  Mystery bags & boxes (each kind looks different, and they wobble when tapped)
// --------------------------------------------------------------------------
export const BOX_LOOK = {
  bag: { body: 0xd9a86b, trim: 0xb07a45, label: "🍕", word: "SNACK" },
  box: { body: 0xfff4dc, trim: 0xf2483a, label: "🍕", word: "PIZZA" },
  party: { body: 0x9a6bff, trim: 0xffd23f, label: "🎉", word: "PARTY" },
  gold: { body: 0xffc93c, trim: 0xff8a3c, label: "👑", word: "GOLDEN" },
};
export function makeBox(kind = "box") {
  const L = BOX_LOOK[kind] || BOX_LOOK.box; const g = new THREE.Group(); const body = new THREE.Group(); g.add(body); let lid = null;
  if (kind === "bag") {
    body.add(part(rbox(1.0, 1.2, 0.7, 0.08), L.body, { y: 0.6 }));
    const top = new THREE.Group(); top.position.y = 1.2; top.add(part(rbox(1.0, 0.24, 0.5, 0.06), L.trim, { y: 0.1, rx: 0.18 })); body.add(top); lid = top;
    const f = makeFace(0.55, "happy"); f.position.set(0, 0.62, 0.36); body.add(f);
    const spot = new THREE.Mesh(new THREE.CircleGeometry(0.13, 16), new THREE.MeshBasicMaterial({ color: 0xb98a4f, transparent: true, opacity: 0.7 })); spot.position.set(0.3, 0.98, 0.355); body.add(spot);
  } else {
    const H = kind === "box" ? 0.32 : 0.55, W = kind === "gold" ? 1.15 : 1.4;
    body.add(part(rbox(W, H, W, 0.06), L.body, { y: H / 2 }));
    if (kind !== "box") for (const s of [-1, 1]) body.add(part(rbox(0.14, H + 0.02, W + 0.02, 0.04), L.trim, { ol: 0, x: s * W * 0.3, y: H / 2 }));
    lid = new THREE.Group(); lid.position.set(0, H, -W / 2); body.add(lid);
    const lt = part(rbox(W + 0.04, 0.1, W + 0.04, 0.04), L.body, { y: 0.03, z: W / 2 }); lid.add(lt);
    const word = signBoard([L.word], W * 0.75, W * 0.24, { bg: kind === "box" ? "#fff4dc" : "#ffffff", fg: kind === "gold" ? "#b0570a" : "#e63b2e", size: 92, stroke: kind === "box" ? "#f2483a" : "#4a2a1a", border: 10 }); word.rotation.x = -Math.PI / 2; word.position.set(0, 0.09, W * 0.68); lid.add(word);
    const f = makeFace(0.5, "happy"); f.rotation.x = -Math.PI / 2; f.position.set(0, 0.09, W * 0.32); lid.add(f);
    if (kind === "party") for (const [x, c] of [[-0.4, COL.pink], [0.1, 0x6ec6ff], [0.45, COL.cheese]]) { const b = part(ball(0.2, 14, 12), c, { x, y: 1.1 + Math.abs(x) * 0.3, z: W * 0.3, sy: 1.15 }); lid.add(b); const str = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.9), new THREE.MeshBasicMaterial({ color: 0x4a2a1a })); str.position.set(x, 0.55, W * 0.3); lid.add(str); }
    if (kind === "gold") { const cr = makeHat("crown"); cr.position.set(0, 0.08, W * 0.5); cr.scale.setScalar(1.3); lid.add(cr); }
  }
  g.add(blobShadow(0.9, 0.3));
  if (lid) { dyn(lid); mergeStatic(lid); } mergeStatic(body);
  let jig = 0;
  return {
    group: g, body, lid, kind,
    shake(power = 1) { jig = 0.5 * power; },
    update(dt, t) { if (jig > 0) { jig = Math.max(0, jig - dt); const a = jig * 2; body.rotation.z = Math.sin(t * 40) * 0.12 * a; body.scale.set(1 + a * 0.12, 1 - a * 0.1, 1 + a * 0.12); } else { body.rotation.z *= 0.8; body.scale.lerp(new THREE.Vector3(1, 1, 1), 0.2); body.position.y = Math.abs(Math.sin(t * 2.5)) * 0.04; } },
  };
}
export { makePizza };
