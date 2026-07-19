// ==========================================================================
//  fidget3d — real 3D fidget toys for the Fidget Zone.
//
//  Procedural geometry only (no model/texture files → works offline), built on
//  Three.js which is LAZY-LOADED: game.js does `await import("./fidget3d/…")`
//  the first time a toy is opened, so the main game bundle is unaffected.
//
//  Every toy's LOOK is derived from its `play` type + tier (optionally overridden
//  by a `model3d` field on the toy). Interactions reuse the game's existing Web
//  Audio + emoji-particle systems, passed in via `opts`.
//
//  createFidgetScene(stageEl, toy, opts) -> { dispose }
//    opts = { tone, makeSustain, burst, celebrate, tierColor, parts }
// ==========================================================================
import {
  WebGLRenderer, Scene, PerspectiveCamera, Group, Object3D,
  DirectionalLight, AmbientLight, Mesh, InstancedMesh,
  Color, Vector2, Vector3, Raycaster, Matrix4,
  SphereGeometry, CylinderGeometry, TorusGeometry, CircleGeometry, BoxGeometry,
  MeshPhysicalMaterial, MeshStandardMaterial, MeshBasicMaterial,
  PMREMGenerator, ACESFilmicToneMapping, SRGBColorSpace, DoubleSide, CanvasTexture,
} from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";

// ---- shared, created once per session ------------------------------------
let renderer = null;
let envTex = null;

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

// A soft blurry contact-shadow blob under the toy (cheaper than shadow maps).
let blobTex = null;
function blobTexture() {
  if (blobTex) return blobTex;
  const c = document.createElement("canvas");
  c.width = c.height = 128;
  const g = c.getContext("2d");
  const grad = g.createRadialGradient(64, 64, 4, 64, 64, 62);
  grad.addColorStop(0, "rgba(0,0,0,.5)");
  grad.addColorStop(1, "rgba(0,0,0,0)");
  g.fillStyle = grad; g.fillRect(0, 0, 128, 128);
  blobTex = new CanvasTexture(c);
  return blobTex;
}

// ---- looks ---------------------------------------------------------------
const SHAPE_BY_PLAY = {
  grid: "popit", flick: "spinner", squeeze: "ball", pet: "ball",
  stretch: "slinky", windup: "tangle", combo: "cube", piano: "cube",
  stack: "cube", snow: "ball", shower: "ball", peel: "slab",
};
const RAINBOW = ["#ff5da2", "#ffb020", "#ffe14d", "#4caf78", "#3d8bfd", "#b558f6", "#00e5d0", "#ff7a45"];

function toyLook(toy, tierColor) {
  const S = toy.model3d || {};
  const shape = S.shape || SHAPE_BY_PLAY[toy.play] || "ball";
  let finish = S.finish;
  if (!finish) {
    if (["diamond", "orb", "marble", "wave", "blackhole", "cradle"].includes(toy.id)) finish = "glass";
    else if (["cube", "robot", "trophy", "gear", "magnet", "saturn", "clickpen", "snap"].includes(toy.id)) finish = "chrome";
    else if (["unicorn", "mochi", "rainbowd", "stressball", "goojar", "putty", "phoenix"].includes(toy.id)) finish = "plush";
    else if (["galaxy", "star", "comet", "fairy", "prism", "disco", "amulet", "infinity", "crown", "lamp", "slinky"].includes(toy.id)) finish = "holo";
    else if (shape === "popit") finish = "silicone";
    else finish = "gloss";
  }
  const colors = S.colors || (shape === "popit" ? RAINBOW : [tierColor, "#ffffff"]);
  return { shape, finish, colors, size: S.size || 1 };
}

