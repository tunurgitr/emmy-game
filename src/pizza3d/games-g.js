// ==========================================================================
//  Emmy's Pizza Plus — clicker games, part 7: Sparkly, Epic & Mega extras.
//  A rainbow slide, a glitter jar, butterflies, singing crystals, a starfish
//  beach party, a pizza submarine, a crab's sandcastle pizzeria, a robot
//  puppy, baby dinos and a VERY bouncy trampoline. Everybody is happy.
// ==========================================================================
import { E, circ, oval, rr, txt, bar, face, speech, rnd, pick, clamp, dist, INK } from "./clicker.js";
import { SFX } from "./audio.js";

const RAINBOW = ["#ff5d8f", "#ffb347", "#ffe066", "#7cffb0", "#6ec6ff", "#b18cff"];
const bez = (a, c, b, p) => ({ x: (1 - p) * (1 - p) * a.x + 2 * (1 - p) * p * c.x + p * p * b.x, y: (1 - p) * (1 - p) * a.y + 2 * (1 - p) * p * c.y + p * p * b.y });
const head = (G, g, s) => txt(g, s, G.cx, G.u * 7, G.u * 4, "#fff", { stroke: INK });
const hint = (G, g, s, y) => txt(g, s, G.cx, y, G.u * 3.3, "#fff", { stroke: INK });
const clouds = (G, g, n = 3, y0 = 0.12) => { for (let i = 0; i < n; i++) { const cx = ((i * 0.37 + G.t * 0.015) % 1.2) * G.W - G.W * 0.1, cy = G.H * (y0 + (i % 2) * 0.07); for (const [dx, r] of [[-1, 0.7], [0, 1], [1, 0.75]]) circ(g, cx + dx * G.u * 5, cy, G.u * 4.5 * r, "#fff", null); } };
// a five-point star (starfish & friends)
function star5(g, x, y, r, fill, rot = 0, inner = 0.5) { g.save(); g.translate(x, y); g.rotate(rot); g.beginPath(); for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + (i * Math.PI) / 5, d = i % 2 ? r * inner : r; g.lineTo(Math.cos(a) * d, Math.sin(a) * d); } g.closePath(); g.fillStyle = fill; g.fill(); g.strokeStyle = INK; g.lineJoin = "round"; g.lineWidth = Math.max(3, r * 0.08); g.stroke(); g.restore(); }
// a fluttery butterfly with two wing colours
function bfly(g, x, y, s, c1, c2, ph, rot = 0) { const f = 0.25 + Math.abs(Math.cos(ph)) * 0.75, lw = Math.max(1.5, s * 0.08); g.save(); g.translate(x, y); g.rotate(rot);
  for (const sd of [-1, 1]) { g.save(); g.scale(sd * f, 1); oval(g, s * 0.55, -s * 0.32, s * 0.55, s * 0.45, c1, INK, lw, -0.5); oval(g, s * 0.42, s * 0.34, s * 0.36, s * 0.3, c2, INK, lw, 0.5); circ(g, s * 0.62, -s * 0.38, s * 0.13, "#fff", null); g.restore(); }
  oval(g, 0, 0, s * 0.13, s * 0.5, INK, null); g.strokeStyle = INK; g.lineWidth = lw; for (const sd of [-1, 1]) { g.beginPath(); g.moveTo(0, -s * 0.4); g.quadraticCurveTo(sd * s * 0.15, -s * 0.8, sd * s * 0.3, -s * 0.85); g.stroke(); } g.restore(); }
// sample an emoji into coloured dots (for the glitter pictures)
const GLY = new Map();
function glyphPts(ch, n) {
  const key = ch + "|" + n; if (GLY.has(key)) return GLY.get(key); const S = 56, c = document.createElement("canvas"); c.width = c.height = S; const g = c.getContext("2d", { willReadFrequently: true });
  g.font = `${S * 0.84}px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif`; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText(ch, S / 2, S / 2 + S * 0.05);
  const d = g.getImageData(0, 0, S, S).data, all = []; for (let y = 0; y < S; y += 2) for (let x = 0; x < S; x += 2) { const i = (y * S + x) * 4; if (d[i + 3] > 150) all.push({ x: (x / S - 0.5) * 2.05, y: (y / S - 0.5) * 2.05, c: `rgb(${d[i]},${d[i + 1]},${d[i + 2]})` }); }
  if (all.length < 20) { all.length = 0; for (let i = 0; i < n; i++) { const a = i * 2.4, r = Math.sqrt(i / n) * 0.8; all.push({ x: Math.cos(a) * r, y: Math.sin(a) * r, c: RAINBOW[i % 6] }); } }
  for (let i = all.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [all[i], all[j]] = [all[j], all[i]]; }
  const out = Array.from({ length: n }, (_, i) => all[i % all.length]); GLY.set(key, out); return out;
}

