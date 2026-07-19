import {
  TIERS, TOYS, byId, sum, reseed, evaluate, TONE_COLORS,
  AVATARS, starterToys, makeFoxyOffer, foxyMood, askMoreOutcome, makeShopStock, sellPrice,
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
    // inventory is an array of INSTANCES so a specific copy can move into a trade
    inventory: starters.map((t) => ({ uid: uidCounter++, id: t.id })),
    offer: makeFoxyOffer(),
    give: [],            // uids currently offered from inventory
    shop: makeShopStock(),
    // mystery-box tracking
    lastFreeBoxDate: null,
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
    // a live offer/shop isn't worth persisting mid-trade; make fresh ones
    s.offer = makeFoxyOffer();
    s.give = [];
    if (!s.shop || !s.shop.length) s.shop = makeShopStock();
    if (!Array.isArray(s.discovered)) s.discovered = [];
    return s;
  } catch { return null; }
}

function save() {
  const { avatar, foxyName, foxyAvatar, coins, streak, inventory, shop,
          lastFreeBoxDate, tradesTowardBox, luckyMeter, boxesSinceEpicPlus, totalBoxesOpened, discovered } = state;
  localStorage.setItem(SAVE_KEY, JSON.stringify({
    avatar, foxyName, foxyAvatar, coins, streak, inventory, shop,
    lastFreeBoxDate, tradesTowardBox, luckyMeter, boxesSinceEpicPlus, totalBoxesOpened, discovered,
  }));
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
      <div class="face">${toy.emoji}</div>
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
  $("tagline").textContent = `Build a trade ${state.foxyName} will accept! ${state.foxyAvatar}`;

  // Foxy's toys
  const theirs = state.offer.theirs;
  $("theirs").innerHTML = theirs.map((t) => toyCardHtml(t)).join("");
  $("getTotal").textContent = `🪙 ${sum(theirs)}`;

  // Your give tray (tap to remove)
  const gv = giveValue();
  $("giveTotal").textContent = `🪙 ${gv}`;
  const tray = $("giveTray");
  if (!state.give.length) {
    tray.innerHTML = `<div class="hint">👇 Tap toys in your backpack to add them here</div>`;
  } else {
    tray.innerHTML = state.give.map((uid) => {
      const toy = byId(invItem(uid).id);
      return toyCardHtml(toy, { tap: true }).replace('data-toy', `data-give="${uid}" data-toy`);
    }).join("");
    tray.querySelectorAll("[data-give]").forEach((el) => {
      el.onclick = () => removeFromTray(Number(el.dataset.give));
    });
  }

  // Foxy's mood about your current offer — unless a sell chat is happening.
  if (!chat) {
    const mood = foxyMood(gv, state.offer.wantValue);
    // idle "🦊" face follows the chosen character; emotion faces stay as-is
    $("foxyMood").textContent = gv === 0 ? state.foxyAvatar : mood.face;
    $("foxyLine").textContent = mood.line;
    $("chatButtons").innerHTML = "";
  }

  // "Good for YOU" meter (educational): compares what you get vs give
  if (!state.give.length) {
    // Nothing offered yet — don't imply it's a great deal.
    $("needle").style.left = "50%";
    $("verdict").innerHTML = `<span style="color:var(--muted)">🤷 Add toys to see your deal</span>`;
    $("stars").textContent = "☆☆☆☆☆";
    $("values").innerHTML = `You get <b class="get">🪙${sum(theirs)}</b> &nbsp;·&nbsp; You give <b class="give">🪙0</b>`;
  } else {
    const e = evaluate(theirs, giveToys());
    const pctRaw = ((e.ratio - 0.5) / (2.0 - 0.5)) * 100;
    $("needle").style.left = Math.max(3, Math.min(97, pctRaw)) + "%";
    $("verdict").innerHTML = `<span style="color:${TONE_COLORS[e.tone]}">${e.emoji} ${e.label}</span>`;
    $("stars").textContent = "⭐".repeat(e.rating) + "☆".repeat(5 - e.rating);
    $("values").innerHTML = `You get <b class="get">🪙${e.get}</b> &nbsp;·&nbsp; You give <b class="give">🪙${e.give}</b>`;
  }

  // buttons
  $("propose").disabled = state.give.length === 0;
  const outOfAsks = state.offer.asks >= MAX_ASKS;
  $("add").disabled = outOfAsks;
  $("add").textContent = outOfAsks ? "🚫 No more asks" : "➕ Ask for more";

  renderBackpack();
  renderShop();
  renderBoxes();
  save();
}