function makeMat(finish, color) {
  const c = new Color(color);
  switch (finish) {
    case "chrome": return new MeshStandardMaterial({ color: 0xf2f4f8, metalness: 1, roughness: 0.14, envMap: envTex, envMapIntensity: 1.5 });
    case "glass":  return new MeshPhysicalMaterial({ color: c, metalness: 0, roughness: 0.06, transmission: 0.9, thickness: 1.4, ior: 1.5, transparent: true, envMap: envTex, envMapIntensity: 1.3 });
    case "matte":  return new MeshStandardMaterial({ color: c, roughness: 0.85, metalness: 0, envMap: envTex });
    case "plush":  return new MeshPhysicalMaterial({ color: c, roughness: 1, sheen: 0.8, sheenColor: new Color(0xffffff), clearcoat: 0, envMap: envTex, envMapIntensity: 0.7 });
    case "holo":   return new MeshPhysicalMaterial({ color: c, roughness: 0.22, clearcoat: 1, clearcoatRoughness: 0.2, iridescence: 1, iridescenceIOR: 1.6, metalness: 0.25, envMap: envTex, envMapIntensity: 1.4 });
    case "silicone": return new MeshPhysicalMaterial({ color: c, roughness: 0.35, clearcoat: 0.5, clearcoatRoughness: 0.25, metalness: 0, envMap: envTex, envMapIntensity: 1.0 });
    case "gloss":
    default:       return new MeshPhysicalMaterial({ color: c, roughness: 0.18, clearcoat: 1, clearcoatRoughness: 0.15, metalness: 0, envMap: envTex, envMapIntensity: 1.1 });
  }
}

