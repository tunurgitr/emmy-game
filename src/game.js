import {
  TIERS, TOYS, byId, sum, reseed, evaluate, TONE_COLORS,
  AVATARS, starterToys, makeFoxyOffer, makeFoxyReturn, foxyMood, askMoreOutcome, makeShopStock, sellPrice,
} from "./toys.js";

reseed();

// ==========================================================================
//  Sound engine — Web Audio, generated tones (no files, works offline).
// ==========================================================================
let audioCtx = null;
let muted = localStorage.getItem("emmy.muted") === "1";
function ac() {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  if (audioCtx.state === "suspended") audioCtx.resume();
  return audioCtx;
}
// Play a single tone. type: sine/square/triangle/sawtooth.
function tone(freq, dur = 0.12, { type = "sine", vol = 0.18, when = 0, slideTo = null } = {}) {
  if (muted) return;
  const ctx = ac();
  const t0 = ctx.currentTime + when;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t0 + dur);
  gain.gain.setValueAtTime(0.0001, t0);
  gain.gain.exponentialRampToValueAtTime(vol, t0 + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  osc.connect(gain).connect(ctx.destination);
  osc.start(t0);
  osc.stop(t0 + dur + 0.02);
}
function chord(freqs, dur, opts) { freqs.forEach((f) => tone(f, dur, opts)); }
const SFX = {
  tap:    () => tone(520, 0.07, { type: "triangle", vol: 0.14 }),
  add:    () => tone(660, 0.09, { type: "triangle", vol: 0.16 }),
  remove: () => tone(300, 0.09, { type: "triangle", vol: 0.14 }),
  accept: () => { [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.16, { type: "triangle", vol: 0.18, when: i * 0.09 })); },
  refuse: () => tone(280, 0.16, { type: "sine", vol: 0.16, slideTo: 200 }),
  buy:    () => { tone(880, 0.08, { type: "square", vol: 0.12 }); tone(1320, 0.1, { type: "square", vol: 0.12, when: 0.07 }); },
  sell:   () => { tone(700, 0.08, { type: "triangle", vol: 0.14 }); tone(1050, 0.1, { type: "triangle", vol: 0.14, when: 0.07 }); },
  celebrate: () => { [523, 659, 784, 1047, 1319].forEach((f, i) => tone(f, 0.2, { type: "triangle", vol: 0.2, when: i * 0.08 })); },
  error:  () => tone(160, 0.15, { type: "square", vol: 0.12 }),
  pop:    () => tone(400 + Math.random() * 500, 0.06, { type: "sine", vol: 0.2, slideTo: 180 }),
  spin:   () => tone(300, 0.4, { type: "sawtooth", vol: 0.1, slideTo: 900 }),
  squish: () => tone(500, 0.18, { type: "sine", vol: 0.18, slideTo: 220 }),
  click:  () => { tone(1200, 0.04, { type: "square", vol: 0.14 }); tone(800, 0.05, { type: "square", vol: 0.12, when: 0.05 }); },
  shake:  () => { for (let i = 0; i < 4; i++) tone(300 + i * 60, 0.05, { type: "triangle", vol: 0.1, when: i * 0.05 }); },
};

// ---- background music: 3 selectable tracks (generated, loop; respects mute) ----
// 0 = off. Each track has its own tempo, timbre, and a long-ish pattern (0 = rest)
// so it doesn't feel as repetitive. Melody + bass loop on independent lengths.
const TRACKS = [
  { name: "Bouncy", tempo: 300, wave: "triangle",
    mel: [523, 0, 659, 784, 880, 784, 659, 0, 587, 659, 784, 0, 988, 880, 784, 659, 587, 0, 523, 0],
    bass: [131, 0, 196, 0, 165, 0, 196, 0, 147, 0, 220, 0] },
  // mellow jazz: laid-back melody (chord tones + 7ths/9ths) over a walking bass,
  // ii-V-I-VI in C (Dm7 - G7 - Cmaj7 - A7)
  { name: "Jazzy", tempo: 400, wave: "triangle",
    mel: [349, 0, 440, 523, 0, 494, 587, 0, 392, 330, 0, 392, 554, 523, 0, 0,
          440, 0, 349, 0, 587, 494, 0, 330, 392, 0, 494, 0, 659, 0, 554, 0],
    bass: [147, 175, 220, 247, 196, 247, 175, 165, 131, 165, 196, 220, 110, 139, 165, 196] },
  { name: "Playful", tempo: 360, wave: "triangle",
    mel: [698, 523, 587, 698, 0, 880, 784, 659, 587, 523, 0, 659, 587, 494, 523, 440, 0, 587, 523, 0],
    bass: [175, 0, 0, 233, 0, 0, 196, 0, 0, 175, 0, 0] },
];
let musicTrack = Math.max(0, Math.min(3, parseInt(localStorage.getItem("emmy.music") ?? "1", 10) || 0));
let musicTimer = 0, musicStep = 0;
function musicTick() {
  if (muted || musicTrack === 0) return;
  const t = TRACKS[musicTrack - 1];
  const n = t.mel[musicStep % t.mel.length];
  if (n) tone(n, (t.tempo / 1000) * 0.8, { type: t.wave, vol: 0.045 });
  const b = t.bass[musicStep % t.bass.length];
  if (b) tone(b, (t.tempo / 1000) * 1.6, { type: "sine", vol: 0.05 });
  musicStep++;
}
function scheduleMusic() {
  clearInterval(musicTimer); musicTimer = 0;
  if (musicTrack === 0) return;
  musicTimer = setInterval(musicTick, TRACKS[musicTrack - 1].tempo);
}

const SAVE_KEY = "emmy.fidget.save.v2";
const MAX_ASKS = 2;
const $ = (id) => document.getElementById(id);

// ---- state ----
let uidCounter = 1;
let state;
let mode = "trade"; // backpack interaction mode: trade | play | sell

function freshState() {
  const starters = starterToys();
  return {
    avatar: null, // null => show picker on first run
    foxyName: "Foxy",
    foxyAvatar: "🦊",
    coins: 60,
    streak: 0,
    // whose turn it is to START the trade: "foxy" offers first, "you" offer first.
    // It alternates every round so trading goes back and forth.
    turn: "foxy",
    // inventory is an array of INSTANCES so a specific copy can move into a trade
    inventory: starters.map((t) => ({ uid: uidCounter++, id: t.id })),
    offer: makeFoxyOffer(),
    give: [],            // uids currently offered from inventory
    shop: makeShopStock(),
    // mystery-box tracking
    freeBoxes: 1, // one welcome box for each new game (no daily boxes)
    tradesTowardBox: 0,
    luckyMeter: 0,
    boxesSinceEpicPlus: 0,
    totalBoxesOpened: 0,
    discovered: starters.map((t) => t.id), // toy ids ever owned (never removed)
  };
}

function load() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return null;
    const s = { ...freshState(), ...JSON.parse(raw) }; // fill in any new fields
    // restore uid counter above any saved uid
    const maxUid = s.inventory.reduce((m, it) => Math.max(m, it.uid), 0);
    uidCounter = maxUid + 1;
    // a live offer/shop isn't worth persisting mid-trade; make a fresh round
    if (s.turn !== "you" && s.turn !== "foxy") s.turn = "foxy";
    s.offer = s.turn === "you" ? emptyYourOffer() : makeFoxyOffer();
    s.give = [];
    if (!s.shop || !s.shop.length) s.shop = makeShopStock();
    if (!Array.isArray(s.discovered)) s.discovered = [];
    return s;
  } catch { return null; }
}

function save() {
  const { avatar, foxyName, foxyAvatar, coins, streak, turn, inventory, shop,
          freeBoxes, tradesTowardBox, luckyMeter, boxesSinceEpicPlus, totalBoxesOpened, discovered } = state;
  localStorage.setItem(SAVE_KEY, JSON.stringify({
    avatar, foxyName, foxyAvatar, coins, streak, turn, inventory, shop,
    freeBoxes, tradesTowardBox, luckyMeter, boxesSinceEpicPlus, totalBoxesOpened, discovered,
  }));
}

// A blank "your turn" offer: the player builds first, then Foxy responds.
function emptyYourOffer() {
  return { theirs: [], wantValue: 0, acceptFactor: 1, asks: 0, refusals: 0, youFirst: true, responded: false };
}

// mark a toy as discovered (for the "NEW!" badge + collection tracking)
function discover(id) { if (!state.discovered.includes(id)) state.discovered.push(id); }
function gainToy(id) { state.inventory.push({ uid: uidCounter++, id }); discover(id); }

// ---- helpers ----
const invItem = (uid) => state.inventory.find((it) => it.uid === uid);
const giveToys = () => state.give.map((uid) => byId(invItem(uid).id));
const giveValue = () => sum(giveToys());

function toyCardHtml(toy, { tap = false, cls = "" } = {}) {
  const tier = TIERS[toy.tier];
  return `
    <div class="toy ${tap ? "tap" : ""} ${cls}" style="--c:${tier.color};--g:${tier.glow}" data-toy="${toy.id}">
      <span class="tier" style="background:${tier.color}">${tier.label}</span>
      <div class="face" data-thumb="${toy.id}">${toy.emoji}</div>
      <div class="name">${toy.name}</div>
      <div class="val">🪙 ${toy.value}</div>
    </div>`;
}

