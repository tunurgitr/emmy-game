// ==========================================================================
//  Emmy's Pizza Plus — clicker games, part 4: the newer rarities.
//  Super Rare (between Rare & Epic), Cosmic (between Mythic & Cheesy Secret)
//  and Golden Crust (the rarest of all — even rarer than a rainbow).
// ==========================================================================
import { E, circ, oval, rr, txt, bar, face, pizza, rnd, pick, clamp, dist, INK } from "./clicker.js";
import { SFX } from "./audio.js";

const RAINBOW = ["#ff5d8f", "#ffb347", "#ffe066", "#7cffb0", "#6ec6ff", "#b18cff"];
const stars = (G, g, n = 50, speed = 4) => { for (let i = 0; i < n; i++) { const tw = 0.5 + Math.sin(G.t * 3 + i) * 0.5; circ(g, (i * 137.5) % G.W, (i * 71.3 + G.t * speed * (1 + (i % 3))) % G.H, G.u * (0.25 + (i % 3) * 0.2) * (0.6 + tw * 0.6), "#fff", null); } };

export const GAMES_D = [
  // ------------------------------------------------------------------------
  //  SUPER RARE
  // ------------------------------------------------------------------------
  {
    id: "bubblewrap", name: "Bubble Wrap Pizza Box", rar: "superrare", ico: "🫧", unit: "pops", base: 2, bg: ["#e6fbff", "#bdeeff"],
    blurb: "Somebody wrapped a pizza in BUBBLE WRAP. Pop every bubble to unwrap it! Golden bubbles pop extra big.",
    ups: [["tap", "Pointy Finger", "👉"], ["auto", "Popping Penguins", "🐧"], ["crit", "Super Squish", "💥"]],
    win: ["POP! The pizza is a tiny bit less wrapped.", "The delivery driver is very confused.", "You're the fastest popper in Pizza Town!", "The bubble wrap factory sent you a thank-you card.", "You popped so loud the pigeons clapped.", "There's a bubble wrap museum now. You're the main exhibit.", "Scientists say you've popped a MILLION bubbles. They're guessing.", "The pizza finally said 'thank you for unwrapping me'.", "Bubble Wrap Champion of the Universe!"],
    COLS: 5, ROWS: 4,
    init(G) { Object.assign(G.s, { b: [], sheets: 0, wob: 0 }); this.refill(G); },
    refill(G) { G.s.b = Array.from({ length: this.COLS * this.ROWS }, () => ({ pop: 0, gold: Math.random() < 0.08 })); },
    cell(G, i) { const bw = Math.min(G.W * 0.88, G.u * 95), cs = bw / this.COLS, x0 = G.cx - bw / 2, y0 = G.cy - (cs * this.ROWS) / 2 + G.u * 4, c = i % this.COLS, r = Math.floor(i / this.COLS); return { x: x0 + (c + 0.5) * cs, y: y0 + (r + 0.5) * cs, r: cs * 0.4, cs, bw, x0, y0 }; },
    pop(G, i) { const s = G.s, b = s.b[i], p = this.cell(G, i); b.pop = 1; G.add(b.gold ? 8 : 1, p.x, p.y, { color: b.gold ? "#ffd23f" : "#fff" }); SFX.pop(rnd(0.8, 1.4)); G.dots(p.x, p.y, b.gold ? ["#ffd23f", "#fff"] : ["#bfefff", "#fff"], b.gold ? 14 : 6); if (b.gold) { G.burst(p.x, p.y, "✨", 5); SFX.sparkle(); }
      if (s.b.every((q) => q.pop)) { s.sheets++; s.wob = 1; G.add(20, G.cx, G.cy, { color: "#ffd23f", noCrit: true }); G.float("ALL POPPED! New sheet!", G.cx, G.u * 14, "#4dbb5a", 1.2); SFX.win(); setTimeout(() => this.refill(G), 400); } },
    down(G, x, y) { const s = G.s; for (let i = 0; i < s.b.length; i++) { const p = this.cell(G, i); if (!s.b[i].pop && dist(x, y, p.x, p.y) < p.r * 1.15) { this.pop(G, i); return; } } SFX.boop(); },
    update(G, dt) { G.s.wob = Math.max(0, G.s.wob - dt * 2); },
    autoTick(G) { const left = G.s.b.map((b, i) => (b.pop ? -1 : i)).filter((i) => i >= 0); if (left.length) this.pop(G, pick(left)); },
    draw(G, g) { const s = G.s, c0 = this.cell(G, 0), bh = c0.cs * this.ROWS, w = Math.sin(G.t * 20) * s.wob * G.u;
      rr(g, c0.x0 - G.u * 4 + w, c0.y0 - G.u * 4, c0.bw + G.u * 8, bh + G.u * 8, G.u * 3, "#fff4dc", INK, 4);
      pizza(g, G.cx + w, c0.y0 + bh / 2, Math.min(c0.bw, bh) * 0.48, { peps: 9 });
      for (let i = 0; i < s.b.length; i++) { const b = s.b[i], p = this.cell(G, i);
        if (b.pop) { oval(g, p.x, p.y + p.r * 0.3, p.r * 0.9, p.r * 0.35, "rgba(255,255,255,.35)", "rgba(74,42,26,.35)", 2); continue; }
        circ(g, p.x, p.y, p.r, b.gold ? "rgba(255,214,70,.75)" : "rgba(220,247,255,.55)", b.gold ? "#c98a00" : "rgba(74,42,26,.55)", 3); circ(g, p.x - p.r * 0.35, p.y - p.r * 0.35, p.r * 0.22, "rgba(255,255,255,.9)", null); }
      txt(g, `🫧 Sheets unwrapped: ${s.sheets}`, G.cx, G.u * 7, G.u * 4, "#fff", { stroke: INK }); },
    hot(G) { const i = G.s.b.findIndex((b) => !b.pop); return i < 0 ? { x: G.cx, y: G.cy } : this.cell(G, i); },
  },
  {
    id: "hamster", name: "Hamster Cheeks", rar: "superrare", ico: "🐹", unit: "nibbles", base: 2, bg: ["#fff0f5", "#ffd1e0"],
    blurb: "Peanut the hamster wants to stuff ALL the pizza in her cheeks. Feed her crumbs! When her cheeks are FULL she does a happy spin.",
    ups: [["tap", "Bigger Crumbs", "🍕"], ["auto", "Crumb Delivery Mice", "🐭"], ["mult", "Stretchy Cheeks", "😮"]],
    win: ["Peanut's cheeks are SO round right now.", "Peanut did a little happy dance.", "Peanut is saving pizza for winter. And spring. And summer.", "Peanut can fit a whole slice in ONE cheek!", "Peanut built a pizza fort in her cage.", "Peanut's cheeks are now visible from space.", "Peanut was crowned Snack Queen of the pet shop.", "Peanut wrote you a thank-you note. It's very small.", "Peanut, the Legendary Cheek Hamster!"],
    init(G) { Object.assign(G.s, { cheek: 0.1, spin: 0, crumbs: [], spawn: 0, chomp: 0, spins: 0 }); },
    ham(G) { return { x: G.cx, y: G.H * 0.5, r: Math.min(G.W * 0.22, G.u * 22) }; },
    feed(G, n, x, y) { const s = G.s; s.chomp = 0.3; s.cheek = Math.min(1, s.cheek + 0.05 * n); G.add(n, x, y); G.tone(500 + s.cheek * 500, 0.06, { type: "triangle", vol: 0.08 });
      if (s.cheek >= 1 && s.spin <= 0) { s.spin = 1.6; s.cheek = 0.1; s.spins++; const h = this.ham(G); G.add(25, h.x, h.y - h.r, { color: "#ffd23f", noCrit: true }); SFX.wow(); G.burst(h.x, h.y, ["💖", "🍕", "✨"], 18); G.say("WHEEEE! So full!", h.x, h.y - h.r * 1.3, 1.6); } },
    down(G, x, y) { const s = G.s, h = this.ham(G); if (s.spin > 0) return;
      const c = s.crumbs.find((c) => !c.fly && dist(x, y, c.x, c.y) < G.u * 9); if (c) { c.fly = 0.01; SFX.pop(1.2); return; }
      if (dist(x, y, h.x, h.y) < h.r * 1.2) { this.feed(G, 1, x, y); SFX.squeak(); } else SFX.boop(); },
    update(G, dt) { const s = G.s, h = this.ham(G); s.spin = Math.max(0, s.spin - dt); s.chomp = Math.max(0, s.chomp - dt); s.cheek = Math.max(0.1, s.cheek - dt * 0.01);
      if ((s.spawn -= dt) <= 0 && s.crumbs.length < 4) { s.spawn = 1.2; let x, y; do { x = rnd(0.1, 0.9) * G.W; y = rnd(0.2, 0.85) * G.H; } while (dist(x, y, h.x, h.y) < h.r * 1.6); s.crumbs.push({ x, y, fly: 0, sx: x, sy: y }); }
      for (let i = s.crumbs.length - 1; i >= 0; i--) { const c = s.crumbs[i]; if (!c.fly) continue; c.fly += dt * 3; c.x = c.sx + (h.x - c.sx) * c.fly; c.y = c.sy + (h.y - c.sy) * c.fly - Math.sin(c.fly * Math.PI) * G.u * 15; if (c.fly >= 1) { s.crumbs.splice(i, 1); this.feed(G, 3, h.x, h.y - h.r * 0.5); } } },
    autoTick(G) { const c = G.s.crumbs.find((c) => !c.fly); if (c) c.fly = 0.01; },
    draw(G, g) { const s = G.s, h = this.ham(G), R = h.r, ck = R * (0.28 + s.cheek * 0.42);
      oval(g, h.x, h.y + R * 1.05, R * 1.3, R * 0.2, "rgba(74,42,26,.12)", null);
      g.save(); g.translate(h.x, h.y); if (s.spin > 0) g.rotate((1 - s.spin / 1.6) * Math.PI * 4); else g.rotate(Math.sin(G.t * 2) * 0.04);
      for (const sd of [-1, 1]) { circ(g, sd * R * 0.62, -R * 0.78, R * 0.26, "#e8a46a"); circ(g, sd * R * 0.62, -R * 0.78, R * 0.14, "#ffb3c8", null); }
      oval(g, 0, 0, R, R * 0.95, "#e8a46a"); oval(g, 0, R * 0.25, R * 0.62, R * 0.6, "#fff4e6", null);
      for (const sd of [-1, 1]) circ(g, sd * R * (0.55 + s.cheek * 0.2), R * 0.08, ck, "#f2b47e");
      face(g, 0, -R * 0.1, R * 0.5, s.spin > 0 ? "joy" : s.chomp > 0 ? "wow" : s.cheek > 0.8 ? "smug" : "happy");
      for (const sd of [-1, 1]) oval(g, sd * R * 0.3, R * 0.88, R * 0.18, R * 0.1, "#ffb3c8");
      g.restore();
      for (const c of s.crumbs) E(g, "🍕", c.x, c.y, G.u * (c.fly ? 7 * (1 - c.fly * 0.6) : 9), G.t * 2 + c.sx);
      bar(g, G.cx - G.u * 24, G.u * 4, G.u * 48, G.u * 5, s.cheek, "#ff86b3"); txt(g, `😮 Cheek fullness · happy spins: ${s.spins}`, G.cx, G.u * 13, G.u * 3.6, "#fff", { stroke: INK }); },
    hot(G) { const c = G.s.crumbs.find((c) => !c.fly); return c || this.ham(G); },
  },

  // ------------------------------------------------------------------------
  //  COSMIC
  // ------------------------------------------------------------------------
  {
    id: "ufo", name: "Alien Pizza Delivery", rar: "cosmic", ico: "🛸", unit: "deliveries", base: 10, bg: ["#120b33", "#2b1a66"], noDots: true,
    blurb: "Drive a flying saucer full of pizza! Tap the hungry planet (the one with the 🍕 bubble) before it gets grumpy. Get a streak for big bonuses!",
    ups: [["tap", "Turbo Saucer", "🚀"], ["auto", "Robot Co-Pilot", "🤖"], ["mult", "Galaxy Oven", "🌌"]],
    win: ["Blorp! The aliens love you!", "You got a 5-star review from Planet Zorp.", "The aliens named a moon after you.", "Your saucer now has cup holders.", "Fastest delivery in seven galaxies!", "The aliens learned to say 'pizza'. It sounds like 'BLEEP'.", "You delivered a pizza to a black hole. It said thanks.", "The Galactic Council gave you a shiny badge.", "Ruler of Cosmic Pizza Delivery!"],
    COLS: ["#7cffb0", "#ff86b3", "#6ec6ff", "#ffb347"],
    init(G) { Object.assign(G.s, { want: 0, wt: 5, ux: G.cx, tx: G.cx, beam: 0, bi: 0, streak: 0, done: 0, sulk: [0, 0, 0, 0] }); },
    planet(G, i) { return { x: G.W * (0.14 + 0.24 * i), y: G.H * 0.74, r: Math.min(G.W * 0.09, G.u * 11) }; },
    deliver(G, i) { const s = G.s, p = this.planet(G, i); s.tx = p.x; s.beam = 0.6; s.bi = i; s.done++; s.streak = Math.min(5, s.streak + 1);
      G.add(4 * s.streak, p.x, p.y - p.r * 1.5, { color: "#7cffb0" }); SFX.laser(); G.burst(p.x, p.y - p.r, ["🍕", "⭐"], 6);
      if (s.streak >= 5) G.float("🔥 COSMIC STREAK! ×5", G.cx, G.u * 22, "#ffd23f", 1.1);
      let n; do { n = Math.floor(Math.random() * 4); } while (n === i); s.want = n; s.wt = Math.max(2.4, 5 - s.done * 0.02); },
    down(G, x, y) { const s = G.s;
      for (let i = 0; i < 4; i++) { const p = this.planet(G, i); if (dist(x, y, p.x, p.y) < p.r * 1.3) { if (i === s.want) this.deliver(G, i); else { G.add(1, x, y); SFX.boop(); s.sulk[i] = 0.8; G.say(pick(["Not hungry! Blorp.", "We ate already!", "Zorp? No thanks!"]), p.x, p.y - p.r * 1.4, 1); } return; } }
      if (dist(x, y, s.ux, G.H * 0.26) < G.u * 14) { G.add(1, x, y); SFX.beep(Math.floor(rnd(0, 5))); G.burst(x, y, "✨", 3); return; }
      s.tx = x; SFX.whoosh(); },
    update(G, dt) { const s = G.s; s.ux += (s.tx - s.ux) * Math.min(1, dt * 6); s.beam = Math.max(0, s.beam - dt); for (let i = 0; i < 4; i++) s.sulk[i] = Math.max(0, s.sulk[i] - dt);
      if ((s.wt -= dt) <= 0) { const p = this.planet(G, s.want); G.say("Too slow… blorp.", p.x, p.y - p.r * 1.4, 1.2); s.streak = 0; s.want = (s.want + 1 + Math.floor(Math.random() * 3)) % 4; s.wt = 5; } },
    autoTick(G) { this.deliver(G, G.s.want); },
    draw(G, g) { const s = G.s, uy = G.H * 0.26; stars(G, g, 60, 3); E(g, "🪐", G.W * 0.86, G.H * 0.12, G.u * 12);
      if (s.beam > 0) { const p = this.planet(G, s.bi); g.globalAlpha = s.beam * 0.8; g.fillStyle = "#b7ffde"; g.beginPath(); g.moveTo(s.ux - G.u * 4, uy + G.u * 3); g.lineTo(s.ux + G.u * 4, uy + G.u * 3); g.lineTo(p.x + p.r, p.y - p.r * 0.3); g.lineTo(p.x - p.r, p.y - p.r * 0.3); g.fill(); g.globalAlpha = 1; }
      for (let i = 0; i < 4; i++) { const p = this.planet(G, i), want = i === s.want; circ(g, p.x, p.y, p.r, this.COLS[i]); oval(g, p.x, p.y, p.r * 1.5, p.r * 0.3, null, "rgba(255,255,255,.6)", 3, -0.2);
        face(g, p.x, p.y, p.r * 0.6, s.sulk[i] > 0 ? "grumpy" : want ? (s.wt < 1.5 ? "wow" : "joy") : "happy");
        if (want) { const by = p.y - p.r * 1.7 + Math.sin(G.t * 4) * G.u; circ(g, p.x, by, G.u * 6, "#fffaf0"); E(g, "🍕", p.x, by, G.u * 7); bar(g, p.x - p.r, p.y + p.r * 1.3, p.r * 2, G.u * 3, s.wt / 5, s.wt < 1.5 ? "#ff5a5f" : "#7cffb0"); } }
      g.save(); g.translate(s.ux, uy + Math.sin(G.t * 3) * G.u); g.rotate((s.tx - s.ux) * 0.002);
      oval(g, 0, -G.u * 3, G.u * 6, G.u * 5, "rgba(190,240,255,.8)"); E(g, "👽", 0, -G.u * 3.5, G.u * 7); oval(g, 0, G.u, G.u * 14, G.u * 4, "#c9d3e8"); for (let i = 0; i < 5; i++) circ(g, (i - 2) * G.u * 5, G.u * 1.5, G.u * 1.1, RAINBOW[(i + Math.floor(G.t * 6)) % 6], null);
      g.restore();
      txt(g, `🛸 Delivered: ${s.done}${s.streak > 1 ? ` · streak ×${s.streak}` : ""}`, G.cx, G.u * 7, G.u * 4, "#fff", { stroke: INK }); },
    hot(G) { return this.planet(G, G.s.want); },
  },
  {
    id: "constellation", name: "Constellation Chef", rar: "cosmic", ico: "🌌", unit: "stars", base: 10, bg: ["#0b1030", "#26215a"], noDots: true,
    blurb: "Connect the stars to draw pizza pictures in the night sky! Tap the twinkly star that's glowing next.",
    ups: [["tap", "Star Wand", "🪄"], ["auto", "Owl Astronomer", "🦉"], ["crit", "Shooting Star", "🌠"]],
    win: ["A new constellation! Astronomers are amazed.", "The moon wants its picture in the sky too.", "Your star pizza can be seen from Grandma's house.", "Sailors use your pizza stars to find their way.", "There's a whole Pizza Zodiac now. You're a Pepperoni.", "The night sky is officially delicious.", "Aliens are copying your star drawings.", "The Milky Way is now the Cheesy Way.", "Grand Chef of the Stars!"],
    SHAPES: [
      ["The Big Slice", [[0, -1], [0.65, 0.75], [0.2, 0.9], [-0.2, 0.9], [-0.65, 0.75]]],
      ["The Cosmic Chicken", [[-0.7, 0.3], [-0.35, -0.2], [0, -0.65], [0.3, -0.9], [0.55, -0.65], [0.85, -0.55], [0.55, -0.4], [0.55, 0.2], [0.2, 0.7], [-0.35, 0.6]]],
      ["Pizza Cat", [[-0.6, -0.9], [-0.3, -0.4], [0.3, -0.4], [0.6, -0.9], [0.75, -0.1], [0.4, 0.6], [-0.4, 0.6], [-0.75, -0.1]]],
      ["The Great Pepperoni", Array.from({ length: 8 }, (_, i) => [Math.cos((i / 8) * Math.PI * 2) * 0.85, Math.sin((i / 8) * Math.PI * 2) * 0.85])],
      ["Grandma's Rolling Pin", [[-0.95, 0], [-0.6, -0.18], [0.6, -0.18], [0.95, 0], [0.6, 0.18], [-0.6, 0.18]]],
    ],
    init(G) { Object.assign(G.s, { k: 0, n: 0, glow: 0, made: 0, names: [] }); },
    pt(G, i) { const [, pts] = this.SHAPES[G.s.k], R = Math.min(G.W * 0.36, G.H * 0.33), p = pts[i % pts.length]; return { x: G.cx + p[0] * R, y: G.H * 0.52 + p[1] * R }; },
    next(G) { const s = G.s, pts = this.SHAPES[s.k][1], p = this.pt(G, s.n); s.n++; G.add(2, p.x, p.y, { color: "#bfe3ff" }); SFX.note(s.n % 12); G.burst(p.x, p.y, "✨", 3, { size: 0.7 });
      if (s.n > pts.length) { s.glow = 2.2; s.made++; s.names.push(this.SHAPES[s.k][0]); G.add(30, G.cx, G.cy, { color: "#ffd23f", noCrit: true }); SFX.wow(); G.float(`⭐ ${this.SHAPES[s.k][0]}! ⭐`, G.cx, G.u * 22, "#ffd23f", 1.2); } },
    down(G, x, y) { const s = G.s; if (s.glow > 0) return; const p = this.pt(G, s.n); if (dist(x, y, p.x, p.y) < G.u * 10) { this.next(G); return; } SFX.boop(); G.dots(x, y, ["#fff", "#bfe3ff"], 4); },
    update(G, dt) { const s = G.s; if (s.glow > 0 && (s.glow -= dt) <= 0) { s.k = (s.k + 1) % this.SHAPES.length; s.n = 0; } },
    autoTick(G) { if (G.s.glow <= 0) this.next(G); },
    draw(G, g) { const s = G.s, pts = this.SHAPES[s.k][1], done = s.glow > 0; stars(G, g, 80, 1); E(g, "🌙", G.W * 0.12, G.H * 0.14, G.u * 10);
      g.lineCap = "round"; for (let i = 0; i < Math.min(s.n, pts.length + 1) - 1; i++) { const a = this.pt(G, i), b = this.pt(G, i + 1); g.strokeStyle = done ? RAINBOW[i % 6] : "rgba(191,227,255,.85)"; g.lineWidth = G.u * (done ? 1.4 : 0.8); g.beginPath(); g.moveTo(a.x, a.y); g.lineTo(b.x, b.y); g.stroke(); }
      for (let i = 0; i < pts.length; i++) { const p = this.pt(G, i), lit = i < s.n, nxt = i === s.n % pts.length && !done; circ(g, p.x, p.y, G.u * (nxt ? 2.4 + Math.sin(G.t * 6) * 0.6 : lit ? 1.8 : 1.3), nxt ? "#ffe066" : lit ? "#fff" : "rgba(255,255,255,.45)", null); if (nxt) circ(g, p.x, p.y, G.u * (5 + Math.sin(G.t * 6)), null, "rgba(255,224,102,.6)", 2); }
      if (done) { const sz = G.u * 5; E(g, "🍕", G.cx, G.H * 0.52, sz * 2 * Math.min(1, (2.2 - s.glow) * 2)); }
      txt(g, `🌌 Drawing: ${this.SHAPES[s.k][0]} · made ${s.made}`, G.cx, G.u * 7, G.u * 3.8, "#fff", { stroke: INK }); },
    hot(G) { return this.pt(G, G.s.n); },
  },

  // ------------------------------------------------------------------------
  //  GOLDEN CRUST (the rarest!)
  // ------------------------------------------------------------------------
  {
    id: "henqueen", name: "Queen Clucksalot's Golden Eggs", rar: "golden", ico: "🐔", unit: "clucks", base: 16, bg: ["#fff6cc", "#ffd98a"],
    blurb: "The Chicken Queen lays eggs when you tap her! Tap the eggs to hatch chicks. Golden eggs hatch GOLDEN chicks. Every 10 chicks: a CHICK PARADE!",
    ups: [["tap", "Royal Corn", "🌽"], ["auto", "Rooster Royal Guard", "🐓"], ["mult", "Golden Nest", "🪺"]],
    win: ["BAWK! The Queen is pleased.", "The Queen gave you a tiny feather medal.", "The chicks call you 'Mama' now. Or 'Papa'. They're not sure.", "So many chicks! The castle is VERY fluffy.", "The Queen let you wear her crown. For one minute.", "A golden chick hatched and sang a song!", "Chicken knights now guard your house.", "The Queen named you Royal Egg Keeper.", "You are the Chicken Emperor! BAWK BAWK!"],
    init(G) { Object.assign(G.s, { eggs: [], chicks: [], hatched: 0, golds: 0, cluck: 0, parade: 0 }); },
    hen(G) { return { x: G.cx, y: G.H * 0.38, r: Math.min(G.W * 0.18, G.u * 19) }; },
    slot(G, i) { return { x: G.W * (0.14 + 0.144 * i), y: G.H * 0.76 }; },
    lay(G) { const s = G.s; if (s.eggs.length >= 6) return false; s.eggs.push({ gold: Math.random() < 0.25, t: 0, i: [0, 1, 2, 3, 4, 5].find((i) => !s.eggs.some((e) => e.i === i)) }); G.tone(700, 0.08, { type: "triangle", vol: 0.1, slideTo: 400 }); return true; },
    hatch(G, e) { const s = G.s, p = this.slot(G, e.i); s.eggs.splice(s.eggs.indexOf(e), 1); s.hatched++; if (e.gold) s.golds++;
      s.chicks.push({ gold: e.gold, x: p.x, ph: rnd(0, 6), dir: Math.random() < 0.5 ? -1 : 1 }); if (s.chicks.length > 14) s.chicks.shift();
      G.add(e.gold ? 20 : 4, p.x, p.y - G.u * 6, { color: e.gold ? "#ffd23f" : "#fff" }); G.burst(p.x, p.y, e.gold ? ["✨", "🐥", "💛"] : ["🥚", "🐣"], e.gold ? 10 : 5); e.gold ? SFX.sparkle() : SFX.pop(1.3); SFX.peep && SFX.peep();
      if (s.hatched % 10 === 0) { s.parade = 3; G.add(50, G.cx, G.cy, { color: "#ffd23f", noCrit: true }); SFX.wow(); G.float("🐤 CHICK PARADE! 🐤", G.cx, G.u * 20, "#ff9800", 1.3); G.flash("#fff3b0"); } },
    down(G, x, y) { const s = G.s, h = this.hen(G);
      for (const e of s.eggs) { const p = this.slot(G, e.i); if (dist(x, y, p.x, p.y) < G.u * 8) { this.hatch(G, e); return; } }
      if (dist(x, y, h.x, h.y) < h.r * 1.3) { s.cluck = 0.4; G.add(1, x, y); SFX.bawk ? SFX.bawk() : SFX.squawk(); if (!this.lay(G)) G.say("My nest is full! Hatch some eggs!", h.x, h.y - h.r * 1.5, 1.4); return; }
      SFX.boop(); },
    update(G, dt) { const s = G.s; s.cluck = Math.max(0, s.cluck - dt); s.parade = Math.max(0, s.parade - dt); for (const e of s.eggs) e.t += dt;
      for (const c of s.chicks) { c.ph += dt * 8; c.x += c.dir * G.u * (s.parade > 0 ? 30 : 8) * dt; if (c.x < G.u * 4) c.dir = 1; if (c.x > G.W - G.u * 4) c.dir = -1; } },
    autoTick(G) { if (!this.lay(G)) { const e = G.s.eggs[0]; if (e) this.hatch(G, e); } },
    draw(G, g) { const s = G.s, h = this.hen(G), R = h.r, bob = s.cluck > 0 ? Math.sin(s.cluck * 30) * G.u : 0;
      g.save(); g.translate(G.cx, h.y); g.rotate(G.t * 0.2); for (let i = 0; i < 10; i++) { g.rotate(Math.PI / 5); g.globalAlpha = 0.18; g.fillStyle = "#fff"; g.beginPath(); g.moveTo(0, 0); g.lineTo(-G.u * 7, -G.H); g.lineTo(G.u * 7, -G.H); g.fill(); } g.restore(); g.globalAlpha = 1;
      rr(g, G.u * 4, G.H * 0.69, G.W - G.u * 8, G.u * 13, G.u * 6, "#d9a35a"); for (let i = 0; i < 18; i++) { g.strokeStyle = "#b57d38"; g.lineWidth = 2; g.beginPath(); g.moveTo(G.u * 6 + i * (G.W - G.u * 12) / 18, G.H * 0.7); g.lineTo(G.u * 10 + i * (G.W - G.u * 12) / 18, G.H * 0.69 + G.u * 12); g.stroke(); }
      g.save(); g.translate(h.x, h.y + bob);
      oval(g, R * 0.15, R * 0.15, R * 1.05, R * 0.85, "#fffaf0"); for (const sd of [-1, 1]) oval(g, sd * R * 0.75, R * 0.2, R * 0.3, R * 0.5, "#f5ead4", INK, 3, sd * 0.3);
      for (let i = 0; i < 3; i++) oval(g, -R * 0.95, -R * 0.1 + i * R * 0.2, R * 0.3, R * 0.12, ["#ffd23f", "#ff86b3", "#6ec6ff"][i], INK, 3, -0.6 + i * 0.3);
      circ(g, R * 0.3, -R * 0.55, R * 0.55, "#fffaf0"); for (let i = 0; i < 3; i++) circ(g, R * (0.15 + i * 0.16), -R * 1.08 - (i === 1 ? R * 0.06 : 0), R * 0.13, "#f2483a");
      g.beginPath(); g.moveTo(R * 0.8, -R * 0.6); g.lineTo(R * 1.12, -R * 0.5); g.lineTo(R * 0.8, -R * 0.4); g.closePath(); g.fillStyle = "#ffb02e"; g.fill(); g.strokeStyle = INK; g.lineWidth = 3; g.stroke(); oval(g, R * 0.78, -R * 0.3, R * 0.06, R * 0.12, "#f2483a");
      face(g, R * 0.35, -R * 0.55, R * 0.4, s.cluck > 0 ? "wow" : s.parade > 0 ? "joy" : "happy");
      E(g, "👑", R * 0.3, -R * 1.35, R * 0.6, Math.sin(G.t * 2) * 0.1);
      for (const sd of [-1, 1]) { g.strokeStyle = "#ff9a3c"; g.lineWidth = G.u * 1.2; g.beginPath(); g.moveTo(R * 0.15 + sd * R * 0.3, R * 0.9); g.lineTo(R * 0.15 + sd * R * 0.3, R * 1.15); g.stroke(); }
      g.restore();
      for (const e of s.eggs) { const p = this.slot(G, e.i), w = Math.sin(e.t * 6) * 0.15 * Math.min(1, e.t); oval(g, p.x, p.y, G.u * 4.5, G.u * 6, e.gold ? "#ffcf3a" : "#fff8ee", e.gold ? "#b07800" : INK, 3, w); circ(g, p.x - G.u * 1.5, p.y - G.u * 2.5, G.u * 1, "rgba(255,255,255,.9)", null); if (e.gold) E(g, "✨", p.x + G.u * 4, p.y - G.u * 5, G.u * 4, 0, 0.5 + Math.sin(G.t * 5) * 0.5); }
      for (const c of s.chicks) E(g, c.gold ? "🐥" : "🐤", c.x, G.H - G.u * 6 - Math.abs(Math.sin(c.ph)) * G.u * 2.5, G.u * (c.gold ? 7 : 6), 0, 1, -c.dir, 1);
      txt(g, `🐣 Chicks: ${s.hatched}${s.golds ? ` · ✨ golden: ${s.golds}` : ""}`, G.cx, G.u * 6, G.u * 4, "#fff", { stroke: INK }); },
    hot(G) { const e = G.s.eggs[0]; return e ? this.slot(G, e.i) : this.hen(G); },
  },
  {
    id: "unicorn", name: "The Pizza Unicorn", rar: "golden", ico: "🦄", unit: "sparkles", base: 16, bg: ["#ffe3f3", "#d9e8ff"],
    blurb: "A unicorn who LOVES pizza! Pet her for sparkles, grab the golden slices, and fill her magic to go on a SKY GALLOP!",
    ups: [["tap", "Glitter Brush", "🖌️"], ["auto", "Fairy Friends", "🧚"], ["crit", "Rainbow Burst", "🌈"]],
    win: ["The unicorn neighed a little song.", "The unicorn's horn is extra sparkly today.", "You got a ride on the unicorn! Wheee!", "The unicorn sneezed glitter on the whole town.", "Rainbows now come with pizza on top.", "The unicorn told all the other unicorns about you.", "The clouds rained golden slices for an hour.", "You and the unicorn are best friends forever.", "Golden Crust Champion of All Time!"],
    init(G) { Object.assign(G.s, { magic: 0, sky: 0, golds: [], spawn: 1, pet: 0, gallops: 0 }); },
    uni(G) { const s = G.s; return { x: s.sky > 0 ? G.cx + Math.sin(G.t * 1.6) * G.W * 0.28 : G.cx, y: s.sky > 0 ? G.H * 0.38 + Math.sin(G.t * 3.2) * G.u * 6 : G.H * 0.56, r: Math.min(G.W * 0.2, G.u * 20) }; },
    down(G, x, y) { const s = G.s, u = this.uni(G);
      const gs = s.golds.find((q) => !q.got && dist(x, y, q.x, q.y) < G.u * 9); if (gs) { gs.got = 0.4; G.add(12, gs.x, gs.y, { color: "#ffd23f" }); SFX.coin(); return; }
      if (dist(x, y, u.x, u.y) < u.r * 1.2) { s.pet = 0.4; G.add(s.sky > 0 ? 3 : 1, x, y, { color: "#ff86b3" }); SFX.sparkle(); G.burst(x, y, ["✨", "💖"], 2, { size: 0.6, grav: -0.3 }); this.charge(G, 4); return; }
      SFX.boop(); },
    charge(G, n) { const s = G.s; if (s.sky > 0) return; s.magic = Math.min(100, s.magic + n); if (s.magic >= 100) { s.sky = 7; s.magic = 0; s.gallops++; SFX.wow(); G.flash("#fff0fb"); G.float("🌈 SKY GALLOP! 🌈", G.cx, G.u * 20, "#ff5d8f", 1.4); } },
    update(G, dt) { const s = G.s; s.pet = Math.max(0, s.pet - dt); s.sky = Math.max(0, s.sky - dt);
      if ((s.spawn -= dt) <= 0) { s.spawn = s.sky > 0 ? 0.35 : 1.8; const left = Math.random() < 0.5; s.golds.push({ x: left ? -G.u * 6 : G.W + G.u * 6, y: rnd(0.15, 0.6) * G.H, vx: (left ? 1 : -1) * G.u * rnd(14, 24), got: 0, r: 0 }); }
      for (let i = s.golds.length - 1; i >= 0; i--) { const q = s.golds[i]; if (q.got) { q.got -= dt; q.y -= G.u * 30 * dt; if (q.got <= 0) s.golds.splice(i, 1); continue; } q.x += q.vx * dt; q.r += dt * 2; if (q.x < -G.u * 10 || q.x > G.W + G.u * 10) s.golds.splice(i, 1); }
      if (s.sky > 0 && Math.random() < 0.6) { const u = this.uni(G); G.parts.push({ x: u.x - u.r * 0.6, y: u.y + u.r * 0.3, vx: -G.u * 5, vy: G.u * 4, life: 1.2, max: 1.2, c: pick(RAINBOW), size: G.u * 1.6, grav: 0.1 }); } },
    autoTick(G) { this.charge(G, 3); G.burst(G.cx, G.H * 0.2, "🧚", 1, { size: 0.6, grav: -0.3 }); },
    draw(G, g) { const s = G.s, u = this.uni(G);
      for (let i = 0; i < 6; i++) { g.beginPath(); g.arc(G.cx, G.H * 0.98, G.W * (0.5 - i * 0.04), Math.PI, 0); g.strokeStyle = RAINBOW[i]; g.lineWidth = G.W * 0.04; g.globalAlpha = 0.55; g.stroke(); } g.globalAlpha = 1;
      for (let i = 0; i < 4; i++) { const cx = ((i * 0.31 + G.t * 0.02) % 1.2) * G.W - G.W * 0.1, cy = G.H * (0.12 + (i % 2) * 0.1); for (const [dx, r] of [[-1, 0.7], [0, 1], [1, 0.75]]) circ(g, cx + dx * G.u * 6, cy, G.u * 5 * r, "#fff", null); }
      for (const q of s.golds) { g.save(); g.globalAlpha = q.got ? q.got / 0.4 : 1; E(g, "🍕", q.x, q.y, G.u * 9, q.r); circ(g, q.x, q.y, G.u * 6, null, "rgba(255,200,0,.8)", 3); g.restore(); }
      E(g, "🦄", u.x, u.y, u.r * 2 * (1 + s.pet * 0.15), Math.sin(G.t * (s.sky > 0 ? 8 : 2)) * 0.08, 1, s.sky > 0 && Math.cos(G.t * 1.6) < 0 ? 1 : -1, 1);
      if (s.sky > 0) txt(g, `🌈 SKY GALLOP! Tap everything! ${Math.ceil(s.sky)}s`, G.cx, G.u * 7, G.u * 4.2, "#fff", { stroke: INK });
      else { bar(g, G.cx - G.u * 24, G.u * 4, G.u * 48, G.u * 5, s.magic / 100, "#ff86b3"); txt(g, `🦄 Pet the unicorn · gallops: ${s.gallops}`, G.cx, G.u * 13, G.u * 3.6, "#fff", { stroke: INK }); } },
    hot(G) { const q = G.s.golds.find((q) => !q.got && q.x > 0 && q.x < G.W); return q || this.uni(G); },
  },
];
