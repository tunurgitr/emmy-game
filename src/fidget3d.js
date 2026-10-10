// ==========================================================================
//  fidget3d — real 3D fidget toys for the Fidget Zone + card thumbnails.
//
//  Procedural geometry only (no model/texture files → works offline), built on
//  Three.js which is LAZY-LOADED. Each toy's LOOK comes from its `model3d`
//  descriptor {shape, finish, colors[], cute} and it PLAYS per its `play` type,
//  so every toy looks and plays like the real thing. EVERY catalog toy opens
//  here in 3D; game.js keeps its 2D emoji fidgets only for when WebGL fails.
//
//  exports:
//    createFidgetScene(stageEl, toy, opts) -> { dispose }   // interactive zone
//    renderThumbnail(toy, size, tierColor) -> dataURL|null  // for toy cards
// ==========================================================================
import {
  WebGLRenderer, Scene, PerspectiveCamera, Group, Object3D,
  DirectionalLight, AmbientLight, Mesh, InstancedMesh,
  Color, Vector2, Vector3, Box3, Sphere, Raycaster, Matrix4, Quaternion, Euler, Shape as ThreeShape,
  SphereGeometry, CylinderGeometry, TorusGeometry, CircleGeometry, BoxGeometry,
  ConeGeometry, CapsuleGeometry, IcosahedronGeometry, OctahedronGeometry,
  LatheGeometry, ExtrudeGeometry, WebGLRenderTarget,
  MeshPhysicalMaterial, MeshStandardMaterial, MeshBasicMaterial,
  PMREMGenerator, ACESFilmicToneMapping, SRGBColorSpace, DoubleSide, CanvasTexture,
} from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";

// ---- shared, created once per session ------------------------------------
let renderer = null, envTex = null;
function ensureRenderer() {
  if (renderer) return renderer;
  renderer = new WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.toneMapping = ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.12;
  renderer.outputColorSpace = SRGBColorSpace;
  const pmrem = new PMREMGenerator(renderer);
  envTex = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  return renderer;
}
function addLights(scene) {
  const key = new DirectionalLight(0xfff4e0, 2.4); key.position.set(-3, 5, 4); scene.add(key);
  const rim = new DirectionalLight(0xbfe0ff, 0.9); rim.position.set(4, 2, -4); scene.add(rim);
  scene.add(new AmbientLight(0xffffff, 0.35));
}

let blobTex = null;
function blobTexture() {
  if (blobTex) return blobTex;
  const c = document.createElement("canvas"); c.width = c.height = 128;
  const g = c.getContext("2d");
  const grad = g.createRadialGradient(64, 64, 4, 64, 64, 62);
  grad.addColorStop(0, "rgba(0,0,0,.5)"); grad.addColorStop(1, "rgba(0,0,0,0)");
  g.fillStyle = grad; g.fillRect(0, 0, 128, 128);
  blobTex = new CanvasTexture(c); return blobTex;
}

// ---- materials -----------------------------------------------------------
function makeMat(finish, color) {
  const c = new Color(color || "#cccccc");
  switch (finish) {
    case "chrome": return new MeshStandardMaterial({ color: 0xf2f4f8, metalness: 1, roughness: 0.14, envMap: envTex, envMapIntensity: 1.5 });
    case "metal":  return new MeshStandardMaterial({ color: c, metalness: 1, roughness: 0.22, envMap: envTex, envMapIntensity: 1.4 });
    case "glass":  return new MeshPhysicalMaterial({ color: c, metalness: 0, roughness: 0.05, transmission: 0.9, thickness: 1.4, ior: 1.5, transparent: true, envMap: envTex, envMapIntensity: 1.3 });
    case "clear":  return new MeshPhysicalMaterial({ color: c, metalness: 0, roughness: 0.04, transparent: true, opacity: 0.2, clearcoat: 1, clearcoatRoughness: 0.05, depthWrite: false, side: DoubleSide, envMap: envTex, envMapIntensity: 1.6 }); // thin see-through glass (snow globe / sand timer)
    case "goo":    return new MeshPhysicalMaterial({ color: c, metalness: 0, roughness: 0.15, transmission: 0.55, thickness: 1.0, ior: 1.35, transparent: true, clearcoat: 1, envMap: envTex, envMapIntensity: 1.1 });
    case "matte":  return new MeshStandardMaterial({ color: c, roughness: 0.9, metalness: 0, envMap: envTex, envMapIntensity: 0.5 });
    case "plush":  return new MeshPhysicalMaterial({ color: c, roughness: 1, sheen: 0.9, sheenColor: new Color(0xffffff), clearcoat: 0, envMap: envTex, envMapIntensity: 0.6 });
    case "holo":   return new MeshPhysicalMaterial({ color: c, roughness: 0.22, clearcoat: 1, clearcoatRoughness: 0.2, iridescence: 1, iridescenceIOR: 1.6, metalness: 0.25, envMap: envTex, envMapIntensity: 1.4 });
    case "silicone": return new MeshPhysicalMaterial({ color: c, roughness: 0.4, clearcoat: 0.5, clearcoatRoughness: 0.28, metalness: 0, envMap: envTex, envMapIntensity: 0.9 });
    case "gloss":
    default:       return new MeshPhysicalMaterial({ color: c, roughness: 0.18, clearcoat: 1, clearcoatRoughness: 0.15, metalness: 0, envMap: envTex, envMapIntensity: 1.1 });
  }
}

const SHAPE_BY_PLAY = { grid: "popit", flick: "spinner", squish: "ball", cube: "cube", coil: "coil", tangle: "tangle", stretch: "capsule", pet: "ball", piano: "cube", snow: "blob", shower: "orb", peel: "blob", stack: "cube", windup: "tangle", combo: "cube" };

function toyLook(toy, tierColor) {
  const S = toy.model3d || {};
  const shape = S.shape || SHAPE_BY_PLAY[toy.play] || "ball";
  const finish = S.finish || "gloss";
  const colors = (S.colors && S.colors.length) ? S.colors : [tierColor || "#b558f6", "#ffffff"];
  return { shape, finish, colors, cute: !!S.cute, params: S.params || {} };
}
const col = (look, i, fb) => look.colors[i] || fb || look.colors[0];

// ==========================================================================
//  Shape builders — each returns { group, handles } (handles power the play).
// ==========================================================================
const tmpM = new Matrix4(), tmpC = new Color();

function makeShape(shape, look, ctx) {
  const track = ctx.track;
  switch (shape) {
    case "popit":   return shapePopit(look, track);
    case "spinner": return shapeSpinner(look, track);
    case "ring":    return shapeRing(look, track);
    case "yoyo":    return shapeYoyo(look, track);
    case "gears":   return shapeGears(look, track);
    case "cube":    return shapeCube(look, track);
    case "pen":     return shapePen(look, track);
    case "hand":    return shapeHand(look, track);
    case "coil":    return shapeCoil(look, track);
    case "tangle":  return shapeTangle(look, track);
    case "blob":    return shapeBlob(look, track);
    case "capsule": return shapeCapsule(look, track);
    case "beads":   return shapeBeads(look, track);
    case "star":    return shapeStar(look, track);
    case "cradle":  return shapeCradle(look, track);
    case "orb":     return shapeOrb(look, track);
    case "gem":     return shapeGem(look, track);
    case "crown":   return shapeCrown(look, track);
    case "trophy":  return shapeTrophy(look, track);
    case "chest":   return shapeChest(look, track);
    case "lamp":    return shapeLamp(look, track);
    case "globe":   return shapeGlobe(look, track);
    case "hourglass": return shapeHourglass(look, track);
    case "kaleido": return shapeKaleido(look, track);
    case "maze":    return shapeMaze(look, track);
    case "ball":
    default:        return shapeBall(look, track);
  }
}

// cute kawaii face sitting ON the +Z front surface of a sphere of radius r,
// centered at (0, cy, 0). Features are placed on the sphere so nothing embeds.
function addFace(group, track, r, cy = 0, zScale = 1) {
  const eyeMat = track(new MeshStandardMaterial({ color: 0x2a2440, roughness: 0.3 }));
  // put a feature at spherical (ax across, ay up) sitting proud of the surface
  const put = (mesh, ax, ay, out = 1.0) => {
    const z = Math.sqrt(Math.max(0.04, 1 - ax * ax - ay * ay));
    mesh.position.set(ax * r, cy + ay * r, z * r * zScale + 0.02 * r);
    group.add(mesh);
  };
  const eyeGeo = track(new SphereGeometry(0.12 * r, 16, 12));
  for (const dx of [-0.3, 0.3]) { const e = new Mesh(eyeGeo, eyeMat); e.scale.set(1, 1.25, 0.7); put(e, dx, 0.15); }
  const cheekGeo = track(new SphereGeometry(0.13 * r, 14, 10));
  const cheekMat = track(new MeshStandardMaterial({ color: 0xff9ec2, roughness: 0.8, transparent: true, opacity: 0.85 }));
  for (const dx of [-0.5, 0.5]) { const ch = new Mesh(cheekGeo, cheekMat); ch.scale.set(1, 0.6, 0.4); put(ch, dx, -0.05); }
  const sm = new Mesh(track(new TorusGeometry(0.15 * r, 0.032 * r, 8, 18, Math.PI)), eyeMat);
  sm.rotation.z = Math.PI; put(sm, 0, -0.08);
}

function shapePopit(look, track) {
  const group = new Group();
  const P = look.params || {}, cols = P.cols || 4, rows = P.rows || 4, gap = 0.62, r = 0.27;
  const slab = new Mesh(track(new RoundedBoxGeometry(cols * gap + 0.3, 0.45, rows * gap + 0.3, 4, 0.18)), track(makeMat(look.finish, col(look, 0))));
  group.add(slab);
  const bubGeo = track(new SphereGeometry(r, 22, 14, 0, Math.PI * 2, 0, Math.PI * 0.5));
  const inst = new InstancedMesh(bubGeo, track(makeMat(look.finish, "#ffffff")), rows * cols);
  const baseColor = [], popped = [];
  let i = 0;
  for (let rr = 0; rr < rows; rr++) for (let cc = 0; cc < cols; cc++) {
    const x = (cc - (cols - 1) / 2) * gap, z = (rr - (rows - 1) / 2) * gap;
    tmpM.makeTranslation(x, 0.22, z); inst.setMatrixAt(i, tmpM);
    const c = new Color(look.colors[i % look.colors.length]); inst.setColorAt(i, c); baseColor.push(c.clone()); popped.push(false); i++;
  }
  inst.instanceMatrix.needsUpdate = true; group.add(inst);
  // Galaxy Pop It (and any starry pop-it) gets a sprinkle of glowing stars ✨
  if (look.params && look.params.stars) {
    const starGeo = track(new SphereGeometry(0.06, 8, 6));
    const starMat = track(new MeshStandardMaterial({ color: 0xffffff, emissive: 0xfff3c0, emissiveIntensity: 0.9, roughness: 0.4 }));
    for (let s = 0; s < 14; s++) { const st = new Mesh(starGeo, starMat); st.scale.setScalar(0.6 + Math.random() * 0.9); st.position.set((Math.random() - 0.5) * 2.4, 0.45 + Math.random() * 0.8, (Math.random() - 0.5) * 2.4); group.add(st); }
  }
  return { group, handles: { bubbles: { inst, cols, rows, gap, r, baseColor, popped } } };
}

// CLICKY PEN — a real pen: body, grip, cone tip + nib, top clicker button, clip.
function shapePen(look, track) {
  const group = new Group();
  const bodyMat = track(makeMat(look.finish, col(look, 0)));
  const gripMat = track(makeMat("silicone", col(look, 2, "#22262e")));
  const metal = track(makeMat("chrome"));
  const btnMat = track(makeMat("gloss", col(look, 1, "#e63946")));
  const body = new Mesh(track(new CylinderGeometry(0.16, 0.16, 1.9, 20)), bodyMat); group.add(body);
  const grip = new Mesh(track(new CylinderGeometry(0.17, 0.15, 0.5, 20)), gripMat); grip.position.y = -0.75; group.add(grip);
  const cone = new Mesh(track(new ConeGeometry(0.16, 0.45, 20)), gripMat); cone.position.y = -1.17; group.add(cone);
  const nib = new Mesh(track(new ConeGeometry(0.04, 0.18, 10)), metal); nib.position.y = -1.44; group.add(nib);
  const collar = new Mesh(track(new CylinderGeometry(0.17, 0.17, 0.1, 20)), metal); collar.position.y = 0.95; group.add(collar);
  const button = new Mesh(track(new CylinderGeometry(0.12, 0.12, 0.3, 16)), btnMat); button.position.y = 1.14; group.add(button);
  const clip = new Mesh(track(new BoxGeometry(0.05, 0.62, 0.13)), metal); clip.position.set(0.18, 0.68, 0); group.add(clip);
  group.rotation.set(0.15, 0, 0.32);
  return { group, handles: { main: group, spin: group, pen: { button, nib, btnY: button.position.y, nibY: nib.position.y } } };
}

