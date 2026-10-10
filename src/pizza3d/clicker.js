// ==========================================================================
//  Emmy's Pizza Plus — the clicker engine.
//
//  createClicker(canvas, def, save, { stars, boost, autoBoost, onEarn, onGoal, onChange })
//    → { G, poke(), buy(slot), upInfo(slot), goalInfo(), dispose() }
//
//  A game definition (see games.js) gets a little world object G each frame:
//    G.W, G.H, G.u (1% of the short side), G.cx, G.cy, G.t, G.s (the game's own state)
//    G.add(n, x, y, opts)   → award n "actions" (× tap power × multipliers, maybe a crit)
//    G.burst(x, y, emojis, n, opts) / G.dots(x, y, colours, n) / G.float(text, x, y, colour)
//    G.shake(px) / G.flash(colour) / G.say(text, x, y) / G.sfx / G.tone / G.noise
//  and these hooks:  init, down(G,x,y), move, up, update(G,dt), draw(G,g), autoTick(G), hot(G)
//
//  Upgrades (three per game) are bought with the game's own points:
//    "tap"  — more per tap     "auto" — a helper that earns every second
//    "mult" — ×1.5 everything  "crit" — 6% chance per level of a CHEESY ×5
// ==========================================================================
import { tone, noise, SFX } from "./audio.js";

export const INK = "#4a2a1a";
export const GOALS = [25, 100, 400, 1500, 6000, 25000, 100000, 400000, 1500000];
export const GOAL_COINS = [3, 8, 15, 30, 60, 120, 250, 500, 900];
const SLOT_COST = [12, 30, 90];
const KIND_DESC = { tap: (d) => `+${d.base} every tap`, auto: (d) => `+${fmt(d.base * (d.autoRate || 1))} every second, by itself`, mult: () => "×1.5 on EVERYTHING", crit: () => "+6% chance of a CHEESY ×5 tap" };
export const fmt = (n) => { n = Math.floor(n); if (n < 10000) return String(n); if (n < 1e6) return (n / 1000).toFixed(n < 1e5 ? 1 : 0).replace(/\.0$/, "") + "K"; if (n < 1e9) return (n / 1e6).toFixed(1).replace(/\.0$/, "") + "M"; return (n / 1e9).toFixed(1).replace(/\.0$/, "") + "B"; };
export const rnd = (a, b) => a + Math.random() * (b - a);
export const pick = (a) => a[Math.floor(Math.random() * a.length)];
export const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
export const dist = (ax, ay, bx, by) => Math.hypot(ax - bx, ay - by);