// ==========================================================================
//  Scene
// ==========================================================================
export function createFidgetScene(stageEl, toy, opts = {}) {
  const rnd = ensureRenderer();
  const rect = stageEl.getBoundingClientRect();
  let W = Math.max(120, rect.width), H = Math.max(120, rect.height);
  rnd.setSize(W, H, false);
  const cv = rnd.domElement;
  cv.style.position = "absolute"; cv.style.inset = "0";
  cv.style.width = "100%"; cv.style.height = "100%";
  cv.style.display = "block"; cv.style.touchAction = "none"; cv.style.cursor = "grab";
  stageEl.appendChild(cv);

  const scene = new Scene();
  scene.environment = envTex;

  const camera = new PerspectiveCamera(42, W / H, 0.1, 100);
  camera.position.set(0, 1.7, 4.4);
  camera.lookAt(0, 0.1, 0);

  const key = new DirectionalLight(0xfff4e0, 2.4); key.position.set(-3, 5, 4); scene.add(key);
  const rim = new DirectionalLight(0xbfe0ff, 0.9); rim.position.set(4, 2, -4); scene.add(rim);
  scene.add(new AmbientLight(0xffffff, 0.35));

  // contact shadow blob
  const blob = new Mesh(new CircleGeometry(1.5, 40), new MeshBasicMaterial({ map: blobTexture(), transparent: true, depthWrite: false }));
  blob.rotation.x = -Math.PI / 2; blob.position.y = -1.35; scene.add(blob);

  const tierColor = opts.tierColor || "#b558f6";
  const look = toyLook(toy, tierColor);

  // toy pivot (orbits) holds the model group
  const pivot = new Group();
  scene.add(pivot);

  const disposables = []; // geometries/materials to free
  const track = (o) => { disposables.push(o); return o; };

  const behavior = buildToy(look, toy, { track, opts, tierColor });
  pivot.add(behavior.group);
  behavior.setBlob = (h) => { blob.position.y = -1.35 + Math.min(1.2, Math.max(0, h)); const s = 1.5 * (1 - Math.min(0.5, h * 0.4)); blob.scale.set(s / 1.5, s / 1.5, 1); blob.material.opacity = 1 - Math.min(0.6, h * 0.5); };

  // ---- render-on-demand loop ----
  let running = true, awakeUntil = 0, raf = 0, lastT = perfNow();
  const wake = (ms = 500) => { awakeUntil = Math.max(awakeUntil, perfNow() + ms); if (!raf) raf = requestAnimationFrame(frame); };
  function frame() {
    raf = 0;
    if (!running) return;
    const now = perfNow();
    const dt = Math.min(0.05, (now - lastT) / 1000); lastT = now;
    const busy = behavior.update ? behavior.update(dt, now) : false;
    rnd.render(scene, camera);
    if (busy || now < awakeUntil) raf = requestAnimationFrame(frame);
  }
  lastT = perfNow(); wake(3200); // brief intro so the 3D form is obvious

  // ---- pointer handling: orbit vs. gesture ----
  const ray = new Raycaster();
  const ndc = new Vector2();
  const pointers = new Map();
  let mode = null; // 'gesture' | 'orbit'
  let orbitLast = null, gesturePid = null;
  let yaw = 0, pitch = 0;

  function toNDC(e) {
    const r = cv.getBoundingClientRect();
    ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    return ndc;
  }
  function pickInteractive(e) {
    if (!behavior.interactive || !behavior.interactive.length) return null;
    ray.setFromCamera(toNDC(e), camera);
    const hits = ray.intersectObjects(behavior.interactive, true);
    return hits.length ? hits[0] : null;
  }

  cv.onpointerdown = (e) => {
    cv.setPointerCapture(e.pointerId);
    pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    wake();
    if (pointers.size >= 2) { mode = "orbit"; orbitLast = avgPointer(); gesturePid = null; return; }
    const hit = pickInteractive(e);
    const gestureWantsDrag = behavior.dragGesture; // drag-based toys grab the drag
    if (hit && (gestureWantsDrag || behavior.tapGesture)) {
      mode = "gesture"; gesturePid = e.pointerId;
      behavior.onDown && behavior.onDown(hit, e, toNDC(e));
    } else {
      mode = "orbit"; orbitLast = { x: e.clientX, y: e.clientY }; cv.style.cursor = "grabbing";
    }
  };
  cv.onpointermove = (e) => {
    if (!pointers.has(e.pointerId)) return;
    pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    wake();
    if (mode === "orbit") {
      const p = pointers.size >= 2 ? avgPointer() : { x: e.clientX, y: e.clientY };
      if (orbitLast) {
        yaw += (p.x - orbitLast.x) * 0.012;
        pitch += (p.y - orbitLast.y) * 0.012;
        pitch = Math.max(-0.9, Math.min(0.9, pitch));
        pivot.rotation.y = yaw; pivot.rotation.x = pitch;
      }
      orbitLast = p;
    } else if (mode === "gesture" && e.pointerId === gesturePid) {
      const hit = behavior.needHitOnMove ? pickInteractive(e) : null;
      behavior.onMove && behavior.onMove(e, toNDC(e), hit);
    }
  };
  const endPointer = (e) => {
    if (!pointers.has(e.pointerId)) return;
    pointers.delete(e.pointerId);
    if (mode === "gesture" && e.pointerId === gesturePid) { behavior.onUp && behavior.onUp(e); gesturePid = null; }
    if (pointers.size === 0) { mode = null; orbitLast = null; cv.style.cursor = "grab"; }
    else if (pointers.size === 1) { mode = "orbit"; orbitLast = null; }
    wake();
  };
  cv.onpointerup = endPointer; cv.onpointercancel = endPointer;
  function avgPointer() {
    let x = 0, y = 0; for (const p of pointers.values()) { x += p.x; y += p.y; }
    return { x: x / pointers.size, y: y / pointers.size };
  }

  // keep the intro-spin gentle for tap toys, then let the user orbit
  behavior.wake = wake;

  function onResize() {
    const r = stageEl.getBoundingClientRect();
    W = Math.max(120, r.width); H = Math.max(120, r.height);
    rnd.setSize(W, H, false); camera.aspect = W / H; camera.updateProjectionMatrix(); wake();
  }
  window.addEventListener("resize", onResize);

  return {
    dispose() {
      running = false;
      if (raf) cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
      behavior.dispose && behavior.dispose();
      cv.onpointerdown = cv.onpointermove = cv.onpointerup = cv.onpointercancel = null;
      scene.remove(pivot);
      for (const o of disposables) { try { o.dispose && o.dispose(); } catch {} }
      if (cv.parentNode === stageEl) stageEl.removeChild(cv);
      // keep renderer + envTex cached for the next open (avoids GL-context churn)
    },
  };
}

function perfNow() { return (window.performance && performance.now) ? performance.now() : Date.now(); }

// ==========================================================================
//  Toy builders — each returns a behavior object.
// ==========================================================================
function buildToy(look, toy, ctx) {
  switch (look.shape) {
    case "popit":   return buildPopit(look, toy, ctx);
    case "spinner": return buildSpinner(look, toy, ctx);
    case "cube":    return buildCube(look, toy, ctx);
    case "slinky":  return buildSlinky(look, toy, ctx);
    case "tangle":  return buildTangle(look, toy, ctx);
    case "slab":    return buildBall(look, toy, ctx); // peel toys use a squishy ball for now
    case "ball":
    default:        return buildBall(look, toy, ctx);
  }
}

const tmpM = new Matrix4();
const tmpC = new Color();

