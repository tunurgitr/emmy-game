// ==========================================================================
//  Emmy's Pizza Plus — clicker games, part 2: Rare & Epic.
// ==========================================================================
import { E, circ, oval, rr, txt, bar, face, pizza, slice, rnd, pick, clamp, dist, INK } from "./clicker.js";
import { SFX } from "./audio.js";

const GULL = (g, x, y, r, flap, mood = "grumpy", dir = 1) => { g.save(); g.translate(x, y); g.scale(dir, 1); const w = Math.sin(flap) * 0.6;
  for (const s of [-1, 1]) { g.save(); g.rotate(s * (0.4 + w)); oval(g, s * r * 0.9, -r * 0.2, r * 0.9, r * 0.32, "#dfe5ee"); g.restore(); }
  oval(g, 0, 0, r * 0.8, r * 0.62, "#ffffff"); g.beginPath(); g.moveTo(r * 0.55, -r * 0.05); g.lineTo(r * 1.05, r * 0.05); g.lineTo(r * 0.55, r * 0.2); g.closePath(); g.fillStyle = "#ffb02e"; g.fill(); g.strokeStyle = INK; g.lineWidth = 2; g.stroke(); g.restore(); face(g, x + dir * r * 0.15, y - r * 0.1, r * 0.45, mood, { blush: false }); };

