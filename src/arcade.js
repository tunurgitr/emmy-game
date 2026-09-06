// ==========================================================================
//  Emmy's Arcade — hub. Walk around the 3D arcade (third-person), step up to
//  a machine to play it in first-person, load your card at the kiosk and trade
//  tickets for interactive prizes at the counter.
// ==========================================================================
import { createWorld } from "./arcade3d/world.js";
import { wheel, claw, vr, race, laser } from "./arcade3d/games1.js";
import { hockey, fish, skee, mole, hoops } from "./arcade3d/games2.js";
import { PRIZES, prizeById, playPrize } from "./arcade-prizes.js";

const GAMES = [race, claw, vr, wheel, laser, hockey, fish, skee, mole, hoops];
const $ = (id) => document.getElementById(id);

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
function setMuteLabel() { $("mute").textContent = muted ? "🔇 Muted" : "🔊 Sound"; }
$("mute").onclick = () => { muted = !muted; localStorage.setItem("emmy.muted", muted ? "1" : "0"); setMuteLabel(); if (!muted) SFX.tap(); };
setMuteLabel();

// --------------------------------------------------------------------------
//  State
// --------------------------------------------------------------------------
const SAVE_KEY = "emmy.arcade.save.v1";
let state = load();
function fresh() { return { credits: 0, tickets: 0, prizes: {}, best: {}, plays: 0, cards: {}, candy: 0, totalTickets: 0 }; }
function load() { try { const raw = localStorage.getItem(SAVE_KEY); if (raw) return { ...fresh(), ...JSON.parse(raw) }; } catch {} return fresh(); }
function save() { localStorage.setItem(SAVE_KEY, JSON.stringify(state)); }

// --------------------------------------------------------------------------
//  UI helpers
// --------------------------------------------------------------------------
let toastT = 0;
function toast(msg, ms = 2400) { const t = $("toast"); t.textContent = msg; t.classList.add("show"); clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove("show"), ms); }
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
function flyTickets(n) {
  const b = $("ticketsPill").getBoundingClientRect(); const count = Math.min(14, Math.max(3, Math.round(n / 4)));
  for (let i = 0; i < count; i++) { const s = document.createElement("span"); s.className = "ticketfly"; s.textContent = "🎟️";
    const sx = innerWidth * (0.3 + Math.random() * 0.4), sy = innerHeight * (0.35 + Math.random() * 0.3);
    s.style.left = `${sx}px`; s.style.top = `${sy}px`; s.style.setProperty("--dx", `${b.left + b.width / 2 - sx}px`); s.style.setProperty("--dy", `${b.top + b.height / 2 - sy}px`); s.style.animationDelay = `${i * 0.05}s`;
    document.body.appendChild(s); setTimeout(() => s.remove(), 1200 + i * 50); }
}
function renderPills() {
  $("creditsPill").textContent = `🪙 ${state.credits} credit${state.credits === 1 ? "" : "s"}`; $("ticketsPill").textContent = `🎟️ ${state.tickets}`;
  $("cardCredits").textContent = `🪙 ${state.credits}`; $("cardTickets").textContent = `🎟️ ${state.tickets}`;
  $("cardHint").textContent = state.credits === 0 ? "Your card is empty! Load some credits to start playing. (Games cost 2–4 credits.)" : `You have ${state.credits} credits — enough for about ${Math.floor(state.credits / 3)} games. Have fun!`;
}

// --------------------------------------------------------------------------
//  Modals
// --------------------------------------------------------------------------
let modalOpen = null;
function openModal(id) { closeModal(); modalOpen = id; $(id).classList.add("show"); world && world.pause(true); }
function closeModal() { if (!modalOpen) return; if (modalOpen === "playModal") closePrizePlay(); $(modalOpen).classList.remove("show"); modalOpen = null; world && world.pause(false); }
document.querySelectorAll("[data-close]").forEach((b) => (b.onclick = () => { closeModal(); SFX.tap(); }));
document.querySelectorAll(".modal").forEach((m) => m.addEventListener("pointerdown", (e) => { if (e.target === m) closeModal(); }));
window.addEventListener("keydown", (e) => { if (e.key === "Escape") { if (modalOpen) closeModal(); else if (active) closeGame(); } });

// card kiosk
function loadCard(n, dollars) { state.credits += n; save(); renderPills(); SFX.buy(); bump($("creditsPill")); toast(`💳 Swiped $${dollars} — +${n} credits loaded!`); }
$("load10").onclick = () => loadCard(10, 10); $("load50").onclick = () => loadCard(55, 50); $("load100").onclick = () => loadCard(120, 100);