function shapeSpinner(look, track) {
  const group = new Group(); const spin = new Group(); group.add(spin);
  const body = track(makeMat(look.finish === "chrome" || look.finish === "metal" ? "gloss" : look.finish, col(look, 0)));
  const chrome = track(makeMat(look.finish === "chrome" || look.finish === "metal" || look.finish === "holo" ? look.finish : "chrome", col(look, 2, "#c8ccd4")));
  const arms = 3, lobeGeo = track(new SphereGeometry(0.42, 22, 16)), ringGeo = track(new TorusGeometry(0.42, 0.1, 12, 22));
  for (let a = 0; a < arms; a++) {
    const ang = (a / arms) * Math.PI * 2, x = Math.cos(ang) * 0.85, y = Math.sin(ang) * 0.85;
    const lobe = new Mesh(lobeGeo, body); lobe.position.set(x, y, 0); lobe.scale.set(1, 1, 0.55); spin.add(lobe);
    const ring = new Mesh(ringGeo, chrome); ring.position.set(x, y, 0); spin.add(ring);
  }
  const hub = new Mesh(track(new CylinderGeometry(0.36, 0.36, 0.34, 26)), body); hub.rotation.x = Math.PI / 2; spin.add(hub);
  for (const z of [0.2, -0.2]) { const cap = new Mesh(track(new SphereGeometry(0.22, 18, 14)), chrome); cap.position.z = z; spin.add(cap); }
  group.rotation.x = 0.32;
  return { group, handles: { spin } };
}

function shapeRing(look, track) {
  const group = new Group(); const spin = new Group(); group.add(spin);
  const ring = new Mesh(track(new TorusGeometry(0.95, 0.28, 20, 40)), track(makeMat(look.finish, col(look, 0))));
  spin.add(ring);
  if (look.colors[1]) { const gem = new Mesh(track(new OctahedronGeometry(0.28)), track(makeMat("glass", col(look, 1)))); gem.position.y = 0.95; spin.add(gem); }
  group.rotation.x = 0.5;
  return { group, handles: { spin } };
}

function shapeYoyo(look, track) {
  const group = new Group(); const spin = new Group(); group.add(spin);
  const disc = track(new CylinderGeometry(0.95, 0.95, 0.28, 36));
  const m0 = track(makeMat(look.finish, col(look, 0))), m1 = track(makeMat(look.finish, col(look, 1, "#ffffff")));
  const d1 = new Mesh(disc, m0); d1.rotation.z = Math.PI / 2; d1.position.x = 0.28; spin.add(d1);
  const d2 = new Mesh(disc, m1); d2.rotation.z = Math.PI / 2; d2.position.x = -0.28; spin.add(d2);
  const axle = new Mesh(track(new CylinderGeometry(0.18, 0.18, 0.4, 20)), track(makeMat("chrome"))); axle.rotation.z = Math.PI / 2; spin.add(axle);
  const str = new Mesh(track(new CylinderGeometry(0.03, 0.03, 1.2, 8)), track(new MeshStandardMaterial({ color: 0xf2e9d8, roughness: 0.9 }))); str.position.y = 0.6; group.add(str);
  group.rotation.set(0.15, 0, 0.2);
  return { group, handles: { spin } };
}

function shapeGears(look, track) {
  const group = new Group();
  const gearMesh = (radius, teeth, color, x) => {
    const g = new Group();
    const body = new Mesh(track(new CylinderGeometry(radius, radius, 0.34, 28)), track(makeMat(look.finish, color)));
    body.rotation.x = Math.PI / 2; g.add(body);
    const toothGeo = track(new BoxGeometry(0.14, 0.34, 0.16));
    for (let t = 0; t < teeth; t++) { const th = new Mesh(toothGeo, body.material); const a = (t / teeth) * Math.PI * 2; th.position.set(Math.cos(a) * radius, Math.sin(a) * radius, 0); th.rotation.z = a; g.add(th); }
    const hole = new Mesh(track(new CylinderGeometry(0.12, 0.12, 0.4, 16)), track(makeMat("chrome"))); hole.rotation.x = Math.PI / 2; g.add(hole);
    g.position.x = x; group.add(g); return g;
  };
  const g1 = gearMesh(0.62, 10, col(look, 0), -0.55), g2 = gearMesh(0.5, 8, col(look, 1, "#ffb020"), 0.62);
  group.rotation.x = 0.2;
  return { group, handles: { gears: [{ mesh: g1, dir: 1, r: 0.62 }, { mesh: g2, dir: -1, r: 0.5 }] } };
}

function shapeCube(look, track) {
  const group = new Group();
  const cube = new Mesh(track(new RoundedBoxGeometry(1.6, 1.6, 1.6, 5, 0.22)), track(makeMat(look.finish, col(look, 0))));
  group.add(cube); group.rotation.set(0.5, 0.6, 0);
  if (look.params.pips) addPips(group, track, col(look, 1, "#222"));
  return { group, handles: { main: cube } };
}
function addPips(group, track, color) {
  const pipGeo = track(new SphereGeometry(0.1, 12, 10)); const pm = track(new MeshStandardMaterial({ color, roughness: 0.4 }));
  const place = (n, fn) => { const pts = { 1: [[0, 0]], 2: [[-.4, -.4], [.4, .4]], 3: [[-.4, -.4], [0, 0], [.4, .4]] }[n]; pts.forEach(([a, b]) => { const p = new Mesh(pipGeo, pm); fn(p, a, b); group.add(p); }); };
  place(1, (p, a, b) => p.position.set(a, b, 0.82));
  place(2, (p, a, b) => p.position.set(0.82, a, b));
  place(3, (p, a, b) => p.position.set(a, 0.82, b));
}

function shapeCoil(look, track) {
  const group = new Group(); const N = 15, rings = [];
  const ringGeo = track(new TorusGeometry(0.72, 0.085, 12, 34));
  for (let i = 0; i < N; i++) {
    const ring = new Mesh(ringGeo, track(makeMat(look.finish, look.colors[i % look.colors.length]))); ring.rotation.x = Math.PI / 2; rings.push(ring); group.add(ring);
  }
  group.rotation.z = 0.25;
  layoutCoil(rings, 0);
  return { group, handles: { rings } };
}
function layoutCoil(rings, stretch) {
  const N = rings.length, spread = 0.16 + stretch * 0.55;
  for (let i = 0; i < N; i++) { const t = i - (N - 1) / 2; rings[i].position.set(t * 0.05 * (1 + stretch * 1.6) + Math.sin(t * 0.6 + stretch * 3) * stretch * 0.14, t * spread, 0); }
}

function shapeTangle(look, track) {
  const group = new Group(); const N = 10, segs = [];
  const elbow = track(new TorusGeometry(0.34, 0.13, 12, 20, Math.PI / 2));
  let node = new Object3D(); group.add(node);
  for (let i = 0; i < N; i++) {
    const holder = new Object3D(); node.add(holder);
    const mesh = new Mesh(elbow, track(makeMat(look.finish, look.colors[i % look.colors.length]))); mesh.rotation.z = Math.PI; holder.add(mesh);
    const next = new Object3D(); next.position.set(0.34, 0.34, 0); next.rotation.z = -Math.PI / 2; holder.add(next);
    segs.push({ next }); node = next;
  }
  group.scale.setScalar(0.9); group.position.set(-0.3, 0.2, 0); group.rotation.set(0.3, 0.2, 0);
  segs.forEach((s, i) => { s.next.rotation.x = Math.sin(i * 1.3) * 0.6; });
  return { group, handles: { tangleSegs: segs } };
}

function shapeBall(look, track) {
  const group = new Group();
  const P = look.params || {}, r = 1.1;
  const ball = new Mesh(track(new SphereGeometry(r, 48, 36)), track(makeMat(look.finish, col(look, 0))));
  if (P.ovoid) ball.scale.set(0.92, 1.12, 0.92);
  group.add(ball);
  if (P.horn) { // unicorn horn — gold spiral cone on top
    const gold = track(makeMat("metal", "#ffd76a"));
    const horn = new Mesh(track(new ConeGeometry(0.2, 0.7, 16)), gold); horn.position.set(0, r + 0.3, 0.18); horn.rotation.x = 0.12; group.add(horn);
    for (let i = 0; i < 3; i++) { const ring = new Mesh(track(new TorusGeometry(0.15 - i * 0.035, 0.028, 8, 16)), gold); ring.position.set(0, r + 0.12 + i * 0.22, 0.17); ring.rotation.x = Math.PI / 2; group.add(ring); }
  }
  if (P.ears) { // ears + a pastel mane tuft
    const earGeo = track(new ConeGeometry(0.17, 0.36, 12)), earMat = track(makeMat(look.finish, col(look, 1, "#ffffff")));
    for (const dx of [-0.55, 0.55]) { const ear = new Mesh(earGeo, earMat); ear.position.set(dx, r * 0.88, 0.05); ear.rotation.z = dx < 0 ? 0.4 : -0.4; group.add(ear); }
    const tuft = new Mesh(track(new SphereGeometry(0.3, 16, 12)), track(makeMat(look.finish, col(look, 2, "#bfeaff")))); tuft.position.set(0, r + 0.05, -0.32); tuft.scale.set(1, 0.8, 0.7); group.add(tuft);
  }
  if (P.pit) { // avocado — brown pit (with the face) on the front of the green body
    const pit = new Mesh(track(new SphereGeometry(0.52, 24, 18)), track(makeMat("gloss", "#7a4a24"))); pit.position.set(0, -0.05, 0.6); group.add(pit);
    addFace(pit, track, 0.52);
  } else if (look.cute) {
    addFace(group, track, r, P.ovoid ? -0.02 : 0);
  }
  let wings = null;
  if (P.wings) { // Peace Dove — soft wings on little hinges so they can flap
    const wingMat = track(makeMat(look.finish, col(look, 2, "#fff8dc"))), wGeo = track(new SphereGeometry(0.5, 20, 14));
    wings = [];
    for (const s of [-1, 1]) { const piv = new Object3D(); piv.position.set(s * r * 0.8, 0.1, -0.15); const w = new Mesh(wGeo, wingMat); w.scale.set(1, 0.26, 0.62); w.position.x = s * 0.4; w.rotation.z = s * 0.3; piv.add(w); group.add(piv); wings.push({ piv, s }); }
    const beak = new Mesh(track(new ConeGeometry(0.11, 0.26, 12)), track(makeMat("gloss", col(look, 1, "#ffd700")))); beak.rotation.x = Math.PI / 2; beak.position.set(0, 0.0, r + 0.08); group.add(beak);
  }
  return { group, handles: { main: group, wings } };
}

// STICKY HAND — a little hand on a long stretchy strand.
function shapeHand(look, track) {
  const group = new Group();
  const mat = track(makeMat(look.finish, col(look, 0)));
  const strand = new Mesh(track(new CylinderGeometry(0.08, 0.08, 2.0, 10)), mat); strand.position.y = 0.75; group.add(strand);
  const palm = new Mesh(track(new SphereGeometry(0.42, 22, 16)), mat); palm.scale.set(1.05, 1.1, 0.5); palm.position.y = -0.45; group.add(palm);
  const fGeo = track(new CapsuleGeometry(0.09, 0.34, 4, 8));
  for (let i = 0; i < 4; i++) { const f = new Mesh(fGeo, mat); f.position.set((i - 1.5) * 0.2, -0.95, 0.02); group.add(f); }
  const thumb = new Mesh(track(new CapsuleGeometry(0.09, 0.26, 4, 8)), mat); thumb.position.set(-0.46, -0.5, 0.02); thumb.rotation.z = 1.05; group.add(thumb);
  group.rotation.set(0.1, 0, 0.12);
  return { group, handles: { main: group } };
}

function shapeBlob(look, track) {
  const group = new Group();
  const blob = new Mesh(track(new IcosahedronGeometry(1.05, 3)), track(makeMat(look.finish, col(look, 0))));
  blob.scale.set(1.15, 0.85, 1.0); group.add(blob);
  for (const [x, y, z, s] of [[0.7, 0.3, 0.4, 0.5], [-0.6, -0.2, 0.5, 0.42], [0.1, 0.6, -0.4, 0.4]]) {
    const lump = new Mesh(track(new SphereGeometry(s, 20, 16)), blob.material); lump.position.set(x, y, z); group.add(lump);
  }
  if (look.cute) addFace(group, track, 1.0, -0.05);
  return { group, handles: { main: group } };
}

function shapeCapsule(look, track) {
  const group = new Group();
  const P = look.params || {};
  if (P.lava) { // lava lamp: glass bottle + metal base/cap + floating goo blobs
    const glass = new Mesh(track(new CapsuleGeometry(0.5, 1.5, 10, 24)), track(makeMat("glass", col(look, 0, "#ff6a00")))); group.add(glass);
    const metal = track(makeMat("metal", "#caa85a"));
    const base = new Mesh(track(new CylinderGeometry(0.42, 0.55, 0.32, 20)), metal); base.position.y = -1.2; group.add(base);
    const cap = new Mesh(track(new CylinderGeometry(0.28, 0.4, 0.28, 20)), metal); cap.position.y = 1.2; group.add(cap);
    const bcols = [col(look, 1, "#ff8c00"), col(look, 2, "#ff2d6a"), "#ffcf3a"];
    const blobs = [];
    for (let i = 0; i < 4; i++) { const b = new Mesh(track(new SphereGeometry(0.2 + (i % 2) * 0.09, 16, 12)), track(makeMat("goo", bcols[i % bcols.length]))); b.position.set(i % 2 ? 0.12 : -0.12, -0.75 + i * 0.5, 0); b.scale.set(1, 1.25, 1); group.add(b); blobs.push(b); }
    return { group, handles: { main: group, spin: group, lavaBlobs: blobs, spinAxis: "y" } };
  }
  const cap = new Mesh(track(new CapsuleGeometry(0.42, 1.5, 8, 20)), track(makeMat(look.finish, col(look, 0))));
  group.add(cap);
  if (look.colors[1]) { for (let i = 0; i < 3; i++) { const band = new Mesh(track(new TorusGeometry(0.43, 0.06, 10, 24)), track(makeMat(look.finish, look.colors[(i + 1) % look.colors.length]))); band.rotation.x = Math.PI / 2; band.position.y = (i - 1) * 0.45; group.add(band); } }
  group.rotation.z = 0.35;
  if (look.cute) addFace(group, track, 0.55, 0.5);
  return { group, handles: { main: group } };
}