// --- POP-IT: rounded silicone slab + instanced hemisphere bubbles ---------
function buildPopit(look, toy, { track, opts }) {
  const group = new Group();
  const cols = 4, rows = 4, gap = 0.62, r = 0.27;
  const slabW = cols * gap + 0.3, slabH = rows * gap + 0.3;
  const slabGeo = track(new RoundedBoxGeometry(slabW, 0.45, slabH, 4, 0.18));
  const slabMat = track(makeMat("silicone", look.colors[0] || "#ff5da2"));
  const slab = new Mesh(slabGeo, slabMat);
  group.add(slab);

  const bubGeo = track(new SphereGeometry(r, 22, 14, 0, Math.PI * 2, 0, Math.PI * 0.5));
  const bubMat = track(makeMat("silicone", "#ffffff"));
  const inst = new InstancedMesh(bubGeo, bubMat, rows * cols);
  const baseColor = [], popped = [];
  let i = 0;
  for (let rr = 0; rr < rows; rr++) for (let cc = 0; cc < cols; cc++) {
    const x = (cc - (cols - 1) / 2) * gap, z = (rr - (rows - 1) / 2) * gap;
    tmpM.makeTranslation(x, 0.22, z);
    inst.setMatrixAt(i, tmpM);
    const col = new Color(look.colors[i % look.colors.length]);
    inst.setColorAt(i, col); baseColor.push(col.clone()); popped.push(false);
    i++;
  }
  inst.instanceMatrix.needsUpdate = true;
  group.add(inst);

  const base = opts.baseFreq || 320;
  function setInstance(idx, down) {
    const rr = Math.floor(idx / cols), cc = idx % cols;
    const x = (cc - (cols - 1) / 2) * gap, z = (rr - (rows - 1) / 2) * gap;
    tmpM.makeTranslation(x, down ? -0.02 : 0.22, z);
    if (down) tmpM.scale(new Vector3(1, 0.4, 1));
    inst.setMatrixAt(idx, tmpM); inst.instanceMatrix.needsUpdate = true;
    tmpC.copy(baseColor[idx]); if (down) tmpC.multiplyScalar(0.7);
    inst.setColorAt(idx, tmpC); if (inst.instanceColor) inst.instanceColor.needsUpdate = true;
  }
  function pop(idx) {
    if (popped[idx]) return;
    popped[idx] = true; setInstance(idx, true);
    const f = base + idx * 22;
    opts.tone && opts.tone(f, 0.09, { type: "sine", vol: 0.22, slideTo: f * 0.55 });
    if (popped.every(Boolean)) {
      opts.celebrate && opts.celebrate();
      opts.burst && opts.burst(0.5, 0.5, opts.parts || ["🌟"], 12, 260);
      setTimeout(() => { for (let k = 0; k < popped.length; k++) { popped[k] = false; setInstance(k, false); } behavior.wake && behavior.wake(); }, 550);
    }
  }
  let lastIdx = -1;
  const behavior = {
    group, interactive: [inst, slab], tapGesture: true, dragGesture: true, needHitOnMove: true,
    onDown(hit) { if (hit.object === inst && hit.instanceId != null) { lastIdx = hit.instanceId; pop(hit.instanceId); } },
    onMove(e, n, hit) { if (hit && hit.object === inst && hit.instanceId != null && hit.instanceId !== lastIdx) { lastIdx = hit.instanceId; pop(hit.instanceId); } },
    onUp() { lastIdx = -1; },
    update(dt, now) { return false; },
    dispose() {},
  };
  return behavior;
}