// ---- render ----
function render() {
  $("coins").textContent = state.coins;
  $("streak").textContent = state.streak;
  $("playerAvatar").textContent = state.avatar || "🧒";
  $("foxyAvatar").textContent = state.foxyAvatar;
  $("foxyLabel").textContent = state.foxyName;
  $("shopTitle").textContent = state.foxyName + "'s";

  const yourTurn = state.turn === "you";
  const responded = !!state.offer.responded;      // your-turn: has Foxy countered yet?
  const locked = yourTurn && responded;           // offer is set; can't edit your side now
  const F = state.foxyAvatar, name = state.foxyName;

  // whose-turn banner + tagline + side labels
  const badge = $("turnBadge");
  if (yourTurn) {
    badge.className = "turn-badge you";
    badge.textContent = responded ? `${F} ${name} made you an offer!` : `🫵 Your turn — offer first!`;
    $("tagline").textContent = responded
      ? `Take the deal or say no thanks. ${F}`
      : `Offer some toys and ${name} will trade you back! ${F}`;
    $("theirLead").textContent = responded ? "trades you" : "will trade back";
    $("theirSub").textContent = responded ? "you GET these toys" : "make your offer below 👇";
    $("youLead").textContent = "You offer";
    $("youSub").textContent = responded ? "your side is locked in" : "tap your toys below to offer them";
  } else {
    badge.className = "turn-badge";
    badge.textContent = `${F} ${name}'s turn to offer`;
    $("tagline").textContent = `Build a trade ${name} will accept! ${F}`;
    $("theirLead").textContent = "gives you";
    $("theirSub").textContent = "you GET these toys";
    $("youLead").textContent = "You give up";
    $("youSub").textContent = "tap your toys below to offer them";
  }

  // Foxy's side (top tray)
  const theirs = state.offer.theirs;
  if (yourTurn && !responded) {
    $("theirs").innerHTML = `<div class="hint">🎁 ${name} will put toys here once you offer!</div>`;
  } else {
    $("theirs").innerHTML = theirs.map((t) => toyCardHtml(t)).join("");
  }
  $("getTotal").textContent = `🪙 ${sum(theirs)}`;

  // Your give tray (tap to remove, unless locked)
  const gv = giveValue();
  $("giveTotal").textContent = `🪙 ${gv}`;
  const tray = $("giveTray");
  if (!state.give.length) {
    tray.innerHTML = `<div class="hint">👇 Tap toys in your backpack to add them here</div>`;
  } else {
    tray.innerHTML = state.give.map((uid) => {
      const toy = byId(invItem(uid).id);
      return toyCardHtml(toy, { tap: !locked }).replace('data-toy', `data-give="${uid}" data-toy`);
    }).join("");
    if (!locked) {
      tray.querySelectorAll("[data-give]").forEach((el) => {
        el.onclick = () => removeFromTray(Number(el.dataset.give));
      });
    }
  }

  // Foxy's speech bubble — unless a sell chat is happening.
  if (!chat) {
    if (yourTurn && !responded) {
      $("foxyMood").textContent = F;
      $("foxyLine").textContent = gv === 0 ? "Whatcha got for me? 😄" : "Ooh, let me see... offer it! 👀";
    } else if (yourTurn && responded) {
      const e = evaluate(theirs, giveToys());
      $("foxyMood").textContent = e.rating >= 4 ? "😄" : "😊";
      $("foxyLine").textContent = "Here's my trade! Wanna do it? 🤝";
    } else {
      const mood = foxyMood(gv, state.offer.wantValue, state.offer.acceptFactor);
      $("foxyMood").textContent = gv === 0 ? F : mood.face;
      $("foxyLine").textContent = mood.line;
    }
    $("chatButtons").innerHTML = "";
  }

  // "Good for YOU" meter (educational): compares what you get vs give
  const showDeal = state.give.length && !(yourTurn && !responded);
  if (!showDeal) {
    $("needle").style.left = "50%";
    $("verdict").innerHTML = yourTurn && !responded
      ? `<span style="color:var(--muted)">🎁 Offer toys to see ${name}'s trade</span>`
      : `<span style="color:var(--muted)">🤷 Add toys to see your deal</span>`;
    $("stars").textContent = "☆☆☆☆☆";
    $("values").innerHTML = `You get <b class="get">🪙${sum(theirs)}</b> &nbsp;·&nbsp; You give <b class="give">🪙${gv}</b>`;
  } else {
    const e = evaluate(theirs, giveToys());
    const pctRaw = ((e.ratio - 0.5) / (2.0 - 0.5)) * 100;
    $("needle").style.left = Math.max(3, Math.min(97, pctRaw)) + "%";
    $("verdict").innerHTML = `<span style="color:${TONE_COLORS[e.tone]}">${e.emoji} ${e.label}</span>`;
    $("stars").textContent = "⭐".repeat(e.rating) + "☆".repeat(5 - e.rating);
    $("values").innerHTML = `You get <b class="get">🪙${e.get}</b> &nbsp;·&nbsp; You give <b class="give">🪙${e.give}</b>`;
  }

  // buttons (labels/enabled depend on turn + phase)
  $("propose").disabled = state.give.length === 0;
  if (yourTurn && !responded) {
    $("propose").textContent = `🎁 Offer to ${name}`;
    $("decline").textContent = "👋 New trade";
    $("add").style.display = "none";
  } else if (yourTurn && responded) {
    $("propose").textContent = "✅ Take the deal!";
    $("propose").disabled = false;
    $("decline").textContent = "👋 No deal";
    $("add").style.display = "";
    const outOfAsks = state.offer.asks >= MAX_ASKS;
    $("add").disabled = outOfAsks;
    $("add").textContent = outOfAsks ? "🚫 No more asks" : "➕ Ask for more";
  } else {
    $("propose").textContent = "🤝 Propose Trade";
    $("decline").textContent = "👋 No thanks";
    $("add").style.display = "";
    const outOfAsks = state.offer.asks >= MAX_ASKS;
    $("add").disabled = outOfAsks;
    $("add").textContent = outOfAsks ? "🚫 No more asks" : "➕ Ask for more";
  }

  renderBackpack();
  renderShop();
  renderBoxes();
  hydrateThumbs();
  save();
}

function renderBackpack() {
  const bag = $("backpack");
  // Your offer is locked once Foxy has countered — take it or leave it.
  if (mode === "trade" && state.turn === "you" && state.offer.responded) {
    $("bagCount").textContent = `(${state.inventory.length} toys)`;
    bag.innerHTML = `<span class="empty">${state.foxyAvatar} ${state.foxyName} made her offer! Tap <b>Take the deal</b> or <b>No deal</b> above. (Switch to 🎮 Play or 💰 Sell anytime.)</span>`;
    return;
  }
  // In play/sell modes every owned toy is tappable; in trade mode, ones already
  // on the table are hidden (they show in the give tray instead).
  const available = mode === "trade"
    ? state.inventory.filter((it) => !state.give.includes(it.uid))
    : state.inventory;
  $("bagCount").textContent = `(${state.inventory.length} toys)`;
  if (!available.length) {
    bag.innerHTML = state.inventory.length
      ? `<span class="empty">All your toys are on the table!</span>`
      : `<span class="empty">Your backpack is empty — buy toys in the shop or say "no thanks" for a new offer.</span>`;
    return;
  }
  bag.innerHTML = available.map((it) => {
    const toy = byId(it.id);
    let html = toyCardHtml(toy, { tap: true }).replace('data-toy', `data-uid="${it.uid}" data-toy`);
    if (mode === "sell") {
      // hint the ballpark offer (the chat haggles around ~85% of value)
      html = html.replace(/<\/div>\s*$/, `<span class="sellbadge">💬 ~${Math.round(toy.value * 0.85)}</span></div>`);
    }
    return html;
  }).join("");
  bag.querySelectorAll("[data-uid]").forEach((el) => {
    const uid = Number(el.dataset.uid);
    el.onclick = () => {
      if (mode === "trade") addToTray(uid);
      else if (mode === "play") openFidget(uid);
      else if (mode === "sell") startSell(uid);
    };
  });
}

function renderShop() {
  const shop = $("shop");
  shop.innerHTML = state.shop.map((s, i) => {
    const toy = byId(s.id);
    const tier = TIERS[toy.tier];
    const afford = state.coins >= s.price;
    return `
      <div class="shopcard" style="--c:${tier.color};--g:${tier.glow}">
        <div class="face" data-thumb="${toy.id}">${toy.emoji}</div>
        <div class="name">${toy.name}</div>
        <button class="buybtn" data-shop="${i}" ${afford ? "" : "disabled"}>🪙 ${s.price}</button>
      </div>`;
  }).join("");
  shop.querySelectorAll("[data-shop]").forEach((el) => {
    el.onclick = () => buy(Number(el.dataset.shop));
  });
}

// ---- trade tray actions ----
function addToTray(uid) {
  if (!state.give.includes(uid)) state.give.push(uid);
  SFX.add();
  render();
}
function removeFromTray(uid) {
  state.give = state.give.filter((u) => u !== uid);
  SFX.remove();
  render();
}

// ---- sell as a friendly chat / haggle ----
let chat = null; // { uid, toy, offer, round, ended }

const PRECIOUS = new Set(["rare", "epic", "legendary", "mythic", "cosmic"]);
const SELL_LINES = {
  offerCommon: [
    "Ooh, {toy}! I'll give you {c} for it!",
    "Hehe, I like {toy}! How about {c}?",
    "{toy}?! Cute!! {c} — deal?",
    "Squish squish~ 😍 {c} for {toy}!",
    "I've wanted one of these! {c}?",
  ],
  offerRare: [
    "WAIT. Is that {toy}?! 😱 {c}, please please!",
    "No way!! A real {toy}! I'll pay {c}!!",
    "😍😍 {toy}!! Take my coins! {c}!",
    "Are you SURE about {toy}? …{c}? 🥺",
  ],
  raised: [
    "Yes! {c}, because you're awesome! 😆",
    "Ooh great idea — {c}! 🎉",
    "You're good at this! {c}! 🌟",
    "Happy to! {c} it is! 😄",
    "For you? Absolutely — {c}! 💛",
  ],
  refused: [
    "That's really my best — {c}! 🥺",
    "Nope nope, {c}! Gotta save for snacks! 🍪",
    "Heehee, nice try! Still {c}! 😝",
    "{c}, pinky promise that's my best! 🤙",
  ],
  generous: [
    "You know what? {c}! You're my favorite! ✨",
    "Oh, just TAKE {c}! I love it too much! 🤩",
  ],
  deal: [
    "Deal!! 🤝 Best trade ever!",
    "Yay!! I'll take great care of {toy}! 💕",
    "Hehe, {toy} is MINE now! Thank youuu!",
    "Coins for you, {toy} for me! 🎉",
  ],
  cancel: [
    "No worries! {toy} is lucky to have you! 💕",
    "Aww, okay! Come back if you change your mind!",
  ],
};
const pickLine = (key, toy, c) =>
  SELL_LINES[key][Math.floor(Math.random() * SELL_LINES[key].length)]
    .replace("{toy}", `${toy.emoji} ${toy.name}`)
    .replace("{c}", `${c} 🪙`);

