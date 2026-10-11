// ==========================================================================
//  Emmy's Pizza Plus — clicker games, part 9: moons, magic & outer space.
//  Mythic, Magical, Cosmic and Galactic — fancy, sparkly and very gentle.
// ==========================================================================
import { E, circ, oval, rr, txt, bar, face, pizza, slice, rnd, pick, clamp, dist, INK } from "./clicker.js";
import { SFX } from "./audio.js";

const RAINBOW = ["#ff5d8f", "#ffb347", "#ffe066", "#7cffb0", "#6ec6ff", "#b18cff"];
const lerp = (a, b, t) => a + (b - a) * t;
const stars = (G, g, n = 50, speed = 4) => { for (let i = 0; i < n; i++) { const tw = 0.5 + Math.sin(G.t * 3 + i) * 0.5; circ(g, (i * 137.5 + i * i * 13.7) % G.W, (i * 71.3 + G.t * speed * (1 + (i % 3))) % G.H, G.u * (0.25 + (i % 3) * 0.2) * (0.6 + tw * 0.6), "#fff", null); } };
const glow = (g, x, y, r, c, a = 0.5) => { const gr = g.createRadialGradient(x, y, 0, x, y, Math.max(1, r)); gr.addColorStop(0, c); gr.addColorStop(1, c + "00"); g.save(); g.globalAlpha *= a; g.fillStyle = gr; g.fillRect(x - r, y - r, r * 2, r * 2); g.restore(); };
const hdr = (G, g, s) => txt(g, s, G.cx, G.u * 7, G.u * 4, "#fff", { stroke: INK });
const meter = (G, g, frac, col, label) => { bar(g, G.cx - G.u * 24, G.u * 4, G.u * 48, G.u * 5, frac, col); txt(g, label, G.cx, G.u * 13, G.u * 3.6, "#fff", { stroke: INK }); };
const mood = (t) => (t > 0 ? "joy" : "happy");