// --- SPINNER: arms + chrome bearing, flick to spin with momentum ----------
function buildSpinner(look, toy, { track, opts }) {
  const group = new Group();
  const spinGrp = new Group(); group.add(spinGrp);
  const bodyMat = track(makeMat(look.finish === "chrome" ? "gloss" : look.finish, look.colors[0]));
  const chrome = track(makeMat("chrome"));
  const arms = 3;
  const lobeGeo = track(new SphereGeometry(0.42, 24, 18));
  const ringGeo = track(new TorusGeometry(0.42, 0.1, 12, 24));
  for (let a = 0; a < arms; a++) {
    const ang = (a / arms) * Math.PI * 2;
    const x = Math.cos(ang) * 0.85, y = Math.sin(ang) * 0.85;
    const lobe = new Mesh(lobeGeo, bodyMat); lobe.position.set(x, y, 0); lobe.scale.set(1, 1, 0.55); spinGrp.add(lobe);
    const ring = new Mesh(ringGeo, chrome); ring.position.set(x, y, 0); spinGrp.add(ring);
  }
  const hub = new Mesh(track(new CylinderGeometry(0.36, 0.36, 0.34, 28)), bodyMat);
  hub.rotation.x = Math.PI / 2; spinGrp.add(hub);
  const cap = new Mesh(track(new SphereGeometry(0.22, 20, 16)), chrome); cap.position.z = 0.2; spinGrp.add(cap);
  const capB = new Mesh(track(new SphereGeometry(0.22, 20, 16)), chrome); capB.position.z = -0.2; spinGrp.add(capB);
  group.rotation.x = 0.35; // tilt so it reads as 3D

  let vel = 0, angle = 0, dragging = false, lastX = 0, lastT = 0, lastLap = 0;
  const snd = opts.makeSustain ? opts.makeSustain("triangle") : null;
  const base = opts.baseFreq || 300;
  const behavior = {
    group, interactive: [spinGrp], dragGesture: true,
    onDown(hit, e) { dragging = true; lastX = e.clientX; lastT = perfNow(); },
    onMove(e) {
      if (!dragging) return;
      const now = perfNow(), dx = e.clientX - lastX, dt = Math.max(1, now - lastT);
      vel = Math.max(-0.9, Math.min(0.9, (dx / dt) * 0.5));
      lastX = e.clientX; lastT = now;
    },
    onUp() { dragging = false; },
    update(dt) {
      angle += vel; if (!dragging) vel *= 0.985;
      if (Math.abs(vel) < 0.0006) vel = 0;
      spinGrp.rotation.z = angle;
      const speed = Math.min(1, Math.abs(vel) * 3);
      if (snd) { snd.setFreq(base * 0.5 + speed * 520); snd.setVol(speed * 0.12); }
      if (Math.abs(angle - lastLap) > Math.PI * 2) { lastLap = angle; if (speed > 0.15) opts.tone && opts.tone(1200, 0.05, { type: "sine", vol: 0.06 }); }
      return dragging || Math.abs(vel) > 0;
    },
    dispose() { if (snd) snd.stop(); },
  };
  return behavior;
}

// --- BALL: sphere for squeeze / squish / pet / marble — NEVER pops --------
function buildBall(look, toy, { track, opts, tierColor }) {
  const group = new Group();
  const geo = track(new SphereGeometry(1.1, 48, 36));
  const mat = track(makeMat(look.finish, look.colors[0] || tierColor));
  const ball = new Mesh(geo, mat); group.add(ball);
  // a little face for plush toys so it reads as a squishy character
  if (look.finish === "plush") addFace(group, track);

  const invert = !!toy.invert;
  const isPet = toy.play === "pet";
  const base = opts.baseFreq || 300;
  let holding = false, squish = 0, targetSquish = 0, springV = 0, sway = 0, swayV = 0;
  let snd = null, sparkledAt = 0;
  const behavior = {
    group, interactive: [ball, group], dragGesture: true, tapGesture: true,
    onDown(hit, e) {
      holding = true;
      if (!isPet) { snd = opts.makeSustain ? opts.makeSustain(look.finish === "glass" ? "sine" : "triangle") : null; }
      behavior._lastX = e.clientX;
    },
    onMove(e) {
      if (isPet) {
        // stroking: gentle sway + hearts, no squish
        const dx = e.clientX - (behavior._lastX || e.clientX); behavior._lastX = e.clientX;
        swayV += dx * 0.0006;
        if (Math.abs(dx) > 3) { opts.burst && opts.burst(0.5, 0.42, opts.parts || ["💕", "✨"], 1, 40); }
      }
    },
    onUp() { holding = false; if (snd) { snd.stop(); snd = null; } springV += invert ? -0.02 : 0.02; },
    update(dt, now) {
      // squeeze: hold → squish deeper (clamped so it never inverts/pops); release → spring back
      targetSquish = holding && !isPet ? (invert ? -0.55 : 0.6) : 0;
      const k = 26, c = 7;
      const accel = (targetSquish - squish) * k - springV * c;
      springV += accel * dt; squish += springV * dt;
      // clamp: soft, never collapses to nothing (no pop)
      squish = Math.max(-0.6, Math.min(0.7, squish));
      const sy = 1 - squish * 0.55, sxz = 1 + squish * 0.32;
      ball.scale.set(sxz, sy, sxz);
      ball.position.y = -(1.1 - 1.1 * sy);
      // pet sway
      swayV += -sway * 12 * dt - swayV * 4 * dt; sway += swayV * dt;
      group.rotation.z = Math.max(-0.3, Math.min(0.3, sway));
      if (snd) { snd.setFreq(base + squish * 260); snd.setVol(0.06 + Math.abs(squish) * 0.12); }
      // at max squish, a happy sparkle shimmer (the reward — cute, NOT a burst)
      if (holding && !isPet && Math.abs(squish) > 0.5 && now - sparkledAt > 260) {
        sparkledAt = now;
        opts.tone && opts.tone(880 + Math.random() * 300, 0.07, { type: "sine", vol: 0.12 });
        opts.burst && opts.burst(0.5, 0.4, opts.parts || ["✨"], 2, 80);
      }
      const busy = holding || Math.abs(springV) > 0.001 || Math.abs(targetSquish - squish) > 0.002 || Math.abs(swayV) > 0.001;
      return busy;
    },
    dispose() { if (snd) snd.stop(); },
  };
  return behavior;
}