function rollInitialOffer(toy) {
  const precious = PRECIOUS.has(toy.tier);
  const lo = precious ? 0.95 : 0.90; // more generous starting offers now
  return Math.max(1, Math.round(toy.value * (lo + Math.random() * 0.10)));
}
function startSell(uid) {
  const it = invItem(uid);
  if (!it) return;
  const toy = byId(it.id);
  const offer = rollInitialOffer(toy);
  chat = { uid, toy, offer, round: 0, ended: false };
  SFX.tap();
  const key = PRECIOUS.has(toy.tier) ? "offerRare" : "offerCommon";
  renderChat(pickLine(key, toy, offer), true);
}
function renderChat(line, bump) {
  $("foxyMood").textContent = state.foxyAvatar;
  $("foxyLine").innerHTML = line.replace(/(\d+) 🪙/, `<span class="offer${bump ? " bump" : ""}">$1 🪙</span>`);
  const canHaggle = !chat.ended && chat.round < 2;
  const btns = [];
  btns.push(`<button class="chat-btn deal" data-chat="deal">✅ Deal! (${chat.offer}🪙)</button>`);
  if (canHaggle) btns.push(`<button class="chat-btn hag" data-chat="haggle">🙏 Do better?</button>`);
  btns.push(`<button class="chat-btn no" data-chat="cancel">❌ Keep it</button>`);
  const box = $("chatButtons");
  box.innerHTML = btns.join("");
  box.querySelectorAll("[data-chat]").forEach((b) => {
    b.onclick = () => { if (b.dataset.chat === "deal") sellConfirm(); else if (b.dataset.chat === "haggle") sellHaggle(); else sellCancel(); };
  });
}
function sellHaggle() {
  if (!chat || chat.ended) return;
  chat.round++;
  const v = chat.toy.value, precious = PRECIOUS.has(chat.toy.tier);
  const roll = Math.random();
  const genChance = precious ? 0.18 : 0.14; // more likely to be extra generous
  if (roll < genChance) {
    chat.offer = Math.round(v * (1.12 + Math.random() * 0.08)); // pays OVER value
    chat.ended = true;
    SFX.buy();
    renderChat(pickLine("generous", chat.toy, chat.offer), true);
  } else if (roll < genChance + 0.12) { // rarely holds firm now
    chat.ended = true;
    SFX.refuse();
    renderChat(pickLine("refused", chat.toy, chat.offer), false);
  } else {
    const bump = chat.round === 1 ? (0.06 + Math.random() * 0.06) : (0.03 + Math.random() * 0.05);
    chat.offer = Math.min(Math.round(v * 1.15), chat.offer + Math.round(v * bump));
    SFX.sell();
    if (chat.round >= 2) chat.ended = true;
    renderChat(pickLine("raised", chat.toy, chat.offer), true);
  }
}
function sellConfirm() {
  if (!chat) return;
  const { uid, toy, offer } = chat;
  state.inventory = state.inventory.filter((x) => x.uid !== uid);
  state.give = state.give.filter((u) => u !== uid);
  state.coins += offer;
  SFX.buy();
  const line = pickLine("deal", toy, offer);
  chat = null;
  $("chatButtons").innerHTML = "";
  toast(`💰 Sold ${toy.name} for 🪙${offer}!`);
  safetyNet();
  render();
  // brief happy line
  $("foxyMood").textContent = state.foxyAvatar;
  $("foxyLine").textContent = line;
}
function sellCancel() {
  if (!chat) return;
  const toy = chat.toy;
  chat = null;
  $("chatButtons").innerHTML = "";
  $("foxyMood").textContent = state.foxyAvatar;
  $("foxyLine").textContent = pickLine("cancel", toy, 0);
  SFX.tap();
}

// ---- core actions ----
// Flip who initiates and start a fresh round for that side.
function flipTurn() { state.turn = state.turn === "foxy" ? "you" : "foxy"; }
function newRound() {
  state.give = [];
  state.offer = state.turn === "you" ? emptyYourOffer() : makeFoxyOffer();
  render();
}

// Complete an accepted trade (works for either turn): swap toys, pay coins, next round.
function finishTrade() {
  const e = evaluate(state.offer.theirs, giveToys());
  state.inventory = state.inventory.filter((it) => !state.give.includes(it.uid));
  state.offer.theirs.forEach((t) => gainToy(t.id));

  // Coins: generous base + how much better than fair you did + streak bonus.
  const bonus = Math.min(80, 15 + Math.max(0, Math.round(e.net)) + state.streak * 3);
  state.coins += bonus;

  // trade milestone -> free Rainbow Box every 5 trades
  state.tradesTowardBox++;
  const milestone = state.tradesTowardBox % 5 === 0;

  if (e.rating >= 4) {
    state.streak++;
    celebrate();
    SFX.celebrate();
    toast(state.streak > 1 ? `🔥 ${state.streak} great trades! +🪙${bonus}` : `🎉 Great trade! +🪙${bonus}`);
  } else {
    state.streak = 0;
    SFX.accept();
    toast(`🤝 Trade done! +🪙${bonus}`);
  }
  state.shop = makeShopStock(); // rotate stock after each deal
  safetyNet();
  flipTurn();
  newRound();
  if (milestone) { toast("🎁 5 trades! Here's a free Rainbow Box!"); openBox("rainbow", true); }
}

function propose() {
  const yourTurn = state.turn === "you";

  // YOUR turn, first press: this is your opening offer → Foxy trades something back.
  if (yourTurn && !state.offer.responded) {
    if (!state.give.length) return;
    state.offer = makeFoxyReturn(giveValue());
    SFX.accept();
    toast(`${state.foxyAvatar} ${state.foxyName} has a trade for you!`);
    render();
    return;
  }

  if (!state.give.length) return;

  // FOXY's turn: your offer has to satisfy her hidden price.
  if (!yourTurn) {
    const gv = giveValue();
    const mood = foxyMood(gv, state.offer.wantValue, state.offer.acceptFactor);
    if (!mood.accepts) {
      state.offer.refusals = (state.offer.refusals || 0) + 1;
      SFX.refuse();
      if (state.offer.refusals >= 2) {
        toast(`${state.foxyAvatar} ${state.foxyName} wants to try something new!`);
        state.streak = 0;
        flipTurn();
        newRound();
      } else {
        toast(`${mood.face} ${mood.line}`);
        render();
      }
      return;
    }
  }

  // Accepted (Foxy's price met, OR you took Foxy's return offer on your turn).
  finishTrade();
}

function decline() {
  state.streak = 0;
  SFX.tap();
  flipTurn();
  toast(state.turn === "you"
    ? `👋 Your turn — you offer first!`
    : `👋 ${state.foxyName} offers you a trade!`);
  newRound();
}

function askMore() {
  if (state.offer.asks >= MAX_ASKS) return;
  // Only meaningful when there are toys on Foxy's side to sweeten.
  if (!state.offer.theirs.length) return;
  const out = askMoreOutcome(state.offer);
  if (out.type === "added") SFX.add();
  else if (out.type === "removed" || out.type === "ended") SFX.refuse();
  else SFX.tap();
  toast(out.line);
  if (out.type === "ended") { state.streak = 0; flipTurn(); newRound(); return; }
  render();
}

function buy(i) {
  const s = state.shop[i];
  if (!s || state.coins < s.price) { SFX.error(); return; }
  state.coins -= s.price;
  gainToy(s.id);
  SFX.buy();
  toast(`🛍️ Bought a ${byId(s.id).name}!`);
  render();
}

// ==========================================================================
//  Mystery boxes
// ==========================================================================
const BOX_DEFS = {
  sparkle: { name: "Sparkle Box", emoji: "✨", cost: 35, color: "#7cc4ff",
    weights: { common: 500, uncommon: 300, rare: 140, epic: 45, legendary: 12, mythic: 3, cosmic: 1, prismatic: 0, divine: 0 } },
  rainbow: { name: "Rainbow Box", emoji: "🌈", cost: 90, color: "#3d8bfd",
    weights: { common: 200, uncommon: 340, rare: 270, epic: 120, legendary: 50, mythic: 14, cosmic: 5, prismatic: 1, divine: 0 } },
  galaxy:  { name: "Galaxy Box", emoji: "🌌", cost: 250, color: "#b558f6",
    weights: { common: 0, uncommon: 260, rare: 330, epic: 230, legendary: 110, mythic: 44, cosmic: 18, prismatic: 6, divine: 2 } },
};
const RARITY_ORDER = ["common", "uncommon", "rare", "epic", "legendary", "mythic", "cosmic", "prismatic", "divine"];

function rollRarity(weights, floorTier) {
  const entries = RARITY_ORDER
    .filter((r) => weights[r] > 0 && (!floorTier || RARITY_ORDER.indexOf(r) >= RARITY_ORDER.indexOf(floorTier)))
    .map((r) => [r, weights[r]]);
  const pool = entries.length ? entries : RARITY_ORDER.filter((r) => weights[r] > 0).map((r) => [r, weights[r]]);
  const total = pool.reduce((n, [, w]) => n + w, 0);
  let x = Math.random() * total;
  for (const [r, w] of pool) { x -= w; if (x <= 0) return r; }
  return pool[0][0];
}

