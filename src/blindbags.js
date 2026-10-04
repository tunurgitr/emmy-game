// ==========================================================================
//  Emmy's Blind Bag Town — hub. Walk round town (third-person), visit the
//  silly shops, buy blind bags, tear them open, collect every toy (and every
//  secret chicken), give Glow-Up Faces a makeover, push stray carts back to
//  the corral, and have every shopkeeper in town say hi to you BY NAME.
// ==========================================================================
import { createTown } from "./blindbag3d/town.js";
import { createOpen } from "./blindbag3d/open.js";
import { createGlow, STICKERS } from "./blindbag3d/glow.js";
import { createStock } from "./blindbag3d/stock.js";
import { CATALOG, RARITY, RARITY_IDS, SERIES, SERIES_IDS, byId, buildItem, isFace, isChicken, CHICKEN_COLORS } from "./blindbag3d/models.js";
import { THREE, makeKid } from "./arcade3d/lib.js";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";

const $ = (id) => document.getElementById(id);
const pick = (a) => a[Math.floor(Math.random() * a.length)];
const SAVE_KEY = "emmy.blindbag.save.v1", LOOK_KEY = "emmy.blindbag.avatar", VOICE_KEY = "emmy.blindbag.voices", MUSIC_KEY = "emmy.blindbag.music";
const MAX_HENS = 30, START_FOLLOW = 3; // new chickens follow you until 3 are following; after that they move into your chicken yard
const EGG_PRICE = { plain: 4, golden: 25 };

// --------------------------------------------------------------------------
//  Sound — generated with Web Audio (shares the mute flag with the other games)
// --------------------------------------------------------------------------
let audioCtx = null, noiseBuf = null;
let muted = localStorage.getItem("emmy.muted") === "1";
function ac() { if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)(); if (audioCtx.state === "suspended") audioCtx.resume(); return audioCtx; }
function tone(freq, dur = 0.12, { type = "sine", vol = 0.18, when = 0, slideTo = null } = {}) {
  if (muted) return;
  try { const ctx = ac(), t0 = ctx.currentTime + when, o = ctx.createOscillator(), g = ctx.createGain(); o.type = type; o.frequency.setValueAtTime(Math.max(20, freq), t0); if (slideTo) o.frequency.exponentialRampToValueAtTime(Math.max(20, slideTo), t0 + dur);
    g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(vol, t0 + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur); o.connect(g).connect(ctx.destination); o.start(t0); o.stop(t0 + dur + 0.02); } catch {}
}
function noise(dur, { vol = 0.2, f0 = 800, f1 = 300, q = 1, type = "lowpass", when = 0, attack = 0.02 } = {}) {
  if (muted) return;
  try { const ctx = ac(); if (!noiseBuf) { noiseBuf = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate); const d = noiseBuf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1; }
    const t0 = ctx.currentTime + when, src = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain(); src.buffer = noiseBuf; f.type = type; f.Q.value = q; f.frequency.setValueAtTime(f0, t0); f.frequency.exponentialRampToValueAtTime(Math.max(30, f1), t0 + dur);
    g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(vol, t0 + attack); g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur); src.connect(f).connect(g).connect(ctx.destination); src.start(t0, Math.random()); src.stop(t0 + dur + 0.05); } catch {}
}
const SFX = {
  tap: () => tone(520, 0.07, { type: "triangle", vol: 0.14 }),
  crinkle: () => { for (let i = 0; i < 3; i++) noise(0.05, { vol: 0.1, f0: 5000, f1: 2500, type: "bandpass", q: 1.5, when: i * 0.04 }); },
  tear: () => { for (let i = 0; i < 6; i++) noise(0.06, { vol: 0.16, f0: 4200, f1: 1800, type: "bandpass", q: 2, when: i * 0.035 }); tone(500, 0.2, { type: "triangle", vol: 0.08, slideTo: 1200, when: 0.15 }); },
  squish: () => { noise(0.35, { vol: 0.28, f0: 1400, f1: 220, q: 3 }); tone(220, 0.25, { vol: 0.1, slideTo: 110 }); },
  unsquish: () => tone(260, 0.25, { type: "sine", vol: 0.1, slideTo: 520 }),
  pop: () => { tone(420, 0.09, { vol: 0.22, slideTo: 900 }); noise(0.08, { vol: 0.12, f0: 2500, f1: 900, type: "bandpass" }); },
  coin: () => { tone(988, 0.06, { type: "square", vol: 0.08 }); tone(1319, 0.12, { type: "square", vol: 0.08, when: 0.06 }); },
  buy: () => { tone(880, 0.08, { type: "square", vol: 0.1 }); tone(1320, 0.1, { type: "square", vol: 0.1, when: 0.07 }); },
  ding: () => { tone(880, 0.1, { type: "triangle", vol: 0.16 }); tone(1320, 0.14, { type: "triangle", vol: 0.16, when: 0.08 }); },
  win: () => [523, 659, 784, 1047, 1319].forEach((f, i) => tone(f, 0.2, { type: "triangle", vol: 0.18, when: i * 0.08 })),
  wow: () => { [523, 659, 784, 1047, 1319, 1568, 2093].forEach((f, i) => tone(f, 0.25, { type: "triangle", vol: 0.18, when: i * 0.07 })); noise(1.2, { vol: 0.08, f0: 6000, f1: 2000, type: "highpass", when: 0.2 }); },
  error: () => tone(160, 0.15, { type: "square", vol: 0.1 }),
  bawk: () => { const b = 520 + Math.random() * 120; tone(b, 0.07, { type: "square", vol: 0.09, slideTo: b * 1.5 }); tone(b * 1.3, 0.22, { type: "sawtooth", vol: 0.08, when: 0.08, slideTo: b * 0.8 }); tone(b * 1.1, 0.09, { type: "square", vol: 0.06, when: 0.33, slideTo: b * 1.4 }); },
  squeak: () => { tone(900, 0.5, { type: "sawtooth", vol: 0.08, slideTo: 1500 }); tone(1400, 0.4, { type: "square", vol: 0.04, when: 0.1, slideTo: 700 }); }, // rubber chicken!
  sing: () => [659, 784, 988, 784, 1175].forEach((f, i) => tone(f, 0.16, { type: "triangle", vol: 0.12, when: i * 0.12 })),
  cash: () => [784, 988, 1175, 1568].forEach((f, i) => tone(f, 0.1, { type: "square", vol: 0.08, when: i * 0.06 })),
  door: () => { tone(330, 0.12, { type: "triangle", vol: 0.12 }); tone(494, 0.16, { type: "triangle", vol: 0.12, when: 0.1 }); noise(0.25, { vol: 0.05, f0: 1200, f1: 400 }); },
  scrub: () => noise(0.12, { vol: 0.12, f0: 2600, f1: 1400, type: "bandpass", q: 2 }),
  brush: () => noise(0.18, { vol: 0.1, f0: 3500, f1: 6000, type: "highpass", q: 1 }),
  sparkle: () => [1568, 2093, 2637].forEach((f, i) => tone(f, 0.12, { type: "triangle", vol: 0.07, when: i * 0.05 })),
  rattle: () => { for (let i = 0; i < 5; i++) tone(180 + Math.random() * 80, 0.05, { type: "square", vol: 0.05, when: i * 0.05 }); },
  note: (i) => { const f = [523, 659, 784, 1047][i] || 523; tone(f, 0.4, { type: "triangle", vol: 0.18 }); tone(f * 1.5, 0.3, { type: "sine", vol: 0.05, when: 0.02 }); },
  cheer: () => { noise(1.3, { vol: 0.16, f0: 2600, f1: 1200, type: "bandpass", q: 0.6, attack: 0.15 }); [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.18, { type: "triangle", vol: 0.12, when: i * 0.07 })); },
  boing: () => tone(190, 0.32, { type: "sine", vol: 0.2, slideTo: 620 }),
  purr: () => { for (let i = 0; i < 5; i++) tone(58, 0.06, { type: "sawtooth", vol: 0.04, when: i * 0.075 }); },
  munch: () => { for (let i = 0; i < 4; i++) noise(0.06, { vol: 0.14, f0: 1800, f1: 700, type: "bandpass", q: 1.5, when: i * 0.13 }); },
  crack: () => { noise(0.07, { vol: 0.22, f0: 5000, f1: 2000, type: "bandpass", q: 2 }); tone(900, 0.05, { type: "square", vol: 0.05 }); },
  roar: () => { noise(0.6, { vol: 0.22, f0: 900, f1: 200, q: 2 }); tone(330, 0.55, { type: "sawtooth", vol: 0.1, slideTo: 150 }); },
  blub: () => { tone(320, 0.08, { vol: 0.15, slideTo: 760 }); tone(420, 0.08, { vol: 0.12, slideTo: 900, when: 0.1 }); },
  whoosh: () => noise(0.5, { vol: 0.18, f0: 3000, f1: 600, type: "bandpass", q: 0.8 }),
};
function setMuteLabel() { $("mute").textContent = muted ? "🔇" : "🔊"; }
$("mute").onclick = () => { muted = !muted; localStorage.setItem("emmy.muted", muted ? "1" : "0"); setMuteLabel(); if (muted) hush(); else SFX.tap(); };
setMuteLabel();

