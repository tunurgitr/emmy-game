// ==========================================================================
//  Emmy's Dumpling Town — hub. Walk round the market square (third-person),
//  buy mystery bamboo steamers, lift the lid to see which squishy dumpling
//  you got, squish it (slow rise!), pull it apart to see the filling, fill
//  your shelf, swap extras for coins… and buy a chicken. Or ten.
// ==========================================================================
import { createTown } from "./dumpling3d/town.js";
import { createTable } from "./dumpling3d/table.js";
import { createCatch } from "./dumpling3d/catch.js";
import { CATALOG, RARITY, FLAVOURS, byId, buildDumpling, CHICKEN_COLORS } from "./dumpling3d/models.js";
import { THREE, makeKid } from "./arcade3d/lib.js";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";

const $ = (id) => document.getElementById(id);
const pick = (a) => a[Math.floor(Math.random() * a.length)];
const SAVE_KEY = "emmy.dumpling.save.v1", LOOK_KEY = "emmy.dumpling.avatar";
const MAX_HENS = 10;

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
// filtered noise — squelches, steam and tearing dough
function noise(dur, { vol = 0.2, f0 = 800, f1 = 300, q = 1, type = "lowpass", when = 0, attack = 0.02 } = {}) {
  if (muted) return;
  try { const ctx = ac(); if (!noiseBuf) { noiseBuf = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate); const d = noiseBuf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1; }
    const t0 = ctx.currentTime + when, src = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain(); src.buffer = noiseBuf; f.type = type; f.Q.value = q; f.frequency.setValueAtTime(f0, t0); f.frequency.exponentialRampToValueAtTime(Math.max(30, f1), t0 + dur);
    g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(vol, t0 + attack); g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur); src.connect(f).connect(g).connect(ctx.destination); src.start(t0, Math.random()); src.stop(t0 + dur + 0.05); } catch {}
}
const SFX = {
  tap: () => tone(520, 0.07, { type: "triangle", vol: 0.14 }),
  squish: () => { noise(0.45, { vol: 0.35, f0: 1400, f1: 220, q: 3 }); tone(190, 0.3, { vol: 0.12, slideTo: 90 }); },
  unsquish: () => noise(1.4, { vol: 0.08, f0: 180, f1: 700, q: 2, attack: 0.3 }),
  whoosh: () => { noise(0.9, { vol: 0.25, f0: 3000, f1: 500, type: "bandpass", q: 0.7 }); tone(300, 0.3, { type: "triangle", vol: 0.06, slideTo: 700 }); },
  pop: () => { tone(420, 0.09, { vol: 0.22, slideTo: 900 }); noise(0.08, { vol: 0.12, f0: 2500, f1: 900, type: "bandpass" }); },
  tear: () => { for (let i = 0; i < 5; i++) noise(0.07, { vol: 0.12, f0: 1800, f1: 600, type: "bandpass", q: 2, when: i * 0.05 }); noise(0.5, { vol: 0.18, f0: 900, f1: 200, q: 4, when: 0.1 }); },
  coin: () => { tone(988, 0.06, { type: "square", vol: 0.08 }); tone(1319, 0.12, { type: "square", vol: 0.08, when: 0.06 }); },
  buy: () => { tone(880, 0.08, { type: "square", vol: 0.1 }); tone(1320, 0.1, { type: "square", vol: 0.1, when: 0.07 }); },
  ding: () => { tone(880, 0.1, { type: "triangle", vol: 0.16 }); tone(1320, 0.14, { type: "triangle", vol: 0.16, when: 0.08 }); },
  win: () => [523, 659, 784, 1047, 1319].forEach((f, i) => tone(f, 0.2, { type: "triangle", vol: 0.18, when: i * 0.08 })),
  wow: () => { [523, 659, 784, 1047, 1319, 1568, 2093].forEach((f, i) => tone(f, 0.25, { type: "triangle", vol: 0.18, when: i * 0.07 })); noise(1.2, { vol: 0.08, f0: 6000, f1: 2000, type: "highpass", when: 0.2 }); },
  error: () => tone(160, 0.15, { type: "square", vol: 0.1 }),
  bawk: () => { const b = 520 + Math.random() * 120; tone(b, 0.07, { type: "square", vol: 0.09, slideTo: b * 1.5 }); tone(b * 1.3, 0.22, { type: "sawtooth", vol: 0.08, when: 0.08, slideTo: b * 0.8 }); tone(b * 1.1, 0.09, { type: "square", vol: 0.06, when: 0.33, slideTo: b * 1.4 }); },
  egg: () => { tone(660, 0.08, { type: "triangle", vol: 0.14 }); tone(990, 0.12, { type: "triangle", vol: 0.14, when: 0.07 }); },
  cash: () => [784, 988, 1175, 1568].forEach((f, i) => tone(f, 0.1, { type: "square", vol: 0.08, when: i * 0.06 })),
  door: () => { tone(330, 0.12, { type: "triangle", vol: 0.12 }); tone(494, 0.16, { type: "triangle", vol: 0.12, when: 0.1 }); noise(0.25, { vol: 0.05, f0: 1200, f1: 400 }); },
};
function setMuteLabel() { $("mute").textContent = muted ? "🔇" : "🔊"; }
$("mute").onclick = () => { muted = !muted; localStorage.setItem("emmy.muted", muted ? "1" : "0"); setMuteLabel(); if (!muted) SFX.tap(); };
setMuteLabel();

