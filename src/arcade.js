// ==========================================================================
//  Emmy's Arcade — hub. Walk around the 3D arcade (third-person), step up to
//  a machine to play it in first-person, load your card at the kiosk, buy
//  snacks, work shifts for money (Regular mode) and trade tickets for prizes.
// ==========================================================================
import { createWorld } from "./arcade3d/world.js";
import { wheel, claw, vr, race, laser } from "./arcade3d/games1.js";
import { hockey, fish, skee, mole, hoops } from "./arcade3d/games2.js";
import { pusher, darts, bowling, dance, climb, snackjob, prizejob } from "./arcade3d/games3.js";
import { gallery, hammer, rings, memory, penalty } from "./arcade3d/games4.js";
import { PRIZES, prizeById, playPrize, SNACKS } from "./arcade-prizes.js";
import { THREE, makeKid } from "./arcade3d/lib.js";

const GAMES = [race, claw, vr, wheel, laser, hockey, fish, skee, mole, hoops, pusher, darts, bowling, dance, gallery, hammer, rings, memory, penalty, climb, snackjob, prizejob];
const $ = (id) => document.getElementById(id);
const TICKET_BONUS = 1.5; // generous arcade: every payout ×1.5

// --------------------------------------------------------------------------
//  Sound (Web Audio, generated — shares the mute flag with the trading game)
// --------------------------------------------------------------------------
let audioCtx = null;
let muted = localStorage.getItem("emmy.muted") === "1";
function ac() { if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)(); if (audioCtx.state === "suspended") audioCtx.resume(); return audioCtx; }
function tone(freq, dur = 0.12, { type = "sine", vol = 0.18, when = 0, slideTo = null } = {}) {
  if (muted) return;
  try {
    const ctx = ac(); const t0 = ctx.currentTime + when; const osc = ctx.createOscillator(); const gain = ctx.createGain();
    osc.type = type; osc.frequency.setValueAtTime(Math.max(20, freq), t0); if (slideTo) osc.frequency.exponentialRampToValueAtTime(Math.max(20, slideTo), t0 + dur);
    gain.gain.setValueAtTime(0.0001, t0); gain.gain.exponentialRampToValueAtTime(vol, t0 + 0.01); gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(gain).connect(ctx.destination); osc.start(t0); osc.stop(t0 + dur + 0.02);
  } catch {}
}
function makeSustain(type = "sawtooth") {
  if (muted) return { setFreq() {}, setVol() {}, stop() {} };
  try {
    const ctx = ac(); const osc = ctx.createOscillator(); const gain = ctx.createGain(); osc.type = type; osc.frequency.value = 200; gain.gain.value = 0.0001; osc.connect(gain).connect(ctx.destination); osc.start();
    return { setFreq(f) { osc.frequency.setTargetAtTime(Math.max(20, f), ctx.currentTime, 0.03); }, setVol(v) { gain.gain.setTargetAtTime(Math.max(0.0001, v), ctx.currentTime, 0.03); }, stop() { gain.gain.setTargetAtTime(0.0001, ctx.currentTime, 0.05); setTimeout(() => { try { osc.stop(); } catch {} }, 200); } };
  } catch { return { setFreq() {}, setVol() {}, stop() {} }; }
}
const SFX = {
  tap:    () => tone(520, 0.07, { type: "triangle", vol: 0.14 }),
  pop:    () => tone(400 + Math.random() * 500, 0.06, { type: "sine", vol: 0.2, slideTo: 180 }),
  click:  () => { tone(1200, 0.04, { type: "square", vol: 0.12 }); tone(800, 0.05, { type: "square", vol: 0.1, when: 0.04 }); },
  tick:   () => tone(900 + Math.random() * 200, 0.03, { type: "square", vol: 0.08 }),
  ding:   () => { tone(880, 0.1, { type: "triangle", vol: 0.16 }); tone(1320, 0.14, { type: "triangle", vol: 0.16, when: 0.08 }); },
  win:    () => { [523, 659, 784, 1047, 1319].forEach((f, i) => tone(f, 0.2, { type: "triangle", vol: 0.2, when: i * 0.08 })); },
  miss:   () => tone(280, 0.18, { type: "sine", vol: 0.16, slideTo: 160 }),
  coin:   () => { tone(988, 0.06, { type: "square", vol: 0.1 }); tone(1319, 0.12, { type: "square", vol: 0.1, when: 0.06 }); },
  cash:   () => { [784, 988, 1175, 1568].forEach((f, i) => tone(f, 0.1, { type: "square", vol: 0.1, when: i * 0.06 })); },
  crash:  () => { tone(120, 0.3, { type: "sawtooth", vol: 0.18, slideTo: 40 }); tone(90, 0.3, { type: "square", vol: 0.1, slideTo: 30 }); },
  laser:  () => tone(1400, 0.14, { type: "sawtooth", vol: 0.12, slideTo: 200 }),
  spin:   () => tone(300, 0.5, { type: "sawtooth", vol: 0.08, slideTo: 900 }),
  motor:  () => tone(120, 0.25, { type: "sawtooth", vol: 0.06 }),
  splash: () => tone(500, 0.2, { type: "sine", vol: 0.14, slideTo: 120 }),
  roll:   () => tone(160, 0.35, { type: "triangle", vol: 0.1, slideTo: 420 }),
  bonk:   () => { tone(220, 0.08, { type: "square", vol: 0.16, slideTo: 90 }); tone(700, 0.05, { type: "triangle", vol: 0.1, when: 0.03 }); },
  squish: () => tone(500, 0.18, { type: "sine", vol: 0.18, slideTo: 220 }),
  tear:   () => { for (let i = 0; i < 6; i++) tone(200 + Math.random() * 300, 0.05, { type: "sawtooth", vol: 0.06, when: i * 0.06 }); },
  flip:   () => tone(700, 0.08, { type: "triangle", vol: 0.12, slideTo: 1000 }),
  buy:    () => { tone(880, 0.08, { type: "square", vol: 0.12 }); tone(1320, 0.1, { type: "square", vol: 0.12, when: 0.07 }); },
  error:  () => tone(160, 0.15, { type: "square", vol: 0.12 }),
  whoosh: () => tone(200, 0.5, { type: "sine", vol: 0.1, slideTo: 900 }),
};
function setMuteLabel() { $("mute").textContent = muted ? "🔇" : "🔊"; }
$("mute").onclick = () => { muted = !muted; localStorage.setItem("emmy.muted", muted ? "1" : "0"); setMuteLabel(); if (!muted) SFX.tap(); };
setMuteLabel();