function renderBoxes() {
  const banner = $("boxBanner");
  if (state.freeBoxes > 0) {
    banner.className = "box-banner ready";
    banner.textContent = `🎁 You have ${state.freeBoxes} free box${state.freeBoxes === 1 ? "" : "es"} — tap to open!`;
    banner.onclick = () => { state.freeBoxes--; openBox("sparkle", true); };
  } else {
    banner.className = "box-banner";
    banner.textContent = "✨ Earn free boxes by trading, or buy one below!";
    banner.onclick = null;
  }
  $("luckyFill").style.width = Math.min(100, (state.luckyMeter / 7) * 100) + "%";
  const toMile = 5 - (state.tradesTowardBox % 5);
  $("luckyText").textContent = state.luckyMeter >= 7
    ? "next box is a GUARANTEED Rare or better! 🍀"
    : `${state.luckyMeter}/7 · 🤝 ${toMile} trade${toMile === 1 ? "" : "s"} to a free Rainbow Box`;

  $("boxes").innerHTML = Object.entries(BOX_DEFS).map(([key, b]) => {
    const w = b.weights, tot = RARITY_ORDER.reduce((n, r) => n + w[r], 0);
    const rarePlus = Math.round((RARITY_ORDER.slice(2).reduce((n, r) => n + w[r], 0) / tot) * 100);
    const afford = state.coins >= b.cost;
    return `
      <div class="boxcard" style="--c:${b.color};--g:${b.color}66">
        <div class="bx">${b.emoji}</div>
        <div class="bname">${b.name}</div>
        <div class="bodds">Rare or better:<br><b>${rarePlus}%</b></div>
        <button class="boxbuy" data-box="${key}" ${afford ? "" : "disabled"}>Open! ${b.cost} 🪙</button>
      </div>`;
  }).join("");
  $("boxes").querySelectorAll("[data-box]").forEach((el) => {
    el.onclick = () => openBox(el.dataset.box, false);
  });
}

function openBox(key, isFree) {
  const b = BOX_DEFS[key];
  if (!isFree) {
    if (state.coins < b.cost) { SFX.error(); return; }
    state.coins -= b.cost;
  }
  // pity: guaranteed rare+ at lucky 7; guaranteed epic+ every 25 dry boxes; first box ever is rare+
  let floor = null;
  if (state.luckyMeter >= 7) floor = "rare";
  if (state.boxesSinceEpicPlus >= 25) floor = "epic";
  if (state.totalBoxesOpened === 0) floor = floor && RARITY_ORDER.indexOf(floor) > 2 ? floor : "rare";
  const rarity = rollRarity(b.weights, floor);

  const idx = RARITY_ORDER.indexOf(rarity);
  state.luckyMeter = idx >= 2 ? 0 : state.luckyMeter + 1;
  state.boxesSinceEpicPlus = idx >= 3 ? 0 : state.boxesSinceEpicPlus + 1;
  state.totalBoxesOpened++;

  const pool = TOYS.filter((t) => t.tier === rarity);
  const toy = pool[Math.floor(Math.random() * pool.length)];
  const isNew = !state.discovered.includes(toy.id);
  gainToy(toy.id);
  save();

  playBoxOpen(b, toy, rarity, isNew, key);
}

function playBoxOpen(b, toy, rarity, isNew, key) {
  const tier = TIERS[rarity];
  const overlay = $("boxOpen");
  const emo = $("boxEmoji");
  const rev = $("boxReveal");
  const acts = $("boxActions");
  overlay.classList.add("show");
  rev.innerHTML = ""; acts.innerHTML = "";
  emo.textContent = b.emoji;
  emo.style.filter = "";
  emo.className = "box-emoji drop";
  SFX.tap();
  tone(600, 0.3, { type: "triangle", vol: 0.14, slideTo: 200 });

  // shake + glow building in the pull's rarity color
  setTimeout(() => {
    emo.classList.add("shaking");
    let ticks = 0;
    const ratchet = setInterval(() => {
      ticks++;
      emo.style.filter = `drop-shadow(0 0 ${ticks * 5}px ${tier.color})`;
      tone(300 + ticks * 45, 0.04, { type: "square", vol: 0.08 });
      if (ticks >= 14) clearInterval(ratchet);
    }, 130);
  }, 500);

  // burst + reveal
  setTimeout(() => {
    emo.classList.remove("shaking");
    emo.textContent = "💥";
    tone(150, 0.2, { type: "sine", vol: 0.2 });
    setTimeout(() => {
      emo.style.display = "none";
      const big = idxRank(rarity) >= 3;
      rev.innerHTML = `
        <div class="rtoy" data-thumb="${toy.id}" style="filter:drop-shadow(0 0 30px ${tier.color})">${toy.emoji}</div>
        <div class="rname">${toy.name}${isNew ? '<span class="rnew">NEW!</span>' : ""}</div>
        <div class="rpill" style="background:${tier.color}">${tier.label}</div>
        <div style="color:#ffd54a;font-weight:800;margin-top:6px">🪙 ${toy.value}</div>
        ${big ? `<div class="box-banner-big" style="color:${tier.color}">${tier.label.toUpperCase()}!!</div>` : ""}`;
      // reveal sound: longer fanfare for higher tiers
      const notes = [523, 659, 784, 1047, 1319].slice(0, Math.min(5, 2 + idxRank(rarity)));
      notes.forEach((f, i) => tone(f, 0.18, { type: "triangle", vol: 0.18, when: i * 0.09 }));
      // show the 3D model in the reveal too
      if (use3d) { const cached = thumbCache.get(toy.id); const rt = rev.querySelector('[data-thumb]'); if (cached && rt) applyThumb(rt, cached); else requestThumb(toy); }
      if (big) { celebrate(); SFX.celebrate(); }
      acts.innerHTML = `
        <button style="background:#00c853" data-act="keep">Keep it! 🎒</button>
        ${state.coins >= b.cost ? `<button style="background:#b558f6" data-act="again">Open another (${b.cost}🪙)</button>` : ""}`;
      acts.querySelector('[data-act="keep"]').onclick = () => { overlay.classList.remove("show"); emo.style.display = ""; render(); };
      const again = acts.querySelector('[data-act="again"]');
      if (again) again.onclick = () => { emo.style.display = ""; openBox(key, false); };
    }, 180);
  }, 2350);
}
const idxRank = (r) => RARITY_ORDER.indexOf(r);

// ---- backpack mode + fidget play zone ----
function setMode(m) {
  mode = m;
  if (chat && m !== "sell") { chat = null; $("chatButtons").innerHTML = ""; }
  document.querySelectorAll(".mode-btn").forEach((b) => b.classList.toggle("active", b.dataset.mode === m));
  $("modeHint").textContent = {
    trade: "Tap a toy to add it to your trade offer.",
    play:  "Tap a toy to play with it in the Fidget Zone! 🎮",
    sell:  `Tap a toy to chat with ${state.foxyName} and sell it! 💬`,
  }[m];
  SFX.tap();
  render();
}

// Each toy's `play` type maps to one of TWELVE distinct interactions.
const TIPS = {
  grid:    "👆 Pop the bubbles — drag across to pop a whole row!",
  flick:   "↔️ Drag across it to spin — faster = louder!",
  squish:  "✊ Press and HOLD to squish — it springs right back!",
  cube:    "👆 Tap it to flip and bounce — mash for a combo!",
  coil:    "✊ Press and HOLD to stretch it out, let go to boing!",
  tangle:  "↔️ Drag to twist it into new shapes!",
  stretch: "✊ Press and HOLD to stretch, let go to snap back!",
  piano:   "🎹 Tap different spots to play notes!",
  pet:     "🫳 Gently stroke it back and forth...",
  shower:  "👆 Tap to burst it — pop the falling pieces!",
  snow:    "↔️ Scrub fast to shake it all up!",
  stack:   "👆 Tap to stack them — how high can you go?",
  peel:    "✊ Drag it to peel off a surprise!",
  // legacy interactions kept for the 2D fallback:
  combo:   "⚡ Tap as FAST as you can for a combo!",
  windup:  "🔄 Drag in circles to wind it up, then let go!",
  squeeze: "✊ Press and HOLD to squish — it springs right back!",
};
let fidgetToyObj = null;
let fidgetCleanup = null; // teardown for the active emoji interaction
let fidget3d = null;      // active 3D scene (if any)
let use3d = localStorage.getItem("emmy.no3d") !== "1"; // can be disabled if WebGL fails
const THREE_D_PLAYS = new Set(["grid", "flick", "squish", "cube", "coil", "tangle", "stretch", "pet", "piano"]);

// Emoji-particle burst wrapper the 3D scene can call (stage-relative 0..1 coords).
function burstAt(stage, nx, ny, marks, n, spread) {
  const r = stage.getBoundingClientRect();
  burst(stage, nx * r.width, ny * r.height, marks, n, spread);
}

// ---- 3D card thumbnails: render each toy's 3D model once, cache, show on cards.
let thumbMod = null, thumbModPromise = null;
const thumbCache = new Map();   // toy id -> dataURL (null = failed, don't retry)
function loadThumbMod() {
  if (thumbMod) return Promise.resolve(thumbMod);
  if (!thumbModPromise) thumbModPromise = import("./fidget3d.js").then((m) => (thumbMod = m)).catch(() => null);
  return thumbModPromise;
}
function applyThumb(el, url) {
  if (!url || el.dataset.thumbDone) return;
  el.dataset.thumbDone = "1";
  el.innerHTML = `<img class="thumb3d" src="${url}" alt="" draggable="false">`;
}
function requestThumb(toy) {
  const id = toy.id;
  if (thumbCache.has(id)) return; // done or in-flight-resolved (null cached too)
  thumbCache.set(id, null); // reserve so we don't double-render; overwrite on success
  loadThumbMod().then((m) => {
    if (!m || !m.renderThumbnail) return;
    let url = null;
    try { url = m.renderThumbnail(toy, 128, TIERS[toy.tier].color); } catch { url = null; }
    thumbCache.set(id, url);
    if (url) document.querySelectorAll(`[data-thumb="${id}"]`).forEach((el) => applyThumb(el, url));
  });
}
// After a render, swap emoji faces for cached 3D thumbs and request any missing.
function hydrateThumbs() {
  if (!use3d) return;
  if ($("fidget").classList.contains("show")) return; // don't disturb a live scene
  document.querySelectorAll("[data-thumb]").forEach((el) => {
    const id = el.dataset.thumb, url = thumbCache.get(id);
    if (url) applyThumb(el, url);
    else if (!thumbCache.has(id)) { const t = byId(id); if (t) requestThumb(t); }
  });
}

