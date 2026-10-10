// ==========================================================================
//  Emmy's Pizza Plus — every sound is generated with Web Audio (no files).
//  Shares the "emmy.muted" flag with the other games.
// ==========================================================================
let audioCtx = null, noiseBuf = null;
export const audio = { muted: localStorage.getItem("emmy.muted") === "1" };
export function ac() { if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)(); if (audioCtx.state === "suspended") audioCtx.resume(); return audioCtx; }
export function setMuted(v) { audio.muted = v; localStorage.setItem("emmy.muted", v ? "1" : "0"); }
export function tone(freq, dur = 0.12, { type = "sine", vol = 0.18, when = 0, slideTo = null, attack = 0.01 } = {}) {
  if (audio.muted) return;
  try { const ctx = ac(), t0 = ctx.currentTime + when, o = ctx.createOscillator(), g = ctx.createGain(); o.type = type; o.frequency.setValueAtTime(Math.max(20, freq), t0); if (slideTo) o.frequency.exponentialRampToValueAtTime(Math.max(20, slideTo), t0 + dur);
    g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(vol, t0 + attack); g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur); o.connect(g).connect(ctx.destination); o.start(t0); o.stop(t0 + dur + 0.02); } catch {}
}
export function noise(dur, { vol = 0.2, f0 = 800, f1 = 300, q = 1, type = "lowpass", when = 0, attack = 0.02 } = {}) {
  if (audio.muted) return;
  try { const ctx = ac(); if (!noiseBuf) { noiseBuf = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate); const d = noiseBuf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1; }
    const t0 = ctx.currentTime + when, src = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain(); src.buffer = noiseBuf; f.type = type; f.Q.value = q; f.frequency.setValueAtTime(f0, t0); f.frequency.exponentialRampToValueAtTime(Math.max(30, f1), t0 + dur);
    g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(vol, t0 + attack); g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur); src.connect(f).connect(g).connect(ctx.destination); src.start(t0, Math.random()); src.stop(t0 + dur + 0.05); } catch {}
}
const r = (a, b) => a + Math.random() * (b - a);
export const SFX = {
  tap: () => tone(560, 0.07, { type: "triangle", vol: 0.14 }),
  pop: (p = 1) => { tone(380 * p, 0.09, { vol: 0.22, slideTo: 900 * p }); noise(0.07, { vol: 0.1, f0: 2500, f1: 900, type: "bandpass" }); },
  boop: () => tone(300, 0.1, { type: "sine", vol: 0.12, slideTo: 200 }),
  coin: () => { tone(988, 0.06, { type: "square", vol: 0.07 }); tone(1319, 0.12, { type: "square", vol: 0.07, when: 0.06 }); },
  buy: () => { tone(880, 0.08, { type: "square", vol: 0.1 }); tone(1320, 0.1, { type: "square", vol: 0.1, when: 0.07 }); },
  ding: () => { tone(880, 0.1, { type: "triangle", vol: 0.16 }); tone(1320, 0.14, { type: "triangle", vol: 0.16, when: 0.08 }); },
  win: () => [523, 659, 784, 1047, 1319].forEach((f, i) => tone(f, 0.2, { type: "triangle", vol: 0.17, when: i * 0.08 })),
  wow: () => { [523, 659, 784, 1047, 1319, 1568, 2093].forEach((f, i) => tone(f, 0.25, { type: "triangle", vol: 0.17, when: i * 0.07 })); noise(1.2, { vol: 0.07, f0: 6000, f1: 2000, type: "highpass", when: 0.2 }); },
  error: () => tone(170, 0.16, { type: "square", vol: 0.09 }),
  cash: () => [784, 988, 1175, 1568].forEach((f, i) => tone(f, 0.1, { type: "square", vol: 0.07, when: i * 0.06 })),
  boing: () => tone(190, 0.32, { type: "sine", vol: 0.2, slideTo: 620 }),
  bonk: () => { tone(220, 0.12, { type: "square", vol: 0.12, slideTo: 90 }); noise(0.08, { vol: 0.2, f0: 1500, f1: 300 }); },
  honk: (p = 1) => { tone(330 * p, 0.22, { type: "square", vol: 0.1, slideTo: 300 * p }); tone(415 * p, 0.22, { type: "sawtooth", vol: 0.06 }); },
  splat: () => { noise(0.3, { vol: 0.3, f0: 900, f1: 120, q: 2 }); tone(160, 0.2, { vol: 0.1, slideTo: 60 }); },
  whoosh: () => noise(0.45, { vol: 0.16, f0: 3000, f1: 500, type: "bandpass", q: 0.8 }),
  scrape: () => noise(0.09, { vol: 0.12, f0: 4000, f1: 2500, type: "bandpass", q: 3 }),
  burp: () => { tone(r(90, 120), 0.6, { type: "sawtooth", vol: 0.15, slideTo: 60 }); noise(0.6, { vol: 0.12, f0: 400, f1: 120, q: 4 }); },
  squeak: () => tone(r(900, 1300), 0.12, { type: "square", vol: 0.06, slideTo: r(1400, 1900) }),
  squawk: () => { tone(r(700, 900), 0.15, { type: "sawtooth", vol: 0.1, slideTo: 500 }); tone(r(900, 1100), 0.12, { type: "square", vol: 0.05, when: 0.12, slideTo: 600 }); },
  sizzle: () => noise(0.5, { vol: 0.1, f0: 7000, f1: 4000, type: "highpass" }),
  rumble: () => { noise(0.5, { vol: 0.22, f0: 300, f1: 60, q: 1 }); tone(60, 0.5, { type: "sine", vol: 0.15, slideTo: 40 }); },
  boom: () => { noise(1.0, { vol: 0.35, f0: 1200, f1: 60, q: 0.7 }); tone(110, 0.8, { type: "sine", vol: 0.2, slideTo: 40 }); },
  laser: () => tone(1600, 0.25, { type: "sawtooth", vol: 0.06, slideTo: 300 }),
  sparkle: () => [1568, 2093, 2637].forEach((f, i) => tone(f, 0.12, { type: "triangle", vol: 0.07, when: i * 0.05 })),
  meow: () => { tone(700, 0.35, { type: "triangle", vol: 0.12, slideTo: 450 }); tone(1400, 0.3, { type: "sine", vol: 0.04, slideTo: 900 }); },
  purr: () => { for (let i = 0; i < 4; i++) tone(55, 0.07, { type: "sawtooth", vol: 0.05, when: i * 0.08 }); },
  beep: (n = 0) => tone([660, 880, 990, 1175, 523][n % 5], 0.1, { type: "square", vol: 0.08 }),
  giggle: () => [900, 1100, 950, 1200].forEach((f, i) => tone(f, 0.07, { type: "sine", vol: 0.08, when: i * 0.07 })),
  note: (i) => { const f = 392 * Math.pow(2, i / 12); tone(f, 0.3, { type: "triangle", vol: 0.16 }); tone(f * 2, 0.2, { type: "sine", vol: 0.04 }); },
  door: () => { tone(330, 0.12, { type: "triangle", vol: 0.12 }); tone(494, 0.16, { type: "triangle", vol: 0.12, when: 0.1 }); },
  boxTap: (n) => { tone(300 + n * 120, 0.1, { type: "square", vol: 0.08 }); noise(0.12, { vol: 0.12, f0: 2000, f1: 600, type: "bandpass" }); },
  boxOpen: (order) => { noise(0.4, { vol: 0.2, f0: 3000, f1: 800, type: "bandpass" }); const n = 4 + order; for (let i = 0; i < n; i++) tone(523 * Math.pow(2, (i * 4) / 12), 0.2, { type: "triangle", vol: 0.14, when: 0.1 + i * 0.07 }); },
  fizz: () => { for (let i = 0; i < 6; i++) tone(r(1500, 3000), 0.04, { type: "sine", vol: 0.05, when: i * 0.04 }); noise(0.4, { vol: 0.06, f0: 6000, f1: 3000, type: "highpass" }); },
  slurp: () => { tone(300, 0.4, { type: "sawtooth", vol: 0.05, slideTo: 900 }); noise(0.4, { vol: 0.08, f0: 1200, f1: 3000, type: "bandpass", q: 3 }); },
};

