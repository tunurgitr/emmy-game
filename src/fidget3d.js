// ==========================================================================
//  fidget3d — real 3D fidget toys for the Fidget Zone + card thumbnails.
//
//  Procedural geometry only (no model/texture files → works offline), built on
//  Three.js which is LAZY-LOADED. Each toy's LOOK comes from its `model3d`
//  descriptor {shape, finish, colors[], cute} and it PLAYS per its `play` type,
//  so every toy looks and plays like the real thing.
//
//  exports:
//    createFidgetScene(stageEl, toy, opts) -> { dispose }   // interactive zone
//    renderThumbnail(toy, size, tierColor) -> dataURL|null  // for toy cards
// ==========================================================================
import {
  WebGLRenderer, Scene, PerspectiveCamera, Group, Object3D,
  DirectionalLight, AmbientLight, Mesh, InstancedMesh,
  Color, Vector2, Vector3, Box3, Sphere, Raycaster, Matrix4, Shape as ThreeShape,
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
    case "ball":
    default:        return shapeBall(look, track);
  }
}

// cute kawaii face on the +Z front of a mesh of the given radius
function addFace(group, track, r, y = 0) {
  const eyeGeo = track(new SphereGeometry(0.11 * r, 16, 12));
  const eyeMat = track(new MeshStandardMaterial({ color: 0x2a2440, roughness: 0.35 }));
  for (const dx of [-0.32, 0.32]) { const e = new Mesh(eyeGeo, eyeMat); e.position.set(dx * r, y + 0.16 * r, 0.94 * r); e.scale.set(1, 1.25, 0.6); group.add(e); }
  const cheekGeo = track(new SphereGeometry(0.12 * r, 14, 10));
  const cheekMat = track(new MeshStandardMaterial({ color: 0xff9ec2, roughness: 0.8, transparent: true, opacity: 0.85 }));
  for (const dx of [-0.52, 0.52]) { const ch = new Mesh(cheekGeo, cheekMat); ch.position.set(dx * r, y - 0.02 * r, 0.9 * r); ch.scale.set(1, 0.6, 0.35); group.add(ch); }
  const sm = new Mesh(track(new TorusGeometry(0.14 * r, 0.03 * r, 8, 16, Math.PI)), eyeMat);
  sm.position.set(0, y - 0.04 * r, 0.95 * r); sm.rotation.z = Math.PI; group.add(sm);
}

