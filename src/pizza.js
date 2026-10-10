// ==========================================================================
//  Emmy's Pizza Plus — hub. A teeny toon pizza plaza: buy mystery bags and
//  pizza boxes at Box-O-Rama, open them, and every one holds a CLICKER GAME
//  (33 of them, from Common to Cheesy Secret). Clickers earn coins for more
//  boxes; every game you own lives in your Game Book and the Game Oven.
// ==========================================================================
import { createTown, SHOPS } from "./pizza3d/town.js";
import { createOpen } from "./pizza3d/open.js";
import { createClicker, fmt, GOALS } from "./pizza3d/clicker.js";
import { CATALOG, RARITIES, RARITY_IDS, BAGS, BAG_IDS, COIN_RATE, byId } from "./pizza3d/games.js";
import { makeBuddy, HATS, LOOK, DEFAULT_LOOK } from "./pizza3d/models.js";
import { THREE, addLights } from "./pizza3d/toon.js";
import { SFX, audio, setMuted, startMusic, music, setMusic } from "./pizza3d/audio.js";

const $ = (id) => document.getElementById(id);
const pick = (a) => a[Math.floor(Math.random() * a.length)];
const SAVE_KEY = "emmy.pizza.save.v1", LOOK_KEY = "emmy.pizza.avatar";

// --------------------------------------------------------------------------
//  Sound toggles (mute is shared with every Emmy game)
// --------------------------------------------------------------------------
function setMuteLabel() { $("mute").textContent = audio.muted ? "🔇" : "🔊"; }
$("mute").onclick = () => { setMuted(!audio.muted); setMuteLabel(); if (!audio.muted) SFX.tap(); };
setMuteLabel();
function setMusicLabel() { $("musicBtn").style.opacity = music.on ? 1 : 0.45; }
$("musicBtn").onclick = () => { setMusic(!music.on); setMusicLabel(); SFX.tap(); };
setMusicLabel();
window.addEventListener("pointerdown", startMusic, { once: true }); window.addEventListener("keydown", startMusic, { once: true });

// --------------------------------------------------------------------------
//  State
// --------------------------------------------------------------------------
function fresh() { return { coins: 30, name: "", owned: {}, games: {}, opened: 0, freeBox: true, pity: 0, met: {}, hats: ["none", "chef"], boost: {}, fizzAt: 0, luck: false, coinFrac: 0, last: null }; }
function load() { try { const raw = localStorage.getItem(SAVE_KEY); if (raw) { const s = { ...fresh(), ...JSON.parse(raw) }; s.owned = s.owned || {}; s.games = s.games || {}; s.boost = s.boost || {}; s.met = s.met || {}; if (!s.hats.includes("chef")) s.hats.push("chef"); return s; } } catch {} return fresh(); }
let state = load();
function save() { try { localStorage.setItem(SAVE_KEY, JSON.stringify(state)); } catch {} }
const ownedCount = () => CATALOG.filter((g) => state.owned[g.id]).length;
const myName = () => state.name || "friend";
const starsOf = (id) => Math.min(5, Math.max(0, (state.owned[id] || 1) - 1));
const boostLeft = (k) => Math.max(0, (state.boost[k] || 0) - Date.now());

