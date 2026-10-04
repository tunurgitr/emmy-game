// ==========================================================================
//  Emmy's Blind Bag Town 3D — every series plays its own way.
//
//  createMode(item, ctx) → { hint, actions: [{ id, ico, label }], act(id),
//    down(p, hit), move(p, dx, dy), up(p, tap, hit), update(dt, t),
//    slowRise, ownsHolder, deferReveal, cover }
//  down/move/up return true when they handled the input; otherwise the
//  opening table does its default (squish, spin, boing).
//
//  ctx (from open.js): { scene, holder, toy, parts, camera, item, sfx, fit, H,
//    fromBag, setStatus(text), onCoins(n, why), reveal(), hop(), kick(v) }
//
//   🍩 Snacks  — slow-rise squish          🎤 Hunters — a little concert
//   🐔 Cluck   — they lay eggs (feed corn)  🥔 Spuds   — keepy-uppy
//   🐾 Pets    — pet them, give treats      💖 Faces   — the Glow-Up station
//   🦖 Dinos   — tap the egg till it hatches 🫧 Slime  — stretch & poke
//   🐠 Ocean   — they swim in a water bubble; feed them
// ==========================================================================
import { THREE, rnd, clamp, emojiSprite } from "../arcade3d/lib.js";
import { makeDinoEgg, isChicken } from "./models.js";
import { makeEgg } from "../dumpling3d/models.js";

export function createMode(item, ctx) {
  if (isChicken(item)) return item.p.kind === "rubber" ? rubber(ctx) : eggs(ctx);
  switch (item.series) {
    case "snacks": return { slowRise: true, hint: "🤏 Squish it hard… then watch it slooowly rise back!", up(p, tap) { if (!tap) return false; ctx.setStatus(pick(["Sooo squishy! 😌", "Slooow rise… 🍩", "Squish level: MAXIMUM", "*happy squish noises*"])); return false; } };
    case "hunters": return concert(ctx);
    case "spuds": return keepy(ctx);
    case "pets": return pet(ctx);
    case "dinos": return hatch(ctx);
    case "slime": return slime(ctx);
    case "ocean": return swim(ctx);
    default: return { hint: "🤏 Press & hold to squish • tap to boing • drag to spin" };
  }
}
const pick = (a) => a[Math.floor(Math.random() * a.length)];
// little emoji that float up and fade (hearts, notes, "RAWR!")
function floaters(scene) {
  const live = [];
  return {
    add(e, pos, s = 0.35, vy = 0.8) { const sp = emojiSprite(e, s); sp.material = sp.material.clone(); sp.position.copy(pos); scene.add(sp); live.push({ sp, t: 0, vy, vx: rnd(-0.3, 0.3) }); },
    update(dt) { for (let i = live.length - 1; i >= 0; i--) { const f = live[i]; f.t += dt; f.sp.position.y += f.vy * dt; f.sp.position.x += f.vx * dt; f.sp.material.opacity = Math.max(0, 1 - f.t / 1.4); if (f.t > 1.4) { scene.remove(f.sp); f.sp.material.dispose(); live.splice(i, 1); } } },
  };
}
const top = (ctx, k = 1) => new THREE.Vector3(ctx.holder.position.x, ctx.holder.position.y + ctx.H * ctx.fit * k, ctx.holder.position.z);