// --------------------------------------------------------------------------
//  Drawing kit (chunky outlines, like the 3D town)
// --------------------------------------------------------------------------
const emoCache = new Map();
const EMO_FONT = `"Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif`;
function emoCanvas(ch, size) {
  const b = Math.max(16, Math.min(256, Math.ceil(size / 16) * 16)), key = ch + "|" + b; let c = emoCache.get(key);
  if (!c) { c = document.createElement("canvas"); c.width = c.height = Math.ceil(b * 1.3); const g = c.getContext("2d"); g.font = `${b}px ${EMO_FONT}`; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText(ch, c.width / 2, c.height / 2 + b * 0.06); emoCache.set(key, c); if (emoCache.size > 600) emoCache.delete(emoCache.keys().next().value); }
  return c;
}
export function E(g, ch, x, y, size, rot = 0, alpha = 1, sx = 1, sy = 1) {
  const c = emoCanvas(ch, size), s = (size * 1.3) / c.width * c.width; g.save(); g.globalAlpha *= alpha; g.translate(x, y); if (rot) g.rotate(rot); g.scale(sx, sy); g.drawImage(c, -s / 2, -s / 2, s, s); g.restore();
}
export function circ(g, x, y, r, fill, stroke = INK, lw = null) { g.beginPath(); g.arc(x, y, Math.max(0.5, r), 0, Math.PI * 2); if (fill) { g.fillStyle = fill; g.fill(); } if (stroke) { g.strokeStyle = stroke; g.lineWidth = lw ?? Math.max(2, r * 0.09); g.stroke(); } }
export function oval(g, x, y, rx, ry, fill, stroke = INK, lw = null, rot = 0) { g.beginPath(); g.ellipse(x, y, Math.max(0.5, rx), Math.max(0.5, ry), rot, 0, Math.PI * 2); if (fill) { g.fillStyle = fill; g.fill(); } if (stroke) { g.strokeStyle = stroke; g.lineWidth = lw ?? Math.max(2, Math.min(rx, ry) * 0.1); g.stroke(); } }
export function rr(g, x, y, w, h, r, fill, stroke = INK, lw = 3) { r = Math.min(r, w / 2, h / 2); g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); if (fill) { g.fillStyle = fill; g.fill(); } if (stroke) { g.strokeStyle = stroke; g.lineWidth = lw; g.stroke(); } }
export function txt(g, s, x, y, size, color = INK, { align = "center", stroke = null, weight = 900, base = "middle" } = {}) { g.font = `${weight} ${size}px system-ui, -apple-system, "Segoe UI", sans-serif`; g.textAlign = align; g.textBaseline = base; if (stroke) { g.lineWidth = size * 0.22; g.strokeStyle = stroke; g.lineJoin = "round"; g.strokeText(s, x, y); } g.fillStyle = color; g.fillText(s, x, y); }
export function bar(g, x, y, w, h, frac, color, bg = "rgba(255,255,255,.7)") { rr(g, x, y, w, h, h / 2, bg, INK, 3); if (frac > 0) rr(g, x + 3, y + 3, Math.max(h - 6, (w - 6) * clamp(frac, 0, 1)), h - 6, (h - 6) / 2, color, null); }
// a cute face — moods: happy, joy, wow, angry, grumpy, sad, sleep, dizzy, smug
export function face(g, x, y, r, mood = "happy", { blink = false, blush = true, look = 0 } = {}) {
  g.save(); g.lineCap = "round"; g.lineJoin = "round"; const ex = r * 0.38, ey = y - r * 0.08, er = r * 0.13; g.strokeStyle = INK; g.fillStyle = INK; g.lineWidth = Math.max(2, r * 0.07);
  if (blush) { g.fillStyle = "rgba(255,110,140,.5)"; for (const s of [-1, 1]) { g.beginPath(); g.ellipse(x + s * r * 0.62, y + r * 0.2, r * 0.17, r * 0.1, 0, 0, 7); g.fill(); } g.fillStyle = INK; }
  for (const s of [-1, 1]) { const X = x + s * ex + look * r * 0.08;
    if (blink || mood === "sleep") { g.beginPath(); g.arc(X, ey, er, 0.15 * Math.PI, 0.85 * Math.PI); g.stroke(); }
    else if (mood === "joy") { g.beginPath(); g.arc(X, ey + er * 0.6, er, 1.15 * Math.PI, 1.85 * Math.PI); g.stroke(); }
    else if (mood === "dizzy") { g.beginPath(); g.moveTo(X - er, ey - er); g.lineTo(X + er, ey + er); g.moveTo(X + er, ey - er); g.lineTo(X - er, ey + er); g.stroke(); }
    else { g.beginPath(); g.ellipse(X, ey, er * 0.85, er * 1.15, 0, 0, 7); g.fill(); g.fillStyle = "#fff"; g.beginPath(); g.arc(X - er * 0.3, ey - er * 0.4, er * 0.32, 0, 7); g.fill(); g.fillStyle = INK; }
    if (mood === "angry" || mood === "grumpy") { g.beginPath(); g.moveTo(X + s * er * 1.4, ey - er * 2.3); g.lineTo(X - s * er * 1.2, ey - er * 1.5); g.stroke(); }
    if (mood === "sad") { g.beginPath(); g.moveTo(X - s * er * 1.4, ey - er * 2.2); g.lineTo(X + s * er * 1.1, ey - er * 1.6); g.stroke(); }
  }
  const my = y + r * 0.3;
  if (mood === "wow" || mood === "dizzy") { g.fillStyle = "#7a2a2a"; g.beginPath(); g.ellipse(x, my + r * 0.05, r * 0.13, r * 0.17, 0, 0, 7); g.fill(); g.stroke(); }
  else if (mood === "angry" || mood === "grumpy" || mood === "sad") { g.beginPath(); g.arc(x, my + r * 0.2, r * 0.2, 1.15 * Math.PI, 1.85 * Math.PI); g.stroke(); }
  else if (mood === "smug") { g.beginPath(); g.moveTo(x - r * 0.18, my); g.quadraticCurveTo(x + r * 0.05, my + r * 0.12, x + r * 0.22, my - r * 0.06); g.stroke(); }
  else if (mood === "sleep") { g.beginPath(); g.arc(x, my, r * 0.07, 0, 7); g.stroke(); }
  else { g.fillStyle = "#7a2a2a"; g.beginPath(); g.moveTo(x - r * 0.22, my - r * 0.04); g.quadraticCurveTo(x, my + r * (mood === "joy" ? 0.36 : 0.28), x + r * 0.22, my - r * 0.04); g.closePath(); g.fill(); g.stroke(); }
  g.restore();
}
// a top-down pizza with toppings in fixed spots
export function pizza(g, x, y, r, { sauce = true, cheese = true, peps = 7, rot = 0, crust = "#e8b26a", bite = 0 } = {}) {
  g.save(); g.translate(x, y); g.rotate(rot);
  circ(g, 0, 0, r, crust, INK, Math.max(3, r * 0.05)); if (sauce) circ(g, 0, 0, r * 0.84, "#f2483a", null); if (cheese) { g.fillStyle = "#ffd23f"; g.beginPath(); for (let i = 0; i <= 24; i++) { const a = (i / 24) * Math.PI * 2, rr2 = r * (0.74 + Math.sin(i * 2.7) * 0.05); g.lineTo(Math.cos(a) * rr2, Math.sin(a) * rr2); } g.fill(); }
  for (let i = 0; i < peps; i++) { const a = i * 2.4 + 0.3, d = r * (i % 3 === 0 ? 0.22 : 0.52); circ(g, Math.cos(a) * d, Math.sin(a) * d, r * 0.12, "#d8343a", "#9a1f24", Math.max(1.5, r * 0.02)); }
  if (bite) { g.globalCompositeOperation = "destination-out"; for (let i = 0; i < 3; i++) circ(g, r * 0.95, (i - 1) * r * 0.22, r * 0.2 * bite, "#000", null); g.globalCompositeOperation = "source-over"; }
  g.restore();
}
// a pizza slice pointing up from (x, y), length L
export function slice(g, x, y, L, { rot = 0, peps = 3, bite = 0 } = {}) {
  g.save(); g.translate(x, y); g.rotate(rot); g.lineJoin = "round";
  g.beginPath(); g.moveTo(0, -L); g.lineTo(L * 0.42, 0); g.quadraticCurveTo(0, L * 0.16, -L * 0.42, 0); g.closePath(); g.fillStyle = "#ffd23f"; g.fill(); g.strokeStyle = INK; g.lineWidth = Math.max(3, L * 0.05); g.stroke();
  rr(g, -L * 0.46, -L * 0.08, L * 0.92, L * 0.2, L * 0.1, "#e8b26a", INK, Math.max(3, L * 0.05));
  for (let i = 0; i < peps; i++) circ(g, [0.0, 0.12, -0.12][i] * L, [-0.62, -0.32, -0.3][i] * L, L * 0.08, "#d8343a", "#9a1f24", 2);
  g.restore();
}
export function speech(g, text, x, y, size, { bg = "#fffaf0", color = INK, maxW = 260 } = {}) {
  g.font = `900 ${size}px system-ui, sans-serif`; const words = text.split(" "), lines = []; let cur = ""; for (const w of words) { const t = cur ? cur + " " + w : w; if (g.measureText(t).width > maxW && cur) { lines.push(cur); cur = w; } else cur = t; } if (cur) lines.push(cur);
  const W = Math.max(...lines.map((l) => g.measureText(l).width)) + size * 1.2, H = lines.length * size * 1.2 + size * 0.7; const bx = clamp(x - W / 2, 6, g.canvas.width / (g.getTransform().a || 1) - W - 6), by = y - H - size * 0.6;
  rr(g, bx, by, W, H, size * 0.6, bg, INK, 3); g.beginPath(); g.moveTo(x - size * 0.4, by + H - 1); g.lineTo(x, by + H + size * 0.55); g.lineTo(x + size * 0.4, by + H - 1); g.fillStyle = bg; g.fill(); g.strokeStyle = INK; g.lineWidth = 3; g.beginPath(); g.moveTo(x - size * 0.4, by + H); g.lineTo(x, by + H + size * 0.55); g.lineTo(x + size * 0.4, by + H); g.stroke();
  lines.forEach((l, i) => txt(g, l, bx + W / 2, by + size * 0.95 + i * size * 1.2, size, color, { weight: 800 }));
}