export const GAMES_G = [
  // ------------------------------------------------------------------------
  //  SPARKLY
  // ------------------------------------------------------------------------
  {
    id: "rainbowslide", name: "Rainbow Slide", rar: "sparkly", ico: "🌈", unit: "whooshes", base: 3, bg: ["#e3f4ff", "#c4ebff"],
    blurb: "Tap the friend at the top to send them WHOOSHING down the rainbow into the ball pit! Tap again while they slide to make them hop up and grab the stars.",
    ups: [["tap", "Slippy Socks", "🧦"], ["auto", "Penguin Pushers", "🐧"], ["crit", "Lucky Stars", "🌟"]],
    win: ["WHEEE! What a whoosh!", "The ball pit has never been so bouncy.", "A chicken slid down and said 'BAWK-TASTIC!'", "The rainbow is extra shiny from all the sliding.", "Everyone wants another turn. And another!", "You found a pizza at the bottom of the ball pit!", "The longest, loopiest slide in Pizza Town!", "Even the clouds came down for a slide.", "Rainbow Slide Champion! Whoosh forever!"],
    FR: ["🐔", "🐰", "🐻", "🐸", "🐼", "🐱", "🐶", "🦊", "🐷", "🐥", "🐨", "🦄"],
    init(G) { Object.assign(G.s, { next: pick(this.FR), sl: [], stars: [], pit: [], landed: 0, got: 0, party: 0, cool: 0 }); },
    L(G) { const top = { x: G.W * 0.17, y: G.H * 0.3 }; return { top, c: { x: G.W * 0.26, y: G.H * 0.88 }, end: { x: G.W * 0.68, y: G.H * 0.66 }, pit: { x: G.W * 0.64, y: G.H * 0.64, w: G.W * 0.33, h: G.H * 0.2 }, gy: G.H * 0.84, fr: { x: top.x, y: top.y - G.u * 6 } }; },
    hopH(G, f) { return f.hop > 0 ? Math.sin(Math.PI * (1 - f.hop / 0.55)) * G.u * 13 : 0; },
    pos(G, f, L = this.L(G)) { const p = bez(L.top, L.c, L.end, Math.min(1, f.p)); return { x: p.x, y: p.y - G.u * 5 - this.hopH(G, f) }; },
    starPos(G, st, L = this.L(G)) { const p = bez(L.top, L.c, L.end, st.p); return { x: p.x, y: p.y - G.u * 17 }; },
    send(G) { const s = G.s, L = this.L(G); s.sl.push({ e: s.next, p: 0, hop: 0 }); s.next = pick(this.FR); s.cool = 0.6; SFX.whoosh(); G.add(1, L.fr.x, L.fr.y - G.u * 4); },
    hop(G, x, y) { let n = 0; for (const f of G.s.sl) if (f.hop <= 0) { f.hop = 0.55; n++; } if (n) { G.add(1, x, y); G.tone(500, 0.18, { type: "sine", vol: 0.12, slideTo: 900 }); } else SFX.boop(); },
    down(G, x, y) { const s = G.s, L = this.L(G); if (dist(x, y, L.fr.x, L.fr.y) < G.u * 12 && s.cool <= 0) return this.send(G); if (s.sl.length) return this.hop(G, x, y); if (s.cool <= 0) return this.send(G); SFX.boop(); },
    land(G, f, L) { const s = G.s; s.landed++; s.pit.push({ e: f.e, x: rnd(0.15, 0.85), ph: rnd(0, 6) }); if (s.pit.length > 5) s.pit.shift();
      G.add(3, L.end.x + G.u * 6, L.pit.y, { color: "#ff86b3" }); G.dots(L.end.x + G.u * 8, L.pit.y + G.u * 3, RAINBOW, 14); SFX.pop(0.8); SFX.giggle();
      if (s.landed % 10 === 0) { s.party = 3.5; G.add(40, G.cx, G.H * 0.3, { color: "#ffd23f", noCrit: true }); SFX.wow(); G.float("🎈 BALL PIT PARTY! 🎈", G.cx, G.u * 18, "#ff5d8f", 1.3); G.burst(L.pit.x + L.pit.w / 2, L.pit.y, ["🎈", "🎉", "⭐"], 14); } },
    update(G, dt) { const s = G.s, L = this.L(G); s.cool -= dt; s.party = Math.max(0, s.party - dt);
      let tries = 0; while (s.stars.length < 3 && tries++ < 20) { const p = rnd(0.25, 0.9); if (s.stars.every((q) => Math.abs(q.p - p) > 0.16)) s.stars.push({ p, tw: rnd(0, 6) }); }
      for (let i = s.sl.length - 1; i >= 0; i--) { const f = s.sl[i]; f.p += dt * (0.3 + f.p * 0.45); f.hop -= dt; const h = this.hopH(G, f);
        for (let j = s.stars.length - 1; j >= 0; j--) { const st = s.stars[j]; if (Math.abs(st.p - f.p) < 0.05 && h > G.u * 8) { const sp = this.starPos(G, st, L); s.stars.splice(j, 1); s.got++; G.add(4, sp.x, sp.y, { color: "#ffe066" }); G.burst(sp.x, sp.y, ["⭐", "✨"], 6); SFX.sparkle(); } }
        if (f.p >= 1) { s.sl.splice(i, 1); this.land(G, f, L); } }
      for (const q of s.pit) q.ph += dt * (s.party > 0 ? 12 : 3);
      if (s.party > 0 && Math.random() < 0.5) G.dots(L.pit.x + rnd(0, L.pit.w), L.pit.y + G.u * 2, RAINBOW, 1, { speed: 1.4 }); },
    autoTick(G) { this.send(G); },
    draw(G, g) { const s = G.s, L = this.L(G), u = G.u; clouds(G, g);
      rr(g, -10, L.gy, G.W + 20, G.H, 0, "#9be27a", INK, 3);
      for (const sd of [-1, 1]) rr(g, L.top.x + sd * u * 4 - u * 0.8, L.top.y, u * 1.6, L.gy - L.top.y, u * 0.8, "#c98a52", INK, 2);
      for (let y = L.top.y + u * 4; y < L.gy - u; y += u * 5) rr(g, L.top.x - u * 4, y, u * 8, u * 1.2, u * 0.6, "#e0a86e", INK, 2);
      for (const p of [0.55, 0.82]) { const q = bez(L.top, L.c, L.end, p); rr(g, q.x - u * 0.8, q.y, u * 1.6, L.gy - q.y, u * 0.8, "#c98a52", INK, 2); }
      const path = (off) => { g.beginPath(); g.moveTo(L.top.x, L.top.y + off); g.quadraticCurveTo(L.c.x, L.c.y + off, L.end.x, L.end.y + off); };
      g.lineCap = "round"; path(0); g.strokeStyle = INK; g.lineWidth = u * 9.6 + 6; g.stroke(); RAINBOW.forEach((c, i) => { path((i - 2.5) * u * 1.6); g.strokeStyle = c; g.lineWidth = u * 1.7; g.stroke(); }); g.lineCap = "butt";
      rr(g, L.top.x - u * 6, L.top.y - u * 1.5, u * 12, u * 3, u, "#ff86b3", INK, 3);
      // the ball pit
      const P = L.pit; g.save(); rr(g, P.x, P.y, P.w, P.h, u * 3, "#6ec6ff", null); g.clip();
      for (const q of s.pit) E(g, q.e, P.x + q.x * P.w, P.y + u * 2 - Math.abs(Math.sin(q.ph)) * u * (s.party > 0 ? 7 : 2), u * 8);
      let row = 0; for (let y = P.y + u * 3.5; y < P.y + P.h + u * 2; y += u * 3, row++) for (let x = P.x + u * 2 + (row % 2) * u * 1.6, c = 0; x < P.x + P.w; x += u * 3.3, c++) circ(g, x, y, u * 1.8, RAINBOW[(row * 7 + c * 3) % 6], INK, 1.5);
      g.restore(); rr(g, P.x, P.y, P.w, P.h, u * 3, null, INK, 4);
      for (const st of s.stars) { const sp = this.starPos(G, st, L); E(g, "⭐", sp.x, sp.y + Math.sin(G.t * 3 + st.tw) * u, u * 6.5, Math.sin(G.t * 2 + st.tw) * 0.2); }
      for (const f of s.sl) { const p = this.pos(G, f, L); E(g, f.e, p.x, p.y, u * 9, f.hop > 0 ? (1 - f.hop / 0.55) * Math.PI * 2 : -0.2); }
      const bob = Math.sin(G.t * 4) * u * 0.8; E(g, s.next, L.fr.x, L.fr.y + bob, u * 10);
      if (s.cool <= 0) txt(g, "TAP!", L.fr.x, L.fr.y - u * 9 + bob, u * 3.4, "#fff", { stroke: INK });
      head(G, g, `🌈 Whooshes: ${s.landed} · ⭐ ${s.got}`); },
    hot(G) { const s = G.s; for (const f of s.sl) if (f.hop <= 0 && s.stars.some((st) => st.p - f.p > 0.02 && st.p - f.p < 0.1)) return { x: G.W * 0.5, y: G.H * 0.45 }; return this.L(G).fr; },
  },
  {
    id: "glitter", name: "Glitter Jar", rar: "sparkly", ico: "✨", unit: "sparkles", base: 3, bg: ["#fbe9ff", "#e2d4ff"],
    blurb: "Tap (or wiggle your finger) to SHAKE the glitter jar! Then let it settle… the glitter makes a secret picture!",
    ups: [["tap", "Big Shakes", "💪"], ["auto", "Glitter Fairies", "🧚"], ["mult", "Extra Sparkle", "💎"]],
    win: ["Ooooh, sparkly!", "There's glitter on your nose now. It looks great.", "The jar made a picture of YOU! (Maybe.)", "The glitter is doing a little dance.", "So much sparkle the sun put on sunglasses.", "The fairies want to borrow your jar.", "You made a whole glitter art museum!", "Every picture is a masterpiece.", "Grand Glitter Wizard of Pizza Town!"],
    PICS: [["🍕", "a PIZZA"], ["💖", "a HEART"], ["⭐", "a STAR"], ["🐔", "a CHICKEN"], ["🌈", "a RAINBOW"], ["🦄", "a UNICORN"], ["🐱", "a KITTY"], ["🍦", "an ICE CREAM"]],
    N: 300, GLIT: ["#ff86b3", "#ffd23f", "#b18cff", "#6ec6ff", "#7cffb0", "#ffffff"],
    init(G) { const s = G.s; Object.assign(s, { e: 0, settle: 0, k: -1, shown: false, showT: 0, pics: 0, drag: 0, gl: [] });
      for (let i = 0; i < this.N; i++) { const x = rnd(-0.85, 0.85), y = 0.9 - rnd(0, 0.32) * (1 - Math.abs(x)); s.gl.push({ x, y, vx: 0, vy: 0, tx: x, ty: y, c: pick(this.GLIT), tc: null }); } },
    jar(G) { return { x: G.cx, y: G.H * 0.55, R: Math.min(G.W * 0.28, G.H * 0.25) }; },
    shake(G, amt) { const s = G.s;
      if (s.k < 0 || s.shown) { s.k = (s.k + 1) % this.PICS.length; s.shown = false; const pts = glyphPts(this.PICS[s.k][0], this.N); s.gl.forEach((p, i) => { p.tx = pts[i].x; p.ty = pts[i].y; p.tc = pts[i].c; }); }
      s.e = Math.min(1.6, s.e + amt); s.settle = 0; for (const p of s.gl) { p.vx += rnd(-1, 1) * amt * 3; p.vy += rnd(-1.6, 0.6) * amt * 3; }
      G.noise(0.12, { vol: 0.08, f0: 6000, f1: 3000, type: "highpass" }); },
    down(G, x, y) { this.shake(G, 0.5); G.add(1, x, y, { color: "#ff86b3" }); G.tone(rnd(1200, 1800), 0.06, { type: "triangle", vol: 0.05 }); },
    move(G, x, y, ox, oy) { const s = G.s; if (!G.down) return; s.drag += dist(x, y, ox, oy); if (s.drag > G.u * 12) { s.drag = 0; this.shake(G, 0.25); G.add(1, x, y, { color: "#b18cff" }); } },
    update(G, dt) { const s = G.s, J = this.jar(G); s.e = Math.max(0, s.e - dt * 0.7); const w = clamp(1 - s.e * 2.5, 0, 1);
      for (const p of s.gl) { if (s.e > 0) { p.vx += (-p.y * 2 + rnd(-1, 1) * 3) * s.e * dt * 3; p.vy += (p.x * 2 + rnd(-1, 1) * 3) * s.e * dt * 3; }
        p.vx *= 1 - Math.min(1, dt * 2); p.vy *= 1 - Math.min(1, dt * 2); p.x += p.vx * dt; p.y += p.vy * dt;
        if (w > 0) { const k = Math.min(1, dt * 3 * w); p.x += (p.tx - p.x) * k; p.y += (p.ty - p.y) * k; }
        const r = Math.hypot(p.x, p.y) / 1.2; if (r > 1) { p.x /= r; p.y /= r; p.vx *= -0.5; p.vy *= -0.5; } }
      if (s.e < 0.08) s.settle += dt; if (s.shown) s.showT += dt;
      if (!s.shown && s.k >= 0 && s.settle > 1.2) { s.shown = true; s.showT = 0; s.pics++; G.add(15, J.x, J.y - J.R, { color: "#ffd23f" }); SFX.win(); G.burst(J.x, J.y - J.R, ["✨", "💖"], 8); G.say(`It's ${this.PICS[s.k][1]}!`, J.x, J.y - J.R * 1.4, 1.8);
        if (s.pics % 4 === 0) { G.add(40, G.cx, G.cy, { color: "#ffd23f", noCrit: true }); SFX.wow(); G.flash("#fff0fb"); G.float("✨ GLITTER GALAXY! ✨", G.cx, G.u * 18, "#b18cff", 1.3); G.burst(J.x, J.y, ["✨", "⭐", "💎"], 18); } } },
    autoTick(G) { const s = G.s, J = this.jar(G); if (s.k < 0 || (s.shown && s.showT > 1.5)) this.shake(G, 0.6); G.burst(J.x + rnd(-1, 1) * J.R * 0.6, J.y - J.R * 1.2, "✨", 2, { size: 0.6 }); },
    draw(G, g) { const s = G.s, J = this.jar(G), R = J.R, u = G.u, fr = s.k >= 0 ? clamp(s.settle / 1.0, 0, 1) : 0, wob = Math.sin(G.t * 28) * Math.min(1, s.e) * 0.07;
      rr(g, G.W * 0.12, J.y + R * 1.12, G.W * 0.76, u * 3, u * 1.5, "#c98a52", INK, 3);
      g.save(); g.translate(J.x, J.y + R); g.rotate(wob); g.translate(-J.x, -J.y - R);
      if (s.shown) { g.globalAlpha = 0.35 + Math.sin(G.t * 4) * 0.15; circ(g, J.x, J.y, R * 1.35, "#fff6a8", null); g.globalAlpha = 1; }
      rr(g, J.x - R * 1.08, J.y - R * 1.08, R * 2.16, R * 2.2, R * 0.32, "rgba(255,255,255,.5)", INK, 4);
      const rad = R * 0.042 + 0.5;
      for (let i = 0; i < s.gl.length; i++) { const p = s.gl[i], px = J.x + p.x * R * 0.95, py = J.y + p.y * R * 0.95; g.fillStyle = p.c; g.beginPath(); g.arc(px, py, rad, 0, 7); g.fill();
        if (fr > 0 && p.tc) { g.globalAlpha = fr; g.fillStyle = p.tc; g.beginPath(); g.arc(px, py, rad * 1.15, 0, 7); g.fill(); g.globalAlpha = 1; }
        if (i % 11 === 0) { g.globalAlpha = 0.5 + Math.sin(G.t * 6 + i) * 0.5; g.fillStyle = "#fff"; g.beginPath(); g.arc(px, py, rad * 0.5, 0, 7); g.fill(); g.globalAlpha = 1; } }
      rr(g, J.x - R * 0.88, J.y - R * 0.8, R * 0.13, R * 1.1, R * 0.07, "rgba(255,255,255,.6)", null);
      rr(g, J.x - R * 0.85, J.y - R * 1.4, R * 1.7, R * 0.36, R * 0.12, "#ff86b3", INK, 4); for (let i = 1; i < 6; i++) { g.strokeStyle = "rgba(255,255,255,.6)"; g.lineWidth = 2; g.beginPath(); g.moveTo(J.x - R * 0.85 + i * R * 0.283, J.y - R * 1.36); g.lineTo(J.x - R * 0.85 + i * R * 0.283, J.y - R * 1.08); g.stroke(); }
      g.restore();
      head(G, g, `✨ Pictures made: ${s.pics}`);
      hint(G, g, s.k < 0 ? "Tap to SHAKE the jar!" : s.shown ? `${this.PICS[s.k][1]}! Shake for a new one!` : s.e > 0.08 ? "Now let it settle… shhh 🤫" : "Settling… ✨", u * 12.5); },
    hot(G) { return this.jar(G); },
  },
  {
    id: "butterfly", name: "Butterfly Garden", rar: "sparkly", ico: "🦋", unit: "flutters", base: 3, bg: ["#eaffe0", "#c8f0b0"],
    blurb: "Feed the hungry caterpillars yummy leaves! When they're full they snooze in a cocoon… then out pops a beautiful butterfly! Tap butterflies to wave hello.",
    ups: [["tap", "Juicy Leaves", "🍃"], ["auto", "Ladybug Helpers", "🐞"], ["crit", "Rainbow Wings", "🌈"]],
    win: ["Flutter flutter! So pretty!", "A butterfly landed on your finger!", "The flowers are blooming just for you.", "The caterpillars made you a leaf crown.", "Your garden is the prettiest on the block.", "A butterfly wrote your name in the sky. Kind of.", "So many butterflies the garden looks like a rainbow!", "The Butterfly Queen sent you a thank-you card.", "Grand Gardener of All the Butterflies!"],
    WING: [["#ff86b3", "#ffd23f"], ["#6ec6ff", "#b18cff"], ["#ffb347", "#ff5d8f"], ["#7cffb0", "#6ec6ff"], ["#b18cff", "#ff86b3"], ["#ffe066", "#ff8a5c"]],
    init(G) { Object.assign(G.s, { sl: [0, 1, 2].map(() => this.fresh()), bf: [], made: 0, ballet: 0 }); },
    fresh() { return { st: "cat", food: 0, t: 0, munch: 0, wig: 0 }; },
    slot(G, i) { return { x: G.W * (0.2 + 0.3 * i), y: G.H * 0.64 }; },
    feed(G, i) { const q = G.s.sl[i], p = this.slot(G, i);
      if (q.st === "cat") { q.food++; q.munch = 0.5; G.add(1, p.x, p.y - G.u * 8, { color: "#7cffb0" }); G.tone(rnd(500, 700), 0.05, { type: "square", vol: 0.05 }); G.tone(rnd(500, 700), 0.05, { type: "square", vol: 0.05, when: 0.09 });
        if (q.food >= 6) { q.st = "coc"; q.t = 0; G.add(5, p.x, p.y - G.u * 12, { color: "#ffd23f" }); SFX.ding(); G.say("Yum! Nap time…", p.x, p.y - G.u * 12, 1.4); } }
      else { q.t += 0.8; q.wig = 0.5; G.add(1, p.x, p.y - G.u * 10); SFX.squeak(); } },
    emerge(G, i) { const s = G.s, p = this.slot(G, i), w = pick(this.WING); s.sl[i] = this.fresh(); s.made++;
      s.bf.push({ x: p.x, y: p.y - G.u * 6, tx: rnd(0.12, 0.88) * G.W, ty: rnd(0.18, 0.4) * G.H, ph: rnd(0, 6), c1: w[0], c2: w[1], wave: 0, rt: 2, bye: false });
      const stay = s.bf.filter((b) => !b.bye); if (stay.length > 7) stay[0].bye = true;
      G.add(20, p.x, p.y - G.u * 10, { color: "#ff86b3" }); SFX.sparkle(); SFX.win(); G.burst(p.x, p.y, ["✨", "🌸"], 10);
      if (s.made % 5 === 0) { s.ballet = 4; G.add(50, G.cx, G.cy, { color: "#ffd23f", noCrit: true }); SFX.wow(); G.float("🦋 BUTTERFLY BALLET! 🦋", G.cx, G.u * 18, "#b18cff", 1.3); G.flash("#fff0fb"); } },
    down(G, x, y) { const s = G.s;
      for (let i = 0; i < 3; i++) { const p = this.slot(G, i); if (dist(x, y, p.x, p.y - G.u * 2) < G.u * 13) return this.feed(G, i); }
      const b = s.bf.find((b) => !b.bye && dist(x, y, b.x, b.y) < G.u * 8); if (b) { b.wave = 0.8; G.add(2, b.x, b.y, { color: "#ff86b3" }); SFX.giggle(); G.burst(b.x, b.y, "💖", 3, { size: 0.6, grav: -0.3 }); G.say(pick(["Hi there!", "Flutter hello!", "Wheee!"]), b.x, b.y - G.u * 6, 1); return; }
      SFX.boop(); },
    update(G, dt) { const s = G.s; s.ballet = Math.max(0, s.ballet - dt);
      s.sl.forEach((q, i) => { q.munch = Math.max(0, q.munch - dt); q.wig = Math.max(0, q.wig - dt); if (q.st === "coc" && (q.t += dt * 0.6) >= 4) this.emerge(G, i); });
      const n = s.bf.length; s.bf.forEach((b, i) => { b.ph += dt * 14; b.wave = Math.max(0, b.wave - dt); let tx = b.tx, ty = b.ty;
        if (b.bye) { tx = b.x + G.u * 10; ty = -G.H * 0.3; } else if (s.ballet > 0) { const a = G.t * 1.5 + (i / n) * Math.PI * 2, r = Math.min(G.W, G.H) * 0.3; tx = G.cx + Math.cos(a) * r; ty = G.H * 0.36 + Math.sin(a) * r * 0.45; }
        else if ((b.rt -= dt) <= 0) { b.rt = rnd(1.5, 3); b.tx = rnd(0.1, 0.9) * G.W; b.ty = rnd(0.18, 0.42) * G.H; }
        const k = Math.min(1, dt * (s.ballet > 0 ? 3 : 1.2)); b.x += (tx - b.x) * k; b.y += (ty - b.y) * k + Math.sin(b.ph * 0.3) * G.u * 0.3; });
      s.bf = s.bf.filter((b) => !(b.bye && b.y < -G.u * 8)); },
    autoTick(G) { const s = G.s; let best = -1; s.sl.forEach((q, i) => { if (q.st === "cat" && (best < 0 || q.food > s.sl[best].food)) best = i; }); if (best < 0) best = 0; this.feed(G, best); const p = this.slot(G, best); G.burst(p.x, p.y - G.u * 6, "🐞", 1, { size: 0.6, grav: -0.2 }); },
    draw(G, g) { const s = G.s, u = G.u; E(g, "🌞", G.W * 0.88, G.H * 0.12, u * 11, Math.sin(G.t) * 0.1);
      for (let i = 0; i < 9; i++) E(g, ["🌷", "🌼", "🌸"][i % 3], G.W * (0.06 + i * 0.11), G.H * 0.84, u * 7, Math.sin(G.t * 2 + i) * 0.1);
      s.sl.forEach((q, i) => { const p = this.slot(G, i);
        oval(g, p.x, p.y + u * 3, u * 14, u * 5, "#5cb85c", INK, 3, -0.08); g.strokeStyle = "#3d8b3d"; g.lineWidth = 2; g.beginPath(); g.moveTo(p.x - u * 12, p.y + u * 4); g.lineTo(p.x + u * 12, p.y + u * 2); g.stroke();
        if (q.st === "cat") { const r = u * (2 + q.food * 0.28), sp = q.munch > 0 ? 12 : 5;
          for (let k = 4; k >= 0; k--) { const sx = p.x + (2 - k) * r * 1.25, sy = p.y - r * 0.5 - Math.abs(Math.sin(G.t * sp - k * 0.8)) * r * 0.4; circ(g, sx, sy, k === 0 ? r * 1.15 : r, k % 2 ? "#b5ec5b" : "#7ed957"); if (k) circ(g, sx, sy + r * 0.9, r * 0.2, INK, null); }
          const hx = p.x + 2 * r * 1.25, hy = p.y - r * 0.5 - Math.abs(Math.sin(G.t * sp)) * r * 0.4; g.strokeStyle = INK; g.lineWidth = 2; for (const sd of [-1, 1]) { g.beginPath(); g.moveTo(hx + sd * r * 0.4, hy - r); g.lineTo(hx + sd * r * 0.6, hy - r * 1.7); g.stroke(); circ(g, hx + sd * r * 0.6, hy - r * 1.7, r * 0.2, "#ff86b3", INK, 1.5); }
          face(g, hx, hy, r * 0.95, q.munch > 0 ? "joy" : "happy"); if (q.munch > 0) E(g, "🍃", hx + r * 1.5, hy, r * 1.6 * (q.munch / 0.5 + 0.3));
          bar(g, p.x - u * 8, p.y + u * 9, u * 16, u * 2.6, q.food / 6, "#7cffb0"); }
        else { const w = Math.sin(G.t * 30) * q.wig * 0.4 + Math.sin(G.t * 2) * 0.05; oval(g, p.x, p.y - u * 5, u * 5, u * 8, "#c9e89a", INK, 3, w); for (let k = -1; k <= 1; k++) oval(g, p.x + Math.sin(w) * k * u * 2, p.y - u * 5 + k * u * 2.6, u * 4.4, u * 0.6, "#a6cf6e", null, 0, w); circ(g, p.x + u * 1.5, p.y - u * 8, u * 0.7, "#ffd23f", null); circ(g, p.x - u * 1.8, p.y - u * 3, u * 0.6, "#ffd23f", null);
          txt(g, "z", p.x + u * 6, p.y - u * 12 - (G.t * 8 % 4) * u * 0.5, u * 3, "#fff", { stroke: INK }); bar(g, p.x - u * 8, p.y + u * 9, u * 16, u * 2.6, q.t / 4, "#ff86b3"); } });
      for (const b of s.bf) { bfly(g, b.x, b.y, u * (s.ballet > 0 ? 8 : 7), b.c1, b.c2, b.ph, Math.sin(b.ph * 0.15) * 0.2); if (b.wave > 0) E(g, "💖", b.x, b.y - u * 7, u * 4, 0, b.wave / 0.8); }
      head(G, g, `🦋 Butterflies: ${s.made}`); hint(G, g, s.sl.some((q) => q.st === "cat") ? "Tap a caterpillar to feed it! 🍃" : "Tap the cocoons to wake them up! ✨", G.u * 13); },
    hot(G) { const s = G.s; const i = s.sl.findIndex((q) => q.st === "cat"); const p = this.slot(G, i < 0 ? 0 : i); return { x: p.x, y: p.y - G.u * 2 }; },
  },
  {
    id: "crystal", name: "Singing Crystal Cave", rar: "sparkly", ico: "💎", unit: "notes", base: 3, bg: ["#2a1850", "#4a2d7a"], noDots: true,
    blurb: "The crystals sing a little tune — listen and watch them glow! Then tap the crystals in the same order to start a SPARKLE SHOW.",
    ups: [["tap", "Sparkle Wand", "🪄"], ["auto", "Bat Choir", "🦇"], ["mult", "Echo Magic", "🔮"]],
    win: ["La la LAAA! Beautiful!", "The crystals hummed you a thank-you song.", "The echo said 'bravo, bravo, bravo…'", "A sleepy bat woke up just to clap.", "The cave sparkles brighter than ever!", "You could be a crystal music teacher.", "The crystals want to go on tour with you.", "A whole crystal orchestra! Amazing!", "Grand Maestro of the Singing Cave!"],
    COL: ["#ff86b3", "#ffb347", "#ffe066", "#7cffb0", "#6ec6ff"], NOTE: [0, 4, 7, 9, 12],
    init(G) { Object.assign(G.s, { glow: [0, 0, 0, 0, 0], len: 3, seq: [], ph: "listen", pt: 1, pi: 0, i: 0, shows: 0, showT: 0, si: 0, st: 0 }); this.newSeq(G); },
    newSeq(G) { const s = G.s; s.seq = []; for (let k = 0; k < s.len; k++) { let n; do { n = Math.floor(Math.random() * 5); } while (k && n === s.seq[k - 1]); s.seq.push(n); } s.ph = "listen"; s.pi = 0; s.pt = 1; s.i = 0; },
    cry(G, k) { const w = Math.min(G.W * 0.13, G.u * 15), gap = Math.min(G.W * 0.18, w * 1.45); return { x: G.cx + (k - 2) * gap, y: G.H * 0.76, w, h: [0.26, 0.36, 0.44, 0.34, 0.28][k] * G.H }; },
    sing(G, k, quiet) { G.s.glow[k] = 0.5; if (!quiet) SFX.note(this.NOTE[k]); },
    press(G, k) { const s = G.s, c = this.cry(G, k), x = c.x, y = c.y - c.h * 0.6; this.sing(G, k); G.dots(x, y, ["#fff", this.COL[k]], 6);
      if (s.ph !== "play") { G.add(1, x, y, { color: this.COL[k] }); return; }
      if (k === s.seq[s.i]) { s.i++; G.add(2, x, y, { color: this.COL[k] });
        if (s.i >= s.len) { G.add(8 * s.len, G.cx, G.H * 0.25, { color: "#ffe066" }); SFX.wow(); s.ph = "show"; s.showT = 2.6; s.shows++; G.flash("#e8d4ff"); G.float("✨ SPARKLE SHOW! ✨", G.cx, G.u * 22, "#ffe066", 1.3); s.len = s.len >= 6 ? 3 : s.len + 1; } }
      else { G.add(1, x, y, { color: this.COL[k] }); G.say(pick(["Ooh, pretty! Let's hear it again!", "So close! Listen one more time!", "Whoops! Here's the tune again!"]), G.cx, G.H * 0.3, 1.4); s.ph = "listen"; s.pi = 0; s.pt = 1.3; s.i = 0; } },
    down(G, x, y) { for (let k = 0; k < 5; k++) { const c = this.cry(G, k); if (Math.abs(x - c.x) < c.w * 0.65 && y > c.y - c.h - G.u * 3 && y < c.y + G.u * 4) return this.press(G, k); } G.dots(x, y, ["#fff", "#e2d4ff"], 4); SFX.boop(); },
    update(G, dt) { const s = G.s; for (let k = 0; k < 5; k++) s.glow[k] = Math.max(0, s.glow[k] - dt);
      if (s.ph === "listen" && (s.pt -= dt) <= 0) { if (s.pi < s.len) { this.sing(G, s.seq[s.pi++]); s.pt = 0.6; } else s.ph = "play"; }
      if (s.ph === "show") { s.showT -= dt; if ((s.st -= dt) <= 0) { s.st = 0.15; this.sing(G, s.si % 5, s.si % 2 === 1); s.si++; } if (s.showT <= 0) this.newSeq(G); } },
    autoTick(G) { const s = G.s; if (s.ph === "play") { const k = s.seq[s.i], c = this.cry(G, k); this.press(G, k); G.burst(c.x, c.y - c.h, "🎵", 2, { size: 0.6, grav: -0.3 }); } else G.burst(G.cx, G.H * 0.2, "🎵", 1, { size: 0.6, grav: -0.3 }); },
    draw(G, g) { const s = G.s, u = G.u, show = s.ph === "show";
      g.fillStyle = "#1c0f38"; for (let i = 0; i < 12; i++) { const x = (i + 0.5) * G.W / 12, h = G.H * (0.06 + ((i * 37) % 7) * 0.012); g.beginPath(); g.moveTo(x - G.W / 26, 0); g.lineTo(x, h); g.lineTo(x + G.W / 26, 0); g.fill(); }
      for (let i = 0; i < 30; i++) { g.globalAlpha = 0.3 + Math.sin(G.t * 2 + i) * 0.3; circ(g, (i * 137.5) % G.W, G.H * 0.12 + ((i * 71.3) % (G.H * 0.55)), u * 0.5, RAINBOW[i % 6], null); } g.globalAlpha = 1;
      rr(g, -10, G.H * 0.76, G.W + 20, G.H, 0, "#3a2363", INK, 3);
      for (let k = 0; k < 5; k++) { const c = this.cry(G, k), gl = show ? 0.3 + Math.sin(G.t * 10 + k) * 0.2 : s.glow[k] * 2, col = show ? RAINBOW[(k + Math.floor(G.t * 6)) % 6] : this.COL[k];
        if (gl > 0) { g.globalAlpha = clamp(gl, 0, 1) * 0.45; circ(g, c.x, c.y - c.h * 0.5, c.h * 0.55, col, null); g.globalAlpha = 1; }
        g.beginPath(); g.moveTo(c.x - c.w / 2, c.y); g.lineTo(c.x + c.w / 2, c.y); g.lineTo(c.x + c.w / 2, c.y - c.h * 0.72); g.lineTo(c.x, c.y - c.h); g.lineTo(c.x - c.w / 2, c.y - c.h * 0.72); g.closePath(); g.fillStyle = col; g.fill(); g.strokeStyle = INK; g.lineWidth = 3; g.stroke();
        g.fillStyle = "rgba(255,255,255,.35)"; g.beginPath(); g.moveTo(c.x - c.w / 2, c.y - c.h * 0.72); g.lineTo(c.x, c.y - c.h); g.lineTo(c.x, c.y); g.lineTo(c.x - c.w / 2, c.y); g.closePath(); g.fill();
        if (gl > 0.05) { g.globalAlpha = clamp(gl, 0, 1) * 0.6; g.fillStyle = "#fff"; g.fill(); g.globalAlpha = 1; }
        face(g, c.x, c.y - c.h * 0.32, c.w * 0.34, s.glow[k] > 0 || show ? "wow" : s.ph === "listen" ? "happy" : "joy");
        if (s.glow[k] > 0) E(g, "🎵", c.x + c.w * 0.5, c.y - c.h - u * 3 - (0.5 - s.glow[k]) * u * 8, u * 5, 0, s.glow[k] * 2); }
      head(G, g, `💎 Sparkle shows: ${s.shows}`);
      const dw = u * 5; for (let k = 0; k < s.len && !show; k++) circ(g, G.cx + (k - (s.len - 1) / 2) * dw, u * 13.5, u * 1.6, (s.ph === "play" ? k < s.i : k < s.pi) ? "#ffe066" : "rgba(255,255,255,.3)", INK, 2);
      hint(G, g, show ? "✨ SPARKLE SHOW! ✨" : s.ph === "listen" ? "👂 Listen to the crystals…" : "🎵 Your turn! Copy the tune", u * 19.5); },
    hot(G) { const s = G.s, c = this.cry(G, s.ph === "play" ? s.seq[s.i] : 2); return { x: c.x, y: c.y - c.h * 0.4 }; },
  },
  {
    id: "starfish", name: "Starfish Beach Party", rar: "sparkly", ico: "⭐", unit: "high-fives", base: 3, bg: ["#9fdcff", "#ffe9b8"], noDots: true,
    blurb: "The starfish are dancing on the beach! Tap them for HIGH-FIVES (the one holding up a ✋ wants one most). Grab the seashells the waves bring in — 10 shells starts a BEACH PARTY!",
    ups: [["tap", "Sunny High-Fives", "🖐️"], ["auto", "Crab Collectors", "🦀"], ["crit", "Lucky Pearls", "💎"]],
    win: ["High five! Up top!", "The starfish taught you their dance.", "Your seashell bucket is overflowing!", "The waves are waving back at you.", "The seagulls want an invite to the party.", "The starfish made you an honorary starfish!", "Best beach party EVER!", "The sun stayed up late just to watch.", "Superstar of Starfish Beach!"],
    COL: ["#ff8a5c", "#ff86b3", "#b18cff"],
    init(G) { Object.assign(G.s, { want: 1, wt: 3, five: [0, 0, 0], fives: 0, shells: [], wc: 0, dropped: false, meter: 0, party: 0, parties: 0 }); },
    fish(G, i) { return { x: G.W * (0.2 + 0.3 * i), y: G.H * 0.7, r: Math.min(G.W * 0.1, G.u * 11) }; },
    edge(G) { const ph = G.s.wc % 5, f = ph < 1.2 ? Math.sin((ph / 1.2) * Math.PI / 2) : ph < 2.6 ? 1 - (ph - 1.2) / 1.4 : 0; return G.H * 0.3 + f * G.H * 0.2 + Math.sin(G.t * 2) * G.u; },
    collect(G, sh) { const s = G.s; sh.got = 0.4; s.meter++; G.add(sh.gold ? 10 : 3, sh.x, sh.y, { color: sh.gold ? "#ffd23f" : "#fff" }); sh.gold ? SFX.sparkle() : SFX.coin();
      if (s.meter >= 10) { s.meter = 0; s.party = 4; s.parties++; G.add(40, G.cx, G.cy, { color: "#ffd23f", noCrit: true }); SFX.wow(); G.float("🎉 BEACH PARTY! 🎉", G.cx, G.u * 24, "#ff5d8f", 1.3); G.burst(G.cx, G.H * 0.5, ["🎉", "🎶", "🏐", "⭐"], 18); } },
    five(G, i) { const s = G.s, p = this.fish(G, i); s.five[i] = 0.4; s.fives++;
      if (i === s.want) { G.add(5, p.x, p.y - p.r, { color: "#ffe066" }); SFX.ding(); G.burst(p.x, p.y - p.r, ["🙌", "✨"], 6); G.float("HIGH FIVE!", p.x, p.y - p.r * 1.8, "#fff", 1); let n; do { n = Math.floor(Math.random() * 3); } while (n === i); s.want = n; s.wt = 3.5; }
      else { G.add(1, p.x, p.y - p.r, { color: "#ffb3c8" }); SFX.giggle(); G.burst(p.x, p.y - p.r, "✋", 1, { size: 0.7 }); } },
    down(G, x, y) { const s = G.s; const sh = s.shells.find((q) => !q.got && dist(x, y, q.x, q.y) < G.u * 7); if (sh) return this.collect(G, sh);
      for (let i = 0; i < 3; i++) { const p = this.fish(G, i); if (dist(x, y, p.x, p.y) < p.r * 1.3) return this.five(G, i); } SFX.boop(); },
    update(G, dt) { const s = G.s; s.party = Math.max(0, s.party - dt); for (let i = 0; i < 3; i++) s.five[i] = Math.max(0, s.five[i] - dt); if ((s.wt -= dt) <= 0) { s.want = (s.want + 1 + Math.floor(Math.random() * 2)) % 3; s.wt = 3.5; }
      const was = s.wc % 5; s.wc += dt; const ph = s.wc % 5;
      if (was < 1.2 && ph >= 1.2) { for (const q of s.shells) if (!q.got && q.age > 4) q.got = 0.6, q.wash = true; const n = Math.min(2, 6 - s.shells.filter((q) => !q.got).length); for (let k = 0; k < n; k++) s.shells.push({ x: rnd(0.08, 0.92) * G.W, y: rnd(0.4, 0.5) * G.H, gold: Math.random() < 0.12, age: 0, got: 0, rot: rnd(-0.4, 0.4) }); }
      for (let i = s.shells.length - 1; i >= 0; i--) { const q = s.shells[i]; q.age += dt; if (q.got) { q.got -= dt; q.y -= G.u * (q.wash ? 10 : 25) * dt; if (q.got <= 0) s.shells.splice(i, 1); } } },
    autoTick(G) { const s = G.s, sh = s.shells.find((q) => !q.got); if (sh) { this.collect(G, sh); G.burst(sh.x, sh.y, "🦀", 1, { size: 0.6 }); } else this.five(G, s.want); },
    draw(G, g) { const s = G.s, u = G.u, ed = this.edge(G), sp = s.party > 0 ? 8 : 3;
      rr(g, -10, G.H * 0.22, G.W + 20, G.H, 0, "#ffe3a3", null); g.fillStyle = "rgba(200,160,90,.18)"; g.fillRect(0, G.H * 0.22, G.W, ed - G.H * 0.2 + u * 3);
      E(g, "🌞", G.W * 0.12, G.H * 0.1, u * 10, Math.sin(G.t) * 0.1);
      g.beginPath(); g.moveTo(-10, G.H * 0.14); g.lineTo(G.W + 10, G.H * 0.14); g.lineTo(G.W + 10, ed); for (let x = G.W; x >= -10; x -= 10) g.lineTo(x, ed + Math.sin(x * 0.03 + G.t * 2) * u * 1.2); g.closePath(); g.fillStyle = "#4fc3f7"; g.fill();
      g.strokeStyle = "#fff"; g.lineWidth = u * 1.2; g.beginPath(); for (let x = -10; x <= G.W + 10; x += 10) g.lineTo(x, ed + Math.sin(x * 0.03 + G.t * 2) * u * 1.2); g.stroke();
      E(g, "🌴", G.W * 0.94, G.H * 0.62, u * 16); E(g, "⛱️", G.W * 0.05, G.H * 0.6, u * 12);
      for (const q of s.shells) { const a = q.got ? clamp(q.got / 0.4, 0, 1) : 1; if (q.gold) { g.globalAlpha = a * (0.5 + Math.sin(G.t * 5) * 0.3); circ(g, q.x, q.y, u * 5, "#ffe066", null); g.globalAlpha = 1; } E(g, "🐚", q.x, q.y, u * 7, q.rot, a); }
      for (let i = 0; i < 3; i++) { const p = this.fish(G, i), b = Math.abs(Math.sin(G.t * sp + i)) * u * 2.5, rot = Math.sin(G.t * sp * 0.7 + i * 1.3) * 0.35 + (s.party > 0 ? G.t * 3 : 0), sq = s.five[i] > 0 ? 1.12 : 1;
        oval(g, p.x, p.y + p.r * 0.95, p.r * 0.9, p.r * 0.2, "rgba(120,80,30,.18)", null);
        g.save(); g.translate(p.x, p.y - b); g.scale(sq, sq); star5(g, 0, 0, p.r, this.COL[i], rot); for (let k = 0; k < 5; k++) { const a = rot - Math.PI / 2 + (k * Math.PI * 2) / 5; circ(g, Math.cos(a) * p.r * 0.62, Math.sin(a) * p.r * 0.62, p.r * 0.07, "rgba(255,255,255,.7)", null); } face(g, 0, p.r * 0.05, p.r * 0.36, s.five[i] > 0 || s.party > 0 ? "joy" : "happy"); g.restore();
        if (i === s.want && s.party <= 0) { const by = p.y - p.r * 1.75 + Math.sin(G.t * 5) * u; circ(g, p.x, by, u * 5, "#fffaf0"); E(g, "✋", p.x, by, u * 6, Math.sin(G.t * 8) * 0.2); } }
      if (s.party > 0) { E(g, "🏐", G.cx + Math.sin(G.t * 2) * G.W * 0.3, G.H * 0.45 - Math.abs(Math.sin(G.t * 5)) * G.H * 0.12, u * 8, G.t * 4); for (let i = 0; i < 3; i++) E(g, "🎶", G.W * (0.2 + 0.3 * i), G.H * 0.5 - (G.t * 30 % 20) * u * 0.3, u * 5, 0, 0.8); }
      head(G, g, `⭐ High-fives: ${s.fives}`); bar(g, G.cx - u * 22, u * 11, u * 44, u * 4, s.meter / 10, "#ff86b3"); txt(g, `🐚 ${s.meter}/10 shells to a party!`, G.cx, u * 13, u * 2.8, INK, { weight: 800 }); },
    hot(G) { const s = G.s, sh = s.shells.find((q) => !q.got); return sh || this.fish(G, s.want); },
  },

  // ------------------------------------------------------------------------
  //  EPIC
  // ------------------------------------------------------------------------
  {
    id: "submarine", name: "Pizza Submarine", rar: "epic", ico: "🐠", unit: "treasures", base: 3, bg: ["#7fd8f5", "#0d4f80"], noDots: true,
    blurb: "Tap anywhere to steer the little yellow submarine! Drive to the treasure chests to find pizza inside. Tap the fish to wave hello, and pop the bubbles!",
    ups: [["tap", "Zoomy Propeller", "⚙️"], ["auto", "Dolphin Guides", "🐬"], ["mult", "Treasure Map", "🗺️"]],
    win: ["Blub blub! Treasure!", "The fish think your submarine is SO cool.", "Captain Cluck says: full speed ahead!", "You found the pizza at the bottom of the sea!", "An octopus gave you eight high-fives.", "The sea turtles want a ride.", "Your submarine is the shiniest in the ocean.", "The whole ocean is having a pizza party!", "Grand Admiral of the Pizza Sea!"],
    FISH: ["🐠", "🐟", "🐡", "🐙", "🐢", "🦑"],
    init(G) { Object.assign(G.s, { x: G.cx, y: G.H * 0.4, tx: G.cx, ty: G.H * 0.4, dir: 1, chest: null, ct: 0.5, found: 0, party: 0, fish: [0, 1, 2, 3].map((i) => this.newFish(G, i)), bub: [], bt: 0, hi: 0 }); },
    newFish(G, i) { return { e: pick(this.FISH), fy: 0.26 + i * 0.13 + rnd(-0.02, 0.02), x: rnd(0, G.W), vx: (Math.random() < 0.5 ? -1 : 1) * G.u * rnd(6, 12), wv: 0, ph: rnd(0, 6) }; },
    floor(G) { return G.H * 0.84; },
    chestPos(G) { const c = G.s.chest; return { x: c.fx * G.W, y: this.floor(G) - G.u * 4 }; },
    subR(G) { return Math.min(G.W * 0.12, G.u * 12); },
    down(G, x, y) { const s = G.s, u = G.u;
      for (const f of s.fish) { const fy = f.fy * G.H; if (dist(x, y, f.x, fy) < u * 8) { f.wv = 1; s.hi = 0.8; G.add(2, f.x, fy, { color: "#ffb3c8" }); SFX.giggle(); G.burst(f.x, fy, "💖", 3, { size: 0.6, grav: -0.3 }); G.say(pick(["Hello!", "Blub blub!", "Hi friend!", "Nice sub!"]), f.x, fy - u * 5, 1); return; } }
      const b = s.bub.findIndex((b) => dist(x, y, b.x, b.y) < b.r + u * 2); if (b >= 0) { const q = s.bub[b]; s.bub.splice(b, 1); SFX.pop(1.3); G.add(1, q.x, q.y, { color: "#bfefff" }); G.dots(q.x, q.y, ["#fff", "#bfefff"], 6); return; }
      s.tx = clamp(x, u * 12, G.W - u * 12); s.ty = clamp(y, G.H * 0.2, G.H * 0.78); G.add(1, x, y, { color: "#bfefff" }); G.tone(220, 0.12, { type: "triangle", vol: 0.08, slideTo: 330 }); },
    update(G, dt) { const s = G.s, u = G.u; s.hi = Math.max(0, s.hi - dt); s.party = Math.max(0, s.party - dt);
      s.x += (s.tx - s.x) * Math.min(1, dt * 2.2); s.y += (s.ty - s.y) * Math.min(1, dt * 2.2); if (s.tx > s.x + 3) s.dir = 1; else if (s.tx < s.x - 3) s.dir = -1; s.x = clamp(s.x, 0, G.W); s.y = clamp(s.y, G.H * 0.15, G.H * 0.85);
      if (!s.chest) { if ((s.ct -= dt) <= 0) { let fx; do { fx = rnd(0.12, 0.88); } while (Math.abs(fx * G.W - s.x) < G.W * 0.2); s.chest = { fx, open: 0 }; } }
      else if (!s.chest.open) { const c = this.chestPos(G); if (dist(s.x, s.y, c.x, c.y) < u * 16) { s.chest.open = 0.01; s.found++; G.add(15, c.x, c.y - u * 8, { color: "#ffd23f" }); SFX.coin(); SFX.win(); G.burst(c.x, c.y - u * 3, ["🍕", "🍕", "✨", "🪙"], 10, { grav: 0.4 });
          if (s.found % 5 === 0) { s.party = 4; G.add(50, G.cx, G.cy, { color: "#ffd23f", noCrit: true }); SFX.wow(); G.flash("#d8fbff"); G.float("🎉 TREASURE PARTY! 🎉", G.cx, G.u * 20, "#ffd23f", 1.3); } } }
      else if ((s.chest.open += dt) > 2) { s.chest = null; s.ct = 1; }
      for (const f of s.fish) { f.x += f.vx * dt * (s.party > 0 ? 2.5 : 1); f.ph += dt * 3; f.wv = Math.max(0, f.wv - dt); if (f.x < -u * 10) f.x = G.W + u * 8; if (f.x > G.W + u * 10) f.x = -u * 8; }
      if ((s.bt -= dt) <= 0) { s.bt = 0.7; s.bub.push({ x: rnd(0.05, 0.95) * G.W, y: this.floor(G), r: u * rnd(2, 3.5), vy: u * rnd(8, 14), ph: rnd(0, 6) }); }
      for (let i = s.bub.length - 1; i >= 0; i--) { const b = s.bub[i]; b.y -= b.vy * dt; b.ph += dt * 3; if (b.y < G.H * 0.1) s.bub.splice(i, 1); } },
    autoTick(G) { const s = G.s; if (s.chest && !s.chest.open) { const c = this.chestPos(G); s.tx = c.x; s.ty = Math.min(G.H * 0.78, c.y - G.u * 6); } G.burst(s.x, s.y - G.u * 5, "🫧", 1, { size: 0.6, grav: -0.4 }); },
    draw(G, g) { const s = G.s, u = G.u, fl = this.floor(G);
      for (let i = 0; i < 5; i++) { g.globalAlpha = 0.1; g.fillStyle = "#fff"; const x = G.W * (0.1 + i * 0.22) + Math.sin(G.t * 0.5 + i) * u * 3; g.beginPath(); g.moveTo(x, 0); g.lineTo(x + u * 8, 0); g.lineTo(x + u * 22, fl); g.lineTo(x + u * 10, fl); g.fill(); } g.globalAlpha = 1;
      rr(g, -10, fl, G.W + 20, G.H, 0, "#f2d18b", INK, 3);
      for (let i = 0; i < 8; i++) { const x = G.W * (0.04 + i * 0.13); g.strokeStyle = i % 2 ? "#3fae5c" : "#2e8b57"; g.lineWidth = u * 1.4; g.lineCap = "round"; g.beginPath(); g.moveTo(x, fl + u); for (let k = 1; k <= 6; k++) g.lineTo(x + Math.sin(G.t * 1.5 + k * 0.8 + i) * u * 1.6, fl - k * u * 2.6); g.stroke(); } g.lineCap = "butt";
      for (const b of s.bub) { circ(g, b.x + Math.sin(b.ph) * u, b.y, b.r, "rgba(220,247,255,.35)", "rgba(255,255,255,.8)", 2); circ(g, b.x + Math.sin(b.ph) * u - b.r * 0.35, b.y - b.r * 0.35, b.r * 0.25, "#fff", null); }
      if (s.chest) { const c = this.chestPos(G), op = s.chest.open, cw = u * 12, ch = u * 7; if (op) { g.globalAlpha = clamp(1 - (op - 1.2), 0, 1) * 0.6; circ(g, c.x, c.y - ch, u * 10, "#fff6a8", null); g.globalAlpha = 1; E(g, "🍕", c.x, c.y - ch - op * u * 4, u * 8, Math.sin(G.t * 4) * 0.2); }
        else { g.globalAlpha = 0.4 + Math.sin(G.t * 4) * 0.2; circ(g, c.x, c.y, u * 10, "#fff6a8", null); g.globalAlpha = 1; }
        rr(g, c.x - cw / 2, c.y - ch / 2, cw, ch, u, "#a0632f", INK, 3); rr(g, c.x - cw / 2, c.y - ch / 2 + ch * 0.35, cw, ch * 0.2, 0, "#ffd23f", INK, 2);
        g.save(); g.translate(c.x - cw / 2, c.y - ch / 2); g.rotate(op ? -Math.min(1, op * 3) * 1.2 : 0); rr(g, 0, -ch * 0.45, cw, ch * 0.45, u * 1.5, "#b8743a", INK, 3); g.restore(); circ(g, c.x, c.y - ch * 0.1, u * 1.1, "#ffd23f"); }
      for (const f of s.fish) { const fy = f.fy * G.H + Math.sin(f.ph) * u * 1.5; E(g, f.e, f.x, fy, u * 8, f.wv > 0 ? Math.sin(f.wv * 12) * 0.3 : 0, 1, f.vx > 0 ? -1 : 1, 1); if (f.wv > 0) E(g, "💖", f.x, fy - u * 6, u * 4, 0, f.wv); }
      const R = this.subR(G); g.save(); g.translate(s.x, s.y + Math.sin(G.t * 2) * u); g.scale(s.dir, 1); g.rotate(clamp((s.ty - s.y) * 0.003, -0.25, 0.25));
      const pr = Math.sin(G.t * 25); oval(g, -R * 1.12, 0, R * 0.12, R * 0.35 * Math.abs(pr) + 2, "#ff86b3", INK, 2);
      rr(g, -R * 0.15, -R * 0.95, R * 0.45, R * 0.45, R * 0.1, "#ffc107", INK, 3); g.strokeStyle = INK; g.lineWidth = 3; g.beginPath(); g.moveTo(R * 0.15, -R * 0.95); g.lineTo(R * 0.15, -R * 1.25); g.lineTo(R * 0.35, -R * 1.25); g.stroke();
      oval(g, 0, 0, R, R * 0.58, "#ffd23f", INK, 4); for (let i = 0; i < 3; i++) circ(g, -R * 0.55 + i * R * 0.18, R * 0.25, R * 0.05, "#c98a00", null);
      circ(g, R * 0.35, -R * 0.02, R * 0.3, "#bfefff", INK, 3); E(g, "🐔", R * 0.35, -R * 0.02, R * 0.5, 0, 1, -1, 1); circ(g, -R * 0.25, -R * 0.05, R * 0.14, "#bfefff", INK, 2);
      g.restore(); if (s.hi > 0) E(g, "👋", s.x + s.dir * R * 0.4, s.y - R * 1.1, u * 6, Math.sin(G.t * 14) * 0.4);
      head(G, g, `🍕 Treasure chests: ${s.found}`); txt(g, `🌊 Depth: ${Math.round((s.y / G.H) * 120)} m`, G.cx, u * 12.5, u * 3, "#fff", { stroke: INK }); },
    hot(G) { const s = G.s; if (s.chest && !s.chest.open) { const c = this.chestPos(G); return { x: c.x, y: c.y - G.u * 6 }; } const f = s.fish.find((f) => f.x > G.u * 10 && f.x < G.W - G.u * 10); return f ? { x: f.x, y: f.fy * G.H } : { x: G.cx, y: G.cy }; },
  },
  {
    id: "sandcastle", name: "Sandcastle Pizzeria", rar: "epic", ico: "🏰", unit: "pats", base: 3, bg: ["#9fdcff", "#ffe2a6"], noDots: true,
    blurb: "Tap to pat-pat-pat the sand and build a sandcastle, layer by layer! Then add flags and shells. Then Chef Crab opens a PIZZERIA — tap to serve pizza to the beach friends!",
    ups: [["tap", "Wet Sand", "🏖️"], ["auto", "Bucket Buddies", "🪣"], ["crit", "Sparkly Shells", "🐚"]],
    win: ["Pat pat pat! What a castle!", "Chef Crab says your castle is 'crabulous'.", "The seagulls made a reservation.", "Your castle has the best view on the beach.", "Even the tide stopped to say 'wow'.", "Chef Crab invented sand-dollar pizza!", "A whole sandcastle KINGDOM!", "The beach friends gave you five stars.", "Royal Sandcastle Pizza Master!"],
    PATS: 5, CUST: ["🐢", "🐧", "🦭", "🐙", "🐥", "🐸", "🦦", "🐳"],
    init(G) { Object.assign(G.s, { ph: "build", lay: 0, pats: 0, dec: 0, served: 0, cust: [], ct: 0, fly: null, castles: 0, done: 0, puff: 0 }); },
    geo(G) { const CW = Math.min(G.W * 0.62, G.u * 78), lh = Math.min(G.H * 0.1, G.u * 10); return { CW, lh, gy: G.H * 0.8, ws: [1, 0.74, 0.5, 0.26].map((k) => k * CW) }; },
    DEC(G) { const { lh, gy, ws } = this.geo(G), cx = G.cx, u = G.u; return [["🚩", cx + u * 1.5, gy - 4 * lh - u * 3.5], ["🚩", cx - ws[0] / 2 + u * 3.5, gy - lh - u * 3.5], ["🚩", cx + ws[0] / 2 - u * 2, gy - lh - u * 3.5], ["🐚", cx - ws[1] * 0.32, gy - lh * 1.5], ["🐚", cx + ws[1] * 0.32, gy - lh * 1.5], ["⭐", cx, gy - lh * 2.5]]; },
    crab(G) { const { gy, ws } = this.geo(G); return { x: G.cx - ws[0] * 0.32, y: gy + G.u * 2 }; },
    act(G, x, y) { const s = G.s, Q = this.geo(G), u = G.u;
      if (s.ph === "build") { s.pats++; s.puff = 0.2; G.add(1, x, y, { color: "#fff3c4" }); G.noise(0.08, { vol: 0.16, f0: 800, f1: 200 }); G.dots(G.cx + rnd(-1, 1) * Q.ws[s.lay] * 0.4, Q.gy - s.lay * Q.lh - u * 2, ["#f2d18b", "#e0b86a"], 5);
        if (s.pats >= this.PATS) { s.pats = 0; s.lay++; G.add(5, G.cx, Q.gy - s.lay * Q.lh - u * 3, { color: "#ffd23f" }); SFX.ding(); if (s.lay >= 4) { s.ph = "decor"; s.dec = 0; G.say("Now let's decorate!", G.cx, Q.gy - 4 * Q.lh - u * 7, 1.5); } } return; }
      if (s.ph === "decor") { const d = this.DEC(G)[s.dec]; s.dec++; G.add(3, d[1], d[2], { color: "#ff86b3" }); SFX.pop(1.2); G.burst(d[1], d[2], "✨", 4, { size: 0.6 });
        if (s.dec >= 6) { s.ph = "open"; s.served = 0; s.ct = 0.3; G.float("🍕 PIZZERIA OPEN! 🍕", G.cx, u * 22, "#ff5a5f", 1.3); SFX.win(); } return; }
      if (s.ph === "open") { const c = s.cust.find((c) => c.at && !c.got && !c.leave); if (!c || s.fly) { G.add(1, x, y); SFX.tap(); return; } s.fly = { c, p: 0 }; c.got = true; SFX.whoosh(); return; }
      G.add(1, x, y); SFX.tap(); },
    down(G, x, y) { this.act(G, x, y); },
    update(G, dt) { const s = G.s, Q = this.geo(G), u = G.u, cr = this.crab(G); s.puff = Math.max(0, s.puff - dt);
      if (s.ph === "open" && (s.ct -= dt) <= 0 && s.cust.filter((c) => !c.leave).length < 3 && s.served + s.cust.filter((c) => !c.leave).length < 6) { s.ct = 1.2; s.cust.push({ e: pick(this.CUST), x: G.W + u * 10, at: false, got: false, leave: false, ph: rnd(0, 6), joy: 0 }); }
      let qi = 0; for (let k = 0; k < s.cust.length; k++) { const c = s.cust[k]; c.ph += dt * 8; c.joy = Math.max(0, c.joy - dt); if (c.leave) { c.x += u * 22 * dt; continue; } const tx = cr.x + u * 14 + qi++ * u * 11; c.x += Math.sign(tx - c.x) * Math.min(Math.abs(tx - c.x), u * 25 * dt); c.at = Math.abs(tx - c.x) < u; }
      s.cust = s.cust.filter((c) => c.x < G.W + u * 14);
      if (s.fly && (s.fly.p += dt * 2.5) >= 1) { const c = s.fly.c; s.fly = null; c.leave = true; c.joy = 1; s.served++; G.add(6, c.x, Q.gy - u * 10, { color: "#ff86b3" }); SFX.coin(); G.burst(c.x, Q.gy - u * 6, ["💖", "😋"], 4, { size: 0.7 });
        if (s.served >= 6) { s.ph = "done"; s.done = 2.6; s.castles++; G.add(50, G.cx, G.cy, { color: "#ffd23f", noCrit: true }); SFX.wow(); G.flash("#fff7d0"); G.float("⭐ Best pizzeria on the beach! ⭐", G.cx, u * 22, "#ffd23f", 1.2); G.burst(G.cx, Q.gy - Q.lh * 3, ["🎉", "⭐", "🍕"], 16); } }
      if (s.ph === "done" && (s.done -= dt) <= 0) { s.ph = "build"; s.lay = 0; s.pats = 0; s.dec = 0; G.say("Let's build a NEW one!", G.cx, Q.gy - u * 8, 1.5); } },
    autoTick(G) { const Q = this.geo(G); this.act(G, G.cx, Q.gy - Q.lh); G.burst(G.cx - Q.CW * 0.5, Q.gy - G.u * 3, "🪣", 1, { size: 0.6 }); },
    draw(G, g) { const s = G.s, Q = this.geo(G), u = G.u, cx = G.cx;
      E(g, "🌞", G.W * 0.88, G.H * 0.1, u * 10); g.fillStyle = "#4fc3f7"; g.fillRect(0, G.H * 0.3, G.W, G.H * 0.12); g.strokeStyle = "#fff"; g.lineWidth = u; g.beginPath(); for (let x = 0; x <= G.W; x += 10) g.lineTo(x, G.H * 0.42 + Math.sin(x * 0.03 + G.t * 2) * u); g.stroke();
      g.fillStyle = "#ffe3a3"; g.fillRect(0, G.H * 0.42 + u, G.W, G.H);
      const sand = "#f2d18b";
      for (let i = 0; i < Math.min(4, s.lay); i++) { const w = Q.ws[i], y = Q.gy - (i + 1) * Q.lh; rr(g, cx - w / 2, y, w, Q.lh + 2, u, sand, INK, 3);
        for (let k = 0; k < 6; k++) circ(g, cx - w / 2 + ((k * 0.37 + i * 0.21) % 1) * w, y + Q.lh * (0.3 + (k % 3) * 0.2), u * 0.5, "#d9b06a", null);
        const nb = Math.max(2, Math.round(w / (u * 7))); for (let k = 0; k < nb; k += 2) rr(g, cx - w / 2 + (k / nb) * w, y - u * 2.2, w / nb, u * 2.6, u * 0.5, sand, INK, 2);
        if (i === 0) { g.beginPath(); g.moveTo(cx - u * 4, Q.gy); g.lineTo(cx - u * 4, Q.gy - Q.lh * 0.55); g.arc(cx, Q.gy - Q.lh * 0.55, u * 4, Math.PI, 0); g.lineTo(cx + u * 4, Q.gy); g.closePath(); g.fillStyle = "#7a4a2a"; g.fill(); g.strokeStyle = INK; g.lineWidth = 3; g.stroke(); }
        if (i === 1 || i === 2) for (const sd of [-1, 1]) rr(g, cx + sd * w * 0.18 - u * 1.4, y + Q.lh * 0.3, u * 2.8, Q.lh * 0.45, u * 1.4, "#7a4a2a", INK, 2); }
      if (s.ph === "build") { const w = Q.ws[s.lay], fr = s.pats / this.PATS, y = Q.gy - s.lay * Q.lh; if (fr > 0) rr(g, cx - w / 2 * (0.6 + fr * 0.4), y - Q.lh * fr, w * (0.6 + fr * 0.4), Q.lh * fr + 2, u * 2, sand, INK, 3);
        g.setLineDash([u, u]); rr(g, cx - w / 2, y - Q.lh, w, Q.lh, u, null, "rgba(74,42,26,.4)", 2); g.setLineDash([]); E(g, "🖐️", cx + w * 0.3, y - Q.lh - u * 3 + (s.puff > 0 ? u * 2 : -Math.abs(Math.sin(G.t * 5)) * u * 2), u * 7); }
      const D = this.DEC(G), nd = s.ph === "build" ? 0 : s.ph === "decor" ? s.dec : 6; for (let i = 0; i < nd; i++) E(g, D[i][0], D[i][1], D[i][2], u * 6, Math.sin(G.t * 3 + i) * 0.08);
      if (s.ph === "decor" && s.dec < 6) { const d = D[s.dec], pu = 1 + Math.sin(G.t * 6) * 0.15; circ(g, d[1], d[2], u * 4.5 * pu, "rgba(255,255,255,.4)", "#fff", 2); E(g, d[0], d[1], d[2], u * 6, 0, 0.45); }
      if (s.ph === "open" || s.ph === "done") { const by = Q.gy - Q.lh * 0.95; rr(g, cx - u * 10, by - u * 2.4, u * 20, u * 4.8, u * 1.2, "#ff5a5f", INK, 3); txt(g, "PIZZERIA", cx, by, u * 2.8, "#fff");
        const cr = this.crab(G); E(g, "🦀", cr.x, cr.y - u * 4 + Math.abs(Math.sin(G.t * 4)) * -u, u * 10); for (const [dx, r] of [[-1.6, 1.4], [0, 1.9], [1.6, 1.4]]) circ(g, cr.x + dx * u, cr.y - u * 10.5, u * r, "#fff"); rr(g, cr.x - u * 2.6, cr.y - u * 9.8, u * 5.2, u * 1.8, u * 0.4, "#fff", INK, 2);
        for (const c of s.cust) { E(g, c.e, c.x, Q.gy - u * 4 - Math.abs(Math.sin(c.ph)) * u * (c.at && !c.leave ? 0.3 : 1.2), u * 9, 0, 1, c.leave ? -1 : 1, 1); if (c.at && !c.got) { circ(g, c.x + u * 4, Q.gy - u * 12, u * 3.4, "#fffaf0"); E(g, "🍕", c.x + u * 4, Q.gy - u * 12, u * 4); } if (c.joy > 0) E(g, "💖", c.x, Q.gy - u * 12, u * 4, 0, c.joy); }
        if (s.fly) { const c = s.fly.c, p = s.fly.p; E(g, "🍕", cr.x + (c.x - cr.x) * p, cr.y - u * 5 + (Q.gy - u * 6 - cr.y + u * 5) * p - Math.sin(p * Math.PI) * u * 12, u * 6, p * 8); } }
      head(G, g, `🏰 Castles: ${s.castles}`);
      hint(G, g, s.ph === "build" ? `Tap to pat the sand! Layer ${s.lay + 1} of 4` : s.ph === "decor" ? `Tap to decorate! ${s.dec}/6` : s.ph === "open" ? `Tap to serve pizza! ${s.served}/6 friends` : "Hooray! 🎉", u * 13); },
    hot(G) { const Q = this.geo(G); return G.s.ph === "open" ? this.crab(G) : { x: G.cx, y: Q.gy - Q.lh * 1.5 }; },
  },

  // ------------------------------------------------------------------------
  //  MEGA
  // ------------------------------------------------------------------------
  {
    id: "robopup", name: "Robo-Pup 9000", rar: "mega", ico: "🐶", unit: "tricks", base: 4, bg: ["#e3f1ff", "#b9d4f2"],
    blurb: "Robo-Pup 9000 is learning tricks! Look at the trick in his speech bubble and tap the matching button. Pat him for happy beeps! Every 8 tricks: a TRICK SHOW!",
    ups: [["tap", "Bigger Battery", "🔋"], ["auto", "Mini-Bot Coaches", "🤖"], ["mult", "Turbo Treats", "🦴"]],
    win: ["BEEP BOOP! Good pup!", "Robo-Pup wagged his antenna so fast it whistled.", "Robo-Pup learned to fetch… a pizza!", "Robo-Pup's tail is now solar powered.", "Robo-Pup taught the toaster to sit.", "Robo-Pup won Best Trick at the robot dog show!", "Robo-Pup can spin AND beep at the same time!", "Robo-Pup says you're his best friend. Beep.", "Robo-Pup 9000 has become Robo-Pup 9 MILLION!"],
    TR: [["sit", "🪑", "SIT"], ["spin", "🌀", "SPIN"], ["jump", "⬆️", "JUMP"], ["beep", "🎵", "BEEP"]], BC: ["#ffb347", "#6ec6ff", "#7cffb0", "#ff86b3"],
    init(G) { Object.assign(G.s, { ask: Math.floor(Math.random() * 4), tr: null, tt: 1, combo: 0, learned: 0, shows: 0, show: 0, wag: 0, pat: 0, press: [0, 0, 0, 0], tilt: 0 }); },
    pup(G) { const R = Math.min(G.W * 0.2, G.H * 0.15); return { x: G.cx - R * 0.15, y: G.H * 0.56, R }; },
    btn(G, i) { const bw = Math.min(G.W * 0.21, G.u * 24), bh = Math.min(G.u * 14, G.H * 0.12), gap = Math.min(G.W * 0.235, bw * 1.18); return { x: G.cx + (i - 1.5) * gap - bw / 2, y: G.H * 0.8 - bh / 2, w: bw, h: bh }; },
    doTrick(G, k, quiet) { const s = G.s; s.tr = k; s.tt = 0; if (quiet) return;
      if (k === 0) G.tone(520, 0.2, { type: "triangle", vol: 0.12, slideTo: 260 }); else if (k === 1) SFX.whoosh(); else if (k === 2) SFX.boing(); else [880, 1175, 1320].forEach((f, i) => G.tone(f, 0.08, { type: "square", vol: 0.07, when: i * 0.09 })); },
    press(G, i) { const s = G.s, P = this.pup(G); s.press[i] = 0.2; this.doTrick(G, i);
      if (i === s.ask) { s.combo = Math.min(5, s.combo + 1); s.learned++; s.wag = 1; G.add(2 + s.combo, P.x, P.y - P.R * 1.3, { color: "#7cffb0" }); SFX.ding(); G.burst(P.x + P.R * 0.6, P.y - P.R * 1.2, ["💙", "✨"], 3, { size: 0.6 });
        if (s.learned % 8 === 0) { s.show = 3.5; s.shows++; G.add(60, G.cx, G.H * 0.3, { color: "#ffd23f", noCrit: true }); SFX.wow(); G.float("🌟 TRICK SHOW! 🌟", G.cx, G.u * 22, "#ff5d8f", 1.3); G.flash("#fff7c2"); }
        let n; do { n = Math.floor(Math.random() * 4); } while (n === s.ask); s.ask = n; }
      else { s.combo = 0; s.tilt = 1; G.add(1, P.x, P.y - P.R * 1.3); G.say(pick(["Beep? Bonus trick!", "Ooh, I'll try that one too!", "Boop! So close!"]), P.x, P.y - P.R * 1.7, 1.2); } },
    down(G, x, y) { const s = G.s, P = this.pup(G);
      for (let i = 0; i < 4; i++) { const b = this.btn(G, i); if (x > b.x && x < b.x + b.w && y > b.y && y < b.y + b.h) return this.press(G, i); }
      if (dist(x, y, P.x + P.R * 0.2, P.y - P.R * 0.3) < P.R * 1.3) { s.pat = 0.5; s.wag = 1; G.add(1, x, y, { color: "#6ec6ff" }); SFX.beep(Math.floor(rnd(0, 5))); G.burst(x, y, ["💙", "💖"], 2, { size: 0.6, grav: -0.3 }); return; } SFX.boop(); },
    update(G, dt) { const s = G.s; s.tt += dt * 1.5; s.wag = Math.max(0, s.wag - dt * 0.8); s.pat = Math.max(0, s.pat - dt); s.tilt = Math.max(0, s.tilt - dt); for (let i = 0; i < 4; i++) s.press[i] = Math.max(0, s.press[i] - dt);
      if (s.show > 0) { s.show -= dt; s.wag = 1; if (s.tt >= 1) this.doTrick(G, ((s.tr ?? 0) + 1) % 4, s.tr % 2 === 0); } },
    autoTick(G) { if (G.s.show <= 0) this.press(G, G.s.ask); },
    draw(G, g) { const s = G.s, P = this.pup(G), R = P.R, u = G.u, t = clamp(s.tt, 0, 1), k = s.tt < 1 ? s.tr : null; let dy = 0, rot = 0, sit = 0;
      if (k === 2) dy = -Math.sin(Math.PI * t) * R * 1.0; if (k === 1) rot = t * Math.PI * 2; if (k === 0) sit = Math.sin(Math.PI * Math.min(1, t * 1.3));
      if (s.show > 0) for (let i = 0; i < 8; i++) { g.globalAlpha = 0.2; circ(g, G.cx + Math.cos(G.t * 2 + i) * G.W * 0.35, G.H * 0.4 + Math.sin(G.t * 3 + i) * G.H * 0.15, u * 6, RAINBOW[i % 6], null); g.globalAlpha = 1; }
      oval(g, P.x, P.y + R * 0.85, R * 1.1 * (1 + dy / (R * 3)), R * 0.15, "rgba(40,60,90,.15)", null);
      g.save(); g.translate(P.x, P.y + dy + sit * R * 0.12); g.rotate(rot + Math.sin(G.t * 10) * s.tilt * 0.12);
      for (const [lx, back] of [[-R * 0.6, 1], [-R * 0.32, 1], [R * 0.22, 0], [R * 0.48, 0]]) { const lh = R * (0.55 - back * sit * 0.3); rr(g, lx - R * 0.09, R * 0.2, R * 0.18, lh, R * 0.06, "#8fa3bd", INK, 3); oval(g, lx + R * 0.03, R * 0.2 + lh, R * 0.14, R * 0.07, "#4a5a72", INK, 2); }
      const wa = Math.sin(G.t * (s.wag > 0 ? 25 : 4)) * (s.wag > 0 ? 0.6 : 0.2); g.save(); g.translate(-R * 0.75, -R * 0.1); g.rotate(-0.7 + wa); g.strokeStyle = INK; g.lineWidth = Math.max(2, R * 0.05); g.beginPath(); g.moveTo(0, 0); for (let i = 1; i <= 6; i++) g.lineTo((i % 2 ? -1 : 1) * R * 0.07, -i * R * 0.07); g.stroke(); circ(g, 0, -R * 0.48, R * 0.09, "#ff5d8f"); g.restore();
      g.save(); g.rotate(-sit * 0.22); rr(g, -R * 0.8, -R * 0.35, R * 1.45, R * 0.7, R * 0.25, "#b9c7d8", INK, 4); circ(g, -R * 0.35, -R * 0.02, R * 0.1, "#ffd23f", INK, 2); for (let i = 0; i < 3; i++) circ(g, -R * 0.05 + i * R * 0.15, R * 0.12, R * 0.04, "#6ec6ff", null); g.restore();
      const ea = Math.sin(G.t * (s.wag > 0 ? 18 : 2)) * (s.wag > 0 ? 0.35 : 0.08);
      g.save(); g.translate(R * 0.65, -R * 1.02); g.rotate(ea); g.strokeStyle = INK; g.lineWidth = Math.max(2, R * 0.05); g.beginPath(); g.moveTo(0, 0); g.lineTo(0, -R * 0.42); g.stroke(); const lit = s.wag > 0 || k === 3; if (lit) { g.globalAlpha = 0.5; circ(g, 0, -R * 0.5, R * 0.2, "#ff9aa8", null); g.globalAlpha = 1; } circ(g, 0, -R * 0.5, R * 0.1, lit ? "#ff3b5c" : "#d0606f"); g.restore();
      for (const sd of [-1, 1]) { g.save(); g.translate(R * 0.65 + sd * R * 0.42, -R * 0.9); g.rotate(sd * (0.5 + ea)); oval(g, 0, R * 0.2, R * 0.12, R * 0.26, "#8fa3bd", INK, 3); g.restore(); }
      rr(g, R * 0.2, -R * 1.05, R * 0.9, R * 0.78, R * 0.2, "#d2dde9", INK, 4); rr(g, R * 0.29, -R * 0.96, R * 0.72, R * 0.52, R * 0.12, "#c6f6ff", INK, 3);
      face(g, R * 0.65, -R * 0.7, R * 0.28, s.pat > 0 || s.show > 0 ? "joy" : s.tilt > 0 ? "wow" : s.wag > 0 ? "joy" : "happy"); oval(g, R * 1.1, -R * 0.42, R * 0.1, R * 0.07, INK, null);
      rr(g, R * 0.25, -R * 0.3, R * 0.8, R * 0.11, R * 0.05, "#ff5d8f", INK, 2); circ(g, R * 0.65, -R * 0.15, R * 0.07, "#ffd23f", INK, 2);
      g.restore();
      if (k === 3) for (let i = 0; i < 3; i++) E(g, "🎵", P.x + R * (0.6 + i * 0.4), P.y - R * 1.6 - t * u * 6 - i * u * 2, u * 4.5, 0, 1 - t);
      speech(g, s.show > 0 ? "🌟 SHOWTIME! 🌟" : `${this.TR[s.ask][1]} ${this.TR[s.ask][2]}, please!`, P.x + R * 0.6, P.y - R * 1.75, u * 3.6 + 4, { maxW: Math.min(G.W * 0.6, 300) });
      for (let i = 0; i < 4; i++) { const b = this.btn(G, i), pr = s.press[i] > 0 ? u : 0; rr(g, b.x, b.y + u, b.w, b.h, u * 3, "rgba(40,60,90,.35)", null); rr(g, b.x, b.y + pr, b.w, b.h, u * 3, this.BC[i], INK, 4); E(g, this.TR[i][1], b.x + b.w / 2, b.y + pr + b.h * 0.38, b.h * 0.42); txt(g, this.TR[i][2], b.x + b.w / 2, b.y + pr + b.h * 0.8, b.h * 0.2, INK); }
      head(G, g, `🤖 Tricks learned: ${s.learned}`); txt(g, s.combo > 1 ? `🔥 Combo ×${s.combo}!` : `Trick show in ${8 - (s.learned % 8)}`, G.cx, u * 12.5, u * 3, "#fff", { stroke: INK }); },
    hot(G) { const b = this.btn(G, G.s.ask); return { x: b.x + b.w / 2, y: b.y + b.h / 2 }; },
  },
  {
    id: "dino", name: "Dino Egg Daycare", rar: "mega", ico: "🦕", unit: "stomps", base: 4, bg: ["#fff3d1", "#cdeea0"],
    blurb: "Tap the eggs to keep them warm and cozy until they HATCH! Then tap the baby dinos to feed them pizza. When they're all grown up they do a happy STOMP dance!",
    ups: [["tap", "Cozy Blanket", "🧣"], ["auto", "Mama Brontos", "🦕"], ["crit", "Golden Eggs", "🥚"]],
    win: ["RAWR! (That means thank you!)", "The baby dinos think you're their best friend.", "A dino did a happy stomp and flowers popped up!", "The daycare got a gold star.", "The dinos learned to share pizza. Mostly.", "A T-Rex gave you a tiny-armed hug!", "So many dinos! The ground is going stomp-stomp!", "The dinos named a volcano after you. A friendly one.", "Dino Daycare Hall of Fame!"],
    KINDS: ["🦕", "🦖"], ECOL: [["#b8f0a0", "#5cb85c"], ["#ffd0e8", "#ff86b3"], ["#cfe6ff", "#6ec6ff"], ["#fff1a8", "#ffb347"], ["#e2d4ff", "#b18cff"]],
    init(G) { Object.assign(G.s, { eggs: [0, 1, 2].map(() => this.egg()), kids: [], grown: 0, hatched: 0, party: 0 }); },
    egg() { return { w: 0, wob: 0, glow: 0, col: pick(this.ECOL), k: pick(this.KINDS) }; },
    eggP(G, i) { const sp = Math.min(G.W * 0.22, G.u * 26); return { x: G.cx + (i - 1) * sp, y: G.H * 0.36, rx: Math.min(G.W * 0.07, G.u * 7) }; },
    gy(G) { return G.H * 0.8; },
    kidSz(G, c) { return G.u * 13 * c.sz; },
    kidPos(G, c) { const px = this.kidSz(G, c), d = clamp(c.drop, 0, 1), gy = this.gy(G) - px * 0.42; return { x: c.x, y: c.y0 + (gy - c.y0) * d - Math.sin(d * Math.PI) * G.u * 8 - c.hop }; },
    room(G) { return G.s.kids.filter((k) => !k.leave).length < 3; },
    warm(G, i) { const s = G.s, e = s.eggs[i], p = this.eggP(G, i);
      if (e.w >= 1) { if (!this.hatch(G, i)) { G.add(1, p.x, p.y); e.wob = 0.3; G.say("Feed the babies first!", p.x, p.y - p.rx * 2, 1.2); } return; }
      e.w = Math.min(1, e.w + 0.18); e.wob = 0.5; e.glow = 0.5; G.add(1, p.x, p.y - p.rx * 1.6, { color: "#ffb347" }); G.tone(300 + e.w * 400, 0.1, { type: "triangle", vol: 0.1 }); if (e.w >= 1) this.hatch(G, i); },
    hatch(G, i) { const s = G.s, e = s.eggs[i], p = this.eggP(G, i); if (!this.room(G)) return false;
      s.eggs[i] = this.egg(); s.hatched++; s.kids.push({ k: e.k, x: p.x, y0: p.y, drop: 0, hop: 0, dir: Math.random() < 0.5 ? -1 : 1, sz: 0.55, fed: 0, stomp: 0, st: 0, leave: false, chomp: 0 });
      G.add(10, p.x, p.y - p.rx * 2, { color: "#7cffb0" }); SFX.pop(0.9); SFX.peep(); G.burst(p.x, p.y, ["🥚", "✨", "💚"], 10); G.say(pick(["Rawr! (That means hi!)", "Hello world!", "Is it pizza time?", "Hi hi hi!"]), p.x, p.y - p.rx * 2, 1.4); return true; },
    feed(G, c) { const s = G.s, p = this.kidPos(G, c);
      if (c.stomp > 0 || c.leave || c.drop < 1) { G.add(1, p.x, p.y, { color: "#ff86b3" }); SFX.giggle(); G.burst(p.x, p.y, "💖", 2, { size: 0.6, grav: -0.3 }); return; }
      c.fed++; c.sz += 0.16; c.chomp = 0.4; G.add(2, p.x, p.y - this.kidSz(G, c) * 0.5, { color: "#ffb347" }); G.tone(400, 0.06, { type: "square", vol: 0.06 }); G.tone(300, 0.08, { type: "square", vol: 0.06, when: 0.08 }); G.burst(p.x, p.y, "🍕", 1, { size: 0.6 });
      if (c.fed >= 4) { c.stomp = 2.4; G.add(25, p.x, p.y - this.kidSz(G, c), { color: "#ffd23f" }); SFX.win(); G.say("I'm all grown up! STOMP STOMP!", p.x, p.y - this.kidSz(G, c) * 0.7, 1.6); } },
    down(G, x, y) { const s = G.s;
      for (let i = 0; i < 3; i++) { const p = this.eggP(G, i); if (dist(x, y, p.x, p.y) < p.rx * 1.6) return this.warm(G, i); }
      for (const c of s.kids) { const p = this.kidPos(G, c), r = this.kidSz(G, c) * 0.6; if (dist(x, y, p.x, p.y) < r) return this.feed(G, c); } SFX.boop(); },
    update(G, dt) { const s = G.s, u = G.u; s.party = Math.max(0, s.party - dt); for (const e of s.eggs) { e.wob = Math.max(0, e.wob - dt); e.glow = Math.max(0, e.glow - dt); }
      for (const c of s.kids) { c.chomp = Math.max(0, c.chomp - dt); if (c.drop < 1) { c.drop += dt * 1.6; continue; }
        if (c.stomp > 0) { c.stomp -= dt; c.st += dt; c.hop = Math.abs(Math.sin(c.st * 8)) * u * 4; if (Math.sin(c.st * 8) * Math.sin((c.st - dt) * 8) <= 0) { const p = this.kidPos(G, c); G.tone(90, 0.15, { type: "sine", vol: 0.18, slideTo: 50 }); G.dots(p.x, this.gy(G), ["#d9b06a", "#c49a55"], 4); G.burst(p.x + rnd(-1, 1) * u * 8, this.gy(G), ["🌼", "🌸", "🌷"], 1, { size: 0.6 }); }
          if (c.stomp <= 0) { c.leave = true; c.dir = 1; c.hop = 0; s.grown++; if (s.grown % 5 === 0) { s.party = 3.5; G.add(80, G.cx, G.cy, { color: "#ffd23f", noCrit: true }); SFX.wow(); G.flash("#f6ffd8"); G.float("🦖 DINO DANCE PARTY! 🦕", G.cx, u * 22, "#5cb85c", 1.3); } } continue; }
        if (c.leave) { c.x += u * 22 * dt; c.hop = Math.abs(Math.sin(G.t * 10)) * u * 1.5; continue; }
        c.x += c.dir * u * 5 * dt; if (c.x < G.W * 0.1) c.dir = 1; if (c.x > G.W * 0.9) c.dir = -1; c.hop = s.party > 0 ? Math.abs(Math.sin(G.t * 9 + c.x)) * u * 4 : Math.abs(Math.sin(G.t * 6 + c.x)) * u * 0.8; }
      s.kids = s.kids.filter((c) => c.x < G.W + u * 20); },
    autoTick(G) { const s = G.s, c = s.kids.find((c) => c.drop >= 1 && !c.leave && c.stomp <= 0); if (c) { this.feed(G, c); return; } let best = 0; s.eggs.forEach((e, i) => { if (e.w > s.eggs[best].w) best = i; }); this.warm(G, best); },
    draw(G, g) { const s = G.s, u = G.u, gy = this.gy(G);
      const vx = G.W - u * 22, vh = u * 32; g.fillStyle = "#b7a1d9"; g.beginPath(); g.moveTo(vx - u * 26, gy); g.lineTo(vx - u * 4, gy - vh); g.lineTo(vx + u * 4, gy - vh); g.lineTo(vx + u * 26, gy); g.fill();
      for (let i = 0; i < 3; i++) circ(g, vx + Math.sin(G.t + i) * u * 2, gy - vh - u * 2 - ((G.t * 6 + i * 5) % 15) * u, u * (2 + i * 0.5), "rgba(255,255,255,.7)", null);
      rr(g, -10, gy, G.W + 20, G.H, 0, "#8fd16a", INK, 3); E(g, "🌴", G.W * 0.06, gy - u * 8, u * 16); E(g, "🌴", G.W * 0.95, gy - u * 7, u * 14);
      const p0 = this.eggP(G, 0), p2 = this.eggP(G, 2); oval(g, G.cx, p0.y + p0.rx * 1.1, (p2.x - p0.x) / 2 + p0.rx * 2.2, p0.rx * 0.9, "#b07a3c", INK, 3); for (let i = 0; i < 14; i++) { g.strokeStyle = "#8a5a2a"; g.lineWidth = 2; const x = p0.x - p0.rx * 1.8 + (i / 13) * (p2.x - p0.x + p0.rx * 3.6); g.beginPath(); g.moveTo(x, p0.y + p0.rx * 0.6); g.lineTo(x + u * 2, p0.y + p0.rx * 1.6); g.stroke(); }
      s.eggs.forEach((e, i) => { const p = this.eggP(G, i), rx = p.rx; if (e.glow > 0 || e.w >= 1) { g.globalAlpha = e.w >= 1 ? 0.35 + Math.sin(G.t * 6) * 0.15 : e.glow; circ(g, p.x, p.y, rx * 2, "#ffcf6a", null); g.globalAlpha = 1; }
        g.save(); g.translate(p.x, p.y + rx * 0.2); g.rotate(Math.sin(G.t * 30) * e.wob * 0.3 + (e.w >= 1 ? Math.sin(G.t * 12) * 0.1 : 0)); oval(g, 0, 0, rx, rx * 1.3, e.col[0], INK, 3);
        for (const [dx, dy, r] of [[-0.4, -0.5, 0.18], [0.35, -0.2, 0.22], [-0.2, 0.4, 0.2], [0.45, 0.55, 0.14]]) circ(g, dx * rx, dy * rx, r * rx, e.col[1], null);
        g.strokeStyle = INK; g.lineWidth = 2; if (e.w > 0.3) { g.beginPath(); g.moveTo(-rx * 0.9, -rx * 0.1); for (let k = 1; k <= 4; k++) g.lineTo(-rx * 0.9 + k * rx * 0.3, -rx * 0.1 + (k % 2 ? -1 : 1) * rx * 0.18); g.stroke(); } if (e.w > 0.65) { g.beginPath(); g.moveTo(rx * 0.95, rx * 0.2); for (let k = 1; k <= 3; k++) g.lineTo(rx * 0.95 - k * rx * 0.3, rx * 0.2 + (k % 2 ? -1 : 1) * rx * 0.18); g.stroke(); }
        g.restore(); bar(g, p.x - rx, p.y + rx * 1.75, rx * 2, u * 2.4, e.w, "#ffb347"); });
      for (const c of s.kids) { const p = this.kidPos(G, c), sz = this.kidSz(G, c); if (c.drop >= 1) oval(g, p.x, gy + u, sz * 0.4, sz * 0.08, "rgba(60,90,30,.2)", null);
        E(g, c.k, p.x, p.y, sz, c.stomp > 0 ? Math.sin(c.st * 8) * 0.12 : 0, 1, c.dir > 0 ? -1 : 1, c.chomp > 0 ? 0.92 : 1);
        if (c.drop >= 1 && !c.leave && c.stomp <= 0) { const by = p.y - sz * 0.75; circ(g, p.x, by, u * 3.2, "#fffaf0", INK, 2); E(g, "🍕", p.x, by, u * 4); bar(g, p.x - u * 5, p.y + sz * 0.45, u * 10, u * 1.8, c.fed / 4, "#7cffb0"); } }
      head(G, g, `🦕 Grown-up dinos: ${s.grown}`); hint(G, g, s.kids.some((c) => !c.leave && c.stomp <= 0) ? "Tap eggs to warm them · tap babies to feed! 🍕" : "Tap the eggs to keep them cozy! 🥚", u * 13); },
    hot(G) { const s = G.s, c = s.kids.find((c) => c.drop >= 1 && !c.leave && c.stomp <= 0); if (c) return this.kidPos(G, c); let best = -1; s.eggs.forEach((e, i) => { if ((e.w < 1 || this.room(G)) && (best < 0 || e.w > s.eggs[best].w)) best = i; }); return this.eggP(G, best < 0 ? 0 : best); },
  },
  {
    id: "trampoline", name: "Trampoline Party", rar: "mega", ico: "🤸", unit: "boings", base: 4, bg: ["#d8f1ff", "#ffe0f0"],
    blurb: "Tap right when your friend lands on the trampoline (in the green zone) to bounce HIGHER! Reach the top for a big FLIP. Grab the stars on the way up!",
    ups: [["tap", "Super Springs", "🔩"], ["auto", "Kangaroo Coaches", "🦘"], ["crit", "Star Catcher", "🌟"]],
    win: ["BOING! What a bounce!", "Your friend touched a cloud! It was fluffy.", "Triple flip! The crowd goes wild!", "The birds asked for bouncing lessons.", "The trampoline is the happiest trampoline ever.", "Everybody in town wants a turn!", "You bounced so high you saw your house!", "The moon waved hello on the way up.", "Trampoline Party Superstar!"],
    FR: ["🐶", "🐱", "🐷", "🐔", "🐸", "🐼", "🐨", "🐰", "🐮", "🐵"],
    init(G) { Object.assign(G.s, { f: pick(this.FR), yy: G.H * 0.2, vy: 0, lv: 0, perf: false, coach: false, sq: 0, air: 0, airMax: 1, flips: 0, crowd: [], star: null, joins: 0, msg: 0, zone: 0 }); },
    geo(G) { const my = G.H * 0.74, top = G.H * 0.22; return { my, sp: my - top, tw: Math.min(G.W * 0.46, G.u * 56), sz: G.u * 11, g: G.H * 2.6 }; },
    hgt(G, lv) { return this.geo(G).sp * (0.18 + 0.164 * lv); },
    fpos(G) { const Q = this.geo(G), dip = G.s.sq > 0 ? G.u * 3 * (G.s.sq / 0.16) : 0; return { x: G.cx, y: Q.my - G.s.yy - Q.sz * 0.45 + dip }; },
    land(G) { const s = G.s, Q = this.geo(G); s.yy = 0; s.sq = 0.16;
      if (s.perf || s.coach) { s.lv = Math.min(5, s.lv + 1); G.add(2 + s.lv, G.cx + Q.tw * 0.3, Q.my - Q.sz, { color: "#7cffb0" }); SFX.boing(); s.zone = 0.3; }
      else { s.lv = Math.max(0, s.lv - 1); G.tone(200, 0.2, { type: "sine", vol: 0.12, slideTo: 380 }); }
      s.perf = false; s.coach = false; const v = Math.sqrt(2 * Q.g * this.hgt(G, s.lv)); s.vy = v; s.air = 0; s.airMax = (2 * v) / Q.g;
      if (!s.star) s.star = { h: this.hgt(G, Math.min(5, s.lv + 1)) * 0.9, x: rnd(-1, 1) * G.u * 3 }; },
    newFriend(G) { const s = G.s; s.crowd.push(s.f); if (s.crowd.length > 6) s.crowd.shift(); let n; do { n = pick(this.FR); } while (n === s.f); s.f = n; s.lv = 1; s.joins++;
      G.add(60, G.cx, G.H * 0.4, { color: "#ffd23f", noCrit: true }); SFX.wow(); G.flash("#fff3fa"); G.float("🎉 A NEW FRIEND JOINS! 🎉", G.cx, G.u * 22, "#ff5d8f", 1.2); },
    down(G, x, y) { const s = G.s, Q = this.geo(G), f = this.fpos(G);
      if (s.vy < 0 && s.yy < Q.sp * 0.22) { if (!s.perf) { s.perf = true; G.add(1, f.x, f.y, { color: "#7cffb0" }); SFX.tap(); G.dots(f.x, Q.my, ["#7cffb0", "#fff"], 6); } else SFX.tap(); return; }
      G.add(1, x, y); G.tone(700, 0.05, { type: "triangle", vol: 0.06 }); if (s.msg <= 0) { s.msg = 3; G.say(pick(["Tap when I land!", "Almost! Tap at the bottom!", "Wheee! Tap in the green!"]), f.x, f.y - Q.sz * 0.7, 1.2); } },
    update(G, dt) { const s = G.s, Q = this.geo(G), u = G.u; s.sq = Math.max(0, s.sq - dt); s.msg -= dt; s.zone = Math.max(0, s.zone - dt);
      const pv = s.vy; s.vy -= Q.g * dt; s.yy += s.vy * dt; s.air += dt;
      if (pv > 0 && s.vy <= 0 && s.lv >= 5) { const f = this.fpos(G); s.flips++; G.add(20, f.x, f.y - Q.sz * 0.6, { color: "#ffd23f" }); SFX.sparkle(); G.float("FLIP!", f.x + Q.sz, f.y, "#ff5d8f", 1.1); G.burst(f.x, f.y, ["⭐", "✨"], 5); if (s.flips % 3 === 0) this.newFriend(G); }
      if (s.star && s.yy > s.star.h - u * 4) { const y = Q.my - s.star.h - Q.sz * 0.45; G.add(5, G.cx + s.star.x, y, { color: "#ffe066" }); SFX.coin(); G.burst(G.cx, y, ["⭐", "✨"], 6); s.star = null; }
      if (s.yy <= 0 && s.vy < 0) this.land(G); },
    autoTick(G) { const Q = this.geo(G); G.s.coach = true; G.burst(G.cx - Q.tw * 0.55, Q.my, "🦘", 1, { size: 0.7 }); },
    draw(G, g) { const s = G.s, Q = this.geo(G), u = G.u, cx = G.cx, gy = Q.my + u * 10; clouds(G, g, 3, 0.16);
      for (let l = 1; l <= 5; l++) { const y = Q.my - this.hgt(G, l) - Q.sz * 0.45; g.setLineDash([u * 1.5, u * 1.5]); g.strokeStyle = l === 5 ? "rgba(255,180,0,.8)" : "rgba(74,42,26,.18)"; g.lineWidth = 2; g.beginPath(); g.moveTo(cx - Q.tw * 0.75, y); g.lineTo(cx + Q.tw * 0.75, y); g.stroke(); g.setLineDash([]); txt(g, l === 5 ? "⭐ TOP" : String(l), cx - Q.tw * 0.75 - u * 3, y, u * 2.8, l <= s.lv ? "#ff5d8f" : "rgba(74,42,26,.4)", { align: "right" }); }
      rr(g, -10, gy, G.W + 20, G.H, 0, "#9be27a", INK, 3);
      s.crowd.forEach((e, i) => { const sd = i % 2 ? 1 : -1, x = cx + sd * (Q.tw * 0.62 + Math.floor(i / 2) * u * 9); E(g, e, x, gy - u * 4 - Math.abs(Math.sin(G.t * 6 + i)) * u * 2, u * 8); });
      for (const sd of [-1, 1]) { g.strokeStyle = INK; g.lineWidth = u * 1.2; g.beginPath(); g.moveTo(cx + sd * Q.tw * 0.42, Q.my); g.lineTo(cx + sd * Q.tw * 0.46, gy); g.stroke(); g.strokeStyle = "#6ec6ff"; g.lineWidth = u * 0.7; g.stroke(); }
      const inZone = s.vy < 0 && s.yy < Q.sp * 0.22; g.globalAlpha = s.perf ? 0.55 : inZone ? 0.4 : 0.18; rr(g, cx - Q.tw * 0.45, Q.my - Q.sp * 0.22 - Q.sz * 0.5, Q.tw * 0.9, Q.sp * 0.22 + Q.sz * 0.5, u * 3, "#7cffb0", null); g.globalAlpha = 1;
      txt(g, s.perf ? "READY!" : "TAP ZONE", cx + Q.tw * 0.36, Q.my - Q.sp * 0.22 - Q.sz * 0.5 + u * 2.5, u * 2.4, "#2e8b57", { align: "right", weight: 900 });
      const dip = s.sq > 0 ? u * 3 * (s.sq / 0.16) : 0; g.beginPath(); g.moveTo(cx - Q.tw * 0.44, Q.my); g.quadraticCurveTo(cx, Q.my + dip * 2 + u * 2, cx + Q.tw * 0.44, Q.my); g.quadraticCurveTo(cx, Q.my - u * 2 + dip, cx - Q.tw * 0.44, Q.my); g.fillStyle = "#333a55"; g.fill();
      for (let i = 0; i < 12; i++) { g.beginPath(); g.ellipse(cx, Q.my, Q.tw / 2, u * 3, 0, (i / 12) * Math.PI * 2, ((i + 1) / 12) * Math.PI * 2); g.strokeStyle = RAINBOW[i % 6]; g.lineWidth = u * 1.6; g.stroke(); }
      g.beginPath(); g.ellipse(cx, Q.my, Q.tw / 2 + u * 0.8, u * 3.8, 0, 0, Math.PI * 2); g.strokeStyle = INK; g.lineWidth = 2; g.stroke();
      if (s.star) E(g, "⭐", cx + s.star.x, Q.my - s.star.h - Q.sz * 0.45, u * 7, Math.sin(G.t * 3) * 0.2, 0.7 + Math.sin(G.t * 5) * 0.3);
      const f = this.fpos(G), sq = s.sq > 0 ? s.sq / 0.16 : 0, rot = s.lv >= 5 ? clamp(s.air / s.airMax, 0, 1) * Math.PI * 2 : Math.sin(G.t * 4) * 0.08;
      E(g, s.f, f.x, f.y, Q.sz, rot, 1, 1 + sq * 0.25, 1 - sq * 0.25);
      head(G, g, `🤸 Flips: ${s.flips} · friends: ${s.joins + 1}`); bar(g, G.cx - u * 20, u * 11, u * 40, u * 3.6, s.lv / 5, "#ffb347"); txt(g, `Bounce power ${s.lv}/5`, G.cx, u * 12.8, u * 2.4, INK, { weight: 800 }); },
    hot(G) { return this.fpos(G); },
  },
];
