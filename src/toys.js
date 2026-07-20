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
  prismatic: { label: "Prismatic", color: "#e94fff", glow: "rgba(233,79,255,.95)" },
  divine:    { label: "Divine",    color: "#ffd000", glow: "rgba(255,208,0,1)" },
};

// `play` = a Fidget-Zone interaction. 3D toys use:
//   grid | flick | squish | cube | coil | tangle | stretch | pet | piano
// particle-themed 2D interactions: shower | snow | stack | peel
// `model3d` = {shape, finish, colors[], cute?} — how the toy looks as a real 3D object.
// `parts` = optional themed particle emoji. `cute` faces live in model3d.cute.
export const TOYS = [
  // ---- Common ----
  { id: "popit",     name: "Pop It",          emoji: "🫧",  value: 8,   tier: "common",    play: "grid",    model3d: { shape: "popit", finish: "silicone", colors: ["#ff5da2","#ffd166","#6ee7f0","#7c5cff"] } },
  { id: "simple",    name: "Simple Dimple",   emoji: "🟣",  value: 10,  tier: "common",    play: "grid",    model3d: { shape: "popit", finish: "silicone", colors: ["#ffb020","#3d8bfd"] } },
  { id: "marble",    name: "Squishy Ball",    emoji: "🔵",  value: 12,  tier: "common",    play: "squish",  parts: ["💧","🔵"], model3d: { shape: "ball", finish: "goo", colors: ["#3d8bfd","#88ccff","#ff5da2"] } },
  { id: "bubble",    name: "Bubble Wrap",     emoji: "🧇",  value: 14,  tier: "common",    play: "shower",  model3d: { shape: "popit", finish: "glass", colors: ["#dff3ff","#ffffff","#bfeaff"] } },
  { id: "stressball",name: "Stress Ball",     emoji: "🎾",  value: 11,  tier: "common",    play: "squish",  model3d: { shape: "ball", finish: "silicone", colors: ["#d7f542","#b8d332","#ffffff"] } },
  { id: "pebble",    name: "Worry Stone",     emoji: "🪨",  value: 9,   tier: "common",    play: "pet",     model3d: { shape: "ball", finish: "matte", colors: ["#8a94a6","#6b7280"] } },
  { id: "pushpop",   name: "Push Popper",     emoji: "🔴",  value: 13,  tier: "common",    play: "grid",    model3d: { shape: "popit", finish: "silicone", colors: ["#4caf78","#ffe14d"] } },
  { id: "beadring",  name: "Bead Ring",       emoji: "🔮",  value: 15,  tier: "common",    play: "flick",   model3d: { shape: "beads", finish: "gloss", colors: ["#ff5da2","#ffe14d","#3d8bfd","#4caf78"] } },
  { id: "putty",     name: "Silly Putty",     emoji: "🟩",  value: 16,  tier: "common",    play: "squish",  parts: ["💗","✨"], model3d: { shape: "blob", finish: "goo", colors: ["#ffb6c1","#ff8ac8"] } },
  { id: "noodle",    name: "Stretchy Noodle", emoji: "🍜",  value: 17,  tier: "common",    play: "stretch", model3d: { shape: "capsule", finish: "silicone", colors: ["#ff5da2","#ffe14d"] } },
  { id: "stickyhand",name: "Sticky Hand",     emoji: "🖐️",  value: 14,  tier: "common",    play: "stretch", model3d: { shape: "capsule", finish: "goo", colors: ["#7cfc00","#b8ff70"] } },
  // ---- Uncommon ----
  { id: "spinner",   name: "Fidget Spinner",  emoji: "🌀",  value: 24,  tier: "uncommon",  play: "flick",   model3d: { shape: "spinner", finish: "gloss", colors: ["#3d8bfd","#22262e","#c0c8d0"] } },
  { id: "cube",      name: "Infinity Cube",   emoji: "🧊",  value: 28,  tier: "uncommon",  play: "cube",    model3d: { shape: "cube", finish: "chrome", colors: ["#8a94a6","#3d8bfd"] } },
  { id: "tangle",    name: "Tangle",          emoji: "🔗",  value: 26,  tier: "uncommon",  play: "tangle",  model3d: { shape: "tangle", finish: "gloss", colors: ["#ff5da2","#ffe14d","#3d8bfd","#4caf78"] } },
  { id: "gear",      name: "Spinny Gears",    emoji: "⚙️",  value: 32,  tier: "uncommon",  play: "flick",   model3d: { shape: "gears", finish: "chrome", colors: ["#b0b8c4","#ffb020"] } },
  { id: "clickpen",  name: "Clicky Pen",      emoji: "🖊️",  value: 30,  tier: "uncommon",  play: "cube",    model3d: { shape: "pen", finish: "gloss", colors: ["#3d8bfd","#e63946","#22262e"] } },
  { id: "dice",      name: "Fidget Dice",     emoji: "🎲",  value: 34,  tier: "uncommon",  play: "cube",    model3d: { shape: "cube", finish: "gloss", colors: ["#ffffff","#22262e","#e63946"], params: { pips: true } } },
  { id: "mochi",     name: "Mochi Squish",    emoji: "🍡",  value: 36,  tier: "uncommon",  play: "squish",  parts: ["🍡","🌸"], model3d: { shape: "ball", finish: "silicone", colors: ["#ffd1dc","#fff0f5"], cute: true } },
  { id: "snap",      name: "Snap Bracelet",   emoji: "⌚",  value: 22,  tier: "uncommon",  play: "stretch", model3d: { shape: "capsule", finish: "gloss", colors: ["#ff5da2","#ffe14d","#3d8bfd"] } },
  { id: "maze",      name: "Marble Maze",     emoji: "🟨",  value: 38,  tier: "uncommon",  play: "tangle",  model3d: { shape: "cube", finish: "silicone", colors: ["#4caf78","#3d8bfd","#c0c8d0"] } },
  { id: "chimes",    name: "Wacky Chimes",    emoji: "🎐",  value: 40,  tier: "uncommon",  play: "piano",   model3d: { shape: "cradle", finish: "chrome", colors: ["#c0c8d0","#ffe14d","#6ee7f0"] } },
  // ---- Rare ----
  { id: "slinky",    name: "Rainbow Slinky",  emoji: "🌈",  value: 55,  tier: "rare",      play: "coil",    model3d: { shape: "coil", finish: "gloss", colors: ["#ff5da2","#ffb020","#ffe14d","#4caf78","#3d8bfd","#b558f6"] } },
  { id: "magnet",    name: "Magnet Balls",    emoji: "🧲",  value: 60,  tier: "rare",      play: "stretch", parts: ["⚫","✨"], model3d: { shape: "beads", finish: "chrome", colors: ["#c0c8d0","#8a94a6"] } },
  { id: "boink",     name: "Springy Boink",   emoji: "🎈",  value: 48,  tier: "rare",      play: "coil",    model3d: { shape: "coil", finish: "gloss", colors: ["#7c5cff","#6ee7f0"] } },
  { id: "sand",      name: "Kinetic Sand",    emoji: "⏳",  value: 52,  tier: "rare",      play: "snow", parts: ["✨","🟤"], model3d: { shape: "blob", finish: "matte", colors: ["#e0c9a6","#d4b483"] } },
  { id: "cradle",    name: "Newton's Cradle", emoji: "🎱",  value: 64,  tier: "rare",      play: "piano",   model3d: { shape: "cradle", finish: "chrome", colors: ["#c0c8d0","#22262e"] } },
  { id: "wave",      name: "Liquid Motion",   emoji: "🌊",  value: 68,  tier: "rare",      play: "flick", parts: ["💧","🔵","🟣"], model3d: { shape: "orb", finish: "glass", colors: ["#3d8bfd","#ff5da2","#ffffff"] } },
  { id: "spinring",  name: "Spinner Ring",    emoji: "💍",  value: 58,  tier: "rare",      play: "flick",   model3d: { shape: "ring", finish: "chrome", colors: ["#c0c8d0","#ffd700"] } },
  { id: "yoyo",      name: "Trick Yo-Yo",     emoji: "🪀",  value: 62,  tier: "rare",      play: "flick",   model3d: { shape: "yoyo", finish: "gloss", colors: ["#e63946","#ffffff","#ffd700"] } },
  // ---- Epic ----
  { id: "galaxy",    name: "Galaxy Pop It",   emoji: "🌌",  value: 95,  tier: "epic",      play: "grid",    parts: ["⭐","🌟","💫"], model3d: { shape: "popit", finish: "holo", colors: ["#2b1a5e","#7c5cff","#3d8bfd","#ff5da2"], params: { stars: true } } },
  { id: "unicorn",   name: "Unicorn Squish",  emoji: "🦄",  value: 110, tier: "epic",      play: "squish",  parts: ["🌈","⭐","🦄"], model3d: { shape: "ball", finish: "plush", colors: ["#ffd1dc","#e6ccff","#bfeaff","#fff8dc"], cute: true } },
  { id: "robot",     name: "Robot Spinner",   emoji: "🤖",  value: 130, tier: "epic",      play: "flick",   parts: ["🔩","⚡","💨"], model3d: { shape: "spinner", finish: "chrome", colors: ["#8a94a6","#00e5ff","#22262e"] } },
  { id: "lavalamp",  name: "Lava Lamp",       emoji: "🫙",  value: 120, tier: "epic",      play: "snow",    parts: ["🔴","🟠","🟣"], model3d: { shape: "capsule", finish: "glass", colors: ["#ff4500","#ff8c00","#4b0082"] } },
  { id: "musicbox",  name: "Music Box",       emoji: "🎵",  value: 105, tier: "epic",      play: "piano",   model3d: { shape: "chest", finish: "gloss", colors: ["#ffb6c1","#ffd700","#ffffff"] } },
  { id: "kaleido",   name: "Kaleidoscope",    emoji: "🔭",  value: 140, tier: "epic",      play: "snow",    parts: ["🔺","🔷","⭐","🟡"], model3d: { shape: "capsule", finish: "holo", colors: ["#ff5da2","#ffe14d","#4caf78","#3d8bfd"] } },
  { id: "goojar",    name: "Goo Jar",         emoji: "🧴",  value: 115, tier: "epic",      play: "squish",  parts: ["🟢","💚","✨"], model3d: { shape: "blob", finish: "goo", colors: ["#7cfc00","#b8ff70"] } },
  // ---- Legendary ----
  { id: "diamond",   name: "Diamond Fidget",  emoji: "💎",  value: 200, tier: "legendary", play: "flick",   parts: ["💎","✨"], model3d: { shape: "gem", finish: "glass", colors: ["#bfeaff","#ffffff","#6ee7f0"] } },
  { id: "crown",     name: "Golden Crown",    emoji: "👑",  value: 250, tier: "legendary", play: "flick",   parts: ["👑","🪙"], model3d: { shape: "crown", finish: "metal", colors: ["#ffd700","#e63946","#3d8bfd"] } },
  { id: "trophy",    name: "Trophy Spinner",  emoji: "🏆",  value: 230, tier: "legendary", play: "flick",   parts: ["🎊","🏆"], model3d: { shape: "trophy", finish: "metal", colors: ["#ffd700","#b8860b"] } },
  { id: "chest",     name: "Treasure Chest",  emoji: "🎁",  value: 280, tier: "legendary", play: "peel",    parts: ["🪙","💎","👑"], model3d: { shape: "chest", finish: "metal", colors: ["#8b5a2b","#ffd700","#e63946"] } },
  { id: "lamp",      name: "Magic Lamp",      emoji: "🪔",  value: 300, tier: "legendary", play: "pet",     parts: ["💨","✨","🧞"], model3d: { shape: "lamp", finish: "metal", colors: ["#ffd700","#b8860b","#6ee7f0"] } },
  { id: "orb",       name: "Crystal Orb",     emoji: "🔷",  value: 240, tier: "legendary", play: "piano",   model3d: { shape: "orb", finish: "glass", colors: ["#bfeaff","#7c5cff","#ffffff"] } },
  // ---- Mythic ----
  { id: "phoenix",   name: "Phoenix Popper",  emoji: "🔥",  value: 380, tier: "mythic",    play: "grid",    parts: ["🔥","🪶","🐣"], model3d: { shape: "popit", finish: "silicone", colors: ["#ff4500","#ffb020","#ffe14d"] } },
  { id: "rainbowd",  name: "Rainbow Dragon",  emoji: "🐉",  value: 460, tier: "mythic",    play: "squish",  parts: ["🌈","❤️","✨"], model3d: { shape: "ball", finish: "plush", colors: ["#ff5da2","#ffe14d","#4caf78","#3d8bfd"], cute: true } },
  { id: "fairy",     name: "Fairy Dust",      emoji: "✨",  value: 420, tier: "mythic",    play: "shower",  parts: ["✨","⭐","🧚"], model3d: { shape: "orb", finish: "holo", colors: ["#ffd1dc","#ffe14d","#e6ccff"] } },
  { id: "mermaid",   name: "Mermaid Tail",    emoji: "🧜‍♀️", value: 500, tier: "mythic",    play: "pet",     parts: ["🐚","🫧","🦪"], model3d: { shape: "capsule", finish: "plush", colors: ["#20c9b0","#7c5cff","#ff8ac8"], cute: true } },
  // ---- Cosmic ----
  { id: "blackhole", name: "Black Hole Cube", emoji: "🕳️",  value: 720, tier: "cosmic",    play: "cube",    parts: ["🌌","⭐","💫"], invert: true, model3d: { shape: "cube", finish: "holo", colors: ["#0b0b12","#7c5cff","#ff5da2"] } },
  { id: "star",      name: "Shooting Star",   emoji: "⭐",  value: 900, tier: "cosmic",    play: "shower",  parts: ["⭐","🌠","💫"], model3d: { shape: "star", finish: "holo", colors: ["#ffe14d","#ffffff","#ffb020"] } },
  { id: "saturn",    name: "Saturn Spinner",  emoji: "🪐",  value: 800, tier: "cosmic",    play: "flick",   parts: ["💫","🧊"], model3d: { shape: "spinner", finish: "holo", colors: ["#e0c9a6","#ffb020","#7c5cff"] } },
  { id: "comet",     name: "Comet Streak",    emoji: "☄️",  value: 1000,tier: "cosmic",    play: "flick",   parts: ["☄️","✨"], model3d: { shape: "orb", finish: "holo", colors: ["#6ee7f0","#ffffff","#3d8bfd"] } },
  { id: "alien",     name: "Alien Cube",      emoji: "👽",  value: 1100,tier: "cosmic",    play: "cube",    model3d: { shape: "cube", finish: "gloss", colors: ["#7cfc00","#0b3d0b","#00e5ff"] } },
  // ---- Prismatic ----
  { id: "prism",     name: "Prism Cube",      emoji: "🔶",  value: 1300,tier: "prismatic", play: "cube",    parts: ["🔶","✨","💠"], model3d: { shape: "cube", finish: "glass", colors: ["#ffffff","#ff5da2","#3d8bfd","#ffe14d"] } },
  { id: "disco",     name: "Disco Orb",       emoji: "🪩",  value: 1500,tier: "prismatic", play: "flick",   parts: ["✨","💠","⭐"], model3d: { shape: "orb", finish: "chrome", colors: ["#c0c8d0","#ff5da2","#6ee7f0"] } },
  { id: "amulet",    name: "Rainbow Amulet",  emoji: "🧿",  value: 1650,tier: "prismatic", play: "pet",     parts: ["🌈","✨","💫"], model3d: { shape: "gem", finish: "holo", colors: ["#ff5da2","#ffe14d","#4caf78","#7c5cff"] } },
  // ---- Divine ----
  { id: "halo",      name: "Angel Halo",      emoji: "😇",  value: 1900,tier: "divine",    play: "flick",   parts: ["😇","✨","💛"], model3d: { shape: "ring", finish: "metal", colors: ["#ffd700","#fff8dc"] } },
  { id: "dove",      name: "Peace Dove",      emoji: "🕊️",  value: 2200,tier: "divine",    play: "shower",  parts: ["🕊️","✨","🌟"], model3d: { shape: "ball", finish: "plush", colors: ["#ffffff","#ffd700","#fff8dc"], cute: true } },
  { id: "infinity",  name: "Infinity Star",   emoji: "🌟",  value: 2600,tier: "divine",    play: "flick",   parts: ["🌟","💫","⭐"], model3d: { shape: "star", finish: "holo", colors: ["#ffd700","#ffffff","#7c5cff","#ff5da2"] } },
  // ---- New fidgets ----
  { id: "rollerclick",name: "Click Roller",   emoji: "🎛️",  value: 14,  tier: "common",    play: "flick",   model3d: { shape: "ring", finish: "gloss", colors: ["#ff8c00","#22262e"] } },
  { id: "avocado",   name: "Avocado Squish",  emoji: "🥑",  value: 15,  tier: "common",    play: "squish",  parts: ["🥑","💚"], model3d: { shape: "ball", finish: "silicone", colors: ["#4caf78","#ffe14d","#8b5a2b"], cute: true } },
  { id: "flipchain", name: "Flippy Chain",    emoji: "⛓️",  value: 28,  tier: "uncommon",  play: "tangle",  model3d: { shape: "tangle", finish: "gloss", colors: ["#22262e","#3d8bfd","#c0c8d0"] } },
  { id: "magslider", name: "Magnetic Slider", emoji: "🎚️",  value: 34,  tier: "uncommon",  play: "cube",    model3d: { shape: "cube", finish: "chrome", colors: ["#8a94a6","#e63946"] } },
  { id: "koosh",     name: "Koosh Ball",      emoji: "🪸",  value: 55,  tier: "rare",      play: "squish",  parts: ["✨","🌈"], model3d: { shape: "ball", finish: "silicone", colors: ["#ff5da2","#7cfc00","#ffe14d","#3d8bfd"] } },
  { id: "axolotl",   name: "Axolotl Squish",  emoji: "🦎",  value: 120, tier: "epic",      play: "pet",     parts: ["💕","💧","✨"], model3d: { shape: "ball", finish: "plush", colors: ["#ffb6c1","#ff8ac8","#ffffff"], cute: true } },
  { id: "gyro",      name: "Gyro Sphere",     emoji: "🌐",  value: 240, tier: "legendary", play: "flick",   parts: ["✨","💫"], model3d: { shape: "orb", finish: "chrome", colors: ["#c0c8d0","#ffd700","#3d8bfd"] } },
  { id: "jellyfriend",name: "Jelly Jellyfish",emoji: "🪼",  value: 430, tier: "mythic",    play: "stretch", parts: ["🫧","💜","✨"], model3d: { shape: "blob", finish: "goo", colors: ["#e6ccff","#7c5cff","#6ee7f0"], cute: true } },
  { id: "nebulasand",name: "Nebula Sand",     emoji: "🌠",  value: 950, tier: "cosmic",    play: "snow",    parts: ["✨","💫","⭐"], model3d: { shape: "blob", finish: "holo", colors: ["#2b1a5e","#7c5cff","#ff5da2","#ffe14d"] } },
  { id: "starharp",  name: "Starlight Harp",  emoji: "🎶",  value: 2200,tier: "divine",    play: "piano",   parts: ["🎵","✨","⭐"], model3d: { shape: "cradle", finish: "metal", colors: ["#ffd700","#fff8dc","#bfeaff"] } },
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

// Base rarity weights (used for the shop). Rarer toys now show up MUCH more often
// than before — rare-or-better is roughly 40% of shop stock so the good stuff is
// genuinely reachable, while commons/uncommons still fill things out.
const RARITY_WEIGHT = { common: 34, uncommon: 26, rare: 16, epic: 10, legendary: 6, mythic: 3, cosmic: 2, prismatic: 1, divine: 0.6 };
// Foxy's TRADE OFFERS skew toward nicer toys — she's a generous trading buddy,
// so rares/epics show up often and even legendaries+ aren't rare treats here.
const FOXY_OFFER_WEIGHT = { common: 22, uncommon: 26, rare: 22, epic: 14, legendary: 9, mythic: 5, cosmic: 2, prismatic: 1, divine: 0.5 };

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
  if (roll < 0.45) mult = 0.55 + rand() * 0.17;      // often a great deal for you
  else if (roll < 0.90) mult = 0.72 + rand() * 0.16; // fair/good
  else mult = 0.95 + rand() * 0.10;                  // rarely near full price
  // acceptFactor: she'll actually say YES once you offer wantValue * acceptFactor.
  // It's usually WELL BELOW 1, and randomized per offer, so she very often accepts
  // deals that come out better for the player — and how generous she is varies.
  let af;
  const r2 = rand();
  if (r2 < 0.55) af = 0.55 + rand() * 0.15;   // super chill — accepts a low offer
  else if (r2 < 0.88) af = 0.70 + rand() * 0.15;
  else af = 0.86 + rand() * 0.10;             // occasionally wants closer to full
  return {
    theirs,
    wantValue: Math.max(5, Math.round(worth * mult)),
    acceptFactor: af,
    asks: 0,
    refusals: 0,
  };
}

