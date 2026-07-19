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
  return {
    avatar: null, // null => show picker on first run
    coins: 60,
    streak: 0,
    // inventory is an array of INSTANCES so a specific copy can move into a trade
    inventory: starterToys().map((t) => ({ uid: uidCounter++, id: t.id })),
    offer: makeFoxyOffer(),
    give: [],            // uids currently offered from inventory
    shop: makeShopStock(),
  };
}

function load() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return null;
    const s = JSON.parse(raw);
    // restore uid counter above any saved uid
    const maxUid = s.inventory.reduce((m, it) => Math.max(m, it.uid), 0);
    uidCounter = maxUid + 1;
    // a live offer/shop isn't worth persisting mid-trade; make fresh ones
    s.offer = makeFoxyOffer();
    s.give = [];
    if (!s.shop || !s.shop.length) s.shop = makeShopStock();
    return s;
  } catch { return null; }
}

function save() {
  const { avatar, coins, streak, inventory, shop } = state;
  localStorage.setItem(SAVE_KEY, JSON.stringify({ avatar, coins, streak, inventory, shop }));
}

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

  // Foxy's mood about your current offer
  const mood = foxyMood(gv, state.offer.wantValue);
  $("foxyMood").textContent = mood.face;
  $("foxyLine").textContent = mood.line;

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
      // add a sell-price badge before the closing div
      html = html.replace(/<\/div>\s*$/, `<span class="sellbadge">💰 ${sellPrice(toy)}</span></div>`);
    }
    return html;
  }).join("");
  bag.querySelectorAll("[data-uid]").forEach((el) => {
    const uid = Number(el.dataset.uid);
    el.onclick = () => {
      if (mode === "trade") addToTray(uid);
      else if (mode === "play") openFidget(uid);
      else if (mode === "sell") sell(uid);
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

// ---- sell ----
function sell(uid) {
  const it = invItem(uid);
  if (!it) return;
  const toy = byId(it.id);
  const price = sellPrice(toy);
  state.inventory = state.inventory.filter((x) => x.uid !== uid);
  state.give = state.give.filter((u) => u !== uid);
  state.coins += price;
  SFX.sell();
  toast(`💰 Sold ${toy.name} for 🪙${price}!`);
  safetyNet();
  render();
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
      toast("🦊 Foxy has a fresh trade for you!");
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
  state.offer.theirs.forEach((t) => state.inventory.push({ uid: uidCounter++, id: t.id }));

  // Coins: small base + how much better than fair you did (capped).
  const bonus = Math.min(30, 6 + Math.max(0, Math.round(e.net)));
  state.coins += bonus;

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
}

function decline() {
  state.streak = 0;
  SFX.tap();
  toast("👋 Foxy brings a new trade!");
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
  state.inventory.push({ uid: uidCounter++, id: s.id });
  SFX.buy();
  toast(`🛍️ Bought a ${byId(s.id).name}!`);
  render();
}

// ---- backpack mode + fidget play zone ----
function setMode(m) {
  mode = m;
  document.querySelectorAll(".mode-btn").forEach((b) => b.classList.toggle("active", b.dataset.mode === m));
  $("modeHint").textContent = {
    trade: "Tap a toy to add it to your trade offer.",
    play:  "Tap a toy to play with it in the Fidget Zone! 🎮",
    sell:  "Tap a toy to sell it to Foxy for coins. 💰",
  }[m];
  SFX.tap();
  render();
}

// Each toy's `play` type maps to one of five DISTINCT interactions.
const TIPS = {
  pop:    "👆 Pop all the bubbles!",
  spin:   "↔️ Drag across it to spin — faster = louder!",
  squish: "✊ Press and HOLD to stretch, let go to boing!",
  click:  "🎹 Tap different spots to play notes!",
  shake:  "⚡ Tap as FAST as you can for a combo!",
};
let fidgetToyObj = null;
let fidgetCleanup = null; // teardown for the active interaction

function openFidget(uid) {
  const it = invItem(uid);
  if (!it) return;
  fidgetToyObj = byId(it.id);
  const type = fidgetToyObj.play || "shake";
  $("fidgetName").textContent = fidgetToyObj.name;
  $("fidgetTip").textContent = TIPS[type] || "👆 Play with your toy!";
  const stage = $("fidgetStage");
  if (fidgetCleanup) { fidgetCleanup(); fidgetCleanup = null; }
  stage.innerHTML = "";
  fidgetCleanup = (FIDGETS[type] || FIDGETS.shake)(stage, fidgetToyObj) || null;
  $("fidget").classList.add("show");
  SFX.tap();
}
function closeFidget() {
  if (fidgetCleanup) { fidgetCleanup(); fidgetCleanup = null; }
  $("fidgetStage").innerHTML = "";
  $("fidget").classList.remove("show");
  fidgetToyObj = null;
}

// A sustained oscillator whose pitch/volume we tweak live (for spin & stretch).
function makeSustain(type = "sawtooth") {
  if (muted) return { setFreq() {}, setVol() {}, stop() {} };
  const ctx = ac();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  const filter = ctx.createBiquadFilter();
  filter.type = "lowpass"; filter.frequency.value = 1400;
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

const FIDGETS = {
  // 1) POP-IT GRID — pop each bubble; clear them all for a fanfare + refill.
  pop(stage, toy) {
    const tier = TIERS[toy.tier];
    const cols = 4, rows = 4, size = 48;
    const grid = document.createElement("div");
    grid.className = "popgrid";
    grid.style.gridTemplateColumns = `repeat(${cols}, ${size}px)`;
    let remaining = cols * rows;
    for (let i = 0; i < cols * rows; i++) {
      const b = document.createElement("button");
      b.className = "bubble";
      b.style.width = b.style.height = size + "px";
      b.style.setProperty("--bc", tier.color);
      const f = 520 + Math.random() * 480; // each bubble keeps its own pitch
      b.onpointerdown = (e) => {
        if (b.classList.contains("popped")) return;
        b.classList.add("popped");
        tone(f, 0.09, { type: "sine", vol: 0.22, slideTo: f * 0.55 });
        const r = stage.getBoundingClientRect();
        burst(stage, e.clientX - r.left, e.clientY - r.top, ["✨"], 2, 50);
        if (--remaining === 0) {
          SFX.celebrate();
          setTimeout(() => {
            grid.querySelectorAll(".bubble").forEach((x) => x.classList.remove("popped"));
            remaining = cols * rows;
          }, 550);
        }
      };
      grid.appendChild(b);
    }
    stage.appendChild(grid);
    return () => {};
  },

  // 2) FLICK SPINNER — drag to spin with momentum; sound tracks the speed.
  spin(stage, toy) {
    const el = bigToy(toy);
    stage.appendChild(el);
    let angle = 0, vel = 0, dragging = false, lastX = 0, lastT = 0, raf = 0;
    const snd = makeSustain("sawtooth");
    const frame = () => {
      angle += vel;
      vel *= 0.985;
      if (Math.abs(vel) < 0.05) vel = 0;
      el.style.transform = `rotate(${angle}deg)`;
      const speed = Math.min(1, Math.abs(vel) / 25);
      snd.setFreq(120 + speed * 520);
      snd.setVol(speed * 0.14);
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
    el.onclick = () => { if (Math.abs(vel) < 1) vel += 15; }; // plain tap = gentle push
    return () => { cancelAnimationFrame(raf); snd.stop(); };
  },

  // 3) STRETCH — press & hold to stretch it, release to boing back.
  squish(stage, toy) {
    const el = bigToy(toy);
    stage.appendChild(el);
    let holding = false, stretch = 1, raf = 0, snd = null;
    const frame = () => {
      if (!holding) return;
      stretch = Math.min(2.4, stretch + 0.03);
      el.style.transform = `scaleY(${stretch}) scaleX(${1 - (stretch - 1) * 0.35})`;
      if (snd) { snd.setFreq(150 + (stretch - 1) * 360); snd.setVol(0.12); }
      raf = requestAnimationFrame(frame);
    };
    el.onpointerdown = (e) => {
      holding = true; stretch = 1; el.style.transition = "none";
      snd = makeSustain("sine"); el.setPointerCapture(e.pointerId);
      raf = requestAnimationFrame(frame);
    };
    const release = () => {
      if (!holding) return;
      holding = false; cancelAnimationFrame(raf);
      if (snd) { tone(480 + (stretch - 1) * 220, 0.24, { type: "triangle", vol: 0.18, slideTo: 120 }); snd.stop(); snd = null; }
      el.style.transition = ""; el.style.transform = "";
      el.classList.remove("fx-wobble"); void el.offsetWidth; el.classList.add("fx-wobble");
      const r = stage.getBoundingClientRect();
      burst(stage, r.width / 2, r.height / 2, ["💧", "✨"], 4);
    };
    el.onpointerup = release; el.onpointercancel = release;
    return () => { holding = false; cancelAnimationFrame(raf); if (snd) snd.stop(); };
  },

  // 4) PIANO — tap different spots (3x3 zones) for different marimba notes.
  click(stage, toy) {
    const el = bigToy(toy);
    el.style.transition = "transform .3s cubic-bezier(.2,1.5,.4,1)";
    stage.appendChild(el);
    const scale = [262, 294, 330, 349, 392, 440, 494, 523, 587]; // C major
    el.onpointerdown = (e) => {
      const r = el.getBoundingClientRect();
      const cx = (e.clientX - r.left) / r.width, cy = (e.clientY - r.top) / r.height;
      const col = Math.max(0, Math.min(2, Math.floor(cx * 3)));
      const row = Math.max(0, Math.min(2, Math.floor(cy * 3)));
      tone(scale[row * 3 + col], 0.3, { type: "triangle", vol: 0.2 });
      el.style.transform = `perspective(400px) rotateY(${(cx - 0.5) * 36}deg) rotateX(${-(cy - 0.5) * 36}deg)`;
      setTimeout(() => { el.style.transform = ""; }, 300);
      const sr = stage.getBoundingClientRect();
      const rip = document.createElement("span");
      rip.className = "ripple";
      rip.style.left = (e.clientX - sr.left) + "px";
      rip.style.top = (e.clientY - sr.top) + "px";
      stage.appendChild(rip);
      setTimeout(() => rip.remove(), 500);
    };
    return () => {};
  },

  // 5) RAPID-FIRE COMBO — mash it; pitch walks a pentatonic scale, burst on stop.
  shake(stage, toy) {
    const el = bigToy(toy);
    stage.appendChild(el);
    const penta = [523, 587, 659, 784, 880];
    let combo = 0, timer = 0, hue = 0;
    el.onpointerdown = () => {
      combo++;
      const octave = 1 + Math.floor((combo - 1) / penta.length) * 0.03;
      tone(penta[(combo - 1) % penta.length] * octave, 0.12, { type: "square", vol: 0.16 });
      el.classList.remove("fx-pulse"); void el.offsetWidth; el.classList.add("fx-pulse");
      if (combo > 1) {
        const sr = stage.getBoundingClientRect();
        const n = document.createElement("span");
        n.className = "combo-num"; n.textContent = "x" + combo;
        hue = (hue + 40) % 360; n.style.color = `hsl(${hue},90%,55%)`;
        n.style.left = (sr.width / 2 - 24) + "px"; n.style.top = (sr.height / 2 - 60) + "px";
        stage.appendChild(n); setTimeout(() => n.remove(), 700);
      }
      clearTimeout(timer);
      timer = setTimeout(() => {
        if (combo >= 3) {
          const sr = stage.getBoundingClientRect();
          burst(stage, sr.width / 2, sr.height / 2, ["✨", "🌟", "💥", "⭐"], Math.min(22, combo * 2), 240);
          [784, 659, 523, 392].forEach((f, i) => tone(f, 0.14, { type: "sine", vol: 0.16, when: i * 0.06 }));
        }
        combo = 0;
      }, 620);
    };
    return () => { clearTimeout(timer); };
  },
};

// ---- rarity guide ----
function openGuide() {
  const order = ["common", "uncommon", "rare", "epic", "legendary", "mythic", "cosmic"];
  const owned = new Set(state.inventory.map((it) => it.id));
  $("guideList").innerHTML = order.map((tk) => {
    const t = TIERS[tk];
    const toys = TOYS.filter((x) => x.tier === tk);
    const emojis = toys.map((x) => x.emoji).join(" ");
    const found = toys.filter((x) => owned.has(x.id)).length;
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
        <span class="g-count">${found}/${toys.length}</span>
      </div>`;
  }).join("");
  $("guide").classList.add("show");
  SFX.tap();
}

// If the player has no toys at all, Foxy gifts a common so the game never dead-ends.
function safetyNet() {
  if (state.inventory.length === 0) {
    const common = TOYS.filter((t) => t.tier === "common");
    const gift = common[Math.floor(Math.random() * common.length)];
    state.inventory.push({ uid: uidCounter++, id: gift.id });
    toast(`🦊 Foxy feels bad and gives you a ${gift.name}!`);
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