const LOOK_KEY = "emmy.arcade.avatar";
// --------------------------------------------------------------------------
//  Modes & state — Sandbox (unlimited money) / Regular (earn money at jobs)
// --------------------------------------------------------------------------
const MODE_KEY = "emmy.arcade.mode";
let mode = localStorage.getItem(MODE_KEY); // "sandbox" | "regular" | null (not chosen yet)
const saveKey = () => `emmy.arcade.save.v2.${mode}`;
let state = null;
function fresh() { return { credits: 0, tickets: 0, money: mode === "regular" ? 5 : 0, prizes: {}, best: {}, plays: 0, cards: {}, foils: {}, candy: 0, totalTickets: 0, earned: 0, boost: null, shifts: 0, needs: { food: 100, water: 100, potty: 100 }, trash: null }; }
function load() { try { const raw = localStorage.getItem(saveKey()); if (raw) return { ...fresh(), ...JSON.parse(raw) }; } catch {} return fresh(); }
function save() { if (state) localStorage.setItem(saveKey(), JSON.stringify(state)); }
const unlimited = () => mode === "sandbox";
const money = () => (unlimited() ? Infinity : state.money);
const fmt$ = (v) => (v === Infinity ? "$∞" : `$${v.toFixed(2)}`);

function setMode(m) {
  mode = m; localStorage.setItem(MODE_KEY, m); state = load(); save(); renderPills(); renderPrizes();
  $("modeBtn").textContent = m === "sandbox" ? "🏖️ Sandbox" : "💼 Regular";
  document.body.classList.toggle("regular", m === "regular");
}
function chooseMode() { $("modeModal").classList.add("show"); }
$("pickSandbox").onclick = () => { SFX.tap(); setMode("sandbox"); $("modeModal").classList.remove("show"); toast("🏖️ Sandbox mode — unlimited money! Load your card at the 💳 kiosk."); };
$("pickRegular").onclick = () => { SFX.tap(); setMode("regular"); $("modeModal").classList.remove("show"); toast(`💼 Regular mode — you have ${fmt$(state.money)}. Work a shift at the Snack Shack or Prize Booth to earn more!`, 4000); };
$("modeBtn").onclick = () => { if (active) return; SFX.tap(); chooseMode(); };