function shapeBeads(look, track) {
  const group = new Group(); const N = 9, beads = [];
  const geo = track(new SphereGeometry(0.3, 20, 16));
  for (let i = 0; i < N; i++) {
    const b = new Mesh(geo, track(makeMat(look.finish, look.colors[i % look.colors.length])));
    const t = (i - (N - 1) / 2); b.position.set(t * 0.52, Math.sin(i * 0.8) * 0.18, 0); beads.push(b); group.add(b);
  }
  group.rotation.set(0.2, 0, 0.1);
  return { group, handles: { main: group, beads } };
}

function shapeStar(look, track) {
  const s = new ThreeShape(); const spikes = 5, outer = 1.1, inner = 0.5;
  for (let i = 0; i < spikes * 2; i++) { const r = i % 2 ? inner : outer, a = (i / (spikes * 2)) * Math.PI * 2 - Math.PI / 2; const x = Math.cos(a) * r, y = Math.sin(a) * r; i ? s.lineTo(x, y) : s.moveTo(x, y); }
  s.closePath();
  const geo = track(new ExtrudeGeometry(s, { depth: 0.35, bevelEnabled: true, bevelThickness: 0.12, bevelSize: 0.12, bevelSegments: 3 }));
  geo.center();
  const group = new Group(); const star = new Mesh(geo, track(makeMat(look.finish, col(look, 0)))); group.add(star);
  return { group, handles: { main: star, spin: group } };
}

function shapeCradle(look, track) {
  const group = new Group(); const N = 5, balls = [];
  const frameMat = track(makeMat("metal", col(look, 1, "#c0c8d0")));
  const bar = new Mesh(track(new BoxGeometry(2.4, 0.12, 0.12)), frameMat); bar.position.y = 1.0; group.add(bar);
  const ballGeo = track(new SphereGeometry(0.24, 24, 18)), ballMat = track(makeMat(look.finish, col(look, 0)));
  const strGeo = track(new CylinderGeometry(0.02, 0.02, 1.0, 6)), strMat = track(new MeshStandardMaterial({ color: 0x99aabb, roughness: 0.7 }));
  for (let i = 0; i < N; i++) {
    const x = (i - (N - 1) / 2) * 0.5;
    const pivot = new Object3D(); pivot.position.set(x, 1.0, 0); group.add(pivot);
    const str = new Mesh(strGeo, strMat); str.position.y = -0.5; pivot.add(str);
    const ball = new Mesh(ballGeo, ballMat); ball.position.y = -1.0; pivot.add(ball);
    balls.push({ pivot, i });
  }
  group.position.y = -0.3;
  return { group, handles: { balls, main: group } };
}

function shapeOrb(look, track) {
  const group = new Group();
  const glass = new Mesh(track(new SphereGeometry(1.1, 40, 30)), track(makeMat("glass", col(look, 0))));
  group.add(glass);
  const P = look.params || {};
  if (P.bubbles) { // liquid-motion: colorful droplets that swirl when you spin it
    const bcols = [col(look, 1, "#ffffff"), col(look, 2, col(look, 0)), col(look, 0)];
    const bubbles = [];
    for (let i = 0; i < 8; i++) { const b = new Mesh(track(new SphereGeometry(0.12 + Math.random() * 0.14, 14, 10)), track(makeMat("gloss", bcols[i % bcols.length]))); b.position.set((Math.random() - 0.5) * 1.2, (Math.random() - 0.5) * 1.2, (Math.random() - 0.5) * 1.2); group.add(b); bubbles.push(b); }
    return { group, handles: { main: group, spin: group, bubbles } };
  }
  const core = new Mesh(track(new IcosahedronGeometry(0.6, 1)), track(makeMat(look.finish === "glass" ? "holo" : look.finish, col(look, 1, col(look, 0))))); group.add(core);
  return { group, handles: { main: core, spin: group, glass } };
}

function shapeGem(look, track) {
  const group = new Group();
  const gem = new Mesh(track(new OctahedronGeometry(1.05, 0)), track(makeMat(look.finish, col(look, 0)))); gem.scale.set(1, 1.3, 1);
  group.add(gem);
  return { group, handles: { main: gem, spin: group } };
}

function shapeCrown(look, track) {
  const group = new Group(); const gold = track(makeMat("metal", col(look, 0, "#ffd700")));
  const band = new Mesh(track(new CylinderGeometry(0.9, 0.9, 0.5, 30, 1, true)), gold); group.add(band);
  const spikes = 6;
  for (let i = 0; i < spikes; i++) {
    const a = (i / spikes) * Math.PI * 2;
    const sp = new Mesh(track(new ConeGeometry(0.18, 0.55, 12)), gold); sp.position.set(Math.cos(a) * 0.9, 0.45, Math.sin(a) * 0.9); group.add(sp);
    const jw = new Mesh(track(new OctahedronGeometry(0.12)), track(makeMat("glass", look.colors[(i % (look.colors.length - 1)) + 1] || "#e63946"))); jw.position.set(Math.cos(a) * 0.9, 0.0, Math.sin(a) * 0.9); group.add(jw);
  }
  group.rotation.x = 0.2;
  return { group, handles: { main: group, spin: group } };
}

function shapeTrophy(look, track) {
  const group = new Group(); const gold = track(makeMat("metal", col(look, 0, "#ffd700")));
  const pts = []; for (let i = 0; i <= 10; i++) { const t = i / 10; pts.push(new Vector2(0.05 + Math.sin(t * Math.PI * 0.9) * 0.75, t * 1.1)); }
  const cup = new Mesh(track(new LatheGeometry(pts, 28)), gold); cup.position.y = -0.2; group.add(cup);
  const stem = new Mesh(track(new CylinderGeometry(0.12, 0.12, 0.35, 16)), gold); stem.position.y = -0.55; group.add(stem);
  const base = new Mesh(track(new CylinderGeometry(0.45, 0.5, 0.2, 24)), gold); base.position.y = -0.78; group.add(base);
  for (const s of [-1, 1]) { const h = new Mesh(track(new TorusGeometry(0.22, 0.05, 10, 20)), gold); h.position.set(s * 0.72, 0.15, 0); h.rotation.y = Math.PI / 2; group.add(h); }
  return { group, handles: { main: group, spin: group } };
}

function shapeChest(look, track) {
  const group = new Group();
  const wood = track(makeMat("gloss", col(look, 0, "#8b5a2b"))), gold = track(makeMat("metal", col(look, 1, "#ffd700")));
  const base = new Mesh(track(new RoundedBoxGeometry(1.7, 0.85, 1.05, 3, 0.06)), wood); base.position.y = -0.2; group.add(base);
  // glowing gold treasure peeking out of the open top
  const loot = new Mesh(track(new SphereGeometry(0.55, 18, 12)), track(makeMat("metal", "#ffdf5a"))); loot.scale.set(1.3, 0.35, 0.8); loot.position.set(0, 0.15, 0); group.add(loot);
  // lid hinged open at the back-top edge
  const lidPivot = new Object3D(); lidPivot.position.set(0, 0.2, -0.52); group.add(lidPivot);
  const lid = new Mesh(track(new RoundedBoxGeometry(1.72, 0.38, 1.08, 3, 0.06)), wood); lid.position.set(0, 0.05, 0.52); lidPivot.add(lid);
  const lidStrap = new Mesh(track(new BoxGeometry(0.16, 0.42, 1.12)), gold); lidStrap.position.set(0, 0.05, 0.52); lidPivot.add(lidStrap);
  lidPivot.rotation.x = -0.85; // open
  // gold straps + lock on the base
  for (const x of [-0.6, 0.6]) { const s = new Mesh(track(new BoxGeometry(0.16, 0.9, 1.1)), gold); s.position.set(x, -0.2, 0); group.add(s); }
  const lock = new Mesh(track(new BoxGeometry(0.26, 0.3, 0.1)), gold); lock.position.set(0, -0.28, 0.55); group.add(lock);
  group.rotation.set(0.12, -0.5, 0);
  return { group, handles: { main: group, lid: lidPivot, loot } };
}

function shapeLamp(look, track) {
  const group = new Group(); const gold = track(makeMat("metal", col(look, 0, "#ffd700")));
  const body = new Mesh(track(new SphereGeometry(0.7, 28, 20)), gold); body.scale.set(1.3, 0.8, 1); group.add(body);
  const spout = new Mesh(track(new ConeGeometry(0.14, 0.8, 16)), gold); spout.position.set(0.95, 0.15, 0); spout.rotation.z = -1.1; group.add(spout);
  const handle = new Mesh(track(new TorusGeometry(0.28, 0.07, 10, 20)), gold); handle.position.set(-0.75, 0.15, 0); handle.rotation.y = Math.PI / 2; group.add(handle);
  const lid = new Mesh(track(new SphereGeometry(0.16, 16, 12)), gold); lid.position.y = 0.6; group.add(lid);
  group.rotation.x = 0.15;
  return { group, handles: { main: group } };
}

// little 5-point star prism (extruded) — shared by the Shooting Star sparkles + kaleidoscope bits
function starGeo(outer = 1, inner = 0.45, depth = 0.35) {
  const s = new ThreeShape();
  for (let i = 0; i < 10; i++) { const r = i % 2 ? inner : outer, a = (i / 10) * Math.PI * 2 - Math.PI / 2; const x = Math.cos(a) * r, y = Math.sin(a) * r; i ? s.lineTo(x, y) : s.moveTo(x, y); }
  s.closePath();
  const g = new ExtrudeGeometry(s, { depth, bevelEnabled: true, bevelThickness: depth * 0.3, bevelSize: outer * 0.08, bevelSegments: 1 }); g.center(); return g;
}

// SNOW GLOBE — glass dome on a base, a tiny planet inside, and glitter flakes
// that live INSIDE the dome (group-local) so shaking the globe swirls them.
function shapeGlobe(look, track) {
  const group = new Group(); const R = 1.0, floorY = -0.52;
  const glass = new Mesh(track(new SphereGeometry(R, 44, 32)), track(makeMat("clear", "#f4f0ff"))); glass.renderOrder = 2; group.add(glass);
  const baseMat = track(makeMat(look.finish === "glass" ? "gloss" : look.finish, col(look, 0)));
  const base = new Mesh(track(new CylinderGeometry(0.78, 0.95, 0.42, 36)), baseMat); base.position.y = -0.98; group.add(base);
  const trim = new Mesh(track(new TorusGeometry(0.8, 0.05, 10, 40)), track(makeMat("metal", "#ffd76a"))); trim.rotation.x = Math.PI / 2; trim.position.y = -0.78; group.add(trim);
  const floorR = Math.sqrt(R * R - floorY * floorY) - 0.02;
  const floor = new Mesh(track(new CircleGeometry(floorR, 40)), baseMat); floor.rotation.x = -Math.PI / 2; floor.position.y = floorY; group.add(floor);
  const planet = new Mesh(track(new SphereGeometry(0.26, 28, 20)), track(makeMat("holo", col(look, 1, "#7c5cff")))); planet.position.y = -0.08; group.add(planet);
  const ring = new Mesh(track(new TorusGeometry(0.42, 0.035, 8, 40)), track(makeMat("metal", col(look, 3, "#ffe14d")))); ring.position.y = -0.08; ring.rotation.set(1.2, 0, 0.3); group.add(ring);
  const stand = new Mesh(track(new CylinderGeometry(0.05, 0.1, 0.4, 10)), baseMat); stand.position.y = -0.36; group.add(stand);
  // glitter flakes
  const N = 150, R2 = R - 0.07;
  const flakeMat = track(new MeshStandardMaterial({ color: 0xffffff, emissive: 0xffffff, emissiveIntensity: 0.25, roughness: 0.3, metalness: 0.4, envMap: envTex, envMapIntensity: 1.2 }));
  const inst = new InstancedMesh(track(new OctahedronGeometry(0.04, 0)), flakeMat, N); inst.frustumCulled = false;
  const fcols = look.colors.slice(1).concat(["#ffffff"]);
  const pos = [], vel = [];
  for (let i = 0; i < N; i++) {
    // start as a sparkly swirl (that's the thumbnail), then they settle in the zone
    let p; do { p = new Vector3((Math.random() - 0.5) * 2 * R2, floorY + Math.random() * (R2 - floorY), (Math.random() - 0.5) * 2 * R2); } while (p.length() > R2);
    pos.push(p); vel.push(new Vector3((Math.random() - 0.5) * 0.3, 0, (Math.random() - 0.5) * 0.3));
    tmpM.makeRotationFromEuler(new Euler(i, i * 2.3, 0)).setPosition(p); inst.setMatrixAt(i, tmpM); inst.setColorAt(i, tmpC.set(fcols[i % fcols.length]));
  }
  group.add(inst);
  group.rotation.x = 0.12;
  return { group, handles: { main: group, globe: { inst, N, R: R2, floorY: floorY + 0.03, pos, vel } } };
}

