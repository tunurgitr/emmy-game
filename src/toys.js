// Shared fidget-toy catalog + trade logic used by all mockups.
// Each toy has an emoji, a name, a coin value, and a rarity tier (for color/glow).

export const TIERS = {
  common:    { label: "Common",    color: "#9fb4c7", glow: "rgba(159,180,199,.6)" },
  uncommon:  { label: "Uncommon",  color: "#4caf78", glow: "rgba(76,175,120,.7)" },
  rare:      { label: "Rare",      color: "#3d8bfd", glow: "rgba(61,139,253,.75)" },
  epic:      { label: "Epic",      color: "#b558f6", glow: "rgba(181,88,246,.8)" },
  legendary: { label: "Legendary", color: "#ffb020", glow: "rgba(255,176,32,.9)" },
  mythic:    { label: "Mythic",    color: "#ff3d9a", glow: "rgba(255,61,154,.9)" },
  cosmic:    { label: "Cosmic",    color: "#00e5d0", glow: "rgba(0,229,208,.95)" },
};

// `play` = one of 12 Fidget-Zone interactions:
//   grid | flick | stretch | combo | piano | windup | shower | squeeze | pet | stack | snow | peel
// `parts` = optional themed particle emoji for that toy (defaults per interaction otherwise).
export const TOYS = [
  // ---- Common ----
  { id: "popit",     name: "Pop It",          emoji: "🫧",  value: 8,   tier: "common",    play: "grid" },
  { id: "simple",    name: "Simple Dimple",   emoji: "🟣",  value: 10,  tier: "common",    play: "grid" },
  { id: "marble",    name: "Squishy Ball",    emoji: "🔵",  value: 12,  tier: "common",    play: "squeeze", parts: ["💧","🔵"] },
  { id: "bubble",    name: "Bubble Wrap",     emoji: "🧇",  value: 14,  tier: "common",    play: "shower" },
  { id: "stressball",name: "Stress Ball",     emoji: "🎾",  value: 11,  tier: "common",    play: "stretch" },
  { id: "pebble",    name: "Worry Stone",     emoji: "🪨",  value: 9,   tier: "common",    play: "pet" },
  { id: "pushpop",   name: "Push Popper",     emoji: "🔴",  value: 13,  tier: "common",    play: "combo" },
  { id: "beadring",  name: "Bead Ring",       emoji: "🔮",  value: 15,  tier: "common",    play: "pet" },
  { id: "putty",     name: "Silly Putty",     emoji: "🟩",  value: 16,  tier: "common",    play: "peel" },
  { id: "noodle",    name: "Stretchy Noodle", emoji: "🍜",  value: 17,  tier: "common",    play: "stretch" },
  { id: "stickyhand",name: "Sticky Hand",     emoji: "🖐️",  value: 14,  tier: "common",    play: "peel" },
  // ---- Uncommon ----
  { id: "spinner",   name: "Fidget Spinner",  emoji: "🌀",  value: 24,  tier: "uncommon",  play: "flick" },
  { id: "cube",      name: "Infinity Cube",   emoji: "🧊",  value: 28,  tier: "uncommon",  play: "combo" },
  { id: "tangle",    name: "Tangle",          emoji: "🔗",  value: 26,  tier: "uncommon",  play: "windup" },
  { id: "gear",      name: "Spinny Gears",    emoji: "⚙️",  value: 32,  tier: "uncommon",  play: "windup" },
  { id: "clickpen",  name: "Clicky Pen",      emoji: "🖊️",  value: 30,  tier: "uncommon",  play: "combo" },
  { id: "dice",      name: "Fidget Dice",     emoji: "🎲",  value: 34,  tier: "uncommon",  play: "stack" },
  { id: "mochi",     name: "Mochi Squish",    emoji: "🍡",  value: 36,  tier: "uncommon",  play: "squeeze", parts: ["🍡","🌸"] },
  { id: "snap",      name: "Snap Bracelet",   emoji: "⌚",  value: 22,  tier: "uncommon",  play: "stretch" },
  { id: "maze",      name: "Marble Maze",     emoji: "🟨",  value: 38,  tier: "uncommon",  play: "pet" },
  { id: "chimes",    name: "Wacky Chimes",    emoji: "🎐",  value: 40,  tier: "uncommon",  play: "windup" },
  // ---- Rare ----
  { id: "slinky",    name: "Rainbow Slinky",  emoji: "🌈",  value: 55,  tier: "rare",      play: "stretch" },
  { id: "magnet",    name: "Magnet Balls",    emoji: "🧲",  value: 60,  tier: "rare",      play: "stack", parts: ["⚫","✨"] },
  { id: "boink",     name: "Springy Boink",   emoji: "🎈",  value: 48,  tier: "rare",      play: "combo" },
  { id: "sand",      name: "Kinetic Sand",    emoji: "⏳",  value: 52,  tier: "rare",      play: "snow", parts: ["✨","🟤"] },
  { id: "cradle",    name: "Newton's Cradle", emoji: "🎱",  value: 64,  tier: "rare",      play: "piano" },
  { id: "wave",      name: "Liquid Motion",   emoji: "🌊",  value: 68,  tier: "rare",      play: "snow", parts: ["💧","🔵","🟣"] },
  { id: "spinring",  name: "Spinner Ring",    emoji: "💍",  value: 58,  tier: "rare",      play: "flick" },
  { id: "yoyo",      name: "Trick Yo-Yo",     emoji: "🪀",  value: 62,  tier: "rare",      play: "flick" },
  // ---- Epic ----
  { id: "galaxy",    name: "Galaxy Pop It",   emoji: "🌌",  value: 95,  tier: "epic",      play: "grid",    parts: ["⭐","🌟","💫"] },
  { id: "unicorn",   name: "Unicorn Squish",  emoji: "🦄",  value: 110, tier: "epic",      play: "squeeze", parts: ["🌈","⭐","🦄"] },
  { id: "robot",     name: "Robot Spinner",   emoji: "🤖",  value: 130, tier: "epic",      play: "windup",  parts: ["🔩","⚡","💨"] },
  { id: "lavalamp",  name: "Lava Lamp",       emoji: "🫙",  value: 120, tier: "epic",      play: "snow",    parts: ["🔴","🟠","🟣"] },
  { id: "musicbox",  name: "Music Box",       emoji: "🎵",  value: 105, tier: "epic",      play: "piano" },
  { id: "kaleido",   name: "Kaleidoscope",    emoji: "🔭",  value: 140, tier: "epic",      play: "snow",    parts: ["🔺","🔷","⭐","🟡"] },
  { id: "goojar",    name: "Goo Jar",         emoji: "🧴",  value: 115, tier: "epic",      play: "squeeze", parts: ["🟢","💚","✨"] },
  // ---- Legendary ----
  { id: "diamond",   name: "Diamond Fidget",  emoji: "💎",  value: 200, tier: "legendary", play: "grid",    parts: ["💎","✨"] },
  { id: "crown",     name: "Golden Crown",    emoji: "👑",  value: 250, tier: "legendary", play: "stack",   parts: ["👑","🪙"] },
  { id: "trophy",    name: "Trophy Spinner",  emoji: "🏆",  value: 230, tier: "legendary", play: "flick",   parts: ["🎊","🏆"] },
  { id: "chest",     name: "Treasure Chest",  emoji: "🎁",  value: 280, tier: "legendary", play: "peel",    parts: ["🪙","💎","👑"] },
  { id: "lamp",      name: "Magic Lamp",      emoji: "🪔",  value: 300, tier: "legendary", play: "windup",  parts: ["💨","✨","🧞"] },
  { id: "orb",       name: "Crystal Orb",     emoji: "🔷",  value: 240, tier: "legendary", play: "piano" },
  // ---- Mythic ----
  { id: "phoenix",   name: "Phoenix Popper",  emoji: "🔥",  value: 380, tier: "mythic",    play: "squeeze", parts: ["🔥","🪶","🐣"] },
  { id: "rainbowd",  name: "Rainbow Dragon",  emoji: "🐉",  value: 460, tier: "mythic",    play: "pet",     parts: ["🌈","❤️","✨"] },
  { id: "fairy",     name: "Fairy Dust",      emoji: "✨",  value: 420, tier: "mythic",    play: "shower",  parts: ["✨","⭐","🧚"] },
  { id: "mermaid",   name: "Mermaid Tail",    emoji: "🧜‍♀️", value: 500, tier: "mythic",    play: "peel",    parts: ["🐚","🫧","🦪"] },
  // ---- Cosmic ----
  { id: "blackhole", name: "Black Hole Cube", emoji: "🕳️",  value: 720, tier: "cosmic",    play: "squeeze", parts: ["🌌","⭐","💫"], invert: true },
  { id: "star",      name: "Shooting Star",   emoji: "⭐",  value: 900, tier: "cosmic",    play: "shower",  parts: ["⭐","🌠","💫"] },
  { id: "saturn",    name: "Saturn Spinner",  emoji: "🪐",  value: 800, tier: "cosmic",    play: "flick",   parts: ["💫","🧊"] },
  { id: "comet",     name: "Comet Streak",    emoji: "☄️",  value: 1000,tier: "cosmic",    play: "combo",   parts: ["☄️","✨"] },
  { id: "alien",     name: "Alien Cube",      emoji: "👽",  value: 1100,tier: "cosmic",    play: "piano" },
];