// --------------------------------------------------------------------------
//  UI helpers
// --------------------------------------------------------------------------
let toastT = 0;
function toast(msg, ms = 2600) { const t = $("toast"); t.textContent = msg; t.classList.add("show"); clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove("show"), ms); }
function bump(el) { el.classList.remove("bump"); void el.offsetWidth; el.classList.add("bump"); }
function spark(stage, nx, ny, marks, n = 6) {
  const r = stage.getBoundingClientRect();
  for (let i = 0; i < n; i++) { const s = document.createElement("span"); s.className = "spark"; s.textContent = marks[i % marks.length];
    s.style.left = `${nx * r.width}px`; s.style.top = `${ny * r.height}px`; s.style.setProperty("--dx", `${(Math.random() - 0.5) * 220}px`); s.style.setProperty("--dy", `${-40 - Math.random() * 160}px`);
    stage.appendChild(s); setTimeout(() => s.remove(), 850); }
}
const cf = $("confetti"), cg = cf.getContext("2d"); let confs = [], cfRaf = 0;
function confetti(n = 120) {
  cf.width = innerWidth; cf.height = innerHeight;
  for (let i = 0; i < n; i++) confs.push({ x: Math.random() * cf.width, y: -20 - Math.random() * 200, vx: (Math.random() - 0.5) * 120, vy: 150 + Math.random() * 200, r: 4 + Math.random() * 6, c: ["#ff3dd6", "#00e5ff", "#ffd54a", "#00c853", "#7a3cff", "#fff"][i % 6], a: Math.random() * 6, s: (Math.random() - 0.5) * 8 });
  if (!cfRaf) { let last = performance.now(); const f = (now) => { const dt = Math.min(0.05, (now - last) / 1000); last = now; cg.clearRect(0, 0, cf.width, cf.height);
    confs = confs.filter((p) => p.y < cf.height + 30); for (const p of confs) { p.x += p.vx * dt; p.y += p.vy * dt; p.a += p.s * dt; cg.save(); cg.translate(p.x, p.y); cg.rotate(p.a); cg.fillStyle = p.c; cg.fillRect(-p.r, -p.r / 2, p.r * 2, p.r); cg.restore(); }
    if (confs.length) cfRaf = requestAnimationFrame(f); else { cfRaf = 0; cg.clearRect(0, 0, cf.width, cf.height); } }; cfRaf = requestAnimationFrame(f); }
}
function flyTo(targetEl, glyph, n) {
  const b = targetEl.getBoundingClientRect(); const count = Math.min(14, Math.max(3, Math.round(n / 4)));
  for (let i = 0; i < count; i++) { const s = document.createElement("span"); s.className = "ticketfly"; s.textContent = glyph;
    const sx = innerWidth * (0.3 + Math.random() * 0.4), sy = innerHeight * (0.35 + Math.random() * 0.3);
    s.style.left = `${sx}px`; s.style.top = `${sy}px`; s.style.setProperty("--dx", `${b.left + b.width / 2 - sx}px`); s.style.setProperty("--dy", `${b.top + b.height / 2 - sy}px`); s.style.animationDelay = `${i * 0.05}s`;
    document.body.appendChild(s); setTimeout(() => s.remove(), 1200 + i * 50); }
}
const BOOST_LABEL = { double: "🍕 DOUBLE tickets next game", free: "🥤 next game FREE", lucky: "🍭 +50% tickets next game" };
// ---- needs: hunger / thirst / bathroom. They drain slowly while you're in the arcade;
//      when one is empty you have to eat, drink at the fountain, or visit the restroom before playing.
const NEED_RATE = { food: 100 / 540, water: 100 / 420, potty: 100 / 660 }; // seconds to drain from full
const NEED_FIX = { food: "grab a bite at the 🍕 Snack Shack", water: "drink at the 🚰 water fountain", potty: "visit the 🚻 restroom" };
function tickNeeds(dt) { if (!state || active || modalOpen) return; let changed = false; for (const k of Object.keys(NEED_RATE)) { const v = state.needs[k]; state.needs[k] = Math.max(0, v - NEED_RATE[k] * dt); if (Math.floor(v) !== Math.floor(state.needs[k])) changed = true; if (v > 0 && state.needs[k] === 0) { SFX.error(); toast(`${k === "food" ? "🍕 You're hungry!" : k === "water" ? "💧 You're thirsty!" : "🚻 You need the restroom!"} Go ${NEED_FIX[k]} before playing more games.`, 4000); } } if (changed) renderNeeds(); }
function renderNeeds() { if (!state) return; for (const k of ["food", "water", "potty"]) { const v = state.needs[k]; const el = $("need" + k[0].toUpperCase() + k.slice(1)); el.style.width = `${v}%`; const row = el.closest(".need"); row.classList.toggle("low", v > 0 && v < 30); row.classList.toggle("empty", v <= 0); } $("trashHeld").style.display = state.trash ? "" : "none"; $("trashHeld").textContent = state.trash ? `${state.trash} holding trash — find a 🗑️` : ""; }
function emptyNeed() { return ["food", "water", "potty"].find((k) => state.needs[k] <= 0); }
setInterval(() => { tickNeeds(1); save(); }, 1000);
function renderPills() {
  if (!state) return; renderNeeds();
  $("creditsPill").textContent = `🪙 ${state.credits}`; $("ticketsPill").textContent = `🎟️ ${state.tickets}`; $("moneyPill").textContent = `💵 ${fmt$(money())}`;
  $("boostPill").style.display = state.boost ? "" : "none"; $("boostPill").textContent = BOOST_LABEL[state.boost] || "";
  $("cardCredits").textContent = `🪙 ${state.credits}`; $("cardTickets").textContent = `🎟️ ${state.tickets}`;
  $("wallet").innerHTML = unlimited() ? `💵 Your wallet: <b>$∞</b> (Sandbox mode — unlimited money!)` : `💵 Your wallet: <b>${fmt$(state.money)}</b> — earn more by working a shift at the 🍕 Snack Shack or 🎁 Prize Booth`;
  $("cardHint").textContent = state.credits === 0 ? "Your card is empty! Load some credits to start playing. (Games cost 2–4 credits.)" : `You have ${state.credits} credits — enough for about ${Math.floor(state.credits / 3)} games. Have fun!`;
  for (const [id, cost] of [["load5", 5], ["load10", 10], ["load50", 50], ["load100", 100]]) $(id).disabled = !unlimited() && state.money < cost;
}