// --------------------------------------------------------------------------
//  State
// --------------------------------------------------------------------------
function fresh() { return { coins: 100, owned: {}, opened: 0, freeSteamer: true, hens: [], hat: false, pity: 0, squishBonus: 0, peeked: {} }; }
function load() { try { const raw = localStorage.getItem(SAVE_KEY); if (raw) return { ...fresh(), ...JSON.parse(raw) }; } catch {} return fresh(); }
let state = load();
function save() { localStorage.setItem(SAVE_KEY, JSON.stringify(state)); }
const ownedKinds = () => CATALOG.filter((k) => state.owned[k.id]).length;

// mystery steamers — odds are printed in the shop
const STEAMERS = {
  classic: { name: "Bamboo Steamer", ico: "🧺", price: 20, shop: "house", desc: "One mystery squishy dumpling. Which one will it be?", odds: { common: 60, uncommon: 25, rare: 10, super: 4, secret: 0.8, golden: 0.2 } },
  sweet:   { name: "Sweet Steamer", ico: "🍡", price: 40, shop: "cafe", desc: "Fancier dumplings — better odds for Rare and up!", odds: { common: 28, uncommon: 38, rare: 22, super: 9, secret: 2.4, golden: 0.6 } },
  lucky:   { name: "Lucky Lantern Steamer", ico: "🏮", price: 90, shop: "lucky", desc: "Always Rare or better — the best shot at Secret and Golden!", odds: { rare: 60, super: 28, secret: 9, golden: 3 } },
};
const PITY = 8; // every 8th steamer without a Rare-or-better is guaranteed Rare+
function rollRarity(odds) { const entries = Object.entries(odds); let r = Math.random() * entries.reduce((s, [, w]) => s + w, 0); for (const [k, w] of entries) { if ((r -= w) <= 0) return k; } return entries[0][0]; }
function rollKind(type) {
  const S = STEAMERS[type]; let rar = rollRarity(S.odds);
  if (state.pity >= PITY - 1 && RARITY[rar].order < 2) rar = rollRarity({ rare: 70, super: 24, secret: 5, golden: 1 });
  const pool = CATALOG.filter((k) => k.rarity === rar); let k = pool[Math.floor(Math.random() * pool.length)];
  // a gentle nudge toward ones you don't have yet
  if (state.owned[k.id] && Math.random() < 0.5) { const fresh = pool.filter((p) => !state.owned[p.id]); if (fresh.length) k = fresh[Math.floor(Math.random() * fresh.length)]; }
  state.pity = RARITY[rar].order >= 2 ? 0 : state.pity + 1;
  return k;
}

// --------------------------------------------------------------------------
//  UI helpers
// --------------------------------------------------------------------------
let toastT = 0;
function toast(msg, ms = 2800) { const t = $("toast"); t.textContent = msg; t.classList.add("show"); clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove("show"), ms); }
function bump(el) { el.classList.remove("bump"); void el.offsetWidth; el.classList.add("bump"); }
function flyTo(el, glyph, n = 6) { const b = el.getBoundingClientRect(); for (let i = 0; i < Math.min(12, n); i++) { const s = document.createElement("span"); s.className = "fly"; s.textContent = glyph; const sx = innerWidth * (0.35 + Math.random() * 0.3), sy = innerHeight * (0.45 + Math.random() * 0.2); s.style.left = `${sx}px`; s.style.top = `${sy}px`; s.style.setProperty("--dx", `${b.left + b.width / 2 - sx}px`); s.style.setProperty("--dy", `${b.top + b.height / 2 - sy}px`); s.style.animationDelay = `${i * 0.05}s`; document.body.appendChild(s); setTimeout(() => s.remove(), 1300); } }
const cf = $("confetti"), cg = cf.getContext("2d"); let confs = [], cfRaf = 0;
function confetti(n = 120, colors = ["#ff8ac8", "#ffc93c", "#3d8bfd", "#2e9d6a", "#e53935", "#fff"]) {
  cf.width = innerWidth; cf.height = innerHeight;
  for (let i = 0; i < n; i++) confs.push({ x: Math.random() * cf.width, y: -20 - Math.random() * 200, vx: (Math.random() - 0.5) * 120, vy: 150 + Math.random() * 200, r: 4 + Math.random() * 6, c: colors[i % colors.length], a: Math.random() * 6, s: (Math.random() - 0.5) * 8 });
  if (!cfRaf) { let last = performance.now(); const f = (now) => { const dt = Math.min(0.05, (now - last) / 1000); last = now; cg.clearRect(0, 0, cf.width, cf.height); confs = confs.filter((p) => p.y < cf.height + 30); for (const p of confs) { p.x += p.vx * dt; p.y += p.vy * dt; p.a += p.s * dt; cg.save(); cg.translate(p.x, p.y); cg.rotate(p.a); cg.fillStyle = p.c; cg.fillRect(-p.r, -p.r / 2, p.r * 2, p.r); cg.restore(); } if (confs.length) cfRaf = requestAnimationFrame(f); else { cfRaf = 0; cg.clearRect(0, 0, cf.width, cf.height); } }; cfRaf = requestAnimationFrame(f); }
}
function renderPills() {
  $("coinsPill").textContent = `🪙 ${state.coins}`; $("bookPill").textContent = `📖 ${ownedKinds()}/${CATALOG.length}`;
  $("hensPill").style.display = state.hens.length ? "" : "none"; $("hensPill").textContent = `🐔 ${state.hens.length}`;
}
function addCoins(n, why) { state.coins += n; save(); renderPills(); bump($("coinsPill")); if (why) toast(why); }

// --------------------------------------------------------------------------
//  Modals
// --------------------------------------------------------------------------
let modalOpen = null;
function openModal(id) { closeModal(); modalOpen = id; $(id).classList.add("show"); town && town.pause(true); }
function closeModal() { if (!modalOpen) return; if (modalOpen === "lookModal") { lookPrev && lookPrev.stop(); lookPrev = null; town.focusPlayer(false); } $(modalOpen).classList.remove("show"); modalOpen = null; if (town && !table && !game && !fading) town.pause(false); }
document.querySelectorAll("[data-close]").forEach((b) => (b.onclick = () => { SFX.tap(); closeModal(); }));
document.querySelectorAll(".modal").forEach((m) => m.addEventListener("pointerdown", (e) => { if (e.target === m) closeModal(); }));