function addFace(group, track) {
  const eyeGeo = track(new SphereGeometry(0.12, 16, 12));
  const eyeMat = track(new MeshStandardMaterial({ color: 0x2a2440, roughness: 0.4 }));
  for (const dx of [-0.34, 0.34]) {
    const eye = new Mesh(eyeGeo, eyeMat); eye.position.set(dx, 0.2, 1.02); eye.scale.set(1, 1.2, 0.5); group.add(eye);
  }
  const cheekGeo = track(new SphereGeometry(0.13, 14, 10));
  const cheekMat = track(new MeshStandardMaterial({ color: 0xff9ec2, roughness: 0.7, transparent: true, opacity: 0.8 }));
  for (const dx of [-0.55, 0.55]) {
    const ch = new Mesh(cheekGeo, cheekMat); ch.position.set(dx, -0.05, 0.95); ch.scale.set(1, 0.7, 0.4); group.add(ch);
  }
}

// --- CUBE: rounded box for combo (tap-bounce) / piano (tap zones) ---------
function buildCube(look, toy, { track, opts }) {
  const group = new Group();
  const geo = track(new RoundedBoxGeometry(1.6, 1.6, 1.6, 5, 0.22));
  const mat = track(makeMat(look.finish, look.colors[0]));
  const cube = new Mesh(geo, mat); group.add(cube);
  group.rotation.set(0.5, 0.6, 0);

  const isPiano = toy.play === "piano";
  const scale = { c: [523, 587, 659, 784, 880, 523], a: [300, 360, 420, 480, 540, 600] };
  const notes = toy.id === "alien" ? scale.a : scale.c;
  const base = opts.baseFreq || 330;
  let combo = 0, comboTimer = 0, bounce = 0, bounceV = 0, spinV = 0;
  const behavior = {
    group, interactive: [cube], tapGesture: true, needHitOnMove: false,
    onDown(hit, e, n) {
      bounceV += 3.2; spinV += 0.5;
      if (isPiano) {
        const note = notes[Math.floor((n.x * 0.5 + 0.5) * notes.length) % notes.length] || base;
        opts.tone && opts.tone(note, 0.3, { type: "triangle", vol: 0.2 });
      } else {
        combo++;
        opts.tone && opts.tone(base + ((combo - 1) % 8) * 40, 0.12, { type: "square", vol: 0.16 });
        clearTimeout(comboTimer);
        comboTimer = setTimeout(() => {
          if (combo >= 3) { opts.celebrate && opts.celebrate(); opts.burst && opts.burst(0.5, 0.5, opts.parts || ["✨", "🌟", "💥"], Math.min(20, combo * 2), 240); }
          combo = 0;
        }, 620);
      }
    },
    update(dt) {
      bounceV += -bounce * 90 * dt - bounceV * 6 * dt; bounce += bounceV * dt;
      const s = 1 + Math.max(0, bounce) * 0.12; cube.scale.setScalar(s);
      group.rotation.y += spinV * dt; spinV *= 0.92; if (Math.abs(spinV) < 0.02) spinV = 0;
      return Math.abs(bounceV) > 0.02 || Math.abs(bounce) > 0.002 || spinV !== 0;
    },
    dispose() { clearTimeout(comboTimer); },
  };
  return behavior;
}

