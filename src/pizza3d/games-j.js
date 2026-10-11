// ==========================================================================
//  Emmy's Pizza Plus — clicker games, part 10: the RAREST of the rare.
//  Cheesy Secret, Golden Crust, Diamond Dough, Royal Pepperoni, Celestial
//  and Infinity Pizza — the most sparkly games in the whole collection.
// ==========================================================================
import { E, circ, oval, rr, txt, bar, face, pizza, rnd, pick, clamp, dist, INK } from "./clicker.js";
import { SFX } from "./audio.js";

const TAU = Math.PI * 2;
const R7 = ["#ff4d5e", "#ff9f40", "#ffe14d", "#5fd36a", "#4da6ff", "#7a6bff", "#d36bff"];
const JEW = ["#ff3b5c", "#3b7bff", "#22d38a", "#a45cff", "#ffc93b"], JEWN = ["Ruby", "Sapphire", "Emerald", "Amethyst", "Topaz"];
const ease = (t) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);
const hx = (c) => [1, 3, 5].map((i) => parseInt(c.slice(i, i + 2), 16));
const mix = (a, b, t) => { const A = hx(a), B = hx(b); return `rgb(${A.map((v, i) => Math.round(v + (B[i] - v) * t)).join(",")})`; };
const shuffle = (a) => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const stars = (G, g, n = 50, speed = 4, a = 1) => { if (a <= 0) return; g.globalAlpha = a; for (let i = 0; i < n; i++) { const tw = 0.5 + Math.sin(G.t * 3 + i) * 0.5; circ(g, (i * 137.5) % G.W, (i * 71.3 + G.t * speed * (1 + (i % 3))) % G.H, G.u * (0.25 + (i % 3) * 0.2) * (0.6 + tw * 0.6), "#fff", null); } g.globalAlpha = 1; };
// a four-point twinkle ✦
function twinkle(g, x, y, r, col = "#fff", a = 1) { if (r <= 0.3 || a <= 0) return; g.save(); g.globalAlpha *= a; g.fillStyle = col; g.beginPath(); g.moveTo(x, y - r); g.quadraticCurveTo(x, y, x + r, y); g.quadraticCurveTo(x, y, x, y + r); g.quadraticCurveTo(x, y, x - r, y); g.quadraticCurveTo(x, y, x, y - r); g.fill(); g.restore(); }
// twinkles that come and go all over a band of the screen
const glitter = (G, g, n, col = "#fff", y0 = 0, y1 = 1, k = 1) => { for (let i = 0; i < n; i++) { const p = (G.t * 0.5 * k + i * 0.618) % 1, a = Math.sin(p * Math.PI); twinkle(g, (((i * 191.3) % 1000) / 1000) * G.W, G.H * (y0 + (((i * 73.7) % 100) / 100) * (y1 - y0)), G.u * (0.8 + (i % 3) * 0.5) * a, col, a); } };
function rays(G, g, x, y, n, col, a, spin, w = 6) { g.save(); g.translate(x, y); g.rotate(G.t * spin); g.globalAlpha = a; g.fillStyle = col; for (let i = 0; i < n; i++) { g.rotate(TAU / n); g.beginPath(); g.moveTo(0, 0); g.lineTo(-G.u * w, -G.H * 1.3); g.lineTo(G.u * w, -G.H * 1.3); g.fill(); } g.restore(); }
// a faceted jewel
function gem(g, x, y, r, col, rot = 0) { g.save(); g.translate(x, y); g.rotate(rot); g.lineJoin = "round";
  g.beginPath(); g.moveTo(-r * 0.6, -r * 0.55); g.lineTo(r * 0.6, -r * 0.55); g.lineTo(r, -r * 0.1); g.lineTo(0, r); g.lineTo(-r, -r * 0.1); g.closePath(); g.fillStyle = col; g.fill(); g.strokeStyle = INK; g.lineWidth = Math.max(1.5, r * 0.12); g.stroke();
  g.fillStyle = "rgba(255,255,255,.5)"; g.beginPath(); g.moveTo(-r * 0.6, -r * 0.55); g.lineTo(-r * 0.25, -r * 0.1); g.lineTo(-r, -r * 0.1); g.closePath(); g.fill();
  g.fillStyle = "rgba(255,255,255,.22)"; g.beginPath(); g.moveTo(-r * 0.25, -r * 0.1); g.lineTo(r * 0.25, -r * 0.1); g.lineTo(0, r); g.closePath(); g.fill();
  g.strokeStyle = "rgba(74,42,26,.35)"; g.lineWidth = Math.max(1, r * 0.06); g.beginPath(); g.moveTo(-r, -r * 0.1); g.lineTo(r, -r * 0.1); g.moveTo(-r * 0.25, -r * 0.1); g.lineTo(0, r); g.lineTo(r * 0.25, -r * 0.1); g.stroke(); g.restore(); }
// a cartoon chicken (or, with no comb, a pigeon)
function hen(g, x, y, R, { body = "#fffaf0", mood = "happy", flip = 1, flap = 0, tail = null, comb = "#f2483a", neck = null } = {}) {
  g.save(); g.translate(x, y); g.scale(flip, 1); g.lineJoin = "round";
  if (tail) tail.forEach((c, i) => oval(g, -R * 0.88, -R * 0.4 + i * R * (0.75 / tail.length), R * 0.4, R * 0.11, c, INK, 2, -0.85 + i * (1.3 / tail.length)));
  for (const sd of [-0.25, 0.25]) { g.strokeStyle = "#ff9a3c"; g.lineWidth = Math.max(2, R * 0.08); g.beginPath(); g.moveTo(sd * R, R * 0.75); g.lineTo(sd * R, R * 1.02); g.stroke(); }
  oval(g, 0, R * 0.15, R * 0.9, R * 0.72, body);
  if (neck) oval(g, R * 0.32, -R * 0.05, R * 0.38, R * 0.2, neck, null);
  oval(g, -R * 0.15, R * 0.2, R * 0.42, R * 0.28, body, INK, Math.max(2, R * 0.05), -0.25 - flap * 0.7);
  if (comb) for (let i = 0; i < 3; i++) circ(g, R * (0.2 + i * 0.15), -R * 0.86 - (i === 1 ? R * 0.06 : 0), R * 0.12, comb);
  circ(g, R * 0.35, -R * 0.42, R * 0.45, body);
  g.beginPath(); g.moveTo(R * 0.76, -R * 0.5); g.lineTo(R * 1.02, -R * 0.4); g.lineTo(R * 0.76, -R * 0.3); g.closePath(); g.fillStyle = comb ? "#ffb02e" : "#5a5560"; g.fill(); g.strokeStyle = INK; g.lineWidth = Math.max(1.5, R * 0.04); g.stroke();
  face(g, R * 0.36, -R * 0.42, R * 0.32, mood); g.restore();
}
// a gold crown with jewels in its 6 sockets (cols[i] = colour or null)
const crownSock = (x, y, w, i) => { const h = w * 0.62; return i < 5 ? { x: x + (i - 2) * w * 0.19, y: y + h * 0.33, r: w * 0.07 } : { x, y: y - h * 0.08, r: w * 0.1 }; };
function crown(g, x, y, w, cols = [], { ghost = null, t = 0 } = {}) { const h = w * 0.62, L = x - w / 2, R = x + w / 2, ty = y - h * 0.5, vy = y + h * 0.1; g.save(); g.lineJoin = "round";
  const gr = g.createLinearGradient(0, ty, 0, y + h * 0.5); gr.addColorStop(0, "#fff3a0"); gr.addColorStop(0.5, "#ffcf3a"); gr.addColorStop(1, "#e09a10");
  g.beginPath(); g.moveTo(L, y + h * 0.5); g.lineTo(L, ty + h * 0.15); g.lineTo(L + w * 0.125, vy); g.lineTo(L + w * 0.25, ty + h * 0.05); g.lineTo(L + w * 0.375, vy); g.lineTo(x, ty - h * 0.05); g.lineTo(L + w * 0.625, vy); g.lineTo(L + w * 0.75, ty + h * 0.05); g.lineTo(L + w * 0.875, vy); g.lineTo(R, ty + h * 0.15); g.lineTo(R, y + h * 0.5); g.closePath(); g.fillStyle = gr; g.fill(); g.strokeStyle = INK; g.lineWidth = Math.max(2, w * 0.018); g.stroke();
  rr(g, L, y + h * 0.17, w, h * 0.33, h * 0.06, "#f0b322", INK, Math.max(2, w * 0.018));
  for (const [px, py] of [[L, ty + h * 0.15], [L + w * 0.25, ty + h * 0.05], [x, ty - h * 0.05], [L + w * 0.75, ty + h * 0.05], [R, ty + h * 0.15]]) circ(g, px, py, w * 0.045, "#fffaf0", INK, Math.max(1.5, w * 0.012));
  for (let i = 0; i < 6; i++) { const p = crownSock(x, y, w, i);
    if (cols[i] != null) gem(g, p.x, p.y, p.r, cols[i], Math.sin(t * 2 + i) * 0.08);
    else { circ(g, p.x, p.y, p.r * 0.8, "rgba(120,70,0,.35)", null); if (ghost && ghost[i] != null) { g.setLineDash([w * 0.02, w * 0.02]); circ(g, p.x, p.y, p.r * (1 + Math.sin(t * 5) * 0.12), null, ghost[i], Math.max(2, w * 0.016)); g.setLineDash([]); circ(g, p.x, p.y, p.r * 0.4, ghost[i], null); } } }
  g.restore();
}