export const GAMES_B = [
  // ------------------------------------------------------------------------
  //  RARE
  // ------------------------------------------------------------------------
  {
    id: "cheesepull", name: "Stretchy Cheese Pull", rar: "rare", ico: "🧀", unit: "stretches", base: 2, bg: ["#fff8dc", "#ffe3a3"],
    blurb: "Hold (and drag up) to stretch the cheese… let go before it SNAPS to bank your points!",
    ups: [["tap", "Stretchier Cheese", "🧀"], ["auto", "Cheese-Pulling Goat", "🐐"], ["mult", "Mozzarella Magic", "✨"]],
    win: ["Stretchy! You're a natural.", "That cheese stretched to the next room!", "The cheese stretched across the whole street. Cars stopped to watch.", "Your cheese pull broke a world record. The record was also cheese.", "The cheese is now a bridge. People are walking on it.", "Mozzarella scientists can't explain your stretch.", "You pulled cheese all the way to the moon. It's stuck there now.", "The Stretch Hall of Fame has your picture. In cheese.", "Infinite stretch achieved. The cheese is everywhere."],
    init(G) { Object.assign(G.s, { hold: false, len: 0, snap: rnd(0.55, 0.95), pend: 0, snapT: 0, best: 0, warn: false, banked: 0 }); },
    down(G) { const s = G.s; if (s.snapT > 0) return; s.hold = true; s.len = Math.max(s.len, 0.03); s.warn = false; SFX.tap(); },
    move(G, x, y, ox, oy) { const s = G.s; if (s.hold && oy > y) s.len += (oy - y) / (G.H * 0.9); },
    up(G) { const s = G.s; if (!s.hold) return; s.hold = false; const pts = Math.max(1, Math.round(s.pend)); G.add(pts, G.cx, this.sliceY(G), { color: s.len > 0.6 ? "#ffd23f" : "#fff" }); s.banked++; if (s.len > 0.5) { SFX.win(); G.float(s.len > 0.8 ? "MEGA STRETCH!" : "STRETCHY!", G.cx, G.u * 22, "#ffd23f", 1.3); } else SFX.boing(); s.best = Math.max(s.best, Math.round(s.len * 100)); s.snap = rnd(0.5, 0.97); s.pend = 0; },
    sliceY(G) { return G.H * 0.8 - G.s.len * G.H * 0.62; },
    update(G, dt) { const s = G.s; s.snapT = Math.max(0, s.snapT - dt);
      if (s.hold) { s.len += dt * 0.22; s.pend = s.len * 10 + s.len * s.len * 40;
        if (!s.warn && s.len > s.snap - 0.12) { s.warn = true; G.say("Uh oh… it's getting thin!", G.cx, this.sliceY(G) - G.u * 12, 1); SFX.squeak(); }
        if (s.len >= s.snap) { s.hold = false; s.snapT = 0.9; s.pend = 0; SFX.splat(); SFX.boing(); G.shake(2); G.float("SNAP! 😱", G.cx, G.u * 22, "#ff5a5f", 1.4); G.add(1, G.cx, this.sliceY(G), { quiet: true }); s.snap = rnd(0.5, 0.97); } }
      else s.len = Math.max(0, s.len - dt * 1.6); },
    autoTick(G) { G.burst(G.W * 0.85, G.H * 0.85, "🧀", 1, { size: 0.5 }); },
    draw(G, g) { const s = G.s, py = G.H * 0.82, sy = this.sliceY(G), near = s.hold ? clamp((s.len - (s.snap - 0.2)) / 0.2, 0, 1) : 0;
      g.save(); g.translate(G.cx, py); g.scale(1, 0.35); pizza(g, 0, 0, Math.min(G.W * 0.38, G.u * 40), { peps: 5 }); g.restore();
      if (s.len > 0.02 && s.snapT <= 0) { const thick = Math.max(1.5, G.u * 3.5 * (1 - s.len / Math.max(0.3, s.snap)) + 1); for (const o of [-1, 0, 1]) { g.beginPath(); g.moveTo(G.cx + o * G.u * 8, py - G.u * 2); g.bezierCurveTo(G.cx + o * G.u * 12 + Math.sin(G.t * 9 + o) * near * G.u * 4, (py + sy) / 2, G.cx + o * G.u * 4, (py + sy) / 2, G.cx + o * G.u * 3, sy + G.u * 3); g.strokeStyle = near > 0.5 && Math.sin(G.t * 30) > 0 ? "#ffef9a" : "#ffd23f"; g.lineWidth = thick * (o ? 0.7 : 1); g.lineCap = "round"; g.stroke(); } }
      if (s.snapT > 0) { E(g, "💥", G.cx, (py + sy) / 2, G.u * 14 * s.snapT); }
      slice(g, G.cx, sy + G.u * 10, G.u * 20, { rot: Math.PI + Math.sin(G.t * 12) * 0.05 * near }); face(g, G.cx, sy + G.u * 2, G.u * 4.5, near > 0.4 ? "wow" : "happy", { blush: false });
      if (s.hold) txt(g, `+${Math.round(s.pend)}`, G.cx + G.u * 22, sy, G.u * 6, "#fff", { stroke: INK });
      txt(g, s.hold ? "Let go to keep it!" : "👆 Press & hold, drag up!", G.cx, G.u * 8, G.u * 4.5, "#fff", { stroke: INK }); txt(g, `Longest stretch: ${s.best}cm`, G.cx, G.u * 15, G.u * 3.5, INK); },
    hot(G) { return { x: G.cx, y: this.sliceY(G) }; },
  },
  {
    id: "goblin", name: "Oven Goblin", rar: "rare", ico: "🧌", unit: "logs", base: 2, bg: ["#ffe2c4", "#ff9e6b"],
    blurb: "A goblin lives in the pizza oven. Feed it logs to bake pizzas — and give it what it WANTS.",
    ups: [["tap", "Bigger Logs", "🪵"], ["auto", "Goblin Grandma", "👵"], ["crit", "Toasty Fire", "🔥"]],
    win: ["The goblin did a little dance. It was awful. It was perfect.", "The goblin says you're 'not bad, for a human'.", "The goblin has named a sock after you.", "The goblin baked you a pizza. It's shaped like the goblin.", "Goblins from other ovens are jealous.", "The goblin wants to be your best friend. It gave you a pebble.", "Goblin party at the oven tonight! You're invited!", "The goblin calls you 'Boss' now.", "You are now the Goblin King/Queen. Long may you bake!"],
    init(G) { Object.assign(G.s, { fire: 40, wish: null, wishT: 3, choices: [], bake: 0, pies: 0, mood: "smug", moodT: 0, log: null }); },
    logPos(G) { return { x: G.u * 14, y: G.H - G.u * 26 }; },
    btn(G, i) { return { x: G.cx + (i - 1) * G.u * 22, y: G.H - G.u * 24, r: G.u * 9 }; },
    down(G, x, y) { const s = G.s;
      if (s.wish) for (let i = 0; i < 3; i++) { const b = this.btn(G, i); if (dist(x, y, b.x, b.y) < b.r * 1.2) { const ok = s.choices[i] === s.wish;
        if (ok) { G.add(10, b.x, b.y, { color: "#ffd23f" }); SFX.win(); s.mood = "joy"; G.say(`Yesss! A ${s.wish}! Mine!`, G.cx, G.H * 0.3, 1.5); G.burst(G.cx, G.H * 0.4, [s.wish, "✨"], 8); } else { SFX.error(); s.mood = "angry"; G.say(`Not THAT! I wanted ${s.wish}!`, G.cx, G.H * 0.3, 1.5); G.burst(G.cx, G.H * 0.4, "💨", 5); }
        s.moodT = 1.5; s.wish = null; s.wishT = rnd(4, 7); return; } }
      s.fire = Math.min(100, s.fire + 9); s.log = { t: 0.35 }; G.add(1 + (s.fire > 60 ? 1 : 0), G.cx, G.H * 0.42); G.noise(0.25, { vol: 0.12, f0: 2500, f1: 500, type: "bandpass" });
      if (s.fire > 60) { s.bake += 0.14; if (s.bake >= 1) { s.bake = 0; s.pies++; G.add(6, G.cx, G.H * 0.5, { color: "#ffd23f" }); SFX.ding(); G.burst(G.cx, G.H * 0.48, "🍕", 5); } } },
    update(G, dt) { const s = G.s; s.fire = Math.max(0, s.fire - dt * 6); s.moodT -= dt; if (s.moodT <= 0) s.mood = s.fire < 20 ? "sad" : "smug"; if (s.log && (s.log.t -= dt) <= 0) s.log = null;
      if (!s.wish) { s.wishT -= dt; if (s.wishT <= 0) { s.wish = pick(["🧦", "🎵", "🍪", "🦆", "🎩", "🧸", "🥒", "🎈"]); const others = ["🧦", "🎵", "🍪", "🦆", "🎩", "🧸", "🥒", "🎈"].filter((e) => e !== s.wish).sort(() => Math.random() - 0.5).slice(0, 2); s.choices = [s.wish, ...others].sort(() => Math.random() - 0.5); s.wishT = 7; G.say(`I WANT A ${s.wish}!`, G.cx, G.H * 0.3, 1.5); SFX.squeak(); } }
      else { s.wishT -= dt; if (s.wishT <= 0) { s.wish = null; s.wishT = rnd(4, 7); s.mood = "grumpy"; s.moodT = 1.2; G.say("Hmph. Fine.", G.cx, G.H * 0.3, 1); } } },
    draw(G, g) { const s = G.s, ox = G.cx, oy = G.H * 0.5, R = Math.min(G.W * 0.36, G.u * 36);
      g.beginPath(); g.arc(ox, oy, R, Math.PI, 0); g.lineTo(ox + R, oy + R * 0.3); g.lineTo(ox - R, oy + R * 0.3); g.closePath(); g.fillStyle = "#d96b4a"; g.fill(); g.strokeStyle = INK; g.lineWidth = 5; g.stroke();
      for (let i = 0; i < 10; i++) rr(g, ox - R * 0.8 + (i % 5) * R * 0.34 + (Math.floor(i / 5) % 2) * R * 0.17, oy - R * 0.75 + Math.floor(i / 5) * R * 0.25, R * 0.26, R * 0.11, 4, "#e8875f", null);
      g.beginPath(); g.arc(ox, oy + R * 0.3, R * 0.5, Math.PI, 0); g.closePath(); g.fillStyle = "#3a1a10"; g.fill(); g.stroke();
      const f = s.fire / 100; for (let i = 0; i < 5; i++) E(g, "🔥", ox + (i - 2) * R * 0.17, oy + R * 0.2 - Math.sin(G.t * 9 + i) * G.u, G.u * (5 + f * 9));
      const gy = oy - R * 0.02 + Math.sin(G.t * (s.mood === "joy" ? 12 : 2)) * G.u * (s.mood === "joy" ? 2 : 0.6);
      for (const sd of [-1, 1]) { g.beginPath(); g.moveTo(ox + sd * G.u * 8, gy - G.u * 3); g.lineTo(ox + sd * G.u * 16, gy - G.u * 9); g.lineTo(ox + sd * G.u * 9, gy + G.u * 2); g.closePath(); g.fillStyle = "#6fcf5a"; g.fill(); g.strokeStyle = INK; g.lineWidth = 3; g.stroke(); }
      circ(g, ox, gy, G.u * 9, "#7fe06a"); face(g, ox, gy, G.u * 7.5, s.mood); if (s.mood === "joy") E(g, "🎶", ox + G.u * 14, gy - G.u * 10, G.u * 6);
      const lp = this.logPos(G); E(g, "🪵", lp.x, lp.y, G.u * 13); E(g, "🪵", lp.x + G.u * 6, lp.y + G.u * 5, G.u * 12); if (s.log) { const k = 1 - s.log.t / 0.35; E(g, "🪵", lp.x + (ox - lp.x) * k, lp.y + (oy - lp.y) * k - Math.sin(k * Math.PI) * G.u * 20, G.u * 9, k * 8); }
      if (s.wish) { for (let i = 0; i < 3; i++) { const b = this.btn(G, i); circ(g, b.x, b.y, b.r, "#fffaf0"); E(g, s.choices[i], b.x, b.y, b.r * 1.2); } txt(g, "Give the goblin what it wants!", G.cx, G.H - G.u * 8, G.u * 3.6, "#fff", { stroke: INK }); }
      bar(g, G.cx - G.u * 24, G.u * 4, G.u * 48, G.u * 5, f, "#ff8a1f"); txt(g, `🔥 Fire · 🍕 ${s.pies} baked`, G.cx, G.u * 13, G.u * 3.6, INK); if (s.fire > 60) bar(g, G.cx - G.u * 15, G.u * 17, G.u * 30, G.u * 3, s.bake, "#ffd23f"); },
    hot(G) { const s = G.s; if (s.wish) return this.btn(G, s.choices.indexOf(s.wish)); return { x: G.cx, y: G.H * 0.45 }; },
  },
  {
    id: "tower", name: "Leaning Tower of Pizza", rar: "rare", ico: "🗼", unit: "boxes", base: 2, bg: ["#d8f0ff", "#fff1e0"],
    blurb: "Tap to drop pizza boxes on the stack. Perfect drops = big points. How tall before TIMBERRR?",
    ups: [["tap", "Sticky Cheese Glue", "🍯"], ["auto", "Box Delivery Crew", "🚚"], ["mult", "Famous Tower", "📸"]],
    win: ["Your tower is taller than a giraffe!", "Tourists are taking photos of your tower.", "Your tower leans more than the real one. Show-off.", "Birds are building nests on your tower.", "Your tower has its own postcode.", "The tower can be seen from three towns away.", "Clouds bump into your tower and say sorry.", "NASA asked you to stop. You did not stop.", "The Leaning Tower of Pizza is the 8th Wonder of the World!"],
    init(G) { Object.assign(G.s, { stack: [0], drop: null, fall: [], topple: 0, best: 0 }); },
    bw(G) { return Math.min(G.W * 0.34, G.u * 36); }, bh(G) { return G.u * 7; },
    moverX(G) { const n = G.s.stack.length; return G.cx + Math.sin(G.t * (1.4 + n * 0.06)) * G.W * 0.22; },
    baseY(G) { const n = G.s.stack.length; return G.H * 0.9 + Math.max(0, n - 6) * this.bh(G); },
    down(G) { const s = G.s; if (s.drop || s.topple > 0) return; s.drop = { x: this.moverX(G), y: G.u * 14, vy: 0 }; SFX.whoosh(); },
    update(G, dt) { const s = G.s, bw = this.bw(G), bh = this.bh(G);
      if (s.topple > 0) { s.topple -= dt; if (s.topple <= 0) { s.stack = [0]; } return; }
      if (s.drop) { const d = s.drop; d.vy += G.H * 3 * dt; d.y += d.vy * dt; const topY = this.baseY(G) - s.stack.length * bh; if (d.y >= topY - bh) { const topX = G.cx + s.stack[s.stack.length - 1], off = d.x - topX;
        if (Math.abs(off) > bw * 0.85) { s.fall.push({ x: d.x, y: topY - bh, vx: Math.sign(off) * G.u * 30, vy: -G.u * 10, r: 0 }); SFX.boing(); G.say("Whoops!", d.x, topY - bh * 2, 0.8); }
        else { const perfect = Math.abs(off) < bw * 0.12; s.stack.push(perfect ? s.stack[s.stack.length - 1] : s.stack[s.stack.length - 1] + off); G.add(perfect ? 3 : 1, d.x, topY - bh * 2, { color: perfect ? "#ffd23f" : "#fff" }); if (perfect) { G.float("PERFECT!", d.x, topY - bh * 3, "#ffd23f", 1.2); SFX.ding(); } else SFX.bonk(); s.best = Math.max(s.best, s.stack.length - 1);
          const lean = s.stack[s.stack.length - 1]; if (Math.abs(lean) > bw * 0.85 || s.stack.length > 16) { const h = s.stack.length - 1; s.topple = 1.6; SFX.boom(); G.shake(3); G.float("TIMBERRRR!", G.cx, G.u * 22, "#ff5a5f", 1.5); G.add(h * 3, G.cx, G.cy, { color: "#ffd23f" }); s.stack.forEach((o, i) => s.fall.push({ x: G.cx + o, y: this.baseY(G) - i * bh, vx: (lean > 0 ? 1 : -1) * rnd(10, 40) * G.u, vy: -rnd(5, 20) * G.u, r: 0 })); } }
        s.drop = null; } }
      for (let i = s.fall.length - 1; i >= 0; i--) { const f = s.fall[i]; f.vy += G.H * 2 * dt; f.x += f.vx * dt; f.y += f.vy * dt; f.r += dt * 4 * Math.sign(f.vx || 1); if (f.y > G.H + 50) s.fall.splice(i, 1); } },
    box(G, g, x, y, r = 0) { const bw = this.bw(G), bh = this.bh(G); g.save(); g.translate(x, y); g.rotate(r); rr(g, -bw / 2, -bh, bw, bh, G.u * 1.2, "#fff4dc"); rr(g, -bw * 0.12, -bh * 0.78, bw * 0.24, bh * 0.56, G.u, "#f2483a", null); g.restore(); },
    draw(G, g) { const s = G.s, bh = this.bh(G), by = this.baseY(G); g.fillStyle = "#8fdc6a"; g.fillRect(0, by, G.W, G.H);
      if (s.topple <= 0) s.stack.forEach((o, i) => { if (i) this.box(G, g, G.cx + o, by - (i - 1) * bh, 0); });
      for (const f of s.fall) this.box(G, g, f.x, f.y, f.r);
      if (s.topple <= 0 && !s.drop) this.box(G, g, this.moverX(G), G.u * 14 + bh, 0); if (s.drop) this.box(G, g, s.drop.x, s.drop.y + bh, 0);
      E(g, "🧍", G.W * 0.12, by - G.u * 7, G.u * 14); txt(g, `📦 ${Math.max(0, s.stack.length - 1)} high · best ${s.best}`, G.cx, G.u * 6, G.u * 4, INK); },
  },
  {
    id: "seagull", name: "Seagull Heist", rar: "rare", ico: "🏖️", unit: "shoos", base: 2, bg: ["#9fdcff", "#ffe9b0"],
    blurb: "Beach pizza picnic! Sneaky seagulls swoop in to steal slices. Tap them to shoo!",
    ups: [["tap", "Beach Umbrella", "⛱️"], ["auto", "Guard Crab", "🦀"], ["crit", "Super Shoo", "💨"]],
    win: ["The seagulls are filing a complaint.", "Seagulls have put up a sign: BEWARE OF YOU.", "Not one slice lost. The picnic is SAFE.", "Seagulls now order pizza instead. They tip well.", "You're the lifeguard of pizza.", "The seagulls made you their honorary captain.", "Even pelicans respect you now.", "The beach has been renamed after you.", "Seagulls everywhere whisper your name… and then leave."],
    init(G) { Object.assign(G.s, { slots: Array.from({ length: 6 }, () => ({ has: true, t: 0 })), gulls: [], spawn: 0.5, saved: 0 }); this.spawnGull(G, true); },
    slotPos(G, i) { return { x: G.cx + (i - 2.5) * Math.min(G.W * 0.14, G.u * 15), y: G.H * 0.8 }; },
    spawnGull(G, near = false) { const s = G.s, have = s.slots.map((x, i) => i).filter((i) => s.slots[i].has && !s.gulls.some((g) => g.slot === i)); if (!have.length) return; const left = Math.random() < 0.5; s.gulls.push({ x: near ? G.W * 0.3 : left ? -G.u * 10 : G.W + G.u * 10, y: near ? G.H * 0.35 : rnd(G.H * 0.1, G.H * 0.3), slot: pick(have), mode: "in", flap: rnd(0, 6), sp: rnd(0.35, 0.55), carry: false }); },
    down(G, x, y) { const s = G.s; const gl = s.gulls.find((g) => g.mode !== "flee" && dist(x, y, g.x, g.y) < G.u * 10);
      if (gl) { if (gl.carry) { s.slots[gl.slot].has = true; s.saved++; G.add(5, gl.x, gl.y, { color: "#ffd23f" }); G.float("SAVED!", gl.x, gl.y - G.u * 8, "#4dbb5a", 1.1); } else G.add(2, gl.x, gl.y); gl.mode = "flee"; gl.carry = false; SFX.squawk(); G.burst(gl.x, gl.y, "💨", 4, { size: 0.7 }); G.say(pick(["SQUAWK!", "My snack!", "I'll be back!", "Mine? No? OK."]), gl.x, gl.y - G.u * 8, 0.9); }
      else SFX.boop(); },
    update(G, dt) { const s = G.s; s.spawn -= dt; if (s.spawn <= 0) { s.spawn = rnd(0.8, 1.8); if (s.gulls.length < 4) this.spawnGull(G); }
      for (const sl of s.slots) if (!sl.has) { sl.t += dt; if (sl.t > 4) { sl.has = true; sl.t = 0; } }
      for (let i = s.gulls.length - 1; i >= 0; i--) { const gl = s.gulls[i]; gl.flap += dt * 14;
        if (gl.mode === "in") { const p = this.slotPos(G, gl.slot); if (!s.slots[gl.slot].has) { gl.mode = "flee"; continue; } const dx = p.x - gl.x, dy = p.y - G.u * 4 - gl.y, d = Math.hypot(dx, dy); const sp = gl.sp * G.H * dt; gl.x += (dx / d) * sp; gl.y += (dy / d) * sp + Math.sin(G.t * 4 + i) * G.u * 0.3; if (d < G.u * 3) { s.slots[gl.slot].has = false; s.slots[gl.slot].t = 0; gl.carry = true; gl.mode = "flee"; SFX.squawk(); G.say("HA HA! Pizza!", gl.x, gl.y - G.u * 8, 1); } }
        else { gl.y -= G.H * 0.5 * dt; gl.x += (gl.x < G.cx ? -1 : 1) * G.W * 0.3 * dt; if (gl.y < -G.u * 20) s.gulls.splice(i, 1); } } },
    autoTick(G) { const gl = G.s.gulls.find((g) => g.mode === "in"); if (gl) { gl.mode = "flee"; G.burst(gl.x, gl.y, "🦀", 1, { size: 0.6 }); } },
    draw(G, g) { const s = G.s; g.fillStyle = "#4aa8ff"; g.fillRect(0, G.H * 0.5, G.W, G.H * 0.12); g.fillStyle = "#ffe0a0"; g.fillRect(0, G.H * 0.62, G.W, G.H); E(g, "☀️", G.W - G.u * 12, G.u * 12, G.u * 16); E(g, "⛱️", G.u * 12, G.H * 0.62, G.u * 20);
      rr(g, G.cx - G.u * 46, G.H * 0.74, G.u * 92, G.u * 14, G.u * 3, "#ff6f61"); for (let i = 0; i < 6; i++) { const p = this.slotPos(G, i); if (s.slots[i].has) slice(g, p.x, p.y + G.u * 4, G.u * 9); else txt(g, "…", p.x, p.y, G.u * 5, "#fff"); }
      for (const gl of s.gulls) { GULL(g, gl.x, gl.y, G.u * 7, gl.flap, gl.mode === "flee" && !gl.carry ? "wow" : "smug", gl.x < G.cx ? 1 : -1); if (gl.carry) slice(g, gl.x, gl.y + G.u * 10, G.u * 6, { rot: Math.PI }); }
      txt(g, `🍕 Slices saved: ${s.saved}`, G.cx, G.u * 6, G.u * 4, INK); },
    hot(G) { const gl = G.s.gulls.find((g) => g.mode === "in"); return gl ? { x: gl.x, y: gl.y } : { x: G.cx, y: G.cy }; },
  },
  {
    id: "rocket", name: "Pizza Rocket", rar: "rare", ico: "🚀", unit: "boosts", base: 2, bg: ["#bfe8ff", "#fff1e0"],
    blurb: "Fill the pizza-box rocket with sauce fuel, BLAST OFF, and deliver pizza to the aliens on the cheese moon!",
    ups: [["tap", "Bigger Fuel Can", "🥫"], ["auto", "Space Hamster", "🐹"], ["mult", "Turbo Crust", "🚀"]],
    win: ["3… 2… 1… PIZZA!", "The aliens left you a 5-star review.", "The moon IS made of cheese. You checked.", "Aliens have named a planet 'Pepperoni'.", "Your rocket has more stickers than a laptop.", "Mars ordered a large with extra olives.", "The Galaxy Pizza Guild salutes you!", "You delivered a pizza to the Sun. It was VERY hot.", "Space Pizza Hero of the Universe!"],
    init(G) { Object.assign(G.s, { phase: "fuel", fuel: 0, alt: 0, speed: 0, t: 0, trips: 0, cd: 0 }); },
    down(G) { const s = G.s; if (s.phase === "fuel") { s.fuel = Math.min(100, s.fuel + 9); G.add(1, G.cx + G.u * 16, G.H * 0.6); SFX.splat(); if (s.fuel >= 100) { s.phase = "count"; s.cd = 1.8; SFX.ding(); } }
      else if (s.phase === "fly") { s.speed += 0.35; G.add(2, G.cx, G.H * 0.5); G.tone(300 + s.speed * 60, 0.08, { type: "sawtooth", vol: 0.05 }); } else SFX.boop(); },
    update(G, dt) { const s = G.s; s.t += dt;
      if (s.phase === "count") { s.cd -= dt; if (s.cd <= 0) { s.phase = "fly"; s.speed = 1; SFX.boom(); G.shake(2); G.float("BLAST OFF!", G.cx, G.u * 18, "#ff5a5f", 1.5); } }
      else if (s.phase === "fly") { s.alt += s.speed * dt * 40; s.speed = Math.max(0.8, s.speed - dt * 0.4); if (Math.random() < 0.5) G.parts.push({ x: G.cx + rnd(-G.u * 3, G.u * 3), y: G.H * 0.62, vx: rnd(-30, 30), vy: rnd(100, 260), life: 0.6, max: 0.6, e: "🔥", size: G.u * rnd(4, 7), rot: 0, vr: 0, grav: 0 });
        if (s.alt >= 384) { s.phase = "moon"; s.t = 0; SFX.win(); G.add(25 + s.trips * 5, G.cx, G.H * 0.3, { color: "#ffd23f" }); G.say(pick(["Pizza! Pizza! Blorp!", "Extra cheese! Our favourite!", "You are the best delivery human!"]), G.W * 0.7, G.H * 0.3, 2); G.burst(G.cx, G.H * 0.3, ["👽", "🍕", "⭐"], 14); } }
      else if (s.phase === "moon" && s.t > 2.6) { s.phase = "fuel"; s.fuel = 0; s.alt = 0; s.trips++; } },
    draw(G, g) { const s = G.s, k = s.phase === "moon" ? 1 : clamp(s.alt / 120, 0, 1); g.fillStyle = `rgba(20,16,60,${k * 0.92})`; g.fillRect(0, 0, G.W, G.H);
      if (k > 0.2) for (let i = 0; i < 40; i++) circ(g, (i * 137) % G.W, (i * 89 + s.alt * 6) % G.H, G.u * 0.4 * (1 + (i % 3)), "#fff", null);
      if (s.phase === "moon") { circ(g, G.cx, G.H * 0.95, G.W * 0.55, "#ffe27a"); for (let i = 0; i < 6; i++) circ(g, G.cx + Math.cos(i * 1.7) * G.W * 0.35, G.H * 0.85 + Math.sin(i * 1.7) * G.u * 8, G.u * 4, "#f5c84a", null); face(g, G.cx, G.H * 0.82, G.u * 10, "joy"); E(g, "👽", G.W * 0.25, G.H * 0.62, G.u * 14); E(g, "👽", G.W * 0.75, G.H * 0.6, G.u * 12); }
      else if (k < 1) { g.fillStyle = "#8fdc6a"; g.fillRect(0, G.H * 0.78 + s.alt * 3, G.W, G.H); }
      const ry = s.phase === "moon" ? G.H * 0.5 - Math.min(1, s.t) * G.u * 4 : G.H * 0.5 + (s.phase === "fuel" ? G.u * 6 : 0), sh = s.phase === "count" ? rnd(-2, 2) : 0;
      g.save(); g.translate(G.cx + sh, ry); for (const sd of [-1, 1]) { g.beginPath(); g.moveTo(sd * G.u * 8, G.u * 6); g.lineTo(sd * G.u * 15, G.u * 16); g.lineTo(sd * G.u * 8, G.u * 14); g.closePath(); g.fillStyle = "#f2483a"; g.fill(); g.strokeStyle = INK; g.lineWidth = 3; g.stroke(); }
      rr(g, -G.u * 8, -G.u * 14, G.u * 16, G.u * 30, G.u * 3, "#fff4dc"); g.beginPath(); g.moveTo(-G.u * 8, -G.u * 13); g.lineTo(0, -G.u * 26); g.lineTo(G.u * 8, -G.u * 13); g.closePath(); g.fillStyle = "#ffd23f"; g.fill(); g.stroke(); circ(g, 0, -G.u * 4, G.u * 4.5, "#bfe8ff"); E(g, "🧑‍🚀", 0, -G.u * 4, G.u * 7); txt(g, "PIZZA", 0, G.u * 8, G.u * 3, "#e63b2e"); g.restore();
      if (s.phase === "fuel") { E(g, "🥫", G.cx + G.u * 18, G.H * 0.56, G.u * 12, -0.6); bar(g, G.cx - G.u * 24, G.u * 5, G.u * 48, G.u * 5, s.fuel / 100, "#f2483a"); txt(g, "Tap to fill up the sauce fuel!", G.cx, G.u * 14, G.u * 3.8, INK); }
      if (s.phase === "count") txt(g, String(Math.ceil(s.cd / 0.6)), G.cx, G.H * 0.2, G.u * 14, "#fff", { stroke: INK });
      if (s.phase === "fly") { txt(g, `🌕 ${Math.round(s.alt)} / 384 km`, G.cx, G.u * 7, G.u * 4.4, "#fff", { stroke: INK }); txt(g, "Tap tap tap to BOOST!", G.cx, G.H - G.u * 16, G.u * 4, "#fff", { stroke: INK }); }
      txt(g, `🍕 Space deliveries: ${s.trips}`, G.cx, G.H - G.u * 8, G.u * 3.5, k > 0.5 ? "#fff" : INK); },
  },
  {
    id: "disco", name: "Disco Pepperoni", rar: "rare", ico: "🪩", unit: "grooves", base: 2, bg: ["#3b1f6b", "#a23b9b"], noDots: true,
    blurb: "Groovy pepperonis fall to the beat! Tap the lane right when they hit the line.",
    ups: [["tap", "Shiny Shoes", "👟"], ["auto", "Backup Dancers", "🕺"], ["mult", "Disco Fever", "🪩"]],
    win: ["Groovy, baby!", "The pepperonis are doing the robot.", "The disco ball is spinning so fast it's a disco PLANET.", "Your dance moves are now illegal in 3 countries (for being too good).", "The whole pizza is doing the conga!", "John Pepperoni-Travolta is impressed.", "Disco is back! Because of YOU!", "The beat drops. The pizza drops. Everyone cheers.", "Ultimate Disco Pepperoni Superstar!"],
    init(G) { Object.assign(G.s, { notes: [], beat: 0, bi: 0, combo: 0, flash: [0, 0, 0], last: "" }); },
    BPM: 108, FALL: 1.7,
    lane(G, i) { return G.W * (0.5 + (i - 1) * 0.27); }, hitY(G) { return G.H * 0.8; },
    down(G, x) { const s = G.s, L = clamp(Math.floor((x / G.W - 0.5 + 0.405) / 0.27), 0, 2); s.flash[L] = 1; const hy = this.hitY(G);
      let best = null, bd = Infinity; for (const n of s.notes) if (!n.hit && n.lane === L) { const d = Math.abs(n.y * hy - hy); if (d < bd) { bd = d; best = n; } }
      if (best && bd < G.u * 9) { best.hit = true; const perf = bd < G.u * 4; s.combo++; const mult = 1 + Math.floor(s.combo / 8); G.add((perf ? 2 : 1) * mult, this.lane(G, L), hy - G.u * 6, { color: perf ? "#ffd23f" : "#fff" }); s.last = perf ? "PERFECT!" : pick(["Groovy!", "Nice!", "Funky!"]); SFX.note([0, 4, 7, 12, 9, 7, 4, 2][s.bi % 8] + L * 2); G.dots(this.lane(G, L), hy, ["#ff5aa8", "#ffd23f", "#6ec6ff"], 10); }
      else { s.combo = 0; s.last = "Oops!"; SFX.boop(); } },
    update(G, dt) { const s = G.s, spb = 60 / this.BPM; s.beat += dt; if (s.beat >= spb) { s.beat -= spb; s.bi++; G.tone(80, 0.08, { type: "sine", vol: 0.1 }); if (s.bi % 2) G.noise(0.03, { vol: 0.03, f0: 8000, f1: 6000, type: "highpass" }); if (Math.random() < 0.75) s.notes.push({ lane: Math.floor(rnd(0, 3)), y: 0, hit: false }); }
      for (let i = s.notes.length - 1; i >= 0; i--) { const n = s.notes[i]; n.y += dt / this.FALL; if (n.hit) n.y += dt * 2; if (!n.hit && n.y * this.hitY(G) > this.hitY(G) + G.u * 10) { n.hit = true; s.combo = 0; s.last = "Missed!"; } if (n.y > 1.4) s.notes.splice(i, 1); }
      s.flash = s.flash.map((f) => Math.max(0, f - dt * 4)); },
    autoTick(G) { const n = G.s.notes.find((n) => !n.hit && n.y > 0.7); if (n) { n.hit = true; } },
    draw(G, g) { const s = G.s, hy = this.hitY(G), pulse = 1 - G.s.beat / (60 / this.BPM);
      g.save(); g.translate(G.cx, G.u * 10); g.rotate(G.t); circ(g, 0, 0, G.u * 8, "#cfd6e2"); for (let i = 0; i < 12; i++) { g.fillStyle = i % 2 ? "#ffffff" : "#9aa6c2"; g.fillRect(Math.cos(i) * G.u * 4 - G.u, Math.sin(i * 1.3) * G.u * 4 - G.u, G.u * 2, G.u * 2); } g.restore();
      for (let i = 0; i < 6; i++) { g.globalAlpha = 0.12; g.fillStyle = ["#ff5aa8", "#ffd23f", "#6ec6ff"][i % 3]; g.beginPath(); g.moveTo(G.cx, G.u * 10); const a = G.t * 0.8 + i; g.lineTo(G.cx + Math.cos(a) * G.W, G.H); g.lineTo(G.cx + Math.cos(a + 0.15) * G.W, G.H); g.fill(); g.globalAlpha = 1; }
      for (let L = 0; L < 3; L++) { const x = this.lane(G, L); rr(g, x - G.u * 10, G.u * 20, G.u * 20, G.H, G.u * 6, `rgba(255,255,255,${0.08 + s.flash[L] * 0.25})`, null); circ(g, x, hy, G.u * (8 + pulse * 1.2), null, "#fff", 4); }
      for (const n of s.notes) { const x = this.lane(G, n.lane), y = n.y * hy; if (n.hit && n.y * hy > hy - G.u * 10) continue; circ(g, x, y, G.u * 6.5, "#d8343a", "#5a0f14", 3); oval(g, x - G.u * 2.4, y - G.u * 1, G.u * 2.2, G.u * 1.4, INK, null); oval(g, x + G.u * 2.4, y - G.u * 1, G.u * 2.2, G.u * 1.4, INK, null); g.strokeStyle = INK; g.lineWidth = 2; g.beginPath(); g.arc(x, y + G.u * 1.5, G.u * 2, 0.2, Math.PI - 0.2); g.stroke(); }
      for (const sd of [-1, 1]) E(g, "🕺", G.cx + sd * G.W * 0.45, G.H * 0.5 - pulse * G.u * 3, G.u * 12, sd * pulse * 0.2, 1, sd, 1);
      txt(g, s.combo > 1 ? `${s.last}  ×${s.combo}` : s.last, G.cx, G.u * 24, G.u * 5, "#ffd23f", { stroke: INK }); },
    hot(G) { const s = G.s; let best = null; for (const n of s.notes) if (!n.hit && (!best || Math.abs(n.y - 1) < Math.abs(best.y - 1))) best = n; return { x: this.lane(G, best ? best.lane : 1), y: this.hitY(G) }; },
  },

  // ------------------------------------------------------------------------
  //  EPIC
  // ------------------------------------------------------------------------
  {
    id: "dragon", name: "Pizza Dragon Hatchery", rar: "epic", ico: "🐉", unit: "snacks", base: 3, bg: ["#ffe7c7", "#ffb48a"],
    blurb: "Warm the egg to hatch a baby pizza dragon, then feed it slices until it's HUGE. It bakes pizzas with fire!",
    ups: [["tap", "Tasty Treats", "🍖"], ["auto", "Dragon Nanny", "🧚"], ["crit", "Big Flame", "🔥"]],
    win: ["It hatched! It's adorable! It burped a tiny flame!", "Your dragon learned to say 'pizza'. Well, 'PIZZAAARGH'.", "Your dragon can bake a pizza in 0.2 seconds.", "Your dragon is bigger than a bus. And very cuddly.", "Other dragons come to your dragon for baking lessons.", "Your dragon flew you to school. Everyone was jealous.", "The Dragon Council made your dragon Head Chef.", "Your dragon's fire is now rainbow coloured. Nobody knows why.", "Dragon Master of the Pizza Realm!"],
    init(G) { Object.assign(G.s, { stage: 0, xp: 0, chomp: 0, feeds: 0, fire: 0, fly: null, pies: 0 }); },
    NEED: [12, 25, 45, 80, Infinity], NAMES: ["Egg", "Baby", "Kid", "Teen", "GROWN-UP"],
    size(G) { return G.u * (8 + G.s.stage * 4.5); },
    pos(G) { const s = G.s; return s.stage >= 4 ? { x: G.cx + Math.sin(G.t * 0.8) * G.W * 0.2, y: G.H * 0.42 + Math.sin(G.t * 1.6) * G.u * 5 } : { x: G.cx, y: G.H * 0.56 }; },
    down(G) { const s = G.s, p = this.pos(G);
      if (s.stage === 0) { s.xp++; s.chomp = 1; G.add(1, p.x, p.y - G.u * 12); G.tone(500 + s.xp * 20, 0.06, { type: "triangle", vol: 0.1 }); if (s.xp >= this.NEED[0]) { s.stage = 1; s.xp = 0; SFX.wow(); G.flash("#fff7c2"); G.burst(p.x, p.y, ["🥚", "✨", "🎉"], 16); G.add(10, p.x, p.y, { color: "#ffd23f" }); G.float("CRACK! It's a baby pizza dragon!", G.cx, G.u * 22, "#ff5a5f", 1.1); } return; }
      s.fly = { t: 0.4 }; s.feeds++; s.xp++; s.chomp = 1; G.add(s.stage, p.x, p.y - this.size(G)); G.noise(0.1, { vol: 0.14, f0: 1600, f1: 600, type: "bandpass", when: 0.3 });
      if (s.feeds % 6 === 0) this.breathe(G);
      if (s.xp >= this.NEED[s.stage]) { s.stage++; s.xp = 0; SFX.win(); G.add(15 * s.stage, p.x, p.y, { color: "#ffd23f" }); G.float(`Your dragon grew up! (${this.NAMES[s.stage]})`, G.cx, G.u * 22, "#4dbb5a", 1.1); G.burst(p.x, p.y, ["✨", "💚"], 12); } },
    breathe(G) { const s = G.s; s.fire = 1; SFX.whoosh(); SFX.sizzle(); s.pies += 3; G.add(3 * s.stage, G.cx, G.H * 0.25, { color: "#ffd23f" }); G.say("RAWR! (I made pizzas!)", this.pos(G).x, this.pos(G).y - this.size(G) * 1.4, 1.2); },
    update(G, dt) { const s = G.s; s.chomp = Math.max(0, s.chomp - dt * 4); s.fire = Math.max(0, s.fire - dt * 0.8); if (s.fly && (s.fly.t -= dt) <= 0) s.fly = null; },
    autoTick(G) { if (G.s.stage >= 1 && Math.random() < 0.2) this.breathe(G); },
    draw(G, g) { const s = G.s, p = this.pos(G), r = this.size(G);
      if (s.stage === 0) { rr(g, G.cx - G.u * 22, G.H * 0.68, G.u * 44, G.u * 8, G.u * 4, "#d96b4a"); const w = Math.sin(G.t * 30) * s.chomp * 0.15; g.save(); g.translate(p.x, p.y); g.rotate(w); oval(g, 0, 0, r * 1.2, r * 1.5, "#fff4dc"); for (let i = 0; i < 5; i++) circ(g, Math.cos(i * 2) * r * 0.6, Math.sin(i * 2) * r * 0.8, r * 0.18, "#f2483a", null);
        g.strokeStyle = INK; g.lineWidth = 3; const cracks = Math.floor((s.xp / this.NEED[0]) * 6); for (let i = 0; i < cracks; i++) { g.beginPath(); g.moveTo(-r * 0.8 + i * r * 0.3, -r * 0.1); g.lineTo(-r * 0.65 + i * r * 0.3, r * 0.15); g.lineTo(-r * 0.5 + i * r * 0.3, -r * 0.05); g.stroke(); } g.restore(); E(g, "🔥", G.cx - G.u * 14, G.H * 0.68, G.u * 9); E(g, "🔥", G.cx + G.u * 14, G.H * 0.68, G.u * 9);
        txt(g, "Tap the egg to keep it warm!", G.cx, G.u * 8, G.u * 4.2, "#fff", { stroke: INK }); bar(g, G.cx - G.u * 22, G.u * 13, G.u * 44, G.u * 4, s.xp / this.NEED[0], "#ffd23f"); return; }
      const flap = Math.sin(G.t * (s.stage >= 4 ? 9 : 5)); for (const sd of [-1, 1]) { g.beginPath(); g.moveTo(p.x + sd * r * 0.5, p.y - r * 0.3); g.lineTo(p.x + sd * r * (1.6 + flap * 0.2), p.y - r * (1.1 + flap * 0.4)); g.lineTo(p.x + sd * r * 1.2, p.y + r * 0.1); g.closePath(); g.fillStyle = "#ff9a3c"; g.fill(); g.strokeStyle = INK; g.lineWidth = 3; g.stroke(); }
      g.beginPath(); g.moveTo(p.x + r * 0.6, p.y + r * 0.5); g.quadraticCurveTo(p.x + r * 1.8, p.y + r * 0.9, p.x + r * 1.6, p.y + r * 0.1); g.lineWidth = r * 0.25; g.strokeStyle = INK; g.stroke(); g.lineWidth = r * 0.17; g.strokeStyle = "#4dbb5a"; g.stroke();
      oval(g, p.x, p.y + r * 0.2, r * 0.9, r * 0.8, "#4dbb5a"); oval(g, p.x, p.y + r * 0.35, r * 0.55, r * 0.5, "#c9f29a", null); circ(g, p.x, p.y - r * 0.75, r * 0.65, "#5ccc68");
      for (const sd of [-1, 1]) { g.beginPath(); g.moveTo(p.x + sd * r * 0.3, p.y - r * 1.25); g.lineTo(p.x + sd * r * 0.45, p.y - r * 1.65); g.lineTo(p.x + sd * r * 0.55, p.y - r * 1.15); g.fillStyle = "#ffd23f"; g.fill(); g.lineWidth = 2; g.strokeStyle = INK; g.stroke(); }
      face(g, p.x, p.y - r * 0.75, r * 0.5, s.chomp > 0.3 ? "wow" : "happy");
      if (s.fly) { const k = 1 - s.fly.t / 0.4; slice(g, G.W * 0.9 + (p.x - G.W * 0.9) * k, G.H * 0.9 + (p.y - r * 0.6 - G.H * 0.9) * k, G.u * 8, { rot: k * 6 }); }
      if (s.fire > 0) for (let i = 0; i < 5; i++) E(g, "🔥", p.x - r * 0.3 - (1 - s.fire) * G.W * 0.5 - i * G.u * 7, p.y - r * 0.7 + Math.sin(i + G.t * 10) * G.u * 3, G.u * (6 + i), 0, s.fire);
      if (s.fire > 0) for (let i = 0; i < 3; i++) E(g, "🍕", G.W * (0.2 + i * 0.3), G.H * 0.18 - (1 - s.fire) * G.u * 10, G.u * 9, 0, s.fire);
      txt(g, `🐉 ${this.NAMES[s.stage]} dragon · 🍕 ${s.pies} baked`, G.cx, G.u * 6, G.u * 3.8, INK); if (s.stage < 4) bar(g, G.cx - G.u * 22, G.u * 10, G.u * 44, G.u * 4, s.xp / this.NEED[s.stage], "#4dbb5a"); },
    hot(G) { return this.pos(G); },
  },
  {
    id: "robochef", name: "Robo-Chef 3000", rar: "epic", ico: "🤖", unit: "beeps", base: 3, bg: ["#dff3ff", "#b8d8f0"],
    blurb: "Press the button that lights up — FAST! Press the wrong one and the robot gets… confused.",
    ups: [["tap", "Oil Can", "🛢️"], ["auto", "Robo-Puppy", "🐶"], ["mult", "Software Update", "💾"]],
    win: ["BEEP BOOP. PIZZA COMPLETE. HAPPY FACE.", "Robo-Chef has learned to love. And to bake.", "Robo-Chef now makes 1,000 pizzas a minute. Some are even round.", "Robo-Chef wrote a poem: 'Roses are red, sauce is red too.'", "Robo-Chef has upgraded to Robo-Chef 3001!", "Robo-Chef's dance moves have gone viral.", "Robo-Chef wants you to be its boss forever.", "The robots are taking over… the pizza kitchens. And that's OK.", "Robo-Chef 9000 achieved. It says: THANK YOU, HUMAN FRIEND."],
    init(G) { Object.assign(G.s, { lit: Math.floor(rnd(0, 4)), litT: 0, streak: 0, stun: 0, arm: 0, pies: 0, scr: "happy" }); },
    COLORS: ["#ff5a5f", "#4aa8ff", "#4dbb5a", "#ffd23f"], SYM: ["🍅", "🧀", "🌿", "🍄"],
    btn(G, i) { const b = Math.min(G.u * 11, G.W * 0.1); return { x: G.cx + (i % 2 ? 1 : -1) * b * 1.15, y: G.H * 0.6 + (i > 1 ? 1 : -1) * b * 1.1, r: b }; },
    down(G, x, y) { const s = G.s; if (s.stun > 0) return; let hit = -1; for (let i = 0; i < 4; i++) { const b = this.btn(G, i); if (dist(x, y, b.x, b.y) < b.r * 1.1) hit = i; }
      if (hit < 0) { SFX.boop(); return; }
      if (hit === s.lit) { const bonus = s.litT < 0.6 ? 2 : s.litT < 1.2 ? 1 : 0; s.streak++; G.add(1 + bonus + Math.floor(s.streak / 6), this.btn(G, hit).x, this.btn(G, hit).y - G.u * 10, { color: bonus === 2 ? "#ffd23f" : "#fff" }); SFX.beep(s.streak); s.arm = 1; s.scr = "joy";
        if (bonus === 2) G.float("SPEEDY!", G.cx, G.H * 0.25, "#ffd23f", 0.9);
        if (s.streak % 10 === 0) { s.pies++; G.add(12, G.cx, G.H * 0.6, { color: "#ffd23f" }); SFX.ding(); G.say("*DING* PIZZA COMPLETE!", G.cx, G.H * 0.18, 1.5); G.burst(G.cx, G.H * 0.55, ["🍕", "⚙️"], 8); }
        let n; do n = Math.floor(rnd(0, 4)); while (n === s.lit); s.lit = n; s.litT = 0; }
      else { s.streak = 0; s.stun = 0.9; s.scr = "dizzy"; SFX.error(); G.shake(1.5); G.burst(G.cx, G.H * 0.3, ["⚡", "💥"], 6); G.say(pick(["BEEP. I AM NOW A TOASTER.", "ERROR 404: CHEESE NOT FOUND", "Does not compute… I love you?", "INITIATING… CHICKEN DANCE", "Making… a shoe pizza?", "Reboooooting…"]), G.cx, G.H * 0.18, 1.6); } },
    update(G, dt) { const s = G.s; s.litT += dt; s.arm = Math.max(0, s.arm - dt * 3); if (s.stun > 0) { s.stun -= dt; if (s.stun <= 0) s.scr = "happy"; } else if (s.arm <= 0 && s.scr === "joy") s.scr = "happy"; },
    draw(G, g) { const s = G.s, W = Math.min(G.u * 52, G.W * 0.55), hx = G.cx, hy = G.H * 0.26;
      rr(g, hx - W / 2, G.H * 0.4, W, G.H * 0.48, G.u * 6, "#cfd6e2"); for (const sd of [-1, 1]) { g.save(); g.translate(hx + sd * W * 0.5, G.H * 0.48); g.rotate(sd * (0.4 + (sd > 0 ? s.arm : 0) * -1.2)); rr(g, -G.u * 3, 0, G.u * 6, G.u * 22, G.u * 3, "#aeb7c8"); g.restore(); }
      E(g, "🍳", hx + W * 0.5 + G.u * 4, G.H * 0.48 + G.u * 22 - s.arm * G.u * 20, G.u * 11);
      rr(g, hx - W * 0.4, hy - G.u * 13, W * 0.8, G.u * 26, G.u * 6, "#aeb7c8"); rr(g, hx - W * 0.32, hy - G.u * 9, W * 0.64, G.u * 18, G.u * 4, "#24304a"); g.strokeStyle = INK; g.lineWidth = 3; g.beginPath(); g.moveTo(hx, hy - G.u * 13); g.lineTo(hx, hy - G.u * 20); g.stroke(); circ(g, hx, hy - G.u * 21, G.u * 2.5, Math.sin(G.t * 8) > 0 ? "#ff5a5f" : "#ffd23f");
      g.save(); g.fillStyle = "#7fffd4"; g.strokeStyle = "#7fffd4"; face(g, hx, hy, G.u * 8, s.scr, { blush: false }); g.restore();
      for (let i = 0; i < 4; i++) { const b = this.btn(G, i), on = i === s.lit && s.stun <= 0; circ(g, b.x, b.y, b.r * (on ? 1 + Math.sin(G.t * 14) * 0.06 : 1), on ? this.COLORS[i] : "#8a93a6"); if (on) circ(g, b.x, b.y, b.r * 1.25, null, this.COLORS[i], 4); E(g, this.SYM[i], b.x, b.y, b.r * 0.9, 0, on ? 1 : 0.4); }
      txt(g, `⚡ Streak ${s.streak} · 🍕 ${s.pies}`, G.cx, G.u * 5, G.u * 3.8, INK); },
    hot(G) { return this.btn(G, G.s.lit); },
  },
  {
    id: "ghosts", name: "Ghost Pepper Ghosts", rar: "epic", ico: "👻", unit: "boos", base: 3, bg: ["#2a1f4f", "#4b2f6e"], noDots: true,
    blurb: "The pizzeria is haunted by giggly ghosts! Tap to shine your flashlight and catch them.",
    ups: [["tap", "Brighter Flashlight", "🔦"], ["auto", "Ghost Cat", "🐈‍⬛"], ["crit", "Spooky Luck", "🔮"]],
    win: ["Boo! You caught a ghost! It giggled.", "The ghosts think you're 'spook-tacular'.", "Your ghost pepper pot is almost full!", "A ghost asked for your autograph. It's invisible.", "The ghosts are throwing you a surprise party. SURPRISE! (Boo.)", "Ghostbusters? No. PIZZA-busters.", "The ghosts made you an honorary ghost. You're slightly see-through now.", "The haunted pizzeria is now the happiest pizzeria.", "Queen of the Ghost Peppers!"],
    init(G) { G.s.ghosts = []; G.s.light = { x: G.cx, y: G.cy, t: 1.2 }; G.s.pot = 0; for (let i = 0; i < 4; i++) this.spawn(G); },
    spawn(G) { G.s.ghosts.push({ bx: rnd(0.15, 0.85), by: rnd(0.2, 0.7), ph: rnd(0, 6.28), sp: rnd(0.5, 1.1), gold: Math.random() < 0.1, caught: 0 }); },
    gpos(G, gh) { return { x: (gh.bx + Math.sin(G.t * gh.sp + gh.ph) * 0.12) * G.W, y: (gh.by + Math.cos(G.t * gh.sp * 1.3 + gh.ph) * 0.08) * G.H }; },
    down(G, x, y) { const s = G.s; s.light = { x, y, t: 1.2 }; G.tone(1200, 0.04, { type: "square", vol: 0.04 });
      const gh = s.ghosts.find((gh) => !gh.caught && dist(x, y, this.gpos(G, gh).x, this.gpos(G, gh).y) < G.u * 11);
      if (gh) { const p = this.gpos(G, gh); gh.caught = 1; s.pot++; G.add(gh.gold ? 10 : 2, p.x, p.y, { color: gh.gold ? "#ffd23f" : "#e0d0ff" }); SFX.giggle(); G.burst(p.x, p.y, gh.gold ? ["🌟", "🌶️"] : ["🌶️", "✨"], 6); G.say(pick(["Hee hee!", "You found me!", "Boo! …oh.", "Tag, I'm it!"]), p.x, p.y - G.u * 10, 0.9); } },
    update(G, dt) { const s = G.s; s.light.t = Math.max(0, s.light.t - dt); for (let i = s.ghosts.length - 1; i >= 0; i--) { const gh = s.ghosts[i]; if (gh.caught) { gh.caught += dt; if (gh.caught > 0.8) { s.ghosts.splice(i, 1); setTimeout(() => this.spawn(G), 800); } } } },
    autoTick(G) { const gh = G.s.ghosts.find((g) => !g.caught); if (gh) { gh.caught = 1; G.s.pot++; } },
    draw(G, g) { const s = G.s; E(g, "🍕", G.W * 0.15, G.H * 0.18, G.u * 12, 0, 0.5); E(g, "🕯️", G.W * 0.85, G.H * 0.2, G.u * 10);
      for (const gh of s.ghosts) { const p = this.gpos(G, gh), L = s.light.t > 0 ? clamp(1 - dist(p.x, p.y, s.light.x, s.light.y) / (G.u * 35), 0, 1) * (s.light.t / 1.2) : 0; const a = gh.caught ? 1 - gh.caught : 0.25 + L * 0.75 + Math.max(0, Math.sin(G.t * 2 + gh.ph)) * 0.15, r = G.u * 9 * (gh.caught ? 1 - gh.caught * 0.8 : 1);
        g.save(); g.globalAlpha = clamp(a, 0, 1); g.translate(p.x, p.y); if (gh.caught) g.rotate(gh.caught * 10); g.beginPath(); g.arc(0, 0, r, Math.PI, 0); for (let i = 0; i <= 6; i++) g.lineTo(r - (i * r * 2) / 6, r * 0.9 + (i % 2 ? -r * 0.25 : 0)); g.closePath(); g.fillStyle = gh.gold ? "#ffe27a" : "#f4efff"; g.fill(); g.strokeStyle = INK; g.lineWidth = 3; g.stroke(); face(g, 0, 0, r * 0.6, gh.caught ? "dizzy" : "happy"); g.restore(); }
      g.save(); const gr = g.createRadialGradient(s.light.x, s.light.y, 0, s.light.x, s.light.y, G.u * 40); gr.addColorStop(0, `rgba(10,5,30,${0.15 + (1.2 - s.light.t) * 0.4})`); gr.addColorStop(1, "rgba(10,5,30,.62)"); g.fillStyle = gr; g.fillRect(0, 0, G.W, G.H); g.restore();
      rr(g, G.cx - G.u * 16, G.H - G.u * 18, G.u * 32, G.u * 14, G.u * 4, "#8a93a6"); for (let i = 0; i < Math.min(12, s.pot); i++) E(g, "🌶️", G.cx - G.u * 12 + (i % 6) * G.u * 5, G.H - G.u * 15 - Math.floor(i / 6) * G.u * 4, G.u * 5);
      txt(g, `👻 Ghosts caught: ${s.pot}`, G.cx, G.u * 6, G.u * 4, "#fff", { stroke: INK }); txt(g, "Tap to shine your flashlight!", G.cx, G.u * 13, G.u * 3.4, "#d8c8ff"); },
    hot(G) { const gh = G.s.ghosts.find((g) => !g.caught); return gh ? this.gpos(G, gh) : { x: G.cx, y: G.cy }; },
  },
  {
    id: "volcano", name: "Mozzarella Volcano", rar: "epic", ico: "🌋", unit: "rumbles", base: 3, bg: ["#ffd6b0", "#ff9a7a"],
    blurb: "Tickle the volcano until it ERUPTS with melty cheese — then catch the toppings raining down!",
    ups: [["tap", "Volcano Tickle", "🪶"], ["auto", "Lava Duck", "🦆"], ["mult", "Extra Cheesy Lava", "🧀"]],
    win: ["The volcano burped cheese. Everyone cheered.", "It's raining olives! Hallelujah!", "Scientists say the volcano is 'just really excited'.", "The cheese lava made the world's biggest pizza.", "The volcano has a fan club. It's mostly ducks.", "Mozzarella eruption seen from space!", "The volcano now erupts only for you.", "You caught a topping from every country in the world.", "Volcano Whisperer!"],
    init(G) { Object.assign(G.s, { pr: 0, erupt: 0, tops: [], spawn: 0, caught: 0, booms: 0 }); },
    down(G, x, y) { const s = G.s;
      if (s.erupt > 0) { const t = s.tops.find((t) => !t.got && dist(x, y, t.x, t.y) < G.u * 9); if (t) { t.got = 0.4; s.caught++; const duck = t.e === "🦆"; G.add(duck ? 12 : 3, t.x, t.y, { color: duck ? "#ffd23f" : "#fff" }); duck ? (SFX.squeak(), G.say("A DUCK?!", t.x, t.y - G.u * 8, 0.8)) : SFX.pop(1.2); } else SFX.boop(); return; }
      s.pr += 6; G.add(1, G.cx, G.H * 0.4); SFX.rumble(); G.shake(0.6 + s.pr / 60);
      if (s.pr >= 100) { s.pr = 0; s.erupt = 6.5; s.booms++; SFX.boom(); G.flash("#fff1a0"); G.shake(3); G.float("ERUPTION!", G.cx, G.u * 18, "#ff5a5f", 1.6); } },
    update(G, dt) { const s = G.s, top = { x: G.cx, y: G.H * 0.42 };
      if (s.erupt > 0) { s.erupt -= dt; for (let i = 0; i < 3; i++) G.parts.push({ x: top.x + rnd(-G.u * 3, G.u * 3), y: top.y, vx: rnd(-1, 1) * G.u * 30, vy: -rnd(40, 90) * G.u, life: 1.2, max: 1.2, c: pick(["#ffd23f", "#ffe680", "#f5b52a"]), size: G.u * rnd(1.2, 2.4), grav: 1 });
        s.spawn -= dt; if (s.spawn <= 0) { s.spawn = rnd(0.18, 0.4); s.tops.push({ x: rnd(0.1, 0.9) * G.W, y: -G.u * 5, vy: rnd(18, 30) * G.u, e: Math.random() < 0.06 ? "🦆" : pick(["🍄", "🫒", "🍅", "🌶️", "🧀", "🥓", "🍍", "🌿"]), r: rnd(-1, 1) }); } }
      for (let i = s.tops.length - 1; i >= 0; i--) { const t = s.tops[i]; if (t.got) { t.got -= dt; t.y -= G.u * 40 * dt; if (t.got <= 0) s.tops.splice(i, 1); continue; } t.y += t.vy * dt; t.r += dt * 2; if (t.y > G.H + 20) s.tops.splice(i, 1); }
      s.pr = Math.max(0, s.pr - dt * 2); },
    autoTick(G) { if (G.s.erupt <= 0) G.s.pr = Math.min(99, G.s.pr + 3); },
    draw(G, g) { const s = G.s, vx = G.cx, vy = G.H * 0.42, w = Math.min(G.W * 0.45, G.u * 48);
      g.beginPath(); g.moveTo(vx - w, G.H * 0.92); g.lineTo(vx - w * 0.22, vy); g.lineTo(vx + w * 0.22, vy); g.lineTo(vx + w, G.H * 0.92); g.closePath(); g.fillStyle = "#c9894a"; g.fill(); g.strokeStyle = INK; g.lineWidth = 5; g.stroke();
      g.beginPath(); g.moveTo(vx - w * 0.24, vy); for (let i = 0; i <= 8; i++) g.lineTo(vx - w * 0.24 + (i / 8) * w * 0.48, vy + G.u * (3 + (i % 2) * 5 + Math.sin(G.t * 2 + i) * 1.5) * (1 + s.pr / 60)); g.lineTo(vx + w * 0.24, vy); g.closePath(); g.fillStyle = "#ffd23f"; g.fill(); g.stroke();
      face(g, vx, G.H * 0.65, G.u * 10, s.erupt > 0 ? "joy" : s.pr > 70 ? "wow" : s.pr > 0 ? "happy" : "sleep"); for (let i = 0; i < 3; i++) E(g, "💨", vx + Math.sin(G.t + i) * G.u * 6, vy - G.u * (8 + ((G.t * 10 + i * 9) % 25)), G.u * 7, 0, 0.6);
      g.fillStyle = "#8fdc6a"; g.fillRect(0, G.H * 0.92, G.W, G.H);
      for (const t of s.tops) E(g, t.e, t.x, t.y, G.u * 9, t.r, t.got ? t.got / 0.4 : 1);
      if (s.erupt > 0) txt(g, `Catch the toppings! ${Math.ceil(s.erupt)}s · 🍄 ${s.caught}`, G.cx, G.u * 6, G.u * 4.2, "#fff", { stroke: INK }); else { bar(g, G.cx - G.u * 24, G.u * 4, G.u * 48, G.u * 5, s.pr / 100, "#ff5a2a"); txt(g, "Tap the volcano to tickle it!", G.cx, G.u * 13, G.u * 3.6, INK); } },
    hot(G) { const s = G.s; if (s.erupt > 0) { const t = s.tops.find((t) => !t.got && t.y > 0); if (t) return { x: t.x, y: t.y }; } return { x: G.cx, y: G.H * 0.6 }; },
  },
  {
    id: "conveyor", name: "Conveyor Belt Chaos", rar: "epic", ico: "🏭", unit: "toppings", base: 3, bg: ["#e8f4ff", "#c8dcf0"],
    blurb: "Grab the toppings on the order ticket, in order! Don't put the shoe on the pizza. (Or do. It's funny.)",
    ups: [["tap", "Grabby Gloves", "🧤"], ["auto", "Order Elf", "🧝"], ["crit", "Happy Customer", "😋"]],
    win: ["Order up!", "Customers say your pizzas are 'shoe-free and delicious'.", "The belt is going SO fast. You are going faster.", "The factory gave you a gold hairnet.", "You found 100 socks on the belt. Where are they coming from?!", "Pizza Factory Employee of the Century!", "The belt broke the speed of sound. Pizzas still perfect.", "Robots ask YOU for help now.", "Conveyor Belt Legend. The belt bows to you."],
    init(G) { Object.assign(G.s, { items: [], spawn: 0, order: [], idx: 0, placed: [], served: 0, speed: 1, cheer: 0 }); this.newOrder(G); for (let i = 0; i < 6; i++) this.addItem(G, G.W * (i / 6)); },
    TOPS: ["🍄", "🫒", "🍅", "🌶️", "🧀", "🥓", "🍍", "🧅"], JUNK: ["👟", "🧦", "📱", "🦆", "🧸", "🔑"],
    newOrder(G) { const s = G.s, n = Math.min(5, 3 + Math.floor(s.served / 3)); s.order = Array.from({ length: n }, () => pick(this.TOPS)); s.idx = 0; s.placed = []; },
    addItem(G, x = -G.u * 8) { const s = G.s, need = s.order[s.idx], r = Math.random(); s.items.push({ x, e: r < 0.45 && need ? need : r < 0.75 ? pick(this.TOPS) : pick(this.JUNK), hop: 0 }); },
    beltY(G) { return G.H * 0.55; },
    down(G, x, y) { const s = G.s, by = this.beltY(G); const it = s.items.find((i) => !i.hop && dist(x, y, i.x, by) < G.u * 9); if (!it) { SFX.boop(); return; }
      if (it.e === s.order[s.idx]) { it.hop = 0.01; s.idx++; s.placed.push(it.e); G.add(2, it.x, by - G.u * 8); SFX.pop(1.1);
        if (s.idx >= s.order.length) { s.served++; s.cheer = 1.5; s.speed = Math.min(2.6, s.speed + 0.12); G.add(12, G.W * 0.8, G.H * 0.8, { color: "#ffd23f" }); SFX.win(); G.say(pick(["Mmm! Perfect!", "Exactly what I ordered!", "Bravo!", "5 stars!"]), G.W * 0.8, G.H * 0.72, 1.4); setTimeout(() => this.newOrder(G), 700); } }
      else if (this.JUNK.includes(it.e)) { it.hop = 0.01; it.junk = true; G.add(1, it.x, by - G.u * 8, { quiet: true }); SFX.boing(); G.say(pick([`EW! A ${it.e}!`, "That's not a topping!", "Into the bin!", "Who ordered THAT?!"]), it.x, by - G.u * 10, 1); }
      else { SFX.error(); G.say(`Not yet! Find ${s.order[s.idx]}`, it.x, by - G.u * 10, 0.9); } },
    update(G, dt) { const s = G.s; s.cheer = Math.max(0, s.cheer - dt); s.spawn -= dt; if (s.spawn <= 0) { s.spawn = 0.75 / s.speed; this.addItem(G); }
      for (let i = s.items.length - 1; i >= 0; i--) { const it = s.items[i]; if (it.hop) { it.hop += dt * 2.2; if (it.hop >= 1) s.items.splice(i, 1); continue; } it.x += G.u * 16 * s.speed * dt; if (it.x > G.W + G.u * 10) s.items.splice(i, 1); } },
    autoTick(G) { const s = G.s, it = s.items.find((i) => !i.hop && i.e === s.order[s.idx]); if (it) this.down(G, it.x, this.beltY(G)); },
    draw(G, g) { const s = G.s, by = this.beltY(G); rr(g, -10, by - G.u * 5, G.W + 20, G.u * 10, G.u * 3, "#6b6f80"); g.fillStyle = "#8a90a2"; for (let x = -((G.t * G.u * 16 * s.speed) % (G.u * 8)); x < G.W; x += G.u * 8) g.fillRect(x + G.W * 0, by - G.u * 4, G.u * 1.2, G.u * 8);
      for (const it of s.items) { const k = it.hop; if (!k) E(g, it.e, it.x, by - G.u * 6, G.u * 10); else { const tx = it.junk ? G.u * 8 : G.W * 0.8, ty = it.junk ? G.H * 0.9 : G.H * 0.8; E(g, it.e, it.x + (tx - it.x) * k, by - G.u * 6 + (ty - by) * k - Math.sin(k * Math.PI) * G.u * 20, G.u * 10, k * 6, 1 - k * 0.3); } }
      rr(g, G.u * 4, G.u * 4, Math.min(G.W * 0.6, G.u * 14 * s.order.length + G.u * 10), G.u * 16, G.u * 3, "#fffaf0"); txt(g, "ORDER:", G.u * 8, G.u * 9, G.u * 3, INK, { align: "left" }); s.order.forEach((e, i) => { E(g, e, G.u * 12 + i * G.u * 12, G.u * 15, G.u * 9, 0, i < s.idx ? 0.3 : 1); if (i < s.idx) txt(g, "✓", G.u * 12 + i * G.u * 12, G.u * 15, G.u * 7, "#4dbb5a"); if (i === s.idx) circ(g, G.u * 12 + i * G.u * 12, G.u * 15, G.u * 6, null, "#ff5a5f", 3); });
      pizza(g, G.W * 0.8, G.H * 0.82, G.u * 13, { peps: 0 }); s.placed.forEach((e, i) => E(g, e, G.W * 0.8 + Math.cos(i * 2.1) * G.u * 6, G.H * 0.82 + Math.sin(i * 2.1) * G.u * 6, G.u * 7));
      E(g, "🗑️", G.u * 8, G.H * 0.9, G.u * 12); E(g, s.cheer > 0 ? "🤩" : "🙂", G.W * 0.8, G.H * 0.62, G.u * 12); txt(g, `🍕 ${s.served} served`, G.W * 0.5, G.H - G.u * 6, G.u * 3.8, INK); },
    hot(G) { const s = G.s, it = s.items.find((i) => !i.hop && i.e === s.order[s.idx] && i.x > 0 && i.x < G.W); return it ? { x: it.x, y: this.beltY(G) } : { x: G.cx, y: this.beltY(G) }; },
  },
];