// ---- shops ----
const oddsHtml = (o) => Object.entries(o).map(([r, w]) => `<div><b style="background:${RARITY[r].color}"></b>${RARITY[r].name}: ${w}%</div>`).join("");
function steamerItem(type) {
  const S = STEAMERS[type], free = type === "classic" && state.freeSteamer;
  return `<div class="item"><div class="ico">${S.ico}</div><h3>${S.name}</h3><div style="font-size:13px;color:var(--muted)">${S.desc}</div><div class="odds">${oddsHtml(S.odds)}</div>
    <button class="act ${free ? "btn-green" : "btn-red"}" data-buy="${type}" ${!free && state.coins < S.price ? "disabled" : ""}>${free ? "🎁 FREE first one!" : `Buy 🪙 ${S.price}`}</button></div>`;
}
const pityNote = () => `<p class="sub">🍀 Lucky meter: ${state.pity}/${PITY - 1} — every ${PITY}th steamer without a Rare is guaranteed Rare or better!</p>`;
function openShop(id) {
  const body = $("shopBody");
  if (id === "house") body.innerHTML = `<h2>🥟 Steamy Dumpling House</h2><div class="keeper">👨‍🍳 <b>Chef Bo:</b> “Fresh from the steamer! Every basket has one squishy dumpling inside — lift the lid to see who you got!”</div><div class="items">${steamerItem("classic")}${steamerItem("sweet")}</div>${pityNote()}`;
  else if (id === "cafe") body.innerHTML = `<h2>🍡 Sweet Mochi Café</h2><div class="keeper">🧁 <b>Mimi:</b> “Our Sweet Steamers have the fanciest dumplings in town. Sprinkles not included… okay, sometimes included.”</div><div class="items">${steamerItem("sweet")}</div>${pityNote()}`;
  else if (id === "lucky") body.innerHTML = `<h2>🏮 Lucky Lantern Shop</h2><div class="keeper">✨ <b>Lin:</b> “These steamers are blessed with extra luck. Always Rare or better — and the Golden ones love to hide in here!”</div><div class="items">${steamerItem("lucky")}${steamerItem("sweet")}</div>${pityNote()}`;
  else if (id === "coop") renderCoop();
  else if (id === "swap") renderSwap();
  if (["house", "cafe", "lucky"].includes(id)) body.querySelectorAll("[data-buy]").forEach((b) => (b.onclick = () => buySteamer(b.dataset.buy)));
  openModal("shopModal");
}
function buySteamer(type) {
  const S = STEAMERS[type]; const free = type === "classic" && state.freeSteamer;
  if (!free && state.coins < S.price) { SFX.error(); toast(`You need 🪙 ${S.price}. Grab coins round the square, collect eggs, or swap extras!`); return; }
  if (free) state.freeSteamer = false; else state.coins -= S.price;
  save(); renderPills(); SFX.buy(); closeModal(); openSteamer(type);
}
let henPick = 0;
function renderCoop() {
  const body = $("shopBody"), full = state.hens.length >= MAX_HENS;
  body.innerHTML = `<h2>🐔 Farmer Fran's Chickens</h2><div class="keeper">🧑‍🌾 <b>Farmer Fran:</b> “${state.hens.length ? `You've got ${state.hens.length} chicken${state.hens.length > 1 ? "s" : ""} following you around! ` : ""}A chicken will follow you <i>everywhere</i>. And sometimes it lays eggs you can collect for coins. Tap one to say hi!”</div>
    <div class="items">
      <div class="item"><div class="ico">🐔</div><h3>A Chicken</h3><div style="font-size:13px;color:var(--muted)">Pick a colour:</div><div class="hencolors">${CHICKEN_COLORS.map((c, i) => `<button data-hen="${i}" class="${i === henPick ? "sel" : ""}" title="${c.name}" style="background:#${c.body.toString(16).padStart(6, "0")}"></button>`).join("")}</div>
        <button class="act btn-red" id="buyHen" ${full || state.coins < 30 ? "disabled" : ""}>${full ? "Conga line is full! 🐔×10" : "Buy 🪙 30"}</button></div>
      <div class="item"><div class="ico">🎩</div><h3>Chicken Hat</h3><div style="font-size:13px;color:var(--muted)">A fancy hat… that is also a chicken. Wear it from 👕 My look.</div>
        <button class="act ${state.hat ? "btn-white" : "btn-red"}" id="buyHat" ${state.hat || state.coins < 15 ? "disabled" : ""}>${state.hat ? "✓ You own it!" : "Buy 🪙 15"}</button></div>
    </div>`;
  body.querySelectorAll("[data-hen]").forEach((b) => (b.onclick = () => { henPick = +b.dataset.hen; SFX.bawk(); renderCoop(); }));
  $("buyHen").onclick = () => { if (state.coins < 30 || state.hens.length >= MAX_HENS) return; state.coins -= 30; state.hens.push(henPick); save(); renderPills(); town.addChicken(henPick); SFX.bawk(); bump($("hensPill")); closeModal(); toast(state.hens.length === 1 ? "🐔 BAWK! Your chicken is following you. Look behind you!" : `🐔 BAWK! That's ${state.hens.length} chickens in your conga line!`, 3500); };
  $("buyHat").onclick = () => { if (state.hat || state.coins < 15) return; state.coins -= 15; state.hat = true; look.hat = "🐔"; saveLook(); town.setAvatar(look); save(); renderPills(); SFX.bawk(); closeModal(); toast("🐔 You're wearing your Chicken Hat! (Swap it any time in 👕 My look.)", 3500); };
  openModal("shopModal");
}
function renderSwap() {
  const body = $("shopBody"); const extras = CATALOG.filter((k) => (state.owned[k.id] || 0) > 1);
  const total = extras.reduce((s, k) => s + RARITY[k.rarity].value * (state.owned[k.id] - 1), 0);
  body.innerHTML = `<h2>🔄 Swap Stand</h2><div class="keeper">🎩 <b>Mr. Swap:</b> “Got doubles? I'll swap your extra dumplings for coins. Don't worry — you always keep at least one of each!”</div>
    ${extras.length ? `<div style="margin-bottom:10px"><button class="act btn-green" id="swapAll">Swap all extras for 🪙 ${total}</button></div>` + extras.map((k) => `<div class="swaprow"><img data-thumb="${k.id}" alt=""><div class="n">${k.name}<small style="color:${RARITY[k.rarity].color}">${RARITY[k.rarity].name} · you have ×${state.owned[k.id]}</small></div><button class="act btn-gold" data-swap="${k.id}">🪙 ${RARITY[k.rarity].value}</button></div>`).join("") : `<p class="sub">No extras yet! When you get the same dumpling twice, bring the spare here.</p>`}`;
  body.querySelectorAll("[data-swap]").forEach((b) => (b.onclick = () => { const k = byId(b.dataset.swap); state.owned[k.id]--; addCoins(RARITY[k.rarity].value); SFX.coin(); renderSwap(); }));
  if ($("swapAll")) $("swapAll").onclick = () => { for (const k of extras) state.owned[k.id] = 1; addCoins(total, `🔄 Swapped for 🪙 ${total}!`); SFX.coin(); flyTo($("coinsPill"), "🪙", 8); renderSwap(); };
  fillThumbs(body); openModal("shopModal");
}