// SAND TIMER — glass hourglass in a wooden frame, filled with real sand grains.
const HG_H = 1.0;
function hgProfile(u) { // glass radius at |y|/H = u (narrow neck at 0, round bulbs)
  const s = Math.sin(Math.PI * 0.5 * Math.min(1, u / 0.62));
  return 0.075 + 0.5 * Math.pow(s, 0.85) * (u > 0.86 ? Math.max(0.55, 1 - (u - 0.86) * 3.2) : 1);
}
// resting spots for N grains: bottom bulb piles up into a little cone;
// top bulb fills the funnel from the neck up (so it drains from the bottom).
function hgSlots(N, top) {
  const H = HG_H, c = [], st = 0.088;
  for (let y = 0.05; y < H - 0.06; y += st * 0.8) for (let x = -0.6; x <= 0.6; x += st) for (let z = -0.6; z <= 0.6; z += st) {
    const jx = x + (Math.random() - 0.5) * 0.025, jz = z + (Math.random() - 0.5) * 0.025, r = Math.hypot(jx, jz);
    if (r > hgProfile(y / H) - 0.06) continue;
    c.push({ x: jx, y, z: jz, r });
  }
  if (top) { c.sort((a, b) => a.y - b.y); return c.slice(0, N).map((p) => new Vector3(p.x, p.y, p.z)); }
  c.sort((a, b) => ((H - a.y) + a.r * 0.55) - ((H - b.y) + b.r * 0.55));
  return c.slice(0, N).map((p) => new Vector3(p.x, -p.y, p.z));
}
function shapeHourglass(look, track) {
  const group = new Group(); const body = new Group(); group.add(body); const H = HG_H;
  const pts = []; for (let i = 0; i <= 44; i++) { const y = -H + (i / 44) * 2 * H; pts.push(new Vector2(hgProfile(Math.abs(y) / H), y)); }
  const glassMesh = new Mesh(track(new LatheGeometry(pts, 40)), track(makeMat("clear", "#ffffff"))); glassMesh.renderOrder = 2; body.add(glassMesh);
  const wood = track(makeMat("gloss", col(look, 2, "#8b5a2b")));
  for (const s of [-1, 1]) {
    const cap = new Mesh(track(new CylinderGeometry(0.74, 0.74, 0.14, 32)), wood); cap.position.y = s * (H + 0.07); body.add(cap);
    const knob = new Mesh(track(new SphereGeometry(0.16, 16, 12)), wood); knob.scale.y = 0.5; knob.position.y = s * (H + 0.16); body.add(knob);
  }
  for (let k = 0; k < 3; k++) { const a = (k / 3) * Math.PI * 2 + 0.5; const post = new Mesh(track(new CylinderGeometry(0.05, 0.05, 2 * H + 0.1, 10)), wood); post.position.set(Math.cos(a) * 0.64, 0, Math.sin(a) * 0.64); body.add(post); }
  const N = 170, B = hgSlots(N, false), T = hgSlots(N, true);
  const grainMat = track(new MeshStandardMaterial({ color: 0xffffff, roughness: 0.85, envMap: envTex, envMapIntensity: 0.5 }));
  const inst = new InstancedMesh(track(new SphereGeometry(0.054, 7, 5)), grainMat, N); inst.frustumCulled = false;
  // start mid-pour: some sand already down, the rest waiting up top
  const nb = Math.floor(N * 0.35), grains = [], top = [];
  for (let i = 0; i < N; i++) {
    const g = i < nb ? { st: "bot", slot: i } : { st: "top", slot: i - nb };
    g.pos = (g.st === "bot" ? B : T)[g.slot].clone(); grains.push(g); if (g.st === "top") top.push(g);
    tmpM.makeTranslation(g.pos.x, g.pos.y, g.pos.z); inst.setMatrixAt(i, tmpM);
    tmpC.set(col(look, 0)).lerp(new Color(col(look, 1)), Math.random()); inst.setColorAt(i, tmpC);
  }
  body.add(inst);
  group.rotation.set(0.1, 0, 0.06);
  return { group, handles: { main: group, sand: { inst, N, B, T, body, grains, top, botCount: nb } } };
}

// KALEIDOSCOPE — a holo tube with a twisty end-wheel full of mirrored gem bits.
function shapeKaleido(look, track) {
  const group = new Group(); const scope = new Group(); group.add(scope);
  const tubeMat = track(makeMat(look.finish, col(look, 0))), gold = track(makeMat("metal", "#ffd76a"));
  const tube = new Mesh(track(new CylinderGeometry(0.66, 0.4, 2.0, 36, 1, true)), tubeMat); tube.rotation.x = Math.PI / 2; scope.add(tube);
  const eye = new Mesh(track(new CylinderGeometry(0.26, 0.4, 0.3, 28)), gold); eye.rotation.x = Math.PI / 2; eye.position.z = -1.14; scope.add(eye);
  for (let i = 0; i < 3; i++) { const rr = 0.44 + (i + 0.5) * 0.073; const band = new Mesh(track(new TorusGeometry(rr, 0.045, 10, 36)), track(makeMat("gloss", look.colors[(i + 1) % look.colors.length]))); band.position.z = -0.75 + (i + 0.5) * 0.5; scope.add(band); }
  const wheel = new Group(); wheel.position.z = 1.0; scope.add(wheel);
  const rim = new Mesh(track(new TorusGeometry(0.66, 0.085, 12, 48)), gold); wheel.add(rim);
  const back = new Mesh(track(new CircleGeometry(0.64, 48)), track(new MeshStandardMaterial({ color: 0x1a1030, roughness: 0.5, metalness: 0.2 }))); wheel.add(back);
  const K = 6, M = 7, pieces = [];
  const geos = [track(new OctahedronGeometry(0.075, 0)), track(new SphereGeometry(0.06, 14, 10)), track(starGeo(0.085, 0.04, 0.04))];
  const mats = look.colors.concat(["#ffffff"]).map((c) => track(new MeshPhysicalMaterial({ color: c, emissive: new Color(c), emissiveIntensity: 0.3, roughness: 0.15, clearcoat: 1, envMap: envTex, envMapIntensity: 1.2 })));
  for (let j = 0; j < M; j++) {
    const p = { a0: Math.random() * Math.PI / K, s1: 0.5 + Math.random() * 0.9, s2: 0.6 + Math.random() * 1.2, ph: Math.random() * 6.28, meshes: [] };
    for (let w = 0; w < K; w++) for (const mir of [1, -1]) { const m = new Mesh(geos[j % geos.length], mats[j % mats.length]); wheel.add(m); p.meshes.push({ m, w, mir }); }
    pieces.push(p);
  }
  const KH = { wheel, pieces, K };
  layoutKaleido(KH, 0);
  scope.rotation.set(-0.42, 0.62, 0);
  return { group, handles: { main: group, kaleido: KH } };
}
function layoutKaleido(KH, tw) {
  const { pieces, K } = KH, wedge = Math.PI / K;
  for (const p of pieces) {
    let a = p.a0 + tw * p.s1; a = ((a % (2 * wedge)) + 2 * wedge) % (2 * wedge); if (a > wedge) a = 2 * wedge - a; // fold = mirror
    const r = 0.08 + 0.44 * (0.5 + 0.5 * Math.sin(tw * p.s2 + p.ph));
    for (const { m, w, mir } of p.meshes) { const ang = w * 2 * wedge + mir * a; m.position.set(Math.cos(ang) * r, Math.sin(ang) * r, 0.04); m.rotation.set(0, 0, ang + tw * 2 * mir); }
  }
  KH.wheel.rotation.z = tw * 0.35;
}

// MARBLE MAZE — a tilting tray with walls, a goal hole, and a shiny marble.
function shapeMaze(look, track) {
  const group = new Group(); const tray = new Group(); group.add(tray);
  const S = 2.2, half = S / 2, mr = 0.13;
  const baseMat = track(makeMat(look.finish, col(look, 0))), wallMat = track(makeMat("gloss", col(look, 1, "#3d8bfd")));
  const base = new Mesh(track(new RoundedBoxGeometry(S + 0.24, 0.18, S + 0.24, 3, 0.07)), baseMat); base.position.y = -0.09; tray.add(base);
  const rects = [[0, -half, S + 0.12, 0.12], [0, half, S + 0.12, 0.12], [-half, 0, 0.12, S], [half, 0, 0.12, S],
    [-0.325, -0.35, 1.55, 0.12], [0.325, 0.3, 1.55, 0.12], [0.2, 0.62, 0.12, 0.5]];
  const walls = rects.map(([cx, cz, w, d]) => {
    const m = new Mesh(track(new RoundedBoxGeometry(w, 0.24, d, 2, 0.04)), wallMat); m.position.set(cx, 0.12, cz); tray.add(m);
    return { x0: cx - w / 2, x1: cx + w / 2, z0: cz - d / 2, z1: cz + d / 2 };
  });
  const goal = new Vector2(0.78, 0.8), start = new Vector2(-0.8, -0.8);
  const hole = new Mesh(track(new CylinderGeometry(0.17, 0.17, 0.02, 28)), track(new MeshStandardMaterial({ color: 0x14101e, roughness: 0.6 }))); hole.position.set(goal.x, 0.006, goal.y); tray.add(hole);
  const hring = new Mesh(track(new TorusGeometry(0.18, 0.03, 8, 28)), track(makeMat("metal", "#ffd76a"))); hring.rotation.x = Math.PI / 2; hring.position.set(goal.x, 0.02, goal.y); tray.add(hring);
  const flag = new Mesh(track(starGeo(0.12, 0.055, 0.05)), track(makeMat("gloss", "#ffe14d"))); flag.position.set(goal.x, 0.4, goal.y); tray.add(flag);
  const marble = new Mesh(track(new SphereGeometry(mr, 24, 18)), track(makeMat("chrome"))); marble.position.set(start.x, mr, start.y); tray.add(marble);
  group.rotation.x = 0.62;
  return { group, handles: { main: group, maze: { tray, marble, walls, start, goal, r: mr, flag } } };
}

// ==========================================================================
//  Interaction behaviors — keyed by toy.play, using shape handles.
//  Springs are tuned SNAPPY: quick return with a touch of bounce.
// ==========================================================================
function makeBehavior(play, env) {
  const h = env.handles;
  // a few toys have their own one-of-a-kind mechanism, whatever their play type
  if (h.maze) return biTilt(env);
  if (h.kaleido) return biTwist(env);
  if (h.pen) return biClick(env);
  switch (play) {
    case "grid":    return biGrid(env);
    case "flick":   return biFlick(env);
    case "squish":  return biSquish(env);
    case "coil":    return biCoil(env);
    case "stretch": return biStretch(env);
    case "tangle":  return biTangle(env);
    case "pet":     return biPet(env);
    case "piano":   return biPiano(env);
    case "cube":    return biCube(env);
    case "shower":  return biShower(env);
    case "snow":    return h.sand ? biHourglass(env) : h.globe ? biGlobe(env) : biPet(env);
    case "stack":   return biStack(env);
    case "peel":    return biPeel(env);
    default:        return biCube(env);
  }
}

function biGrid({ handles, group, opts }) {
  const B = handles.bubbles;
  if (!B) return biCube({ handles, group, opts });
  const { inst, cols, gap, baseColor, popped } = B;
  const base = opts.baseFreq || 320;
  const setI = (idx, down) => {
    const rr = Math.floor(idx / cols), cc = idx % cols;
    const x = (cc - (cols - 1) / 2) * gap, z = (rr - (B.rows - 1) / 2) * gap;
    tmpM.makeTranslation(x, down ? -0.02 : 0.22, z); if (down) tmpM.scale(new Vector3(1, 0.4, 1));
    inst.setMatrixAt(idx, tmpM); inst.instanceMatrix.needsUpdate = true;
    tmpC.copy(baseColor[idx]); if (down) tmpC.multiplyScalar(0.7); inst.setColorAt(idx, tmpC); if (inst.instanceColor) inst.instanceColor.needsUpdate = true;
  };
  const pop = (idx) => {
    if (popped[idx]) return; popped[idx] = true; setI(idx, true);
    const f = base + idx * 22; opts.tone && opts.tone(f, 0.09, { type: "sine", vol: 0.22, slideTo: f * 0.55 });
    if (popped.every(Boolean)) { opts.celebrate && opts.celebrate(); opts.burst && opts.burst(0.5, 0.5, opts.parts || ["🌟"], 12, 260); setTimeout(() => { popped.forEach((_, k) => { popped[k] = false; setI(k, false); }); beh.wake && beh.wake(); }, 500); }
  };
  let last = -1;
  const beh = { mode: "paint", interactive: [group],
    onDown(hit) { if (hit && hit.instanceId != null) { last = hit.instanceId; pop(hit.instanceId); } },
    onMove(e, n, hit) { if (hit && hit.instanceId != null && hit.instanceId !== last) { last = hit.instanceId; pop(hit.instanceId); } },
    onUp() { last = -1; }, update() { return false; }, dispose() {} };
  return beh;
}

function biFlick({ handles, group, opts }) {
  const spin = handles.gears ? null : (handles.spin || handles.main || group);
  const gears = handles.gears, axis = handles.spinAxis || "z", lava = handles.lavaBlobs;
  let vel = 0, angle = 0, dragging = false, lastX = 0, lastT = 0, lastLap = 0;
  const snd = opts.makeSustain ? opts.makeSustain("triangle") : null; const base = opts.baseFreq || 300;
  return {
    mode: "drag", interactive: [group],
    onDown(hit, e) { dragging = true; lastX = e.clientX; lastT = perfNow(); },
    onMove(e) { if (!dragging) return; const now = perfNow(), dx = e.clientX - lastX, dt = Math.max(1, now - lastT); vel = Math.max(-0.9, Math.min(0.9, (dx / dt) * 0.5)); lastX = e.clientX; lastT = now; },
    onUp() { dragging = false; },
    update() {
      angle += vel; if (!dragging) vel *= 0.985; if (Math.abs(vel) < 0.0006) vel = 0;
      if (gears) { gears.forEach((g) => { g.mesh.rotation.z = angle * g.dir * (0.62 / g.r); }); } else { spin.rotation[axis] = angle; }
      if (lava) lava.forEach((b, i) => { b.position.y = (-0.75 + i * 0.5) + Math.sin(angle * 0.6 + i * 1.7) * 0.28; });
      const speed = Math.min(1, Math.abs(vel) * 3);
      if (snd) { snd.setFreq(base * 0.5 + speed * 520); snd.setVol(speed * 0.12); }
      if (Math.abs(angle - lastLap) > Math.PI * 2) { lastLap = angle; if (speed > 0.15) opts.tone && opts.tone(1200, 0.05, { type: "sine", vol: 0.06 }); }
      return dragging || vel !== 0;
    },
    dispose() { if (snd) snd.stop(); },
  };
}