// --------------------------------------------------------------------------
//  Talking shopkeepers — speech bubbles in town, and real voices (speechSynthesis)
// --------------------------------------------------------------------------
let voicesOn = localStorage.getItem(VOICE_KEY) !== "0";
const canSpeak = "speechSynthesis" in window && typeof SpeechSynthesisUtterance !== "undefined";
// The most human-sounding voices are the "Natural"/"Online" ones (Microsoft Edge), Google's voices (Chrome) and
// "Premium"/"Enhanced" ones (Apple). Rank whatever this browser has, then split them into deeper and higher voices
// so every shopkeeper gets their own.
const MALE = /\b(guy|davis|andrew|brian|christopher|eric|roger|steffan|ryan|william|liam|tony|jason|thomas|connor|mitchell|david|mark|george|daniel|fred|alex|aaron|arthur|oliver|james|male)\b/i;
const voiceScore = (v) => { const n = v.name; let s = 0; if (/natural|neural/i.test(n)) s += 100; if (/online/i.test(n)) s += 40; if (/premium|enhanced|siri/i.test(n)) s += 70; if (/google/i.test(n)) s += 45; if (/en[-_]US/i.test(v.lang)) s += 8; else if (/en[-_](GB|AU|CA|IE|NZ)/i.test(v.lang)) s += 5; if (/desktop|espeak|zira|hazel/i.test(n)) s -= 15; return s; };
let VOICES = { m: [], f: [] };
function rankVoices() {
  if (!canSpeak) return; const vs = speechSynthesis.getVoices().filter((v) => /^en/i.test(v.lang)).sort((a, b) => voiceScore(b) - voiceScore(a)); if (!vs.length) return;
  const good = (list) => { if (!list.length) return []; const top = voiceScore(list[0]); return list.filter((v) => voiceScore(v) >= top - 35); }; // don't mix in robotic voices when nicer ones exist
  VOICES = { m: good(vs.filter((v) => MALE.test(v.name))), f: good(vs.filter((v) => !MALE.test(v.name))) };
  if (!VOICES.m.length) VOICES.m = good(vs); if (!VOICES.f.length) VOICES.f = good(vs);
  // a voice picked in the 🗣️ menu goes first in its list
  for (const g of ["f", "m"]) { const v = vs.find((x) => x.name === voicePref[g]); if (v) VOICES[g] = [v, ...VOICES[g].filter((x) => x !== v)]; }
}
let voicePref = {}; try { voicePref = JSON.parse(localStorage.getItem("emmy.blindbag.voicepref") || "{}"); } catch {}
if (canSpeak) { rankVoices(); speechSynthesis.onvoiceschanged = rankVoices; }
const plain = (s) => s.replace(/[\p{Extended_Pictographic}\u{FE0F}\u{200D}\u{1F3FB}-\u{1F3FF}]/gu, "").replace(/\s+/g, " ").trim();
// who = { g: "m" | "f", n: which voice in that list, pitch, rate } — pitch stays close to 1 so nobody sounds like a robot
function speak(text, { g = "f", n = 0, pitch = 1, rate = 1 } = {}) {
  if (!canSpeak || !voicesOn || muted) return;
  try { speechSynthesis.cancel(); const u = new SpeechSynthesisUtterance(plain(text)); const list = VOICES[g] && VOICES[g].length ? VOICES[g] : VOICES.f; const v = list.length ? list[n % list.length] : null; if (v) { u.voice = v; u.lang = v.lang; }
    // natural voices already sound right; only nudge the plain ones a little
    const natural = v && voiceScore(v) >= 40; u.pitch = natural ? 1 + (pitch - 1) * 0.4 : pitch; u.rate = rate * 0.98; u.volume = 1; speechSynthesis.speak(u); } catch {}
}
function hush() { try { canSpeak && speechSynthesis.cancel(); } catch {} }
function setVoiceLabel() { $("voiceBtn").style.opacity = voicesOn ? 1 : 0.45; $("voiceBtn").title = voicesOn ? "Shopkeepers talk out loud (on)" : "Shopkeepers talk out loud (off)"; }
// the 🗣️ menu: voices on/off, and pick which voices the grown-ups in town use
function openVoices() {
  const all = canSpeak ? speechSynthesis.getVoices() : [], en = all.filter((v) => /^en/i.test(v.lang)), list = (en.length ? en : all).sort((a, b) => voiceScore(b) - voiceScore(a));
  const opts = (g) => list.map((v) => `<option value="${v.name.replace(/"/g, "&quot;")}" ${(voicePref[g] || (VOICES[g][0] && VOICES[g][0].name)) === v.name ? "selected" : ""}>${v.name.replace(/^Microsoft |^Google /, "")}${voiceScore(v) >= 40 ? " ⭐" : ""}</option>`).join("");
  $("shopBody").innerHTML = `<h2>🗣️ Talking</h2><p class="sub">Shopkeepers and townsfolk say hi to you out loud. Pick the voices that sound the nicest! ⭐ = extra natural.</p>
    <div style="margin-bottom:14px"><button class="act ${voicesOn ? "btn-green" : "btn-white"}" id="vToggle">${voicesOn ? "🗣️ Talking is ON" : "🔇 Talking is OFF"}</button></div>
    ${list.length ? `<div class="vrow"><b>👩 Higher voice</b><select id="vF">${opts("f")}</select><button class="act btn-pink" data-try="f">▶ Try</button></div>
    <div class="vrow"><b>👨 Deeper voice</b><select id="vM">${opts("m")}</select><button class="act btn-blue" data-try="m">▶ Try</button></div>
    ${list.some((v) => voiceScore(v) >= 40) ? "" : `<p class="sub" style="margin-top:12px">💡 This browser only has basic voices. Microsoft Edge (Natural voices) or Chrome (Google voices) sound much more like real people.</p>`}` : `<p class="sub">This browser doesn't have any voices to talk with.</p>`}`;
  $("vToggle").onclick = () => { voicesOn = !voicesOn; localStorage.setItem(VOICE_KEY, voicesOn ? "1" : "0"); setVoiceLabel(); if (!voicesOn) hush(); SFX.tap(); openVoices(); };
  const pickV = (g, el) => { voicePref[g] = el.value; localStorage.setItem("emmy.blindbag.voicepref", JSON.stringify(voicePref)); rankVoices(); };
  if ($("vF")) { $("vF").onchange = (e) => { pickV("f", e.target); speak(`Hi ${myName()}! Do you like my voice?`, { g: "f" }); }; $("vM").onchange = (e) => { pickV("m", e.target); speak(`Howdy ${myName()}! How about this voice?`, { g: "m" }); }; }
  $("shopBody").querySelectorAll("[data-try]").forEach((b) => (b.onclick = () => { const g = b.dataset.try; pickV(g, $(g === "f" ? "vF" : "vM")); const was = voicesOn; voicesOn = true; speak(g === "f" ? `Hi ${myName()}! Welcome to Blind Bag Town!` : `Hey there ${myName()}! Want a mega pack?`, { g }); voicesOn = was; }));
  if (modalOpen !== "shopModal") openModal("shopModal");
}
$("voiceBtn").onclick = () => { if (opener || glow || job) return; SFX.tap(); openVoices(); };
setVoiceLabel();

// --------------------------------------------------------------------------
//  State
// --------------------------------------------------------------------------
function fresh() { return { coins: 40, owned: {}, opened: 0, freeBag: true, pity: 0, name: "", hens: [], henNames: [], follow: 0, hats: [], hat: false, glam: {}, sampleAt: 0, cartsReturned: 0, met: {}, speedUntil: 0, glowed: {}, firstCart: false, eggs: { plain: 0, golden: 0 }, yardEggs: 0, yardProgress: 0, bestStock: 0 }; }
function load() { try { const raw = localStorage.getItem(SAVE_KEY); if (raw) { const s = { ...fresh(), ...JSON.parse(raw) }; s.glam = s.glam || {}; s.met = s.met || {}; s.glowed = s.glowed || {}; s.eggs = { plain: 0, golden: 0, ...s.eggs }; if (s.follow == null || s.follow > s.hens.length) s.follow = s.hens.length; return s; } } catch {} return fresh(); }
let state = load();
function save() { localStorage.setItem(SAVE_KEY, JSON.stringify(state)); }
const ownedKinds = () => CATALOG.filter((k) => state.owned[k.id]).length;
const myName = () => state.name || "friend";
const HEN_NAMES = ["Nugget", "Clucky", "Peep", "Waffles", "Pancake", "Sunny", "Pip", "Noodle", "Biscuit", "Popcorn", "Sprinkles", "Henrietta", "Eggbert", "Taco", "Butter", "Ziggy"];

// --------------------------------------------------------------------------
//  Blind bags — odds are printed in every shop
// --------------------------------------------------------------------------
const ODDS = {
  basic: { common: 46, uncommon: 27, rare: 14, epic: 7, legendary: 3.4, mythic: 1.6, secret: 0.7, golden: 0.2, rainbow: 0.1 },
  fancy: { common: 12, uncommon: 26, rare: 27, epic: 17, legendary: 9, mythic: 5, secret: 2.6, golden: 0.9, rainbow: 0.5 },
  luxe: { epic: 42, legendary: 26, mythic: 16, secret: 9, golden: 4.5, rainbow: 2.5 },
};
const BAGS = {
  snacks: { series: ["snacks"], art: "snacks", name: "Squishy Snacks", ico: "🍩", odds: "basic" },
  spuds: { series: ["spuds"], art: "spuds", name: "Silly Spuds", ico: "🥔", odds: "basic" },
  cluck: { series: ["cluck"], art: "cluck", name: "Cluck Club", ico: "🐔", odds: "basic" },
  pets: { series: ["pets"], art: "pets", name: "Pocket Pets", ico: "🐾", odds: "basic" },
  hunters: { series: ["hunters"], art: "hunters", name: "Pop Star Spirit Hunters", ico: "🎤", odds: "basic" },
  faces: { series: ["faces"], art: "faces", name: "Glow-Up Faces", ico: "💖", odds: "basic" },
  facesDeluxe: { series: ["faces"], art: "faces", name: "Deluxe Glow-Up Bag", ico: "💅", odds: "fancy", desc: "Better odds for Rare-and-up faces!" },
  mega: { series: SERIES_IDS, art: "mega", name: "Mega Mystery 5-Pack", ico: "🎁", odds: "basic", count: 5, desc: "FIVE bags from any series. Bulk savings!" },
  jumbo: { series: SERIES_IDS, art: "jumbo", name: "Jumbo Gold Bag", ico: "🏆", odds: "luxe", desc: "Always Epic or better — from any series!" },
  dinos: { series: ["dinos"], art: "dinos", name: "Dino Eggs", ico: "🦖", odds: "basic" },
  slime: { series: ["slime"], art: "slime", name: "Slime Pots", ico: "🫧", odds: "basic" },
  ocean: { series: ["ocean"], art: "ocean", name: "Ocean Buddies", ico: "🐠", odds: "basic" },
  bins: { series: ["snacks", "spuds", "cluck", "slime"], art: "snacks", name: "Bulk Bin Scoop", ico: "🥄", odds: "basic", desc: "A mystery bag from the bins. Snacks, Spuds, Chickens or Slime!" },
};
// what each shop sells, and for how much (Win-Win is cheapest, obviously)
const SHOP_BAGS = { winwin: [["snacks", 12], ["spuds", 10], ["slime", 14], ["cluck", 15]], teds: [["snacks", 15], ["pets", 20], ["hunters", 25], ["faces", 22], ["slime", 18]], bulk: [["ocean", 18], ["mega", 70], ["jumbo", 150]], cluck: [["cluck", 18], ["dinos", 22]], salon: [["faces", 22], ["facesDeluxe", 60]] };
const PITY = 8;
function rollRarity(odds) { const e = Object.entries(odds); let r = Math.random() * e.reduce((s, [, w]) => s + w, 0); for (const [k, w] of e) if ((r -= w) <= 0) return k; return e[0][0]; }
function rollItem(bagId) {
  const B = BAGS[bagId]; let rar = rollRarity(ODDS[B.odds]);
  if ((state.pity >= PITY - 1 || state.luckyNext) && RARITY[rar].order < 2) rar = rollRarity({ rare: 60, epic: 22, legendary: 10, mythic: 5, secret: 2, golden: 0.7, rainbow: 0.3 });
  const series = pick(B.series); let pool = [];
  for (let o = RARITY[rar].order; o >= 0 && !pool.length; o--) pool = CATALOG.filter((k) => k.series === series && RARITY[k.rarity].order === o);
  let k = pick(pool); if (state.owned[k.id] && Math.random() < 0.5) { const fresh = pool.filter((p) => !state.owned[p.id]); if (fresh.length) k = pick(fresh); } // a gentle nudge toward new ones
  state.pity = RARITY[k.rarity].order >= 2 ? 0 : state.pity + 1; state.luckyNext = false;
  return k;
}