export const byId = (id) => TOYS.find((t) => t.id === id);

let _seed = 1234567;
// Deterministic-ish RNG so hot reloads feel stable-ish; still varied per call.
function rand() {
  _seed = (_seed * 1103515245 + 12345) & 0x7fffffff;
  return _seed / 0x7fffffff;
}
export function pick(arr) { return arr[Math.floor(rand() * arr.length)]; }
export function reseed() { _seed = Math.floor(Math.random() * 0x7fffffff); }

export const sum = (toys) => toys.reduce((n, t) => n + t.value, 0);

// Generate a fresh offer: what THEY give you (theirs) vs what they ask FROM you (yours).
export function makeOffer() {
  const theirs = [pick(TOYS)];
  if (rand() > 0.45) theirs.push(pick(TOYS));
  const yours = [pick(TOYS)];
  if (rand() > 0.5) yours.push(pick(TOYS));
  return { theirs, yours };
}

// Evaluate a trade from the player's point of view.
// Positive net = player gains value = good deal.
export function evaluate(theirs, yours) {
  const get = sum(theirs);   // value coming TO the player
  const give = sum(yours);   // value leaving the player
  const net = get - give;
  const ratio = give === 0 ? 2 : get / give;

  let rating, label, emoji, tone;
  if (ratio >= 1.6)      { rating = 5; label = "AMAZING DEAL!"; emoji = "🤩"; tone = "great"; }
  else if (ratio >= 1.2) { rating = 4; label = "Great trade!";  emoji = "😄"; tone = "good"; }
  else if (ratio >= 0.95){ rating = 3; label = "Fair trade";    emoji = "🙂"; tone = "fair"; }
  else if (ratio >= 0.7) { rating = 2; label = "Not great...";  emoji = "😕"; tone = "bad"; }
  else                   { rating = 1; label = "Bad trade!";    emoji = "😬"; tone = "awful"; }

  return { get, give, net, ratio, rating, label, emoji, tone };
}

