// ==========================================================================
//  Emmy's Pizza Plus — clicker games, part 6: bees, socks, penguins & fairies.
//  Shiny, Rare, Super Rare and Sparkly — ten gentle, giggly little games.
// ==========================================================================
import { E, circ, oval, rr, txt, bar, face, pizza, speech, rnd, pick, clamp, dist, INK } from "./clicker.js";
import { SFX } from "./audio.js";

const RAINBOW = ["#ff5d8f", "#ffb347", "#ffe066", "#7cffb0", "#6ec6ff", "#b18cff"];
const heart = (g, x, y, r, fill, stroke = INK) => { g.beginPath(); g.moveTo(x, y + r * 0.9); g.bezierCurveTo(x - r * 1.6, y - r * 0.2, x - r * 0.6, y - r * 1.3, x, y - r * 0.4); g.bezierCurveTo(x + r * 0.6, y - r * 1.3, x + r * 1.6, y - r * 0.2, x, y + r * 0.9); g.closePath(); if (fill) { g.fillStyle = fill; g.fill(); } if (stroke) { g.strokeStyle = stroke; g.lineWidth = Math.max(1.5, r * 0.15); g.stroke(); } };
const twinkle = (g, x, y, r, c) => { g.beginPath(); for (let i = 0; i < 8; i++) { const a = (i * Math.PI) / 4, d = i % 2 ? r * 0.32 : r; g.lineTo(x + Math.cos(a) * d, y + Math.sin(a) * d); } g.closePath(); g.fillStyle = c; g.fill(); };
const puff = (g, x, y, r, fill = "#fff") => { for (const [dx, dy, k] of [[-0.6, 0.1, 0.6], [0, -0.2, 0.8], [0.6, 0.1, 0.65], [0, 0.2, 0.7]]) circ(g, x + dx * r, y + dy * r, r * k, fill, null); };
const poly = (v, t) => { const n = v.length, f = (((t % 1) + 1) % 1) * n, i = Math.floor(f), u = f - i, a = v[i], b = v[(i + 1) % n]; return [a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u]; };
const lerp = (a, b, k) => a + (b - a) * k;