function renderBackpack() {
  const bag = $("backpack");
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
        <div class="face">${toy.emoji}</div>
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
    "Okay okay, {c}! You drive a hard bargain! 😆",
    "Hmmm… fiiine, {c}! Just for you!",
    "You're good at this! {c}!",
    "Ooof, okay! {c}! My tail is twitching!",
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
  const lo = precious ? 0.84 : 0.80;
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
  const genChance = precious ? 0.12 : 0.08;
  if (roll < genChance) {
    chat.offer = Math.round(v * (1.0 + Math.random() * 0.05));
    chat.ended = true;
    SFX.buy();
    renderChat(pickLine("generous", chat.toy, chat.offer), true);
  } else if (roll < genChance + 0.25) {
    chat.ended = true;
    SFX.refuse();
    renderChat(pickLine("refused", chat.toy, chat.offer), false);
  } else {
    const bump = chat.round === 1 ? (0.04 + Math.random() * 0.04) : (0.02 + Math.random() * 0.03);
    chat.offer = Math.min(Math.round(v * 0.97), chat.offer + Math.round(v * bump));
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
function newOffer() {
  state.offer = makeFoxyOffer();
  state.give = [];
  render();
}

function propose() {
  if (!state.give.length) return;
  const gv = giveValue();
  const mood = foxyMood(gv, state.offer.wantValue);
  if (!mood.accepts) {
    state.offer.refusals = (state.offer.refusals || 0) + 1;
    SFX.refuse();
    if (state.offer.refusals >= 2) {
      toast(`${state.foxyAvatar} ${state.foxyName} has a fresh trade for you!`);
      state.streak = 0;
      newOffer();
    } else {
      toast(`${mood.face} ${mood.line}`);
      render();
    }
    return;
  }

  // Accepted! Swap toys: remove given from inventory, add Foxy's toys.
  const e = evaluate(state.offer.theirs, giveToys());
  state.inventory = state.inventory.filter((it) => !state.give.includes(it.uid));
  state.offer.theirs.forEach((t) => gainToy(t.id));

  // Coins: small base + how much better than fair you did (capped).
  const bonus = Math.min(30, 6 + Math.max(0, Math.round(e.net)));
  state.coins += bonus;

  // trade milestone -> free Rainbow Box every 5 trades
  state.tradesTowardBox++;
  let milestone = false;
  if (state.tradesTowardBox % 5 === 0) milestone = true;

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
  newOffer();
  if (milestone) { toast("🎁 5 trades! Here's a free Rainbow Box!"); openBox("rainbow", true); }
}

function decline() {
  state.streak = 0;
  SFX.tap();
  toast(`👋 ${state.foxyName} brings a new trade!`);
  newOffer();
}

function askMore() {
  if (state.offer.asks >= MAX_ASKS) return;
  const out = askMoreOutcome(state.offer);
  if (out.type === "added") SFX.add();
  else if (out.type === "removed" || out.type === "ended") SFX.refuse();
  else SFX.tap();
  toast(out.line);
  if (out.type === "ended") { state.streak = 0; newOffer(); return; }
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
    weights: { common: 550, uncommon: 300, rare: 110, epic: 30, legendary: 8, mythic: 2, cosmic: 0 } },
  rainbow: { name: "Rainbow Box", emoji: "🌈", cost: 90, color: "#3d8bfd",
    weights: { common: 250, uncommon: 350, rare: 250, epic: 100, legendary: 40, mythic: 9, cosmic: 1 } },
  galaxy:  { name: "Galaxy Box", emoji: "🌌", cost: 250, color: "#b558f6",
    weights: { common: 0, uncommon: 300, rare: 350, epic: 220, legendary: 90, mythic: 34, cosmic: 6 } },
};
const RARITY_ORDER = ["common", "uncommon", "rare", "epic", "legendary", "mythic", "cosmic"];

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

function todayStr() { return new Date().toDateString(); }
function freeBoxReady() { return state.lastFreeBoxDate !== todayStr(); }

function renderBoxes() {
  const banner = $("boxBanner");
  if (freeBoxReady()) {
    banner.className = "box-banner ready";
    banner.textContent = "🎁 Your FREE daily box is ready — tap to open!";
    banner.onclick = () => { state.lastFreeBoxDate = todayStr(); openBox("sparkle", true); };
  } else {
    banner.className = "box-banner";
    banner.textContent = "🎁 Free box opened! Come back tomorrow for another!";
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
        <div class="rtoy" style="filter:drop-shadow(0 0 30px ${tier.color})">${toy.emoji}</div>
        <div class="rname">${toy.name}${isNew ? '<span class="rnew">NEW!</span>' : ""}</div>
        <div class="rpill" style="background:${tier.color}">${tier.label}</div>
        <div style="color:#ffd54a;font-weight:800;margin-top:6px">🪙 ${toy.value}</div>
        ${big ? `<div class="box-banner-big" style="color:${tier.color}">${tier.label.toUpperCase()}!!</div>` : ""}`;
      // reveal sound: longer fanfare for higher tiers
      const notes = [523, 659, 784, 1047, 1319].slice(0, Math.min(5, 2 + idxRank(rarity)));
      notes.forEach((f, i) => tone(f, 0.18, { type: "triangle", vol: 0.18, when: i * 0.09 }));
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
  grid:    "👆 Pop all the bubbles!",
  flick:   "↔️ Drag across it to spin — faster = louder!",
  stretch: "✊ Press and HOLD to stretch, let go to boing!",
  combo:   "⚡ Tap as FAST as you can for a combo!",
  piano:   "🎹 Tap different spots to play notes!",
  windup:  "🔄 Drag in circles to wind it up, then let go!",
  shower:  "👆 Tap to burst it — pop the falling pieces!",
  squeeze: "✊ Press and HOLD to squeeze till it POPS!",
  pet:     "🫳 Gently stroke it back and forth...",
  stack:   "👆 Tap to stack them — how high can you go?",
  snow:    "↔️ Scrub fast to shake it all up!",
  peel:    "✊ Drag it to peel off a surprise!",
};
let fidgetToyObj = null;
let fidgetCleanup = null; // teardown for the active interaction

function openFidget(uid) {
  const it = invItem(uid);
  if (!it) return;
  fidgetToyObj = byId(it.id);
  const type = fidgetToyObj.play || "combo";
  $("fidgetName").textContent = fidgetToyObj.name;
  $("fidgetTip").textContent = TIPS[type] || "👆 Play with your toy!";
  const stage = $("fidgetStage");
  if (fidgetCleanup) { fidgetCleanup(); fidgetCleanup = null; }
  stage.innerHTML = "";
  fidgetCleanup = (FIDGETS[type] || FIDGETS.combo)(stage, fidgetToyObj) || null;
  $("fidget").classList.add("show");
  SFX.tap();
}
function closeFidget() {
  if (fidgetCleanup) { fidgetCleanup(); fidgetCleanup = null; }
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

const FIDGETS = {
  // 1) POP-IT GRID
  grid(stage, toy) {
    const tier = TIERS[toy.tier], base = toyFreq(toy);
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
        if (b.classList.contains("popped")) return;
        b.classList.add("popped");
        tone(f, 0.09, { type: "sine", vol: 0.22, slideTo: f * 0.55 });
        const r = rectOf(stage);
        burst(stage, e.clientX - r.left, e.clientY - r.top, partsOf(toy, ["✨"]), 2, 50);
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
    const zen = toy.id === "spinring" || toy.id === "saturn";
    const friction = zen ? 0.994 : 0.985;
    let angle = 0, vel = 0, dragging = false, lastX = 0, lastT = 0, raf = 0, lastLap = 0;
    const snd = makeSustain("triangle");
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
    el.onclick = () => { if (Math.abs(vel) < 1) vel += 15; };
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
    el.onpointerdown = (e) => { holding = true; s = 1; el.style.transition = "none"; snd = makeSustain("sine"); el.setPointerCapture(e.pointerId); raf = requestAnimationFrame(frame); };
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
    const base = toyFreq(toy);
    let combo = 0, timer = 0, hue = 0;
    el.onpointerdown = () => {
      combo++;
      tone(base + ((combo - 1) % 8) * 40, 0.12, { type: "square", vol: 0.16 });
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
      }, 620);
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

  // 8) SQUEEZE & BURST — hold to inflate (or implode) until it pops, then reform.
  squeeze(stage, toy) {
    const el = bigToy(toy);
    stage.appendChild(el);
    const invert = !!toy.invert, base = toyFreq(toy);
    let holding = false, p = 0, raf = 0, snd = null, burstDone = false;
    const frame = () => {
      if (!holding) return;
      p = Math.min(1, p + 0.018);
      const sc = invert ? 1 - p * 0.7 : 1 + p * 0.9;
      el.style.transform = `scale(${sc})`;
      el.style.filter = `brightness(${1 + p * 0.5})`;
      if (snd) { snd.setFreq(invert ? base - p * 120 : base + p * 300); snd.setVol(0.06 + p * 0.1); }
      if (p >= 1 && !burstDone) { burstDone = true; doBurst(); }
      else raf = requestAnimationFrame(frame);
    };
    const doBurst = () => {
      holding = false; if (snd) { snd.stop(); snd = null; }
      tone(invert ? 60 : 520, 0.3, { type: "sine", vol: 0.2, slideTo: invert ? 900 : 90 });
      el.style.transition = "transform .1s, opacity .1s"; el.style.transform = "scale(0)"; el.style.opacity = "0";
      const r = rectOf(stage);
      burst(stage, r.width / 2, r.height / 2, partsOf(toy, ["💥", "✨"]), 14, invert ? -220 : 260);
      setTimeout(() => {
        el.style.transition = ""; el.style.filter = ""; el.style.opacity = "1";
        el.classList.remove("fx-wobble"); void el.offsetWidth; el.classList.add("fx-wobble");
        el.style.transform = "";
      }, 500);
    };
    el.onpointerdown = (e) => { holding = true; burstDone = false; p = 0; el.style.transition = "none"; snd = makeSustain("sine"); el.setPointerCapture(e.pointerId); raf = requestAnimationFrame(frame); };
    const release = () => {
      if (!holding) return;
      holding = false; cancelAnimationFrame(raf);
      if (snd) { snd.stop(); snd = null; }
      el.style.transition = "transform .3s, filter .3s"; el.style.transform = ""; el.style.filter = "";
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
    const settle = toy.id === "lavalamp" ? 6 : toy.id === "wave" ? 4 : 2.6;
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

// ---- rarity guide ----
function openGuide() {
  const order = ["common", "uncommon", "rare", "epic", "legendary", "mythic", "cosmic"];
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