// ---- 🎤 a little concert: four notes, a light show, the crowd goes wild ----------
function concert(ctx) {
  const fl = floaters(ctx.scene), lights = [], cols = [0xff3d7a, 0xffd23a, 0x3db8ff, 0xb18cff]; let on = false, played = 0, dance = 0;
  for (let i = 0; i < 4; i++) { const l = new THREE.PointLight(cols[i], 0, 6); ctx.scene.add(l); lights.push(l); }
  const play = (i) => { ctx.sfx.note && ctx.sfx.note(i); ctx.hop(); dance = 1; fl.add(["🎵", "🎶", "🎤", "⭐"][i], top(ctx, 0.9).add(new THREE.Vector3(rnd(-0.4, 0.4), 0, 0)), 0.35, 1.0); lights[i].intensity = 6; played++;
    if (played % 8 === 0) { ctx.sfx.cheer && ctx.sfx.cheer(); for (const c of cols) ctx.parts.burst(top(ctx), c, 24, 3, 1.2, 3); ctx.setStatus(pick(["🎉 The crowd goes WILD!", "🌟 Encore! Encore!", "👏 Best concert EVER!"])); } else ctx.setStatus(`🎶 Notes played: ${played} — play 8 for a cheer!`); };
  return {
    hint: "🎤 Tap the coloured notes to play a song — your idol dances along!",
    actions: [{ id: "0", ico: "🔴", label: "Do" }, { id: "1", ico: "🟡", label: "Mi" }, { id: "2", ico: "🔵", label: "Sol" }, { id: "3", ico: "🟣", label: "Do!" }, { id: "lights", ico: "💡", label: "Lights" }],
    act(id) { if (id === "lights") { on = !on; ctx.setStatus(on ? "💡 Light show ON!" : "💡 Light show off"); return; } play(+id); },
    up(p, tap, hit) { if (tap && hit) { play(Math.floor(Math.random() * 4)); return true; } return false; },
    update(dt, t) { fl.update(dt); dance = Math.max(0, dance - dt * 1.5); ctx.holder.rotation.z = Math.sin(t * 12) * 0.15 * dance;
      lights.forEach((l, i) => { const a = t * 1.5 + i * 1.57; l.position.set(Math.cos(a) * 1.6, 2.2, Math.sin(a) * 1.6); l.intensity = on ? 3 + Math.sin(t * 6 + i) * 2 : Math.max(0, l.intensity - dt * 8); }); },
  };
}

// ---- 🐔 chickens lay eggs (feed them corn for a bonus egg) -------------------------
function eggs(ctx) {
  const ch = ctx.toy.userData.chicken, laid = []; let count = 0, golden = 0, peckT = 0, pending = 0;
  const lay = () => {
    const gold = Math.random() < 0.08, e = makeEgg(gold); e.scale.setScalar(1.1); const a = rnd(0, Math.PI * 2);
    const egg = { m: e, x: ctx.holder.position.x - 0.1, y: 0.5, z: -0.25, vx: Math.cos(a) * rnd(0.5, 1.1), vz: Math.sin(a) * rnd(0.3, 0.8) + 0.4, vy: 1.5, rest: false };
    e.position.set(egg.x, egg.y, egg.z); ctx.scene.add(e); laid.push(egg); if (laid.length > 14) { const o = laid.shift(); ctx.scene.remove(o.m); }
    count++; ch && ch.flapNow(); ctx.sfx.bawk && ctx.sfx.bawk(); setTimeout(() => ctx.sfx.pop && ctx.sfx.pop(), 250);
    if (gold && golden < 5) { golden++; ctx.onCoins(1, "🌟 A GOLDEN egg! +🪙 1"); ctx.parts.burst(new THREE.Vector3(egg.x, 0.4, egg.z), 0xffc93c, 30, 2, 1, 2); }
    ctx.setStatus(gold ? `🌟 GOLDEN EGG! (${count} eggs laid)` : `🥚 Eggs laid: ${count}${count >= 10 ? " — what a good chicken!" : ""}`);
  };
  return {
    hint: "🥚 Tap your chicken to make it lay an egg! Feed it corn for extra eggs.",
    actions: [{ id: "corn", ico: "🌽", label: "Feed corn" }],
    act() { peckT = 1.6; pending += 2; ctx.sfx.rattle && ctx.sfx.rattle(); for (let i = 0; i < 10; i++) ctx.parts.burst(new THREE.Vector3(rnd(-0.5, 0.5), 0.05, rnd(0.2, 0.7)), 0xffd23a, 1, 0.3, 1.6, 0); ctx.setStatus("🌽 Peck peck peck… BAWK!"); },
    up(p, tap, hit) { if (tap && hit) { lay(); ctx.hop(); return true; } return false; },
    handlesChicken: true,
    update(dt, t) {
      if (peckT > 0) { peckT -= dt; if (peckT <= 0) { for (let i = 0; i < pending; i++) setTimeout(lay, i * 400); pending = 0; } }
      ch && ch.update(dt, t, 0, peckT > 0 || Math.sin(t * 0.8) > 0.6);
      for (const e of laid) { if (e.rest) continue; e.vy -= 9 * dt; e.x += e.vx * dt; e.z += e.vz * dt; e.y += e.vy * dt; if (e.y < 0.0) { e.y = 0; e.vy = -e.vy * 0.35; e.vx *= 0.7; e.vz *= 0.7; if (Math.abs(e.vy) < 0.3) e.rest = true; } const r = Math.hypot(e.x, e.z); if (r > 1.35) { e.x *= 1.35 / r; e.z *= 1.35 / r; e.vx = -e.vx * 0.3; e.vz = -e.vz * 0.3; } e.m.position.set(e.x, e.y, e.z); e.m.rotation.z += e.vx * dt * 3; }
    },
  };
}
function rubber(ctx) {
  let n = 0, stretch = 0;
  return { hint: "🤡 Squeeze the Rubber Chicken! (Tap it.)", up(p, tap, hit) { if (!tap || !hit) return false; n++; stretch = 1; ctx.sfx.squeak && ctx.sfx.squeak(); ctx.setStatus(n > 10 ? `SQUAAAAAWK ×${n}! Your ears okay?` : `SQUAAAWK! ×${n}`); return true; },
    update(dt) { stretch = Math.max(0, stretch - dt * 2.5); ctx.toy.scale.y *= 1 + Math.sin(stretch * Math.PI) * 0.35; } };
}