export const GAMES_F = [
  // ------------------------------------------------------------------------
  //  SHINY
  // ------------------------------------------------------------------------
  {
    id: "bees", name: "Honey Bee Pizza", rar: "shiny", ico: "🐝", unit: "pollen", base: 2, bg: ["#fff6c9", "#d8f2b8"],
    blurb: "Tap a glowing flower and Buzzy the bee zooms over to grab the pollen. Then tap the hive! A full hive drizzles HONEY on the pizza.",
    ups: [["tap", "Fuzzy Pollen Pockets", "🌼"], ["auto", "Buzz Buddies", "🐝"], ["mult", "Golden Honey", "🍯"]],
    win: ["Bzzz! Buzzy did a happy loop-de-loop.", "The flowers are waving at you. It's the wind. Probably.", "Honey pizza is the new town favourite!", "The Bee Queen sent you a tiny thank-you crown.", "Buzzy learned to spell 'POLLEN' with wiggles.", "The hive is SO full it's humming a song.", "Bears are lining up for honey pizza. Very politely!", "Buzzy got a medal: Best Bee in the Garden.", "You are the Honey Pizza Superstar! Bzzzz!"],
    CARRY: 4, FULL: 16,
    init(G) { Object.assign(G.s, { fl: Array.from({ length: 6 }, (_, i) => ({ grow: 1, col: ["#ff86b3", "#ffffff", "#b18cff", "#ff9f43", "#6ec6ff", "#ff5d8f"][i] })), bx: G.cx, by: G.H * 0.42, tx: G.cx, ty: G.H * 0.42, dir: 1, carry: 0, honey: 0, drip: 0, pizzas: 0, fly: [] }); },
    flower(G, i) { const row = Math.floor(i / 3), c = i % 3; return { x: G.W * (0.22 + c * 0.28 + (row ? 0.06 : -0.04)), y: G.H * (0.6 + row * 0.19), r: Math.min(G.W * 0.07, G.u * 7) }; },
    hive(G) { return { x: G.W * 0.13, y: G.H * 0.32, r: Math.min(G.W * 0.11, G.u * 11) }; },
    plate(G) { return { x: G.W * 0.86, y: G.H * 0.34, r: Math.min(G.W * 0.11, G.u * 11) }; },
    honeyAdd(G, n) { const s = G.s; s.honey += n; if (s.honey < this.FULL) return; s.honey = 0; s.drip = 2.5; s.pizzas++; const p = this.plate(G); G.add(25, p.x, p.y - p.r, { color: "#ffd23f", noCrit: true }); SFX.win(); G.burst(p.x, p.y, ["🍯", "✨", "💛"], 12); G.float("🍯 HONEY PIZZA! 🍯", G.cx, G.u * 22, "#ff9f1c", 1.2); },
    down(G, x, y) { const s = G.s, h = this.hive(G);
      if (dist(x, y, h.x, h.y) < h.r * 1.3) { s.tx = h.x + h.r * 0.9; s.ty = h.y; if (s.carry) { const n = s.carry; s.carry = 0; G.add(3 * n, h.x, h.y - h.r, { color: "#ffd23f" }); SFX.ding(); G.dots(h.x, h.y, ["#ffd23f", "#ffb02e"], 10); this.honeyAdd(G, n); } else G.say("Bring me pollen, Buzzy!", h.x + h.r, h.y - h.r * 1.2, 1.2); return; }
      for (let i = 0; i < 6; i++) { const f = this.flower(G, i); if (dist(x, y, f.x, f.y) < f.r * 1.5) { s.tx = f.x; s.ty = f.y - f.r * 0.9;
        if (s.fl[i].grow < 1) { G.say("Still growing!", f.x, f.y - f.r * 1.3, 0.8); SFX.boop(); return; }
        if (s.carry >= this.CARRY) { G.say("Pockets full! Tap the hive!", f.x, f.y - f.r * 1.3, 1.3); SFX.boop(); return; }
        s.fl[i].grow = 0; s.carry++; G.add(1, f.x, f.y - f.r); SFX.pop(1.3); G.dots(f.x, f.y, ["#ffe066", "#ffd23f"], 8); return; } }
      if (dist(x, y, s.bx, s.by) < G.u * 8) { G.add(1, x, y); SFX.giggle(); G.say("Bzz hee hee! That tickles!", s.bx, s.by - G.u * 5, 1); return; }
      s.tx = x; s.ty = y; SFX.whoosh(); },
    update(G, dt) { const s = G.s; if (Math.abs(s.tx - s.bx) > 2) s.dir = s.tx > s.bx ? 1 : -1; s.bx += (s.tx - s.bx) * Math.min(1, dt * 7); s.by += (s.ty - s.by) * Math.min(1, dt * 7); s.drip = Math.max(0, s.drip - dt); for (const f of s.fl) f.grow = Math.min(1, f.grow + dt / 1.8);
      for (let i = s.fly.length - 1; i >= 0; i--) { const b = s.fly[i]; b.t += dt; if (b.t >= 1) { s.fly.splice(i, 1); this.honeyAdd(G, 1); } } },
    autoTick(G) { const s = G.s, i = s.fl.findIndex((f) => f.grow >= 1); if (i < 0) return; s.fl[i].grow = 0; const f = this.flower(G, i); s.fly.push({ x: f.x, y: f.y - f.r, t: 0 }); G.dots(f.x, f.y, ["#ffe066"], 5); },
    draw(G, g) { const s = G.s, h = this.hive(G), p = this.plate(G);
      circ(g, G.W * 0.5, G.H * 0.1, G.u * 0, null, null); E(g, "☀️", G.W * 0.94, G.u * 8, G.u * 9, G.t * 0.2);
      g.fillStyle = "#9bdc74"; g.beginPath(); g.moveTo(0, G.H * 0.5); for (let x = 0; x <= G.W + G.u * 6; x += G.u * 6) g.lineTo(x, G.H * 0.5 + Math.sin(x * 0.02) * G.u * 2); g.lineTo(G.W, G.H); g.lineTo(0, G.H); g.fill();
      // the hive hangs from a branch
      g.strokeStyle = "#8a5a2b"; g.lineWidth = G.u * 2; g.lineCap = "round"; g.beginPath(); g.moveTo(-G.u, h.y - h.r * 1.35); g.lineTo(h.x + h.r * 1.3, h.y - h.r * 1.45); g.stroke(); E(g, "🍃", h.x + h.r * 1.1, h.y - h.r * 1.6, G.u * 5);
      for (let i = 0; i < 4; i++) oval(g, h.x, h.y - h.r * 0.75 + i * h.r * 0.5, h.r * (0.55 + Math.sin(((i + 0.5) / 4) * Math.PI) * 0.45), h.r * 0.32, "#ffc94a", "#b8860b", 3);
      oval(g, h.x, h.y + h.r * 0.2, h.r * 0.2, h.r * 0.16, "#5a3410", null);
      // the plate & pizza (gets a honey swirl after the first full hive)
      oval(g, p.x, p.y + p.r * 0.1, p.r * 1.1, p.r, "#fffaf0"); pizza(g, p.x, p.y, p.r * 0.82, { peps: 6 });
      if (s.pizzas) { g.strokeStyle = "rgba(255,170,20,.85)"; g.lineWidth = G.u * 1.1; g.lineCap = "round"; g.beginPath(); for (let i = 0; i <= 30; i++) { const a = i * 0.5, d = p.r * 0.05 + i * p.r * 0.022; g.lineTo(p.x + Math.cos(a) * d, p.y + Math.sin(a) * d); } g.stroke(); }
      if (s.drip > 0) { const jy = p.y - p.r * 1.7; E(g, "🍯", p.x - p.r * 0.2, jy, G.u * 9, 0.7); g.strokeStyle = "#ffb02e"; g.lineWidth = G.u * 1.3; g.beginPath(); g.moveTo(p.x, jy + G.u * 2); g.quadraticCurveTo(p.x + Math.sin(G.t * 9) * G.u * 2, (jy + p.y) / 2, p.x, p.y); g.stroke(); }
      // flowers
      for (let i = 0; i < 6; i++) { const f = this.flower(G, i), q = s.fl[i], k = 0.45 + q.grow * 0.55, sw = Math.sin(G.t * 2 + i) * G.u * 0.6;
        g.strokeStyle = "#3f9a3a"; g.lineWidth = G.u * 1.1; g.beginPath(); g.moveTo(f.x, f.y + f.r * 2.2); g.lineTo(f.x + sw, f.y); g.stroke(); oval(g, f.x - f.r * 0.5, f.y + f.r * 1.3, f.r * 0.45, f.r * 0.18, "#5cc24f", INK, 2, -0.5);
        for (let j = 0; j < 6; j++) { const a = (j / 6) * Math.PI * 2 + G.t * 0.3; circ(g, f.x + sw + Math.cos(a) * f.r * 0.62 * k, f.y + Math.sin(a) * f.r * 0.62 * k, f.r * 0.45 * k, q.col, INK, 2); }
        if (q.grow >= 1) circ(g, f.x + sw, f.y, f.r * (0.55 + Math.sin(G.t * 5 + i) * 0.08), null, "rgba(255,220,60,.8)", G.u * 0.8);
        circ(g, f.x + sw, f.y, f.r * 0.38 * k, q.grow >= 1 ? "#ffd23f" : "#c9a86a", INK, 2); }
      for (const b of s.fly) E(g, "🐝", lerp(b.x, h.x, b.t), lerp(b.y, h.y, b.t) - Math.sin(b.t * Math.PI) * G.u * 10, G.u * 5);
      // Buzzy
      const by = s.by + Math.sin(G.t * 8) * G.u * 0.8; for (let i = 0; i < s.carry; i++) circ(g, s.bx + (i - 1.5) * G.u * 1.6, by + G.u * 4, G.u * 0.9, "#ffd23f", INK, 1.5);
      E(g, "🐝", s.bx, by, G.u * 9, Math.sin(G.t * 10) * 0.1, 1, -s.dir, 1);
      bar(g, G.cx - G.u * 24, G.u * 4, G.u * 48, G.u * 5, s.honey / this.FULL, "#ffb02e"); txt(g, `🌼 Pockets ${s.carry}/${this.CARRY} · 🍯 Honey pizzas: ${s.pizzas}`, G.cx, G.u * 13, G.u * 3.4, "#fff", { stroke: INK }); },
    hot(G) { const s = G.s, i = s.fl.findIndex((f) => f.grow >= 1); if (s.carry >= this.CARRY || (i < 0 && s.carry)) return this.hive(G); return i >= 0 ? this.flower(G, i) : this.hive(G); },
  },
  {
    id: "sockpuppet", name: "Sock Puppet Show", rar: "shiny", ico: "🧦", unit: "giggles", base: 2, bg: ["#3a1f4a", "#6b3a5e"], noDots: true,
    blurb: "It's showtime! Tap a sock puppet to tell a joke. The puppet with the ⭐ has the BEST joke. Make everyone laugh and they'll throw flowers — tap them to catch!",
    ups: [["tap", "Sillier Jokes", "🤡"], ["auto", "Puppet Pals", "🐵"], ["crit", "Big Belly Laugh", "😂"]],
    win: ["The audience giggled so much they snorted!", "A critic gave your show five socks out of five.", "The sock puppets want their own TV show now.", "Grandma laughed so much she did a happy dance.", "The sock drawer is SO jealous.", "Your show is sold out for a whole year!", "Even the grumpy cat cracked a smile.", "The puppets got a gold star. And a wash.", "World's Funniest Sock Show! Take a bow!"],
    JOKES: ["What do you call a sleepy pizza? A piZZZZa!", "What did the left sock say to the right sock? You're my sole mate!", "Knock knock! Who's there? Cheese! Cheese who? Cheese a jolly good fellow!", "What's a chicken's favourite pizza? Pepper-HEN-i!", "What does a happy pizza say? Have a nice slice!", "What room can nobody go in? A mushroom!", "What do clouds wear? Thunderwear!", "What do you call a dinosaur that loves pizza? A Pizza-saurus!", "Why did the banana go to the party? It was a-PEEL-ing!", "What do socks eat for breakfast? Toe-st!", "Why did the pizza bring a ladder? To reach the top-pings!", "What do you call a cow that plays music? A moo-sician!"],
    init(G) { Object.assign(G.s, { p: [0, 1, 2].map((i) => ({ hop: 0, talk: 0, col: ["#ff86b3", "#6ec6ff", "#7cdb8a"][i], st: ["#fff", "#ffe066", "#fff"][i] })), star: 1, starT: 5, joke: "", jokeP: 0, jokeT: 0, ji: Math.floor(rnd(0, 12)), laugh: 0, lol: 0, ov: 0, tossT: 0, fl: [], shows: 0, caught: 0 }); },
    pup(G, i) { const w = Math.min(G.W * 0.2, G.u * 20); return { x: G.W * (0.25 + 0.25 * i), y: G.H * 0.47, w }; },
    tell(G, i) { const s = G.s, q = s.p[i], P = this.pup(G, i), st = s.star === i && s.ov <= 0; q.hop = 1; q.talk = 1.6; s.joke = this.JOKES[s.ji++ % this.JOKES.length]; s.jokeP = i; s.jokeT = 3.2; s.lol = 1;
      G.add(st ? 4 : 2, P.x, P.y - P.w * 0.8, { color: st ? "#ffd23f" : "#fff" }); SFX.giggle(); if (st) { SFX.sparkle(); s.star = (i + 1 + Math.floor(rnd(0, 2))) % 3; s.starT = 5; }
      if (s.ov <= 0) { s.laugh = Math.min(100, s.laugh + (st ? 14 : 7)); if (s.laugh >= 100) { s.laugh = 0; s.ov = 4; s.shows++; G.add(20, G.cx, G.H * 0.3, { color: "#ffd23f", noCrit: true }); SFX.win(); G.float("👏 STANDING OVATION! 👏", G.cx, G.u * 22, "#ffd23f", 1.2); for (let k = 0; k < 5; k++) this.toss(G); } }
      if (Math.random() < 0.3) this.toss(G); },
    toss(G) { const s = G.s; if (s.fl.length >= 9) return; const sx = rnd(0.1, 0.9) * G.W; s.fl.push({ sx, x: sx, y: G.H * 0.9, tx: rnd(0.12, 0.88) * G.W, t: 0, e: pick(["🌷", "🌹", "🌼", "💐", "🌸"]) }); },
    down(G, x, y) { const s = G.s;
      for (let i = s.fl.length - 1; i >= 0; i--) { const f = s.fl[i]; if (f.t >= 1 && dist(x, y, f.x, f.y) < G.u * 7) { s.fl.splice(i, 1); s.caught++; G.add(3, f.x, f.y, { color: "#ff86b3" }); SFX.coin(); G.burst(f.x, f.y, ["💖", f.e], 4, { size: 0.7 }); return; } }
      for (let i = 0; i < 3; i++) { const P = this.pup(G, i); if (Math.abs(x - P.x) < P.w * 0.5 && y > P.y - P.w * 0.9 && y < G.H * 0.7) { this.tell(G, i); return; } }
      SFX.boop(); },
    update(G, dt) { const s = G.s; for (const q of s.p) { q.hop = Math.max(0, q.hop - dt * 3); q.talk = Math.max(0, q.talk - dt); } s.jokeT = Math.max(0, s.jokeT - dt); s.lol = Math.max(0, s.lol - dt * 0.6); s.ov = Math.max(0, s.ov - dt);
      if ((s.starT -= dt) <= 0) { s.star = (s.star + 1 + Math.floor(rnd(0, 2))) % 3; s.starT = 5; }
      if (s.ov > 0 && (s.tossT -= dt) <= 0) { s.tossT = 0.35; this.toss(G); }
      for (const f of s.fl) if (f.t < 1) { f.t = Math.min(1, f.t + dt * 1.3); f.x = lerp(f.sx, f.tx, f.t); f.y = lerp(G.H * 0.9, G.H * 0.76, f.t) - Math.sin(f.t * Math.PI) * G.H * 0.3; } },
    autoTick(G) { const s = G.s; this.tell(G, Math.random() < 0.5 ? s.star : Math.floor(rnd(0, 3))); },
    draw(G, g) { const s = G.s, top = G.H * 0.58;
      // spotlight + backdrop
      const sp = g.createRadialGradient(G.cx, top, 0, G.cx, top, G.W * 0.5); sp.addColorStop(0, "rgba(255,240,180,.45)"); sp.addColorStop(1, "rgba(255,240,180,0)"); g.fillStyle = sp; g.fillRect(0, 0, G.W, G.H);
      for (let i = 0; i < 3; i++) { const P = this.pup(G, i), q = s.p[i], hy = P.y - q.hop * G.u * 5 + Math.sin(G.t * 3 + i) * G.u * 0.8, w2 = P.w * 0.32;
        rr(g, P.x - w2, hy, w2 * 2, top + G.u * 4 - hy, w2 * 0.6, q.col); for (let k = 0; k < 3; k++) rr(g, P.x - w2 + 1.5, hy + P.w * (0.42 + k * 0.2), w2 * 2 - 3, P.w * 0.07, 0, q.st, null);
        oval(g, P.x, hy, P.w * 0.44, P.w * 0.34, q.col); for (let k = -2; k <= 2; k++) circ(g, P.x + k * P.w * 0.09, hy - P.w * 0.33 - Math.abs(k) * -P.w * 0.02, P.w * 0.07, ["#ffe066", "#ff9f43", "#b18cff"][(k + 2) % 3]);
        face(g, P.x, hy - P.w * 0.02, P.w * 0.3, q.talk > 0 ? (Math.sin(G.t * 18) > 0 ? "wow" : "joy") : s.ov > 0 ? "joy" : "happy");
        if (s.star === i && s.ov <= 0) E(g, "⭐", P.x + P.w * 0.42, hy - P.w * 0.42, G.u * (6 + Math.sin(G.t * 6))); }
      // the booth
      rr(g, G.W * 0.05, top, G.W * 0.9, G.H * 0.12, G.u * 2, "#b5651d", INK, 4); for (let i = 1; i < 6; i++) { g.strokeStyle = "rgba(74,42,26,.35)"; g.lineWidth = 2; g.beginPath(); g.moveTo(G.W * 0.05 + (G.W * 0.9 * i) / 6, top + 3); g.lineTo(G.W * 0.05 + (G.W * 0.9 * i) / 6, top + G.H * 0.12 - 3); g.stroke(); }
      txt(g, "🧦 THE SOCK SHOW 🧦", G.cx, top + G.H * 0.06, Math.min(G.u * 4.2, G.W * 0.045), "#ffe066", { stroke: INK });
      // curtains & a wavy top
      for (const sd of [0, 1]) { const x0 = sd ? G.W * 0.93 : 0; g.fillStyle = "#d8344a"; g.fillRect(x0, 0, G.W * 0.07, top + G.H * 0.12); g.strokeStyle = "#9a1f30"; g.lineWidth = 3; for (let k = 1; k < 3; k++) { g.beginPath(); g.moveTo(x0 + (G.W * 0.07 * k) / 3, 0); g.lineTo(x0 + (G.W * 0.07 * k) / 3, top + G.H * 0.12); g.stroke(); } }
      g.fillStyle = "#d8344a"; g.beginPath(); g.moveTo(0, 0); g.lineTo(G.W, 0); for (let i = 12; i >= 0; i--) g.quadraticCurveTo(G.W * ((i + 0.5) / 12), G.H * 0.05, G.W * (i / 12), G.H * 0.025); g.fill();
      // flowers on the floor, and the audience
      for (const f of s.fl) E(g, f.e, f.x, f.y, G.u * 6, f.t < 1 ? f.t * 8 : Math.sin(G.t * 2 + f.sx) * 0.15);
      const n = 7; for (let i = 0; i < n; i++) { const ax = G.W * (0.08 + (0.84 * i) / (n - 1)), jump = s.lol > 0 || s.ov > 0 ? Math.abs(Math.sin(G.t * 10 + i)) * G.u * 2.5 : 0; E(g, ["🐻", "🐰", "🐔", "🐱", "🐶", "🐸", "🐷"][i], ax, G.H * 0.92 - jump, G.u * 8); if (s.lol > 0.5 && i % 2 === Math.floor(G.t * 3) % 2) txt(g, "ha!", ax, G.H * 0.92 - G.u * 7 - jump, G.u * 3, "#ffe066", { stroke: INK }); }
      if (s.jokeT > 0) { const P = this.pup(G, s.jokeP); g.globalAlpha = clamp(s.jokeT * 3, 0, 1); speech(g, s.joke, P.x, P.y - P.w * 0.75, G.u * 3.2 + 6, { maxW: Math.min(G.W * 0.62, 320) }); g.globalAlpha = 1; }
      if (s.ov > 0) txt(g, `👏 Bravo! Catch the flowers! 👏`, G.cx, G.u * 9, G.u * 4, "#ffe066", { stroke: INK });
      else { bar(g, G.cx - G.u * 22, G.u * 5, G.u * 44, G.u * 4.5, s.laugh / 100, "#ffd23f"); txt(g, `😂 Laugh-o-meter · ovations: ${s.shows}`, G.cx, G.u * 13.5, G.u * 3.4, "#fff", { stroke: INK }); } },
    hot(G) { const f = G.s.fl.find((f) => f.t >= 1); if (f) return f; const P = this.pup(G, G.s.star); return { x: P.x, y: P.y }; },
  },

  // ------------------------------------------------------------------------
  //  RARE
  // ------------------------------------------------------------------------
  {
    id: "penguin", name: "Penguin Pizza Slide", rar: "rare", ico: "🐧", unit: "slides", base: 2, bg: ["#d9f2ff", "#a8dcff"],
    blurb: "The penguins want to slide down to the pizza picnic! Tap to send the next one. Tap when the arrow is in the GREEN for a spinny belly-slide!",
    ups: [["tap", "Slippery Ice", "🧊"], ["auto", "Seal Cheerleaders", "🦭"], ["crit", "Super Spin", "🌀"]],
    win: ["Wheee! The first penguin giggled all the way down.", "The penguins made you an honorary penguin!", "Belly sliding is now an Olympic sport.", "The picnic blanket is FULL of penguins.", "A penguin did a TRIPLE spin. Then had a nap.", "The hill is so shiny you can see your smile!", "Penguins came from far, far away to slide!", "The Penguin Mayor gave you a fishy medal. It sparkles!", "Grand Champion of the Penguin Slide!"],
    PARTY: 8,
    init(G) { Object.assign(G.s, { sl: [], picnic: [], cd: 0, party: 0, parties: 0, sent: 0 }); },
    top(G) { return { x: G.W * 0.22, y: G.H * 0.4 }; }, bot(G) { return { x: G.W * 0.64, y: G.H * 0.8 }; },
    meter(G) { return (Math.sin(G.t * 2.4) + 1) / 2; },
    perfect(G) { return Math.abs(this.meter(G) - 0.5) < 0.14; },
    send(G, perfect) { const s = G.s, a = this.top(G); if (s.cd > 0 || s.party > 0) return false; s.cd = 0.35; s.sent++; s.sl.push({ p: 0, perfect, rot: 0 });
      if (perfect) { G.add(5, a.x, a.y - G.u * 8, { color: "#7cffb0" }); G.float("PERFECT SPIN!", a.x + G.u * 12, a.y - G.u * 16, "#2fbf6a", 0.9); SFX.sparkle(); } else G.add(2, a.x, a.y - G.u * 8); SFX.whoosh(); return true; },
    down(G, x, y) { const s = G.s, b = this.bot(G); if (s.party > 0) { if (y > b.y - G.u * 12) { G.add(1, x, y); SFX.peep(); G.burst(x, y, ["💙", "❄️"], 3, { size: 0.6 }); } return; } if (!this.send(G, this.perfect(G))) SFX.boop(); },
    update(G, dt) { const s = G.s, b = this.bot(G); s.cd = Math.max(0, s.cd - dt);
      if (s.party > 0 && (s.party -= dt) <= 0) s.picnic = [];
      for (let i = s.sl.length - 1; i >= 0; i--) { const q = s.sl[i]; q.p += dt / 1.5; q.rot += dt * (q.perfect ? 14 : 0);
        if (q.p >= 1) { s.sl.splice(i, 1); s.picnic.push({ ph: rnd(0, 6) }); SFX.peep(); G.dots(G.W * 0.85, b.y, ["#fff", "#bfe3ff"], 8);
          if (s.picnic.length >= this.PARTY && s.party <= 0) { s.party = 3.5; s.parties++; G.add(30, G.W * 0.82, b.y - G.u * 14, { color: "#ffd23f", noCrit: true }); SFX.win(); G.float("🐧 PENGUIN PIZZA PARTY! 🐧", G.cx, G.u * 24, "#ff5d8f", 1.2); G.burst(G.W * 0.84, b.y, ["🍕", "🎉", "💙"], 14); s.sl = []; } } } },
    autoTick(G) { G.s.cd = 0; if (this.send(G, Math.random() < 0.5)) G.burst(this.top(G).x, this.top(G).y, "🦭", 1, { size: 0.6 }); },
    pos(G, q) { const a = this.top(G), b = this.bot(G); if (q.p < 0.8) { const k = q.p / 0.8, e = k * k; return { x: lerp(a.x, b.x, e), y: lerp(a.y, b.y, e), ang: Math.atan2(b.y - a.y, b.x - a.x) }; } const k = (q.p - 0.8) / 0.2; return { x: lerp(b.x, G.W * 0.8, k), y: b.y, ang: 0 }; },
    spot(G, i) { const b = this.bot(G); return { x: G.W * (0.74 + (i % 4) * 0.06), y: b.y + (i < 4 ? -G.u * 1 : G.u * 7) }; },
    draw(G, g) { const s = G.s, a = this.top(G), b = this.bot(G);
      for (let i = 0; i < 30; i++) circ(g, (i * 97.3 + Math.sin(G.t + i) * 10) % G.W, (i * 53.1 + G.t * G.u * 4 * (1 + (i % 3))) % G.H, G.u * 0.5, "#fff", null);
      for (const [x, y, r] of [[0.85, 0.32, 1], [0.6, 0.38, 0.7]]) { g.fillStyle = "#eaf6ff"; g.beginPath(); g.moveTo(G.W * x - G.W * 0.18 * r, G.H * 0.8); g.lineTo(G.W * x, G.H * y); g.lineTo(G.W * x + G.W * 0.18 * r, G.H * 0.8); g.fill(); }
      g.fillStyle = "#ffffff"; g.beginPath(); g.moveTo(-5, a.y); g.lineTo(a.x, a.y); g.quadraticCurveTo(lerp(a.x, b.x, 0.25), lerp(a.y, b.y, 0.12), b.x, b.y); g.lineTo(G.W + 5, b.y); g.lineTo(G.W + 5, G.H + 5); g.lineTo(-5, G.H + 5); g.closePath(); g.fill(); g.strokeStyle = "#6fb6e8"; g.lineWidth = 4; g.stroke();
      E(g, "🌲", G.W * 0.08, G.H * 0.66, G.u * 10); E(g, "🌲", G.W * 0.3, G.H * 0.85, G.u * 8); E(g, "⛄", G.W * 0.45, G.H * 0.9, G.u * 7);
      // picnic blanket
      oval(g, G.W * 0.83, b.y + G.u * 3, G.W * 0.14, G.u * 6, "#ff6b6b"); g.save(); g.beginPath(); g.ellipse(G.W * 0.83, b.y + G.u * 3, G.W * 0.14, G.u * 6, 0, 0, 7); g.clip(); g.fillStyle = "rgba(255,255,255,.6)"; for (let i = -8; i < 8; i++) { g.fillRect(G.W * 0.83 + i * G.u * 4, b.y - G.u * 4, G.u * 2, G.u * 14); g.fillRect(G.W * 0.65, b.y + G.u * 3 + i * G.u * 4, G.W * 0.4, G.u * 2); } g.restore();
      g.save(); g.translate(G.W * 0.83, b.y + G.u * 3); g.scale(1, 0.5); pizza(g, 0, 0, G.u * 5, { peps: 5 }); g.restore();
      for (let i = 0; i < s.picnic.length; i++) { const p = this.spot(G, i), q = s.picnic[i], j = s.party > 0 ? Math.abs(Math.sin(G.t * 9 + q.ph)) * G.u * 4 : Math.abs(Math.sin(G.t * 2 + q.ph)) * G.u * 0.6; E(g, "🐧", p.x, p.y - G.u * 3 - j, G.u * 6.5, s.party > 0 ? Math.sin(G.t * 8 + q.ph) * 0.2 : 0); }
      // the line-up at the top & the sliders
      if (s.party <= 0) for (let i = 0; i < 3; i++) E(g, "🐧", a.x - G.u * 3 - i * G.u * 6.5, a.y - G.u * 3.5 + (i ? Math.abs(Math.sin(G.t * 4 + i)) * -G.u : 0), G.u * 7, 0, 1, -1, 1);
      for (const q of s.sl) { const p = this.pos(G, q); E(g, "🐧", p.x, p.y - G.u * 3, G.u * 7, q.perfect ? q.rot : p.ang - Math.PI * 0.35, 1, -1, 1); if (q.perfect) G.parts.push({ x: p.x, y: p.y, vx: 0, vy: -G.u * 3, life: 0.4, max: 0.4, c: pick(["#fff", "#bfe3ff", "#7cffb0"]), size: G.u * 0.8, grav: 0 }); }
      // the GO-meter
      const mw = Math.min(G.W * 0.6, G.u * 60), mx = G.cx - mw / 2, my = G.u * 15, m = this.meter(G), ok = this.perfect(G);
      rr(g, mx, my, mw, G.u * 4, G.u * 2, "rgba(255,255,255,.85)", INK, 3); rr(g, mx + mw * 0.36, my + 3, mw * 0.28, G.u * 4 - 6, G.u * 1.5, "#7cdb8a", null);
      const ax = mx + mw * m; g.fillStyle = ok ? "#2fbf6a" : "#ff5d8f"; g.beginPath(); g.moveTo(ax, my + G.u * 0.5); g.lineTo(ax - G.u * 1.8, my - G.u * 2.5); g.lineTo(ax + G.u * 1.8, my - G.u * 2.5); g.closePath(); g.fill(); g.strokeStyle = INK; g.lineWidth = 2; g.stroke();
      txt(g, s.party > 0 ? "🎉 Party time! Tap to high-five! 🎉" : `🐧 At the picnic: ${s.picnic.length}/${this.PARTY} · parties: ${s.parties}`, G.cx, G.u * 6, G.u * 3.6, "#fff", { stroke: INK }); },
    hot(G) { return G.s.party > 0 ? this.spot(G, 0) : { x: G.cx, y: G.cy }; },
  },
  {
    id: "treehouse", name: "Treehouse Pizza Pulley", rar: "rare", ico: "🌳", unit: "pulls", base: 2, bg: ["#cdeeff", "#a6e08f"],
    blurb: "Your friends in the treehouse are hungry! Pull the rope DOWN (drag it, or just tap) to lift the basket all the way up to them.",
    ups: [["tap", "Strong Arms", "💪"], ["auto", "Squirrel Pullers", "🐿️"], ["mult", "Extra Cheesy Basket", "🧺"]],
    win: ["Yum! The treehouse smells like pizza now.", "Bear says you're the best basket-puller ever!", "The treehouse got a new sign: PIZZA PLEASE.", "Bunny drew your picture on the treehouse wall.", "The birds want baskets delivered too!", "Your arms are SO strong. Like a superhero!", "The treehouse added a second floor. For pizza.", "Owl wrote a song about you. It goes 'hoo-ray!'", "Champion of the Treehouse! Pizza's up!"],
    TREATS: ["🍕", "🍕", "🍕", "🧃", "🍪", "🍓", "🧁"],
    init(G) { Object.assign(G.s, { h: 0, acc: 0, got: 0, drop: 0, treat: "🍕", done: 0, party: 0, grab: false, yank: 0 }); },
    L(G) { const wr = Math.min(G.W * 0.04, G.u * 4); return { bx: G.W * 0.68 - wr, px: G.W * 0.68 + wr, wx: G.W * 0.68, py: G.H * 0.2, wr, botY: G.H * 0.84, topY: G.H * 0.33, deck: G.H * 0.38 }; },
    handle(G) { return { x: G.W * 0.68 + Math.min(G.W * 0.04, G.u * 4), y: G.H * (0.48 + G.s.h * 0.36) }; },
    pull(G, amt, x, y) { const s = G.s; if (s.got > 0 || s.drop > 0) return; s.h = Math.min(1, s.h + amt); s.acc += amt; s.yank = 0.2;
      while (s.acc >= 0.099) { s.acc -= 0.1; G.add(1, x, y); G.tone(300 + s.h * 500, 0.06, { type: "triangle", vol: 0.08 }); }
      if (s.h < 1) return; const L = this.L(G); s.got = 1.4; s.done++; G.add(15, L.bx, L.topY - G.u * 8, { color: "#ffd23f", noCrit: true }); SFX.ding(); G.burst(L.bx, L.topY, ["💖", s.treat, "✨"], 8);
      G.say(pick(["Thank you!! Yum!", "Pizza delivery! Hooray!", "You're the best!", "Mmm, still warm!"]), G.W * 0.38, G.H * 0.2, 1.4);
      if (s.done % 5 === 0) { s.party = 4; G.add(30, G.cx, G.H * 0.3, { color: "#ffd23f", noCrit: true }); SFX.win(); G.float("🎉 TREEHOUSE PARTY! 🎉", G.cx, G.u * 22, "#ff5d8f", 1.2); G.flash("#fff6c9"); } },
    down(G, x, y) { const s = G.s; if (s.got > 0 || s.drop > 0) { SFX.boop(); return; } s.grab = true; this.pull(G, 0.1, x, y); },
    move(G, x, y, ox, oy) { if (G.down && G.s.grab && y > oy) this.pull(G, (y - oy) / (G.H * 0.5), x, y); },
    up(G) { G.s.grab = false; },
    update(G, dt) { const s = G.s; s.yank = Math.max(0, s.yank - dt); s.party = Math.max(0, s.party - dt);
      if (s.got > 0 && (s.got -= dt) <= 0) { s.got = 0; s.drop = 1; }
      if (s.drop > 0) { s.drop = Math.max(0, s.drop - dt); s.h = s.drop; if (!s.drop) { s.treat = pick(this.TREATS); s.acc = 0; } } },
    autoTick(G) { const hd = this.handle(G); this.pull(G, 0.15, hd.x, hd.y); G.burst(hd.x, hd.y, "🐿️", 1, { size: 0.6 }); },
    draw(G, g) { const s = G.s, L = this.L(G), hd = this.handle(G), by = lerp(L.botY, L.topY, s.h), bw = Math.min(G.W * 0.1, G.u * 10);
      for (let i = 0; i < 3; i++) puff(g, ((i * 0.37 + G.t * 0.015) % 1.2) * G.W - G.W * 0.1, G.H * (0.07 + (i % 2) * 0.06), G.u * 6);
      // trunk, leaves, deck & house
      rr(g, G.W * 0.27, G.H * 0.3, G.W * 0.09, G.H * 0.75, G.u * 2, "#9a6233"); for (const [x, y, r] of [[0.18, 0.16, 12], [0.32, 0.1, 14], [0.46, 0.17, 11], [0.1, 0.3, 9], [0.53, 0.3, 8]]) circ(g, G.W * x, G.H * y, G.u * r, "#5cbf4a", "#3f8a33", 3);
      if (s.party > 0) { g.strokeStyle = INK; g.lineWidth = 2; g.beginPath(); g.moveTo(G.W * 0.1, G.H * 0.22); g.quadraticCurveTo(G.W * 0.3, G.H * 0.3, G.W * 0.55, G.H * 0.22); g.stroke(); for (let i = 0; i < 9; i++) { const k = i / 8, fx = lerp(G.W * 0.1, G.W * 0.55, k), fy = G.H * 0.22 + Math.sin(k * Math.PI) * G.H * 0.04; g.fillStyle = RAINBOW[i % 6]; g.beginPath(); g.moveTo(fx - G.u * 1.5, fy); g.lineTo(fx + G.u * 1.5, fy); g.lineTo(fx, fy + G.u * 3.5); g.fill(); } }
      rr(g, G.W * 0.12, L.deck - G.H * 0.17, G.W * 0.38, G.H * 0.17, G.u * 1.5, "#d99a5b"); g.fillStyle = "#e0574f"; g.beginPath(); g.moveTo(G.W * 0.1, L.deck - G.H * 0.17); g.lineTo(G.W * 0.31, L.deck - G.H * 0.27); g.lineTo(G.W * 0.52, L.deck - G.H * 0.17); g.closePath(); g.fill(); g.strokeStyle = INK; g.lineWidth = 3; g.stroke();
      const friends = ["🐻", "🐰", "🦉"]; for (let i = 0; i < 3; i++) { const fx = G.W * (0.19 + i * 0.11), fy = L.deck - G.H * 0.085; rr(g, fx - G.u * 4.5, fy - G.u * 4.5, G.u * 9, G.u * 9, G.u * 1.5, "#fff3c4"); E(g, friends[i], fx, fy + (s.got > 0 || s.party > 0 ? -Math.abs(Math.sin(G.t * 8 + i)) * G.u * 1.5 : 0), G.u * 7); }
      rr(g, G.W * 0.08, L.deck, G.W * 0.5, G.u * 3, G.u, "#8a5a2b");
      // the pulley
      g.strokeStyle = "#8a5a2b"; g.lineWidth = G.u * 2; g.beginPath(); g.moveTo(G.W * 0.44, L.py - G.u * 2); g.lineTo(L.wx, L.py - G.u * 2); g.stroke();
      g.strokeStyle = "#c9a36b"; g.lineWidth = G.u * 0.9; g.beginPath(); g.moveTo(L.bx, by - bw * 0.7); g.lineTo(L.bx, L.py); g.arc(L.wx, L.py, L.wr, Math.PI, 0); g.lineTo(L.px, hd.y); g.stroke();
      circ(g, L.wx, L.py, L.wr, "#c9d3e8"); g.save(); g.translate(L.wx, L.py); g.rotate(s.h * 12); for (let i = 0; i < 4; i++) { g.rotate(Math.PI / 2); g.strokeStyle = INK; g.lineWidth = 2; g.beginPath(); g.moveTo(0, 0); g.lineTo(L.wr * 0.8, 0); g.stroke(); } g.restore(); circ(g, L.wx, L.py, L.wr * 0.2, "#888");
      // the basket
      g.strokeStyle = INK; g.lineWidth = 3; g.beginPath(); g.arc(L.bx, by - bw * 0.1, bw * 0.55, Math.PI, 0); g.stroke();
      if (s.got < 0.7 || s.got <= 0) { if (!(s.got > 0)) E(g, s.treat, L.bx, by - bw * 0.15, bw * 0.8); } rr(g, L.bx - bw / 2, by - bw * 0.1, bw, bw * 0.6, bw * 0.15, "#d6a15c"); for (let i = 1; i < 4; i++) { g.strokeStyle = "rgba(74,42,26,.5)"; g.lineWidth = 2; g.beginPath(); g.moveTo(L.bx - bw / 2 + (bw * i) / 4, by - bw * 0.05); g.lineTo(L.bx - bw / 2 + (bw * i) / 4, by + bw * 0.45); g.stroke(); }
      if (s.got > 0) E(g, s.treat, lerp(L.bx, G.W * 0.45, 1 - s.got / 1.4), L.deck - G.u * 5, bw * 0.7);
      // the handle you pull
      circ(g, hd.x, hd.y, G.u * (3.5 + s.yank * 5), "#ff86b3"); if (s.got <= 0 && s.drop <= 0) { txt(g, "PULL", hd.x, hd.y + G.u * 7.5, G.u * 3.4, "#fff", { stroke: INK }); E(g, "⬇️", hd.x + G.u * 7, hd.y + Math.sin(G.t * 6) * G.u * 1.5, G.u * 5); }
      txt(g, `🧺 Treats delivered: ${s.done}${s.party > 0 ? " · 🎉 PARTY!" : ""}`, G.W * 0.74, G.u * 6, Math.min(G.u * 3.6, G.W * 0.04), "#fff", { stroke: INK }); },
    hot(G) { return this.handle(G); },
  },

  // ------------------------------------------------------------------------
  //  SUPER RARE
  // ------------------------------------------------------------------------
  {
    id: "eggpaint", name: "Egg Painting Party", rar: "superrare", ico: "🥚", unit: "dabs", base: 2, bg: ["#fff4fb", "#e3f4ff"],
    blurb: "Pick stripes, dots or hearts and a colour, then tap the egg to paint! Henrietta the hen LOVES admiring finished eggs. Use all three patterns for a TRIPLE FANCY bonus!",
    ups: [["tap", "Bigger Brush", "🖌️"], ["auto", "Paint Chicks", "🐥"], ["mult", "Glitter Paint", "✨"]],
    win: ["Henrietta clucked a happy little song!", "Your eggs are in the Chicken Art Museum.", "Henrietta put your egg on the fridge.", "The bunnies want painting lessons!", "So many pretty eggs! Henrietta is SO proud.", "A golden egg! Henrietta did a twirl.", "The farm has an egg art show. You won!", "Henrietta made you a feather paintbrush.", "Grand Master of Egg Art! Bawk bawk!"],
    TOOLS: ["stripe", "dot", "heart"], COLS: ["#ff5d8f", "#ffb347", "#47c26a", "#5aa9ff", "#a77cff"], NEED: 8,
    init(G) { Object.assign(G.s, { tool: 0, col: 0, egg: this.newEgg(0), shelf: [], admire: 0, made: 0, pop: 1, pet: 0 }); },
    newEgg(made) { return { gold: made % 5 === 4, base: made % 5 === 4 ? "#ffd75e" : pick(["#fffaf0", "#fff3c4", "#e8f7ff", "#ffe8f1", "#eaffea"]), d: [] }; },
    egg(G) { const rx = Math.min(G.W * 0.19, G.H * 0.16, G.u * 19); return { x: G.cx - G.W * 0.06, y: G.H * 0.5, rx, ry: rx * 1.3 }; },
    hen(G) { return { x: G.W * 0.84, y: G.H * 0.5, r: Math.min(G.W * 0.13, G.u * 13) }; },
    btn(G, i) { const bs = Math.min(G.W / 9.5, G.u * 10); return { x: G.cx + (i - 3.5) * bs * 1.15 + (i < 3 ? -bs * 0.2 : bs * 0.2), y: G.H * 0.86, r: bs * 0.46 }; },
    dab(G, nx, ny, tool = G.s.tool, col = G.s.col) { const s = G.s, e = this.egg(G); s.egg.d.push({ k: tool, x: nx, y: ny, c: this.COLS[col], r: rnd(-0.4, 0.4) }); const px = e.x + nx * e.rx, py = e.y + ny * e.ry; G.add(s.egg.gold ? 2 : 1, px, py, { color: this.COLS[col] }); G.tone(500 + tool * 150 + rnd(0, 120), 0.08, { type: "triangle", vol: 0.1 }); G.dots(px, py, [this.COLS[col], "#fff"], 5);
      if (s.egg.d.length < this.NEED) return; const kinds = new Set(s.egg.d.map((d) => d.k)).size, h = this.hen(G); s.admire = 2; s.made++;
      G.add((kinds === 3 ? 24 : 12) * (s.egg.gold ? 2 : 1), e.x, e.y - e.ry, { color: "#ffd23f", noCrit: true }); SFX.bawk(); G.burst(h.x, h.y - h.r, ["💖", "✨"], 8);
      G.say(s.egg.gold ? "A GOLDEN egg! Bawk-tastic!" : pick(["Bawk! Beautiful!", "Ooh, so fancy!", "Best egg EVER!", "I'm so proud! Cluck!", "Can I keep it? Please?"]), h.x - h.r * 0.3, h.y - h.r * 1.2, 1.8);
      if (kinds === 3) { G.float("✨ TRIPLE FANCY! ✨", G.cx, G.u * 24, "#ff5d8f", 1.2); SFX.sparkle(); } s.shelf.push(s.egg); s.egg = this.newEgg(s.made); s.pop = 0; },
    down(G, x, y) { const s = G.s, e = this.egg(G), h = this.hen(G);
      for (let i = 0; i < 8; i++) { const b = this.btn(G, i); if (dist(x, y, b.x, b.y) < b.r * 1.15) { if (i < 3) s.tool = i; else s.col = i - 3; SFX.tap(); return; } }
      const nx = (x - e.x) / e.rx, ny = (y - e.y) / e.ry; if (nx * nx + ny * ny <= 1.1) { this.dab(G, nx, ny); return; }
      if (dist(x, y, h.x, h.y) < h.r) { s.pet = 0.4; G.add(1, x, y); SFX.bawk(); G.burst(x, y, "💖", 2, { size: 0.6 }); return; }
      SFX.boop(); },
    update(G, dt) { const s = G.s; s.admire = Math.max(0, s.admire - dt); s.pop = Math.min(1, s.pop + dt * 3); s.pet = Math.max(0, s.pet - dt); },
    autoTick(G) { const a = rnd(0, Math.PI * 2), d = Math.sqrt(Math.random()) * 0.75; this.dab(G, Math.cos(a) * d, Math.sin(a) * d, Math.floor(rnd(0, 3)), Math.floor(rnd(0, 5))); const e = this.egg(G); G.burst(e.x + Math.cos(a) * d * e.rx, e.y + Math.sin(a) * d * e.ry, "🐥", 1, { size: 0.6 }); },
    drawEgg(G, g, egg, x, y, rx, ry) { g.save(); g.beginPath(); g.ellipse(x, y, rx, ry, 0, 0, 7); g.fillStyle = egg.base; g.fill(); g.clip();
      for (const d of egg.d) { const px = x + d.x * rx, py = y + d.y * ry; if (d.k === 0) { g.strokeStyle = d.c; g.lineWidth = ry * 0.09; g.lineJoin = "round"; g.beginPath(); for (let i = 0; i <= 12; i++) g.lineTo(x - rx + (i * rx) / 6, py + (i % 2 ? -1 : 1) * ry * 0.05 + d.r * ry * 0.05); g.stroke(); } else if (d.k === 1) circ(g, px, py, rx * 0.12, d.c, null); else heart(g, px, py, rx * 0.13, d.c, null); }
      if (egg.gold) { g.fillStyle = "rgba(255,255,255,.35)"; g.fillRect(x - rx * 0.6, y - ry, rx * 0.2, ry * 2); } g.restore();
      oval(g, x, y, rx, ry, null, egg.gold ? "#b07800" : INK, Math.max(2, rx * 0.05)); oval(g, x - rx * 0.4, y - ry * 0.45, rx * 0.12, ry * 0.18, "rgba(255,255,255,.7)", null, null, 0.4); },
    draw(G, g) { const s = G.s, e = this.egg(G), h = this.hen(G), k = 0.3 + s.pop * 0.7;
      for (let i = 0; i < 10; i++) E(g, ["🌷", "🌼", "🌱"][i % 3], ((i + 0.5) / 10) * G.W, G.H * 0.97, G.u * 4);
      // shelf of finished eggs
      const sh = s.shelf.slice(-8), sy = G.u * 16; rr(g, G.cx - G.u * 40, sy + G.u * 3.5, G.u * 80, G.u * 2, G.u, "#c98a4b");
      sh.forEach((q, i) => this.drawEgg(G, g, q, G.cx + (i - (sh.length - 1) / 2) * G.u * 9, sy, G.u * 2.6, G.u * 3.4));
      // the big egg in a cup
      oval(g, e.x, e.y + e.ry * 1.05, e.rx * 1.1, e.ry * 0.12, "rgba(74,42,26,.12)", null);
      this.drawEgg(G, g, s.egg, e.x, e.y, e.rx * k, e.ry * k); rr(g, e.x - e.rx * 0.6, e.y + e.ry * 0.7, e.rx * 1.2, e.ry * 0.35, e.rx * 0.2, "#ff9fc4");
      if (s.egg.gold) E(g, "✨", e.x + e.rx * 0.9, e.y - e.ry * 0.8, G.u * 6, 0, 0.5 + Math.sin(G.t * 5) * 0.5);
      // Henrietta
      const hb = s.admire > 0 ? Math.abs(Math.sin(G.t * 10)) * G.u * 2 : s.pet > 0 ? G.u : 0; E(g, "🐔", h.x, h.y - hb, h.r * 2, s.admire > 0 ? Math.sin(G.t * 8) * 0.1 : 0);
      if (s.admire > 0) for (let i = 0; i < 3; i++) heart(g, h.x - h.r * 0.6 + i * h.r * 0.6, h.y - h.r * 1.2 - ((G.t * 30 + i * 20) % 30) * G.u * 0.2, G.u * 1.5, "#ff5d8f");
      // brushes & colours
      for (let i = 0; i < 8; i++) { const b = this.btn(G, i), on = i < 3 ? s.tool === i : s.col === i - 3; circ(g, b.x, b.y, b.r * (on ? 1.12 : 1), i < 3 ? (on ? "#fff3c4" : "#fff") : this.COLS[i - 3], INK, on ? 5 : 3);
        if (i === 0) { g.strokeStyle = this.COLS[s.col]; g.lineWidth = b.r * 0.22; g.beginPath(); for (let j = 0; j <= 4; j++) g.lineTo(b.x - b.r * 0.6 + j * b.r * 0.3, b.y + (j % 2 ? -1 : 1) * b.r * 0.2); g.stroke(); }
        else if (i === 1) for (const [dx, dy] of [[-0.3, -0.25], [0.3, -0.1], [-0.05, 0.3]]) circ(g, b.x + dx * b.r, b.y + dy * b.r, b.r * 0.18, this.COLS[s.col], null);
        else if (i === 2) heart(g, b.x, b.y + b.r * 0.05, b.r * 0.38, this.COLS[s.col], null);
        else if (on) txt(g, "✓", b.x, b.y, b.r, "#fff", { stroke: INK }); }
      txt(g, `🥚 Eggs painted: ${s.made} · dabs ${s.egg.d.length}/${this.NEED}`, G.cx, G.u * 6, G.u * 3.6, "#fff", { stroke: INK }); },
    hot(G) { const s = G.s, used = [0, 1, 2].map((k) => s.egg.d.filter((d) => d.k === k).length); if (used[s.tool] >= 3) { const t = used.findIndex((n) => n === 0); if (t >= 0) return this.btn(G, t); }
      const e = this.egg(G), a = rnd(0, Math.PI * 2), d = rnd(0, 0.6); return { x: e.x + Math.cos(a) * d * e.rx, y: e.y + Math.sin(a) * d * e.ry }; },
  },
  {
    id: "jellyfish", name: "Glowing Jelly Disco", rar: "superrare", ico: "🪼", unit: "glows", base: 2, bg: ["#06244a", "#0b4f7a"], noDots: true,
    blurb: "Watch the jellyfish light up, then tap them in the SAME order! Each right pattern gets one longer. Reach 6 for a JELLY DISCO! (Oopsies are fine — they just show you again.)",
    ups: [["tap", "Brighter Glow", "💡"], ["auto", "Disco Crab", "🦀"], ["crit", "Super Shimmer", "🌟"]],
    win: ["The jellies wiggled with joy!", "The fish came to watch your light show.", "A whale sang along. It was very low and very nice.", "The jellies made you an honorary jelly!", "Your light show can be seen from the beach!", "The octopus DJ wants to team up.", "Mermaids bought tickets to your disco.", "The whole ocean is glowing for you!", "Jelly Disco Superstar of the Sea!"],
    COLS: ["#ff86d0", "#b18cff", "#6ec6ff", "#7cffb0", "#ffe066"], MAX: 6,
    init(G) { Object.assign(G.s, { seq: [Math.floor(rnd(0, 5)), Math.floor(rnd(0, 5))], ph: "wait", pt: 1, si: 0, ii: 0, lit: [0, 0, 0, 0, 0], disco: 0, discos: 0, best: 0 }); },
    jel(G, i) { const r = Math.min(G.W * 0.075, G.u * 9); return { x: G.W * (0.14 + 0.18 * i), y: G.H * (0.46 + (i % 2) * 0.16) + Math.sin(G.t * 1.5 + i) * G.u * 2, r }; },
    glow(G, i, t = 0.45) { G.s.lit[i] = t; SFX.note([0, 4, 7, 9, 12][i]); },
    press(G, i) { const s = G.s, j = this.jel(G, i);
      if (s.ph === "disco") { this.glow(G, i, 0.3); G.add(3, j.x, j.y - j.r, { color: this.COLS[i] }); G.dots(j.x, j.y, RAINBOW, 6); return; }
      if (s.ph !== "input") { s.lit[i] = Math.max(s.lit[i], 0.12); SFX.boop(); return; }
      this.glow(G, i);
      if (i !== s.seq[s.ii]) { G.say("Oopsie! Let's watch again! 💡", j.x, j.y - j.r * 1.4, 1.3); SFX.boop(); s.ph = "wait"; s.pt = 1.2; return; }
      s.ii++; G.add(1, j.x, j.y - j.r, { color: this.COLS[i] }); if (s.ii < s.seq.length) return;
      const n = s.seq.length; s.best = Math.max(s.best, n); G.add(4 * n, G.cx, G.H * 0.28, { color: "#ffe066", noCrit: true }); SFX.ding(); G.burst(G.cx, G.H * 0.3, ["✨", "🫧"], 6);
      if (n >= this.MAX) { s.ph = "disco"; s.disco = 6; s.discos++; G.add(30, G.cx, G.H * 0.3, { color: "#ffd23f", noCrit: true }); SFX.wow(); G.flash("#ffd6f5"); G.float("🪩 JELLY DISCO! 🪩", G.cx, G.u * 22, "#ff86d0", 1.3); }
      else { G.float(pick(["Glow-tastic!", "Jelly-bright!", "So sparkly!", "Lovely lights!"]), G.cx, G.u * 22, "#7cffb0", 1); s.seq.push(Math.floor(rnd(0, 5))); s.ph = "wait"; s.pt = 1; } },
    down(G, x, y) { for (let i = 0; i < 5; i++) { const j = this.jel(G, i); if (Math.abs(x - j.x) < j.r * 1.2 && y > j.y - j.r * 1.1 && y < j.y + j.r * 1.6) { this.press(G, i); return; } } SFX.boop(); G.dots(x, y, ["#bfe3ff", "#fff"], 4); },
    update(G, dt) { const s = G.s; for (let i = 0; i < 5; i++) s.lit[i] = Math.max(0, s.lit[i] - dt);
      if (s.ph === "wait" && (s.pt -= dt) <= 0) { s.ph = "show"; s.si = 0; s.pt = 0.2; }
      else if (s.ph === "show" && (s.pt -= dt) <= 0) { if (s.si < s.seq.length) { this.glow(G, s.seq[s.si++], 0.45); s.pt = 0.62; } else { s.ph = "input"; s.ii = 0; } }
      else if (s.ph === "disco") { if (Math.random() < dt * 8) s.lit[Math.floor(rnd(0, 5))] = 0.3; if ((s.disco -= dt) <= 0) { s.seq = [Math.floor(rnd(0, 5)), Math.floor(rnd(0, 5))]; s.ph = "wait"; s.pt = 1; } } },
    autoTick(G) { const s = G.s; if (s.ph === "input") { this.press(G, s.seq[s.ii]); const j = this.jel(G, s.seq[Math.max(0, s.ii - 1)]); G.burst(j.x, j.y + j.r, "🦀", 1, { size: 0.6 }); } else if (s.ph === "disco") this.press(G, Math.floor(rnd(0, 5))); },
    draw(G, g) { const s = G.s, disco = s.ph === "disco";
      for (let i = 0; i < 5; i++) { g.save(); g.globalAlpha = disco ? 0.18 : 0.08; g.fillStyle = disco ? RAINBOW[(i + Math.floor(G.t * 4)) % 6] : "#bfe3ff"; g.beginPath(); const x = G.W * (0.1 + i * 0.2) + Math.sin(G.t * 0.5 + i) * G.u * 5; g.moveTo(x - G.u * 3, 0); g.lineTo(x + G.u * 3, 0); g.lineTo(x + G.u * 14, G.H); g.lineTo(x - G.u * 6, G.H); g.fill(); g.restore(); }
      for (let i = 0; i < 18; i++) circ(g, (i * 113.7 + Math.sin(G.t + i) * 8) % G.W, G.H - ((i * 61.3 + G.t * G.u * 6 * (1 + (i % 3))) % G.H), G.u * (0.5 + (i % 3) * 0.3), null, "rgba(255,255,255,.5)", 1.5);
      g.fillStyle = "#e8d39a"; g.beginPath(); g.moveTo(0, G.H * 0.9); for (let x = 0; x <= G.W + 10; x += G.u * 5) g.lineTo(x, G.H * 0.9 + Math.sin(x * 0.03) * G.u * 1.5); g.lineTo(G.W, G.H); g.lineTo(0, G.H); g.fill();
      for (let i = 0; i < 6; i++) { const x = G.W * (0.05 + i * 0.18); g.strokeStyle = "#2fae6a"; g.lineWidth = G.u * 1.2; g.lineCap = "round"; g.beginPath(); g.moveTo(x, G.H * 0.93); g.quadraticCurveTo(x + Math.sin(G.t * 1.5 + i) * G.u * 4, G.H * 0.85, x + Math.sin(G.t + i) * G.u * 2, G.H * 0.78); g.stroke(); }
      E(g, "🐠", ((G.t * G.u * 4) % (G.W + G.u * 20)) - G.u * 10, G.H * 0.24, G.u * 6, 0, 0.9, -1, 1); E(g, "🐚", G.W * 0.88, G.H * 0.93, G.u * 5);
      if (disco) E(g, "🪩", G.cx, G.u * 22, G.u * 10, G.t * 2);
      for (let i = 0; i < 5; i++) { const j = this.jel(G, i), L = s.lit[i] > 0, c = disco ? RAINBOW[(i + Math.floor(G.t * 5)) % 6] : this.COLS[i], R = j.r * (L ? 1.1 : 1);
        if (L) { const gr = g.createRadialGradient(j.x, j.y, 0, j.x, j.y, R * 2.6); gr.addColorStop(0, c); gr.addColorStop(1, "rgba(0,0,0,0)"); g.globalAlpha = 0.7; g.fillStyle = gr; g.fillRect(j.x - R * 3, j.y - R * 3, R * 6, R * 6); g.globalAlpha = 1; }
        g.lineCap = "round"; for (let k = 0; k < 5; k++) { const x0 = j.x - R * 0.6 + k * R * 0.3; g.strokeStyle = L ? c : "rgba(255,255,255,.55)"; g.lineWidth = G.u * 0.7; g.beginPath(); g.moveTo(x0, j.y); for (let q = 1; q <= 6; q++) g.lineTo(x0 + Math.sin(G.t * 4 + q + k + i) * R * 0.12, j.y + (q * R * 1.4) / 6); g.stroke(); }
        g.beginPath(); g.ellipse(j.x, j.y, R, R * 0.85, 0, Math.PI, 0); g.closePath(); g.globalAlpha = L ? 1 : 0.6; g.fillStyle = c; g.fill(); g.globalAlpha = 1; g.strokeStyle = L ? "#fff" : INK; g.lineWidth = 3; g.stroke();
        face(g, j.x, j.y - R * 0.35, R * 0.42, L ? "joy" : s.ph === "input" ? "happy" : "wow", { look: s.ph === "show" ? Math.sin(G.t * 3) : 0 }); }
      const n = s.seq.length; for (let i = 0; i < n; i++) circ(g, G.cx + (i - (n - 1) / 2) * G.u * 4.5, G.u * 14, G.u * 1.5, s.ph === "input" && i < s.ii ? "#7cffb0" : "rgba(255,255,255,.35)", "#fff", 2);
      txt(g, disco ? `🪩 JELLY DISCO! Tap tap tap! ${Math.ceil(s.disco)}` : s.ph === "input" ? `👉 Your turn! ${s.ii}/${n}` : "👀 Watch the jellies…", G.cx, G.u * 7, G.u * 4, "#fff", { stroke: INK }); },
    hot(G) { const s = G.s; return this.jel(G, s.ph === "input" ? s.seq[s.ii] : s.ph === "disco" ? Math.floor(rnd(0, 5)) : 0); },
  },
  {
    id: "cloudbakery", name: "Cloud Bakery", rar: "superrare", ico: "☁️", unit: "squishes", base: 2, bg: ["#bfe6ff", "#ffe3f3"],
    blurb: "Squish the fluffy cloud into a pizza shape — just keep tapping it! When it's done, your cloud-pizza floats up and rains SPRINKLES.",
    ups: [["tap", "Squishy Hands", "🤲"], ["auto", "Fluffy Sheep Bakers", "🐑"], ["crit", "Rainbow Squish", "🌈"]],
    win: ["Your first cloud pizza! It tastes like a hug.", "It's raining sprinkles all over town!", "The birds are wearing sprinkle hats.", "The sun asked for a slice. You said yes!", "A rainbow came out just to see your pizzas.", "Cloud pizzas are the fluffiest food ever.", "The weather report says: 100% chance of sprinkles!", "The sky gave you a fluffy gold medal.", "Head Baker of the Whole Sky!"],
    SHAPES: [["Round Pizza", "⭕"], ["Pizza Slice", "🍕"], ["Heart Pizza", "💖"], ["Star Pizza", "⭐"], ["Square Pizza", "🟨"]], N: 18, NEED: 10,
    outline(k, t) { const a = t * Math.PI * 2;
      if (k === 0) return [Math.cos(a), Math.sin(a)];
      if (k === 1) return poly([[0, -1.05], [0.8, 0.75], [-0.8, 0.75]], t);
      if (k === 2) { const x = 16 * Math.pow(Math.sin(a), 3), y = -(13 * Math.cos(a) - 5 * Math.cos(2 * a) - 2 * Math.cos(3 * a) - Math.cos(4 * a)); return [x / 16, y / 15 - 0.05]; }
      if (k === 3) return poly(Array.from({ length: 10 }, (_, i) => { const b = (i / 10) * Math.PI * 2 - Math.PI / 2, r = i % 2 ? 0.48 : 1.05; return [Math.cos(b) * r, Math.sin(b) * r]; }), t);
      return poly([[-0.85, -0.85], [0.85, -0.85], [0.85, 0.85], [-0.85, 0.85]], t); },
    init(G) { Object.assign(G.s, { c: this.newCloud(-1), made: 0, sq: 0, fl: 0, enter: 1 }); },
    newCloud(prev) { let k; do { k = Math.floor(rnd(0, 5)); } while (k === prev); return { k, n: 0, blob: Array.from({ length: this.N + 7 }, (_, i) => { const a = (i / this.N) * Math.PI * 2 + rnd(-0.3, 0.3), d = i < this.N ? rnd(0.35, 0.75) : rnd(0, 0.3); return [Math.cos(a) * d * 1.2, Math.sin(a) * d * 0.8]; }) }; },
    cl(G) { const s = G.s, R = Math.min(G.W * 0.27, G.H * 0.26, G.u * 28), rise = s.fl > 0 ? Math.pow(1 - s.fl / 2.6, 2) * G.H * 0.9 : 0; return { x: G.cx - s.enter * G.W * 0.8, y: G.H * 0.54 - rise, R }; },
    pts(G) { const s = G.s, c = s.c, p = clamp(c.n / this.NEED, 0, 1), e = 1 - Math.pow(1 - p, 2), out = [];
      for (let i = 0; i < this.N + 7; i++) { const tgt = i < this.N ? this.outline(c.k, i / this.N) : this.outline(c.k, (i - this.N) / 7).map((v) => v * 0.45); out.push([lerp(c.blob[i][0], tgt[0], e), lerp(c.blob[i][1], tgt[1], e)]); } return out; },
    squish(G) { const s = G.s, c = s.c, C = this.cl(G); if (s.fl > 0 || s.enter > 0.2) return; c.n++; s.sq = 0.25; G.add(1, C.x + rnd(-1, 1) * C.R * 0.4, C.y - C.R * 0.3); G.tone(300 + c.n * 50, 0.14, { type: "sine", vol: 0.12, slideTo: 200 + c.n * 40 }); G.dots(C.x, C.y, ["#fff", "#ffd6f0"], 6);
      if (c.n < this.NEED) return; s.made++; s.fl = 2.6; G.add(20, C.x, C.y - C.R, { color: "#ffd23f", noCrit: true }); SFX.win(); G.float(`☁️ ${this.SHAPES[c.k][0]}! ☁️`, G.cx, G.u * 22, "#ff5d8f", 1.2); },
    down(G, x, y) { const s = G.s, C = this.cl(G);
      if (s.fl > 0) { G.add(1, x, y, { color: pick(RAINBOW) }); SFX.sparkle(); G.dots(x, y, RAINBOW, 6); return; }
      if (dist(x, y, C.x, C.y) < C.R * 1.25) { this.squish(G); return; } SFX.boop(); },
    update(G, dt) { const s = G.s; s.sq = Math.max(0, s.sq - dt); s.enter = Math.max(0, s.enter - dt * 1.8);
      if (s.fl > 0) { const C = this.cl(G); for (let i = 0; i < 3; i++) G.parts.push({ x: C.x + rnd(-1, 1) * C.R * 0.8, y: C.y + C.R * 0.6, vx: rnd(-1, 1) * G.u * 3, vy: G.u * 10, life: 1.4, max: 1.4, c: pick(RAINBOW), size: G.u * 0.8, grav: 0.4 });
        if ((s.fl -= dt) <= 0) { s.fl = 0; s.c = this.newCloud(s.c.k); s.enter = 1; } } },
    autoTick(G) { const C = this.cl(G); if (G.s.fl <= 0 && G.s.enter <= 0.2) { this.squish(G); G.burst(C.x + C.R, C.y, "🐑", 1, { size: 0.6 }); } },
    draw(G, g) { const s = G.s, c = s.c, C = this.cl(G), pts = this.pts(G), pr = C.R * 0.32, sq = s.sq / 0.25, sx = 1 + sq * 0.12, sy = 1 - sq * 0.12;
      for (let i = 0; i < 5; i++) puff(g, ((i * 0.29 + G.t * 0.012 * (1 + (i % 2))) % 1.2) * G.W - G.W * 0.1, G.H * (0.12 + (i % 3) * 0.11), G.u * (4 + (i % 2) * 2), "rgba(255,255,255,.6)");
      if (s.fl > 0) for (let i = 0; i < 6; i++) { g.beginPath(); g.arc(G.cx, G.H * 1.05, G.W * (0.55 - i * 0.04), Math.PI, 0); g.strokeStyle = RAINBOW[i]; g.lineWidth = G.W * 0.04; g.globalAlpha = 0.45 * Math.min(1, (2.6 - s.fl) * 2); g.stroke(); } g.globalAlpha = 1;
      // target outline
      if (s.fl <= 0) { g.setLineDash([G.u * 1.5, G.u * 1.5]); g.strokeStyle = "rgba(74,42,26,.35)"; g.lineWidth = 3; g.beginPath(); for (let i = 0; i <= 60; i++) { const o = this.outline(c.k, i / 60); g.lineTo(C.x + o[0] * C.R, C.y + o[1] * C.R); } g.stroke(); g.setLineDash([]); }
      g.save(); g.translate(C.x, C.y); g.scale(sx, sy);
      for (const [px, py] of pts) circ(g, px * C.R, py * C.R, pr + 3, "#9cc7e8", null);
      for (const [px, py] of pts) circ(g, px * C.R, py * C.R, pr, "#ffffff", null);
      for (let i = 0; i < pts.length; i += 3) circ(g, pts[i][0] * C.R - pr * 0.3, pts[i][1] * C.R - pr * 0.3, pr * 0.3, "rgba(255,230,245,.8)", null);
      if (c.n >= this.NEED) for (let i = 0; i < 7; i++) { const o = this.outline(c.k, i / 7 + 0.05); circ(g, o[0] * C.R * 0.5, o[1] * C.R * 0.5, pr * 0.32, "#ff8fb1", "#e05a85", 2); }
      face(g, 0, pts.length ? 0 : 0, C.R * 0.28, s.fl > 0 ? "joy" : s.sq > 0 ? "wow" : "happy");
      g.restore();
      const sh = this.SHAPES[c.k]; txt(g, s.fl > 0 ? "🌈 Sprinkle shower! Tap to catch!" : `${sh[1]} Make a ${sh[0]}! ${c.n}/${this.NEED}`, G.cx, G.u * 7, G.u * 4, "#fff", { stroke: INK }); txt(g, `☁️ Cloud pizzas baked: ${s.made}`, G.cx, G.u * 13, G.u * 3.2, "#fff", { stroke: INK }); },
    hot(G) { return this.cl(G); },
  },
  {
    id: "turtle", name: "Turtle Pizza Taxi", rar: "superrare", ico: "🐢", unit: "steps", base: 2, bg: ["#c9f0b0", "#8fd36a"],
    blurb: "Shelly the turtle is carrying a pizza across the pond to her froggy friend! Tap the bubbly spots to make lily pads. Shelly walks along your path — slowly and happily. Flower spots give extra!",
    ups: [["tap", "Bouncy Lily Pads", "🍃"], ["auto", "Froggy Builders", "🐸"], ["mult", "Shiny Shell Polish", "✨"]],
    win: ["Shelly made it! Slow and steady!", "Froggy says this is the best pizza ever.", "Shelly got a little taxi hat. So cute!", "The ducks want a ride too!", "Shelly's pond is famous now.", "The lily pads are blooming everywhere!", "Shelly did a happy shell-wiggle.", "The pond made you Chief Lily Pad Builder.", "Turtle Taxi Legend! Beep beep (slowly)!"],
    COLS: 5,
    init(G) { Object.assign(G.s, { pads: [], flower: Math.floor(rnd(0, 3)), pos: 0, deliv: 0, cheer: 0, party: 0, pat: 0 }); },
    spot(G, c, r) { return { x: G.W * (0.22 + 0.14 * c), y: G.H * (0.42 + 0.15 * r), r: Math.min(G.W * 0.055, G.u * 6.5) }; },
    point(G, k) { const s = G.s; if (k <= 0) return { x: G.W * 0.07, y: G.H * 0.57 }; if (k >= 6) return { x: G.W * 0.92, y: G.H * 0.57 }; return this.spot(G, k - 1, s.pads[k - 1]); },
    turt(G) { const s = G.s, a = Math.floor(s.pos), k = s.pos - a, p = this.point(G, a), q = this.point(G, Math.min(6, a + 1)); return { x: lerp(p.x, q.x, k), y: lerp(p.y, q.y, k) - Math.sin(k * Math.PI) * G.u * 2, R: Math.min(G.W * 0.055, G.u * 6.5) }; },
    place(G, r) { const s = G.s, c = s.pads.length; if (c >= this.COLS || s.cheer > 0) return; const p = this.spot(G, c, r), fl = r === s.flower; s.pads.push(r); s.flower = Math.floor(rnd(0, 3));
      G.add(fl ? 4 : 1, p.x, p.y - p.r, { color: fl ? "#ff86b3" : "#fff" }); G.tone(700, 0.08, { type: "sine", vol: 0.12, slideTo: 1100 }); G.dots(p.x, p.y, ["#bfe3ff", "#fff"], 6); if (fl) { G.burst(p.x, p.y, ["🌸", "✨"], 5); SFX.sparkle(); } },
    down(G, x, y) { const s = G.s, c = s.pads.length, T = this.turt(G);
      if (dist(x, y, T.x, T.y) < T.R * 1.4) { s.pat = 0.5; G.add(1, x, y); SFX.giggle(); G.say(pick(["Slow and happy!", "Hee hee, thank you!", "Pizza is coming!"]), T.x, T.y - T.R * 1.8, 1); return; }
      if (s.cheer > 0) { G.add(1, x, y); SFX.giggle(); G.burst(x, y, ["💚", "🎉"], 3, { size: 0.6 }); return; }
      if (c < this.COLS) for (let r = 0; r < 3; r++) { const p = this.spot(G, c, r); if (dist(x, y, p.x, p.y) < p.r * 1.4) { this.place(G, r); return; } }
      SFX.boop(); },
    update(G, dt) { const s = G.s, tgt = s.pads.length >= this.COLS ? 6 : s.pads.length; s.pat = Math.max(0, s.pat - dt); s.party = Math.max(0, s.party - dt);
      if (s.cheer > 0) { if ((s.cheer -= dt) <= 0) { s.cheer = 0; s.pads = []; s.pos = 0; } return; }
      if (s.pos < tgt) s.pos = Math.min(tgt, s.pos + dt * 0.9);
      if (s.pos >= 6) { s.cheer = 2.2; s.deliv++; const p = this.point(G, 6); G.add(20, p.x, p.y - G.u * 10, { color: "#ffd23f", noCrit: true }); SFX.win(); G.burst(p.x, p.y, ["🍕", "💚", "✨"], 10); G.say("Ribbit! Pizza! Thank you, Shelly!", p.x - G.u * 8, p.y - G.u * 12, 1.8);
        if (s.deliv % 4 === 0) { s.party = 4; G.add(30, G.cx, G.H * 0.3, { color: "#ffd23f", noCrit: true }); SFX.wow(); G.float("🌸 LILY POND PARTY! 🌸", G.cx, G.u * 22, "#ff5d8f", 1.2); } } },
    autoTick(G) { const s = G.s; if (s.pads.length < this.COLS && s.cheer <= 0) { const r = Math.random() < 0.5 ? s.flower : Math.floor(rnd(0, 3)), p = this.spot(G, s.pads.length, r); this.place(G, r); G.burst(p.x, p.y, "🐸", 1, { size: 0.6 }); } },
    drawTurtle(G, g, x, y, R, mood) { for (const [dx, dy] of [[-0.6, 0.45], [0.55, 0.45]]) oval(g, x + dx * R, y + dy * R, R * 0.28, R * 0.2, "#8fd36a");
      circ(g, x + R * 1.05, y - R * 0.05, R * 0.42, "#9be07a"); face(g, x + R * 1.1, y - R * 0.08, R * 0.34, mood, { look: 1 });
      g.beginPath(); g.ellipse(x, y + R * 0.2, R, R * 0.85, 0, Math.PI, 0); g.closePath(); g.fillStyle = "#4caf50"; g.fill(); g.strokeStyle = INK; g.lineWidth = 3; g.stroke();
      for (const [dx, dy] of [[-0.45, -0.1], [0.05, -0.35], [0.5, -0.1], [-0.05, 0.05]]) oval(g, x + dx * R, y + dy * R, R * 0.2, R * 0.13, "#8bd47c", "rgba(74,42,26,.5)", 2);
      rr(g, x - R * 1.05, y + R * 0.15, R * 2.1, R * 0.18, R * 0.09, "#c9e07a");
      g.save(); g.translate(x, y - R * 0.7); g.scale(1, 0.42); pizza(g, 0, 0, R * 0.62, { peps: 5 }); g.restore(); },
    draw(G, g) { const s = G.s, c = s.pads.length;
      oval(g, G.cx, G.H * 0.57, G.W * 0.38, G.H * 0.27, "#6ec6ff", "#3f8ac2", 4); for (let i = 0; i < 4; i++) oval(g, G.W * (0.3 + i * 0.13), G.H * (0.5 + (i % 2) * 0.12), G.u * (5 + ((G.t * 3 + i) % 3)), G.u * 1.2, null, "rgba(255,255,255,.5)", 2);
      for (const x of [0.15, 0.82]) for (let i = 0; i < 3; i++) { const rx = G.W * x + i * G.u * 2.5; g.strokeStyle = "#3f8a33"; g.lineWidth = G.u * 0.7; g.beginPath(); g.moveTo(rx, G.H * 0.82); g.lineTo(rx + Math.sin(G.t + i) * G.u, G.H * 0.68); g.stroke(); oval(g, rx + Math.sin(G.t + i) * G.u, G.H * 0.68, G.u * 0.9, G.u * 2.5, "#8a5a2b", null); }
      // the far bank: froggy's picnic
      const end = this.point(G, 6); oval(g, end.x, end.y + G.u * 6, G.u * 9, G.u * 3, "#ff6b6b"); E(g, "🐸", end.x + G.u * 1, end.y - G.u * 1 - (s.cheer > 0 || s.party > 0 ? Math.abs(Math.sin(G.t * 9)) * G.u * 4 : 0), G.u * 9); E(g, "🦆", end.x - G.u * 1, end.y + G.u * 12, G.u * 6, 0, 1, -1, 1);
      for (let i = 0; i < c; i++) { const p = this.spot(G, i, s.pads[i]); g.save(); g.translate(p.x, p.y); g.beginPath(); g.moveTo(0, 0); g.arc(0, 0, p.r * 1.15, 0.3, Math.PI * 2 - 0.3); g.closePath(); g.fillStyle = "#5cbf4a"; g.fill(); g.strokeStyle = "#2f7a2a"; g.lineWidth = 3; g.stroke(); g.restore(); }
      if (c < this.COLS && s.cheer <= 0) for (let r = 0; r < 3; r++) { const p = this.spot(G, c, r), w = Math.sin(G.t * 5 + r) * 0.15; circ(g, p.x, p.y, p.r * (1 + w), "rgba(255,255,255,.25)", "rgba(255,255,255,.9)", 3); circ(g, p.x, p.y, p.r * 0.5 * (1 - w), null, "rgba(255,255,255,.6)", 2); if (r === s.flower) E(g, "🌸", p.x, p.y, p.r * 1.2, Math.sin(G.t * 2) * 0.2); }
      if (s.party > 0) for (let i = 0; i < 8; i++) E(g, ["🌸", "🌼", "✨"][i % 3], G.W * (0.1 + i * 0.11), G.H * 0.3 + Math.sin(G.t * 3 + i) * G.u * 3, G.u * 5);
      const T = this.turt(G); if (s.cheer <= 0) this.drawTurtle(G, g, T.x, T.y, T.R, s.pat > 0 ? "joy" : Math.floor(s.pos) < s.pos ? "happy" : "smug");
      else { this.drawTurtle(G, g, T.x - G.u * 3, T.y, T.R, "joy"); }
      txt(g, `🐢 Pizzas delivered: ${s.deliv} · lily pads ${c}/${this.COLS}`, G.cx, G.u * 7, G.u * 3.8, "#fff", { stroke: INK }); },
    hot(G) { const s = G.s, c = s.pads.length; if (c < this.COLS && s.cheer <= 0) return this.spot(G, c, s.flower); return this.turt(G); },
  },
  {
    id: "duckbath", name: "Rubber Duck Bath", rar: "superrare", ico: "🛁", unit: "squeaks", base: 2, bg: ["#e6f7ff", "#bfe3f5"],
    blurb: "Boop the rubber ducks to make them squeak — every squeak makes bubbles! Pop the floaty bubbles for extra. Fill the tub with foam for a BUBBLE PARTY!",
    ups: [["tap", "Squeakier Ducks", "🦆"], ["auto", "Froggy Bath Buddies", "🐸"], ["crit", "Mega Squeak", "📣"]],
    win: ["Squeak squeak! The ducks are so happy.", "There are bubbles on the ceiling now!", "The ducks formed a tiny marching band.", "The bathtub says this is the best bath EVER.", "A golden duck winked at you!", "Bubbles floated all the way to the moon.", "The ducks named you Captain of the Tub.", "Your bubble party is the talk of the pond.", "Supreme Squeaker of the Bubble Bath!"],
    init(G) { Object.assign(G.s, { d: [0, 1, 2, 3].map((i) => ({ hop: 0, gold: 0, ph: i * 1.7 })), bub: [], foam: 0.1, party: 0, parties: 0, goldT: 5 }); },
    tub(G) { const w = Math.min(G.W * 0.88, G.u * 120), h = G.H * 0.36; return { x: G.cx - w / 2, y: G.H * 0.5, w, h, surf: G.H * 0.5 + h * 0.2 - G.s.foam * h * 0.18 }; },
    duck(G, i) { const t = this.tub(G), q = G.s.d[i], r = Math.min(t.w * 0.07, G.u * 8); return { x: t.x + t.w * (0.17 + 0.22 * i) + Math.sin(G.t * 0.8 + q.ph) * G.u * 2, y: t.surf - r * 0.35 - q.hop * G.u * 6 + Math.sin(G.t * 2 + q.ph) * G.u * 0.6, r }; },
    blow(G, x, y, n) { const s = G.s; for (let i = 0; i < n && s.bub.length < 16; i++) s.bub.push({ x: x + rnd(-1, 1) * G.u * 4, y: y - G.u * rnd(2, 6), r: G.u * rnd(2.5, 4.5), vy: G.u * rnd(6, 11), ph: rnd(0, 6), c: s.party > 0 ? pick(RAINBOW) : null }); },
    squeak(G, i) { const s = G.s, q = s.d[i], D = this.duck(G, i), gold = q.gold > 0; q.hop = 1; SFX.squeak(); G.add(gold ? 6 : s.party > 0 ? 3 : 1, D.x, D.y - D.r * 1.4, { color: gold ? "#ffd23f" : "#fff" }); this.blow(G, D.x, D.y - D.r, s.party > 0 ? 5 : 3);
      if (gold) { q.gold = 0; SFX.sparkle(); G.burst(D.x, D.y, ["✨", "💛"], 6); } this.foamUp(G, 0.035); },
    foamUp(G, n) { const s = G.s; if (s.party > 0) return; s.foam = Math.min(1, s.foam + n); if (s.foam < 1) return; s.party = 6; s.parties++; const t = this.tub(G); G.add(30, G.cx, t.y - G.u * 6, { color: "#ffd23f", noCrit: true }); SFX.wow(); G.flash("#e0f7ff"); G.float("🫧 BUBBLE PARTY! 🫧", G.cx, G.u * 22, "#5aa9ff", 1.3); },
    down(G, x, y) { const s = G.s;
      for (let i = s.bub.length - 1; i >= 0; i--) { const b = s.bub[i]; if (dist(x, y, b.x, b.y) < b.r * 1.5 + G.u * 1.5) { s.bub.splice(i, 1); G.add(s.party > 0 ? 3 : 2, b.x, b.y, { color: "#bfe3ff" }); SFX.pop(rnd(1, 1.6)); G.dots(b.x, b.y, ["#fff", "#bfe3ff", "#ffd6f0"], 7); this.foamUp(G, 0.01); return; } }
      for (let i = 0; i < 4; i++) { const D = this.duck(G, i); if (dist(x, y, D.x, D.y - D.r * 0.3) < D.r * 1.4) { this.squeak(G, i); return; } }
      SFX.boop(); },
    update(G, dt) { const s = G.s, t = this.tub(G); for (const q of s.d) { q.hop = Math.max(0, q.hop - dt * 3); q.gold = Math.max(0, q.gold - dt); }
      if ((s.goldT -= dt) <= 0) { s.goldT = rnd(5, 8); s.d[Math.floor(rnd(0, 4))].gold = 4; }
      if (s.party > 0) { if (Math.random() < dt * 6) this.blow(G, rnd(t.x, t.x + t.w), t.surf, 1); if ((s.party -= dt) <= 0) { s.party = 0; s.foam = 0.15; } }
      for (let i = s.bub.length - 1; i >= 0; i--) { const b = s.bub[i]; b.y -= b.vy * dt; b.ph += dt * 3; b.x += Math.sin(b.ph) * G.u * 4 * dt; if (b.y < -b.r) s.bub.splice(i, 1); } },
    autoTick(G) { const i = Math.floor(rnd(0, 4)), D = this.duck(G, i); this.squeak(G, i); G.burst(D.x, D.y - D.r, "🐸", 1, { size: 0.5 }); },
    drawDuck(G, g, D, gold, party) { const col = gold ? "#ffcf3a" : "#ffe14d", x = D.x, y = D.y, r = D.r; g.save(); g.translate(x, y); if (party) g.rotate(Math.sin(G.t * 10 + x) * 0.25);
      oval(g, 0, 0, r * 1.1, r * 0.68, col); oval(g, -r * 0.2, -r * 0.05, r * 0.45, r * 0.28, gold ? "#f0b400" : "#ffd23f", INK, 2, -0.3);
      oval(g, r * 1.05, -r * 0.62, r * 0.3, r * 0.14, "#ff9a3c"); circ(g, r * 0.5, -r * 0.75, r * 0.52, col); face(g, r * 0.55, -r * 0.8, r * 0.36, party ? "joy" : "happy", { look: 1 });
      oval(g, -r * 1.05, -r * 0.3, r * 0.2, r * 0.12, col, INK, 2, -0.6); g.restore(); if (gold) E(g, "✨", x + r, y - r * 1.4, r * 0.7, 0, 0.5 + Math.sin(G.t * 6) * 0.5); },
    draw(G, g) { const s = G.s, t = this.tub(G), party = s.party > 0;
      g.strokeStyle = "rgba(255,255,255,.7)"; g.lineWidth = 2; const ts = G.u * 10; for (let x = 0; x < G.W; x += ts) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, t.y); g.stroke(); } for (let y = 0; y < t.y; y += ts) { g.beginPath(); g.moveTo(0, y); g.lineTo(G.W, y); g.stroke(); }
      if (party) { E(g, "🪩", G.cx, G.u * 26, G.u * 10, G.t * 2); for (let i = 0; i < 6; i++) { g.globalAlpha = 0.15; g.fillStyle = RAINBOW[(i + Math.floor(G.t * 4)) % 6]; g.beginPath(); g.moveTo(G.cx, G.u * 26); g.lineTo(G.W * (i / 5), t.y); g.lineTo(G.W * (i / 5) + G.u * 10, t.y); g.fill(); } g.globalAlpha = 1; }
      // faucet
      rr(g, t.x + t.w * 0.04, t.y - G.u * 12, G.u * 3, G.u * 12, G.u, "#c9d3e8"); rr(g, t.x + t.w * 0.04, t.y - G.u * 12, G.u * 9, G.u * 3, G.u, "#c9d3e8"); circ(g, t.x + t.w * 0.04 + G.u * 8, t.y - G.u * 7 + ((G.t * 40) % 20) * G.u * 0.25, G.u * 0.8, "#6ec6ff", null);
      // tub back, water, foam, ducks, front
      rr(g, t.x, t.y, t.w, t.h, G.u * 6, "#ffffff", INK, 4); g.save(); g.beginPath(); g.rect(t.x + 4, t.surf, t.w - 8, t.h); g.clip(); rr(g, t.x + 4, t.y + 4, t.w - 8, t.h - 8, G.u * 5, "#8fd3ff", null); g.restore();
      for (let i = 0; i < 24; i++) { const k = i / 23, fx = t.x + G.u * 4 + k * (t.w - G.u * 8), fr = G.u * (2.5 + s.foam * 4) * (0.7 + 0.3 * Math.sin(i * 2.3 + G.t)); circ(g, fx, t.surf - fr * 0.2, fr, party ? `hsl(${(i * 30 + G.t * 120) % 360},90%,94%)` : "#ffffff", "rgba(74,42,26,.25)", 1.5); }
      for (let i = 0; i < 4; i++) this.drawDuck(G, g, this.duck(G, i), s.d[i].gold > 0, party);
      g.globalAlpha = 0.45; g.fillStyle = "#8fd3ff"; g.fillRect(t.x + 4, t.surf + G.u * 1.5, t.w - 8, G.u * 3); g.globalAlpha = 1;
      rr(g, t.x - G.u * 2, t.surf + G.u * 3, t.w + G.u * 4, t.y + t.h - t.surf - G.u * 3, G.u * 6, "#ffffff", INK, 4); { const fy = t.surf + G.u * 3 + (t.y + t.h - t.surf) * 0.45; g.strokeStyle = "#9fe0ff"; g.lineWidth = G.u * 2; g.lineCap = "round"; g.beginPath(); for (let x = t.x + G.u * 4; x <= t.x + t.w - G.u * 4; x += G.u * 2) g.lineTo(x, fy + Math.sin(x * 0.05) * G.u); g.stroke(); for (let i = 0; i < 5; i++) circ(g, t.x + t.w * (0.15 + i * 0.175), fy + G.u * 6, G.u * 1.6, "#ffe14d", null); }
      for (const fx of [0.12, 0.88]) rr(g, t.x + t.w * fx - G.u * 2, t.y + t.h - G.u, G.u * 4, G.u * 5, G.u * 1.5, "#ffd23f");
      for (const b of s.bub) { circ(g, b.x, b.y, b.r, b.c ? b.c + "55" : "rgba(220,247,255,.45)", "rgba(74,42,26,.4)", 2); circ(g, b.x - b.r * 0.35, b.y - b.r * 0.35, b.r * 0.25, "rgba(255,255,255,.9)", null); }
      if (party) txt(g, `🫧 BUBBLE PARTY! Pop pop pop! ${Math.ceil(s.party)}`, G.cx, G.u * 8, G.u * 4, "#fff", { stroke: INK });
      else { bar(g, G.cx - G.u * 24, G.u * 4, G.u * 48, G.u * 5, s.foam, "#9fe0ff"); txt(g, `🫧 Foam-o-meter · bubble parties: ${s.parties}`, G.cx, G.u * 13, G.u * 3.4, "#fff", { stroke: INK }); } },
    hot(G) { const s = G.s, b = s.bub.find((b) => b.y > G.u * 18); if (b) return b; const gi = s.d.findIndex((q) => q.gold > 0); const D = this.duck(G, gi >= 0 ? gi : Math.floor(rnd(0, 4))); return { x: D.x, y: D.y - D.r * 0.3 }; },
  },

  // ------------------------------------------------------------------------
  //  SPARKLY
  // ------------------------------------------------------------------------
  {
    id: "fairy", name: "Fairy Sprinkle Shop", rar: "sparkly", ico: "🧚", unit: "sprinkles", base: 3, bg: ["#efe0ff", "#ffd9f0"],
    blurb: "Magical customers want sparkly pizzas! Tap a dust jar to pick a colour, then tap the pizza to sprinkle. Match the order card to make them happy. Every 5 orders: FAIRY FESTIVAL!",
    ups: [["tap", "Extra Fairy Dust", "✨"], ["auto", "Tiny Fairy Helpers", "🧚"], ["mult", "Moonbeam Oven", "🌙"]],
    win: ["Your first magic pizza! It's glowing!", "The unicorn told ALL her friends about you.", "Your shop got a sparkly new sign.", "The dragon tipped you a shiny pebble. So kind!", "The mermaid wants a pizza delivered to the sea!", "Your fairy dust is the sparkliest in the land.", "The Fairy Queen visited and said 'Ooooh!'", "Customers are lining up past the rainbow.", "Grand Sprinkle Wizard of Fairyland!"],
    DUST: [["Pink", "#ff6fb5"], ["Blue", "#5aa9ff"], ["Gold", "#ffc93a"], ["Green", "#3fcf86"]],
    WHO: [["🦄", "Sparkle"], ["🐉", "Dot the Dragon"], ["🧜‍♀️", "Marina"], ["🦋", "Flutter"], ["🧙", "Wizzy"], ["🐸", "Prince Ribbit"], ["🦉", "Professor Hoot"], ["🐱", "Moonbeam"]],
    init(G) { Object.assign(G.s, { col: 0, sp: [], ord: null, served: 0, fest: 0, fests: 0, fx: G.cx, fy: G.H * 0.3, tx: G.cx, ty: G.H * 0.3, happy: 0, walk: 1, wave: 0 }); this.newOrder(G); },
    newOrder(G) { const s = G.s, nc = Math.min(3, 1 + Math.floor(s.served / 3)), cols = [0, 1, 2, 3].sort(() => Math.random() - 0.5).slice(0, nc); s.ord = { who: pick(this.WHO), need: cols.map((c) => [c, 2 + Math.floor(rnd(0, 3))]) }; s.sp = []; s.walk = 1; },
    have(G, c) { return G.s.sp.filter((p) => p.c === c).length; },
    missing(G) { return G.s.ord.need.filter(([c, n]) => this.have(G, c) < n); },
    pz(G) { return { x: G.W * 0.6, y: G.H * 0.5, r: Math.min(G.W * 0.2, G.H * 0.2, G.u * 19) }; },
    cu(G) { return { x: G.W * 0.16 - G.s.walk * G.W * 0.3, y: G.H * 0.56 }; },
    jar(G, i) { const sp = Math.min(G.W * 0.21, G.u * 18); return { x: G.W * 0.58 + (i - 1.5) * sp, y: G.H * 0.85, r: Math.min(sp * 0.36, G.u * 6.5) }; },
    sprinkle(G, x, y, c, quiet) { const s = G.s, P = this.pz(G); s.sp.push({ x: (x - P.x) / P.r, y: (y - P.y) / P.r, c, ph: rnd(0, 6) }); s.tx = x; s.ty = y - G.u * 6;
      G.add(1, x, y, { color: this.DUST[c][1], quiet }); G.tone(1200 + c * 200 + rnd(0, 300), 0.09, { type: "triangle", vol: 0.08 }); G.dots(x, y, [this.DUST[c][1], "#fff"], 6);
      if (!this.missing(G).length) this.serve(G); },
    serve(G) { const s = G.s, P = this.pz(G), C = this.cu(G), need = s.ord.need.reduce((a, [, n]) => a + n, 0), perfect = s.sp.length === need; s.happy = 1.8; s.served++;
      G.add(perfect ? 45 : 30, P.x, P.y - P.r, { color: "#ffd23f", noCrit: true }); SFX.win(); G.burst(C.x, C.y - G.u * 8, ["💖", "✨", "🌟"], 12); G.say(perfect ? "PERFECT! It's SO sparkly!" : pick(["Ooh, magical! Thank you!", "Sparkle-licious!", "Just what I wished for!"]), C.x + G.u * 4, C.y - G.u * 12, 1.6);
      if (perfect) G.float("✨ PERFECT ORDER! ✨", G.cx, G.u * 24, "#ff5d8f", 1.1);
      if (s.served % 5 === 0) { s.fest = 7; s.fests++; G.add(40, G.cx, G.H * 0.3, { color: "#ffd23f", noCrit: true }); SFX.wow(); G.flash("#fff0fb"); G.float("🧚 FAIRY FESTIVAL! 🧚", G.cx, G.u * 30, "#b18cff", 1.3); } },
    down(G, x, y) { const s = G.s, P = this.pz(G), C = this.cu(G);
      for (let i = 0; i < 4; i++) { const j = this.jar(G, i); if (dist(x, y, j.x, j.y) < j.r * 1.4) { s.col = i; s.tx = j.x; s.ty = j.y - j.r * 2; SFX.tap(); G.dots(j.x, j.y - j.r, [this.DUST[i][1]], 6); return; } }
      if (dist(x, y, C.x, C.y) < G.u * 9) { s.wave = 0.6; G.add(1, x, y); SFX.giggle(); G.say(`Hello! I'm ${s.ord.who[1]}!`, C.x + G.u * 4, C.y - G.u * 12, 1.2); return; }
      if (dist(x, y, P.x, P.y) < P.r * 1.05 && s.happy <= 0 && s.walk <= 0.2) {
        if (s.fest > 0) { const m = this.missing(G); for (const [c] of (m.length ? m : [[s.col]])) { if (s.happy > 0) break; this.sprinkle(G, x + rnd(-1, 1) * G.u * 3, y + rnd(-1, 1) * G.u * 3, c); } G.add(2, x, y, { color: "#ffd23f", quiet: true }); return; }
        this.sprinkle(G, x, y, s.col); return; }
      s.tx = x; s.ty = y; SFX.boop(); },
    update(G, dt) { const s = G.s; s.fx += (s.tx - s.fx) * Math.min(1, dt * 6); s.fy += (s.ty - s.fy) * Math.min(1, dt * 6); s.fest = Math.max(0, s.fest - dt); s.wave = Math.max(0, s.wave - dt);
      if (s.happy > 0 && (s.happy -= dt) <= 0) { s.happy = 0; this.newOrder(G); } s.walk = Math.max(0, s.walk - dt * 1.5);
      if (Math.random() < dt * 12) G.parts.push({ x: s.fx + rnd(-1, 1) * G.u * 2, y: s.fy + G.u * 2, vx: rnd(-1, 1) * G.u * 2, vy: G.u * 4, life: 0.6, max: 0.6, c: s.fest > 0 ? pick(RAINBOW) : this.DUST[s.col][1], size: G.u * 0.6, grav: 0.1 }); },
    autoTick(G) { const s = G.s; if (s.happy > 0 || s.walk > 0.2) return; const m = this.missing(G); if (!m.length) return; const P = this.pz(G), a = rnd(0, Math.PI * 2), d = Math.sqrt(Math.random()) * 0.7, x = P.x + Math.cos(a) * d * P.r, y = P.y + Math.sin(a) * d * P.r; this.sprinkle(G, x, y, m[0][0], true); G.burst(x, y, "🧚", 1, { size: 0.5 }); },
    draw(G, g) { const s = G.s, P = this.pz(G), C = this.cu(G), fest = s.fest > 0;
      for (let i = 0; i < 26; i++) twinkle(g, (i * 137.5) % G.W, (i * 71.3) % (G.H * 0.6), G.u * (0.6 + 0.6 * Math.abs(Math.sin(G.t * 2 + i))), fest ? RAINBOW[i % 6] : "rgba(255,255,255,.9)");
      // awning
      const aw = G.u * 17; for (let i = 0; i < 10; i++) { g.fillStyle = i % 2 ? "#ffffff" : "#c79cff"; g.fillRect((G.W * i) / 10, aw, G.W / 10 + 1, G.u * 4); g.beginPath(); g.arc((G.W * (i + 0.5)) / 10, aw + G.u * 4, G.W / 20, 0, Math.PI); g.fill(); }
      // counter
      rr(g, G.W * 0.3, P.y + P.r * 0.6, G.W * 0.72, G.H * 0.12, G.u * 2, "#b18cff"); rr(g, G.W * 0.28, P.y + P.r * 0.55, G.W * 0.76, G.u * 3, G.u, "#e7d4ff");
      // customer & order card
      if (s.ord) { const bob = s.happy > 0 ? Math.abs(Math.sin(G.t * 9)) * G.u * 3 : s.wave > 0 ? Math.sin(G.t * 20) * G.u * 0.8 : 0, cs = Math.min(G.u * 17, G.W * 0.22); E(g, s.ord.who[0], C.x, C.y - bob, cs, s.wave > 0 ? Math.sin(G.t * 20) * 0.15 : 0);
        if (s.happy <= 0) { const need = s.ord.need, lh = G.u * 5.5, cw = Math.min(G.W * 0.27, G.u * 27), ch = lh * need.length + G.u * 7, cx = Math.max(G.u * 2, C.x - cw / 2), cy = C.y - cs * 0.6 - ch - G.u * 2;
          rr(g, cx, cy, cw, ch, G.u * 2, "#fffaf0", INK, 3); txt(g, `${s.ord.who[1]} wants:`, cx + cw / 2, cy + G.u * 3.5, Math.min(G.u * 2.8, cw * 0.09), INK, { weight: 800 });
          need.forEach(([c, n], i) => { const ly = cy + G.u * 8.5 + i * lh, h = Math.min(n, this.have(G, c)); twinkle(g, cx + G.u * 4.5, ly, G.u * 2.2, this.DUST[c][1]); txt(g, `${h}/${n}`, cx + G.u * 9, ly, G.u * 3.2, h >= n ? "#2fbf6a" : INK, { align: "left" }); if (h >= n) txt(g, "✓", cx + cw - G.u * 4, ly, G.u * 3.5, "#2fbf6a"); }); } }
      // the pizza with its sparkles
      oval(g, P.x, P.y + P.r * 0.1, P.r * 1.12, P.r * 1.02, "#fffaf0"); pizza(g, P.x, P.y, P.r * 0.92, { peps: 5 });
      for (const p of s.sp) { const tw = 0.7 + 0.3 * Math.sin(G.t * 6 + p.ph); twinkle(g, P.x + p.x * P.r, P.y + p.y * P.r, P.r * 0.1 * tw, fest ? RAINBOW[Math.floor(p.ph * 3 + G.t * 4) % 6] : this.DUST[p.c][1]); circ(g, P.x + p.x * P.r, P.y + p.y * P.r, P.r * 0.025, "#fff", null); }
      if (s.happy > 0) { const gl = g.createRadialGradient(P.x, P.y, 0, P.x, P.y, P.r * 1.4); gl.addColorStop(0, "rgba(255,255,255,.6)"); gl.addColorStop(1, "rgba(255,255,255,0)"); g.fillStyle = gl; g.fillRect(P.x - P.r * 1.5, P.y - P.r * 1.5, P.r * 3, P.r * 3); }
      // dust jars
      for (let i = 0; i < 4; i++) { const j = this.jar(G, i), on = s.col === i; if (on) circ(g, j.x, j.y, j.r * 1.45, "rgba(255,255,255,.6)", null);
        rr(g, j.x - j.r * 0.8, j.y - j.r, j.r * 1.6, j.r * 2, j.r * 0.4, "rgba(255,255,255,.75)", INK, on ? 5 : 3); rr(g, j.x - j.r * 0.7, j.y - j.r * 0.2, j.r * 1.4, j.r * 1.1, j.r * 0.3, this.DUST[i][1], null); rr(g, j.x - j.r * 0.9, j.y - j.r * 1.3, j.r * 1.8, j.r * 0.4, j.r * 0.15, "#d9a35a");
        twinkle(g, j.x, j.y + j.r * 0.3, j.r * 0.35 * (0.8 + Math.sin(G.t * 5 + i) * 0.2), "#fff"); }
      E(g, "🧚", s.fx, s.fy + Math.sin(G.t * 6) * G.u, G.u * 8, Math.sin(G.t * 3) * 0.15);
      txt(g, fest ? `🧚 FAIRY FESTIVAL! Every tap is magic! ${Math.ceil(s.fest)}` : `🧚 Orders: ${s.served} · next festival in ${5 - (s.served % 5)}`, G.cx, G.u * 7, G.u * 3.8, "#fff", { stroke: INK }); },
    hot(G) { const s = G.s, P = this.pz(G); if (s.happy > 0 || s.walk > 0.2) return this.cu(G); const m = this.missing(G); const spot = () => { const a = rnd(0, Math.PI * 2), d = Math.sqrt(Math.random()) * 0.7; return { x: P.x + Math.cos(a) * d * P.r, y: P.y + Math.sin(a) * d * P.r }; };
      if (s.fest > 0 || m.some(([c]) => c === s.col)) return spot(); return this.jar(G, m[0][0]); },
  },
];