// --------------------------------------------------------------------------
//  🎵 Music — a bouncy little tarantella-ish loop in 6/8
// --------------------------------------------------------------------------
const MEL = [7, 9, 7, 5, 4, 5, 7, -1, 0, 4, 7, 12, 11, 9, 7, -1, 5, 7, 5, 4, 2, 4, 5, -1, 2, 5, 9, 7, 5, 2, 0, -1];
const BASS = [0, 0, 7, 7, 5, 5, 7, 7];
let musicTimer = 0, musicStep = 0, musicNext = 0;
export const music = { on: localStorage.getItem("emmy.pizza.music") !== "0", quiet: false };
function musicTick() {
  if (!music.on || audio.muted) return; const ctx = ac(), beat = 60 / 150 / 1.5;
  if (musicNext < ctx.currentTime) musicNext = ctx.currentTime + 0.05;
  while (musicNext < ctx.currentTime + 0.3) {
    const when = musicNext - ctx.currentTime, n = MEL[musicStep % MEL.length], v = music.quiet ? 0.4 : 1;
    if (n >= 0) tone(523 * Math.pow(2, n / 12), beat * 1.3, { type: "triangle", vol: 0.028 * v, when });
    if (musicStep % 3 === 0) tone(131 * Math.pow(2, BASS[Math.floor(musicStep / 3) % BASS.length] / 12), beat * 2, { type: "sine", vol: 0.05 * v, when });
    if (musicStep % 3 === 2) noise(0.03, { vol: 0.012 * v, f0: 8000, f1: 5000, type: "highpass", when });
    musicStep++; musicNext += beat;
  }
}
export function startMusic() { if (!musicTimer) musicTimer = setInterval(musicTick, 120); }
export function setMusic(on) { music.on = on; localStorage.setItem("emmy.pizza.music", on ? "1" : "0"); }
