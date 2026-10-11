// ==========================================================================
//  Emmy's Pizza Plus — clicker games, part 5: gardens, pets & puddles.
//  Common, Uncommon and Shiny games — gentle, silly, and very tappable.
// ==========================================================================
import { E, circ, oval, rr, txt, bar, face, pizza, slice, rnd, pick, clamp, dist, INK } from "./clicker.js";
import { SFX } from "./audio.js";

const RAINBOW = ["#ff5d8f", "#ffb347", "#ffe066", "#7cffb0", "#6ec6ff", "#b18cff"];
const lerp = (a, b, t) => a + (b - a) * t;
const cloud = (g, x, y, s, c = "#fff") => { for (const [dx, dy, r] of [[-1, 0.2, 0.7], [0, 0, 1], [1, 0.2, 0.75], [0.5, -0.45, 0.6], [-0.5, -0.35, 0.55]]) circ(g, x + dx * s, y + dy * s, s * r, c, null); };
const rainbowArc = (g, x, y, r, w, a = 1) => { g.save(); g.globalAlpha *= a; g.lineWidth = w; for (let i = 0; i < 6; i++) { g.strokeStyle = RAINBOW[i]; g.beginPath(); g.arc(x, y, Math.max(1, r - i * w), Math.PI, 0); g.stroke(); } g.restore(); };
const stick = (g, x1, y1, x2, y2, w, c) => { g.lineCap = "round"; g.strokeStyle = INK; g.lineWidth = w + 4; g.beginPath(); g.moveTo(x1, y1); g.lineTo(x2, y2); g.stroke(); g.strokeStyle = c; g.lineWidth = w; g.stroke(); };
const fit = (G, g, s, y, size) => { g.font = `900 ${size}px system-ui, -apple-system, "Segoe UI", sans-serif`; const w = g.measureText(s).width, max = G.W * 0.94; txt(g, s, G.cx, y, w > max ? size * (max / w) : size, "#fff", { stroke: INK }); };
const hint = (G, g, s) => fit(G, g, s, G.u * 7, G.u * 3.8);