// --------------------------------------------------------------------------
//  Shopkeepers (they ALL know your name)
// --------------------------------------------------------------------------
const KEEPERS = {
  bulk: { who: "Big Bob", face: "🧔", voice: { g: "m", n: 0, pitch: 0.9, rate: 0.95 }, hi: [(n) => `${n}! Have you seen the new Ocean Buddies? They swim! Well, pretend swim.`, (n) => `Welcome to Bulk-O-Rama, ${n}! Everything here comes in a pack of five hundred!`, (n) => `${n}! My favourite customer! Want a Mega Pack? It's mega!`, (n) => `Hi ${n}! Did you know we sell a tub of mayo the size of a bathtub? True story.`, (n) => `Hey ${n}! Is your membership card ready? Just kidding. YOU are the membership card.`] },
  winwin: { who: "Winnie", face: "👩‍🌾", voice: { g: "f", n: 0, pitch: 1.05, rate: 1.02 }, hi: [(n) => `Hi ${n}! We've got Slime Pots now! Stretchy, squishy, very not-for-eating.`, (n) => `Hi ${n}! Welcome to Win-Win, where everybody wins! Especially you!`, (n) => `${n}! Check out the bulk bins. Scoop a mystery bag for super cheap!`, (n) => `Hey there, ${n}! Everyone here owns the store. Even Gary. Hi Gary!`, (n) => `Welcome back, ${n}! The potatoes say hi too. Well, they would if they could.`] },
  teds: { who: "Ted", face: "🎩", voice: { g: "m", n: 1, pitch: 1.0, rate: 1.0 }, hi: [(n) => `Hey ${n}! Want a job? Help me stock the shelves and I'll pay you in coins!`, (n) => `Welcome to Ted's Everything Mart, ${n}! We sell everything! Blind bags, hats, socks, and one canoe.`, (n) => `Hey ${n}! Got doubles? Trade them in at my trade-in desk for coins!`, (n) => `${n}! Great to see you! Aisle ninety nine is rubber ducks. All of it.`, (n) => `Hello ${n}! Have you tried on a hat today? Life's better in a hat.`] },
  cluck: { who: "Farmer Hank", face: "🤠", voice: { g: "m", n: 2, pitch: 0.92, rate: 0.92 }, hi: [(n) => `Howdy ${n}! Scientists say chickens are dinosaurs. So now I sell Dino Eggs too!`, (n) => `${n}! Bring me your eggs and I'll buy every single one!`, (n) => `Howdy ${n}! Lookin' for a chicken? I've got chickens. So many chickens.`, (n) => `Well hey there, ${n}! These chickens wear costumes now. Don't ask me how it started.`, (n) => `${n}! Why did the chicken cross the road? To come say hi to YOU!`, (n) => `Howdy partner ${n}! Bawk bawk. Sorry, I've been around the chickens too long.`] },
  salon: { who: "Coco", face: "💇", voice: { g: "f", n: 1, pitch: 1.1, rate: 1.04 }, hi: [(n) => `Hi ${n}, darling! Welcome to the Glow-Up Salon! Everyone deserves a glow-up!`, (n) => `${n}! You look fabulous today! Want to pamper a Glow-Up Face?`, (n) => `Oh hi ${n}! The faces got muddy again. They LOVE puddles.`, (n) => `Welcome back, ${n}! Bows, crowns, sparkles. Let's make someone beautiful!`] },
};
const SAMPLES = ["one (1) single cheerio", "a pea on a toothpick", "a tiny cube of cheese. Very tiny. Microscopic.", "half a grape", "one sprinkle", "a crumb of a cracker", "a drop of orange juice in a thimble", "a mini pancake the size of a button", "a single noodle", "a slice of apple so thin you can see through it"];
const NPC_LINES = [(n) => `Hi ${n}!`, (n) => `Hey ${n}! Got any new blind bags?`, (n) => `Ooh, hi ${n}! What did you get?`, (n) => `${n}! I just got a Rubber Chicken. SQUAWK!`, (n) => `Hi ${n}! Did you see the giant chicken on Bulk-O-Rama?`, (n) => `Hey ${n}! I heard there's a secret chicken in EVERY series!`, (n) => `Hi ${n}! Love your outfit!`, (n) => `${n}! Nice to see you!`, (n) => `Hiya ${n}! The road chicken is at it again.`];
const ROAD_LINES = [(n) => `BAWK! Oh, hi ${n}! Why did I cross the road? To get to the blind bag store!`, (n) => `Hi ${n}! I'm crossing the road. Again. It's my hobby.`, (n) => `Bawk! ${n}, look both ways! Bawk!`];
function keeperSay(shop, text) { const K = KEEPERS[shop]; town && town.say("keeper", text); speak(text, K ? K.voice : {}); if (K) toast(`${K.face} ${K.who}: “${text}”`, 4500); }
const keeperBox = (shop, text) => { const K = KEEPERS[shop]; return `<div class="keeper"><span class="face">${K.face}</span><div><b>${K.who}:</b> “${text}”</div></div>`; };

// --------------------------------------------------------------------------
//  UI helpers
// --------------------------------------------------------------------------
let toastT = 0;
function toast(msg, ms = 2800) { const t = $("toast"); t.textContent = msg; t.classList.add("show"); clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove("show"), ms); }
function bump(el) { el.classList.remove("bump"); void el.offsetWidth; el.classList.add("bump"); }
function flyTo(el, glyph, n = 6) { const b = el.getBoundingClientRect(); for (let i = 0; i < Math.min(12, n); i++) { const s = document.createElement("span"); s.className = "fly"; s.textContent = glyph; const sx = innerWidth * (0.35 + Math.random() * 0.3), sy = innerHeight * (0.45 + Math.random() * 0.2); s.style.left = `${sx}px`; s.style.top = `${sy}px`; s.style.setProperty("--dx", `${b.left + b.width / 2 - sx}px`); s.style.setProperty("--dy", `${b.top + b.height / 2 - sy}px`); s.style.animationDelay = `${i * 0.05}s`; document.body.appendChild(s); setTimeout(() => s.remove(), 1300); } }
const cf = $("confetti"), cg = cf.getContext("2d"); let confs = [], cfRaf = 0;
function confetti(n = 120, colors = ["#ff8ac8", "#ffc93c", "#7a3cff", "#2e9d6a", "#3d8bfd", "#fff"]) {
  cf.width = innerWidth; cf.height = innerHeight;
  for (let i = 0; i < n; i++) confs.push({ x: Math.random() * cf.width, y: -20 - Math.random() * 200, vx: (Math.random() - 0.5) * 120, vy: 150 + Math.random() * 200, r: 4 + Math.random() * 6, c: colors[i % colors.length], a: Math.random() * 6, s: (Math.random() - 0.5) * 8 });
  if (!cfRaf) { let last = performance.now(); const f = (now) => { const dt = Math.min(0.05, (now - last) / 1000); last = now; cg.clearRect(0, 0, cf.width, cf.height); confs = confs.filter((p) => p.y < cf.height + 30); for (const p of confs) { p.x += p.vx * dt; p.y += p.vy * dt; p.a += p.s * dt; cg.save(); cg.translate(p.x, p.y); cg.rotate(p.a); cg.fillStyle = p.c; cg.fillRect(-p.r, -p.r / 2, p.r * 2, p.r); cg.restore(); } if (confs.length) cfRaf = requestAnimationFrame(f); else { cfRaf = 0; cg.clearRect(0, 0, cf.width, cf.height); } }; cfRaf = requestAnimationFrame(f); }
}
const RAINBOW_CONF = ["#ff5d8f", "#ffb347", "#ffe066", "#7cffb0", "#6ec6ff", "#b18cff"];
function renderPills() {
  $("coinsPill").textContent = `🪙 ${state.coins}`; $("bookPill").textContent = `📖 ${ownedKinds()}/${CATALOG.length}`;
  $("hensPill").style.display = state.hens.length ? "" : "none"; $("hensPill").textContent = `🐔 ${state.follow}/${state.hens.length}`; $("hensPill").title = `${state.follow} following you, ${state.hens.length - state.follow} at home in your chicken yard`;
  const eggs = state.eggs.plain + state.eggs.golden; $("eggsPill").style.display = eggs ? "" : "none"; $("eggsPill").textContent = `🧺 ${state.eggs.plain}🥚${state.eggs.golden ? ` ${state.eggs.golden}🌟` : ""}`;
  const c = town ? town.trainSize : 0; $("cartsPill").style.display = c ? "" : "none"; $("cartsPill").textContent = `🛒 ${c}`;
  $("namePill").textContent = state.name ? `✏️ ${state.name}` : "✏️ My name";
}
function addCoins(n, why) { state.coins += n; save(); renderPills(); bump($("coinsPill")); if (why) toast(why); }
const rarLabel = (r) => `<span style="color:${RARITY[r].color};font-weight:900">${RARITY[r].name}</span>`;

// --------------------------------------------------------------------------
//  Modals
// --------------------------------------------------------------------------
let modalOpen = null;
function openModal(id) { closeModal(); modalOpen = id; $(id).classList.add("show"); town && town.pause(true); }
function closeModal() { if (!modalOpen) return; if (modalOpen === "nameModal" && !state.name) return; if (modalOpen === "lookModal") { lookPrev && lookPrev.stop(); lookPrev = null; town.focusPlayer(false); } $(modalOpen).classList.remove("show"); modalOpen = null; if (town && !opener && !glow && !job && !fading) town.pause(false); }
document.querySelectorAll("[data-close]").forEach((b) => (b.onclick = () => { SFX.tap(); closeModal(); }));
document.querySelectorAll(".modal").forEach((m) => m.addEventListener("pointerdown", (e) => { if (e.target === m) closeModal(); }));

