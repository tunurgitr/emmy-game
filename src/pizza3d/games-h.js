// ==========================================================================
//  Emmy's Pizza Plus — clicker games, part 8: Mega, Legendary & Ultra.
//  Balloon rides, a chicken choir, a pizza train, a singing whale, a kind
//  giant, robots, skateboards, the circus, a lighthouse and a weather wizard.
// ==========================================================================
import { E, circ, oval, rr, txt, bar, face, pizza, slice, rnd, pick, clamp, dist, INK } from "./clicker.js";
import { SFX } from "./audio.js";

const RAINBOW = ["#ff5d8f", "#ffb347", "#ffe066", "#7cffb0", "#6ec6ff", "#b18cff"];
const cloud = (g, x, y, s, c = "#fff", st = null) => { for (const [dx, dy, r] of [[-1, 0.15, 0.7], [0, -0.2, 1], [1, 0.15, 0.75], [0.5, 0.35, 0.6], [-0.5, 0.35, 0.6]]) circ(g, x + dx * s, y + dy * s, s * r, c, st); };
const stars = (G, g, n = 50) => { for (let i = 0; i < n; i++) { const tw = 0.5 + Math.sin(G.t * 3 + i) * 0.5; circ(g, (i * 137.5) % G.W, (i * 71.3) % (G.H * 0.3), G.u * (0.25 + (i % 3) * 0.2) * (0.6 + tw * 0.6), "#fff", null); } };
const sing = (G, f, dur = 0.3, when = 0) => { G.tone(f, dur, { type: "triangle", vol: 0.15, when }); G.tone(f * 2, dur * 0.6, { type: "sine", vol: 0.04, when }); };
// a front-facing chicken: round body, comb, beak over the mouth
const hen = (g, x, y, R, { col = "#fffaf0", bow = null, mood = "happy", open = 0 } = {}) => {
  g.save(); g.translate(x, y);
  for (const sd of [-1, 1]) { g.strokeStyle = "#ff9a3c"; g.lineWidth = Math.max(2, R * 0.1); g.lineCap = "round"; g.beginPath(); g.moveTo(sd * R * 0.3, R * 0.85); g.lineTo(sd * R * 0.35, R * 1.12); g.stroke(); }
  for (let i = 0; i < 3; i++) circ(g, (i - 1) * R * 0.22, -R * 0.92 - (i === 1 ? R * 0.08 : 0), R * 0.17, "#f2483a");
  circ(g, 0, 0, R, col); for (const sd of [-1, 1]) oval(g, sd * R * 0.88, R * 0.2, R * 0.22, R * 0.4, "#f5ead4", INK, 3, sd * -0.3);
  face(g, 0, -R * 0.22, R * 0.6, mood);
  g.fillStyle = "#ffb02e"; g.strokeStyle = INK; g.lineWidth = Math.max(2, R * 0.05); g.lineJoin = "round"; const by = -R * 0.08, ow = R * open * 0.22;
  g.beginPath(); g.moveTo(-R * 0.16, by - ow * 0.4); g.lineTo(R * 0.16, by - ow * 0.4); g.lineTo(0, by + R * 0.12 - ow * 0.4); g.closePath(); g.fill(); g.stroke();
  if (open > 0.05) { g.beginPath(); g.moveTo(-R * 0.13, by + ow * 0.5); g.lineTo(R * 0.13, by + ow * 0.5); g.lineTo(0, by + R * 0.12 + ow); g.closePath(); g.fill(); g.stroke(); }
  oval(g, 0, by + R * 0.28 + ow, R * 0.06, R * 0.1, "#f2483a");
  if (bow) { for (const sd of [-1, 1]) { g.beginPath(); g.moveTo(0, R * 0.55); g.lineTo(sd * R * 0.3, R * 0.42); g.lineTo(sd * R * 0.3, R * 0.68); g.closePath(); g.fillStyle = bow; g.fill(); g.stroke(); } circ(g, 0, R * 0.55, R * 0.08, bow); }
  g.restore();
};
// one wedge of a giant pizza
const wedge = (g, x, y, r, a0, a1) => {
  const pie = (rad, fill) => { g.beginPath(); g.moveTo(x, y); g.arc(x, y, rad, a0, a1); g.closePath(); g.fillStyle = fill; g.fill(); };
  pie(r, "#e8b26a"); pie(r * 0.85, "#f2483a"); pie(r * 0.76, "#ffd23f"); g.beginPath(); g.moveTo(x, y); g.arc(x, y, r, a0, a1); g.closePath(); g.strokeStyle = INK; g.lineWidth = 3; g.stroke();
  const m = (a0 + a1) / 2; for (const [d, o] of [[0.55, 0], [0.32, 0.12], [0.62, -0.18]]) circ(g, x + Math.cos(m + o) * r * d, y + Math.sin(m + o) * r * d, r * 0.08, "#d8343a", "#9a1f24", 2);
};