// --------------------------------------------------------------------------
//  UI helpers
// --------------------------------------------------------------------------
let toastT = 0;
function toast(msg, ms = 2800) { const t = $("toast"); t.textContent = msg; t.classList.add("show"); clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove("show"), ms); }
function bump(el) { el.classList.remove("bump"); void el.offsetWidth; el.classList.add("bump"); }
function flyTo(el, glyph, n = 6) { const b = el.getBoundingClientRect(); for (let i = 0; i < Math.min(12, n); i++) { const s = document.createElement("span"); s.className = "fly"; s.textContent = glyph; const sx = innerWidth * (0.35 + Math.random() * 0.3), sy = innerHeight * (0.45 + Math.random() * 0.2); s.style.left = `${sx}px`; s.style.top = `${sy}px`; s.style.setProperty("--dx", `${b.left + b.width / 2 - sx}px`); s.style.setProperty("--dy", `${b.top + b.height / 2 - sy}px`); s.style.animationDelay = `${i * 0.05}s`; document.body.appendChild(s); setTimeout(() => s.remove(), 1300); } }
const cf = $("confetti"), cg = cf.getContext("2d"); let confs = [], cfRaf = 0;
const RAINBOW = ["#ff5d8f", "#ffb347", "#ffe066", "#7cffb0", "#6ec6ff", "#b18cff"];
function confetti(n = 120, colors = ["#f2483a", "#ffd23f", "#4dbb5a", "#e8b26a", "#ff86b3", "#fff"]) {
  cf.width = innerWidth; cf.height = innerHeight;
  for (let i = 0; i < n; i++) confs.push({ x: Math.random() * cf.width, y: -20 - Math.random() * 200, vx: (Math.random() - 0.5) * 120, vy: 150 + Math.random() * 200, r: 4 + Math.random() * 6, c: colors[i % colors.length], a: Math.random() * 6, s: (Math.random() - 0.5) * 8, round: Math.random() < 0.4 });
  if (!cfRaf) { let last = performance.now(); const f = (now) => { const dt = Math.min(0.05, (now - last) / 1000); last = now; cg.clearRect(0, 0, cf.width, cf.height); confs = confs.filter((p) => p.y < cf.height + 30); for (const p of confs) { p.x += p.vx * dt; p.y += p.vy * dt; p.a += p.s * dt; cg.save(); cg.translate(p.x, p.y); cg.rotate(p.a); cg.fillStyle = p.c; if (p.round) { cg.beginPath(); cg.arc(0, 0, p.r * 0.7, 0, 7); cg.fill(); } else cg.fillRect(-p.r, -p.r / 2, p.r * 2, p.r); cg.restore(); } if (confs.length) cfRaf = requestAnimationFrame(f); else { cfRaf = 0; cg.clearRect(0, 0, cf.width, cf.height); } }; cfRaf = requestAnimationFrame(f); }
}
const rarChip = (r) => `<span class="rarchip ${RARITIES[r].rainbow ? "rainbow" : ""}" style="--rc:${RARITIES[r].color}">${RARITIES[r].name}</span>`;
function renderPills() {
  $("coinsPill").textContent = `🪙 ${fmt(state.coins)}`; $("gCoins").textContent = `🪙 ${fmt(state.coins)}`; $("bookPill").textContent = `📖 ${ownedCount()}/${CATALOG.length}`;
  $("namePill").textContent = state.name ? `✏️ ${state.name}` : "✏️ My name";
  const b = []; const fm = (ms) => `${Math.floor(ms / 60000)}:${String(Math.floor((ms % 60000) / 1000)).padStart(2, "0")}`;
  if (boostLeft("cheese")) b.push(`🧀×2 ${fm(boostLeft("cheese"))}`); if (boostLeft("hot")) b.push(`🌶️ ${fm(boostLeft("hot"))}`); if (boostLeft("zoom")) b.push(`🥤 ${fm(boostLeft("zoom"))}`); if (state.luck) b.push("🌿 Lucky!");
  $("boostPill").style.display = b.length ? "" : "none"; $("boostPill").textContent = b.join(" · ");
}
function addCoins(n, why) { state.coins += n; save(); renderPills(); bump($("coinsPill")); if (why) toast(why); }
setInterval(() => { renderPills(); if (town) town.setSpeedBoost(boostLeft("zoom") ? 1.6 : 1); }, 1000);

// --------------------------------------------------------------------------
//  Modals
// --------------------------------------------------------------------------
let modalOpen = null;
function openModal(id) { closeModal(true); modalOpen = id; $(id).classList.add("show"); town && town.pause(true); $("hud").classList.add("busy"); }
function closeModal(quiet = false) { if (!modalOpen) return; if (modalOpen === "nameModal" && !state.name) return; if (modalOpen === "lookModal") { lookPrev && lookPrev.stop(); lookPrev = null; } $(modalOpen).classList.remove("show"); modalOpen = null; if (!quiet) unbusy(); }
function unbusy() { if (opener || playing || fading || modalOpen) return; $("hud").classList.remove("busy"); town && town.pause(false); }
document.querySelectorAll("[data-close]").forEach((b) => (b.onclick = () => { SFX.tap(); closeModal(); }));
document.querySelectorAll(".modal").forEach((m) => m.addEventListener("pointerdown", (e) => { if (e.target === m) closeModal(); }));