// ---- your name ----
const SILLY = ["Captain Sparkle", "Noodle", "Pickle", "Sir Bawks", "Muffin", "Cosmo", "Pudding", "Ziggy", "Bubbles", "Waffle", "Jellybean", "Sunny"];
const cleanName = (s) => s.replace(/[^\p{L}\p{N} '\-]/gu, "").replace(/\s+/g, " ").trim().slice(0, 14);
function openName(first = false) {
  $("nameTitle").textContent = first ? "Hi there! What's your name?" : "What should everyone call you?"; $("nameInput").value = state.name; $("nameClose").style.display = first ? "none" : "";
  $("nameSave").disabled = !cleanName($("nameInput").value); openModal("nameModal"); setTimeout(() => $("nameInput").focus(), 50);
}
$("nameInput").addEventListener("input", () => { $("nameSave").disabled = !cleanName($("nameInput").value); });
$("nameInput").addEventListener("keydown", (e) => { if (e.key === "Enter" && !$("nameSave").disabled) $("nameSave").click(); });
$("nameRandom").onclick = () => { SFX.tap(); $("nameInput").value = pick(SILLY); $("nameSave").disabled = false; };
$("nameSave").onclick = () => {
  const n = cleanName($("nameInput").value); if (!n) return; const first = !state.name; state.name = n; save(); renderPills(); town && town.setName(n); $("nameModal").classList.remove("show"); modalOpen = null; if (town && !opener && !glow) town.pause(false); SFX.win();
  const hello = first ? `Welcome to Blind Bag Town, ${n}! Your first blind bag is FREE at Win-Win Grocery!` : `Nice to meet you, ${n}!`; toast(`👋 ${hello}`, 5000); speak(hello, { g: "f", n: 1 });
  if (first) confetti(90);
};
$("namePill").onclick = () => { if (opener || glow) return; SFX.tap(); openName(false); };

// ---- shops ----
const oddsHtml = (o) => Object.entries(ODDS[o]).map(([r, w]) => `<div><b style="background:${RARITY[r].color}"></b>${RARITY[r].name}: ${w}%</div>`).join("");
function bagItem(id, price, shop) {
  const B = BAGS[id], free = state.freeBag && shop === "winwin" && id === "snacks";
  const S = B.series.length === 1 ? SERIES[B.series[0]] : null;
  return `<div class="item"><div class="ico">${B.ico}</div><h3>${B.name}</h3><div class="desc">${B.desc || (S ? S.tag : "")}</div><div class="odds">${oddsHtml(B.odds)}</div>
    <button class="act ${free ? "btn-green" : "btn-pink"}" data-buy="${id}" data-price="${free ? 0 : price}" ${!free && state.coins < price ? "disabled" : ""}>${free ? "🎁 FREE first bag!" : `Buy 🪙 ${price}`}</button></div>`;
}
const pityNote = () => `<p class="sub" style="margin-top:12px">🍀 Lucky meter: ${state.pity}/${PITY - 1} — every ${PITY}th bag without a Rare is guaranteed Rare or better!</p>`;
const HATS = [{ e: "🎩", name: "Top Hat", price: 20 }, { e: "👑", name: "Crown", price: 40 }, { e: "🧢", name: "Cap", price: 15 }, { e: "🎀", name: "Big Bow", price: 20 }, { e: "🦄", name: "Unicorn Hat", price: 35 }, { e: "🍩", name: "Donut Hat", price: 25 }, { e: "🥔", name: "Potato Hat", price: 10 }, { e: "🎧", name: "Headphones", price: 30 }];
function openShop(id) {
  const body = $("shopBody"), n = myName(), K = KEEPERS[id];
  const greet = pick(K.hi)(n);
  let extra = "";
  if (id === "bulk") extra = `<div class="item"><div class="ico">🌭</div><h3>Hot Dog Combo</h3><div class="desc">A hot dog AND a drink. Super-speedy legs for 60 seconds!</div><button class="act btn-red" data-snack="hotdog" ${state.coins < 3 ? "disabled" : ""}>Buy 🪙 3</button></div>`;
  if (id === "cluck") extra = henShopHtml();
  if (id === "salon") extra = `<div class="item"><div class="ico">💆</div><h3>Glow-Up Station</h3><div class="desc">Give one of your Glow-Up Faces a bath and a brand-new look. Free!</div><button class="act btn-purple" data-spa>💆 Pamper a face</button></div>`;
  body.innerHTML = `<h2>${SHOP_TITLE[id]}</h2>${keeperBox(id, greet)}<div class="items">${(SHOP_BAGS[id] || []).map(([b, p]) => bagItem(b, p, id)).join("")}${extra}</div>${pityNote()}`;
  body.querySelectorAll("[data-buy]").forEach((b) => (b.onclick = () => buyBag(b.dataset.buy, +b.dataset.price, id)));
  body.querySelectorAll("[data-snack]").forEach((b) => (b.onclick = () => { if (state.coins < 3) return; state.coins -= 3; state.speedUntil = Date.now() + 60000; save(); renderPills(); town.setSpeedBoost(1.55); SFX.buy(); closeModal(); const l = `Enjoy your hot dog, ${n}! Now ZOOM!`; toast(`🌭 ${l} Super speed for 60 seconds!`, 3000); keeperSay("bulk", l); }));
  body.querySelectorAll("[data-spa]").forEach((b) => (b.onclick = () => openSpa()));
  if (id === "cluck") wireHenShop(body);
  openModal("shopModal"); speak(greet, K.voice);
}
const SHOP_TITLE = { bulk: "🛒 Bulk-O-Rama Club", winwin: "🥕 Win-Win Grocery", teds: "🏬 Ted's Everything Mart", cluck: "🐔 Cluck & Co. Feed", salon: "💖 Glow-Up Salon" };
function buyBag(id, price, shop) {
  const free = price === 0 && state.freeBag; if (!free && state.coins < price) { SFX.error(); toast(`You need 🪙 ${price}. Grab coins round town, push carts back to the corral, or trade in doubles at Ted's!`); return; }
  if (free) state.freeBag = false; else state.coins -= price;
  save(); renderPills(); SFX.buy(); closeModal();
  const K = KEEPERS[shop]; if (K) { const l = pick([`Good luck, ${myName()}!`, `Ooh, I hope you get a rare one, ${myName()}!`, `Fingers crossed, ${myName()}!`, `Enjoy, ${myName()}! Tell me what you get!`]); speak(l, K.voice); }
  startBags(id, free ? ((SHOP_BAGS[shop] || []).find(([b]) => b === id) || [0, price])[1] : price);
}

// ---- Cluck & Co: pet chickens that follow you ----
let henPick = 0;
const eggValue = () => state.eggs.plain * EGG_PRICE.plain + state.eggs.golden * EGG_PRICE.golden;
function henShopHtml() {
  const full = state.hens.length >= MAX_HENS, eggs = state.eggs.plain + state.eggs.golden;
  return `<div class="item"><div class="ico">🧺</div><h3>Sell your eggs</h3><div class="desc">Hank buys every egg!<br>🥚 = 🪙 ${EGG_PRICE.plain} · 🌟 golden = 🪙 ${EGG_PRICE.golden}</div><div style="font-weight:900">Your basket: 🥚 ${state.eggs.plain} · 🌟 ${state.eggs.golden}</div><button class="act btn-gold" id="sellEggs" ${eggs ? "" : "disabled"}>${eggs ? `Sell all for 🪙 ${eggValue()}` : "No eggs yet"}</button></div>
    <div class="item"><div class="ico">🐔</div><h3>A Pet Chicken</h3><div class="desc">Follows you around (and finds coins!) or lives in your 🐔 chicken yard and lays eggs.</div><div class="hencolors">${CHICKEN_COLORS.map((c, i) => `<button data-hen="${i}" class="${i === henPick ? "sel" : ""}" title="${c.name}" style="background:#${c.body.toString(16).padStart(6, "0")}"></button>`).join("")}</div>
    <button class="act btn-red" id="buyHen" ${full || state.coins < 30 ? "disabled" : ""}>${full ? `That's a LOT of chickens 🐔×${MAX_HENS}` : "Buy 🪙 30"}</button></div>
    <div class="item"><div class="ico">🎩</div><h3>Chicken Hat</h3><div class="desc">A fancy hat… that is also a chicken. Wear it from 👕 My look.</div><button class="act ${state.hat ? "btn-white" : "btn-red"}" id="buyHat" ${state.hat || state.coins < 15 ? "disabled" : ""}>${state.hat ? "✓ You own it!" : "Buy 🪙 15"}</button></div>
    ${state.hens.length ? `<div style="width:100%">${flockHtml()}</div>` : ""}`;
}
function wireHenShop(body) {
  body.querySelectorAll("[data-hen]").forEach((b) => (b.onclick = () => { henPick = +b.dataset.hen; SFX.bawk(); openShop("cluck"); }));
  $("buyHen").onclick = () => { if (state.coins < 30 || state.hens.length >= MAX_HENS) return; state.coins -= 30; const nm = henName(state.hens.length), follows = state.follow < START_FOLLOW;
    if (follows) { state.hens.splice(state.follow, 0, henPick); state.henNames.splice(state.follow, 0, nm); state.follow++; } else { state.hens.push(henPick); state.henNames.push(nm); } // followers are always hens[0..follow)
    save(); renderPills(); town.setFlock(state.hens, state.follow); SFX.bawk(); bump($("hensPill")); closeModal(); const l = `Meet ${nm}, ${myName()}! Take good care of 'em!`; keeperSay("cluck", l); toast(follows ? `🐔 BAWK! ${nm} is following you now!` : `🐔 BAWK! ${nm} moved into your 🐔 chicken yard next to your house!`, 3500); };
  $("sellEggs").onclick = () => { const v = eggValue(), n = state.eggs.plain + state.eggs.golden; if (!n) return; state.eggs = { plain: 0, golden: 0 }; addCoins(v); flyTo($("coinsPill"), "🪙", Math.min(12, n)); SFX.cash(); keeperSay("cluck", `${n} egg${n > 1 ? "s" : ""}! Here's ${v} coins, ${myName()}. Pleasure doin' business!`); if (v >= 30) confetti(70); openShop("cluck"); };
  wireFlock(body, () => openShop("cluck"));
  $("buyHat").onclick = () => { if (state.hat || state.coins < 15) return; state.coins -= 15; state.hat = true; look.hat = "🐔"; saveLook(); town.setAvatar(look); save(); renderPills(); SFX.bawk(); closeModal(); toast("🐔 You're wearing your Chicken Hat! (Swap it any time in 👕 My look.)", 3500); };
}

// ---- your flock: who follows you, who stays home in the chicken yard ----
const henName = (i) => HEN_NAMES[i % HEN_NAMES.length] + (i >= HEN_NAMES.length ? ` ${Math.floor(i / HEN_NAMES.length) + 1}` : "");
function flockHtml() {
  const n = state.hens.length, f = state.follow;
  const chip = (i) => { const c = CHICKEN_COLORS[state.hens[i] % CHICKEN_COLORS.length], on = i < f; return `<button class="hen ${on ? "on" : ""}" data-hen-toggle="${i}"><span class="hdot" style="background:#${c.body.toString(16).padStart(6, "0")}"></span><b>${state.henNames[i]}</b><small>${on ? "🚶 Following" : "🏡 Yard"}</small></button>`; };
  return `<div class="keeper" style="display:block;text-align:center"><b>Tap a chicken to bring it along or send it home.</b><div style="margin-top:4px;color:var(--muted);font-size:13px">🚶 Following you: ${f} · 🏡 In your yard: ${n - f}</div><div class="flock">${state.hens.map((_, i) => chip(i)).join("")}</div></div>`;
}
function wireFlock(root, rerender) {
  root.querySelectorAll("[data-hen-toggle]").forEach((b) => (b.onclick = () => {
    const i = +b.dataset.henToggle, on = i < state.follow; const [c] = state.hens.splice(i, 1), [nm] = state.henNames.splice(i, 1);
    if (on) state.follow--; const at = state.follow; state.hens.splice(at, 0, c); state.henNames.splice(at, 0, nm); if (!on) state.follow++;
    save(); renderPills(); town.setFlock(state.hens, state.follow); SFX.bawk(); toast(on ? `🏡 ${nm} went home to your chicken yard.` : `🚶 ${nm} is following you now!`, 1800); rerender();
  }));
}
// chickens at home lay eggs in the yard — collect them at the yard gate, sell them at Cluck & Co.
const YARD_EGG_EVERY = 40; // seconds per egg, per chicken
setInterval(() => { const home = state.hens.length - state.follow; if (!home || state.yardEggs >= 60) return; state.yardProgress += (5 * home) / YARD_EGG_EVERY; while (state.yardProgress >= 1 && state.yardEggs < 60) { state.yardProgress -= 1; state.yardEggs++; } save(); town && town.setYardEggs(state.yardEggs); }, 5000);
function openYard() {
  const body = $("shopBody"), n = state.hens.length, home = n - state.follow;
  body.innerHTML = `<h2>🐔 My Chicken Yard</h2>${n ? flockHtml() : ""}
    <div class="keeper" style="display:block">${!n ? "Your yard is empty! Buy chickens at 🐔 Cluck & Co. Feed." : home ? `${home} chicken${home > 1 ? "s are" : " is"} pecking around in here. They lay eggs while they're home!` : "Everyone is out walking with you! Send some home and they'll lay eggs here."}</div>
    <div class="items"><div class="item"><div class="ico">🥚</div><h3>Eggs in the nests</h3><div style="font-size:26px;font-weight:900">${state.yardEggs}</div><button class="act btn-gold" id="yardCollect" ${state.yardEggs ? "" : "disabled"}>${state.yardEggs ? "🧺 Collect them all" : "None yet — check back soon!"}</button></div></div>
    <p class="sub">Sell eggs to Farmer Hank at 🐔 Cluck & Co.: 🥚 = 🪙 ${EGG_PRICE.plain}, 🌟 golden = 🪙 ${EGG_PRICE.golden}</p>`;
  wireFlock(body, openYard);
  $("yardCollect").onclick = () => { let gold = 0; for (let i = 0; i < state.yardEggs; i++) { if (Math.random() < 0.08) { state.eggs.golden++; gold++; } else state.eggs.plain++; } const got = state.yardEggs; state.yardEggs = 0; save(); renderPills(); bump($("eggsPill")); SFX.bawk(); town.setYardEggs(0); toast(`🧺 You collected ${got} egg${got > 1 ? "s" : ""}${gold ? ` (${gold} golden!)` : ""}! Sell them at 🐔 Cluck & Co.`, 3200); openYard(); };
  if (modalOpen !== "shopModal") openModal("shopModal");
}

// ---- Ted's: hats and the trade-in desk ----
function openHats() {
  const body = $("shopBody");
  body.innerHTML = `<h2>🎩 Ted's Hat Aisle</h2>${keeperBox("teds", `A hat for every head, ${myName()}! Buy one and wear it any time from My look.`)}
    <div class="items">${HATS.map((h) => { const own = state.hats.includes(h.e), on = look.hat === h.e; return `<div class="item" style="width:150px"><div class="ico">${h.e}</div><h3>${h.name}</h3><button class="act ${own ? (on ? "btn-white" : "btn-green") : "btn-pink"}" data-hat="${h.e}" ${!own && state.coins < h.price ? "disabled" : ""}>${own ? (on ? "✓ Wearing it" : "Wear it") : `Buy 🪙 ${h.price}`}</button></div>`; }).join("")}</div>`;
  body.querySelectorAll("[data-hat]").forEach((b) => (b.onclick = () => { const h = HATS.find((x) => x.e === b.dataset.hat); if (!state.hats.includes(h.e)) { if (state.coins < h.price) return; state.coins -= h.price; state.hats.push(h.e); save(); renderPills(); SFX.buy(); toast(`${h.e} You bought the ${h.name}! Looking great, ${myName()}!`); } look.hat = h.e; saveLook(); town.setAvatar(look); SFX.tap(); openHats(); }));
  openModal("shopModal");
}
function openTradeIn() {
  const body = $("shopBody"); const extras = CATALOG.filter((k) => (state.owned[k.id] || 0) > 1); const total = extras.reduce((s, k) => s + RARITY[k.rarity].value * (state.owned[k.id] - 1), 0);
  body.innerHTML = `<h2>🔄 Ted's Trade-In Desk</h2>${keeperBox("teds", extras.length ? `Ooh, doubles! I'll give you coins for your extras, ${myName()}. You always keep one of each.` : `No doubles yet, ${myName()}! When you get the same toy twice, bring the extra here.`)}
    ${extras.length ? `<div style="margin-bottom:10px"><button class="act btn-green" id="tradeAll">Trade all extras for 🪙 ${total}</button></div>` + extras.map((k) => `<div class="swaprow"><img data-thumb="${k.id}" alt=""><div class="n">${k.name}<small>${rarLabel(k.rarity)} · you have ×${state.owned[k.id]}</small></div><button class="act btn-gold" data-trade="${k.id}">🪙 ${RARITY[k.rarity].value}</button></div>`).join("") : ""}`;
  body.querySelectorAll("[data-trade]").forEach((b) => (b.onclick = () => { const k = byId(b.dataset.trade); state.owned[k.id]--; addCoins(RARITY[k.rarity].value); SFX.coin(); openTradeIn(); }));
  if ($("tradeAll")) $("tradeAll").onclick = () => { for (const k of extras) state.owned[k.id] = 1; addCoins(total, `🔄 Traded for 🪙 ${total}!`); SFX.cash(); flyTo($("coinsPill"), "🪙", 8); openTradeIn(); };
  fillThumbs(body); if (modalOpen !== "shopModal") openModal("shopModal");
}

// ---- Bulk-O-Rama: free samples from Sample Sally ----
const SALLY = { g: "f", n: 2, pitch: 1.12, rate: 1.05 };
function freeSample() {
  const wait = state.sampleAt - Date.now(), n = myName();
  if (wait > 0) { const l = `One per customer, ${n}! Come back in ${Math.ceil(wait / 1000)} seconds, sweetie.`; toast(`🍢 Sample Sally: “${l}”`, 3000); speak(l, SALLY); return; }
  state.sampleAt = Date.now() + 45000; save();
  if (Math.random() < 0.2) { const l = `Today's sample is… a FREE blind bag! Here you go, ${n}!`; toast(`🍢 Sample Sally: “${l}”`, 3500); speak(l, SALLY); SFX.win(); setTimeout(() => startBags("snacks", null), 900); return; }
  const what = pick(SAMPLES), l = `Free sample, ${n}! Today it's ${what}. Enjoy!`; toast(`🍢 Sample Sally: “${l}” (+🪙 1)`, 4200); speak(l, SALLY); addCoins(1); SFX.coin();
}

// ---- Win-Win: the bulk bins ----
function scoopBins() {
  if (state.coins < 8) { SFX.error(); toast("The bulk bins cost 🪙 8 a scoop. Grab some coins round town!"); return; }
  state.coins -= 8; save(); renderPills(); SFX.rattle(); const l = `Scoop scoop! Good luck, ${myName()}!`; keeperSay("winwin", l); setTimeout(() => startBags("bins", 8), 500);
}

// ---- collection book ----
let bookTab = "snacks";
function renderBook() {
  const have = ownedKinds(); $("bookCount").textContent = `${have} / ${CATALOG.length} found`; $("bookBar").style.width = `${(have / CATALOG.length) * 100}%`;
  $("rarityKey").innerHTML = Object.entries(RARITY).map(([id, r]) => `<span style="background:${id === "rainbow" ? "linear-gradient(90deg,#ff5d8f,#ffb347,#7cffb0,#6ec6ff,#b18cff)" : r.color}">${r.name}</span>`).join("");
  $("bookTabs").innerHTML = SERIES_IDS.map((s) => { const list = CATALOG.filter((k) => k.series === s); return `<button data-tab="${s}" class="${s === bookTab ? "sel" : ""}">${SERIES[s].ico} ${SERIES[s].name} ${list.filter((k) => state.owned[k.id]).length}/${list.length}</button>`; }).join("");
  $("bookTabs").querySelectorAll("[data-tab]").forEach((b) => (b.onclick = () => { bookTab = b.dataset.tab; SFX.tap(); renderBook(); }));
  const list = CATALOG.filter((k) => k.series === bookTab).sort((a, b) => RARITY[a.rarity].order - RARITY[b.rarity].order);
  $("bookBody").innerHTML = `<p class="sub">${SERIES[bookTab].tag}</p><div class="shelf">${list.map((k) => { const n = state.owned[k.id] || 0, rc = RARITY[k.rarity].color; return n
    ? `<div class="slot" style="--rc:${rc}" data-play="${k.id}"><img data-thumb="${k.id}" alt=""><div class="nm">${k.name}</div><div class="rr">${RARITY[k.rarity].name}</div>${n > 1 ? `<div class="ct">×${n}</div>` : ""}</div>`
    : `<div class="slot locked" style="--rc:${rc}66"><div class="q">?</div><div class="nm">???</div><div class="rr" style="color:${rc}">${RARITY[k.rarity].name}</div></div>`; }).join("")}</div>`;
  $("bookBody").querySelectorAll("[data-play]").forEach((s) => (s.onclick = () => { SFX.tap(); closeModal(); viewItem(s.dataset.play); }));
  fillThumbs($("bookBody"));
}
function openBook() { SFX.tap(); renderBook(); openModal("bookModal"); }
$("bookPill").onclick = () => { if (opener || glow) return; openBook(); };

// ---- 3D thumbnails (rendered once, a few per frame) ----
const thumbs = new Map(); let thumbR = null, thumbQ = [], thumbBusy = false;
function fillThumbs(root) { root.querySelectorAll("img[data-thumb]").forEach((img) => { const id = img.dataset.thumb; if (thumbs.has(id)) img.src = thumbs.get(id); else thumbQ.push(id); }); pumpThumbs(); }
function pumpThumbs() {
  if (thumbBusy || !thumbQ.length) return; thumbBusy = true;
  if (!thumbR) { const c = document.createElement("canvas"); thumbR = { r: new THREE.WebGLRenderer({ canvas: c, antialias: true, alpha: true, preserveDrawingBuffer: true }) }; thumbR.r.setSize(160, 160, false); thumbR.r.toneMapping = THREE.ACESFilmicToneMapping; thumbR.r.outputColorSpace = THREE.SRGBColorSpace; thumbR.env = new THREE.PMREMGenerator(thumbR.r).fromScene(new RoomEnvironment(), 0.04).texture;
    const s = new THREE.Scene(); s.environment = thumbR.env; s.environmentIntensity = 0.6; s.add(new THREE.HemisphereLight(0xfff6ff, 0x6b4a73, 0.8)); const d = new THREE.DirectionalLight(0xffffff, 2.0); d.position.set(2, 5, 4); s.add(d); thumbR.scene = s; thumbR.cam = new THREE.PerspectiveCamera(30, 1, 0.1, 50); }
  requestAnimationFrame(() => {
    for (let n = 0; n < 4 && thumbQ.length; n++) { const id = thumbQ.shift(); if (thumbs.has(id)) continue; const g = buildItem(id, { glam: state.glam[id] }); const H = g.userData.H || 1; g.rotation.y = -0.35; thumbR.scene.add(g);
      const size = new THREE.Box3().setFromObject(g).getSize(new THREE.Vector3()), F = Math.max(H, size.x * 0.8); const cam = thumbR.cam, dist = F * 2.6 + 0.6; cam.position.set(0, H * 0.75 + dist * 0.25, dist); cam.lookAt(0, H * 0.48, 0); thumbR.r.render(thumbR.scene, cam); thumbs.set(id, thumbR.r.domElement.toDataURL()); thumbR.scene.remove(g); g.traverse((o) => { if (o.geometry) o.geometry.dispose(); });
      document.querySelectorAll(`img[data-thumb="${id}"]`).forEach((img) => (img.src = thumbs.get(id))); }
    thumbBusy = false; pumpThumbs();
  });
}

// --------------------------------------------------------------------------
//  Opening bags — tear, reveal, squish
// --------------------------------------------------------------------------
let opener = null; // { ctrl, item, isNew, bagId, price, left }
function startBags(bagId, price) { const B = BAGS[bagId]; openNext({ bagId, price, left: B.count || 1, total: B.count || 1 }); }
function openNext(run) {
  const item = rollItem(run.bagId); const isNew = !state.owned[item.id];
  state.owned[item.id] = (state.owned[item.id] || 0) + 1; state.opened++; save(); renderPills(); // saved now so closing the tab never loses it
  run.left--; showItem(item, { bag: BAGS[run.bagId].art, isNew, run });
}
function viewItem(id) { showItem(byId(id), { bag: null, isNew: false, run: null }); }
function showItem(item, { bag, isNew, run }) {
  closeModal(); town.pause(true); hush();
  const ctrl = createOpen(item, town.envMap, { bag, glam: state.glam[item.id], sfx: SFX, onReveal: () => reveal(), onTap: () => { if (item.series === "hunters") SFX.sing(); },
    onStatus: (s) => { $("tTip").style.display = "none"; const el = $("tStatus"); el.textContent = s; el.classList.add("show"); el.classList.remove("pop"); void el.offsetWidth; el.classList.add("pop"); },
    onCoins: (n, why) => { addCoins(n); flyTo($("coinsPill"), "🪙", 2); if (why) toast(why, 2000); } });
  opener = { ctrl, item, isNew, run, bag }; town.setOverride(ctrl);
  $("hud").classList.add("attable"); $("tableHud").classList.add("show"); $("tCard").classList.remove("show"); $("tStatus").classList.remove("show");
  if (bag) { $("tTip").style.display = ""; $("tTip").textContent = run && run.total > 1 ? `✂️ Bag ${run.total - run.left} of ${run.total} — swipe across the top to tear it open!` : "✂️ Swipe across the top of the bag to tear it open!"; $("tButtons").innerHTML = ""; }
  else reveal(true);
}
function reveal(quiet = false) {
  const { item: k, isNew, run } = opener; const R = RARITY[k.rarity];
  $("tTip").style.display = "none";
  const card = $("tCard"); card.style.setProperty("--rc", R.color);
  card.innerHTML = `${isNew ? `<div class="newb">NEW!</div>` : ""}<span class="rar ${k.rarity === "rainbow" ? "rainbow" : ""}">${R.name}</span><h2>${k.name}</h2><div class="meta">${SERIES[k.series].ico} ${SERIES[k.series].name} · ${quiet ? `In your collection ×${state.owned[k.id] || 1}` : isNew ? `#${ownedKinds()} of ${CATALOG.length} found!` : `You have ×${state.owned[k.id]} — trade extras at Ted's`}</div>${k.note ? `<div class="blurb"><b>${k.note}</b></div>` : ""}<div class="blurb">${k.blurb}</div><div class="blurb"><b>${opener.ctrl.mode.hint || "🤏 Press & hold to squish • tap to boing • drag to spin"}</b></div>`;
  requestAnimationFrame(() => card.classList.add("show"));
  renderOpenButtons();
  if (!quiet) {
    if (R.order >= 6) { SFX.wow(); confetti(k.rarity === "rainbow" ? 380 : 260, k.rarity === "rainbow" ? RAINBOW_CONF : k.rarity === "golden" ? ["#ffc93c", "#fff3b0", "#f5a300", "#fff"] : undefined); speak(`WOW! ${k.rarity === "secret" ? "A secret" : R.name}! ${k.name}!`, { g: "f", n: 1, rate: 1.05 }); }
    else if (R.order >= 3) { SFX.wow(); confetti(170); } else if (R.order >= 2 || isNew) { SFX.win(); if (R.order >= 2) confetti(100); } else SFX.ding();
    if (isChicken(k)) setTimeout(() => (k.p.kind === "rubber" ? SFX.squeak() : SFX.bawk()), 500);
  }
}
function renderOpenButtons() {
  const { item, run } = opener; const face = isFace(item);
  const again = run && run.left <= 0 && run.price != null && BAGS[run.bagId] && !BAGS[run.bagId].count;
  const btns = (opener.ctrl.mode.actions || []).map((a) => `<button class="act btn-white playbtn" data-act="${a.id}">${a.ico} ${a.label}</button>`);
  if (face) btns.push(`<button class="act btn-pink" id="tGlow">${opener.bag ? "🧽 Clean them up!" : "💆 Glow-Up again"}</button>`);
  if (run && run.left > 0) btns.push(`<button class="act btn-purple" id="tNext">🎁 Next bag! (${run.total - run.left + 1}/${run.total})</button>`);
  else if (again) btns.push(`<button class="act btn-red" id="tAgain" ${state.coins < run.price ? "disabled" : ""}>🛍️ Another! 🪙 ${run.price}</button>`);
  btns.push(`<button class="act btn-green" id="tDone">${run && run.left > 0 ? "✓ Save the rest for later" : "✓ Done"}</button>`);
  $("tButtons").innerHTML = btns.join("");
  $("tButtons").querySelectorAll("[data-act]").forEach((b) => (b.onclick = () => opener && opener.ctrl.mode.act(b.dataset.act)));
  if ($("tGlow")) $("tGlow").onclick = () => { const it = opener.item, r = opener.run; closeOpen(true); startGlow(it, { run: r }); };
  if ($("tNext")) $("tNext").onclick = () => { const r = opener.run; closeOpen(true); openNext(r); };
  if ($("tAgain")) $("tAgain").onclick = () => { const r = opener.run; if (state.coins < r.price) { SFX.error(); return; } state.coins -= r.price; save(); renderPills(); SFX.buy(); closeOpen(true); startBags(r.bagId, r.price); };
  $("tDone").onclick = () => { const r = opener.run; if (r && r.left > 0) { state.savedBags = (state.savedBags || 0) + r.left; save(); } closeOpen(); };
}
function closeOpen(quick = false) {
  if (!opener) return; const was = opener; town.setOverride(null); try { was.ctrl.dispose(); } catch {} opener = null;
  $("hud").classList.remove("attable"); $("tableHud").classList.remove("show"); $("tCard").classList.remove("show"); $("tStatus").classList.remove("show"); town.pause(false);
  if (quick) return;
  if (was.bag && was.isNew && ownedKinds() === CATALOG.length) { confetti(300); SFX.wow(); toast(`🏆 You found ALL ${CATALOG.length} toys, ${myName()}! You're the Blind Bag Champion!`, 6000); }
  else if (was.bag) toast(`📖 ${was.item.name} is in your collection — see them all at 🏠 your house!`);
  if (state.savedBags) toast(`🎁 You have ${state.savedBags} saved bag${state.savedBags > 1 ? "s" : ""} — open them from the 🛒 Bulk-O-Rama counter!`, 3500);
}

// --------------------------------------------------------------------------
//  💖 The Glow-Up station — scrub, brush, then decorate
// --------------------------------------------------------------------------
let glow = null; // { ctrl, item, run, decorating }
function startGlow(item, { run = null } = {}) {
  closeModal(); town.pause(true);
  const ctrl = createGlow(item, town.envMap, { sfx: SFX, glam: state.glam[item.id], messy: true, onProgress: () => renderGlow(), onClean: () => cleaned() });
  glow = { ctrl, item, run, decorating: false }; town.setOverride(ctrl);
  $("hud").classList.add("attable"); $("glowHud").classList.add("show"); renderGlow();
  toast(`🧽 ${item.name} got all messy playing outside! Scrub the mud and brush the fluff!`, 3500);
}
function renderGlow() {
  if (!glow) return; const c = glow.ctrl, r = c.remaining(), dec = glow.decorating;
  $("gTip").innerHTML = dec ? `💖 ${glow.item.name} is sparkly clean!<small>Add blush, stickers and a bow — then tap “All done”</small>` : `🧽 Mess left: ${r.dirt} · 🪮 Messy fluff: ${r.fluff}<small>${c.tool === "sponge" ? "Rub the mud and splats with the sponge" : "Brush the messy fluff on top"}</small>`;
  const tool = (id, ico, label, extra = "") => `<button class="tool ${c.tool === id ? "sel" : ""} ${extra}" data-tool="${id}"><span>${ico}</span>${label}</button>`;
  $("gTools").innerHTML = dec
    ? `${tool("blush", "💗", "Blush")}${tool("sticker", STICKERS[(c.glam.stickers || []).length % STICKERS.length], "Stickers")}<button class="tool" data-acc><span>🎀</span>${{ bow: "Bow", crown: "Crown", flowers: "Flowers", star: "Stars" }[c.glam.acc] || "Accessory"}</button><button class="tool" data-clear><span>🫧</span>Clear</button><button class="tool done" data-done><span>💖</span>All done!</button>`
    : `${tool("sponge", "🧽", "Sponge")}${tool("brush", "🪮", "Brush")}<button class="tool" data-quit><span>🚶</span>Later</button>`;
  $("gTools").querySelectorAll("[data-tool]").forEach((b) => (b.onclick = () => { SFX.tap(); c.setTool(b.dataset.tool); if (b.dataset.tool === "blush") c.toggleBlush(); renderGlow(); }));
  const acc = $("gTools").querySelector("[data-acc]"); if (acc) acc.onclick = () => { c.cycleAcc(); renderGlow(); };
  const clr = $("gTools").querySelector("[data-clear]"); if (clr) clr.onclick = () => { c.resetGlam(); SFX.pop(); renderGlow(); };
  const done = $("gTools").querySelector("[data-done]"); if (done) done.onclick = () => finishGlow();
  const quit = $("gTools").querySelector("[data-quit]"); if (quit) quit.onclick = () => endGlow();
}
function cleaned() {
  if (!glow) return; glow.decorating = true; glow.ctrl.setTool("sticker"); SFX.win(); confetti(110, ["#ff8ac8", "#ffd6ef", "#fff", "#b18cff"]);
  const first = !state.glowed[glow.item.id]; if (first) { state.glowed[glow.item.id] = 1; addCoins(5); flyTo($("coinsPill"), "🪙", 5); }
  const l = `Sparkly clean! Great job, ${myName()}! Now make ${glow.item.baseName.replace(" Face", "")} beautiful!`; toast(`✨ ${l}${first ? " +🪙 5" : ""}`, 3500); speak(l, KEEPERS.salon.voice); renderGlow();
}
function finishGlow() {
  const g = glow; state.glam[g.item.id] = JSON.parse(JSON.stringify(g.ctrl.glam)); save(); thumbs.delete(g.item.id); SFX.wow(); confetti(160, ["#ff8ac8", "#ffc93c", "#b18cff", "#fff"]);
  const l = pick([`So beautiful! You're a natural, ${myName()}!`, `Gorgeous! ${myName()}, you have the magic touch!`, `Wow, ${myName()}! That's the best glow-up I've ever seen!`]); toast(`💖 ${l}`, 3500); speak(l, KEEPERS.salon.voice);
  endGlow();
}
function endGlow() {
  if (!glow) return; const g = glow; town.setOverride(null); try { g.ctrl.dispose(); } catch {} glow = null;
  $("hud").classList.remove("attable"); $("glowHud").classList.remove("show"); town.pause(false); town.refreshShelf();
  if (g.run && g.run.left > 0) setTimeout(() => openNext(g.run), 400);
}
function openSpa() {
  const faces = CATALOG.filter((k) => isFace(k) && state.owned[k.id]); const body = $("shopBody");
  body.innerHTML = `<h2>💆 Glow-Up Station</h2>${keeperBox("salon", faces.length ? `Who's getting pampered today, ${myName()}? Pick a face!` : `You don't have any Glow-Up Faces yet, ${myName()}! Buy a Glow-Up bag right here, darling.`)}
    ${faces.map((k) => `<div class="swaprow"><img data-thumb="${k.id}" alt=""><div class="n">${k.name}<small>${rarLabel(k.rarity)}${state.glam[k.id] ? " · already glammed up 💖" : ""}</small></div><button class="act btn-pink" data-spaface="${k.id}">💆 Pamper</button></div>`).join("")}`;
  body.querySelectorAll("[data-spaface]").forEach((b) => (b.onclick = () => { SFX.tap(); startGlow(byId(b.dataset.spaface)); }));
  fillThumbs(body); if (modalOpen !== "shopModal") openModal("shopModal");
}

// --------------------------------------------------------------------------
//  📦 Stock the Shelves — the job at Ted's
// --------------------------------------------------------------------------
let job = null; // { ctrl }
function showJobBanner(html) { $("jBanner").innerHTML = `<div class="banner">${html}</div>`; $("jBanner").style.display = ""; }
function openStockInfo() {
  $("shopBody").innerHTML = `<h2>📦 Stock the Shelves</h2>${keeperBox("teds", `I need a helper, ${myName()}! Blind bags come down the belt — drag each one into the bin with the matching picture. One coin per bag, two when you're on a streak. And if a chicken rides the belt… shoo it off!`)}
    <p class="sub">45 seconds.${state.bestStock ? ` Your best: ${state.bestStock} points.` : ""}</p><button class="act btn-green" id="stockGo">📦 Let's work!</button>`;
  $("stockGo").onclick = startStock; openModal("shopModal");
}
function startStock() {
  if (job || opener || glow) return; closeModal(); town.pause(true); hush(); job = { ctrl: null }; $("hud").classList.add("attable"); $("jobHud").classList.add("show"); $("jTop").innerHTML = ""; runStock();
}
function runStock() {
  $("jBanner").style.display = "none"; $("jBanner").innerHTML = ""; if (job.ctrl) { town.setOverride(null); job.ctrl.dispose(); }
  const ctrl = createStock({ envMap: town.envMap, sfx: SFX,
    onScore: (score, combo, time, msg) => { $("jTop").innerHTML = `<span>⭐ ${score}</span>${combo >= 2 ? `<span>🔥 ${combo}</span>` : ""}<span>⏱ ${Math.ceil(time)}s</span>`; if (msg) { const m = $("jMsg"); m.textContent = msg; m.classList.remove("pop"); void m.offsetWidth; m.classList.add("pop"); } },
    onEnd: ({ score, best }) => {
      const record = score > state.bestStock; state.bestStock = Math.max(state.bestStock, score); addCoins(score); flyTo($("coinsPill"), "🪙", Math.min(12, score)); SFX.win(); if (record || score >= 25) confetti(140);
      const l = score >= 25 ? `WOW, ${myName()}! Best helper I've ever had!` : score >= 12 ? `Great job, ${myName()}! The shelves look amazing!` : `Thanks for the help, ${myName()}!`; speak(l, KEEPERS.teds.voice);
      showJobBanner(`<div class="big">${score >= 25 ? "🏆" : score >= 12 ? "🌟" : "📦"}</div><h2>${score >= 25 ? "Super Stocker!" : score >= 12 ? "Great job!" : "Nice work!"}</h2><div class="won">⭐ ${score} points → 🪙 +${score}</div><p>${l}<br>Longest streak: ${best}${record ? " · 🏅 NEW best!" : ` · Best: ${state.bestStock}`}</p><div class="row"><button class="act btn-green" id="jAgain">🔁 Work again</button><button class="act btn-white" id="jBack">🚶 Back to the store</button></div>`);
      $("jAgain").onclick = runStock; $("jBack").onclick = endStock;
    } });
  job.ctrl = ctrl; town.setOverride(ctrl); $("jTop").innerHTML = `<span>⭐ 0</span><span>⏱ 45s</span>`; toast(`📦 Drag each bag into its bin: ${ctrl.series.map((s) => SERIES[s].ico).join(" ")}`, 3000);
}
function endStock() {
  if (!job) return; if (job.ctrl) { town.setOverride(null); try { job.ctrl.dispose(); } catch {} } job = null;
  $("jobHud").classList.remove("show"); $("hud").classList.remove("attable"); $("jBanner").innerHTML = ""; $("jMsg").textContent = ""; town.pause(false);
}

// --------------------------------------------------------------------------
//  Character customization (same choices as the arcade, plus hats you buy)
// --------------------------------------------------------------------------
const LOOK = { skin: [0xffd6b8, 0xf1c9a5, 0xe0ac8a, 0xc68642, 0x8d5a3c, 0x5c3a21], hair: [0x6b3e1e, 0x222222, 0xe8c36a, 0xa33a1e, 0x8a5a2b, 0xd7ccc8, 0xff3dd6, 0x3d8bfd, 0x7a3cff], hairStyle: ["long", "short", "ponytail", "curly", "bun"], eyes: [0x3b6ea5, 0x4a8f3f, 0x6b3e1e, 0x8e44ad, 0x222222], shirt: [0xff3dd6, 0x3d8bfd, 0x00c853, 0xffd54a, 0x7a3cff, 0xff7043, 0xffffff, 0x222244, 0xe53935], pants: [0x3d8bfd, 0x222244, 0xff3dd6, 0x8d5a2b, 0x00c853, 0xeeeeee], shoes: [0xffffff, 0x222222, 0xff3dd6, 0x00e5ff, 0xffd54a], mood: ["happy", "excited", "neutral"], hat: [null, "🎀", "🌸", "⭐"] };
const MOOD_LABEL = { happy: "😊 Smile", excited: "😄 Big grin", neutral: "🙂 Calm" }, STYLE_LABEL = { long: "Long", short: "Short", ponytail: "Ponytail", curly: "Curly", bun: "Bun" };
function loadLook() { const d = { shirt: 0x7a3cff, pants: 0x3d8bfd, hairStyle: "ponytail", hair: 0x8a5a2b, eyes: 0x4a8f3f, mood: "happy", skin: 0xffd6b8, shoes: 0xffffff, hat: null }; let other = {}; try { other = JSON.parse(localStorage.getItem("emmy.dumpling.avatar") || localStorage.getItem("emmy.arcade.avatar") || "{}"); } catch {} try { return { ...d, ...other, ...JSON.parse(localStorage.getItem(LOOK_KEY) || "{}") }; } catch { return { ...d, ...other }; } }
let look = loadLook();
const saveLook = () => localStorage.setItem(LOOK_KEY, JSON.stringify(look));
const hex = (c) => "#" + c.toString(16).padStart(6, "0");
function renderLook() {
  const o = $("lookOpts"); o.innerHTML = "";
  const row = (label, key, items, render) => { const r = document.createElement("div"); r.className = "lookrow"; r.innerHTML = `<div class="lbl">${label}</div>`; items.forEach((v) => { const el = render(v); el.classList.toggle("sel", look[key] === v); el.onclick = () => { look[key] = v; saveLook(); town.setAvatar(look); lookPrev && lookPrev.refresh(); SFX.tap(); if (v === "🐔") SFX.bawk(); renderLook(); }; r.appendChild(el); }); o.appendChild(r); };
  const sw = (c) => { const d = document.createElement("div"); d.className = "swatch"; d.style.background = hex(c); return d; };
  const chip = (t) => { const b = document.createElement("button"); b.className = "chip"; b.textContent = t; return b; };
  row("Skin", "skin", LOOK.skin, sw); row("Hair colour", "hair", LOOK.hair, sw); row("Hair style", "hairStyle", LOOK.hairStyle, (v) => chip(STYLE_LABEL[v])); row("Eyes", "eyes", LOOK.eyes, sw);
  row("Expression", "mood", LOOK.mood, (v) => chip(MOOD_LABEL[v])); row("Shirt", "shirt", LOOK.shirt, sw); row("Pants", "pants", LOOK.pants, sw); row("Shoes", "shoes", LOOK.shoes, sw);
  row("Hat (buy more at Ted's!)", "hat", [...LOOK.hat, ...state.hats, ...(state.hat ? ["🐔"] : [])], (v) => chip(v === "🐔" ? "🐔 Chicken Hat" : v || "None"));
}
let lookPrev = null;
function startLookPreview() {
  const stage = $("lookPreview"); stage.innerHTML = ""; const r = stage.getBoundingClientRect(); const W = Math.max(100, r.width), H = Math.max(100, r.height);
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true }); renderer.setPixelRatio(Math.min(2, devicePixelRatio || 1)); renderer.setSize(W, H); renderer.domElement.style.cssText = "width:100%;height:100%;display:block"; stage.appendChild(renderer.domElement);
  const scene = new THREE.Scene(); scene.add(new THREE.HemisphereLight(0xffffff, 0x806070, 1.3)); const d = new THREE.DirectionalLight(0xffffff, 1.3); d.position.set(2, 4, 3); scene.add(d);
  const camera = new THREE.PerspectiveCamera(35, W / H, 0.1, 50); camera.position.set(0, 1.25, 3.6); camera.lookAt(0, 1.05, 0);
  let kid = null; const setKid = () => { if (kid) scene.remove(kid.group); kid = makeKid(look); scene.add(kid.group); };
  setKid(); let raf = 0, t = 0, last = performance.now(); const frame = (now) => { raf = requestAnimationFrame(frame); const dt = Math.min(0.05, (now - last) / 1000); last = now; t += dt; kid.group.rotation.y = Math.sin(t * 0.7) * 0.5; kid.walk(t, 0, dt); renderer.render(scene, camera); }; raf = requestAnimationFrame(frame);
  lookPrev = { refresh: setKid, stop() { cancelAnimationFrame(raf); renderer.dispose(); stage.innerHTML = ""; } };
}
function openLook() { if (opener || glow) return; SFX.tap(); renderLook(); openModal("lookModal"); startLookPreview(); }
$("lookBtn").onclick = openLook;