// --------------------------------------------------------------------------
//  Modals
// --------------------------------------------------------------------------
let modalOpen = null;
function openModal(id) { closeModal(); modalOpen = id; $(id).classList.add("show"); world && world.pause(true); }
function closeModal() { if (!modalOpen) return; if (modalOpen === "playModal") closePrizePlay(); if (modalOpen === "lookModal" && lookPrev) { lookPrev.stop(); lookPrev = null; } $(modalOpen).classList.remove("show"); modalOpen = null; world && world.pause(false); }
document.querySelectorAll("[data-close]").forEach((b) => (b.onclick = () => { closeModal(); SFX.tap(); }));
document.querySelectorAll(".modal:not(#modeModal)").forEach((m) => m.addEventListener("pointerdown", (e) => { if (e.target === m) closeModal(); }));
window.addEventListener("keydown", (e) => { if (e.key === "Escape") { if (modalOpen) closeModal(); else if (active) closeGame(); } });

// card kiosk — money → credits
function loadCard(credits, dollars) {
  if (!unlimited()) { if (state.money < dollars) { SFX.error(); toast(`You need $${dollars} — you have ${fmt$(state.money)}. Work a shift to earn more! 💼`); return; } state.money -= dollars; }
  state.credits += credits; save(); renderPills(); SFX.buy(); bump($("creditsPill")); toast(`💳 Swiped $${dollars} — +${credits} credits loaded!`);
}
$("load5").onclick = () => loadCard(6, 5); $("load10").onclick = () => loadCard(13, 10); $("load50").onclick = () => loadCard(70, 50); $("load100").onclick = () => loadCard(150, 100);

// snack shack — money → snacks (boosts) / work a shift
function renderSnacks() {
  $("snackMenu").innerHTML = SNACKS.map((s) => `<div class="prize"><div class="face">${s.emoji}</div><div class="name">${s.name}</div><div class="desc">${s.desc}</div><div class="cost money">$${s.price.toFixed(2)}</div><button class="redeem" data-snack="${s.id}" ${money() >= s.price ? "" : "disabled"}>${money() >= s.price ? "Buy!" : "Need $" + (s.price - state.money).toFixed(2)}</button></div>`).join("");
  $("snackMenu").querySelectorAll("[data-snack]").forEach((b) => (b.onclick = () => buySnack(b.dataset.snack)));
  $("snackWallet").textContent = `💵 Wallet: ${fmt$(money())}`;
}
function buySnack(id) {
  const s = SNACKS.find((q) => q.id === id); if (!s) return;
  if (!unlimited()) { if (state.money < s.price) { SFX.error(); toast("Not enough money! Work a shift to earn some. 💼"); return; } state.money -= s.price; }
  save(); renderPills(); SFX.buy(); toast(`${s.emoji} One ${s.name}, coming right up!`);
  openPlayView({ kind: "snack", ...s }, () => { $("snackModal").classList.add("show"); modalOpen = "snackModal"; renderSnacks(); }, (snack) => {
    if (snack.boost === "tickets") { state.tickets += snack.tickets; bump($("ticketsPill")); flyTo($("ticketsPill"), "🎟️", snack.tickets); toast(`+${snack.tickets} tickets! 🎟️`); }
    else { state.boost = snack.boost; toast(`Boost active: ${BOOST_LABEL[snack.boost]}!`); }
    state.needs.food = 100; if (snack.id === "soda") state.needs.water = 100; state.trash = snack.id === "soda" ? "🥤" : snack.id === "icecream" ? "🍦" : "🧻"; setTimeout(() => toast("Please throw your wrapper away in a 🗑️ trash can — tidy kids get bonus tickets!", 3500), 1800);
    save(); renderPills();
  });
}
$("snackJob").onclick = () => { closeModal(); startGame(snackjob); };
$("prizeJob").onclick = () => { closeModal(); startGame(prizejob); };