export const TONE_COLORS = {
  great: "#00c853",
  good:  "#7cb342",
  fair:  "#ffc107",
  bad:   "#ff7043",
  awful: "#f4433f",
};

// ==========================================================================
//  Inventory-based game (game.html / game.js). Everything below is additive;
//  the functions above are kept so the old mockups still run.
// ==========================================================================

// Player avatar choices for the character picker.
export const AVATARS = ["👧", "🧒", "👦", "🧑", "👩‍🦰", "🧑‍🦱", "👩‍🦱", "🐱", "🐰", "🦄", "🐶", "🐼"];

// Base rarity weights (used for the shop): commons/uncommons dominate, top tiers scarce.
const RARITY_WEIGHT = { common: 50, uncommon: 30, rare: 8, epic: 4, legendary: 1.6, mythic: 0.6, cosmic: 0.2 };
// Foxy's TRADE OFFERS skew toward nicer toys — she's a generous trading buddy,
// so rares/epics show up often and even legendaries+ aren't rare treats here.
const FOXY_OFFER_WEIGHT = { common: 22, uncommon: 26, rare: 22, epic: 14, legendary: 9, mythic: 5, cosmic: 2 };

export function weightedToy(weights = RARITY_WEIGHT) {
  const total = TOYS.reduce((n, t) => n + weights[t.tier], 0);
  let r = rand() * total;
  for (const t of TOYS) {
    r -= weights[t.tier];
    if (r <= 0) return t;
  }
  return TOYS[0];
}
export const foxyOfferToy = () => weightedToy(FOXY_OFFER_WEIGHT);