// ---- collection book ----
function renderBook() {
  const have = ownedKinds(); $("bookCount").textContent = `${have} / ${CATALOG.length} found`; $("bookBar").style.width = `${(have / CATALOG.length) * 100}%`;
  $("rarityKey").innerHTML = Object.values(RARITY).map((r) => `<span style="background:${r.color}">${r.name}</span>`).join("");
  const groups = [...Object.entries(FLAVOURS).map(([f, F]) => [F.name, CATALOG.filter((k) => k.flavour === f)]), ["✨ Secret & Golden", CATALOG.filter((k) => !k.flavour)]];
  $("bookBody").innerHTML = groups.map(([title, list]) => `<div class="section">${title} <span style="color:var(--muted);font-size:12px">${list.filter((k) => state.owned[k.id]).length}/${list.length}</span></div><div class="shelf">${list.map((k) => { const n = state.owned[k.id] || 0; return n
    ? `<div class="slot" style="--rc:${RARITY[k.rarity].color}" data-play="${k.id}"><img data-thumb="${k.id}" alt=""><div class="nm">${k.name}</div>${n > 1 ? `<div class="ct">×${n}</div>` : ""}</div>`
    : `<div class="slot locked" style="--rc:${RARITY[k.rarity].color}55"><div class="q">?</div><div class="nm">${RARITY[k.rarity].name}</div></div>`; }).join("")}</div>`).join("");
  $("bookBody").querySelectorAll("[data-play]").forEach((s) => (s.onclick = () => { SFX.tap(); closeModal(); openTable(s.dataset.play, { fromSteamer: false }); }));
  fillThumbs($("bookBody"));
}
function openBook() { SFX.tap(); renderBook(); openModal("bookModal"); }
$("bookPill").onclick = () => { if (table || game) return; openBook(); };

// ---- 3D thumbnails for the shelf (rendered once, a few per frame) ----
const thumbs = new Map(); let thumbR = null, thumbQ = [], thumbBusy = false;
function fillThumbs(root) { root.querySelectorAll("img[data-thumb]").forEach((img) => { const id = img.dataset.thumb; if (thumbs.has(id)) img.src = thumbs.get(id); else { thumbQ.push(id); } }); pumpThumbs(); }
function pumpThumbs() {
  if (thumbBusy || !thumbQ.length) return; thumbBusy = true;
  if (!thumbR) { const c = document.createElement("canvas"); thumbR = { r: new THREE.WebGLRenderer({ canvas: c, antialias: true, alpha: true, preserveDrawingBuffer: true }) }; thumbR.r.setSize(160, 160, false); thumbR.r.toneMapping = THREE.ACESFilmicToneMapping; thumbR.env = new THREE.PMREMGenerator(thumbR.r).fromScene(new RoomEnvironment(), 0.04).texture;
    const s = new THREE.Scene(); s.environment = thumbR.env; s.environmentIntensity = 0.6; s.add(new THREE.HemisphereLight(0xfff6ee, 0x6b4a33, 0.6)); const d = new THREE.DirectionalLight(0xfff0dd, 2.2); d.position.set(2, 5, 4); s.add(d); thumbR.scene = s; thumbR.cam = new THREE.PerspectiveCamera(32, 1, 0.1, 50); thumbR.cam.position.set(0, 2.6, 5.4); thumbR.cam.lookAt(0, 0.45, 0); }
  requestAnimationFrame(() => {
    for (let n = 0; n < 4 && thumbQ.length; n++) { const id = thumbQ.shift(); if (thumbs.has(id)) continue; const g = buildDumpling(id); g.rotation.y = -0.35; thumbR.scene.add(g); thumbR.r.render(thumbR.scene, thumbR.cam); thumbs.set(id, thumbR.r.domElement.toDataURL()); thumbR.scene.remove(g); g.traverse((o) => { if (o.geometry) o.geometry.dispose(); if (o.material) o.material.dispose(); });
      document.querySelectorAll(`img[data-thumb="${id}"]`).forEach((img) => (img.src = thumbs.get(id))); }
    thumbBusy = false; pumpThumbs();
  });
}