// --- SLINKY: stack of rings, hold to stretch, release to boing ------------
function buildSlinky(look, toy, { track, opts }) {
  const group = new Group();
  const N = 14, ringGeo = track(new TorusGeometry(0.7, 0.09, 12, 32));
  const rings = [];
  for (let i = 0; i < N; i++) {
    const m = track(makeMat(look.finish === "holo" ? "holo" : "gloss", look.colors.length > 1 ? look.colors[i % look.colors.length] : hsl(i / N)));
    const ring = new Mesh(ringGeo, m); ring.rotation.x = Math.PI / 2; rings.push(ring); group.add(ring);
  }
  group.rotation.z = 0.25;
  let holding = false, stretch = 0, v = 0, snd = null;
  const base = opts.baseFreq || 300;
  function layout() {
    const spread = 0.18 + stretch * 0.5;
    for (let i = 0; i < N; i++) {
      const t = i - (N - 1) / 2;
      rings[i].position.set(t * 0.04 * (1 + stretch * 2), t * spread, 0);
      const wob = Math.sin(t * 0.6 + stretch * 3) * stretch * 0.15;
      rings[i].position.x += wob;
    }
  }
  layout();
  const behavior = {
    group, interactive: group.children.slice(), dragGesture: true, tapGesture: true,
    onDown() { holding = true; snd = opts.makeSustain ? opts.makeSustain("square") : null; },
    onUp() { holding = false; v -= 0.02; if (snd) { opts.tone && opts.tone(480 + stretch * 220, 0.24, { type: "triangle", vol: 0.18, slideTo: 120 }); snd.stop(); snd = null; } },
    update(dt) {
      const target = holding ? 1 : 0;
      const k = holding ? 8 : 22, c = holding ? 6 : 5;
      v += ((target - stretch) * k - v * c) * dt; stretch += v * dt;
      stretch = Math.max(0, Math.min(1.15, stretch));
      layout();
      if (snd) { snd.setFreq(base * 0.6 + stretch * 360); snd.setVol(0.1); }
      return holding || Math.abs(v) > 0.002 || Math.abs(target - stretch) > 0.003;
    },
    dispose() { if (snd) snd.stop(); },
  };
  return behavior;
}

// --- TANGLE: chain of elbow segments, drag to twist -----------------------
function buildTangle(look, toy, { track, opts }) {
  const group = new Group();
  const N = 10, elbow = track(new TorusGeometry(0.34, 0.13, 12, 20, Math.PI / 2));
  const segs = [];
  let node = new Object3D(); group.add(node);
  for (let i = 0; i < N; i++) {
    const holder = new Object3D(); node.add(holder);
    const m = track(makeMat("gloss", look.colors.length > 1 ? look.colors[i % 4] : hsl(i / N)));
    const mesh = new Mesh(elbow, m); holder.add(mesh);
    // position elbow so ends connect, then step to the next joint
    mesh.rotation.z = Math.PI;
    const next = new Object3D(); next.position.set(0.34, 0.34, 0); next.rotation.z = -Math.PI / 2;
    holder.add(next); segs.push({ holder, next }); node = next;
  }
  group.scale.setScalar(0.9); group.position.set(-0.3, 0.2, 0);
  group.rotation.set(0.3, 0.2, 0);
  let twist = 0, base = opts.baseFreq || 300, lastNotch = 0, lastX = 0;
  function apply() { segs.forEach((s, i) => { s.next.rotation.x = Math.sin(i * 1.3 + twist) * (0.6 + twist * 0.2); }); }
  apply();
  const behavior = {
    group, interactive: group.children.slice(), dragGesture: true,
    onDown(hit, e) { lastX = e.clientX; },
    onMove(e) {
      const dx = e.clientX - lastX; lastX = e.clientX;
      twist += dx * 0.01; apply();
      if (Math.abs(twist - lastNotch) > 0.35) { lastNotch = twist; opts.tone && opts.tone(base, 0.03, { type: "square", vol: 0.1 }); }
    },
    update() { return false; },
    dispose() {},
  };
  return behavior;
}

function hsl(t) { const c = new Color(); c.setHSL(t, 0.7, 0.55); return "#" + c.getHexString(); }