// The toys the player owns when they first start.
export function starterToys() {
  return ["popit", "marble", "spinner", "tangle", "slinky"].map(byId);
}

// Foxy's offer: the toys she puts down, plus a HIDDEN fair price she wants back.
// wantValue is what you must match (in coin value) for her to say yes.
export function makeFoxyOffer() {
  const theirs = [foxyOfferToy()];
  if (rand() > 0.5) theirs.push(foxyOfferToy());
  const worth = sum(theirs);
  // Foxy is friendly and mostly asks for a fair-or-generous price now, so the
  // player usually breaks even or comes out ahead (game is easier).
  let mult;
  const roll = rand();
  if (roll < 0.30) mult = 0.60 + rand() * 0.18;      // generous day (great deal!)
  else if (roll < 0.85) mult = 0.82 + rand() * 0.16; // fair-ish (break even)
  else mult = 1.02 + rand() * 0.12;                  // slightly greedy
  return {
    theirs,
    wantValue: Math.max(5, Math.round(worth * mult)),
    asks: 0,
    refusals: 0,
  };
}

// How Foxy feels about the value you're currently offering vs. what she wants.
// accepts === true only when you've matched her price.
export function foxyMood(giveValue, wantValue) {
  const ratio = wantValue === 0 ? 2 : giveValue / wantValue;
  if (giveValue === 0) return { accepts: false, face: "🦊", line: "Ooh, what will you share with me? 😊", tone: "fair", ratio };
  if (ratio < 0.6)   return { accepts: false, face: "🦊", line: "Hehe, a little more and we've got a deal! 💛", tone: "bad",  ratio };
  if (ratio < 0.85)  return { accepts: false, face: "🙂", line: "Getting closer! Just a bit more? ✨",         tone: "fair", ratio };
  if (ratio < 1.0)   return { accepts: false, face: "😄", line: "Sooo close! One tiny bit more! 🤏",           tone: "fair", ratio };
  if (ratio < 1.3)   return { accepts: true,  face: "😊", line: "Yay, it's a deal! Thank you! 🎉",             tone: "good",  ratio };
  return { accepts: true, face: "🥰", line: "Wow, so generous! You're the best! 💖", tone: "great", ratio };
}

// Result of nagging Foxy for more. Mutates the offer. Push-your-luck.
export function askMoreOutcome(offer) {
  offer.asks++;
  const roll = rand();
  if (roll < 0.65) {
    // Usually she happily adds a small toy — friendlier, a bit more likely than before.
    const small = pick(TOYS.filter((t) => t.tier === "common" || t.tier === "uncommon"));
    offer.theirs.push(small);
    offer.wantValue = Math.round(offer.wantValue * 1.08);
    return { type: "added", toy: small, line: `Sure! Here's a ${small.name} too! 🦊💛` };
  }
  if (roll < 0.9) {
    // Gentle no; the ask is used up.
    offer.wantValue = Math.round(offer.wantValue * 1.03);
    return { type: "refused", line: "Hehe, that's already a great deal! 😊" };
  }
  // Playfully takes a toy back, or wraps up if only one is left.
  if (offer.theirs.length > 1) {
    const removed = offer.theirs.pop();
    return { type: "removed", toy: removed, line: `Oops, I got attached to the ${removed.name}! 🙈` };
  }
  return { type: "ended", line: "Let's try a fresh trade! 🦊✨" };
}

// What Foxy pays when you sell a toy back — about half its value.
export function sellPrice(toy) {
  return Math.max(1, Math.round(toy.value * 0.5));
}

// Shop stock: 4 distinct toys. Buying costs ~1.1x value now (friendlier prices).
export function makeShopStock() {
  const chosen = [];
  let guard = 0;
  while (chosen.length < 4 && guard++ < 80) {
    const t = weightedToy();
    if (!chosen.some((c) => c.id === t.id)) chosen.push(t);
  }
  return chosen.map((t) => ({ id: t.id, price: Math.ceil(t.value * 1.1) }));
}