// ---- 🥔 keepy-uppy: tap the spud to keep it in the air ------------------------------
function keepy(ctx) {
  let y = 0, vy = 0, air = false, n = 0, best = 0; const v = new THREE.Vector3();
  const near = (p) => { v.copy(top(ctx, 0.5)); v.y = ctx.holder.position.y + y + ctx.H * ctx.fit * 0.5; v.project(ctx.camera); const sx = (v.x + 1) / 2 * p.W, sy = (1 - v.y) / 2 * p.H; return Math.hypot(sx - p.sx, sy - p.sy) < Math.max(90, p.H * 0.16); };
  const bonk = () => { vy = 5.6; air = true; n++; ctx.kick(rnd(-8, 8)); ctx.sfx.boing && ctx.sfx.boing(); ctx.setStatus(`🥔 Bounces: ${n}${best ? ` · Best: ${best}` : ""}`); };
  return {
    hint: "🥔 Keepy-uppy! Tap the spud to bounce it — keep it in the air!",
    ownsLift: true, get lift() { return y; },
    down(p, hit) { if (hit || (air && near(p))) { bonk(); return true; } return false; },
    move() { return false; }, up(p, tap) { return tap; },
    update(dt) {
      if (!air) return; vy -= 13 * dt; y += vy * dt;
      if (y <= 0) { y = 0; air = false; ctx.sfx.squish && ctx.sfx.squish(); if (n > best) { const was = best; best = n; if (was && n >= 3) { ctx.sfx.cheer && ctx.sfx.cheer(); ctx.parts.burst(top(ctx), 0xffd54a, 40, 3, 1.2, 3); } } ctx.setStatus(n >= 10 ? `🏆 ${n} bounces! Amazing! Best: ${best}` : `🥔 ${n} bounce${n === 1 ? "" : "s"}! Best: ${best} — tap to go again`); if (n >= 10) ctx.onCoins(1, `🥔 ${n} bounces! +🪙 1`); n = 0; }
    },
  };
}