// ---- start over (asks first, in-page) ----
$("resetBtn").onclick = () => { if (opener || glow || job) return; SFX.tap(); openModal("resetModal"); };
$("resetYes").onclick = () => { localStorage.removeItem(SAVE_KEY); location.reload(); };

// --------------------------------------------------------------------------
//  Doors — a quick fade while you step inside / back out
// --------------------------------------------------------------------------
let fading = false;
function useDoor(id, dir) {
  if (fading || opener || glow) return; fading = true; town.pause(true); SFX.door(); $("fade").classList.add("show");
  setTimeout(() => {
    if (dir === "in") town.enter(id); else town.exit();
    $("fade").classList.remove("show"); fading = false; if (!modalOpen && !opener && !glow) town.pause(false);
    if (dir === "in" && id === "home") { const l = `Home sweet home, ${myName()}! Your whole collection lives on these shelves.`; toast(`🏠 ${l}`, 3000); }
  }, 260);
}
// the shopkeeper says hi as you walk in
function greetOnEnter(id) {
  const K = KEEPERS[id]; if (!K) return; const first = !state.met[id]; state.met[id] = 1; save();
  const line = first ? pick(K.hi)(myName()) : pick([(n) => `Welcome back, ${n}!`, (n) => `Hi again, ${n}!`, (n) => `${n}! You're back!`, ...K.hi])(myName());
  setTimeout(() => { if (town.area === id && !opener && !glow) keeperSay(id, line); }, 500);
}