// prize counter
const PLAY_VERB = { toy3d: "Play", bouncy: "Bounce", wand: "Draw", candy: "Eat", pack: "Open", ipad: "Turn on" };
let tab = "counter";
document.querySelectorAll(".tab").forEach((b) => (b.onclick = () => { tab = b.dataset.tab; SFX.tap(); renderPrizes(); }));
function renderPrizes() {
  if (!state) return;
  document.querySelectorAll(".tab").forEach((b) => b.classList.toggle("active", b.dataset.tab === tab));
  $("prizes").style.display = tab === "counter" ? "" : "none"; $("shelf").style.display = tab === "shelf" ? "" : "none";
  $("prizes").innerHTML = PRIZES.filter((p) => !p.claw).map((p) => { const have = state.prizes[p.id] > 0; const can = state.tickets >= p.cost && (p.stack || !have);
    return `<div class="prize ${p.big ? "big" : ""}">${have && !p.stack ? `<div class="owned">✓ Owned</div>` : ""}<div class="face">${p.emoji}</div><div class="name">${p.name}</div><div class="desc">${p.desc}</div>
      <div class="cost">🎟️ ${p.cost}</div><button class="redeem" data-redeem="${p.id}" ${can ? "" : "disabled"}>${have && !p.stack ? "Owned!" : state.tickets >= p.cost ? "Redeem!" : `Need ${p.cost - state.tickets} more`}</button></div>`; }).join("");
  $("prizes").querySelectorAll("[data-redeem]").forEach((b) => (b.onclick = () => redeem(b.dataset.redeem)));
  const owned = PRIZES.filter((p) => state.prizes[p.id] > 0 || (p.kind === "pack" && state.cards?.[p.set]?.length));
  $("shelfCount").textContent = owned.length ? `(${owned.length})` : "";
  $("shelf").innerHTML = owned.length ? owned.map((p) => `<div class="prize shelf ${p.big ? "big" : ""}" data-prize="${p.id}">
      ${p.stack && state.prizes[p.id] > 1 ? `<div class="owned">×${state.prizes[p.id]}</div>` : ""}${p.claw ? `<div class="owned claw">🦾 won</div>` : ""}<div class="face">${p.emoji}</div><div class="name">${p.name}</div><div class="play">▶ ${p.kind === "pack" && !(state.prizes[p.id] > 0) ? "Binder" : PLAY_VERB[p.kind] || "Play"}</div></div>`).join("")
    : `<div class="empty">No prizes yet — win tickets at the games, or grab a plushie from the 🦾 claw machine!</div>`;
  $("shelf").querySelectorAll(".prize").forEach((el) => (el.onclick = () => openPrizePlay(el.dataset.prize)));
}
function redeem(id) {
  const p = prizeById(id); if (!p) return;
  if (state.tickets < p.cost) { SFX.error(); toast(`You need ${p.cost - state.tickets} more tickets for the ${p.name}!`); return; }
  if (!p.stack && state.prizes[id] > 0) { toast("You already have one of those!"); return; }
  state.tickets -= p.cost; state.prizes[id] = (state.prizes[id] || 0) + 1; if (p.kind === "candy") state.candy = (state.candy || 0) + 10;
  save(); renderPills(); renderPrizes(); SFX.win(); bump($("ticketsPill")); confetti(p.big ? 260 : 90);
  toast(`🎉 You got the ${p.name}!`); setTimeout(() => openPrizePlay(id), 600);
}
function awardPrize(id) { const p = prizeById(id); if (!p) return; state.prizes[id] = (state.prizes[id] || 0) + 1; save(); renderPrizes(); }

let prizeCleanup = null;
function openPlayView(prize, onBack, onEaten) {
  closePrizePlay(); if (modalOpen) $(modalOpen).classList.remove("show"); modalOpen = "playModal"; $("playModal").classList.add("show"); world && world.pause(true);
  $("pName").textContent = `${prize.emoji} ${prize.name}`; const stage = $("pStage"); stage.innerHTML = ""; $("pTip").textContent = ""; SFX.tap();
  $("pClose").onclick = () => { closePrizePlay(); $("playModal").classList.remove("show"); modalOpen = null; if (onBack) onBack(); else world.pause(false); };
  prizeCleanup = playPrize(prize, stage, { sfx: SFX, tone, makeSustain, toast, state, save, spark, setTip: (t) => ($("pTip").textContent = t), box: $("prizeBox"), rerender: renderPrizes, onEaten });
}
function openPrizePlay(id) { const p = prizeById(id); if (p) openPlayView(p, () => { modalOpen = "prizeModal"; $("prizeModal").classList.add("show"); tab = "shelf"; renderPrizes(); }); }
function closePrizePlay() { if (prizeCleanup) { try { prizeCleanup(); } catch {} prizeCleanup = null; } $("pStage").innerHTML = ""; $("prizeBox").classList.remove("wide"); }