// ---- your name ----
const SILLY = ["Pepperoni Pal", "Cheesy", "Captain Crust", "Noodle", "Meatball", "Olive", "Sir Slice", "Mozzarella", "Basil", "Pickle", "Calzone", "Dough-Dough"];
const cleanName = (s) => s.replace(/[^\p{L}\p{N} '\-]/gu, "").replace(/\s+/g, " ").trim().slice(0, 14);
function openName(first = false) { $("nameTitle").textContent = first ? "Ciao! What's your name?" : "What should everyone call you?"; $("nameInput").value = state.name; $("nameClose").style.display = first ? "none" : ""; $("nameSave").disabled = !cleanName($("nameInput").value); openModal("nameModal"); setTimeout(() => $("nameInput").focus(), 50); }
$("nameInput").addEventListener("input", () => { $("nameSave").disabled = !cleanName($("nameInput").value); });
$("nameInput").addEventListener("keydown", (e) => { if (e.key === "Enter" && !$("nameSave").disabled) $("nameSave").click(); });
$("nameRandom").onclick = () => { SFX.tap(); $("nameInput").value = pick(SILLY); $("nameSave").disabled = false; };
$("nameSave").onclick = () => { const n = cleanName($("nameInput").value); if (!n) return; const first = !state.name; state.name = n; save(); renderPills(); $("nameModal").classList.remove("show"); modalOpen = null; unbusy(); SFX.win();
  toast(first ? `👋 Benvenuto, ${n}! Your first pizza box is FREE at 📦 Box-O-Rama!` : `👋 Nice to meet you, ${n}!`, 5000); if (first) { confetti(90); setTimeout(() => keeperSay("boxes", `${n}! Over here! Your first box is on the house!`), 900); } };
$("namePill").onclick = () => { if (busyNow()) return; SFX.tap(); openName(false); };
const busyNow = () => !!(opener || playing || fading);

// --------------------------------------------------------------------------
//  Shopkeepers (they all know your name)
// --------------------------------------------------------------------------
const KEEPERS = {
  boxes: { who: "Papa Pepperoni", face: "🍕", hi: [(n) => `${n}! Mamma mia, my favourite customer! Want a mystery box?`, (n) => `Ciao ${n}! Every box has a game inside. Which one? It's a MYSTERY!`, (n) => `${n}! I put a Cheesy Secret in one of these boxes. Maybe. Probably. I forget!`, (n) => `Hey ${n}! The Golden Crate is so shiny I can see my moustache in it!`] },
  toppings: { who: "Mozzy", face: "🐭", hi: [(n) => `Squeak! Hi ${n}! Toppings make EVERYTHING better. Even clicker games!`, (n) => `${n}! Double Cheese makes all your points double. I eat it for breakfast.`, (n) => `Hi ${n}! Lucky Basil smells like good luck. And basil.`, (n) => `${n}! I'm a mouse who sells cheese. It's the dream!`] },
  soda: { who: "Fizz", face: "🥤", hi: [(n) => `Fizz fizz! Hi ${n}! Want a free soda? It's on the house!`, (n) => `${n}! Today's flavour is… surprise! It's always surprise.`, (n) => `Hey ${n}! Zoomy Soda makes your legs go zoom!`, (n) => `Bubble bubble, hi ${n}! I'm full of fizz today!`] },
  oven: { who: "Granny Garlic", face: "🧄", hi: [(n) => `Hello dearie ${n}! Your games are all warm and toasty in my oven.`, (n) => `${n}, sweetie! Come play a game with Granny!`, (n) => `Oh ${n}! You've grown! Have a garlic knot. Have two!`, (n) => `My favourite grandkid, ${n}! Don't tell the others.`] },
  hats: { who: "Sir Meatball", face: "🧆", hi: [(n) => `Good day, ${n}! A fine head deserves a fine hat!`, (n) => `${n}! The Pizza Box Hat is very fashionable this season.`, (n) => `Ahem! Sir Meatball, at your service, ${n}!`, (n) => `${n}! Try on a hat. Try on ALL the hats!`] },
};
function keeperSay(id, text) { const K = KEEPERS[id]; town && town.say(id, text); if (K) toast(`${K.face} ${K.who}: “${text}”`, 4200); }
const keeperBox = (id, text) => { const K = KEEPERS[id]; return `<div class="keeper"><span class="face">${K.face}</span><div><b>${K.who}:</b> “${text}”</div></div>`; };
const NPC_LINES = [(n) => `Hi ${n}!`, (n) => `Hey ${n}! Got any new games?`, (n) => `${n}! I heard there's a Cheesy Secret game!`, (n) => `Ooh hi ${n}! Love your hat!`, (n) => `${n}! Have you tried the Cheese Fountain? Don't drink it.`, (n) => `Ciao ${n}!`, (n) => `Hi ${n}! I just got the Angry Anchovy. It's SO grumpy!`];
const PIGEON_LINES = [(n) => `Coo! ${n}! Got any crust?`, (n) => `Coo coo. Hi ${n}. I'm Gary.`, (n) => `${n}! The seagulls are my cousins. Don't tell anyone.`];

// --------------------------------------------------------------------------
//  Mystery bags & boxes
// --------------------------------------------------------------------------
const PITY = 8;
function rollRarity(odds) { const e = Object.entries(odds); let r = Math.random() * e.reduce((s, [, w]) => s + w, 0); for (const [k, w] of e) if ((r -= w) <= 0) return k; return e[0][0]; }
function rollGame(bagId) {
  let rar = rollRarity(BAGS[bagId].odds);
  if ((state.pity >= PITY - 1 || state.luck) && RARITIES[rar].order < 2) rar = rollRarity({ rare: 60, epic: 25, legendary: 10, mythic: 4, secret: 1 });
  const pool = CATALOG.filter((g) => g.rar === rar); let g = pick(pool);
  if (state.owned[g.id] && Math.random() < 0.6) { const fresh = pool.filter((p) => !state.owned[p.id]); if (fresh.length) g = pick(fresh); } // a gentle nudge toward new ones
  state.pity = RARITIES[g.rar].order >= 2 ? 0 : state.pity + 1; state.luck = false;
  return g;
}
const oddsHtml = (odds) => Object.entries(odds).map(([r, w]) => `<div><b style="background:${RARITIES[r].rainbow ? "linear-gradient(90deg,#ff5d8f,#ffe066,#6ec6ff)" : RARITIES[r].color}"></b>${RARITIES[r].name}<span>${w}%</span></div>`).join("");
function openShop(id) {
  const body = $("shopBody"), K = KEEPERS[id], greet = pick(K.hi)(myName()); town && town.say(id, greet);
  if (id === "boxes") {
    body.innerHTML = `<h2>📦 Box-O-Rama</h2>${keeperBox(id, greet)}<div class="items">${BAG_IDS.map((b) => { const B = BAGS[b], free = state.freeBox && b === "box";
      return `<div class="item"><div class="ico">${B.ico}</div><h3>${B.name}</h3><div class="desc">${B.desc}</div><div class="odds">${oddsHtml(B.odds)}</div><button class="act ${free ? "b-green" : "b-red"}" data-buy="${b}" ${!free && state.coins < B.price ? "disabled" : ""}>${free ? "🎁 FREE first box!" : `Buy 🪙 ${B.price}`}</button></div>`; }).join("")}</div>
      <p class="sub" style="margin-top:12px">🍀 Lucky meter: ${state.pity}/${PITY - 1} — after ${PITY - 1} boxes with no Rare, the next one is Rare or better!${state.luck ? " · 🌿 Lucky Basil is ON: your next box is Rare or better!" : ""}<br>Got a game twice? It gets a ⭐ star (+25% points, up to 5) and Papa gives you coins!</p>`;
    body.querySelectorAll("[data-buy]").forEach((b) => (b.onclick = () => buyBag(b.dataset.buy)));
  } else if (id === "toppings") {
    const T = [["cheese", "🧀", "Double Cheese", "Every clicker game earns DOUBLE points for 3 minutes!", 25], ["hot", "🌶️", "Hot Sauce Helpers", "Your auto-helpers work 3× faster for 3 minutes!", 30], ["luck", "🌿", "Lucky Basil", "Your next box is guaranteed Rare or better!", 20]];
    body.innerHTML = `<h2>🧀 Topping Tower</h2>${keeperBox(id, greet)}<div class="items">${T.map(([k, ico, name, desc, price]) => { const on = k === "luck" ? state.luck : boostLeft(k) > 0;
      return `<div class="item ${on ? "on" : ""}"><div class="ico">${ico}</div><h3>${name}</h3><div class="desc">${desc}</div><button class="act b-gold" data-top="${k}" data-price="${price}" ${state.coins < price || (k === "luck" && on) ? "disabled" : ""}>${on ? (k === "luck" ? "✓ Ready!" : `+3 min · 🪙 ${price}`) : `Buy 🪙 ${price}`}</button></div>`; }).join("")}</div>`;
    body.querySelectorAll("[data-top]").forEach((b) => (b.onclick = () => { const k = b.dataset.top, p = +b.dataset.price; if (state.coins < p) return; state.coins -= p; if (k === "luck") state.luck = true; else state.boost[k] = Math.max(Date.now(), state.boost[k] || 0) + 180000; save(); renderPills(); SFX.buy(); confetti(50, ["#ffd23f", "#4dbb5a", "#f2483a"]); keeperSay("toppings", pick([`Enjoy, ${myName()}! Squeak!`, `Ooh, good choice, ${myName()}!`, `That'll make your games SO cheesy, ${myName()}!`])); openShop("toppings"); }));
  } else if (id === "soda") {
    const wait = Math.max(0, state.fizzAt - Date.now());
    body.innerHTML = `<h2>🥤 Fizzy Pop Soda</h2>${keeperBox(id, greet)}<div class="items">
      <div class="item"><div class="ico">🫧</div><h3>Free Fizz</h3><div class="desc">A free mystery soda! Fizz pays YOU to drink it. (Every minute.)</div><button class="act b-blue" id="fizzFree" ${wait ? "disabled" : ""}>${wait ? `Back in ${Math.ceil(wait / 1000)}s` : "🥤 Free soda!"}</button></div>
      <div class="item ${boostLeft("zoom") ? "on" : ""}"><div class="ico">⚡</div><h3>Zoomy Soda</h3><div class="desc">Your legs go ZOOM for 2 minutes.</div><button class="act b-red" id="fizzZoom" ${state.coins < 5 ? "disabled" : ""}>Buy 🪙 5</button></div></div>`;
    $("fizzFree").onclick = () => { if (state.fizzAt > Date.now()) return; state.fizzAt = Date.now() + 60000; const n = 2 + Math.floor(Math.random() * 4), fl = pick(["Pickle Fizz", "Bubblegum Thunder", "Pizza Pop (it's pizza flavour)", "Purple", "Cloud Juice", "Mystery Mango", "Rainbow Burp", "Extra Fizzy Fizz"]); addCoins(n); flyTo($("coinsPill"), "🪙", n); SFX.fizz(); setTimeout(() => SFX.burp(), 700); keeperSay("soda", `Here's a ${fl}, ${myName()}! And ${n} coins for being awesome!`); openShop("soda"); };
    $("fizzZoom").onclick = () => { if (state.coins < 5) return; state.coins -= 5; state.boost.zoom = Math.max(Date.now(), state.boost.zoom || 0) + 120000; save(); renderPills(); town.setSpeedBoost(1.6); SFX.slurp(); closeModal(); keeperSay("soda", `ZOOM ZOOM, ${myName()}!`); };
  } else if (id === "oven") { closeModal(true); renderBook(); openModal("bookModal"); return; }
  else if (id === "hats") {
    body.innerHTML = `<h2>👒 Hat Hut</h2>${keeperBox(id, greet)}<div class="items">${HATS.filter((h) => h.id !== "none").map((h) => { const own = state.hats.includes(h.id), on = look.hat === h.id;
      return `<div class="item" style="width:150px"><div class="ico">${h.ico}</div><h3>${h.name}</h3><button class="act ${own ? (on ? "b-white" : "b-green") : "b-pink"}" data-hat="${h.id}" ${!own && state.coins < h.price ? "disabled" : ""}>${own ? (on ? "✓ Wearing it" : "Wear it") : `Buy 🪙 ${h.price}`}</button></div>`; }).join("")}
      <div class="item" style="width:150px"><div class="ico">🪞</div><h3>Magic Mirror</h3><button class="act b-purple" id="hatMirror">👕 My look</button></div></div>`;
    body.querySelectorAll("[data-hat]").forEach((b) => (b.onclick = () => { const h = HATS.find((x) => x.id === b.dataset.hat); if (!state.hats.includes(h.id)) { if (state.coins < h.price) return; state.coins -= h.price; state.hats.push(h.id); save(); renderPills(); SFX.buy(); keeperSay("hats", `Splendid! The ${h.name} suits you, ${myName()}!`); } look.hat = h.id; saveLook(); town.setAvatar(look); SFX.tap(); openShop("hats"); }));
    $("hatMirror").onclick = () => { closeModal(true); openLook(); };
  }
  $("shopModal").firstElementChild.classList.toggle("wide", id === "boxes");
  if (modalOpen !== "shopModal") openModal("shopModal");
}
function buyBag(bagId) {
  const B = BAGS[bagId], free = state.freeBox && bagId === "box";
  if (!free && state.coins < B.price) { SFX.error(); toast(`You need 🪙 ${B.price}. Play your clicker games to earn coins!`); return; }
  if (free) state.freeBox = false; else state.coins -= B.price;
  save(); renderPills(); SFX.buy(); closeModal(true);
  keeperSay("boxes", pick([`Good luck, ${myName()}!`, `Ooh, I hope it's a rare one, ${myName()}!`, `Fingers crossed, ${myName()}! Toes too!`, `Open it, open it, ${myName()}!`]));
  startOpen(bagId);
}

// --------------------------------------------------------------------------
//  Opening — tap the box, it pops, and out comes a game token
// --------------------------------------------------------------------------
let opener = null; // { ctrl, game, isNew, bagId, dupeCoins }
function startOpen(bagId) {
  const game = rollGame(bagId), isNew = !state.owned[game.id];
  state.owned[game.id] = (state.owned[game.id] || 0) + 1; state.opened++; let dupeCoins = 0;
  if (!isNew) { dupeCoins = RARITIES[game.rar].dupe; state.coins += dupeCoins; }
  save(); // saved straight away so closing the tab never loses it
  closeModal(true); town.pause(true); $("hud").classList.add("busy");
  const R = RARITIES[game.rar];
  const ctrl = createOpen(game, BAGS[bagId].look, { sfx: SFX, rarity: R, onTap: (n, need) => { $("oTip").textContent = n < need ? `${"👆".repeat(need - n)} Keep tapping!` : "✨"; }, onReveal: () => reveal() });
  opener = { ctrl, game, isNew, bagId, dupeCoins }; town.setOverride(ctrl);
  $("openHud").classList.add("show"); $("oCard").classList.remove("show"); $("oButtons").innerHTML = ""; $("oTip").style.display = ""; $("oTip").textContent = `👆👆👆 Tap the ${BAGS[bagId].name} to open it!`;
}
function reveal() {
  const { game: g, isNew, bagId, dupeCoins } = opener, R = RARITIES[g.rar];
  $("oTip").style.display = "none"; renderPills();
  const card = $("oCard"); card.style.setProperty("--rc", R.color);
  card.innerHTML = `${isNew ? `<div class="newb">NEW!</div>` : ""}<span class="rar ${R.rainbow ? "rainbow" : ""}">${R.name}</span><h2>${g.ico} ${g.name}</h2><div class="meta">${isNew ? `Game #${ownedCount()} of ${CATALOG.length} found!` : `You already had it — it got a ⭐ star! (+🪙 ${dupeCoins} from Papa)`}</div><div class="blurb">${g.blurb}</div>`;
  requestAnimationFrame(() => card.classList.add("show"));
  const B = BAGS[bagId];
  $("oButtons").innerHTML = `<button class="act b-green" id="oPlay">▶ Play it now!</button><button class="act b-red" id="oAgain" ${state.coins < B.price ? "disabled" : ""}>${B.ico} Another! 🪙 ${B.price}</button><button class="act b-white" id="oDone">✓ Back to town</button>`;
  $("oPlay").onclick = () => { const id = g.id; closeOpen(true); playGame(id); };
  $("oAgain").onclick = () => { if (state.coins < B.price) { SFX.error(); return; } state.coins -= B.price; save(); renderPills(); SFX.buy(); closeOpen(true); startOpen(bagId); };
  $("oDone").onclick = () => closeOpen();
  if (R.order >= 5) { SFX.wow(); confetti(R.rainbow ? 380 : 260, R.rainbow ? RAINBOW : undefined); toast(`🤩 WOW! ${R.name}! ${g.name}!`, 3500); }
  else if (R.order >= 3) { SFX.wow(); confetti(170); } else if (R.order >= 2 || isNew) { SFX.win(); if (R.order >= 2) confetti(100); } else SFX.ding();
  if (!isNew) flyTo($("coinsPill"), "🪙", 4);
}
function closeOpen(quick = false) {
  if (!opener) return; const was = opener; town.setOverride(null); try { was.ctrl.dispose(); } catch {} opener = null;
  $("openHud").classList.remove("show"); $("oCard").classList.remove("show"); $("oButtons").innerHTML = ""; unbusy();
  if (quick) return;
  if (was.isNew && ownedCount() === CATALOG.length) { confetti(300, RAINBOW); SFX.wow(); toast(`🏆 You found ALL ${CATALOG.length} games, ${myName()}! You're the Pizza Plus Champion!`, 6000); }
  else toast(`📖 ${was.game.name} is in your Game Book — play it any time!`);
}

// --------------------------------------------------------------------------
//  Playing a clicker game
// --------------------------------------------------------------------------
let playing = null; // { ctrl, game }
function playGame(id) {
  const game = byId(id); if (!game || !state.owned[id]) { toast("You haven't found that game yet! Open boxes at 📦 Box-O-Rama."); return; }
  if (playing) closeGame(true); closeModal(true); if (opener) closeOpen(true);
  const R = RARITIES[game.rar], sv = state.games[id] || (state.games[id] = { pts: 0, total: 0, up: [0, 0, 0], ms: 0 }); state.last = id; save();
  $("game").classList.add("show"); document.body.classList.add("ingame"); $("hud").classList.add("busy"); town.pause(true); town.sleep(true); music.quiet = true;
  $("gTop").style.setProperty("--rcl", R.rainbow ? "linear-gradient(90deg,#ffd6e6,#fff2b0,#d6ffe8,#d6ecff)" : `color-mix(in srgb, ${R.color} 28%, #fff7ea)`); $("gTop").style.background = R.rainbow ? "linear-gradient(90deg,#ffd6e6,#fff2b0,#d6ffe8,#d6ecff)" : "";
  $("gIco").textContent = game.ico; $("gName").textContent = game.name; const st = starsOf(id); $("gSub").innerHTML = `${rarChip(game.rar)} ${st ? "⭐".repeat(st) + ` +${st * 25}%` : ""}`;
  let coinAcc = 0;
  const ctrl = createClicker($("gCanvas"), game, sv, { stars: st,
    boost: () => (boostLeft("cheese") ? 2 : 1), autoBoost: () => (boostLeft("hot") ? 3 : 1),
    onEarn: (v) => { state.coinFrac = (state.coinFrac || 0) + v / COIN_RATE[game.rar]; if (state.coinFrac >= 1) { const n = Math.floor(state.coinFrac); state.coinFrac -= n; state.coins += n; coinAcc += n; } },
    onGoal: (i, msg, coins) => goalReached(game, i, msg, coins),
    onChange: () => renderGameHud() });
  playing = { ctrl, game, coinAcc: () => coinAcc };
  renderGameHud(); renderPills();
  if (!sv.total) setTimeout(() => toast(`${game.ico} ${game.blurb}`, 4500), 300);
}
let hudT = 0;
function renderGameHud() {
  if (!playing) return; const { ctrl, game } = playing, sv = ctrl.save;
  $("gPts").innerHTML = `${fmt(sv.pts)} <small>${game.unit || "points"}</small>`; $("gCoins").textContent = `🪙 ${fmt(state.coins)}`;
  const gi = ctrl.goalInfo(); if (gi.done) { $("gGoalTxt").textContent = "🏆 Every goal done!"; $("gGoalBar").style.width = "100%"; $("gGoalWin").textContent = ""; }
  else { $("gGoalTxt").textContent = `🎯 Goal ${gi.i + 1}: ${fmt(gi.goal)}`; $("gGoalBar").style.width = `${Math.max(0, Math.min(1, gi.frac)) * 100}%`; $("gGoalWin").textContent = `🎁 🪙 ${gi.coins}`; }
  const ups = [0, 1, 2].map((i) => ctrl.upInfo(i));
  const html = ups.map((u, i) => `<button class="up ${u.can ? "" : "no"}" data-up="${i}"><span class="ui">${u.ico}</span><span class="ut"><b>${u.name}${u.lvl ? `<span class="lv">Lv ${u.lvl}</span>` : ""}</b><small>${u.desc}</small></span><span class="uc">${fmt(u.cost)}</span></button>`).join("");
  if ($("gUps").dataset.sig !== html) { $("gUps").innerHTML = html; $("gUps").dataset.sig = html; $("gUps").querySelectorAll("[data-up]").forEach((b) => (b.onclick = () => { if (!ctrl.buy(+b.dataset.up)) { SFX.error(); toast(`Earn more ${game.unit || "points"} first! Keep tapping!`, 1600); } save(); renderGameHud(); })); }
  clearTimeout(hudT); hudT = setTimeout(save, 1500);
}
let popT = 0;
function goalReached(game, i, msg, coins) {
  addCoins(coins); SFX.win(); confetti(90 + i * 20);
  const p = $("gGoalPop"); p.innerHTML = `<h3>🎉 Goal ${i + 1} reached!</h3><p>${msg}</p><div class="won">+🪙 ${coins}</div>`; p.classList.add("show"); clearTimeout(popT); popT = setTimeout(() => p.classList.remove("show"), 3600);
  flyTo($("gCoins"), "🪙", Math.min(10, 3 + i)); save();
}
function closeGame(quick = false) {
  if (!playing) return; const was = playing; try { was.ctrl.dispose(); } catch {} playing = null; save();
  $("game").classList.remove("show"); document.body.classList.remove("ingame"); $("gGoalPop").classList.remove("show"); $("gUps").dataset.sig = ""; town.sleep(false); music.quiet = false; renderPills();
  if (quick) return; unbusy(); const n = was.coinAcc(); if (n > 0) { toast(`🪙 You earned ${n} coin${n > 1 ? "s" : ""} playing ${was.game.name}! Spend them at 📦 Box-O-Rama.`, 3500); bump($("coinsPill")); }
}
$("gBack").onclick = () => { SFX.tap(); closeGame(); };
document.addEventListener("visibilitychange", () => { if (document.hidden) save(); });
window.addEventListener("pagehide", save);

// --------------------------------------------------------------------------
//  The Game Book
// --------------------------------------------------------------------------
function renderBook() {
  const have = ownedCount(); $("bookCount").textContent = `${have} / ${CATALOG.length} games found`; $("bookBar").style.width = `${(have / CATALOG.length) * 100}%`;
  $("rarityKey").innerHTML = RARITY_IDS.map((r) => `<span class="${RARITIES[r].rainbow ? "rainbow" : ""}" style="background:${RARITIES[r].color}">${RARITIES[r].name}</span>`).join("");
  $("bookBody").innerHTML = (have ? "" : `<p class="sub">No games yet! Get your FREE first box at 📦 Box-O-Rama.</p>`) + RARITY_IDS.map((r) => { const list = CATALOG.filter((g) => g.rar === r), R = RARITIES[r];
    return `<div class="rgroup">${rarChip(r)} <span>${list.filter((g) => state.owned[g.id]).length}/${list.length}</span></div><div class="shelf">${list.map((g) => { const n = state.owned[g.id] || 0, st = starsOf(g.id);
      return n ? `<div class="slot" data-play="${g.id}" style="--rc:${R.rainbow ? "#ffc400" : R.color}"><div class="disc">${g.ico}</div><div class="nm">${g.name}</div><div class="st">${"⭐".repeat(st)}</div><span class="pl">▶ Play</span></div>`
        : `<div class="slot locked" style="--rc:${R.color}"><div class="disc">?</div><div class="nm">???</div></div>`; }).join("")}</div>`; }).join("");
  $("bookBody").querySelectorAll("[data-play]").forEach((s) => (s.onclick = () => { SFX.tap(); playGame(s.dataset.play); }));
}
function openBook() { if (busyNow()) return; SFX.tap(); renderBook(); openModal("bookModal"); }
$("bookPill").onclick = openBook;

// --------------------------------------------------------------------------
//  🛵 Quick travel — no long walks in Pizza Plus!
// --------------------------------------------------------------------------
const SHOP_DESC = { boxes: "Mystery bags & boxes", toppings: "Power-ups", soda: "Free soda + zoom", oven: "Play your games", hats: "Hats & your look" };
function openTravel() {
  if (busyNow()) return; SFX.tap();
  $("shopBody").innerHTML = `<h2>🛵 Zoom to…</h2><p class="sub">Hop on the delivery scooter! Where to?</p><div class="trav">${SHOPS.map((S) => `<button data-go="${S.id}"><span>${S.ico}</span>${S.name}<small>${SHOP_DESC[S.id]}</small></button>`).join("")}</div>`;
  $("shopBody").querySelectorAll("[data-go]").forEach((b) => (b.onclick = () => zoomTo(b.dataset.go)));
  $("shopModal").firstElementChild.classList.remove("wide"); openModal("shopModal");
}
let fading = false;
function zoomTo(id, open = true) {
  closeModal(true); fading = true; town.pause(true); SFX.honk(1.2); SFX.whoosh(); $("fade").classList.add("show");
  setTimeout(() => { town.goTo(id); $("fade").classList.remove("show"); fading = false; if (open) { openShop(id); } else unbusy(); }, 280);
}
$("travel").onclick = openTravel;

// --------------------------------------------------------------------------
//  My look (with a little 3D preview)
// --------------------------------------------------------------------------
function loadLook() { try { return { ...DEFAULT_LOOK, ...JSON.parse(localStorage.getItem(LOOK_KEY) || "{}") }; } catch { return { ...DEFAULT_LOOK }; } }
let look = loadLook();
const saveLook = () => { try { localStorage.setItem(LOOK_KEY, JSON.stringify(look)); } catch {} };
const hex = (c) => "#" + c.toString(16).padStart(6, "0");
const STYLE_LABEL = { bob: "Bob", pigtails: "Pigtails", bun: "Bun", short: "Short", long: "Long" };
function renderLook() {
  const o = $("lookOpts"); o.innerHTML = "";
  const row = (label, key, items, render) => { const r = document.createElement("div"); r.className = "lookrow"; r.innerHTML = `<div class="lbl">${label}</div>`; items.forEach((v) => { const el = render(v); el.classList.toggle("sel", look[key] === v); el.onclick = () => { look[key] = v; saveLook(); town.setAvatar(look); lookPrev && lookPrev.refresh(); SFX.tap(); renderLook(); }; r.appendChild(el); }); o.appendChild(r); };
  const sw = (c) => { const d = document.createElement("div"); d.className = "swatch"; d.style.background = hex(c); return d; };
  const chip = (t) => { const b = document.createElement("button"); b.className = "chip"; b.textContent = t; return b; };
  row("Skin", "skin", LOOK.skin, sw); row("Hair colour", "hair", LOOK.hair, sw); row("Hair style", "hairStyle", LOOK.hairStyle, (v) => chip(STYLE_LABEL[v])); row("Shirt", "shirt", LOOK.shirt, sw); row("Pants", "pants", LOOK.pants, sw);
  row("Hat (more at the 👒 Hat Hut!)", "hat", HATS.filter((h) => state.hats.includes(h.id)).map((h) => h.id), (v) => { const h = HATS.find((x) => x.id === v); return chip(`${h.ico} ${h.name}`); });
}
let lookPrev = null;
function startLookPreview() {
  const stage = $("lookPreview"); stage.innerHTML = ""; const r = stage.getBoundingClientRect(); const W = Math.max(100, r.width), H = Math.max(100, r.height);
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true }); renderer.setPixelRatio(Math.min(2, devicePixelRatio || 1)); renderer.setSize(W, H); renderer.outputColorSpace = THREE.SRGBColorSpace; renderer.domElement.style.cssText = "width:100%;height:100%;display:block"; stage.appendChild(renderer.domElement);
  const scene = new THREE.Scene(); addLights(scene); const camera = new THREE.PerspectiveCamera(32, W / H, 0.1, 50); camera.position.set(0, 1.35, 4.4); camera.lookAt(0, 1.0, 0);
  let kid = null; const setKid = () => { if (kid) scene.remove(kid.group); kid = makeBuddy(look); scene.add(kid.group); };
  setKid(); let raf = 0, t = 0, last = performance.now(); const frame = (now) => { raf = requestAnimationFrame(frame); const dt = Math.min(0.05, (now - last) / 1000); last = now; t += dt; kid.group.rotation.y = Math.sin(t * 0.8) * 0.6; kid.walk(t, 0, dt); renderer.render(scene, camera); }; raf = requestAnimationFrame(frame);
  lookPrev = { refresh: setKid, stop() { cancelAnimationFrame(raf); renderer.dispose(); stage.innerHTML = ""; } };
}
function openLook() { if (busyNow()) return; SFX.tap(); renderLook(); openModal("lookModal"); startLookPreview(); }
$("lookBtn").onclick = openLook;

// ---- start over (asks first, in-page) ----
$("resetBtn").onclick = () => { if (busyNow()) return; SFX.tap(); openModal("resetModal"); };
$("resetYes").onclick = () => { localStorage.removeItem(SAVE_KEY); localStorage.removeItem(LOOK_KEY); location.reload(); };

// --------------------------------------------------------------------------
//  The town
// --------------------------------------------------------------------------
function interact(it) {
  if (!it || busyNow() || modalOpen) return; SFX.tap();
  const first = !state.met[it.id]; state.met[it.id] = 1; save();
  openShop(it.id);
  if (first && it.id === "oven") toast("🔥 Granny Garlic keeps all your games warm in here. Tap one to play!", 3500);
}
let town = null;
try {
  town = createTown($("view"), { ui: $("hud"), avatar: look, name: state.name,
    onPrompt: (it) => { $("prompt").classList.toggle("show", !!it); if (it) $("interact").textContent = `▶ ${it.ico} ${it.label}`; },
    onInteract: interact,
    onNear: (f, tapped) => { const text = (f.kind === "pigeon" ? pick(PIGEON_LINES) : pick(NPC_LINES))(myName()); town.say(f, text); if (f.kind === "pigeon") SFX.squawk(); else SFX.squeak(); if (tapped) toast(`${{ pigeon: "🐦", mushroom: "🍄", olive: "🫒", tomato: "🍅" }[f.kind] || "🙂"} ${f.name}: “${text}”`, 2600); },
    onPickup: (what, n) => { if (what === "coin") { state.coins += n; save(); renderPills(); bump($("coinsPill")); SFX.coin(); } },
  });
  town.setSpeedBoost(boostLeft("zoom") ? 1.6 : 1);
  town.start();
} catch (err) { console.error(err); $("loading").innerHTML = `<div class="d">😢</div>Pizza Plus needs WebGL (3D) to run on this device.`; }
$("interact").onclick = () => interact(town.nearest());
window.addEventListener("keydown", (e) => { if (e.key === "Escape") { if (modalOpen) closeModal(); else if (playing) closeGame(); else if (opener && opener.ctrl.phase === "done") closeOpen(); } });

renderPills();
if (town) { $("loading").remove(); if (!state.name) setTimeout(() => openName(true), 400); else setTimeout(() => toast(`👋 Welcome back, ${state.name}! ${state.freeBox ? "Your FREE box is waiting at 📦 Box-O-Rama!" : ""}`, 3200), 600); }

// debug/automation hook (used by the Playwright checks)
window.__pizza = {
  get town() { return town; }, get state() { return state; }, get opener() { return opener; }, get playing() { return playing; }, get game() { return playing && playing.ctrl; },
  CATALOG, RARITIES, BAGS, interact, openShop, buyBag, openBag: startOpen, closeOpen, playGame, closeGame, openBook, openTravel, zoomTo, openLook, save,
};