// --------------------------------------------------------------------------
//  🎵 Music — a bouncy generated loop
// --------------------------------------------------------------------------
let musicOn = localStorage.getItem(MUSIC_KEY) !== "0", musicTimer = 0, musicStep = 0, musicNext = 0;
const MEL = [0, 4, 7, 12, 7, 4, 9, 7, 5, 9, 12, 9, 7, -1, 4, -1, 0, 4, 7, 12, 14, 12, 9, 7, 5, 4, 2, 4, 0, -1, -1, -1];
const BASS = [0, 0, 5, 5, 7, 7, 0, 0];
function musicTick() {
  if (!musicOn || muted) return; const ctx = ac(), beat = 60 / 116 / 2;
  if (musicNext < ctx.currentTime) musicNext = ctx.currentTime + 0.05;
  while (musicNext < ctx.currentTime + 0.3) {
    const when = musicNext - ctx.currentTime, n = MEL[musicStep % MEL.length];
    if (n >= 0) tone(523 * Math.pow(2, n / 12), beat * 1.4, { type: "triangle", vol: 0.03, when });
    if (musicStep % 4 === 0) tone(131 * Math.pow(2, BASS[(musicStep / 4) % BASS.length] / 12), beat * 3, { type: "sine", vol: 0.05, when });
    if (musicStep % 2 === 1) noise(0.04, { vol: 0.012, f0: 8000, f1: 5000, type: "highpass", when });
    musicStep++; musicNext += beat;
  }
}
function setMusicLabel() { $("musicBtn").style.opacity = musicOn ? 1 : 0.45; }
$("musicBtn").onclick = () => { musicOn = !musicOn; localStorage.setItem(MUSIC_KEY, musicOn ? "1" : "0"); setMusicLabel(); SFX.tap(); };
setMusicLabel();
const startMusic = () => { if (!musicTimer) musicTimer = setInterval(musicTick, 120); };
window.addEventListener("pointerdown", startMusic, { once: true }); window.addEventListener("keydown", startMusic, { once: true });
setInterval(() => { if (state.speedUntil && Date.now() > state.speedUntil) { state.speedUntil = 0; save(); town && town.setSpeedBoost(1); toast("🌭 Your super-speedy legs wore off. More hot dogs at Bulk-O-Rama!"); } }, 1000);