// --------------------------------------------------------------------------
//  The play table — steamer reveal, squishing and peeking inside
// --------------------------------------------------------------------------
let table = null; // { ctrl, kind, type, isNew, squishes }
function openSteamer(type) {
  const k = rollKind(type); const isNew = !state.owned[k.id];
  state.owned[k.id] = (state.owned[k.id] || 0) + 1; state.opened++; save(); renderPills(); // saved now so closing the tab never loses it
  openTable(k.id, { fromSteamer: true, type, isNew });
}
function openTable(id, { fromSteamer, type = null, isNew = false }) {
  const k = byId(id); if (game) endCatch(); closeModal(); town.pause(true);
  table = { kind: k, type, isNew, squishes: 0, fromSteamer };
  const ctrl = createTable(id, town.envMap, { fromSteamer, sfx: SFX,
    onReveal: () => reveal(), onPhase: () => {},
    onSquish: () => { table.squishes++; if (table.fromSteamer && table.squishes <= 3) { addCoins(1); flyTo($("coinsPill"), "🪙", 1); } },
    onOpen: (fill) => { $("tFill").style.display = "block"; $("tFill").textContent = `Inside: ${fill.name}! ✨`; if (!state.peeked[k.id]) { state.peeked[k.id] = 1; const bonus = fill.extra === "coin" ? 25 : 3; addCoins(bonus, fill.extra === "coin" ? "🪙 A lucky coin was hiding inside! +25" : `👀 First peek inside! +${bonus} coins`); } if (fill.extra === "chick") { SFX.bawk(); } } });
  table.ctrl = ctrl; town.setOverride(ctrl);
  $("hud").classList.add("attable"); $("tableHud").classList.add("show"); $("tFill").style.display = "none"; $("tCard").classList.remove("show");
  if (fromSteamer) { $("tTip").style.display = ""; $("tTip").textContent = "♨️ Tap the steamer to lift the lid!"; $("tButtons").innerHTML = ""; }
  else reveal(true);
}
function reveal(quiet = false) {
  const { kind: k, isNew, type } = table; const R = RARITY[k.rarity];
  $("tTip").style.display = "none";
  const card = $("tCard"); card.style.setProperty("--rc", R.color);
  card.innerHTML = `${isNew ? `<div class="newb">NEW!</div>` : ""}<span class="rar">${R.name}</span><h2>${k.name}</h2><div class="meta">${quiet ? `On your shelf ×${state.owned[k.id] || 1}` : isNew ? `#${ownedKinds()} of ${CATALOG.length} found!` : `You have ×${state.owned[k.id]} — swap extras at the 🔄 Swap Stand`}</div>${k.blurb ? `<div class="blurb">${k.blurb}</div>` : ""}<div class="blurb">🤏 Press & hold to squish • drag to spin</div>`;
  requestAnimationFrame(() => card.classList.add("show"));
  renderTableButtons();
  if (!quiet) { if (R.order >= 4) { SFX.wow(); confetti(220, k.rarity === "golden" ? ["#ffc93c", "#fff3b0", "#f5a300", "#fff"] : undefined); } else if (R.order >= 2 || isNew) { SFX.win(); if (R.order >= 2) confetti(110); } else SFX.ding(); }
}
function renderTableButtons() {
  const { type } = table, peek = table.ctrl.peeking, S = type && STEAMERS[type];
  $("tButtons").innerHTML = `<button class="act btn-pink" id="tPeek">${peek ? "🥟 Put it back together" : "✂️ Pull it apart!"}</button>${S ? `<button class="act btn-red" id="tAgain" ${state.coins < S.price ? "disabled" : ""}>${S.ico} Another! 🪙 ${S.price}</button>` : ""}<button class="act btn-green" id="tDone">✓ Done</button>`;
  $("tPeek").onclick = () => { const on = !table.ctrl.peeking; table.ctrl.peek(on); if (!on) $("tFill").style.display = "none"; renderTableButtons(); };
  if ($("tAgain")) $("tAgain").onclick = () => { if (state.coins < S.price) { SFX.error(); return; } state.coins -= S.price; save(); renderPills(); SFX.buy(); closeTable(true); openSteamer(type); };
  $("tDone").onclick = () => closeTable();
}
function closeTable(quick = false) {
  if (!table) return; const was = table; town.setOverride(null); try { was.ctrl.dispose(); } catch {} table = null;
  $("hud").classList.remove("attable"); $("tableHud").classList.remove("show"); $("tCard").classList.remove("show"); town.pause(false);
  if (!quick && was.fromSteamer && was.isNew && ownedKinds() === CATALOG.length) { confetti(300); SFX.wow(); toast(`🏆 You found ALL ${CATALOG.length} dumplings! You're a Dumpling Master!`, 6000); }
  else if (!quick && was.fromSteamer) toast(`📖 ${was.kind.name} is on your shelf!`);
}