function biSquish({ handles, group, look, opts }) {
  const main = handles.main || group;
  const base = opts.baseFreq || 300;
  let holding = false, squish = 0, target = 0, v = 0, snd = null, spark = 0;
  return {
    mode: "drag", interactive: [group],
    onDown() { holding = true; snd = opts.makeSustain ? opts.makeSustain(look.finish === "glass" ? "sine" : "triangle") : null; },
    onUp() { holding = false; if (snd) { opts.tone && opts.tone(360 + squish * 240, 0.18, { type: "triangle", vol: 0.15, slideTo: base }); snd.stop(); snd = null; } },
    update(dt, now) {
      target = holding ? 0.62 : 0;
      const k = holding ? 90 : 150, c = holding ? 16 : 15; // snappy return
      v += ((target - squish) * k - v * c) * dt; squish += v * dt; squish = Math.max(-0.05, Math.min(0.72, squish));
      const sy = 1 - squish * 0.5, sxz = 1 + squish * 0.28;
      main.scale.set(sxz, sy, sxz); main.position.y = -(1.1 - 1.1 * sy) * 0.5;
      if (snd) { snd.setFreq(base + squish * 260); snd.setVol(0.06 + squish * 0.12); }
      if (holding && squish > 0.5 && now - spark > 240) { spark = now; opts.tone && opts.tone(880 + Math.random() * 300, 0.07, { type: "sine", vol: 0.12 }); opts.burst && opts.burst(0.5, 0.4, opts.parts || ["✨"], 2, 80); }
      return holding || Math.abs(v) > 0.002 || Math.abs(target - squish) > 0.002;
    },
    dispose() { if (snd) snd.stop(); },
  };
}

function biCoil({ handles, group, opts }) {
  const rings = handles.rings;
  if (!rings) return biStretch({ handles, group, opts });
  let holding = false, stretch = 0, v = 0, snd = null; const base = opts.baseFreq || 300;
  return {
    mode: "drag", interactive: [group],
    onDown() { holding = true; snd = opts.makeSustain ? opts.makeSustain("square") : null; },
    onUp() { holding = false; if (snd) { opts.tone && opts.tone(480 + stretch * 220, 0.2, { type: "triangle", vol: 0.16, slideTo: 140 }); snd.stop(); snd = null; } },
    update(dt) {
      const target = holding ? 1 : 0; const k = holding ? 10 : 150, c = holding ? 6 : 16; // fast boing-back
      v += ((target - stretch) * k - v * c) * dt; stretch += v * dt; stretch = Math.max(0, Math.min(1.15, stretch));
      layoutCoil(rings, stretch);
      if (snd) { snd.setFreq(base * 0.6 + stretch * 360); snd.setVol(0.1); }
      return holding || Math.abs(v) > 0.003 || Math.abs((holding ? 1 : 0) - stretch) > 0.003;
    },
    dispose() { if (snd) snd.stop(); },
  };
}

function biStretch({ handles, group, opts }) {
  const main = handles.main || group;
  let holding = false, s = 0, v = 0, snd = null; const base = opts.baseFreq || 300;
  return {
    mode: "drag", interactive: [group],
    onDown() { holding = true; snd = opts.makeSustain ? opts.makeSustain("sawtooth") : null; },
    onUp() { holding = false; if (snd) { opts.tone && opts.tone(base + s * 200, 0.2, { type: "triangle", vol: 0.16, slideTo: base }); snd.stop(); snd = null; } opts.burst && opts.burst(0.5, 0.5, opts.parts || ["✨"], 3, 90); },
    update(dt) {
      const target = holding ? 1 : 0; const k = holding ? 9 : 150, c = holding ? 6 : 15; // fast snap-back
      v += ((target - s) * k - v * c) * dt; s += v * dt; s = Math.max(-0.05, Math.min(1, s));
      main.scale.set(1 - s * 0.28, 1 + s * 0.9, 1 - s * 0.28);
      if (snd) { snd.setFreq(base * 0.7 + s * 320); snd.setVol(0.1); }
      return holding || Math.abs(v) > 0.003 || Math.abs((holding ? 1 : 0) - s) > 0.003;
    },
    dispose() { if (snd) snd.stop(); },
  };
}

function biTangle({ handles, group, opts }) {
  const segs = handles.tangleSegs; const base = opts.baseFreq || 300;
  // Each joint has its own resting angle; dragging smoothly reshapes the whole
  // chain (coils/uncoils) instead of the old flaily sine wobble.
  const rest = segs ? segs.map((_, i) => Math.sin(i * 1.3) * 0.6) : [];
  let twist = 0, lastX = 0, lastNotch = 0;
  const apply = () => {
    if (segs) segs.forEach((s, i) => { s.next.rotation.x = Math.max(-1.45, Math.min(1.45, rest[i] + twist * 0.28)); });
    group.rotation.y = twist * 0.15;
  };
  return {
    mode: "drag", interactive: [group],
    onDown(hit, e) { lastX = e.clientX; },
    onMove(e) { const dx = e.clientX - lastX; lastX = e.clientX; twist += dx * 0.01; apply();
      if (Math.abs(twist - lastNotch) > 0.35) { lastNotch = twist; opts.tone && opts.tone(base + (twist % 3) * 40, 0.04, { type: "square", vol: 0.1 }); } },
    onUp() {}, update() { return false; }, dispose() {},
  };
}

function biPet({ handles, group, opts }) {
  const main = handles.main || group; const base = opts.baseFreq || 300;
  let active = false, lastX = 0, sway = 0, swayV = 0, snd = null, lastHeart = 0;
  return {
    mode: "drag", interactive: [group],
    onDown(hit, e) { active = true; lastX = e.clientX; snd = opts.makeSustain ? opts.makeSustain("sine") : null; },
    onMove(e) { const dx = e.clientX - lastX; lastX = e.clientX; swayV += dx * 0.0008; const now = perfNow(); if (Math.abs(dx) > 3 && now - lastHeart > 300) { lastHeart = now; opts.burst && opts.burst(0.5, 0.4, opts.parts || ["💕", "✨"], 1, 40); if (snd) { snd.setFreq(base * 0.5); snd.setVol(0.08); } } },
    onUp() { active = false; if (snd) { snd.stop(); snd = null; } },
    update(dt) { swayV += -sway * 14 * dt - swayV * 5 * dt; sway += swayV * dt; sway = Math.max(-0.3, Math.min(0.3, sway)); main.rotation.z = sway; if (snd && !active) snd.setVol(0.02); return active || Math.abs(swayV) > 0.002 || Math.abs(sway) > 0.002; },
    dispose() { if (snd) snd.stop(); },
  };
}

function biPiano({ handles, group, opts, toy }) {
  const balls = handles.balls, main = handles.main || group;
  // Newton's cradle: tap anywhere adds energy; the two end balls swing in
  // antiphase and CLACK as they meet in the middle — the real toy motion.
  if (balls && toy && toy.id === "cradle") {
    const N = balls.length, base = opts.baseFreq || 300;
    let energy = 0, t = 0, prevS = 0;
    return {
      mode: "tap", interactive: [group],
      onDown() { energy = Math.min(1, energy + 0.55); opts.tone && opts.tone(base * 1.2, 0.05, { type: "sine", vol: 0.12 }); },
      update(dt) {
        if (energy < 0.004) { return false; }
        t += dt * 4.2; const s = Math.sin(t) * energy * 0.75;
        balls[0].pivot.rotation.z = Math.min(0, s);
        balls[N - 1].pivot.rotation.z = Math.max(0, s);
        if (Math.sign(s) !== Math.sign(prevS) && Math.abs(s) < 0.06) { opts.tone && opts.tone(680 + Math.random() * 60, 0.04, { type: "square", vol: 0.14 }); }
        prevS = s; energy *= (1 - dt * 0.22);
        return true;
      },
      dispose() {},
    };
  }
  // Chimes / harp / faceted orb: tap a ball (or a zone) to play a note; it swings.
  const scale = [523, 587, 659, 698, 784, 880, 988, 1047];
  let bounce = 0, bounceV = 0;
  return {
    mode: "tap", interactive: [group],
    onDown(hit, e, n) {
      let note, idx = -1;
      if (balls && hit && hit.object) idx = balls.findIndex((b) => hit.object === b.pivot || hit.object.parent === b.pivot);
      if (idx >= 0) { note = scale[idx % scale.length]; balls[idx].kick = (Math.random() < 0.5 ? -1 : 1) * 0.5; }
      else { const i = Math.floor(((n ? n.x : 0) * 0.5 + 0.5) * scale.length) % scale.length; note = scale[i]; bounceV += 3; }
      opts.tone && opts.tone(note, 0.4, { type: "triangle", vol: 0.2 });
      opts.burst && opts.burst(0.5, 0.4, opts.parts || ["🎵", "✨"], 2, 80);
    },
    update(dt) {
      let busy = false;
      if (balls) balls.forEach((b) => { b.kick = b.kick || 0; b.ang = b.ang || 0; b.angV = (b.angV || 0) + ((b.kick - b.ang) * 55 - b.angV * 5) * dt; b.ang += b.angV * dt; b.pivot.rotation.z = b.ang; b.kick *= 0.9; if (Math.abs(b.kick) > 0.01 || Math.abs(b.angV) > 0.01) busy = true; });
      bounceV += -bounce * 90 * dt - bounceV * 6 * dt; bounce += bounceV * dt; main.scale.setScalar(1 + Math.max(0, bounce) * 0.1); if (Math.abs(bounceV) > 0.02) busy = true;
      return busy;
    },
    dispose() {},
  };
}

function biCube({ handles, group, opts }) {
  const main = handles.main || group; const base = opts.baseFreq || 330;
  let combo = 0, timer = 0, bounce = 0, bounceV = 0;
  // real quarter-turn flips: every tap adds 90° to X or Y and we ease toward it.
  let rxT = group.rotation.x, ryT = group.rotation.y;
  return {
    mode: "tap", interactive: [group],
    onDown() {
      bounceV += 3.4; combo++;
      if (Math.random() < 0.5) rxT += Math.PI / 2; else ryT += Math.PI / 2; // a visible flip
      opts.tone && opts.tone(base + ((combo - 1) % 8) * 40, 0.12, { type: "square", vol: 0.16 });
      clearTimeout(timer); timer = setTimeout(() => { if (combo >= 3) { opts.celebrate && opts.celebrate(); opts.burst && opts.burst(0.5, 0.5, opts.parts || ["✨", "🌟", "💥"], Math.min(20, combo * 2), 240); } combo = 0; }, 620);
    },
    update(dt) {
      bounceV += -bounce * 90 * dt - bounceV * 6 * dt; bounce += bounceV * dt; main.scale.setScalar(1 + Math.max(0, bounce) * 0.12);
      const k = Math.min(1, dt * 11);
      group.rotation.x += (rxT - group.rotation.x) * k; group.rotation.y += (ryT - group.rotation.y) * k;
      const flipping = Math.abs(rxT - group.rotation.x) > 0.002 || Math.abs(ryT - group.rotation.y) > 0.002;
      return Math.abs(bounceV) > 0.02 || Math.abs(bounce) > 0.002 || flipping;
    },
    dispose() { clearTimeout(timer); },
  };
}

