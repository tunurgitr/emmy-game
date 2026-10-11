// ==========================================================================
//  Emmy's Pizza Plus — clicker games, part 3: Legendary, Mythic & Cheesy Secret.
//  The rarer the game, the wilder it gets.
// ==========================================================================
import { E, circ, oval, rr, txt, bar, face, pizza, slice, rnd, pick, clamp, dist, INK } from "./clicker.js";
import { SFX } from "./audio.js";

const RAINBOW = ["#ff5d8f", "#ffb347", "#ffe066", "#7cffb0", "#6ec6ff", "#b18cff"];
const stars = (G, g, n = 50, speed = 4) => { for (let i = 0; i < n; i++) { const tw = 0.5 + Math.sin(G.t * 3 + i) * 0.5; circ(g, (i * 137.508 + (i * i * 0.618) % 97) % G.W, (i * 71.3 + G.t * speed * (1 + (i % 3))) % G.H, G.u * (0.25 + (i % 3) * 0.2) * (0.6 + tw * 0.6), "#fff", null); } };

export const GAMES_C = [
  // ------------------------------------------------------------------------
  //  LEGENDARY
  // ------------------------------------------------------------------------
  {
    id: "kraken", name: "The Pizza Kraken", rar: "legendary", ico: "🐙", unit: "tickles", base: 5, bg: ["#5ec8e8", "#1f5f9a"],
    blurb: "A giant kraken is hogging ALL the pizza! Tickle its head, grab pizzas from its tentacles, wipe off the ink!",
    ups: [["tap", "Tickle Feather", "🪶"], ["auto", "Submarine Pals", "🐠"], ["crit", "Giggle Attack", "🤣"]],
    win: ["The kraken giggled so hard it blew bubbles.", "The kraken shared one (1) slice. Progress!", "The kraken's cousins have heard about you.", "The kraken now says 'please' and 'thank you'.", "You and the kraken are pen pals now.", "The kraken threw you a pizza party under the sea.", "Sailors sing songs about the Kraken Tickler.", "The kraken made you a crown out of seashells.", "Ruler of the Seven Pizza Seas!"],
    init(G) { Object.assign(G.s, { lvl: 1, hp: 30, max: 30, tents: Array.from({ length: 6 }, (_, i) => ({ has: true, t: 0, ph: i * 1.1 })), ink: [], friend: 0, got: 0, wig: 0 }); },
    head(G) { return { x: G.cx, y: G.H * 0.36, r: Math.min(G.W * 0.19, G.u * 21) }; },
    tip(G, i) { const h = this.head(G), a = Math.PI * (0.1 + (i / 5) * 0.8), wob = Math.sin(G.t * (1.4 + this.speed(G)) + G.s.tents[i].ph) * 0.25, L = h.r * 2.1; return { x: h.x + Math.cos(a + wob) * L * 1.15, y: h.y + h.r * 0.5 + Math.sin(a + wob) * L * 0.8 }; },
    speed(G) { return (1 - G.s.hp / G.s.max) * 2; },
    down(G, x, y) { const s = G.s, h = this.head(G); if (s.friend > 0) return;
      for (let i = s.ink.length - 1; i >= 0; i--) { const k = s.ink[i]; if (dist(x, y, k.x, k.y) < k.r) { s.ink.splice(i, 1); G.add(1, x, y); SFX.splat(); G.dots(x, y, ["#2a2240", "#4b3a70"], 8); return; } }
      for (let i = 0; i < 6; i++) { const t = s.tents[i]; if (!t.has) continue; const p = this.tip(G, i); if (dist(x, y, p.x, p.y) < G.u * 10) { t.has = false; t.t = rnd(3, 5); s.got++; G.add(6, p.x, p.y, { color: "#ffd23f" }); SFX.pop(1.2); G.burst(p.x, p.y, "🍕", 3); G.say(pick(["Blub! Sharing is fun!", "Have that one!", "Here, a slice for you!"]), h.x, h.y - h.r, 0.9); return; } }
      if (dist(x, y, h.x, h.y) < h.r * 1.15) { s.hp--; s.wig = 1; G.add(1, x, y); SFX.giggle(); if (s.hp < s.max * 0.6 && Math.random() < 0.25) { for (let k = 0; k < 2; k++) s.ink.push({ x: rnd(0.15, 0.85) * G.W, y: rnd(0.2, 0.85) * G.H, r: G.u * rnd(9, 14) }); G.say("Squirt! Hee hee!", h.x, h.y - h.r, 0.9); }
        if (s.hp <= 0) { s.friend = 2.8; s.ink = []; SFX.wow(); G.flash("#ffd6ef"); G.add(50 * s.lvl, h.x, h.y, { color: "#ffd23f" }); G.say("OK OK! You can have ALL the pizza!", h.x, h.y - h.r, 2.4); G.burst(h.x, h.y, ["🍕", "💖", "🎉"], 30, { speed: 1.4 }); } return; }
      SFX.boop(); },
    update(G, dt) { const s = G.s; s.wig = Math.max(0, s.wig - dt * 3); for (const t of s.tents) if (!t.has && (t.t -= dt) <= 0) t.has = true;
      if (s.friend > 0) { s.friend -= dt; if (s.friend <= 0) { s.lvl++; s.max = 30 + s.lvl * 15; s.hp = s.max; s.tents.forEach((t) => (t.has = true)); G.float(`Here comes Kraken's ${pick(["cousin", "big sister", "grandpa", "best friend"])}!`, G.cx, G.u * 22, "#ffd23f", 1.1); } } },
    autoTick(G) { if (G.s.ink.length) G.s.ink.pop(); },
    draw(G, g) { const s = G.s, h = this.head(G), happy = s.friend > 0;
      for (let i = 0; i < 8; i++) circ(g, (i * 211 + G.t * 15) % G.W, G.H - ((G.t * 30 + i * 120) % G.H), G.u * (0.8 + (i % 3) * 0.6), "rgba(255,255,255,.35)", "rgba(255,255,255,.7)", 2);
      g.fillStyle = "#f5d7a0"; g.fillRect(0, G.H * 0.9, G.W, G.H);
      for (let i = 0; i < 6; i++) { const p = this.tip(G, i), a = Math.PI * (0.1 + (i / 5) * 0.8); g.lineCap = "round"; const sx = h.x + Math.cos(a) * h.r * 0.6, sy = h.y + h.r * 0.55;
        for (const [w, c] of [[G.u * 6, INK], [G.u * 4.6, "#b06be8"]]) { g.beginPath(); g.moveTo(sx, sy); g.quadraticCurveTo((sx + p.x) / 2 + Math.sin(G.t * 2 + i) * G.u * 8, (sy + p.y) / 2 + G.u * 8, p.x, p.y); g.strokeStyle = c; g.lineWidth = w; g.stroke(); }
        if (s.tents[i].has) { g.save(); g.translate(p.x, p.y); pizza(g, 0, 0, G.u * 6, { peps: 3 }); g.restore(); } }
      const sq = 1 + s.wig * 0.08 * Math.sin(G.t * 40); g.save(); g.translate(h.x, h.y); g.scale(sq, 2 - sq); oval(g, 0, 0, h.r, h.r * 1.05, "#c27af0"); for (let i = 0; i < 5; i++) circ(g, Math.cos(i * 1.4) * h.r * 0.55, -h.r * 0.4 + Math.sin(i * 2) * h.r * 0.2, h.r * 0.09, "#d9a6f5", null); g.restore();
      face(g, h.x, h.y + h.r * 0.2, h.r * 0.55, happy ? "joy" : s.wig > 0 ? "joy" : s.hp < s.max * 0.3 ? "wow" : "grumpy");
      for (const k of s.ink) { g.fillStyle = "#2a2240"; g.beginPath(); for (let i = 0; i <= 10; i++) { const a = (i / 10) * Math.PI * 2, r = k.r * (0.8 + Math.sin(i * 3 + k.x) * 0.2); g.lineTo(k.x + Math.cos(a) * r, k.y + Math.sin(a) * r); } g.fill(); }
      bar(g, G.cx - G.u * 25, G.u * 4, G.u * 50, G.u * 5, s.hp / s.max, "#c27af0"); txt(g, `🤭 Kraken #${s.lvl} tickle meter · 🍕 ${s.got}`, G.cx, G.u * 13, G.u * 3.6, "#fff", { stroke: INK }); },
    hot(G) { return this.head(G); },
  },
  {
    id: "recipe", name: "Grandma's Secret Recipe", rar: "legendary", ico: "👵", unit: "steps", base: 5, bg: ["#fff3e6", "#ffd9b8"],
    blurb: "Knead, sauce, top and bake Grandma's famous pizza — four different steps — then learn the SECRET ingredient!",
    ups: [["tap", "Grandma's Rolling Pin", "🥖"], ["auto", "Little Helper", "🧒"], ["mult", "Secret Ingredient", "🤫"]],
    win: ["Grandma says it's 'just as good as hers'!", "Grandma wiped away a tear. Of pride. And flour.", "The whole family is coming for dinner!", "Grandma wrote the recipe in her secret book. Then she ate the page.", "Your pizza won the County Fair. And the State Fair.", "Grandma says you're ready for the REAL secret.", "Chefs from Italy are visiting to learn from you.", "Grandma has officially retired. You are the new Grandma.", "The secret ingredient was you all along."],
    init(G) { Object.assign(G.s, { st: 0, prog: 0, tops: [], spawn: 0, needle: 0, nd: 1, msg: 0, secret: "", made: 0, squish: 0, la: null, acc: 0 }); },
    STEPS: ["Step 1: KNEAD the dough! Tap tap tap!", "Step 2: SAUCE! Swirl or tap!", "Step 3: TOPPINGS! Catch them!", "Step 4: BAKE! Tap in the green!", ""], NEED: [12, 10, 6],
    SECRETS: ["…a pinch of LOVE.", "…one (1) sprinkle of glitter.", "…a whisper of opera music.", "…her sock. (Clean! Probably.)", "…a hug for the dough.", "…tickling the tomatoes first.", "…a wink at the oven.", "…dancing while it bakes.", "…three secret sneezes. Just kidding!"],
    next(G) { const s = G.s; s.st++; s.prog = 0; SFX.ding(); if (s.st === 4) { s.made++; s.secret = pick(this.SECRETS); s.msg = 3; G.add(12, G.cx, G.cy, { color: "#ffd23f" }); SFX.wow(); G.burst(G.cx, G.cy, ["✨", "🍕", "💖"], 18); } },
    down(G, x, y) { const s = G.s; s.la = Math.atan2(y - G.cy, x - G.cx);
      if (s.st === 0) { s.prog++; s.squish = 1; G.add(1, G.cx, G.cy); SFX.splat(); if (s.prog >= this.NEED[0]) this.next(G); }
      else if (s.st === 1) { s.prog++; G.add(1, x, y); SFX.splat(); G.dots(x, y, ["#f2483a"], 6); if (s.prog >= this.NEED[1]) this.next(G); }
      else if (s.st === 2) { const t = s.tops.find((t) => !t.got && dist(x, y, t.x, t.y) < G.u * 9); if (t) { t.got = true; s.prog++; G.add(2, t.x, t.y); SFX.pop(1.1); if (s.prog >= this.NEED[2]) { s.tops = []; this.next(G); } } else SFX.boop(); }
      else if (s.st === 3) { const n = s.needle; if (n > 0.62 && n < 0.8) { G.add(15, G.cx, G.cy, { color: "#ffd23f" }); G.float("PERFECT BAKE!", G.cx, G.u * 26, "#4dbb5a", 1.3); } else { G.add(5, G.cx, G.cy); G.say(n < 0.62 ? "A bit doughy! Still yummy!" : "A little crispy! Grandma loves it crunchy!", G.u * 22, G.H * 0.62, 1.6); } this.next(G); } },
    move(G, x, y) { const s = G.s; if (!G.down || s.st !== 1) return; const a = Math.atan2(y - G.cy, x - G.cx); if (s.la != null) { let d = a - s.la; while (d > Math.PI) d -= Math.PI * 2; while (d < -Math.PI) d += Math.PI * 2; s.acc += Math.abs(d); } s.la = a; while (s.acc > 1) { s.acc -= 1; s.prog++; G.add(1, x, y, { quiet: true }); G.tone(300 + s.prog * 30, 0.05, { vol: 0.07 }); if (s.prog >= this.NEED[1]) { this.next(G); break; } } },
    update(G, dt) { const s = G.s; s.squish = Math.max(0, s.squish - dt * 4);
      if (s.st === 2) { s.spawn -= dt; if (s.spawn <= 0) { s.spawn = 0.55; s.tops.push({ x: rnd(0.15, 0.85) * G.W, y: -G.u * 5, e: pick(["🍄", "🫒", "🍅", "🧀", "🌿", "🧅"]), got: false }); } for (let i = s.tops.length - 1; i >= 0; i--) { const t = s.tops[i]; t.y += G.u * 28 * dt; if (t.got || t.y > G.H + 10) s.tops.splice(i, 1); } }
      if (s.st === 3) { s.needle += s.nd * dt * 0.7; if (s.needle > 1) { s.needle = 1; s.nd = -1; } if (s.needle < 0) { s.needle = 0; s.nd = 1; } }
      if (s.st === 4) { s.msg -= dt; if (s.msg <= 0) { s.st = 0; s.prog = 0; } } },
    autoTick(G) { const s = G.s; if (s.st < 2) { s.prog++; if (s.prog >= this.NEED[s.st]) this.next(G); } },
    draw(G, g) { const s = G.s, R = Math.min(G.W * 0.3, G.u * 30); E(g, "👵", G.u * 12, G.H * 0.78, G.u * 22, Math.sin(G.t * 2) * 0.05);
      if (s.st === 0) { const w = 1 + s.squish * 0.2; oval(g, G.cx, G.cy, R * 0.8 * w, R * 0.6 / w, "#fff2d6"); face(g, G.cx, G.cy, R * 0.3, s.squish > 0.3 ? "joy" : "happy"); }
      else if (s.st === 1 || s.st === 2) { circ(g, G.cx, G.cy, R, "#e8b26a"); circ(g, G.cx, G.cy, R * 0.86, "#fff2d6", null); circ(g, G.cx, G.cy, R * 0.82 * (s.st === 2 ? 1 : s.prog / this.NEED[1]), "#f2483a", null); if (s.st === 2) { circ(g, G.cx, G.cy, R * 0.75, "#ffd23f", null); for (let i = 0; i < s.prog; i++) E(g, ["🍄", "🫒", "🍅", "🧀", "🌿", "🧅"][i % 6], G.cx + Math.cos(i * 1.9) * R * 0.45, G.cy + Math.sin(i * 1.9) * R * 0.45, G.u * 8); for (const t of s.tops) E(g, t.e, t.x, t.y, G.u * 10); } }
      else if (s.st === 3) { rr(g, G.cx - R, G.cy - R * 0.7, R * 2, R * 1.4, G.u * 5, "#d96b4a"); rr(g, G.cx - R * 0.7, G.cy - R * 0.35, R * 1.4, R * 0.8, G.u * 3, "#3a1a10"); E(g, "🔥", G.cx, G.cy + R * 0.15, G.u * 12); const bx = G.cx - R, bw = R * 2, by = G.cy + R * 0.9; rr(g, bx, by, bw, G.u * 6, G.u * 3, "#fff"); rr(g, bx + bw * 0.62, by, bw * 0.18, G.u * 6, 0, "#4dbb5a", null); circ(g, bx + bw * s.needle, by + G.u * 3, G.u * 3.5, "#ff5a5f"); }
      else { pizza(g, G.cx, G.cy, R); txt(g, "🤫 The secret ingredient is…", G.cx, G.cy + R + G.u * 8, G.u * 4, INK); txt(g, s.secret, G.cx, G.cy + R + G.u * 15, G.u * 4.4, "#e63b2e"); }
      txt(g, this.STEPS[s.st], G.cx, G.u * 6, G.u * 4, "#fff", { stroke: INK }); if (s.st < 3) bar(g, G.cx - G.u * 22, G.u * 11, G.u * 44, G.u * 4, s.prog / this.NEED[s.st], "#4dbb5a"); txt(g, `🍕 ${s.made} secret pizzas`, G.cx, G.H - G.u * 6, G.u * 3.6, INK); },
    hot(G) { const s = G.s; if (s.st === 2) { const t = s.tops.find((t) => !t.got && t.y > 0); if (t) return t; } return { x: G.cx, y: G.cy }; },
  },
  {
    id: "wizard", name: "The Cheese Wizard", rar: "legendary", ico: "🧙", unit: "spells", base: 5, bg: ["#3a2a6b", "#7a4fb8"], noDots: true,
    blurb: "Watch the magic runes glow, then tap them in the same order to cast a silly cheesy spell!",
    ups: [["tap", "Longer Beard", "🧔"], ["auto", "Familiar Owl", "🦉"], ["crit", "Wild Magic", "🌈"]],
    win: ["Abraca-cheese-bra!", "You gave a frog a tiny pizza hat. It LOVES it.", "Your magic is so strong your hat glows.", "The Wizard Academy wants you as a teacher.", "You cast a spell that made Mondays taste like pizza.", "Dragons ask YOU for spell advice now.", "You can make cheese appear just by thinking about it.", "Archwizard of the Order of the Mozzarella!", "You ARE the magic."],
    init(G) { Object.assign(G.s, { seq: [], i: 0, phase: "wait", t: 0.8, lit: -1, litT: 0, lvl: 0, spell: null, casts: 0 }); },
    SPELLS: [["The pigeon got a tiny cheese hat! It seems happy.", ["🧀", "🐦"]], ["It's raining pizza!", ["🍕"]], ["The moon turned into brie!", ["🌕", "🧀"]], ["A meatball learned to fly!", ["🧆", "🪽"]], ["Everyone's shoes are now breadsticks!", ["🥖", "👟"]], ["Summoned: one (1) very confused cow.", ["🐄", "❓"]], ["Your hair is now spaghetti! (Just for a second.)", ["🍝"]], ["The clouds are cotton candy!", ["☁️", "🍬"]], ["Turned the grumpy cat into a happy cat!", ["😸", "💖"]], ["Made a rainbow out of pepperoni!", ["🌈", "🍕"]]],
    rune(G, i) { const R = Math.min(G.W * 0.3, G.H * 0.24), a = (i / 6) * Math.PI * 2 - Math.PI / 2; return { x: G.cx + Math.cos(a) * R, y: G.H * 0.42 + Math.sin(a) * R, r: G.u * 8 }; },
    newSeq(G) { const s = G.s, n = Math.min(8, 3 + Math.floor(s.lvl / 2)); s.seq = Array.from({ length: n }, () => Math.floor(rnd(0, 6))); s.i = 0; s.phase = "show"; s.t = 0.6; s.showI = 0; },
    down(G, x, y) { const s = G.s; if (s.phase !== "input") { if (s.phase === "show") G.say("Watch closely…", G.cx, G.H * 0.78, 0.8); return; }
      let hit = -1; for (let i = 0; i < 6; i++) { const r = this.rune(G, i); if (dist(x, y, r.x, r.y) < r.r * 1.3) hit = i; } if (hit < 0) { SFX.boop(); return; }
      s.lit = hit; s.litT = 0.3; SFX.note(hit * 2 + 4);
      if (hit === s.seq[s.i]) { s.i++; G.add(1, this.rune(G, hit).x, this.rune(G, hit).y); if (s.i >= s.seq.length) { s.spell = pick(this.SPELLS); s.phase = "cast"; s.t = 2.4; s.casts++; s.lvl++; G.add(s.seq.length * 4, G.cx, G.H * 0.42, { color: "#ffd23f" }); SFX.wow(); G.flash("#fff7c2"); G.burst(G.cx, G.H * 0.3, s.spell[1], 16, { speed: 1.3 }); } }
      else { s.spell = ["Poof! …a rubber duck appeared.", ["🦆"]]; s.phase = "cast"; s.t = 1.6; s.fizz = true; SFX.error(); G.add(1, G.cx, G.H * 0.42, { quiet: true }); G.burst(G.cx, G.H * 0.42, ["🦆", "💨"], 5); } },
    update(G, dt) { const s = G.s; s.litT = Math.max(0, s.litT - dt); s.t -= dt;
      if (s.phase === "wait" && s.t <= 0) this.newSeq(G);
      else if (s.phase === "show" && s.t <= 0) { if (s.showI < s.seq.length) { s.lit = s.seq[s.showI]; s.litT = 0.42; SFX.note(s.lit * 2 + 4); s.showI++; s.t = 0.6; } else { s.phase = "input"; s.i = 0; } }
      else if (s.phase === "cast" && s.t <= 0) { if (s.fizz) { s.fizz = false; s.phase = "show"; s.showI = 0; s.t = 0.6; } else this.newSeq(G); } },
    autoTick(G) { G.burst(G.W * 0.85, G.H * 0.2, "✨", 2, { size: 0.5 }); },
    draw(G, g) { const s = G.s; stars(G, g, 40, 2);
      g.strokeStyle = "rgba(255,230,140,.5)"; g.lineWidth = 3; g.beginPath(); for (let i = 0; i <= 6; i++) { const r = this.rune(G, (i * 2) % 6); i ? g.lineTo(r.x, r.y) : g.moveTo(r.x, r.y); } g.stroke();
      for (let i = 0; i < 6; i++) { const r = this.rune(G, i), on = s.lit === i && s.litT > 0; circ(g, r.x, r.y, r.r * (on ? 1.2 : 1), on ? "#ffe27a" : "#5a4a8a", on ? "#fff" : "#ffe27a", 4); E(g, ["⭐", "🌙", "🧀", "🔮", "🍄", "⚡"][i], r.x, r.y, r.r * 1.1, 0, on ? 1 : 0.55); }
      const wx = G.cx, wy = G.H * 0.42; g.beginPath(); g.moveTo(wx - G.u * 9, wy + G.u * 12); g.lineTo(wx, wy - G.u * 4); g.lineTo(wx + G.u * 9, wy + G.u * 12); g.closePath(); g.fillStyle = "#6b4fd8"; g.fill(); g.strokeStyle = INK; g.lineWidth = 3; g.stroke();
      circ(g, wx, wy - G.u * 5, G.u * 5, "#ffdcc2"); g.beginPath(); g.moveTo(wx - G.u * 4, wy - G.u * 4); g.quadraticCurveTo(wx, wy + G.u * 8 + Math.sin(G.t * 2) * G.u, wx + G.u * 4, wy - G.u * 4); g.fillStyle = "#fff"; g.fill(); g.stroke(); face(g, wx, wy - G.u * 6, G.u * 3.5, s.phase === "cast" && !s.fizz ? "joy" : "happy", { blush: false });
      g.beginPath(); g.moveTo(wx - G.u * 6, wy - G.u * 8); g.lineTo(wx + G.u * 2, wy - G.u * 20); g.lineTo(wx + G.u * 6, wy - G.u * 8); g.closePath(); g.fillStyle = "#ffd23f"; g.fill(); g.stroke(); circ(g, wx - G.u * 0.5, wy - G.u * 12, G.u * 1, "#f5b52a", null);
      if (s.phase === "cast" && s.spell) txt(g, s.spell[0], G.cx, G.H * 0.84, G.u * 4, "#ffe27a", { stroke: INK });
      txt(g, s.phase === "show" ? "👀 Watch the runes…" : s.phase === "input" ? `✨ Your turn! ${s.i}/${s.seq.length}` : s.phase === "cast" ? "" : "Get ready…", G.cx, G.u * 6, G.u * 4.2, "#fff", { stroke: INK }); txt(g, `🪄 Spells cast: ${s.casts}`, G.cx, G.H - G.u * 6, G.u * 3.4, "#d8c8ff"); },
    hot(G) { const s = G.s; return s.phase === "input" ? this.rune(G, s.seq[s.i]) : { x: G.cx, y: G.H * 0.42 }; },
  },
  {
    id: "bus", name: "Pizza Party Bus", rar: "legendary", ico: "🚌", unit: "bounces", base: 5, bg: ["#ffd6f0", "#c9b8ff"],
    blurb: "Bounce the party bus! Tap the bus stops to pick up party animals. A full bus = MEGA PARTY!",
    ups: [["tap", "Bouncy Tires", "🛞"], ["auto", "DJ Raccoon", "🦝"], ["mult", "Disco Lights", "🪩"]],
    win: ["Party time!", "The party bus has a hot tub now. (It's full of cheese.)", "The whole town joined the conga line.", "The bus is bouncing so hard it's basically flying.", "Party animals from the jungle heard about this.", "The bus driver is a llama now. Nobody knows how.", "The party never stops! It's been going since Tuesday!", "Your party is visible from space. It's very sparkly.", "Pizza Party Royalty!"],
    init(G) { Object.assign(G.s, { pax: [], stop: null, stopT: 1.5, bounce: 0, scroll: 0, party: 0, parties: 0 }); },
    MAX: 10, ANIMALS: ["🐸", "🐼", "🦄", "🐧", "🐙", "🦖", "🐨", "🐷", "🦊", "🐵", "🐻", "🐰"],
    busPos(G) { return { x: G.W * 0.38, y: G.H * 0.62 - G.s.bounce * G.u * 6 }; },
    down(G, x, y) { const s = G.s, b = this.busPos(G); if (s.party > 0) { G.burst(x, y, ["🎉", "🎊"], 4); SFX.note(Math.floor(rnd(0, 12))); return; }
      if (s.stop && Math.abs(s.stop.x - b.x) < G.u * 30 && dist(x, y, s.stop.x, G.H * 0.5) < G.u * 18) { s.pax.push(s.stop.e); G.add(4, s.stop.x, G.H * 0.45, { color: "#ffd23f" }); SFX.win(); G.say(pick(["Woo! Party!", "Is there pizza?!", "I brought snacks!", "Let's GOOO!"]), s.stop.x, G.H * 0.4, 1); s.stop = null; s.stopT = rnd(1.8, 3);
        if (s.pax.length >= this.MAX) { s.party = 3.5; s.parties++; G.add(s.pax.length * 6, G.cx, G.cy, { color: "#ffd23f" }); SFX.wow(); G.flash("#fff0fa"); G.float("🎉 MEGA PIZZA PARTY! 🎉", G.cx, G.u * 22, "#ff5aa8", 1.3); } return; }
      s.bounce = 1; G.add(1 + s.pax.length * 0.25, b.x, b.y - G.u * 14); SFX.note([0, 4, 7, 12][Math.floor(rnd(0, 4))] + 5); SFX.boing(); },
    update(G, dt) { const s = G.s; s.bounce = Math.max(0, s.bounce - dt * 3); s.scroll += dt * G.u * 30;
      if (s.party > 0) { s.party -= dt; if (Math.random() < 0.4) G.burst(rnd(0, G.W), -10, ["🎊", "🎉", "🍕", "✨"], 1, { speed: 0.3 }); if (s.party <= 0) s.pax = []; return; }
      if (!s.stop) { s.stopT -= dt; if (s.stopT <= 0) s.stop = { x: G.W + G.u * 10, e: pick(this.ANIMALS) }; } else { s.stop.x -= G.u * 30 * dt; if (s.stop.x < -G.u * 10) { s.stop = null; s.stopT = rnd(0.8, 2); } } },
    autoTick(G) { G.s.bounce = Math.max(G.s.bounce, 0.5); },
    draw(G, g) { const s = G.s, b = this.busPos(G), n = s.pax.length;
      for (let i = 0; i < 4; i++) E(g, ["🏠", "🌳", "🏪", "🌳"][i], ((i * G.W * 0.3 - s.scroll) % (G.W * 1.2) + G.W * 1.2) % (G.W * 1.2) - G.u * 10, G.H * 0.42, G.u * 16);
      g.fillStyle = "#6b6f80"; g.fillRect(0, G.H * 0.7, G.W, G.u * 14); g.fillStyle = "#fff"; for (let x = -(s.scroll % (G.u * 16)); x < G.W; x += G.u * 16) g.fillRect(x, G.H * 0.7 + G.u * 6, G.u * 8, G.u * 1.4);
      if (s.stop) { g.strokeStyle = INK; g.lineWidth = 4; g.beginPath(); g.moveTo(s.stop.x + G.u * 8, G.H * 0.7); g.lineTo(s.stop.x + G.u * 8, G.H * 0.42); g.stroke(); E(g, "🚏", s.stop.x + G.u * 8, G.H * 0.4, G.u * 10); E(g, s.stop.e, s.stop.x, G.H * 0.62 - Math.abs(Math.sin(G.t * 6)) * G.u * 3, G.u * 12); if (Math.abs(s.stop.x - b.x) < G.u * 30) txt(g, "TAP!", s.stop.x, G.H * 0.5, G.u * 5, "#ffd23f", { stroke: INK }); }
      const W = Math.min(G.W * 0.5, G.u * 56), H = G.u * 22; g.save(); g.translate(b.x, b.y); g.rotate(Math.sin(G.t * 8) * 0.02 * (1 + n * 0.2));
      for (let i = 0; i < 5; i++) { if (n < 2) break; g.globalAlpha = 0.25; g.fillStyle = RAINBOW[(i + Math.floor(G.t * 6)) % 6]; g.beginPath(); g.moveTo(0, -H * 0.6); g.lineTo(-G.u * 40 + i * G.u * 20, -H * 2.2); g.lineTo(-G.u * 34 + i * G.u * 20, -H * 2.2); g.fill(); g.globalAlpha = 1; }
      rr(g, -W / 2, -H / 2, W, H, G.u * 5, "#ffd23f"); rr(g, -W / 2, H * 0.1, W, H * 0.2, 0, "#ff5aa8", null);
      for (let i = 0; i < 5; i++) { const wx = -W / 2 + G.u * 4 + i * ((W - G.u * 8) / 5); rr(g, wx, -H * 0.38, (W - G.u * 12) / 5, H * 0.42, G.u * 2, n > 3 ? RAINBOW[(i + Math.floor(G.t * 4)) % 6] : "#bfe8ff", INK, 2); const p = s.pax[i] || s.pax[i + 5]; if (p) E(g, p, wx + (W - G.u * 12) / 10, -H * 0.17 - Math.abs(Math.sin(G.t * 7 + i)) * G.u * 1.5, G.u * 7); }
      txt(g, "PIZZA PARTY", 0, H * 0.32, G.u * 3, "#fff"); for (const wx of [-W * 0.3, W * 0.3]) { circ(g, wx, H / 2, G.u * 5, "#3b3346"); g.save(); g.translate(wx, H / 2); g.rotate(G.t * 8); g.fillStyle = "#aaa"; g.fillRect(-G.u * 2, -G.u * 0.5, G.u * 4, G.u); g.restore(); }
      g.restore(); if (s.party > 0) E(g, "🏰", G.W * 0.82, G.H * 0.48, G.u * 26);
      bar(g, G.cx - G.u * 24, G.u * 4, G.u * 48, G.u * 5, n / this.MAX, "#ff5aa8"); txt(g, `🎉 ${n}/${this.MAX} party animals · ×${(1 + n * 0.25).toFixed(2)} bounce · parties: ${s.parties}`, G.cx, G.u * 13, G.u * 3.2, INK); },
    hot(G) { return this.busPos(G); },
  },

  // ------------------------------------------------------------------------
  //  MYTHIC
  // ------------------------------------------------------------------------
  {
    id: "portal", name: "Infinity Pizza Portal", rar: "mythic", ico: "🌀", unit: "dimensions", base: 8, bg: ["#1b1040", "#3d1f6e"], noDots: true,
    blurb: "Tap the portal and pizzas from OTHER DIMENSIONS come flying out. Catch them! Fill it up for WARP MODE!",
    ups: [["tap", "Portal Polish", "🧽"], ["auto", "Time-Travel Turtle", "🐢"], ["mult", "Dimension Doubler", "♾️"]],
    win: ["A pizza from the future! It tastes like tomorrow.", "You met yourself from another dimension. She also loves pizza.", "A dinosaur ordered a pizza through the portal.", "The portal now has a gift shop.", "You've visited 1,000 dimensions. Every one has pizza.", "Time is a pizza. You are the chef.", "The multiverse has a favourite pizza person: you.", "You can see every pizza that ever was, or will be.", "INFINITY PIZZA ACHIEVED. ♾️🍕"],
    init(G) { Object.assign(G.s, { en: 0, warp: 0, flying: [], rot: 0, spit: 0, found: 0 }); },
    KINDS: [["🦖", "Dino Pizza"], ["🤖", "Robot Pizza"], ["🍦", "Ice Cream Pizza"], ["⬛", "Square Pizza (gasp!)"], ["👻", "Invisible Pizza"], ["🕰️", "Pizza from 3025"], ["🙃", "Upside-Down Pizza"], ["🔁", "Azzip (backwards pizza)"], ["🍕", "Pizza made of tiny pizzas"], ["🌮", "A taco pretending to be pizza"], ["🐙", "Octo-Pizza"], ["🌈", "Rainbow Pizza"], ["🐔", "Pizza for Chickens (corn on top!)"], ["🎸", "Rock'n'Roll Pizza"]],
    R(G) { return Math.min(G.W * 0.18, G.u * 20); },
    spit(G) { const k = pick(this.KINDS), a = rnd(0, Math.PI * 2), sp = G.u * rnd(25, 45); G.s.flying.push({ x: G.cx, y: G.cy, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, k, life: 4, rot: rnd(0, 6) }); },
    down(G, x, y) { const s = G.s, warpM = s.warp > 0 ? 3 : 1;
      const f = s.flying.find((f) => dist(x, y, f.x, f.y) < G.u * 9); if (f) { s.flying.splice(s.flying.indexOf(f), 1); s.found++; G.add(6 * warpM, f.x, f.y, { color: "#ffd23f" }); G.float(f.k[1] + "!", f.x, f.y - G.u * 9, "#fff", 0.8); SFX.sparkle(); return; }
      if (dist(x, y, G.cx, G.cy) < this.R(G) * 1.3) { G.add(warpM, G.cx, G.cy - this.R(G)); SFX.laser(); this.spit(G); if (s.warp <= 0) { s.en += 7; if (s.en >= 100) { s.en = 0; s.warp = 8; SFX.wow(); G.flash("#ffffff"); G.float("✨ WARP MODE ×3 ✨", G.cx, G.u * 20, "#7cffb0", 1.5); } } }
      else SFX.boop(); },
    update(G, dt) { const s = G.s; s.rot += dt * (s.warp > 0 ? 5 : 1.5); if (s.warp > 0) { s.warp -= dt; s.spit -= dt; if (s.spit <= 0) { s.spit = 0.22; this.spit(G); } }
      for (let i = s.flying.length - 1; i >= 0; i--) { const f = s.flying[i]; f.x += f.vx * dt; f.y += f.vy * dt; f.vx *= 0.99; f.vy *= 0.99; f.rot += dt * 2; f.life -= dt; if (f.x < -40 || f.x > G.W + 40 || f.y < -40 || f.y > G.H + 40) { f.vx *= -1; f.vy *= -1; } if (f.life <= 0) s.flying.splice(i, 1); } },
    autoTick(G) { if (Math.random() < 0.5) this.spit(G); },
    draw(G, g) { const s = G.s, R = this.R(G); stars(G, g, 60, s.warp > 0 ? 40 : 6);
      if (s.warp > 0) { g.globalAlpha = 0.18 + Math.sin(G.t * 8) * 0.06; g.fillStyle = RAINBOW[Math.floor(G.t * 6) % 6]; g.fillRect(0, 0, G.W, G.H); g.globalAlpha = 1; }
      for (let i = 7; i >= 0; i--) { g.save(); g.translate(G.cx, G.cy); g.rotate(s.rot * (i % 2 ? 1 : -1) + i); g.beginPath(); g.ellipse(0, 0, R * (0.3 + i * 0.13), R * (0.3 + i * 0.13) * 0.92, 0, 0, Math.PI * 1.7); g.strokeStyle = RAINBOW[i % 6]; g.lineWidth = G.u * 2; g.lineCap = "round"; g.stroke(); g.restore(); }
      circ(g, G.cx, G.cy, R * 0.28, "#fff", null); face(g, G.cx, G.cy, R * 0.22, s.warp > 0 ? "joy" : "wow", { blush: false });
      for (const f of s.flying) { g.save(); g.globalAlpha = Math.min(1, f.life); g.translate(f.x, f.y); g.rotate(f.rot); pizza(g, 0, 0, G.u * 6, { peps: 3 }); g.restore(); E(g, f.k[0], f.x, f.y, G.u * 6, 0, Math.min(1, f.life)); }
      if (s.warp <= 0) bar(g, G.cx - G.u * 24, G.u * 4, G.u * 48, G.u * 5, s.en / 100, "#7cffb0"); else txt(g, `WARP ${Math.ceil(s.warp)}s`, G.cx, G.u * 7, G.u * 5, "#7cffb0", { stroke: INK });
      txt(g, `🌀 Other-dimension pizzas caught: ${s.found}`, G.cx, G.H - G.u * 6, G.u * 3.4, "#d8c8ff"); },
    hot(G) { return { x: G.cx, y: G.cy }; },
  },
  {
    id: "brain", name: "Pizza Galaxy Brain", rar: "mythic", ico: "🧠", unit: "thoughts", base: 8, bg: ["#0f1a3d", "#2d1f5e"], noDots: true,
    blurb: "A pizza with a GIANT brain. Tap to give it ideas. It invents ridiculous things. Tap super fast for a BRAINSTORM!",
    ups: [["tap", "Thinking Cap", "🎓"], ["auto", "Tiny Professor", "🧑‍🔬"], ["crit", "Eureka!", "💡"]],
    win: ["The brain had its first thought: 'pizza'.", "The brain invented a pizza that delivers itself.", "The brain is now smarter than a calculator. And tastier.", "The brain wrote a book: 'How To Be Pizza'. Bestseller!", "The brain learned to speak dolphin.", "BIG BRAIN TIME!", "The brain solved every maths problem. The answer was pizza.", "GALAXY BRAIN! Planets orbit it!", "UNIVERSE BRAIN. The brain is everything now."],
    init(G) { Object.assign(G.s, { th: 0, need: 12, inv: [], card: 0, cardText: "", stage: 0, taps: [], storm: 0, pulse: 0 }); },
    IDEAS: ["Socks for snakes", "Waterproof water", "A chair for your other chair", "Glow-in-the-dark spaghetti", "A hat for your pizza", "Self-tying shoelaces (they're shy)", "A pillow that tells jokes", "Square bubbles", "A dog that walks YOU", "Pizza-flavoured toothpaste", "An umbrella for fish", "A ladder to the moon (it's very long)", "Invisible ink you can see", "A broom that sweeps itself… then naps", "Cheese that stays stretchy forever", "A sandwich made of tiny pizzas", "Instant homework (it's blank)", "A trampoline for snails", "Tickle machine 3000", "A rainbow you can eat"],
    STAGES: ["Smart Brain", "BIG Brain", "GALAXY Brain", "UNIVERSE Brain"],
    down(G, x, y) { const s = G.s, now = G.t; s.taps = s.taps.filter((t) => now - t < 1); s.taps.push(now); if (s.taps.length >= 7 && s.storm <= 0) { s.storm = 1.5; G.float("⚡ BRAINSTORM! ×2 ⚡", G.cx, G.u * 22, "#7fe3ff", 1.3); SFX.laser(); }
      s.pulse = 1; s.th++; G.add((s.storm > 0 ? 2 : 1) * (1 + s.stage * 0.5), G.cx + rnd(-G.u * 10, G.u * 10), G.H * 0.38); G.tone(600 + (s.th % 8) * 80, 0.08, { type: "sine", vol: 0.08 }); G.burst(G.cx + rnd(-G.u * 15, G.u * 15), G.H * 0.3, ["💭", "✨", "💡", "❓"], 1, { size: 0.7, grav: -0.3 });
      if (s.th >= s.need) { const idea = pick(this.IDEAS.filter((i) => !s.inv.includes(i))) || pick(this.IDEAS); s.inv.push(idea); s.th = 0; s.need = Math.round(s.need * 1.35) + 4; s.card = 2.6; s.cardText = idea; const bonus = Math.round(10 * Math.pow(s.inv.length, 1.3)); G.add(bonus, G.cx, G.cy, { color: "#ffd23f" }); SFX.wow();
        const st = s.inv.length >= 12 ? 3 : s.inv.length >= 7 ? 2 : s.inv.length >= 3 ? 1 : 0; if (st > s.stage) { s.stage = st; G.flash("#fff"); G.float(`🧠 ${this.STAGES[st]}!`, G.cx, G.u * 30, "#ff86b3", 1.5); } } },
    update(G, dt) { const s = G.s; s.pulse = Math.max(0, s.pulse - dt * 4); s.card = Math.max(0, s.card - dt); s.storm = Math.max(0, s.storm - dt); },
    autoTick(G) { G.s.th = Math.min(G.s.need - 1, G.s.th + 1); },
    draw(G, g) { const s = G.s, R = Math.min(G.W * 0.22, G.u * 24) * (1 + s.stage * 0.1), bx = G.cx, by = G.H * 0.42; stars(G, g, 70, 3);
      if (s.stage >= 3) for (let i = 0; i < 3; i++) { g.save(); g.translate(bx, by); g.rotate(G.t * 0.2 + i * 2); g.globalAlpha = 0.15; g.fillStyle = RAINBOW[i * 2]; g.beginPath(); g.ellipse(0, 0, G.W * 0.5, G.u * 10, 0, 0, 7); g.fill(); g.restore(); g.globalAlpha = 1; }
      if (s.stage >= 2) ["🪐", "🌍", "🌕"].forEach((e, i) => { const a = G.t * (0.6 + i * 0.3) + i * 2; E(g, e, bx + Math.cos(a) * R * 1.8, by + Math.sin(a) * R * 0.7, G.u * (8 + i * 2)); });
      g.save(); g.translate(G.cx, G.H * 0.72); g.scale(1, 0.4); pizza(g, 0, 0, R * 1.2); g.restore();
      const p = 1 + s.pulse * 0.06; g.save(); g.translate(bx, by); g.scale(p, p); for (let i = 0; i < 7; i++) circ(g, Math.cos(i * 0.9 - 2.8) * R * 0.55, Math.sin(i * 0.9 - 2.8) * R * 0.35 - R * 0.05, R * 0.42, "#ff9ec8", INK, 3); oval(g, 0, R * 0.1, R * 0.95, R * 0.6, "#ff9ec8");
      g.strokeStyle = "#e0609a"; g.lineWidth = 3; for (let i = 0; i < 5; i++) { g.beginPath(); g.moveTo(-R * 0.6 + i * R * 0.3, -R * 0.4); g.bezierCurveTo(-R * 0.4 + i * R * 0.3, -R * 0.1, -R * 0.7 + i * R * 0.3, R * 0.1, -R * 0.5 + i * R * 0.3, R * 0.35); g.stroke(); } g.restore();
      face(g, bx, by + R * 0.15, R * 0.4, s.storm > 0 ? "wow" : "happy");
      if (s.storm > 0) for (let i = 0; i < 3; i++) E(g, "⚡", bx + Math.cos(G.t * 9 + i * 2) * R * 1.2, by + Math.sin(G.t * 9 + i * 2) * R * 0.8, G.u * 8);
      if (s.card > 0) { g.globalAlpha = Math.min(1, s.card * 2); rr(g, G.cx - Math.min(G.W * 0.42, G.u * 48), G.H * 0.78, Math.min(G.W * 0.84, G.u * 96), G.u * 15, G.u * 4, "#fffaf0"); txt(g, "💡 INVENTED:", G.cx, G.H * 0.78 + G.u * 4.5, G.u * 3.2, "#b0570a"); txt(g, s.cardText + "!", G.cx, G.H * 0.78 + G.u * 10.5, G.u * 3.8, INK); g.globalAlpha = 1; }
      bar(g, G.cx - G.u * 24, G.u * 4, G.u * 48, G.u * 5, s.th / s.need, "#ff86b3"); txt(g, `🧠 ${this.STAGES[s.stage]} · 💡 ${s.inv.length} inventions`, G.cx, G.u * 13, G.u * 3.6, "#fff", { stroke: INK }); },
    hot(G) { return { x: G.cx, y: G.H * 0.42 }; },
  },
  {
    id: "zilla", name: "Cheese-Zilla's Dance Party", rar: "mythic", ico: "🦖", unit: "moves", base: 8, bg: ["#ffcf6b", "#ff7aa8"],
    blurb: "A giant (friendly) cheese monster loves to dance! Copy its moves with the arrows. The tiny breadstick city cheers!",
    ups: [["tap", "Dance Lessons", "💃"], ["auto", "Breadstick Fans", "🥖"], ["mult", "Spotlight", "🔦"]],
    win: ["Cheese-Zilla did a happy stomp!", "The breadstick city made you their mayor.", "Cheese-Zilla can do the worm now. It's very cheesy.", "The dance went viral in Breadstick City.", "Cheese-Zilla's cousin, Brie-Zilla, wants lessons too.", "The whole city does your dance every morning.", "Cheese-Zilla made you a trophy out of cheddar.", "Dance moves so good the ground is wobbling.", "Supreme Dance Master of the Cheese Kingdom!"],
    init(G) { Object.assign(G.s, { seq: [0, 2], i: 0, phase: "wait", t: 1, move: -1, moveT: 0, showI: 0, combos: 0, cheer: 0 }); },
    ARROWS: ["⬅️", "⬆️", "➡️", "⬇️"],
    btn(G, i) { const b = Math.min(G.u * 9, G.W * 0.09); return { x: G.cx + (i - 1.5) * b * 2.4, y: G.H - G.u * 16, r: b }; },
    zpos(G) { return { x: G.cx, y: G.H * 0.5 }; },
    doMove(G, d) { const s = G.s; s.move = d; s.moveT = 0.45; SFX.note([0, 7, 4, -5][d] + 7); },
    down(G, x, y) { const s = G.s; let hit = -1; for (let i = 0; i < 4; i++) { const b = this.btn(G, i); if (dist(x, y, b.x, b.y) < b.r * 1.15) hit = i; }
      if (hit < 0) { const z = this.zpos(G); if (dist(x, y, z.x, z.y) < G.u * 30) { this.doMove(G, Math.floor(rnd(0, 4))); G.add(1, x, y); G.say(pick(["Wheee!", "Freestyle!", "Cheesy moves!"]), z.x, z.y - G.u * 30, 0.7); } else SFX.boop(); return; }
      if (s.phase !== "input") { G.say("Watch my moves first!", this.zpos(G).x, G.H * 0.2, 0.8); return; }
      this.doMove(G, hit);
      if (hit === s.seq[s.i]) { s.i++; s.cheer = 0.6; G.add(3, this.btn(G, hit).x, this.btn(G, hit).y - G.u * 10); if (s.i >= s.seq.length) { s.combos++; G.add(s.seq.length * 5, G.cx, G.H * 0.3, { color: "#ffd23f" }); SFX.win(); G.float("💃 DANCE COMBO! 💃", G.cx, G.u * 20, "#ff5aa8", 1.3); G.burst(G.cx, G.H * 0.3, ["🎉", "🥖", "🧀", "✨"], 18); s.cheer = 2; if (s.seq.length < 9) s.seq.push(Math.floor(rnd(0, 4))); s.phase = "wait"; s.t = 1.4; } }
      else { s.phase = "oops"; s.t = 1.2; SFX.boing(); G.say(pick(["Oopsie!", "Ooh, a NEW dance move!", "Wiggle wiggle! Let's try again!"]), G.cx, G.H * 0.2, 1); } },
    update(G, dt) { const s = G.s; s.moveT = Math.max(0, s.moveT - dt); s.cheer = Math.max(0, s.cheer - dt); s.t -= dt;
      if ((s.phase === "wait" || s.phase === "oops") && s.t <= 0) { s.phase = "show"; s.showI = 0; s.t = 0.3; }
      else if (s.phase === "show" && s.t <= 0) { if (s.showI < s.seq.length) { this.doMove(G, s.seq[s.showI]); s.showI++; s.t = 0.65; } else { s.phase = "input"; s.i = 0; } } },
    autoTick(G) { G.s.cheer = Math.max(G.s.cheer, 0.4); },
    draw(G, g) { const s = G.s, z = this.zpos(G), k = s.moveT / 0.45, m = s.move;
      for (let i = 0; i < 9; i++) { const bx = G.W * (i / 8), bh = G.u * (14 + (i * 7) % 12), jump = s.cheer > 0 ? Math.abs(Math.sin(G.t * 10 + i)) * G.u * 2 : 0; rr(g, bx - G.u * 4, G.H * 0.78 - bh - jump, G.u * 8, bh, G.u * 3, "#e8b26a", INK, 2); for (let w = 0; w < 3; w++) rr(g, bx - G.u * 2, G.H * 0.78 - bh + G.u * (3 + w * 4) - jump, G.u * 4, G.u * 2, 1, "#fff4c2", null); }
      g.fillStyle = "#8fdc6a"; g.fillRect(0, G.H * 0.78, G.W, G.H);
      const R = Math.min(G.u * 22, G.W * 0.22); g.save(); g.translate(z.x + (m === 0 ? -k : m === 2 ? k : 0) * G.u * 6, z.y - (m === 1 ? k * G.u * 12 : 0)); g.rotate((m === 0 ? -0.3 : m === 2 ? 0.3 : 0) * k + (s.phase === "oops" ? Math.sin(G.t * 20) * 0.2 : 0)); g.scale(1, m === 3 ? 1 - k * 0.25 : 1);
      g.beginPath(); g.moveTo(R * 0.6, R * 0.8); g.quadraticCurveTo(R * 1.6, R * 1.0, R * 1.5, R * 0.2); g.lineWidth = R * 0.32; g.strokeStyle = INK; g.stroke(); g.lineWidth = R * 0.24; g.strokeStyle = "#ffd23f"; g.stroke();
      for (let i = 0; i < 5; i++) { g.beginPath(); g.moveTo(-R * 0.5 + i * R * 0.25, -R * 0.75 - Math.abs(i - 2) * -R * 0.05); g.lineTo(-R * 0.38 + i * R * 0.25, -R * 1.05 + Math.abs(i - 2) * R * 0.08); g.lineTo(-R * 0.26 + i * R * 0.25, -R * 0.75); g.closePath(); g.fillStyle = "#f5b52a"; g.fill(); g.strokeStyle = INK; g.lineWidth = 3; g.stroke(); }
      rr(g, -R * 0.8, -R * 0.8, R * 1.6, R * 1.8, R * 0.6, "#ffd23f"); for (const [a, b, r] of [[-0.4, -0.2, 0.12], [0.35, 0.3, 0.16], [-0.2, 0.55, 0.1], [0.45, -0.4, 0.09]]) circ(g, a * R, b * R, r * R, "#f5b52a", null);
      for (const sd of [-1, 1]) { g.save(); g.translate(sd * R * 0.8, R * 0.05); g.rotate(sd * (0.6 + Math.sin(G.t * 8) * 0.3 * (s.cheer > 0 ? 1 : 0.3))); rr(g, -R * 0.12, 0, R * 0.24, R * 0.5, R * 0.12, "#ffd23f"); g.restore(); }
      g.restore(); face(g, z.x + (m === 0 ? -k : m === 2 ? k : 0) * G.u * 6, z.y - R * 0.25 - (m === 1 ? k * G.u * 12 : 0), R * 0.55, s.phase === "oops" ? "dizzy" : s.cheer > 0 ? "joy" : "happy");
      for (let i = 0; i < 4; i++) { const b = this.btn(G, i), on = (s.phase === "show" || s.phase === "input") && s.move === i && s.moveT > 0; circ(g, b.x, b.y, b.r, on ? "#ffd23f" : s.phase === "input" ? "#fffaf0" : "#ffe9f0"); E(g, this.ARROWS[i], b.x, b.y, b.r * 1.1, 0, s.phase === "input" || on ? 1 : 0.5); }
      txt(g, s.phase === "show" ? "👀 Watch Cheese-Zilla dance…" : s.phase === "input" ? `Your turn! ${s.i}/${s.seq.length}` : s.phase === "oops" ? "Oopsie! Watch again…" : "Get ready to dance!", G.cx, G.u * 6, G.u * 4.2, "#fff", { stroke: INK }); txt(g, `💃 Combos: ${s.combos}`, G.cx, G.u * 13, G.u * 3.4, INK); },
    hot(G) { const s = G.s; return s.phase === "input" ? this.btn(G, s.seq[s.i]) : this.zpos(G); },
  },

  // ------------------------------------------------------------------------
  //  CHEESY SECRET
  // ------------------------------------------------------------------------
  {
    id: "gouda", name: "The Golden Gouda of Destiny", rar: "secret", ico: "🌟", unit: "fortunes", base: 12, bg: ["#fff4c2", "#ffc9e8"],
    blurb: "A wise golden cheese that tells your fortune. Spin it faster and faster… and the DESTINY VAULT opens!",
    ups: [["tap", "Golden Touch", "✨"], ["auto", "Fortune-Teller Frog", "🐸"], ["crit", "Destiny Dice", "🎲"]],
    win: ["The Golden Gouda smiles upon you.", "Your destiny: more cheese. Good destiny.", "The Gouda says you'll be famous. Among cheeses.", "Fortune cookies now come with YOUR fortune inside.", "The stars spell out your name. In cheese.", "The Golden Gouda has chosen you as its Champion.", "Every fortune now ends with 'and also pizza'.", "You have seen all of destiny. It was delicious.", "You ARE destiny. Golden, cheesy destiny."],
    init(G) { Object.assign(G.s, { v: 0, a: 0, vault: 0, coins: [], spawn: 0, fort: "", ft: 0, opens: 0 }); },
    FORTUNES: ["You will find a sock. It will be the wrong sock.", "A pigeon will respect you today.", "Your next pizza will be 3% cheesier.", "Beware… of a very small dog. It wants a hug.", "You will laugh at a potato.", "Someone is thinking about pizza. It's you.", "Today is a good day to wear two hats.", "You will meet a tall stranger. It's a giraffe.", "A spoon will make you smile.", "Great things are coming. Mostly cheese.", "The clouds say: 'nice job!'", "Your lucky number is pizza.", "You will dance when nobody is watching. A cat will watch.", "Adventure awaits! (After snacks.)"],
    MAXV: 12, R(G) { return Math.min(G.W * 0.26, G.u * 28); },
    down(G, x, y) { const s = G.s; if (s.vault > 0) { const c = s.coins.find((c) => !c.got && dist(x, y, c.x, c.y) < G.u * 9); if (c) { c.got = 0.4; G.add(8, c.x, c.y, { color: "#ffd23f" }); SFX.coin(); } else SFX.sparkle(); return; }
      s.v = Math.min(this.MAXV, s.v + 1.3); G.add(1 + s.v * 0.3, G.cx, G.H * 0.45 - this.R(G)); SFX.sparkle(); s.fort = pick(this.FORTUNES); s.ft = 2.2; G.burst(G.cx, G.H * 0.45, RAINBOW.map(() => "✨"), 3, { size: 0.6 });
      if (s.v >= this.MAXV) { s.vault = 6; s.v = 0; s.opens++; SFX.wow(); G.flash("#fff7c2"); G.float("🌟 THE DESTINY VAULT OPENS! 🌟", G.cx, G.u * 20, "#ffb000", 1.2); } },
    update(G, dt) { const s = G.s; s.a += s.v * dt * 0.8 + dt * 0.3; s.v = Math.max(0, s.v - dt * 0.7); s.ft = Math.max(0, s.ft - dt);
      if (s.vault > 0) { s.vault -= dt; s.spawn -= dt; if (s.spawn <= 0) { s.spawn = 0.12; s.coins.push({ x: rnd(0.08, 0.92) * G.W, y: -G.u * 5, vy: rnd(20, 34) * G.u, got: 0, r: rnd(0, 6) }); } }
      for (let i = s.coins.length - 1; i >= 0; i--) { const c = s.coins[i]; if (c.got) { c.got -= dt; c.y -= G.u * 30 * dt; if (c.got <= 0) s.coins.splice(i, 1); continue; } c.y += c.vy * dt; c.r += dt * 4; if (c.y > G.H + 10) s.coins.splice(i, 1); }
      if (Math.random() < 0.3) G.parts.push({ x: rnd(0, G.W), y: G.H + 5, vx: 0, vy: -G.u * rnd(10, 25), life: 2, max: 2, c: pick(RAINBOW), size: G.u * 0.8, grav: -0.05 }); },
    autoTick(G) { G.s.v = Math.min(this.MAXV - 0.5, G.s.v + 0.4); },
    draw(G, g) { const s = G.s, R = this.R(G), x = G.cx, y = G.H * 0.45;
      g.save(); g.translate(x, y); g.rotate(G.t * 0.3); for (let i = 0; i < 12; i++) { g.rotate(Math.PI / 6); g.globalAlpha = 0.25; g.fillStyle = RAINBOW[i % 6]; g.beginPath(); g.moveTo(0, 0); g.lineTo(-G.u * 8, -G.H); g.lineTo(G.u * 8, -G.H); g.fill(); } g.restore(); g.globalAlpha = 1;
      g.save(); g.translate(x, y); g.rotate(s.a); circ(g, 0, 0, R, "#ffcf3a", "#b07800", 6); circ(g, 0, 0, R * 0.85, "#ffe27a", null); for (let i = 0; i < 7; i++) circ(g, Math.cos(i * 0.9) * R * 0.55, Math.sin(i * 0.9) * R * 0.55, R * (0.06 + (i % 3) * 0.03), "#f5c030", null); g.restore();
      face(g, x, y, R * 0.45, s.vault > 0 ? "joy" : s.v > 8 ? "wow" : "smug"); E(g, "👑", x, y - R * 0.95, R * 0.55, Math.sin(G.t * 2) * 0.1);
      for (const c of s.coins) E(g, "🪙", c.x, c.y, G.u * 9, c.r, c.got ? c.got / 0.4 : 1);
      if (s.ft > 0 && s.vault <= 0) { g.globalAlpha = Math.min(1, s.ft * 2); rr(g, G.cx - Math.min(G.W * 0.44, G.u * 50), G.H * 0.8, Math.min(G.W * 0.88, G.u * 100), G.u * 12, G.u * 4, "#fffaf0"); txt(g, "🥠 " + s.fort, G.cx, G.H * 0.8 + G.u * 6, Math.min(G.u * 3.4, (G.W * 0.85) / Math.max(20, s.fort.length) * 1.6), INK); g.globalAlpha = 1; }
      if (s.vault > 0) txt(g, `Catch the destiny coins! ${Math.ceil(s.vault)}s`, G.cx, G.u * 7, G.u * 4.4, "#fff", { stroke: INK }); else { bar(g, G.cx - G.u * 24, G.u * 4, G.u * 48, G.u * 5, s.v / this.MAXV, "#ffb000"); txt(g, `🌀 Spin to unlock destiny · opened ${s.opens}×`, G.cx, G.u * 13, G.u * 3.4, INK); } },
    hot(G) { const s = G.s; if (s.vault > 0) { const c = s.coins.find((c) => !c.got && c.y > 0); if (c) return c; } return { x: G.cx, y: G.H * 0.45 }; },
  },
  {
    id: "cat", name: "Pizza Cat Supreme", rar: "secret", ico: "😺", unit: "purrs", base: 12, bg: ["#241a4a", "#5a2f7a"], noDots: true,
    blurb: "The ruler of the universe: a cat in a pizza box, in SPACE. Pet it for purrs. Fill the purr meter for SUPREME MODE!",
    ups: [["tap", "Cat Treats", "🐟"], ["auto", "Kitten Choir", "🐱"], ["mult", "Royal Crown", "👑"]],
    win: ["Pizza Cat has noticed you. That's an honour.", "Pizza Cat purred. The planets wobbled.", "Pizza Cat lets you sit in its second-best box.", "Pizza Cat's laser eyes have baked 1,000 pizzas.", "Pizza Cat has knighted you: Sir/Dame Petsalot.", "The galaxy is now shaped like a cat. Pizza Cat did it.", "Pizza Cat sleeps on your lap. You cannot move. Ever.", "Pizza Cat has chosen you as its royal human.", "You and Pizza Cat rule the universe together. Purrrr."],
    init(G) { Object.assign(G.s, { purr: 0, sup: 0, pz: [], spawn: 0, acc: 0, mew: 0, thought: "", tt: 0, tail: 0 }); },
    THOUGHTS: ["I am the pizza now.", "Feed me the crust, human.", "Bow before Pizza Cat.", "This box is my kingdom.", "Mrrrp. Purr-fect petting.", "I knocked a planet off the table.", "Pepperoni is my favourite colour.", "I could rule the universe. I already do.", "Nap time? Nap time."],
    cat(G) { return { x: G.cx, y: G.H * 0.5, r: Math.min(G.W * 0.2, G.u * 22) }; },
    down(G, x, y) { const s = G.s, c = this.cat(G);
      if (s.sup > 0) { const p = s.pz.find((p) => !p.got && dist(x, y, p.x, p.y) < G.u * 9); if (p) { p.got = 0.4; G.add(10, p.x, p.y, { color: "#ffd23f" }); SFX.pop(1.3); return; } }
      if (dist(x, y, c.x, c.y) < c.r * 1.3) { s.mew = 0.5; s.purr = Math.min(100, s.purr + 2); G.add(1 + s.purr / 50, x, y); SFX.meow(); s.thought = pick(this.THOUGHTS); s.tt = 2; this.checkSup(G); } else SFX.boop(); },
    move(G, x, y, ox, oy) { const s = G.s, c = this.cat(G); if (!G.down || dist(x, y, c.x, c.y) > c.r * 1.3) return; s.acc += Math.hypot(x - ox, y - oy);
      while (s.acc > G.u * 10) { s.acc -= G.u * 10; s.purr = Math.min(100, s.purr + 3); G.add(1 + s.purr / 50, x, y, { quiet: Math.random() < 0.6 }); G.burst(x, y, "💖", 1, { size: 0.6, grav: -0.4 }); if (Math.random() < 0.3) SFX.purr(); this.checkSup(G); } },
    checkSup(G) { const s = G.s; if (s.purr >= 100 && s.sup <= 0) { s.sup = 7; s.purr = 0; SFX.wow(); G.flash("#ffd6ef"); G.float("👑 SUPREME MODE! 👑", G.cx, G.u * 20, "#ffd23f", 1.4); } },
    update(G, dt) { const s = G.s; s.mew = Math.max(0, s.mew - dt); s.tt = Math.max(0, s.tt - dt); s.tail += dt;
      if (s.sup > 0) { s.sup -= dt; s.spawn -= dt; if (s.spawn <= 0) { s.spawn = 0.35; const left = Math.random() < 0.5; s.pz.push({ x: left ? -G.u * 8 : G.W + G.u * 8, y: rnd(0.15, 0.85) * G.H, vx: (left ? 1 : -1) * G.u * rnd(20, 32), got: 0, r: 0 }); if (Math.random() < 0.4) SFX.laser(); } }
      for (let i = s.pz.length - 1; i >= 0; i--) { const p = s.pz[i]; if (p.got) { p.got -= dt; if (p.got <= 0) s.pz.splice(i, 1); continue; } p.x += p.vx * dt; p.r += dt * 3; if (p.x < -G.u * 12 || p.x > G.W + G.u * 12) s.pz.splice(i, 1); } },
    autoTick(G) { G.s.purr = Math.min(99, G.s.purr + 2); G.burst(G.cx, G.H * 0.3, "🎵", 1, { size: 0.6, grav: -0.3 }); },
    draw(G, g) { const s = G.s, c = this.cat(G), R = c.r; stars(G, g, 70, 2); E(g, "🪐", G.W * 0.85, G.H * 0.15, G.u * 14); E(g, "🌙", G.W * 0.12, G.H * 0.2, G.u * 10);
      rr(g, c.x - R * 1.5, c.y + R * 0.4, R * 3, R * 0.9, G.u * 3, "#fff4dc"); rr(g, c.x - R * 1.5, c.y - R * 0.9, R * 3, R * 0.25, G.u * 2, "#fff4dc"); g.strokeStyle = INK; g.lineWidth = 3; g.beginPath(); g.moveTo(c.x - R * 1.5, c.y - R * 0.65); g.lineTo(c.x - R * 1.5, c.y + R * 0.4); g.stroke(); txt(g, "PIZZA", c.x, c.y + R * 0.85, G.u * 4, "#e63b2e");
      g.beginPath(); g.moveTo(c.x + R * 0.7, c.y + R * 0.3); g.quadraticCurveTo(c.x + R * 1.5, c.y - R * 0.2 + Math.sin(s.tail * 3) * R * 0.3, c.x + R * 1.3, c.y - R * 0.8); g.lineWidth = R * 0.24; g.strokeStyle = INK; g.stroke(); g.lineWidth = R * 0.16; g.strokeStyle = "#ffa64d"; g.stroke();
      oval(g, c.x, c.y + R * 0.2, R * 0.9, R * 0.55, "#ffa64d"); circ(g, c.x, c.y - R * 0.3, R * 0.6, "#ffb766");
      for (const sd of [-1, 1]) { g.beginPath(); g.moveTo(c.x + sd * R * 0.5, c.y - R * 0.55); g.lineTo(c.x + sd * R * 0.55, c.y - R * 1.05); g.lineTo(c.x + sd * R * 0.15, c.y - R * 0.8); g.closePath(); g.fillStyle = "#ffb766"; g.fill(); g.strokeStyle = INK; g.lineWidth = 3; g.stroke(); }
      for (const sd of [-1, 1]) for (const dy of [-0.05, 0.05]) { g.beginPath(); g.moveTo(c.x + sd * R * 0.35, c.y - R * 0.22 + dy * R); g.lineTo(c.x + sd * R * 0.85, c.y - R * 0.28 + dy * R * 2); g.strokeStyle = INK; g.lineWidth = 2; g.stroke(); }
      face(g, c.x, c.y - R * 0.3, R * 0.42, s.mew > 0 ? "wow" : s.sup > 0 ? "smug" : G.down ? "joy" : "happy"); E(g, "👑", c.x, c.y - R * 1.05, R * 0.6, Math.sin(G.t * 2) * 0.1);
      if (s.sup > 0) for (const p of s.pz) if (!p.got) for (const sd of [-1, 1]) { g.strokeStyle = RAINBOW[(Math.floor(G.t * 10) + (sd > 0 ? 3 : 0)) % 6]; g.globalAlpha = 0.6; g.lineWidth = G.u * 0.8; g.beginPath(); g.moveTo(c.x + sd * R * 0.16, c.y - R * 0.34); g.lineTo(p.x, p.y); g.stroke(); g.globalAlpha = 1; }
      for (const p of s.pz) { g.save(); g.globalAlpha = p.got ? p.got / 0.4 : 1; g.translate(p.x, p.y); g.rotate(p.r); pizza(g, 0, 0, G.u * 6, { peps: 3 }); g.restore(); }
      if (s.tt > 0) speech(g, s.thought, c.x, c.y - R * 1.3, G.u * 3.4 + 6, G);
      if (s.sup > 0) txt(g, `👑 SUPREME! Tap the pizzas! ${Math.ceil(s.sup)}s`, G.cx, G.u * 7, G.u * 4.2, "#ffd23f", { stroke: INK }); else { bar(g, G.cx - G.u * 24, G.u * 4, G.u * 48, G.u * 5, s.purr / 100, "#ff86b3"); txt(g, "🖐️ Pet the cat (drag across it!)", G.cx, G.u * 13, G.u * 3.4, "#fff", { stroke: INK }); } },
    hot(G) { return this.cat(G); },
  },
];
function speech(g, text, x, y, size, G) { g.save(); g.globalAlpha = 0.95; g.font = `800 ${size}px system-ui, sans-serif`; const w = Math.min(G.W * 0.8, g.measureText(text).width + size * 1.4); rr(g, clamp(x - w / 2, 6, G.W - w - 6), y - size * 1.8, w, size * 1.8, size * 0.8, "#fffaf0"); txt(g, text, clamp(x, w / 2 + 6, G.W - w / 2 - 6), y - size * 0.9, size, INK, { weight: 800 }); g.restore(); }