// --------------------------------------------------------------------------
//  Character customization (same choices as the arcade, plus the Chicken Hat)
// --------------------------------------------------------------------------
const LOOK = { skin: [0xffd6b8, 0xf1c9a5, 0xe0ac8a, 0xc68642, 0x8d5a3c, 0x5c3a21], hair: [0x6b3e1e, 0x222222, 0xe8c36a, 0xa33a1e, 0x8a5a2b, 0xd7ccc8, 0xff3dd6, 0x3d8bfd], hairStyle: ["long", "short", "ponytail", "curly", "bun"], eyes: [0x3b6ea5, 0x4a8f3f, 0x6b3e1e, 0x8e44ad, 0x222222], shirt: [0xff3dd6, 0x3d8bfd, 0x00c853, 0xffd54a, 0x7a3cff, 0xff7043, 0xffffff, 0x222244, 0xe53935], pants: [0x3d8bfd, 0x222244, 0xff3dd6, 0x8d5a2b, 0x00c853, 0xeeeeee], shoes: [0xffffff, 0x222222, 0xff3dd6, 0x00e5ff, 0xffd54a], mood: ["happy", "excited", "neutral"], hat: [null, "🎩", "🧢", "👑", "🎀", "🌸", "⭐"] };
const MOOD_LABEL = { happy: "😊 Smile", excited: "😄 Big grin", neutral: "🙂 Calm" }, STYLE_LABEL = { long: "Long", short: "Short", ponytail: "Ponytail", curly: "Curly", bun: "Bun" };
function loadLook() { const d = { shirt: 0xe53935, pants: 0x3d8bfd, hairStyle: "ponytail", hair: 0x8a5a2b, eyes: 0x4a8f3f, mood: "happy", skin: 0xffd6b8, shoes: 0xffffff, hat: null }; let arcade = {}; try { arcade = JSON.parse(localStorage.getItem("emmy.arcade.avatar") || "{}"); } catch {} try { return { ...d, ...arcade, ...JSON.parse(localStorage.getItem(LOOK_KEY) || "{}") }; } catch { return { ...d, ...arcade }; } }
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
  row("Hat", "hat", state.hat ? [...LOOK.hat, "🐔"] : LOOK.hat, (v) => chip(v === "🐔" ? "🐔 Chicken Hat" : v || "None"));
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
function openLook() { if (table || game) return; SFX.tap(); renderLook(); openModal("lookModal"); startLookPreview(); }
$("lookBtn").onclick = openLook;

// ---- start over (asks first, in-page) ----
$("resetBtn").onclick = () => { if (table || game || job) return; SFX.tap(); openModal("resetModal"); };
$("resetYes").onclick = () => { localStorage.removeItem(SAVE_KEY); location.reload(); };

// --------------------------------------------------------------------------
//  Doors — a quick fade while you step inside / back out
// --------------------------------------------------------------------------
let fading = false;
const SHOP_NAMES = { house: "Steamy Dumpling House", cafe: "Sweet Mochi Café", lucky: "Lucky Lantern Shop", coop: "Farmer Fran's Barn", dress: "Dress-Up Boutique", swap: "Swap Shop", home: "your house" };
function useDoor(id, dir) {
  if (fading || table || game) return; fading = true; town.pause(true); SFX.door(); $("fade").classList.add("show");
  setTimeout(() => {
    if (dir === "in") town.enter(id); else town.exit();
    $("fade").classList.remove("show"); fading = false; if (!modalOpen && !table && !game) town.pause(false);
    if (dir === "in") toast(id === "home" ? "🏠 Home sweet home! Your dumplings live on these shelves." : `👋 Welcome to ${SHOP_NAMES[id]}!`, 2200);
  }, 260);
}

// --------------------------------------------------------------------------
//  🛵 Dumpling Delivery — a 90-second job: race round town handing steamers
//  to townsfolk. Every delivery pays, and quick ones earn a tip.
// --------------------------------------------------------------------------
const SHIFT = 90;
let job = null; // { time, delivered, earned, npc, orderAt, tick }
function startDelivery() {
  if (job || table || game) return; closeModal(); SFX.buy();
  job = { time: SHIFT, delivered: 0, earned: 0, npc: null, orderAt: SHIFT, last: performance.now() };
  fading = true; town.pause(true); $("fade").classList.add("show");
  setTimeout(() => { if (town.area !== "out") town.goOutsideTo("house"); $("fade").classList.remove("show"); fading = false; town.pause(false); nextOrder(); toast("🛵 Deliver the steamer! Follow the arrow over your head to the person with the 🥟 bubble.", 3500); }, 260);
  $("jobHud").classList.add("show"); document.body.classList.add("onjob");
  job.tick = setInterval(() => {
    if (!job) return; const now = performance.now(), dt = (now - job.last) / 1000; job.last = now;
    if (!modalOpen && !table && !game && !fading) job.time -= dt;
    if (job.time <= 0) endDelivery(); else renderJob();
  }, 100);
}
function nextOrder() {
  const p = town.playerPos(), others = town.npcs.filter((n) => n !== job.npc), far = others.filter((n) => Math.hypot(n.x - p.x, n.z - p.z) > 14);
  const n = pick(far.length ? far : others);
  job.npc = n; job.orderAt = job.time; town.setDelivery(n, delivered); renderJob();
}
function delivered(n) {
  if (!job) return; const took = job.orderAt - job.time, tip = Math.max(0, Math.round(8 - took / 2.5)), pay = 6 + tip;
  job.delivered++; job.earned += pay; addCoins(pay); flyTo($("coinsPill"), "🪙", 4); SFX.cash();
  toast(`🥟 ${n.name}: “${pick(["Yum, thank you!", "Wow, still steamy!", "You're the best!", "That was SO fast!", "Dumpling time!"])}” +${pay}${tip ? ` (${tip} tip!)` : ""}`, 2400);
  nextOrder();
}
function renderJob() { if (job) $("jobText").textContent = `🛵 Deliver to ${job.npc ? job.npc.name : "…"}! ⏱ ${Math.ceil(job.time)}s · 📦 ${job.delivered} · 🪙 +${job.earned}`; }
function endDelivery(quit = false) {
  if (!job) return; const j = job; clearInterval(j.tick); job = null; town.setDelivery(null); $("jobHud").classList.remove("show"); document.body.classList.remove("onjob");
  state.bestDeliveries = Math.max(state.bestDeliveries || 0, j.delivered); save();
  if (quit) { toast(`🛵 Shift ended early — you delivered ${j.delivered} and earned 🪙 ${j.earned}.`, 3500); return; }
  if (j.delivered >= 5) confetti(120); SFX.win();
  $("shopBody").innerHTML = `<h2>🛵 Shift over!</h2><div class="keeper">👨‍🍳 <b>Chef Bo:</b> “${j.delivered >= 8 ? "WOW! You're the fastest delivery kid in town!" : j.delivered >= 4 ? "Great job — the whole town is full of dumplings!" : "Thanks for the help! Practice makes perfect."}”</div>
    <p style="font-size:22px;font-weight:900;margin:10px 0">📦 ${j.delivered} deliveries · 🪙 +${j.earned}</p><p class="sub">Your best shift: ${state.bestDeliveries} deliveries</p>
    <div style="display:flex;gap:10px;justify-content:center;flex-wrap:wrap"><button class="act btn-green" id="jobAgain">🛵 Another shift!</button><button class="act btn-blue" id="jobDone">👍 Done</button></div>`;
  $("jobDone").onclick = () => { SFX.tap(); closeModal(); };
  $("jobAgain").onclick = () => { closeModal(); startDelivery(); };
  openModal("shopModal");
}
$("jobQuit").onclick = () => { SFX.tap(); endDelivery(true); };