function shapePopit(look, track) {
  const group = new Group();
  const cols = 4, rows = 4, gap = 0.62, r = 0.27;
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
  return { group, handles: { main: group, spin: group } };
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
  const ball = new Mesh(track(new SphereGeometry(1.1, 48, 36)), track(makeMat(look.finish, col(look, 0))));
  group.add(ball);
  if (look.cute) addFace(group, track, 1.1);
  return { group, handles: { main: ball } };
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
  const base = new Mesh(track(new RoundedBoxGeometry(1.6, 0.9, 1.1, 3, 0.08)), wood); base.position.y = -0.15; group.add(base);
  const lid = new Group(); lid.position.set(0, 0.3, -0.55);
  const lidMesh = new Mesh(track(new CylinderGeometry(0.55, 0.55, 1.6, 24, 1, false, 0, Math.PI)), wood); lidMesh.rotation.z = Math.PI / 2; lid.add(lidMesh); lid.rotation.x = -0.5; group.add(lid);
  const strap = new Mesh(track(new BoxGeometry(1.65, 0.12, 1.15)), gold); strap.position.y = -0.15; group.add(strap);
  const lock = new Mesh(track(new BoxGeometry(0.24, 0.3, 0.12)), gold); lock.position.set(0, 0.05, 0.56); group.add(lock);
  group.rotation.set(0.15, -0.5, 0);
  return { group, handles: { main: group } };
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

// ==========================================================================
//  Interaction behaviors — keyed by toy.play, using shape handles.
//  Springs are tuned SNAPPY: quick return with a touch of bounce.
// ==========================================================================
function makeBehavior(play, env) {
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
  const gears = handles.gears;
  let vel = 0, angle = 0, dragging = false, lastX = 0, lastT = 0, lastLap = 0;
  const snd = opts.makeSustain ? opts.makeSustain("triangle") : null; const base = opts.baseFreq || 300;
  return {
    mode: "drag", interactive: [group],
    onDown(hit, e) { dragging = true; lastX = e.clientX; lastT = perfNow(); },
    onMove(e) { if (!dragging) return; const now = perfNow(), dx = e.clientX - lastX, dt = Math.max(1, now - lastT); vel = Math.max(-0.9, Math.min(0.9, (dx / dt) * 0.5)); lastX = e.clientX; lastT = now; },
    onUp() { dragging = false; },
    update() {
      angle += vel; if (!dragging) vel *= 0.985; if (Math.abs(vel) < 0.0006) vel = 0;
      if (gears) { gears.forEach((g) => { g.mesh.rotation.z = angle * g.dir * (0.62 / g.r); }); } else { spin.rotation.z = angle; }
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
  let twist = 0, lastX = 0, lastNotch = 0;
  const apply = () => { if (segs) segs.forEach((s, i) => { s.next.rotation.x = Math.sin(i * 1.3 + twist) * (0.6 + twist * 0.15); }); else group.rotation.z = twist; };
  return {
    mode: "drag", interactive: [group],
    onDown(hit, e) { lastX = e.clientX; },
    onMove(e) { const dx = e.clientX - lastX; lastX = e.clientX; twist += dx * 0.012; apply(); if (Math.abs(twist - lastNotch) > 0.35) { lastNotch = twist; opts.tone && opts.tone(base, 0.03, { type: "square", vol: 0.1 }); } },
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

function biPiano({ handles, group, opts }) {
  const balls = handles.balls; const main = handles.main || group;
  const scale = [523, 587, 659, 784, 880, 523, 659, 784];
  let bounce = 0, bounceV = 0;
  return {
    mode: "tap", interactive: [group],
    onDown(hit, e, n) {
      let note;
      if (balls && hit && hit.object) { let idx = balls.findIndex((b) => hit.object.parent === b.pivot); if (idx < 0) idx = 0; note = scale[idx % scale.length]; const b = balls[idx]; if (b) b.kick = (idx < balls.length / 2 ? -1 : 1) * 0.6; }
      else { const i = Math.floor(((n ? n.x : 0) * 0.5 + 0.5) * scale.length) % scale.length; note = scale[i]; bounceV += 3; }
      opts.tone && opts.tone(note, 0.35, { type: "triangle", vol: 0.2 });
      opts.burst && opts.burst(0.5, 0.4, opts.parts || ["🎵", "✨"], 2, 80);
    },
    update(dt) {
      let busy = false;
      if (balls) balls.forEach((b) => { if (b.kick == null) b.kick = 0; b.ang = b.ang || 0; b.angV = (b.angV || 0) + ((b.kick - b.ang) * 60 - b.angV * 6) * dt; b.ang += b.angV * dt; b.pivot.rotation.z = b.ang; b.kick *= 0.9; if (Math.abs(b.kick) > 0.01 || Math.abs(b.angV) > 0.01) busy = true; });
      bounceV += -bounce * 90 * dt - bounceV * 6 * dt; bounce += bounceV * dt; main.scale.setScalar(1 + Math.max(0, bounce) * 0.1); if (Math.abs(bounceV) > 0.02) busy = true;
      return busy;
    },
    dispose() {},
  };
}

function biCube({ handles, group, opts }) {
  const main = handles.main || group; const base = opts.baseFreq || 330;
  let combo = 0, timer = 0, bounce = 0, bounceV = 0, spinV = 0;
  return {
    mode: "tap", interactive: [group],
    onDown() {
      bounceV += 3.2; spinV += 0.6; combo++;
      opts.tone && opts.tone(base + ((combo - 1) % 8) * 40, 0.12, { type: "square", vol: 0.16 });
      clearTimeout(timer); timer = setTimeout(() => { if (combo >= 3) { opts.celebrate && opts.celebrate(); opts.burst && opts.burst(0.5, 0.5, opts.parts || ["✨", "🌟", "💥"], Math.min(20, combo * 2), 240); } combo = 0; }, 620);
    },
    update(dt) {
      bounceV += -bounce * 90 * dt - bounceV * 6 * dt; bounce += bounceV * dt; main.scale.setScalar(1 + Math.max(0, bounce) * 0.12);
      group.rotation.y += spinV * dt; spinV *= 0.92; if (Math.abs(spinV) < 0.02) spinV = 0;
      return Math.abs(bounceV) > 0.02 || Math.abs(bounce) > 0.002 || spinV !== 0;
    },
    dispose() { clearTimeout(timer); },
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

  const behavior = makeBehavior(toy.play, { handles, group, look, opts });

  let running = true, awakeUntil = 0, raf = 0, lastT = perfNow();
  const wake = (ms = 500) => { awakeUntil = Math.max(awakeUntil, perfNow() + ms); if (!raf) raf = requestAnimationFrame(frame); };
  behavior.wake = wake;
  function frame() {
    raf = 0; if (!running) return;
    const now = perfNow(), dt = Math.min(0.05, (now - lastT) / 1000); lastT = now;
    const busy = behavior.update ? behavior.update(dt, now) : false;
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
      scene.remove(pivot);
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