// --------------------------------------------------------------------------
//  The 3D world
// --------------------------------------------------------------------------
let world = null, nearest = null;
try {
  world = createWorld($("view"), {
    games: GAMES, ui: $("hud"),
    avatar: loadLook(),
    onPrompt(it) { nearest = it; const p = $("prompt"); if (it && !active) { p.classList.add("show"); $("interact").textContent = it.label; $("interact").className = `act ${it.kind === "game" ? "btn-green" : it.kind === "kiosk" ? "btn-blue" : it.kind === "snack" ? "btn-gold" : "btn-pink"}`; } else p.classList.remove("show"); },
    onInteract(it) { interact(it); },
  });
  world.start();
  setTimeout(() => $("loading").classList.add("hide"), 400);
} catch (err) {
  console.error(err); $("loading").innerHTML = `<div style="font-size:50px">😢</div><div>This device can't show the 3D arcade.</div><a class="ghost" href="index.html">← Back</a>`;
}
$("interact").onclick = () => nearest && interact(nearest);
function interact(it) {
  if (active || modalOpen) return; SFX.tap();
  if (it.kind === "kiosk") { renderPills(); openModal("kioskModal"); }
  else if (it.kind === "prizes") { tab = "counter"; renderPrizes(); openModal("prizeModal"); }
  else if (it.kind === "snack") { renderSnacks(); openModal("snackModal"); }
  else if (it.kind === "restroom") useFacility("potty");
  else if (it.kind === "fountain") useFacility("water");
  else if (it.kind === "trash") { if (!state.trash) { toast("You're not holding any trash right now. Nice and tidy! 👍"); return; } const t = state.trash; state.trash = null; state.tickets += 5; save(); renderPills(); SFX.ding(); flyTo($("ticketsPill"), "🎟️", 5); toast(`${t} → 🗑️ Thanks for keeping the arcade clean! +5 tickets`); }
  else if (it.kind === "game") { const e = emptyNeed(); if (e) { SFX.error(); toast(`${e === "food" ? "🍕 Too hungry to play!" : e === "water" ? "💧 Too thirsty to play!" : "🚻 You really need the restroom first!"} Go ${NEED_FIX[e]}.`, 3500); return; } startGame(it.def); }
}
// restroom / water fountain: a short, friendly animation that refills the bar
function useFacility(kind) {
  openModal("rrModal"); const steps = kind === "potty" ? [["🚪", "Going in…"], ["🧻", "…"], ["🚽", "Flush!"], ["🧼", "Washing hands"], ["🧴", "Drying off"], ["✨", "All better!"]] : [["🚰", "Leaning in…"], ["💧", "Gulp"], ["💧", "Gulp gulp"], ["😌", "Ahh, refreshing!"]];
  $("rrTitle").textContent = kind === "potty" ? "🚻 Restroom" : "🚰 Water Fountain"; $("rrSub").textContent = kind === "potty" ? "Everybody needs a break sometimes." : "Stay hydrated, champ!";
  let i = 0; const go = () => { const [ic, tx] = steps[i]; $("rrIcon").textContent = ic; $("rrText").textContent = tx; $("rrFill").style.width = `${((i + 1) / steps.length) * 100}%`; SFX.tick(); i++; if (i < steps.length) setTimeout(go, 650); else setTimeout(() => { state.needs[kind] = 100; if (kind === "water") state.needs.potty = Math.max(0, state.needs.potty - 8); save(); renderNeeds(); closeModal(); SFX.ding(); toast(kind === "potty" ? "🚻 All set! Hands washed. Back to the games!" : "💧 Refreshed! Back to the games!"); }, 700); }; go();
}
// ---- character customization ----

const LOOK = { skin: [0xffd6b8, 0xf1c9a5, 0xe0ac8a, 0xc68642, 0x8d5a3c, 0x5c3a21], hair: [0x6b3e1e, 0x222222, 0xe8c36a, 0xa33a1e, 0x8a5a2b, 0xd7ccc8, 0xff3dd6, 0x3d8bfd], hairStyle: ["long", "short", "ponytail", "curly", "bun"], eyes: [0x3b6ea5, 0x4a8f3f, 0x6b3e1e, 0x8e44ad, 0x222222], shirt: [0xff3dd6, 0x3d8bfd, 0x00c853, 0xffd54a, 0x7a3cff, 0xff7043, 0xffffff, 0x222244], pants: [0x3d8bfd, 0x222244, 0xff3dd6, 0x8d5a2b, 0x00c853, 0xeeeeee], shoes: [0xffffff, 0x222222, 0xff3dd6, 0x00e5ff, 0xffd54a], mood: ["happy", "excited", "neutral"], hat: [null, "🎩", "🧢", "👑", "🎀", "🌸", "⭐"] };
const MOOD_LABEL = { happy: "😊 Smile", excited: "😄 Big grin", neutral: "🙂 Calm" }; const STYLE_LABEL = { long: "Long", short: "Short", ponytail: "Ponytail", curly: "Curly", bun: "Bun" };
function loadLook() { const d = { shirt: 0xff3dd6, pants: 0x3d8bfd, hairStyle: "ponytail", hair: 0x8a5a2b, eyes: 0x4a8f3f, mood: "happy", skin: 0xffd6b8, shoes: 0xffffff, hat: null }; try { return { ...d, ...JSON.parse(localStorage.getItem(LOOK_KEY) || "{}") }; } catch { return d; } }
let look = loadLook();
const hex = (c) => "#" + c.toString(16).padStart(6, "0");
function renderLook() {
  const o = $("lookOpts"); o.innerHTML = "";
  const row = (label, key, items, render) => { const r = document.createElement("div"); r.className = "lookrow"; r.innerHTML = `<div class="lbl">${label}</div>`; items.forEach((v) => { const el = render(v); el.classList.toggle("sel", look[key] === v); el.onclick = () => { look[key] = v; localStorage.setItem(LOOK_KEY, JSON.stringify(look)); world.setAvatar(look); lookPrev && lookPrev.refresh(); SFX.tap(); renderLook(); }; r.appendChild(el); }); o.appendChild(r); };
  const sw = (c) => { const d = document.createElement("div"); d.className = "swatch"; d.style.background = hex(c); return d; };
  const chip = (t) => { const b = document.createElement("button"); b.className = "chip"; b.textContent = t; return b; };
  row("Skin", "skin", LOOK.skin, sw); row("Hair color", "hair", LOOK.hair, sw); row("Hair style", "hairStyle", LOOK.hairStyle, (v) => chip(STYLE_LABEL[v])); row("Eyes", "eyes", LOOK.eyes, sw);
  row("Expression", "mood", LOOK.mood, (v) => chip(MOOD_LABEL[v])); row("Shirt", "shirt", LOOK.shirt, sw); row("Pants", "pants", LOOK.pants, sw); row("Shoes", "shoes", LOOK.shoes, sw); row("Hat", "hat", LOOK.hat, (v) => chip(v || "None"));
}
// live preview of the character inside the modal
let lookPrev = null;
function startLookPreview() {
  const stage = $("lookPreview"); stage.innerHTML = ""; const r = stage.getBoundingClientRect(); const W = Math.max(100, r.width), H = Math.max(100, r.height);
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true }); renderer.setPixelRatio(Math.min(2, devicePixelRatio || 1)); renderer.setSize(W, H); renderer.domElement.style.cssText = "width:100%;height:100%;display:block"; stage.appendChild(renderer.domElement);
  const scene = new THREE.Scene(); scene.add(new THREE.HemisphereLight(0xffffff, 0x404060, 1.2)); const d = new THREE.DirectionalLight(0xffffff, 1.2); d.position.set(2, 4, 3); scene.add(d);
  const camera = new THREE.PerspectiveCamera(35, W / H, 0.1, 50); camera.position.set(0, 1.25, 3.4); camera.lookAt(0, 1.0, 0);
  let kid = null; const setKid = () => { if (kid) scene.remove(kid.group); kid = makeKid(look); scene.add(kid.group); };
  setKid(); let raf = 0, t = 0, last = performance.now(); const frame = (now) => { raf = requestAnimationFrame(frame); const dt = Math.min(0.05, (now - last) / 1000); last = now; t += dt; kid.group.rotation.y = Math.sin(t * 0.7) * 0.5; kid.walk(t, 0, dt); renderer.render(scene, camera); }; raf = requestAnimationFrame(frame);
  lookPrev = { refresh: setKid, stop() { cancelAnimationFrame(raf); renderer.dispose(); stage.innerHTML = ""; } };
}
$("lookBtn").onclick = () => { if (active) return; SFX.tap(); renderLook(); openModal("lookModal"); startLookPreview(); };