// ==========================================================================
//  3D particle pool — real little sparkles / stars / feathers / coins / gems
//  that fly up, bounce on the floor and fade. Tap one mid-air to pop it!
// ==========================================================================
const _q = new Quaternion(), _eu = new Euler(), _sv = new Vector3(), _v1 = new Vector3();
const HIDE_M = new Matrix4().compose(new Vector3(0, -999, 0), new Quaternion(), new Vector3(1e-4, 1e-4, 1e-4));
const glowMat = () => new MeshStandardMaterial({ color: 0xffffff, emissive: 0xffffff, emissiveIntensity: 0.1, roughness: 0.25, metalness: 0.2, envMap: envTex, envMapIntensity: 1.2 });
const FX_KINDS = {
  sparkle: () => ({ geo: new OctahedronGeometry(1, 0), mat: glowMat(), grav: 4.5, drag: 0.5, bounce: 0.55, life: 2.6, size: 0.075, spin: 8 }),
  star:    () => ({ geo: starGeo(1, 0.45, 0.4), mat: glowMat(), grav: 3.8, drag: 0.5, bounce: 0.5, life: 2.9, size: 0.1, spin: 6 }),
  feather: () => { const g = new SphereGeometry(1, 12, 8); g.scale(0.38, 0.07, 1); return { geo: g, mat: new MeshStandardMaterial({ color: 0xffffff, roughness: 0.9, envMap: envTex, envMapIntensity: 0.6 }), grav: 0.9, drag: 2.4, bounce: 0.05, life: 4.4, size: 0.17, spin: 2.5, sway: 2.6 }; },
  coin:    () => ({ geo: new CylinderGeometry(1, 1, 0.22, 20), mat: new MeshStandardMaterial({ color: 0xffffff, metalness: 1, roughness: 0.25, envMap: envTex, envMapIntensity: 1.4 }), grav: 6.5, drag: 0.3, bounce: 0.4, life: 3.0, size: 0.1, spin: 10 }),
  gem:     () => { const g = new OctahedronGeometry(1, 0); g.scale(1, 1.3, 1); return { geo: g, mat: new MeshPhysicalMaterial({ color: 0xffffff, roughness: 0.1, clearcoat: 1, envMap: envTex, envMapIntensity: 1.3 }), grav: 6, drag: 0.3, bounce: 0.45, life: 3.0, size: 0.085, spin: 9 }; },
};
function makeFx(env, names, max = 70) {
  const R = env.radius || 1.2, floorY = env.floorY != null ? env.floorY : -R * 1.15;
  const pools = names.map((nm) => {
    const k = FX_KINDS[nm](), inst = new InstancedMesh(env.track(k.geo), env.track(k.mat), max);
    inst.frustumCulled = false;
    for (let i = 0; i < max; i++) { inst.setMatrixAt(i, HIDE_M); inst.setColorAt(i, tmpC.set(0xffffff)); }
    env.scene.add(inst);
    return { k, inst, live: new Array(max).fill(null), next: 0 };
  });
  return {
    meshes: pools.map((p) => p.inst),
    emit(ki, pos, vel, color, mul = 1) {
      const P = pools[ki]; let i = P.live.indexOf(null); if (i < 0) { i = P.next; P.next = (P.next + 1) % max; }
      const K = P.k;
      P.live[i] = { pos: pos.clone(), vel: vel.clone().multiplyScalar(R), age: 0, life: K.life * (0.8 + Math.random() * 0.4), sz: K.size * R * mul * (0.7 + Math.random() * 0.6),
        rx: Math.random() * 6, ry: Math.random() * 6, rz: Math.random() * 6, sx: (Math.random() - 0.5) * K.spin, sy: (Math.random() - 0.5) * K.spin, ph: Math.random() * 6 };
      P.inst.setColorAt(i, tmpC.set(color || "#ffffff")); P.inst.instanceColor.needsUpdate = true;
    },
    kill(obj, id) {
      const P = pools.find((p) => p.inst === obj), p = P && P.live[id]; if (!p) return null;
      P.live[id] = null; P.inst.setMatrixAt(id, HIDE_M); P.inst.instanceMatrix.needsUpdate = true; P.inst.boundingSphere = null; return p.pos;
    },
    update(dt) {
      let alive = false;
      for (const P of pools) {
        const K = P.k; let dirty = false;
        for (let i = 0; i < max; i++) {
          const p = P.live[i]; if (!p) continue; dirty = true; p.age += dt;
          if (p.age > p.life) { P.live[i] = null; P.inst.setMatrixAt(i, HIDE_M); continue; }
          alive = true;
          p.vel.y -= K.grav * R * dt; p.vel.multiplyScalar(Math.exp(-K.drag * dt));
          if (K.sway) p.vel.x += Math.sin(p.age * 3.2 + p.ph) * K.sway * R * dt;
          p.pos.addScaledVector(p.vel, dt);
          const fy = floorY + p.sz * 0.5;
          if (p.pos.y < fy) { p.pos.y = fy; if (p.vel.y < 0) p.vel.y *= -K.bounce; p.vel.x *= 0.75; p.vel.z *= 0.75; p.sx *= 0.6; p.sy *= 0.6; }
          p.rx += p.sx * dt; p.ry += p.sy * dt;
          const fade = Math.max(0.001, Math.min(1, (p.life - p.age) / 0.45, p.age / 0.06));
          _q.setFromEuler(_eu.set(p.rx, p.ry, p.rz)); _sv.setScalar(p.sz * fade);
          tmpM.compose(p.pos, _q, _sv); P.inst.setMatrixAt(i, tmpM);
        }
        if (dirty) { P.inst.instanceMatrix.needsUpdate = true; P.inst.boundingSphere = null; } // fresh bounds so taps can hit them
      }
      return alive;
    },
  };
}
// emoji burst right where the pointer is (stage-relative)
function burstAtEvent(opts, e, marks, n, spread) {
  if (!opts.burst) return;
  const r = e && e.target && e.target.getBoundingClientRect ? e.target.getBoundingClientRect() : null;
  if (!r || !r.width) { opts.burst(0.5, 0.45, marks, n, spread); return; }
  opts.burst((e.clientX - r.left) / r.width, (e.clientY - r.top) / r.height, marks, n, spread);
}

// SHOWER — tap the toy and it rains real 3D sparkles / stars / feathers that
// bounce on the floor. Tap the falling pieces to pop them!
function biShower(env) {
  const { handles, group, look, opts, radius: R } = env;
  const main = handles.main || group, spin = handles.spin, wings = handles.wings;
  const style = look.params.shower || "sparkle";
  const fx = makeFx(env, style === "feather" ? ["feather", "sparkle"] : style === "star" ? ["star", "sparkle"] : ["sparkle", "star"]);
  const cols = look.colors.concat(["#ffffff"]), notes = [523, 587, 659, 784, 880, 1047, 1175, 1319];
  let bounce = 0, bounceV = 0, combo = 0, pops = 0, timer = 0, flap = 0, flapT = 0, twirl = 0, twirlT = 0;
  const origin = new Vector3(), vel = new Vector3();
  const rain = () => {
    const n = Math.min(28, 12 + combo * 3);
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2, out = 0.5 + Math.random() * 1.3;
      origin.set(Math.cos(a) * R * 0.3, R * (0.25 + Math.random() * 0.3), Math.sin(a) * R * 0.3);
      vel.set(Math.cos(a) * out, (style === "feather" ? 1.2 : 1.6) + Math.random() * 1.1, Math.sin(a) * out * 0.7);
      fx.emit(i % 4 === 3 ? 1 : 0, origin, vel, cols[(i + combo) % cols.length]);
    }
  };
  return {
    mode: "tap", interactive: [group, ...fx.meshes],
    onDown(hit, e) {
      if (hit && fx.meshes.includes(hit.object)) { // popped a falling piece!
        fx.kill(hit.object, hit.instanceId); pops++;
        const f = notes[pops % notes.length] * 1.5; opts.tone && opts.tone(f, 0.08, { type: "sine", vol: 0.16, slideTo: f * 1.5 });
        burstAtEvent(opts, e, opts.parts || ["✨"], 3, 70);
        if (pops % 12 === 0) { opts.celebrate && opts.celebrate(); burstAtEvent(opts, e, opts.parts || ["🌟"], 10, 220); }
        return;
      }
      bounceV += 3.4; combo++; flap = 1; twirlT += Math.PI * 2;
      rain();
      notes.slice(0, 4).forEach((f, i) => opts.tone && opts.tone(f * (1 + (combo % 4) * 0.12), 0.12, { type: "triangle", vol: 0.12, when: i * 0.05 }));
      clearTimeout(timer); timer = setTimeout(() => { combo = 0; }, 800);
    },
    update(dt) {
      bounceV += -bounce * 90 * dt - bounceV * 6 * dt; bounce += bounceV * dt; main.scale.setScalar(1 + Math.max(0, bounce) * 0.1);
      let busy = Math.abs(bounceV) > 0.02 || Math.abs(bounce) > 0.002;
      if (wings) { flapT += dt * 26; flap *= Math.exp(-dt * 2.2); wings.forEach((w) => { w.piv.rotation.z = w.s * Math.sin(flapT) * flap * 0.7; }); if (flap > 0.01) busy = true; }
      else if (spin) { twirl += (twirlT - twirl) * Math.min(1, dt * 5); spin.rotation.y = twirl; if (Math.abs(twirlT - twirl) > 0.002) busy = true; }
      return fx.update(dt) || busy;
    },
    dispose() { clearTimeout(timer); },
  };
}

// SNOW GLOBE — drag side to side to shake it; the glitter whooshes up, swirls,
// and then slowly drifts back down to settle on the floor.
function biGlobe({ handles, group, opts }) {
  const { inst, N, R, floorY, pos, vel } = handles.globe;
  const baseX = group.position.x, baseRz = group.rotation.z, base = opts.baseFreq || 400;
  const notes = [1047, 1175, 1319, 1568, 1760, 2093];
  let dragging = false, lastX = 0, lastY = 0, offX = 0, offV = 0, targetX = 0, energy = 0, swirl = 0, lastTink = 0, snd = null, t = 0;
  return {
    mode: "drag", interactive: [group],
    onDown(hit, e) { dragging = true; lastX = e.clientX; lastY = e.clientY; snd = opts.makeSustain ? opts.makeSustain("triangle") : null; },
    onMove(e) {
      const dx = e.clientX - lastX, dy = e.clientY - lastY; lastX = e.clientX; lastY = e.clientY;
      targetX = Math.max(-0.5, Math.min(0.5, targetX + dx * 0.006));
      energy = Math.min(1.6, energy + (Math.abs(dx) + Math.abs(dy)) * 0.006); swirl = Math.max(-2, Math.min(2, swirl + dx * 0.004));
    },
    onUp() { dragging = false; targetX = 0; if (snd) { snd.stop(); snd = null; } },
    update(dt, now) {
      t += dt;
      const prevV = offV; offV += ((targetX - offX) * 140 - offV * 13) * dt; offX += offV * dt;
      const acc = (offV - prevV) / Math.max(dt, 0.001);
      group.position.x = baseX + offX; group.rotation.z = baseRz - offX * 0.4;
      let moving = 0; const kick = energy * 2.2;
      for (let i = 0; i < N; i++) {
        const p = pos[i], v = vel[i];
        if (kick > 0.05 && Math.random() < 0.25) { v.x += (Math.random() - 0.5) * kick; v.y += Math.random() * kick * 1.1; v.z += (Math.random() - 0.5) * kick; }
        v.x -= acc * 0.012 * dt;                                   // the water lags behind the glass
        v.x += -p.z * swirl * dt * 3; v.z += p.x * swirl * dt * 3; // ...and swirls
        v.y -= 0.55 * dt; v.multiplyScalar(Math.exp(-1.6 * dt));
        p.addScaledVector(v, dt);
        const L = p.length(); if (L > R) { p.multiplyScalar(R / L); const d = v.dot(p) / R; if (d > 0) v.addScaledVector(p, -1.6 * d / R); }
        if (p.y < floorY) { p.y = floorY; if (v.y < 0) v.y = 0; v.x *= 0.85; v.z *= 0.85; }
        const sp = v.lengthSq(); if (sp > 0.0004 || p.y > floorY + 0.001) moving++;
        tmpM.makeRotationFromEuler(_eu.set(i + t * Math.min(3, sp * 40), i * 2.3, 0)).setPosition(p); inst.setMatrixAt(i, tmpM);
      }
      inst.instanceMatrix.needsUpdate = true;
      energy *= Math.exp(-4 * dt); swirl *= Math.exp(-1.5 * dt);
      if (snd) { snd.setFreq(base + energy * 300); snd.setVol(Math.min(0.08, energy * 0.06)); }
      if (moving > N * 0.25 && energy > 0.08 && now - lastTink > 110) { lastTink = now; opts.tone && opts.tone(notes[Math.floor(Math.random() * notes.length)], 0.12, { type: "sine", vol: 0.05 }); }
      return dragging || moving > 0 || Math.abs(offV) > 0.002 || Math.abs(offX) > 0.002;
    },
    dispose() { if (snd) snd.stop(); },
  };
}

// SAND TIMER — tap to flip it over; the sand pours grain by grain through the
// neck and piles up in a little hill at the bottom. Shhhhh...
function biHourglass({ handles, opts }) {
  const S = handles.sand, { inst, N, B, T, body, grains: g } = S;
  let top = S.top.slice(), botCount = S.botCount, flipping = false, ft = 0, acc = 0, lastTick = 0, flowing = top.length > 0;
  const write = () => { for (let i = 0; i < N; i++) { tmpM.makeTranslation(g[i].pos.x, g[i].pos.y, g[i].pos.z); inst.setMatrixAt(i, tmpM); } inst.instanceMatrix.needsUpdate = true; };
  const flipDone = () => {
    body.rotation.z = 0;
    g.forEach((q) => { q.pos.x = -q.pos.x; q.pos.y = -q.pos.y; }); // same picture, now right way up
    const nowTop = g.filter((q) => q.st !== "top").sort((a, b) => a.pos.y - b.pos.y);
    const nowBot = g.filter((q) => q.st === "top").sort((a, b) => a.pos.y - b.pos.y);
    nowTop.forEach((q, i) => { q.st = "top"; q.slot = i; }); nowBot.forEach((q, i) => { q.st = "bot"; q.slot = i; });
    top = nowTop; botCount = nowBot.length; flowing = top.length > 0;
  };
  return {
    mode: "tap", interactive: [handles.main],
    onDown() {
      if (flipping) return; flipping = true; ft = 0;
      opts.tone && opts.tone(260, 0.35, { type: "triangle", vol: 0.12, slideTo: 620 });
    },
    update(dt, now) {
      if (flipping) {
        ft = Math.min(1, ft + dt / 0.7); body.rotation.z = (0.5 - 0.5 * Math.cos(Math.PI * ft)) * Math.PI;
        if (ft >= 1) { flipping = false; flipDone(); opts.tone && opts.tone(180, 0.08, { type: "sine", vol: 0.15 }); }
        return true;
      }
      if (top.length) {
        acc += dt;
        while (acc > 0.034 && top.length) {
          acc -= 0.034; const q = top.shift();
          q.st = "fall"; q.slot = botCount++; q.vy = -0.25; q.sx = q.pos.x; q.sz = q.pos.z; q.sy = q.pos.y;
          top.forEach((o, i) => { o.slot = i; }); // everyone above slumps down a spot
        }
      }
      let moving = false; const k = 1 - Math.exp(-10 * dt);
      for (const q of g) {
        if (q.st === "fall") {
          moving = true; q.vy -= 7 * dt; q.pos.y += q.vy * dt;
          const tgt = B[q.slot], f = Math.min(1, (q.sy - q.pos.y) / Math.max(0.01, q.sy - tgt.y));
          q.pos.x = q.sx + (tgt.x - q.sx) * f * f; q.pos.z = q.sz + (tgt.z - q.sz) * f * f;
          if (q.pos.y <= tgt.y) { q.pos.copy(tgt); q.st = "bot"; if (now - lastTick > 40) { lastTick = now; opts.tone && opts.tone(2200 + Math.random() * 1400, 0.015, { type: "sine", vol: 0.025 }); } }
        } else {
          const tgt = (q.st === "top" ? T : B)[q.slot];
          if (q.pos.distanceToSquared(tgt) > 1e-6) { q.pos.lerp(tgt, k); moving = true; }
        }
      }
      write();
      if (flowing && !top.length && !moving) { // all poured — ding!
        flowing = false;
        [1047, 1319, 1568].forEach((f, i) => opts.tone && opts.tone(f, 0.2, { type: "triangle", vol: 0.13, when: i * 0.08 }));
        opts.burst && opts.burst(0.5, 0.45, opts.parts || ["✨"], 6, 150);
      }
      return moving || top.length > 0;
    },
    dispose() {},
  };
}