export const GAMES_I = [
  // ------------------------------------------------------------------------
  //  MYTHIC
  // ------------------------------------------------------------------------
  {
    id: "moonbakery", name: "Moon Bunny Bakery", rar: "mythic", ico: "🐰", unit: "moon pizzas", base: 8, bg: ["#0b0a2a", "#2d2563"], noDots: true,
    blurb: "Bunnies bake pizzas in moon craters! Tap the moon-dough to knead it. When it's ready — WHOOSH — it zooms down to Earth. Send 5 for a MOON PARTY!",
    ups: [["tap", "Bouncy Rolling Pin", "🥖"], ["auto", "Baker Bunnies", "🐇"], ["mult", "Stardust Sprinkles", "🌟"]],
    win: ["Earth got its very first moon pizza!", "The bunnies wiggled their noses at you. That means thank you.", "Astronauts are lining up for a slice.", "The moon smells like cheese now. It always kind of did.", "The bunnies built a second crater oven!", "Earth sent a thank-you postcard. It's very big.", "There's a bunny pizza parade every full moon now.", "The bunnies made you an honorary bunny. Hop hop!", "Grand Moon Baker of the Whole Sky!"],
    NEED: 6,
    init(G) { Object.assign(G.s, { k: 0, sq: 0, fly: [], sent: 0, fed: 0, party: 0, joy: 0, peek: [0, 0], cheer: 0 }); },
    gy(G) { return G.H * 0.58; },
    dough(G) { return { x: G.cx, y: G.H * 0.73, r: Math.min(G.W * 0.13, G.u * 15) }; },
    earth(G) { return { x: G.W * 0.8, y: G.H * 0.22, r: G.u * 9 }; },
    side(G, i) { return { x: G.W * (i ? 0.88 : 0.12), y: G.H * 0.64 }; },
    baker(G) { const d = this.dough(G); return { x: d.x - d.r * 1.75, y: d.y - d.r * 0.5 }; },
    down(G, x, y) { const s = G.s, d = this.dough(G), e = this.earth(G);
      if (dist(x, y, d.x, d.y) < d.r * 1.5) { this.knead(G, x, y); return; }
      for (let i = 0; i < 2; i++) { const p = this.side(G, i); if (dist(x, y, p.x, p.y - G.u * 3) < G.u * 9) { s.peek[i] = 1.2; G.add(1, p.x, p.y - G.u * 8, { color: "#ffd6e8" }); SFX.giggle(); G.say(pick(["Hi hi!", "Hop hop!", "Moon hugs!", "Wanna carrot?"]), p.x, p.y - G.u * 12, 1); return; } }
      if (dist(x, y, e.x, e.y) < e.r * 1.4) { s.joy = 0.6; G.add(1, x, y, { color: "#7cd8ff" }); SFX.sparkle(); G.say("Hello, Moon!", e.x, e.y - e.r * 1.3, 1); return; }
      if (s.party > 0) { this.knead(G, x, y); return; }
      SFX.boop(); G.dots(x, y, ["#fff", "#cfd6ff"], 4); },
    knead(G, x, y) { const s = G.s; s.sq = 0.25; s.k++; G.add(1, x, y, { color: "#fff3c4" }); G.tone(300 + s.k * 70, 0.09, { type: "triangle", vol: 0.1, slideTo: 200 + s.k * 70 }); G.dots(x, y, ["#fff", "#f6e7c8"], 4);
      if (s.k >= (s.party > 0 ? 2 : this.NEED)) this.launch(G); },
    launch(G) { const s = G.s, d = this.dough(G); s.k = 0; s.cheer = 0.8; s.sent++; s.fly.push({ t: 0, x0: d.x, y0: d.y }); G.add(4, d.x, d.y - d.r, { color: "#ffd23f" }); SFX.whoosh(); G.burst(d.x, d.y, ["✨", "⭐"], 6, { grav: -0.2 }); },
    land(G) { const s = G.s, e = this.earth(G); s.joy = 0.8; s.fed++; G.add(8, e.x, e.y - e.r, { color: "#7cffb0" }); SFX.coin(); G.burst(e.x, e.y, ["🍕", "💖", "✨"], 6);
      if (s.fed % 5 === 0) { s.party = 7; G.add(40, G.cx, G.H * 0.4, { color: "#ffd23f", noCrit: true }); SFX.wow(); G.flash("#fff6c8"); G.float("🌕 MOON PARTY!", G.cx, G.u * 22, "#ffd23f", 1.2); } },
    flyPos(G, f) { const e = this.earth(G), t = f.t; return { x: lerp(f.x0, e.x, t), y: lerp(f.y0, e.y, t) - Math.sin(t * Math.PI) * G.H * 0.16 }; },
    update(G, dt) { const s = G.s; s.sq = Math.max(0, s.sq - dt); s.joy = Math.max(0, s.joy - dt); s.cheer = Math.max(0, s.cheer - dt); s.party = Math.max(0, s.party - dt); s.peek = s.peek.map((v) => Math.max(0, v - dt));
      for (let i = s.fly.length - 1; i >= 0; i--) { const f = s.fly[i]; f.t += dt * 0.85; if (f.t >= 1) { s.fly.splice(i, 1); this.land(G); } } },
    autoTick(G) { const d = this.dough(G); this.knead(G, d.x, d.y - d.r * 0.3); },
    draw(G, g) { const s = G.s, d = this.dough(G), e = this.earth(G), gy = this.gy(G), kf = s.k / this.NEED, P = s.party > 0, b = this.baker(G);
      stars(G, g, 70, 0.5);
      glow(g, e.x, e.y, e.r * 2.2, "#7cd8ff", 0.55); circ(g, e.x, e.y, e.r, "#3fa4ff", null);
      g.save(); g.beginPath(); g.arc(e.x, e.y, e.r, 0, 7); g.clip(); for (const [dx, dy, r] of [[-0.45, -0.35, 0.45], [0.5, 0.2, 0.42], [0.05, 0.75, 0.32]]) circ(g, e.x + dx * e.r, e.y + dy * e.r, r * e.r, "#5fd36a", null); g.restore();
      circ(g, e.x, e.y, e.r, null); face(g, e.x, e.y + e.r * 0.05, e.r * 0.55, mood(s.joy));
      // the moon's surface
      const gr = g.createLinearGradient(0, gy, 0, G.H); gr.addColorStop(0, "#e2e4f0"); gr.addColorStop(1, "#9ea2bf"); g.fillStyle = gr; g.beginPath(); g.moveTo(0, gy);
      for (let x = 0; x <= G.W + 20; x += 20) g.lineTo(x, gy + Math.sin(x * 0.02) * G.u * 1.5); g.lineTo(G.W, G.H); g.lineTo(0, G.H); g.closePath(); g.fill(); g.strokeStyle = INK; g.lineWidth = 3; g.stroke();
      for (const [fx, fy, fr] of [[0.3, 0.9, 5], [0.7, 0.92, 4], [0.42, 0.62, 2.5], [0.62, 0.64, 3], [0.06, 0.82, 3.5], [0.94, 0.86, 3]]) oval(g, fx * G.W, fy * G.H, G.u * fr, G.u * fr * 0.35, "#b9bcd3", "rgba(74,42,26,.4)", 2);
      if (P) for (let i = 0; i < 5; i++) E(g, "🐇", ((i * 0.23 + G.t * 0.08) % 1) * G.W, gy + G.u * 8 - Math.abs(Math.sin(G.t * 4 + i)) * G.u * 10, G.u * 7, 0, 1, -1, 1);
      // peeking bunnies in their little craters
      for (let i = 0; i < 2; i++) { const p = this.side(G, i), h = s.peek[i] > 0 ? G.u * 8 : G.u * 3.5 + Math.sin(G.t * 2 + i * 2) * G.u;
        oval(g, p.x, p.y, G.u * 8, G.u * 2.8, "#7d809c");
        g.save(); g.beginPath(); g.rect(p.x - G.u * 12, p.y - G.u * 30, G.u * 24, G.u * 30); g.clip(); E(g, "🐰", p.x, p.y + G.u * 3 - h, G.u * 9); g.restore();
        g.beginPath(); g.ellipse(p.x, p.y, G.u * 8, G.u * 2.8, 0, 0, Math.PI); g.fillStyle = "#c9cce0"; g.fill(); g.strokeStyle = INK; g.lineWidth = 3; g.stroke();
        if (s.peek[i] > 0) E(g, "👋", p.x + G.u * 6, p.y - h - G.u * 2, G.u * 5, Math.sin(G.t * 14) * 0.4); }
      // the crater oven
      glow(g, d.x, d.y, d.r * 1.8, "#ffb347", P ? 0.8 : 0.5);
      oval(g, d.x, d.y + d.r * 0.1, d.r * 1.4, d.r * 0.55, "#7d809c"); oval(g, d.x, d.y + d.r * 0.15, d.r * 1.15, d.r * 0.4, "#ff9a52", null);
      g.save(); g.translate(d.x, d.y - d.r * 0.05); g.scale(1 + s.sq * 0.8, (kf < 0.5 ? 0.75 : 0.5) * (1 - s.sq * 0.8));
      if (kf < 0.5) { circ(g, 0, 0, d.r * (0.55 + kf * 0.6), "#f6e7c8"); for (let i = 0; i < 4; i++) circ(g, Math.cos(i * 1.7) * d.r * 0.3, Math.sin(i * 1.7) * d.r * 0.25, d.r * 0.05, "#fff", null); }
      else pizza(g, 0, 0, d.r * 0.85, { cheese: kf >= 0.66, peps: kf >= 0.83 ? 7 : 0 });
      g.restore();
      bar(g, d.x - d.r, d.y + d.r * 0.7, d.r * 2, G.u * 2.8, P ? 1 : kf, "#ffd23f");
      // the baker bunny with a chef hat
      const by = b.y - s.sq * G.u * 8 - (s.cheer > 0 ? Math.abs(Math.sin(s.cheer * 12)) * G.u * 4 : 0) - (P ? Math.abs(Math.sin(G.t * 6)) * G.u * 3 : 0);
      E(g, "🐰", b.x, by, G.u * 13); const hy = by - G.u * 7.5; for (const dx of [-2, 0, 2]) circ(g, b.x + dx * G.u, hy - G.u * 1.5, G.u * 2.3, "#fff"); rr(g, b.x - G.u * 3, hy - G.u * 0.5, G.u * 6, G.u * 2.6, G.u * 0.8, "#fff");
      if (s.cheer > 0) E(g, "🎉", b.x + G.u * 7, by - G.u * 4, G.u * 6);
      for (const f of s.fly) { const p = this.flyPos(G, f); glow(g, p.x, p.y, G.u * 7, "#ffe066", 0.6); pizza(g, p.x, p.y, G.u * 4, { rot: G.t * 6, peps: 5 }); }
      if (P) hdr(G, g, `🌕 MOON PARTY! Knead fast! ${Math.ceil(s.party)}s`);
      else meter(G, g, (s.fed % 5) / 5, "#7cd8ff", `🌍 Earth's tummy · pizzas sent: ${s.sent}`); },
    hot(G) { return this.dough(G); },
  },

  // ------------------------------------------------------------------------
  //  MAGICAL
  // ------------------------------------------------------------------------
  {
    id: "potion", name: "Pizza Potion Lab", rar: "magical", ico: "🧪", unit: "potions", base: 9, bg: ["#241040", "#4f2d7a"], noDots: true,
    blurb: "Pour coloured potions into the bubbling cauldron and watch silly magic happen! Follow the recipe card at the top for MEGA MAGIC.",
    ups: [["tap", "Bigger Ladle", "🥄"], ["auto", "Lab Frogs", "🐸"], ["crit", "Four-Leaf Fizz", "🍀"]],
    win: ["Your first potion! It smells like pepperoni.", "A pizza flew past the window. Totally normal.", "The cat refuses to take off her top hat now.", "The cauldron burped a rainbow. Excuse me!", "Wizards are asking for your recipes.", "The chicken wants to ride the bubble again. And again.", "The puppy won a roller skating trophy!", "Your potions made the moon giggle.", "Grand Wizard of Pizza Potions!"],
    POTS: [{ c: "#ff6fa8", fx: "wings", say: "The pizza grew WINGS!" }, { c: "#7cffb0", fx: "hat", say: "Kitty got a top hat!" }, { c: "#6ec6ff", fx: "bubble", say: "Chicken bubble ride!" }, { c: "#ffd84a", fx: "skate", say: "Puppy roller skates!" }],
    init(G) { Object.assign(G.s, { drops: [], fx: [], rec: this.recipe(), ri: 0, liq: "#7cffb0", stir: 0, megas: 0, mega: 0, tilt: [0, 0, 0, 0] }); },
    recipe() { const r = []; while (r.length < 3) { const n = Math.floor(Math.random() * 4); if (n !== r[r.length - 1]) r.push(n); } return r; },
    pot(G) { return { x: G.cx, y: G.H * 0.66, r: Math.min(G.W * 0.18, G.u * 19) }; },
    bottle(G, i) { const p = this.pot(G); return { x: G.cx + (i < 2 ? -1 : 1) * p.r * 1.65, y: G.H * (i % 2 ? 0.8 : 0.58), r: G.u * 5.5 }; },
    pour(G, i) { const s = G.s, b = this.bottle(G, i); s.drops.push({ i, t: 0, x0: b.x, y0: b.y - b.r * 1.6 }); s.tilt[i] = 0.5; G.tone(500, 0.18, { type: "sine", vol: 0.1, slideTo: 250 }); },
    mix(G, i) { const s = G.s, P = this.POTS[i], p = this.pot(G), good = s.rec[s.ri] === i; s.liq = P.c; s.stir = 0.5;
      G.add(good ? 6 : 3, p.x, p.y - p.r * 0.7, { color: P.c }); SFX.fizz(); G.dots(p.x, p.y - p.r * 0.6, [P.c, "#fff"], 10); this.spawnFx(G, P.fx); if (G.t - (s.said || -9) > 1.2) { s.said = G.t; G.float(P.say, G.cx, G.H * 0.47, P.c, 0.85); }
      if (!good) return; s.ri++; SFX.ding();
      if (s.ri >= 3) { s.ri = 0; s.rec = this.recipe(); s.megas++; s.mega = 3; G.add(40, G.cx, G.H * 0.4, { color: "#ffd23f", noCrit: true }); SFX.wow(); G.flash("#f3d9ff"); G.float("✨ MEGA MAGIC! ✨", G.cx, G.u * 24, "#ffd23f", 1.3); for (const Q of this.POTS) this.spawnFx(G, Q.fx); G.burst(p.x, p.y - p.r, ["🌈", "✨", "⭐", "🍕"], 18); } },
    spawnFx(G, k) { G.s.fx = G.s.fx.filter((f) => f.k !== k); G.s.fx.push({ k, t: 0 }); },
    down(G, x, y) { const s = G.s, p = this.pot(G);
      for (let i = 0; i < 4; i++) { const b = this.bottle(G, i); if (dist(x, y, b.x, b.y - b.r * 0.4) < b.r * 1.9) { this.pour(G, i); return; } }
      if (dist(x, y, p.x, p.y) < p.r * 1.2) { s.stir = 0.5; G.add(1, x, y, { color: s.liq }); SFX.pop(0.7); G.dots(p.x, p.y - p.r * 0.6, [s.liq, "#fff"], 6); return; }
      SFX.boop(); G.dots(x, y, ["#fff", "#e7c8ff"], 4); },
    update(G, dt) { const s = G.s; s.stir = Math.max(0, s.stir - dt); s.mega = Math.max(0, s.mega - dt); s.tilt = s.tilt.map((v) => Math.max(0, v - dt));
      for (let i = s.drops.length - 1; i >= 0; i--) { const d = s.drops[i]; d.t += dt * 2.6; if (d.t >= 1) { s.drops.splice(i, 1); this.mix(G, d.i); } }
      for (const f of s.fx) f.t += dt; s.fx = s.fx.filter((f) => f.t < 3.2);
      if (s.fx.some((f) => f.k === "hat" && f.t > 0.6 && !f.said)) { const f = s.fx.find((f) => f.k === "hat"); f.said = true; G.say("Ooh, fancy!", G.W * 0.18, G.H * 0.26, 1.2); SFX.meow(); } },
    autoTick(G) { this.pour(G, G.s.rec[G.s.ri]); },
    drawBottle(G, g, i, hi) { const b = this.bottle(G, i), c = this.POTS[i].c, r = b.r; g.save(); g.translate(b.x, b.y); g.rotate(G.s.tilt[i] * (i < 2 ? 1.2 : -1.2));
      if (hi) { glow(g, 0, -r * 0.3, r * 3, "#ffe066", 0.5 + Math.sin(G.t * 6) * 0.25); }
      rr(g, -r * 0.35, -r * 1.9, r * 0.7, r * 1.2, r * 0.2, "rgba(255,255,255,.35)"); rr(g, -r * 0.42, -r * 2.25, r * 0.84, r * 0.45, r * 0.15, "#c98a5a");
      circ(g, 0, 0, r, "rgba(255,255,255,.3)"); g.save(); g.beginPath(); g.arc(0, 0, r - 2, 0, 7); g.clip(); g.fillStyle = c; g.fillRect(-r, -r * 0.2 + Math.sin(G.t * 3 + i) * r * 0.06, r * 2, r * 2); g.restore(); circ(g, 0, 0, r, null);
      circ(g, -r * 0.4, -r * 0.35, r * 0.18, "rgba(255,255,255,.85)", null); g.restore(); },
    draw(G, g) { const s = G.s, p = this.pot(G), R = p.r, rimY = p.y - R * 0.55;
      for (let i = 0; i < 30; i++) circ(g, (i * 137.5) % G.W, (i * 71.3) % (G.H * 0.5), G.u * 0.4 * (0.5 + 0.5 * Math.sin(G.t * 2 + i)), "#fff", null);
      rr(g, -10, G.H * 0.9, G.W + 20, G.H * 0.2, 0, "#3a2350", null);
      // silly magic happening above the cauldron
      for (const f of s.fx) { const t = f.t, a = clamp(Math.min(t * 4, (3.2 - t) * 3), 0, 1); g.save(); g.globalAlpha = a;
        if (f.k === "wings") { const x = lerp(-G.u * 10, G.W + G.u * 10, t / 3.2), y = G.H * 0.3 + Math.sin(t * 6) * G.u * 3, fl = Math.sin(t * 22) * 0.5; for (const sd of [-1, 1]) oval(g, x + sd * G.u * 7, y - G.u * 2, G.u * 6, G.u * 2.6, "#fff", INK, 3, sd * (0.4 + fl)); pizza(g, x, y, G.u * 6, { peps: 5, rot: t }); }
        if (f.k === "hat") { const cx = G.W * 0.18, cy = G.H * 0.38; E(g, "🐱", cx, cy, G.u * 13); E(g, "🎩", cx, lerp(G.H * 0.05, cy - G.u * 8, Math.min(1, t * 2)), G.u * 8, Math.sin(t * 4) * 0.1); if (t > 0.5) E(g, "✨", cx + G.u * 8, cy - G.u * 8, G.u * 5, 0, 0.5 + Math.sin(G.t * 8) * 0.5); }
        if (f.k === "bubble") { const x = G.cx + Math.sin(t * 3) * G.u * 8, y = lerp(rimY - G.u * 4, G.H * 0.2, Math.min(1, t / 2.5)); E(g, "🐔", x, y, G.u * 9); circ(g, x, y, G.u * 8, "rgba(190,235,255,.25)", "rgba(255,255,255,.85)", 3); circ(g, x - G.u * 3, y - G.u * 3.5, G.u * 1.3, "rgba(255,255,255,.9)", null); }
        if (f.k === "skate") { const x = G.W * 0.82 + Math.sin(t * 3) * G.W * 0.07, y = G.H * 0.38; E(g, "🐶", x, y, G.u * 12, Math.cos(t * 3) * 0.15); E(g, "🛼", x - G.u * 3, y + G.u * 7, G.u * 5); E(g, "🛼", x + G.u * 3, y + G.u * 7, G.u * 5); }
        g.restore(); }
      // the cauldron
      E(g, "🔥", p.x - R * 0.4, p.y + R * 0.85, R * 0.4, 0, 0.9); E(g, "🔥", p.x + R * 0.4, p.y + R * 0.85, R * 0.4, 0, 0.9);
      glow(g, p.x, rimY, R * 1.6, s.liq, 0.45 + (s.mega > 0 ? 0.4 : 0));
      for (const sd of [-1, 1]) rr(g, p.x + sd * R * 0.55 - R * 0.08, p.y + R * 0.6, R * 0.16, R * 0.35, R * 0.06, "#2a2438");
      circ(g, p.x, p.y, R, "#3b3350"); circ(g, p.x - R * 0.45, p.y - R * 0.1, R * 0.12, "rgba(255,255,255,.2)", null);
      oval(g, p.x, rimY, R * 1.05, R * 0.3, "#4c4366"); oval(g, p.x, rimY, R * 0.88, R * 0.22, s.liq, null);
      for (let i = 0; i < 6; i++) { const ph = (G.t * (1.2 + s.stir * 3) + i * 0.37) % 1, bx = p.x + Math.sin(i * 2.3) * R * 0.6; circ(g, bx, rimY - ph * R * 0.5, R * (0.04 + ph * 0.06), "rgba(255,255,255,.6)", null); }
      if (s.stir > 0) E(g, "🥄", p.x + Math.cos(G.t * 12) * R * 0.4, rimY - R * 0.2 + Math.sin(G.t * 12) * R * 0.08, R * 0.5, 0.5);
      // bottles
      for (const d of s.drops) { const b = d; const x = lerp(b.x0, p.x, d.t), y = lerp(b.y0, rimY, d.t) - Math.sin(d.t * Math.PI) * G.u * 12; circ(g, x, y, G.u * 2, this.POTS[d.i].c); }
      for (let i = 0; i < 4; i++) this.drawBottle(G, g, i, s.rec[s.ri] === i);
      // recipe card
      const cw = G.u * 40, cx0 = G.cx - cw / 2, cy0 = G.u * 11; rr(g, cx0, cy0, cw, G.u * 9, G.u * 2, "#fff6e0", INK, 3); txt(g, "Recipe:", cx0 + G.u * 8, cy0 + G.u * 4.5, G.u * 3.2, INK);
      for (let j = 0; j < 3; j++) { const x = cx0 + G.u * 19 + j * G.u * 8, y = cy0 + G.u * 4.5; circ(g, x, y, G.u * (j === s.ri ? 3 + Math.sin(G.t * 6) * 0.4 : 2.6), this.POTS[s.rec[j]].c); if (j < s.ri) txt(g, "✓", x, y, G.u * 3.6, INK); }
      hdr(G, g, `🧪 Potion Lab · mega magic: ${s.megas}`); },
    hot(G) { const b = this.bottle(G, G.s.rec[G.s.ri]); return { x: b.x, y: b.y }; },
  },
  {
    id: "sheep", name: "Dreamy Sheep", rar: "magical", ico: "🐑", unit: "sheep", base: 9, bg: ["#1a1f52", "#4b3f8f"], noDots: true,
    blurb: "Shhh, it's sleepy time! Fluffy sheep trot up to the pizza fence. Tap to help each one HOP over. Count 10 sheep to fill the dream bubble!",
    ups: [["tap", "Extra Fluffy Wool", "☁️"], ["auto", "Night Owls", "🦉"], ["mult", "Warm Milk", "🥛"]],
    win: ["One sheep, two sheep... yawn!", "The sheep think the pizza fence is delicious.", "A sheep did a backflip! Ta-da!", "The dream bubble is full of pizza clouds.", "The sheep knitted you a cozy scarf.", "The moon is counting sheep too now.", "You dreamed of a pizza made of marshmallows!", "The sheep sing you a lullaby every night.", "Champion Sheep Counter of Dreamland!"],
    init(G) { Object.assign(G.s, { sh: [{ x: G.W * 0.2, h: -1, over: false, ph: 0, pet: 0 }], spawn: 0.6, count: 0, dream: 0, bub: 0, dreams: 0 }); },
    gy(G) { return G.H * 0.78; },
    fence(G) { return { x: G.W * 0.55, y: this.gy(G) }; },
    hopper(G) { return G.s.sh.filter((q) => q.h < 0 && !q.over).sort((a, b) => b.x - a.x)[0]; },
    bubble(G) { return { x: G.W * 0.77, y: G.H * 0.26, r: Math.min(G.W * 0.17, G.u * 15) }; },
    sy(G, q) { return this.gy(G) - G.u * 6 - (q.h >= 0 ? Math.sin(Math.min(1, q.h) * Math.PI) * G.u * 22 : Math.abs(Math.sin(q.ph)) * G.u * 0.8) - (G.s.dream > 0 ? G.u * 2 + Math.sin(q.ph * 0.5) * G.u * 2 : 0); },
    hop(G, q) { q.h = 0; q.hx = q.x; SFX.boing(); G.add(1, q.x, this.sy(G, q) - G.u * 6, { color: "#fff" }); },
    counted(G) { const s = G.s, f = this.fence(G); s.count++; G.add(s.dream > 0 ? 12 : 5, f.x + G.u * 12, f.y - G.u * 22, { color: "#ffe8a8" }); SFX.note(s.count % 12); G.float(`🐑 ${s.count}!`, f.x, f.y - G.u * 32, "#fff", 0.9);
      if (s.dream > 0) return; s.bub++; if (s.bub >= 10) { s.bub = 0; s.dream = 8; s.dreams++; G.add(40, G.cx, G.H * 0.4, { color: "#ffd23f", noCrit: true }); SFX.wow(); G.flash("#ffe6ff"); G.float("💭 SWEET DREAMS MODE!", G.cx, G.u * 22, "#ffd6ff", 1.2); } },
    down(G, x, y) { const s = G.s, f = this.fence(G);
      const tq = s.sh.find((q) => (q.over || q.h >= 0) && dist(x, y, q.x, this.sy(G, q)) < G.u * 8); if (tq) { tq.pet = 0.6; G.add(1, x, y, { color: "#ffd6e8" }); G.tone(420, 0.3, { type: "sawtooth", vol: 0.05, slideTo: 380 }); G.burst(x, y - G.u * 4, "💖", 2, { size: 0.6, grav: -0.3 }); return; }
      const q = this.hopper(G); if (q && q.x > 0) { this.hop(G, q); return; }
      SFX.boop(); G.dots(x, y, ["#fff", "#ffe8a8"], 5); },
    update(G, dt) { const s = G.s, f = this.fence(G), D = s.dream > 0, sp = G.u * (D ? 26 : 16); s.dream = Math.max(0, s.dream - dt);
      if ((s.spawn -= dt) <= 0) { s.spawn = D ? 0.8 : 1.7; if (s.sh.filter((q) => !q.over).length < 5) s.sh.push({ x: -G.u * 10, h: -1, over: false, ph: rnd(0, 6), pet: 0 }); }
      s.sh.filter((q) => q.h < 0 && !q.over).sort((a, b) => b.x - a.x).forEach((q, i) => { const lim = f.x - G.u * 11 - i * G.u * 13; if (q.x < lim) q.x = Math.min(lim, q.x + sp * dt); });
      for (const q of s.sh) { q.ph += dt * 7; q.pet = Math.max(0, q.pet - dt);
        if (q.h >= 0) { q.h += dt * (D ? 1.8 : 1.4); q.x = lerp(q.hx, f.x + G.u * 12, Math.min(1, q.h)); if (q.h >= 1) { q.h = -1; q.over = true; this.counted(G); } }
        else if (q.over) q.x += sp * dt; }
      if (D) { const q = this.hopper(G); if (q && q.x >= f.x - G.u * 12 && Math.random() < dt * 3) this.hop(G, q); }
      s.sh = s.sh.filter((q) => q.x < G.W + G.u * 12); },
    autoTick(G) { const q = this.hopper(G); if (q && q.x > 0) this.hop(G, q); },
    drawSheep(G, g, q) { const x = q.x, y = this.sy(G, q), r = G.u * 5, up = q.h >= 0 || q.pet > 0, D = G.s.dream > 0;
      if (D) for (const sd of [-1, 1]) oval(g, x - r * 0.2 + sd * r * 0.3, y - r * 0.9, r * 0.7, r * 0.3, "#fffaf0", INK, 2, sd * (0.6 + Math.sin(G.t * 12) * 0.3));
      g.strokeStyle = INK; g.lineWidth = Math.max(2, r * 0.18); g.lineCap = "round"; for (const lx of [-0.5, -0.15, 0.25, 0.55]) { g.beginPath(); g.moveTo(x + lx * r, y + r * 0.3); g.lineTo(x + lx * r + (q.h >= 0 ? r * 0.3 : 0), y + r * (q.h >= 0 ? 0.9 : 1.1)); g.stroke(); }
      const puffs = [[-0.6, 0], [-0.25, -0.35], [0.2, -0.38], [0.5, -0.05], [0.15, 0.25], [-0.3, 0.25]];
      for (const [px, py] of puffs) circ(g, x + px * r, y + py * r, r * 0.55, "#fff", INK, 3); for (const [px, py] of puffs) circ(g, x + px * r, y + py * r, r * 0.5, D ? "#fff3fb" : "#fff", null);
      oval(g, x + r * 0.95, y - r * 0.25, r * 0.48, r * 0.42, "#f5e3d6"); for (const sd of [-1, 1]) oval(g, x + r * 0.95 + sd * r * 0.45, y - r * 0.45, r * 0.22, r * 0.1, "#f5e3d6", INK, 2, sd * 0.4);
      face(g, x + r * 0.97, y - r * 0.22, r * 0.38, up ? "joy" : D ? "sleep" : "happy"); },
    draw(G, g) { const s = G.s, f = this.fence(G), gy = this.gy(G), D = s.dream > 0, B = this.bubble(G);
      if (D) { g.globalAlpha = 0.35; for (let i = 0; i < 6; i++) { g.fillStyle = RAINBOW[i]; g.fillRect(0, (i / 6) * G.H * 0.75, G.W, G.H * 0.13); } g.globalAlpha = 1; }
      stars(G, g, 60, 0.4);
      const mx = G.W * 0.13, my = G.H * 0.2; glow(g, mx, my, G.u * 18, "#fff3b0", 0.5); circ(g, mx, my, G.u * 8, "#fff3b0"); face(g, mx, my, G.u * 5, "sleep");
      E(g, "💤", mx + G.u * 10, my - G.u * 8 - Math.sin(G.t * 2) * G.u, G.u * 5);
      for (let i = 0; i < 3; i++) { const cx = ((i * 0.37 + G.t * 0.015) % 1.3) * G.W - G.W * 0.15, cy = G.H * (0.42 + (i % 2) * 0.08); for (const [dx, r] of [[-1, 0.7], [0, 1], [1, 0.75]]) circ(g, cx + dx * G.u * 5, cy, G.u * 4 * r, "rgba(255,255,255,.18)", null); }
      // dream bubble
      for (const [dx, dy, r] of [[-0.95, 0.95, 0.12], [-0.75, 0.75, 0.18]]) circ(g, B.x + dx * B.r, B.y + dy * B.r, B.r * r, "#fffaf0", INK, 3);
      for (let i = 0; i < 8; i++) { const a = (i / 8) * Math.PI * 2; circ(g, B.x + Math.cos(a) * B.r * 0.62, B.y + Math.sin(a) * B.r * 0.48, B.r * 0.42, "#fffaf0", INK, 3); }
      for (let i = 0; i < 8; i++) { const a = (i / 8) * Math.PI * 2; circ(g, B.x + Math.cos(a) * B.r * 0.62, B.y + Math.sin(a) * B.r * 0.48, B.r * 0.37, "#fffaf0", null); } oval(g, B.x, B.y, B.r * 0.8, B.r * 0.6, "#fffaf0", null);
      if (D) { pizza(g, B.x, B.y, B.r * 0.45, { rot: G.t, peps: 6 }); E(g, "🌈", B.x + B.r * 0.55, B.y - B.r * 0.4, B.r * 0.4); E(g, "🐑", B.x - B.r * 0.6, B.y + B.r * 0.2, B.r * 0.35, Math.sin(G.t * 3) * 0.2); }
      else for (let j = 0; j < 10; j++) { const x = B.x + ((j % 5) - 2) * B.r * 0.27, y = B.y + (j < 5 ? -0.17 : 0.17) * B.r; if (j < s.bub) E(g, "⭐", x, y, B.r * 0.24, 0, 1, 1 + Math.sin(G.t * 5 + j) * 0.1); else circ(g, x, y, B.r * 0.06, "rgba(74,42,26,.25)", null); }
      // the cozy hill
      g.fillStyle = "#2f6a52"; g.beginPath(); g.moveTo(0, gy - G.u * 2); g.quadraticCurveTo(G.cx, gy - G.u * 9, G.W, gy - G.u * 2); g.lineTo(G.W, G.H); g.lineTo(0, G.H); g.closePath(); g.fill(); g.strokeStyle = INK; g.lineWidth = 3; g.stroke();
      for (let i = 0; i < 9; i++) E(g, "🌼", ((i * 0.113 + 0.03) % 1) * G.W, gy + G.u * (5 + (i % 3) * 3), G.u * 3);
      E(g, "🛏️", G.W * 0.9, gy - G.u * 4, G.u * 12); E(g, "😴", G.W * 0.9, gy - G.u * 11, G.u * 6);
      // pizza-slice fence
      const L = G.u * 12; rr(g, f.x - L * 0.95, f.y - L * 0.55, L * 1.9, L * 0.16, L * 0.08, "#e8b26a", INK, 3); for (const dx of [-0.5, 0.5]) slice(g, f.x + dx * L * 0.88, f.y + L * 0.05, L, { peps: 3 });
      for (const q of s.sh) this.drawSheep(G, g, q);
      if (D) hdr(G, g, `💭 SWEET DREAMS! Sheep fly! ${Math.ceil(s.dream)}s`);
      else meter(G, g, s.bub / 10, "#c9b6ff", `💭 Dream bubble · sheep counted: ${s.count}`); },
    hot(G) { const q = this.hopper(G); return q ? { x: q.x, y: this.sy(G, q) } : { x: G.cx, y: G.cy }; },
  },
  {
    id: "magichat", name: "Magic Hat Trick", rar: "magical", ico: "🎩", unit: "tricks", base: 9, bg: ["#2a0c26", "#6b1a45"], noDots: true,
    blurb: "Ta-da! Tap the top hat to pull out surprises — bunnies, doves, pizzas and scarves that never end! Tap when the star is on TOP for extra magic. Fill the meter for a GRAND FINALE!",
    ups: [["tap", "Sparkly Wand", "🪄"], ["auto", "Assistant Bunnies", "🐰"], ["crit", "Abracadabra!", "🌟"]],
    win: ["Ta-da! The crowd goes wild!", "A dove brought you a tiny pizza.", "The scarves are now 3 miles long.", "The bunnies started their own magic show.", "Somebody pulled a chicken out of YOUR hat!", "The hat says thank you for not wearing it on your feet.", "Your magic show is sold out for a year.", "The Great Magician's Guild sent you a cape!", "The Most Magnificent Magician in the World!"],
    ITEMS: [["🐰", "A bunny!"], ["🕊️", "A dove!"], ["🍕", "A pizza!"], ["🐔", "A chicken?!"], ["💐", "Flowers!"], ["🦆", "A ducky!"], ["🎈", "Balloons!"], ["🧣", "Scarves!!"]],
    init(G) { Object.assign(G.s, { out: [], scarf: 0, sc: 0, meter: 0, fin: 0, fins: 0, wob: 0, tricks: 0, auto: 0 }); },
    hat(G) { return { x: G.cx, y: G.H * 0.6, w: Math.min(G.W * 0.2, G.u * 18) }; },
    floor(G) { return G.H * 0.8; },
    star(G) { const h = this.hat(G), a = G.t * 2.2; return { x: h.x + Math.cos(a) * h.w * 1.3, y: h.y - h.w * 0.4 + Math.sin(a) * h.w * 0.6, top: Math.sin(a) < -0.7 }; },
    trick(G, perfect, quiet) { const s = G.s, h = this.hat(G), [e, say] = pick(this.ITEMS), top = h.y - h.w * 0.4; s.wob = 0.35; s.tricks++;
      if (e === "🧣") { s.scarf = 1.8; s.sc = Math.floor(rnd(0, 6)); }
      else { const sd = Math.random() < 0.5 ? -1 : 1; s.out.push({ e, t: 0, y0: top, x: h.x, tx: clamp(h.x + sd * rnd(h.w * 1.5, G.W * 0.42), G.u * 6, G.W - G.u * 6), big: perfect, fly: e === "🕊️" || e === "🎈", pet: 0, fy: 0 });
        const land = s.out.filter((o) => !o.fly); if (land.length > 8) s.out.splice(s.out.indexOf(land[0]), 1); }
      G.add(perfect ? 9 : 3, h.x, top - G.u * 4, { color: perfect ? "#ffd23f" : "#fff" }); if (!quiet) G.float(say, h.x, top - h.w * 1.1, "#ffe8a8", 0.8);
      if (perfect) { SFX.sparkle(); G.burst(h.x, top, ["✨", "⭐"], 10, { grav: -0.2 }); } else { SFX.pop(1.3); G.burst(h.x, top, "✨", 4, { grav: -0.2 }); }
      if (s.fin <= 0) { s.meter = Math.min(15, s.meter + (perfect ? 3 : 1)); if (s.meter >= 15) this.finale(G); } },
    finale(G) { const s = G.s; s.fin = 6; s.meter = 0; s.fins++; G.add(50, G.cx, G.H * 0.4, { color: "#ffd23f", noCrit: true }); SFX.wow(); G.flash("#fff0b0"); G.float("🎉 GRAND FINALE!", G.cx, G.u * 22, "#ffd23f", 1.2); },
    down(G, x, y) { const s = G.s, h = this.hat(G), fl = this.floor(G);
      const a = s.out.find((o) => !o.fly && o.t >= 1 && dist(x, y, o.tx, fl - G.u * 4) < G.u * 6); if (a) { a.pet = 0.6; G.add(1, x, y, { color: "#ffd6e8" }); SFX.giggle(); G.burst(x, y - G.u * 4, "💖", 2, { size: 0.6, grav: -0.3 }); return; }
      if (s.fin > 0 || (Math.abs(x - h.x) < h.w * 1.4 && y > h.y - h.w * 1.8 && y < h.y + h.w * 0.9)) { this.trick(G, s.fin > 0 || this.star(G).top, s.fin > 0); return; }
      SFX.boop(); G.dots(x, y, ["#fff", "#ffd23f"], 4); },
    update(G, dt) { const s = G.s, fl = this.floor(G); s.wob = Math.max(0, s.wob - dt); s.scarf = Math.max(0, s.scarf - dt);
      if (s.fin > 0) { s.fin -= dt; if ((s.auto -= dt) <= 0) { s.auto = 0.3; this.trick(G, false, true); } if (Math.random() < 0.5) G.parts.push({ x: rnd(0, G.W), y: -G.u * 2, vx: rnd(-1, 1) * G.u * 5, vy: G.u * 10, life: 2.2, max: 2.2, c: pick(RAINBOW), size: G.u * 1.1, grav: 0.15 }); }
      for (let i = s.out.length - 1; i >= 0; i--) { const o = s.out[i]; o.t += dt * 1.5; o.pet = Math.max(0, o.pet - dt); if (o.fly && o.t > 1) { o.fy += dt * G.u * 30; if (fl - o.fy < -G.u * 20) s.out.splice(i, 1); } } },
    autoTick(G) { this.trick(G, false); },
    draw(G, g) { const s = G.s, h = this.hat(G), fl = this.floor(G), w = h.w, st = this.star(G), wob = Math.sin(G.t * 40) * s.wob * 0.1, top = h.y - w * 0.4, F = s.fin > 0;
      // spotlight
      g.save(); g.globalAlpha = F ? 0.3 : 0.16; g.fillStyle = F ? RAINBOW[Math.floor(G.t * 4) % 6] : "#fff2b8"; g.beginPath(); g.moveTo(h.x - w * 0.4, 0); g.lineTo(h.x + w * 0.4, 0); g.lineTo(h.x + w * 2.2, fl); g.lineTo(h.x - w * 2.2, fl); g.fill(); g.restore();
      // stage floor
      rr(g, -10, fl, G.W + 20, G.H - fl + 10, 0, "#a0602d", INK, 3); g.strokeStyle = "rgba(74,42,26,.35)"; g.lineWidth = 2; for (let i = 1; i < 4; i++) { const y = fl + i * (G.H - fl) / 4; g.beginPath(); g.moveTo(0, y); g.lineTo(G.W, y); g.stroke(); }
      oval(g, h.x, fl, w * 2, w * 0.25, "rgba(255,240,180,.25)", null);
      // table
      rr(g, h.x - w * 0.9, h.y + w * 0.6, w * 1.8, w * 0.18, w * 0.06, "#7a3f1d"); for (const sd of [-1, 1]) rr(g, h.x + sd * w * 0.6 - w * 0.06, h.y + w * 0.78, w * 0.12, fl - h.y - w * 0.78, 2, "#7a3f1d");
      // star behind the hat when it's at the back
      const drawStar = () => { if (st.top) glow(g, st.x, st.y, G.u * 10, "#ffe066", 0.8); E(g, st.top ? "🌟" : "⭐", st.x, st.y, G.u * (st.top ? 7 : 5), G.t * 2); };
      if (Math.sin(G.t * 2.2) < 0) drawStar();
      // scarves that never end
      if (s.scarf > 0) { const n = Math.floor((1.8 - s.scarf) * 14); for (let i = 0; i < n; i++) { const k = i / 14, x = h.x + Math.sin(k * 7 + G.t * 3) * w * 0.4 * k + k * w * 0.6, y = top - k * G.H * 0.38; g.save(); g.translate(x, y); g.rotate(Math.sin(k * 7 + G.t * 3) * 0.5); rr(g, -G.u * 2.4, -G.u * 1.6, G.u * 4.8, G.u * 3.2, G.u * 0.8, RAINBOW[(i + s.sc) % 6], INK, 2); g.restore(); } }
      // items coming out
      for (const o of s.out) if (o.t < 1) { const t = o.t, x = lerp(o.x, o.tx, t), y = lerp(o.y0, fl - G.u * 4, t) - Math.sin(t * Math.PI) * w * 1.6; E(g, o.e, x, y, G.u * (o.big ? 10 : 8), t * 6); }
      // the upside-down top hat
      g.save(); g.translate(h.x, h.y); g.rotate(wob);
      rr(g, -w * 0.6, -w * 0.4, w * 1.2, w * 1.0, w * 0.1, "#262033"); rr(g, -w * 0.6, -w * 0.25, w * 1.2, w * 0.2, 0, "#d8343a", INK, 3);
      oval(g, 0, -w * 0.4, w * 0.95, w * 0.22, "#262033"); oval(g, 0, -w * 0.4, w * 0.62, w * 0.13, "#0d0a14", null);
      if (F || st.top) { g.globalAlpha = 0.5 + Math.sin(G.t * 10) * 0.3; oval(g, 0, -w * 0.4, w * 0.62, w * 0.13, "#ffe066", null); g.globalAlpha = 1; }
      g.restore();
      if (Math.sin(G.t * 2.2) >= 0) drawStar();
      E(g, "🪄", h.x + w * 1.1, h.y - w * 0.9 - s.wob * G.u * 10, G.u * 8, -0.6 + s.wob * 2);
      // friends on the stage
      for (const o of s.out) if (o.t >= 1) { const hop = o.pet > 0 ? Math.abs(Math.sin(o.pet * 10)) * G.u * 3 : Math.abs(Math.sin(G.t * 3 + o.tx)) * G.u * (F ? 3 : 0.6); E(g, o.e, o.tx, fl - G.u * 4 - hop - o.fy, G.u * (o.big ? 9 : 7.5), o.fly ? Math.sin(G.t * 6) * 0.2 : 0); }
      // curtains
      for (const sd of [-1, 1]) { const cw = Math.min(G.W * 0.1, G.u * 12), x0 = sd < 0 ? 0 : G.W; g.fillStyle = "#b3133f"; g.beginPath(); g.moveTo(x0, 0); g.lineTo(x0 - sd * cw, 0); for (let y = 0; y <= G.H; y += G.u * 4) g.lineTo(x0 - sd * (cw * 0.75 + Math.sin(y * 0.05 + G.t) * cw * 0.12), y); g.lineTo(x0, G.H); g.closePath(); g.fill(); g.strokeStyle = INK; g.lineWidth = 3; g.stroke(); }
      g.fillStyle = "#ffcf3a"; for (let x = 0; x < G.W + G.u * 6; x += G.u * 6) { g.beginPath(); g.arc(x, 0, G.u * 3, 0, Math.PI); g.fill(); }
      if (F) hdr(G, g, `🎉 GRAND FINALE! Tap tap tap! ${Math.ceil(s.fin)}s`);
      else meter(G, g, s.meter / 15, "#ffd23f", `🎩 Tricks: ${s.tricks} · tap when ⭐ is on top!`); },
    hot(G) { const h = this.hat(G); return { x: h.x, y: h.y }; },
  },
  {
    id: "mermaid", name: "Mermaid Pizza Lagoon", rar: "magical", ico: "🧜‍♀️", unit: "pizzas served", base: 9, bg: ["#6fdcea", "#1c6fa8"], noDots: true,
    blurb: "Marina the mermaid runs a pizza café under the sea! Look at each sea friend's bubble, then tap the shell with the SAME pizza to serve it. Serve 8 for a LAGOON PARTY!",
    ups: [["tap", "Pearl Plates", "🦪"], ["auto", "Dolphin Waiters", "🐬"], ["mult", "Coral Oven", "🪸"]],
    win: ["Your first underwater pizza! It's only a little soggy.", "The octopus gave you eight high-fives.", "The turtle says it was worth the wait.", "The crab danced sideways with joy!", "Whales sang a song about your café.", "The seahorses want a pizza playground.", "Your café got five starfish. That's the best rating!", "The whole ocean lines up for lunch now.", "Queen of the Mermaid Pizza Lagoon!"],
    TOPS: ["🍄", "🍍", "🫒", "🌽"], FRIENDS: ["🐙", "🐢", "🦀", "🐠", "🐡", "🦭", "🐳", "🦞", "🦑", "🐧"],
    init(G) { Object.assign(G.s, { seats: [0, 1, 2].map(() => this.newFriend(1)), fly: [], served: 0, party: 0, parties: 0, mx: G.cx, mtx: G.cx, wave: 0 }); },
    newFriend(come = 1) { return { f: pick(this.FRIENDS), want: Math.floor(Math.random() * 4), eat: 0, come, bound: false, tick: 0 }; },
    seat(G, i) { return { x: G.W * (0.2 + 0.3 * i), y: G.H * 0.42 }; },
    shell(G, i) { return { x: G.W * (0.14 + 0.24 * i), y: G.H * 0.79, r: Math.min(G.W * 0.09, G.u * 8) }; },
    mer(G) { return { x: G.s.mx, y: G.H * 0.6 + Math.sin(G.t * 2) * G.u * 1.5 }; },
    pz(G, g, x, y, r, ti) { pizza(g, x, y, r, { peps: 0 }); for (let j = 0; j < 3; j++) E(g, this.TOPS[ti], x + Math.cos(j * 2.1 + 0.5) * r * 0.42, y + Math.sin(j * 2.1 + 0.5) * r * 0.42, r * 0.6); },
    free(s, j) { const q = s.seats[j]; return q.eat <= 0 && q.come <= 0 && !q.bound; },
    serve(G, i) { const s = G.s, sh = this.shell(G, i), k = [0, 1, 2].find((j) => this.free(s, j) && (s.party > 0 || s.seats[j].want === i));
      if (k == null) { G.add(1, sh.x, sh.y - sh.r); SFX.boop(); G.say(pick(["Hmm, nobody ordered that one yet!", "Peek at the bubbles to see who wants what!"]), sh.x, sh.y - sh.r * 1.3, 1.2); return; }
      s.seats[k].bound = true; s.seats[k].ti = i; s.fly.push({ i, k, t: 0, x0: sh.x, y0: sh.y }); s.mtx = this.seat(G, k).x; G.tone(700, 0.2, { type: "sine", vol: 0.1, slideTo: 1100 }); },
    arrive(G, f) { const s = G.s, q = s.seats[f.k], p = this.seat(G, f.k); q.bound = false; q.eat = 1.5; s.served++; G.add(s.party > 0 ? 12 : 6, p.x, p.y - G.u * 10, { color: "#7cffd9" }); SFX.slurp(); G.burst(p.x, p.y, ["💖", "🫧", "✨"], 6, { grav: -0.3 }); G.say(pick(["Yummy!", "Thank you!", "Blub blub, delish!", "My favourite!"]), p.x, p.y - G.u * 21, 1);
      if (s.served % 8 === 0) { s.party = 7; s.parties++; G.add(40, G.cx, G.H * 0.35, { color: "#ffd23f", noCrit: true }); SFX.wow(); G.flash("#d9fff8"); G.float("🎉 LAGOON PARTY!", G.cx, G.u * 22, "#ffd23f", 1.1); } },
    down(G, x, y) { const s = G.s, m = this.mer(G);
      for (let i = 0; i < 4; i++) { const sh = this.shell(G, i); if (dist(x, y, sh.x, sh.y) < sh.r * 1.3) { this.serve(G, i); return; } }
      if (dist(x, y, m.x, m.y) < G.u * 9) { s.wave = 0.8; G.add(1, x, y, { color: "#ffd6e8" }); SFX.giggle(); G.burst(m.x, m.y - G.u * 6, ["🫧", "💖"], 3, { grav: -0.4, size: 0.6 }); return; }
      for (let j = 0; j < 3; j++) { const p = this.seat(G, j); if (dist(x, y, p.x, p.y) < G.u * 8) { s.seats[j].tick = 0.6; G.add(1, x, y, { color: "#ffd6e8" }); SFX.giggle(); return; } }
      SFX.boop(); G.dots(x, y, ["#fff", "#bff4ff"], 4); },
    update(G, dt) { const s = G.s; s.party = Math.max(0, s.party - dt); s.wave = Math.max(0, s.wave - dt); s.mx += (s.mtx - s.mx) * Math.min(1, dt * 4);
      for (let j = 0; j < 3; j++) { const q = s.seats[j]; q.tick = Math.max(0, q.tick - dt); if (q.come > 0) q.come = Math.max(0, q.come - dt * 1.6); if (q.eat > 0 && (q.eat -= dt) <= 0) s.seats[j] = this.newFriend(1); }
      for (let i = s.fly.length - 1; i >= 0; i--) { const f = s.fly[i]; f.t += dt * 2.2; if (f.t >= 1) { s.fly.splice(i, 1); this.arrive(G, f); } } },
    autoTick(G) { const s = G.s, j = [0, 1, 2].find((j) => this.free(s, j)); if (j != null) this.serve(G, s.seats[j].want); },
    draw(G, g) { const s = G.s, m = this.mer(G), P = s.party > 0;
      g.save(); g.globalAlpha = 0.14; g.fillStyle = "#fff"; for (let i = 0; i < 5; i++) { const x = G.W * (0.1 + i * 0.22) + Math.sin(G.t * 0.5 + i) * G.u * 5; g.beginPath(); g.moveTo(x - G.u * 3, 0); g.lineTo(x + G.u * 3, 0); g.lineTo(x + G.u * 14, G.H * 0.85); g.lineTo(x - G.u * 2, G.H * 0.85); g.fill(); } g.restore();
      for (let i = 0; i < 18; i++) { const y = G.H - ((G.t * G.u * 8 * (1 + (i % 3)) + i * 83) % (G.H + G.u * 10)); circ(g, (i * 97.3) % G.W + Math.sin(G.t * 2 + i) * G.u * 1.5, y, G.u * (0.6 + (i % 3) * 0.4), P ? RAINBOW[i % 6] + "88" : "rgba(255,255,255,.35)", "rgba(255,255,255,.7)", 1.5); }
      rr(g, -10, G.H * 0.88, G.W + 20, G.H * 0.2, 0, "#f2d39a", INK, 3);
      for (let i = 0; i < 6; i++) { const x = G.W * (0.04 + i * 0.19), hh = G.u * (12 + (i % 3) * 5); g.strokeStyle = "#2f9e57"; g.lineWidth = G.u * 1.6; g.lineCap = "round"; g.beginPath(); g.moveTo(x, G.H * 0.9); g.quadraticCurveTo(x + Math.sin(G.t * 1.5 + i) * G.u * 5, G.H * 0.9 - hh * 0.5, x + Math.sin(G.t * 1.5 + i + 1) * G.u * 3, G.H * 0.9 - hh); g.stroke(); }
      E(g, "🐚", G.W * 0.94, G.H * 0.93, G.u * 5); E(g, "⭐", G.W * 0.05, G.H * 0.95, G.u * 5);
      // sea friends and their orders
      for (let j = 0; j < 3; j++) { const q = s.seats[j], p = this.seat(G, j), yy = p.y - q.come * G.H * 0.35 + Math.sin(G.t * 2 + j) * G.u, sc = 1 + (q.eat > 0 ? Math.sin(q.eat * 20) * 0.05 : 0) + q.tick * 0.15;
        E(g, q.f, p.x, yy, G.u * 13 * sc, q.tick > 0 ? Math.sin(G.t * 30) * 0.15 : 0);
        if (q.eat > 0) { pizza(g, p.x, yy + G.u * 7, G.u * 3.5 * Math.min(1, q.eat), { peps: 0 }); E(g, "💖", p.x + G.u * 6, yy - G.u * 6 - (1.5 - q.eat) * G.u * 4, G.u * 4); continue; }
        if (q.come > 0) continue; const by = yy - G.u * 13; circ(g, p.x, by, G.u * 6.5, "#fffaf0"); circ(g, p.x - G.u * 2, by + G.u * 7.5, G.u * 1.2, "#fffaf0", INK, 2);
        if (P) E(g, "⭐", p.x, by, G.u * 7, Math.sin(G.t * 4) * 0.2); else this.pz(G, g, p.x, by, G.u * 4.5, q.want); }
      // the mermaid
      E(g, "🧜‍♀️", m.x, m.y, G.u * 15, P ? Math.sin(G.t * 6) * 0.3 : Math.sin(G.t * 2) * 0.06);
      if (s.wave > 0) E(g, "👋", m.x + G.u * 8, m.y - G.u * 6, G.u * 5, Math.sin(G.t * 14) * 0.4);
      for (const f of s.fly) { const p = this.seat(G, f.k), x = lerp(f.x0, p.x, f.t), y = lerp(f.y0, p.y + G.u * 4, f.t) - Math.sin(f.t * Math.PI) * G.u * 12; this.pz(G, g, x, y, G.u * 4, f.i); }
      // shells
      const want = new Set(s.seats.filter((q, j) => this.free(s, j)).map((q) => q.want));
      for (let i = 0; i < 4; i++) { const sh = this.shell(G, i), hi = P || want.has(i), r = sh.r; if (hi) glow(g, sh.x, sh.y, r * 1.8, "#fff6b0", 0.45 + Math.sin(G.t * 5 + i) * 0.2);
        g.save(); g.translate(sh.x, sh.y); for (let k = -2; k <= 2; k++) oval(g, Math.sin(k * 0.45) * r * 0.75, r * 0.15 - Math.cos(k * 0.45) * r * 0.4, r * 0.28, r * 0.62, "#ffc2d6", INK, 2.5, k * 0.45); oval(g, 0, r * 0.45, r * 0.95, r * 0.28, "#ffd9e6", INK, 2.5); g.restore();
        this.pz(G, g, sh.x, sh.y + r * 0.15, r * 0.5, i); }
      if (P) hdr(G, g, `🎉 LAGOON PARTY! ${Math.ceil(s.party)}s`);
      else meter(G, g, (s.served % 8) / 8, "#7cffd9", `🧜‍♀️ Served: ${s.served} · match the bubbles!`); },
    hot(G) { const s = G.s, j = [0, 1, 2].find((j) => this.free(s, j)); return this.shell(G, j == null || s.party > 0 ? 0 : s.seats[j].want); },
  },

  // ------------------------------------------------------------------------
  //  COSMIC
  // ------------------------------------------------------------------------
  {
    id: "comet", name: "Comet Catcher", rar: "cosmic", ico: "☄️", unit: "comets", base: 10, bg: ["#070a24", "#1e1550"], noDots: true,
    blurb: "Sparkly comets zoom across the night sky! Tap them to catch them in your star net. Fill the wish jar with 8 comets to make a WISH!",
    ups: [["tap", "Bigger Star Net", "🥅"], ["auto", "Comet Foxes", "🦊"], ["crit", "Lucky Wish", "🌠"]],
    win: ["Your first comet! It's warm and sparkly.", "The moon smiled at you.", "Your wish jar glows like a night light now.", "A comet winked at you. Comets can wink!", "You wished for pizza rain. It worked!", "The stars made a picture of you.", "Astronomers named a comet after your pet.", "The Milky Way asked for your autograph.", "Supreme Comet Catcher of the Cosmos!"],
    WISHES: [["🍕", "Pizza rain!"], ["🐔", "Chicken shooting stars!"], ["🌈", "Rainbow sky!"], ["🦄", "Unicorn parade!"], ["🧁", "Cupcake clouds!"], ["🎈", "Balloon party!"]],
    init(G) { Object.assign(G.s, { cm: [], spawn: 0.3, jar: 0, wishes: 0, wish: 0, wk: 0, net: { x: 0, y: 0, t: 0 }, caught: 0, fly: [], moon: 0 }); },
    jarP(G) { return { x: G.W * 0.86, y: G.H * 0.7, w: G.u * 10, h: G.u * 13 }; },
    spawnC(G) { const s = G.s, L = Math.random() < 0.5, gold = Math.random() < 0.15; s.cm.push({ x: L ? rnd(-0.1, 0.4) * G.W : rnd(0.6, 1.1) * G.W, y: -G.u * 5, vx: (L ? 1 : -1) * G.u * rnd(20, 34), vy: G.u * rnd(12, 20), col: gold ? "#ffd23f" : pick(["#7cd8ff", "#ff86f0", "#b18cff", "#7cffb0"]), gold, tr: [] }); },
    catchC(G, c) { const s = G.s; s.cm.splice(s.cm.indexOf(c), 1); s.caught++; s.fly.push({ x0: c.x, y0: c.y, t: 0, col: c.col }); G.add(c.gold ? 10 : 3, c.x, c.y, { color: c.col }); c.gold ? SFX.sparkle() : SFX.ding(); G.burst(c.x, c.y, c.gold ? ["✨", "🌟"] : "✨", c.gold ? 8 : 4, { grav: -0.2 }); },
    down(G, x, y) { const s = G.s; s.net = { x, y, t: 0.35 }; const R = G.u * 13;
      const hits = s.cm.filter((c) => dist(x, y, c.x, c.y) < R); if (hits.length) { hits.forEach((c) => this.catchC(G, c)); return; }
      if (dist(x, y, G.W * 0.12, G.H * 0.16) < G.u * 9) { s.moon = 0.6; G.add(1, x, y, { color: "#fff3b0" }); SFX.giggle(); G.say("Hee hee, moon tickles!", G.W * 0.12 + G.u * 8, G.H * 0.16 - G.u * 9, 1); return; }
      SFX.whoosh(); G.dots(x, y, ["#fff", "#ffe066"], 4); },
    update(G, dt) { const s = G.s, J = this.jarP(G); s.net.t = Math.max(0, s.net.t - dt); s.moon = Math.max(0, s.moon - dt); s.wish = Math.max(0, s.wish - dt);
      if ((s.spawn -= dt) <= 0) { s.spawn = s.wish > 0 ? 0.35 : 0.9; if (s.cm.length < 7) this.spawnC(G); }
      for (let i = s.cm.length - 1; i >= 0; i--) { const c = s.cm[i]; c.tr.unshift([c.x, c.y]); if (c.tr.length > 12) c.tr.pop(); c.x += c.vx * dt; c.y += c.vy * dt; if (c.y > G.H * 0.85 || c.x < -G.u * 20 || c.x > G.W + G.u * 20) s.cm.splice(i, 1); }
      for (let i = s.fly.length - 1; i >= 0; i--) { const f = s.fly[i]; f.t += dt * 1.8; if (f.t >= 1) { s.fly.splice(i, 1); G.tone(1200, 0.08, { type: "triangle", vol: 0.08 }); if (s.wish <= 0 && ++s.jar >= 8) this.makeWish(G); } }
      if (s.wish > 0 && Math.random() < dt * 8) G.parts.push({ x: rnd(0, G.W), y: -G.u * 4, vx: rnd(-1, 1) * G.u * 3, vy: G.u * rnd(15, 25), life: 3, max: 3, e: this.WISHES[s.wk][0], size: G.u * rnd(4, 7), rot: 0, vr: rnd(-1, 1), grav: 0.03 }); },
    makeWish(G) { const s = G.s, J = this.jarP(G); s.jar = 0; s.wish = 6; s.wishes++; s.wk = Math.floor(Math.random() * this.WISHES.length); G.add(50, J.x, J.y - J.h, { color: "#ffd23f", noCrit: true }); SFX.wow(); G.flash("#fff6c8"); G.float(`🌠 WISH: ${this.WISHES[s.wk][1]}`, G.cx, G.u * 24, "#ffd23f", 1.2); },
    autoTick(G) { const s = G.s, c = s.cm.find((c) => c.x > 0 && c.x < G.W); if (c) { this.catchC(G, c); G.burst(c.x, c.y, "🦊", 1, { size: 0.7 }); } },
    draw(G, g) { const s = G.s, J = this.jarP(G), W = s.wish > 0;
      if (W && s.wk === 2) { g.globalAlpha = 0.25; for (let i = 0; i < 6; i++) { g.fillStyle = RAINBOW[i]; g.fillRect(0, (i / 6) * G.H, G.W, G.H / 6); } g.globalAlpha = 1; }
      stars(G, g, 90, 0.6);
      const mx = G.W * 0.12, my = G.H * 0.16; glow(g, mx, my, G.u * 16, "#fff3b0", 0.45); circ(g, mx, my, G.u * 7, "#fff3b0"); circ(g, mx + G.u * 2.5, my + G.u * 3, G.u * 1.2, "#efe2a0", null); face(g, mx, my, G.u * 4.5, mood(s.moon));
      // hills with a little telescope
      g.fillStyle = "#231a4d"; g.beginPath(); g.moveTo(0, G.H * 0.85); for (let x = 0; x <= G.W + 20; x += 20) g.lineTo(x, G.H * 0.85 - Math.sin(x * 0.008 + 1) * G.u * 5); g.lineTo(G.W, G.H); g.lineTo(0, G.H); g.closePath(); g.fill(); g.strokeStyle = INK; g.lineWidth = 3; g.stroke();
      E(g, "🔭", G.W * 0.14, G.H * 0.82, G.u * 9);
      // comets
      for (const c of s.cm) { g.lineCap = "round"; for (let i = 1; i < c.tr.length; i++) { const [ax, ay] = c.tr[i - 1], [bx, by] = c.tr[i]; g.globalAlpha = 1 - i / c.tr.length; g.strokeStyle = c.col; g.lineWidth = G.u * (c.gold ? 2.6 : 2) * (1 - i / c.tr.length); g.beginPath(); g.moveTo(ax, ay); g.lineTo(bx, by); g.stroke(); } g.globalAlpha = 1;
        glow(g, c.x, c.y, G.u * (c.gold ? 9 : 6), c.col, 0.8); E(g, c.gold ? "🌟" : "⭐", c.x, c.y, G.u * (c.gold ? 7 : 5), G.t * 3); }
      for (const f of s.fly) { const x = lerp(f.x0, J.x, f.t), y = lerp(f.y0, J.y, f.t) - Math.sin(f.t * Math.PI) * G.u * 10; glow(g, x, y, G.u * 4, f.col, 0.9); circ(g, x, y, G.u * 1.2, "#fff", null); }
      // the wish jar
      const jx = J.x - J.w / 2, jy = J.y - J.h / 2; glow(g, J.x, J.y, J.w * 1.4, "#ffe066", 0.25 + (s.jar / 8) * 0.5);
      rr(g, jx, jy, J.w, J.h, G.u * 2.5, "rgba(200,235,255,.25)", "#fff", 3); rr(g, jx + G.u, jy - G.u * 2, J.w - G.u * 2, G.u * 2.4, G.u * 0.8, "#c98a5a");
      for (let j = 0; j < s.jar; j++) { const x = jx + J.w * (0.25 + (j % 3) * 0.25), y = jy + J.h - G.u * (2 + Math.floor(j / 3) * 3) + Math.sin(G.t * 3 + j) * G.u * 0.4; glow(g, x, y, G.u * 2.4, RAINBOW[j % 6], 0.9); circ(g, x, y, G.u * 0.8, "#fff", null); }
      txt(g, `${s.jar}/8`, J.x, jy + J.h + G.u * 3.5, G.u * 3.4, "#fff", { stroke: INK });
      // the star net
      if (s.net.t > 0) { const n = s.net, a = (0.35 - n.t) * 6 - 0.8; g.save(); g.translate(n.x, n.y); g.rotate(a); g.globalAlpha = Math.min(1, n.t * 5); circ(g, 0, 0, G.u * 9, "rgba(255,255,255,.12)", "#ffe066", G.u * 0.9); g.strokeStyle = "rgba(255,255,255,.6)"; g.lineWidth = 1.5; for (let k = -2; k <= 2; k++) { g.beginPath(); g.moveTo(k * G.u * 3.5, -G.u * 8); g.lineTo(k * G.u * 3.5, G.u * 8); g.moveTo(-G.u * 8, k * G.u * 3.5); g.lineTo(G.u * 8, k * G.u * 3.5); g.stroke(); } g.strokeStyle = "#c98a5a"; g.lineWidth = G.u * 1.4; g.beginPath(); g.moveTo(G.u * 6.4, G.u * 6.4); g.lineTo(G.u * 16, G.u * 16); g.stroke(); E(g, "🌟", G.u * 17, G.u * 17, G.u * 5); g.restore(); }
      if (W) hdr(G, g, `🌠 WISH: ${this.WISHES[s.wk][1]} ${Math.ceil(s.wish)}s`);
      else hdr(G, g, `☄️ Comets caught: ${s.caught} · wishes: ${s.wishes}`); },
    hot(G) { const c = G.s.cm.filter((c) => c.x > G.u * 5 && c.x < G.W - G.u * 5 && c.y > G.u * 5).sort((a, b) => dist(a.x, a.y, G.cx, G.cy) - dist(b.x, b.y, G.cx, G.cy))[0]; return c ? { x: c.x + c.vx * 0.02, y: c.y + c.vy * 0.02 } : { x: G.cx, y: G.cy }; },
  },
  {
    id: "marsgarden", name: "Mars Garden", rar: "cosmic", ico: "🍅", unit: "space veggies", base: 10, bg: ["#ffb98a", "#d0603a"], noDots: true,
    blurb: "Astro Annie grows GIANT space veggies in a glass dome on Mars! Look at each plant's bubble and tap 💧 water or ☀️ sunlight. When a veggie is huge and sparkly, tap it to pick it!",
    ups: [["tap", "Super Sprinkler", "🚿"], ["auto", "Garden Robots", "🤖"], ["mult", "Star Fertilizer", "🌱"]],
    win: ["Your first space tomato! It's the size of a beach ball.", "The basil smells like pizza already.", "A Mars rover stopped by to sniff the garden.", "Your peppers are spicy AND sparkly.", "NASA wants your gardening tips.", "The dome is so green you can see it from Earth!", "Aliens visit just to smell your basil.", "You grew a tomato as big as a moon. Almost.", "Greatest Gardener in the Galaxy!"],
    KINDS: ["🍅", "🌿", "🌶️"],
    init(G) { Object.assign(G.s, { pl: [0, 1, 2].map((i) => this.newPlant(i)), basket: 0, party: 0, parties: 0, ax: G.cx, atx: G.cx, fx: { k: "", t: 0 }, fly: [], wave: 0 }); },
    newPlant(k) { return { k: k ?? Math.floor(Math.random() * 3), st: 0, need: Math.random() < 0.5 ? "water" : "sun", wig: 0, grow: 0 }; },
    dome(G) { return { x: G.cx, y: G.H * 0.76, r: Math.min(G.W * 0.42, G.H * 0.52) }; },
    S(G) { return this.dome(G).r / 42; },
    plot(G, i) { const d = this.dome(G); return { x: d.x + (i - 1) * d.r * 0.52, y: d.y }; },
    top(G, i) { const p = this.plot(G, i), S = this.S(G), st = G.s.pl[i].st; return { x: p.x, y: p.y - S * (4 + st * 4.4) }; },
    btn(G, k) { return { x: k === "water" ? G.W * 0.11 : G.W * 0.89, y: G.H * 0.87, r: G.u * 7 }; },
    basketP(G) { const d = this.dome(G); return { x: d.x + d.r * 0.8, y: d.y - this.S(G) * 3 }; },
    tool(G, k) { const s = G.s, b = this.btn(G, k); s.fx = { k, t: 0.8 }; let n = 0;
      s.pl.forEach((p, i) => { if (p.st < 5 && p.need === k) { p.st++; p.wig = 0.5; p.need = Math.random() < 0.5 ? "water" : "sun"; n++; const q = this.top(G, i); s.atx = q.x; G.add(s.party > 0 ? 4 : 2, q.x, q.y, { color: k === "water" ? "#6ec6ff" : "#ffe066" }); if (p.st >= 5) { G.float("🌟 Ready to pick!", q.x, q.y - G.u * 8, "#7cffb0", 0.8); SFX.ding(); } } });
      k === "water" ? G.noise(0.45, { vol: 0.12, f0: 2500, f1: 900, type: "bandpass", q: 1 }) : SFX.sparkle();
      if (!n) { G.add(1, b.x, b.y - b.r, { color: "#fff" }); G.say(pick(["The plants are all set for that!", "Check the bubbles!"]), b.x, b.y - b.r * 1.4, 1.2); } },
    harvest(G, i) { const s = G.s, p = s.pl[i], q = this.top(G, i); s.fly.push({ e: this.KINDS[p.k], x0: q.x, y0: q.y, t: 0 }); s.pl[i] = this.newPlant(); s.atx = q.x; s.wave = 0.8;
      G.add(25, q.x, q.y, { color: "#ffd23f" }); SFX.coin(); G.burst(q.x, q.y, [this.KINDS[p.k], "✨"], 8); },
    picked(G) { const s = G.s, b = this.basketP(G); s.basket++; G.tone(900, 0.1, { type: "triangle", vol: 0.1 }); if (s.basket % 6 === 0) { s.party = 6; s.parties++; G.add(60, G.cx, G.H * 0.3, { color: "#ffd23f", noCrit: true }); SFX.wow(); G.flash("#fff3d0"); G.float("🍕 MARS PIZZA PARTY!", G.cx, G.u * 22, "#ffd23f", 1.2); G.burst(b.x, b.y, ["🍅", "🌿", "🍕"], 14); } },
    down(G, x, y) { const s = G.s, S = this.S(G);
      for (let i = 0; i < 3; i++) { const q = this.top(G, i); if (s.pl[i].st >= 5 && dist(x, y, q.x, q.y) < S * 12) { this.harvest(G, i); return; } }
      for (const k of ["water", "sun"]) { const b = this.btn(G, k); if (dist(x, y, b.x, b.y) < b.r * 1.4) { this.tool(G, k); return; } }
      for (let i = 0; i < 3; i++) { const p = this.plot(G, i), q = this.top(G, i); if (Math.abs(x - p.x) < S * 8 && y > q.y - S * 8 && y < p.y + S * 3) { s.pl[i].wig = 0.5; G.add(1, x, y, { color: "#bff7c8" }); SFX.giggle(); G.say(s.pl[i].need === "water" ? "I'm thirsty! 💧" : "I want sunshine! ☀️", q.x, q.y - S * 8, 1.1); return; } }
      SFX.boop(); G.dots(x, y, ["#fff", "#ffcfa8"], 4); },
    update(G, dt) { const s = G.s; s.party = Math.max(0, s.party - dt); s.wave = Math.max(0, s.wave - dt); s.fx.t = Math.max(0, s.fx.t - dt); s.ax += (s.atx - s.ax) * Math.min(1, dt * 3); for (const p of s.pl) { p.wig = Math.max(0, p.wig - dt); p.grow += (p.st - p.grow) * Math.min(1, dt * 5); }
      const b = this.basketP(G); for (let i = s.fly.length - 1; i >= 0; i--) { const f = s.fly[i]; f.t += dt * 1.8; if (f.t >= 1) { s.fly.splice(i, 1); this.picked(G); } }
      if (s.fx.k === "water" && s.fx.t > 0 && Math.random() < 0.7) { const d = this.dome(G); G.parts.push({ x: d.x + rnd(-0.75, 0.75) * d.r, y: d.y - d.r * 0.8, vx: 0, vy: G.u * 25, life: 0.6, max: 0.6, c: "#8fd6ff", size: G.u * 0.9, grav: 0.6 }); } },
    autoTick(G) { const s = G.s, r = s.pl.findIndex((p) => p.st >= 5); if (r >= 0) { this.harvest(G, r); return; } const w = s.pl.filter((p) => p.st < 5 && p.need === "water").length, u = s.pl.filter((p) => p.st < 5 && p.need === "sun").length; this.tool(G, w >= u ? "water" : "sun"); },
    drawPlant(G, g, i) { const s = G.s, p = s.pl[i], q = this.plot(G, i), S = this.S(G), gr = p.grow, h = S * (4 + gr * 4.4), sw = Math.sin(G.t * 2 + i) * S * 0.6 + Math.sin(p.wig * 25) * S * p.wig * 2, ripe = p.st >= 5;
      oval(g, q.x, q.y, S * 7, S * 2, "#6b3a22");
      g.strokeStyle = "#2f8a3e"; g.lineWidth = S * (0.8 + gr * 0.2); g.lineCap = "round"; g.beginPath(); g.moveTo(q.x, q.y); g.quadraticCurveTo(q.x - sw, q.y - h * 0.5, q.x + sw, q.y - h); g.stroke();
      for (let j = 0; j < Math.floor(gr) + 1; j++) { const t = (j + 1) / (Math.floor(gr) + 2), sd = j % 2 ? 1 : -1, lx = q.x + sw * t * 0.5, ly = q.y - h * t; oval(g, lx + sd * S * 2.2, ly, S * (1.6 + gr * 0.35), S * (0.8 + gr * 0.15), p.k === 1 ? "#4cc95a" : "#3fae4a", INK, 2, sd * -0.5); }
      const tx = q.x + sw, ty = q.y - h;
      if (p.k === 1) { if (gr > 0.5) for (let j = 0; j < 3; j++) oval(g, tx + (j - 1) * S * 1.6 * (0.6 + gr * 0.12), ty - Math.abs(j - 1) * -S, S * (1 + gr * 0.5), S * (0.6 + gr * 0.3), "#5fd36a", INK, 2, (j - 1) * 0.6); }
      else if (gr > 1.5) E(g, this.KINDS[p.k], tx, ty + S, S * (2 + gr * 1.8), Math.sin(G.t * 2 + i) * 0.1);
      if (ripe) { glow(g, tx, ty, S * 12, "#fff6b0", 0.6 + Math.sin(G.t * 5) * 0.2); E(g, this.KINDS[p.k], tx, ty - Math.abs(Math.sin(G.t * 4)) * S * 1.5, S * 13); E(g, "✨", tx + S * 7, ty - S * 6, S * 5, 0, 0.5 + Math.sin(G.t * 6) * 0.5); }
      else { const by = ty - S * 8 + Math.sin(G.t * 3 + i) * S * 0.6; circ(g, tx, by, S * 3.8, "#fffaf0", INK, 2); E(g, p.need === "water" ? "💧" : "☀️", tx, by, S * 4.6); } },
    draw(G, g) { const s = G.s, d = this.dome(G), S = this.S(G), P = s.party > 0;
      E(g, "☀️", G.W * 0.12, G.H * 0.12, G.u * 11, G.t * 0.2); E(g, "🌍", G.W * 0.86, G.H * 0.1, G.u * 5); for (let i = 0; i < 12; i++) circ(g, (i * 157.3) % G.W, (i * 41.7) % (G.H * 0.3), G.u * 0.3, "rgba(255,255,255,.7)", null);
      if (s.fx.k === "sun" && s.fx.t > 0) { g.save(); g.globalAlpha = s.fx.t * 0.5; g.fillStyle = "#fff3a0"; g.beginPath(); g.moveTo(G.W * 0.12, G.H * 0.12); g.lineTo(d.x - d.r * 0.8, d.y); g.lineTo(d.x + d.r * 0.8, d.y); g.closePath(); g.fill(); g.restore(); }
      g.fillStyle = "#b5532e"; g.fillRect(0, d.y, G.W, G.H - d.y); g.strokeStyle = INK; g.lineWidth = 3; g.beginPath(); g.moveTo(0, d.y); g.lineTo(G.W, d.y); g.stroke();
      for (const [fx, fy, fr] of [[0.05, 0.84, 3], [0.3, 0.93, 2], [0.7, 0.95, 2.5], [0.97, 0.8, 2.5]]) oval(g, fx * G.W, fy * G.H, G.u * fr, G.u * fr * 0.6, "#8f3d22", INK, 2);
      // the glass dome
      g.save(); g.beginPath(); g.arc(d.x, d.y, d.r, Math.PI, 0); g.closePath(); g.fillStyle = P ? "rgba(255,240,200,.35)" : "rgba(210,245,255,.28)"; g.fill(); g.restore();
      oval(g, d.x, d.y, d.r * 0.95, S * 2.5, "#5a3a22", null);
      const b = this.basketP(G); E(g, "🧺", b.x, b.y, S * 9);
      E(g, "🧑‍🚀", s.ax, d.y - S * 6 - (s.wave > 0 ? Math.abs(Math.sin(s.wave * 10)) * S * 3 : 0), S * 11, 0, 1, s.atx > s.ax ? -1 : 1, 1);
      for (let i = 0; i < 3; i++) this.drawPlant(G, g, i);
      g.strokeStyle = "rgba(255,255,255,.55)"; g.lineWidth = 2; for (let k = 1; k < 4; k++) { g.beginPath(); g.ellipse(d.x, d.y, d.r * k / 4, d.r, 0, Math.PI, 0); g.stroke(); } g.beginPath(); g.ellipse(d.x, d.y, d.r, d.r * 0.5, 0, Math.PI, 0); g.stroke();
      g.beginPath(); g.arc(d.x, d.y, d.r, Math.PI, 0); g.strokeStyle = "#fff"; g.lineWidth = 4; g.stroke(); g.beginPath(); g.arc(d.x, d.y, d.r * 0.9, Math.PI * 1.15, Math.PI * 1.35); g.strokeStyle = "rgba(255,255,255,.8)"; g.lineWidth = G.u * 1.2; g.stroke();
      for (const f of s.fly) { const x = lerp(f.x0, b.x, f.t), y = lerp(f.y0, b.y, f.t) - Math.sin(f.t * Math.PI) * S * 10; E(g, f.e, x, y, S * (12 - f.t * 6)); }
      if (P) { pizza(g, d.x, d.y - d.r * 0.55, Math.min(d.r * 0.3, G.u * 16) * (1 + Math.sin(G.t * 4) * 0.04), { rot: G.t * 0.5, peps: 8 }); E(g, "🌿", d.x - G.u * 3, d.y - d.r * 0.55, G.u * 5); E(g, "🍅", d.x + G.u * 4, d.y - d.r * 0.55 - G.u * 3, G.u * 5); }
      for (const k of ["water", "sun"]) { const bt = this.btn(G, k), need = s.pl.some((p) => p.st < 5 && p.need === k), pul = need ? 1 + Math.sin(G.t * 5) * 0.06 : 1; circ(g, bt.x, bt.y, bt.r * pul, k === "water" ? "#bfe6ff" : "#fff3a0"); E(g, k === "water" ? "🚿" : "☀️", bt.x, bt.y, bt.r * 1.2); }
      if (P) hdr(G, g, `🍕 MARS PIZZA PARTY! ${Math.ceil(s.party)}s`);
      else meter(G, g, (s.basket % 6) / 6, "#7cffb0", `🧺 Space veggies picked: ${s.basket}`); },
    hot(G) { const s = G.s, r = s.pl.findIndex((p) => p.st >= 5); if (r >= 0) return this.top(G, r); const w = s.pl.filter((p) => p.st < 5 && p.need === "water").length, u = s.pl.filter((p) => p.st < 5 && p.need === "sun").length; return this.btn(G, w >= u ? "water" : "sun"); },
  },

  // ------------------------------------------------------------------------
  //  GALACTIC
  // ------------------------------------------------------------------------
  {
    id: "starship", name: "Galaxy Pizza Starship", rar: "galactic", ico: "🚀", unit: "stardust", base: 11, bg: ["#10052e", "#3a0d5c"], noDots: true,
    blurb: "Captain Cluck flies the pizza starship through rainbow space clouds! Tap up or down to steer and scoop up stardust. Fill the meter for HYPERSPEED!",
    ups: [["tap", "Stardust Scoop", "🌟"], ["auto", "Wingman Saucers", "🛸"], ["crit", "Rainbow Thrusters", "🌈"]],
    win: ["Blast off! Captain Cluck says BAWK!", "You found a nebula shaped like a pizza.", "The starship got fuzzy dice.", "A comet raced you. You both won!", "Captain Cluck laid a space egg. It's shiny!", "The stars wave as you zoom by.", "You flew around the galaxy twice before lunch.", "The Space Council gave you a gold steering wheel.", "Admiral of the Galaxy Pizza Fleet!"],
    init(G) { Object.assign(G.s, { y: G.H * 0.5, ty: G.H * 0.5, dust: Array.from({ length: 5 }, (_, i) => ({ x: G.W * (0.45 + i * 0.12), y: rnd(0.25, 0.75) * G.H, rb: i === 2, ph: rnd(0, 6), pull: false })), spawn: 0, meter: 0, hyper: 0, hypers: 0, got: 0, thr: 0 }); },
    shipX(G) { return G.W * 0.2; },
    L(G) { return Math.min(G.u * 13, G.W * 0.14); },
    collect(G, d) { const s = G.s; s.got++; G.add(d.rb ? 10 : 2, d.x, d.y, { color: d.rb ? "#ffe066" : "#e7c8ff", quiet: !d.rb && Math.random() < 0.5 }); d.rb ? SFX.sparkle() : G.tone(1200 + Math.random() * 600, 0.06, { type: "triangle", vol: 0.06 });
      if (s.hyper <= 0) { s.meter = Math.min(30, s.meter + (d.rb ? 5 : 1)); if (s.meter >= 30) { s.meter = 0; s.hyper = 6; s.hypers++; G.add(50, G.cx, G.H * 0.35, { color: "#ffd23f", noCrit: true }); SFX.wow(); G.flash("#ffffff"); G.float("🌈 HYPERSPEED! 🌈", G.cx, G.u * 22, "#ffd23f", 1.3); } } },
    down(G, x, y) { const s = G.s; s.ty = clamp(y, G.H * 0.2, G.H * 0.82); s.thr = 0.4; G.add(1, this.shipX(G), s.y - G.u * 6, { color: "#ffb347", quiet: true }); G.tone(260, 0.18, { type: "sawtooth", vol: 0.04, slideTo: 520 }); },
    update(G, dt) { const s = G.s, H = s.hyper > 0, sx = this.shipX(G), v = G.u * (H ? 85 : 32); s.hyper = Math.max(0, s.hyper - dt); s.thr = Math.max(0, s.thr - dt); s.y += (s.ty - s.y) * Math.min(1, dt * 5);
      if ((s.spawn -= dt) <= 0) { s.spawn = H ? 0.12 : 0.35; s.dust.push({ x: G.W + G.u * 5, y: rnd(0.2, 0.82) * G.H, rb: Math.random() < 0.1, ph: rnd(0, 6), pull: false }); }
      for (let i = s.dust.length - 1; i >= 0; i--) { const d = s.dust[i]; if (d.pull || (H && d.x < G.W * 0.7)) { d.x += (sx - d.x) * Math.min(1, dt * 6); d.y += (s.y - d.y) * Math.min(1, dt * 6); } else d.x -= v * dt;
        if (dist(d.x, d.y, sx, s.y) < G.u * (H ? 12 : 9)) { s.dust.splice(i, 1); this.collect(G, d); } else if (d.x < -G.u * 8) s.dust.splice(i, 1); } },
    autoTick(G) { const s = G.s, d = s.dust.filter((d) => !d.pull && d.x > this.shipX(G)).sort((a, b) => a.x - b.x)[0]; if (d) d.pull = true; },
    draw(G, g) { const s = G.s, H = s.hyper > 0, sx = this.shipX(G), L = this.L(G), sp = H ? 14 : 1;
      for (let i = 0; i < 4; i++) { const x = (((i * 0.37 - G.t * 0.03 * sp) % 1.4) + 1.4) % 1.4 * G.W - G.W * 0.2, y = G.H * (0.25 + (i % 2) * 0.45); glow(g, x, y, Math.max(G.W, G.H) * 0.32, RAINBOW[(i * 2 + 1) % 6], H ? 0.45 : 0.3); }
      for (let i = 0; i < 80; i++) { const x = ((i * 137.5 - G.t * G.u * (3 + (i % 3) * 3) * sp) % G.W + G.W) % G.W, y = (i * 71.3) % G.H; if (H) { g.strokeStyle = RAINBOW[i % 6]; g.lineWidth = G.u * 0.35; g.beginPath(); g.moveTo(x, y); g.lineTo(x + G.u * 14, y); g.stroke(); } else circ(g, x, y, G.u * (0.25 + (i % 3) * 0.18), "#fff", null); }
      E(g, "🪐", (((G.W * 0.8 - G.t * G.u * 4 * sp) % (G.W * 1.4)) + G.W * 1.4) % (G.W * 1.4) - G.W * 0.2, G.H * 0.3, G.u * 16, 0, 0.85);
      for (const d of s.dust) { const tw = 1 + Math.sin(G.t * 8 + d.ph) * 0.2; if (d.rb) { glow(g, d.x, d.y, G.u * 8, RAINBOW[Math.floor(G.t * 8 + d.ph) % 6], 0.9); E(g, "🌟", d.x, d.y, G.u * 7 * tw, G.t * 2); } else { glow(g, d.x, d.y, G.u * 4.5, "#e7c8ff", 0.8); g.save(); g.translate(d.x, d.y); g.rotate(G.t + d.ph); g.fillStyle = "#fff"; g.beginPath(); for (let k = 0; k < 8; k++) { const r = (k % 2 ? 0.4 : 1.6) * G.u * tw, a = (k / 8) * Math.PI * 2; g.lineTo(Math.cos(a) * r, Math.sin(a) * r); } g.fill(); g.restore(); } }
      // the starship
      if (H) for (let k = 0; k < 6; k++) { g.strokeStyle = RAINBOW[k]; g.lineWidth = G.u * 1.3; g.beginPath(); g.moveTo(sx - L * 0.8, s.y - G.u * 3 + k * G.u * 1.2); g.lineTo(0, s.y - G.u * 3 + k * G.u * 1.2 + Math.sin(G.t * 10 + k) * G.u); g.stroke(); }
      g.save(); g.translate(sx, s.y); g.rotate(clamp((s.ty - s.y) * 0.004, -0.4, 0.4));
      const fl = L * (0.4 + (s.thr + (H ? 0.6 : 0)) * 0.8 + Math.sin(G.t * 30) * 0.08); g.beginPath(); g.moveTo(-L * 0.75, -L * 0.18); g.lineTo(-L * 0.75 - fl, 0); g.lineTo(-L * 0.75, L * 0.18); g.fillStyle = "#ffb347"; g.fill(); g.beginPath(); g.moveTo(-L * 0.75, -L * 0.1); g.lineTo(-L * 0.75 - fl * 0.6, 0); g.lineTo(-L * 0.75, L * 0.1); g.fillStyle = "#fff3a0"; g.fill();
      for (const sd of [-1, 1]) { g.beginPath(); g.moveTo(-L * 0.4, sd * L * 0.2); g.lineTo(-L * 0.8, sd * L * 0.55); g.lineTo(-L * 0.65, sd * L * 0.15); g.closePath(); g.fillStyle = "#ff5d8f"; g.fill(); g.strokeStyle = INK; g.lineWidth = 3; g.stroke(); }
      oval(g, 0, 0, L * 0.8, L * 0.32, "#f4f6ff"); g.beginPath(); g.moveTo(L * 0.55, -L * 0.24); g.quadraticCurveTo(L * 1.05, 0, L * 0.55, L * 0.24); g.closePath(); g.fillStyle = "#ff5d8f"; g.fill(); g.strokeStyle = INK; g.lineWidth = 3; g.stroke();
      pizza(g, -L * 0.35, 0, L * 0.13, { peps: 3 }); circ(g, L * 0.18, -L * 0.02, L * 0.2, "#bfe9ff"); E(g, "🐔", L * 0.18, -L * 0.04, L * 0.32, Math.sin(G.t * 3) * 0.1, 1, -1, 1); circ(g, L * 0.18, -L * 0.02, L * 0.2, "rgba(255,255,255,.2)");
      g.restore();
      if (H) hdr(G, g, `🌈 HYPERSPEED! WHEEE! ${Math.ceil(s.hyper)}s`);
      else meter(G, g, s.meter / 30, "#ff86f0", `🚀 Stardust: ${s.got} · tap to steer!`); },
    hot(G) { const s = G.s, sx = this.shipX(G), d = s.dust.filter((d) => d.x > sx).sort((a, b) => a.x - b.x)[0]; return { x: G.W * 0.55, y: d ? d.y : G.cy }; },
  },
  {
    id: "planetbaker", name: "Planet Baker", rar: "galactic", ico: "🪐", unit: "planets", base: 11, bg: ["#0a0f33", "#2a1f6b"], noDots: true,
    blurb: "Bake your very own planet! Knead the space dough, then add oceans, land, rings, moons and a big smiley face. Every finished planet joins your galaxy!",
    ups: [["tap", "Cosmic Whisk", "🥄"], ["auto", "Astro Chefs", "👩‍🚀"], ["mult", "Supernova Oven", "🔥"]],
    win: ["Your first planet! It says hello.", "Your planet got its very own weather. Sunny!", "Tiny aliens moved in. They're very polite.", "Your galaxy has a name now: Emmy Way!", "One of your planets made a moon friend.", "Your planets are holding hands in a circle.", "Other galaxies are jealous of your rings.", "The Universe gave you a baking trophy.", "Master Planet Baker of Everything!"],
    STEPS: [["🌊", "Oceans!"], ["🌳", "Land!"], ["💍", "Rings!"], ["🌙", "Moons!"], ["😊", "A smiley face!"]],
    PAL: [{ d: "#f2c48d", o: "#3fa4ff", l: "#5fd36a", r: "#ffd23f" }, { d: "#ffb3d1", o: "#b18cff", l: "#ff86b3", r: "#7cffb0" }, { d: "#ffe7a3", o: "#2fd6c4", l: "#ffb347", r: "#ff86f0" }, { d: "#cfe6ff", o: "#6ec6ff", l: "#ffffff", r: "#b18cff" }, { d: "#ffd0a8", o: "#ff7a59", l: "#ffe066", r: "#6ec6ff" }, { d: "#d9ffc2", o: "#2f8cff", l: "#ffd23f", r: "#ff5d8f" }],
    init(G) { Object.assign(G.s, { k: 0, done: [0, 0, 0, 0, 0], an: [0, 0, 0, 0, 0], pal: 0, made: [], fly: 0, party: 0, galaxies: 0, sq: 0 }); },
    planet(G) { return { x: G.cx, y: G.H * 0.53, r: Math.min(G.W * 0.2, G.u * 16) }; },
    btn(G, i) { return { x: G.cx + (i - 2) * Math.min(G.W * 0.18, G.u * 16), y: G.H * 0.83, r: Math.min(G.W * 0.075, G.u * 6) }; },
    gal(G) { return { x: G.cx, y: G.u * 25, rx: Math.min(G.W * 0.42, G.u * 44), ry: G.u * 5 }; },
    next(G) { return G.s.done.findIndex((d) => !d); },
    step(G, i) { const s = G.s, p = this.planet(G); if (s.fly > 0) return;
      if (s.k < 3) { s.k++; s.sq = 0.3; G.add(2, p.x, p.y - p.r, { color: "#fff3c4" }); G.tone(260 + s.k * 90, 0.12, { type: "triangle", vol: 0.1, slideTo: 180 + s.k * 90 }); G.dots(p.x, p.y, ["#fff", this.PAL[s.pal].d], 8); if (s.k === 3) { SFX.ding(); G.burst(p.x, p.y, "✨", 6, { grav: -0.2 }); } return; }
      if (i == null || s.done[i]) i = this.next(G); if (i < 0) return;
      s.done[i] = 1; s.an[i] = 1; G.add(5, p.x, p.y - p.r * 1.2, { color: "#ffe066" }); SFX.note(i * 2 + 2); G.burst(p.x, p.y, [this.STEPS[i][0], "✨"], 5, { grav: -0.2 }); G.float(this.STEPS[i][1], p.x, p.y + p.r * 1.45, "#fff", 0.8);
      if (s.done.every((d) => d)) { s.fly = 1.4; G.add(30, p.x, p.y, { color: "#ffd23f", noCrit: true }); SFX.win(); G.float("🪐 Planet done!", G.cx, G.H * 0.36, "#ffd23f", 1); } },
    land(G) { const s = G.s; s.made.push({ pal: s.pal, ph: rnd(0, 6) }); if (s.made.length > 15) s.made.shift(); s.k = 0; s.done = [0, 0, 0, 0, 0]; s.an = [0, 0, 0, 0, 0]; let n; do { n = Math.floor(Math.random() * this.PAL.length); } while (n === s.pal); s.pal = n;
      G.tone(1400, 0.15, { type: "triangle", vol: 0.1 }); s.galaxies++;
      if (s.galaxies % 5 === 0) { s.party = 4; G.add(80, G.cx, G.u * 30, { color: "#ffd23f", noCrit: true }); SFX.wow(); G.flash("#e8ddff"); G.float("🌌 NEW GALAXY!", G.cx, G.H * 0.38, "#ffd23f", 1.3); } },
    down(G, x, y) { const s = G.s, p = this.planet(G);
      if (s.k >= 3) for (let i = 0; i < 5; i++) { const b = this.btn(G, i); if (dist(x, y, b.x, b.y) < b.r * 1.3) { if (s.done[i]) { SFX.boop(); G.say("Already added! Try another!", b.x, b.y - b.r * 1.3, 1); } else this.step(G, i); return; } }
      if (dist(x, y, p.x, p.y) < p.r * 1.4) { this.step(G); return; }
      SFX.boop(); G.dots(x, y, ["#fff", "#cfd6ff"], 4); },
    update(G, dt) { const s = G.s; s.sq = Math.max(0, s.sq - dt); s.party = Math.max(0, s.party - dt); s.an = s.an.map((v) => Math.max(0, v - dt * 2)); if (s.fly > 0 && (s.fly -= dt) <= 0) { s.fly = 0; this.land(G); } },
    autoTick(G) { this.step(G); },
    drawPlanet(G, g, x, y, r, pal, done, an, k) { const P = this.PAL[pal], e = (i) => (done[i] ? 1 - an[i] : 0), t = G.t;
      if (k < 3) { g.beginPath(); for (let i = 0; i <= 14; i++) { const a = (i / 14) * Math.PI * 2, rr2 = r * (0.8 + Math.sin(i * 3.7 + k * 2) * 0.1 * (3 - k) / 3 + k * 0.06); g.lineTo(x + Math.cos(a) * rr2, y + Math.sin(a) * rr2); } g.closePath(); g.fillStyle = P.d; g.fill(); g.strokeStyle = INK; g.lineWidth = 3; g.stroke(); for (let i = 0; i < 5; i++) circ(g, x + Math.cos(i * 1.9) * r * 0.45, y + Math.sin(i * 1.9) * r * 0.4, r * 0.05, "#fff", null); return; }
      const ring = (front) => { if (!done[2]) return; g.save(); g.translate(x, y); g.rotate(-0.3); g.beginPath(); g.ellipse(0, 0, r * 1.65 * (0.6 + e(2) * 0.4), r * 0.42, 0, front ? 0 : Math.PI, front ? Math.PI : Math.PI * 2); g.strokeStyle = INK; g.lineWidth = r * 0.2 + 4; g.stroke(); g.strokeStyle = P.r; g.lineWidth = r * 0.2; g.stroke(); g.restore(); };
      const moons = (front) => { if (!done[3]) return; for (let m = 0; m < 2; m++) { const a = t * (0.9 + m * 0.5) + m * 3, mx = x + Math.cos(a) * r * (1.5 + m * 0.3) * (0.5 + e(3) * 0.5), my = y + Math.sin(a) * r * 0.45; if ((Math.sin(a) > 0) !== front) continue; circ(g, mx, my, r * (0.17 - m * 0.03), "#eef0ff"); circ(g, mx + r * 0.04, my - r * 0.03, r * 0.04, "#c9cce0", null); } };
      ring(false); moons(false);
      circ(g, x, y, r, P.d, null); g.save(); g.beginPath(); g.arc(x, y, r, 0, 7); g.clip();
      if (done[0]) circ(g, x, y, r * (0.2 + e(0) * 0.8), P.o, null);
      if (done[1]) for (const [dx, dy, rr2] of [[-0.45, -0.35, 0.38], [0.5, 0.25, 0.35], [0.05, 0.7, 0.28], [-0.55, 0.5, 0.2], [0.35, -0.6, 0.22]]) circ(g, x + dx * r, y + dy * r, rr2 * r * e(1), P.l, "rgba(74,42,26,.4)", 2);
      g.restore(); circ(g, x, y, r, null, INK, Math.max(3, r * 0.04)); circ(g, x - r * 0.45, y - r * 0.45, r * 0.12, "rgba(255,255,255,.6)", null);
      if (done[4]) { g.globalAlpha = e(4); face(g, x, y + r * 0.05, r * 0.55, "joy"); g.globalAlpha = 1; }
      ring(true); moons(true); },
    draw(G, g) { const s = G.s, p = this.planet(G), ga = this.gal(G), PT = s.party > 0;
      stars(G, g, 90, 0.4);
      // your galaxy
      g.save(); g.translate(ga.x, ga.y); for (let k = 0; k < 40; k++) { const a = k * 0.5 + G.t * (PT ? 2 : 0.2), rr2 = (k / 40) * ga.rx; circ(g, Math.cos(a) * rr2, Math.sin(a) * rr2 * (ga.ry / ga.rx) * 1.6, G.u * 0.4, PT ? RAINBOW[k % 6] : "rgba(220,210,255,.6)", null); } g.restore();
      glow(g, ga.x, ga.y, G.u * 6, "#fff3a0", 0.9); E(g, "☀️", ga.x, ga.y, G.u * 5);
      s.made.forEach((m, j) => { const a = (j / Math.max(1, s.made.length)) * Math.PI * 2 + G.t * (PT ? 2 : 0.3), x = ga.x + Math.cos(a) * ga.rx, y = ga.y + Math.sin(a) * ga.ry * 1.6, P = this.PAL[m.pal]; circ(g, x, y, G.u * 2.4, P.o); circ(g, x - G.u * 0.6, y - G.u * 0.4, G.u * 0.9, P.l, null); oval(g, x, y, G.u * 3.8, G.u * 0.9, null, P.r, 2, -0.3); });
      // the planet you're baking
      let x = p.x, y = p.y, r = p.r; if (s.fly > 0) { const t = 1 - s.fly / 1.4, e = t * t; x = lerp(p.x, ga.x + ga.rx * 0.6, e); y = lerp(p.y, ga.y, e); r = lerp(p.r, G.u * 2.4, e); }
      glow(g, x, y, r * 2, this.PAL[s.pal].o, 0.35);
      g.save(); g.translate(x, y); g.scale(1 + s.sq * 0.6, 1 - s.sq * 0.6); this.drawPlanet(G, g, 0, 0, r, s.pal, s.done, s.an, s.k); g.restore();
      if (s.k < 3) { txt(g, "Tap to knead the space dough!", G.cx, p.y + p.r * 1.45, G.u * 3.6, "#fff", { stroke: INK }); bar(g, G.cx - G.u * 14, p.y + p.r * 1.7, G.u * 28, G.u * 3, s.k / 3, "#ffd23f"); }
      const nx = this.next(G);
      for (let i = 0; i < 5; i++) { const b = this.btn(G, i), dn = s.done[i], on = s.k >= 3 && s.fly <= 0, hi = on && i === nx, pul = hi ? 1 + Math.sin(G.t * 6) * 0.07 : 1; g.globalAlpha = on ? (dn ? 0.45 : 1) : 0.35;
        if (hi) glow(g, b.x, b.y, b.r * 2, "#ffe066", 0.6); circ(g, b.x, b.y, b.r * pul, dn ? "#cfe9c8" : "#fffaf0"); E(g, this.STEPS[i][0], b.x, b.y, b.r * 1.15); if (dn) txt(g, "✓", b.x + b.r * 0.7, b.y - b.r * 0.7, b.r * 0.8, "#2f8a3e", { stroke: "#fff" }); g.globalAlpha = 1; }
      if (PT) hdr(G, g, `🌌 NEW GALAXY PARTY! ${Math.ceil(s.party)}s`);
      else meter(G, g, s.fly > 0 ? 1 : (Math.min(s.k, 3) / 3 + s.done.reduce((a, b) => a + b, 0)) / 6, "#b18cff", `🪐 Planets in your galaxy: ${s.galaxies}`); },
    hot(G) { const s = G.s, nx = this.next(G); return s.k >= 3 && nx >= 0 ? this.btn(G, nx) : this.planet(G); },
  },
  {
    id: "spacechickens", name: "Chickens in Space!", rar: "galactic", ico: "🐔", unit: "space snacks", base: 11, bg: ["#0b0f2e", "#20305e"], noDots: true,
    blurb: "Chickens in tiny space helmets float in zero gravity! Tap a chicken to give it a gentle boost toward floating corn and egg-shaped moons. Collect 12 snacks for a COSMIC CLUCK PARTY!",
    ups: [["tap", "Comfy Jetpacks", "🎒"], ["auto", "Mission Control Chicks", "🐥"], ["mult", "Corn Galaxy", "🌽"]],
    win: ["One small peck for a chicken!", "The chickens learned to do zero-g somersaults.", "A chicken laid an egg. It floated away. It's a moon now.", "The space chickens got matching badges.", "Mission Control says: BAWK-tastic!", "The chickens built a coop on a comet.", "Aliens asked the chickens for dance lessons.", "There's a chicken constellation now. It's shaped like corn.", "Chief Chicken Astronaut of the Galaxy!"],
    init(G) { Object.assign(G.s, { ch: Array.from({ length: 4 }, (_, i) => ({ x: G.W * (0.2 + i * 0.2), y: G.H * (0.4 + (i % 2) * 0.2), vx: rnd(-1, 1) * G.u * 4, vy: rnd(-1, 1) * G.u * 4, rot: 0, vr: rnd(-0.4, 0.4), boost: 0, joy: 0, face: 1 })), it: [], spawn: 0, got: 0, meter: 0, party: 0, parties: 0 }); },
    R(G) { return G.u * 6; },
    box(G) { const R = this.R(G); return { x0: R, x1: G.W - R, y0: G.u * 20, y1: G.H - G.u * 15 }; },
    nearItem(G, c) { return G.s.it.slice().sort((a, b) => dist(c.x, c.y, a.x, a.y) - dist(c.x, c.y, b.x, b.y))[0]; },
    boost(G, c, quiet) { const it = this.nearItem(G, c); let dx = rnd(-1, 1), dy = rnd(-1, 1); if (it) { dx = it.x - c.x; dy = it.y - c.y; } const m = Math.hypot(dx, dy) || 1, sp = G.u * 42; c.vx = (dx / m) * sp; c.vy = (dy / m) * sp; c.boost = 0.6; c.vr = rnd(-1.5, 1.5);
      if (!quiet) { G.tone(420, 0.25, { type: "sine", vol: 0.1, slideTo: 880 }); if (Math.random() < 0.25) G.say(pick(["Wheee!", "Bawk-tastic!", "Zoom zoom!", "Corn ahoy!"]), c.x, c.y - G.u * 9, 0.9); } },
    collect(G, c, it) { const s = G.s, i = s.it.indexOf(it); s.it.splice(i, 1); s.got++; c.joy = 0.8; const v = it.k === "gold" ? 15 : it.k === "moon" ? 6 : 3; G.add(s.party > 0 ? v * 2 : v, it.x, it.y, { color: it.k === "gold" ? "#ffd23f" : "#fff" });
      it.k === "gold" ? SFX.sparkle() : SFX.peep(); if (Math.random() < 0.3) SFX.bawk(); G.burst(it.x, it.y, it.k === "corn" ? ["🌽", "✨"] : ["✨", "⭐"], 4, { grav: -0.1 });
      if (s.party <= 0 && ++s.meter >= 12) { s.meter = 0; s.party = 7; s.parties++; G.add(50, G.cx, G.H * 0.4, { color: "#ffd23f", noCrit: true }); SFX.wow(); G.flash("#fff3c0"); G.float("🪩 CLUCK PARTY!", G.cx, G.u * 24, "#ffd23f", 1.2); } },
    down(G, x, y) { const s = G.s, R = this.R(G), c = s.ch.slice().sort((a, b) => dist(x, y, a.x, a.y) - dist(x, y, b.x, b.y))[0];
      if (c && dist(x, y, c.x, c.y) < R * 1.7) { this.boost(G, c); G.add(1, c.x, c.y - R, { color: "#ffe066" }); G.dots(c.x, c.y, ["#bfe9ff", "#fff"], 6); return; }
      if (c) { const dx = x - c.x, dy = y - c.y, m = Math.hypot(dx, dy) || 1; c.vx += (dx / m) * G.u * 18; c.vy += (dy / m) * G.u * 18; }
      SFX.tap(); G.dots(x, y, ["#fff", "#ffe066"], 4); },
    update(G, dt) { const s = G.s, b = this.box(G), R = this.R(G), P = s.party > 0; s.party = Math.max(0, s.party - dt);
      if ((s.spawn -= dt) <= 0) { s.spawn = P ? 0.35 : 0.9; if (s.it.length < (P ? 9 : 6)) { const r = Math.random(); s.it.push({ x: rnd(b.x0 + R, b.x1 - R), y: rnd(b.y0 + R, b.y1 - R), k: r < 0.1 ? "gold" : r < 0.4 ? "moon" : "corn", ph: rnd(0, 6), a: 0 }); } }
      for (const it of s.it) it.a = Math.min(1, it.a + dt * 3);
      for (const c of s.ch) { c.boost = Math.max(0, c.boost - dt); c.joy = Math.max(0, c.joy - dt);
        if (P) { const it = this.nearItem(G, c); if (it) { const dx = it.x - c.x, dy = it.y - c.y, m = Math.hypot(dx, dy) || 1; c.vx += (dx / m) * G.u * 50 * dt; c.vy += (dy / m) * G.u * 50 * dt; } }
        const damp = Math.max(0, 1 - dt * (P ? 0.9 : 0.45)); c.vx *= damp; c.vy *= damp; if (Math.hypot(c.vx, c.vy) < G.u * 2.5) { c.vx += rnd(-1, 1) * G.u * 6 * dt; c.vy += rnd(-1, 1) * G.u * 6 * dt; }
        c.x += c.vx * dt; c.y += c.vy * dt; c.rot += c.vr * dt; c.vr *= Math.max(0, 1 - dt * 0.6); if (Math.abs(c.vx) > G.u * 2) c.face = c.vx > 0 ? -1 : 1;
        if (c.x < b.x0) { c.x = b.x0; c.vx = Math.abs(c.vx) * 0.7; } if (c.x > b.x1) { c.x = b.x1; c.vx = -Math.abs(c.vx) * 0.7; } if (c.y < b.y0) { c.y = b.y0; c.vy = Math.abs(c.vy) * 0.7; } if (c.y > b.y1) { c.y = b.y1; c.vy = -Math.abs(c.vy) * 0.7; }
        for (const it of s.it.slice()) if (dist(c.x, c.y, it.x, it.y) < R * 1.5) this.collect(G, c, it); } },
    autoTick(G) { const c = pick(G.s.ch); this.boost(G, c, true); G.dots(c.x, c.y, ["#bfe9ff", "#fff"], 4); },
    draw(G, g) { const s = G.s, R = this.R(G), P = s.party > 0;
      if (P) { for (let i = 0; i < 8; i++) { const a = G.t * 0.8 + (i / 8) * Math.PI * 2; g.save(); g.globalAlpha = 0.12; g.fillStyle = RAINBOW[i % 6]; g.beginPath(); g.moveTo(G.cx, G.u * 16); g.lineTo(G.cx + Math.cos(a) * G.W, G.u * 16 + Math.sin(a) * G.W); g.lineTo(G.cx + Math.cos(a + 0.25) * G.W, G.u * 16 + Math.sin(a + 0.25) * G.W); g.fill(); g.restore(); } E(g, "🪩", G.cx, G.u * 19, G.u * 8, G.t); }
      stars(G, g, 80, 0.3);
      E(g, "🪐", G.W * 0.88, G.H * 0.2, G.u * 14, 0.2, 0.85); glow(g, G.W * 0.08, G.H * 0.9, G.u * 30, "#7cd8ff", 0.35); E(g, "🌍", G.W * 0.08, G.H * 0.9, G.u * 14, G.t * 0.05, 0.9);
      for (const it of s.it) { const bob = Math.sin(G.t * 2 + it.ph) * G.u * 1.2, x = it.x, y = it.y + bob, sc = it.a;
        if (it.k === "corn") E(g, "🌽", x, y, G.u * 7 * sc, Math.sin(G.t + it.ph) * 0.5);
        else { const gold = it.k === "gold"; glow(g, x, y, G.u * 8 * sc, gold ? "#ffd23f" : "#fff3d6", 0.6); oval(g, x, y, G.u * 3.6 * sc, G.u * 4.6 * sc, gold ? "#ffcf3a" : "#fff8ee", gold ? "#b07800" : INK, 3); circ(g, x - G.u * 1.1, y - G.u * 0.8, G.u * 0.8 * sc, gold ? "#e8b020" : "#e9e2d6", null); circ(g, x + G.u * 1.2, y + G.u * 1.4, G.u * 0.6 * sc, gold ? "#e8b020" : "#e9e2d6", null); if (gold) E(g, "✨", x + G.u * 4, y - G.u * 4, G.u * 4, 0, 0.5 + Math.sin(G.t * 6) * 0.5); } }
      for (const c of s.ch) { const sp = Math.hypot(c.vx, c.vy);
        if (c.boost > 0) for (let k = 0; k < 3; k++) { const m = sp || 1; circ(g, c.x - (c.vx / m) * R * (1.2 + k * 0.5), c.y - (c.vy / m) * R * (1.2 + k * 0.5), R * (0.35 - k * 0.08) * (c.boost / 0.6 + 0.3), k ? "#ffe066" : "#fff", null); }
        g.save(); g.translate(c.x, c.y); g.rotate(Math.sin(c.rot) * 0.5 + (P ? G.t * 3 : 0));
        E(g, "🐔", 0, R * 0.05, R * 2, 0, 1, c.face, 1); circ(g, 0, -R * 0.1, R * 1.3, "rgba(190,235,255,.22)", "rgba(255,255,255,.9)", 3); g.beginPath(); g.arc(0, -R * 0.1, R * 1.05, Math.PI * 1.15, Math.PI * 1.45); g.strokeStyle = "rgba(255,255,255,.85)"; g.lineWidth = R * 0.12; g.lineCap = "round"; g.stroke();
        g.strokeStyle = INK; g.lineWidth = 2; g.beginPath(); g.moveTo(0, -R * 1.4); g.lineTo(0, -R * 1.9); g.stroke(); circ(g, 0, -R * 1.95, R * 0.18, c.joy > 0 ? "#ffd23f" : "#ff5d8f", INK, 2);
        g.restore(); if (c.joy > 0) E(g, "💖", c.x + R, c.y - R * 1.3 - (0.8 - c.joy) * R, R * 0.7); }
      if (P) hdr(G, g, `🪩 COSMIC CLUCK PARTY! ${Math.ceil(s.party)}s`);
      else meter(G, g, s.meter / 12, "#ffe066", `🌽 Snacks: ${s.got} · tap a chicken to boost!`); },
    hot(G) { const s = G.s; if (!s.it.length) return s.ch[0]; let best = s.ch[0], bd = 1e9; for (const c of s.ch) { const it = this.nearItem(G, c), d = dist(c.x, c.y, it.x, it.y); if (d < bd) { bd = d; best = c; } } return { x: best.x, y: best.y }; },
  },
];