// --------------------------------------------------------------------------
//  🧺 Dumpling Catch — the booth game
// --------------------------------------------------------------------------
let game = null; // { ctrl }
function showGameBanner(html) { $("gBanner").innerHTML = `<div class="banner">${html}</div>`; $("gBanner").style.display = ""; }
function startCatch() {
  if (table || job || game) { if (job) toast("Finish your delivery first! 🛵"); return; }
  closeModal(); town.pause(true); game = { ctrl: null }; $("hud").classList.add("attable"); $("gameHud").classList.add("show"); $("gTop").textContent = "";
  showGameBanner(`<div class="big">🧺</div><h2>Dumpling Catch!</h2><p>Slide the steamer to catch falling dumplings.<br>🥟 = 1 · ✨ golden = 5 · 🐔 chicken = 3<br>Catch 5 in a row for a combo — but dodge the 🌶️ hot peppers!</p><p class="sub">Drag, or use ← → / A D / the left stick. 45 seconds!</p><div class="row"><button class="act btn-green" id="gStart">▶ Start!</button><button class="act btn-white" id="gBack">🚶 Back to town</button></div>`);
  $("gStart").onclick = runCatch; $("gBack").onclick = endCatch;
}
function runCatch() {
  $("gBanner").style.display = "none"; SFX.whoosh(); if (game.ctrl) { town.setOverride(null); game.ctrl.dispose(); }
  const ctrl = createCatch({ sfx: SFX, pad: town.pad, keys: town.keys, envMap: town.envMap,
    onScore: (score, combo, time, msg) => { $("gTop").innerHTML = `<span>⭐ ${score}</span>${combo >= 2 ? `<span>🔥 ${combo} in a row</span>` : ""}<span>⏱ ${Math.ceil(time)}s</span>`; if (msg) { const m = $("gMsg"); m.textContent = msg; m.classList.remove("pop"); void m.offsetWidth; m.classList.add("pop"); } },
    onEnd: ({ score, best }) => {
      const coins = Math.max(2, Math.round(score * 0.45)), record = score > (state.bestCatch || 0); state.bestCatch = Math.max(state.bestCatch || 0, score); addCoins(coins); flyTo($("coinsPill"), "🪙", 8);
      if (record || score >= 60) confetti(140); SFX.win();
      showGameBanner(`<div class="big">${score >= 80 ? "🏆" : score >= 40 ? "🌟" : "🧺"}</div><h2>${score >= 80 ? "Dumpling Champion!" : score >= 40 ? "Great catching!" : "Nice try!"}</h2><div class="won">⭐ ${score} points → 🪙 +${coins}</div><p>Longest combo: ${best}${record ? " · 🏅 NEW high score!" : ` · High score: ${state.bestCatch}`}</p><div class="row"><button class="act btn-green" id="gAgain">🔁 Play again</button><button class="act btn-white" id="gBack">🚶 Back to town</button></div>`);
      $("gAgain").onclick = runCatch; $("gBack").onclick = endCatch;
    } });
  game.ctrl = ctrl; town.setOverride(ctrl);
}
function endCatch() {
  if (!game) return; if (game.ctrl) { town.setOverride(null); try { game.ctrl.dispose(); } catch {} } game = null;
  $("gameHud").classList.remove("show"); $("hud").classList.remove("attable"); $("gBanner").innerHTML = ""; $("gMsg").textContent = ""; town.pause(false);
}