// ---- 🐾 pet them (drag across) and give them treats ---------------------------------
function pet(ctx) {
  const fl = floaters(ctx.scene); let love = 0, petting = false, dist = 0, wig = 0, treat = null, loved = false;
  const show = () => ctx.setStatus(`❤️ Happiness: ${"💗".repeat(Math.round(love / 20))}${"🤍".repeat(5 - Math.round(love / 20))}`);
  const add = (n) => { love = clamp(love + n, 0, 100); show(); if (love >= 100 && !loved) { loved = true; ctx.sfx.cheer && ctx.sfx.cheer(); for (let i = 0; i < 8; i++) fl.add("💖", top(ctx).add(new THREE.Vector3(rnd(-0.6, 0.6), rnd(-0.3, 0.2), 0.3)), 0.4, 1.2); ctx.setStatus(`💖 ${ctx.item.baseName} loves you SO much!`); } };
  return {
    hint: "🐾 Drag across your pet to pet it. Give it a treat!",
    actions: [{ id: "treat", ico: "🍪", label: "Treat" }],
    act() { if (treat) return; const m = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.04, 20), new THREE.MeshStandardMaterial({ color: 0xd9a35a, roughness: 0.8 })); for (let i = 0; i < 5; i++) { const c = new THREE.Mesh(new THREE.SphereGeometry(0.02, 6, 4), new THREE.MeshStandardMaterial({ color: 0x3b2216 })); c.position.set(rnd(-0.08, 0.08), 0.02, rnd(-0.08, 0.08)); m.add(c); } m.position.set(0, 2.2, 0.75); ctx.scene.add(m); treat = { m, vy: 0, t: 0, land: false }; ctx.sfx.tap && ctx.sfx.tap(); },
    down(p, hit) { petting = true; dist = 0; return true; }, // petting counts whenever your finger is over the pet
    move(p, dx, dy) { if (!petting) return false; if (!ctx.hitToy(p)) return true; dist += Math.abs(dx) + Math.abs(dy); wig = 1; if (dist > 45) { dist = 0; fl.add(pick(["💗", "💖", "✨", "💕"]), top(ctx, 0.85).add(new THREE.Vector3(rnd(-0.3, 0.3), 0, 0.2))); ctx.sfx.purr && ctx.sfx.purr(); add(4); } return true; },
    up() { if (petting) { petting = false; return true; } return false; },
    update(dt, t) {
      fl.update(dt); wig = Math.max(0, wig - dt * 2); ctx.holder.rotation.z = Math.sin(t * 18) * 0.06 * wig;
      if (treat) { treat.t += dt; if (!treat.land) { treat.vy -= 8 * dt; treat.m.position.y += treat.vy * dt; treat.m.rotation.x += dt * 4; if (treat.m.position.y < 0.05) { treat.m.position.y = 0.05; treat.land = true; treat.t = 0; ctx.hop(); } }
        else { const k = Math.max(0, 1 - treat.t / 0.8); treat.m.scale.setScalar(k + 0.001); if (Math.random() < 0.3) ctx.parts.burst(treat.m.position, 0xd9a35a, 2, 0.8, 0.5, 4); if (treat.t > 0.1 && treat.t - dt <= 0.1) ctx.sfx.munch && ctx.sfx.munch(); if (k <= 0) { ctx.scene.remove(treat.m); treat = null; add(20); fl.add("😋", top(ctx, 1.05), 0.45); } } }
    },
  };
}

// ---- 🦖 tap the egg until it hatches, then ROAR --------------------------------------
function hatch(ctx) {
  const fromBag = ctx.fromBag; let taps = 0, hatched = !fromBag, wob = 0, fly = null; const NEED = 6;
  const egg = fromBag ? makeDinoEgg(ctx.item.p.c) : null; if (egg) { egg.scale.setScalar(1.1); ctx.holder.add(egg); ctx.toy.visible = false; }
  const fl = floaters(ctx.scene);
  const roar = () => { ctx.sfx.roar && ctx.sfx.roar(); ctx.hop(); fl.add(pick(["💥", "🦖", "‼️"]), top(ctx, 1.0), 0.45, 1); ctx.setStatus(pick(["RAWR! 🦖", "ROOOAAAR! (a very cute roar)", "rawr :3", "RAWR means 'I love you' in dinosaur!"])); };
  return {
    hint: "🦖 Tap your dino to make it ROAR!", deferReveal: fromBag, cover: egg,
    actions: [{ id: "roar", ico: "🦖", label: "Roar!" }],
    act() { if (hatched) roar(); },
    start() { if (!hatched) ctx.setStatus("🥚 Tap the egg to crack it open!"); },
    down(p) { if (hatched) return false; const hit = p.ray.intersectObject(egg, true)[0]; if (!hit) return true; taps++; wob = 1; egg.userData.crack(2); ctx.sfx.crack && ctx.sfx.crack(); ctx.parts.burst(hit.point, 0xfff6e4, 8, 1.2, 0.6, 4);
      ctx.setStatus(taps < NEED ? `🥚 Crack… ${"🔨".repeat(taps)}${" ·".repeat(NEED - taps)}` : "🐣 It's hatching!");
      if (taps >= NEED) { hatched = true; fly = { t: 0 }; ctx.toy.visible = true; ctx.sfx.pop && ctx.sfx.pop(); setTimeout(() => { roar(); ctx.reveal(); }, 350); } return true; },
    up(p, tap, hit) { if (hatched && tap && hit) { roar(); return true; } return !hatched; },
    move() { return !hatched; },
    update(dt, t) {
      fl.update(dt);
      if (egg && !fly) { wob = Math.max(0, wob - dt * 3); egg.rotation.z = Math.sin(t * 30) * 0.12 * wob + Math.sin(t * 2) * 0.03; }
      if (fly) { fly.t += dt; const k = fly.t; egg.userData.top.position.set(k * 1.6, k * 3 - k * k * 3, -k); egg.userData.top.rotation.z = -k * 4; egg.userData.bottom.scale.setScalar(Math.max(0.001, 1 - k * 1.2)); ctx.toy.scale.multiplyScalar(Math.min(1, 0.3 + k * 1.6)); if (k > 1.2) { ctx.holder.remove(egg); fly = null; } }
    },
  };
}