// ---- YOUR turn: you offer first, Foxy trades something back ----------------
// Pick a toy from a filtered pool, weighted toward nicer rarities.
function weightedFrom(pool, weights = FOXY_OFFER_WEIGHT) {
  const total = pool.reduce((n, t) => n + (weights[t.tier] || 0.1), 0);
  let r = rand() * total;
  for (const t of pool) { r -= (weights[t.tier] || 0.1); if (r <= 0) return t; }
  return pool[pool.length - 1];
}

// When YOU make the opening offer (worth giveVal), Foxy responds with 1–3 toys
// worth roughly giveVal * generosity — usually a fair-to-great deal for the player.
export function makeFoxyReturn(giveVal) {
  const roll = rand();
  let mult;
  if (roll < 0.50) mult = 1.15 + rand() * 0.30;      // generous — great for you
  else if (roll < 0.90) mult = 1.0 + rand() * 0.20;  // fair/good
  else mult = 0.90 + rand() * 0.10;                   // rarely stingy (still ~fair)
  const target = Math.max(6, giveVal * mult);

  const theirs = [];
  let remaining = target;
  for (let i = 0; i < 3; i++) {
    const pool = TOYS.filter((t) => t.value <= remaining * 1.3);
    if (!pool.length) break;
    const t = weightedFrom(pool);
    theirs.push(t);
    remaining -= t.value;
    if (remaining < target * 0.18) break;
  }
  if (!theirs.length) {
    // giveVal tiny — hand over a modest toy so there's always something back
    const cheap = TOYS.filter((t) => t.tier === "common");
    theirs.push(cheap[Math.floor(rand() * cheap.length)]);
  }
  // On your turn Foxy is offering to YOU, so she always accepts her own offer.
  return { theirs, wantValue: 0, acceptFactor: 1, asks: 0, refusals: 0, youFirst: true, responded: true };
}

// How Foxy feels about the value you're currently offering vs. what she wants.
// She accepts once giveValue >= wantValue * acceptFactor (acceptFactor usually < 1,
// so she happily takes deals that are better for the player).
export function foxyMood(giveValue, wantValue, acceptFactor = 1) {
  const target = Math.max(1, wantValue * acceptFactor);
  return foxyMoodAt(giveValue, target);
}
function foxyMoodAt(giveValue, wantValue) {
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

// Shop stock: 6 distinct toys. Buying costs ~0.85x value (friendly prices).
export function makeShopStock() {
  const chosen = [];
  let guard = 0;
  while (chosen.length < 6 && guard++ < 120) {
    const t = weightedToy();
    if (!chosen.some((c) => c.id === t.id)) chosen.push(t);
  }
  return chosen.map((t) => ({ id: t.id, price: Math.max(1, Math.round(t.value * 0.85)) }));
}