// --------------------------------------------------------------------------
//  The engine
// --------------------------------------------------------------------------
export function createClicker(canvas, def, save, { stars = 0, boost = () => 1, autoBoost = () => 1, onEarn, onGoal, onChange } = {}) {
  const g = canvas.getContext("2d");
  save.up = save.up || [0, 0, 0]; save.pts = save.pts || 0; save.total = save.total || 0; save.ms = save.ms || 0;
  const base = def.base || 1, slots = def.ups;
  const lvl = (k) => { const i = slots.findIndex((s) => s[0] === k); return i < 0 ? 0 : save.up[i]; };
  const G = {
    def, s: {}, t: 0, W: 1, H: 1, u: 1, cx: 0, cy: 0, taps: 0, earned: 0, down: false, px: 0, py: 0,
    sfx: SFX, tone, noise, parts: [], floats: [], says: [], shakeT: 0, shakeA: 0, flashC: null, flashT: 0,
    get tapVal() { return base * (1 + lvl("tap")); },
    get mult() { return (1 + stars * 0.25) * Math.pow(1.5, lvl("mult")) * boost(); },
    get autoRate() { return lvl("auto") * base * (def.autoRate || 1) * (1 + stars * 0.25) * Math.pow(1.5, lvl("mult")) * autoBoost() * boost(); },
    get crit() { return lvl("crit") * 0.06; },
    lvl,
    add(n = 1, x = G.cx, y = G.cy, { color = "#fff", quiet = false, noCrit = false, flat = false } = {}) {
      let v = (flat ? n : n * G.tapVal) * G.mult, crit = false; if (!noCrit && Math.random() < G.crit) { v *= 5; crit = true; }
      earn(v); if (!quiet) G.float(`+${fmt(Math.max(1, v))}${crit ? " CHEESY!" : ""}`, x, y - G.u * 4, crit ? "#ffd23f" : color, crit ? 1.4 : 1);
      if (crit) { G.burst(x, y, ["🧀", "✨"], 8); SFX.sparkle(); } return v;
    },
    burst(x, y, emos, n = 6, { speed = 1, size = 1, grav = 1, life = 1 } = {}) { for (let i = 0; i < n; i++) { const a = rnd(0, Math.PI * 2), sp = rnd(20, 50) * G.u * 0.1 * speed * 10; G.parts.push({ x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - G.u * 25 * speed, life: rnd(0.6, 1.1) * life, max: 1.1 * life, e: Array.isArray(emos) ? pick(emos) : emos, size: G.u * rnd(4, 7) * size, rot: rnd(-1, 1), vr: rnd(-6, 6), grav }); } },
    dots(x, y, colors, n = 8, { speed = 1, size = 1 } = {}) { for (let i = 0; i < n; i++) { const a = rnd(0, Math.PI * 2), sp = rnd(15, 45) * G.u * speed; G.parts.push({ x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - G.u * 15, life: rnd(0.4, 0.8), max: 0.8, c: pick(colors), size: G.u * rnd(1, 2.2) * size, grav: 1 }); } },
    float(text, x, y, color = "#fff", scale = 1) { G.floats.push({ text, x, y, color, t: 1, scale }); if (G.floats.length > 30) G.floats.shift(); },
    say(text, x, y, secs = 1.8) { G.says = G.says.filter((s) => Math.abs(s.x - x) > 5 || Math.abs(s.y - y) > 5); G.says.push({ text, x, y, t: secs }); if (G.says.length > 3) G.says.shift(); },
    shake(a = 1) { G.shakeT = 0.3; G.shakeA = Math.max(G.shakeA, a * G.u); },
    flash(c = "#fff", t = 0.25) { G.flashC = c; G.flashT = t; },
    onTop: [], // the hub's little overlays
  };
  let coinFrac = 0;
  function earn(v) { save.pts += v; save.total += v; G.earned += v; onEarn && onEarn(v); checkGoal(); changed(); }
  let changeT = 0; const changed = () => { changeT = 0.08; };
  function checkGoal() { while (save.ms < GOALS.length && save.total >= GOALS[save.ms] * base) { const i = save.ms++; onGoal && onGoal(i, (def.win && def.win[i]) || pick(GENERIC_WIN)(def), GOAL_COINS[i]); } }
  function resize() { const r = canvas.getBoundingClientRect(), dpr = Math.min(2, window.devicePixelRatio || 1); canvas.width = Math.max(10, Math.round(r.width * dpr)); canvas.height = Math.max(10, Math.round(r.height * dpr)); G.W = r.width; G.H = r.height; G.u = Math.min(G.W, G.H) / 100; G.cx = G.W / 2; G.cy = G.H / 2; G.dpr = dpr; def.resize && def.resize(G); }
  resize(); const ro = new ResizeObserver(resize); ro.observe(canvas);
  def.init && def.init(G);
  const pos = (e) => { const r = canvas.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; };
  const onDown = (e) => { e.preventDefault(); try { canvas.setPointerCapture(e.pointerId); } catch {} const [x, y] = pos(e); G.down = true; G.px = x; G.py = y; G.taps++; try { def.down ? def.down(G, x, y) : G.add(1, x, y); } catch (err) { console.error(err); } changed(); };
  const onMove = (e) => { const [x, y] = pos(e); const ox = G.px, oy = G.py; G.px = x; G.py = y; if (def.move) try { def.move(G, x, y, ox, oy); } catch (err) { console.error(err); } };
  const onUp = (e) => { const [x, y] = pos(e); if (!G.down) return; G.down = false; if (def.up) try { def.up(G, x, y); } catch (err) { console.error(err); } };
  canvas.addEventListener("pointerdown", onDown); canvas.addEventListener("pointermove", onMove); canvas.addEventListener("pointerup", onUp); canvas.addEventListener("pointercancel", onUp);
  let autoAcc = 0, autoTick = 0, raf = 0, last = performance.now(), alive = true;
  function frame(now) {
    if (!alive) return; raf = requestAnimationFrame(frame); const dt = Math.min(0.05, (now - last) / 1000); last = now; G.t += dt; G.dt = dt;
    // helpers earn by themselves
    const ar = G.autoRate; if (ar > 0) { autoAcc += ar * dt; autoTick += dt; if (autoTick >= 1) { autoTick = 0; const v = autoAcc; autoAcc = 0; save.pts += v; save.total += v; G.earned += v; onEarn && onEarn(v); checkGoal(); changed(); const hx = helperX(Math.floor(rnd(0, Math.min(8, lvl("auto"))))); G.float(`+${fmt(Math.max(1, v))}`, hx, G.H - G.u * 12, "#bff7c8", 0.8); try { def.autoTick && def.autoTick(G); } catch (err) { console.error(err); } } }
    try { def.update && def.update(G, dt); } catch (err) { console.error(err); }
    for (let i = G.parts.length - 1; i >= 0; i--) { const p = G.parts[i]; p.life -= dt; p.vy += G.u * 140 * dt * p.grav; p.x += p.vx * dt; p.y += p.vy * dt; p.rot += (p.vr || 0) * dt; if (p.life <= 0) G.parts.splice(i, 1); }
    if (G.parts.length > 260) G.parts.splice(0, G.parts.length - 260);
    for (let i = G.floats.length - 1; i >= 0; i--) { const f = G.floats[i]; f.t -= dt * 0.9; f.y -= G.u * 14 * dt; if (f.t <= 0) G.floats.splice(i, 1); }
    for (let i = G.says.length - 1; i >= 0; i--) { G.says[i].t -= dt; if (G.says[i].t <= 0) G.says.splice(i, 1); }
    if (changeT > 0 && (changeT -= dt) <= 0) onChange && onChange();
    draw(dt);
  }
  const helperX = (i) => G.W / 2 + (i - (Math.min(8, lvl("auto")) - 1) / 2) * G.u * 9;
  function draw(dt) {
    const d = G.dpr; g.setTransform(d, 0, 0, d, 0, 0);
    let sx = 0, sy = 0; if (G.shakeT > 0) { G.shakeT -= dt; sx = rnd(-1, 1) * G.shakeA; sy = rnd(-1, 1) * G.shakeA; if (G.shakeT <= 0) G.shakeA = 0; }
    const bg = def.bg || ["#fff1d6", "#ffd1a8"]; const gr = g.createLinearGradient(0, 0, 0, G.H); gr.addColorStop(0, bg[0]); gr.addColorStop(1, bg[1]); g.fillStyle = gr; g.fillRect(0, 0, G.W, G.H);
    if (!def.noDots) { g.fillStyle = "rgba(255,255,255,.22)"; const s = G.u * 9; for (let y = 0; y < G.H + s; y += s) for (let x = ((y / s) % 2) * s * 0.5; x < G.W + s; x += s) { g.beginPath(); g.arc(x, y, G.u * 1.1, 0, 7); g.fill(); } }
    g.save(); g.translate(sx, sy);
    try { def.draw && def.draw(G, g); } catch (err) { console.error(err); }
    // the helpers you've hired bounce along the bottom
    const n = Math.min(8, lvl("auto")); const hi = slots.find((s) => s[0] === "auto"); if (n && hi) for (let i = 0; i < n; i++) E(g, hi[2], helperX(i), G.H - G.u * 6 - Math.abs(Math.sin(G.t * 5 + i)) * G.u * 2.5, G.u * 7);
    for (const p of G.parts) { const a = clamp(p.life / (p.max * 0.5), 0, 1); if (p.e) E(g, p.e, p.x, p.y, p.size, p.rot, a); else { g.globalAlpha = a; g.fillStyle = p.c; g.beginPath(); g.arc(p.x, p.y, p.size, 0, 7); g.fill(); g.globalAlpha = 1; } }
    for (const s of G.says) { g.globalAlpha = clamp(s.t * 3, 0, 1); speech(g, s.text, s.x, s.y, G.u * 3.6 + 6, { maxW: Math.min(G.W * 0.6, 300) }); g.globalAlpha = 1; }
    for (const f of G.floats) { g.globalAlpha = clamp(f.t * 2, 0, 1); txt(g, f.text, f.x, f.y, (G.u * 4.5 + 8) * f.scale, f.color, { stroke: INK }); g.globalAlpha = 1; }
    g.restore();
    if (G.flashT > 0) { G.flashT -= dt; g.globalAlpha = clamp(G.flashT * 3, 0, 0.7); g.fillStyle = G.flashC; g.fillRect(0, 0, G.W, G.H); g.globalAlpha = 1; }
  }
  raf = requestAnimationFrame(frame);
  const cost = (i) => Math.round(SLOT_COST[i] * base * Math.pow(1.75, save.up[i]) * (slots[i][0] === "mult" ? 1.6 : 1));
  return {
    G, save,
    upInfo: (i) => { const [k, name, ico, desc] = slots[i]; return { kind: k, name, ico, desc: desc || KIND_DESC[k](def), lvl: save.up[i], cost: cost(i), can: save.pts >= cost(i) && save.up[i] < 30 }; },
    buy(i) { const c = cost(i); if (save.pts < c || save.up[i] >= 30) return false; save.pts -= c; save.up[i]++; SFX.buy(); G.burst(G.cx, G.cy, [slots[i][2], "✨"], 10); def.onBuy && def.onBuy(G, i); onChange && onChange(); return true; },
    goalInfo: () => { const i = save.ms; if (i >= GOALS.length) return { done: true, total: save.total }; const prev = i ? GOALS[i - 1] * base : 0, goal = GOALS[i] * base; return { i, goal, coins: GOAL_COINS[i], frac: (save.total - prev) / (goal - prev), total: save.total }; },
    // for tests & "the button does something": tap where it's most useful right now
    poke() { const h = (def.hot && def.hot(G)) || { x: G.cx, y: G.cy }; const r = canvas.getBoundingClientRect(); const ev = (type) => new PointerEvent(type, { clientX: r.left + h.x, clientY: r.top + h.y, pointerId: 77, bubbles: true }); canvas.dispatchEvent(ev("pointerdown")); canvas.dispatchEvent(ev("pointerup")); return h; },
    dispose() { alive = false; cancelAnimationFrame(raf); ro.disconnect(); canvas.removeEventListener("pointerdown", onDown); canvas.removeEventListener("pointermove", onMove); canvas.removeEventListener("pointerup", onUp); canvas.removeEventListener("pointercancel", onUp); def.dispose && def.dispose(G); },
  };
}
const GENERIC_WIN = [(d) => `WOW! ${d.name} is SO impressed. Keep going!`, (d) => `The whole town heard about your ${d.unit || "points"}!`, (d) => `Papa Pepperoni fainted from excitement. He's fine!`, (d) => `You're officially a ${d.name} legend!`];