function openFidget(uid) {
  const it = invItem(uid);
  if (!it) return;
  fidgetToyObj = byId(it.id);
  const type = fidgetToyObj.play || "combo";
  $("fidgetName").textContent = fidgetToyObj.name;
  $("fidgetTip").textContent = TIPS[type] || "👆 Play with your toy!";
  const stage = $("fidgetStage");
  if (fidgetCleanup) { fidgetCleanup(); fidgetCleanup = null; }
  if (fidget3d) { fidget3d.dispose(); fidget3d = null; }
  stage.innerHTML = "";
  $("fidget").classList.add("show");
  SFX.tap();

  // Play types with a solid 3D archetype get the real 3D toy; particle-heavy
  // ones (shower/snow/stack/peel) keep their themed 2D interaction.
  const wants3d = use3d && THREE_D_PLAYS.has(type);
  if (wants3d && (type === "grid" || type === "cube" || type === "piano")) {
    $("fidgetTip").textContent = (TIPS[type] || "👆 Play!") + "  🔄 Drag to spin it around!";
  }
  if (wants3d) {
    const toy = fidgetToyObj;
    // lazy-load Three + the 3D module only when a toy is actually opened
    import("./fidget3d.js").then((mod) => {
      // guard: user may have closed/switched toys before the chunk arrived
      if (!$("fidget").classList.contains("show") || fidgetToyObj !== toy) return;
      try {
        fidget3d = mod.createFidgetScene(stage, toy, {
          tone, makeSustain, celebrate,
          burst: (nx, ny, marks, n, spread) => burstAt(stage, nx, ny, marks, n, spread),
          tierColor: TIERS[toy.tier].color,
          parts: toy.parts,
          baseFreq: toyFreq(toy),
        });
      } catch (err) {
        console.warn("3D fidget failed, using 2D:", err);
        use3d = false; localStorage.setItem("emmy.no3d", "1");
        openEmojiFidget(stage, toy);
      }
    }).catch((err) => {
      console.warn("3D module load failed, using 2D:", err);
      use3d = false;
      openEmojiFidget(stage, toy);
    });
  } else {
    openEmojiFidget(stage, fidgetToyObj);
  }
}
function openEmojiFidget(stage, toy) {
  if (fidgetToyObj !== toy) return;
  const type = toy.play || "combo";
  stage.innerHTML = "";
  fidgetCleanup = (FIDGETS[type] || FIDGETS.combo)(stage, toy) || null;
}
function closeFidget() {
  if (fidgetCleanup) { fidgetCleanup(); fidgetCleanup = null; }
  if (fidget3d) { fidget3d.dispose(); fidget3d = null; }
  $("fidgetStage").innerHTML = "";
  $("fidget").classList.remove("show");
  fidgetToyObj = null;
}

// A sustained oscillator whose pitch/volume we tweak live.
function makeSustain(type = "sawtooth") {
  if (muted) return { setFreq() {}, setVol() {}, stop() {} };
  const ctx = ac();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  const filter = ctx.createBiquadFilter();
  filter.type = "lowpass"; filter.frequency.value = 1600;
  osc.type = type; osc.frequency.value = 200;
  gain.gain.value = 0.0001;
  osc.connect(filter).connect(gain).connect(ctx.destination);
  osc.start();
  return {
    setFreq(f) { osc.frequency.setTargetAtTime(f, ctx.currentTime, 0.02); },
    setVol(v)  { gain.gain.setTargetAtTime(Math.max(0.0001, v), ctx.currentTime, 0.03); },
    stop() { gain.gain.setTargetAtTime(0.0001, ctx.currentTime, 0.05); setTimeout(() => { try { osc.stop(); } catch {} }, 140); },
  };
}
// Fling emoji particles from (x,y) inside the stage.
function burst(stage, x, y, marks, n = 6, spread = 160) {
  for (let i = 0; i < n; i++) {
    const s = document.createElement("span");
    s.className = "sparkle";
    s.textContent = marks[Math.floor(Math.random() * marks.length)];
    s.style.left = x + "px"; s.style.top = y + "px";
    s.style.setProperty("--dx", (Math.random() - 0.5) * spread + "px");
    s.style.setProperty("--dy", (Math.random() * -120 - 20) + "px");
    stage.appendChild(s);
    setTimeout(() => s.remove(), 700);
  }
}
const bigToy = (toy) => {
  const el = document.createElement("div");
  el.className = "fidget-toy";
  el.textContent = toy.emoji;
  return el;
};
// A per-toy base pitch so each toy sounds a bit different.
function toyFreq(toy) {
  let h = 0;
  for (const c of toy.id) h = (h * 31 + c.charCodeAt(0)) % 1000;
  return 240 + (h % 480);
}
const partsOf = (toy, fallback) => (toy.parts && toy.parts.length ? toy.parts : fallback);
const rectOf = (el) => el.getBoundingClientRect();

// ---- Per-toy signature layer: gives every toy its own feel on top of its base
// interaction (unique waveform + pitch + a few mechanic tweaks) so no two play alike.
const WAVES = ["sine", "triangle", "square", "sawtooth"];
const SIG = {
  // grid
  popit: { popMode: "toggle", wave: "sine" }, simple: { popMode: "refill", wave: "square" },
  galaxy: { wave: "triangle" }, diamond: { wave: "sawtooth" },
  // flick — each a different physics feel
  spinner: { wave: "triangle", friction: 0.995 }, spinring: { wave: "square", friction: 0.93, detents: 8 },
  yoyo: { wave: "sine", friction: 0.9 }, trophy: { wave: "sawtooth", friction: 0.9 },
  saturn: { wave: "triangle", friction: 0.99, reverse: true },
  // combo — different timing windows + waveforms
  pushpop: { wave: "sine" }, cube: { wave: "square" }, clickpen: { wave: "square", windowMs: 250 },
  boink: { wave: "sawtooth" }, comet: { wave: "triangle", threshold: 15 },
  // stretch
  stressball: { wave: "sine" }, noodle: { wave: "sawtooth", launch: true }, slinky: { wave: "square" }, snap: { wave: "triangle" },
  // squeeze — marble squirts away instead of popping
  marble: { wave: "sine", escape: true }, mochi: { wave: "sine" }, unicorn: { wave: "triangle" },
  goojar: { wave: "square" }, phoenix: { wave: "sawtooth" }, blackhole: { wave: "sine" },
  // piano scales already vary; give waveforms
  cradle: { wave: "sine" }, musicbox: { wave: "sine" }, orb: { wave: "triangle" }, alien: { wave: "sawtooth" },
  // snow settle speeds
  sand: { wave: "square", settle: 2.6 }, wave: { wave: "sine", settle: 4 }, lavalamp: { wave: "sine", settle: 6 }, kaleido: { wave: "triangle", settle: 1.6 },
};
const sig = (toy) => SIG[toy.id] || {};
const sigWave = (toy) => sig(toy).wave || WAVES[[...toy.id].reduce((h, c) => h + c.charCodeAt(0), 0) % 4];