// --------------------------------------------------------------------------
//  🎵 Music — a gentle generated loop (pentatonic, plucky), on by default
// --------------------------------------------------------------------------
const MUSIC_KEY = "emmy.dumpling.music";
let musicOn = localStorage.getItem(MUSIC_KEY) !== "0", musicTimer = 0, musicStep = 0, musicNext = 0;
const MEL = [0, 2, 4, 7, 9, 7, 4, 2, 0, 4, 7, 12, 9, 7, 4, 2, 4, 7, 9, 12, 14, 12, 9, 7, 9, 7, 4, 2, 4, 2, 0, -1];
const BASS = [0, 0, 5, 5, 7, 7, 5, 5];
function musicTick() {
  if (!musicOn || muted) return; const ctx = ac(), beat = 60 / 104 / 2;
  if (musicNext < ctx.currentTime) musicNext = ctx.currentTime + 0.05;
  while (musicNext < ctx.currentTime + 0.3) {
    const when = musicNext - ctx.currentTime, n = MEL[musicStep % MEL.length];
    if (n >= 0) tone(392 * Math.pow(2, n / 12), beat * 1.6, { type: "triangle", vol: 0.035, when });
    if (musicStep % 4 === 0) tone(98 * Math.pow(2, BASS[(musicStep / 4) % BASS.length] / 12), beat * 3.5, { type: "sine", vol: 0.05, when });
    if (musicStep % 2 === 1) noise(0.04, { vol: 0.012, f0: 8000, f1: 5000, type: "highpass", when });
    musicStep++; musicNext += beat;
  }
}
function setMusicLabel() { $("musicBtn").style.opacity = musicOn ? 1 : 0.45; $("musicBtn").title = musicOn ? "Music on" : "Music off"; }
$("musicBtn").onclick = () => { musicOn = !musicOn; localStorage.setItem(MUSIC_KEY, musicOn ? "1" : "0"); setMusicLabel(); SFX.tap(); };
setMusicLabel();
const startMusic = () => { if (!musicTimer) musicTimer = setInterval(musicTick, 120); };
window.addEventListener("pointerdown", startMusic, { once: true }); window.addEventListener("keydown", startMusic, { once: true });

// --------------------------------------------------------------------------
//  The town
// --------------------------------------------------------------------------
function interact(it) {
  if (!it || table || modalOpen || game || fading) return;
  if (it.kind === "door") { useDoor(it.door, "in"); return; }
  SFX.tap();
  if (it.id === "dress" || it.id === "mirror") openLook();
  else if (it.id === "book") openBook();
  else if (it.id === "delivery") { if (job) toast("You're already on a delivery! 🛵"); else openJobInfo(); }
  else if (it.id === "catch") startCatch();
  else openShop(it.id);
}
function openJobInfo() {
  $("shopBody").innerHTML = `<h2>🛵 Dumpling Delivery</h2><div class="keeper">👨‍🍳 <b>Chef Bo:</b> “Our customers are hungry! Grab a steamer and run it over to them. I'll pay 🪙 6 for every delivery — plus a tip if you're quick!”</div>
    <p class="sub">You have ${SHIFT} seconds. Follow the arrow over your head to the person with the 🥟 bubble.${state.bestDeliveries ? ` Your best: ${state.bestDeliveries} deliveries.` : ""}</p>
    <button class="act btn-green" id="jobGo">🛵 Let's go!</button>`;
  $("jobGo").onclick = startDelivery; openModal("shopModal");
}
let town = null;
try {
  town = createTown($("view"), { ui: $("hud"), avatar: look, getOwned: () => state.owned,
    onPrompt: (it) => { $("prompt").classList.toggle("show", !!it); if (it) $("interact").textContent = `▶ ${it.label}`; },
    onInteract: interact,
    onDoor: (id, dir) => useDoor(id, dir),
    onArea: (id) => { $("hint").textContent = id === "out" ? "🥟 Walk through a shop door to go inside • drag to look • tap the ground to walk" : "🚪 Walk back out through the door to leave"; },
    onPickup: (what, n, golden) => {
      if (what === "coin") { state.coins += n; save(); renderPills(); bump($("coinsPill")); SFX.coin(); }
      else if (what === "laid") { SFX.bawk(); if (n || !state.seenEgg) { state.seenEgg = true; save(); toast(n ? "✨ A chicken laid a GOLDEN egg! Go grab it!" : "🥚 Your chicken laid an egg! Walk over it to collect it.", 3500); } }
      else if (what === "egg") { addCoins(n, golden ? `🌟 Golden egg! +${n} coins` : `🥚 Eggcellent! +${n} coins`); SFX.egg(); }
    },
    onChickenTap: () => { SFX.bawk(); toast(pick(["🐔 BAWK!", "🐔 Bawk bawk!", "🐔 *happy chicken noises*", "🐔 BAWK?!", "🐔 Cluck cluck!"]), 1200); },
  });
  for (const ci of state.hens) town.addChicken(ci, true);
  town.start();
  town.onPadBack(() => { if (modalOpen) closeModal(); else if (table) closeTable(); else if (game) endCatch(); });
  town.onPadButton((b) => {
    if (b !== 0 && b !== 2) return false;
    if (b === 0 && game && $("gBanner").style.display !== "none") { ($("gStart") || $("gAgain"))?.click(); return true; }
    if (b === 0 && table && table.ctrl.phase === "closed") { table.ctrl.openLid(); return true; }
    if (b === 2 && table && table.ctrl.phase === "play") { $("tPeek")?.click(); return true; }
    return false;
  });
} catch (err) { console.error(err); $("loading").innerHTML = `<div class="d">😢</div>Dumpling Town needs WebGL (3D) to run on this device.`; }
$("interact").onclick = () => interact(town.nearest());
window.addEventListener("gamepadconnected", () => toast("🎮 Controller connected! Left stick walks, right stick looks, A = shop / tap, B = back.", 4000));

renderPills();
if (town) { $("loading").remove(); if (state.opened === 0) setTimeout(() => toast("👋 Welcome to Dumpling Town! Walk through the door of the 🥟 Steamy Dumpling House (straight ahead) — your first steamer is FREE!", 5500), 800); }

// debug/automation hook (used by the Playwright checks)
window.__dumplings = { get town() { return town; }, get state() { return state; }, get table() { return table; }, get job() { return job; }, get game() { return game; }, CATALOG, interact, openSteamer, openTable, closeTable, openShop, buySteamer, openBook, useDoor, startDelivery, endDelivery, startCatch, runCatch, endCatch };