// prize counter
const PLAY_VERB = { toy3d: "Play", bouncy: "Bounce", wand: "Draw", candy: "Eat", pack: "Open", ipad: "Turn on" };
let tab = "counter";
document.querySelectorAll(".tab").forEach((b) => (b.onclick = () => { tab = b.dataset.tab; SFX.tap(); renderPrizes(); }));
function renderPrizes() {
  document.querySelectorAll(".tab").forEach((b) => b.classList.toggle("active", b.dataset.tab === tab));
  $("prizes").style.display = tab === "counter" ? "" : "none"; $("shelf").style.display = tab === "shelf" ? "" : "none";
  $("prizes").innerHTML = PRIZES.map((p) => { const have = state.prizes[p.id] > 0; const can = state.tickets >= p.cost && (p.stack || !have);
    return `<div class="prize ${p.big ? "big" : ""}">${have && !p.stack ? `<div class="owned">✓ Owned</div>` : ""}<div class="face">${p.emoji}</div><div class="name">${p.name}</div><div class="desc">${p.desc}</div>
      <div class="cost">🎟️ ${p.cost}</div><button class="redeem" data-redeem="${p.id}" ${can ? "" : "disabled"}>${have && !p.stack ? "Owned!" : state.tickets >= p.cost ? "Redeem!" : `Need ${p.cost - state.tickets} more`}</button></div>`; }).join("");
  $("prizes").querySelectorAll("[data-redeem]").forEach((b) => (b.onclick = () => redeem(b.dataset.redeem)));
  const owned = PRIZES.filter((p) => state.prizes[p.id] > 0 || (p.kind === "pack" && state.cards?.[p.set]?.length));
  $("shelf").innerHTML = owned.length ? owned.map((p) => `<div class="prize shelf ${p.big ? "big" : ""}" data-prize="${p.id}">
      ${p.stack && state.prizes[p.id] > 1 ? `<div class="owned">×${state.prizes[p.id]}</div>` : ""}<div class="face">${p.emoji}</div><div class="name">${p.name}</div><div class="play">▶ ${p.kind === "pack" && !(state.prizes[p.id] > 0) ? "Binder" : PLAY_VERB[p.kind] || "Play"}</div></div>`).join("")
    : `<div class="empty">No prizes yet — win tickets and redeem them here! 🎟️</div>`;
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
let prizeCleanup = null;
function openPrizePlay(id) {
  const p = prizeById(id); if (!p) return;
  closePrizePlay(); modalOpen && $(modalOpen).classList.remove("show"); modalOpen = "playModal"; $("playModal").classList.add("show"); world && world.pause(true);
  $("pName").textContent = `${p.emoji} ${p.name}`; const stage = $("pStage"); stage.innerHTML = ""; $("pTip").textContent = ""; SFX.tap();
  prizeCleanup = playPrize(p, stage, { sfx: SFX, tone, makeSustain, toast, state, save, spark, setTip: (t) => ($("pTip").textContent = t), box: $("prizeBox"), rerender: renderPrizes });
}
function closePrizePlay() { if (prizeCleanup) { try { prizeCleanup(); } catch {} prizeCleanup = null; } $("pStage").innerHTML = ""; $("prizeBox").classList.remove("wide"); }
$("pClose").onclick = () => { closePrizePlay(); $("playModal").classList.remove("show"); modalOpen = "prizeModal"; $("prizeModal").classList.add("show"); renderPrizes(); };

// --------------------------------------------------------------------------
//  The 3D world
// --------------------------------------------------------------------------
let world = null, nearest = null;
try {
  world = createWorld($("view"), {
    games: GAMES, ui: $("hud"),
    avatar: { shirt: 0xff3dd6, pants: 0x3d8bfd, face: "😊" },
    onPrompt(it) { nearest = it; const p = $("prompt"); if (it && !active) { p.classList.add("show"); $("interact").textContent = it.label; $("interact").className = `act ${it.kind === "game" ? "btn-green" : it.kind === "kiosk" ? "btn-blue" : "btn-pink"}`; } else p.classList.remove("show"); },
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
  else if (it.kind === "game") startGame(it.def);
}

// --------------------------------------------------------------------------
//  Game harness — first-person 3D games rendered by the world's renderer
// --------------------------------------------------------------------------
let active = null; // { def, ctrl, finished }
function startGame(def) {
  if (state.credits < def.cost) { SFX.error(); toast(`Not enough credits! ${def.name} costs ${def.cost}. Visit the 💳 card kiosk near the entrance.`); return; }
  state.credits -= def.cost; state.plays++; save(); renderPills(); SFX.coin(); bump($("creditsPill"));
  $("prompt").classList.remove("show"); $("hint").style.display = "none";
  active = { def, ctrl: null, finished: false };
  $("gameHud").classList.add("show"); $("hud").classList.add("ingame"); $("gTitle").textContent = `${def.emoji} ${def.name}`; $("gScore").textContent = ""; $("gTip").textContent = "";
  SFX.whoosh();
  world.enterGame(def.id).then(() => {
    if (!active || active.def !== def) return;
    showBanner(`<div class="big">${def.emoji}</div><h2>${def.name}</h2><p>${def.tip}</p><div class="row"><button class="act btn-green" id="bStart">▶ Start!</button></div>`);
    $("bStart").onclick = () => runGame(def);
  });
}
function showBanner(html) { const b = document.createElement("div"); b.className = "banner"; b.innerHTML = html; $("gBanner").innerHTML = ""; $("gBanner").appendChild(b); return b; }
function runGame(def) {
  $("gBanner").innerHTML = ""; $("gTip").textContent = def.tip;
  const { W, H } = world.size();
  const api = {
    W, H, sfx: SFX, tone, keys: world.keys, hud: $("gameHud"),
    setScore: (t) => ($("gScore").textContent = t), setTip: (t) => ($("gTip").textContent = t),
    finish(tickets, title, detail) { if (!active || active.finished) return; active.finished = true; setTimeout(() => endGame(def, tickets, title, detail), 300); },
  };
  try {
    const ctrl = def.create(api); active.ctrl = ctrl;
    $("vignette").classList.toggle("show", def.id === "vr");
    world.setOverride({ scene: ctrl.scene, camera: ctrl.camera, update: (dt) => { if (!active.finished) ctrl.update(dt); }, onDown: (p) => !active.finished && ctrl.onDown && ctrl.onDown(p), onMove: (p) => !active.finished && ctrl.onMove && ctrl.onMove(p), onUp: (p) => !active.finished && ctrl.onUp && ctrl.onUp(p), onKey: (k) => !active.finished && ctrl.onKey && ctrl.onKey(k) });
  } catch (err) { console.error(err); toast("That machine is out of order 😅 (credits refunded)"); state.credits += def.cost; save(); renderPills(); closeGame(); }
}
function endGame(def, tickets, title, detail) {
  tickets = Math.max(0, Math.round(tickets));
  state.tickets += tickets; state.totalTickets += tickets; if (tickets > (state.best[def.id] || 0)) state.best[def.id] = tickets; save(); renderPills();
  if (tickets > 0) { flyTickets(tickets); setTimeout(() => bump($("ticketsPill")), 900); if (tickets >= 40) { confetti(160); SFX.win(); } else SFX.ding(); } else SFX.miss();
  $("gTip").textContent = "";
  showBanner(`<h2>${title}</h2><div class="won">🎟️ +${tickets} ticket${tickets === 1 ? "" : "s"}</div><p>${detail || ""}${state.best[def.id] === tickets && tickets > 0 ? " — 🏅 new best!" : ""}</p>
    <div class="row"><button class="act btn-green" id="bAgain">🔁 Play again (🪙 ${def.cost})</button><button class="act btn-blue" id="bBack">🚶 Back to the arcade</button></div>`);
  $("bAgain").onclick = () => { if (state.credits < def.cost) { SFX.error(); toast(`Not enough credits! Visit the 💳 kiosk.`); return; } disposeActive(); state.credits -= def.cost; state.plays++; save(); renderPills(); SFX.coin(); active = { def, ctrl: null, finished: false }; runGame(def); };
  $("bBack").onclick = closeGame;
}
function disposeActive() { if (active?.ctrl) { try { active.ctrl.dispose && active.ctrl.dispose(); } catch {} } world.setOverride(null); $("vignette").classList.remove("show"); $("gBanner").innerHTML = ""; }
function closeGame() {
  if (!active) return; const wasPlaying = active.ctrl && !active.finished;
  disposeActive(); active = null; $("gameHud").classList.remove("show"); $("hud").classList.remove("ingame"); $("hint").style.display = ""; world.exitGame();
  if (wasPlaying) toast("Left the game — no refunds at the arcade! 😄");
}
$("gQuit").onclick = closeGame;

renderPills(); renderPrizes();
if (state.plays === 0 && state.credits === 0) setTimeout(() => toast("👋 Welcome to Emmy's Arcade! Walk to the 💳 kiosk to load your card."), 1200);
// debug/automation hook (used by the Playwright checks)
window.__arcade = { get world() { return world; }, interact, startGame, closeGame, get state() { return state; }, GAMES };