const FIDGETS = {
  // 1) POP-IT GRID
  grid(stage, toy) {
    const tier = TIERS[toy.tier], base = toyFreq(toy);
    const wave = sigWave(toy), mode = sig(toy).popMode || "once";
    const cols = 4, rows = 4, size = 48;
    const g = document.createElement("div");
    g.className = "popgrid";
    g.style.gridTemplateColumns = `repeat(${cols}, ${size}px)`;
    let remaining = cols * rows;
    for (let i = 0; i < cols * rows; i++) {
      const b = document.createElement("button");
      b.className = "bubble";
      b.style.width = b.style.height = size + "px";
      b.style.setProperty("--bc", tier.color);
      const f = base + i * 25;
      b.onpointerdown = (e) => {
        if (b.classList.contains("popped")) {
          if (mode === "toggle") { b.classList.remove("popped"); remaining++; tone(f * 0.6, 0.06, { type: wave, vol: 0.12 }); }
          return;
        }
        b.classList.add("popped");
        tone(f, 0.09, { type: wave, vol: 0.22, slideTo: f * 0.55 });
        const r = rectOf(stage);
        burst(stage, e.clientX - r.left, e.clientY - r.top, partsOf(toy, ["✨"]), 2, 50);
        if (mode === "refill") { // endless: this bubble comes back on its own
          setTimeout(() => b.classList.remove("popped"), 1200);
          return;
        }
        if (--remaining === 0) {
          SFX.celebrate();
          const r2 = rectOf(stage);
          burst(stage, r2.width / 2, r2.height / 2, partsOf(toy, ["🌟"]), 12, 260);
          setTimeout(() => {
            g.querySelectorAll(".bubble").forEach((x) => x.classList.remove("popped"));
            remaining = cols * rows;
          }, 550);
        }
      };
      g.appendChild(b);
    }
    stage.appendChild(g);
    return () => {};
  },

  // 2) FLICK SPINNER (momentum)
  flick(stage, toy) {
    const el = bigToy(toy);
    stage.appendChild(el);
    const S = sig(toy);
    const friction = S.friction ?? 0.985;
    const dir = S.reverse ? -1 : 1;
    let angle = 0, vel = 0, dragging = false, lastX = 0, lastT = 0, raf = 0, lastLap = 0;
    const snd = makeSustain(sigWave(toy));
    const base = toyFreq(toy);
    const frame = () => {
      angle += vel; vel *= friction;
      if (Math.abs(vel) < 0.05) vel = 0;
      el.style.transform = `rotate(${angle}deg)`;
      const speed = Math.min(1, Math.abs(vel) / 25);
      snd.setFreq(base * 0.5 + speed * 520); snd.setVol(speed * 0.14);
      if (Math.abs(angle - lastLap) > 360) { lastLap = angle; if (speed > 0.15) tone(1200, 0.05, { type: "sine", vol: 0.06 }); }
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    el.onpointerdown = (e) => { dragging = true; lastX = e.clientX; lastT = performance.now(); el.setPointerCapture(e.pointerId); };
    el.onpointermove = (e) => {
      if (!dragging) return;
      const now = performance.now(), dx = e.clientX - lastX, dt = Math.max(1, now - lastT);
      vel = Math.max(-32, Math.min(32, (dx / dt) * 12));
      lastX = e.clientX; lastT = now;
    };
    const end = () => { dragging = false; };
    el.onpointerup = end; el.onpointercancel = end;
    el.onclick = () => { if (Math.abs(vel) < 1) vel += 15 * dir; };
    return () => { cancelAnimationFrame(raf); snd.stop(); };
  },

  // 3) STRETCH (hold)
  stretch(stage, toy) {
    const el = bigToy(toy);
    stage.appendChild(el);
    const base = toyFreq(toy);
    let holding = false, s = 1, raf = 0, snd = null;
    const frame = () => {
      if (!holding) return;
      s = Math.min(2.4, s + 0.03);
      el.style.transform = `scaleY(${s}) scaleX(${1 - (s - 1) * 0.35})`;
      if (snd) { snd.setFreq(base * 0.6 + (s - 1) * 360); snd.setVol(0.12); }
      raf = requestAnimationFrame(frame);
    };
    el.onpointerdown = (e) => { holding = true; s = 1; el.style.transition = "none"; snd = makeSustain(sigWave(toy)); el.setPointerCapture(e.pointerId); raf = requestAnimationFrame(frame); };
    const release = () => {
      if (!holding) return;
      holding = false; cancelAnimationFrame(raf);
      if (snd) { tone(480 + (s - 1) * 220, 0.24, { type: "triangle", vol: 0.18, slideTo: 120 }); snd.stop(); snd = null; }
      el.style.transition = ""; el.style.transform = "";
      el.classList.remove("fx-wobble"); void el.offsetWidth; el.classList.add("fx-wobble");
      const r = rectOf(stage);
      burst(stage, r.width / 2, r.height / 2, partsOf(toy, ["💧", "✨"]), 4);
    };
    el.onpointerup = release; el.onpointercancel = release;
    return () => { holding = false; cancelAnimationFrame(raf); if (snd) snd.stop(); };
  },

  // 4) RAPID-FIRE COMBO
  combo(stage, toy) {
    const el = bigToy(toy);
    stage.appendChild(el);
    const base = toyFreq(toy), wave = sigWave(toy), windowMs = sig(toy).windowMs ?? 620;
    let combo = 0, timer = 0, hue = 0;
    el.onpointerdown = () => {
      combo++;
      tone(base + ((combo - 1) % 8) * 40, 0.12, { type: wave, vol: 0.16 });
      el.classList.remove("fx-pulse"); void el.offsetWidth; el.classList.add("fx-pulse");
      if (combo > 1) {
        const sr = rectOf(stage);
        const n = document.createElement("span");
        n.className = "combo-num"; n.textContent = "x" + combo;
        hue = (hue + 40) % 360; n.style.color = `hsl(${hue},90%,55%)`;
        n.style.left = (sr.width / 2 - 24) + "px"; n.style.top = (sr.height / 2 - 60) + "px";
        stage.appendChild(n); setTimeout(() => n.remove(), 700);
      }
      clearTimeout(timer);
      timer = setTimeout(() => {
        if (combo >= 3) {
          const sr = rectOf(stage);
          burst(stage, sr.width / 2, sr.height / 2, partsOf(toy, ["✨", "🌟", "💥", "⭐"]), Math.min(22, combo * 2), 240);
          [784, 659, 523, 392].forEach((f, i) => tone(f, 0.14, { type: "sine", vol: 0.16, when: i * 0.06 }));
        }
        combo = 0;
      }, windowMs);
    };
    return () => { clearTimeout(timer); };
  },

  // 5) PIANO (tap zones)
  piano(stage, toy) {
    const el = bigToy(toy);
    el.style.transition = "transform .3s cubic-bezier(.2,1.5,.4,1)";
    stage.appendChild(el);
    // per-toy scales: cradle pentatonic, alien eerie whole-tone, musicbox C major
    const scales = {
      cradle: [523, 587, 659, 784, 880, 523, 587, 659, 784],
      alien:  [300, 360, 420, 480, 540, 600, 660, 720, 840],
      default:[262, 294, 330, 349, 392, 440, 494, 523, 587],
    };
    const scale = scales[toy.id] || scales.default;
    const wave = toy.id === "alien" ? "sine" : (toy.id === "musicbox" ? "sine" : "triangle");
    el.onpointerdown = (e) => {
      const r = rectOf(el);
      const cx = (e.clientX - r.left) / r.width, cy = (e.clientY - r.top) / r.height;
      const col = Math.max(0, Math.min(2, Math.floor(cx * 3)));
      const row = Math.max(0, Math.min(2, Math.floor(cy * 3)));
      tone(scale[row * 3 + col], 0.3, { type: wave, vol: 0.2 });
      el.style.transform = `perspective(400px) rotateY(${(cx - 0.5) * 36}deg) rotateX(${-(cy - 0.5) * 36}deg)`;
      setTimeout(() => { el.style.transform = ""; }, 300);
      const sr = rectOf(stage);
      const rip = document.createElement("span");
      rip.className = "ripple";
      rip.style.left = (e.clientX - sr.left) + "px"; rip.style.top = (e.clientY - sr.top) + "px";
      stage.appendChild(rip); setTimeout(() => rip.remove(), 500);
    };
    return () => {};
  },

  // 6) WIND-UP CRANK — drag in circles to wind, release to unwind/spin.
  windup(stage, toy) {
    const el = bigToy(toy);
    const key = document.createElement("span");
    key.textContent = "🔑"; key.style.cssText = "position:absolute;font-size:28px;pointer-events:none;opacity:0;transition:opacity .2s;";
    stage.appendChild(el); stage.appendChild(key);
    const base = toyFreq(toy);
    let dragging = false, prevAng = 0, wound = 0, spin = 0, raf = 0, disp = 0, lastNotch = 0;
    const center = () => { const r = rectOf(stage); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; };
    const frame = () => {
      if (spin !== 0) {
        disp += spin; spin *= 0.94;
        if (Math.abs(spin) < 0.3) spin = 0;
        el.style.transform = `rotate(${disp}deg)`;
        const sp = Math.min(1, Math.abs(spin) / 20);
        raf = requestAnimationFrame(frame);
      }
    };
    el.onpointerdown = (e) => {
      dragging = true; wound = 0;
      const c = center(); prevAng = Math.atan2(e.clientY - c.y, e.clientX - c.x);
      key.style.opacity = "1"; el.setPointerCapture(e.pointerId);
    };
    el.onpointermove = (e) => {
      if (!dragging) return;
      const c = center();
      const a = Math.atan2(e.clientY - c.y, e.clientX - c.x);
      let d = a - prevAng;
      if (d > Math.PI) d -= 2 * Math.PI; if (d < -Math.PI) d += 2 * Math.PI;
      wound += d; prevAng = a;
      const deg = wound * 180 / Math.PI;
      disp = deg; el.style.transform = `rotate(${deg}deg) scale(${1 - Math.min(0.15, Math.abs(wound) / 40)})`;
      key.style.left = (e.clientX - rectOf(stage).left - 14) + "px";
      key.style.top = (e.clientY - rectOf(stage).top - 14) + "px";
      if (Math.abs(deg - lastNotch) > 30) { lastNotch = deg; tone(base, 0.03, { type: "square", vol: 0.1 }); tone(base * 0.75, 0.03, { type: "square", vol: 0.08, when: 0.02 }); }
    };
    const release = () => {
      if (!dragging) return;
      dragging = false; key.style.opacity = "0";
      const turns = Math.abs(wound) / (2 * Math.PI);
      spin = -Math.sign(wound) * Math.min(24, turns * 10);
      if (spin !== 0) {
        tone(base * 2, 0.5, { type: "sawtooth", vol: 0.14, slideTo: base * 0.5 });
        const r = rectOf(stage); burst(stage, r.width / 2, r.height / 2, partsOf(toy, ["💨", "✨"]), 5);
        cancelAnimationFrame(raf); raf = requestAnimationFrame(frame);
      }
      el.style.transform = `rotate(${disp}deg)`;
    };
    el.onpointerup = release; el.onpointercancel = release;
    return () => { cancelAnimationFrame(raf); };
  },

  // 7) BUBBLE-WRAP SHOWER — tap to burst into falling mini-toys you pop.
  shower(stage, toy) {
    const el = bigToy(toy);
    stage.appendChild(el);
    const mini = partsOf(toy, [toy.emoji]);
    let cooling = false;
    const rain = () => {
      if (cooling) return; cooling = true;
      el.style.transition = "opacity .2s"; el.style.opacity = ".2";
      SFX.pop();
      const sr = rectOf(stage);
      const n = 12;
      for (let i = 0; i < n; i++) {
        const s = document.createElement("span");
        s.textContent = mini[i % mini.length];
        const x = 20 + Math.random() * (sr.width - 40);
        s.style.cssText = `position:absolute;font-size:34px;left:${x}px;top:-30px;cursor:pointer;transition:top ${1.8 + Math.random() * 1.4}s linear, transform .15s;`;
        s.onpointerdown = () => { tone(400 + Math.random() * 900, 0.07, { type: "sine", vol: 0.18, slideTo: 160 }); s.style.transform = "scale(0)"; setTimeout(() => s.remove(), 150); };
        stage.appendChild(s);
        requestAnimationFrame(() => { s.style.top = (sr.height + 20) + "px"; });
        setTimeout(() => s.remove(), 3400);
      }
      setTimeout(() => { el.style.opacity = "1"; cooling = false; }, 900);
    };
    el.onpointerdown = rain;
    return () => {};
  },

  // 8) SQUEEZE — hold to squish; it deforms and SPRINGS BACK. Never pops or
  //    disappears. At max squish it gives a happy sparkle shimmer as the reward.
  squeeze(stage, toy) {
    const el = bigToy(toy);
    stage.appendChild(el);
    const invert = !!toy.invert, base = toyFreq(toy), S = sig(toy), wave = sigWave(toy);
    let holding = false, p = 0, raf = 0, snd = null, lastShimmer = 0;
    const escape = () => {
      // marble squirts out of your grip to a new spot (also never pops)
      holding = false; if (snd) { snd.stop(); snd = null; }
      cancelAnimationFrame(raf);
      tone(base, 0.18, { type: wave, vol: 0.18, slideTo: base * 3 });
      const sr = rectOf(stage);
      const nx = (Math.random() - 0.5) * (sr.width - 120);
      const ny = (Math.random() - 0.5) * (sr.height - 120);
      el.style.transition = "transform .25s cubic-bezier(.3,1.6,.5,1)";
      el.style.transform = `translate(${nx}px, ${ny}px)`;
      burst(stage, sr.width / 2, sr.height / 2, partsOf(toy, ["💨", "✨"]), 4, 120);
    };
    const frame = () => {
      if (!holding) return;
      p = Math.min(1, p + 0.02);
      if (S.escape && p >= 0.6) { escape(); return; }
      // squish: flatten a bit (or gently implode for the black hole), clamped so
      // it always keeps its shape — no scale-to-zero, no burst.
      const sy = invert ? 1 - p * 0.45 : 1 - p * 0.42;
      const sx = invert ? 1 - p * 0.35 : 1 + p * 0.30;
      el.style.transform = `scale(${sx}, ${sy})`;
      el.style.filter = `brightness(${1 + p * 0.35})`;
      if (snd) { snd.setFreq(invert ? base - p * 120 : base + p * 240); snd.setVol(0.06 + p * 0.1); }
      const now = performance.now();
      if (p > 0.82 && now - lastShimmer > 240) {
        lastShimmer = now;
        tone(880 + Math.random() * 300, 0.07, { type: "sine", vol: 0.12 });
        const r = rectOf(stage);
        burst(stage, r.width / 2, r.height / 2.4, partsOf(toy, ["✨", "⭐"]), 2, 90);
      }
      raf = requestAnimationFrame(frame);
    };
    el.onpointerdown = (e) => { holding = true; p = 0; el.style.transition = "none"; el.style.transform = ""; snd = makeSustain(wave); el.setPointerCapture(e.pointerId); raf = requestAnimationFrame(frame); };
    const release = () => {
      if (!holding) return;
      holding = false; cancelAnimationFrame(raf);
      if (snd) { tone(360 + p * 200, 0.2, { type: "triangle", vol: 0.16, slideTo: base }); snd.stop(); snd = null; }
      // spring back with a bouncy wobble — the toy stays whole
      el.style.transition = "transform .35s cubic-bezier(.34,1.56,.64,1), filter .3s";
      el.style.transform = ""; el.style.filter = "";
      el.classList.remove("fx-wobble"); void el.offsetWidth; el.classList.add("fx-wobble");
    };
    el.onpointerup = release; el.onpointercancel = release;
    return () => { holding = false; cancelAnimationFrame(raf); if (snd) snd.stop(); };
  },

  // 9) PETTING — stroke slowly to soothe; hearts + a purr.
  pet(stage, toy) {
    const el = bigToy(toy);
    stage.appendChild(el);
    const base = toyFreq(toy);
    let love = 0, lastX = 0, lastT = 0, lastHeart = 0, snd = null, active = false;
    const start = (e) => { active = true; lastX = e.clientX; lastT = performance.now(); snd = makeSustain("sine"); el.setPointerCapture(e.pointerId); };
    const move = (e) => {
      if (!active) return;
      const now = performance.now(), dx = Math.abs(e.clientX - lastX), dt = Math.max(1, now - lastT);
      const speed = dx / dt; // px/ms
      const slow = speed < 0.6 && dx > 2;
      el.style.transform = `rotate(${Math.max(-10, Math.min(10, (e.clientX - lastX) * 0.5))}deg)`;
      if (snd) { snd.setFreq(base * 0.5 + (slow ? 20 : 0)); snd.setVol(slow ? 0.09 : 0.02); }
      if (slow) {
        love += 0.02;
        if (now - lastHeart > 380) {
          lastHeart = now;
          const r = rectOf(stage);
          burst(stage, r.width / 2 + (Math.random() - .5) * 60, r.height / 2, partsOf(toy, ["💕", "✨"]), 1, 40);
        }
        if (love >= 1) { love = 0; tone(500, 0.1, { type: "sine", vol: 0.16 }); tone(660, 0.12, { type: "sine", vol: 0.16, when: 0.1 }); el.classList.remove("fx-pulse"); void el.offsetWidth; el.classList.add("fx-pulse"); }
      }
      lastX = e.clientX; lastT = now;
    };
    const end = () => { active = false; el.style.transform = ""; if (snd) { snd.stop(); snd = null; } };
    el.onpointerdown = start; el.onpointermove = move; el.onpointerup = end; el.onpointercancel = end;
    return () => { if (snd) snd.stop(); };
  },

  // 10) STACK TOWER — tap to stack copies; too many and it topples.
  stack(stage, toy) {
    const wrap = document.createElement("div");
    wrap.style.cssText = "position:absolute;bottom:8px;left:50%;transform:translateX(-50%);display:flex;flex-direction:column-reverse;align-items:center;";
    stage.appendChild(wrap);
    const base = toyFreq(toy);
    let count = 0, threshold = 6 + Math.floor(Math.random() * 4);
    const tap = () => {
      count++;
      const s = document.createElement("span");
      s.textContent = toy.emoji;
      s.style.cssText = `font-size:${Math.max(34, 52 - count * 2)}px;line-height:.9;transform:translateX(${(Math.random() - .5) * count * 3}px) rotate(${(Math.random() - .5) * 8}deg);`;
      wrap.appendChild(s);
      tone(base + count * 30, 0.06, { type: "triangle", vol: 0.14 });
      wrap.style.transition = "transform .2s"; wrap.style.transform = `translateX(-50%) rotate(${(Math.random() - .5) * count}deg)`;
      if (count >= threshold) {
        SFX.error();
        const sr = rectOf(stage);
        burst(stage, sr.width / 2, sr.height / 2, partsOf(toy, [toy.emoji, "💥"]), count, 300);
        [...wrap.children].forEach((c, i) => { c.style.transition = "transform .6s, opacity .6s"; setTimeout(() => { c.style.transform = `translate(${(Math.random() - .5) * 300}px, 200px) rotate(${(Math.random() - .5) * 720}deg)`; c.style.opacity = "0"; }, i * 40); });
        setTimeout(() => { wrap.innerHTML = ""; count = 0; threshold = 6 + Math.floor(Math.random() * 4); wrap.style.transform = "translateX(-50%)"; }, 700);
      }
    };
    stage.onpointerdown = tap;
    return () => { stage.onpointerdown = null; };
  },

  // 11) SNOWGLOBE SHAKE — scrub to stir up particles that slowly settle.
  snow(stage, toy) {
    const el = bigToy(toy);
    stage.appendChild(el);
    const base = toyFreq(toy);
    const marks = partsOf(toy, ["✨", "❄️", "💫"]);
    const settle = sig(toy).settle ?? 2.6;
    let lastX = 0, lastSpawn = 0, active = false;
    const spawn = (n = 3) => {
      const sr = rectOf(stage);
      for (let i = 0; i < n; i++) {
        const s = document.createElement("span");
        s.textContent = marks[Math.floor(Math.random() * marks.length)];
        const x = 10 + Math.random() * (sr.width - 20);
        s.style.cssText = `position:absolute;font-size:${18 + Math.random() * 14}px;left:${x}px;top:${20 + Math.random() * 60}px;transition:top ${settle}s ease-out, opacity .5s ${settle - .5}s;pointer-events:none;`;
        stage.appendChild(s);
        requestAnimationFrame(() => { s.style.top = (sr.height - 20 - Math.random() * 30) + "px"; s.style.opacity = "0"; });
        setTimeout(() => s.remove(), settle * 1000 + 200);
      }
    };
    const move = (e) => {
      if (!active) return;
      const dx = Math.abs(e.clientX - lastX); lastX = e.clientX;
      const now = performance.now();
      el.style.transform = `translate(${(Math.random() - .5) * 6}px, ${(Math.random() - .5) * 6}px) rotate(${(Math.random() - .5) * 10}deg)`;
      if (dx > 6 && now - lastSpawn > 60) { lastSpawn = now; spawn(2); tone(base + Math.random() * 800, 0.02, { type: "square", vol: 0.05 }); }
    };
    el.onpointerdown = (e) => { active = true; lastX = e.clientX; el.setPointerCapture(e.pointerId); };
    el.onpointermove = move;
    const end = () => { active = false; el.style.transform = ""; };
    el.onpointerup = end; el.onpointercancel = end;
    return () => {};
  },

  // 12) PEEL — drag to peel it off, revealing a little surprise, then it returns.
  peel(stage, toy) {
    const el = bigToy(toy);
    stage.appendChild(el);
    const base = toyFreq(toy);
    let dragging = false, sx = 0, sy = 0, snd = null;
    el.onpointerdown = (e) => { dragging = true; sx = e.clientX; sy = e.clientY; el.style.transition = "none"; snd = makeSustain("sawtooth"); el.setPointerCapture(e.pointerId); };
    el.onpointermove = (e) => {
      if (!dragging) return;
      const dx = e.clientX - sx, dy = e.clientY - sy;
      const dist = Math.hypot(dx, dy);
      el.style.transform = `translate(${dx}px, ${dy}px) rotate(${dx * 0.15}deg) skew(${Math.min(12, dist / 20)}deg)`;
      el.style.filter = "brightness(1.15)";
      if (snd) { snd.setFreq(base + Math.min(600, dist * 4)); snd.setVol(0.05 + Math.min(0.08, dist / 1500)); }
    };
    const release = (e) => {
      if (!dragging) return;
      dragging = false; if (snd) { snd.stop(); snd = null; }
      const dx = (e.clientX || sx) - sx, dy = (e.clientY || sy) - sy;
      const dist = Math.hypot(dx, dy);
      el.style.transition = "transform .5s, opacity .5s, filter .3s"; el.style.filter = "";
      if (dist > 90) {
        // peeled off: fly away, reveal a surprise, then return
        el.style.transform = `translate(${dx * 4}px, ${dy * 4}px) rotate(720deg)`; el.style.opacity = "0";
        SFX.buy();
        const r = rectOf(stage);
        burst(stage, r.width / 2, r.height / 2, partsOf(toy, ["✨", "⭐"]), 8, 220);
        tone(1200, 0.18, { type: "sine", vol: 0.16 });
        setTimeout(() => { el.style.transition = "none"; el.style.transform = "scale(0)"; el.style.opacity = "1"; void el.offsetWidth; el.style.transition = "transform .4s cubic-bezier(.34,1.56,.64,1)"; el.style.transform = ""; }, 520);
      } else {
        el.style.transform = ""; // snap back
        tone(180, 0.08, { type: "square", vol: 0.1 });
      }
    };
    el.onpointerup = release; el.onpointercancel = release;
    return () => { if (snd) snd.stop(); };
  },
};
// The 3D engine is the primary experience; these aliases give the newer play
// types a sensible themed interaction if a device falls back to 2D (no WebGL).
FIDGETS.squish = FIDGETS.squeeze;
FIDGETS.coil   = FIDGETS.stretch;
FIDGETS.cube   = FIDGETS.combo;
FIDGETS.tangle = FIDGETS.windup;

// ---- rarity guide ----
function openGuide() {
  const order = RARITY_ORDER;
  const found = new Set(state.discovered);
  const totalFound = TOYS.filter((x) => found.has(x.id)).length;
  $("guideList").innerHTML = order.map((tk) => {
    const t = TIERS[tk];
    const toys = TOYS.filter((x) => x.tier === tk);
    // discovered toys show their emoji; undiscovered show a shadowy ❔
    const emojis = toys.map((x) => found.has(x.id)
      ? x.emoji
      : `<span style="filter:grayscale(1) brightness(.5);opacity:.5">❔</span>`).join(" ");
    const fc = toys.filter((x) => found.has(x.id)).length;
    const values = toys.map((x) => x.value);
    const range = `🪙 ${Math.min(...values)}–${Math.max(...values)}`;
    return `
      <div class="guide-row" style="--c:${t.color};--g:${t.glow}">
        <span class="g-dot"></span>
        <div class="g-info">
          <div class="g-label">${t.label}</div>
          <div class="g-meta">${range}</div>
          <div class="g-emojis">${emojis}</div>
        </div>
        <span class="g-count">${fc}/${toys.length}</span>
      </div>`;
  }).join("") + `<div style="text-align:center;margin-top:12px;font-weight:800;color:var(--muted)">Collected ${totalFound}/${TOYS.length} toys!</div>`;
  $("guide").classList.add("show");
  SFX.tap();
}

// If the player has no toys at all, Foxy gifts a common so the game never dead-ends.
function safetyNet() {
  if (state.inventory.length === 0) {
    const common = TOYS.filter((t) => t.tier === "common");
    const gift = common[Math.floor(Math.random() * common.length)];
    gainToy(gift.id);
    toast(`${state.foxyAvatar} ${state.foxyName} gives you a ${gift.name}!`);
  }
}

// ---- avatar picker ----
function openPicker() {
  const grid = $("avatarGrid");
  grid.innerHTML = AVATARS.map((a) => `<button class="avatar-opt" data-av="${a}">${a}</button>`).join("");
  grid.querySelectorAll("[data-av]").forEach((el) => {
    el.onclick = () => { state.avatar = el.dataset.av; $("picker").classList.remove("show"); render(); };
  });
  $("picker").classList.add("show");
}

// ---- reset ----
function resetGame() {
  localStorage.removeItem(SAVE_KEY);
  uidCounter = 1;
  state = freshState();
  openPicker();
  render();
}

// ---- wire up ----
$("propose").onclick = propose;
$("decline").onclick = decline;
$("add").onclick = askMore;
$("restock").onclick = () => {
  if (state.coins < 10) { SFX.error(); toast("Not enough coins to restock!"); return; }
  state.coins -= 10; state.shop = makeShopStock(); SFX.buy(); render();
};
$("reset").onclick = resetGame;
$("playerAvatar").onclick = openPicker;

// mode toggle
document.querySelectorAll(".mode-btn").forEach((b) => {
  b.onclick = () => setMode(b.dataset.mode);
});

// fidget zone
$("fidgetClose").onclick = closeFidget;
$("fidget").onclick = (e) => { if (e.target.id === "fidget") closeFidget(); };

// rarity guide
$("guideBtn").onclick = openGuide;
$("guideClose").onclick = () => $("guide").classList.remove("show");
$("guide").onclick = (e) => { if (e.target.id === "guide") $("guide").classList.remove("show"); };

// mute toggle
function updateMuteBtn() { $("mute").textContent = muted ? "🔇" : "🔊"; }
$("mute").onclick = () => {
  muted = !muted;
  localStorage.setItem("emmy.muted", muted ? "1" : "0");
  updateMuteBtn();
  if (!muted) SFX.tap();
};
updateMuteBtn();

// background music — cycles Off → 🎵1 (Bouncy) → 🎵2 (Jazzy) → 🎵3 (Playful) → Off
function updateMusicBtn() {
  $("music").textContent = musicTrack === 0 ? "🔕" : "🎵" + musicTrack;
  $("music").style.opacity = musicTrack === 0 ? ".5" : "1";
  $("music").title = musicTrack === 0 ? "Music off (tap to cycle songs)" : "Music: " + TRACKS[musicTrack - 1].name;
}
$("music").onclick = () => {
  musicTrack = (musicTrack + 1) % 4;
  localStorage.setItem("emmy.music", String(musicTrack));
  updateMusicBtn();
  ac(); scheduleMusic();
  if (musicTrack) SFX.tap();
};
updateMusicBtn();
// Audio can only start after a user gesture — kick off on the first tap anywhere.
addEventListener("pointerdown", () => { ac(); scheduleMusic(); }, { once: true });

// deal-meter hide toggle
let meterHidden = localStorage.getItem("emmy.meterHidden") === "1";
function updateMeterBtn() {
  $("meterBody").classList.toggle("hidden", meterHidden);
  $("meterToggle").textContent = meterHidden ? "👁 Show deal meter" : "🙈 Hide deal meter";
}
$("meterToggle").onclick = () => {
  meterHidden = !meterHidden;
  localStorage.setItem("emmy.meterHidden", meterHidden ? "1" : "0");
  updateMeterBtn();
  SFX.tap();
};
updateMeterBtn();

// ---- Foxy character/name editor ----
const FOXY_AVATARS = ["🦊", "🐱", "🐶", "🐰", "🐻", "🐼", "🐨", "🐯", "🦁", "🐵", "🐧", "🦉", "🐢", "🦖", "🐙", "🐸"];
let foxyPick = null;
function openFoxyEditor() {
  foxyPick = state.foxyAvatar;
  const grid = $("foxyGrid");
  grid.innerHTML = FOXY_AVATARS.map((a) =>
    `<button class="avatar-opt" data-fav="${a}" style="${a === foxyPick ? "border-color:#ffb020;background:#fff3d6" : ""}">${a}</button>`).join("");
  grid.querySelectorAll("[data-fav]").forEach((el) => {
    el.onclick = () => {
      foxyPick = el.dataset.fav;
      grid.querySelectorAll(".avatar-opt").forEach((x) => x.style.cssText = "");
      el.style.cssText = "border-color:#ffb020;background:#fff3d6";
      SFX.tap();
    };
  });
  $("foxyNameInput").value = state.foxyName;
  $("foxyEditor").classList.add("show");
}
function saveFoxy() {
  const name = $("foxyNameInput").value.trim().slice(0, 14) || "Foxy";
  state.foxyName = name;
  state.foxyAvatar = foxyPick || "🦊";
  $("foxyEditor").classList.remove("show");
  SFX.buy();
  render();
}
$("foxyAvatar").onclick = openFoxyEditor;
$("foxySave").onclick = saveFoxy;
$("foxyEditClose").onclick = () => $("foxyEditor").classList.remove("show");
$("foxyEditor").onclick = (e) => { if (e.target.id === "foxyEditor") $("foxyEditor").classList.remove("show"); };

// ---- confetti ----
const canvas = $("confetti"), ctx = canvas.getContext("2d");
let bits = [];
const resize = () => { canvas.width = innerWidth; canvas.height = innerHeight; };
resize(); addEventListener("resize", resize);
function celebrate() {
  const cs = ["#ff4d94", "#3d8bfd", "#00c853", "#ffb020", "#b558f6", "#ff8a8a"];
  for (let i = 0; i < 140; i++) {
    bits.push({
      x: innerWidth / 2 + (Math.random() - .5) * 120, y: innerHeight / 2.5,
      vx: (Math.random() - .5) * 15, vy: Math.random() * -13 - 4,
      c: cs[i % cs.length], r: Math.random() * 7 + 4, a: 1,
      rot: Math.random() * 6, vr: (Math.random() - .5) * .4,
    });
  }
}
function loop() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  bits.forEach((b) => {
    b.x += b.vx; b.y += b.vy; b.vy += .4; b.a -= .011; b.rot += b.vr;
    ctx.save(); ctx.globalAlpha = Math.max(0, b.a);
    ctx.translate(b.x, b.y); ctx.rotate(b.rot);
    ctx.fillStyle = b.c; ctx.fillRect(-b.r / 2, -b.r / 2, b.r, b.r);
    ctx.restore();
  });
  bits = bits.filter((b) => b.a > 0);
  requestAnimationFrame(loop);
}
loop();

// ---- toast ----
let toastTimer;
function toast(msg) {
  const el = $("toast");
  el.textContent = msg;
  el.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove("show"), 1800);
}

// ---- boot ----
state = load() || freshState();
if (!state.avatar) openPicker();
render();