// ---- 🫧 stretch the slime: drag it out, let go and it wobbles back -----------------
function slime(ctx) {
  const blob = ctx.toy.userData.slime; if (!blob) return { hint: "🫧 Squish it!" };
  const geo = blob.geometry, pos = geo.attributes.position, N = pos.count, base = Float32Array.from(pos.array), off = new Float32Array(N * 3), vel = new Float32Array(N * 3);
  let grab = null; const plane = new THREE.Plane(), hitP = new THREE.Vector3(), start = new THREE.Vector3(), d = new THREE.Vector3(), tmp = new THREE.Vector3(); let best = 0, active = false;
  const weights = (g) => { const w = new Float32Array(N); for (let i = 0; i < N; i++) { const dx = base[i * 3] - g.x, dy = base[i * 3 + 1] - g.y, dz = base[i * 3 + 2] - g.z; w[i] = Math.exp(-(dx * dx + dy * dy + dz * dz) / 0.035); } return w; };
  const apply = (extra, w) => { for (let i = 0; i < N; i++) { const k = w ? w[i] : 0; pos.array[i * 3] = base[i * 3] + off[i * 3] + (extra ? extra.x * k : 0); pos.array[i * 3 + 1] = base[i * 3 + 1] + off[i * 3 + 1] + (extra ? extra.y * k : 0); pos.array[i * 3 + 2] = base[i * 3 + 2] + off[i * 3 + 2] + (extra ? extra.z * k : 0); } pos.needsUpdate = true; geo.computeVertexNormals(); };
  const MIX = [0xff5d8f, 0xffd54a, 0x6ec6ff, 0x7cffb0, 0xffffff, 0xb18cff];
  return {
    hint: "🫧 Grab the slime and STRETCH it! Tap to poke it.",
    actions: [{ id: "mix", ico: "✨", label: "Mix-ins" }, { id: "squish", ico: "👐", label: "Squish" }],
    act(id) {
      if (id === "mix") { for (let i = 0; i < 10; i++) { const th = rnd(0, Math.PI * 2), ph = rnd(0, 1.2); const v = new THREE.Vector3(Math.sin(ph) * Math.cos(th), Math.cos(ph), Math.sin(ph) * Math.sin(th)).multiplyScalar(0.4); const b = new THREE.Mesh(new THREE.SphereGeometry(0.024, 8, 6), new THREE.MeshStandardMaterial({ color: pick(MIX), roughness: 0.2 })); b.position.copy(v); blob.add(b); } ctx.sfx.sparkle && ctx.sfx.sparkle(); ctx.setStatus("✨ Mixed in some sprinkles!"); }
      if (id === "squish") { for (let i = 0; i < N; i++) { vel[i * 3 + 1] -= base[i * 3 + 1] * 6; vel[i * 3] += base[i * 3] * 3; vel[i * 3 + 2] += base[i * 3 + 2] * 3; } active = true; ctx.sfx.squish && ctx.sfx.squish(); ctx.setStatus("👐 Squiiiish!"); }
    },
    down(p, hit) { if (!hit) return false; const h = p.ray.intersectObject(blob, false)[0]; if (!h) return false; start.copy(h.point); plane.setFromNormalAndCoplanarPoint(ctx.camera.getWorldDirection(tmp).negate(), h.point); grab = { local: blob.worldToLocal(h.point.clone()), w: null }; grab.w = weights(grab.local); ctx.sfx.squish && ctx.sfx.squish(); return true; },
    move(p) { if (!grab) return false; if (!p.ray.ray.intersectPlane(plane, hitP)) return true; d.subVectors(hitP, start); if (d.length() > 0.9) d.setLength(0.9); const a = blob.worldToLocal(start.clone()), b = blob.worldToLocal(start.clone().add(d)); grab.delta = b.sub(a); apply(grab.delta, grab.w); const cm = Math.round(d.length() * 30); if (cm > best) best = cm; ctx.setStatus(`🫧 Streeetch! ${cm} cm (longest: ${best} cm)`); return true; },
    up(p, tap, hit) {
      if (grab) { if (grab.delta) { for (let i = 0; i < N; i++) { const k = grab.w[i]; off[i * 3] += grab.delta.x * k; off[i * 3 + 1] += grab.delta.y * k; off[i * 3 + 2] += grab.delta.z * k; } ctx.sfx.unsquish && ctx.sfx.unsquish(); }
        else if (tap) { for (let i = 0; i < N; i++) { const k = grab.w[i]; vel[i * 3] -= base[i * 3] * k * 8; vel[i * 3 + 1] -= base[i * 3 + 1] * k * 8; vel[i * 3 + 2] -= base[i * 3 + 2] * k * 8; } ctx.sfx.pop && ctx.sfx.pop(); ctx.setStatus("👉 Poke!"); }
        grab = null; active = true; return true; }
      return false;
    },
    ownsSquish: true,
    update(dt) {
      if (grab || !active) return; let e = 0; const k = 55, c = 5;
      for (let i = 0; i < N * 3; i++) { vel[i] += (-off[i] * k - vel[i] * c) * dt; off[i] += vel[i] * dt; e += Math.abs(off[i]) + Math.abs(vel[i]) * 0.05; }
      apply(null, null); if (e < 0.002 * N) { off.fill(0); vel.fill(0); apply(null, null); active = false; }
    },
  };
}