// --------------------------------------------------------------------------
//  Game harness — first-person 3D games rendered by the world's renderer
// --------------------------------------------------------------------------
let active = null; // { def, ctrl, finished, boost, cost }
function startGame(def) {
  let cost = def.cost, usedFree = false;
  if (cost > 0 && state.boost === "free") { cost = 0; usedFree = true; }
  if (state.credits < cost) { SFX.error(); toast(`Not enough credits! ${def.name} costs ${def.cost}. Visit the 💳 card kiosk near the entrance.`); return; }
  const boost = usedFree ? null : (def.job || def.cost === 0 ? null : state.boost);
  state.credits -= cost; state.plays++; if (usedFree || boost) state.boost = null; save(); renderPills(); if (cost) { SFX.coin(); bump($("creditsPill")); }
  if (usedFree) toast("🥤 This game is on the house — boost used!");
  $("prompt").classList.remove("show"); $("hint").style.display = "none";
  active = { def, ctrl: null, finished: false, boost, cost };
  $("gameHud").classList.add("show"); $("hud").classList.add("ingame"); $("gTitle").textContent = `${def.emoji} ${def.name}`; $("gScore").textContent = ""; $("gTip").textContent = "";
  SFX.whoosh();
  const go = () => { if (!active || active.def !== def) return; showBanner(`<div class="big">${def.emoji}</div><h2>${def.name}</h2><p>${def.tip}</p>${boost ? `<p class="boostnote">Boost active: ${BOOST_LABEL[boost]}!</p>` : ""}<div class="row"><button class="act btn-green" id="bStart">▶ ${def.job ? "Start my shift!" : "Start!"}</button></div>`); $("bStart").onclick = () => runGame(def); };
  world.enterGame(def.cabinet === "none" ? (def.id === "snackjob" ? "snack" : "prizes") : def.id).then(go);
}
function showBanner(html) { const b = document.createElement("div"); b.className = "banner"; b.innerHTML = html; $("gBanner").innerHTML = ""; $("gBanner").appendChild(b); return b; }
function runGame(def) {
  $("gBanner").innerHTML = ""; $("gTip").textContent = def.tip;
  const { W, H } = world.size();
  const api = {
    W, H, sfx: SFX, tone, keys: world.keys, pad: world.pad, hud: $("gameHud"), awardPrize: (id) => { awardPrize(id); const p = prizeById(id); if (p) toast(`${p.emoji} ${p.name} added to your prize shelf!`); },
    setScore: (t) => ($("gScore").textContent = t), setTip: (t) => ($("gTip").textContent = t),
    finish(amount, title, detail) { if (!active || active.finished) return; active.finished = true; setTimeout(() => endGame(def, amount, title, detail), 300); },
  };
  try {
    const ctrl = def.create(api); active.ctrl = ctrl;
    $("vignette").classList.toggle("show", def.id === "vr");
    world.setOverride({ scene: ctrl.scene, camera: ctrl.camera, update: (dt) => { if (!active.finished) ctrl.update(dt); }, onDown: (p) => !active.finished && ctrl.onDown && ctrl.onDown(p), onMove: (p) => !active.finished && ctrl.onMove && ctrl.onMove(p), onUp: (p) => !active.finished && ctrl.onUp && ctrl.onUp(p), onKey: (k) => !active.finished && ctrl.onKey && ctrl.onKey(k), onPad: (b) => { if (active.finished) { if (b === 0) ($("bAgain") || $("bBack"))?.click(); return; } if (b === 0 && $("bStart")) { $("bStart").click(); return; } ctrl.onPad && ctrl.onPad(b); } });
  } catch (err) { console.error(err); toast("That machine is out of order 😅 (credits refunded)"); state.credits += active.cost; save(); renderPills(); closeGame(); }
}
function endGame(def, amount, title, detail) {
  $("gTip").textContent = "";
  if (def.job) { // paid in money
    const pay = Math.round(amount * 100) / 100; state.money += pay; state.earned += pay; state.shifts++; save(); renderPills();
    if (pay > 0) { flyTo($("moneyPill"), "💵", pay * 4); setTimeout(() => bump($("moneyPill")), 900); SFX.cash(); if (pay >= 12) confetti(160); } else SFX.miss();
    showBanner(`<h2>${title}</h2><div class="won money">💵 +${fmt$(pay)}</div><p>${detail || ""}</p><p class="boostnote">Wallet: ${fmt$(money())}</p>
      <div class="row"><button class="act btn-green" id="bAgain">🔁 Another shift</button><button class="act btn-blue" id="bBack">🚶 Back to the arcade</button></div>`);
    $("bAgain").onclick = () => { disposeActive(); active = { def, ctrl: null, finished: false, boost: null, cost: 0 }; runGame(def); }; $("bBack").onclick = closeGame; return;
  }
  let tickets = Math.max(0, Math.round(amount * TICKET_BONUS)); const base = tickets; let boostNote = "";
  if (active.boost === "double") { tickets *= 2; boostNote = ` 🍕 DOUBLED by your snack (${base} → ${tickets})!`; } else if (active.boost === "lucky") { tickets = Math.round(tickets * 1.5); boostNote = ` 🍭 +50% from your snack (${base} → ${tickets})!`; }
  state.tickets += tickets; state.totalTickets += tickets; const best = tickets > (state.best[def.id] || 0); if (best) state.best[def.id] = tickets; save(); renderPills();
  if (tickets > 0) { flyTo($("ticketsPill"), "🎟️", tickets); setTimeout(() => bump($("ticketsPill")), 900); if (tickets >= 50) { confetti(180); SFX.win(); } else SFX.ding(); } else SFX.miss();
  showBanner(`<h2>${title}</h2><div class="won">🎟️ +${tickets} ticket${tickets === 1 ? "" : "s"}</div><p>${detail || ""}${boostNote}${best && tickets > 0 ? " — 🏅 new best!" : ""}</p>
    <div class="row"><button class="act btn-green" id="bAgain">🔁 Play again${def.cost ? ` (🪙 ${def.cost})` : ""}</button><button class="act btn-blue" id="bBack">🚶 Back to the arcade</button></div>`);
  $("bAgain").onclick = () => { if (state.credits < def.cost) { SFX.error(); toast(`Not enough credits! Visit the 💳 kiosk.`); return; } disposeActive(); state.credits -= def.cost; state.plays++; save(); renderPills(); if (def.cost) SFX.coin(); active = { def, ctrl: null, finished: false, boost: null, cost: def.cost }; runGame(def); };
  $("bBack").onclick = closeGame;
}
function disposeActive() { if (active?.ctrl) { try { active.ctrl.dispose && active.ctrl.dispose(); } catch {} } world.setOverride(null); $("vignette").classList.remove("show"); $("gBanner").innerHTML = ""; }
function closeGame() {
  if (!active) return; const wasPlaying = active.ctrl && !active.finished;
  disposeActive(); active = null; $("gameHud").classList.remove("show"); $("hud").classList.remove("ingame"); $("hint").style.display = ""; world.exitGame();
  if (wasPlaying) toast("Left early — no refunds at the arcade! 😄");
}
$("gQuit").onclick = closeGame;
if (world) world.onPadBack(() => { if (modalOpen) closeModal(); else if (active) closeGame(); });
window.addEventListener("gamepadconnected", () => toast("🎮 Controller connected! Left stick walks, right stick looks, A = play/tap, B = back.", 4000));

// --------------------------------------------------------------------------
//  Boot
// --------------------------------------------------------------------------
if (mode === "sandbox" || mode === "regular") { setMode(mode); if (state.plays === 0 && state.credits === 0) setTimeout(() => toast("👋 Welcome to Emmy's Arcade! Walk to the 💳 kiosk to load your card."), 1200); }
else { setMode("sandbox"); localStorage.removeItem(MODE_KEY); chooseMode(); }

// debug/automation hook (used by the Playwright checks)
window.__arcade = { get world() { return world; }, interact, startGame, closeGame, get state() { return state; }, GAMES, setMode, get mode() { return mode; } };