// --------------------------------------------------------------------------
//  The town
// --------------------------------------------------------------------------
function interact(it) {
  if (!it || opener || glow || job || modalOpen || fading) return;
  if (it.kind === "door") { useDoor(it.door, "in"); return; }
  SFX.tap();
  if (it.id === "mirror") openLook();
  else if (it.id === "book") openBook();
  else if (it.id === "name") openName(false);
  else if (it.id === "samples") freeSample();
  else if (it.id === "bins") scoopBins();
  else if (it.id === "tradein") openTradeIn();
  else if (it.id === "hats") openHats();
  else if (it.id === "spa") openSpa();
  else if (it.id === "stock") openStockInfo();
  else if (it.id === "yard") openYard();
  else if (it.id === "bulk" && state.savedBags) openSaved();
  else openShop(it.id);
}
function openSaved() {
  const n = state.savedBags; $("shopBody").innerHTML = `<h2>🛒 Bulk-O-Rama Club</h2>${keeperBox("bulk", `${myName()}! You've still got ${n} bag${n > 1 ? "s" : ""} from your Mega Pack. Want to open ${n > 1 ? "them" : "it"}?`)}
    <div class="items"><button class="act btn-purple" id="openSaved">🎁 Open my saved bag${n > 1 ? "s" : ""}</button><button class="act btn-white" id="shopAnyway">🛒 Just shopping</button></div>`;
  $("openSaved").onclick = () => { const left = state.savedBags; state.savedBags = 0; save(); closeModal(); openNext({ bagId: "mega", price: null, left, total: left }); };
  $("shopAnyway").onclick = () => openShop("bulk"); openModal("shopModal");
}
let town = null;
try {
  town = createTown($("view"), { ui: $("hud"), avatar: look, name: state.name, getOwned: () => state.owned, getGlam: () => state.glam,
    onPrompt: (it) => { $("prompt").classList.toggle("show", !!it); if (it) $("interact").textContent = `▶ ${it.label}`; },
    onInteract: interact,
    onDoor: (id, dir) => useDoor(id, dir),
    onArea: (id) => { $("hint").textContent = id === "out" ? "🛍️ Walk through a shop door to go inside • drag to look • tap the ground to walk" : "🚪 Walk back out through the door to leave"; renderPills(); if (id !== "out") greetOnEnter(id); },
    onNear: (n) => { const text = (n.chicken ? pick(ROAD_LINES) : pick(NPC_LINES))(myName()); town.say(n, text); speak(text, n.chicken ? { g: "f", n: 3, pitch: 1.3, rate: 1.1 } : { g: /^(Sam|Leo|Kai|Noah|Max)$/.test(n.name) ? "m" : "f", n: 3 + n.i, pitch: 1.12, rate: 1.05 }); if (n.chicken) SFX.bawk(); },
    onPickup: (what, n, i) => {
      if (what === "coin") { state.coins += n; save(); renderPills(); bump($("coinsPill")); SFX.coin(); }
      else if (what === "henCoin") { addCoins(1); SFX.bawk(); toast(`🐔 ${state.henNames[i] || "Your chicken"} found a coin! Good chicken! (+🪙 1)`, 2200); }
      else if (what === "cart") { renderPills(); bump($("cartsPill")); SFX.rattle(); if (!state.firstCart) { state.firstCart = true; save(); toast("🛒 A stray cart is following you! Push it to the 🛒 Cart Corral in the Bulk-O-Rama parking lot for coins.", 4500); } }
    },
    onCarts: (n) => { const pay = n * 3 + (n >= 5 ? 5 : 0); state.cartsReturned += n; addCoins(pay); flyTo($("coinsPill"), "🪙", n * 2); SFX.cash(); renderPills(); const l = n >= 5 ? `WOW, ${myName()}! ${n} carts at once! Here's a bonus!` : `Thanks for the cart${n > 1 ? "s" : ""}, ${myName()}!`; toast(`🛒 Big Bob: “${l}” +🪙 ${pay}`, 3000); speak(l, KEEPERS.bulk.voice); if (n >= 5) confetti(80); },
    onChickenTap: () => { SFX.bawk(); toast(pick(["🐔 BAWK!", "🐔 Bawk bawk!", "🐔 *happy chicken noises*", "🐔 BAWK?!", "🐔 Cluck cluck!"]), 1200); },
  });
  town.setFlock(state.hens, state.follow); town.setYardEggs(state.yardEggs); if (state.speedUntil > Date.now()) town.setSpeedBoost(1.55);
  town.start();
  town.onPadBack(() => { if (modalOpen) closeModal(); else if (opener) closeOpen(); else if (glow) endGlow(); else if (job) endStock(); });
  town.onPadButton((b) => { if (b === 0 && opener && opener.ctrl.phase === "bag") { opener.ctrl.tear(); return true; } if (b === 0 && job && $("jBanner").style.display !== "none" && $("jAgain")) { $("jAgain").click(); return true; } return false; });
} catch (err) { console.error(err); $("loading").innerHTML = `<div class="d">😢</div>Blind Bag Town needs WebGL (3D) to run on this device.`; }
$("interact").onclick = () => interact(town.nearest());
window.addEventListener("gamepadconnected", () => toast("🎮 Controller connected! Left stick walks, right stick looks, A = shop / tear, B = back.", 4000));

renderPills();
if (town) { $("loading").remove(); if (!state.name) setTimeout(() => openName(true), 400); else setTimeout(() => toast(`👋 Welcome back, ${state.name}!`, 3000), 600); }

// debug/automation hook (used by the Playwright checks)
window.__blindbags = { get town() { return town; }, get state() { return state; }, get opener() { return opener; }, get glow() { return glow; }, CATALOG, BAGS, interact, openShop, buyBag, startBags, viewItem, closeOpen, startGlow, endGlow, finishGlow, openBook, openSpa, useDoor, freeSample, openTradeIn, openYard, startStock, endStock, get job() { return job; } };