// ---- 🐠 swimming in a bubble of water; tap to make them dash, feed them flakes --------
function swim(ctx) {
  const water = new THREE.Mesh(new THREE.SphereGeometry(1.5, 48, 32), new THREE.MeshPhysicalMaterial({ color: 0x7fd8ff, transparent: true, opacity: 0.16, roughness: 0.05, clearcoat: 1, depthWrite: false, side: THREE.DoubleSide })); water.position.y = 1.05; ctx.scene.add(water);
  const sand = new THREE.Mesh(new THREE.CircleGeometry(1.42, 48), new THREE.MeshStandardMaterial({ color: 0xf2dca8, roughness: 1 })); sand.rotation.x = -Math.PI / 2; sand.position.y = 0.01; ctx.scene.add(sand);
  for (let i = 0; i < 7; i++) { const w = new THREE.Mesh(new THREE.CapsuleGeometry(0.035, 0.5 + Math.random() * 0.4, 4, 8), new THREE.MeshStandardMaterial({ color: 0x3fae5a })); const a = (i / 7) * Math.PI * 2; w.position.set(Math.cos(a) * 1.15, 0.3, Math.sin(a) * 1.15 - 0.1); w.rotation.z = Math.sin(i) * 0.2; ctx.scene.add(w); }
  const bubbles = []; const bm = new THREE.MeshPhysicalMaterial({ color: 0xffffff, transparent: true, opacity: 0.5, roughness: 0, clearcoat: 1 });
  const bubble = (pos, n = 1) => { for (let i = 0; i < n; i++) { const b = new THREE.Mesh(new THREE.SphereGeometry(rnd(0.025, 0.06), 10, 8), bm); b.position.copy(pos).add(new THREE.Vector3(rnd(-0.1, 0.1), rnd(0, 0.1), rnd(-0.1, 0.1))); ctx.scene.add(b); bubbles.push({ b, vy: rnd(0.4, 0.8) }); } };
  const h = ctx.holder; let ang = 0, x = 0.75, z = 0, y = 0.55, yaw = 0, dash = null, flip = 0, eaten = 0; const flakes = [];
  const fl = floaters(ctx.scene), plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -0.8), hp = new THREE.Vector3();
  h.scale.setScalar(0.62);
  return {
    hint: "🐠 Tap the water to make it zoom! Tap your buddy to do a flip. Feed it flakes!", ownsHolder: true,
    actions: [{ id: "feed", ico: "🦐", label: "Feed" }, { id: "bubbles", ico: "🫧", label: "Bubbles" }],
    act(id) { if (id === "feed") { for (let i = 0; i < 5; i++) { const f = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.012, 0.05), new THREE.MeshStandardMaterial({ color: pick([0xff8a3d, 0xffd23a, 0xff5d8f]) })); f.position.set(rnd(-0.8, 0.8), 2.2, rnd(-0.6, 0.8)); ctx.scene.add(f); flakes.push(f); } ctx.sfx.tap && ctx.sfx.tap(); ctx.setStatus("🦐 Food time! Watch it gobble the flakes!"); } else { bubble(new THREE.Vector3(x, y + 0.2, z), 12); ctx.sfx.blub && ctx.sfx.blub(); } },
    down(p, hit) { if (hit) { flip = 1; bubble(h.position, 6); ctx.sfx.blub && ctx.sfx.blub(); ctx.setStatus(pick(["🌀 Flip!", "🌊 Wheee!", "Blub blub! 🫧"])); return true; } if (p.ray.ray.intersectPlane(plane, hp)) { const r = Math.hypot(hp.x, hp.z); if (r > 1.0) hp.multiplyScalar(1.0 / r); dash = { x: hp.x, z: hp.z, t: 1.4 }; ctx.sfx.whoosh && ctx.sfx.whoosh(); } return true; },
    move() { return true; }, up() { return true; },
    update(dt, t) {
      fl.update(dt); let tx, tz, sp = 0.9;
      const food = flakes.length ? flakes.reduce((a, f) => (Math.hypot(f.position.x - x, f.position.z - z) < Math.hypot(a.position.x - x, a.position.z - z) ? f : a)) : null;
      if (food && food.position.y < 1.6) { tx = food.position.x; tz = food.position.z; sp = 1.6; }
      else if (dash) { tx = dash.x; tz = dash.z; sp = 2.6; if ((dash.t -= dt) <= 0) dash = null; }
      else { ang += dt * 0.6; tx = Math.cos(ang) * 0.8; tz = Math.sin(ang) * 0.8; }
      const dx = tx - x, dz = tz - z, dd = Math.hypot(dx, dz); if (dd > 0.02) { const st = Math.min(dd, sp * dt); x += (dx / dd) * st; z += (dz / dd) * st; const want = Math.atan2(dx, dz); let dy = want - yaw; while (dy > Math.PI) dy -= Math.PI * 2; while (dy < -Math.PI) dy += Math.PI * 2; yaw += dy * Math.min(1, dt * 5); }
      const ty = food ? clamp(food.position.y - 0.25, 0.25, 1.2) : 0.55 + Math.sin(t * 1.3) * 0.15; y += (ty - y) * Math.min(1, dt * 2);
      flip = Math.max(0, flip - dt * 1.3); h.position.set(x, y, z); h.rotation.set((1 - flip) * Math.PI * 2 * (flip > 0 ? 1 : 0), yaw, Math.sin(t * 5) * 0.08);
      if (Math.random() < dt * 1.2) bubble(new THREE.Vector3(x, y + 0.3, z));
      for (let i = flakes.length - 1; i >= 0; i--) { const f = flakes[i]; f.position.y = Math.max(0.05, f.position.y - dt * 0.35); f.rotation.y += dt * 2; if (Math.hypot(f.position.x - x, f.position.z - z) < 0.25 && Math.abs(f.position.y - (y + 0.25)) < 0.4) { ctx.scene.remove(f); flakes.splice(i, 1); eaten++; ctx.sfx.munch && ctx.sfx.munch(); fl.add("😋", h.position.clone().add(new THREE.Vector3(0, 0.6, 0)), 0.3); ctx.setStatus(`😋 Yum! Flakes eaten: ${eaten}`); } }
      for (let i = bubbles.length - 1; i >= 0; i--) { const b = bubbles[i]; b.b.position.y += b.vy * dt; b.b.position.x += Math.sin(t * 3 + i) * dt * 0.05; if (b.b.position.y > 2.4) { ctx.scene.remove(b.b); b.b.geometry.dispose(); bubbles.splice(i, 1); } }
    },
  };
}