export const GAMES_H = [
  // ------------------------------------------------------------------------
  //  MEGA
  // ------------------------------------------------------------------------
  {
    id: "balloon", name: "Pizza Balloon Ride", rar: "mega", ico: "🎈", unit: "puffs", base: 4, bg: ["#8fd3ff", "#e6f6ff"], noDots: true,
    blurb: "Tap to puff warm air into the pizza balloon and float UP! Grab twinkly stars, wave to the birds, and reach the clouds for a sky picnic.",
    ups: [["tap", "Bigger Puffs", "🔥"], ["auto", "Breezy Buddies", "🌬️"], ["mult", "Picnic Basket", "🧺"]],
    win: ["Up, up and away! Wheee!", "A bird said hello. You said hello back. Friends!", "You can see Grandma's house from up here!", "The clouds saved you a seat.", "You caught so many stars your pockets twinkle.", "The moon waved at you. Probably.", "The birds made you an honorary bird.", "Your sky picnic is famous in cloud town.", "Captain of the Sky Picnic! Puff puff hooray!"],
    init(G) { Object.assign(G.s, { alt: 0, da: 0, puff: 0, stars: [], birds: [], sp: 0.4, bp: 1.5, pic: 0, picnics: 0 }); },
    bal(G) { const s = G.s; return { x: G.cx + Math.sin(G.t * 0.7) * G.W * 0.05, y: G.H * (s.pic > 0 ? 0.36 : 0.5) + Math.sin(G.t * 1.5) * G.u, r: Math.min(G.W * 0.16, G.u * 14) }; },
    puff(G, n, x, y) { const s = G.s, b = this.bal(G); s.puff = 0.35; s.alt = Math.min(100, s.alt + n); G.add(1, x ?? b.x, y ?? b.y - b.r); G.tone(140, 0.25, { type: "sawtooth", vol: 0.05, slideTo: 90 }); G.noise(0.25, { vol: 0.08, f0: 1200, f1: 400 });
      if (s.alt >= 100 && s.pic <= 0) { s.pic = 4.5; s.picnics++; s.stars = []; G.add(40, b.x, b.y - b.r, { color: "#ffd23f", noCrit: true }); SFX.wow(); G.flash("#ffffff"); G.float("☁️ SKY PICNIC! ☁️", G.cx, G.u * 20, "#ff5d8f", 1.3); } },
    down(G, x, y) { const s = G.s;
      if (s.pic > 0) { G.add(2, x, y, { color: "#ff86b3" }); G.burst(x, y, ["🍕", "💖", "🧁"], 3, { size: 0.7 }); SFX.giggle(); return; }
      const st = s.stars.find((q) => !q.got && dist(x, y, q.x, q.y) < G.u * 9); if (st) { st.got = 0.5; s.alt = Math.min(99, s.alt + 2); G.add(3, st.x, st.y, { color: "#ffe066" }); SFX.sparkle(); return; }
      const bd = s.birds.find((q) => !q.wave && dist(x, y, q.x, q.y) < G.u * 9); if (bd) { bd.wave = 1.5; s.alt = Math.min(99, s.alt + 1.5); G.add(2, bd.x, bd.y); SFX.peep(); G.say(pick(["Hello up there!", "Tweet tweet! Hi!", "Nice balloon!", "Wave wave!"]), bd.x, bd.y - G.u * 5, 1.2); return; }
      this.puff(G, 2.5, x, y); },
    update(G, dt) { const s = G.s; s.puff = Math.max(0, s.puff - dt); s.da += (s.alt - s.da) * Math.min(1, dt * 4);
      if (s.pic > 0) { if ((s.pic -= dt) <= 0) { s.alt = 0; G.float("Down we go for another ride!", G.cx, G.u * 22, "#fff", 1); SFX.whoosh(); } }
      else s.alt = Math.max(0, s.alt - dt * 1.2);
      if (s.pic <= 0 && (s.sp -= dt) <= 0 && s.stars.length < 5) { s.sp = 1.1; s.stars.push({ x: rnd(0.08, 0.92) * G.W, y: -G.u * 5, vy: G.u * rnd(7, 12), got: 0, r: rnd(0, 6) }); }
      if ((s.bp -= dt) <= 0 && s.birds.length < 3) { s.bp = 3.2; const l = Math.random() < 0.5; s.birds.push({ x: l ? -G.u * 6 : G.W + G.u * 6, y: rnd(0.15, 0.6) * G.H, vx: (l ? 1 : -1) * G.u * rnd(9, 14), wave: 0, ph: rnd(0, 6) }); }
      for (let i = s.stars.length - 1; i >= 0; i--) { const q = s.stars[i]; q.r += dt; if (q.got) { q.got -= dt; q.y -= G.u * 20 * dt; if (q.got <= 0) s.stars.splice(i, 1); continue; } q.y += q.vy * dt; if (q.y > G.H + G.u * 6) s.stars.splice(i, 1); }
      for (let i = s.birds.length - 1; i >= 0; i--) { const q = s.birds[i]; q.wave = Math.max(0, q.wave - dt); q.x += q.vx * dt * (q.wave > 0 ? 0.3 : 1); q.ph += dt * 8; if (q.x < -G.u * 12 || q.x > G.W + G.u * 12) s.birds.splice(i, 1); } },
    autoTick(G) { if (G.s.pic > 0) return; const b = this.bal(G); this.puff(G, 2, b.x, b.y - b.r * 1.5); G.burst(b.x - b.r, b.y, "🌬️", 1, { size: 0.7, grav: -0.2 }); },
    draw(G, g) { const s = G.s, b = this.bal(G), r = b.r, ey = b.y - r * 0.4, h = s.da / 100;
      g.fillStyle = `rgba(70,110,220,${h * 0.35})`; g.fillRect(0, 0, G.W, G.H);
      for (let i = 0; i < 7; i++) { const y = ((i * 0.23 * G.H + s.da * G.u * 2.5) % (G.H * 1.3)) - G.H * 0.15, x = ((i * 0.37 + G.t * 0.01 * (1 + i % 3)) % 1.2) * G.W - G.W * 0.1; cloud(g, x, y, G.u * (4 + (i % 3) * 1.5), "rgba(255,255,255,.85)"); }
      const gy = G.H * 0.86 + s.da * G.u * 1.5; if (gy < G.H + G.u * 10) { g.fillStyle = "#7fd36b"; g.beginPath(); g.moveTo(0, gy); g.quadraticCurveTo(G.W * 0.5, gy - G.u * 8, G.W, gy); g.lineTo(G.W, G.H + G.u * 30); g.lineTo(0, G.H + G.u * 30); g.fill(); g.strokeStyle = INK; g.lineWidth = 3; g.stroke(); for (let i = 0; i < 6; i++) E(g, i % 2 ? "🌳" : "🏠", G.W * (0.08 + i * 0.17), gy - G.u * (i % 2 ? 5 : 3), G.u * 7); }
      const ty = G.H * 0.12 - (100 - s.da) * G.u * 1.6; if (ty > -G.u * 20 && s.pic <= 0) for (let i = 0; i < 6; i++) cloud(g, G.W * (i / 5), ty, G.u * 8, "#fff", "rgba(74,42,26,.25)");
      for (const q of s.stars) { g.save(); g.globalAlpha = q.got ? q.got * 2 : 1; E(g, "⭐", q.x, q.y, G.u * 8 * (q.got ? 1.4 : 1), Math.sin(q.r * 3) * 0.2); g.restore(); }
      for (const q of s.birds) { E(g, "🐦", q.x, q.y + Math.sin(q.ph) * G.u, G.u * 8, 0, 1, q.vx > 0 ? -1 : 1, 1); if (q.wave > 0) E(g, "👋", q.x + G.u * 5, q.y - G.u * 5, G.u * 5, Math.sin(G.t * 14) * 0.4); }
      if (s.pic > 0) { for (let i = -2; i <= 2; i++) cloud(g, b.x + i * r * 0.8, b.y + r * 1.75, r * 0.5, "#fff", "rgba(74,42,26,.25)"); rr(g, b.x + r * 0.6, b.y + r * 1.25, r * 1.1, r * 0.3, 6, "#ff6b6b", INK, 3); for (let i = 0; i < 5; i++) rr(g, b.x + r * (0.65 + i * 0.21), b.y + r * 1.25, r * 0.1, r * 0.3, 0, "rgba(255,255,255,.7)", null); pizza(g, b.x + r * 1.15, b.y + r * 1.3, r * 0.25, { peps: 4 });
        [["🐻", -1.3], ["🐰", -0.85], ["🐔", 1.85]].forEach(([e, dx], i) => { E(g, e, b.x + r * dx, b.y + r * 1.2 - Math.abs(Math.sin(G.t * 5 + i)) * G.u * 2, r * 0.5); E(g, "👋", b.x + r * (dx + 0.3), b.y + r * 0.95, r * 0.25, Math.sin(G.t * 10 + i) * 0.4); }); }
      g.strokeStyle = INK; g.lineWidth = 2; for (const sd of [-1, 1]) { g.beginPath(); g.moveTo(b.x + sd * r * 0.3, ey + r * 1.1); g.lineTo(b.x + sd * r * 0.3, b.y + r * 1.05); g.stroke(); }
      if (s.puff > 0) E(g, "🔥", b.x, b.y + r * 0.82, r * 0.45 * (0.6 + s.puff * 1.5));
      E(g, "👧", b.x, b.y + r * 0.92, r * 0.42); rr(g, b.x - r * 0.38, b.y + r * 1.02, r * 0.76, r * 0.42, 6, "#c98a4b", INK, 3); for (let i = 1; i < 4; i++) { g.strokeStyle = "#8a5a2a"; g.lineWidth = 2; g.beginPath(); g.moveTo(b.x - r * 0.38 + i * r * 0.19, b.y + r * 1.04); g.lineTo(b.x - r * 0.38 + i * r * 0.19, b.y + r * 1.42); g.stroke(); }
      const sq = 1 + s.puff * 0.15; g.save(); g.translate(b.x, ey); g.scale(sq, sq); g.beginPath(); g.arc(0, 0, r, Math.PI * 0.8, Math.PI * 2.2); g.quadraticCurveTo(r * 0.75, r * 0.9, r * 0.3, r * 1.1); g.lineTo(-r * 0.3, r * 1.1); g.quadraticCurveTo(-r * 0.75, r * 0.9, Math.cos(Math.PI * 0.8) * r, Math.sin(Math.PI * 0.8) * r); g.closePath();
      g.save(); g.clip(); for (let i = 0; i < 7; i++) { g.fillStyle = RAINBOW[i % 6]; g.fillRect(-r + i * (r * 2 / 7), -r, r * 2 / 7 + 1, r * 2.2); } g.restore(); g.strokeStyle = INK; g.lineWidth = 3; g.stroke(); circ(g, -r * 0.4, -r * 0.45, r * 0.15, "rgba(255,255,255,.6)", null); pizza(g, 0, r * 0.05, r * 0.36, { peps: 5 }); g.restore();
      bar(g, G.W - G.u * 8, G.H * 0.2, G.u * 4.5, G.H * 0.55, 0, "#fff"); rr(g, G.W - G.u * 8 + 3, G.H * 0.2 + G.H * 0.55 * (1 - h) + 3, G.u * 4.5 - 6, Math.max(G.u * 4.5 - 6, G.H * 0.55 * h - 6), G.u * 2, "#ff86b3", null); E(g, "☁️", G.W - G.u * 5.75, G.H * 0.17, G.u * 6);
      txt(g, s.pic > 0 ? `☁️ Picnic time! Tap for treats! ${Math.ceil(s.pic)}s` : `🎈 Tap to puff up! · picnics: ${s.picnics}`, G.cx, G.u * 7, G.u * 3.8, "#fff", { stroke: INK }); },
    hot(G) { const s = G.s, q = s.stars.find((q) => !q.got && q.y > G.H * 0.12 && q.y < G.H * 0.85); if (q) return q; const bd = s.birds.find((q) => !q.wave && q.x > G.u * 5 && q.x < G.W - G.u * 5); if (bd) return bd; const b = this.bal(G); return { x: b.x, y: b.y - b.r * 0.4 }; },
  },
  {
    id: "chickenchoir", name: "Chicken Choir", rar: "mega", ico: "🐔", unit: "notes", base: 4, bg: ["#3b2a5c", "#7a4a8c"],
    blurb: "Five chickens, five notes! Tap the glowing chicken to play the song on the music sheet. Finish it and the WHOLE choir sings!",
    ups: [["tap", "Louder Bawks", "📢"], ["auto", "Rooster Conductor", "🐓"], ["mult", "Golden Microphone", "🎤"]],
    win: ["Bawk-do-re-mi! Beautiful!", "The audience threw corn. That's chicken for flowers.", "The choir got matching bow ties.", "A record label wants to sign the chickens!", "The Chicken Choir is on the radio!", "Even the cows are humming along.", "The choir sang so well an egg hatched to listen.", "World Tour! First stop: the farm next door.", "The Greatest Chicken Choir in History!"],
    COLS: ["#ff5d8f", "#ffb347", "#ffe066", "#7cffb0", "#6ec6ff"], NAMES: ["Do", "Re", "Mi", "So", "La"], FREQ: [523, 587, 659, 784, 880],
    SONGS: [["Bawk-a-Bye Baby", [0, 1, 2, 0]], ["Twinkle Twinkle Little Egg", [0, 0, 3, 3, 4, 4, 3]], ["Old MacDonald's Chickens", [3, 3, 3, 1, 2, 2, 1]], ["Happy Hatch Day", [0, 0, 1, 0, 3, 2]], ["Do-Re-Mi-Bawk", [0, 1, 2, 3, 4, 3, 2, 1, 0]], ["The Cluck Cluck Boogie", [4, 2, 4, 2, 3, 1, 0]]],
    init(G) { Object.assign(G.s, { song: 0, i: 0, sing: [0, 0, 0, 0, 0], perf: 0, pt: 0, songs: 0, hint: 0 }); },
    hn(G, i) { const R = Math.min(G.W * 0.075, G.u * 10); return { x: G.W * (0.14 + 0.18 * i), y: G.H * 0.64, r: R }; },
    note(G, i) { const f = this.FREQ[i]; sing(G, f, 0.35); G.tone(f * 1.5, 0.07, { type: "sawtooth", vol: 0.04, slideTo: f }); G.s.sing[i] = 0.45; const h = this.hn(G, i); G.burst(h.x, h.y - h.r, pick(["🎵", "🎶"]), 1, { size: 0.7, grav: -0.4 }); },
    play(G, i, auto) { const s = G.s, h = this.hn(G, i); this.note(G, i); if (s.perf > 0) { G.add(1, h.x, h.y - h.r * 1.5); return; }
      const song = this.SONGS[s.song][1]; if (i === song[s.i]) { s.i++; G.add(2, h.x, h.y - h.r * 1.5, { color: this.COLS[i] });
        if (s.i >= song.length) { s.perf = song.length * 0.3 + 1.4; s.pt = 0; s.songs++; song.forEach((n, k) => sing(G, this.FREQ[n], 0.3, 0.4 + k * 0.3)); G.add(10 + song.length * 3, G.cx, G.H * 0.35, { color: "#ffd23f", noCrit: true }); SFX.win(); G.float(`🎶 ${this.SONGS[s.song][0]}! 🎶`, G.cx, G.u * 30, "#ffe066", 1.1); } }
      else { G.add(1, h.x, h.y - h.r * 1.5); if (!auto && s.hint <= 0) { s.hint = 2; const n = this.hn(G, song[s.i]); G.say("Ooh, pretty! Now try the glowing one!", n.x, n.y - n.r * 1.6, 1.4); } } },
    down(G, x, y) { for (let i = 0; i < 5; i++) { const h = this.hn(G, i); if (dist(x, y, h.x, h.y) < h.r * 1.35) { this.play(G, i); return; } } SFX.boop(); },
    update(G, dt) { const s = G.s; for (let i = 0; i < 5; i++) s.sing[i] = Math.max(0, s.sing[i] - dt); s.hint = Math.max(0, s.hint - dt);
      if (s.perf > 0) { s.pt += dt; const song = this.SONGS[s.song][1], k = Math.floor((s.pt - 0.4) / 0.3); if (k >= 0 && k < song.length && s.sing[song[k]] < 0.2) { s.sing[song[k]] = 0.3; const h = this.hn(G, song[k]); G.burst(h.x, h.y - h.r, pick(["🎵", "🎶", "✨"]), 1, { size: 0.8, grav: -0.4 }); }
        if ((s.perf -= dt) <= 0) { s.song = (s.song + 1) % this.SONGS.length; s.i = 0; } } },
    autoTick(G) { const s = G.s; if (s.perf > 0) return; this.play(G, this.SONGS[s.song][1][s.i], true); },
    draw(G, g) { const s = G.s, [name, song] = this.SONGS[s.song], perf = s.perf > 0;
      for (let i = 0; i < 5; i++) { const h = this.hn(G, i); g.save(); g.globalAlpha = 0.18 + (s.sing[i] > 0 ? 0.25 : 0); g.fillStyle = "#fff6c0"; g.beginPath(); g.moveTo(h.x - G.u * 3, 0); g.lineTo(h.x + G.u * 3, 0); g.lineTo(h.x + h.r * 1.4, G.H * 0.85); g.lineTo(h.x - h.r * 1.4, G.H * 0.85); g.fill(); g.restore(); }
      rr(g, -G.u * 2, G.H * 0.8, G.W + G.u * 4, G.H * 0.3, 0, "#a0602e", INK, 3); g.fillStyle = "#c27a3e"; g.fillRect(0, G.H * 0.8 + 3, G.W, G.u * 2);
      for (const sd of [0, 1]) { g.fillStyle = "#c2263a"; g.beginPath(); const x0 = sd ? G.W : 0, w = G.W * 0.07 * (sd ? -1 : 1); g.moveTo(x0, 0); g.lineTo(x0 + w * 2, 0); g.quadraticCurveTo(x0 + w, G.H * 0.4, x0 + w * 0.6, G.H * 0.82); g.lineTo(x0, G.H * 0.82); g.fill(); g.strokeStyle = INK; g.lineWidth = 3; g.stroke(); }
      const sw = Math.min(G.W * 0.86, G.u * 90), nw = sw / Math.max(song.length, 4), sx0 = G.cx - (song.length * nw) / 2; rr(g, G.cx - sw / 2 - G.u * 2, G.u * 11, sw + G.u * 4, G.u * 14, G.u * 3, "#fffaf0", INK, 3);
      for (let l = 0; l < 3; l++) { g.strokeStyle = "rgba(74,42,26,.25)"; g.lineWidth = 1.5; g.beginPath(); g.moveTo(G.cx - sw / 2, G.u * (15 + l * 3)); g.lineTo(G.cx + sw / 2, G.u * (15 + l * 3)); g.stroke(); }
      song.forEach((n, k) => { const x = sx0 + (k + 0.5) * nw, y = G.u * (22 - n * 1.6), done = perf || k < s.i, nxt = !perf && k === s.i; circ(g, x, y, G.u * (nxt ? 2.6 + Math.sin(G.t * 8) * 0.4 : 2.1), done ? this.COLS[n] : nxt ? "#fff" : "rgba(255,255,255,.9)", nxt ? this.COLS[n] : INK, nxt ? 4 : 2); if (!done) circ(g, x, y, G.u * 0.9, this.COLS[n], null); });
      for (let i = 0; i < 5; i++) { const h = this.hn(G, i), sg = s.sing[i] > 0, nxt = !perf && song[s.i] === i, by = sg || perf ? -Math.abs(Math.sin(G.t * (perf ? 9 : 14) + i)) * G.u * 2.5 : 0;
        if (nxt) circ(g, h.x, h.y, h.r * (1.35 + Math.sin(G.t * 6) * 0.06), "rgba(255,240,150,.35)", "#ffe066", 3);
        hen(g, h.x, h.y + by, h.r, { bow: this.COLS[i], mood: sg ? "joy" : perf ? "joy" : "happy", open: sg ? 1 : 0 });
        rr(g, h.x - G.u * 4.5, h.y + h.r * 1.25, G.u * 9, G.u * 4.5, G.u * 2, this.COLS[i], INK, 2); txt(g, this.NAMES[i], h.x, h.y + h.r * 1.25 + G.u * 2.3, G.u * 2.8, INK); }
      txt(g, perf ? "🎶 The whole choir sings! 🎶" : `🎼 ${name} · songs: ${s.songs}`, G.cx, G.u * 6, G.u * 3.6, "#fff", { stroke: INK }); },
    hot(G) { const s = G.s; return this.hn(G, this.SONGS[s.song][1][s.i] ?? 0); },
  },
  {
    id: "train", name: "Pizza Express Train", rar: "mega", ico: "🚂", unit: "toots", base: 4, bg: ["#9fe0ff", "#d9f4ff"], noDots: true,
    blurb: "Choo-choo! Tap when the station glows to stop the train. Happy passengers hop on and you hand out hot pizzas!",
    ups: [["tap", "Shiny Whistle", "🎺"], ["auto", "Conductor Kitty", "🐱"], ["mult", "Pizza Dining Car", "🍕"]],
    win: ["Toot toot! All aboard!", "Every passenger gave you a thumbs up.", "The train got a fresh coat of paint. Red, obviously.", "Right on time! The station clock is proud.", "There's a song about your train now.", "The chickens bought season tickets.", "Your train now goes to the seaside AND the mountains!", "The Pizza Express is the most famous train in town.", "Chief Engineer of All the Railways! Choo choo!"],
    NAMES: ["Pepperoni Park", "Cheesy Corners", "Mushroom Meadow", "Olive Hill", "Basil Bay", "Crust Junction", "Chicken Coop Stop", "Garlic Gardens"], FOLK: ["🧒", "👧", "👵", "👴", "🐔", "🐶", "🐱", "👩‍🍳", "🐰", "🐻"],
    init(G) { Object.assign(G.s, { pos: 0, mode: "run", tgt: 0, nx: G.W * 0.95, wait: this.crowd(), name: pick(this.NAMES), hops: [], riders: ["🐻"], st: 0, fed: 0, done: 0, wheel: 0, puffT: 0, toot: 0 }); },
    crowd() { return Array.from({ length: 2 + Math.floor(Math.random() * 3) }, () => pick(this.FOLK)); },
    cw(G) { return Math.min(G.W * 0.17, G.u * 26); }, door(G) { return G.W * 0.38; }, ty(G) { return G.H * 0.62; },
    sx(G) { return G.s.nx - G.s.pos + this.door(G); },
    inWin(G) { const d = this.sx(G) - this.door(G); return G.s.mode === "run" && d > -G.W * 0.04 && d < G.W * 0.34; },
    stop(G) { const s = G.s, d = this.sx(G) - this.door(G); s.mode = "brake"; s.tgt = s.nx; SFX.ding(); if (Math.abs(d) < G.W * 0.12) { G.add(6, this.sx(G), this.ty(G) - G.u * 20, { color: "#ffd23f" }); G.float("Perfect stop!", G.cx, G.u * 22, "#4dbb5a", 1.1); } else G.add(3, this.sx(G), this.ty(G) - G.u * 20); },
    toot(G, x, y) { G.s.toot = 0.5; SFX.honk(1.3); G.add(1, x, y); const e = this.door(G) + this.cw(G) * 1.2; G.dots(e, this.ty(G) - this.cw(G) * 0.9, ["#fff", "#e8eef5"], 6); },
    next(G) { const s = G.s; s.nx = s.pos + G.W * rnd(1.1, 1.5); s.wait = this.crowd(); s.name = pick(this.NAMES); s.mode = "run"; s.fed = 0; },
    down(G, x, y) { const s = G.s; if (s.mode === "run") { if (this.inWin(G)) this.stop(G); else this.toot(G, x, y); return; } G.add(1, x, y, { color: "#bff7c8" }); G.burst(x, y, ["👋", "💖"], 2, { size: 0.6 }); SFX.tap(); },
    update(G, dt) { const s = G.s, door = this.door(G), ty = this.ty(G), cw = this.cw(G); s.toot = Math.max(0, s.toot - dt);
      const v = s.mode === "run" ? G.W * 0.26 : 0; if (s.mode === "run") { s.pos += v * dt; s.wheel += v * dt; if (this.sx(G) < door - G.W * 0.06) { G.say("Toot! See you next time!", this.sx(G) + G.u * 4, ty + G.u * 2, 1.2); this.next(G); } }
      else if (s.mode === "brake") { const d = (s.tgt - s.pos) * Math.min(1, dt * 3); s.pos += d; s.wheel += d; if (Math.abs(s.tgt - s.pos) < 1) { s.pos = s.tgt; s.mode = "stop"; s.st = 0.3; SFX.door(); } }
      else if (s.mode === "stop") { if ((s.st -= dt) <= 0) {
        if (s.wait.length) { const e = s.wait.shift(), i = s.wait.length; s.hops.push({ e, t: 0, x0: door + (i - 1) * G.u * 7, y0: ty + G.u * 9 }); s.st = 0.4; SFX.boing(); }
        else if (!s.hops.length && !s.fed) { s.fed = 1; s.st = 1.1; G.add(8, door, ty + G.u * 6, { color: "#ffd23f" }); G.burst(door - cw * 1.1, ty - cw * 0.3, ["🍕", "🍕", "✨"], 7); SFX.cash(); G.say(pick(["Pizza! Thank you!", "Yum yum, toot toot!", "Best train EVER!"]), door, ty + G.u * 2, 1.1);
          s.done++; if (s.done % 5 === 0) { G.add(30, G.cx, G.cy, { color: "#ffd23f", noCrit: true }); SFX.wow(); G.flash("#fff3b0"); G.float("🎉 PIZZA PARTY STATION! 🎉", G.cx, G.u * 22, "#ff5d8f", 1.2); } }
        else if (!s.hops.length && s.fed) { this.next(G); SFX.honk(1.3); } } }
      for (let i = s.hops.length - 1; i >= 0; i--) { const h = s.hops[i]; h.t += dt * 2; if (h.t >= 1) { s.hops.splice(i, 1); s.riders.push(h.e); if (s.riders.length > 3) s.riders.shift(); G.add(5, door, ty - cw * 0.5, { color: "#bff7c8" }); SFX.pop(1.2); } }
      if (s.mode !== "stop" && (s.puffT -= dt) <= 0) { s.puffT = 0.25; G.parts.push({ x: door + cw * 1.3, y: ty - cw * 0.95, vx: -G.u * 8, vy: -G.u * 10, life: 1, max: 1, c: "rgba(255,255,255,.9)", size: G.u * rnd(1.8, 3), grav: -0.15 }); } },
    autoTick(G) { const s = G.s; if (s.mode === "run") { if (this.inWin(G)) this.stop(G); else this.toot(G, this.door(G) + this.cw(G) * 1.1, this.ty(G) - this.cw(G)); } },
    draw(G, g) { const s = G.s, door = this.door(G), ty = this.ty(G), cw = this.cw(G), ch = cw * 0.55, sx = this.sx(G), win = this.inWin(G);
      E(g, "☀️", G.W * 0.88, G.H * 0.12, G.u * 10); for (let i = 0; i < 3; i++) cloud(g, ((i * 0.4 - s.pos * 0.00005 * G.W) % 1.2 + 1.2) % 1.2 * G.W - G.W * 0.1, G.H * (0.12 + i * 0.06), G.u * 4, "#fff");
      g.fillStyle = "#8fd67a"; g.beginPath(); g.moveTo(0, ty); for (let x = 0; x <= G.W + 10; x += 10) g.lineTo(x, ty - G.u * 10 - Math.sin((x + s.pos * 0.3) * 0.012) * G.u * 6); g.lineTo(G.W, ty); g.fill();
      for (let i = 0; i < 8; i++) { const x = (((i * G.W * 0.21 - s.pos * 0.6) % (G.W * 1.68)) + G.W * 1.68) % (G.W * 1.68) - G.W * 0.1; E(g, i % 3 ? "🌳" : "🌻", x, ty - G.u * 7, G.u * (i % 3 ? 9 : 6)); }
      g.fillStyle = "#c9a87a"; g.fillRect(0, ty, G.W, G.H - ty); g.fillStyle = "#7fd36b"; g.fillRect(0, ty + G.u * 16, G.W, G.H);
      const sp = G.u * 5; for (let x = -(s.pos % sp); x < G.W; x += sp) rr(g, x, ty - G.u * 0.5, G.u * 2, G.u * 3, 2, "#8a5a2a", null); g.fillStyle = "#666"; g.fillRect(0, ty, G.W, G.u * 0.8);
      if (sx > -G.W * 0.3 && sx < G.W * 1.3) { const pw = cw * 1.6; rr(g, sx - pw / 2, ty - ch * 2.6, G.u * 1.5, ch * 2.6, 2, "#fff", INK, 2); rr(g, sx + pw / 2 - G.u * 1.5, ty - ch * 2.6, G.u * 1.5, ch * 2.6, 2, "#fff", INK, 2);
        g.fillStyle = "#ff6b6b"; g.beginPath(); g.moveTo(sx - pw * 0.62, ty - ch * 2.5); g.lineTo(sx, ty - ch * 3.2); g.lineTo(sx + pw * 0.62, ty - ch * 2.5); g.closePath(); g.fill(); g.strokeStyle = INK; g.lineWidth = 3; g.stroke();
        rr(g, sx - pw * 0.45, ty - ch * 2.45, pw * 0.9, G.u * 5, G.u * 1.5, win ? "#c8ffb0" : "#fffaf0", win ? "#2a9a3a" : INK, win ? 4 : 2); txt(g, s.name, sx, ty - ch * 2.45 + G.u * 2.5, Math.min(G.u * 2.6, pw * 0.9 / (s.name.length * 0.55)), INK);
        rr(g, sx - pw / 2, ty + G.u * 3, pw, G.u * 11, G.u * 2, "#d8d0c0", INK, 3); s.wait.forEach((e, i) => { const x = sx + (i - (s.wait.length - 1) / 2) * G.u * 7; E(g, e, x, ty + G.u * 8 - Math.abs(Math.sin(G.t * 4 + i)) * G.u * (win ? 2 : 0.8), G.u * 7); }); if (s.wait.length && s.mode === "run") E(g, "🍕", sx + pw * 0.45, ty + G.u * 1.5, G.u * 5, Math.sin(G.t * 3) * 0.2); }
      const car = (cx, col, kind) => { const bob = s.mode === "run" ? Math.sin(G.t * 18 + cx) * G.u * 0.25 : 0, x0 = cx - cw / 2, y0 = ty - ch - G.u * 2 + bob;
        if (kind === "engine") { rr(g, x0, y0 - ch * 0.5, cw * 0.45, ch * 1.5, 4, col, INK, 3); rr(g, x0 + cw * 0.06, y0 - ch * 0.35, cw * 0.3, ch * 0.45, 3, "#bfefff", INK, 2); rr(g, x0 + cw * 0.4, y0 + ch * 0.05, cw * 0.6, ch * 0.95, ch * 0.4, col, INK, 3); rr(g, x0 + cw * 0.72, y0 - ch * 0.45, cw * 0.14, ch * 0.55, 3, "#444", INK, 2); circ(g, x0 + cw * 1.0, y0 + ch * 0.52, ch * 0.42, "#ffe9b0"); face(g, x0 + cw * 1.0, y0 + ch * 0.52, ch * 0.36, s.toot > 0 ? "wow" : "happy"); }
        else { rr(g, x0, y0, cw, ch, 5, col, INK, 3); if (kind === "pizza") { rr(g, x0 + cw * 0.12, y0 + ch * 0.18, cw * 0.76, ch * 0.5, 4, "#fffaf0", INK, 2); pizza(g, cx, y0 + ch * 0.43, ch * 0.22, { peps: 4 }); }
          else for (let i = 0; i < 3; i++) { rr(g, x0 + cw * (0.07 + i * 0.31), y0 + ch * 0.15, cw * 0.25, ch * 0.5, 3, "#bfefff", INK, 2); const e = s.riders[i]; if (e) E(g, e, x0 + cw * (0.195 + i * 0.31), y0 + ch * 0.42, ch * 0.45); } }
        for (const wx of [0.22, 0.78]) { const X = x0 + cw * wx, Y = ty - G.u * 1.5; circ(g, X, Y, ch * 0.28, "#555"); g.strokeStyle = "#ddd"; g.lineWidth = 2; const a = s.wheel / (ch * 0.28); g.beginPath(); g.moveTo(X - Math.cos(a) * ch * 0.22, Y - Math.sin(a) * ch * 0.22); g.lineTo(X + Math.cos(a) * ch * 0.22, Y + Math.sin(a) * ch * 0.22); g.stroke(); } };
      car(door - cw * 1.08, "#ffb347", "pizza"); car(door, "#6ec6ff", "pass"); car(door + cw * 1.08, "#e8322a", "engine");
      for (const h of s.hops) { const x = h.x0 + (door - h.x0) * h.t, y = h.y0 + (ty - ch * 0.8 - h.y0) * h.t - Math.sin(h.t * Math.PI) * G.u * 10; E(g, h.e, x, y, G.u * 7); }
      txt(g, win ? "🟢 TAP NOW to stop at the station!" : s.mode === "run" ? `🚂 Toot toot! · stations: ${s.done}` : "🚉 All aboard!", G.cx, G.u * 6, G.u * 3.8, win ? "#c8ffb0" : "#fff", { stroke: INK }); },
    hot(G) { return { x: this.door(G), y: this.ty(G) - this.cw(G) * 0.4 }; },
  },

  // ------------------------------------------------------------------------
  //  LEGENDARY
  // ------------------------------------------------------------------------
  {
    id: "whale", name: "Whale Song", rar: "legendary", ico: "🐋", unit: "songs", base: 5, bg: ["#bfe9ff", "#7cc8f0"], noDots: true,
    blurb: "Wanda the whale sings you a little tune. Listen, then tap the bubbles to sing it back! Get it right and she sprays a RAINBOW spout.",
    ups: [["tap", "Seashell Microphone", "🐚"], ["auto", "Dolphin Duet", "🐬"], ["crit", "Rainbow Spout", "🌈"]],
    win: ["Wanda sang 'thank you' in whale. It was lovely.", "The fish are dancing!", "Wanda's rainbow reached the beach!", "The seagulls want to join the band.", "Wanda taught you a secret ocean song.", "Whales from far away are singing back!", "The whole ocean hums your song now.", "Wanda gave you a shiny pearl. Ooooh.", "Ocean Superstar! The sea sings your name!"],
    COLS: ["#ff86b3", "#ffe066", "#7cffb0", "#b18cff"], FREQ: [392, 494, 587, 784],
    init(G) { Object.assign(G.s, { ph: "sing", seq: [], len: 3, k: 0, tm: 1.2, lit: [0, 0, 0, 0], spray: 0, pat: 0, songs: 0, sing: 0 }); this.newSeq(G); },
    newSeq(G) { const s = G.s; s.seq = Array.from({ length: s.len }, () => Math.floor(Math.random() * 4)); s.ph = "sing"; s.k = 0; s.tm = 1; },
    wh(G) { const rx = Math.min(G.W * 0.34, G.u * 34); return { x: G.W * 0.46, y: G.H * 0.44, rx, ry: rx * 0.42 }; },
    btn(G, i) { return { x: G.W * (0.2 + 0.2 * i), y: G.H * 0.8, r: Math.min(G.W * 0.085, G.u * 8.5) }; },
    press(G, i, auto) { const s = G.s, b = this.btn(G, i); s.lit[i] = 0.35; sing(G, this.FREQ[i], 0.4);
      if (s.ph !== "listen") { G.add(1, b.x, b.y - b.r); return; }
      if (i === s.seq[s.k]) { s.k++; G.add(2, b.x, b.y - b.r, { color: this.COLS[i] }); G.dots(b.x, b.y, ["#fff", this.COLS[i]], 6);
        if (s.k >= s.len) { s.ph = "spray"; s.spray = 2.8; s.songs++; const w = this.wh(G); G.add(15 + s.len * 5, w.x, w.y - w.ry * 1.6, { color: "#ffd23f", noCrit: true }); SFX.wow(); G.float("🌈 RAINBOW SPOUT! 🌈", G.cx, G.u * 20, "#ff5d8f", 1.2); } }
      else { G.add(1, b.x, b.y - b.r); s.ph = "again"; s.tm = 1.2; if (!auto) { const w = this.wh(G); G.say("La la! Let's sing it again together!", w.x - w.rx * 0.5, w.y - w.ry, 1.5); } } },
    down(G, x, y) { const s = G.s, w = this.wh(G);
      for (let i = 0; i < 4; i++) { const b = this.btn(G, i); if (dist(x, y, b.x, b.y) < b.r * 1.25) { this.press(G, i); return; } }
      if (Math.abs(x - w.x) < w.rx && Math.abs(y - w.y) < w.ry * 1.2) { s.pat = 0.5; G.add(1, x, y, { color: "#ff86b3" }); G.burst(x, y, "💙", 2, { size: 0.6, grav: -0.3 }); G.tone(170, 0.6, { type: "sine", vol: 0.15, slideTo: 260 }); return; }
      SFX.boop(); G.dots(x, y, ["#fff", "#bfefff"], 4); },
    update(G, dt) { const s = G.s, w = this.wh(G); for (let i = 0; i < 4; i++) s.lit[i] = Math.max(0, s.lit[i] - dt); s.pat = Math.max(0, s.pat - dt); s.sing = Math.max(0, s.sing - dt);
      if (s.ph === "sing" && (s.tm -= dt) <= 0) { if (s.k < s.len) { const n = s.seq[s.k++]; s.lit[n] = 0.45; s.sing = 0.4; sing(G, this.FREQ[n], 0.45); G.tone(this.FREQ[n] / 2, 0.45, { type: "sine", vol: 0.08 }); G.burst(w.x - w.rx * 0.55, w.y - w.ry * 0.6, pick(["🎵", "🎶"]), 1, { size: 0.8, grav: -0.4 }); s.tm = 0.65; } else { s.ph = "listen"; s.k = 0; } }
      if (s.ph === "again" && (s.tm -= dt) <= 0) { s.ph = "sing"; s.k = 0; s.tm = 0.3; }
      if (s.ph === "spray") { const bx = w.x - w.rx * 0.15, by = w.y - w.ry; for (let i = 0; i < 2; i++) G.parts.push({ x: bx + rnd(-1, 1) * G.u, y: by, vx: rnd(-1, 1) * G.u * 25, vy: -G.u * rnd(60, 80), life: 1.3, max: 1.3, c: pick(RAINBOW), size: G.u * rnd(1, 1.8), grav: 0.6 });
        if ((s.spray -= G.dt) <= 0) { s.len = s.len >= 6 ? 3 : s.len + 1; this.newSeq(G); } } },
    autoTick(G) { const s = G.s; if (s.ph === "listen") this.press(G, s.seq[s.k], true); },
    draw(G, g) { const s = G.s, w = this.wh(G), sea = G.H * 0.5;
      E(g, "☀️", G.W * 0.12, G.H * 0.12, G.u * 10); cloud(g, G.W * 0.75, G.H * 0.12, G.u * 4.5, "#fff");
      if (s.ph === "spray") for (let i = 0; i < 6; i++) { g.beginPath(); g.arc(w.x - w.rx * 0.15, w.y + w.ry * 0.2, G.W * 0.34 - i * G.u * 2.2, Math.PI, 0); g.strokeStyle = RAINBOW[i]; g.lineWidth = G.u * 2.2; g.globalAlpha = Math.min(1, s.spray) * 0.7; g.stroke(); } g.globalAlpha = 1;
      g.save(); g.translate(w.x + w.rx * 1.0, w.y - w.ry * 0.3); g.rotate(-0.5 + Math.sin(G.t * 2) * 0.25); g.beginPath(); g.moveTo(0, 0); g.quadraticCurveTo(w.rx * 0.2, -w.ry * 0.5, w.rx * 0.45, -w.ry * 0.7); g.quadraticCurveTo(w.rx * 0.3, -w.ry * 0.2, w.rx * 0.28, 0); g.quadraticCurveTo(w.rx * 0.3, w.ry * 0.2, w.rx * 0.45, w.ry * 0.5); g.quadraticCurveTo(w.rx * 0.2, w.ry * 0.4, 0, 0); g.fillStyle = "#5b8fd6"; g.fill(); g.strokeStyle = INK; g.lineWidth = 3; g.stroke(); g.restore();
      const sq = 1 + s.pat * 0.06 * Math.sin(G.t * 30); g.save(); g.translate(w.x, w.y + Math.sin(G.t * 1.5) * G.u); g.scale(sq, 2 - sq); oval(g, 0, 0, w.rx, w.ry, "#5b8fd6", INK, 4); oval(g, -w.rx * 0.1, w.ry * 0.45, w.rx * 0.75, w.ry * 0.45, "#cfe4ff", null); g.restore();
      face(g, w.x - w.rx * 0.58, w.y - w.ry * 0.15, w.ry * 0.55, s.ph === "spray" || s.pat > 0 ? "joy" : s.sing > 0 ? "wow" : "happy");
      oval(g, w.x - w.rx * 0.15, w.y - w.ry * 0.95, G.u * 1.5, G.u * 0.7, "#2a4a80", null);
      g.fillStyle = "rgba(40,120,200,.78)"; g.fillRect(0, sea, G.W, G.H - sea); for (let i = 0; i < 4; i++) { g.strokeStyle = "rgba(255,255,255,.6)"; g.lineWidth = 3; g.beginPath(); for (let x = 0; x <= G.W; x += 12) g.lineTo(x, sea + i * G.u * 7 + Math.sin(x * 0.03 + G.t * 2 + i) * G.u); g.stroke(); }
      for (let i = 0; i < 4; i++) { const b = this.btn(G, i), l = s.lit[i] > 0; circ(g, b.x, b.y + (l ? -G.u : 0), b.r * (l ? 1.15 : 1), l ? this.COLS[i] : "rgba(255,255,255,.55)", l ? "#fff" : this.COLS[i], 5); circ(g, b.x - b.r * 0.35, b.y - b.r * 0.4 + (l ? -G.u : 0), b.r * 0.2, "rgba(255,255,255,.9)", null); txt(g, "♪", b.x, b.y + (l ? -G.u : 0), b.r * 0.9, l ? "#fff" : this.COLS[i], { stroke: INK }); }
      for (let i = 0; i < s.len; i++) circ(g, G.cx + (i - (s.len - 1) / 2) * G.u * 4, G.u * 13, G.u * 1.3, s.ph === "spray" || (s.ph === "listen" && i < s.k) ? "#ffe066" : "rgba(255,255,255,.7)", INK, 2);
      txt(g, s.ph === "listen" ? "🎤 Your turn! Sing it back!" : s.ph === "spray" ? "🌈 Wanda LOVES it!" : `👂 Listen to Wanda… · songs: ${s.songs}`, G.cx, G.u * 6, G.u * 3.8, "#fff", { stroke: INK }); },
    hot(G) { const s = G.s; if (s.ph === "listen") return this.btn(G, s.seq[s.k]); const w = this.wh(G); return { x: w.x, y: w.y }; },
  },
  {
    id: "giant", name: "Friendly Giant's Picnic", rar: "legendary", ico: "🧑‍🍳", unit: "slices", base: 5, bg: ["#c8f0ff", "#b8ec9a"], noDots: true,
    blurb: "Gus the kind giant made an ENORMOUS pizza! Tap a slice and a tiny helper carries it to the picnic. Tap the helpers to cheer them on!",
    ups: [["tap", "Super Spatula", "🍳"], ["auto", "Ant Picnic Crew", "🐜"], ["mult", "Giant Oven", "🔥"]],
    win: ["HO HO HO! Gus is so happy!", "Gus gave everyone a high five. Very gently.", "The picnic friends say this is the best day ever.", "Gus made a pizza as big as a pond!", "Gus's laugh made the trees wiggle.", "The ants built Gus a tiny thank-you statue.", "Gus's pizza can be seen from the moon.", "Gus calls you his Tiny Best Friend.", "Grand Picnic Champion! HO HO HOORAY!"],
    HELP: ["🐭", "🐹", "🐰", "🐥", "🐿️"], GUESTS: ["🐻", "🦊", "🐸", "🐔"],
    init(G) { Object.assign(G.s, { sl: Array(8).fill(true), carry: [], made: 1, laugh: 0, wave: 0, fed: 0, yum: 0 }); },
    gi(G) { const R = Math.min(G.W * 0.15, G.u * 15); return { x: G.cx, y: G.H * 0.26, r: R }; },
    pz(G) { return { x: G.cx, y: G.H * 0.56, r: Math.min(G.W * 0.27, G.u * 20) }; },
    bl(G) { return { x: G.W * 0.8, y: G.H * 0.88 }; },
    send(G, i) { const s = G.s, p = this.pz(G), a = (i + 0.5) * Math.PI / 4; s.sl[i] = false; s.carry.push({ x0: p.x + Math.cos(a) * p.r * 0.55, y0: p.y + Math.sin(a) * p.r * 0.55, t: 0, e: pick(this.HELP), boost: 0, a }); G.add(1, p.x + Math.cos(a) * p.r * 0.55, p.y + Math.sin(a) * p.r * 0.55); SFX.pop(1.1); },
    cpos(G, c) { const b = this.bl(G), x = c.x0 + (b.x - c.x0) * c.t, y = c.y0 + (b.y - G.u * 4 - c.y0) * c.t - Math.abs(Math.sin(c.t * Math.PI * 5)) * G.u * 1.5; return { x, y }; },
    down(G, x, y) { const s = G.s, p = this.pz(G), gi = this.gi(G);
      for (const c of s.carry) { const q = this.cpos(G, c); if (dist(x, y, q.x, q.y) < G.u * 7) { c.boost = 1; G.add(1, q.x, q.y, { color: "#bff7c8" }); G.burst(q.x, q.y, ["✨", "📣"], 2, { size: 0.6 }); SFX.squeak(); return; } }
      const d = dist(x, y, p.x, p.y); if (d < p.r * 1.05) { let a = Math.atan2(y - p.y, x - p.x); if (a < 0) a += Math.PI * 2; const i = Math.floor(a / (Math.PI / 4)) % 8; if (s.sl[i]) { this.send(G, i); return; } const j = s.sl.findIndex((v) => v); if (j >= 0) { this.send(G, j); return; } }
      if (dist(x, y, gi.x, gi.y) < gi.r * 1.3 || (y < gi.y + gi.r * 2 && Math.abs(x - gi.x) < gi.r * 1.8)) { s.wave = 1.2; G.add(1, x, y); G.tone(150, 0.35, { type: "triangle", vol: 0.15, slideTo: 220 }); G.say(pick(["Hello, tiny friend!", "Ho ho! Hi there!", "Want some pizza?"]), gi.x + gi.r, gi.y - gi.r, 1.2); return; }
      SFX.boop(); },
    update(G, dt) { const s = G.s, b = this.bl(G); s.wave = Math.max(0, s.wave - dt); s.yum = Math.max(0, s.yum - dt);
      for (let i = s.carry.length - 1; i >= 0; i--) { const c = s.carry[i]; c.boost = Math.max(0, c.boost - dt); c.t += dt * (0.4 + c.boost * 0.8); if (c.t >= 1) { s.carry.splice(i, 1); s.fed++; s.yum = 0.6; G.add(4, b.x, b.y - G.u * 10, { color: "#ffd23f" }); G.burst(b.x, b.y - G.u * 6, ["🍕", "💖"], 3, { size: 0.7 }); SFX.coin(); } }
      if (s.laugh > 0) { if ((s.laugh -= dt) <= 0) { s.sl = Array(8).fill(true); s.made++; SFX.ding(); } }
      else if (!s.sl.some((v) => v) && !s.carry.length) { s.laugh = 2.6; const gi = this.gi(G); G.add(25, gi.x, gi.y, { color: "#ffd23f", noCrit: true }); SFX.wow(); G.say("HO HO HO! Let's make ANOTHER one!", gi.x, gi.y - gi.r * 1.2, 2.2); G.burst(gi.x, gi.y, ["😄", "✨", "🍕"], 12); } },
    autoTick(G) { const s = G.s, i = s.sl.findIndex((v) => v); if (i >= 0) { this.send(G, i); G.burst(this.pz(G).x, this.pz(G).y, "🐜", 1, { size: 0.5 }); } else if (s.carry[0]) s.carry[0].boost = 1; },
    draw(G, g) { const s = G.s, gi = this.gi(G), R = gi.r, p = this.pz(G), b = this.bl(G), hap = s.laugh > 0 || s.wave > 0;
      cloud(g, G.W * 0.15, G.H * 0.12, G.u * 5, "#fff"); cloud(g, G.W * 0.85, G.H * 0.08, G.u * 4, "#fff");
      const by = gi.y + (s.laugh > 0 ? Math.sin(G.t * 20) * G.u * 0.6 : 0);
      const bh = G.H * 0.5 - by - R * 0.75; rr(g, gi.x - R * 1.7, by + R * 0.75, R * 3.4, bh + R, R * 0.8, "#6ec6ff", INK, 4); rr(g, gi.x - R * 0.9, by + R * 0.8, R * 1.8, bh + R, R * 0.3, "#fffaf0", INK, 3);
      circ(g, gi.x, by, R, "#ffcf9e", INK, 4); oval(g, gi.x, by + R * 0.65, R * 0.75, R * 0.45, "#8a5a2a", null); face(g, gi.x, by, R * 0.7, hap ? "joy" : "happy");
      rr(g, gi.x - R * 0.75, by - R * 1.05, R * 1.5, R * 0.35, 6, "#fff", INK, 3); for (const dx of [-0.5, 0, 0.5]) circ(g, gi.x + dx * R, by - R * 1.35, R * 0.38, "#fff"); rr(g, gi.x - R * 0.75, by - R * 1.05, R * 1.5, R * 0.35, 6, "#fff", INK, 3);
      const wv = s.wave > 0 || s.laugh > 0, hx = gi.x + R * (wv ? 2.1 : 1.85), hy = wv ? by - R * 0.2 : p.y - p.r * 0.2; if (wv) { g.strokeStyle = INK; g.lineWidth = R * 0.5 + 6; g.lineCap = "round"; g.beginPath(); g.moveTo(gi.x + R * 1.4, by + R * 1.2); g.lineTo(hx, hy); g.stroke(); g.strokeStyle = "#6ec6ff"; g.lineWidth = R * 0.5; g.stroke(); }
      const tb = p.y + p.r + G.u * 3; rr(g, G.W * 0.03, G.H * 0.47, G.W * 0.94, tb - G.H * 0.47, G.u * 2, "#fff4f0", INK, 3); for (let x = G.W * 0.03 + G.u * 3; x < G.W * 0.96; x += G.u * 8) { g.fillStyle = "rgba(255,107,107,.25)"; g.fillRect(x, G.H * 0.47 + 2, G.u * 4, tb - G.H * 0.47 - 4); } rr(g, G.W * 0.03, G.H * 0.47, G.W * 0.94, G.u * 2.5, 4, "#b57d38", INK, 3);
      for (let i = 0; i < 8; i++) if (s.sl[i]) wedge(g, p.x, p.y, p.r, i * Math.PI / 4, (i + 1) * Math.PI / 4); circ(g, p.x, p.y, p.r * 1.06, null, "rgba(74,42,26,.25)", 2);
      for (const sd of [-1, 1]) if (!(sd === 1 && wv)) { circ(g, gi.x + sd * R * 1.85, p.y - p.r * 0.2, R * 0.35, "#ffcf9e", INK, 3); }
      if (wv) { g.save(); g.translate(hx, hy); g.rotate(Math.sin(G.t * 10) * 0.4); circ(g, 0, 0, R * 0.38, "#ffcf9e", INK, 3); for (let f = 0; f < 4; f++) oval(g, (f - 1.5) * R * 0.17, -R * 0.4, R * 0.08, R * 0.16, "#ffcf9e", INK, 2); g.restore(); }
      rr(g, b.x - G.W * 0.17, b.y - G.u * 4, G.W * 0.34, G.u * 9, G.u * 2, "#ff6b6b", INK, 3); for (let i = 0; i < 6; i++) rr(g, b.x - G.W * 0.17 + (i + 0.3) * G.W * 0.055, b.y - G.u * 4, G.W * 0.02, G.u * 9, 0, "rgba(255,255,255,.6)", null);
      this.GUESTS.forEach((e, i) => E(g, e, b.x + (i - 1.5) * G.W * 0.075, b.y - G.u * 7 - (s.yum > 0 ? Math.abs(Math.sin(G.t * 12 + i)) * G.u * 2 : 0), G.u * 7));
      for (const c of s.carry) { const q = this.cpos(G, c); E(g, c.e, q.x, q.y, G.u * 6.5); slice(g, q.x, q.y - G.u * 4, G.u * 5, { rot: Math.sin(G.t * 8) * 0.15 }); if (c.boost > 0) E(g, "💨", q.x - G.u * 5, q.y, G.u * 4); }
      txt(g, `🍕 Gus's pizza #${s.made} · slices to the picnic: ${s.fed}`, G.cx, G.u * 5, G.u * 3.4, "#fff", { stroke: INK }); },
    hot(G) { const s = G.s, i = s.sl.findIndex((v) => v), p = this.pz(G); if (i >= 0) { const a = (i + 0.5) * Math.PI / 4; return { x: p.x + Math.cos(a) * p.r * 0.6, y: p.y + Math.sin(a) * p.r * 0.6 }; } if (s.carry[0]) return this.cpos(G, s.carry[0]); return this.gi(G); },
  },

  // ------------------------------------------------------------------------
  //  ULTRA
  // ------------------------------------------------------------------------
  {
    id: "buildabot", name: "Build-a-Bot", rar: "ultra", ico: "🤖", unit: "bolts", base: 6, bg: ["#e2ecf5", "#b9cde0"],
    blurb: "Snap robot parts together — wheels, body, arms, then a head! Tap the part that glows. Finished bots do a silly dance!",
    ups: [["tap", "Turbo Screwdriver", "🪛"], ["auto", "Wrench Raccoon", "🦝"], ["mult", "Shiny Bolts", "🔩"]],
    win: ["Beep boop! Your first bot says hello!", "The bots formed a dance crew.", "One bot learned to make toast. Pizza toast.", "Your workshop is now a robot party.", "A bot painted you a picture. It's of a bolt.", "The bots built a tiny bot. Awww.", "The Robot Olympics called. They want your bots.", "Your bots sang 'Happy Birthday' in beeps.", "Master Bot Builder! Beep beep hooray!"],
    ORDER: ["wheels", "body", "arms", "head"], LABEL: { wheels: "WHEELS", body: "BODY", arms: "ARMS", head: "HEAD" }, COLS: ["#6ec6ff", "#ff86b3", "#ffd23f", "#7cffb0", "#b18cff", "#ffb347"],
    init(G) { Object.assign(G.s, { step: 0, parts: {}, tray: [], dance: 0, built: 0, wig: -1, wigT: 0, snap: 0, five: 0 }); this.fill(G); },
    fill(G) { const k = [...this.ORDER].sort(() => Math.random() - 0.5); G.s.tray = k.map((kind) => ({ kind, col: pick(this.COLS), st: Math.floor(Math.random() * 3) })); },
    S(G) { return Math.min(G.W * 0.16, G.u * 16); }, gy(G) { return G.H * 0.64; },
    slot(G, i) { const w = Math.min(G.W * 0.21, G.u * 22); return { x: G.cx + (i - 1.5) * w * 1.05, y: G.H * 0.84, w }; },
    part(G, g, kind, x, y, S, col, st, dance) { const t = G.t;
      if (kind === "wheels") { if (st === 0) for (const sd of [-1, 1]) { circ(g, x + sd * S * 0.3, y, S * 0.2, "#555"); circ(g, x + sd * S * 0.3, y, S * 0.08, col); } else if (st === 1) { circ(g, x, y, S * 0.24, "#555"); circ(g, x, y, S * 0.1, col); } else { rr(g, x - S * 0.45, y - S * 0.18, S * 0.9, S * 0.36, S * 0.18, "#555", INK, 3); for (let i = 0; i < 3; i++) circ(g, x + (i - 1) * S * 0.28, y, S * 0.1, col, INK, 2); } }
      else if (kind === "body") { rr(g, x - S * 0.48, y - S * 0.4, S * 0.96, S * 0.8, S * 0.15, col, INK, 4); if (st === 0) E(g, "💖", x, y, S * 0.4, 0, 1, 1 + Math.sin(t * 6) * 0.08, 1 + Math.sin(t * 6) * 0.08); else if (st === 1) for (let i = 0; i < 3; i++) circ(g, x + (i - 1) * S * 0.25, y, S * 0.09, RAINBOW[(i + Math.floor(t * 3)) % 6]); else { circ(g, x, y - S * 0.05, S * 0.2, "#fffaf0"); g.strokeStyle = INK; g.lineWidth = 3; g.beginPath(); g.moveTo(x, y - S * 0.05); g.lineTo(x + Math.cos(t * 3) * S * 0.15, y - S * 0.05 + Math.sin(t * 3) * S * 0.15); g.stroke(); } }
      else if (kind === "arms") { for (const sd of [-1, 1]) { const wv = dance ? Math.sin(t * 10 + sd) * 0.9 : Math.sin(t * 2 + sd) * 0.15, ex = x + sd * S * 0.85, ey = y - S * 0.1 + Math.sin(wv) * S * 0.35 * (dance ? -1 : 1); g.lineCap = "round";
          if (st === 2) { g.strokeStyle = INK; g.lineWidth = Math.max(2, S * 0.06); g.beginPath(); g.moveTo(x + sd * S * 0.48, y); for (let i = 1; i <= 6; i++) { const f = i / 6; g.lineTo(x + sd * S * (0.48 + f * 0.37), y + (ey - y) * f + (i % 2 ? -1 : 1) * S * 0.07); } g.stroke(); }
          else { for (const [w, c] of [[S * 0.16, INK], [S * 0.1, col]]) { g.strokeStyle = c; g.lineWidth = w; g.beginPath(); g.moveTo(x + sd * S * 0.48, y); g.quadraticCurveTo(x + sd * S * 0.7, y + S * 0.15, ex, ey); g.stroke(); } }
          if (st === 1) { g.strokeStyle = INK; g.lineWidth = Math.max(2, S * 0.06); for (const o of [-1, 1]) { g.beginPath(); g.arc(ex + sd * S * 0.06, ey + o * S * 0.06, S * 0.08, 0, Math.PI * 2); g.stroke(); } } else circ(g, ex, ey, S * 0.1, col); } }
      else if (kind === "head") { if (st === 0) { g.strokeStyle = INK; g.lineWidth = 3; g.beginPath(); g.moveTo(x, y - S * 0.27); g.lineTo(x, y - S * 0.5); g.stroke(); circ(g, x, y - S * 0.52, S * 0.07, Math.sin(t * 6) > 0 ? "#ff5a5f" : "#ffe066"); } else if (st === 1) { g.strokeStyle = INK; g.lineWidth = 3; g.beginPath(); g.moveTo(x, y - S * 0.27); g.lineTo(x, y - S * 0.42); g.stroke(); oval(g, x, y - S * 0.44, S * 0.3 * Math.abs(Math.cos(t * 12)) + 2, S * 0.05, col); } else for (const sd of [-1, 1]) circ(g, x + sd * S * 0.4, y, S * 0.09, "#999");
        rr(g, x - S * 0.38, y - S * 0.28, S * 0.76, S * 0.56, S * 0.14, col, INK, 4); rr(g, x - S * 0.28, y - S * 0.19, S * 0.56, S * 0.38, S * 0.1, "#2a3550", INK, 2); g.save(); g.globalAlpha = 0.9; face(g, x, y - S * 0.01, S * 0.24, dance ? "joy" : "happy", { blush: true }); g.restore(); } },
    pos(G, kind) { const S = this.S(G), gy = this.gy(G); return { wheels: gy - S * 0.22, body: gy - S * 0.85, arms: gy - S * 0.9, head: gy - S * 1.55 }[kind]; },
    snap(G, i, auto) { const s = G.s, it = s.tray[i], need = this.ORDER[s.step]; if (it.kind !== need) { s.wig = i; s.wigT = 0.4; SFX.beep(2); G.add(1, this.slot(G, i).x, this.slot(G, i).y); if (!auto) G.float(`That goes on later! Find the ${this.LABEL[need]}`, G.cx, G.H * 0.7, "#fff", 0.8); return; }
      s.parts[need] = { col: it.col, st: it.st }; s.step++; s.snap = 0.3; const py = this.pos(G, need); G.add(3, G.cx, py, { color: "#bff7c8" }); G.burst(G.cx, py, ["✨", "🔩"], 4, { size: 0.7 }); SFX.ding(); this.fill(G);
      if (s.step >= 4) { s.dance = 3.2; s.built++; G.add(30, G.cx, G.H * 0.3, { color: "#ffd23f", noCrit: true }); SFX.win(); G.float("🕺 BOT DANCE PARTY! 🕺", G.cx, G.u * 22, "#ff5d8f", 1.2); [0, 1, 2, 3, 4, 3, 2, 1].forEach((n, k) => setTimeout(() => SFX.beep(n), 400 + k * 160)); } },
    down(G, x, y) { const s = G.s;
      if (s.dance > 0) { const S = this.S(G); if (Math.abs(x - G.cx) < S * 1.2 && y > this.gy(G) - S * 2 && y < this.gy(G)) { s.five = 0.4; G.add(2, x, y, { color: "#ffd23f" }); G.burst(x, y, ["🙌", "✨"], 2, { size: 0.7 }); SFX.beep(Math.floor(rnd(0, 5))); G.say("Beep boop! High five!", G.cx, this.gy(G) - S * 2.1, 1); return; } }
      else for (let i = 0; i < 4; i++) { const q = this.slot(G, i); if (Math.abs(x - q.x) < q.w / 2 && Math.abs(y - q.y) < q.w / 2) { this.snap(G, i); return; } }
      SFX.boop(); },
    update(G, dt) { const s = G.s; s.snap = Math.max(0, s.snap - dt); s.five = Math.max(0, s.five - dt); if ((s.wigT -= dt) <= 0) s.wig = -1;
      if (s.dance > 0) { if (Math.random() < 0.4) G.parts.push({ x: rnd(0, G.W), y: -5, vx: rnd(-20, 20), vy: G.u * 10, life: 1.5, max: 1.5, c: pick(RAINBOW), size: G.u * 0.9, grav: 0.3 }); if ((s.dance -= dt) <= 0) { s.step = 0; s.parts = {}; SFX.whoosh(); } } },
    autoTick(G) { const s = G.s; if (s.dance > 0) return; const i = s.tray.findIndex((q) => q.kind === this.ORDER[s.step]); if (i >= 0) { this.snap(G, i, true); G.burst(this.slot(G, i).x, this.slot(G, i).y, "🦝", 1, { size: 0.6 }); } },
    draw(G, g) { const s = G.s, S = this.S(G), gy = this.gy(G), d = s.dance > 0, need = this.ORDER[s.step];
      if (d) for (let i = 0; i < 6; i++) { g.save(); g.globalAlpha = 0.18; g.fillStyle = RAINBOW[i]; g.translate(G.W * (i / 5), 0); g.rotate(Math.sin(G.t * 2 + i) * 0.4); g.beginPath(); g.moveTo(0, 0); g.lineTo(-G.u * 8, G.H); g.lineTo(G.u * 8, G.H); g.fill(); g.restore(); }
      rr(g, -4, gy, G.W + 8, G.H, 0, "#9aa9b8", INK, 3); for (let x = (G.t * (d ? 0 : 0)) % 1; x < G.W; x += G.u * 8) { g.strokeStyle = "rgba(74,42,26,.2)"; g.lineWidth = 2; g.beginPath(); g.moveTo(x, gy); g.lineTo(x + G.u * 4, gy + G.u * 6); g.stroke(); }
      oval(g, G.cx, gy, S * 0.9, S * 0.12, "rgba(74,42,26,.15)", null);
      g.save(); if (d) { g.translate(G.cx, gy); g.rotate(Math.sin(G.t * 8) * 0.12); g.translate(-G.cx, -gy - Math.abs(Math.sin(G.t * 8)) * G.u * 3); }
      for (const k of this.ORDER) { const p = s.parts[k]; const y = this.pos(G, k); if (p) { const pop = k === this.ORDER[s.step - 1] ? 1 + s.snap * 0.6 : 1; g.save(); g.translate(G.cx, y); g.scale(pop, pop); this.part(G, g, k, 0, 0, S, p.col, p.st, d); g.restore(); } else if (k === need) { g.save(); g.globalAlpha = 0.25 + Math.sin(G.t * 5) * 0.1; g.setLineDash([6, 6]); rr(g, G.cx - S * 0.55, y - S * 0.32, S * 1.1, S * 0.64, 8, null, INK, 2); g.restore(); } }
      g.restore();
      if (!d) txt(g, `Next: ${this.LABEL[need]}!`, G.cx, gy - S * 2.3, G.u * 3.4, "#fff", { stroke: INK });
      s.tray.forEach((q, i) => { const p = this.slot(G, i), on = !d && q.kind === need, wg = s.wig === i ? Math.sin(G.t * 40) * 0.12 : 0; g.save(); g.translate(p.x, p.y); g.rotate(wg);
        rr(g, -p.w / 2, -p.w / 2, p.w, p.w, G.u * 2, on ? "#fff7c0" : "#fffaf0", on ? "#e8a400" : INK, on ? 5 : 3); this.part(G, g, q.kind, 0, q.kind === "head" ? p.w * 0.06 : 0, p.w * 0.5, q.col, q.st, false); g.restore(); });
      for (let i = 0; i < Math.min(s.built, 10); i++) E(g, "🤖", G.u * 5 + i * G.u * 5, G.u * 13, G.u * 4.5, Math.sin(G.t * 4 + i) * 0.2);
      txt(g, d ? "🕺 Dance, robot, dance!" : `🔧 Build a bot! · bots built: ${s.built}`, G.cx, G.u * 6, G.u * 3.8, "#fff", { stroke: INK }); },
    hot(G) { const s = G.s; if (s.dance > 0) return { x: G.cx, y: this.gy(G) - this.S(G) }; const i = s.tray.findIndex((q) => q.kind === this.ORDER[s.step]); return this.slot(G, Math.max(0, i)); },
  },
  {
    id: "skatepark", name: "Pizza Skatepark", rar: "ultra", ico: "🛹", unit: "tricks", base: 6, bg: ["#ffd9a8", "#ffefd6"],
    blurb: "Zoom up and down the half-pipe! Tap when the skater flies up in the air to do a TRICK. Land trick after trick for a big combo!",
    ups: [["tap", "Grippy Shoes", "👟"], ["auto", "Skate Squad", "🛼"], ["crit", "Super Spin", "🌀"]],
    win: ["Gnarly! Your first trick!", "The crowd went 'OOOOH!'", "You did a Pepperoni Twist. That's not even a real trick. Yet!", "Your helmet got a sparkly sticker.", "The chickens in the crowd are doing the wave.", "You flew so high a bird gave you a thumbs up.", "There's a trick named after you now: the Emmy Flip!", "Pizza Skatepark gave you a golden board.", "Skate Legend of Pizza Town! Radical!"],
    TRICKS: ["Kickflip!", "Pizza Spin!", "Cheese Grab!", "Pepperoni Twist!", "Chicken Wing!", "360 Pizza Flip!", "Crust Grab!", "Moon Wave!", "Double Dough!"],
    init(G) { Object.assign(G.s, { th: 0, spd: 2.3, air: false, tricked: false, spin: 0, combo: 0, best: 0, auto: false, name: "", nameT: 0, cheer: 0 }); },
    geo(G) { const Wp = Math.min(G.W * 0.36, G.u * 48); return { Wp, yb: G.H * 0.84, D: Math.min(Wp * 0.75, G.H * 0.42) }; },
    sk(G) { const s = G.s, { Wp, yb, D } = this.geo(G), sn = Math.sin(s.th), a = Math.abs(sn), air = a > 0.88 ? (1 - Math.pow((1 - a) / 0.12, 2)) * G.u * 24 : 0; return { x: G.cx + Wp * sn, y: yb - D * sn * sn - air - G.u * 2, ang: Math.atan(-2 * D * sn / Wp), sn }; },
    trick(G) { const s = G.s, k = this.sk(G); s.tricked = true; s.spin = 1; s.name = pick(this.TRICKS); s.nameT = 1.2; G.add(2, k.x, k.y - G.u * 8, { color: "#ffe066" }); SFX.whoosh(); G.tone(600, 0.25, { type: "triangle", vol: 0.1, slideTo: 1200 }); },
    down(G, x, y) { const s = G.s, k = this.sk(G);
      if (s.air && !s.tricked) { this.trick(G); return; }
      if (s.air) { G.add(1, x, y); G.burst(x, y, "✨", 2, { size: 0.6 }); SFX.tap(); return; }
      s.spd = Math.min(3.4, s.spd + 0.12); G.add(1, k.x, k.y - G.u * 6, { color: "#bff7c8" }); SFX.tap(); G.dots(k.x, k.y + G.u * 2, ["#fff", "#ffd23f"], 4); },
    update(G, dt) { const s = G.s; s.spd = Math.max(2.3, s.spd - dt * 0.05); s.th += s.spd * dt * (s.air ? 0.55 : 1); s.nameT = Math.max(0, s.nameT - dt); s.cheer = Math.max(0, s.cheer - dt);
      if (s.spin > 0) s.spin = Math.max(0, s.spin - dt * 2.2);
      const air = Math.abs(Math.sin(s.th)) > 0.88; if (air && !s.air) { s.air = true; s.tricked = false; if (s.auto) { s.auto = false; this.trick(G); G.burst(this.sk(G).x, this.sk(G).y, "🛼", 1, { size: 0.6 }); } }
      else if (!air && s.air) { s.air = false; const k = this.sk(G);
        if (s.tricked) { s.combo++; s.best = Math.max(s.best, s.combo); s.cheer = 0.8; G.add(3 * Math.min(10, s.combo), k.x, k.y - G.u * 10, { color: "#ffd23f" }); SFX.ding(); G.dots(k.x, k.y + G.u * 3, ["#fff", "#ffd23f"], 6);
          if (s.combo % 5 === 0) { G.add(30, G.cx, G.H * 0.3, { color: "#ff5d8f", noCrit: true }); SFX.wow(); G.flash("#fff3b0"); G.float(`🔥 SUPER COMBO ×${s.combo}! 🔥`, G.cx, G.u * 22, "#ff5d8f", 1.3); for (let i = 0; i < 3; i++) G.dots(G.W * (0.2 + i * 0.3), G.H * 0.25, RAINBOW, 14, { speed: 1.4 }); } }
        else s.combo = 0; } },
    autoTick(G) { G.s.auto = true; },
    draw(G, g) { const s = G.s, { Wp, yb, D } = this.geo(G), k = this.sk(G);
      E(g, "☀️", G.W * 0.88, G.H * 0.1, G.u * 9); for (let i = 0; i < 9; i++) { const x = G.W * (0.06 + i * 0.11), e = ["🐔", "🐶", "🐱", "🐰", "🐔", "🐻", "🐸", "🐔", "🐼"][i]; E(g, e, x, G.H * 0.2 - (s.cheer > 0 ? Math.abs(Math.sin(G.t * 14 + i)) * G.u * 3 : Math.abs(Math.sin(G.t * 2 + i)) * G.u * 0.8), G.u * 6); }
      rr(g, -4, G.H * 0.23, G.W + 8, G.u * 3, 0, "#c27a3e", INK, 3);
      g.beginPath(); g.moveTo(-4, yb - D); g.lineTo(G.cx - Wp, yb - D); for (let i = -20; i <= 20; i++) { const xn = i / 20; g.lineTo(G.cx + xn * Wp, yb - D * xn * xn); } g.lineTo(G.W + 4, yb - D); g.lineTo(G.W + 4, G.H + 4); g.lineTo(-4, G.H + 4); g.closePath(); g.fillStyle = "#e0a96d"; g.fill(); g.strokeStyle = INK; g.lineWidth = 4; g.stroke();
      for (let i = 0; i < 5; i++) { g.strokeStyle = "rgba(138,90,42,.35)"; g.lineWidth = 2; g.beginPath(); const xn = (i - 2) / 2.5; g.moveTo(G.cx + xn * Wp, yb - D * xn * xn + 4); g.lineTo(G.cx + xn * Wp, G.H); g.stroke(); }
      for (const sd of [-1, 1]) circ(g, G.cx + sd * Wp, yb - D, G.u * 1.4, "#ccc"); pizza(g, G.cx, yb + G.u * 6, G.u * 5, { peps: 4 });
      if (s.air && !s.tricked) circ(g, k.x, k.y - G.u * 4, G.u * (9 + Math.sin(G.t * 16) * 1), null, "#ffe066", 4);
      g.save(); g.translate(k.x, k.y); g.rotate(k.ang + (1 - s.spin) * Math.PI * 2 * (s.spin > 0 ? 1 : 0) * (k.sn > 0 ? -1 : 1));
      rr(g, -G.u * 6, -G.u * 0.8, G.u * 12, G.u * 1.8, G.u * 0.9, "#ff5d8f", INK, 3); for (const sd of [-1, 1]) circ(g, sd * G.u * 3.8, G.u * 1.6, G.u * 1.1, "#ffe066", INK, 2);
      E(g, "🧒", 0, -G.u * 6, G.u * 9); g.beginPath(); g.arc(0, -G.u * 8, G.u * 3.6, Math.PI * 1.05, Math.PI * 1.95); g.closePath(); g.fillStyle = "#6ec6ff"; g.fill(); g.strokeStyle = INK; g.lineWidth = 3; g.stroke();
      g.restore();
      if (s.nameT > 0) txt(g, s.name, k.x, k.y - G.u * 16, G.u * 4, "#ffe066", { stroke: INK });
      txt(g, s.air && !s.tricked ? "⬆️ TAP for a TRICK!" : `🛹 Combo ×${s.combo} · best ×${s.best}`, G.cx, G.u * 6, G.u * 3.8, "#fff", { stroke: INK }); },
    hot(G) { const k = this.sk(G); return { x: k.x, y: k.y - G.u * 4 }; },
  },
  {
    id: "circus", name: "Pizza Circus", rar: "ultra", ico: "🎪", unit: "juggles", base: 6, bg: ["#ffe6ea", "#ffd0a8"],
    blurb: "Sealy the seal is juggling pizzas! Tap a falling pizza to toss it back up. Keep the juggle going and Bubbles the clown twists balloon animals!",
    ups: [["tap", "Bouncy Gloves", "🧤"], ["auto", "Juggling Monkeys", "🐒"], ["crit", "Big Top Magic", "🎩"]],
    win: ["Ta-daaa! The crowd claps!", "Sealy did a happy flipper clap.", "Bubbles made you a balloon crown.", "The circus is sold out! Everyone wants to see the pizzas.", "Sealy can juggle four pizzas AND balance a ball!", "The ringmaster bowed to YOU.", "The balloon animals started their own parade.", "The circus is touring the whole world!", "Star of the Big Top! Ta-da-da-DAAA!"],
    BCOL: ["#ff5d8f", "#6ec6ff", "#7cffb0", "#ffe066", "#b18cff", "#ffb347"],
    init(G) { Object.assign(G.s, { pz: [this.mk(G, G.cx, G.H * 0.1)], combo: 0, best: 0, total: 0, ba: [], twist: 0, clap: 0, arf: 0 }); },
    mk(G, x, y) { return { x, y, vx: 0, vy: 0, rot: 0, rest: false }; },
    seal(G) { const r = Math.min(G.W * 0.11, G.u * 11); return { x: G.cx, y: G.H * 0.6, r }; },
    floor(G) { return G.H * 0.88; },
    toss(G, p, by) { const s = G.s, sl = this.seal(G), gv = G.H * 1.1, h = Math.max(G.H * 0.12, p.y - G.H * 0.2); p.vy = -Math.sqrt(2 * gv * h); const T = (2 * -p.vy) / gv, tx = sl.x + rnd(-1, 1) * Math.min(G.W * 0.25, G.u * 28); p.vx = (tx - p.x) / T; p.rest = false;
      s.combo++; s.total++; s.best = Math.max(s.best, s.combo); G.add(1 + Math.floor(s.combo / 5), p.x, p.y - G.u * 5, { color: by === "seal" ? "#bfefff" : "#fff" }); SFX.boing();
      if (s.combo % 10 === 0) { s.twist = 1.4; [0, 1, 2, 3].forEach((i) => setTimeout(() => SFX.squeak(), i * 200)); }
      if ((s.combo === 6 && s.pz.length < 2) || (s.combo === 16 && s.pz.length < 3)) { s.pz.push(this.mk(G, rnd(0.3, 0.7) * G.W, -G.u * 5)); G.float("Another pizza! Wheee!", G.cx, G.u * 22, "#fff", 1); } },
    down(G, x, y) { const s = G.s, sl = this.seal(G);
      let best = null, bd = G.u * 11; for (const p of s.pz) { const d = dist(x, y, p.x, p.y); if (d < bd) { bd = d; best = p; } } if (best) { this.toss(G, best); return; }
      for (const b of s.ba) if (dist(x, y, b.x, b.y) < G.u * 7) { b.spin = 1; G.add(5, b.x, b.y, { color: b.c }); SFX.squeak(); G.burst(b.x, b.y, "💖", 2, { size: 0.6, grav: -0.3 }); return; }
      if (dist(x, y, sl.x, sl.y) < sl.r * 1.4) { s.clap = 0.6; G.add(1, x, y); SFX.honk(1.6); G.say(pick(["Arf arf!", "Thank you! Arf!", "Ta-da!"]), sl.x, sl.y - sl.r * 2.3, 1); return; }
      SFX.boop(); },
    update(G, dt) { const s = G.s, sl = this.seal(G), gv = G.H * 1.1, fl = this.floor(G), r = G.u * 6, nose = sl.y - sl.r * 1.75; s.clap = Math.max(0, s.clap - dt);
      for (const p of s.pz) { if (p.rest) continue; const py = p.y; p.vy += gv * dt; p.x += p.vx * dt; p.y += p.vy * dt; p.rot += dt * 4;
        if (p.x < r) { p.x = r; p.vx = Math.abs(p.vx); } if (p.x > G.W - r) { p.x = G.W - r; p.vx = -Math.abs(p.vx); }
        if (p.vy > 0 && py < nose && p.y >= nose && Math.abs(p.x - sl.x) < sl.r * 0.45) { p.y = nose; this.toss(G, p, "seal"); s.arf = 0.4; G.float("Nose bounce!", sl.x, nose - G.u * 6, "#bfefff", 0.8); continue; }
        if (p.y >= fl - r * 0.4) { p.y = fl - r * 0.4; p.rest = true; p.vx = p.vy = 0; if (s.combo >= 3) G.float("Soft landing! Toss it again!", p.x, fl - G.u * 8, "#fff", 0.8); s.combo = 0; SFX.boop(); } }
      if (s.twist > 0 && (s.twist -= dt) <= 0) { const c = pick(this.BCOL); s.ba.push({ x: G.W * 0.15, y: G.H * 0.5, c, spin: 0, k: s.ba.length }); if (s.ba.length > 6) s.ba.shift(); s.ba.forEach((b, i) => (b.k = i)); G.add(15, G.W * 0.15, G.H * 0.45, { color: "#ffd23f", noCrit: true }); SFX.win(); G.float("🎈 A balloon doggy! 🎈", G.cx, G.u * 22, "#ff5d8f", 1.1); }
      s.ba.forEach((b, i) => { const tx = G.W * (0.5 + (i - (s.ba.length - 1) / 2) * 0.13), ty = G.H * 0.2; b.x += (tx - b.x) * Math.min(1, dt * 3); b.y += (ty - b.y) * Math.min(1, dt * 3); b.spin = Math.max(0, b.spin - dt * 1.5); }); s.arf = Math.max(0, s.arf - dt); },
    autoTick(G) { const s = G.s; let p = null; for (const q of s.pz) if (!p || q.y > p.y) p = q; if (p) { this.toss(G, p); G.burst(p.x, p.y, "🐒", 1, { size: 0.6 }); } },
    dog(G, g, x, y, c, sz, rot) { g.save(); g.translate(x, y); g.rotate(rot); for (const [dx, dy, rx, ry] of [[-0.5, 0.6, 0.12, 0.3], [0.3, 0.6, 0.12, 0.3], [-0.1, 0.15, 0.5, 0.2], [0.55, -0.25, 0.2, 0.22], [0.48, -0.55, 0.08, 0.2], [0.7, -0.5, 0.08, 0.2], [-0.65, -0.05, 0.08, 0.2]]) oval(g, dx * sz, dy * sz, rx * sz, ry * sz, c, INK, 2); circ(g, 0.55 * sz - sz * 0.05, -0.3 * sz, sz * 0.03, INK, null); circ(g, 0.25 * sz, -0.05 * sz, sz * 0.06, "rgba(255,255,255,.7)", null); g.restore(); },
    draw(G, g) { const s = G.s, sl = this.seal(G), fl = this.floor(G), R = sl.r;
      for (let i = 0; i < 10; i++) { g.fillStyle = i % 2 ? "#ff6b6b" : "#fffaf0"; g.beginPath(); g.moveTo(G.cx, -G.H * 0.05); g.lineTo(G.W * (i / 10), G.H * 0.1); g.lineTo(G.W * ((i + 1) / 10), G.H * 0.1); g.closePath(); g.fill(); } g.strokeStyle = INK; g.lineWidth = 3; g.beginPath(); g.moveTo(0, G.H * 0.1); g.lineTo(G.W, G.H * 0.1); g.stroke();
      oval(g, G.cx, fl + G.u * 3, G.W * 0.48, G.u * 7, "#c2263a", INK, 3); oval(g, G.cx, fl + G.u * 3, G.W * 0.44, G.u * 5, "#ffd98a", null);
      const by = sl.y + R * 1.25; g.save(); g.translate(sl.x, by); g.rotate(G.t * 2); circ(g, 0, 0, R * 0.75, "#fff"); for (let i = 0; i < 3; i++) { g.beginPath(); g.moveTo(0, 0); g.arc(0, 0, R * 0.75, i * 2.1, i * 2.1 + 0.9); g.closePath(); g.fillStyle = ["#ff5d8f", "#6ec6ff", "#ffe066"][i]; g.fill(); } circ(g, 0, 0, R * 0.75, null); g.restore();
      const sw = Math.sin(G.t * 3) * 0.06; g.save(); g.translate(sl.x, sl.y + R * 0.5); g.rotate(sw); oval(g, 0, -R * 0.4, R * 0.65, R * 1.0, "#7d8ca3", INK, 4); oval(g, 0, -R * 0.2, R * 0.4, R * 0.65, "#b9c6d8", null);
      for (const sd of [-1, 1]) oval(g, sd * R * 0.7, -R * 0.3, R * 0.18, R * 0.4, "#6a7890", INK, 3, sd * (s.clap > 0 ? -0.9 + Math.sin(G.t * 30) * 0.5 : -0.4));
      circ(g, 0, -R * 1.45, R * 0.5, "#7d8ca3", INK, 4); face(g, 0, -R * 1.45, R * 0.42, s.clap > 0 || s.arf > 0 ? "joy" : "happy"); circ(g, 0, -R * 1.42, R * 0.08, INK, null); g.restore();
      const cx = G.W * 0.13, cy = G.H * 0.62, cR = Math.min(G.W * 0.08, G.u * 8);
      rr(g, cx - cR * 0.7, cy + cR * 0.6, cR * 1.4, cR * 1.8, cR * 0.4, "#7cffb0", INK, 3); for (let i = 0; i < 3; i++) circ(g, cx, cy + cR * (0.95 + i * 0.4), cR * 0.1, "#ff5d8f", null);
      for (let i = 0; i < 6; i++) circ(g, cx + Math.cos(Math.PI + i * 0.63) * cR * 0.95, cy - cR * 0.1 + Math.sin(Math.PI + i * 0.63) * cR * 0.5, cR * 0.35, RAINBOW[i], INK, 2);
      circ(g, cx, cy, cR, "#fff0e0"); face(g, cx, cy, cR * 0.8, s.twist > 0 ? "joy" : "happy"); circ(g, cx, cy + cR * 0.05, cR * 0.18, "#ff3b3b"); E(g, "🎩", cx, cy - cR * 1.1, cR * 1);
      if (s.twist > 0) { const t = s.twist; g.save(); g.translate(cx + cR * 1.3, cy); g.rotate(Math.sin(t * 25) * 0.5); oval(g, 0, 0, cR * 0.7, cR * 0.2, pick(this.BCOL), INK, 2); g.restore(); E(g, "✨", cx + cR * 1.3, cy - cR * 0.6, cR * 0.6); }
      else { g.strokeStyle = INK; g.lineWidth = 1.5; g.beginPath(); g.moveTo(cx + cR * 0.8, cy + cR); g.lineTo(cx + cR * 1.1, cy - cR * 0.7); g.stroke(); oval(g, cx + cR * 1.1, cy - cR * 1.1, cR * 0.32, cR * 0.4, "#ff5d8f", INK, 2); }
      for (const b of s.ba) this.dog(G, g, b.x, b.y + Math.sin(G.t * 2 + b.k) * G.u, b.c, G.u * 6.5, b.spin * Math.PI * 2);
      for (const p of s.pz) pizza(g, p.x, p.y, G.u * 6, { peps: 5, rot: p.rot });
      txt(g, `🎪 Juggle combo ×${s.combo} · best ×${s.best}`, G.cx, G.u * 5, G.u * 3.6, "#fff", { stroke: INK }); },
    hot(G) { let p = null; for (const q of G.s.pz) if (!p || q.y > p.y) p = q; return p ? { x: p.x, y: p.y } : this.seal(G); },
  },
  {
    id: "lighthouse", name: "Lighthouse Keeper", rar: "ultra", ico: "🗼", unit: "boats", base: 6, bg: ["#0e1a3d", "#22406e"], noDots: true,
    blurb: "It's a foggy night! Tap a lost little boat to shine the lighthouse beam on it, and it'll sail safely into the harbour.",
    ups: [["tap", "Brighter Bulb", "💡"], ["auto", "Lighthouse Kitty", "🐈"], ["mult", "Cozy Harbour", "⚓"]],
    win: ["The first boat is home safe! Toot toot!", "The sailors waved their hats at you.", "The fog said 'fine, you win'.", "The harbour cat brought you a fish. Thanks?", "The boats painted 'THANK YOU' on their sails.", "Your lighthouse is the brightest on the whole coast.", "Even the moon is a little jealous.", "The harbour threw a lantern party in your honour.", "Keeper of the Brightest Light! Safe seas forever!"],
    BOATS: ["⛵", "🚤", "🛶", "🛥️", "⛵"],
    init(G) { Object.assign(G.s, { boats: [], ang: -0.2, tgt: null, sp: 0.3, home: 0, fest: 0, twink: 0 }); },
    lamp(G) { return { x: G.W * 0.14, y: G.H * 0.4 }; },
    dock(G) { return { x: G.W * 0.84, y: G.H * 0.86 }; },
    aim(G, b, auto) { const s = G.s; s.tgt = b; b.aimed = true; G.add(1, b.x, b.y - G.u * 5); SFX.tap(); if (auto) G.burst(this.lamp(G).x, this.lamp(G).y, "🐈", 1, { size: 0.5 }); },
    down(G, x, y) { const s = G.s, L = this.lamp(G);
      const b = s.boats.find((q) => !q.go && dist(x, y, q.x, q.y) < G.u * 10); if (b) { this.aim(G, b); return; }
      if (dist(x, y, L.x, L.y + G.u * 10) < G.u * 12) { s.twink = 0.5; G.add(1, x, y, { color: "#ffe066" }); SFX.sparkle(); G.burst(L.x, L.y, "✨", 3, { size: 0.6 }); return; }
      s.tgt = { x, y, fake: true }; SFX.boop(); },
    update(G, dt) { const s = G.s, L = this.lamp(G), D = this.dock(G); s.twink = Math.max(0, s.twink - dt); s.fest = Math.max(0, s.fest - dt);
      if ((s.sp -= dt) <= 0 && s.boats.filter((b) => !b.go).length < 4) { s.sp = s.fest > 0 ? 0.8 : 1.8; s.boats.push({ x: rnd(0.4, 0.9) * G.W, y: rnd(0.3, 0.62) * G.H, e: pick(this.BOATS), vx: rnd(-1, 1) * G.u * 2, ph: rnd(0, 6), lit: 0, go: 0, fade: 0 }); }
      let ta = -0.2 + Math.sin(G.t * 0.6) * 0.45; if (s.tgt) { ta = Math.atan2(s.tgt.y - L.y, s.tgt.x - L.x); if (s.tgt.fake && Math.abs(ta - s.ang) < 0.05) s.tgt = null; }
      s.ang += clamp(ta - s.ang, -dt * 3, dt * 3);
      for (let i = s.boats.length - 1; i >= 0; i--) { const b = s.boats[i]; b.ph += dt; b.fade = Math.min(1, b.fade + dt * 1.5);
        if (b.go) { b.go += dt * 0.4; const t = Math.min(1, b.go), e = t * t * (3 - 2 * t); b.x = b.sx + (D.x - b.sx) * e; b.y = b.sy + (D.y - b.sy) * e;
          if (t >= 1) { s.boats.splice(i, 1); s.home++; G.add(s.fest > 0 ? 20 : 10, D.x, D.y - G.u * 8, { color: "#ffe066" }); SFX.coin(); G.burst(D.x, D.y - G.u * 4, ["✨", "⚓", "💖"], 5, { size: 0.7 });
            if (s.home % 5 === 0) { s.fest = 6; G.add(30, G.cx, G.cy, { color: "#ffd23f", noCrit: true }); SFX.wow(); G.float("🏮 LANTERN PARTY! 🏮", G.cx, G.u * 22, "#ffe066", 1.3); } } continue; }
        b.x += b.vx * dt; if (b.x < G.W * 0.35 || b.x > G.W * 0.94) b.vx *= -1;
        const ba = Math.atan2(b.y - L.y, b.x - L.x); if (Math.abs(ba - s.ang) < 0.09) { b.lit += dt; if (b.lit > 0.4) { b.go = 0.001; b.sx = b.x; b.sy = b.y; if (s.tgt === b) s.tgt = null; SFX.ding(); G.say(pick(["I can see! Thank you!", "Home we go!", "Hooray, a light!"]), b.x, b.y - G.u * 6, 1.2); } } else b.lit = Math.max(0, b.lit - dt * 0.5); }
      if (s.tgt && !s.tgt.fake && (s.tgt.go || !s.boats.includes(s.tgt))) s.tgt = null;
      if (s.fest > 0 && Math.random() < dt * 3) G.dots(rnd(0.5, 0.95) * G.W, rnd(0.08, 0.25) * G.H, RAINBOW, 14, { speed: 1.2 }); },
    autoTick(G) { const s = G.s; if (s.tgt && !s.tgt.fake) return; const b = s.boats.find((q) => !q.go); if (b) this.aim(G, b, true); },
    draw(G, g) { const s = G.s, L = this.lamp(G), D = this.dock(G), sea = G.H * 0.26, bl = Math.min(G.W, G.H) * 1.6;
      stars(G, g, 40); E(g, "🌙", G.W * 0.85, G.H * 0.1, G.u * 8);
      g.fillStyle = "#16345f"; g.fillRect(0, sea, G.W, G.H - sea); for (let i = 0; i < 6; i++) { g.strokeStyle = "rgba(160,200,255,.25)"; g.lineWidth = 2; g.beginPath(); for (let x = 0; x <= G.W; x += 14) g.lineTo(x, sea + G.u * 3 + i * G.H * 0.12 + Math.sin(x * 0.03 + G.t * 1.5 + i) * G.u * 0.8); g.stroke(); }
      for (let i = 0; i < 5; i++) { g.globalAlpha = 0.12; cloud(g, ((i * 0.27 + G.t * 0.01) % 1.2) * G.W, G.H * (0.35 + (i % 3) * 0.1), G.u * 9, "#dfe8ff"); } g.globalAlpha = 1;
      g.save(); const gr = g.createRadialGradient(L.x, L.y, 0, L.x, L.y, bl); gr.addColorStop(0, "rgba(255,240,150,.55)"); gr.addColorStop(1, "rgba(255,240,150,0)"); g.fillStyle = gr; g.beginPath(); g.moveTo(L.x, L.y); g.lineTo(L.x + Math.cos(s.ang - 0.1) * bl, L.y + Math.sin(s.ang - 0.1) * bl); g.lineTo(L.x + Math.cos(s.ang + 0.1) * bl, L.y + Math.sin(s.ang + 0.1) * bl); g.closePath(); g.fill(); g.restore();
      rr(g, D.x - G.W * 0.13, D.y - G.u * 1, G.W * 0.26, G.u * 3, 2, "#8a5a2a", INK, 2); for (let i = 0; i < 3; i++) { const hx = D.x + (i - 1) * G.W * 0.07; rr(g, hx - G.u * 3, D.y - G.u * 8, G.u * 6, G.u * 6, 2, ["#ff9e7a", "#ffd98a", "#9ad7ff"][i], INK, 2); circ(g, hx, D.y - G.u * 5, G.u * 1.2, s.fest > 0 || Math.sin(G.t * 2 + i) > -0.5 ? "#ffe066" : "#665", null); }
      oval(g, L.x, G.H * 0.9, G.W * 0.13, G.u * 5, "#555a66", INK, 3); const tw = G.u * 5; g.beginPath(); g.moveTo(L.x - tw, G.H * 0.88); g.lineTo(L.x - tw * 0.65, L.y + G.u * 3); g.lineTo(L.x + tw * 0.65, L.y + G.u * 3); g.lineTo(L.x + tw, G.H * 0.88); g.closePath(); g.save(); g.clip(); for (let i = 0; i < 8; i++) { g.fillStyle = i % 2 ? "#fff" : "#e8322a"; g.fillRect(L.x - tw, L.y + G.u * 3 + i * (G.H * 0.88 - L.y) / 7, tw * 2, (G.H * 0.88 - L.y) / 7 + 1); } g.restore(); g.strokeStyle = INK; g.lineWidth = 3; g.stroke();
      rr(g, L.x - tw * 0.8, L.y - G.u * 3, tw * 1.6, G.u * 6, 3, "#ffe066", INK, 3); circ(g, L.x, L.y, G.u * (2 + s.twink * 3), "#fff", null); g.beginPath(); g.moveTo(L.x - tw * 0.9, L.y - G.u * 3); g.lineTo(L.x, L.y - G.u * 8); g.lineTo(L.x + tw * 0.9, L.y - G.u * 3); g.closePath(); g.fillStyle = "#e8322a"; g.fill(); g.stroke();
      for (const b of s.boats) { const lit = b.go || b.lit > 0, y = b.y + Math.sin(b.ph * 2) * G.u * 0.8, sc = b.go ? 1 - Math.min(1, b.go) * 0.3 : 1; g.save(); g.globalAlpha = b.fade * (lit ? 1 : 0.6); if (lit) circ(g, b.x, y, G.u * 6, "rgba(255,240,150,.3)", null); E(g, b.e, b.x, y, G.u * 9 * sc, Math.sin(b.ph * 2) * 0.08, 1, b.go ? -1 : 1, 1); g.restore();
        if (!b.go) { if (b === s.tgt) circ(g, b.x, y, G.u * 7, null, "#ffe066", 3); else E(g, "❓", b.x + G.u * 4, y - G.u * 6, G.u * 4, 0, 0.8 + Math.sin(G.t * 4 + b.ph) * 0.2); } }
      txt(g, s.fest > 0 ? `🏮 Lantern party! Double boats! ${Math.ceil(s.fest)}s` : `🗼 Boats home safe: ${s.home}`, G.cx, G.u * 6, G.u * 3.8, "#fff", { stroke: INK }); },
    hot(G) { const s = G.s, b = s.boats.find((q) => !q.go && q !== s.tgt && q.fade > 0.5) || s.boats.find((q) => !q.go); if (b) return { x: b.x, y: b.y }; const L = this.lamp(G); return { x: L.x, y: L.y + G.u * 8 }; },
  },
  {
    id: "weather", name: "Weather Wizard", rar: "ultra", ico: "🌦️", unit: "spells", base: 6, bg: ["#bfe6ff", "#e8f7ff"], noDots: true,
    blurb: "You're the Weather Wizard! Each plant shows what it needs — tap SUN, RAIN or WIND to make it grow. Rain and THEN sun makes a RAINBOW! Tap giant veggies to pick them.",
    ups: [["tap", "Bigger Wand", "🪄"], ["auto", "Cloud Buddy", "☁️"], ["mult", "Magic Compost", "🪱"]],
    win: ["Your first giant veggie! It's HUGE!", "The scarecrow gave you a thumbs up.", "Your carrots are taller than you now.", "The farmers' market wants ALL your veggies.", "You made a rainbow so big it has a rainbow.", "The bunnies wrote you a thank-you poem.", "Your pumpkin won a blue ribbon. And a gold one.", "Clouds now ask YOU for the weather report.", "Grand Weather Wizard of the Whole Wide Sky!"],
    W3: ["sun", "rain", "wind"], ICO: { sun: "☀️", rain: "🌧️", wind: "💨" }, BCOL: { sun: "#ffe066", rain: "#9ad7ff", wind: "#d9f7e8" }, VEG: ["🥕", "🎃", "🍅", "🥦", "🌽", "🍆", "🥒", "🫑", "🍉"],
    init(G) { Object.assign(G.s, { pl: Array.from({ length: 5 }, () => this.seed()), fx: { sun: 0, rain: 0, wind: 0 }, last: null, lastT: 0, rb: 0, picked: 0, grow: [0, 0, 0, 0, 0] }); },
    seed() { return { v: pick(this.VEG), st: 0, need: pick(this.W3) }; },
    pp(G, i) { return { x: G.W * (0.12 + 0.19 * i), y: G.H * 0.82 }; },
    wb(G, i) { const r = Math.min(G.W * 0.09, G.u * 8.5); return { x: G.cx + (i - 1) * r * 2.7, y: G.H * 0.22, r }; },
    growOne(G, i, n) { const s = G.s, p = s.pl[i], q = this.pp(G, i); if (p.st >= 4) return; p.st++; p.need = pick(this.W3); s.grow[i] = 0.4; G.add(n, q.x, q.y - G.u * (6 + p.st * 4), { color: "#bff7c8" }); if (p.st === 4) { SFX.sparkle(); G.burst(q.x, q.y - G.u * 10, "✨", 4, { size: 0.7 }); } },
    cast(G, w, auto) { const s = G.s, b = this.wb(G, this.W3.indexOf(w)); s.fx[w] = 1.4; let grew = 0;
      s.pl.forEach((p, i) => { if (p.st < 4 && p.need === w) { this.growOne(G, i, 1); grew++; } }); if (!grew) G.add(1, b.x, b.y + b.r);
      if (w === "sun") G.tone(660, 0.3, { type: "triangle", vol: 0.12, slideTo: 990 }); else if (w === "rain") { SFX.fizz(); } else SFX.whoosh();
      if (s.lastT > 0 && s.rb <= 0 && w === "sun" && s.last === "rain") { s.rb = 3; s.last = null; s.lastT = 0; G.add(10, G.cx, G.H * 0.55, { color: "#ffd23f", noCrit: true }); SFX.wow(); G.float("🌈 RAINBOW! Everything grows! 🌈", G.cx, G.H * 0.55, "#ff5d8f", 1.1); s.pl.forEach((p, i) => this.growOne(G, i, 1)); }
      else { s.last = w; s.lastT = 2.5; }
      if (auto) G.burst(b.x, b.y, "☁️", 1, { size: 0.6 }); },
    pick(G, i) { const s = G.s, p = s.pl[i], q = this.pp(G, i); G.add(8, q.x, q.y - G.u * 18, { color: "#ffd23f" }); SFX.cash(); G.burst(q.x, q.y - G.u * 12, [p.v, "✨", "💚"], 8); s.picked++; s.pl[i] = this.seed();
      if (s.picked % 5 === 0) { G.add(25, G.cx, G.cy, { color: "#ffd23f", noCrit: true }); SFX.win(); G.float("🏅 BLUE RIBBON VEGGIES! 🏅", G.cx, G.u * 22, "#6ec6ff", 1.2); } },
    down(G, x, y) { const s = G.s;
      for (let i = 0; i < 3; i++) { const b = this.wb(G, i); if (dist(x, y, b.x, b.y) < b.r * 1.2) { this.cast(G, this.W3[i]); return; } }
      for (let i = 0; i < 5; i++) { const q = this.pp(G, i); if (s.pl[i].st >= 4 && Math.abs(x - q.x) < G.u * 10 && y > q.y - G.u * 26 && y < q.y + G.u * 5) { this.pick(G, i); return; } }
      for (let i = 0; i < 5; i++) { const q = this.pp(G, i); if (Math.abs(x - q.x) < G.u * 8 && y > q.y - G.u * 30 && y < q.y + G.u * 5) { G.say(`I need ${s.pl[i].need.toUpperCase()}!`, q.x, q.y - G.u * 30, 1); SFX.tap(); return; } }
      SFX.boop(); },
    update(G, dt) { const s = G.s; for (const k of this.W3) s.fx[k] = Math.max(0, s.fx[k] - dt); s.rb = Math.max(0, s.rb - dt); s.lastT = Math.max(0, s.lastT - dt); for (let i = 0; i < 5; i++) s.grow[i] = Math.max(0, s.grow[i] - dt);
      if (s.fx.rain > 0) for (let i = 0; i < 3; i++) G.parts.push({ x: rnd(0, G.W), y: G.H * 0.48, vx: 0, vy: G.u * 50, life: 0.6, max: 0.6, c: "#5aaef0", size: G.u * 0.7, grav: 1 }); },
    autoTick(G) { const s = G.s, i = s.pl.findIndex((p) => p.st >= 4); if (i >= 0) { this.pick(G, i); return; } const c = { sun: 0, rain: 0, wind: 0 }; s.pl.forEach((p) => p.st < 4 && c[p.need]++); this.cast(G, this.W3.reduce((a, b) => (c[b] > c[a] ? b : a)), true); },
    draw(G, g) { const s = G.s, gy = G.H * 0.82, wind = s.fx.wind > 0 ? Math.sin(G.t * 12) * 0.25 * s.fx.wind : Math.sin(G.t * 1.5) * 0.04;
      if (s.fx.sun > 0) { g.fillStyle = `rgba(255,220,100,${s.fx.sun * 0.2})`; g.fillRect(0, 0, G.W, G.H); }
      g.save(); g.translate(G.W * 0.88, G.H * 0.1); g.rotate(G.t * (s.fx.sun > 0 ? 2 : 0.2)); for (let i = 0; i < 10; i++) { g.rotate(Math.PI / 5); g.fillStyle = "#ffd23f"; g.beginPath(); g.moveTo(-G.u, -G.u * 6); g.lineTo(0, -G.u * (8 + s.fx.sun * 4)); g.lineTo(G.u, -G.u * 6); g.fill(); } g.restore(); circ(g, G.W * 0.88, G.H * 0.1, G.u * 5.5, "#ffe066"); face(g, G.W * 0.88, G.H * 0.1, G.u * 3.5, s.fx.sun > 0 ? "joy" : "happy");
      if (s.rb > 0) for (let i = 0; i < 6; i++) { g.beginPath(); g.arc(G.cx, G.H * 0.85, G.W * 0.48 - i * G.u * 2.5, Math.PI, 0); g.strokeStyle = RAINBOW[i]; g.lineWidth = G.u * 2.5; g.globalAlpha = Math.min(1, s.rb) * 0.75; g.stroke(); } g.globalAlpha = 1;
      if (s.fx.rain > 0) { g.globalAlpha = Math.min(1, s.fx.rain * 2); for (let i = 0; i < 4; i++) cloud(g, G.W * (0.14 + i * 0.24), G.H * 0.45, G.u * 6, "#c9d3e0", "rgba(74,42,26,.4)"); g.globalAlpha = 1; }
      if (s.fx.wind > 0) for (let i = 0; i < 5; i++) E(g, "💨", ((G.t * 0.6 + i * 0.23) % 1.1) * G.W, G.H * (0.45 + (i % 3) * 0.08), G.u * 6, 0, s.fx.wind);
      g.fillStyle = "#7fd36b"; g.fillRect(0, gy - G.u * 2, G.W, G.H); g.fillStyle = "#8a5a2a"; g.fillRect(0, gy + G.u * 2, G.W, G.H); g.strokeStyle = INK; g.lineWidth = 3; g.beginPath(); g.moveTo(0, gy - G.u * 2); g.lineTo(G.W, gy - G.u * 2); g.stroke();
      s.pl.forEach((p, i) => { const q = this.pp(G, i), sc = 1 + s.grow[i] * 0.6; g.save(); g.translate(q.x, q.y); g.rotate(wind * (0.5 + p.st * 0.15)); g.scale(sc, sc);
        oval(g, 0, G.u * 1, G.u * 6, G.u * 2, "#6b4320", INK, 2);
        if (p.st === 0) circ(g, 0, -G.u * 0.5, G.u * 1, "#c98a4b", INK, 2); else if (p.st === 1) E(g, "🌱", 0, -G.u * 3, G.u * 6); else if (p.st === 2) E(g, "🌿", 0, -G.u * 5, G.u * 9);
        else if (p.st === 3) { E(g, "🌿", 0, -G.u * 4, G.u * 8); E(g, p.v, 0, -G.u * 9, G.u * 7); } else { E(g, "🌿", 0, -G.u * 4, G.u * 9); E(g, p.v, 0, -G.u * 13, G.u * 18, Math.sin(G.t * 4 + i) * 0.1); }
        g.restore();
        if (p.st < 4) { const by = q.y - G.u * (12 + p.st * 4.5) + Math.sin(G.t * 3 + i) * G.u * 0.6; circ(g, q.x, by, G.u * 4, "#fffaf0", INK, 2); E(g, this.ICO[p.need], q.x, by, G.u * 5); }
        else txt(g, "Pick me!", q.x, q.y + G.u * 6, G.u * 2.8, "#fff", { stroke: INK }); });
      E(g, "🧙", G.u * 7, G.H * 0.22, G.u * 10, Math.sin(G.t * 3) * 0.1);
      this.W3.forEach((w, i) => { const b = this.wb(G, i), on = s.fx[w] > 0; circ(g, b.x, b.y, b.r * (on ? 1.1 : 1), this.BCOL[w], INK, 4); E(g, this.ICO[w], b.x, b.y - b.r * 0.1, b.r * 1.1); txt(g, w.toUpperCase(), b.x, b.y + b.r * 1.3, G.u * 2.6, "#fff", { stroke: INK }); });
      txt(g, `🪄 Make the weather! · veggies picked: ${s.picked}`, G.cx, G.u * 6, G.u * 3.6, "#fff", { stroke: INK }); },
    hot(G) { const s = G.s, i = s.pl.findIndex((p) => p.st >= 4); if (i >= 0) { const q = this.pp(G, i); return { x: q.x, y: q.y - G.u * 12 }; } const c = { sun: 0, rain: 0, wind: 0 }; s.pl.forEach((p) => p.st < 4 && c[p.need]++); const w = this.W3.reduce((a, b) => (c[b] > c[a] ? b : a)); return this.wb(G, this.W3.indexOf(w)); },
  },
];