// KALEIDOSCOPE — drag to twist the end wheel; the mirrored bits tumble into
// brand-new patterns and twinkle a tune. Flick it and it keeps on turning.
function biTwist({ handles, group, opts }) {
  const KH = handles.kaleido, notes = [523, 587, 659, 784, 880, 1047, 1175, 1319, 1568];
  let tw = 0, vel = 0, dragging = false, lastX = 0, lastY = 0, lastT = 0, notch = 0;
  return {
    mode: "drag", interactive: [group],
    onDown(hit, e) { dragging = true; lastX = e.clientX; lastY = e.clientY; lastT = perfNow(); vel = 0; },
    onMove(e) {
      const now = perfNow(), d = (e.clientX - lastX) - (e.clientY - lastY) * 0.6, dt = Math.max(1, now - lastT);
      lastX = e.clientX; lastY = e.clientY; lastT = now; tw += d * 0.008; vel = Math.max(-0.25, Math.min(0.25, d * 0.008 * (16 / dt)));
    },
    onUp() { dragging = false; },
    update(dt) {
      if (!dragging) { tw += vel; vel *= Math.exp(-dt * 1.6); if (Math.abs(vel) < 0.0004) vel = 0; }
      layoutKaleido(KH, tw);
      const n = Math.floor(tw / 0.3);
      if (n !== notch) { notch = n; const i = ((n % notes.length) + notes.length) % notes.length; opts.tone && opts.tone(notes[i], 0.16, { type: "triangle", vol: 0.1 }); if (Math.random() < 0.25) opts.burst && opts.burst(0.5, 0.4, opts.parts || ["✨"], 1, 60); }
      return dragging || vel !== 0;
    },
    dispose() {},
  };
}

// MARBLE MAZE — drag to tilt the tray; the marble rolls, clacks off the walls,
// and drops into the gold-ringed hole. Then a fresh marble pops in!
function biTilt({ handles, opts }) {
  const M = handles.maze, { tray, marble, walls, start, goal, r } = M;
  const p = new Vector2(start.x, start.y), v = new Vector2(), G = 7;
  const axis = new Vector3(), dq = new Quaternion();
  let dragging = false, x0 = 0, y0 = 0, tx = 0, tz = 0, ax = 0, az = 0, st = "roll", t = 0, lastClack = 0;
  const clamp = (x, a, b) => (x < a ? a : x > b ? b : x);
  return {
    mode: "drag", interactive: [handles.main],
    onDown(hit, e) { dragging = true; x0 = e.clientX; y0 = e.clientY; },
    onMove(e) { tz = clamp(-(e.clientX - x0) * 0.004, -0.38, 0.38); tx = clamp((e.clientY - y0) * 0.004, -0.38, 0.38); },
    onUp() { dragging = false; tx = 0; tz = 0; },
    update(dt, now) {
      const k = Math.min(1, dt * 10); ax += (tx - ax) * k; az += (tz - az) * k;
      tray.rotation.x = ax; tray.rotation.z = az;
      let busy = dragging || Math.abs(tx - ax) > 0.001 || Math.abs(tz - az) > 0.001;
      if (st === "roll") {
        const gx = -G * Math.sin(az), gz = G * Math.sin(ax);
        for (let s = 0; s < 3; s++) {
          const h = dt / 3;
          v.x += gx * h; v.y += gz * h; v.multiplyScalar(Math.exp(-1.1 * h));
          const sp = v.length(); if (sp > 4) v.multiplyScalar(4 / sp); else if (sp < 0.02 && Math.abs(gx) + Math.abs(gz) < 0.25) v.set(0, 0); // rests on a flat tray
          p.x += v.x * h; p.y += v.y * h;
          for (const w of walls) {
            const qx = clamp(p.x, w.x0, w.x1), qz = clamp(p.y, w.z0, w.z1);
            let ddx = p.x - qx, ddz = p.y - qz, d = Math.hypot(ddx, ddz);
            if (d >= r) continue;
            if (d < 1e-5) { ddx = 0; ddz = -1; d = 1; }
            const nx = ddx / d, nz = ddz / d; p.x = qx + nx * r; p.y = qz + nz * r;
            const vn = v.x * nx + v.y * nz;
            if (vn < 0) { v.x -= 1.45 * vn * nx; v.y -= 1.45 * vn * nz; if (-vn > 0.5 && now - lastClack > 60) { lastClack = now; opts.tone && opts.tone(520 + Math.min(1, -vn / 4) * 500, 0.04, { type: "square", vol: Math.min(0.16, -vn * 0.05) }); } }
          }
        }
        const step = v.length() * dt;
        if (step > 0) { axis.set(v.y, 0, -v.x).normalize(); dq.setFromAxisAngle(axis, step / r); marble.quaternion.premultiply(dq); busy = true; }
        marble.position.set(p.x, r, p.y);
        if (Math.hypot(p.x - goal.x, p.y - goal.y) < 0.11) { // GOAL!
          st = "sink"; t = 0;
          [523, 659, 784, 1047, 1319].forEach((f, i) => opts.tone && opts.tone(f, 0.16, { type: "triangle", vol: 0.16, when: i * 0.08 }));
          opts.celebrate && opts.celebrate(); opts.burst && opts.burst(0.5, 0.45, opts.parts || ["🌟", "✨", "🎉"], 14, 240);
        }
      } else if (st === "sink") {
        t += dt; busy = true;
        p.x += (goal.x - p.x) * Math.min(1, dt * 12); p.y += (goal.y - p.y) * Math.min(1, dt * 12);
        marble.position.set(p.x, r - t * 0.6, p.y); marble.scale.setScalar(Math.max(0.001, 1 - t * 1.6));
        if (t > 0.6) { st = "spawn"; t = 0; p.set(start.x, start.y); v.set(0, 0); }
      } else if (st === "spawn") {
        t += dt; busy = true; const s = Math.min(1, t / 0.35);
        marble.position.set(p.x, r + (1 - s) * 0.5, p.y); marble.scale.setScalar(Math.max(0.001, s));
        if (s >= 1) { st = "roll"; opts.tone && opts.tone(880, 0.08, { type: "sine", vol: 0.12, slideTo: 1320 }); }
      }
      if (busy) M.flag.rotation.y += dt * 2;
      return busy;
    },
    dispose() {},
  };
}

// CLICKY PEN — tap to click! The button dips and the tip pops in and out.
function biClick({ handles, group, opts }) {
  const P = handles.pen, baseY = group.position.y;
  let press = 0, pressV = 0, out = true, clicks = 0, hop = 0, hopV = 0;
  return {
    mode: "tap", interactive: [group],
    onDown() {
      press = 1; pressV = 0; out = !out; clicks++; hopV += 1.6;
      opts.tone && opts.tone(2200, 0.02, { type: "square", vol: 0.14 });
      opts.tone && opts.tone(out ? 1500 : 1100, 0.03, { type: "square", vol: 0.12, when: 0.07 });
      if (clicks % 10 === 0) { opts.celebrate && opts.celebrate(); opts.burst && opts.burst(0.5, 0.45, opts.parts || ["✨", "🌟"], 10, 200); }
    },
    update(dt) {
      pressV += (-press * 320 - pressV * 22) * dt; press += pressV * dt;
      P.button.position.y = P.btnY - Math.max(0, Math.min(1, press)) * 0.15;
      const nt = out ? P.nibY : P.nibY + 0.22; P.nib.position.y += (nt - P.nib.position.y) * Math.min(1, dt * 30);
      hopV += (-hop * 160 - hopV * 9) * dt; hop += hopV * dt; group.position.y = baseY + hop * 0.12;
      return Math.abs(pressV) > 0.01 || Math.abs(press) > 0.003 || Math.abs(nt - P.nib.position.y) > 0.001 || Math.abs(hopV) > 0.01 || Math.abs(hop) > 0.002;
    },
    dispose() {},
  };
}

// MAGNET STACK — tap to stack the magnet balls into a tower (clack!). Stack
// them ALL and it wobbles... and topples! Then they roll back to go again.
function biStack(env) {
  const { handles, group, opts } = env; const beads = handles.beads;
  if (!beads) return biCube(env);
  const N = beads.length, br = 0.3, step = br * 1.94, sc = 0.85;
  group.rotation.set(0.18, 0, 0); group.scale.setScalar(sc);
  const floorY = -2.0; // bead centers (local) — leaves room for a 9-ball tower in view
  // an invisible tap pad over the whole play area, so a tap ANYWHERE stacks a ball
  const pad = new Mesh(env.track(new CylinderGeometry(2.1, 2.1, 5.4, 16)), env.track(new MeshBasicMaterial({ visible: false }))); pad.position.y = floorY + 2.4; group.add(pad);
  const B = beads.map((m, i) => { const a = (i / N) * Math.PI * 2 + 0.35; return { m, st: "return", home: new Vector3(Math.cos(a) * 1.45, floorY, Math.sin(a) * 1.05), from: m.position.clone(), t: 0, lvl: -1, vel: new Vector3() }; });
  let tower = 0, sway = 0, swayV = 0, toppleAt = 0;
  const towerPos = (L, out) => { const h = L * step; return out.set(Math.sin(sway) * h, floorY + Math.cos(sway) * h, 0); };
  return {
    mode: "tap", interactive: [group],
    onDown() {
      if (toppleAt) return;
      const b = B.find((q) => q.st === "home"); if (!b) return;
      b.st = "fly"; b.t = 0; b.from.copy(b.m.position); b.lvl = tower++;
      opts.tone && opts.tone(300 + b.lvl * 40, 0.12, { type: "sine", vol: 0.1, slideTo: 700 + b.lvl * 60 });
    },
    update(dt, now) {
      let busy = false;
      swayV += (-sway * 30 - swayV * 2.2) * dt; sway += swayV * dt; if (Math.abs(swayV) > 0.001 || Math.abs(sway) > 0.001) busy = true;
      for (const b of B) {
        if (b.st === "fly") {
          busy = true; b.t = Math.min(1, b.t + dt / 0.42); towerPos(b.lvl, _v1);
          b.m.position.lerpVectors(b.from, _v1, b.t); b.m.position.y += Math.sin(Math.PI * b.t) * 1.4;
          if (b.t >= 1) {
            b.st = "stack"; const L = b.lvl;
            opts.tone && opts.tone(820 + L * 70, 0.05, { type: "square", vol: 0.14 }); opts.tone && opts.tone(1640 + L * 90, 0.03, { type: "sine", vol: 0.06, when: 0.03 });
            swayV += (Math.random() < 0.5 ? -1 : 1) * (0.05 + L * 0.03);
            if (B.every((q) => q.st === "stack")) { opts.celebrate && opts.celebrate(); opts.burst && opts.burst(0.5, 0.3, opts.parts || ["✨", "🌟"], 14, 240); toppleAt = now + 900; swayV += 0.5; }
          }
        } else if (b.st === "stack") { towerPos(b.lvl, b.m.position); }
        else if (b.st === "fall") {
          busy = true; b.vel.y -= 14 * dt; b.m.position.addScaledVector(b.vel, dt);
          if (b.m.position.y < floorY) { b.m.position.y = floorY; b.vel.y = b.vel.y < -1 ? b.vel.y * -0.35 : 0; b.vel.x *= 0.7; b.vel.z *= 0.7; }
          b.t += dt; if (b.t > 1.5) { b.st = "return"; b.t = 0; b.from.copy(b.m.position); }
        } else if (b.st === "return") {
          busy = true; b.t = Math.min(1, b.t + dt / 0.6); const e = b.t * b.t * (3 - 2 * b.t);
          b.m.position.lerpVectors(b.from, b.home, e); b.m.position.y += Math.sin(Math.PI * e) * 0.3; if (b.t >= 1) b.st = "home";
        }
      }
      if (toppleAt && now > toppleAt) { // TIMBERRR
        toppleAt = 0; tower = 0; const dir = sway >= 0 ? 1 : -1;
        B.forEach((b) => { if (b.st !== "stack") return; b.st = "fall"; b.t = 0; b.vel.set(dir * (0.6 + b.lvl * 0.55), 0.5 + Math.random(), (Math.random() - 0.5) * 2.2); });
        [0, 0.08, 0.16, 0.26, 0.38].forEach((w, i) => opts.tone && opts.tone(700 - i * 90, 0.05, { type: "square", vol: 0.12, when: w }));
        sway = 0; swayV = 0;
      }
      return busy || toppleAt > 0;
    },
    dispose() {},
  };
}

