// ==========================================================================
//  Emmy's Pizza Plus — clicker games, part 1: Common & Uncommon.
//  Each game is a little definition object run by clicker.js.
// ==========================================================================
import { E, circ, oval, rr, txt, bar, face, pizza, slice, rnd, pick, clamp, dist, INK } from "./clicker.js";
import { SFX } from "./audio.js";

const PZ = (G) => ({ x: G.cx, y: G.cy - G.u * 3, r: Math.min(G.W * 0.4, G.H * 0.34) });

export const GAMES_A = [
  // ------------------------------------------------------------------------
  //  COMMON
  // ------------------------------------------------------------------------
  {
    id: "pepperoni", name: "Pepperoni Popper", rar: "common", ico: "🍕", unit: "pops", base: 1, bg: ["#fff0d0", "#ffb38a"],
    blurb: "Pepperonis bubble up on a hot pizza. POP them before they wander off!",
    ups: [["tap", "Pointy Finger", "👉"], ["auto", "Pepperoni Pal", "🐭"], ["crit", "Spicy Pepperoni", "🌶️"]],
    win: ["The pepperonis are popping like popcorn!", "Your pizza is now 90% pepperoni and 10% pizza.", "Scientists say you are the fastest popper alive.", "You popped so much pepperoni the moon is now a pepperoni. Look up!", "Pepperonis everywhere are writing songs about you.", "There is no pepperoni left on Earth. You popped it all. Wow.", "The pepperonis have made you their queen.", "Pepperoni Popper Hall of Fame: just you. Only you.", "You are the pepperoni now."],
    init(G) { G.s.peps = []; G.s.spawn = 0.4; G.s.combo = 0; for (let i = 0; i < 3; i++) this.spawn(G, 0.6); },
    spawn(G, g0 = 0) { const a = rnd(0, 6.28), d = Math.sqrt(Math.random()) * 0.62; G.s.peps.push({ x: Math.cos(a) * d, y: Math.sin(a) * d, g: g0, age: 0, mega: Math.random() < 0.08, hp: 4, wob: 0 }); },
    pos(G, p) { const P = PZ(G); return { x: P.x + p.x * P.r, y: P.y + p.y * P.r, r: P.r * 0.13 * Math.min(1, p.g) * (p.mega ? 1.8 : 1) }; },
    down(G, x, y) {
      for (const p of G.s.peps) { const q = this.pos(G, p); if (dist(x, y, q.x, q.y) < q.r + G.u * 4 && p.g > 0.3) {
        if (p.mega && --p.hp > 0) { p.wob = 1; G.add(1, q.x, q.y); SFX.pop(0.6); G.shake(0.6); return; }
        G.s.peps.splice(G.s.peps.indexOf(p), 1); G.s.combo++; G.add(p.mega ? 10 : 1, q.x, q.y, { color: p.mega ? "#ffd23f" : "#fff" }); G.dots(q.x, q.y, ["#d8343a", "#9a1f24", "#ffd23f"], p.mega ? 22 : 10); SFX.pop(1 + Math.min(1, G.s.combo * 0.04));
        if (G.s.combo % 10 === 0) G.float(`${G.s.combo} POP COMBO!`, G.cx, G.u * 14, "#ffd23f", 1.3); return; } }
      G.s.combo = 0; SFX.boop(); G.float("boop!", x, y, "#fff", 0.7);
    },
    update(G, dt) { const s = G.s; s.spawn -= dt; if (s.spawn <= 0 && s.peps.length < 7) { s.spawn = rnd(0.25, 0.7); this.spawn(G); }
      for (let i = s.peps.length - 1; i >= 0; i--) { const p = s.peps[i]; p.g = Math.min(1, p.g + dt * 2.2); p.age += dt; p.wob = Math.max(0, p.wob - dt * 3); if (p.age > 4.5 && !p.mega) { const q = this.pos(G, p); G.burst(q.x, q.y, "💨", 2, { size: 0.6 }); s.peps.splice(i, 1); } } },
    autoTick(G) { const p = G.s.peps.find((p) => !p.mega && p.g > 0.5); if (p) { const q = this.pos(G, p); G.dots(q.x, q.y, ["#d8343a"], 6); G.s.peps.splice(G.s.peps.indexOf(p), 1); } },
    draw(G, g) { const P = PZ(G); pizza(g, P.x, P.y, P.r, { peps: 0 }); E(g, "♨️", P.x - P.r * 0.9, P.y - P.r * 0.85, G.u * 8, Math.sin(G.t * 2) * 0.2);
      for (const p of G.s.peps) { const q = this.pos(G, p), w = 1 + Math.sin(G.t * 18) * 0.08 * p.wob + (p.age > 3.5 ? Math.sin(G.t * 30) * 0.06 : 0); circ(g, q.x, q.y, q.r * w, p.mega ? "#ff4040" : "#d8343a", "#8a1a1f"); if (q.r > G.u * 2) face(g, q.x, q.y, q.r * 0.8, p.mega ? "angry" : p.age > 3.5 ? "wow" : "happy", { blush: false }); if (p.mega) txt(g, "MEGA", q.x, q.y - q.r - G.u * 2, G.u * 3, "#fff", { stroke: INK }); }
      if (G.s.combo > 2) txt(g, `🔥 ${G.s.combo} in a row!`, G.cx, G.H - G.u * 18, G.u * 4.5, "#fff", { stroke: INK }); },
    hot(G) { const p = G.s.peps.find((p) => p.g > 0.3); return p ? this.pos(G, p) : PZ(G); },
  },
  {
    id: "dough", name: "Toss the Dough (too high!)", rar: "common", ico: "🫓", unit: "tosses", base: 1, bg: ["#cfeeff", "#fff4e0"],
    blurb: "Tap when the dough comes down to toss it higher… and higher… and WAY too high!",
    ups: [["tap", "Floury Hands", "🧤"], ["auto", "Pizza Intern", "🧑‍🍳"], ["mult", "Spinny Wrist", "🌀"]],
    win: ["Nice toss! The ceiling has a dough-shaped mark now.", "You tossed it so high a pigeon got a free ride.", "Airplanes are reporting flying pizza dough.", "The dough went to space and came back. It says hi.", "NASA wants to hire your dough.", "Your dough has more air miles than a pilot.", "The dough is now a cloud. A delicious cloud.", "Weather report: cloudy with a chance of dough.", "Legend says your dough is still going up."],
    init(G) { Object.assign(G.s, { y: 0, vy: 0, held: true, streak: 0, item: null, high: false, splat: 0, rot: 0, best: 0 }); },
    handY: (G) => G.H * 0.68,
    down(G, x, y) { const s = G.s; if (s.splat > 0) return;
      if (s.held || (s.vy > 0 && s.y > G.H * 0.3)) {
        const h = G.H * (0.3 + Math.min(s.streak, 12) * 0.075); s.vy = -Math.sqrt(2 * G.H * 2.4 * h); if (s.held) s.y = this.handY(G); s.held = false; s.high = false; s.streak++; s.best = Math.max(s.best, s.streak);
        G.add(1 + Math.floor(s.streak / 3), G.cx, s.y); SFX.whoosh(); SFX.boing(); if (s.streak % 5 === 0) G.float(`${s.streak} tosses! 🔥`, G.cx, G.u * 18, "#ffd23f", 1.2);
      } else { G.say("Wait for it…", G.cx + G.u * 20, G.H * 0.62, 0.9); SFX.boop(); }
    },
    update(G, dt) { const s = G.s; if (s.splat > 0) { s.splat -= dt; if (s.splat <= 0) { s.held = true; s.item = null; s.y = this.handY(G); } return; }
      if (s.held) { s.y = this.handY(G) + Math.sin(G.t * 3) * G.u; s.rot += dt; return; }
      s.vy += G.H * 2.4 * dt; s.y += s.vy * dt; s.rot += dt * (4 + s.streak * 0.6);
      if (s.y < -G.H * 0.15 && !s.high) { s.high = true; s.item = pick(["🛰️", "🐦", "🎩", "🪁", "☁️", "🛸", "🎈", "🦆", "⭐", "🧦"]); SFX.wow(); G.float("TOO HIGH!", G.cx, G.u * 12, "#ff5a5f", 1.5); G.add(5 + s.streak, G.cx, G.u * 22, { color: "#ffd23f" }); }
      if (s.high && s.item && s.vy > 0 && s.y > G.u * 10 && !s.told) { s.told = true; G.say(`It came back with a ${s.item}!`, G.cx, G.u * 30, 1.6); }
      if (s.vy < 0) s.told = false;
      if (s.y > G.H * 0.86) { s.splat = 1.0; s.streak = 0; s.vy = 0; s.y = G.H * 0.86; SFX.splat(); G.shake(1.5); G.say(pick(["SPLAT! Five-second rule!", "Oops! The floor wanted pizza too.", "Dough-n't worry about it!"]), G.cx, G.H * 0.8, 1.4); }
    },
    autoTick(G) { G.burst(G.cx + rnd(-G.u * 30, G.u * 30), G.H * 0.9, "🫓", 1, { size: 0.6 }); },
    draw(G, g) { const s = G.s, hy = this.handY(G);
      for (let i = 0; i < 4; i++) E(g, "☁️", ((G.t * 8 * (i + 1) + i * 300) % (G.W + 200)) - 100, G.u * (8 + i * 9), G.u * (10 + i * 2), 0, 0.8);
      E(g, "🧑‍🍳", G.cx, hy + G.u * 22, G.u * 34);
      const sq = s.held ? 1 : clamp(1 - s.vy / (G.H * 10), 0.7, 1.3), r = G.u * 12;
      if (s.splat > 0) oval(g, G.cx, s.y, r * 1.8, r * 0.4, "#fff2d6"); else { g.save(); g.translate(G.cx, s.y); g.rotate(s.rot); oval(g, 0, 0, r * (2 - sq), r * sq * 0.8, "#fff2d6"); for (let i = 0; i < 5; i++) circ(g, Math.cos(i * 1.3) * r * 0.5, Math.sin(i * 1.3) * r * 0.3, G.u * 0.8, "#f0d9ae", null); g.restore(); face(g, G.cx, s.y, r * 0.6, s.y < G.H * 0.2 ? "wow" : "happy"); if (s.item) E(g, s.item, G.cx + r * 0.8, s.y - r * 0.6, G.u * 9, Math.sin(G.t * 5) * 0.3); }
      txt(g, `Streak: ${s.streak}   Best: ${s.best}`, G.cx, G.u * 6, G.u * 4, "#fff", { stroke: INK });
      if (s.held) txt(g, "👆 Tap to toss!", G.cx, hy - G.u * 18, G.u * 4.5, "#fff", { stroke: INK }); else if (s.vy > 0 && s.y > G.H * 0.3) txt(g, "NOW!", G.cx + G.u * 22, s.y, G.u * 5, "#ffd23f", { stroke: INK });
    },
    hot(G) { return { x: G.cx, y: G.s.held ? this.handY(G) : G.s.y }; },
  },
  {
    id: "honk", name: "Delivery Scooter Honk", rar: "common", ico: "🛵", unit: "honks", base: 1, bg: ["#bfe8ff", "#fff1d0"],
    blurb: "HONK to deliver the pizza! Pigeons keep sitting in the road. Honk them away!",
    ups: [["tap", "Louder Horn", "📯"], ["auto", "Honk Robot", "🤖"], ["crit", "Clown Horn", "🤡"]],
    win: ["Beep beep! First delivery done!", "The whole street knows your honk.", "Pigeons have formed a 'No Honking' club. Nobody joined.", "Your horn is so loud fish can hear it.", "You honked so much the scooter learned to honk back.", "Honk-a-thon champion!", "The Mayor gave you a golden horn. It says HONK.", "Your honk echoes forever. HONK… honk… honk…", "You are the Honk."],
    init(G) { Object.assign(G.s, { prog: 0, need: 12, pigeons: [], spawn: 3, scroll: 0, speed: 0, bounce: 0, deliv: 0, words: [], done: 0 }); },
    down(G, x, y) { const s = G.s; s.bounce = 1; SFX.honk(pick([0.8, 1, 1.2, 1.5, 0.6]));
      s.words.push({ x: G.cx + rnd(-G.u * 30, G.u * 30), y: G.H * 0.3 + rnd(-G.u * 10, G.u * 10), t: 0.8, w: pick(["HONK!", "BEEP!", "HONK HONK!", "MEEP!", "AWOOGA!", "TOOT!"]), c: pick(["#ff5a5f", "#ffd23f", "#4aa8ff", "#9a6bff", "#4dbb5a"]), r: rnd(-0.3, 0.3) });
      if (s.pigeons.length) { const p = s.pigeons.shift(); G.burst(p.x, p.y, ["🪶", "🐦"], 4); SFX.squawk(); G.add(3, p.x, p.y, { color: "#ffd23f" }); G.say(pick(["Coo?!", "Rude!", "COO COO!", "I was resting!"]), p.x, p.y - G.u * 6, 1); }
      else { G.add(1, G.cx, G.H * 0.5); s.prog++; s.speed = 1; }
      if (s.prog >= s.need) { s.prog = 0; s.need += 4; s.deliv = 2.2; s.done++; G.add(10, G.W * 0.8, G.H * 0.4, { color: "#ffd23f" }); SFX.win(); G.burst(G.W * 0.8, G.H * 0.45, ["🍕", "🎉"], 10); G.say(pick(["Thanks! Is it… squished? It's fine!", "Pizza! I ordered this in 1987!", "Wow, still warm! Ish!", "You're my hero!"]), G.W * 0.8, G.H * 0.36, 2); }
    },
    update(G, dt) { const s = G.s; s.bounce = Math.max(0, s.bounce - dt * 4); s.speed = Math.max(0, s.speed - dt * 1.2); s.scroll += s.speed * dt * G.u * 60; s.deliv = Math.max(0, s.deliv - dt);
      s.spawn -= dt; if (s.spawn <= 0) { s.spawn = rnd(2.5, 5); if (s.pigeons.length < 3) s.pigeons.push({ x: G.W + G.u * 10, tx: G.cx + G.u * (14 + s.pigeons.length * 9), y: G.H * 0.66 }); }
      for (const p of s.pigeons) p.x += (p.tx - p.x) * Math.min(1, dt * 1.5);
      for (let i = s.words.length - 1; i >= 0; i--) { s.words[i].t -= dt; if (s.words[i].t <= 0) s.words.splice(i, 1); } },
    autoTick(G) { if (G.s.pigeons.length) { const p = G.s.pigeons.shift(); G.burst(p.x, p.y, "🪶", 3); } },
    draw(G, g) { const s = G.s, ry = G.H * 0.6;
      E(g, "🏠", G.W * 0.12 - (s.scroll % (G.W * 0.6)), ry - G.u * 16, G.u * 18); E(g, "🌳", G.W * 0.5 - ((s.scroll + 200) % (G.W * 0.8)) + G.W * 0.3, ry - G.u * 16, G.u * 16);
      g.fillStyle = "#6b6f80"; g.fillRect(0, ry, G.W, G.u * 18); g.fillStyle = "#fff"; for (let x = -(s.scroll % (G.u * 16)); x < G.W; x += G.u * 16) g.fillRect(x, ry + G.u * 8, G.u * 8, G.u * 1.5);
      if (s.deliv > 0) { E(g, "🏡", G.W * 0.8, ry - G.u * 12, G.u * 22); E(g, "🙋", G.W * 0.8, ry + G.u * 2, G.u * 12); }
      E(g, "🛵", G.cx - G.u * 6, ry - G.u * 4 - s.bounce * G.u * 4, G.u * 30, -s.bounce * 0.1, 1, -1, 1); E(g, "🍕", G.cx - G.u * 16, ry - G.u * 18 - s.bounce * G.u * 5, G.u * 9);
      for (const p of s.pigeons) E(g, "🐦", p.x, p.y + Math.sin(G.t * 8 + p.tx) * G.u * 0.5, G.u * 10, 0, 1, -1, 1);
      if (s.pigeons.length) txt(g, "🐦 Pigeons in the road! HONK!", G.cx, G.H * 0.86, G.u * 4, "#fff", { stroke: INK });
      for (const w of s.words) { g.save(); g.translate(w.x, w.y); g.rotate(w.r); g.scale(1 + (0.8 - w.t), 1 + (0.8 - w.t)); txt(g, w.w, 0, 0, G.u * 7, w.c, { stroke: INK }); g.restore(); }
      txt(g, "🏁 Delivery", G.cx - G.u * 26, G.u * 6, G.u * 3.5, INK, { align: "right" }); bar(g, G.cx - G.u * 24, G.u * 3.5, G.u * 48, G.u * 5, s.prog / s.need, "#4dbb5a"); txt(g, `🍕 ${s.done}`, G.cx + G.u * 27, G.u * 6, G.u * 3.5, INK, { align: "left" });
      circ(g, G.W - G.u * 14, G.H - G.u * 26, G.u * 9 * (1 + s.bounce * 0.15), "#ff5a5f"); txt(g, "HONK", G.W - G.u * 14, G.H - G.u * 26, G.u * 3.5, "#fff");
    },
  },
  {
    id: "sauce", name: "Sauce Spiral", rar: "common", ico: "🥫", unit: "swirls", base: 1, bg: ["#ffe9d6", "#ffc1a1"],
    blurb: "Swirl your finger round and round to spread the sauce. Or just splat it!",
    ups: [["tap", "Bigger Ladle", "🥄"], ["auto", "Sauce Snail", "🐌"], ["mult", "Secret Sauce", "🤫"]],
    win: ["Saucy!", "You are the Picasso of pizza sauce.", "Grandma is crying happy saucy tears.", "The sauce spiral can now be seen from space.", "Tomatoes everywhere are proud of you.", "You've swirled enough sauce to fill a swimming pool. Please don't.", "Sauce boss. SAUCE BOSS!", "The spiral is hypnotising the pigeons.", "You are one with the sauce."],
    init(G) { Object.assign(G.s, { cov: 0, acc: 0, la: null, splats: [], made: 0, cheese: 0 }); },
    down(G, x, y) { const P = PZ(G), s = G.s; s.la = Math.atan2(y - P.y, x - P.x); if (dist(x, y, P.x, P.y) < P.r) { s.splats.push({ x: (x - P.x) / P.r, y: (y - P.y) / P.r, r: rnd(0.08, 0.14) }); s.cov += 0.03; G.add(1, x, y); SFX.splat(); G.dots(x, y, ["#f2483a", "#c62828"], 6); this.check(G); } else SFX.boop(); },
    move(G, x, y) { if (!G.down) return; const P = PZ(G), s = G.s; if (dist(x, y, P.x, P.y) > P.r * 1.2) return; const a = Math.atan2(y - P.y, x - P.x); if (s.la != null) { let d = a - s.la; while (d > Math.PI) d -= Math.PI * 2; while (d < -Math.PI) d += Math.PI * 2; s.acc += Math.abs(d); } s.la = a;
      while (s.acc > 0.7) { s.acc -= 0.7; s.cov += 0.025; G.add(1, x, y, { quiet: Math.random() < 0.5 }); G.tone(300 + s.cov * 500, 0.06, { type: "sine", vol: 0.08 }); this.check(G); } },
    check(G) { const s = G.s; if (s.cov >= 1) { s.cov = 0; s.splats = []; s.made++; s.cheese = 1; G.add(8, G.cx, G.cy, { color: "#ffd23f" }); SFX.win(); G.float("PERFECT SAUCE!", G.cx, G.u * 14, "#ffd23f", 1.4); G.burst(G.cx, G.cy, ["🧀", "🍅", "✨"], 14); } },
    update(G, dt) { G.s.cheese = Math.max(0, G.s.cheese - dt); },
    draw(G, g) { const P = PZ(G), s = G.s; circ(g, P.x, P.y, P.r, "#e8b26a", INK, 5); circ(g, P.x, P.y, P.r * 0.88, "#fff2d6", null);
      g.save(); g.beginPath(); g.arc(P.x, P.y, P.r * 0.86, 0, 7); g.clip(); g.strokeStyle = "#f2483a"; g.lineCap = "round"; g.lineWidth = P.r * 0.13; g.beginPath(); const turns = s.cov * 3.2; for (let a = 0; a < turns * Math.PI * 2; a += 0.1) { const r = (a / (Math.PI * 2 * 3.2)) * P.r * 0.95; g.lineTo(P.x + Math.cos(a) * r, P.y + Math.sin(a) * r); } g.stroke();
      for (const sp of s.splats) circ(g, P.x + sp.x * P.r, P.y + sp.y * P.r, sp.r * P.r, "#f2483a", null); g.restore();
      if (s.cheese > 0) { g.globalAlpha = s.cheese; circ(g, P.x, P.y, P.r * 0.8, "#ffd23f", null); g.globalAlpha = 1; }
      E(g, "🥄", G.down ? G.px + G.u * 4 : P.x + Math.cos(G.t * 2) * P.r * 0.5, G.down ? G.py - G.u * 4 : P.y + Math.sin(G.t * 2) * P.r * 0.5, G.u * 12, G.t);
      bar(g, G.cx - G.u * 25, G.u * 4, G.u * 50, G.u * 5, s.cov, "#f2483a"); txt(g, `🍕 ${s.made} sauced`, G.cx, G.u * 13, G.u * 3.6, INK);
      txt(g, "🌀 Swirl round and round!", G.cx, G.H - G.u * 16, G.u * 4.2, "#fff", { stroke: INK }); },
  },
  {
    id: "grater", name: "Grumpy Cheese Grater", rar: "common", ico: "🧀", unit: "shreds", base: 1, bg: ["#fff8d6", "#ffe08a"],
    blurb: "Grate the cheese! The cheese is NOT happy about it. It will tell you.",
    ups: [["tap", "Turbo Grater", "⚙️"], ["auto", "Cheese Mouse", "🐭"], ["crit", "Fancy Cheese", "🎩"]],
    win: ["That cheese has filed a complaint.", "You made a mountain of cheese. A cheese-tain.", "The cheeses are holding a meeting about you.", "Mice are naming their babies after you.", "You grated a cheese the size of a car. It was very grumpy.", "Cheese avalanche warning!", "The Big Cheese says you're the BIGGER cheese.", "All cheese fears you. Lovingly.", "You have grated the moon. It was cheese after all."],
    init(G) { Object.assign(G.s, { hp: 10, max: 10, lvl: 1, pile: 0, scr: 0, n: 0 }); },
    down(G, x, y) { const s = G.s; s.scr = 1; s.n++; s.hp--; s.pile = Math.min(1, s.pile + 0.012); SFX.scrape(); G.add(1, G.cx, G.cy);
      for (let i = 0; i < 6; i++) G.parts.push({ x: G.cx + rnd(-G.u * 10, G.u * 10), y: G.cy + G.u * 6, vx: rnd(-40, 40), vy: rnd(0, 60), life: 0.9, max: 0.9, c: pick(["#ffd23f", "#f5b52a"]), size: G.u * 0.9, grav: 1 });
      if (s.n % 4 === 1) G.say(pick(["Ow!", "Rude!", "I was gonna be a sandwich!", "Not my good side!", "Hey, I'm sharp cheddar, not dull!", "This is un-brie-lievable!", "Grate. Just grate.", "My lawyer will hear about this!", "I'm feeling shredded.", "Have you no gouda manners?"]), G.cx + G.u * 14, G.cy - G.u * 18 - (s.hp / s.max) * G.u * 10, 1.3);
      if (s.hp <= 0) { s.lvl++; s.max = 10 + s.lvl * 4; s.hp = s.max; G.add(5 + s.lvl, G.cx, G.cy - G.u * 20, { color: "#ffd23f" }); SFX.pop(0.7); G.burst(G.cx, G.cy - G.u * 10, ["🧀", "💨"], 8); G.float("POOF! A BIGGER cheese!", G.cx, G.u * 14, "#ff5a5f", 1.2); } },
    update(G, dt) { G.s.scr = Math.max(0, G.s.scr - dt * 5); },
    autoTick(G) { G.burst(G.cx + rnd(-G.u * 20, G.u * 20), G.H * 0.85, "🐭", 1, { size: 0.6 }); },
    draw(G, g) { const s = G.s, gx = G.cx, gy = G.cy + G.u * 4; const ph = s.pile * G.u * 22; oval(g, G.cx, G.H - G.u * 10, G.u * 38, ph + G.u * 2, "#ffd23f", "#c99a1a");
      g.save(); g.translate(gx, gy); g.rotate(0.08); rr(g, -G.u * 16, -G.u * 2, G.u * 32, G.u * 34, G.u * 4, "#cfd6e2"); for (let r = 0; r < 4; r++) for (let c = 0; c < 4; c++) oval(g, -G.u * 10 + c * G.u * 7, G.u * 4 + r * G.u * 7, G.u * 2, G.u * 1, "#7d8597", null); rr(g, -G.u * 5, -G.u * 9, G.u * 10, G.u * 8, G.u * 3, "#ff5a5f"); g.restore();
      const ch = (G.u * 14 + (s.hp / s.max) * G.u * 12) * (1 + s.lvl * 0.03), cw = G.u * 22 + s.lvl * G.u * 0.5, cy = gy - G.u * 4 - ch / 2 + s.scr * G.u * 3;
      rr(g, gx - cw / 2, cy - ch / 2, cw, ch, G.u * 3, "#ffd23f"); for (const [a, b, r] of [[-0.3, -0.2, 2], [0.25, 0.1, 2.6], [-0.1, 0.3, 1.5]]) circ(g, gx + a * cw, cy + b * ch, G.u * r, "#f5b52a", null);
      face(g, gx, cy, Math.min(cw, ch) * 0.42, s.scr > 0.3 ? "wow" : "grumpy");
      txt(g, `Cheese #${s.lvl}`, G.cx, G.u * 6, G.u * 4, INK); bar(g, G.cx - G.u * 20, G.u * 10, G.u * 40, G.u * 4, s.hp / s.max, "#ffd23f"); },
    hot(G) { return { x: G.cx, y: G.cy - G.u * 10 }; },
  },
  {
    id: "olive", name: "Olive Drop", rar: "common", ico: "🫒", unit: "olives", base: 1, bg: ["#e6f6d6", "#bfe3a8"],
    blurb: "The olive swings, the pizza slides. Tap to drop! Missed olives go to the dog.",
    ups: [["tap", "Olive Oil", "🫙"], ["auto", "Olive Cannon", "💥"], ["mult", "Lucky Olive", "🍀"]],
    win: ["Plop! You're a natural olive dropper.", "The dog is getting a bit chubby from all your misses.", "Olive you SO much!", "Your aim is so good, olives land on pizzas you can't even see.", "Olive trees bow when you walk by.", "You have dropped more olives than there are olives.", "The Olive Olympics gave you a gold olive.", "Olive-ing the dream.", "Olives rain from the sky in your honour."],
    init(G) { Object.assign(G.s, { drop: null, on: [], wait: 0, misses: 0, done: 0, dogT: 0 }); },
    ox(G) { return G.cx + Math.sin(G.t * 1.9) * G.W * 0.36; },
    pzx(G) { return G.cx + Math.sin(G.t * 0.8 + 1) * G.W * 0.24; },
    down(G) { const s = G.s; if (s.drop || s.wait > 0) return; s.drop = { x: this.ox(G), y: G.u * 22, vy: 0 }; SFX.whoosh(); },
    update(G, dt) { const s = G.s; s.wait = Math.max(0, s.wait - dt); s.dogT = Math.max(0, s.dogT - dt); const py = G.H * 0.72, pr = Math.min(G.W * 0.17, G.u * 18);
      if (s.drop) { const d = s.drop; d.vy += G.H * 2.2 * dt; d.y += d.vy * dt; if (d.y >= py - G.u * 3 && !d.miss) { const px = this.pzx(G); const off = Math.abs(d.x - px);
        if (off < pr * 0.95) { const bull = off < pr * 0.3; s.on.push((d.x - px) / pr); G.add(bull ? 4 : 2, d.x, d.y, { color: bull ? "#ffd23f" : "#fff" }); if (bull) G.float("BULLSEYE!", d.x, d.y - G.u * 10, "#ffd23f", 1.2); SFX.pop(bull ? 1.3 : 1); s.drop = null; s.wait = 0.25;
          if (s.on.length >= 10) { s.on = []; s.done++; G.add(12, px, py, { color: "#ffd23f" }); SFX.win(); G.burst(px, py, ["🫒", "🎉"], 12); G.float("OLIVE PIZZA DONE!", G.cx, G.u * 14, "#4dbb5a", 1.3); } }
        else { d.miss = true; d.vx = (d.x < G.cx ? -1 : 1) * G.u * 30; SFX.boing(); } }
        if (d.miss) { d.x += d.vx * dt; if (d.y > G.H * 0.9) { s.drop = null; s.wait = 0.25; s.dogT = 1.2; SFX.giggle(); G.say(pick(["Woof! Thanks!", "Yum! Olive!", "Best day ever!"]), G.W * 0.12, G.H * 0.8, 1); } } } },
    autoTick(G) { const px = this.pzx(G); if (G.s.on.length < 9) G.s.on.push(rnd(-0.6, 0.6)); G.dots(px, G.H * 0.72, ["#3b3346"], 4); },
    draw(G, g) { const s = G.s, ox = this.ox(G), px = this.pzx(G), py = G.H * 0.72, pr = Math.min(G.W * 0.17, G.u * 18);
      g.strokeStyle = INK; g.lineWidth = 3; g.beginPath(); g.moveTo(G.cx, 0); g.lineTo(ox, G.u * 18); g.stroke();
      if (!s.drop && s.wait <= 0) { circ(g, ox, G.u * 22, G.u * 4.5, "#3b3346"); circ(g, ox, G.u * 22, G.u * 1.6, "#ff5a5f", null); }
      g.save(); g.translate(px, py); g.scale(1, 0.45); pizza(g, 0, 0, pr, { peps: 3 }); g.restore(); for (const o of s.on) circ(g, px + o * pr, py, G.u * 2.4, "#3b3346");
      if (s.drop) { circ(g, s.drop.x, s.drop.y, G.u * 4.5, "#3b3346"); circ(g, s.drop.x, s.drop.y, G.u * 1.6, "#ff5a5f", null); }
      E(g, s.dogT > 0 ? "🐶" : "🐕", G.W * 0.12, G.H * 0.88, G.u * 14); txt(g, `🫒 ${s.on.length}/10 on this pizza · ${s.done} done`, G.cx, G.u * 5, G.u * 3.6, INK); },
  },
  {
    id: "calzone", name: "Burp the Calzone", rar: "common", ico: "🥟", unit: "puffs", base: 1, bg: ["#ffeedd", "#ffd0b0"],
    blurb: "Tap to puff the calzone up bigger and bigger until… BUUURP! Excuse me!",
    ups: [["tap", "Bicycle Pump", "🚲"], ["auto", "Fizzy Water", "🫧"], ["crit", "Mega Burp", "📢"]],
    win: ["That was a very polite burp.", "The neighbours felt that burp.", "A burp so big it set off car alarms.", "Your calzone burped the national anthem.", "Burp scientists are studying your calzone.", "The burp has its own weather now.", "Grandma says 'say excuse me'. The calzone said it LOUDLY.", "A burp heard round the world!", "You are the Burp Master. Bow!"],
    init(G) { Object.assign(G.s, { size: 1, need: rnd(1.7, 2.2), sq: 0, burps: 0, cloud: 0 }); },
    down(G) { const s = G.s; s.size += 0.07; s.sq = 1; G.add(1, G.cx, G.cy - G.u * 10 * s.size); G.tone(180 + s.size * 160, 0.12, { type: "sine", vol: 0.14, slideTo: 260 + s.size * 200 });
      if (s.size >= s.need) { const big = Math.round(s.size * 4); s.size = 1; s.need = rnd(1.7, 2.3); s.burps++; s.cloud = 1.4; SFX.burp(); G.shake(3); G.add(big, G.cx, G.cy, { color: "#ffd23f" }); G.float("BUUUURP!", G.cx, G.u * 16, "#9a6bff", 1.8); G.burst(G.cx, G.cy - G.u * 6, ["💨", "☁️"], 10, { speed: 1.4 }); G.say(pick(["Excuse me!", "Pardon me!", "Oops, that was the cheese.", "Better out than in!", "That one tasted like oregano."]), G.cx, G.cy - G.u * 22, 1.6); } },
    update(G, dt) { const s = G.s; s.sq = Math.max(0, s.sq - dt * 5); s.size = Math.max(1, s.size - dt * 0.05); s.cloud = Math.max(0, s.cloud - dt); },
    draw(G, g) { const s = G.s, r = G.u * 20 * s.size, w = 1 + s.sq * 0.12, h = 1 - s.sq * 0.1, y = G.cy + G.u * 14;
      g.save(); g.translate(G.cx, y); g.scale(w + Math.sin(G.t * 20) * 0.02 * (s.size - 1), h); g.beginPath(); g.arc(0, 0, r, Math.PI, 0); g.closePath(); g.fillStyle = "#e8b26a"; g.fill(); g.strokeStyle = INK; g.lineWidth = 5; g.stroke(); for (let i = 0; i < 9; i++) { const a = Math.PI + (i / 8) * Math.PI; circ(g, Math.cos(a) * r, Math.sin(a) * r * 0.02 - 2, G.u * 1.6, "#c9894a", INK, 2); } g.restore();
      face(g, G.cx, y - r * 0.42, r * 0.4, s.size > s.need - 0.25 ? "wow" : "happy");
      if (s.cloud > 0) { g.globalAlpha = Math.min(1, s.cloud); E(g, "💨", G.cx + G.u * 22, y - r * 0.4, G.u * 22 * (2 - s.cloud)); g.globalAlpha = 1; }
      bar(g, G.cx - G.u * 22, G.u * 5, G.u * 44, G.u * 5, (s.size - 1) / (s.need - 1), "#9a6bff"); txt(g, `Burps: ${s.burps}`, G.cx, G.u * 14, G.u * 3.8, INK); },
    hot(G) { return { x: G.cx, y: G.cy + G.u * 6 }; },
  },

  // ------------------------------------------------------------------------
  //  UNCOMMON
  // ------------------------------------------------------------------------
  {
    id: "meatball", name: "Grandma's Meatball Bonk", rar: "uncommon", ico: "🧆", unit: "bonks", base: 1, bg: ["#fff1e6", "#f7c9a8"],
    blurb: "Meatballs pop out of Grandma's pots. BONK them with the spoon! (Not the cat.)",
    ups: [["tap", "Wooden Spoon", "🥄"], ["auto", "Grandpa Joins In", "👴"], ["crit", "Golden Meatballs", "✨"]],
    win: ["Mamma mia! Grandma is proud!", "Grandma pinched your cheeks. Twice.", "The meatballs are scared of your spoon.", "Grandma says you can have extra dessert.", "BONK! The whole family is cheering!", "Grandma made you a medal out of pasta.", "Grandpa woke up just to watch you.", "The meatballs have surrendered. Grandma wins!", "You are now Grandma's favourite. Don't tell the cousins."],
    init(G) { G.s.pots = Array.from({ length: 6 }, () => ({ st: "idle", t: 0, k: "m" })); G.s.spawn = 0.3; G.s.streak = 0; G.s.spoon = null; Object.assign(G.s.pots[1], { st: "up", t: 2, k: "m" }); },
    potPos(G, i) { const c = i % 3, r = Math.floor(i / 3), w = Math.min(G.W * 0.27, G.u * 30); return { x: G.cx + (c - 1) * w, y: G.H * 0.42 + r * G.u * 26, w: w * 0.8 }; },
    down(G, x, y) { const s = G.s; for (let i = 0; i < 6; i++) { const p = s.pots[i]; if (p.st !== "up") continue; const q = this.potPos(G, i); if (Math.abs(x - q.x) < q.w * 0.6 && y > q.y - G.u * 22 && y < q.y + G.u * 6) {
        s.spoon = { x: q.x, y: q.y - G.u * 10, t: 0.25 };
        if (p.k === "c") { p.st = "idle"; s.streak = 0; SFX.meow(); G.say(pick(["MEOW?!", "Not the cat!", "Mrrrow! Rude!"]), q.x, q.y - G.u * 18, 1.2); return; }
        p.st = "bonk"; p.t = 0.4; s.streak++; G.add(p.k === "g" ? 6 : 1, q.x, q.y - G.u * 12, { color: p.k === "g" ? "#ffd23f" : "#fff" }); SFX.bonk(); G.burst(q.x, q.y - G.u * 12, "💫", 3, { size: 0.7 }); G.shake(0.6);
        if (s.streak % 6 === 0) G.say(pick(["Mangia!", "Bellissimo!", "That's my grandchild!", "BONK BONK BONK!"]), G.u * 16, G.H - G.u * 30, 1.4); return; } }
      s.streak = 0; SFX.boop(); },
    update(G, dt) { const s = G.s; s.spawn -= dt; if (s.spoon && (s.spoon.t -= dt) <= 0) s.spoon = null;
      if (s.spawn <= 0) { s.spawn = rnd(0.35, 0.8); const idle = s.pots.map((p, i) => i).filter((i) => s.pots[i].st === "idle"); if (idle.length) { const p = s.pots[pick(idle)]; p.st = "up"; p.t = rnd(1.0, 1.5); const r = Math.random(); p.k = r < 0.07 ? "g" : r < 0.17 ? "c" : "m"; } }
      for (const p of s.pots) if (p.st !== "idle") { p.t -= dt; if (p.t <= 0) p.st = "idle"; } },
    autoTick(G) { const p = G.s.pots.find((p) => p.st === "up" && p.k === "m"); if (p) { p.st = "bonk"; p.t = 0.3; } },
    draw(G, g) { const s = G.s; E(g, "👵", G.u * 14, G.H - G.u * 14, G.u * 22);
      for (let i = 0; i < 6; i++) { const q = this.potPos(G, i), p = s.pots[i];
        if (p.st === "up" || p.st === "bonk") { const k = p.st === "bonk" ? 0.4 : Math.min(1, (1.5 - Math.max(0, p.t - 0)) * 4); const by = q.y - G.u * 8 - Math.min(1, k) * G.u * 6, r = q.w * 0.3;
          if (p.k === "c") E(g, "🐱", q.x, by - G.u * 2, r * 2.6); else { oval(g, q.x, by, r, p.st === "bonk" ? r * 0.55 : r, p.k === "g" ? "#ffcf3a" : "#9a4a32"); for (let j = 0; j < 4; j++) circ(g, q.x + Math.cos(j * 1.7) * r * 0.5, by + Math.sin(j * 1.7) * r * 0.4, r * 0.08, "#5aa648", null); face(g, q.x, by, r * 0.7, p.st === "bonk" ? "dizzy" : "happy", { blush: false }); } }
        rr(g, q.x - q.w / 2, q.y - G.u * 6, q.w, G.u * 14, G.u * 4, "#c0c6d2"); rr(g, q.x - q.w / 2 - G.u * 2, q.y - G.u * 8, q.w + G.u * 4, G.u * 4, G.u * 2, "#9aa2b4"); }
      if (s.spoon) E(g, "🥄", s.spoon.x + G.u * 6, s.spoon.y - G.u * 4, G.u * 16, -0.8 + s.spoon.t * 3);
      txt(g, s.streak > 1 ? `🔥 ${s.streak} bonks in a row` : "Bonk the meatballs! Not the cat!", G.cx, G.u * 8, G.u * 4, "#fff", { stroke: INK }); },
    hot(G) { const i = G.s.pots.findIndex((p) => p.st === "up" && p.k !== "c"); return i >= 0 ? { x: this.potPos(G, i).x, y: this.potPos(G, i).y - G.u * 10 } : { x: G.cx, y: G.cy }; },
  },
  {
    id: "pineapple", name: "Pineapple Argument", rar: "uncommon", ico: "🍍", unit: "arguments", base: 1, bg: ["#fff7c2", "#ffd7e5"],
    blurb: "Does pineapple go on pizza? Tap a side to argue! Close debates are worth the most.",
    ups: [["tap", "Louder Voice", "📣"], ["auto", "Debate Club", "🎓"], ["mult", "Spicy Opinions", "🌶️"]],
    win: ["The argument has begun. It will never end.", "Families are arguing about it at dinner now.", "The news is calling it 'The Great Pineapple Debate'.", "Pineapples have hired a lawyer.", "Pizza purists are holding signs that say NO.", "The debate is so loud the fish are taking sides.", "It went to the Supreme Pizza Court. Still undecided.", "Aliens arrived to settle it. Now THEY are arguing.", "The answer is… we'll never know. And that's beautiful."],
    init(G) { Object.assign(G.s, { p: 0, drift: 0, dT: 0, winsP: 0, winsN: 0, bounce: [0, 0], flip: 0 }); },
    down(G, x, y) { const s = G.s, left = x < G.cx, heat = 1 + (1 - Math.abs(s.p)) * 1.6; s.p = clamp(s.p + (left ? 0.11 : -0.11), -1, 1); s.bounce[left ? 0 : 1] = 1;
      const PRO = ["Pineapple is sweet AND juicy!", "It's a fruit party!", "Sweet and salty is the best!", "I'm basically sunshine!", "Ham loves me!", "I have a crown. I'm royalty!"], CON = ["Fruit? On PIZZA?!", "My grandma would faint!", "Pizza is not a fruit salad!", "Next you'll want gummy bears on it!", "Absolutely NOT!", "This is a pizza, not a smoothie!"];
      G.say(pick(left ? PRO : CON), left ? G.W * 0.27 : G.W * 0.73, G.H * 0.4, 1.4); G.add(heat, left ? G.W * 0.27 : G.W * 0.73, G.H * 0.55); G.tone(left ? 520 : 300, 0.1, { type: "square", vol: 0.07, slideTo: left ? 700 : 220 });
      if (Math.abs(s.p) >= 1) { const pw = s.p > 0; pw ? s.winsP++ : s.winsN++; s.p = 0; s.flip = 1.5; SFX.win(); G.add(8, G.cx, G.cy, { color: "#ffd23f" }); G.float(pw ? "🍍 PINEAPPLE WINS! (for now)" : "🍕 NO-PINEAPPLE WINS! (for now)", G.cx, G.u * 22, "#ff5a5f", 1.1); G.burst(G.cx, G.cy, pw ? ["🍍", "🎉"] : ["🍕", "🎉"], 12); } },
    update(G, dt) { const s = G.s; s.dT -= dt; if (s.dT <= 0) { s.dT = rnd(1.5, 3); s.drift = rnd(-0.12, 0.12); } s.p = clamp(s.p + s.drift * dt, -0.99, 0.99); s.bounce = s.bounce.map((b) => Math.max(0, b - dt * 4)); s.flip = Math.max(0, s.flip - dt); },
    draw(G, g) { const s = G.s, y = G.H * 0.66, r = Math.min(G.W * 0.16, G.u * 18);
      const px = G.W * 0.27, py = y - s.bounce[0] * G.u * 4; oval(g, px, py, r * 0.8, r, "#ffc93c"); g.strokeStyle = "#d08a12"; g.lineWidth = 2; for (let i = -3; i <= 3; i++) { g.beginPath(); g.moveTo(px + i * r * 0.25 - r * 0.5, py - r); g.lineTo(px + i * r * 0.25 + r * 0.5, py + r); g.stroke(); }
      for (let i = -2; i <= 2; i++) oval(g, px + i * r * 0.15, py - r * 1.2, r * 0.12, r * 0.45, "#4dbb5a", INK, 3, i * 0.35); face(g, px, py, r * 0.6, s.p < -0.5 ? "angry" : "happy");
      const qx = G.W * 0.73, qy = y - s.bounce[1] * G.u * 4; slice(g, qx, qy + r * 0.8, r * 2.1); face(g, qx, qy - r * 0.15, r * 0.45, s.p > 0.5 ? "angry" : "grumpy"); circ(g, qx + r * 0.17, qy - r * 0.2, r * 0.13, null, INK, 3);
      bar(g, G.cx - G.u * 30, G.u * 5, G.u * 60, G.u * 6, 0, "#fff"); circ(g, G.cx - s.p * G.u * 28, G.u * 8, G.u * 4, s.p > 0 ? "#ffc93c" : "#ff5a5f"); E(g, "🍍", G.cx - G.u * 36, G.u * 8, G.u * 7); E(g, "🙅", G.cx + G.u * 36, G.u * 8, G.u * 7);
      const heat = 1 + (1 - Math.abs(s.p)) * 1.6; txt(g, `🔥 Debate heat ×${heat.toFixed(1)}`, G.cx, G.u * 17, G.u * 3.8, INK); txt(g, `🍍 ${s.winsP}  –  ${s.winsN} 🍕`, G.cx, G.H - G.u * 16, G.u * 4, "#fff", { stroke: INK });
      if (s.flip > 0) E(g, "🪑", G.cx, G.cy - G.u * 4, G.u * 14, s.flip * 6); },
    hot(G) { return { x: G.W * 0.25, y: G.H * 0.6 }; },
  },
  {
    id: "anchovy", name: "Angry Anchovy", rar: "uncommon", ico: "🐟", unit: "boops", base: 1, bg: ["#d6f1ff", "#9fd6ff"],
    blurb: "A very salty little fish. Boop it and it gets ANGRIER. Boop it ten times and… KABOOM (of love).",
    ups: [["tap", "Fish Tickler", "🪶"], ["auto", "Cat Helper", "🐈"], ["crit", "Extra Salty", "🧂"]],
    win: ["The anchovy is mildly annoyed.", "The anchovy wrote you an angry letter. It's all bubbles.", "Anchovies everywhere know your name. They are FURIOUS.", "The anchovy has been to anger management. It didn't help.", "The anchovy is so mad it turned into a sardine.", "The anchovy secretly likes you now.", "The anchovy made you a friendship bracelet. It's made of seaweed.", "Best frenemies forever!", "The anchovy says: 'Fine. You win. Want a hug?'"],
    init(G) { Object.assign(G.s, { x: 0.5, y: 0.5, tx: 0.5, ty: 0.5, anger: 0, hop: 0, booms: 0, face: 1 }); },
    size(G) { return G.u * (10 + G.s.anger * 1.2); },
    down(G, x, y) { const s = G.s, fx = s.x * G.W, fy = s.y * G.H;
      if (dist(x, y, fx, fy) < this.size(G) * 1.4) { s.anger++; G.add(1 + s.anger, fx, fy); G.shake(0.5 + s.anger * 0.15); SFX.squeak(); G.tone(200 + s.anger * 40, 0.15, { type: "sawtooth", vol: 0.06 }); s.tx = rnd(0.15, 0.85); s.ty = rnd(0.25, 0.8); s.hop = 1;
        G.say(pick(["HEY!", "STOP THAT!", "I'M A FISH!", "Do you KNOW who I am?!", "Grrr-blub!", "That tickles! I mean… GRR!", "I'm SO salty right now!"]), fx, fy - this.size(G), 1);
        if (s.anger >= 10) { s.anger = 0; s.booms++; SFX.boom(); G.flash("#ffd6ef"); G.shake(3); G.burst(fx, fy, ["🎉", "💖", "🐟", "✨"], 26, { speed: 1.5 }); G.add(25, fx, fy, { color: "#ffd23f" }); G.say(pick(["Sorry… I'm just a little salty.", "OK fine. We're friends now.", "I feel much better! Thanks!"]), G.cx, G.cy - G.u * 10, 2); } }
      else { SFX.boop(); if (Math.random() < 0.4) G.say(pick(["Ha! Missed me!", "Too slow!", "Blub blub ha ha!"]), fx, fy - this.size(G), 0.8); } },
    update(G, dt) { const s = G.s, sp = 0.6 + s.anger * 0.25; s.x += (s.tx - s.x) * Math.min(1, dt * sp); s.y += (s.ty - s.y) * Math.min(1, dt * sp); s.hop = Math.max(0, s.hop - dt * 2); if (Math.hypot(s.tx - s.x, s.ty - s.y) < 0.02) { s.tx = rnd(0.15, 0.85); s.ty = rnd(0.25, 0.8); } s.face = s.tx > s.x ? 1 : -1; },
    autoTick(G) { G.burst(G.s.x * G.W, G.s.y * G.H, "💢", 1, { size: 0.6 }); },
    draw(G, g) { const s = G.s, x = s.x * G.W, y = s.y * G.H - Math.sin(s.hop * Math.PI) * G.u * 6, r = this.size(G), a = s.anger / 10;
      for (let i = 0; i < 6; i++) circ(g, (i * 173 + G.t * 20) % G.W, G.H - ((G.t * 40 + i * 90) % G.H), G.u * (1 + (i % 3)), "rgba(255,255,255,.5)", "rgba(255,255,255,.8)", 2);
      E(g, "🌿", G.u * 10, G.H - G.u * 10, G.u * 18); E(g, "🪸", G.W - G.u * 12, G.H - G.u * 9, G.u * 16);
      g.save(); g.translate(x, y); g.scale(s.face, 1); g.rotate(Math.sin(G.t * 10) * 0.08 * (1 + a * 2));
      g.beginPath(); g.moveTo(-r * 1.0, 0); g.lineTo(-r * 1.6, -r * 0.6); g.lineTo(-r * 1.6, r * 0.6); g.closePath(); g.fillStyle = `rgb(${120 + a * 135},${150 - a * 80},${190 - a * 120})`; g.fill(); g.strokeStyle = INK; g.lineWidth = 3; g.stroke();
      oval(g, 0, 0, r * 1.2, r * 0.62, `rgb(${140 + a * 115},${170 - a * 90},${205 - a * 130})`); oval(g, r * 0.1, r * 0.2, r * 0.8, r * 0.25, "rgba(255,255,255,.4)", null); g.restore();
      face(g, x + s.face * r * 0.45, y - r * 0.1, r * 0.42, s.anger > 2 ? "angry" : "grumpy", { blush: s.anger < 3 });
      if (s.anger > 5) for (let i = 0; i < 2; i++) E(g, "💨", x + (i ? 1 : -1) * r * 0.6, y - r * 0.9 - Math.sin(G.t * 8 + i) * G.u * 2, G.u * 6);
      bar(g, G.cx - G.u * 25, G.u * 5, G.u * 50, G.u * 5, s.anger / 10, "#ff5a5f"); txt(g, `😡 Anger ${s.anger}/10 · 💥 ${s.booms}`, G.cx, G.u * 14, G.u * 3.8, INK); },
    hot(G) { return { x: G.s.x * G.W, y: G.s.y * G.H }; },
  },
  {
    id: "cutter", name: "Slice-o-Matic", rar: "uncommon", ico: "🍽️", unit: "slices", base: 1, bg: ["#ffe4e1", "#ffc9b5"],
    blurb: "Swipe across the pizza to slice it (or just tap). Eight slices and it's served!",
    ups: [["tap", "Sharper Wheel", "⚙️"], ["auto", "Robot Arm", "🦾"], ["mult", "Party Size", "🎉"]],
    win: ["Slice slice baby!", "Every slice is perfectly equal. Mathematicians are weeping.", "You sliced a pizza into 1,000 pieces. Everyone got a crumb.", "The pizza cutter is your best friend now.", "Slicing so fast the cutter is on fire. Kind of.", "You cut a pizza the size of a trampoline!", "Your slices are in a museum.", "The pizza cutter has retired. You ARE the pizza cutter.", "Legend of the Slice!"],
    init(G) { Object.assign(G.s, { cuts: [], start: null, serve: 0, served: 0, wheel: null }); },
    cut(G, ang) { const s = G.s; if (s.serve > 0) return; ang = ((ang % Math.PI) + Math.PI) % Math.PI; if (s.cuts.some((c) => Math.abs(c - ang) < 0.2 || Math.abs(c - ang) > Math.PI - 0.2)) ang = (s.cuts[s.cuts.length - 1] + Math.PI / 4) % Math.PI; s.cuts.push(ang); s.wheel = { a: ang, t: 0.35 };
      G.add(s.cuts.length, G.cx, G.cy - G.u * 4); SFX.scrape(); SFX.whoosh(); if (s.cuts.length >= 4) { s.serve = 1.3; s.served++; SFX.win(); G.add(10, G.cx, G.cy, { color: "#ffd23f" }); G.float("8 SLICES! SERVED!", G.cx, G.u * 14, "#ffd23f", 1.3); } },
    down(G, x, y) { G.s.start = { x, y }; },
    up(G, x, y) { const s = G.s; if (!s.start) return; const dx = x - s.start.x, dy = y - s.start.y; if (Math.hypot(dx, dy) > G.u * 15) this.cut(G, Math.atan2(dy, dx)); else this.cut(G, s.cuts.length ? s.cuts[0] + (s.cuts.length * Math.PI) / 4 : rnd(0, Math.PI)); s.start = null; },
    update(G, dt) { const s = G.s; if (s.wheel && (s.wheel.t -= dt) <= 0) s.wheel = null; if (s.serve > 0) { s.serve -= dt; if (s.serve <= 0) s.cuts = []; } },
    draw(G, g) { const P = PZ(G), s = G.s; for (let i = 0; i < 5; i++) E(g, "😋", G.W * (0.1 + i * 0.2), G.u * 6 + Math.sin(G.t * 3 + i) * G.u, G.u * 9);
      if (s.serve > 0) { const k = 1 - s.serve / 1.3; for (let i = 0; i < 8; i++) { const a = (i / 8) * Math.PI * 2; slice(g, P.x + Math.cos(a) * P.r * k * 1.5, P.y - k * P.r * 1.2 + Math.sin(a) * P.r * k, P.r * 0.6, { rot: a + Math.PI / 2 }); } return; }
      pizza(g, P.x, P.y, P.r); g.strokeStyle = "#fff8e8"; g.lineWidth = G.u * 1.2; for (const c of s.cuts) { g.beginPath(); g.moveTo(P.x - Math.cos(c) * P.r, P.y - Math.sin(c) * P.r); g.lineTo(P.x + Math.cos(c) * P.r, P.y + Math.sin(c) * P.r); g.stroke(); }
      if (s.wheel) { const k = 1 - s.wheel.t / 0.35, a = s.wheel.a; E(g, "⚙️", P.x + Math.cos(a) * P.r * (k * 2 - 1), P.y + Math.sin(a) * P.r * (k * 2 - 1), G.u * 12, k * 12); }
      if (G.down && s.start) { g.strokeStyle = "rgba(255,255,255,.8)"; g.lineWidth = 4; g.setLineDash([8, 8]); g.beginPath(); g.moveTo(s.start.x, s.start.y); g.lineTo(G.px, G.py); g.stroke(); g.setLineDash([]); }
      txt(g, `${s.cuts.length * 2 || 1} slice${s.cuts.length ? "s" : ""} · 🍕 ${s.served} served`, G.cx, G.H - G.u * 16, G.u * 4.2, "#fff", { stroke: INK }); },
  },
  {
    id: "hotsauce", name: "Too Much Hot Sauce", rar: "uncommon", ico: "🌶️", unit: "drips", base: 1, bg: ["#fff0e0", "#ffb38a"],
    blurb: "Shake on more hot sauce for more points… but too much and Henry breathes FIRE! Milk helps.",
    ups: [["tap", "Extra Drippy", "💧"], ["auto", "Spicy Cousin", "🥵"], ["crit", "Ghost Pepper", "👻"]],
    win: ["Henry says it's 'a little warm'.", "Henry's ears are whistling like a kettle.", "Henry can now see through time. Spicy time.", "The fire department knows Henry by name.", "Henry's eyebrows flew away. They'll be back.", "Henry is now officially a dragon.", "Hot sauce companies want to sponsor Henry.", "Henry drank 400 glasses of milk. The cows are tired.", "Henry is the spiciest person in the universe. He's very proud."],
    init(G) { Object.assign(G.s, { spice: 0, fire: 0, shake: 0, fires: 0 }); },
    bottle(G) { return { x: G.W * 0.78, y: G.H * 0.36 }; }, milk(G) { return { x: G.W * 0.18, y: G.H * 0.78 }; },
    down(G, x, y) { const s = G.s, m = this.milk(G); if (s.fire > 0) return;
      if (dist(x, y, m.x, m.y) < G.u * 11) { s.spice = Math.max(0, s.spice - 40); SFX.slurp(); G.say("Ahhh… milk. 🥛", G.cx, G.H * 0.3, 1.2); G.burst(m.x, m.y, "🥛", 3, { size: 0.7 }); return; }
      s.spice += 7; s.shake = 1; const b = this.bottle(G); G.add(1 + s.spice / 30, b.x, b.y); G.tone(900, 0.05, { type: "sine", vol: 0.05 }); for (let i = 0; i < 3; i++) G.parts.push({ x: b.x - G.u * 6, y: b.y + G.u * 8, vx: rnd(-200, -80), vy: rnd(-40, 60), life: 0.7, max: 0.7, c: "#e5261e", size: G.u * 1.3, grav: 1 });
      if (s.spice > 60 && Math.random() < 0.3) G.say(pick(["It's fine. It's FINE.", "Is it hot in here?", "My tongue is dancing!", "Yummy! (help)"]), G.cx, G.H * 0.3, 1);
      if (s.spice >= 100) { s.spice = 0; s.fire = 1.4; s.fires++; SFX.boom(); G.flash("#ffb04a", 0.4); G.shake(3); G.add(15, G.cx, G.cy, { color: "#ffd23f" }); G.float("🔥 AAAAH! SPICY! 🔥", G.cx, G.u * 16, "#ff5a5f", 1.5); } },
    update(G, dt) { const s = G.s; s.shake = Math.max(0, s.shake - dt * 5); s.spice = Math.max(0, s.spice - dt * 3); if (s.fire > 0) { s.fire -= dt; if (Math.random() < 0.7) G.parts.push({ x: G.cx, y: G.H * 0.5, vx: rnd(-60, 60) + (G.u * 50), vy: rnd(-60, 30), life: 0.8, max: 0.8, e: "🔥", size: G.u * rnd(5, 9), rot: 0, vr: 2, grav: -0.2 }); } },
    draw(G, g) { const s = G.s, a = Math.min(1, s.spice / 100), r = Math.min(G.u * 22, G.W * 0.2), x = G.cx - G.u * 6, y = G.H * 0.5;
      circ(g, x, y, r, `rgb(255,${220 - a * 150},${190 - a * 160})`); face(g, x, y, r * 0.75, s.fire > 0 ? "wow" : a > 0.6 ? "dizzy" : "happy");
      E(g, "👨‍🍳", x, y - r * 1.05, r * 1.0); if (a > 0.4) E(g, "💦", x + r * 0.8, y - r * 0.5, G.u * 7); if (a > 0.6) for (const sd of [-1, 1]) E(g, "♨️", x + sd * r * 1.1, y - r * 0.2 - Math.sin(G.t * 9) * G.u * 2, G.u * 8);
      slice(g, x + r * 0.2, y + r * 1.5, r * 0.8, { rot: 0.4 });
      const b = this.bottle(G); g.save(); g.translate(b.x, b.y); g.rotate(-1.9 + Math.sin(G.t * 30) * 0.2 * s.shake); rr(g, -G.u * 6, -G.u * 12, G.u * 12, G.u * 22, G.u * 4, "#e5261e"); rr(g, -G.u * 3, -G.u * 18, G.u * 6, G.u * 7, G.u * 2, "#3b3346"); rr(g, -G.u * 4.5, -G.u * 5, G.u * 9, G.u * 8, G.u * 2, "#fff4dc", INK, 2); g.restore(); E(g, "🌶️", b.x, b.y, G.u * 6);
      const m = this.milk(G); E(g, "🥛", m.x, m.y, G.u * 16); txt(g, "milk!", m.x, m.y + G.u * 11, G.u * 3.2, "#fff", { stroke: INK });
      bar(g, G.cx - G.u * 25, G.u * 5, G.u * 50, G.u * 5, a, a > 0.8 ? "#ff3d2e" : "#ff9a3c"); txt(g, `🌶️ Spice ${Math.round(s.spice)}% · ×${(1 + s.spice / 30).toFixed(1)} · 🔥 ${s.fires}`, G.cx, G.u * 14, G.u * 3.6, INK); },
    hot(G) { return this.bottle(G); },
  },
  {
    id: "garlic", name: "Garlic Knot Untangle", rar: "uncommon", ico: "🧄", unit: "knots", base: 1, bg: ["#f6f0ff", "#e2d3ff"],
    blurb: "The garlic knot is all tangled! Tap the dots in order: 1, 2, 3… The vampire hates it.",
    ups: [["tap", "Nimble Fingers", "🤌"], ["auto", "Knot Expert", "🧶"], ["crit", "Extra Garlicky", "🧄"]],
    win: ["One knot down. A billion to go!", "The vampire moved to another town.", "Your fingers are basically garlic ninjas.", "You untangled a knot so tricky even the knot was confused.", "Garlic breath detected for 3 miles!", "Vampires have put up 'WANTED' posters of you.", "Knot a problem!", "You could untangle headphones in your sleep.", "The Garlic Knot Council crowns you Supreme Untangler."],
    init(G) { G.s.round = 0; this.newRound(G); },
    newRound(G) { const s = G.s, n = 4 + Math.min(4, s.round); s.dots = []; for (let i = 0; i < n; i++) { let p, k = 0; do { p = { x: rnd(0.15, 0.85), y: rnd(0.25, 0.8) }; k++; } while (k < 40 && s.dots.some((d) => Math.hypot(d.x - p.x, (d.y - p.y) * 0.7) < 0.16)); s.dots.push({ ...p, n: i + 1, ok: false }); }
      s.knot = [...s.dots].sort(() => Math.random() - 0.5); s.next = 1; s.done = 0; s.vamp = 0; },
    down(G, x, y) { const s = G.s; if (s.done > 0) return; const d = s.dots.find((d) => !d.ok && dist(x, y, d.x * G.W, d.y * G.H) < G.u * 8);
      if (!d) { SFX.boop(); return; } if (d.n !== s.next) { G.shake(0.8); SFX.error(); G.say("That's a knot! Find " + s.next, d.x * G.W, d.y * G.H - G.u * 6, 0.9); return; }
      d.ok = true; s.next++; G.add(d.n, d.x * G.W, d.y * G.H); SFX.note(d.n * 2); G.dots(d.x * G.W, d.y * G.H, ["#fff4c2", "#c9a26b"], 8);
      if (s.next > s.dots.length) { s.done = 1.6; s.round++; s.vamp = 1.6; G.add(s.dots.length * 2, G.cx, G.cy, { color: "#ffd23f" }); SFX.win(); G.float("UNTANGLED! Ahh, much better.", G.cx, G.u * 14, "#9a6bff", 1.2); G.say("EEK! GARLIC!", G.W * 0.85, G.H * 0.2, 1.5); } },
    update(G, dt) { const s = G.s; s.vamp = Math.max(0, s.vamp - dt); if (s.done > 0) { s.done -= dt; if (s.done <= 0) this.newRound(G); } },
    draw(G, g) { const s = G.s;
      if (s.done > 0) { g.save(); g.translate(G.cx, G.cy); g.rotate(Math.sin(G.t * 3) * 0.1); rr(g, -G.W * 0.35, -G.u * 5, G.W * 0.7, G.u * 10, G.u * 5, "#e8b26a"); for (let i = 0; i < 8; i++) circ(g, -G.W * 0.3 + i * G.W * 0.085, 0, G.u * 1, "#fff8e0", null); g.restore(); face(g, G.cx, G.cy, G.u * 4, "joy", { blush: false }); }
      else { g.lineCap = "round"; g.lineJoin = "round"; const path = () => { g.beginPath(); s.knot.forEach((d, i) => { const x = d.x * G.W, y = d.y * G.H; if (!i) g.moveTo(x, y); else { const p = s.knot[i - 1]; g.bezierCurveTo(p.x * G.W + G.u * 25 * Math.sin(i * 2), p.y * G.H - G.u * 20, x - G.u * 20 * Math.cos(i * 3), y + G.u * 25, x, y); } }); };
        path(); g.strokeStyle = INK; g.lineWidth = G.u * 6; g.stroke(); path(); g.strokeStyle = "#e8b26a"; g.lineWidth = G.u * 4.4; g.stroke();
        for (const d of s.dots) { const x = d.x * G.W, y = d.y * G.H, nxt = d.n === s.next; circ(g, x, y, G.u * (nxt ? 6.5 + Math.sin(G.t * 8) * 0.6 : 5.5), d.ok ? "#4dbb5a" : nxt ? "#ffd23f" : "#fff"); txt(g, d.ok ? "✓" : String(d.n), x, y + 1, G.u * 5, d.ok ? "#fff" : INK); } }
      E(g, "🧛", G.W * 0.85 + (1.6 - s.vamp) * (s.vamp > 0 ? G.W * 0.4 : 0), G.H * 0.12, G.u * 14); E(g, "🧄", G.u * 10, G.H - G.u * 10, G.u * 14, Math.sin(G.t * 2) * 0.2);
      txt(g, s.done > 0 ? "" : `Tap number ${s.next}!`, G.cx, G.u * 7, G.u * 4.5, "#fff", { stroke: INK }); },
    hot(G) { const d = G.s.dots && G.s.dots.find((d) => d.n === G.s.next); return d ? { x: d.x * G.W, y: d.y * G.H } : { x: G.cx, y: G.cy }; },
  },
];