export const GAMES_E = [
  // ------------------------------------------------------------------------
  //  COMMON
  // ------------------------------------------------------------------------
  {
    id: "basil", name: "Basil Garden", rar: "common", ico: "🌿", unit: "leaves", base: 1, bg: ["#e6f8d6", "#bfe8a8"],
    blurb: "Tap a little pot to water its basil sprout. It grows, wiggles and sprouts leaves! A fully grown plant hops into your basket.",
    ups: [["tap", "Bigger Watering Can", "🚿"], ["auto", "Busy Water Bees", "🐝"], ["mult", "Magic Plant Food", "✨"]],
    win: ["Your first basil! It smells like pizza already.", "The pots are smiling SO big.", "A bee gave you a thumbs up. Bees have thumbs now.", "Your garden is the greenest in Pizza Town!", "Grandma made pesto and did a happy dance.", "The basil grew so tall it waved at a bird.", "Chefs come from far away just to smell your garden.", "You're the Basil Boss!", "Queen of the Green! Every pizza thanks you."],
    init(G) { Object.assign(G.s, { p: [0.15, 0.4, 0.05, 0.28].map((v) => ({ g: v, wig: 0 })), can: { x: G.cx, y: G.H * 0.3, tx: G.cx, ty: G.H * 0.3, pour: 0 }, drops: [], fly: [], basket: 0, picked: 0, parties: 0 }); },
    pot(G, i) { const w = Math.min(G.W * 0.94, G.u * 130), cw = w / 4; return { x: G.cx - w / 2 + (i + 0.5) * cw, y: G.H * 0.72, r: Math.min(cw * 0.3, G.u * 10), cw }; },
    top(G, i) { const P = this.pot(G, i); return P.y - P.r * 0.85 - P.r * (0.4 + G.s.p[i].g * 2.4); },
    bk(G) { return { x: G.W - Math.max(G.u * 12, G.W * 0.1), y: G.H * 0.2 }; },
    water(G, i) { const s = G.s, p = s.p[i], P = this.pot(G, i), top = this.top(G, i), cs = G.u * 9;
      s.can.tx = Math.max(cs * 0.7, P.x - cs * 1.2); s.can.ty = Math.max(G.u * 18, top - P.r * 0.6); s.can.pour = 0.45;
      for (let k = 0; k < 6; k++) s.drops.push({ x: P.x + rnd(-P.r * 0.4, P.r * 0.4), y: s.can.ty + cs * 0.3 + rnd(0, P.r * 0.5), vy: rnd(0, G.u * 20), y1: P.y - P.r * 0.85 });
      p.g = Math.min(1, p.g + 0.13); p.wig = 1; G.add(1, P.x, top); G.tone(rnd(700, 900), 0.06, { type: "sine", vol: 0.08, slideTo: 500 });
      if (p.g >= 1) { s.fly.push({ sx: P.x, sy: top, t: 0 }); p.g = 0.02; s.picked++; G.add(8, P.x, top, { color: "#7be07b" }); SFX.ding(); G.burst(P.x, top, ["🌿", "✨"], 6); } },
    down(G, x, y) { for (let i = 0; i < 4; i++) { const P = this.pot(G, i); if (Math.abs(x - P.x) < P.cw / 2 && y > G.H * 0.22) { this.water(G, i); return; } } SFX.boop(); },
    update(G, dt) { const s = G.s, c = s.can, b = this.bk(G); c.x += (c.tx - c.x) * Math.min(1, dt * 10); c.y += (c.ty - c.y) * Math.min(1, dt * 10); c.pour = Math.max(0, c.pour - dt);
      for (const p of s.p) p.wig = Math.max(0, p.wig - dt * 1.5);
      for (let i = s.drops.length - 1; i >= 0; i--) { const d = s.drops[i]; d.vy += G.u * 200 * dt; d.y += d.vy * dt; if (d.y > d.y1) s.drops.splice(i, 1); }
      for (let i = s.fly.length - 1; i >= 0; i--) { const f = s.fly[i]; f.t += dt * 1.4; if (f.t >= 1) { s.fly.splice(i, 1); s.basket++; SFX.pop(1.3);
        if (s.basket >= 6) { s.basket = 0; s.parties++; G.add(25, b.x, b.y, { color: "#ffd23f", noCrit: true }); SFX.win(); G.burst(b.x, b.y, ["🌿", "🍕", "✨"], 14); G.float("🌿 PESTO PARTY! 🌿", G.cx, G.u * 22, "#4dbb5a", 1.2); } } } },
    autoTick(G) { const s = G.s; let i = 0; s.p.forEach((p, k) => { if (p.g < s.p[i].g) i = k; }); this.water(G, i); const P = this.pot(G, i); G.burst(P.x, this.top(G, i), "🐝", 1, { size: 0.6, grav: -0.3 }); },
    leaf(g, x, y, sz, rot) { oval(g, x, y, sz, sz * 0.5, "#5cc45a", "#2f6b2c", 2, rot); g.strokeStyle = "#2f6b2c"; g.lineWidth = 1.5; g.beginPath(); g.moveTo(x - Math.cos(rot) * sz * 0.7, y - Math.sin(rot) * sz * 0.7); g.lineTo(x + Math.cos(rot) * sz * 0.7, y + Math.sin(rot) * sz * 0.7); g.stroke(); },
    draw(G, g) { const s = G.s, b = this.bk(G), P0 = this.pot(G, 0);
      E(g, "🌞", G.u * 10, G.u * 18, G.u * 11, Math.sin(G.t) * 0.1);
      rr(g, -10, P0.y + P0.r * 0.4, G.W + 20, G.H, 0, "#a8744a", INK, 3); for (let i = 0; i < 14; i++) circ(g, (i * 97.3) % G.W, P0.y + P0.r * (1.2 + (i % 3) * 0.5), G.u * 0.8, "#8a5a36", null);
      for (let i = 0; i < 4; i++) { const p = s.p[i], P = this.pot(G, i), r = P.r, soil = P.y - r * 0.85, h = r * (0.4 + p.g * 2.4), sway = Math.sin(G.t * 18) * p.wig * 0.22 + Math.sin(G.t * 1.5 + i) * 0.05;
        g.beginPath(); g.moveTo(P.x - r * 1.1, P.y - r * 0.7); g.lineTo(P.x + r * 1.1, P.y - r * 0.7); g.lineTo(P.x + r * 0.82, P.y + r * 0.85); g.lineTo(P.x - r * 0.82, P.y + r * 0.85); g.closePath(); g.fillStyle = "#d9774a"; g.fill(); g.strokeStyle = INK; g.lineWidth = 3; g.stroke();
        rr(g, P.x - r * 1.28, P.y - r * 0.98, r * 2.56, r * 0.36, r * 0.1, "#e88a5a"); oval(g, P.x, soil, r * 1.05, r * 0.12, "#6b4226", null);
        face(g, P.x, P.y + r * 0.12, r * 0.5, p.wig > 0.3 ? "joy" : p.g >= 0.85 ? "wow" : "happy");
        g.save(); g.translate(P.x, soil); g.rotate(sway); g.strokeStyle = "#3f8f3a"; g.lineWidth = Math.max(2, r * 0.12); g.lineCap = "round"; g.beginPath(); g.moveTo(0, 0); g.quadraticCurveTo(r * 0.15, -h * 0.5, 0, -h); g.stroke();
        const L = 1 + Math.floor(p.g * 6), ls = r * (0.22 + p.g * 0.22);
        for (let k = 0; k < L; k++) { const f = (k + 1) / (L + 1), sd = k % 2 ? 1 : -1; this.leaf(g, sd * ls * 0.85, -h * f, ls, sd * -0.45); }
        this.leaf(g, -ls * 0.5, -h - ls * 0.15, ls * 0.8, 0.9); this.leaf(g, ls * 0.5, -h - ls * 0.15, ls * 0.8, -0.9); this.leaf(g, 0, -h - ls * 0.55, ls * 0.75, Math.PI / 2);
        g.restore();
        if (p.g >= 0.85) E(g, "✨", P.x + r * 0.9, this.top(G, i) - r * 0.3, G.u * 4, 0, 0.5 + Math.sin(G.t * 6 + i) * 0.5);
        bar(g, P.x - r, P.y + r * 1.05, r * 2, G.u * 2.6, p.g, "#5cc45a"); }
      for (const d of s.drops) oval(g, d.x, d.y, G.u * 0.6, G.u * 1.1, "#6ec6ff", null);
      const c = s.can, cs = G.u * 9; g.save(); g.translate(c.x, c.y); g.rotate(c.pour > 0 ? 0.85 : Math.sin(G.t * 2) * 0.05);
      g.lineCap = "round"; g.strokeStyle = INK; g.lineWidth = cs * 0.2; g.beginPath(); g.arc(-cs * 0.05, -cs * 0.5, cs * 0.42, Math.PI, 0); g.stroke(); g.strokeStyle = "#4aa8e8"; g.lineWidth = cs * 0.11; g.stroke();
      stick(g, cs * 0.45, cs * 0.2, cs * 1.15, -cs * 0.45, cs * 0.12, "#6ec6ff"); circ(g, cs * 1.15, -cs * 0.45, cs * 0.17, "#6ec6ff");
      rr(g, -cs * 0.6, -cs * 0.5, cs * 1.2, cs * 1.0, cs * 0.25, "#6ec6ff"); E(g, "💧", 0, 0, cs * 0.5); g.restore();
      for (const f of s.fly) E(g, "🌿", lerp(f.sx, b.x, f.t), lerp(f.sy, b.y, f.t) - Math.sin(f.t * Math.PI) * G.u * 18, G.u * 7, f.t * 6);
      E(g, "🧺", b.x, b.y, G.u * 13); txt(g, `${s.basket}/6`, b.x, b.y + G.u * 9, G.u * 3.6, "#fff", { stroke: INK });
      hint(G, g, `🌿 Basil picked: ${s.picked} · pesto parties: ${s.parties}`); },
    hot(G) { const s = G.s; let i = 0; s.p.forEach((p, k) => { if (p.g > s.p[i].g) i = k; }); const P = this.pot(G, i); return { x: P.x, y: P.y }; },
  },
  {
    id: "fizz", name: "Fizzy Soda Shake", rar: "common", ico: "🥤", unit: "fizzes", base: 1, bg: ["#fff0f8", "#ffd6ec"],
    blurb: "Tap the soda bottle (or wiggle your finger on it) to shake it up! When the fizz meter is full the cap goes POP and a sparkly soda fountain fills the cups.",
    ups: [["tap", "Super Shake", "👐"], ["auto", "Shaky Monkeys", "🐒"], ["crit", "Extra Bubbly", "🫧"]],
    win: ["POP! That cap flew to the moon!", "The cups are doing a happy fizzy dance.", "Your soda is SO bubbly it giggles.", "The ceiling has a soda rainbow now.", "The monkeys want to shake with you forever.", "You invented Pizza Pop flavour!", "Fizz from the soda shop wants your autograph.", "Bubbles everywhere! Even in your socks!", "Grand Fizz Wizard of Pizza Town!"],
    FLAV: [["Strawberry", "#ff6fa8"], ["Lime", "#7cd36b"], ["Orange", "#ffa53a"], ["Grape", "#a77cff"], ["Blue Razz", "#4fb6ff"]],
    init(G) { Object.assign(G.s, { m: 0, wob: 0, fount: 0, cap: null, fl: 0, lvl: 0.75, bub: [], jets: [], jt: 0, cups: [0, 0, 0, 0], glow: [0, 0, 0, 0], drag: 0, pops: 0, full: 0 }); },
    bot(G) { const h = Math.min(G.H * 0.44, G.u * 48); return { x: G.cx, y: G.H * 0.47, h, w: h * 0.4 }; },
    cup(G, i) { const b = this.bot(G), w = Math.min(b.w * 0.8, G.u * 11, G.W * 0.13), o = [-2.7, -1.5, 1.5, 2.7][i]; return { x: clamp(G.cx + o * b.w, w * 0.7, G.W - w * 0.7), y: b.y + b.h * 0.5, w }; },
    col(G) { return this.FLAV[G.s.fl][1]; },
    shakeIt(G, x, y) { const s = G.s, b = this.bot(G); if (s.fount > 0) return; s.m = Math.min(1, s.m + 0.08); s.wob = 1; G.add(1, x ?? b.x, y ?? b.y - b.h * 0.3); G.tone(rnd(500, 800) + s.m * 700, 0.05, { type: "sine", vol: 0.07 });
      for (let k = 0; k < 3; k++) s.bub.push({ x: rnd(-0.38, 0.38), y: rnd(0.2, 0.48), r: rnd(0.025, 0.05), v: rnd(0.25, 0.6) });
      if (s.m >= 1) { s.m = 0; s.fount = 3.2; s.pops++; s.cap = { x: b.x, y: b.y - b.h * 0.53, vx: rnd(-1, 1) * G.u * 25, vy: -G.u * 140, rot: 0 }; SFX.pop(0.7); SFX.fizz(); G.flash("#fff"); G.burst(b.x, b.y - b.h * 0.5, ["✨", "🫧"], 10); G.float(`POP! ${this.FLAV[s.fl][0]}!`, G.cx, G.u * 22, this.col(G), 1.2); } },
    down(G, x, y) { const s = G.s, b = this.bot(G);
      if (s.fount > 0) { G.add(1, x, y); G.burst(x, y, "🫧", 2, { size: 0.6, grav: -0.3 }); G.tone(rnd(1200, 1800), 0.05, { type: "sine", vol: 0.06 }); return; }
      if (Math.abs(x - b.x) < b.w * 1.3 && Math.abs(y - b.y) < b.h * 0.65) this.shakeIt(G, x, y); else SFX.boop(); },
    move(G, x, y, ox, oy) { const s = G.s, b = this.bot(G); if (!G.down || s.fount > 0 || Math.abs(x - b.x) > b.w * 1.5) return; s.drag += dist(x, y, ox, oy); while (s.drag > G.u * 7) { s.drag -= G.u * 7; this.shakeIt(G, x, y); } },
    up(G) { G.s.drag = 0; },
    update(G, dt) { const s = G.s, b = this.bot(G), top = s.lvl; s.wob = Math.max(0, s.wob - dt * 2.5);
      if (Math.random() < s.m * 0.5) s.bub.push({ x: rnd(-0.38, 0.38), y: 0.48, r: rnd(0.015, 0.035), v: rnd(0.2, 0.5) });
      for (let i = s.bub.length - 1; i >= 0; i--) { const q = s.bub[i]; q.y -= q.v * dt; q.x += Math.sin(G.t * 8 + i) * 0.002; if (q.y < 0.5 - top || s.bub.length > 60) s.bub.splice(i, 1); }
      if (s.cap) { s.cap.vy += G.u * 140 * dt; s.cap.x += s.cap.vx * dt; s.cap.y += s.cap.vy * dt; s.cap.rot += dt * 14; }
      if (s.fount > 0) { s.fount -= dt; s.lvl = Math.max(0.3, s.lvl - dt * 0.12); const c = this.col(G), my = b.y - b.h * 0.5;
        for (let k = 0; k < 2; k++) G.parts.push({ x: b.x + rnd(-1, 1) * G.u, y: my, vx: rnd(-1, 1) * G.u * 14, vy: -G.u * rnd(60, 95), life: 0.6, max: 0.6, c: pick([c, "#fff", c]), size: G.u * rnd(0.8, 1.6), grav: 1 });
        if ((s.jt -= dt) <= 0) { s.jt = 0.06; s.jets.push({ t: 0, i: Math.floor(rnd(0, 4)), c }); }
        if (s.fount <= 0) { s.cap = null; SFX.pop(1.5); s.fl = (s.fl + 1) % this.FLAV.length; } }
      else s.lvl = Math.min(0.75, s.lvl + dt * 0.3);
      for (let i = s.jets.length - 1; i >= 0; i--) { const j = s.jets[i]; j.t += dt * 1.3; if (j.t >= 1) { s.jets.splice(i, 1); s.cups[j.i] += 0.08;
        if (s.cups[j.i] >= 1) { const cp = this.cup(G, j.i); s.cups[j.i] = 0; s.glow[j.i] = 0.8; s.full++; G.add(5, cp.x, cp.y - cp.w * 1.4, { color: "#ffd23f" }); G.burst(cp.x, cp.y - cp.w, "✨", 4, { size: 0.7 }); G.tone(1320, 0.1, { type: "triangle", vol: 0.1 }); } } }
      for (let i = 0; i < 4; i++) s.glow[i] = Math.max(0, s.glow[i] - dt); },
    autoTick(G) { const b = this.bot(G); this.shakeIt(G, b.x, b.y - b.h * 0.3); },
    draw(G, g) { const s = G.s, b = this.bot(G), { h, w } = b, nw = w * 0.2, c = this.col(G);
      for (const j of s.jets) { const cp = this.cup(G, j.i), x = lerp(b.x, cp.x, j.t), y = lerp(b.y - h * 0.52, cp.y - cp.w * 1.1, j.t) - Math.sin(j.t * Math.PI) * G.H * 0.2; circ(g, x, y, G.u * 1.3, j.c, null); circ(g, x - G.u * 0.4, y - G.u * 0.4, G.u * 0.4, "#fff", null); }
      for (let i = 0; i < 4; i++) { const cp = this.cup(G, i), cw = cp.w, ch = cw * 1.25, x = cp.x, y = cp.y;
        const path = () => { g.beginPath(); g.moveTo(x - cw * 0.5, y - ch); g.lineTo(x + cw * 0.5, y - ch); g.lineTo(x + cw * 0.38, y); g.lineTo(x - cw * 0.38, y); g.closePath(); };
        path(); g.fillStyle = "#fff"; g.fill(); g.save(); path(); g.clip(); g.fillStyle = c; g.fillRect(x - cw, y - ch * s.cups[i], cw * 2, ch); for (let k = 0; k < 3; k++) { g.fillStyle = "rgba(255,93,143,.25)"; g.fillRect(x - cw + k * cw * 0.7, y - ch, cw * 0.25, ch); } g.restore();
        path(); g.strokeStyle = INK; g.lineWidth = 3; g.stroke(); stick(g, x + cw * 0.15, y - ch, x + cw * 0.35, y - ch * 1.45, cw * 0.08, "#ff5d8f");
        face(g, x, y - ch * 0.45, cw * 0.32, s.glow[i] > 0 ? "joy" : "happy"); if (s.glow[i] > 0) circ(g, x, y - ch * 0.5, cw * (0.8 + s.glow[i]), null, "rgba(255,210,63,.8)", 4); }
      g.save(); g.translate(b.x + Math.sin(G.t * 40) * s.wob * G.u * 1.5, b.y); g.rotate(Math.sin(G.t * 28) * s.wob * 0.12);
      const shape = () => { g.beginPath(); g.moveTo(-nw, -h * 0.5); g.lineTo(nw, -h * 0.5); g.lineTo(nw, -h * 0.3); g.quadraticCurveTo(w / 2, -h * 0.24, w / 2, -h * 0.05); g.lineTo(w / 2, h * 0.42); g.quadraticCurveTo(w / 2, h * 0.5, w * 0.4, h * 0.5); g.lineTo(-w * 0.4, h * 0.5); g.quadraticCurveTo(-w / 2, h * 0.5, -w / 2, h * 0.42); g.lineTo(-w / 2, -h * 0.05); g.quadraticCurveTo(-w / 2, -h * 0.24, -nw, -h * 0.3); g.closePath(); };
      shape(); g.fillStyle = "rgba(225,250,255,.7)"; g.fill(); g.save(); shape(); g.clip(); const ly = h * (0.5 - s.lvl);
      g.fillStyle = c; g.beginPath(); g.moveTo(-w, h); g.lineTo(-w, ly); for (let i = 0; i <= 10; i++) g.lineTo(-w + i * w * 0.2, ly + Math.sin(G.t * 9 + i) * h * 0.01 * (1 + s.wob * 3)); g.lineTo(w, h); g.fill();
      for (const q of s.bub) circ(g, q.x * w, q.y * h, q.r * h, "rgba(255,255,255,.75)", null); g.restore();
      shape(); g.strokeStyle = INK; g.lineWidth = 4; g.stroke(); oval(g, -w * 0.28, -h * 0.02, w * 0.06, h * 0.12, "rgba(255,255,255,.8)", null);
      rr(g, -w / 2, h * 0.08, w, h * 0.17, 4, "#fff"); txt(g, "FIZZ", 0, h * 0.165, h * 0.1, c, { stroke: INK });
      if (!s.cap) { rr(g, -nw * 1.3, -h * 0.57, nw * 2.6, h * 0.08, 4, "#ff4d6d"); for (let k = -2; k <= 2; k++) { g.strokeStyle = "#b8203d"; g.lineWidth = 2; g.beginPath(); g.moveTo(k * nw * 0.45, -h * 0.56); g.lineTo(k * nw * 0.45, -h * 0.5); g.stroke(); } }
      g.restore();
      if (s.cap && s.cap.y < G.H + G.u * 10) { g.save(); g.translate(s.cap.x, s.cap.y); g.rotate(s.cap.rot); rr(g, -nw * 1.3, -h * 0.04, nw * 2.6, h * 0.08, 4, "#ff4d6d"); g.restore(); }
      if (s.fount > 0) hint(G, g, `🫧 Soda fountain! Tap for bubbles! · pops: ${s.pops}`);
      else { bar(g, G.cx - G.u * 24, G.u * 4, G.u * 48, G.u * 5, s.m, c); fit(G, g, `🥤 Shake it up! · pops: ${s.pops} · cups: ${s.full}`, G.u * 13, G.u * 3.6); } },
    hot(G) { const b = this.bot(G); return { x: b.x, y: b.y }; },
  },
  {
    id: "chickfeed", name: "Chicken Snack Time", rar: "common", ico: "🐔", unit: "pecks", base: 1, bg: ["#cdefff", "#eaf8ff"], noDots: true,
    blurb: "Tap the yard to toss corn! The happy chickens run over and peck it up. Feed EVERY chicken until they're full and they do a little chicken dance.",
    ups: [["tap", "Bigger Corn Scoop", "🌽"], ["auto", "Farmer Bunnies", "🐰"], ["mult", "Golden Corn", "⭐"]],
    win: ["Bawk! The chickens say thank you!", "The rooster learned a new dance move.", "Your chickens are the happiest in Pizza Town.", "The chickens made you a feather crown.", "Corn everywhere! The chickens are thrilled.", "The chickens started a dance club. You're the DJ.", "A chicken laid a heart-shaped egg for you!", "The flock sings your name every morning. Bawk-bawk!", "Supreme Chicken Snack Champion!"],
    init(G) { const s = G.s; Object.assign(s, { ch: [], corn: [], dance: 0, dances: 0, pecks: 0 }); for (let i = 0; i < 5; i++) s.ch.push({ x: rnd(0.15, 0.85) * G.W, y: rnd(0.5, 0.8) * G.H, dir: pick([-1, 1]), full: 0, peck: 0, tgt: null, wt: rnd(0, 2), tx: null, ty: null, ph: rnd(0, 6), pet: 0, walk: false, e: i === 0 ? "🐓" : "🐔" }); },
    cs(G) { return Math.min(G.u * 11, G.W * 0.13); },
    hy(G) { return G.H * 0.36; },
    toss(G, x, y, n = 3) { const s = G.s; y = clamp(y, G.H * 0.44, G.H * 0.84); x = clamp(x, G.u * 6, G.W - G.u * 6); for (let k = 0; k < n; k++) s.corn.push({ sx: G.u * 10, sy: G.H - G.u * 12, tx: clamp(x + rnd(-1, 1) * G.u * 6, G.u * 4, G.W - G.u * 4), ty: y + rnd(-1, 1) * G.u * 4, t: 0, land: false, by: null, gone: false, age: 0 }); if (s.corn.length > 45) s.corn.splice(0, s.corn.length - 45); G.tone(rnd(600, 800), 0.06, { type: "triangle", vol: 0.06, slideTo: 1000 }); },
    eat(G, c) { const s = G.s, k = c.tgt; k.gone = true; c.tgt = null; c.full++; s.pecks++; c.peck = 0.35; G.add(1, c.x, c.y - this.cs(G) * 0.7); G.tone(1300, 0.03, { type: "square", vol: 0.04 }); G.tone(1300, 0.03, { type: "square", vol: 0.04, when: 0.1 });
      if (c.full >= 3) { G.burst(c.x, c.y - this.cs(G) * 0.6, "💛", 3, { size: 0.6, grav: -0.4 }); SFX.bawk(); }
      if (s.ch.every((q) => q.full >= 3)) { s.dance = 3.5; s.dances++; G.add(25, G.cx, G.H * 0.4, { color: "#ffd23f", noCrit: true }); SFX.win(); G.float("🐔 CHICKEN DANCE! 🐔", G.cx, G.u * 22, "#ff9800", 1.3); for (const q of s.ch) q.tgt = null; s.corn.forEach((k) => (k.by = null)); } },
    down(G, x, y) { const s = G.s, cs = this.cs(G);
      for (const c of s.ch) if (dist(x, y, c.x, c.y - cs * 0.3) < cs * 0.55) { c.pet = 0.6; G.add(1, x, y, { color: "#ffb3c8" }); SFX.bawk(); G.burst(c.x, c.y - cs * 0.6, "💕", 2, { size: 0.6, grav: -0.4 }); return; }
      if (s.dance > 0) { G.add(1, x, y); G.burst(x, y, "🎵", 2, { size: 0.7, grav: -0.3 }); return; }
      this.toss(G, x, y); },
    update(G, dt) { const s = G.s, cs = this.cs(G);
      for (const k of s.corn) { if (!k.land) { k.t += dt * 2.2; if (k.t >= 1) k.land = true; } else if ((k.age += dt) > 14) k.gone = true; }
      if (s.dance > 0 && (s.dance -= dt) <= 0) { for (const c of s.ch) c.full = 0; G.float("Hungry again! Bawk!", G.cx, G.u * 22, "#fff", 1); }
      for (const c of s.ch) { c.ph += dt; c.peck = Math.max(0, c.peck - dt); c.pet = Math.max(0, c.pet - dt); c.x = clamp(c.x, cs * 0.5, G.W - cs * 0.5); c.y = clamp(c.y, G.H * 0.44, G.H * 0.86);
        if (s.dance > 0) { c.dir = Math.sin(G.t * 7 + c.ph) > 0 ? 1 : -1; continue; }
        if (c.tgt && c.tgt.gone) c.tgt = null;
        if (!c.tgt && c.full < 3) { let best = null, bd = 1e9; for (const k of s.corn) if (k.land && !k.by && !k.gone) { const d = dist(c.x, c.y, k.tx, k.ty); if (d < bd) { bd = d; best = k; } } if (best) { best.by = c; c.tgt = best; } }
        let tx, ty, sp; if (c.tgt) { tx = c.tgt.tx; ty = c.tgt.ty; sp = G.u * 42; } else { if ((c.wt -= dt) <= 0 || c.tx == null) { c.wt = rnd(1.5, 3.5); c.tx = rnd(0.1, 0.9) * G.W; c.ty = rnd(0.48, 0.85) * G.H; } tx = c.tx; ty = c.ty; sp = G.u * 8; }
        const d = dist(c.x, c.y, tx, ty); c.walk = false;
        if (c.peck > 0) continue; if (d > G.u * 1.5) { const m = Math.min(d, sp * dt); c.x += ((tx - c.x) / d) * m; c.y += ((ty - c.y) / d) * m; if (Math.abs(tx - c.x) > 2) c.dir = tx > c.x ? 1 : -1; c.walk = true; } else if (c.tgt) this.eat(G, c); }
      s.corn = s.corn.filter((k) => !k.gone); },
    autoTick(G) { const h = G.s.ch.filter((c) => c.full < 3 && !c.tgt); const c = h.length ? pick(h) : pick(G.s.ch); this.toss(G, c.x + rnd(-8, 8) * G.u, c.y + rnd(-3, 3) * G.u, 2); },
    draw(G, g) { const s = G.s, cs = this.cs(G), hy = this.hy(G);
      E(g, "🌞", G.W - G.u * 10, G.u * 18, G.u * 11); cloud(g, G.W * 0.3 + Math.sin(G.t * 0.2) * G.u * 5, hy * 0.45, G.u * 5);
      rr(g, -10, hy, G.W + 20, G.H, 0, "#9fdc7c", null); for (let i = 0; i < 30; i++) { const x = (i * 83.7) % G.W, y = hy + G.u * 4 + ((i * 47.1) % (G.H - hy)); g.strokeStyle = "#7cc65a"; g.lineWidth = 2; g.beginPath(); g.moveTo(x, y); g.lineTo(x - G.u, y - G.u * 2); g.moveTo(x, y); g.lineTo(x + G.u, y - G.u * 2); g.stroke(); }
      const bx = G.W * 0.18, bw = Math.min(G.u * 26, G.W * 0.26), bh = bw * 0.7; rr(g, bx - bw / 2, hy - bh * 0.8, bw, bh * 0.8 + G.u * 2, 3, "#e0483e"); g.beginPath(); g.moveTo(bx - bw * 0.6, hy - bh * 0.78); g.lineTo(bx, hy - bh * 1.3); g.lineTo(bx + bw * 0.6, hy - bh * 0.78); g.closePath(); g.fillStyle = "#b8322b"; g.fill(); g.strokeStyle = INK; g.lineWidth = 3; g.stroke(); rr(g, bx - bw * 0.18, hy - bh * 0.45, bw * 0.36, bh * 0.45 + G.u * 2, 2, "#fff6e6");
      for (let x = G.W * 0.35; x < G.W; x += G.u * 8) rr(g, x, hy - G.u * 6, G.u * 2, G.u * 8, 2, "#fff6e6", INK, 2); rr(g, G.W * 0.33, hy - G.u * 4.5, G.W, G.u * 1.6, 2, "#fff6e6", INK, 2);
      for (const k of s.corn) { const x = k.land ? k.tx : lerp(k.sx, k.tx, k.t), y = k.land ? k.ty : lerp(k.sy, k.ty, k.t) - Math.sin(k.t * Math.PI) * G.u * 20; oval(g, x, y, G.u * 0.9, G.u * 1.2, "#ffd23f", "#c98a00", 1.5, k.tx); }
      for (const [i, c] of [...s.ch].map((c, i) => [i, c]).sort((a, b) => a[1].y - b[1].y)) {
        const hop = s.dance > 0 ? Math.abs(Math.sin(G.t * 10 + i)) * G.u * 5 : c.walk ? Math.abs(Math.sin(c.ph * 14)) * G.u * 1.2 : c.pet > 0 ? Math.abs(Math.sin(c.pet * 20)) * G.u * 2 : 0;
        const rot = c.peck > 0 ? c.dir * 0.5 * Math.sin((c.peck / 0.35) * Math.PI) : s.dance > 0 ? Math.sin(G.t * 10 + i) * 0.2 : 0;
        oval(g, c.x, c.y, cs * 0.35, cs * 0.1, "rgba(74,42,26,.15)", null); E(g, c.e, c.x, c.y - cs * 0.42 - hop, cs, rot, 1, -c.dir, 1);
        if (s.dance <= 0) for (let k = 0; k < 3; k++) E(g, k < c.full ? "💛" : "🤍", c.x + (k - 1) * G.u * 2.6, c.y - cs * 1.05, G.u * 2.4); }
      if (s.dance > 0) for (let i = 0; i < 3; i++) E(g, "🎵", G.W * (0.25 + i * 0.25), hy + G.u * 6 + Math.sin(G.t * 6 + i) * G.u * 2, G.u * 6);
      E(g, "🪣", G.u * 10, G.H - G.u * 12, G.u * 11); E(g, "🌽", G.u * 13, G.H - G.u * 17, G.u * 6, 0.4);
      hint(G, g, `🌽 Tap to toss corn! · pecks: ${s.pecks} · dances: ${s.dances}`); },
    hot(G) { const s = G.s, h = s.ch.filter((c) => c.full < 3); if (!h.length || s.dance > 0) return { x: G.cx, y: G.H * 0.6 }; const c = h[0], off = this.cs(G) * 1.2 * (c.x < G.cx ? 1 : -1); return { x: clamp(c.x + off, G.u * 6, G.W - G.u * 6), y: c.y }; },
  },

  // ------------------------------------------------------------------------
  //  UNCOMMON
  // ------------------------------------------------------------------------
  {
    id: "pizzaface", name: "Silly Pizza Faces", rar: "uncommon", ico: "😜", unit: "giggles", base: 1, bg: ["#fff4d6", "#ffd9a8"],
    blurb: "Tap the pizza to drop toppings and build a face! Pick a topping from the tray (or 🎲 for a mix). Finish the face and it comes ALIVE and giggles!",
    ups: [["tap", "Topping Tongs", "🥢"], ["auto", "Silly Chef", "👩‍🍳"], ["crit", "Giggle Fit", "🤣"]],
    win: ["Your pizza winked at you!", "That pizza laughed so hard its cheese wiggled.", "The Silly Face Album is getting thick!", "A pizza told you a joke. It was cheesy.", "Your pizzas started a comedy show.", "The olives can't stop giggling.", "Even sleepy Uncle Crust smiled!", "Pizza Town declared today Silly Face Day.", "The Funniest Pizza Artist in the World!"],
    SPOTS: [["eye", -0.33, -0.28], ["eye", 0.33, -0.28], ["nose", 0, 0.0], ["m", -0.38, 0.2], ["m", -0.2, 0.33], ["m", 0, 0.38], ["m", 0.2, 0.33], ["m", 0.38, 0.2], ["cheek", -0.6, 0.06], ["cheek", 0.6, 0.06]],
    SIZE: { eye: 0.14, nose: 0.13, m: 0.09, cheek: 0.1 },
    DEF: { eye: "olive", nose: "🍄", m: "pep", cheek: "🍅" },
    TRAY: ["mix", "pep", "olive", "🍄", "🍅", "🫑", "🍍"],
    SAY: ["HA HA HA! I'm so funny!", "*wink* Lookin' cheesy!", "Bleh! Hee hee!", "Wiggle wiggle wiggle!"],
    init(G) { Object.assign(G.s, { pl: [], sel: "mix", alive: 0, expr: 0, faces: 0, slide: 0, wait: 0, tick: 0 }); },
    piz(G) { const s = G.s; return { x: G.cx - (s.slide / 0.6) * G.W * 0.8, y: G.H * 0.45, R: Math.min(G.W * 0.36, G.H * 0.29) }; },
    tray(G, i) { const n = this.TRAY.length, bw = Math.min((G.W * 0.94) / n, G.u * 12); return { x: G.cx + (i - (n - 1) / 2) * bw, y: G.H * 0.84, r: bw * 0.42 }; },
    spot(G, k) { const p = this.piz(G), [, sx, sy] = this.SPOTS[k]; return { x: p.x + sx * p.R, y: p.y + sy * p.R }; },
    drawTop(g, top, x, y, sz, sy = 1) { g.save(); g.translate(x, y); g.scale(1, sy);
      if (top === "pep") { circ(g, 0, 0, sz, "#d8343a", "#9a1f24", Math.max(1.5, sz * 0.15)); circ(g, -sz * 0.3, -sz * 0.2, sz * 0.15, "#f2706f", null); circ(g, sz * 0.3, sz * 0.25, sz * 0.12, "#f2706f", null); }
      else if (top === "olive") { circ(g, 0, 0, sz, "#2b2b2b", INK, 2); circ(g, 0, 0, sz * 0.42, "#ffd23f", null); }
      else if (top === "mix") { E(g, "🎲", 0, 0, sz * 2); }
      else E(g, top, 0, 0, sz * 2.3);
      g.restore(); },
    place(G, x, y) { const s = G.s, empty = this.SPOTS.map((_, k) => k).filter((k) => !s.pl.some((q) => q.k === k)); if (!empty.length) return;
      let k = empty[0]; if (x != null) { let bd = 1e9; for (const e of empty) { const p = this.spot(G, e), d = dist(x, y, p.x, p.y); if (d < bd) { bd = d; k = e; } } }
      const type = this.SPOTS[k][0]; s.pl.push({ k, top: s.sel === "mix" ? this.DEF[type] : s.sel, t: 0 }); const p = this.spot(G, k); G.add(1, p.x, p.y); G.tone(rnd(300, 450), 0.09, { type: "sine", vol: 0.12, slideTo: 180 });
      if (s.pl.length === this.SPOTS.length) s.wait = 0.4; },
    down(G, x, y) { const s = G.s, p = this.piz(G);
      for (let i = 0; i < this.TRAY.length; i++) { const t = this.tray(G, i); if (dist(x, y, t.x, t.y) < t.r * 1.15) { s.sel = this.TRAY[i]; SFX.tap(); return; } }
      if (s.alive > 0) { if (dist(x, y, p.x, p.y) < p.R * 1.1) { s.tick = 0.4; G.add(2, x, y, { color: "#ffb3c8" }); SFX.giggle(); G.burst(x, y, ["💕", "😆"], 2, { size: 0.7, grav: -0.3 }); } return; }
      if (s.slide > 0 || s.wait > 0) return;
      if (dist(x, y, p.x, p.y) < p.R * 1.15) this.place(G, x, y); else SFX.boop(); },
    update(G, dt) { const s = G.s; s.tick = Math.max(0, s.tick - dt); s.slide = Math.max(0, s.slide - dt); for (const q of s.pl) q.t = Math.min(1, q.t + dt * 4);
      if (s.wait > 0 && (s.wait -= dt) <= 0) { const p = this.piz(G); s.alive = 3; s.expr = Math.floor(rnd(0, 4)); G.add(20, p.x, p.y - p.R, { color: "#ffd23f", noCrit: true }); SFX.giggle(); setTimeout(() => SFX.giggle(), 350); G.say(this.SAY[s.expr], p.x, p.y - p.R * 1.05, 2.6); G.burst(p.x, p.y, ["😂", "✨", "🍕"], 10); }
      if (s.alive > 0 && (s.alive -= dt) <= 0) { s.pl = []; s.faces++; s.slide = 0.6; G.flash("#fff"); SFX.ding(); G.float("📸 Silly face saved!", G.cx, G.u * 22, "#ff5d8f", 1.1); } },
    autoTick(G) { const s = G.s; if (s.alive <= 0 && s.slide <= 0 && s.wait <= 0) this.place(G); },
    draw(G, g) { const s = G.s, p = this.piz(G), al = s.alive > 0, R = p.R, bob = al ? Math.abs(Math.sin(G.t * 9)) * G.u * 2 + (s.tick > 0 ? Math.sin(s.tick * 40) * G.u : 0) : 0;
      oval(g, p.x, p.y + R * 1.02, R * 0.95, R * 0.12, "rgba(74,42,26,.15)", null);
      g.save(); g.translate(p.x, p.y - bob); g.rotate(al ? Math.sin(G.t * 6) * 0.08 : 0);
      pizza(g, 0, 0, R, { peps: 0 });
      if (!al) for (let k = 0; k < this.SPOTS.length; k++) if (!s.pl.some((q) => q.k === k)) { const [ty, sx, sy] = this.SPOTS[k]; g.setLineDash([4, 4]); circ(g, sx * R, sy * R, R * this.SIZE[ty], null, "rgba(74,42,26,.45)", 2); g.setLineDash([]); }
      for (const q of s.pl) { const [ty, sx, sy] = this.SPOTS[q.k]; let x = sx * R, y = sy * R - (1 - q.t) * R * 0.9, sc = 1;
        if (al) { const e = s.expr, w = Math.sin(G.t * 20);
          if (e === 0 && ty === "m") y += w * R * 0.05 * (1 - Math.abs(sx) * 1.5) + R * 0.04;
          if (e === 0 && ty === "eye") sc = 0.45;
          if (e === 1 && ty === "eye" && sx > 0) sc = 0.2;
          if (e === 2 && ty === "eye") x += Math.sin(G.t * 5) * R * 0.05;
          if (e === 3) { x += Math.cos(G.t * 9 + q.k) * R * 0.04; y += Math.sin(G.t * 9 + q.k) * R * 0.04; } }
        this.drawTop(g, q.top, x, y, R * this.SIZE[ty], sc); }
      if (al && s.expr === 2) oval(g, 0, R * 0.52 + Math.sin(G.t * 10) * R * 0.03, R * 0.13, R * 0.17, "#ff86b3", INK, 3);
      g.restore();
      for (let i = 0; i < this.TRAY.length; i++) { const t = this.tray(G, i), on = s.sel === this.TRAY[i]; circ(g, t.x, t.y, t.r, on ? "#fff3a0" : "#fffaf0", on ? "#ff9800" : INK, on ? 5 : 3); this.drawTop(g, this.TRAY[i], t.x, t.y, t.r * 0.48); }
      hint(G, g, al ? "😆 It's ALIVE! Tap to tickle!" : `🍕 Tap the pizza to add a face! · faces: ${s.faces}`); },
    hot(G) { const s = G.s; if (s.alive > 0) return this.piz(G); const k = this.SPOTS.findIndex((_, k) => !s.pl.some((q) => q.k === k)); return k < 0 ? this.piz(G) : this.spot(G, k); },
  },
  {
    id: "dog", name: "Pizza Pup Fetch", rar: "uncommon", ico: "🐶", unit: "fetches", base: 1, bg: ["#bfe9ff", "#fff6d6"], noDots: true,
    blurb: "Tap the park to throw a crust ball! Your happy puppy runs to get it and brings it back, tail wagging. Fetch 3 in a row and the pup does a TRICK!",
    ups: [["tap", "Super Throw", "💪"], ["auto", "Ball Buddies", "🎾"], ["mult", "Squeaky Crust", "🦴"]],
    win: ["Woof! Best. Throw. Ever.", "The puppy's tail is wagging SO fast.", "Your pup learned to spin!", "All the park dogs want to play with you.", "The puppy brought you a flower. And a stick. And a sock.", "Your pup won the Pizza Park Fetch Cup!", "The puppy gave you a big slobbery kiss.", "Your pup can fetch from here to the moon!", "Best Friends Forever: You + Pizza Pup!"],
    TRICKS: ["Spin!", "Big Jump!", "Wiggle Dance!", "High Five!"],
    init(G) { Object.assign(G.s, { st: "ready", dog: { x: G.W * 0.24, dir: 1, run: 0, wag: 0, pet: 0 }, ball: null, rt: 0, fetch: 0, streak: 0, tk: 0, trick: 0, tricks: 0 }); },
    gy(G) { return G.H * 0.74; },
    R(G) { return Math.min(G.u * 8, G.W * 0.08); },
    home(G) { return G.W * 0.24; },
    hand(G) { return { x: G.W * 0.08 + G.u * 4, y: this.gy(G) - G.u * 9 }; },
    throwIt(G, x) { const s = G.s, h = this.hand(G); s.ball = { sx: h.x, sy: h.y, tx: clamp(x, G.W * 0.45, G.W * 0.92), ty: this.gy(G) - G.u * 2, t: 0, held: false }; s.st = "go"; s.dog.dir = 1; s.rt = 0; SFX.whoosh(); G.add(1, h.x + G.u * 6, h.y - G.u * 6); },
    woof(G) { G.tone(340, 0.08, { type: "square", vol: 0.07, slideTo: 460 }); G.tone(360, 0.09, { type: "square", vol: 0.07, slideTo: 480, when: 0.13 }); },
    down(G, x, y) { const s = G.s, d = s.dog, R = this.R(G), dy = this.gy(G) - R;
      if (dist(x, y, d.x, dy) < R * 1.6) { d.pet = 0.6; G.add(1, x, y, { color: "#ffb3c8" }); this.woof(G); G.burst(d.x, dy - R, "💕", 3, { size: 0.6, grav: -0.4 }); return; }
      if (s.st === "ready") { this.throwIt(G, x); return; }
      G.add(1, x, y); G.burst(x, y, ["💛", "⭐"], 2, { size: 0.6, grav: -0.3 }); G.tone(rnd(700, 900), 0.06, { type: "triangle", vol: 0.06 }); },
    update(G, dt) { const s = G.s, d = s.dog, R = this.R(G), sp = G.W * 0.55; d.pet = Math.max(0, d.pet - dt); d.wag += dt * (d.pet > 0 || s.st === "back" || s.st === "trick" ? 30 : 14);
      const moveTo = (tx) => { const dx = tx - d.x; if (Math.abs(dx) < sp * dt) { d.x = tx; return true; } d.x += Math.sign(dx) * sp * dt; d.dir = Math.sign(dx); d.run += dt * 18; return false; };
      if (s.st === "ready") { s.rt += dt; if (s.rt > 6 && s.streak) s.streak = 0; d.dir = 1; }
      if (s.st === "go") { const b = s.ball; if (b.t < 1) b.t = Math.min(1, b.t + dt / 0.9); if (moveTo(b.tx - R * 1.3) && b.t >= 1) { s.st = "back"; b.held = true; G.tone(1100, 0.08, { type: "sine", vol: 0.08, slideTo: 1500 }); } }
      if (s.st === "back" && moveTo(this.home(G))) { const st = ++s.streak; s.fetch++; s.ball = null; d.dir = 1; G.add(4 + Math.min(st, 10), d.x, this.gy(G) - R * 3, { color: "#ffd23f" }); SFX.ding(); G.burst(d.x, this.gy(G) - R * 2, "💛", 4, { size: 0.7, grav: -0.3 });
        if (st % 3 === 0) { s.st = "trick"; s.tk = 1.4; s.trick = Math.floor(rnd(0, 4)); s.tricks++; G.add(15, d.x, this.gy(G) - R * 4, { color: "#ffd23f", noCrit: true }); SFX.win(); G.float(`🐶 ${this.TRICKS[s.trick]}`, G.cx, G.u * 22, "#ff9800", 1.2); G.say("Good pup!", this.hand(G).x, this.hand(G).y - G.u * 6, 1.4); }
        else { s.st = "ready"; s.rt = 0; } }
      if (s.st === "trick" && (s.tk -= dt) <= 0) { s.st = "ready"; s.rt = 0; } },
    autoTick(G) { const s = G.s; if (s.st === "ready") this.throwIt(G, rnd(0.5, 0.9) * G.W); else { s.dog.pet = 0.4; G.burst(s.dog.x, this.gy(G) - this.R(G) * 2, "💕", 1, { size: 0.6, grav: -0.4 }); } },
    pup(G, g, x, y, R, dir, run, wag, mood, rot) { const col = "#f2c38b", dk = "#a8693a";
      g.save(); g.translate(x, y); g.rotate(rot); g.scale(dir, 1); g.lineCap = "round";
      const a = -2.3 + Math.sin(wag) * 0.55; stick(g, -R * 0.85, -R * 0.15, -R * 0.85 + Math.cos(a) * R * 0.6, -R * 0.15 + Math.sin(a) * R * 0.6, R * 0.16, col);
      for (const [lx, ph] of [[-0.55, 0], [-0.3, Math.PI], [0.3, 0], [0.55, Math.PI]]) { const sw = run ? Math.sin(run + ph) * 0.5 : 0; stick(g, lx * R, R * 0.2, lx * R + Math.sin(sw) * R * 0.5, R * 0.2 + Math.cos(sw) * R * 0.55, R * 0.16, col); }
      oval(g, 0, 0, R, R * 0.55, col); oval(g, -R * 0.3, -R * 0.15, R * 0.3, R * 0.2, "#e0a368", null);
      circ(g, R * 0.85, -R * 0.55, R * 0.5, col); oval(g, R * 1.25, -R * 0.4, R * 0.26, R * 0.18, "#f7dcb6"); circ(g, R * 1.47, -R * 0.47, R * 0.08, INK, null);
      oval(g, R * 0.55, -R * 0.55, R * 0.16, R * 0.36, dk, INK, 3, 0.35 + Math.sin(wag) * 0.12);
      face(g, R * 0.78, -R * 0.62, R * 0.34, mood, { look: 1 }); if (run) oval(g, R * 1.15, -R * 0.2, R * 0.08, R * 0.13, "#ff86b3", INK, 2);
      g.restore(); },
    ballDraw(G, g, x, y) { const r = G.u * 2.4; circ(g, x, y, r, "#e8b26a"); circ(g, x, y, r * 0.65, "#ffd23f", null); circ(g, x + r * 0.15, y - r * 0.1, r * 0.25, "#d8343a", null); },
    draw(G, g) { const s = G.s, d = s.dog, R = this.R(G), gy = this.gy(G), h = this.hand(G);
      E(g, "🌞", G.W - G.u * 10, G.u * 18, G.u * 11); for (let i = 0; i < 3; i++) cloud(g, ((i * 0.37 + G.t * 0.01) % 1.2) * G.W - G.W * 0.1, G.H * (0.25 + (i % 2) * 0.08), G.u * 4);
      rr(g, -10, gy - G.u * 4, G.W + 20, G.H, 0, "#8fd46a", null); E(g, "🌳", G.W * 0.9, gy - G.u * 10, G.u * 18); E(g, "🌳", G.W * 0.62, gy - G.u * 8, G.u * 13);
      for (let i = 0; i < 9; i++) E(g, ["🌼", "🌷", "🌸"][i % 3],(i * 131.7) % G.W, gy + G.u * (3 + (i % 3) * 5), G.u * 3.5);
      E(g, "🧒", G.W * 0.08, gy - G.u * 7, G.u * 14);
      let x = d.x, y = gy - R * 0.75, rot = 0, dir = d.dir, run = s.st === "go" || s.st === "back" ? d.run : 0;
      if (s.st === "trick") { const p = 1 - s.tk / 1.4, t = s.trick; if (t === 0) rot = p * Math.PI * 2; if (t === 1) y -= Math.sin(p * Math.PI) * R * 3; if (t === 2) { dir = Math.sin(p * 30) > 0 ? 1 : -1; y -= Math.abs(Math.sin(p * 30)) * R * 0.5; } if (t === 3) { rot = -0.7; y -= R * 0.3; E(g, "✋", x + R * 1.8, y - R * 1.7, R * 1.1); } }
      oval(g, d.x, gy, R * 1.1, R * 0.2, "rgba(74,42,26,.15)", null);
      this.pup(G, g, x, y, R, dir, run, d.wag, s.st === "trick" || d.pet > 0 ? "joy" : "happy", rot * dir);
      const b = s.ball; if (b) { if (b.held) this.ballDraw(G, g, d.x + d.dir * R * 1.45, y - R * 0.25); else this.ballDraw(G, g, lerp(b.sx, b.tx, b.t), lerp(b.sy, b.ty, b.t) - Math.sin(b.t * Math.PI) * G.H * 0.3); }
      else if (s.st === "ready" || s.st === "trick") this.ballDraw(G, g, h.x, h.y);
      if (s.st === "ready") E(g, "👆", G.W * 0.7, gy - G.H * 0.2 + Math.sin(G.t * 5) * G.u * 2, G.u * 7, 0, 0.6);
      hint(G, g, `🎾 Fetches: ${s.fetch}${s.streak > 1 ? ` · streak ${s.streak}` : ""} · tricks: ${s.tricks}`); },
    hot(G) { const s = G.s; if (s.st === "ready") return { x: G.W * 0.75, y: this.gy(G) - G.u * 12 }; return { x: s.dog.x, y: this.gy(G) - this.R(G) }; },
  },
  {
    id: "breadsticks", name: "Breadstick Drum Band", rar: "uncommon", ico: "🥁", unit: "beats", base: 1, bg: ["#2b1a4a", "#5b2f7a"], noDots: true,
    blurb: "Tap a drum when a note lands on it! Breadstick drumsticks go BOOM and the veggie band dances along. 8 in a row starts a BAND JAM!",
    ups: [["tap", "Crunchy Sticks", "🥖"], ["auto", "Drumming Ducks", "🦆"], ["mult", "Disco Lights", "🪩"]],
    win: ["Boom boom! The carrot is dancing!", "The tomato did the splits!", "Your band has its first fan. It's a mushroom.", "The broccoli can't stop bopping.", "Your band played at the Pizza Town party!", "The crowd yelled 'MORE BREADSTICKS!'", "Your band's song is number one on Veggie Radio.", "The corn wants your autograph on its husk.", "World's Greatest Breadstick Drummer!"],
    COLS: ["#ff6b6b", "#ffd23f", "#6ec6ff"], BAND: [["🥕", "🎸"], ["🍅", "🎺"], ["🥦", "🎷"], ["🌽", "🎻"], ["🍄", "🪇"]],
    init(G) { Object.assign(G.s, { notes: [], bt: 0, kick: 0, combo: 0, jam: 0, jams: 0, hits: 0, hit: [0, 0, 0], en: 0, msg: null }); },
    drum(G, i) { const w = Math.min(G.W * 0.92, G.u * 110), r = Math.min((w / 3) * 0.38, G.u * 12); return { x: G.cx + (i - 1) * (w / 3), y: G.H * 0.72, r }; },
    per(G) { return G.s.jam > 0 ? 0.45 : 0.6; },
    hit(G, i) { const s = G.s, d = this.drum(G, i); s.hit[i] = 0.15; G.tone([110, 147, 196][i], 0.2, { type: "sine", vol: 0.25, slideTo: 60 }); G.noise(0.06, { vol: 0.1, f0: 1800, f1: 600, type: "bandpass" });
      let best = null, bd = 1e9; for (const n of s.notes) if (n.lane === i) { const dd = Math.abs(n.y - d.y); if (dd < bd) { bd = dd; best = n; } }
      if (best && bd < d.r * 0.9) { const perfect = bd < d.r * 0.35; s.notes.splice(s.notes.indexOf(best), 1); s.combo++; s.hits++; s.en = Math.min(1, s.en + 0.25);
        G.add((perfect ? 3 : 2) * (s.jam > 0 ? 2 : 1), d.x, d.y - d.r * 1.2, { color: this.COLS[i] }); G.float(perfect ? "Perfect!" : "Nice!", d.x, d.y - d.r * 2.2, "#fff", 0.8); G.dots(d.x, d.y, [this.COLS[i], "#fff"], 8);
        if (s.combo % 8 === 0) { s.jam = 5; s.jams++; G.add(20, G.cx, G.H * 0.3, { color: "#ffd23f", noCrit: true }); SFX.win(); G.float("🥁 BAND JAM! 🥁", G.cx, G.u * 22, "#ffd23f", 1.3); G.flash("#ffe9ff"); } }
      else G.add(1, d.x, d.y - d.r * 1.2, { color: this.COLS[i] }); },
    down(G, x, y) { if (y > G.H * 0.44) { let i = 0, bd = 1e9; for (let k = 0; k < 3; k++) { const d = Math.abs(x - this.drum(G, k).x); if (d < bd) { bd = d; i = k; } } this.hit(G, i); return; }
      G.add(1, x, y); G.burst(x, y, "🎵", 2, { size: 0.7, grav: -0.3 }); G.s.en = Math.min(1, G.s.en + 0.1); SFX.note(Math.floor(rnd(0, 12))); },
    update(G, dt) { const s = G.s, per = this.per(G), d0 = this.drum(G, 0), sy = G.H * 0.4, v = (d0.y - sy) / 1.8; s.en = Math.max(0, s.en - dt * 0.15); s.jam = Math.max(0, s.jam - dt); s.kick = Math.max(0, s.kick - dt * 3); for (let i = 0; i < 3; i++) s.hit[i] = Math.max(0, s.hit[i] - dt);
      if ((s.bt += dt) >= per) { s.bt -= per; s.kick = 1; if (Math.random() < 0.85) s.notes.push({ lane: Math.floor(rnd(0, 3)), y: sy }); }
      for (let i = s.notes.length - 1; i >= 0; i--) { const n = s.notes[i]; n.y += v * dt; if (n.y > d0.y + d0.r) { s.notes.splice(i, 1); s.combo = 0; } } },
    autoTick(G) { const s = G.s; let n = null; for (const q of s.notes) if (!n || q.y > n.y) n = q; if (n) { const d = this.drum(G, n.lane); n.y = d.y; this.hit(G, n.lane); } else this.hit(G, Math.floor(rnd(0, 3))); },
    draw(G, g) { const s = G.s, jam = s.jam > 0, sy = G.H * 0.4, ph = s.bt / this.per(G);
      for (let i = 0; i < 40; i++) circ(g, (i * 137.5) % G.W, (i * 61.7) % (G.H * 0.4), G.u * 0.35, "rgba(255,255,255,.6)", null);
      if (jam || s.en > 0.5) for (let i = 0; i < 5; i++) { const a = Math.sin(G.t * 2 + i * 1.3) * 0.5; g.save(); g.translate(G.W * (0.1 + i * 0.2), 0); g.rotate(a); g.globalAlpha = jam ? 0.22 : 0.1; g.fillStyle = RAINBOW[i]; g.beginPath(); g.moveTo(0, 0); g.lineTo(-G.u * 8, G.H * 0.7); g.lineTo(G.u * 8, G.H * 0.7); g.fill(); g.restore(); }
      const stY = G.H * 0.33, sw = Math.min(G.W * 0.9, G.u * 100); rr(g, G.cx - sw / 2, stY, sw, G.u * 4, G.u * 2, "#c98a4b");
      this.BAND.forEach(([v, ins], i) => { const x = G.cx + (i - 2) * sw * 0.19, hop = Math.abs(Math.sin(ph * Math.PI)) * G.u * (1 + s.en * 4 + (jam ? 3 : 0)), rot = (jam ? Math.sin(G.t * 8 + i) * 0.3 : Math.sin(ph * Math.PI * 2 + i) * 0.1 * (0.3 + s.en));
        E(g, v, x, stY - G.u * 6 - hop, G.u * 10, rot); E(g, ins, x + G.u * 4.5, stY - G.u * 3.5 - hop * 0.5, G.u * 5, -rot); });
      for (let i = 0; i < 3; i++) { const d = this.drum(G, i); g.strokeStyle = "rgba(255,255,255,.18)"; g.lineWidth = d.r * 0.9; g.lineCap = "round"; g.beginPath(); g.moveTo(d.x, sy); g.lineTo(d.x, d.y); g.stroke(); }
      for (let i = 0; i < 3; i++) { const d = this.drum(G, i), c = this.COLS[i], hp = s.hit[i] > 0;
        rr(g, d.x - d.r, d.y, d.r * 2, d.r * 0.9, 6, c); for (let k = 0; k < 4; k++) { g.strokeStyle = "#fff"; g.lineWidth = 3; g.beginPath(); g.moveTo(d.x - d.r + k * d.r * 0.5, d.y + d.r * 0.1); g.lineTo(d.x - d.r + (k + 1) * d.r * 0.5, d.y + d.r * 0.8); g.stroke(); }
        oval(g, d.x, d.y, d.r, d.r * 0.35, hp ? c : "#fffaf0"); oval(g, d.x, d.y, d.r * 0.55, d.r * 0.18, null, "rgba(74,42,26,.3)", 2);
        for (const sd of [-1, 1]) { const a = hp ? 0.25 : 0.7; stick(g, d.x + sd * d.r * 0.25, d.y - d.r * 0.05, d.x + sd * (d.r * 0.25 + Math.sin(a) * d.r * 1.4), d.y - d.r * 0.05 - Math.cos(a) * d.r * 1.4, d.r * 0.14, "#e8b26a"); } }
      for (const n of s.notes) { const d = this.drum(G, n.lane); circ(g, d.x, n.y, G.u * 4, "#fffaf0", this.COLS[n.lane], 4); E(g, "🎵", d.x, n.y, G.u * 5); }
      hint(G, g, jam ? `🥁 BAND JAM! Double beats! ${Math.ceil(s.jam)}s` : `🥁 Combo: ${s.combo} · jams: ${s.jams}`); },
    hot(G) { let n = null; for (const q of G.s.notes) if (!n || q.y > n.y) n = q; const d = this.drum(G, n ? n.lane : 1); return { x: d.x, y: d.y }; },
  },

  // ------------------------------------------------------------------------
  //  SHINY
  // ------------------------------------------------------------------------
  {
    id: "snowpizza", name: "Snowman Pizza Party", rar: "shiny", ico: "⛄", unit: "snowballs", base: 2, bg: ["#cfe6ff", "#f2f8ff"], noDots: true,
    blurb: "Tap to roll the snowball bigger and bigger! Stack three into a snowman, then decorate him with breadstick arms, pepperoni buttons, olive eyes and an olive nose. He comes alive for a pizza party!",
    ups: [["tap", "Warm Mittens", "🧤"], ["auto", "Snow Penguins", "🐧"], ["mult", "Pizza Snow", "❄️"]],
    win: ["Your first snowman says 'Brrr-illiant!'", "Your snowman wants extra cheese.", "The penguins built you a snow throne.", "A whole snowman family lives in your yard!", "Your snowmen threw a pizza party. Everyone came!", "It's snowing pepperonis. Probably.", "Your snowman sang a song. It was very cool.", "The North Pole asked for your recipe.", "Grand Snow Chef of the Frosty Kingdom!"],
    DECO: ["arm", "arm", "btn", "btn", "btn", "eye", "eye", "nose", "sm", "sm", "sm", "hat"],
    init(G) { Object.assign(G.s, { ph: 0, prog: 0, rot: 0, lift: 0, deco: 0, dt: [], alive: 0, made: 0 }); },
    dims(G) { const R0 = Math.min(G.W * 0.15, G.H * 0.12), R = [R0, R0 * 0.74, R0 * 0.54], gy = G.H * 0.8, c0 = gy - R[0], c1 = c0 - (R[0] + R[1]) * 0.82, c2 = c1 - (R[1] + R[2]) * 0.82; return { R, gy, cy: [c0, c1, c2], x: G.cx, rx: Math.min(G.W * 0.2, G.cx - R0 * 2.1) }; },
    roll(G) { const s = G.s, D = this.dims(G); s.prog = Math.min(1, s.prog + 1 / 6); s.rot += 0.7; const r = D.R[s.ph] * (0.3 + 0.7 * s.prog); G.add(1, D.rx, D.gy - r * 2); G.noise(0.08, { vol: 0.12, f0: 2500, f1: 1200, type: "bandpass" }); G.dots(D.rx, D.gy, ["#fff", "#dbe8f7"], 5);
      if (s.prog >= 1) { s.lift = 0.6; SFX.boing(); G.float(["Big base ball!", "Middle ball!", "Head on top!"][s.ph], D.rx, D.gy - D.R[s.ph] * 2.4, "#fff", 0.9); } },
    decorate(G) { const s = G.s, D = this.dims(G); s.dt[s.deco] = G.t; s.deco++; G.add(2, D.x, D.cy[1]); G.tone(rnd(600, 900), 0.08, { type: "triangle", vol: 0.1, slideTo: 1200 }); G.burst(D.x, D.cy[1], "✨", 2, { size: 0.6 });
      if (s.deco >= this.DECO.length) { s.alive = 3.5; s.made++; G.add(40, D.x, D.cy[2] - D.R[2] * 2, { color: "#ffd23f", noCrit: true }); SFX.wow(); G.say("Pizza party! Brrr-illiant!", D.x, D.cy[2] - D.R[2] * 1.8, 2.4); G.burst(D.x, D.cy[1], ["❄️", "🍕", "✨"], 16); } },
    step(G) { const s = G.s; if (s.alive > 0 || s.lift > 0) return false; if (s.ph < 3) this.roll(G); else this.decorate(G); return true; },
    down(G, x, y) { const s = G.s, D = this.dims(G); if (s.alive > 0) { G.add(2, x, y, { color: "#ffb3c8" }); SFX.sparkle(); G.burst(x, y, ["💙", "❄️"], 2, { size: 0.6, grav: -0.3 }); return; } if (!this.step(G)) G.dots(x, y, ["#fff"], 4); },
    update(G, dt) { const s = G.s; if (s.lift > 0 && (s.lift -= dt) <= 0) { s.ph++; s.prog = 0; if (s.ph === 3) G.float("Now decorate him! 🍕", G.cx, G.u * 22, "#ff5d8f", 1.1); }
      if (s.alive > 0 && (s.alive -= dt) <= 0) { s.ph = 0; s.prog = 0; s.deco = 0; s.dt = []; G.float("⛄ Let's make another!", G.cx, G.u * 22, "#4aa8e8", 1); } },
    autoTick(G) { if (this.step(G)) G.burst(G.cx, this.dims(G).gy, "🐧", 1, { size: 0.6, grav: -0.2 }); },
    ball(g, x, y, r, rot) { circ(g, x, y, r, "#ffffff", "#7f9cc0", Math.max(3, r * 0.05)); oval(g, x + r * 0.2, y + r * 0.35, r * 0.6, r * 0.35, "rgba(170,200,235,.35)", null); for (let k = 0; k < 5; k++) { const a = rot + k * 1.26; circ(g, x + Math.cos(a) * r * 0.55, y + Math.sin(a) * r * 0.55, r * 0.07, "#dbe8f7", null); } },
    pop(G, k) { const t0 = G.s.dt[k]; if (t0 == null) return 0; const p = clamp((G.t - t0) * 6, 0, 1); return p < 1 ? p * 1.25 : 1; },
    draw(G, g) { const s = G.s, D = this.dims(G), al = s.alive > 0, hop = al ? Math.abs(Math.sin(G.t * 8)) * G.u * 3 : 0, x = D.x, R = D.R, cy = D.cy.map((c) => c - hop);
      for (let i = 0; i < 4; i++) cloud(g, ((i * 0.3 + G.t * 0.008) % 1.2) * G.W - G.W * 0.1, G.H * (0.16 + (i % 2) * 0.07), G.u * 4, "#fff");
      E(g, "🌲", G.u * 9, D.gy - G.u * 9, G.u * 18); E(g, "🌲", G.W - G.u * 9, D.gy - G.u * 11, G.u * 22); E(g, "🏠", G.W - G.u * 26, D.gy - G.u * 6, G.u * 12);
      g.fillStyle = "#fff"; g.beginPath(); g.moveTo(-10, D.gy); for (let i = 0; i <= 12; i++) g.lineTo((i / 12) * G.W, D.gy - G.u * 2 + Math.sin(i * 1.7) * G.u * 1.5); g.lineTo(G.W + 10, G.H); g.lineTo(-10, G.H); g.closePath(); g.fill(); g.strokeStyle = "#9ab8d8"; g.lineWidth = 3; g.stroke();
      for (let k = 0; k < Math.min(s.made, 5); k++) E(g, "⛄", G.W - G.u * 8 - k * G.u * 7, D.gy + G.u * 4, G.u * 7);
      if (s.ph < 3) { const r = R[s.ph] * (0.3 + 0.7 * s.prog); oval(g, D.rx, D.gy, r * 1.2, r * 0.18, "rgba(150,180,220,.35)", null);
        if (s.lift > 0) { const t = 1 - s.lift / 0.6; this.ball(g, lerp(D.rx, x, t), lerp(D.gy - R[s.ph], cy[s.ph], t) - Math.sin(t * Math.PI) * G.u * 15, R[s.ph], s.rot); }
        else { this.ball(g, D.rx + Math.sin(s.rot) * G.u * 2, D.gy - r, r, s.rot); E(g, "👆", D.rx + r + G.u * 4, D.gy - r - G.u * 3 + Math.sin(G.t * 5) * G.u, G.u * 6, 0, 0.6); } }
      const n = Math.min(s.ph, 3), d = (k) => this.pop(G, k), wave = al ? Math.sin(G.t * 10) * 0.35 : 0;
      for (const sd of [-1, 1]) { const k = sd < 0 ? 0 : 1, p = d(k); if (!p) continue; const a = -0.6 + wave * sd, L = R[1] * 1.3 * p; stick(g, x + sd * R[1] * 0.8, cy[1], x + sd * (R[1] * 0.8 + Math.cos(a) * L), cy[1] + Math.sin(a) * L, R[1] * 0.12, "#e8b26a"); }
      for (let i = 0; i < n; i++) this.ball(g, x, cy[i], R[i], i * 2);
      for (let k = 0; k < 3; k++) { const p = d(2 + k); if (p) circ(g, x, cy[1] - R[1] * 0.4 + k * R[1] * 0.4, R[1] * 0.14 * p, "#d8343a", "#9a1f24", 2); }
      for (const [k, sd] of [[5, -1], [6, 1]]) { const p = d(k); if (p) { circ(g, x + sd * R[2] * 0.33, cy[2] - R[2] * 0.15, R[2] * 0.14 * p, "#2b2b2b", INK, 2); circ(g, x + sd * R[2] * 0.33 - R[2] * 0.04, cy[2] - R[2] * 0.2, R[2] * 0.04 * p, "#fff", null); } }
      { const p = d(7); if (p) { oval(g, x, cy[2] + R[2] * 0.1, R[2] * 0.2 * p, R[2] * 0.13 * p, "#7aa83a", INK, 2); circ(g, x + R[2] * 0.1 * p, cy[2] + R[2] * 0.1, R[2] * 0.06 * p, "#ff5a4a", null); } }
      for (const [k, sd] of [[8, -1], [9, 0], [10, 1]]) { const p = d(k); if (p) circ(g, x + sd * R[2] * 0.3, cy[2] + R[2] * (sd ? 0.38 : 0.47), R[2] * 0.08 * p, "#d8343a", "#9a1f24", 1.5); }
      { const p = d(11); if (p) slice(g, x, cy[2] - R[2] * 0.75, R[2] * 1.25 * p, { rot: al ? Math.sin(G.t * 8) * 0.12 : -0.1 }); }
      if (al) { circ(g, x - R[2] * 0.62, cy[2] + R[2] * 0.2, R[2] * 0.12, "rgba(255,110,140,.45)", null); circ(g, x + R[2] * 0.62, cy[2] + R[2] * 0.2, R[2] * 0.12, "rgba(255,110,140,.45)", null); }
      for (let i = 0; i < 45; i++) circ(g, ((i * 97.3) + Math.sin(G.t + i) * G.u * 3 + G.W) % G.W, (i * 53.1 + G.t * G.u * 6 * (1 + (i % 3) * 0.5)) % G.H, G.u * (0.35 + (i % 3) * 0.2), "#fff", null);
      hint(G, g, al ? "⛄ Pizza party time! Tap to wave!" : s.ph < 3 ? `❄️ Tap to roll snowball ${s.ph + 1} of 3 · snowmen: ${s.made}` : `🍕 Tap to decorate! ${s.deco}/${this.DECO.length}`); },
    hot(G) { const s = G.s, D = this.dims(G); return s.ph < 3 ? { x: D.rx, y: D.gy - D.R[s.ph] * 0.5 } : { x: D.x, y: D.cy[1] }; },
  },
  {
    id: "kite", name: "Pizza Kite", rar: "shiny", ico: "🪁", unit: "gusts", base: 2, bg: ["#8fd3ff", "#e8f7ff"], noDots: true,
    blurb: "Tap to puff a gust of wind and float your pizza kite up! Steer it toward stars ⭐ and rainbows 🌈 to collect them. Catch lots of stars for a SKY PARTY!",
    ups: [["tap", "Big Breeze", "🌬️"], ["auto", "Breezy Birds", "🐦"], ["crit", "Lucky Star", "🌟"]],
    win: ["Wheee! Your kite touched a cloud!", "A bird said 'nice kite!' Tweet tweet.", "Your kite is the highest in Pizza Town!", "You caught so many stars the night sky is jealous.", "Your kite flew over a rainbow. Then under one.", "The clouds are asking for a slice.", "Your kite waved hello to an airplane!", "You're the Queen of the Breeze!", "Sky Captain of the Pizza Kite Club!"],
    init(G) { Object.assign(G.s, { k: { x: G.cx, y: G.H * 0.45, vx: 0, vy: 0 }, items: [], spawn: 0.3, stars: 0, rbs: 0, meter: 0, party: 0, parties: 0, trail: [], puffs: [], happy: 0 }); },
    L(G) { return Math.min(G.u * 15, G.H * 0.14); },
    gust(G, x, y) { const s = G.s, k = s.k; k.vy = Math.min(k.vy, 0) - G.u * 46; k.vx += clamp((x - k.x) * 1.4, -G.u * 60, G.u * 60); s.happy = 0.4; s.puffs.push({ x, y, t: 0.6 }); if (s.puffs.length > 8) s.puffs.shift(); },
    down(G, x, y) { const s = G.s; this.gust(G, x, y); G.add(1, s.k.x, s.k.y - this.L(G) * 0.6); SFX.whoosh(); },
    update(G, dt) { const s = G.s, k = s.k, L = this.L(G), p = s.party > 0; s.happy = Math.max(0, s.happy - dt); if (p) s.party = Math.max(0, s.party - dt);
      k.vy += G.u * 22 * dt; k.vx *= 1 - dt * 1.5; k.vy *= 1 - dt * 0.6; k.x += (k.vx + Math.sin(G.t * 1.3) * G.u * 3) * dt; k.y += k.vy * dt;
      if (k.x < L * 0.6) { k.x = L * 0.6; k.vx = Math.abs(k.vx) * 0.5; } if (k.x > G.W - L * 0.6) { k.x = G.W - L * 0.6; k.vx = -Math.abs(k.vx) * 0.5; }
      if (k.y < G.u * 17 + L * 0.6) { k.y = G.u * 17 + L * 0.6; k.vy = Math.max(0, k.vy); } if (k.y > G.H * 0.66) { k.y = G.H * 0.66; k.vy = Math.min(0, k.vy); }
      for (const q of s.puffs) q.t -= dt; s.puffs = s.puffs.filter((q) => q.t > 0);
      if (p) { s.trail.push({ x: k.x, y: k.y + L * 0.5 }); if (s.trail.length > 40) s.trail.shift(); } else if (s.trail.length) s.trail.shift();
      if ((s.spawn -= dt) <= 0) { s.spawn = p ? 0.35 : 1.0; const left = Math.random() < 0.5, rb = Math.random() < (p ? 0.3 : 0.14); s.items.push({ x: left ? -G.u * 6 : G.W + G.u * 6, y: rnd(0.16, 0.6) * G.H, vx: (left ? 1 : -1) * G.u * rnd(10, 18), rb, got: 0, ph: rnd(0, 6) }); }
      for (let i = s.items.length - 1; i >= 0; i--) { const q = s.items[i]; if (q.got) { q.got -= dt; q.y -= G.u * 25 * dt; if (q.got <= 0) s.items.splice(i, 1); continue; } q.x += q.vx * dt;
        if (dist(q.x, q.y, k.x, k.y) < L * 0.8) { q.got = 0.4; const m = p ? 2 : 1; G.add((q.rb ? 10 : 3) * m, q.x, q.y, { color: q.rb ? "#ff5d8f" : "#ffd23f" }); G.burst(q.x, q.y, q.rb ? ["🌈", "✨"] : "✨", q.rb ? 6 : 3, { size: 0.7 }); q.rb ? SFX.sparkle() : SFX.coin(); q.rb ? s.rbs++ : s.stars++;
          if (!p) { s.meter += q.rb ? 3 : 1; if (s.meter >= 12) { s.meter = 0; s.party = 7; s.parties++; SFX.wow(); G.flash("#fff0fb"); G.add(25, G.cx, G.H * 0.3, { color: "#ffd23f", noCrit: true }); G.float("🌈 SKY PARTY! 🌈", G.cx, G.u * 24, "#ff5d8f", 1.4); } } }
        else if (q.x < -G.u * 10 || q.x > G.W + G.u * 10) s.items.splice(i, 1); } },
    autoTick(G) { const q = this.hot(G); this.gust(G, q.x, q.y); G.burst(G.s.k.x, G.s.k.y + this.L(G), "💨", 1, { size: 0.6, grav: -0.2 }); },
    draw(G, g) { const s = G.s, k = s.k, L = this.L(G), p = s.party > 0, hx = G.W * 0.1 + G.u * 4, hy = G.H * 0.83;
      if (p) rainbowArc(g, G.cx, G.H * 0.95, G.W * 0.48, G.W * 0.035, 0.45 + Math.sin(G.t * 4) * 0.1);
      E(g, "🌞", G.W - G.u * 10, G.u * 18, G.u * 11, Math.sin(G.t) * 0.1);
      for (let i = 0; i < 5; i++) cloud(g, ((i * 0.27 + G.t * (0.01 + (i % 2) * 0.008)) % 1.25) * G.W - G.W * 0.12, G.H * (0.2 + (i % 3) * 0.15), G.u * (3 + (i % 2) * 2), "rgba(255,255,255,.9)");
      g.fillStyle = "#8fd46a"; g.beginPath(); g.ellipse(G.W * 0.3, G.H * 1.05, G.W * 0.6, G.H * 0.2, 0, 0, Math.PI * 2); g.fill(); g.fillStyle = "#7cc65a"; g.beginPath(); g.ellipse(G.W * 0.85, G.H * 1.08, G.W * 0.45, G.H * 0.18, 0, 0, Math.PI * 2); g.fill();
      E(g, "🧒", G.W * 0.1, G.H * 0.86, G.u * 13);
      for (const q of s.puffs) { g.globalAlpha = q.t / 0.6; g.strokeStyle = "#fff"; g.lineWidth = 3; g.lineCap = "round"; for (let j = -1; j <= 1; j++) { g.beginPath(); g.arc(q.x, q.y + j * G.u * 3, G.u * (2 + (0.6 - q.t) * 12), -0.8, 0.8); g.stroke(); } g.globalAlpha = 1; }
      for (const q of s.items) { const a = q.got ? q.got / 0.4 : 1; if (q.rb) E(g, "🌈", q.x, q.y + Math.sin(G.t * 2 + q.ph) * G.u, G.u * 10, 0, a); else E(g, "⭐", q.x, q.y + Math.sin(G.t * 3 + q.ph) * G.u, G.u * 7, Math.sin(G.t * 2 + q.ph) * 0.3, a); }
      for (let i = 1; i < s.trail.length; i++) { const a = s.trail[i - 1], b = s.trail[i]; g.strokeStyle = RAINBOW[i % 6]; g.lineWidth = G.u * 1.6 * (i / s.trail.length); g.lineCap = "round"; g.beginPath(); g.moveTo(a.x, a.y); g.lineTo(b.x, b.y); g.stroke(); }
      const tilt = clamp(k.vx * 0.004, -0.45, 0.45), ax = k.x - Math.sin(tilt) * L * 0.55, ay = k.y + Math.cos(tilt) * L * 0.55;
      g.strokeStyle = "rgba(74,42,26,.7)"; g.lineWidth = 1.5; g.beginPath(); g.moveTo(hx, hy); g.quadraticCurveTo((hx + ax) / 2, Math.max(hy, ay) + G.u * 4, ax, ay); g.stroke();
      let px = ax, py = ay; for (let j = 1; j <= 6; j++) { const tx = ax + Math.sin(G.t * 4 + j) * G.u * 0.6 * j - k.vx * 0.01 * j, ty = ay + j * G.u * 3; g.strokeStyle = INK; g.lineWidth = 2; g.beginPath(); g.moveTo(px, py); g.lineTo(tx, ty); g.stroke(); px = tx; py = ty; g.fillStyle = RAINBOW[j % 6]; g.beginPath(); g.moveTo(tx - G.u * 1.4, ty - G.u); g.lineTo(tx + G.u * 1.4, ty + G.u); g.lineTo(tx + G.u * 1.4, ty - G.u); g.lineTo(tx - G.u * 1.4, ty + G.u); g.closePath(); g.fill(); }
      g.save(); g.translate(k.x, k.y); g.rotate(tilt); slice(g, 0, L * 0.5, L, { peps: 0 }); face(g, 0, -L * 0.05, L * 0.19, s.happy > 0 || p ? "joy" : "happy"); g.restore();
      bar(g, G.cx - G.u * 24, G.u * 4, G.u * 48, G.u * 5, p ? s.party / 7 : s.meter / 12, p ? "#ff86b3" : "#ffd23f");
      fit(G, g, p ? `🌈 SKY PARTY! Double stars! ${Math.ceil(s.party)}s` : `⭐ ${s.stars} · 🌈 ${s.rbs} · Tap to puff the kite up!`, G.u * 13, G.u * 3.6); },
    hot(G) { const s = G.s, k = s.k; let best = null, bd = 1e9; for (const q of s.items) if (!q.got && q.x > 0 && q.x < G.W) { const d = dist(q.x, q.y, k.x, k.y); if (d < bd) { bd = d; best = q; } } return best ? { x: best.x, y: best.y } : { x: G.cx, y: G.H * 0.4 }; },
  },
  {
    id: "fishbowl", name: "Goldfish Pizza Party", rar: "shiny", ico: "🐠", unit: "nibbles", base: 2, bg: ["#e6f7ff", "#c4e6f5"],
    blurb: "Tap the water to sprinkle tiny pizza flakes! The goldfish swim up to nibble and blow heart bubbles. Tap a fish to wave hello. Feed them all for a BUBBLE PARTY!",
    ups: [["tap", "Flake Shaker", "🧂"], ["auto", "Flake Crabs", "🦀"], ["mult", "Bubble Magic", "🫧"]],
    win: ["Blub blub! The fish say thank you!", "The goldfish blew you a heart bubble.", "Your fish named the castle 'Pizza Palace'.", "The fish learned to swim in a circle. On purpose!", "Bubble party every day!", "Your goldfish are the shiniest in Pizza Town.", "The fish wrote 'THANKS' in bubbles.", "A rainbow fish came to visit!", "Goldfish Party Planner of the Year!"],
    COLS: ["#ffa53a", "#ff7b5a", "#ffd23f"],
    init(G) { const b = this.bowl(G); Object.assign(G.s, { fish: [0, 1, 2].map((i) => ({ x: b.x + (i - 1) * b.R * 0.4, y: b.y + b.R * 0.1, vx: 0, vy: 0, dir: 1, full: 0, tgt: null, tx: b.x, ty: b.y, wt: 0, ph: rnd(0, 6), tick: 0, yum: 0, c: this.COLS[i] })), flakes: [], bub: [], party: 0, parties: 0, nib: 0, bt: 0 }); },
    bowl(G) { const R = Math.min(G.W * 0.42, G.H * 0.37); return { x: G.cx, y: G.H * 0.54, R, sy: G.H * 0.54 - R * 0.62 }; },
    fs(G) { return this.bowl(G).R * 0.15; },
    inWater(G, x, y, m = 0.82) { const b = this.bowl(G); return dist(x, y, b.x, b.y) < b.R * m && y > b.sy + this.fs(G) * 0.8; },
    sprinkle(G, x) { const s = G.s, b = this.bowl(G); x = clamp(x, b.x - b.R * 0.5, b.x + b.R * 0.5); for (let k = 0; k < 4; k++) s.flakes.push({ x: x + rnd(-1, 1) * G.u * 4, y: b.sy + rnd(0, G.u * 2), by: null, age: 0, c: pick(["#ffd23f", "#d8343a", "#e8b26a"]) }); if (s.flakes.length > 40) s.flakes.splice(0, s.flakes.length - 40); G.noise(0.15, { vol: 0.06, f0: 5000, f1: 3000, type: "highpass" }); G.dots(x, b.sy, ["#bfe8ff", "#fff"], 4, { speed: 0.4 }); },
    blow(G, f, kind) { const fs = this.fs(G); G.s.bub.push({ x: f.x + f.dir * fs, y: f.y - fs * 0.2, r: G.u * rnd(1.8, 2.8), kind, ph: rnd(0, 6) }); if (G.s.bub.length > 40) G.s.bub.shift(); },
    down(G, x, y) { const s = G.s, b = this.bowl(G), fs = this.fs(G);
      for (let i = s.bub.length - 1; i >= 0; i--) { const q = s.bub[i]; if (q.kind === "rb" && dist(x, y, q.x, q.y) < q.r * 1.6) { s.bub.splice(i, 1); G.add(3, q.x, q.y, { color: "#b18cff" }); SFX.pop(rnd(0.9, 1.4)); G.dots(q.x, q.y, RAINBOW, 8); return; } }
      for (const f of s.fish) if (dist(x, y, f.x, f.y) < fs * 1.4) { f.tick = 0.6; G.add(1, x, y, { color: "#ffb3c8" }); SFX.giggle(); this.blow(G, f, "heart"); this.blow(G, f, "heart"); return; }
      if (Math.abs(x - b.x) < b.R * 0.9 && y < b.y + b.R) this.sprinkle(G, x); else SFX.boop(); },
    update(G, dt) { const s = G.s, b = this.bowl(G), fs = this.fs(G), p = s.party > 0;
      for (const fl of s.flakes) { if (fl.y < b.y + b.R * 0.68) { fl.y += G.u * 5 * dt; fl.x += Math.sin(G.t * 3 + fl.age * 5) * G.u * 2 * dt; } fl.age += dt; } s.flakes = s.flakes.filter((fl) => fl.age < 14 && !fl.gone);
      if (p && (s.party -= dt) <= 0) { for (const f of s.fish) f.full = 0; s.bub = s.bub.filter((q) => q.kind !== "rb"); G.float("Hungry again! Blub!", G.cx, G.u * 22, "#fff", 1); }
      if (p && (s.bt -= dt) <= 0) { s.bt = 0.22; this.blow(G, pick(s.fish), "rb"); }
      s.fish.forEach((f, i) => { f.tick = Math.max(0, f.tick - dt); f.yum = Math.max(0, f.yum - dt); f.ph += dt * (f.tgt ? 14 : 7);
        let tx, ty, sp = G.u * 14;
        if (p) { const a = G.t * 1.4 + (i * Math.PI * 2) / 3; tx = b.x + Math.cos(a) * b.R * 0.45; ty = b.y + b.R * 0.05 + Math.sin(a) * b.R * 0.3; sp = G.u * 40; }
        else { if (f.tgt && f.tgt.gone) f.tgt = null; if (!f.tgt && f.full < 5) { let best = null, bd = 1e9; for (const fl of s.flakes) if (!fl.by && fl.y > b.sy + fs * 0.5) { const d = dist(f.x, f.y, fl.x, fl.y); if (d < bd) { bd = d; best = fl; } } if (best) { best.by = f; f.tgt = best; } }
          if (f.tgt) { tx = f.tgt.x; ty = f.tgt.y; sp = G.u * 34; if (dist(f.x, f.y, tx, ty) < fs * 0.9 || dist(f.x + f.dir * fs * 0.8, f.y, tx, ty) < fs * 0.7) { f.tgt.gone = true; f.tgt = null; f.full++; f.yum = 0.3; s.nib++; G.add(1, f.x, f.y - fs); G.tone(rnd(500, 700), 0.08, { type: "sine", vol: 0.1, slideTo: 900 }); this.blow(G, f, "heart");
              if (s.fish.every((q) => q.full >= 5)) { s.party = 6; s.parties++; G.add(25, b.x, b.sy, { color: "#ffd23f", noCrit: true }); SFX.win(); G.float("🫧 BUBBLE PARTY! 🫧", G.cx, G.u * 22, "#b18cff", 1.2); s.flakes.forEach((fl) => (fl.by = null)); for (const q of s.fish) q.tgt = null; } } }
          else { if ((f.wt -= dt) <= 0) { f.wt = rnd(1.5, 3); let n = 0; do { f.tx = b.x + rnd(-0.7, 0.7) * b.R; f.ty = b.y + rnd(-0.4, 0.6) * b.R; } while (!this.inWater(G, f.tx, f.ty, 0.7) && ++n < 20); } tx = f.tx; ty = f.ty; } }
        const dx = tx - f.x, dy = ty - f.y, d = Math.hypot(dx, dy) || 1, dvx = (dx / d) * Math.min(sp, d * 3), dvy = (dy / d) * Math.min(sp, d * 3);
        f.vx += (dvx - f.vx) * Math.min(1, dt * 4); f.vy += (dvy - f.vy) * Math.min(1, dt * 4); f.x += f.vx * dt; f.y += f.vy * dt; if (Math.abs(f.vx) > G.u * 1.5) f.dir = Math.sign(f.vx);
        const dd = dist(f.x, f.y, b.x, b.y); if (dd > b.R * 0.8) { f.x = b.x + ((f.x - b.x) / dd) * b.R * 0.8; f.y = b.y + ((f.y - b.y) / dd) * b.R * 0.8; } f.y = Math.max(f.y, b.sy + fs * 0.8); });
      for (let i = s.bub.length - 1; i >= 0; i--) { const q = s.bub[i]; q.y -= G.u * (q.kind === "rb" ? 7 : 12) * dt; q.x += Math.sin(G.t * 3 + q.ph) * G.u * 3 * dt; if (q.y < b.sy) { s.bub.splice(i, 1); G.dots(q.x, b.sy, ["#fff", "#bfe8ff"], 3, { speed: 0.3, size: 0.6 }); } } },
    autoTick(G) { const s = G.s; let f = s.fish[0]; for (const q of s.fish) if (q.full < f.full) f = q; if (s.party <= 0) this.sprinkle(G, f.x); },
    fishDraw(G, g, f) { const fs = this.fs(G), wag = Math.sin(f.ph) * fs * 0.25;
      g.save(); g.translate(f.x, f.y); g.scale(f.dir, 1); g.rotate(f.tick > 0 ? Math.sin(f.tick * 25) * 0.25 : Math.sin(f.ph * 0.5) * 0.05);
      g.beginPath(); g.moveTo(-fs * 0.75, 0); g.lineTo(-fs * 1.55, -fs * 0.6 + wag); g.lineTo(-fs * 1.35, wag * 0.5); g.lineTo(-fs * 1.55, fs * 0.6 + wag); g.closePath(); g.fillStyle = "#ff8a3a"; g.fill(); g.strokeStyle = INK; g.lineWidth = 3; g.lineJoin = "round"; g.stroke();
      g.beginPath(); g.moveTo(-fs * 0.3, -fs * 0.55); g.quadraticCurveTo(0, -fs * 1.05, fs * 0.3, -fs * 0.6); g.closePath(); g.fillStyle = "#ff8a3a"; g.fill(); g.stroke();
      oval(g, 0, 0, fs, fs * 0.68, f.c); oval(g, -fs * 0.1, fs * 0.15, fs * 0.25, fs * 0.15, "rgba(255,255,255,.35)", null, 0, 0.4);
      face(g, fs * 0.42, -fs * 0.05, fs * 0.42, f.tick > 0 || f.yum > 0 ? "joy" : f.tgt ? "wow" : "happy");
      g.restore(); },
    draw(G, g) { const s = G.s, b = this.bowl(G), p = s.party > 0;
      rr(g, b.x - b.R * 1.15, b.y + b.R * 0.9, b.R * 2.3, G.u * 5, G.u * 2, "#c98a4b");
      g.save(); g.beginPath(); g.arc(b.x, b.y, b.R, 0, Math.PI * 2); g.clip();
      const wg = g.createLinearGradient(0, b.sy, 0, b.y + b.R); wg.addColorStop(0, p ? "#9fe0ff" : "#7fd0f5"); wg.addColorStop(1, p ? "#b9a5ff" : "#3f9fd8"); g.fillStyle = wg; g.fillRect(b.x - b.R, b.sy, b.R * 2, b.R * 2);
      g.fillStyle = "rgba(255,255,255,.12)"; for (let i = 0; i < 4; i++) { g.beginPath(); g.moveTo(b.x - b.R + i * b.R * 0.6 + Math.sin(G.t + i) * G.u * 3, b.sy); g.lineTo(b.x - b.R + i * b.R * 0.6 + b.R * 0.15, b.sy); g.lineTo(b.x - b.R * 1.2 + i * b.R * 0.6, b.y + b.R); g.lineTo(b.x - b.R * 1.3 + i * b.R * 0.6, b.y + b.R); g.fill(); }
      oval(g, b.x, b.y + b.R * 0.95, b.R * 0.95, b.R * 0.28, "#f4dca0", null); for (let i = 0; i < 16; i++) circ(g, b.x + ((i * 37.3) % 1.6 - 0.8) * b.R, b.y + b.R * (0.78 + (i % 3) * 0.05), b.R * 0.035, RAINBOW[i % 6], INK, 1.5);
      for (let k = 0; k < 3; k++) { const sx = b.x + (k - 1) * b.R * 0.5 - b.R * 0.15; g.strokeStyle = "#3f9f4a"; g.lineWidth = G.u * 1.4; g.lineCap = "round"; g.beginPath(); g.moveTo(sx, b.y + b.R * 0.8); for (let j = 1; j <= 5; j++) g.lineTo(sx + Math.sin(G.t * 2 + j + k) * G.u * 1.5, b.y + b.R * 0.8 - j * b.R * 0.07); g.stroke(); }
      E(g, "🏰", b.x + b.R * 0.45, b.y + b.R * 0.62, b.R * 0.32);
      for (const fl of s.flakes) rr(g, fl.x - G.u * 0.7, fl.y - G.u * 0.5, G.u * 1.4, G.u * 1, 2, fl.c, null);
      for (const f of s.fish) this.fishDraw(G, g, f);
      for (const q of s.bub) { if (q.kind === "rb") { circ(g, q.x, q.y, q.r * 1.3, `hsla(${(G.t * 120 + q.ph * 60) % 360},90%,75%,.55)`, "#fff", 2); circ(g, q.x - q.r * 0.4, q.y - q.r * 0.4, q.r * 0.3, "#fff", null); } else { circ(g, q.x, q.y, q.r, "rgba(255,255,255,.35)", "#fff", 1.5); E(g, "💗", q.x, q.y, q.r * 1.2); } }
      g.strokeStyle = "rgba(255,255,255,.7)"; g.lineWidth = 2; g.beginPath(); g.moveTo(b.x - b.R, b.sy); for (let i = 0; i <= 20; i++) g.lineTo(b.x - b.R + i * b.R * 0.1, b.sy + Math.sin(G.t * 3 + i) * G.u * 0.4); g.stroke();
      g.restore();
      circ(g, b.x, b.y, b.R, "rgba(255,255,255,.08)", INK, 4); g.strokeStyle = "rgba(255,255,255,.8)"; g.lineWidth = G.u * 1.2; g.lineCap = "round"; g.beginPath(); g.arc(b.x, b.y, b.R * 0.86, Math.PI * 1.1, Math.PI * 1.35); g.stroke();
      oval(g, b.x, b.y - b.R * 0.86, b.R * 0.52, b.R * 0.1, "#e6f7ff", INK, 3);
      if (p) hint(G, g, `🫧 BUBBLE PARTY! Pop the rainbow bubbles! ${Math.ceil(s.party)}s`);
      else { const fr = s.fish.reduce((a, f) => a + f.full, 0) / 15; bar(g, G.cx - G.u * 24, G.u * 4, G.u * 48, G.u * 5, fr, "#ffa53a"); fit(G, g, `🐠 Tap the water to feed · nibbles: ${s.nib}`, G.u * 13, G.u * 3.6); } },
    hot(G) { const s = G.s, b = this.bowl(G); if (s.party > 0) { const q = s.bub.find((q) => q.kind === "rb"); return q || { x: b.x, y: b.y }; } let f = s.fish[0]; for (const q of s.fish) if (q.full < f.full) f = q; return { x: clamp(f.x, b.x - b.R * 0.5, b.x + b.R * 0.5), y: b.sy - G.u * 2 }; },
  },
  {
    id: "puddle", name: "Puddle Jump", rar: "shiny", ico: "☔", unit: "splashes", base: 2, bg: ["#9fb3c8", "#d4dee8"], noDots: true,
    blurb: "It's raining! Tap a puddle and jump in with your rain boots — SPLASH! Bigger puddles make bigger splashes and rainbows. Five big splashes bring out the SUN!",
    ups: [["tap", "Bouncy Boots", "👢"], ["auto", "Splashy Ducks", "🦆"], ["crit", "Mega Splash", "🌊"]],
    win: ["SPLASH! Your socks are a little wet.", "The ducks want to be your friends.", "You made a rainbow with your boots!", "The puddles are cheering for you.", "You splashed so high a cloud got wet.", "The rain came back just to watch you jump.", "Your boots are officially magic boots.", "The whole street is a rainbow now!", "World Champion Puddle Jumper!"],
    init(G) { Object.assign(G.s, { P: [0.5, 0.85, 0.35, 0.7].map((sz) => ({ sz, ring: 0 })), kid: { x: G.W * 0.5, fx: G.W * 0.5, tx: G.W * 0.5, t: 1, i: -1, land: 0, hi: 0 }, q: null, bigs: 0, sun: 0, suns: 0, rb: 0, splashes: 0 }); },
    gy(G) { return G.H * 0.79; },
    pud(G, i) { const w = Math.min(G.W * 0.11, G.u * 14), sz = G.s.P[i].sz, rx = w * (0.55 + 0.65 * sz); return { x: G.W * (0.14 + 0.24 * i), y: this.gy(G), rx, ry: rx * 0.28 }; },
    K(G) { return Math.min(G.u * 9, G.W * 0.08); },
    jump(G, i) { const k = G.s.kid; k.fx = k.x; k.tx = this.pud(G, i).x; k.t = 0; k.i = i; G.tone(300, 0.2, { type: "sine", vol: 0.12, slideTo: 700 }); },
    splash(G, i, duck) { const s = G.s, p = s.P[i], P = this.pud(G, i), sz = p.sz, sun = s.sun > 0;
      G.add((1 + Math.round(sz * 6)) * (sun ? 2 : 1), P.x, P.y - G.u * 12, { color: "#bfe8ff" }); s.splashes++;
      G.dots(P.x, P.y, sun ? RAINBOW : ["#6ec6ff", "#bfe8ff", "#fff"], Math.round(6 + sz * 22), { speed: 0.6 + sz, size: 0.8 + sz * 0.6 }); p.ring = 1;
      G.noise(0.25 + sz * 0.25, { vol: 0.14 + sz * 0.12, f0: 2200, f1: 400, type: "bandpass", q: 1 }); G.tone(500, 0.12, { type: "sine", vol: 0.08, slideTo: 200 });
      if (sz >= 0.75 && !duck) { s.rb = 2.5; s.bigs++; G.add(8, P.x, P.y - G.u * 20, { color: "#ffd23f", noCrit: true }); SFX.sparkle(); G.float("BIG SPLASH! 🌈", P.x, P.y - G.u * 26, "#fff", 1.1);
        if (s.bigs % 5 === 0) { s.sun = 7; s.suns++; SFX.wow(); G.flash("#fff7c2"); G.float("☀️ SUNSHINE! ☀️", G.cx, G.u * 22, "#ffb300", 1.3); } }
      p.sz = Math.max(0.15, sz - (duck ? 0.3 : 0.5)); },
    down(G, x, y) { const s = G.s, k = s.kid, K = this.K(G), ky = this.gy(G) - K * 1.4;
      if (k.t >= 1 && dist(x, y, k.x, ky) < K * 1.2) { k.hi = 0.6; G.add(1, x, y, { color: "#ffb3c8" }); SFX.giggle(); G.burst(k.x, ky - K, ["✋", "💛"], 2, { size: 0.7, grav: -0.3 }); return; }
      if (y < G.H * 0.5) { SFX.boop(); G.dots(x, y, ["#bfe8ff"], 4); return; }
      let i = 0, bd = 1e9; for (let j = 0; j < 4; j++) { const d = Math.abs(x - this.pud(G, j).x); if (d < bd) { bd = d; i = j; } }
      if (k.t < 1) s.q = i; else this.jump(G, i); },
    update(G, dt) { const s = G.s, k = s.kid; s.rb = Math.max(0, s.rb - dt); s.sun = Math.max(0, s.sun - dt); k.land = Math.max(0, k.land - dt); k.hi = Math.max(0, k.hi - dt);
      for (const p of s.P) { p.sz = Math.min(1, p.sz + dt * (s.sun > 0 ? 0.3 : 0.07)); p.ring = Math.max(0, p.ring - dt * 1.5); }
      if (k.t < 1) { k.t = Math.min(1, k.t + dt / 0.45); k.x = lerp(k.fx, k.tx, k.t); if (k.t >= 1) { k.land = 0.3; this.splash(G, k.i); if (s.q != null) { const q = s.q; s.q = null; this.jump(G, q); } } } },
    autoTick(G) { const s = G.s; let i = 0; s.P.forEach((p, j) => { if (p.sz > s.P[i].sz) i = j; }); const P = this.pud(G, i); this.splash(G, i, true); G.burst(P.x, P.y - G.u * 3, "🦆", 1, { size: 0.8, grav: -0.2 }); },
    kidDraw(G, g, x, fy, K, mood, air) { const arm = air ? -1 : 0.3;
      for (const sd of [-1, 1]) rr(g, x + sd * K * 0.28 - K * 0.2, fy - K * 0.5, K * 0.4, K * 0.5, K * 0.1, "#ff5d8f");
      for (const sd of [-1, 1]) stick(g, x + sd * K * 0.45, fy - K * 1.05, x + sd * K * 0.95, fy - K * (1.05 + arm * 0.5), K * 0.14, "#ffd23f");
      g.beginPath(); g.moveTo(x - K * 0.35, fy - K * 1.35); g.lineTo(x + K * 0.35, fy - K * 1.35); g.lineTo(x + K * 0.6, fy - K * 0.45); g.lineTo(x - K * 0.6, fy - K * 0.45); g.closePath(); g.fillStyle = "#ffd23f"; g.fill(); g.strokeStyle = INK; g.lineWidth = 3; g.lineJoin = "round"; g.stroke();
      for (let k = 0; k < 3; k++) circ(g, x, fy - K * (1.15 - k * 0.22), K * 0.05, INK, null);
      circ(g, x, fy - K * 1.75, K * 0.55, "#ffd23f"); circ(g, x, fy - K * 1.7, K * 0.42, "#ffd9b8"); face(g, x, fy - K * 1.68, K * 0.36, mood);
      E(g, "☂️", x + K * 1.1, fy - K * (1.9 + arm * 0.5), K * 1.1, 0.2); },
    draw(G, g) { const s = G.s, gy = this.gy(G), sun = s.sun > 0, hz = G.H * 0.62, K = this.K(G), k = s.kid;
      if (sun) { g.fillStyle = "rgba(160,220,255,.7)"; g.fillRect(0, 0, G.W, hz); E(g, "🌞", G.W - G.u * 12, G.u * 20, G.u * 14, Math.sin(G.t) * 0.1); }
      for (let i = 0; i < 4; i++) cloud(g, ((i * 0.29 + G.t * 0.006) % 1.2) * G.W - G.W * 0.1, G.H * (0.17 + (i % 2) * 0.06), G.u * (5 + (i % 2) * 2), sun ? "#fff" : "#e3e9f0");
      if (sun || s.rb > 0) rainbowArc(g, G.cx, hz, Math.min(G.W * 0.42, G.H * 0.5), G.u * 2.4, sun ? 0.8 : s.rb / 2.5);
      const hc = ["#ffb3c8", "#bfe3ff", "#fff3a0", "#c8f0c0", "#e6d0ff"]; for (let i = 0; i < 5; i++) { const w = G.W * 0.16, x = i * G.W * 0.21 + G.W * 0.02, h = G.H * (0.12 + (i % 2) * 0.05); rr(g, x, hz - h, w, h, 3, hc[i]); g.beginPath(); g.moveTo(x - G.u, hz - h); g.lineTo(x + w / 2, hz - h - G.u * 8); g.lineTo(x + w + G.u, hz - h); g.closePath(); g.fillStyle = "#c66b5a"; g.fill(); g.strokeStyle = INK; g.lineWidth = 3; g.stroke(); rr(g, x + w * 0.35, hz - h * 0.5, w * 0.3, h * 0.5, 2, "#8a5a36"); }
      rr(g, -10, hz, G.W + 20, G.H, 0, "#a9b4bf", INK, 3); for (let x = 0; x < G.W; x += G.u * 12) { g.strokeStyle = "rgba(74,42,26,.15)"; g.lineWidth = 2; g.beginPath(); g.moveTo(x, hz); g.lineTo(x - G.u * 6, G.H); g.stroke(); }
      for (let i = 0; i < 4; i++) { const P = this.pud(G, i), p = s.P[i];
        oval(g, P.x, P.y, P.rx, P.ry, sun ? `hsl(${(G.t * 60 + i * 80) % 360},80%,75%)` : "#6f9cc4", "#4d7396", 3); oval(g, P.x - P.rx * 0.3, P.y - P.ry * 0.25, P.rx * 0.3, P.ry * 0.2, "rgba(255,255,255,.5)", null);
        if (p.ring > 0) oval(g, P.x, P.y, P.rx * (1.6 - p.ring * 0.6), P.ry * (1.6 - p.ring * 0.6), null, `rgba(255,255,255,${p.ring})`, 3);
        if (!sun) { const rp = (G.t * 1.3 + i * 0.37) % 1; oval(g, P.x + Math.sin(i * 5 + Math.floor(G.t * 1.3)) * P.rx * 0.4, P.y, P.rx * 0.25 * rp, P.ry * 0.25 * rp, null, `rgba(255,255,255,${1 - rp})`, 1.5); }
        if (p.sz >= 0.75) E(g, "✨", P.x + P.rx * 0.8, P.y - P.ry * 2, G.u * 4, 0, 0.5 + Math.sin(G.t * 6 + i) * 0.5); }
      const air = k.t < 1, fy = gy - (air ? Math.sin(k.t * Math.PI) * G.H * 0.18 : 0);
      oval(g, k.x, gy, K * 0.7, K * 0.15, "rgba(74,42,26,.2)", null);
      this.kidDraw(G, g, k.x, fy + K * 0.1, K, air || k.land > 0 || k.hi > 0 ? "joy" : "happy", air);
      if (!sun) { g.strokeStyle = "rgba(255,255,255,.55)"; g.lineWidth = 1.5; g.beginPath(); for (let i = 0; i < 70; i++) { const x = (i * 73.7 + G.t * G.u * 8) % (G.W + 20), y = (i * 41.3 + G.t * G.H * (1 + (i % 3) * 0.25)) % G.H; g.moveTo(x, y); g.lineTo(x - G.u * 0.8, y + G.u * 3); } g.stroke(); }
      hint(G, g, sun ? `☀️ SUNNY RAINBOW TIME! Double splashes! ${Math.ceil(s.sun)}s` : `☔ Tap a puddle to jump! · splashes: ${s.splashes} · big: ${s.bigs}`); },
    hot(G) { const s = G.s; let i = 0; s.P.forEach((p, j) => { if (p.sz > s.P[i].sz) i = j; }); const P = this.pud(G, i); return { x: P.x, y: P.y }; },
  },
  {
    id: "piano", name: "Pizza Piano", rar: "shiny", ico: "🎹", unit: "notes", base: 2, bg: ["#fff1e0", "#ffd6c2"],
    blurb: "Every piano key is a topping! The glowing key is the next note of the song — tap it and the pizza sings along. Finish the song for a big BRAVO!",
    ups: [["tap", "Golden Fingers", "🖐️"], ["auto", "Piano Cats", "🐱"], ["mult", "Concert Hall", "🎭"]],
    win: ["La la la! The pizza can sing!", "The tomatoes are humming along.", "Your first standing ovation!", "The pizza hit a really high note. Wow!", "Birds came to sing with you.", "You played a concert at the Pizza Palace!", "The pizza's voice made the cheese stretch.", "Your songs are on Pizza Radio every hour!", "Maestro of the Pizza Piano!"],
    TOP: ["🍅", "🧀", "🍄", "🫒", "🌶️", "🍍", "🥓"], KC: ["#ff6b6b", "#ffd23f", "#c9a27a", "#6b8f3a", "#ff8a3a", "#ffe066", "#ff9aa8"], SEMI: [0, 2, 4, 5, 7, 9, 11],
    SONGS: [["Twinkle Twinkle", [0, 0, 4, 4, 5, 5, 4, 3, 3, 2, 2, 1, 1, 0]], ["Mary's Little Lamb", [2, 1, 0, 1, 2, 2, 2, 1, 1, 1, 2, 4, 4]], ["Ode to Joy", [2, 2, 3, 4, 4, 3, 2, 1, 0, 0, 1, 2, 2, 1, 1]], ["Hot Cross Buns", [2, 1, 0, 2, 1, 0, 0, 0, 0, 0, 1, 1, 1, 1, 2, 1, 0]], ["Row Your Boat", [0, 0, 0, 1, 2, 2, 1, 2, 3, 4]]],
    init(G) { Object.assign(G.s, { song: 0, n: 0, sing: 0, press: [0, 0, 0, 0, 0, 0, 0], fin: 0, fx: 0, songs: 0, tick: 0 }); },
    key(G, i) { const w = Math.min(G.W * 0.94, G.u * 120), kw = w / 7, y = G.H * 0.6; return { x: G.cx - w / 2 + i * kw, y, w: kw, h: Math.min(G.H * 0.25, kw * 3) }; },
    pz(G) { return { x: G.cx, y: G.H * 0.3, R: Math.min(G.H * 0.14, G.W * 0.2) }; },
    play(G, i) { const s = G.s, K = this.key(G, i), P = this.pz(G), sg = this.SONGS[s.song][1]; s.press[i] = 0.18; SFX.note(this.SEMI[i]);
      if (s.fin > 0) { G.add(1, K.x + K.w / 2, K.y - G.u * 3); return; }
      if (i === sg[s.n]) { s.n++; s.sing = 0.35; G.add(2, K.x + K.w / 2, K.y - G.u * 3, { color: this.KC[i] }); G.burst(P.x, P.y + P.R * 0.3, ["🎵", "🎶"], 1, { size: 0.8, grav: -0.4 });
        if (s.n >= sg.length) { s.fin = 2.6; s.songs++; G.add(30, P.x, P.y - P.R, { color: "#ffd23f", noCrit: true }); SFX.win(); G.say("Bravo! Encore! 🎤", P.x, P.y - P.R * 1.1, 2.2); G.float("🎶 BRAVO! 🎶", G.cx, G.u * 22, "#ff5d8f", 1.1); } }
      else { G.add(1, K.x + K.w / 2, K.y - G.u * 3); if (Math.random() < 0.2) G.say(pick(["Ooh, jazzy!", "Freestyle!", "La la... lo?"]), P.x, P.y - P.R * 1.1, 1); } },
    down(G, x, y) { const s = G.s, P = this.pz(G);
      for (let i = 0; i < 7; i++) { const K = this.key(G, i); if (x >= K.x && x < K.x + K.w && y >= K.y - G.u * 4 && y <= K.y + K.h + G.u * 2) { this.play(G, i); return; } }
      if (dist(x, y, P.x, P.y) < P.R * 1.1) { s.tick = 0.5; G.add(1, x, y, { color: "#ffb3c8" }); SFX.giggle(); G.burst(x, y, "💕", 2, { size: 0.6, grav: -0.4 }); return; } SFX.boop(); },
    update(G, dt) { const s = G.s; s.sing = Math.max(0, s.sing - dt); s.tick = Math.max(0, s.tick - dt); for (let i = 0; i < 7; i++) s.press[i] = Math.max(0, s.press[i] - dt);
      if (s.fin > 0) { if ((s.fx -= dt) <= 0) { s.fx = 0.3; G.burst(rnd(0.2, 0.8) * G.W, G.H * 0.2, ["🎉", "⭐", "🎵"], 4); } if ((s.fin -= dt) <= 0) { s.song = (s.song + 1) % this.SONGS.length; s.n = 0; } } },
    autoTick(G) { const s = G.s; if (s.fin <= 0) this.play(G, this.SONGS[s.song][1][s.n]); },
    draw(G, g) { const s = G.s, P = this.pz(G), [name, sg] = this.SONGS[s.song], fin = s.fin > 0, nx = fin ? -1 : sg[s.n];
      if (fin) { g.save(); g.globalAlpha = 0.35; g.fillStyle = "#fff6a0"; g.beginPath(); g.moveTo(P.x - G.u * 6, 0); g.lineTo(P.x + G.u * 6, 0); g.lineTo(P.x + P.R * 1.5, P.y + P.R * 1.2); g.lineTo(P.x - P.R * 1.5, P.y + P.R * 1.2); g.fill(); g.restore(); }
      for (const sd of [0, 1]) { const X = (v) => (sd ? G.W - v : v), cw = Math.min(G.W * 0.12, G.u * 14); g.beginPath(); g.moveTo(X(-4), -4); g.lineTo(X(cw), -4); g.quadraticCurveTo(X(cw * 0.5), G.H * 0.3, X(-4), G.H * 0.55); g.closePath(); g.fillStyle = "#d8343a"; g.fill(); g.strokeStyle = INK; g.lineWidth = 3; g.stroke(); }
      const bob = fin ? Math.abs(Math.sin(G.t * 9)) * G.u * 3 : s.sing > 0 ? G.u * 1.2 : 0, sway = Math.sin(G.t * 2.4) * 0.08 + (s.tick > 0 ? Math.sin(s.tick * 30) * 0.1 : 0);
      oval(g, P.x, P.y + P.R * 1.05, P.R * 0.8, P.R * 0.12, "rgba(74,42,26,.15)", null);
      g.save(); g.translate(P.x, P.y - bob); g.rotate(sway); pizza(g, 0, 0, P.R, { peps: 0 }); face(g, 0, 0, P.R * 0.62, s.sing > 0 || fin ? "wow" : s.tick > 0 ? "joy" : "happy"); g.restore();
      E(g, "🎤", P.x + P.R * 0.95, P.y + P.R * 0.35 - bob, P.R * 0.55, -0.4);
      const n = sg.length, sp = Math.min(G.u * 4.5, (G.W * 0.8) / n), dy = P.y + P.R + G.u * 4;
      for (let i = 0; i < n; i++) { const x = G.cx + (i - (n - 1) / 2) * sp, done = i < s.n || fin, cur = i === s.n && !fin; circ(g, x, dy, G.u * (cur ? 1.5 + Math.sin(G.t * 6) * 0.3 : 1.1), done ? this.KC[sg[i]] : cur ? "#fff" : "rgba(255,255,255,.5)", INK, 2); }
      for (let i = 0; i < 7; i++) { const K = this.key(G, i), pr = s.press[i] > 0, on = i === nx, yy = K.y + (pr ? G.u * 0.8 : 0);
        rr(g, K.x + 2, yy, K.w - 4, K.h, K.w * 0.15, pr ? "#f2e6d0" : on ? "#fff6b0" : "#fffaf0", on ? "#ff9800" : INK, on ? 5 : 3);
        rr(g, K.x + 6, yy + 6, K.w - 12, K.h * 0.12, 4, this.KC[i], null); E(g, this.TOP[i], K.x + K.w / 2, yy + K.h * 0.62, Math.min(K.w * 0.6, G.u * 9));
        if (on) E(g, "👇", K.x + K.w / 2, K.y - G.u * 5 + Math.sin(G.t * 6) * G.u, G.u * 6); }
      hint(G, g, fin ? `🎉 BRAVO! You played ${name}!` : `🎹 ${name} · ${s.n}/${n} · songs played: ${s.songs}`); },
    hot(G) { const s = G.s, i = s.fin > 0 ? 3 : this.SONGS[s.song][1][s.n], K = this.key(G, i); return { x: K.x + K.w / 2, y: K.y + K.h / 2 }; },
  },
];