// TREASURE CHEST — drag the lid up (or just tap) to peek inside: a fountain of
// real 3D gold coins and gems bursts out! Let go and it slams shut — THUNK.
function biPeel(env) {
  const { handles, group, opts } = env; const lid = handles.lid, loot = handles.loot;
  if (!lid) return biStretch(env);
  const fx = makeFx(env, ["coin", "gem"], 80);
  const lootS = loot ? loot.scale.clone() : null;
  const gold = ["#ffd700", "#ffdf5a", "#f5b800"], gems = ["#e63946", "#3d8bfd", "#4caf78", "#ff5da2", "#6ee7f0", "#b558f6"];
  let open = 0, target = 0, v = 0, dragging = false, startY = 0, startOpen = 0, moved = false, popped = false, autoClose = 0, lastCreak = 0, opens = 0;
  lid.rotation.x = 0;
  const o = new Vector3(), vel = new Vector3();
  const spray = () => {
    (loot || lid).getWorldPosition(o);
    for (let i = 0; i < 26; i++) {
      const a = Math.random() * Math.PI * 2, out = 0.4 + Math.random() * 1.2, gem = i % 3 === 2;
      vel.set(Math.cos(a) * out, 3 + Math.random() * 2.2, Math.sin(a) * out * 0.8 + 0.5);
      fx.emit(gem ? 1 : 0, o, vel, gem ? gems[i % gems.length] : gold[i % gold.length]);
    }
    [784, 988, 1175, 1568].forEach((f, i) => opts.tone && opts.tone(f, 0.16, { type: "triangle", vol: 0.15, when: i * 0.07 }));
    opts.burst && opts.burst(0.5, 0.35, opts.parts || ["🪙", "💎"], 8, 200);
    if (++opens % 3 === 0) opts.celebrate && opts.celebrate();
  };
  return {
    mode: "drag", interactive: [group],
    onDown(hit, e) { dragging = true; startY = e.clientY; startOpen = open; moved = false; autoClose = 0; },
    onMove(e) {
      const d = startY - e.clientY; if (Math.abs(d) > 6) moved = true;
      target = Math.max(0, Math.min(1.9, startOpen + d * 0.012));
      const now = perfNow(); if (moved && now - lastCreak > 90) { lastCreak = now; opts.tone && opts.tone(180 + target * 90, 0.05, { type: "sawtooth", vol: 0.04 }); }
    },
    onUp() { dragging = false; if (!moved) { target = 1.75; autoClose = perfNow() + 1500; } else target = 0; },
    update(dt, now) {
      if (autoClose && now > autoClose) { autoClose = 0; target = 0; }
      const k = dragging ? 300 : 70, c = dragging ? 30 : 7;
      v += ((target - open) * k - v * c) * dt; open += v * dt;
      if (open < 0) { if (v < -1.5) { opts.tone && opts.tone(110, 0.14, { type: "sine", vol: 0.25, slideTo: 60 }); opts.tone && opts.tone(240, 0.05, { type: "square", vol: 0.08 }); } open = 0; v = -v * 0.25; }
      if (open > 1.9) { open = 1.9; v = 0; }
      lid.rotation.x = -open;
      if (open > 0.95 && !popped) { popped = true; spray(); }
      if (open < 0.25) popped = false;
      if (loot) { const s = Math.min(1, open / 0.9); loot.scale.set(lootS.x * s + 0.001, lootS.y * s + 0.001, lootS.z * s + 0.001); }
      const live = fx.update(dt);
      return live || dragging || autoClose > 0 || Math.abs(v) > 0.003 || Math.abs(target - open) > 0.003;
    },
    dispose() {},
  };
}

function perfNow() { return (window.performance && performance.now) ? performance.now() : Date.now(); }

// recenter a group at origin & return its bounding radius (for camera fit + orbit)
function centerAndRadius(group) {
  const box = new Box3().setFromObject(group); if (box.isEmpty()) return 1.2;
  const sph = box.getBoundingSphere(new Sphere()); group.position.sub(sph.center); return sph.radius || 1.2;
}

// ==========================================================================
//  Interactive scene
// ==========================================================================
export function createFidgetScene(stageEl, toy, opts = {}) {
  const rnd = ensureRenderer();
  const rect = stageEl.getBoundingClientRect();
  let W = Math.max(120, rect.width), H = Math.max(120, rect.height);
  rnd.setSize(W, H, false);
  const cv = rnd.domElement;
  cv.style.position = "absolute"; cv.style.inset = "0"; cv.style.width = "100%"; cv.style.height = "100%";
  cv.style.display = "block"; cv.style.touchAction = "none"; cv.style.cursor = "grab";
  stageEl.appendChild(cv);

  const scene = new Scene(); scene.environment = envTex; addLights(scene);
  const camera = new PerspectiveCamera(42, W / H, 0.05, 100);
  const disposables = []; const track = (o) => { disposables.push(o); return o; };

  const tierColor = opts.tierColor || "#b558f6";
  const look = toyLook(toy, tierColor);
  const pivot = new Group(); scene.add(pivot);
  const { group, handles } = makeShape(look.shape, look, { track });
  pivot.add(group);
  const radius = centerAndRadius(group);

  const blob = new Mesh(track(new CircleGeometry(radius * 1.25, 40)), track(new MeshBasicMaterial({ map: blobTexture(), transparent: true, depthWrite: false })));
  blob.rotation.x = -Math.PI / 2; blob.position.y = -radius * 1.15; scene.add(blob);

  const dist = radius / Math.sin((42 * Math.PI / 180) / 2) * 1.15;
  camera.position.set(0, radius * 0.5, dist); camera.lookAt(0, 0, 0);
  camera.near = Math.max(0.05, dist - radius * 3); camera.far = dist + radius * 4; camera.updateProjectionMatrix();

  const behavior = makeBehavior(toy.play, { handles, group, look, opts, toy, scene, track, radius, floorY: blob.position.y });

  // High-tier flair: rarer toys get an orbiting sparkle aura + a gentle idle
  // shimmer so legendary/mythic/cosmic/prismatic/divine feel extra special.
  const tierRank = opts.tierRank || 0;
  let auraGroup = null; const auraPts = [];
  if (tierRank >= 4) {
    auraGroup = new Group(); scene.add(auraGroup);
    const n = Math.min(12, 4 + (tierRank - 3) * 2);
    const sgeo = track(new SphereGeometry(radius * 0.05, 8, 6));
    const smat = track(new MeshStandardMaterial({ color: 0xffffff, emissive: new Color(tierColor), emissiveIntensity: 1.2, roughness: 0.4 }));
    for (let i = 0; i < n; i++) { const p = new Mesh(sgeo, smat); const a = (i / n) * Math.PI * 2; auraPts.push({ p, a, yb: (Math.random() - 0.5) * radius * 1.6, rr: radius * (1.35 + Math.random() * 0.35), sp: 0.4 + Math.random() * 0.5 }); auraGroup.add(p); }
  }
  let lastSpark = 0;

  let running = true, awakeUntil = 0, raf = 0, lastT = perfNow();
  const wake = (ms = 500) => { awakeUntil = Math.max(awakeUntil, perfNow() + ms); if (!raf) raf = requestAnimationFrame(frame); };
  behavior.wake = wake;
  function frame() {
    raf = 0; if (!running) return;
    const now = perfNow(), dt = Math.min(0.05, (now - lastT) / 1000); lastT = now;
    let busy = behavior.update ? behavior.update(dt, now) : false;
    if (auraGroup) {
      const t = now / 1000;
      auraPts.forEach((o) => { const a = o.a + t * o.sp; o.p.position.set(Math.cos(a) * o.rr, o.yb + Math.sin(t * 1.5 + o.a) * radius * 0.25, Math.sin(a) * o.rr); });
      if (tierRank >= 6 && now - lastSpark > 1500) { lastSpark = now; opts.burst && opts.burst(0.5, 0.4, opts.parts || ["✨", "⭐"], 2, 140); }
      busy = true; // keep the shimmer alive
    }
    rnd.render(scene, camera);
    if (busy || now < awakeUntil) raf = requestAnimationFrame(frame);
  }
  lastT = perfNow(); wake(2600);

  const ray = new Raycaster(), ndc = new Vector2(), pointers = new Map();
  let mode = null, gesturePid = null, orbitLast = null, yaw = 0, pitch = 0, downXY = null;
  const toNDC = (e) => { const r = cv.getBoundingClientRect(); ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1); return ndc; };
  const pick = (e) => { ray.setFromCamera(toNDC(e), camera); const hits = ray.intersectObjects(behavior.interactive || [group], true); return hits.length ? hits[0] : null; };

  cv.onpointerdown = (e) => {
    cv.setPointerCapture(e.pointerId); pointers.set(e.pointerId, { x: e.clientX, y: e.clientY }); wake();
    if (pointers.size >= 2) { mode = "orbit"; orbitLast = avg(); gesturePid = null; return; }
    const hit = pick(e);
    if (hit) { mode = "gesture"; gesturePid = e.pointerId; downXY = { x: e.clientX, y: e.clientY }; behavior.onDown && behavior.onDown(hit, e, toNDC(e)); }
    else { mode = "orbit"; orbitLast = { x: e.clientX, y: e.clientY }; cv.style.cursor = "grabbing"; }
  };
  cv.onpointermove = (e) => {
    if (!pointers.has(e.pointerId)) return; pointers.set(e.pointerId, { x: e.clientX, y: e.clientY }); wake();
    if (mode === "orbit") {
      const p = pointers.size >= 2 ? avg() : { x: e.clientX, y: e.clientY };
      if (orbitLast) { yaw += (p.x - orbitLast.x) * 0.012; pitch = Math.max(-0.9, Math.min(0.9, pitch + (p.y - orbitLast.y) * 0.012)); pivot.rotation.set(pitch, yaw, 0); }
      orbitLast = p;
    } else if (mode === "gesture" && e.pointerId === gesturePid) {
      if (behavior.mode === "tap" && downXY && Math.hypot(e.clientX - downXY.x, e.clientY - downXY.y) > 10) { mode = "orbit"; orbitLast = { x: e.clientX, y: e.clientY }; return; }
      const hit = behavior.mode === "paint" ? pick(e) : null;
      behavior.onMove && behavior.onMove(e, toNDC(e), hit);
    }
  };
  const end = (e) => {
    if (!pointers.has(e.pointerId)) return; pointers.delete(e.pointerId);
    if (mode === "gesture" && e.pointerId === gesturePid) { behavior.onUp && behavior.onUp(e); gesturePid = null; }
    if (pointers.size === 0) { mode = null; orbitLast = null; cv.style.cursor = "grab"; } else if (pointers.size === 1) { mode = "orbit"; orbitLast = null; }
    wake();
  };
  cv.onpointerup = end; cv.onpointercancel = end;
  function avg() { let x = 0, y = 0; for (const p of pointers.values()) { x += p.x; y += p.y; } return { x: x / pointers.size, y: y / pointers.size }; }

  function onResize() { const r = stageEl.getBoundingClientRect(); W = Math.max(120, r.width); H = Math.max(120, r.height); rnd.setSize(W, H, false); camera.aspect = W / H; camera.updateProjectionMatrix(); wake(); }
  window.addEventListener("resize", onResize);

  return {
    dispose() {
      running = false; if (raf) cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
      behavior.dispose && behavior.dispose();
      cv.onpointerdown = cv.onpointermove = cv.onpointerup = cv.onpointercancel = null;
      scene.remove(pivot); if (auraGroup) scene.remove(auraGroup);
      for (const o of disposables) { try { o.dispose && o.dispose(); } catch {} }
      if (cv.parentNode === stageEl) stageEl.removeChild(cv);
    },
  };
}

// ==========================================================================
//  Thumbnail renderer — one still image of a toy's 3D model (for cards).
// ==========================================================================
let thumbRT = null;
export function renderThumbnail(toy, size = 128, tierColor = "#b558f6") {
  let rnd;
  try { rnd = ensureRenderer(); } catch { return null; }
  const scene = new Scene(); scene.environment = envTex; addLights(scene);
  const camera = new PerspectiveCamera(40, 1, 0.05, 100);
  const disposables = []; const track = (o) => { disposables.push(o); return o; };
  const look = toyLook(toy, tierColor);
  let group;
  try { ({ group } = makeShape(look.shape, look, { track })); } catch { return null; }
  scene.add(group);
  const radius = centerAndRadius(group);
  group.rotation.y += 0.5; // 3/4 view
  const dist = radius / Math.sin((40 * Math.PI / 180) / 2) * 1.18;
  camera.position.set(radius * 0.15, radius * 0.35, dist); camera.lookAt(0, 0, 0);
  camera.near = Math.max(0.05, dist - radius * 3); camera.far = dist + radius * 4; camera.updateProjectionMatrix();

  if (!thumbRT) thumbRT = new WebGLRenderTarget(size, size);
  else thumbRT.setSize(size, size);
  const prevTarget = rnd.getRenderTarget();
  rnd.setRenderTarget(thumbRT);
  rnd.setClearColor(0x000000, 0); rnd.clear();
  rnd.render(scene, camera);
  const buf = new Uint8Array(size * size * 4);
  rnd.readRenderTargetPixels(thumbRT, 0, 0, size, size, buf);
  rnd.setRenderTarget(prevTarget);

  const c = document.createElement("canvas"); c.width = c.height = size;
  const g = c.getContext("2d"); const img = g.createImageData(size, size);
  for (let y = 0; y < size; y++) { const src = (size - 1 - y) * size * 4, dst = y * size * 4; img.data.set(buf.subarray(src, src + size * 4), dst); }
  g.putImageData(img, 0, 0);
  const url = c.toDataURL("image/png");

  scene.remove(group);
  for (const o of disposables) { try { o.dispose && o.dispose(); } catch {} }
  return url;
}