export const GAMES_J = [
  // ------------------------------------------------------------------------
  //  CHEESY SECRET
  // ------------------------------------------------------------------------
  {
    id: "rainbowchicken", name: "The Rainbow Chicken", rar: "secret", ico: "🐔", unit: "rainbow eggs", base: 12, bg: ["#fff0fb", "#d8f1ff"],
    blurb: "A magic chicken lays eggs in every colour of the rainbow! Tap her for an egg, then tap the eggs to collect them. Get all 7 colours for a RAINBOW PARADE!",
    ups: [["tap", "Rainbow Corn", "🌽"], ["auto", "Sparkle Rooster", "🐓"], ["crit", "Lucky Feather", "🪶"]],
    win: ["BAWK! A rainbow egg! The magic is real!", "The Rainbow Chicken did a twirl just for you.", "Every egg is a different colour. Even the Tuesday ones.", "A real rainbow came down to say hello!", "The chicks are learning their colours. They love purple.", "Rainbow parades are now a Pizza Town holiday!", "Unicorns are asking the chicken for colouring tips.", "The Rainbow Chicken made you a crown of feathers.", "Supreme Keeper of the Rainbow Coop! BAWK!"],
    init(G) { Object.assign(G.s, { eggs: [], shelf: [0, 0, 0, 0, 0, 0, 0], cluck: 0, parade: 0, parades: 0, marchers: [], chicks: [], mt: 0, mk: 0 }); },
    hen(G) { return { x: G.cx, y: G.H * 0.45 + Math.sin(G.t * 2) * G.u, r: Math.min(G.W * 0.16, G.u * 15) }; },
    slot(G, i) { const sw = Math.min(G.W * 0.12, G.u * 10); return { x: G.cx + (i - 3) * sw, y: G.u * 17 }; },
    lay(G) { const s = G.s; if (s.eggs.filter((e) => !e.fly).length >= 6) return false; const miss = R7.map((_, i) => i).filter((i) => !s.shelf[i]), c = miss.length && Math.random() < 0.65 ? pick(miss) : Math.floor(rnd(0, 7)), h = this.hen(G);
      let tx, tries = 0; do { tx = rnd(0.1, 0.9) * G.W; } while (tries++ < 12 && s.eggs.some((e) => Math.abs(e.tx - tx) < G.u * 9));
      s.eggs.push({ c, x: h.x, y: h.y, sx: h.x, sy: h.y, tx, ty: G.H * rnd(0.7, 0.79), t: 0, fly: 0 }); G.tone(600 + c * 80, 0.12, { type: "triangle", vol: 0.1, slideTo: 900 + c * 80 }); return true; },
    collect(G, e) { const s = G.s;
      if (s.shelf[e.c] || s.eggs.some((q) => q !== e && q.fly && q.c === e.c)) { s.eggs.splice(s.eggs.indexOf(e), 1); s.chicks.push({ c: e.c, x: e.x, dir: Math.random() < 0.5 ? -1 : 1, ph: rnd(0, 6) }); if (s.chicks.length > 8) s.chicks.shift();
        G.add(3, e.x, e.y, { color: R7[e.c] }); G.burst(e.x, e.y, ["🐣", "✨"], 4); SFX.peep(); return; }
      e.fly = 0.01; e.fx = e.x; e.fy = e.y; SFX.pop(1 + e.c * 0.08); },
    startParade(G) { const s = G.s; s.parade = 8; s.parades++; s.mk = 0; G.add(70, G.cx, G.H * 0.3, { color: "#ffd23f", noCrit: true }); SFX.wow(); G.flash("#ffffff"); G.float("🌈 RAINBOW PARADE! 🌈", G.cx, G.u * 26, "#ff5d8f", 1.4);
      s.marchers = R7.map((c, i) => ({ c, x: -G.u * 12 - i * G.u * 15, hi: 0, ph: i })); G.burst(G.cx, G.H * 0.3, ["🌈", "✨", "💖"], 20, { speed: 1.3 }); },
    down(G, x, y) { const s = G.s, h = this.hen(G);
      if (s.parade > 0) for (const m of s.marchers) if (dist(x, y, m.x, G.H * 0.62) < G.u * 9) { m.hi = 0.5; G.add(6, m.x, G.H * 0.55, { color: m.c }); SFX.giggle(); G.burst(m.x, G.H * 0.55, ["💖", "🙌"], 3, { size: 0.7 }); return; }
      for (const e of s.eggs) if (!e.fly && e.t >= 1 && dist(x, y, e.x, e.y) < G.u * 8) { this.collect(G, e); return; }
      for (const c of s.chicks) if (dist(x, y, c.x, G.H * 0.86) < G.u * 6) { G.add(1, x, y); SFX.peep(); G.burst(c.x, G.H * 0.84, "💛", 2, { size: 0.6 }); return; }
      if (dist(x, y, h.x, h.y) < h.r * 1.3) { s.cluck = 0.4; G.add(1, x, y, { color: pick(R7) }); SFX.bawk(); G.dots(x, y, R7, 6); if (!this.lay(G)) G.say("So many eggs! Collect them first!", h.x, h.y - h.r * 1.4, 1.4); return; }
      SFX.boop(); G.dots(x, y, R7, 4); },
    update(G, dt) { const s = G.s; s.cluck = Math.max(0, s.cluck - dt);
      for (let i = s.eggs.length - 1; i >= 0; i--) { const e = s.eggs[i];
        if (e.fly) { const p = this.slot(G, e.c); e.fly = Math.min(1, e.fly + dt * 2.2); const f = ease(e.fly); e.x = e.fx + (p.x - e.fx) * f; e.y = e.fy + (p.y - e.fy) * f - Math.sin(e.fly * Math.PI) * G.u * 12;
          if (e.fly >= 1) { s.eggs.splice(i, 1); s.shelf[e.c] = 1; G.add(10, p.x, p.y + G.u * 6, { color: R7[e.c] }); SFX.note(e.c * 2); G.dots(p.x, p.y, [R7[e.c], "#fff"], 10); if (s.shelf.every(Boolean) && s.parade <= 0) this.startParade(G); } continue; }
        if (e.t < 1) { e.t = Math.min(1, e.t + dt * 1.8); e.x = e.sx + (e.tx - e.sx) * e.t; e.y = e.sy + (e.ty - e.sy) * e.t - Math.sin(e.t * Math.PI) * G.u * 14; } }
      for (const c of s.chicks) { c.ph += dt * 8; c.x += c.dir * G.u * 7 * dt; if (c.x < G.u * 5) c.dir = 1; if (c.x > G.W - G.u * 5) c.dir = -1; }
      if (s.parade > 0) { s.parade -= dt; const sp = (G.W + G.u * 120) / 7.5; for (const m of s.marchers) { m.x += sp * dt; m.hi = Math.max(0, m.hi - dt); m.ph += dt * 9; if (Math.random() < 0.3) G.parts.push({ x: m.x - G.u * 6, y: G.H * 0.64, vx: -G.u * 4, vy: -G.u * 6, life: 0.8, max: 0.8, c: m.c, size: G.u * 1.3, grav: 0.1 }); }
        if ((s.mt -= dt) <= 0) { s.mt = 0.22; SFX.note([0, 4, 7, 12, 7, 4, 5, 9, 12, 9, 7, 4][s.mk++ % 12]); }
        if (s.parade <= 0) { s.shelf = [0, 0, 0, 0, 0, 0, 0]; s.marchers = []; G.float("Collect a new rainbow!", G.cx, G.u * 26, "#7a6bff", 1); } } },
    autoTick(G) { const e = G.s.eggs.find((e) => !e.fly && e.t >= 1); if (e) this.collect(G, e); else this.lay(G); },
    draw(G, g) { const s = G.s, h = this.hen(G), par = s.parade > 0, Rb = Math.min(G.W * 0.46, G.H * 0.44), bw = Rb * 0.065, ay = G.H * 0.66;
      g.lineCap = "butt"; for (let i = 0; i < 7; i++) { g.beginPath(); g.arc(G.cx, ay, Rb - i * bw, Math.PI, 0); g.strokeStyle = R7[par ? (i + Math.floor(G.t * 8)) % 7 : i]; g.lineWidth = bw + 1; g.globalAlpha = par || s.shelf[i] ? 0.9 : 0.16; g.stroke(); } g.globalAlpha = 1;
      for (const sd of [-1, 1]) for (const [dx, dy, r] of [[-1, 0, 0.7], [0, -0.4, 1], [1, 0, 0.75]]) circ(g, G.cx + sd * (Rb - bw * 3) + dx * G.u * 5, ay + dy * G.u * 4, G.u * 5 * r, "#fff", null);
      oval(g, G.cx, G.H * 1.05, G.W * 0.75, G.H * 0.35, "#9fe08a", INK, 3);
      glitter(G, g, 18, "#fff", 0.25, 0.65);
      g.save(); g.translate(h.x, h.y); g.rotate(G.t * 0.6); for (let i = 0; i < 7; i++) { g.rotate(TAU / 7); twinkle(g, h.r * 1.35, 0, G.u * (1.2 + Math.sin(G.t * 4 + i) * 0.6), R7[i]); } g.restore();
      hen(g, h.x, h.y, h.r, { mood: s.cluck > 0 ? "wow" : par ? "joy" : "happy", tail: R7, flap: s.cluck > 0 ? Math.sin(G.t * 40) * 0.5 + 0.5 : 0, comb: "#ff5d8f" });
      for (let i = 0; i < 7; i++) { const p = this.slot(G, i), got = s.shelf[i]; circ(g, p.x, p.y + G.u * 4.5, G.u * 3.5, "rgba(255,255,255,.7)", "rgba(74,42,26,.4)", 2);
        if (got) { oval(g, p.x, p.y, G.u * 3, G.u * 4, R7[i]); circ(g, p.x - G.u, p.y - G.u * 1.5, G.u * 0.8, "rgba(255,255,255,.9)", null); twinkle(g, p.x + G.u * 3, p.y - G.u * 3, G.u * 1.5 * (0.6 + Math.sin(G.t * 5 + i) * 0.4)); }
        else { g.setLineDash([4, 4]); oval(g, p.x, p.y, G.u * 3, G.u * 4, null, R7[i], 3); g.setLineDash([]); } }
      for (const e of s.eggs) { const w = e.fly ? 0 : Math.sin(G.t * 5 + e.tx) * 0.12; oval(g, e.x, e.y, G.u * 3.4, G.u * 4.4, R7[e.c], INK, 3, w);
        g.save(); g.translate(e.x, e.y); g.rotate(w); g.strokeStyle = "rgba(255,255,255,.85)"; g.lineWidth = G.u * 0.7; g.beginPath(); for (let k = 0; k <= 6; k++) g.lineTo(-G.u * 3 + k * G.u, (k % 2 ? -1 : 1) * G.u * 0.6); g.stroke(); g.restore();
        circ(g, e.x - G.u * 1.2, e.y - G.u * 2, G.u * 0.8, "rgba(255,255,255,.9)", null); }
      for (const c of s.chicks) { E(g, "🐤", c.x, G.H * 0.86 - Math.abs(Math.sin(c.ph)) * G.u * 2, G.u * 6, 0, 1, -c.dir, 1); circ(g, c.x, G.H * 0.86 - G.u * 4, G.u * 1, R7[c.c], null); }
      for (const m of s.marchers) { const y = G.H * 0.62 - Math.abs(Math.sin(m.ph)) * G.u * 2.5 - m.hi * G.u * 6; if (m.x < -G.u * 15 || m.x > G.W + G.u * 15) continue; hen(g, m.x, y, G.u * 7, { body: mix(m.c, "#ffffff", 0.35), mood: "joy", flap: Math.abs(Math.sin(m.ph)) }); E(g, "🎵", m.x, y - G.u * 12, G.u * 4, Math.sin(m.ph) * 0.3); }
      txt(g, par ? `🌈 RAINBOW PARADE! High-five the chickens!` : `🥚 Rainbow eggs: ${s.shelf.filter(Boolean).length}/7 · parades: ${s.parades}`, G.cx, G.u * 6, G.u * 3.6, "#fff", { stroke: INK }); },
    hot(G) { const s = G.s; if (s.parade > 0) { const m = s.marchers.find((m) => m.x > G.W * 0.1 && m.x < G.W * 0.9); if (m) return { x: m.x, y: G.H * 0.62 }; } const e = s.eggs.find((e) => !e.fly && e.t >= 1); return e ? { x: e.x, y: e.y } : this.hen(G); },
  },

  // ------------------------------------------------------------------------
  //  GOLDEN CRUST
  // ------------------------------------------------------------------------
  {
    id: "treasure", name: "King Crust's Treasure Vault", rar: "golden", ico: "👑", unit: "treasures", base: 16, bg: ["#3a2a5a", "#1e1636"], noDots: true,
    blurb: "Jolly King Crust has a treasure chest with a golden lock! Tap the dials to match his secret code, then grab the golden toppings that float out!",
    ups: [["tap", "Golden Key", "🔑"], ["auto", "Locksmith Mice", "🐭"], ["mult", "Bigger Vault", "🏰"]],
    win: ["Ho ho ho! You found the first treasure!", "King Crust gave you a golden high-five!", "The vault is shinier than the sun!", "King Crust let you try on his crown. It's a bit big!", "Golden pepperoni for everyone in the kingdom!", "The royal mice are throwing a cheese party for you.", "King Crust built a new vault. It's full already!", "You're now Royal Keeper of the Golden Keys!", "Golden Crust Treasure Champion! Ho ho HOORAY!"],
    SYM: ["🍕", "🧀", "🍄", "🍅", "🫑", "🫒"], LOOT: ["🧀", "🍄", "🍅", "🫒", "🍕", "🪙", "💎", "🫑"],
    CHEER: ["Ho ho ho! Hooray!", "Splendid! Marvellous!", "What a clever treasure finder!", "Golden toppings for everyone!", "Huzzah! You did it!"],
    init(G) { Object.assign(G.s, { dial: [0, 0, 0], roll: [0, 0, 0], code: [1, 2, 3], open: 0, lid: 0, loot: [], vaults: 0, cheer: 0, found: 0 }); this.newCode(G); },
    newCode(G) { const s = G.s; do { s.code = [0, 1, 2].map(() => Math.floor(rnd(0, this.SYM.length))); } while (s.code.filter((c, i) => c === s.dial[i]).length > 1); },
    chest(G) { const w = Math.min(G.W * 0.56, G.u * 56), h = w * 0.52; return { x: G.cx, y: G.H * 0.62, w, h }; },
    dialP(G, i) { const c = this.chest(G); return { x: c.x + (i - 1) * c.w * 0.27, y: c.y + c.h * 0.05, r: c.w * 0.1 }; },
    king(G) { const r = Math.min(G.W * 0.1, G.u * 10); return { x: Math.max(r * 1.4, G.W * 0.16), y: G.H * (G.W < G.H ? 0.3 : 0.36), r }; },
    spin(G, i) { const s = G.s, p = this.dialP(G, i); s.dial[i] = (s.dial[i] + 1) % this.SYM.length; s.roll[i] = 1; G.add(1, p.x, p.y - p.r); G.tone(900 + i * 150, 0.05, { type: "square", vol: 0.06 });
      if (s.dial[i] === s.code[i]) { G.dots(p.x, p.y, ["#ffd23f", "#fff"], 6); SFX.ding(); }
      if (s.dial.every((d, k) => d === s.code[k])) this.unlock(G); },
    unlock(G) { const s = G.s, c = this.chest(G), k = this.king(G); s.open = 7; s.vaults++; s.cheer = 2.2; G.add(40, c.x, c.y - c.h, { color: "#ffd23f", noCrit: true }); SFX.wow(); G.flash("#fff3b0"); G.say(pick(this.CHEER), k.x, k.y - k.r * 1.6, 2);
      G.burst(c.x, c.y - c.h * 0.5, ["🪙", "✨"], 14, { speed: 1.2 }); const n = 6; s.loot = Array.from({ length: n }, (_, i) => ({ e: pick(this.LOOT), sx: c.x + rnd(-0.2, 0.2) * c.w, sy: c.y - c.h * 0.45, tx: c.x + (i - (n - 1) / 2) * Math.min(c.w * 0.24, G.W * 0.15), ty: c.y - c.h * 0.5 - G.u * (13 + (i % 2) * 9), t: -i * 0.1, got: 0 })); },
    down(G, x, y) { const s = G.s, k = this.king(G), c = this.chest(G);
      for (const l of s.loot) if (!l.got && l.t >= 1 && dist(x, y, l.tx, l.ty) < G.u * 8) { l.got = 0.5; s.found++; G.add(8, l.tx, l.ty, { color: "#ffd23f" }); SFX.coin(); G.dots(l.tx, l.ty, ["#ffd23f", "#fff3a0"], 8); return; }
      if (dist(x, y, k.x, k.y) < k.r * 1.4) { s.cheer = 0.8; G.add(1, x, y); SFX.giggle(); G.say(s.open > 0 ? "Grab the golden toppings!" : "Ho ho! Match my secret code!", k.x, k.y - k.r * 1.6, 1.4); return; }
      if (s.open <= 0) for (let i = 0; i < 3; i++) { const p = this.dialP(G, i); if (dist(x, y, p.x, p.y) < p.r * 1.35) { this.spin(G, i); return; } }
      if (Math.abs(x - c.x) < c.w / 2 && Math.abs(y - c.y) < c.h) { G.add(1, x, y, { color: "#ffd23f" }); SFX.coin(); G.burst(x, y, "✨", 2, { size: 0.6 }); return; }
      SFX.boop(); },
    update(G, dt) { const s = G.s; s.cheer = Math.max(0, s.cheer - dt); for (let i = 0; i < 3; i++) s.roll[i] = Math.max(0, s.roll[i] - dt * 6);
      s.lid += ((s.open > 0 ? 1 : 0) - s.lid) * Math.min(1, dt * 6);
      for (const l of s.loot) { if (l.t < 1) l.t = Math.min(1, l.t + dt * 1.6); if (l.got) l.got = Math.max(0.001, l.got - dt); }
      if (s.open > 0) { const left = s.loot.filter((l) => !l.got).length; s.open -= dt * (left ? 1 : 4); if (s.open <= 0) { s.open = 0; s.loot = []; this.newCode(G); G.float("A new secret code!", G.cx, G.u * 24, "#ffd23f", 1); } } },
    autoTick(G) { const s = G.s; if (s.open > 0) { const l = s.loot.find((l) => !l.got && l.t >= 1); if (l) { l.got = 0.5; s.found++; G.add(8, l.tx, l.ty, { color: "#ffd23f" }); SFX.coin(); } return; } const i = s.dial.findIndex((d, k) => d !== s.code[k]); if (i >= 0) this.spin(G, i); },
    draw(G, g) { const s = G.s, c = this.chest(G), k = this.king(G), op = s.lid;
      g.strokeStyle = "rgba(255,255,255,.06)"; g.lineWidth = 2; const bh = G.u * 7; for (let y = 0; y < G.H; y += bh) { g.beginPath(); g.moveTo(0, y); g.lineTo(G.W, y); g.stroke(); for (let x = ((y / bh) % 2) * bh; x < G.W; x += bh * 2) { g.beginPath(); g.moveTo(x, y); g.lineTo(x, y + bh); g.stroke(); } }
      glitter(G, g, 24, "#ffd23f", 0.05, 0.95, 0.7);
      for (const sd of [-1, 1]) for (let i = 0; i < 9; i++) { const px = G.cx + sd * (G.W * 0.5 - G.u * (4 + (i % 3) * 7)), py = G.H - G.u * (3 + Math.floor(i / 3) * 3.4) - G.u * 9; oval(g, px, py, G.u * 4, G.u * 1.6, "#ffcf3a", "#a06c00", 2); }
      if (op > 0.05) { rays(G, g, c.x, c.y - c.h * 0.45, 12, "#fff3a0", op * 0.25, 0.4, 5); const gl = g.createRadialGradient(c.x, c.y - c.h * 0.5, 0, c.x, c.y - c.h * 0.5, c.w * 0.7); gl.addColorStop(0, `rgba(255,230,120,${0.7 * op})`); gl.addColorStop(1, "rgba(255,230,120,0)"); g.fillStyle = gl; g.fillRect(c.x - c.w, c.y - c.h * 1.5, c.w * 2, c.h * 2); }
      // chest body
      const top = c.y - c.h * 0.45; if (op > 0.05) oval(g, c.x, top, c.w * 0.48, c.h * 0.12 * op, "#3a1a0a", null);
      if (op > 0.05) for (let i = 0; i < 7; i++) circ(g, c.x + (i - 3) * c.w * 0.12, top - c.h * 0.04 * op, c.w * 0.045, "#ffcf3a", "#a06c00", 2);
      rr(g, c.x - c.w / 2, top, c.w, c.h * 0.9, c.w * 0.05, "#a8602c", INK, 4);
      for (const fx of [-0.42, 0.42]) rr(g, c.x + fx * c.w - c.w * 0.04, top, c.w * 0.08, c.h * 0.9, c.w * 0.02, "#ffcf3a", INK, 3);
      rr(g, c.x - c.w * 0.38, c.y + c.h * 0.05 - c.w * 0.14, c.w * 0.76, c.w * 0.28, c.w * 0.05, "#ffd84a", INK, 3);
      // lid
      g.save(); g.translate(c.x, top); g.translate(0, -op * c.h * 0.35); g.rotate(-op * 0.12); const lh = c.h * 0.42;
      g.beginPath(); g.moveTo(-c.w / 2, 0); g.lineTo(-c.w / 2, -lh * 0.45); g.quadraticCurveTo(0, -lh * 1.35, c.w / 2, -lh * 0.45); g.lineTo(c.w / 2, 0); g.closePath(); g.fillStyle = "#b86d34"; g.fill(); g.strokeStyle = INK; g.lineWidth = 4; g.stroke();
      for (const fx of [-0.42, 0.42]) rr(g, fx * c.w - c.w * 0.04, -lh * 0.62, c.w * 0.08, lh * 0.62, c.w * 0.02, "#ffcf3a", INK, 3);
      E(g, "👑", 0, -lh * 0.62, lh * 0.55); g.restore();
      // dials
      for (let i = 0; i < 3; i++) { const p = this.dialP(G, i), ok = s.dial[i] === s.code[i]; circ(g, p.x, p.y, p.r * 1.15, ok ? "#7cffb0" : "#ffcf3a", INK, 3); circ(g, p.x, p.y, p.r * 0.92, "#fffaf0", INK, 2);
        g.save(); g.beginPath(); g.arc(p.x, p.y, p.r * 0.9, 0, TAU); g.clip(); const o = s.roll[i] * p.r * 1.6; E(g, this.SYM[s.dial[i]], p.x, p.y + o, p.r * 1.2); if (o > 0) E(g, this.SYM[(s.dial[i] + this.SYM.length - 1) % this.SYM.length], p.x, p.y + o - p.r * 1.6, p.r * 1.2); g.restore();
        for (let t = 0; t < 8; t++) { const a = t / 8 * TAU + s.dial[i] * 0.5; circ(g, p.x + Math.cos(a) * p.r * 1.03, p.y + Math.sin(a) * p.r * 1.03, p.r * 0.06, "#a06c00", null); }
        if (ok) twinkle(g, p.x + p.r, p.y - p.r, p.r * 0.4 * (0.7 + Math.sin(G.t * 6 + i) * 0.3)); }
      // golden toppings
      for (const l of s.loot) { if (l.t <= 0) continue; const f = ease(clamp(l.t, 0, 1)), x = l.sx + (l.tx - l.sx) * f, y = l.sy + (l.ty - l.sy) * f + Math.sin(G.t * 3 + l.tx) * G.u * (l.t >= 1 ? 1 : 0); g.save(); if (l.got) { g.globalAlpha = l.got / 0.5; g.translate(0, -(0.5 - l.got) * G.u * 30); }
        const gl = g.createRadialGradient(x, y, 0, x, y, G.u * 7); gl.addColorStop(0, "rgba(255,220,80,.9)"); gl.addColorStop(1, "rgba(255,220,80,0)"); g.fillStyle = gl; g.beginPath(); g.arc(x, y, G.u * 7, 0, TAU); g.fill();
        E(g, l.e, x, y, G.u * 7); twinkle(g, x + G.u * 3.5, y - G.u * 3.5, G.u * 1.6 * (0.6 + Math.sin(G.t * 6 + l.tx) * 0.4)); g.restore(); }
      // King Crust
      const ch = s.cheer > 0, by = ch ? -Math.abs(Math.sin(G.t * 10)) * G.u * 2 : 0;
      g.save(); g.translate(k.x, k.y + by);
      if (ch) for (const sd of [-1, 1]) { g.strokeStyle = INK; g.lineWidth = k.r * 0.28; g.lineCap = "round"; g.beginPath(); g.moveTo(sd * k.r * 0.8, k.r * 1.1); g.lineTo(sd * k.r * 1.35, k.r * 0.1); g.stroke(); g.strokeStyle = "#c8203a"; g.lineWidth = k.r * 0.2; g.stroke(); circ(g, sd * k.r * 1.38, k.r * 0.02, k.r * 0.17, "#ffd9b3"); }
      oval(g, 0, k.r * 1.45, k.r * 1.05, k.r * 0.8, "#c8203a"); rr(g, -k.r * 1.05, k.r * 0.75, k.r * 2.1, k.r * 0.3, k.r * 0.15, "#fffaf0", INK, 3); for (let i = 0; i < 5; i++) circ(g, (i - 2) * k.r * 0.4, k.r * 0.9, k.r * 0.05, INK, null);
      oval(g, 0, k.r * 0.45, k.r * 0.75, k.r * 0.55, "#fffaf0"); circ(g, 0, 0, k.r * 0.8, "#ffd9b3"); oval(g, 0, k.r * 0.55, k.r * 0.55, k.r * 0.3, "#fffaf0", null);
      face(g, 0, 0, k.r * 0.6, ch ? "joy" : "happy"); E(g, "👑", 0, -k.r * 0.95, k.r * 1.1, Math.sin(G.t * 2) * 0.08); g.restore();
      // the secret code scroll
      const sw = Math.min(G.W * 0.5, G.u * 44), sx = clamp(G.W * 0.64, k.x + k.r * 1.6 + sw / 2, G.W - sw / 2 - G.u * 2), sy = G.H * 0.2, bs = sw / 4.2;
      rr(g, sx - sw / 2, sy - bs * 0.95, sw, bs * 1.9, G.u * 2, "#fff4d6", INK, 3); txt(g, "Secret code:", sx, sy - bs * 0.62, G.u * 2.8, INK);
      for (let i = 0; i < 3; i++) { const bx = sx + (i - 1) * bs * 1.15, ok = s.dial[i] === s.code[i]; rr(g, bx - bs / 2, sy - bs * 0.3, bs, bs, bs * 0.2, ok ? "#c9ffd9" : "#fffaf0", INK, 2); E(g, this.SYM[s.code[i]], bx, sy + bs * 0.2, bs * 0.75); }
      txt(g, `💰 Vaults opened: ${s.vaults} · golden toppings: ${s.found}`, G.cx, G.u * 5, G.u * 3.4, "#fff", { stroke: INK });
      if (s.open > 0) txt(g, "✨ Tap the golden toppings! ✨", c.x, c.y + c.h * 0.7, G.u * 3.6, "#ffd23f", { stroke: INK }); },
    hot(G) { const s = G.s, l = s.loot.find((l) => !l.got && l.t >= 1); if (l) return { x: l.tx, y: l.ty }; if (s.open > 0) return this.king(G); const i = s.dial.findIndex((d, k) => d !== s.code[k]); return this.dialP(G, Math.max(0, i)); },
  },

  // ------------------------------------------------------------------------
  //  DIAMOND DOUGH
  // ------------------------------------------------------------------------
  {
    id: "icepalace", name: "Diamond Ice Palace", rar: "diamond", ico: "🧊", unit: "ice chips", base: 18, bg: ["#e8f8ff", "#a9dcf5"],
    blurb: "The penguins need your help carving sparkly ice sculptures! Tap the ice block to chip away the extra ice and find the shape hiding inside.",
    ups: [["tap", "Crystal Chisel", "⛏️"], ["auto", "Penguin Carvers", "🐧"], ["crit", "Frosty Sparkle", "❄️"]],
    win: ["Your first ice sculpture! It's so shiny!", "The penguins did a happy waddle dance!", "The Ice Palace has a brand new gallery!", "A snowy owl flew in just to see your art.", "Your ice pizza is the coolest pizza ever. Literally!", "The penguins made you an honorary penguin!", "People come from far away to see the Ice Palace.", "The Snow Queen asked for carving lessons!", "Grand Master of the Diamond Ice Palace!"],
    SCULPT: [["🍕", "Pizza Slice"], ["🐔", "Ice Chicken"], ["🦢", "Swan"], ["🐧", "Penguin Pal"], ["🏰", "Ice Castle"], ["🐳", "Whale"], ["🦋", "Butterfly"], ["🍦", "Ice Cream"], ["🦄", "Unicorn"]],
    N: 10,
    art(ch) { this.cache = this.cache || new Map(); let a = this.cache.get(ch); if (a) return a;
      const S = 160, N = this.N, c = document.createElement("canvas"); c.width = c.height = S; const g = c.getContext("2d", { willReadFrequently: true });
      g.font = `${S * 0.82}px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif`; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText(ch, S / 2, S / 2 + S * 0.05);
      const d = g.getImageData(0, 0, S, S).data; let mask = [];
      for (let r = 0; r < N; r++) for (let q = 0; q < N; q++) { let hit = 0; for (const [ox, oy] of [[0.5, 0.5], [0.25, 0.25], [0.75, 0.25], [0.25, 0.75], [0.75, 0.75]]) { const px = Math.floor(((q + ox) * S) / N), py = Math.floor(((r + oy) * S) / N); if (d[(py * S + px) * 4 + 3] > 80) hit++; } mask.push(hit >= 2); }
      if (mask.filter(Boolean).length < 8) { mask = mask.map((_, i) => dist(i % N, Math.floor(i / N), 4.5, 4.5) < 3.6); g.beginPath(); g.arc(S / 2, S / 2, S * 0.36, 0, TAU); g.fillStyle = "#000"; g.fill(); }
      g.globalCompositeOperation = "source-in"; const gr = g.createLinearGradient(0, 0, S, S); gr.addColorStop(0, "#ffffff"); gr.addColorStop(0.45, "#aee9ff"); gr.addColorStop(1, "#5cc4f0"); g.fillStyle = gr; g.fillRect(0, 0, S, S);
      g.globalCompositeOperation = "luminosity"; g.globalAlpha = 0.5; g.fillText(ch, S / 2, S / 2 + S * 0.05);
      a = { c, mask }; this.cache.set(ch, a); return a; },
    init(G) { Object.assign(G.s, { k: 0, cells: [], done: 0, made: 0, gallery: [], hop: [0, 0], gala: 0 }); this.fresh(G); },
    fresh(G) { const s = G.s; s.cells = this.art(this.SCULPT[s.k][0]).mask.map((m) => ({ in: m, gone: 0, vx: 0, rot: 0 })); },
    box(G) { const B = Math.min(G.W * 0.6, G.H * 0.48, G.u * 62); return { B, x0: G.cx - B / 2, y0: G.H * 0.53 - B / 2, cs: B / this.N }; },
    cellP(G, i) { const b = this.box(G); return { x: b.x0 + ((i % this.N) + 0.5) * b.cs, y: b.y0 + (Math.floor(i / this.N) + 0.5) * b.cs }; },
    peng(G, i) { const b = this.box(G), r = Math.min(G.u * 6, G.W * 0.06); return { x: i ? b.x0 + b.B + r * 1.6 : b.x0 - r * 1.6, y: b.y0 + b.B - r, r }; },
    chip(G, x, y, n) { const s = G.s; if (s.done > 0) return; const left = s.cells.map((c, i) => i).filter((i) => !s.cells[i].in && !s.cells[i].gone);
      left.sort((a, b) => { const A = this.cellP(G, a), B = this.cellP(G, b); return dist(x, y, A.x, A.y) - dist(x, y, B.x, B.y); });
      for (const i of left.slice(0, n)) { const c = s.cells[i], p = this.cellP(G, i); c.gone = 0.001; c.vx = (p.x - G.cx) * 0.8 + rnd(-1, 1) * G.u * 10; c.rot = rnd(-4, 4); G.dots(p.x, p.y, ["#ffffff", "#bfeeff", "#8fd8ff"], 4); }
      if (left.length <= n) this.finish(G); },
    finish(G) { const s = G.s, b = this.box(G), [ch, name] = this.SCULPT[s.k]; s.done = 2.8; s.made++; s.gallery.push(ch); if (s.gallery.length > 7) s.gallery.shift(); s.hop = [1, 1];
      G.add(50, G.cx, b.y0, { color: "#bfeeff", noCrit: true }); SFX.wow(); G.flash("#ffffff"); G.float(`❄️ ${name}! ❄️`, G.cx, b.y0 - G.u * 4, "#ffffff", 1.3); G.burst(G.cx, G.H * 0.5, ["❄️", "✨", "💎"], 22, { speed: 1.3 });
      if (s.made % 3 === 0) { s.gala = 4; G.float("🎉 ICE GALA! The penguins are dancing!", G.cx, G.u * 24, "#3b7bff", 1.1); } },
    down(G, x, y) { const s = G.s, b = this.box(G);
      for (let i = 0; i < 2; i++) { const p = this.peng(G, i); if (dist(x, y, p.x, p.y) < p.r * 1.4) { s.hop[i] = 1; G.add(1, x, y); SFX.squeak(); G.say(pick(["Flap flap! High five!", "You're a great carver!", "Ice to meet you!", "Chilly and happy!"]), p.x, p.y - p.r * 1.6, 1.3); return; } }
      if (s.done > 0) { G.add(1, x, y, { color: "#bfeeff" }); SFX.sparkle(); G.burst(x, y, "✨", 2, { size: 0.6 }); return; }
      if (x > b.x0 - G.u * 3 && x < b.x0 + b.B + G.u * 3 && y > b.y0 - G.u * 3 && y < b.y0 + b.B + G.u * 3) { this.chip(G, x, y, 3); G.add(1, x, y, { color: "#ffffff" }); SFX.scrape(); G.tone(rnd(1800, 2600), 0.08, { type: "triangle", vol: 0.06 }); s.hop[Math.random() < 0.5 ? 0 : 1] = 0.6; return; }
      SFX.boop(); G.dots(x, y, ["#fff", "#bfeeff"], 4); },
    update(G, dt) { const s = G.s; for (const c of s.cells) if (c.gone && c.gone < 1.5) c.gone += dt; s.hop = s.hop.map((h) => Math.max(0, h - dt * 2)); s.gala = Math.max(0, s.gala - dt);
      if (s.gala > 0 && Math.random() < 0.3) G.burst(rnd(0, G.W), -G.u * 2, ["❄️", "✨"], 1, { size: 0.6, grav: 0.2, speed: 0.3 });
      if (s.done > 0 && (s.done -= dt) <= 0) { s.k = (s.k + 1) % this.SCULPT.length; this.fresh(G); } },
    autoTick(G) { const s = G.s, i = s.cells.findIndex((c) => !c.in && !c.gone); if (i >= 0) { const p = this.cellP(G, i); this.chip(G, p.x, p.y, 2); s.hop[Math.floor(rnd(0, 2))] = 0.8; } },
    draw(G, g) { const s = G.s, b = this.box(G), [ch, name] = this.SCULPT[s.k], a = this.art(ch), ex = s.cells.filter((c) => !c.in), prog = ex.length ? ex.filter((c) => c.gone).length / ex.length : 1;
      // the palace behind
      g.globalAlpha = 0.45; for (let i = 0; i < 5; i++) { const tx = G.W * (0.1 + i * 0.2), tw = G.u * (8 + (i % 2) * 4), th = G.H * (0.35 + (i % 2) * 0.12); rr(g, tx - tw / 2, G.H * 0.75 - th, tw, th, G.u, "#dff6ff", "#7fc4e8", 2); g.beginPath(); g.moveTo(tx - tw * 0.65, G.H * 0.75 - th); g.lineTo(tx, G.H * 0.75 - th - tw * 1.2); g.lineTo(tx + tw * 0.65, G.H * 0.75 - th); g.closePath(); g.fillStyle = "#bfe9ff"; g.fill(); g.stroke(); } g.globalAlpha = 1;
      if (s.gala > 0) for (let i = 0; i < 5; i++) { g.globalAlpha = 0.18 * Math.min(1, s.gala); g.fillStyle = ["#7cffb0", "#6ec6ff", "#b18cff", "#ff86b3", "#ffe066"][i]; g.beginPath(); g.ellipse(G.cx + Math.sin(G.t + i) * G.W * 0.3, G.H * (0.15 + i * 0.05), G.W * 0.5, G.u * 4, Math.sin(G.t * 0.7 + i) * 0.2, 0, TAU); g.fill(); } g.globalAlpha = 1;
      for (let i = 0; i < 40; i++) circ(g, (i * 97.3 + Math.sin(G.t + i) * G.u * 3) % G.W, (i * 53.1 + G.t * G.u * (3 + (i % 4))) % G.H, G.u * (0.4 + (i % 3) * 0.25), "#fff", null);
      oval(g, G.cx, G.H * 0.95, G.W * 0.7, G.H * 0.2, "#f4fcff", "#9fd2ee", 3);
      rr(g, b.x0 - G.u * 4, b.y0 + b.B, b.B + G.u * 8, G.u * 5, G.u * 2, "#ffffff", "#7fc4e8", 3);
      // the sculpture, slowly appearing
      const pop = s.done > 0 ? 1 + Math.sin(Math.min(1, (2.8 - s.done) * 3) * Math.PI) * 0.06 : 1;
      g.save(); g.translate(G.cx, b.y0 + b.B / 2); g.scale(pop, pop); g.drawImage(a.c, -b.B / 2, -b.B / 2, b.B, b.B); g.restore();
      for (let i = 0; i < s.cells.length; i++) { const c = s.cells[i], p = this.cellP(G, i), h = b.cs / 2;
        if (c.in) { if (s.done <= 0) { g.fillStyle = `rgba(225,246,255,${0.72 * (1 - prog * 0.85)})`; g.fillRect(p.x - h, p.y - h, b.cs + 0.6, b.cs + 0.6); } else if ((i * 7 + Math.floor(G.t * 4)) % 9 === 0) twinkle(g, p.x, p.y, b.cs * 0.5); continue; }
        if (c.gone >= 1) continue; const t = c.gone, al = 1 - t;
        g.save(); g.globalAlpha = al; g.translate(p.x + c.vx * t, p.y + t * t * G.u * 90); g.rotate(c.rot * t); const gr = g.createLinearGradient(-h, -h, h, h); gr.addColorStop(0, "#f4fdff"); gr.addColorStop(1, "#b5e6fb"); rr(g, -h - 0.3, -h - 0.3, b.cs + 0.6, b.cs + 0.6, t ? b.cs * 0.2 : 1, gr, t ? "rgba(90,160,210,.6)" : null, 1); g.restore();
        if (!t && (i * 13) % 7 === 0) { g.fillStyle = "rgba(255,255,255,.75)"; g.fillRect(p.x - h * 0.6, p.y - h * 0.6, h * 0.5, h * 0.2); } }
      if (s.done <= 0) { g.strokeStyle = "rgba(90,160,210,.5)"; g.lineWidth = 2; g.strokeRect(b.x0, b.y0, b.B, b.B); }
      // penguin helpers
      for (let i = 0; i < 2; i++) { const p = this.peng(G, i), hop = Math.sin(s.hop[i] * Math.PI) * p.r * 0.8 + (s.gala > 0 ? Math.abs(Math.sin(G.t * 8 + i)) * p.r * 0.6 : 0), y = p.y - hop, R = p.r;
        oval(g, p.x, p.y + R * 1.05, R * 0.9, R * 0.2, "rgba(40,90,130,.18)", null);
        for (const sd of [-1, 1]) oval(g, p.x + sd * R * 0.85, y + R * 0.15, R * 0.22, R * 0.55, "#2c3440", INK, 2, sd * (0.4 + (s.hop[i] > 0 || s.done > 0 ? Math.sin(G.t * 20) * 0.4 : 0)));
        oval(g, p.x, y, R * 0.85, R * 1.05, "#2c3440"); oval(g, p.x, y + R * 0.15, R * 0.6, R * 0.82, "#fffaf0", null); face(g, p.x, y - R * 0.3, R * 0.45, s.done > 0 || s.hop[i] > 0 ? "joy" : "happy");
        g.beginPath(); g.moveTo(p.x - R * 0.13, y - R * 0.12); g.lineTo(p.x + R * 0.13, y - R * 0.12); g.lineTo(p.x, y + R * 0.05); g.closePath(); g.fillStyle = "#ffb02e"; g.fill();
        for (const sd of [-1, 1]) oval(g, p.x + sd * R * 0.3, y + R * 1.02, R * 0.25, R * 0.1, "#ffb02e", INK, 2); }
      // the gallery
      const gs = Math.min(G.u * 7, G.W * 0.11); for (let i = 0; i < s.gallery.length; i++) { const gx = G.cx + (i - (s.gallery.length - 1) / 2) * gs * 1.25; rr(g, gx - gs * 0.55, G.u * 10.5, gs * 1.1, gs * 1.1, G.u, "rgba(255,255,255,.6)", "rgba(90,160,210,.6)", 2); g.drawImage(this.art(s.gallery[i]).c, gx - gs / 2, G.u * 10.5 + gs * 0.05, gs, gs); }
      txt(g, `🧊 Carving: ${name} · made ${s.made}`, G.cx, G.u * 5.5, G.u * 3.6, "#fff", { stroke: INK }); },
    hot(G) { const s = G.s, i = s.cells.findIndex((c) => !c.in && !c.gone); return i >= 0 && s.done <= 0 ? this.cellP(G, i) : { x: G.cx, y: this.box(G).y0 + this.box(G).B / 2 }; },
  },
  {
    id: "gemgarden", name: "Gem Garden", rar: "diamond", ico: "💎", unit: "gems", base: 18, bg: ["#efe2ff", "#c6f2df"],
    blurb: "Plant magic gem seeds, water them, and watch them grow into glittering diamond flowers! Pick all 5 kinds of gem for a GLITTER BLOOM!",
    ups: [["tap", "Silver Watering Can", "💧"], ["auto", "Glitter Butterflies", "🦋"], ["mult", "Moonlight Soil", "🌙"]],
    win: ["Your first gem flower! It sparkles!", "The bees are wearing sunglasses now. Too shiny!", "Your garden glitters all night long.", "A rainbow stopped by to water your flowers.", "The butterflies have tiny diamond wings now!", "Your ruby roses won first prize at the flower show!", "The whole garden hums a sparkly song.", "Gardeners from everywhere want your gem seeds.", "Queen of the Glittering Gem Garden!"],
    init(G) { Object.assign(G.s, { plots: Array.from({ length: 5 }, () => ({ g: -1, grow: 0, drip: 0, rdy: 0 })), got: [0, 0, 0, 0, 0], shimmer: 0, blooms: 0, picked: 0, can: { i: 0, t: 0 } }); },
    plot(G, i) { return { x: G.W * (0.1 + 0.2 * i), y: G.H * 0.76, r: Math.min(G.W * 0.075, G.u * 8) }; },
    which(G, x, y) { if (y < G.H * 0.22 || y > G.H * 0.88) return -1; let b = -1, bd = 1e9; for (let i = 0; i < 5; i++) { const d = Math.abs(x - this.plot(G, i).x); if (d < bd) { bd = d; b = i; } } return bd < G.W * 0.1 ? b : -1; },
    act(G, i, auto = false) { const s = G.s, p = s.plots[i], q = this.plot(G, i);
      if (p.g < 0) { const miss = [0, 1, 2, 3, 4].filter((k) => !s.got[k]); p.g = miss.length && Math.random() < 0.7 ? pick(miss) : Math.floor(rnd(0, 5)); p.grow = 0.05; p.rdy = 0; G.add(1, q.x, q.y - q.r); SFX.pop(1.2); G.dots(q.x, q.y, ["#8a5a3a", JEW[p.g]], 6); return; }
      if (p.grow < 1) { p.grow = Math.min(1, p.grow + (s.shimmer > 0 ? 0.35 : 0.14)); p.drip = 0.5; s.can = { i, t: 0.6 }; G.add(1, q.x, q.y - q.r * 2); G.noise(0.25, { vol: 0.07, f0: 3000, f1: 1200, type: "bandpass", q: 2 }); if (p.grow >= 1) { SFX.sparkle(); G.burst(q.x, q.y - q.r * 3.4, "✨", 4, { size: 0.7 }); } return; }
      this.harvest(G, i); },
    harvest(G, i) { const s = G.s, p = s.plots[i], q = this.plot(G, i), top = q.y - q.r * 3.5; G.add(25, q.x, top, { color: JEW[p.g] }); SFX.coin(); G.burst(q.x, top, ["💎", "✨"], 8); G.dots(q.x, top, [JEW[p.g], "#fff"], 12); s.picked++;
      if (!s.got[p.g]) { s.got[p.g] = 1; G.float(`${JEWN[p.g]}!`, q.x, top - G.u * 6, JEW[p.g], 1); } p.g = -1; p.grow = 0;
      if (s.got.every(Boolean)) { s.got = [0, 0, 0, 0, 0]; s.shimmer = 7; s.blooms++; G.add(80, G.cx, G.H * 0.35, { color: "#ffd23f", noCrit: true }); SFX.wow(); G.flash("#fff6ff"); G.float("💎 GLITTER BLOOM! 💎", G.cx, G.u * 24, "#b06bff", 1.4); } },
    down(G, x, y) { const i = this.which(G, x, y); if (i >= 0) { this.act(G, i); return; } SFX.boop(); G.dots(x, y, JEW, 4); },
    update(G, dt) { const s = G.s; s.shimmer = Math.max(0, s.shimmer - dt); s.can.t = Math.max(0, s.can.t - dt);
      for (let i = 0; i < 5; i++) { const p = s.plots[i]; p.drip = Math.max(0, p.drip - dt); if (s.shimmer > 0) { if (p.g < 0 && Math.random() < dt * 2) this.act(G, i, true); else if (p.g >= 0 && p.grow < 1) p.grow = Math.min(1, p.grow + dt * 0.6); } }
      if (s.shimmer > 0 && Math.random() < 0.4) G.parts.push({ x: rnd(0, G.W), y: -G.u * 2, vx: 0, vy: G.u * 10, life: 1.6, max: 1.6, e: "💎", size: G.u * 3, rot: 0, vr: rnd(-3, 3), grav: 0.2 }); },
    autoTick(G) { const s = G.s, r = s.plots.findIndex((p) => p.g >= 0 && p.grow >= 1), w = s.plots.findIndex((p) => p.g >= 0 && p.grow < 1), e = s.plots.findIndex((p) => p.g < 0), i = r >= 0 ? r : w >= 0 ? w : e; if (i >= 0) { this.act(G, i, true); const q = this.plot(G, i); G.burst(q.x, q.y - q.r * 3, "🦋", 1, { size: 0.6, grav: -0.3 }); } },
    flower(G, g, x, base, r, gi, grow, rdy) { const col = JEW[gi], top = base - r * 0.3 - grow * r * 3.2, sw = Math.sin(G.t * 1.5 + x) * r * 0.15 * grow;
      g.lineCap = "round"; g.strokeStyle = INK; g.lineWidth = Math.max(3, r * 0.16); g.beginPath(); g.moveTo(x, base - r * 0.2); g.quadraticCurveTo(x - sw, (base + top) / 2, x + sw, top); g.stroke(); g.strokeStyle = "#3ccf7a"; g.lineWidth = Math.max(2, r * 0.1); g.stroke();
      if (grow > 0.25) for (const sd of [-1, 1]) gem(g, x + sd * r * 0.35, base - r * 0.3 - grow * r * 1.3, r * 0.22 * Math.min(1, grow * 2), "#2ee59d", sd * 1.1);
      if (grow < 0.5) { gem(g, x + sw, top, r * (0.18 + grow * 0.5), col); return; }
      const b = r * 0.95 * clamp((grow - 0.45) / 0.55, 0.3, 1); g.save(); g.translate(x + sw, top); g.rotate(G.t * (rdy ? 0.8 : 0.2));
      if (rdy) { const gl = g.createRadialGradient(0, 0, 0, 0, 0, b * 2); gl.addColorStop(0, "rgba(255,255,255,.8)"); gl.addColorStop(1, "rgba(255,255,255,0)"); g.fillStyle = gl; g.beginPath(); g.arc(0, 0, b * 2, 0, TAU); g.fill(); }
      for (let k = 0; k < 6; k++) { g.rotate(TAU / 6); g.beginPath(); g.moveTo(0, 0); g.lineTo(b * 0.32, -b * 0.55); g.lineTo(0, -b * 1.1); g.lineTo(-b * 0.32, -b * 0.55); g.closePath(); g.fillStyle = mix(col, "#ffffff", 0.25 + (k % 2) * 0.25); g.fill(); g.strokeStyle = INK; g.lineWidth = Math.max(1.5, b * 0.06); g.stroke(); g.beginPath(); g.moveTo(0, -b * 0.15); g.lineTo(0, -b * 0.95); g.strokeStyle = "rgba(255,255,255,.6)"; g.stroke(); }
      g.restore(); gem(g, x + sw, top, b * 0.35, "#e9fbff");
      if (rdy) for (let k = 0; k < 3; k++) { const a = G.t * 2 + k * 2.1; twinkle(g, x + sw + Math.cos(a) * b * 1.4, top + Math.sin(a) * b * 1.4, r * 0.25 * (0.6 + Math.sin(G.t * 6 + k) * 0.4)); } },
    draw(G, g) { const s = G.s, sh = s.shimmer > 0;
      for (let i = 0; i < 4; i++) { g.fillStyle = ["#d9c6ff", "#c4b0f5", "#b9e9d6", "#a5dcc4"][i]; g.beginPath(); g.moveTo(0, G.H * 0.7); for (let k = 0; k <= 8; k++) g.lineTo((k / 8) * G.W, G.H * (0.55 + i * 0.04) - (k % 2) * G.u * (6 + i * 2)); g.lineTo(G.W, G.H * 0.7); g.closePath(); g.fill(); }
      glitter(G, g, sh ? 40 : 18, "#fff", 0.05, 0.7, sh ? 2 : 1);
      g.fillStyle = "#8fdc8f"; g.fillRect(0, G.H * 0.7, G.W, G.H * 0.3); g.strokeStyle = INK; g.lineWidth = 3; g.beginPath(); g.moveTo(0, G.H * 0.7); g.lineTo(G.W, G.H * 0.7); g.stroke();
      for (let i = 0; i < 5; i++) { const q = this.plot(G, i), p = s.plots[i], rdy = p.g >= 0 && p.grow >= 1; oval(g, q.x, q.y, q.r * 1.15, q.r * 0.45, "#8a5a3a");
        if (p.g >= 0) this.flower(G, g, q.x, q.y, q.r, p.g, p.grow, rdy); else { E(g, "🌱", q.x, q.y - q.r * 0.6, q.r * 0.9, 0, 0.35); }
        if (p.g >= 0 && !rdy) bar(g, q.x - q.r, q.y + q.r * 0.7, q.r * 2, G.u * 2.4, p.grow, JEW[p.g]);
        if (p.drip > 0) for (let k = 0; k < 4; k++) { const dy = ((0.5 - p.drip) * 2 + k * 0.25) % 1; E(g, "💧", q.x + (k - 1.5) * q.r * 0.3, q.y - q.r * 4 + dy * q.r * 3.3, G.u * 2.6, 0, 1 - dy); } }
      if (s.can.t > 0) { const q = this.plot(G, s.can.i), cx = q.x + q.r * 0.9, cy = q.y - q.r * 4.6; g.save(); g.translate(cx, cy); g.rotate(-0.5); rr(g, -q.r * 0.5, -q.r * 0.35, q.r, q.r * 0.7, q.r * 0.15, "#c9d6e8", INK, 3); g.lineWidth = Math.max(3, q.r * 0.12); g.strokeStyle = INK; g.beginPath(); g.moveTo(-q.r * 0.45, 0); g.lineTo(-q.r * 1.05, -q.r * 0.3); g.stroke(); g.beginPath(); g.arc(q.r * 0.15, -q.r * 0.35, q.r * 0.3, Math.PI, 0); g.stroke(); g.restore(); }
      const bs = Math.min(G.u * 6, G.W * 0.09); for (let i = 0; i < 5; i++) { const bx = G.cx + (i - 2) * bs * 1.5, by = G.u * 15; circ(g, bx, by, bs * 0.65, "rgba(255,255,255,.6)", "rgba(74,42,26,.4)", 2); if (s.got[i]) gem(g, bx, by, bs * 0.45, JEW[i], Math.sin(G.t * 2 + i) * 0.1); else gem(g, bx, by, bs * 0.4, "rgba(140,120,160,.25)"); }
      txt(g, sh ? `💎 GLITTER BLOOM! Pick pick pick! ${Math.ceil(s.shimmer)}s` : `💎 Gems picked: ${s.picked} · find all 5 kinds!`, G.cx, G.u * 5.5, G.u * 3.6, "#fff", { stroke: INK }); },
    hot(G) { const s = G.s, r = s.plots.findIndex((p) => p.g >= 0 && p.grow >= 1), w = s.plots.findIndex((p) => p.g >= 0), i = r >= 0 ? r : w >= 0 ? w : 0, q = this.plot(G, i); return { x: q.x, y: q.y - q.r }; },
  },

  // ------------------------------------------------------------------------
  //  ROYAL PEPPERONI
  // ------------------------------------------------------------------------
  {
    id: "royalfeast", name: "The Royal Pizza Feast", rar: "royal", ico: "🤴", unit: "royal bites", base: 20, bg: ["#ffe9f0", "#f4bcd0"],
    blurb: "Dinner at the palace! The King, the Queen and the royal corgis each want a different pizza. Tap a pizza, then tap who wants it. Feed everyone for a ROYAL TOAST!",
    ups: [["tap", "Silver Platters", "🍽️"], ["auto", "Royal Butlers", "🤵"], ["mult", "Palace Oven", "🔥"]],
    win: ["The King said 'Scrumptious!' in his royal voice.", "The corgis did a happy royal wiggle!", "The Queen asked for your recipe. It's a secret!", "You've been named Royal Pizza Waiter of the Week!", "The corgis gave you a royal paw-shake.", "The palace trumpets played a song just for you!", "The King made pizza night a royal holiday!", "The Queen named you Sir or Dame Cheesealot!", "Royal Pepperoni Feast Master of the Realm!"],
    PIZ: [["Pepperoni", null], ["Mushroom", "🍄"], ["Pineapple", "🍍"], ["Cheese", "🧀"], ["Olive", "🫒"], ["Broccoli", "🥦"]],
    WHO: [{ k: "king", n: "King" }, { k: "queen", n: "Queen" }, { k: "corgi", n: "Sir Biscuit", col: "#e89a4e" }, { k: "corgi", n: "Lady Muffin", col: "#d4844a" }],
    init(G) { Object.assign(G.s, { want: [], tray: [], served: [0, 0, 0, 0], busy: [0, 0, 0, 0], eat: [0, 0, 0, 0], wave: [0, 0, 0, 0], sel: -1, fly: null, toast: 0, rounds: 0, fed: 0 }); this.round(G); },
    round(G) { const s = G.s; s.want = shuffle([0, 1, 2, 3, 4, 5]).slice(0, 4); s.tray = shuffle(s.want.slice()); s.served = [0, 0, 0, 0]; s.busy = [0, 0, 0, 0]; s.sel = -1; },
    guest(G, i) { return { x: G.W * (0.14 + 0.24 * i), y: G.H * 0.38, r: Math.min(G.W * 0.08, G.u * 8.5) }; },
    trayP(G, i) { return { x: G.W * (0.2 + 0.2 * i), y: G.H * 0.75, r: Math.min(G.W * 0.08, G.u * 7.5) }; },
    piz(g, x, y, r, p) { pizza(g, x, y, r, { peps: p === 0 ? 7 : 0 }); const e = this.PIZ[p][1]; if (e) { for (let k = 0; k < 5; k++) { const a = k * 1.26 + 0.4; E(g, e, x + Math.cos(a) * r * 0.48, y + Math.sin(a) * r * 0.48, r * 0.36); } E(g, e, x, y, r * 0.38); } },
    serve(G, j, i) { const s = G.s; s.busy[j] = 1; s.fly = { j, p: s.tray[i], from: this.trayP(G, i), t: 0 }; s.tray[i] = -1; s.sel = -1; SFX.whoosh(); },
    down(G, x, y) { const s = G.s; if (s.toast > 0) { G.add(1, x, y, { color: "#ffd23f" }); SFX.sparkle(); G.dots(x, y, ["#ffd23f", "#ff5d8f", "#6ec6ff"], 8); return; }
      for (let i = 0; i < 4; i++) { const p = this.trayP(G, i); if (s.tray[i] >= 0 && dist(x, y, p.x, p.y) < p.r * 1.2) { s.sel = s.sel === i ? -1 : i; SFX.tap(); return; } }
      for (let j = 0; j < 4; j++) { const q = this.guest(G, j); if (dist(x, y, q.x, q.y) > q.r * 1.5) continue; const nm = this.PIZ[s.want[j]][0];
        if (s.served[j] || s.busy[j]) { s.wave[j] = 0.6; G.add(1, x, y); SFX.giggle(); G.say(pick(["Thank you! Delicious!", "Yum yum yum!", "What a feast!"]), q.x, q.y - q.r * 1.4, 1.2); return; }
        if (s.sel >= 0 && s.tray[s.sel] === s.want[j]) { this.serve(G, j, s.sel); return; }
        s.wave[j] = 0.6; G.add(1, x, y); SFX.boop(); G.say(s.sel >= 0 ? `Ooh, so close! I'd love ${nm}, please!` : `Hello! I'd love ${nm} pizza, please!`, q.x, q.y - q.r * 1.4, 1.5); return; }
      s.sel = -1; SFX.boop(); },
    update(G, dt) { const s = G.s; for (let j = 0; j < 4; j++) { s.eat[j] = Math.max(0, s.eat[j] - dt); s.wave[j] = Math.max(0, s.wave[j] - dt); }
      if (s.fly) { s.fly.t += dt * 2.4; if (s.fly.t >= 1) { const j = s.fly.j, q = this.guest(G, j); s.fly = null; s.served[j] = 1; s.eat[j] = 1.6; s.fed++; G.add(18, q.x, q.y - q.r, { color: "#ffd23f" }); SFX.ding(); G.burst(q.x, q.y + q.r, ["💖", "✨"], 5, { size: 0.7 }); G.say(pick(["Yum! Perfect!", "Scrumptious!", "My favourite!", "Woof woof! Delicious!", "Splendid pizza!"]), q.x, q.y - q.r * 1.4, 1.2);
          if (s.served.every(Boolean)) { s.toast = 3.5; s.rounds++; G.add(70, G.cx, G.H * 0.2, { color: "#ffd23f", noCrit: true }); SFX.wow(); G.flash("#fff3b0"); G.float("🥂 ROYAL TOAST! Hip hip HOORAY! 🥂", G.cx, G.u * 24, "#b0174a", 1.2); } } }
      if (s.toast > 0) { s.toast -= dt; if (Math.random() < 0.5) G.dots(rnd(0, G.W), rnd(0, G.H * 0.4), ["#ffd23f", "#ff5d8f", "#6ec6ff", "#7cffb0"], 2); if (s.toast <= 0) this.round(G); } },
    autoTick(G) { const s = G.s; if (s.toast > 0 || s.fly) return; const j = [0, 1, 2, 3].find((j) => !s.served[j] && !s.busy[j]); if (j == null) return; const i = s.tray.indexOf(s.want[j]); if (i >= 0) this.serve(G, j, i); },
    drawWho(G, g, j, x, y, r) { const s = G.s, w = this.WHO[j], mood = s.toast > 0 || s.eat[j] > 0 ? "joy" : s.wave[j] > 0 ? "wow" : "happy", bob = s.eat[j] > 0 ? Math.abs(Math.sin(G.t * 14)) * r * 0.08 : s.toast > 0 ? Math.abs(Math.sin(G.t * 8 + j)) * r * 0.2 : 0; y -= bob;
      if (w.k === "corgi") { for (const sd of [-1, 1]) { g.beginPath(); g.moveTo(x + sd * r * 0.25, y - r * 0.6); g.lineTo(x + sd * r * 0.85, y - r * 1.25); g.lineTo(x + sd * r * 0.9, y - r * 0.3); g.closePath(); g.fillStyle = w.col; g.fill(); g.strokeStyle = INK; g.lineWidth = 3; g.stroke(); g.beginPath(); g.moveTo(x + sd * r * 0.4, y - r * 0.6); g.lineTo(x + sd * r * 0.78, y - r * 1.05); g.lineTo(x + sd * r * 0.8, y - r * 0.45); g.closePath(); g.fillStyle = "#ffb3c8"; g.fill(); }
        oval(g, x, y + r * 1.0, r * 0.8, r * 0.55, w.col); oval(g, x, y + r * 0.9, r * 0.38, r * 0.4, "#fffaf0", null); oval(g, x, y, r * 0.95, r * 0.82, w.col); oval(g, x, y + r * 0.3, r * 0.55, r * 0.42, "#fffaf0", null); circ(g, x, y + r * 0.12, r * 0.12, INK, null);
        face(g, x, y - r * 0.05, r * 0.6, mood, { blush: true }); E(g, "👑", x, y - r * 0.85, r * 0.6, Math.sin(G.t * 2 + j) * 0.12); return; }
      oval(g, x, y + r * 1.1, r * 0.95, r * 0.65, w.k === "king" ? "#c8203a" : "#7a3ad8"); rr(g, x - r * 0.9, y + r * 0.6, r * 1.8, r * 0.26, r * 0.13, "#fffaf0", INK, 2);
      if (w.k === "queen") { for (const sd of [-1, 1]) circ(g, x + sd * r * 0.8, y + r * 0.1, r * 0.45, "#8a4a1e"); circ(g, x, y - r * 0.45, r * 0.75, "#8a4a1e"); }
      if (w.k === "king") oval(g, x, y + r * 0.45, r * 0.7, r * 0.5, "#fffaf0");
      circ(g, x, y, r * 0.78, "#ffd9b3"); if (w.k === "king") oval(g, x, y + r * 0.55, r * 0.5, r * 0.25, "#fffaf0", null); face(g, x, y, r * 0.58, mood);
      if (w.k === "queen") { for (let k = 0; k < 7; k++) circ(g, x + (k - 3) * r * 0.2, y + r * 0.82 + Math.abs(k - 3) * -r * 0.04, r * 0.08, "#fffaf0", INK, 1.5); crown(g, x, y - r * 0.85, r * 0.9, [JEW[0], JEW[1], JEW[2], JEW[3], JEW[4], JEW[0]], { t: G.t }); }
      else E(g, "👑", x, y - r * 0.95, r * 1.05, Math.sin(G.t * 2) * 0.08); },
    draw(G, g) { const s = G.s;
      for (let i = 0; i < 4; i++) { const wx = G.W * (0.125 + i * 0.25); rr(g, wx - G.u * 6, G.H * 0.08, G.u * 12, G.H * 0.2, G.u * 6, "rgba(190,230,255,.6)", "rgba(176,23,74,.4)", 3); }
      for (let i = 0; i < 12; i++) { const fx = (i + 0.5) * G.W / 12; g.beginPath(); g.moveTo(fx - G.W / 26, G.u * 9.5); g.lineTo(fx + G.W / 26, G.u * 9.5); g.lineTo(fx, G.u * 14); g.closePath(); g.fillStyle = i % 2 ? "#ffcf3a" : "#b0174a"; g.fill(); g.strokeStyle = INK; g.lineWidth = 2; g.stroke(); }
      if (s.toast > 0) { glitter(G, g, 30, "#ffd23f", 0.1, 0.6, 2); for (const sd of [-1, 1]) E(g, "🎺", G.cx + sd * G.W * 0.42, G.H * 0.22, G.u * 9, sd * 0.3, 1, -sd, 1); }
      for (let j = 0; j < 4; j++) { const q = this.guest(G, j); this.drawWho(G, g, j, q.x, q.y, q.r); }
      // the long table
      const ty = G.H * 0.5; rr(g, G.W * 0.03, ty, G.W * 0.94, G.u * 10, G.u * 2, "#fffaf0", INK, 3); for (let i = 0; i < 20; i++) { const sx = G.W * 0.03 + (i + 0.5) * G.W * 0.94 / 20; circ(g, sx, ty + G.u * 10, G.W * 0.94 / 40, i % 2 ? "#ffcf3a" : "#b0174a", INK, 2); }
      for (let j = 0; j < 4; j++) { const q = this.guest(G, j), want = s.want[j]; oval(g, q.x, ty + G.u * 4, q.r * 0.9, q.r * 0.3, "#f2f6ff");
        if (s.served[j]) { if (s.eat[j] > 0) this.piz(g, q.x, ty + G.u * 3.5, q.r * 0.55 * (0.4 + s.eat[j] / 2.7), want); else E(g, s.toast > 0 ? "🥂" : "💖", q.x, ty + G.u * 3, q.r * 0.6); }
        else if (!s.busy[j] && s.toast <= 0) { const by = q.y - q.r * 2.05 + Math.sin(G.t * 3 + j) * G.u * 0.6, br = q.r * 0.7; circ(g, q.x - q.r * 0.35, q.y - q.r * 1.1, q.r * 0.08, "#fffaf0", INK, 2); circ(g, q.x - q.r * 0.2, q.y - q.r * 1.25, q.r * 0.12, "#fffaf0", INK, 2); circ(g, q.x, by, br, s.sel >= 0 && s.tray[s.sel] === want ? "#fff3a0" : "#fffaf0", INK, 3); this.piz(g, q.x, by, br * 0.72, want); } }
      if (s.fly) { const f = ease(Math.min(1, s.fly.t)), q = this.guest(G, s.fly.j), x = s.fly.from.x + (q.x - s.fly.from.x) * f, y = s.fly.from.y + (ty + G.u * 3.5 - s.fly.from.y) * f - Math.sin(f * Math.PI) * G.u * 14; this.piz(g, x, y, s.fly.from.r * (1 - f * 0.4), s.fly.p); }
      // the serving tray
      rr(g, G.W * 0.06, G.H * 0.66, G.W * 0.88, G.H * 0.18, G.u * 4, "#d9dfee", INK, 3);
      for (let i = 0; i < 4; i++) { const p = this.trayP(G, i); if (s.tray[i] < 0) { circ(g, p.x, p.y, p.r * 0.6, "rgba(255,255,255,.4)", "rgba(74,42,26,.25)", 2); continue; } const sel = s.sel === i, y = p.y - (sel ? G.u * 3 + Math.sin(G.t * 8) * G.u * 0.6 : 0);
        if (sel) { circ(g, p.x, y, p.r * 1.2, "rgba(255,240,140,.7)", "#ffb02e", 3); } this.piz(g, p.x, y, p.r, s.tray[i]); }
      txt(g, s.toast > 0 ? "🥂 ROYAL TOAST! 🥂" : s.sel >= 0 ? `Who wants the ${this.PIZ[s.tray[s.sel]][0]} pizza? Tap them!` : `🍕 Tap a pizza, then tap who wants it! · feasts: ${s.rounds}`, G.cx, G.u * 5, G.u * 3.4, "#fff", { stroke: INK }); },
    hot(G) { const s = G.s; if (s.toast > 0 || s.fly) return { x: G.cx, y: G.H * 0.6 }; if (s.sel >= 0) { const j = s.want.indexOf(s.tray[s.sel]); if (j >= 0) return this.guest(G, j); } const i = s.tray.findIndex((p) => p >= 0); return i >= 0 ? this.trayP(G, i) : { x: G.cx, y: G.H * 0.6 }; },
  },
  {
    id: "crownparade", name: "Crown Jewel Parade", rar: "royal", ico: "💍", unit: "jewels", base: 20, bg: ["#fdf0ff", "#e5c8ff"],
    blurb: "Decorate a royal crown with jewels! Pick a colour, then tap the crown — match the glowing spots for extra sparkle. Fill it up and the ROYAL PARADE marches by!",
    ups: [["tap", "Jewel Tweezers", "💍"], ["auto", "Royal Jewellers", "🦉"], ["crit", "Dazzle Shine", "💎"]],
    win: ["Your first royal crown! So sparkly!", "The parade drummer is a chicken. She's very good.", "Every crown in the kingdom wants to be yours!", "The royal corgis wear your crowns to bed.", "The parade got so long it went around the castle twice!", "Jewels from every mountain came to be in your crowns.", "The trumpets play your name now. Toot toot!", "You're the Royal Crown Maker of Pizza Town!", "Supreme Jewel Master of the Royal Parade!"],
    init(G) { Object.assign(G.s, { req: [], jw: [null, null, null, null, null, null], sel: 0, parade: 0, made: 0, crowns: [], marchers: [], nt: 0, nk: 0, bounce: 0 }); this.newReq(G); },
    newReq(G) { const s = G.s, a = Math.floor(rnd(0, 5)), b = (a + 1 + Math.floor(rnd(0, 4))) % 5, c = (b + 1 + Math.floor(rnd(0, 3))) % 5, k = Math.floor(rnd(0, 4));
      s.req = k === 0 ? [a, a, a, a, a, b] : k === 1 ? [a, b, a, b, a, c] : k === 2 ? [a, b, c, b, a, c] : [0, 1, 2, 3, 4, a]; s.jw = [null, null, null, null, null, null]; },
    cr(G) { const w = Math.min(G.W * 0.62, G.u * 56); return { x: G.cx, y: G.H * 0.42, w }; },
    pal(G, i) { return { x: G.cx + (i - 2) * Math.min(G.W * 0.17, G.u * 14), y: G.H * 0.76, r: Math.min(G.u * 5, G.W * 0.06) }; },
    place(G, i, col) { const s = G.s, c = this.cr(G), p = crownSock(c.x, c.y, c.w, i), ok = col === s.req[i]; s.jw[i] = col; s.bounce = 0.3;
      if (ok) { G.add(6, p.x, p.y, { color: JEW[col] }); SFX.sparkle(); G.dots(p.x, p.y, [JEW[col], "#fff"], 10); } else { G.add(2, p.x, p.y, { color: JEW[col] }); SFX.ding(); if (Math.random() < 0.4) G.float("Ooh, fancy!", p.x, p.y - G.u * 8, "#fff", 0.8); }
      if (s.jw.every((j) => j != null)) this.startParade(G); },
    startParade(G) { const s = G.s, m = s.jw.filter((j, i) => j === s.req[i]).length; s.made++; s.parade = 9; s.nk = 0; s.crowns.unshift(s.jw.map((j) => JEW[j])); if (s.crowns.length > 5) s.crowns.pop();
      G.add(40 + m * 10, G.cx, G.H * 0.3, { color: "#ffd23f", noCrit: true }); SFX.wow(); G.flash("#fff6ff"); G.float(m === 6 ? "👑 PERFECT CROWN! PARADE TIME! 👑" : "👑 PARADE TIME! 👑", G.cx, G.u * 24, "#b0174a", 1.2);
      const who = ["🐕", "🐔", "🦄", "🐷", "🐸"], band = [["🐧", "🎺"], ["🐻", "🥁"], ["🐰", "🎷"]], L = [];
      s.crowns.forEach((cw, i) => L.push({ e: who[i % who.length], crown: cw })); band.forEach(([e, ins]) => L.push({ e, ins }));
      s.marchers = L.map((o, i) => ({ ...o, x: -G.u * 12 - i * G.u * 17, hi: 0, ph: i })); },
    down(G, x, y) { const s = G.s;
      if (s.parade > 0) { for (const m of s.marchers) if (dist(x, y, m.x, G.H * 0.62) < G.u * 10) { m.hi = 0.5; G.add(5, m.x, G.H * 0.5, { color: "#ffd23f" }); SFX.giggle(); G.burst(m.x, G.H * 0.55, ["🎉", "💖"], 3, { size: 0.7 }); return; } G.add(1, x, y); G.dots(x, y, JEW, 8); SFX.pop(1.3); return; }
      for (let i = 0; i < 5; i++) { const p = this.pal(G, i); if (dist(x, y, p.x, p.y) < p.r * 1.5) { s.sel = i; SFX.note(i * 2); G.dots(p.x, p.y, [JEW[i], "#fff"], 6); return; } }
      const c = this.cr(G); for (let i = 0; i < 6; i++) { const p = crownSock(c.x, c.y, c.w, i); if (s.jw[i] == null && dist(x, y, p.x, p.y) < p.r * 1.7) { this.place(G, i, s.sel); return; } }
      if (Math.abs(x - c.x) < c.w * 0.55 && Math.abs(y - c.y) < c.w * 0.4) { const i = s.jw.findIndex((j) => j == null); if (i >= 0) this.place(G, i, s.sel); return; }
      SFX.boop(); },
    update(G, dt) { const s = G.s; s.bounce = Math.max(0, s.bounce - dt);
      if (s.parade > 0) { s.parade -= dt; const sp = (G.W + G.u * 17 * (s.marchers.length + 1)) / 8.2; for (const m of s.marchers) { m.x += sp * dt; m.ph += dt * 8; m.hi = Math.max(0, m.hi - dt); }
        if ((s.nt -= dt) <= 0) { s.nt = 0.25; const n = [0, 0, 4, 7, 7, 4, 0, -1, 5, 5, 9, 12, 12, 9, 7, -1][s.nk++ % 16]; if (n >= 0) SFX.note(n); else G.noise(0.08, { vol: 0.12, f0: 300, f1: 100 }); }
        if (Math.random() < 0.4) G.dots(rnd(0, G.W), -G.u, ["#ffd23f", "#ff5d8f", "#6ec6ff", "#7cffb0", "#b18cff"], 1);
        if (s.parade <= 0) { s.marchers = []; this.newReq(G); } } },
    autoTick(G) { const s = G.s; if (s.parade > 0) return; const i = s.jw.findIndex((j) => j == null); if (i >= 0) this.place(G, i, s.req[i]); },
    draw(G, g) { const s = G.s, c = this.cr(G), par = s.parade > 0;
      for (let i = 0; i < 7; i++) { const x = (i + 0.5) * G.W / 7; g.strokeStyle = "rgba(176,23,74,.25)"; g.lineWidth = 2; g.beginPath(); g.moveTo(x, 0); g.lineTo(x, G.H * 0.12); g.stroke(); g.beginPath(); g.moveTo(x - G.u * 4, G.H * 0.12); g.lineTo(x + G.u * 4, G.H * 0.12); g.lineTo(x + G.u * 4, G.H * 0.22); g.lineTo(x, G.H * 0.19); g.lineTo(x - G.u * 4, G.H * 0.22); g.closePath(); g.fillStyle = i % 2 ? "#b0174a" : "#7a3ad8"; g.globalAlpha = 0.5; g.fill(); g.globalAlpha = 1; }
      glitter(G, g, par ? 40 : 16, "#fff", 0.05, 0.9, par ? 2 : 1);
      if (!par) { rays(G, g, c.x, c.y, 10, "#fff6c8", 0.35, 0.2, 5);
        oval(g, c.x, c.y + c.w * 0.4, c.w * 0.62, c.w * 0.1, "#b0174a"); for (let i = 0; i < 4; i++) circ(g, c.x + (i < 2 ? -1 : 1) * c.w * 0.6, c.y + c.w * 0.4 + (i % 2) * G.u * 2, G.u * 1.2, "#ffcf3a", null);
        const bc = 1 + Math.sin(s.bounce / 0.3 * Math.PI) * 0.04; g.save(); g.translate(c.x, c.y); g.scale(bc, bc); crown(g, 0, 0, c.w, s.jw.map((j) => (j == null ? null : JEW[j])), { ghost: s.req.map((r) => JEW[r]), t: G.t }); g.restore();
        for (let i = 0; i < 5; i++) { const p = this.pal(G, i), sel = s.sel === i; circ(g, p.x, p.y, p.r * (sel ? 1.45 : 1.15), sel ? "#fff6c8" : "rgba(255,255,255,.6)", sel ? "#ffb02e" : "rgba(74,42,26,.4)", sel ? 4 : 2); gem(g, p.x, p.y, p.r * (sel ? 1 : 0.8), JEW[i], sel ? Math.sin(G.t * 4) * 0.15 : 0); }
        const i = s.jw.findIndex((j) => j == null); if (i >= 0) txt(g, `Next spot wants: ${JEWN[s.req[i]]}`, G.cx, G.H * 0.66, G.u * 3.2, JEW[s.req[i]], { stroke: INK }); }
      else { oval(g, G.cx, G.H * 0.7, G.W * 0.7, G.u * 3, "rgba(176,23,74,.25)", null); rr(g, -10, G.H * 0.66, G.W + 20, G.u * 6, 0, "#c8203a", INK, 3);
        for (const m of s.marchers) { if (m.x < -G.u * 15 || m.x > G.W + G.u * 15) continue; const y = G.H * 0.62 - Math.abs(Math.sin(m.ph)) * G.u * 2.5 - m.hi * G.u * 6; E(g, m.e, m.x, y, G.u * 11, Math.sin(m.ph) * 0.08, 1, -1, 1);
          if (m.crown) crown(g, m.x, y - G.u * 8.5, G.u * 9, m.crown, { t: G.t }); if (m.ins) E(g, m.ins, m.x + G.u * 5, y + G.u, G.u * 6); if (m.ins || m.hi > 0) E(g, "🎵", m.x, y - G.u * 13 - Math.sin(m.ph) * G.u, G.u * 4); } }
      txt(g, par ? "👑 THE ROYAL PARADE! Tap to cheer! 👑" : `💍 Crowns made: ${s.made} · match the glowing spots!`, G.cx, G.u * 5, G.u * 3.5, "#fff", { stroke: INK }); },
    hot(G) { const s = G.s; if (s.parade > 0) { const m = s.marchers.find((m) => m.x > G.W * 0.1 && m.x < G.W * 0.9); return m ? { x: m.x, y: G.H * 0.62 } : { x: G.cx, y: G.H * 0.4 }; } const i = s.jw.findIndex((j) => j == null), c = this.cr(G); if (i < 0) return c; if (s.sel !== s.req[i]) return this.pal(G, s.req[i]); return crownSock(c.x, c.y, c.w, i); },
  },

  // ------------------------------------------------------------------------
  //  CELESTIAL
  // ------------------------------------------------------------------------
  {
    id: "sunmoon", name: "Sun & Moon Tea Party", rar: "celestial", ico: "🌞", unit: "cups of tea", base: 22, bg: ["#8fd3ff", "#fff1c9"], noDots: true,
    blurb: "The Sun and the Moon take turns hosting a tea party in the sky! Tap the cups to pour tea for the guests. Serve enough and day turns into night — the stars come to visit!",
    ups: [["tap", "Bigger Teapot", "🫖"], ["auto", "Cloud Waiters", "☁️"], ["mult", "Starlight Sugar", "⭐"]],
    win: ["The Sun says this is the BEST tea ever!", "The Moon wore her fanciest nightcap for you.", "A rainbow came to the party and brought cake!", "The stars are spelling your name in the sky!", "Comets zoom by just to say hello.", "The Sun and Moon made you their Royal Tea Pourer.", "Even the planets RSVP'd to your party!", "Your tea parties light up the whole universe.", "Celestial Tea Party Host of All Time!"],
    DAY: [{ k: "cloud" }, { k: "emo", e: "🐦" }, { k: "emo", e: "🦋" }, { k: "emo", e: "🐝" }, { k: "emo", e: "🌻" }, { k: "cloud" }, { k: "emo", e: "🌈" }],
    NIGHT: [{ k: "star" }, { k: "star" }, { k: "planet", col: "#ff9fd0" }, { k: "planet", col: "#9fd8ff" }, { k: "emo", e: "🦉" }, { k: "emo", e: "🐰" }, { k: "star" }],
    init(G) { Object.assign(G.s, { night: 0, tn: 0, cups: [0, 1, 2, 3].map(() => ({ f: 0, gst: null, arr: 0, sip: 0, lv: 0 })), meter: 0, served: 0, switches: 0, pour: null, vis: [], vt: 1, hostHi: 0 }); G.s.cups.forEach((c) => this.newGuest(G, c)); },
    newGuest(G, c) { c.gst = { ...pick(G.s.night ? this.NIGHT : this.DAY), ph: rnd(0, 6) }; c.arr = 0; c.f = 0; c.sip = 0; c.lv = 0; },
    cup(G, i) { return { x: G.W * (0.17 + 0.22 * i), y: G.H * 0.63, r: Math.min(G.W * 0.06, G.u * 6) }; },
    seat(G, i) { const c = this.cup(G, i); return { x: c.x, y: G.H * 0.47, r: Math.min(G.W * 0.075, G.u * 7.5) }; },
    host(G) { return { x: G.cx, y: G.H * 0.3, r: Math.min(G.W * 0.09, G.u * 8) }; },
    starShape(g, x, y, r, col) { g.beginPath(); for (let k = 0; k < 10; k++) { const a = -Math.PI / 2 + (k * Math.PI) / 5, d = k % 2 ? r * 0.5 : r; g.lineTo(x + Math.cos(a) * d, y + Math.sin(a) * d); } g.closePath(); g.fillStyle = col; g.fill(); g.strokeStyle = INK; g.lineWidth = Math.max(2, r * 0.08); g.lineJoin = "round"; g.stroke(); },
    drawGuest(G, g, q, x, y, r, mood) { if (q.k === "cloud") { for (const [dx, dy, s] of [[-0.55, 0.15, 0.6], [0.55, 0.15, 0.6], [0, -0.15, 0.8]]) circ(g, x + dx * r, y + dy * r, r * s, "#ffffff", "rgba(74,42,26,.5)", 2); oval(g, x, y + r * 0.25, r * 1.1, r * 0.45, "#ffffff", null); face(g, x, y + r * 0.05, r * 0.5, mood); }
      else if (q.k === "star") { this.starShape(g, x, y, r * 1.05, "#ffe66d"); face(g, x, y + r * 0.1, r * 0.42, mood); }
      else if (q.k === "planet") { circ(g, x, y, r * 0.8, q.col); face(g, x, y, r * 0.5, mood); oval(g, x, y + r * 0.1, r * 1.25, r * 0.25, null, "rgba(255,255,255,.85)", 3, -0.25); }
      else E(g, q.e, x, y, r * 1.8); },
    pourIn(G, i) { const s = G.s, c = s.cups[i], p = this.cup(G, i); if (!c.gst || c.arr < 1 || c.sip > 0 || c.lv > 0) return false; c.f = Math.min(1, c.f + 0.34); s.pour = { i, t: 0.5 }; G.add(2, p.x, p.y - p.r); G.noise(0.3, { vol: 0.08, f0: 1500, f1: 600, type: "bandpass", q: 2 });
      if (c.f >= 1) { const q = this.seat(G, i); c.sip = 1.4; G.add(12, q.x, q.y - q.r, { color: "#ffd23f" }); SFX.ding(); G.say(pick(["Mmm! Lovely tea!", "Delightful!", "Just how I like it!", "Thank you kindly!", "What a fancy party!"]), q.x, q.y - q.r * 1.3, 1.2); s.served++; s.meter++; if (s.meter >= 6) this.flip(G); } return true; },
    flip(G) { const s = G.s; s.night = 1 - s.night; s.meter = 0; s.switches++; G.add(60, G.cx, G.H * 0.3, { color: "#ffd23f", noCrit: true }); SFX.wow(); G.flash(s.night ? "#3b2a77" : "#fff6c8"); G.float(s.night ? "🌙 Good evening, Moon! Here come the stars!" : "☀️ Good morning, Sun!", G.cx, G.u * 26, "#ffd23f", 1.1); for (const c of s.cups) if (c.sip <= 0) c.lv = 0.01; },
    down(G, x, y) { const s = G.s, h = this.host(G);
      for (const v of s.vis) if (!v.hi && dist(x, y, v.x, v.y) < G.u * 6) { v.hi = 1; G.add(3, v.x, v.y, { color: "#fff6a0" }); SFX.sparkle(); G.say(s.night ? "Twinkle hello!" : "Flutter hello!", v.x, v.y - G.u * 4, 1); return; }
      for (let i = 0; i < 4; i++) { const c = this.cup(G, i), q = this.seat(G, i); if (dist(x, y, c.x, c.y) < c.r * 1.8 || dist(x, y, q.x, q.y) < q.r) { if (!this.pourIn(G, i)) { G.add(1, x, y); SFX.giggle(); } return; } }
      if (dist(x, y, h.x, h.y) < h.r * 1.3) { s.hostHi = 0.6; G.add(1, x, y, { color: "#ffd23f" }); SFX.giggle(); G.say(s.night ? "What a lovely starry party!" : "Sunny tea for everyone!", h.x, h.y - h.r * 1.4, 1.3); return; }
      SFX.boop(); },
    update(G, dt) { const s = G.s; s.tn += (s.night - s.tn) * Math.min(1, dt * 1.5); s.hostHi = Math.max(0, s.hostHi - dt); if (s.pour && (s.pour.t -= dt) <= 0) s.pour = null;
      for (const c of s.cups) { if (c.arr < 1) c.arr = Math.min(1, c.arr + dt * 1.5); if (c.sip > 0 && (c.sip -= dt) <= 0) c.lv = 0.01; if (c.lv > 0 && (c.lv += dt * 1.2) >= 1) this.newGuest(G, c); }
      if ((s.vt -= dt) <= 0 && s.vis.length < (s.night ? 6 : 3)) { s.vt = rnd(1, 2.5); const left = Math.random() < 0.5; s.vis.push({ x: left ? -G.u * 5 : G.W + G.u * 5, y: G.H * rnd(0.08, 0.32), vx: (left ? 1 : -1) * G.u * rnd(5, 9), ph: rnd(0, 6), hi: 0, e: s.night ? null : pick(["🦋", "🐦", "🎈"]) }); }
      for (let i = s.vis.length - 1; i >= 0; i--) { const v = s.vis[i]; v.x += v.vx * dt; v.ph += dt; if (v.hi) v.hi += dt; if (v.x < -G.u * 8 || v.x > G.W + G.u * 8 || v.hi > 1.5) s.vis.splice(i, 1); } },
    autoTick(G) { const s = G.s; for (let i = 0; i < 4; i++) if (this.pourIn(G, i)) return; },
    draw(G, g) { const s = G.s, n = s.tn, h = this.host(G);
      const sky = g.createLinearGradient(0, 0, 0, G.H); sky.addColorStop(0, mix("#8fd3ff", "#0d1440", n)); sky.addColorStop(1, mix("#fff1c9", "#4a3290", n)); g.fillStyle = sky; g.fillRect(0, 0, G.W, G.H);
      stars(G, g, 70, 1, n); glitter(G, g, 14, "#fff", 0.02, 0.45, 0.8);
      g.globalAlpha = 1 - n * 0.8; for (let i = 0; i < 4; i++) { const cx = ((i * 0.29 + G.t * 0.015) % 1.3) * G.W - G.W * 0.15, cy = G.H * (0.1 + (i % 2) * 0.14); for (const [dx, r] of [[-1, 0.7], [0, 1], [1, 0.75]]) circ(g, cx + dx * G.u * 6, cy, G.u * 5 * r, "#fff", null); } g.globalAlpha = 1;
      // the hosts: the sun sinks as the moon rises
      for (const who of [0, 1]) { const a = who ? n : 1 - n; if (a < 0.02) continue; const y = h.y + (1 - a) * G.H * 0.45, x = h.x + (who ? -1 : 1) * (1 - a) * G.W * 0.3, hi = s.hostHi > 0 ? Math.abs(Math.sin(G.t * 12)) * G.u : 0; g.save(); g.globalAlpha = a;
        if (!who) { g.save(); g.translate(x, y - hi); g.rotate(G.t * 0.4); for (let k = 0; k < 12; k++) { g.rotate(TAU / 12); g.beginPath(); g.moveTo(-h.r * 0.2, -h.r * 1.05); g.lineTo(0, -h.r * 1.5); g.lineTo(h.r * 0.2, -h.r * 1.05); g.closePath(); g.fillStyle = "#ffb02e"; g.fill(); g.strokeStyle = INK; g.lineWidth = 2; g.stroke(); } g.restore(); circ(g, x, y - hi, h.r, "#ffd84a"); face(g, x, y - hi, h.r * 0.65, s.hostHi > 0 ? "joy" : "happy"); }
        else { const gl = g.createRadialGradient(x, y, h.r * 0.5, x, y, h.r * 2); gl.addColorStop(0, "rgba(255,250,200,.5)"); gl.addColorStop(1, "rgba(255,250,200,0)"); g.fillStyle = gl; g.beginPath(); g.arc(x, y, h.r * 2, 0, TAU); g.fill(); circ(g, x, y - hi, h.r, "#fff6c8"); for (const [dx, dy, r] of [[-0.4, -0.35, 0.15], [0.45, 0.3, 0.12], [0.3, -0.5, 0.08]]) circ(g, x + dx * h.r, y - hi + dy * h.r, h.r * r, "rgba(200,190,140,.5)", null); face(g, x, y - hi + h.r * 0.05, h.r * 0.6, s.hostHi > 0 ? "joy" : "happy");
          g.save(); g.translate(x + h.r * 0.2, y - hi - h.r * 0.75); g.rotate(0.3); g.beginPath(); g.moveTo(-h.r * 0.7, h.r * 0.15); g.quadraticCurveTo(0, -h.r * 0.9, h.r * 0.9, h.r * 0.2); g.closePath(); g.fillStyle = "#7a6bff"; g.fill(); g.strokeStyle = INK; g.lineWidth = 3; g.stroke(); circ(g, h.r * 0.95, h.r * 0.25, h.r * 0.14, "#fff"); g.restore(); }
        g.restore(); }
      for (const v of s.vis) { const y = v.y + Math.sin(v.ph * 3) * G.u * 1.5 - (v.hi ? v.hi * G.u * 4 : 0), r = G.u * 3; if (v.e) E(g, v.e, v.x, y, G.u * 6); else { this.starShape(g, v.x, y, r, "#fff6a0"); face(g, v.x, y + r * 0.1, r * 0.4, v.hi ? "joy" : "happy", { blush: false }); } if (v.hi) twinkle(g, v.x + G.u * 4, y - G.u * 3, G.u * 2); }
      // guests behind the cloud table
      for (let i = 0; i < 4; i++) { const c = s.cups[i], q = this.seat(G, i); if (!c.gst) continue; const e = ease(c.arr), up = c.lv > 0 ? c.lv * G.H * 0.5 : 0, y = q.y + (1 - e) * G.u * 12 - up + Math.sin(G.t * 2 + c.gst.ph) * G.u * 0.6; g.save(); g.globalAlpha = c.lv > 0 ? 1 - c.lv : e;
        this.drawGuest(G, g, c.gst, q.x, y, q.r, c.sip > 0 || c.lv > 0 ? "joy" : c.f > 0 ? "wow" : "happy"); if (c.lv > 0) E(g, "👋", q.x + q.r, y, q.r * 0.8, Math.sin(G.t * 12) * 0.4); g.restore(); }
      const ty = G.H * 0.66; for (let i = 0; i < 14; i++) circ(g, G.W * (0.06 + i * 0.068), ty + G.u * 2 + (i % 2) * G.u * 2, G.u * 5, mix("#ffffff", "#d9cff5", n), null); rr(g, G.W * 0.05, ty - G.u * 2, G.W * 0.9, G.u * 5, G.u * 2.5, mix("#ffe3f0", "#c9b8ff", n), INK, 3);
      for (let i = 0; i < 4; i++) { const p = this.cup(G, i), c = s.cups[i], ready = c.gst && c.arr >= 1 && c.sip <= 0 && c.lv <= 0;
        oval(g, p.x, p.y + p.r * 0.75, p.r * 1.3, p.r * 0.3, "#fffaf0"); g.beginPath(); g.moveTo(p.x - p.r, p.y - p.r * 0.5); g.lineTo(p.x + p.r, p.y - p.r * 0.5); g.quadraticCurveTo(p.x + p.r, p.y + p.r * 0.75, p.x, p.y + p.r * 0.75); g.quadraticCurveTo(p.x - p.r, p.y + p.r * 0.75, p.x - p.r, p.y - p.r * 0.5); g.closePath(); g.fillStyle = ["#ff9fd0", "#9fd8ff", "#b6f5c9", "#ffe08a"][i]; g.fill(); g.strokeStyle = INK; g.lineWidth = 3; g.stroke();
        g.beginPath(); g.arc(p.x + p.r * 1.05, p.y, p.r * 0.35, -1.2, 1.2); g.stroke(); oval(g, p.x, p.y - p.r * 0.5, p.r, p.r * 0.25, c.f > 0 ? mix("#e8b26a", "#b5651d", c.f) : "#fffaf0");
        if (c.sip > 0 || c.f >= 1) for (let k = 0; k < 2; k++) { const t = (G.t * 0.8 + k * 0.5) % 1; g.strokeStyle = `rgba(255,255,255,${0.8 * (1 - t)})`; g.lineWidth = 3; g.beginPath(); g.moveTo(p.x + (k - 0.5) * p.r * 0.6, p.y - p.r * 0.7 - t * p.r * 1.4); g.quadraticCurveTo(p.x + (k - 0.5) * p.r * 0.6 + Math.sin(t * 6) * p.r * 0.3, p.y - p.r - t * p.r * 1.4, p.x + (k - 0.5) * p.r * 0.6, p.y - p.r * 1.3 - t * p.r * 1.4); g.stroke(); }
        if (ready) bar(g, p.x - p.r, p.y + p.r * 1.25, p.r * 2, G.u * 2.2, c.f, "#c98a4a"); }
      // the teapot
      const tp = s.pour ? this.cup(G, s.pour.i) : null, px = tp ? tp.x + tp.r * 1.6 : h.x + h.r * 2.2, py = tp ? tp.y - tp.r * 3 : h.y + h.r * 0.8, pr = Math.min(G.u * 5, G.W * 0.05);
      if (tp) { g.strokeStyle = "#c98a4a"; g.lineWidth = G.u * 0.9; g.beginPath(); g.moveTo(px - pr * 1.5, py - pr * 0.1); g.quadraticCurveTo(tp.x, py, tp.x, tp.y - tp.r * 0.5); g.stroke(); }
      g.save(); g.translate(px, py); g.rotate(tp ? -0.6 : Math.sin(G.t * 2) * 0.05); g.lineWidth = 3; g.strokeStyle = INK; g.beginPath(); g.moveTo(-pr * 0.8, 0); g.lineTo(-pr * 1.5, -pr * 0.5); g.stroke(); g.beginPath(); g.arc(pr * 1, 0, pr * 0.4, -1.5, 1.5); g.stroke(); oval(g, 0, 0, pr, pr * 0.8, s.night ? "#c9b8ff" : "#ff9fd0"); circ(g, 0, -pr * 0.85, pr * 0.2, "#ffd23f"); twinkle(g, -pr * 0.3, -pr * 0.2, pr * 0.3); g.restore();
      bar(g, G.cx - G.u * 24, G.u * 3.5, G.u * 48, G.u * 4, s.meter / 6, s.night ? "#ffe66d" : "#ff9a3c"); txt(g, `${s.night ? "🌙 Moon's party · until sunrise" : "☀️ Sun's party · until moonrise"} · cups: ${s.served}`, G.cx, G.u * 11, G.u * 3.2, "#fff", { stroke: INK }); },
    hot(G) { const s = G.s, i = s.cups.findIndex((c) => c.gst && c.arr >= 1 && c.sip <= 0 && c.lv <= 0); return i >= 0 ? this.cup(G, i) : this.host(G); },
  },
  {
    id: "aurora", name: "Aurora Painter", rar: "celestial", ico: "🌌", unit: "shimmers", base: 22, bg: ["#071233", "#1b2a5c"], noDots: true,
    blurb: "Drag your finger across the night sky to paint shimmering northern lights! Fill the sky with colour and your painting comes alive and DANCES!",
    ups: [["tap", "Wider Brush", "🖌️"], ["auto", "Snowy Owl Painters", "🦉"], ["crit", "Shimmer Splash", "✨"]],
    win: ["Your first aurora! The fox said 'Ooooh!'", "The polar bear stayed up late to watch.", "Your sky painting glows all the way to the moon!", "The stars moved over to make room for your colours.", "The whole North Pole is having a light show party!", "Your aurora is in the Sky Museum now.", "Even the sun peeks over at night to see your art.", "The owls call you the Painter of the Night.", "Grand Artist of the Celestial Sky!"],
    init(G) { Object.assign(G.s, { strokes: [], cur: null, meter: 0, dance: 0, dances: 0, h: rnd(0, 360), acc: 0, q: 0, fade: 0, hint: 1, wow: 0 }); },
    addPt(G, x, y) { const s = G.s; if (!s.cur) { s.cur = []; s.strokes.push(s.cur); } s.cur.push({ x, y: Math.min(y, G.H * 0.64), h: s.h }); s.h = (s.h + 1.8) % 360;
      let tot = s.strokes.reduce((a, st) => a + st.length, 0); while (tot > 700 && s.strokes.length > 1) tot -= s.strokes.shift().length; },
    paint(G, n) { const s = G.s; if (s.dance > 0 || s.fade > 0) return; s.meter = Math.min(100, s.meter + n); if (s.meter >= 100) { s.meter = 0; s.dance = 7; s.dances++; s.wow = 1; G.add(80, G.cx, G.H * 0.3, { color: "#7cffb0", noCrit: true }); SFX.wow(); G.flash("#7cffb0", 0.3); G.float("✨ The sky is DANCING! ✨", G.cx, G.u * 26, "#7cffb0", 1.3); } },
    down(G, x, y) { const s = G.s; s.hint = 0; if (s.fade > 0) return; s.cur = null; for (let k = 0; k < 8; k++) this.addPt(G, x + (k - 3.5) * G.u * 2.4, y + Math.sin(k * 0.9) * G.u * 1.5); s.cur = s.strokes[s.strokes.length - 1];
      G.add(1, x, y, { color: `hsl(${s.h},90%,70%)` }); this.paint(G, 2.5); G.tone(rnd(700, 1100), 0.3, { type: "sine", vol: 0.05, slideTo: rnd(1200, 1600) }); G.dots(x, y, [`hsl(${s.h},90%,70%)`, "#fff"], 5); },
    move(G, x, y, ox, oy) { const s = G.s; if (!G.down || !s.cur || s.fade > 0) return; const last = s.cur[s.cur.length - 1], d = last ? dist(x, Math.min(y, G.H * 0.64), last.x, last.y) : G.u * 2; if (d < G.u * 1.2) return; this.addPt(G, x, y); s.acc += d;
      while (s.acc >= G.u * 6) { s.acc -= G.u * 6; s.q = (s.q + 1) % 4; G.add(1, x, y, { quiet: s.q !== 0, color: `hsl(${s.h},90%,70%)` }); this.paint(G, 1.2); if (s.q === 0) G.tone(rnd(900, 1500), 0.2, { type: "sine", vol: 0.04 }); } },
    up(G) { G.s.cur = null; },
    update(G, dt) { const s = G.s; s.wow = Math.max(0, s.wow - dt * 0.5);
      if (s.dance > 0 && (s.dance -= dt) <= 0) { s.fade = 1.5; } if (s.fade > 0 && (s.fade -= dt) <= 0) { s.fade = 0; s.strokes = []; s.cur = null; G.float("A fresh sky to paint!", G.cx, G.u * 26, "#bfe3ff", 1); }
      if (s.dance > 0 && Math.random() < 0.25) { const st = pick(s.strokes); const p = st && pick(st); if (p) G.parts.push({ x: p.x, y: p.y, vx: rnd(-1, 1) * G.u * 4, vy: -G.u * 10, life: 1, max: 1, c: `hsl(${p.h + G.t * 60},95%,75%)`, size: G.u * 0.9, grav: -0.05 }); } },
    autoTick(G) { const s = G.s; if (s.fade > 0) return; s.cur = null; const y0 = G.H * rnd(0.15, 0.45), a = rnd(0, 6), x0 = rnd(0.05, 0.35) * G.W, L = rnd(0.35, 0.6) * G.W; for (let k = 0; k <= 12; k++) this.addPt(G, x0 + (k / 12) * L, y0 + Math.sin(a + k * 0.5) * G.u * 5); s.cur = null; this.paint(G, 5); G.burst(x0, y0, "✨", 2, { size: 0.6, grav: -0.2 }); },
    draw(G, g) { const s = G.s, dn = s.dance > 0, fm = s.fade > 0 ? s.fade / 1.5 : 1;
      stars(G, g, 90, 0.4); E(g, "🌙", G.W * 0.88, G.H * 0.1, G.u * 8);
      g.save(); g.globalCompositeOperation = "lighter"; g.lineCap = "round"; g.lineJoin = "round"; const L = G.u * (dn ? 22 : 15), amp = G.u * (dn ? 4 : 0.8), hs = dn ? G.t * 70 : 0;
      for (const st of s.strokes) { if (st.length < 2) continue;
        for (let k = 0; k < 6; k++) { const oy = (k / 5) * L, al = (k === 0 ? 0.55 : 0.3 * (1 - k / 6.5)) * fm; g.lineWidth = G.u * (k === 0 ? 1.6 : 3.4 - k * 0.2);
          for (let j = 0; j < st.length - 1; j += 3) { const end = Math.min(st.length - 1, j + 3), p0 = st[j]; g.strokeStyle = `hsla(${p0.h + hs + k * 14},95%,${k === 0 ? 75 : 60}%,${al})`; g.beginPath();
            for (let m = j; m <= end; m++) { const p = st[m], w = Math.sin(G.t * 1.4 + p.x * 0.012 + k * 0.3) * amp, X = p.x + (dn ? Math.sin(G.t * 2 + p.y * 0.02) * amp * 0.6 : 0), Y = p.y - oy + w; m === j ? g.moveTo(X, Y) : g.lineTo(X, Y); } g.stroke(); } } }
      g.restore();
      // snowy ground & friends watching
      g.fillStyle = "#e8f4ff"; g.beginPath(); g.moveTo(0, G.H); g.lineTo(0, G.H * 0.74); for (let k = 0; k <= 10; k++) g.lineTo((k / 10) * G.W, G.H * 0.72 + Math.sin(k * 1.7) * G.u * 3); g.lineTo(G.W, G.H); g.closePath(); g.fill(); g.strokeStyle = INK; g.lineWidth = 3; g.stroke();
      for (const [fx, sz] of [[0.06, 9], [0.14, 7], [0.92, 9], [0.84, 6]]) E(g, "🌲", G.W * fx, G.H * 0.71 - G.u * sz * 0.3, G.u * sz);
      const ix = G.W * 0.72, iy = G.H * 0.78, ir = G.u * 7; g.beginPath(); g.arc(ix, iy, ir, Math.PI, 0); g.closePath(); g.fillStyle = "#ffffff"; g.fill(); g.strokeStyle = "#7fa8d0"; g.lineWidth = 2; g.stroke(); for (let k = 1; k < 3; k++) { g.beginPath(); g.arc(ix, iy, ir, Math.PI, 0); g.stroke(); g.beginPath(); g.moveTo(ix - ir, iy - k * ir * 0.33); g.lineTo(ix + ir, iy - k * ir * 0.33); g.stroke(); } g.beginPath(); g.arc(ix, iy, ir * 0.4, Math.PI, 0); g.fillStyle = "#2a3a5a"; g.fill();
      const jump = (i) => (dn || s.wow > 0 ? Math.abs(Math.sin(G.t * 7 + i)) * G.u * 3 : 0); E(g, "🦊", G.W * 0.28, G.H * 0.78 - jump(0), G.u * 9); E(g, "🐻‍❄️", G.W * 0.42, G.H * 0.79 - jump(1), G.u * 10); E(g, "🐧", G.W * 0.56, G.H * 0.79 - jump(2), G.u * 8);
      if (dn) for (let i = 0; i < 3; i++) twinkle(g, G.W * (0.28 + i * 0.14), G.H * 0.68 - jump(i), G.u * 1.8, "#fff");
      if (s.hint) txt(g, "👆 Drag across the sky to paint!", G.cx, G.H * 0.4, G.u * 4.2, "#bfe3ff", { stroke: INK });
      if (dn) txt(g, `✨ Your aurora is dancing! ${Math.ceil(s.dance)}s`, G.cx, G.u * 5.5, G.u * 3.6, "#7cffb0", { stroke: INK });
      else { bar(g, G.cx - G.u * 24, G.u * 3.5, G.u * 48, G.u * 4, s.meter / 100, `hsl(${s.h},90%,65%)`); txt(g, `🌌 Paint the sky · dances: ${s.dances}`, G.cx, G.u * 11, G.u * 3.4, "#fff", { stroke: INK }); } },
    hot(G) { return { x: G.W * rnd(0.15, 0.85), y: G.H * rnd(0.2, 0.55) }; },
  },

  // ------------------------------------------------------------------------
  //  INFINITY PIZZA (the rarest of all!)
  // ------------------------------------------------------------------------
  {
    id: "infinitepizza", name: "The Infinite Pizza", rar: "infinity", ico: "♾️", unit: "zooms", base: 25, bg: ["#1a0b3a", "#05020f"], noDots: true,
    blurb: "Look closely… every pepperoni is a whole tiny pizza! Tap the glowing pepperoni to ZOOM inside it. And inside that one is another. Forever!",
    ups: [["tap", "Zoomier Lens", "🔍"], ["auto", "Ladybug Divers", "🐞"], ["mult", "Endless Oven", "🌀"]],
    win: ["Whoa! There's a pizza in the pizza!", "You're SO deep in the pizza now.", "The tiny pizza people are waving at you!", "Scientists can't find the bottom of this pizza.", "You've zoomed past a hundred pizzas. And counting!", "Every pepperoni says hi. There are a LOT of them.", "The Infinite Pizza named a tiny pizza after you.", "You've seen more pizza than anyone in history!", "Infinity Pizza Explorer — forever and ever!"],
    K: 0.15, FR: ["🐔", "🐭", "🐌", "🐞", "🐸", "🐹", "🐧", "🦄", "🐢", "🐝", "🐰", "🐱"],
    init(G) { Object.assign(G.s, { l: 0, z: 0, warp: 0, pulse: 0, bonus: 0, deepest: 0 }); },
    rot: (l) => l * 0.7,
    tg: (l) => (l * 3 + 1) % 7,
    pp(l, i) { const a = (i < 6 ? (i * TAU) / 6 + 0.5 : 0) + this.rot(l), d = i < 6 ? 0.56 : 0; return [Math.cos(a) * d, Math.sin(a) * d]; },
    fp(l) { const a = ((l * 2 + 3) % 6) * (TAU / 6) + 0.5 + Math.PI / 6 + this.rot(l); return [Math.cos(a) * 0.56, Math.sin(a) * 0.56]; },
    drawP(G, g, x, y, R, l) { if (x + R < 0 || x - R > G.W || y + R < 0 || y - R > G.H) return; if (R < 3) { circ(g, x, y, R, "#d8343a", null); return; }
      circ(g, x, y, R, "#e8b26a", R > G.u * 2 ? INK : null, Math.max(1, R * 0.04)); circ(g, x, y, R * 0.86, "#f2483a", null);
      g.fillStyle = "#ffd23f"; g.beginPath(); for (let i = 0; i <= 32; i++) { const a = (i / 32) * TAU, r = R * (0.76 + Math.sin(i * 1.9 + l) * 0.02); g.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r); } g.fill();
      for (let i = 0; i < 7; i++) { const [px, py] = this.pp(l, i), cx = x + px * R, cy = y + py * R, r = R * this.K; circ(g, cx, cy, r, "#d8343a", r > 4 ? "#9a1f24" : null, Math.max(1, r * 0.06));
        const a = clamp((r - G.u * 1.5) / (G.u * 6), 0, 1); if (a > 0) { g.save(); g.globalAlpha *= a; this.drawP(G, g, cx, cy, r, l + 1); g.restore(); } }
      if (R * 0.22 > G.u * 2) { const [fx, fy] = this.fp(l); E(g, this.FR[l % this.FR.length], x + fx * R, y + fy * R, R * 0.22, Math.sin(G.t * 3 + l) * 0.15); } },
    cam(G) { const s = G.s, k = this.K, z = s.z > 0 ? ease(s.z) : 0, S = Math.pow(1 / k, z), f = (1 - Math.pow(k, z)) / (1 - k), [px, py] = this.pp(s.l, this.tg(s.l)), R0 = Math.min(G.W, G.H * 0.85) * 0.36, C = { x: G.cx, y: G.H * 0.54 };
      return { x: C.x - px * f * S * R0, y: C.y - py * f * S * R0, R: R0 * S, R0, C, tx: C.x + px * R0, ty: C.y + py * R0 }; },
    zoom(G) { const s = G.s; if (s.z > 0) return; s.z = 0.0001; SFX.whoosh(); G.tone(300, 0.9, { type: "sine", vol: 0.1, slideTo: 1200 }); },
    down(G, x, y) { const s = G.s; if (s.z > 0) return; const c = this.cam(G), [fx, fy] = this.fp(s.l);
      if (dist(x, y, c.tx, c.ty) < Math.max(c.R0 * this.K * 1.4, G.u * 6)) { this.zoom(G); return; }
      const fX = c.C.x + fx * c.R0, fY = c.C.y + fy * c.R0; if (dist(x, y, fX, fY) < c.R0 * 0.16) { G.add(2, fX, fY); SFX.giggle(); G.say(pick(["Hello from in here!", "Hi! Come deeper!", "Welcome to my pizza!", "Wave wave!"]), fX, c.C.y - c.R0 * 1.12, 1.2); return; }
      if (dist(x, y, c.C.x, c.C.y) < c.R0) { G.add(1, x, y, { color: "#ffd23f" }); SFX.sparkle(); G.burst(x, y, "✨", 2, { size: 0.6 }); s.pulse = 0.6; return; }
      SFX.boop(); G.dots(x, y, ["#ff5d8f", "#ffe066", "#6ec6ff"], 5); },
    update(G, dt) { const s = G.s; s.pulse = Math.max(0, s.pulse - dt); s.bonus = Math.max(0, s.bonus - dt); s.warp += dt * (s.z > 0 ? 1.4 : 0.05);
      if (s.z > 0) { s.z += dt / 0.9; if (s.z >= 1) { s.z = 0; s.l++; s.deepest = Math.max(s.deepest, s.l); const c = this.cam(G); G.add(6, c.C.x, c.C.y - c.R0 * 0.5, { color: "#ffd23f" }); SFX.note(s.l % 12);
          if (s.l % 10 === 0) { s.bonus = 3; G.add(100, c.C.x, c.C.y, { color: "#ff5d8f", noCrit: true }); SFX.wow(); G.flash("#ffffff"); G.float(`♾️ INFINITY BONUS! Pizza #${s.l}! ♾️`, G.cx, G.u * 24, "#ffe066", 1.3); G.burst(c.C.x, c.C.y, ["🍕", "✨", "🌈"], 24, { speed: 1.4 }); }
          else if (s.l % 3 === 0) { const [fx, fy] = this.fp(s.l); G.say(`Hi! Welcome to pizza #${s.l}!`, c.C.x + fx * c.R0, c.C.y - c.R0 * 1.12, 1.4); } } } },
    autoTick(G) { this.zoom(G); },
    draw(G, g) { const s = G.s, c = this.cam(G), zm = s.z > 0;
      const bg = g.createRadialGradient(c.C.x, c.C.y, 0, c.C.x, c.C.y, Math.max(G.W, G.H) * 0.8); bg.addColorStop(0, `hsl(${(s.l * 35 + s.z * 35) % 360},70%,${s.bonus > 0 ? 40 : 28}%)`); bg.addColorStop(1, "#05020f"); g.fillStyle = bg; g.fillRect(0, 0, G.W, G.H);
      const maxR = Math.hypot(G.W, G.H) * 0.6; g.lineCap = "round"; for (let i = 0; i < 90; i++) { const a = i * 2.39996, f = (s.warp * 0.25 + i * 0.0123) % 1, r = f * f * maxR, len = zm ? r * 0.15 : G.u * 0.3; g.strokeStyle = `hsla(${(i * 40 + s.l * 20) % 360},90%,80%,${clamp(f * 2, 0, 1)})`; g.lineWidth = G.u * (0.2 + f * 0.6); g.beginPath(); g.moveTo(c.C.x + Math.cos(a) * r, c.C.y + Math.sin(a) * r); g.lineTo(c.C.x + Math.cos(a) * (r + len), c.C.y + Math.sin(a) * (r + len)); g.stroke(); }
      if (!zm) { g.save(); g.translate(c.C.x, c.C.y); g.rotate(G.t * 0.5); for (let i = 0; i < 12; i++) { g.rotate(TAU / 12); g.strokeStyle = `hsla(${i * 30},95%,65%,.8)`; g.lineWidth = G.u * 1.2; g.beginPath(); g.arc(0, 0, c.R0 * 1.1, 0, TAU / 12); g.stroke(); } g.restore(); }
      this.drawP(G, g, c.x, c.y, c.R, s.l);
      if (!zm) { const pr = c.R0 * this.K, pu = 1 + Math.sin(G.t * 6) * 0.12; circ(g, c.tx, c.ty, pr * 1.3 * pu, null, "#ffe066", G.u * 0.9); circ(g, c.tx, c.ty, pr * 1.6 * pu, null, "rgba(255,224,102,.4)", G.u * 0.6); for (let k = 0; k < 4; k++) { const a = G.t * 2 + k * (TAU / 4); twinkle(g, c.tx + Math.cos(a) * pr * 1.9, c.ty + Math.sin(a) * pr * 1.9, G.u * 1.4); } }
      if (s.bonus > 0) for (let i = 0; i < 7; i++) { g.strokeStyle = R7[i]; g.globalAlpha = Math.min(1, s.bonus); g.lineWidth = G.u * 1.2; g.beginPath(); g.arc(c.C.x, c.C.y, c.R0 * (1.15 + i * 0.06) + Math.sin(G.t * 5) * G.u, 0, TAU); g.stroke(); } g.globalAlpha = 1;
      txt(g, `♾️ Pizza depth: ${s.l}${s.l >= 10 ? " · WOW!" : ""}`, G.cx, G.u * 5.5, G.u * 3.8, "#fff", { stroke: INK }); if (!zm) txt(g, "Tap the glowing pepperoni to zoom in!", G.cx, G.u * 11, G.u * 3, "#ffe066", { stroke: INK }); },
    hot(G) { const c = this.cam(G); return { x: c.tx, y: c.ty }; },
  },
  {
    id: "friendship", name: "The Great Pizza Friendship Party", rar: "infinity", ico: "🤝", unit: "friends", base: 25, bg: ["#fff3fb", "#ffe1b8"],
    blurb: "Everyone in Pizza Town is holding hands in a giant circle dance! Tap the middle to invite more friends, tap a dancer for a high-five. Every 6 new friends: a GIANT DANCE PARTY!",
    ups: [["tap", "Bigger Invitations", "💌"], ["auto", "Invitation Doves", "🕊️"], ["mult", "Friendship Bracelets", "🎀"]],
    win: ["The circle is growing! Everyone is smiling!", "Papa Pepperoni is doing his famous twirl!", "The pigeons and chickens are best friends now.", "The mushroom kids taught everyone a new dance!", "The circle is so big it needs TWO rings!", "The whole town can hear the happy music!", "Everyone in Pizza Town says you're their best friend.", "Friends from other towns are coming to join!", "The Greatest Friend in the Whole Pizza Universe!"],
    PALS: [{ k: "hen", n: "Henrietta Hen" }, { k: "pigeon", n: "Pigeon Pete" }, { k: "mush", n: "Little Mushroom Kid" }, { k: "papa", n: "Papa Pepperoni" }, { k: "hen", n: "Clucky Lou", body: "#ffe0a8" }, { k: "pigeon", n: "Pigeon Penny", body: "#c9b9d6" }, { k: "mush", n: "Mushroom Max", cap: "#ff9f40" }, { k: "tom", n: "Tommy Tomato" }, { k: "cheese", n: "Cheesy Chloe" },
      { k: "emo", e: "🐧", n: "Penguin Pip" }, { k: "emo", e: "🐹", n: "Peanut the Hamster" }, { k: "emo", e: "🦄", n: "The Pizza Unicorn" }, { k: "emo", e: "🐷", n: "Pinky Pig" }, { k: "emo", e: "🐸", n: "Froggy Fred" }, { k: "emo", e: "🐶", n: "Biscuit the Pup" }, { k: "emo", e: "🐱", n: "Pizza Cat" }, { k: "emo", e: "🐰", n: "Bun-Bun" }, { k: "emo", e: "🐻", n: "Teddy" }, { k: "emo", e: "🦊", n: "Foxy" }, { k: "emo", e: "🐼", n: "Panda Pam" }, { k: "emo", e: "🐨", n: "Koko Koala" }, { k: "emo", e: "🐮", n: "Moo-Moo" }, { k: "emo", e: "🐤", n: "Chickie" }, { k: "emo", e: "🐢", n: "Shelly Turtle" }],
    STYLES: ["Spin Dance", "Bunny Hop", "In-and-Out", "Wiggle Wave"],
    init(G) { Object.assign(G.s, { f: [], crowd: [], next: 0, invites: 0, spin: 0, party: 0, parties: 0, style: 0, nt: 0, nk: 0 }); for (let i = 0; i < 4; i++) this.invite(G, true); },
    C(G) { return { x: G.cx, y: G.H * 0.55, R: Math.min(G.W * 0.4, G.H * 0.4) }; },
    invite(G, quiet = false) { const s = G.s, p = this.PALS[s.next++ % this.PALS.length], left = Math.random() < 0.5; s.f.push({ p, t: quiet ? 1 : 0, sx: left ? -G.u * 8 : G.W + G.u * 8, sy: G.H * rnd(0.4, 0.8), hi: 0 });
      if (s.f.length > 24) { const o = s.f.shift(); s.crowd.push(o.p); if (s.crowd.length > 12) s.crowd.shift(); }
      if (quiet) return; s.invites++; G.add(4, G.cx, G.H * 0.5, { color: "#ff5d8f" }); SFX.door(); G.float(`${p.n} joined!`, G.cx, G.u * 24, "#ff5d8f", 0.9);
      if (s.invites % 6 === 0) { s.party = 6; s.parties++; s.style = (s.style + 1) % this.STYLES.length; G.add(90, G.cx, G.H * 0.35, { color: "#ffd23f", noCrit: true }); SFX.wow(); G.flash("#fff0fb"); G.float("🎉 DANCE PARTY! 🎉", G.cx, G.u * 30, "#ffb02e", 1.2); } },
    pos(G) { const s = G.s, c = this.C(G), out = [], rings = [s.f.slice(0, 14), s.f.slice(14)];
      rings.forEach((ring, m) => { const n = ring.length; ring.forEach((fr, i) => { let R = c.R * (m ? 0.52 : 1), a = (m ? -1.3 : 1) * s.spin + (i / Math.max(1, n)) * TAU, hop = 0, tilt = 0;
        if (s.style === 1) hop = -Math.abs(Math.sin(G.t * 6 + i * 0.8)) * G.u * 3; else if (s.style === 2) R *= 1 + Math.sin(G.t * 2.2) * 0.12; else if (s.style === 3) { tilt = Math.sin(G.t * 5 + i) * 0.25; hop = Math.sin(G.t * 5 + i) * G.u; } else hop = -Math.abs(Math.sin(G.t * 3 + i)) * G.u;
        let x = c.x + Math.cos(a) * R, y = c.y + Math.sin(a) * R * 0.5 + hop - fr.hi * G.u * 8; const e = ease(Math.min(1, fr.t)); x = fr.sx + (x - fr.sx) * e; y = fr.sy + (y - fr.sy) * e; out.push({ fr, x, y, m, i, tilt }); }); }); return out; },
    size(G) { const c = this.C(G); return clamp((c.R * TAU / Math.max(8, Math.min(14, G.s.f.length))) * 0.2, G.u * 4.5, G.u * 7.5); },
    drawPal(G, g, p, x, y, r, mood, tilt = 0) { g.save(); g.translate(x, y); g.rotate(tilt);
      if (p.k === "hen") hen(g, 0, r * 0.1, r * 0.85, { body: p.body || "#fffaf0", mood });
      else if (p.k === "pigeon") hen(g, 0, r * 0.1, r * 0.85, { body: p.body || "#b9bfcc", mood, comb: null, neck: "#7fd8b0" });
      else if (p.k === "mush") { rr(g, -r * 0.45, -r * 0.1, r * 0.9, r * 1.0, r * 0.35, "#fff1dc", INK, 2.5); face(g, 0, r * 0.35, r * 0.42, mood); g.beginPath(); g.ellipse(0, -r * 0.05, r * 0.95, r * 0.75, 0, Math.PI, 0); g.closePath(); g.fillStyle = p.cap || "#f2483a"; g.fill(); g.strokeStyle = INK; g.lineWidth = 2.5; g.stroke(); for (const [dx, dy, s2] of [[-0.45, -0.3, 0.14], [0.2, -0.55, 0.16], [0.55, -0.22, 0.11]]) circ(g, dx * r, dy * r, r * s2, "#fff", null); }
      else if (p.k === "papa") { circ(g, 0, 0, r * 0.8, "#d8343a", "#9a1f24", 3); for (const [dx, dy] of [[-0.45, -0.3], [0.5, -0.1], [-0.3, 0.5], [0.35, 0.5]]) circ(g, dx * r, dy * r, r * 0.08, "#9a1f24", null); face(g, 0, r * 0.02, r * 0.55, mood); for (const sd of [-1, 1]) oval(g, sd * r * 0.17, r * 0.2, r * 0.2, r * 0.08, "#5a2a1a", null, null, sd * 0.3); rr(g, -r * 0.45, -r * 1.05, r * 0.9, r * 0.32, r * 0.08, "#fffaf0", INK, 2); for (const dx of [-0.3, 0, 0.3]) circ(g, dx * r, -r * 1.15, r * 0.25, "#fffaf0", INK, 2); rr(g, -r * 0.45, -r * 0.95, r * 0.9, r * 0.22, r * 0.05, "#fffaf0", null); }
      else if (p.k === "tom") { circ(g, 0, 0, r * 0.8, "#ff5a4a"); for (let k = 0; k < 5; k++) oval(g, Math.cos(k * 1.26 - 1.57) * r * 0.2, -r * 0.75 + Math.sin(k * 1.26 - 1.57) * r * 0.12, r * 0.18, r * 0.07, "#3ccf7a", INK, 1.5, k * 1.26); face(g, 0, r * 0.05, r * 0.55, mood); }
      else if (p.k === "cheese") { g.beginPath(); g.moveTo(-r * 0.85, r * 0.65); g.lineTo(r * 0.85, r * 0.65); g.lineTo(r * 0.6, -r * 0.75); g.closePath(); g.fillStyle = "#ffd23f"; g.fill(); g.strokeStyle = INK; g.lineWidth = 2.5; g.lineJoin = "round"; g.stroke(); for (const [dx, dy, s2] of [[-0.45, 0.4, 0.1], [0.45, -0.3, 0.09], [0.6, 0.35, 0.07]]) circ(g, dx * r, dy * r, r * s2, "#f0b322", null); face(g, r * 0.05, r * 0.2, r * 0.4, mood); }
      else E(g, p.e, 0, 0, r * 1.9);
      g.restore(); },
    down(G, x, y) { const s = G.s, r = this.size(G); let best = null, bd = r * 1.1; for (const q of this.pos(G)) { const d = dist(x, y, q.x, q.y); if (q.fr.t >= 1 && d < bd) { bd = d; best = q; } }
      if (best) { best.fr.hi = 0.6; G.add(2, best.x, best.y - r, { color: "#ff86b3" }); SFX.giggle(); G.burst(best.x, best.y - r, ["💖", "🙌"], 3, { size: 0.7, grav: -0.2 }); if (Math.random() < 0.35) G.say(pick(["High five!", "Yay, friends!", "Wheee!", "Best party EVER!", "Let's dance!"]), best.x, best.y - r * 1.4, 1); return; }
      this.invite(G); },
    update(G, dt) { const s = G.s; s.spin += dt * (s.party > 0 ? 1.4 : 0.4); for (const fr of s.f) { if (fr.t < 1) fr.t = Math.min(1, fr.t + dt * 1.2); fr.hi = Math.max(0, fr.hi - dt * 1.5); }
      if (s.party > 0) { s.party -= dt; if ((s.nt -= dt) <= 0) { s.nt = 0.2; const n = [0, 4, 7, 4, 9, 7, 4, 2, 0, 4, 7, 12, 11, 7, 4, 0][s.nk++ % 16]; SFX.note(n); } if (Math.random() < 0.6) G.dots(rnd(0, G.W), -G.u, ["#ff5d8f", "#ffe066", "#7cffb0", "#6ec6ff", "#b18cff"], 2); } },
    autoTick(G) { this.invite(G); G.burst(G.u * 6, G.H * 0.4, "🕊️", 1, { size: 0.7, grav: -0.3 }); },
    draw(G, g) { const s = G.s, c = this.C(G), r = this.size(G), par = s.party > 0, mood = par ? "joy" : "happy";
      if (par) { g.save(); g.translate(G.cx, -G.u * 2); for (let i = 0; i < 6; i++) { const a = Math.sin(G.t * 1.5 + i) * 0.6; g.save(); g.rotate(a); g.globalAlpha = 0.18; g.fillStyle = R7[i]; g.beginPath(); g.moveTo(0, 0); g.lineTo(-G.u * 10, G.H * 1.2); g.lineTo(G.u * 10, G.H * 1.2); g.fill(); g.restore(); } g.restore(); E(g, "🪩", G.cx, G.u * 15, G.u * 9, G.t * 2); }
      oval(g, c.x, c.y + r * 0.6, c.R * 1.18, c.R * 0.6, par ? `hsla(${(G.t * 90) % 360},90%,80%,.55)` : "rgba(255,200,140,.45)", "rgba(74,42,26,.3)", 3);
      for (let i = 0; i < 12; i++) twinkle(g, c.x + Math.cos(i * 0.52 + G.t * 0.3) * c.R * 0.9, c.y + r * 0.6 + Math.sin(i * 0.52 + G.t * 0.3) * c.R * 0.46, G.u * (par ? 1.4 : 0.8) * (0.5 + Math.sin(G.t * 4 + i) * 0.5), "#fff");
      const P = this.pos(G);
      // holding hands
      for (const m of [0, 1]) { const ring = P.filter((q) => q.m === m && q.fr.t >= 1), n = ring.length; if (n < 2) continue; for (let i = 0; i < (n > 2 ? n : 1); i++) { const a = ring[i], b = ring[(i + 1) % n]; for (const [w, col] of [[G.u * 1.4, INK], [G.u * 0.8, R7[(i + m * 3) % 7]]]) { g.strokeStyle = col; g.lineWidth = w; g.lineCap = "round"; g.beginPath(); g.moveTo(a.x, a.y + r * 0.2); g.quadraticCurveTo((a.x + b.x) / 2, (a.y + b.y) / 2 + r * 0.45, b.x, b.y + r * 0.2); g.stroke(); } } }
      P.sort((a, b) => a.y - b.y); for (const q of P) this.drawPal(G, g, q.fr.p, q.x, q.y, r, q.fr.hi > 0 ? "joy" : q.fr.t < 1 ? "wow" : mood, q.tilt);
      // the cheering crowd
      const cs = Math.min(G.u * 3.4, G.W / 30); s.crowd.forEach((p, i) => this.drawPal(G, g, p, G.cx + (i - (s.crowd.length - 1) / 2) * cs * 2.6, G.u * 17 - (par ? Math.abs(Math.sin(G.t * 8 + i)) * G.u * 1.5 : 0), cs, "joy"));
      if (!par && s.f.length < 6) txt(g, "👆 Tap the middle to invite a friend!", c.x, c.y, G.u * 3.4, "#ff5d8f", { stroke: "#fff" });
      txt(g, par ? `🎉 Giant Dance Party: ${this.STYLES[s.style]}! 🎉` : `🤝 Friends dancing: ${s.f.length + s.crowd.length} · parties: ${s.parties}`, G.cx, G.u * 5.5, G.u * 3.6, "#fff", { stroke: INK }); },
    hot(G) { const c = this.C(G); return { x: c.x, y: c.y }; },
  },
];
