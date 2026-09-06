// ==========================================================================
//  Emmy's Arcade — prize counter catalog, snack menu, trading-card sets (all
//  original characters — no licensed IP) and the interactive "play with it"
//  views.  playPrize(prize, stage, ctx) mounts an interaction and returns a
//  cleanup fn. ctx = { sfx, tone, makeSustain, toast, state, save, setTip, box,
//  spark(stage, x, y, marks, n), rerender, onEaten }
// ==========================================================================
import { emoji as drawEmoji, text as drawText, circle, rnd, clamp, pick } from "./canvas2d.js";
import { PLUSH_INFO, THREE, makePlush, blobShadow } from "./arcade3d/lib.js";

// --------------------------------------------------------------------------
//  Prize counter (ticket prices tuned so a good session earns a real prize)
// --------------------------------------------------------------------------
export const PRIZES = [
  { id: "candy",   name: "Candy Bag",        emoji: "🍬", cost: 15,   kind: "candy",  stack: true,  desc: "A bag of 10 candies. Tap to unwrap & munch!" },
  { id: "bouncy",  name: "Bouncy Ball",      emoji: "🏐", cost: 30,   kind: "bouncy", desc: "Super bouncy! Flick it around." },
  { id: "yoyo",    name: "Glow Yo-Yo",       emoji: "🪀", cost: 40,   kind: "toy3d",  desc: "A real 3D yo-yo — flick it to spin.",
    toy: { name: "Glow Yo-Yo", play: "flick", parts: ["✨", "💫"], model3d: { shape: "yoyo", finish: "holo", colors: ["#00e5ff", "#ff3dd6", "#ffffff"] } } },
  { id: "slime",   name: "Galaxy Slime",     emoji: "🫧", cost: 50,   kind: "toy3d",  desc: "Squishy sparkly slime. Hold to squish!",
    toy: { name: "Galaxy Slime", play: "squish", parts: ["✨", "🌟", "💜"], model3d: { shape: "blob", finish: "goo", colors: ["#7a3cff", "#c084fc"] } } },
  { id: "wand",    name: "Glow Wand",        emoji: "🪄", cost: 60,   kind: "wand",   desc: "Draw glowing rainbow trails in the dark!" },
  { id: "critpack", name: "Critter Clash Pack", emoji: "🃏", cost: 80, kind: "pack",   stack: true, set: "critters", desc: "10 monster battle cards! Rip it open, collect 'em all." },
  { id: "bear",    name: "Teddy Bear Stuffy", emoji: "🧸", cost: 90,   kind: "toy3d",  desc: "A soft, squishable teddy. Hold to squish!",
    toy: { name: "Teddy Bear", play: "squish", parts: ["❤️", "🧸"], model3d: { shape: "ball", finish: "plush", colors: ["#c68642", "#8d5a2b", "#e6b980"], cute: true, params: { ears: true } } } },
  { id: "inkpack", name: "Inkbound Pack",    emoji: "✨", cost: 100,  kind: "pack",   stack: true, set: "inkbound", desc: "12 Inkbound cards with a guaranteed foil. Six inks to collect!" },
  { id: "unicorn", name: "Unicorn Stuffy",   emoji: "🦄", cost: 160,  kind: "toy3d",  desc: "A magical plush unicorn to squish.",
    toy: { name: "Unicorn Stuffy", play: "squish", parts: ["🌈", "⭐", "🦄"], model3d: { shape: "ball", finish: "plush", colors: ["#ffd1dc", "#e6ccff", "#bfeaff", "#fff8dc"], cute: true, params: { horn: true, ears: true } } } },
  { id: "axolotl", name: "GIANT Axolotl",    emoji: "🦎", cost: 300,  kind: "toy3d",  big: true, desc: "The biggest, squishiest prize on the wall!",
    toy: { name: "Giant Axolotl", play: "squish", parts: ["💗", "🫧", "🌸"], model3d: { shape: "ball", finish: "plush", colors: ["#ff9ec7", "#ffc4dd", "#ff6fa8"], cute: true, params: { ovoid: true, ears: true } } } },
  { id: "ipad",    name: "iPad",             emoji: "📱", cost: 600,  kind: "ipad",   big: true, desc: "A real tablet! It has exactly one game on it…" },
  { id: "trophy",  name: "Champion Trophy",  emoji: "🏆", cost: 1200, kind: "toy3d",  big: true, desc: "Only for true arcade legends. Give it a polish!",
    toy: { name: "Arcade Champion Trophy", play: "pet", parts: ["✨", "🏆", "⭐"], model3d: { shape: "trophy", finish: "metal", colors: ["#ffd54a", "#e0a800", "#7a3cff"] } } },
];
// Claw-machine plushies — won, not bought (hidden from the counter, shown on the shelf)
const PLUSH_LOOK = {
  bear: { shape: "ball", finish: "plush", colors: ["#c68642", "#8d5a2b"], cute: true, params: { ears: true } }, panda: { shape: "ball", finish: "plush", colors: ["#ffffff", "#222222"], cute: true, params: { ears: true } },
  frog: { shape: "ball", finish: "silicone", colors: ["#66bb6a", "#c5e1a5"], cute: true }, dino: { shape: "ball", finish: "plush", colors: ["#7cb342", "#ffd54a"], cute: true, params: { ovoid: true } },
  octo: { shape: "blob", finish: "plush", colors: ["#ab47bc", "#f48fb1"], cute: true }, whale: { shape: "ball", finish: "plush", colors: ["#42a5f5", "#e3f2fd"], cute: true, params: { ovoid: true } },
  star: { shape: "star", finish: "holo", colors: ["#ffd54a", "#ffb300"] }, gift: { shape: "chest", finish: "gloss", colors: ["#ef5350", "#ffd54a"] },
  unicorn: { shape: "ball", finish: "plush", colors: ["#fce4ec", "#e6ccff", "#bfeaff"], cute: true, params: { horn: true, ears: true } }, duck: { shape: "ball", finish: "silicone", colors: ["#ffeb3b", "#ff9800"], cute: true, params: { ovoid: true } },
};
for (const [k, info] of Object.entries(PLUSH_INFO)) PRIZES.push({ id: "plush_" + k, name: info.name, emoji: info.emoji, cost: 0, kind: "toy3d", claw: true, stack: true, desc: "Won from the claw machine! Hold to squish.", toy: { name: info.name, play: k === "star" ? "flick" : k === "gift" ? "cube" : "squish", parts: [info.emoji, "✨"], model3d: PLUSH_LOOK[k] } });
export const prizeById = (id) => PRIZES.find((p) => p.id === id);

// --------------------------------------------------------------------------
//  Snack Shack menu — costs MONEY (not tickets). Snacks give a little boost.
// --------------------------------------------------------------------------
export const SNACKS = [
  { id: "pizza",    name: "Pizza Slice",  emoji: "🍕", price: 3.0, boost: "double",  desc: "Yum! Your next game pays DOUBLE tickets." },
  { id: "hotdog",   name: "Hot Dog",      emoji: "🌭", price: 2.5, boost: "double",  desc: "Fuel up: next game pays DOUBLE tickets." },
  { id: "fries",    name: "Curly Fries",  emoji: "🍟", price: 2.0, boost: "free",    desc: "Salty! Your next game is FREE." },
  { id: "soda",     name: "Fizzy Soda",   emoji: "🥤", price: 1.5, boost: "free",    desc: "Bubbles! Your next game is FREE." },
  { id: "icecream", name: "Ice Cream",    emoji: "🍦", price: 2.0, boost: "tickets", tickets: 15, desc: "Brain freeze! +15 tickets right now." },
  { id: "popcorn",  name: "Popcorn",      emoji: "🍿", price: 1.5, boost: "tickets", tickets: 10, desc: "Crunchy! +10 tickets right now." },
  { id: "cotton",   name: "Cotton Candy", emoji: "🍭", price: 2.5, boost: "lucky",   desc: "Sugar rush! Your next game's tickets get +50%." },
];

// --------------------------------------------------------------------------
//  Trading cards — two original sets, procedural illustrated art (no emoji art)
// --------------------------------------------------------------------------
export const RAR = {
  c: { label: "Common",     color: "#9aa3ad", shape: "circle",   w: 60 },
  u: { label: "Uncommon",   color: "#f3f3f3", shape: "circle2",  w: 30 },
  r: { label: "Rare",       color: "#e08a2e", shape: "triangle", w: 12 },
  s: { label: "Super Rare", color: "#b9c5d6", shape: "diamond",  w: 5 },
  l: { label: "Legendary",  color: "#f2c14e", shape: "pentagon", w: 2 },
  e: { label: "Enchanted",  color: "#e94fff", shape: "hexagon",  w: 0.4 },
};
const INKS = {
  amber:    { name: "Amber",    color: "#f5a623", dark: "#8a4d00", sym: "☀" },
  amethyst: { name: "Amethyst", color: "#8e44ad", dark: "#3d0f5a", sym: "✦" },
  emerald:  { name: "Emerald",  color: "#27ae60", dark: "#0b4a2a", sym: "❦" },
  ruby:     { name: "Ruby",     color: "#e0243b", dark: "#6a0616", sym: "⚔" },
  sapphire: { name: "Sapphire", color: "#2f7fd6", dark: "#0b2f6a", sym: "◈" },
  steel:    { name: "Steel",    color: "#7f8c8d", dark: "#2c3538", sym: "⬢" },
};
// creature art recipes: body ∈ round|tall|blob|cat|bird|fish|robot|dragon, plus feature flags
const A = (body, c1, c2, f = {}) => ({ body, c1, c2, ...f });
const IB = (n, ver, ink, cost, str, wil, lore, r, type, ability, art) => ({ n, ver, ink, cost, str, wil, lore, r, type, ability, art, inkable: cost <= 4 || r === "c" });
export const CARD_SETS = {
  inkbound: {
    name: "Inkbound", packSize: 12, back: { bg: "#1a0a3a", fg: "#e94fff", title: "INKBOUND", sym: "✒️" },
    cards: [
      IB("Emmy", "Arcade Champion", "ruby", 4, 3, 4, 2, "s", "Storyborn · Hero", "HIGH SCORE — When you play this character, gain 1 lore.", A("cat", "#ff3dd6", "#ffd6b8", { hair: true, crown: true })),
      IB("Foxy", "Trading Buddy", "amber", 3, 2, 3, 2, "r", "Storyborn · Ally", "FAIR DEAL — Whenever you play an item, you may draw a card.", A("cat", "#ff8c42", "#fff3e0", { ears: true, tail: true })),
      IB("Foxy", "Shopkeeper", "amber", 2, 1, 3, 1, "c", "Storyborn · Ally", "Support (this character's strength is added to another chosen character's this turn).", A("cat", "#ff8c42", "#fff3e0", { ears: true, hat: true })),
      IB("Luna", "Moonlit Unicorn", "amethyst", 5, 3, 5, 2, "l", "Dreamborn · Mystic", "STARLIGHT — Your other characters get +1 lore.", A("round", "#fce4ec", "#e6ccff", { horn: true, mane: true, sparkle: true })),
      IB("Luna", "Curious Foal", "amethyst", 1, 1, 2, 1, "c", "Dreamborn · Mystic", "Evasive (only characters with Evasive can challenge this character).", A("round", "#fce4ec", "#bfeaff", { horn: true })),
      IB("Gizmo", "Helper Bot", "steel", 3, 3, 3, 1, "u", "Floodborn · Inventor", "REBOOT — When banished, return this card to your hand.", A("robot", "#b0bec5", "#00e5ff", { antenna: true })),
      IB("Gizmo", "Prize Sorter", "steel", 5, 4, 5, 2, "r", "Floodborn · Inventor", "TIDY UP — When you play this character, banish chosen item.", A("robot", "#90a4ae", "#ffd54a", { antenna: true, arms: true })),
      IB("Captain Squish", "Plush Pirate", "ruby", 4, 4, 3, 1, "u", "Dreamborn · Captain", "Rush (this character can challenge the turn they're played).", A("round", "#c68642", "#8d5a2b", { ears: true, hat: true, eyepatch: true })),
      IB("Pip", "Puffed Up", "sapphire", 2, 2, 2, 1, "c", "Storyborn · Ally", "PUFF! — When challenged, this character gets +2 willpower this turn.", A("fish", "#ffd54a", "#ff9800", { spikes: true })),
      IB("Bubble", "Rainbow Dragon", "emerald", 6, 5, 6, 3, "l", "Dreamborn · Dragon", "PRISM BREATH — Deal 2 damage to each opposing character.", A("dragon", "#66bb6a", "#ff3dd6", { wings: true, rainbow: true })),
      IB("Bubble", "Hatchling", "emerald", 2, 1, 3, 1, "c", "Dreamborn · Dragon", "Ward (opponents can't choose this character except to challenge).", A("dragon", "#a5d6a7", "#ffd54a", { small: true })),
      IB("Mochi", "Sleepy Kitten", "amber", 1, 1, 1, 2, "u", "Storyborn · Ally", "NAP TIME — This character can't quest the turn it's played.", A("cat", "#ffd1dc", "#fff0f5", { ears: true, tail: true, sleepy: true })),
      IB("Sir Waffles", "Breakfast Knight", "steel", 4, 3, 4, 1, "c", "Dreamborn · Knight", "Bodyguard (this character may enter play exerted).", A("tall", "#d9a066", "#ffd54a", { helmet: true, shield: true })),
      IB("Professor Owl", "Rarity Guide", "sapphire", 3, 1, 4, 2, "u", "Storyborn · Sage", "LOOK IT UP — When you play this character, look at the top 3 cards of your deck.", A("bird", "#8d6e63", "#ffe0b2", { glasses: true })),
      IB("Dino Dash", "Speedy Stomper", "ruby", 3, 3, 2, 1, "c", "Storyborn · Racer", "Rush.", A("dragon", "#7cb342", "#ffd54a", { spikes: true })),
      IB("Sparkle", "Ticket Fairy", "amethyst", 2, 1, 2, 2, "u", "Dreamborn · Fairy", "TICKET SHOWER — When you quest, gain 1 extra lore if you have 3+ items.", A("round", "#ffd54a", "#e94fff", { wings: true, sparkle: true, small: true })),
      IB("Quackbeard", "Pirate Duck", "ruby", 2, 2, 2, 1, "c", "Storyborn · Captain", "Reckless (this character can't quest and must challenge each turn if able).", A("bird", "#ffeb3b", "#ff9800", { hat: true, eyepatch: true })),
      IB("Nimbus", "Cloud Whale", "sapphire", 6, 3, 8, 2, "r", "Floodborn · Titan", "SEA SONG — Your items cost 1 less to play.", A("fish", "#42a5f5", "#e3f2fd", { big: true, spout: true })),
      IB("Coco", "Bamboo Muncher", "emerald", 3, 2, 4, 1, "c", "Storyborn · Ally", "Resist +1 (damage dealt to this character is reduced by 1).", A("round", "#ffffff", "#222222", { ears: true, patches: true })),
      IB("Ember", "Fire Fox", "ruby", 5, 5, 4, 2, "s", "Floodborn · Hero", "BLAZE — When you play this character, deal 1 damage to chosen character.", A("cat", "#ff5722", "#ffeb3b", { ears: true, tail: true, flames: true })),
      IB("Tangle", "Twisty Trickster", "emerald", 2, 2, 1, 1, "c", "Dreamborn · Trickster", "SLIPPERY — This character can't be challenged while you have an item.", A("blob", "#ff3dd6", "#ffe14d", { rainbow: true })),
      IB("Lumi", "Frost Queen", "sapphire", 7, 5, 7, 3, "l", "Dreamborn · Queen", "DEEP FREEZE — Exert all opposing characters.", A("tall", "#bfeaff", "#ffffff", { crown: true, hair: true, sparkle: true })),
      IB("Lumi", "Snow Day", "sapphire", 3, 2, 3, 2, "u", "Dreamborn · Queen", "Shift 2 (you may pay 2 ink to play this on top of your Lumi).", A("tall", "#e3f2fd", "#90caf9", { hair: true })),
      IB("Shadow", "Alley Cat", "amethyst", 3, 3, 2, 1, "c", "Storyborn · Rogue", "Evasive.", A("cat", "#37474f", "#ffd54a", { ears: true, tail: true })),
      IB("Sir Trophy", "Golden Knight", "steel", 6, 5, 6, 2, "r", "Floodborn · Knight", "SHINE ON — Your other characters get +1 strength.", A("tall", "#ffd54a", "#e0a800", { helmet: true, shield: true, sparkle: true })),
      IB("Marina", "Tide Singer", "sapphire", 4, 2, 5, 2, "u", "Storyborn · Princess", "LULLABY — When you play this character, chosen opposing character can't quest next turn.", A("fish", "#26c6da", "#ff8ac8", { hair: true, tail: true })),
      IB("Turbo", "Robo Racer", "steel", 4, 4, 3, 1, "c", "Floodborn · Racer", "Rush.", A("robot", "#f4433f", "#ffffff", { wheels: true })),
      IB("Wizzo", "Ticket Wizard", "amethyst", 4, 2, 4, 3, "r", "Dreamborn · Sorcerer", "ABRACADABRA — Draw 2 cards, then discard a card.", A("tall", "#7a3cff", "#ffd54a", { hat: true, sparkle: true, beard: true })),
      IB("Bolt", "Zappy Bunny", "amber", 2, 2, 2, 1, "c", "Storyborn · Ally", "QUICK — This character gets +1 strength while you have another character in play.", A("round", "#ffe14d", "#ffffff", { ears: true, lightning: true })),
      IB("Goo", "Galaxy Slime", "amethyst", 2, 1, 3, 1, "c", "Dreamborn · Blob", "SPLAT — When banished, put a slime counter on chosen character.", A("blob", "#7a3cff", "#c084fc", { sparkle: true })),
      IB("Axo", "Giant Axolotl", "amber", 5, 3, 7, 2, "s", "Dreamborn · Titan", "HUG — When you play this character, remove up to 3 damage from each of your characters.", A("fish", "#ff9ec7", "#ff6fa8", { big: true, frills: true })),
      IB("Peppermint", "Snack Chef", "amber", 3, 2, 3, 2, "u", "Storyborn · Chef", "ORDER UP — When you play this character, you may play an item for free.", A("round", "#ffd6b8", "#ef5350", { hair: true, hat: true })),
      IB("Rocky", "Wall Climber", "emerald", 4, 3, 5, 1, "c", "Storyborn · Athlete", "GRIP — This character can't be exerted by opponents' effects.", A("round", "#a1887f", "#00c853", { ears: true })),
      IB("Disco", "Dance Floor Star", "ruby", 3, 2, 3, 3, "r", "Dreamborn · Dancer", "GROOVE — Whenever this character quests, you may exert chosen opposing character.", A("cat", "#e040fb", "#ffd54a", { ears: true, sparkle: true, glasses: true })),
      IB("The Claw", "Grabby Machine", "steel", 5, 4, 4, 2, "u", "Floodborn · Machine", "GRAB — When you play this character, return chosen item to its player's hand.", A("robot", "#00e5ff", "#1b1340", { arms: true, antenna: true })),
      IB("Emmy", "Inkbound Legend", "amethyst", 7, 6, 7, 4, "e", "Dreamborn · Hero", "EVERY TICKET COUNTS — Whenever you quest, gain 1 lore for each item you have.", A("cat", "#e94fff", "#ffd6b8", { hair: true, crown: true, sparkle: true, rainbow: true })),
      IB("Quackers", "Claw Machine Duck", "amber", 1, 1, 2, 1, "c", "Storyborn · Ally", "Squeak! Support.", A("bird", "#ffeb3b", "#ff9800", { small: true })),
      IB("Pusher", "Coin Wizard", "steel", 3, 2, 3, 2, "u", "Floodborn · Machine", "CLINK — When you play this character, gain 1 lore for each item you have (max 3).", A("robot", "#ffd54a", "#3949ab", { arms: true })),
      IB("Bella", "Balloon Artist", "ruby", 2, 1, 3, 1, "c", "Storyborn · Ally", "POP! — When banished, deal 1 damage to chosen character.", A("round", "#ef5350", "#ffffff", { hair: true, small: true })),
      IB("Strike", "Bowling Bear", "emerald", 4, 4, 4, 1, "u", "Storyborn · Athlete", "Rush.", A("round", "#8d6e63", "#5c6bc0", { ears: true, big: true })),
      IB("Lumi", "Ice Sculptor", "sapphire", 5, 3, 5, 2, "r", "Dreamborn · Queen", "FROSTWORK — Your items get +1 lore when they quest.", A("tall", "#bfeaff", "#ffffff", { hair: true, sparkle: true })),
      IB("Foxy", "Fair Trader", "amber", 4, 3, 4, 2, "s", "Storyborn · Ally", "SWEETEN THE DEAL — When you play this character, you may exchange an item with an opponent's item.", A("cat", "#ff8c42", "#fff3e0", { ears: true, tail: true, sparkle: true })),
      IB("Hammer", "Strongman", "ruby", 5, 5, 5, 1, "u", "Storyborn · Athlete", "DING! — When this character challenges, deal 1 extra damage.", A("tall", "#f4433f", "#ffd54a", { arms: true, big: true })),
      IB("Melody", "Dance Floor DJ", "amethyst", 3, 2, 3, 3, "r", "Dreamborn · Musician", "BEAT DROP — Whenever you play a song, gain 1 lore.", A("cat", "#e040fb", "#00e5ff", { ears: true, glasses: true, sparkle: true })),
      IB("Goalie", "Brave Keeper", "steel", 3, 2, 5, 1, "c", "Storyborn · Athlete", "Bodyguard.", A("tall", "#ff9800", "#222222", { helmet: true })),
      IB("Duckie", "Gallery Target", "emerald", 2, 2, 2, 1, "c", "Floodborn · Ally", "QUICK QUACK — This character gets +1 strength while challenging.", A("bird", "#ffeb3b", "#26c6da", { small: true })),
      IB("Chef Pep", "Order Up!", "amber", 5, 3, 5, 2, "r", "Storyborn · Chef", "TIPS! — When you quest with this character, gain 1 lore for each other Ally you have.", A("round", "#ffd6b8", "#ef5350", { hair: true, hat: true, big: true })),
      IB("Bubble", "Sky Dragon", "emerald", 7, 6, 7, 3, "l", "Floodborn · Dragon", "STORM WINGS — Your other characters gain Evasive.", A("dragon", "#66bb6a", "#bfeaff", { wings: true, big: true, sparkle: true })),
      IB("Ticket Genie", "Prize Booth Clerk", "amethyst", 4, 2, 4, 3, "u", "Dreamborn · Ally", "REDEEM — When you play this character, draw a card for each item you have.", A("tall", "#7a3cff", "#ffd54a", { hair: true, sparkle: true })),
      IB("Marina", "Deep Sea Song", "sapphire", 6, 4, 6, 3, "l", "Floodborn · Princess", "TIDAL LULLABY — Exert chosen opposing character each turn.", A("fish", "#26c6da", "#ff8ac8", { hair: true, tail: true, sparkle: true, big: true })),
    ],
  },
  critters: {
    name: "Critter Clash", packSize: 10, back: { bg: "#0b3d91", fg: "#ffd54a", title: "CRITTER CLASH", sym: "⚡" },
    cards: [
      { n: "Sparkitten", t: "Electric", hp: 60, r: "c", atk: [["Static Paw", 10], ["Zap", 20]], art: A("cat", "#ffe14d", "#ffffff", { ears: true, tail: true, lightning: true }) },
      { n: "Thundercat", t: "Electric", hp: 120, r: "r", atk: [["Thunder Claw", 40], ["Storm Pounce", 70]], art: A("cat", "#ffd54a", "#ff9800", { ears: true, tail: true, lightning: true, big: true }) },
      { n: "Flambit", t: "Fire", hp: 50, r: "c", atk: [["Ember Nibble", 10], ["Hot Hop", 20]], art: A("round", "#ff7043", "#ffeb3b", { ears: true, flames: true, small: true }) },
      { n: "Blazehare", t: "Fire", hp: 110, r: "u", atk: [["Fire Kick", 40], ["Inferno Dash", 60]], art: A("round", "#f4433f", "#ffd54a", { ears: true, flames: true }) },
      { n: "Aquapup", t: "Water", hp: 60, r: "c", atk: [["Splash", 10], ["Bubble Bark", 20]], art: A("cat", "#42a5f5", "#e3f2fd", { ears: true, tail: true }) },
      { n: "Tidalwhale", t: "Water", hp: 150, r: "s", atk: [["Wave Crash", 50], ["Tsunami", 90]], art: A("fish", "#2f7fd6", "#bfeaff", { big: true, spout: true }) },
      { n: "Leafling", t: "Grass", hp: 50, r: "c", atk: [["Leaf Tap", 10], ["Vine Whip", 20]], art: A("round", "#66bb6a", "#c5e1a5", { leaf: true, small: true }) },
      { n: "Mossbear", t: "Grass", hp: 130, r: "r", atk: [["Bark Slam", 40], ["Forest Roar", 70]], art: A("round", "#558b2f", "#a5d6a7", { ears: true, leaf: true, big: true }) },
      { n: "Boltbunny", t: "Electric", hp: 70, r: "u", atk: [["Hop Shock", 20], ["Volt Bounce", 40]], art: A("round", "#fff176", "#ffffff", { ears: true, lightning: true }) },
      { n: "Rockmole", t: "Ground", hp: 80, r: "c", atk: [["Dig", 20], ["Boulder Toss", 30]], art: A("blob", "#8d6e63", "#5d4037", { claws: true }) },
      { n: "Frostfawn", t: "Ice", hp: 70, r: "u", atk: [["Snowflake", 20], ["Icy Gaze", 40]], art: A("tall", "#e3f2fd", "#90caf9", { antlers: true, sparkle: true }) },
      { n: "Glowbug", t: "Fairy", hp: 40, r: "c", atk: [["Twinkle", 10], ["Glow Burst", 30]], art: A("round", "#e94fff", "#ffd54a", { wings: true, sparkle: true, small: true }) },
      { n: "Puffcloud", t: "Normal", hp: 60, r: "c", atk: [["Fluff", 10], ["Drizzle", 20]], art: A("blob", "#ffffff", "#bfeaff", { sleepy: true }) },
      { n: "Thundraco", t: "Dragon", hp: 160, r: "l", atk: [["Dragon Bolt", 60], ["Sky Fury", 100]], art: A("dragon", "#7a3cff", "#ffd54a", { wings: true, lightning: true, big: true }) },
      { n: "Zapwing", t: "Electric", hp: 80, r: "u", atk: [["Peck", 20], ["Thunder Dive", 50]], art: A("bird", "#ffeb3b", "#3d8bfd", { wings: true, lightning: true }) },
      { n: "Shadowl", t: "Dark", hp: 90, r: "u", atk: [["Night Peck", 30], ["Shadow Swoop", 50]], art: A("bird", "#37474f", "#ab47bc", { wings: true }) },
      { n: "Crystalisk", t: "Rock", hp: 120, r: "r", atk: [["Gem Bite", 40], ["Crystal Beam", 70]], art: A("dragon", "#b9c5d6", "#e94fff", { spikes: true, sparkle: true }) },
      { n: "Sunflit", t: "Grass", hp: 60, r: "c", atk: [["Petal Dance", 20], ["Sunbeam", 30]], art: A("round", "#ffd54a", "#66bb6a", { leaf: true, sparkle: true }) },
      { n: "Snowyeti", t: "Ice", hp: 140, r: "r", atk: [["Snowball", 40], ["Blizzard Hug", 80]], art: A("tall", "#ffffff", "#bfeaff", { big: true, arms: true }) },
      { n: "Lavaturtle", t: "Fire", hp: 130, r: "u", atk: [["Shell Bash", 30], ["Magma Spin", 60]], art: A("blob", "#5d4037", "#ff7043", { shell: true, flames: true }) },
      { n: "Bubblefin", t: "Water", hp: 70, r: "c", atk: [["Fin Slap", 20], ["Bubble Beam", 30]], art: A("fish", "#26c6da", "#ffffff", { small: true }) },
      { n: "Pebblepup", t: "Ground", hp: 60, r: "c", atk: [["Nuzzle", 10], ["Sand Kick", 20]], art: A("cat", "#a1887f", "#d7ccc8", { ears: true, tail: true, small: true }) },
      { n: "Mistyfox", t: "Fairy", hp: 100, r: "r", atk: [["Charm", 30], ["Dream Dust", 60]], art: A("cat", "#f48fb1", "#e6ccff", { ears: true, tail: true, sparkle: true }) },
      { n: "Ironbeetle", t: "Steel", hp: 110, r: "u", atk: [["Iron Head", 30], ["Gear Grind", 50]], art: A("blob", "#7f8c8d", "#00e5ff", { antenna: true, shell: true }) },
      { n: "Starlynx", t: "Fairy", hp: 130, r: "s", atk: [["Star Slash", 50], ["Cosmic Pounce", 80]], art: A("cat", "#3d0f5a", "#e94fff", { ears: true, tail: true, sparkle: true, big: true }) },
      { n: "Magmaroo", t: "Fire", hp: 100, r: "u", atk: [["Hot Hop", 30], ["Lava Kick", 60]], art: A("tall", "#e64a19", "#ffd54a", { ears: true, tail: true, flames: true }) },
      { n: "Coralcrab", t: "Water", hp: 80, r: "c", atk: [["Pinch", 20], ["Coral Guard", 20]], art: A("blob", "#ff7043", "#ffab91", { claws: true }) },
      { n: "Skyserpent", t: "Dragon", hp: 140, r: "r", atk: [["Coil", 40], ["Cloud Strike", 80]], art: A("dragon", "#90caf9", "#ffffff", { wings: true, big: true }) },
      { n: "Nightmoth", t: "Dark", hp: 70, r: "c", atk: [["Dust", 10], ["Dark Flutter", 30]], art: A("bird", "#4a148c", "#e94fff", { wings: true, small: true }) },
      { n: "Prismarine", t: "Dragon", hp: 180, r: "e", atk: [["Rainbow Roar", 70], ["Prism Blast", 120]], art: A("dragon", "#ffffff", "#e94fff", { wings: true, rainbow: true, sparkle: true, big: true }) },
      { n: "Duckling", t: "Water", hp: 50, r: "c", atk: [["Splash", 10], ["Waddle", 10]], art: A("bird", "#ffeb3b", "#ff9800", { small: true }) },
      { n: "Gearmouse", t: "Steel", hp: 60, r: "c", atk: [["Nibble", 10], ["Gear Spin", 30]], art: A("cat", "#90a4ae", "#ffd54a", { ears: true, tail: true, antenna: true, small: true }) },
      { n: "Sparkowl", t: "Electric", hp: 90, r: "u", atk: [["Hoot", 20], ["Volt Vision", 50]], art: A("bird", "#8d6e63", "#ffeb3b", { glasses: true, lightning: true }) },
      { n: "Blazedragon", t: "Fire", hp: 150, r: "s", atk: [["Flame Wing", 50], ["Solar Flare", 90]], art: A("dragon", "#ff7043", "#ffd54a", { wings: true, flames: true, big: true }) },
      { n: "Cloudkit", t: "Fairy", hp: 60, r: "c", atk: [["Fluff Pat", 10], ["Dream Dust", 30]], art: A("cat", "#ffffff", "#e6ccff", { ears: true, tail: true, small: true, sparkle: true }) },
      { n: "Boulderbeast", t: "Rock", hp: 160, r: "r", atk: [["Stomp", 50], ["Landslide", 80]], art: A("round", "#8d6e63", "#5d4037", { ears: true, big: true, spikes: true }) },
      { n: "Frostbite", t: "Ice", hp: 100, r: "u", atk: [["Chill Nip", 30], ["Frost Fang", 60]], art: A("cat", "#e3f2fd", "#81d4fa", { ears: true, tail: true, sparkle: true }) },
      { n: "Mossling", t: "Grass", hp: 40, r: "c", atk: [["Seed Toss", 10], ["Grow", 20]], art: A("blob", "#66bb6a", "#a5d6a7", { leaf: true, small: true }) },
      { n: "Voltwhale", t: "Electric", hp: 170, r: "l", atk: [["Thunder Splash", 60], ["Lightning Tide", 110]], art: A("fish", "#42a5f5", "#ffeb3b", { big: true, spout: true, lightning: true }) },
      { n: "Shadowpaw", t: "Dark", hp: 110, r: "r", atk: [["Sneak", 30], ["Night Pounce", 70]], art: A("cat", "#37474f", "#5c6bc0", { ears: true, tail: true }) },
    ],
  },
};
const TYPE_COLOR = { Electric: "#f9d400", Fire: "#ff7043", Water: "#42a5f5", Grass: "#66bb6a", Ground: "#a1887f", Ice: "#81d4fa", Fairy: "#f48fb1", Normal: "#bdbdbd", Dragon: "#7e57c2", Dark: "#5c6bc0", Rock: "#8d6e63", Steel: "#90a4ae" };
const TYPE_ICON = { Electric: "⚡", Fire: "🔥", Water: "💧", Grass: "🍃", Ground: "⛰", Ice: "❄", Fairy: "✨", Normal: "★", Dragon: "🐉", Dark: "🌙", Rock: "🪨", Steel: "⚙" };
const WEAK = { Electric: "Ground", Fire: "Water", Water: "Grass", Grass: "Fire", Ground: "Water", Ice: "Fire", Fairy: "Steel", Normal: "Dark", Dragon: "Ice", Dark: "Fairy", Rock: "Grass", Steel: "Fire" };

// ---- pack rolling -----------------------------------------------------------
const ORDER = ["c", "u", "r", "s", "l", "e"];
function rollFrom(set, allowed) { const pool = set.cards.filter((c) => allowed.includes(c.r)); const tot = pool.reduce((s, c) => s + RAR[c.r].w, 0); let r = Math.random() * tot; for (const c of pool) { r -= RAR[c.r].w; if (r <= 0) return c; } return pool[pool.length - 1]; }
export function openPack(setId) {
  const set = CARD_SETS[setId]; const out = [];
  if (setId === "inkbound") { // 12 cards: 6 common, 3 uncommon, 2 rare-or-better, 1 foil of any rarity
    for (let i = 0; i < 6; i++) out.push({ c: rollFrom(set, ["c"]) }); for (let i = 0; i < 3; i++) out.push({ c: rollFrom(set, ["u"]) });
    for (let i = 0; i < 2; i++) out.push({ c: rollFrom(set, Math.random() < 0.03 ? ["e"] : ["r", "s", "l"]) });
    out.push({ c: rollFrom(set, Math.random() < 0.05 ? ["e"] : ORDER.slice(0, 5)), foil: true });
  } else { // 10 cards: 5 common, 3 uncommon, 1 rare-or-better, 1 reverse-holo
    for (let i = 0; i < 5; i++) out.push({ c: rollFrom(set, ["c"]) }); for (let i = 0; i < 3; i++) out.push({ c: rollFrom(set, ["u"]) });
    out.push({ c: rollFrom(set, Math.random() < 0.03 ? ["e"] : ["r", "s", "l"]) }); out.push({ c: rollFrom(set, ["c", "u", "r"]), foil: true });
  }
  return out;
}

// ---- procedural illustrated creature art (SVG) -----------------------------
export function artSvg(a, bg1, bg2, w = 300, h = 200) {
  const s = a.small ? 0.8 : a.big ? 1.2 : 1, cx = 150, cy = 118, ink = "#222", c1 = a.c1, c2 = a.c2;
  const p = [];
  p.push(`<defs><radialGradient id="g1" cx="50%" cy="30%"><stop offset="0" stop-color="${bg1}"/><stop offset="1" stop-color="${bg2}"/></radialGradient><linearGradient id="rb" x1="0" x2="1"><stop offset="0" stop-color="#ff5da2"/><stop offset=".33" stop-color="#ffe14d"/><stop offset=".66" stop-color="#4caf78"/><stop offset="1" stop-color="#3d8bfd"/></linearGradient></defs>`);
  p.push(`<rect width="${w}" height="${h}" fill="url(#g1)"/>`);
  for (let i = 0; i < 18; i++) p.push(`<circle cx="${(i * 47) % w}" cy="${(i * 31) % (h * 0.7)}" r="${1 + (i % 3)}" fill="#fff" opacity=".5"/>`);
  p.push(`<ellipse cx="${cx}" cy="${h - 22}" rx="120" ry="18" fill="#000" opacity=".22"/>`);
  let b = "";
  if (a.wings) b += `<path d="M-40 -10 C-90 -60 -110 -10 -60 20 Z" fill="${c2}" stroke="${ink}" stroke-width="2"/><path d="M40 -10 C90 -60 110 -10 60 20 Z" fill="${c2}" stroke="${ink}" stroke-width="2"/>`;
  if (a.tail) b += `<path d="M38 30 C80 30 90 -10 70 -30" stroke="${c1}" stroke-width="14" fill="none" stroke-linecap="round"/><circle cx="70" cy="-30" r="9" fill="${c2}"/>`;
  switch (a.body) {
    case "tall": b += `<rect x="-30" y="-30" width="60" height="85" rx="26" fill="${c1}" stroke="${ink}" stroke-width="2.5"/>`; break;
    case "blob": b += `<path d="M-55 40 C-70 -10 -30 -50 0 -45 C40 -50 75 -5 55 40 Z" fill="${c1}" stroke="${ink}" stroke-width="2.5"/>`; break;
    case "fish": b += `<ellipse cx="0" cy="12" rx="62" ry="40" fill="${c1}" stroke="${ink}" stroke-width="2.5"/><path d="M58 12 L92 -14 L92 38 Z" fill="${c2}" stroke="${ink}" stroke-width="2"/><ellipse cx="0" cy="26" rx="40" ry="16" fill="${c2}" opacity=".8"/>`; break;
    case "bird": b += `<ellipse cx="0" cy="18" rx="40" ry="42" fill="${c1}" stroke="${ink}" stroke-width="2.5"/><ellipse cx="0" cy="26" rx="22" ry="24" fill="${c2}"/>`; break;
    case "robot": b += `<rect x="-38" y="-8" width="76" height="60" rx="8" fill="${c1}" stroke="${ink}" stroke-width="2.5"/><rect x="-24" y="4" width="48" height="26" rx="4" fill="${ink}"/><rect x="-18" y="10" width="36" height="14" fill="${c2}"/>`; break;
    case "dragon": b += `<ellipse cx="0" cy="18" rx="52" ry="38" fill="${c1}" stroke="${ink}" stroke-width="2.5"/><ellipse cx="0" cy="28" rx="30" ry="18" fill="${c2}" opacity=".9"/>${[-30, -10, 10, 30].map((x) => `<path d="M${x} -18 L${x + 8} -36 L${x + 16} -18 Z" fill="${c2}" stroke="${ink}" stroke-width="1.5"/>`).join("")}`; break;
    case "cat": b += `<ellipse cx="0" cy="22" rx="42" ry="34" fill="${c1}" stroke="${ink}" stroke-width="2.5"/><ellipse cx="0" cy="34" rx="20" ry="16" fill="${c2}" opacity=".9"/>`; break;
    default: b += `<circle cx="0" cy="12" r="48" fill="${c1}" stroke="${ink}" stroke-width="2.5"/><ellipse cx="0" cy="30" rx="26" ry="18" fill="${c2}" opacity=".9"/>`;
  }
  const headY = a.body === "tall" ? -44 : a.body === "robot" ? -34 : a.body === "fish" ? -8 : -30, headR = a.body === "fish" ? 0 : 30;
  if (headR) b += a.body === "robot" ? `<rect x="-28" y="${headY - 26}" width="56" height="50" rx="10" fill="${c1}" stroke="${ink}" stroke-width="2.5"/>` : `<circle cx="0" cy="${headY}" r="${headR}" fill="${c1}" stroke="${ink}" stroke-width="2.5"/>`;
  const ey = headR ? headY : -2;
  if (a.ears) b += `<path d="M-26 ${ey - 14} L-34 ${ey - 44} L-8 ${ey - 26} Z" fill="${c1}" stroke="${ink}" stroke-width="2"/><path d="M26 ${ey - 14} L34 ${ey - 44} L8 ${ey - 26} Z" fill="${c1}" stroke="${ink}" stroke-width="2"/>`;
  if (a.horn) b += `<path d="M-6 ${ey - 26} L0 ${ey - 62} L6 ${ey - 26} Z" fill="#ffd76a" stroke="${ink}" stroke-width="2"/>`;
  if (a.antlers) b += `<path d="M-14 ${ey - 24} L-26 ${ey - 50} M-20 ${ey - 38} L-32 ${ey - 44} M14 ${ey - 24} L26 ${ey - 50} M20 ${ey - 38} L32 ${ey - 44}" stroke="#6d4c41" stroke-width="4" stroke-linecap="round" fill="none"/>`;
  if (a.antenna) b += `<line x1="0" y1="${ey - 26}" x2="0" y2="${ey - 46}" stroke="${ink}" stroke-width="3"/><circle cx="0" cy="${ey - 50}" r="6" fill="${c2}"/>`;
  if (a.leaf) b += `<path d="M0 ${ey - 28} C-20 ${ey - 50} -6 ${ey - 62} 6 ${ey - 56} C14 ${ey - 44} 8 ${ey - 34} 0 ${ey - 28} Z" fill="#66bb6a" stroke="${ink}" stroke-width="1.5"/>`;
  if (a.crown) b += `<path d="M-22 ${ey - 24} L-22 ${ey - 44} L-10 ${ey - 34} L0 ${ey - 50} L10 ${ey - 34} L22 ${ey - 44} L22 ${ey - 24} Z" fill="#ffd54a" stroke="${ink}" stroke-width="2"/>`;
  if (a.hat) b += `<path d="M-30 ${ey - 22} L30 ${ey - 22} L26 ${ey - 30} L-26 ${ey - 30} Z M-18 ${ey - 30} L-10 ${ey - 62} L10 ${ey - 62} L18 ${ey - 30} Z" fill="#37474f" stroke="${ink}" stroke-width="2"/>`;
  if (a.helmet) b += `<path d="M-30 ${ey - 4} A30 30 0 0 1 30 ${ey - 4} Z" fill="#b0bec5" stroke="${ink}" stroke-width="2"/><rect x="-3" y="${ey - 48}" width="6" height="16" fill="#e0243b"/>`;
  if (a.hair) b += `<path d="M-30 ${ey - 6} C-34 ${ey - 40} 34 ${ey - 40} 30 ${ey - 6} C20 ${ey - 20} -20 ${ey - 20} -30 ${ey - 6} Z" fill="${c2 === "#ffd6b8" ? "#6b3e1e" : c2}" stroke="${ink}" stroke-width="2"/>`;
  if (a.mane) b += `<path d="M-30 ${ey - 8} C-36 ${ey - 44} 0 ${ey - 50} 20 ${ey - 40}" stroke="url(#rb)" stroke-width="10" fill="none" stroke-linecap="round"/>`;
  const e1 = -11, e2 = 11, eyeY = ey - 2;
  if (a.sleepy) b += `<path d="M${e1 - 7} ${eyeY} Q${e1} ${eyeY + 6} ${e1 + 7} ${eyeY} M${e2 - 7} ${eyeY} Q${e2} ${eyeY + 6} ${e2 + 7} ${eyeY}" stroke="${ink}" stroke-width="3" fill="none" stroke-linecap="round"/>`;
  else b += `<circle cx="${e1}" cy="${eyeY}" r="7" fill="#fff"/><circle cx="${e2}" cy="${eyeY}" r="7" fill="#fff"/><circle cx="${e1 + 1.5}" cy="${eyeY + 1}" r="4" fill="${ink}"/><circle cx="${e2 + 1.5}" cy="${eyeY + 1}" r="4" fill="${ink}"/><circle cx="${e1 + 3}" cy="${eyeY - 1.5}" r="1.5" fill="#fff"/><circle cx="${e2 + 3}" cy="${eyeY - 1.5}" r="1.5" fill="#fff"/>`;
  if (a.eyepatch) b += `<circle cx="${e2}" cy="${eyeY}" r="9" fill="${ink}"/><line x1="${e2 - 26}" y1="${eyeY - 12}" x2="${e2 + 12}" y2="${eyeY - 4}" stroke="${ink}" stroke-width="3"/>`;
  if (a.glasses) b += `<circle cx="${e1}" cy="${eyeY}" r="10" fill="none" stroke="#37474f" stroke-width="2.5"/><circle cx="${e2}" cy="${eyeY}" r="10" fill="none" stroke="#37474f" stroke-width="2.5"/><line x1="${e1 + 10}" y1="${eyeY}" x2="${e2 - 10}" y2="${eyeY}" stroke="#37474f" stroke-width="2.5"/>`;
  b += a.body === "bird" ? `<path d="M-8 ${eyeY + 8} L0 ${eyeY + 20} L8 ${eyeY + 8} Z" fill="#ff9800" stroke="${ink}" stroke-width="1.5"/>` : `<path d="M-9 ${eyeY + 10} Q0 ${eyeY + 20} 9 ${eyeY + 10}" stroke="${ink}" stroke-width="3" fill="none" stroke-linecap="round"/>`;
  if (a.beard) b += `<path d="M-14 ${eyeY + 12} Q0 ${eyeY + 44} 14 ${eyeY + 12} Z" fill="#eceff1" stroke="${ink}" stroke-width="1.5"/>`;
  b += `<circle cx="${e1 - 8}" cy="${eyeY + 9}" r="4" fill="#ff8a9b" opacity=".6"/><circle cx="${e2 + 8}" cy="${eyeY + 9}" r="4" fill="#ff8a9b" opacity=".6"/>`;
  if (a.shield) b += `<path d="M-64 -6 L-40 -6 L-40 28 L-52 40 L-64 28 Z" fill="${c2}" stroke="${ink}" stroke-width="2"/>`;
  if (a.arms) b += `<rect x="-58" y="-2" width="20" height="40" rx="8" fill="${c1}" stroke="${ink}" stroke-width="2"/><rect x="38" y="-2" width="20" height="40" rx="8" fill="${c1}" stroke="${ink}" stroke-width="2"/>`;
  if (a.wheels) b += `<circle cx="-26" cy="54" r="12" fill="#222"/><circle cx="26" cy="54" r="12" fill="#222"/>`;
  if (a.claws) b += `<path d="M-60 30 L-74 14 L-58 20 Z M60 30 L74 14 L58 20 Z" fill="${c1}" stroke="${ink}" stroke-width="2"/>`;
  if (a.shell) b += `<path d="M-46 30 A46 30 0 0 1 46 30 Z" fill="${c2}" stroke="${ink}" stroke-width="2"/>`;
  if (a.spikes) b += `${[-24, 0, 24].map((x) => `<path d="M${x - 8} -20 L${x} -44 L${x + 8} -20 Z" fill="${c2}" stroke="${ink}" stroke-width="1.5"/>`).join("")}`;
  if (a.frills) b += `<path d="M-60 -8 L-80 -24 M-60 2 L-84 0 M60 -8 L80 -24 M60 2 L84 0" stroke="#ff6fa8" stroke-width="6" stroke-linecap="round"/>`;
  if (a.spout) b += `<path d="M0 -50 L-10 -74 M0 -50 L10 -74 M0 -50 L0 -80" stroke="#bfeaff" stroke-width="5" stroke-linecap="round"/>`;
  if (a.patches) b += `<circle cx="${e1}" cy="${eyeY}" r="12" fill="${c2}" opacity=".85"/><circle cx="${e2}" cy="${eyeY}" r="12" fill="${c2}" opacity=".85"/><circle cx="${e1}" cy="${eyeY}" r="5" fill="#fff"/><circle cx="${e2}" cy="${eyeY}" r="5" fill="#fff"/><circle cx="${e1 + 1}" cy="${eyeY + 1}" r="2.5" fill="${ink}"/><circle cx="${e2 + 1}" cy="${eyeY + 1}" r="2.5" fill="${ink}"/>`;
  if (a.flames) b += `<path d="M-70 40 Q-66 10 -54 24 Q-50 0 -40 26 Q-36 12 -30 40 Z" fill="#ff7043" opacity=".9"/><path d="M30 40 Q34 10 46 24 Q50 0 60 26 Q64 12 70 40 Z" fill="#ff7043" opacity=".9"/>`;
  if (a.lightning) b += `<path d="M62 -52 L50 -30 L60 -30 L46 -6 L72 -34 L61 -34 Z" fill="#ffeb3b" stroke="${ink}" stroke-width="1.5"/>`;
  if (a.rainbow) b += `<path d="M-90 -50 A90 60 0 0 1 90 -50" stroke="url(#rb)" stroke-width="8" fill="none" opacity=".9"/>`;
  if (a.sparkle) b += `${[[-70, -40], [72, -20], [-60, 30], [80, 30]].map(([x, y]) => `<path d="M${x} ${y - 8} L${x + 2.5} ${y - 2.5} L${x + 8} ${y} L${x + 2.5} ${y + 2.5} L${x} ${y + 8} L${x - 2.5} ${y + 2.5} L${x - 8} ${y} L${x - 2.5} ${y - 2.5} Z" fill="#fff"/>`).join("")}`;
  p.push(`<g transform="translate(${cx} ${cy}) scale(${s})">${b}</g>`);
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" preserveAspectRatio="xMidYMid slice">${p.join("")}</svg>`;
}
export function rarityGem(r) { const R = RAR[r]; const c = R.color; switch (R.shape) {
  case "triangle": return `<svg viewBox="0 0 20 20"><path d="M10 2 L19 18 L1 18 Z" fill="${c}" stroke="#222" stroke-width="1.2"/></svg>`;
  case "diamond": return `<svg viewBox="0 0 20 20"><path d="M10 1 L19 10 L10 19 L1 10 Z" fill="${c}" stroke="#222" stroke-width="1.2"/></svg>`;
  case "pentagon": return `<svg viewBox="0 0 20 20"><path d="M10 1 L19 8 L15.5 19 L4.5 19 L1 8 Z" fill="${c}" stroke="#222" stroke-width="1.2"/></svg>`;
  case "hexagon": return `<svg viewBox="0 0 20 20"><defs><linearGradient id="rg" x1="0" x2="1"><stop offset="0" stop-color="#ff5da2"/><stop offset=".5" stop-color="#ffe14d"/><stop offset="1" stop-color="#3d8bfd"/></linearGradient></defs><path d="M5 2 L15 2 L19 10 L15 18 L5 18 L1 10 Z" fill="url(#rg)" stroke="#222" stroke-width="1.2"/></svg>`;
  case "circle2": return `<svg viewBox="0 0 20 20"><circle cx="10" cy="10" r="8" fill="${c}" stroke="#222" stroke-width="1.2"/><circle cx="10" cy="10" r="4" fill="#cfd8dc"/></svg>`;
  default: return `<svg viewBox="0 0 20 20"><circle cx="10" cy="10" r="8" fill="${c}" stroke="#222" stroke-width="1.2"/></svg>`; } }

// ---- card HTML --------------------------------------------------------------
export function cardHtml(setId, c, flipped, foil = false) {
  const set = CARD_SETS[setId]; const rar = RAR[c.r]; const isFoil = foil || c.r === "e";
  const back = `<div class="f back" style="background:${set.back.bg}"><div class="bk-ring" style="border-color:${set.back.fg}"><span>${set.back.sym}</span></div><div class="bk-title" style="color:${set.back.fg}">${set.back.title}</div></div>`;
  if (setId === "inkbound") {
    const ink = INKS[c.ink];
    return `<div class="tcard ink ${isFoil ? "holo" : ""} ${flipped ? "flipped" : ""}" style="--ink:${ink.color};--inkd:${ink.dark}"><div class="inner">${back}
      <div class="f front ib">
        <div class="ib-art">${artSvg(c.art, ink.color, ink.dark)}</div>
        <div class="ib-cost ${c.inkable ? "inkable" : ""}" title="Ink cost${c.inkable ? " · inkable" : ""}"><span>${c.cost}</span></div>
        <div class="ib-ink" title="${ink.name}">${ink.sym}</div>
        <div class="ib-name"><b>${c.n}</b><i>${c.ver}</i></div>
        <div class="ib-type">${c.type}</div>
        <div class="ib-text">${c.ability}</div>
        <div class="ib-str" title="Strength">${c.str}</div><div class="ib-wil" title="Willpower">${c.wil}</div>
        <div class="ib-lore" title="Lore">${"◆".repeat(c.lore)}</div>
        <div class="ib-rar" title="${rar.label}${isFoil ? " · Foil" : ""}">${rarityGem(c.r)}</div>
        ${isFoil ? `<div class="foil-tag">${c.r === "e" ? "ENCHANTED" : "FOIL"}</div>` : ""}
      </div></div></div>`;
  }
  const tc = TYPE_COLOR[c.t] || "#bdbdbd";
  return `<div class="tcard crit ${isFoil ? "holo" : ""} ${flipped ? "flipped" : ""}" style="--tc:${tc}"><div class="inner">${back}
    <div class="f front cc">
      <div class="cc-head"><b>${c.n}</b><span class="cc-hp">HP ${c.hp} <i>${TYPE_ICON[c.t] || "★"}</i></span></div>
      <div class="cc-art">${artSvg(c.art, tc, "#1a1040")}</div>
      <div class="cc-type">${c.t} Critter</div>
      ${c.atk.map(([nm, dmg]) => `<div class="cc-atk"><span class="cc-en">${TYPE_ICON[c.t] || "★"}</span><span>${nm}</span><b>${dmg}</b></div>`).join("")}
      <div class="cc-foot"><span>weak: ${TYPE_ICON[WEAK[c.t]] || "★"} ×2</span><span class="cc-rar">${rarityGem(c.r)} ${rar.label}${isFoil ? " ✨" : ""}</span></div>
    </div></div></div>`;
}

// --------------------------------------------------------------------------
//  Interactions
// --------------------------------------------------------------------------
export function playPrize(prize, stage, ctx) {
  switch (prize.kind) {
    case "toy3d": return prize.claw ? playPlush(prize, stage, ctx) : playToy3d(prize, stage, ctx);
    case "bouncy": return playBouncy(stage, ctx);
    case "wand": return playWand(stage, ctx);
    case "candy": return playCandy(prize, stage, ctx);
    case "pack": return playPack(prize, stage, ctx);
    case "ipad": return playIpad(stage, ctx);
    case "snack": return playSnack(prize, stage, ctx);
    default: return () => {};
  }
}

const TIPS3D = { squish: "🖐️ Press and hold to squish it! 🔄 Drag around it to spin it", flick: "👆 Flick it to spin! 🔄 Drag to turn it around", pet: "🖐️ Stroke it to give it a shine ✨ 🔄 Drag to turn", cube: "👆 Tap it! 🔄 Drag to turn it around" };
function playToy3d(prize, stage, ctx) {
  let scene = null, dead = false; ctx.setTip(TIPS3D[prize.toy.play] || "👆 Play with it!");
  const fallback = () => { if (dead) return; stage.innerHTML = ""; const el = document.createElement("div"); el.className = "bigemoji"; el.textContent = prize.emoji; stage.appendChild(el);
    let hold = false; el.onpointerdown = () => { hold = true; el.style.transform = "scale(1.25, .7)"; ctx.sfx.squish(); ctx.spark(stage, 0.5, 0.4, prize.toy.parts || ["✨"], 4); }; const up = () => { if (hold) { hold = false; el.style.transform = ""; } }; el.onpointerup = up; el.onpointerleave = up; };
  import("./fidget3d.js").then((mod) => {
    if (dead) return;
    try { scene = mod.createFidgetScene(stage, prize.toy, { tone: ctx.tone, makeSustain: ctx.makeSustain, burst: (nx, ny, marks, n) => ctx.spark(stage, nx, ny, marks, n), tierColor: "#ff3dd6", tierRank: prize.big ? 6 : 2, parts: prize.toy.parts, baseFreq: prize.big ? 180 : 320 }); }
    catch (e) { console.warn("3D prize failed", e); fallback(); }
  }).catch((e) => { console.warn("3D module failed", e); fallback(); });
  return () => { dead = true; if (scene) scene.dispose(); };
}

// claw plushies: the real shaped plush from the machine — hold to squish, drag to spin
function playPlush(prize, stage, ctx) {
  let dead = false, cleanup = () => {};
  ctx.setTip("🖐️ Press and hold to squish your plushie! 🔄 Drag to spin it around");
  Promise.resolve().then(() => {
    if (dead) return;
    const r = stage.getBoundingClientRect(); const W = Math.max(120, r.width), H = Math.max(120, r.height);
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true }); renderer.setPixelRatio(Math.min(2, devicePixelRatio || 1)); renderer.setSize(W, H); renderer.domElement.style.cssText = "position:absolute;inset:0;width:100%;height:100%;touch-action:none;cursor:grab"; stage.appendChild(renderer.domElement);
    const scene = new THREE.Scene(); scene.add(new THREE.HemisphereLight(0xffffff, 0x404060, 1.1)); const d = new THREE.DirectionalLight(0xffffff, 1.4); d.position.set(3, 5, 4); scene.add(d);
    const camera = new THREE.PerspectiveCamera(40, W / H, 0.05, 50); camera.position.set(0, 0.5, 1.7); camera.lookAt(0, 0.3, 0);
    const pivot = new THREE.Group(); scene.add(pivot); const plush = makePlush(prize.id.replace("plush_", ""), 1.2); pivot.add(plush); pivot.add(blobShadow(0.5, 0.35));
    let holding = false, squish = 0, v = 0, yaw = 0, drag = null, snd = null, raf = 0, last = performance.now(), spark = 0;
    const cv = renderer.domElement;
    cv.onpointerdown = (e) => { cv.setPointerCapture(e.pointerId); drag = { x: e.clientX, moved: 0 }; holding = true; snd = ctx.makeSustain("triangle"); snd.setVol(0.05); };
    cv.onpointermove = (e) => { if (!drag) return; const dx = e.clientX - drag.x; drag.moved += Math.abs(dx); if (drag.moved > 6) holding = false; yaw += dx * 0.012; drag.x = e.clientX; };
    const up = () => { drag = null; if (holding) { ctx.tone(360 + squish * 240, 0.18, { type: "triangle", vol: 0.15, slideTo: 260 }); } holding = false; if (snd) { snd.stop(); snd = null; } }; cv.onpointerup = up; cv.onpointercancel = up;
    const frame = (now) => { raf = requestAnimationFrame(frame); const dt = Math.min(0.05, (now - last) / 1000); last = now;
      const target = holding ? 0.55 : 0; v += ((target - squish) * 90 - v * 15) * dt; squish += v * dt; squish = Math.max(-0.05, Math.min(0.7, squish));
      plush.scale.set(1.2 * (1 + squish * 0.3), 1.2 * (1 - squish * 0.5), 1.2 * (1 + squish * 0.3)); pivot.rotation.y = yaw + (drag ? 0 : Math.sin(now / 1500) * 0.15);
      if (snd) { snd.setFreq(260 + squish * 260); snd.setVol(0.05 + squish * 0.1); }
      if (holding && squish > 0.45 && now - spark > 260) { spark = now; ctx.spark(stage, 0.5, 0.35, prize.toy.parts || ["✨"], 2); }
      renderer.render(scene, camera); };
    raf = requestAnimationFrame(frame);
    cleanup = () => { cancelAnimationFrame(raf); if (snd) snd.stop(); renderer.dispose(); scene.traverse((o) => { o.geometry?.dispose?.(); if (o.material) (Array.isArray(o.material) ? o.material : [o.material]).forEach((m) => m.dispose?.()); }); cv.remove(); };
  });
  return () => { dead = true; cleanup(); };
}

function playBouncy(stage, ctx) {
  ctx.setTip("👆 Flick the ball! Tap it to make it bounce higher.");
  const cv = document.createElement("canvas"); cv.style.cssText = "position:absolute;inset:0;width:100%;height:100%;touch-action:none;cursor:pointer"; stage.appendChild(cv);
  const g = cv.getContext("2d"); let W = 1, H = 1; const size = () => { const r = stage.getBoundingClientRect(); W = cv.width = Math.max(50, r.width); H = cv.height = Math.max(50, r.height); }; size();
  const b = { x: W / 2, y: H / 3, vx: 120, vy: 0, r: 34, rot: 0 }; let drag = null, raf = 0, last = performance.now(), bounces = 0, trail = [];
  const pos = (e) => { const r = cv.getBoundingClientRect(); return { x: (e.clientX - r.left) * (W / r.width), y: (e.clientY - r.top) * (H / r.height) }; };
  cv.onpointerdown = (e) => { cv.setPointerCapture(e.pointerId); const p = pos(e); drag = { ...p, t: performance.now(), hit: Math.hypot(p.x - b.x, p.y - b.y) < b.r + 20 }; if (drag.hit) { b.vy = -Math.max(400, Math.abs(b.vy) * 1.3); b.vx += rnd(-100, 100); ctx.sfx.pop(); } };
  cv.onpointermove = (e) => { if (!drag) return; const p = pos(e); const dt = Math.max(0.01, (performance.now() - drag.t) / 1000); if (dt > 0.03) { b.vx = b.vx * 0.5 + ((p.x - drag.x) / dt) * 0.5 * 0.9; b.vy = b.vy * 0.5 + ((p.y - drag.y) / dt) * 0.5 * 0.9; drag = { ...p, t: performance.now(), hit: drag.hit }; } };
  cv.onpointerup = cv.onpointercancel = () => { drag = null; };
  function frame(now) { raf = requestAnimationFrame(frame); const dt = Math.min(0.04, (now - last) / 1000); last = now;
    b.vy += 1400 * dt; b.x += b.vx * dt; b.y += b.vy * dt; b.rot += b.vx * dt / b.r; let hit = false;
    if (b.y > H - b.r) { b.y = H - b.r; if (Math.abs(b.vy) > 60) hit = true; b.vy = -b.vy * 0.86; b.vx *= 0.99; } if (b.y < b.r) { b.y = b.r; b.vy = -b.vy * 0.86; hit = true; }
    if (b.x < b.r) { b.x = b.r; b.vx = -b.vx * 0.9; hit = true; } if (b.x > W - b.r) { b.x = W - b.r; b.vx = -b.vx * 0.9; hit = true; }
    if (hit) { bounces++; ctx.tone(300 + Math.min(600, Math.hypot(b.vx, b.vy) / 3), 0.07, { type: "sine", vol: 0.12, slideTo: 200 }); }
    trail.push({ x: b.x, y: b.y }); if (trail.length > 14) trail.shift(); g.clearRect(0, 0, W, H);
    trail.forEach((t, i) => circle(g, t.x, t.y, b.r * (i / trail.length) * 0.8, `rgba(255,61,214,${i / trail.length * 0.25})`));
    g.save(); g.translate(b.x, b.y); g.rotate(b.rot); const grad = g.createRadialGradient(-10, -10, 4, 0, 0, b.r); grad.addColorStop(0, "#fff"); grad.addColorStop(0.3, "#ff3dd6"); grad.addColorStop(1, "#7a0060"); circle(g, 0, 0, b.r, grad); g.strokeStyle = "rgba(255,255,255,.5)"; g.lineWidth = 3; g.beginPath(); g.arc(0, 0, b.r * 0.7, 0.3, 2.2); g.stroke(); g.restore();
    drawText(g, `bounces: ${bounces}`, W - 14, H - 16, 14, "rgba(255,255,255,.6)", "right", 700); }
  raf = requestAnimationFrame(frame); window.addEventListener("resize", size);
  return () => { cancelAnimationFrame(raf); window.removeEventListener("resize", size); };
}

function playWand(stage, ctx) {
  ctx.setTip("🪄 Drag to draw with light! Tap ✨ to clear.");
  const cv = document.createElement("canvas"); cv.style.cssText = "position:absolute;inset:0;width:100%;height:100%;touch-action:none;cursor:crosshair;background:#06031a;border-radius:20px"; stage.appendChild(cv);
  const g = cv.getContext("2d"); let W = 1, H = 1; const size = () => { const r = stage.getBoundingClientRect(); W = cv.width = Math.max(50, r.width); H = cv.height = Math.max(50, r.height); }; size();
  const clear = document.createElement("button"); clear.className = "pclose"; clear.style.cssText = "top:auto;bottom:10px;right:10px;left:auto"; clear.textContent = "✨"; clear.title = "Clear"; stage.appendChild(clear);
  const strokes = []; let cur = null, raf = 0, snd = null;
  const pos = (e) => { const r = cv.getBoundingClientRect(); return { x: (e.clientX - r.left) * (W / r.width), y: (e.clientY - r.top) * (H / r.height) }; };
  cv.onpointerdown = (e) => { cv.setPointerCapture(e.pointerId); cur = { pts: [pos(e)] }; strokes.push(cur); snd = ctx.makeSustain("sine"); snd.setVol(0.05); };
  cv.onpointermove = (e) => { if (!cur) return; const p = pos(e); cur.pts.push(p); if (snd) snd.setFreq(300 + (1 - p.y / H) * 600); if (cur.pts.length % 6 === 0) ctx.spark(stage, p.x / W, p.y / H, ["✨"], 1); };
  cv.onpointerup = cv.onpointercancel = () => { cur = null; if (snd) { snd.stop(); snd = null; } };
  clear.onclick = () => { strokes.length = 0; ctx.sfx.pop(); };
  function frame(now) { raf = requestAnimationFrame(frame); g.fillStyle = "rgba(6,3,26,.35)"; g.fillRect(0, 0, W, H);
    for (let i = 0; i < 30; i++) circle(g, (i * 97.3) % W, (i * 53.7 + now / 60) % H, 1.2, "rgba(255,255,255,.4)"); g.lineCap = "round"; g.lineJoin = "round";
    strokes.forEach((s, si) => { if (s.pts.length < 2) return; for (let k = 1; k < s.pts.length; k++) { const h = (si * 40 + k * 4 + now / 20) % 360; g.strokeStyle = `hsla(${h},100%,65%,.95)`; g.shadowColor = `hsl(${h},100%,60%)`; g.shadowBlur = 18; g.lineWidth = 7; g.beginPath(); g.moveTo(s.pts[k - 1].x, s.pts[k - 1].y); g.lineTo(s.pts[k].x, s.pts[k].y); g.stroke(); } }); g.shadowBlur = 0;
    if (cur) { const p = cur.pts[cur.pts.length - 1]; drawEmoji(g, "🪄", p.x + 22, p.y - 22, 40, -0.7); } }
  raf = requestAnimationFrame(frame); window.addEventListener("resize", size);
  return () => { cancelAnimationFrame(raf); window.removeEventListener("resize", size); if (snd) snd.stop(); };
}

function playCandy(prize, stage, ctx) {
  const st = ctx.state; st.candy = st.candy ?? 0;
  const refresh = () => { ctx.setTip(st.candy > 0 ? `🍬 ${st.candy} candies left — tap one to unwrap it!` : "All gone! 😋 Redeem another bag for more."); if (st.candy <= 0) { st.prizes[prize.id] = 0; ctx.rerender(); } ctx.save(); };
  const wrap = document.createElement("div"); wrap.style.cssText = "display:flex;flex-wrap:wrap;gap:14px;justify-content:center;align-content:center;padding:14px;width:100%"; stage.appendChild(wrap);
  const CANDIES = ["🍬", "🍭", "🍫", "🍡", "🧁", "🍩", "🍪", "🍰"];
  for (let i = 0; i < st.candy; i++) { const c = document.createElement("div"); c.textContent = CANDIES[i % CANDIES.length]; c.style.cssText = "font-size:54px;cursor:pointer;transition:transform .15s;filter:drop-shadow(0 6px 10px rgba(0,0,0,.4))";
    c.onpointerdown = () => { if (c.dataset.open) { c.textContent = "😋"; c.style.pointerEvents = "none"; ctx.sfx.ding(); const r = c.getBoundingClientRect(), s = stage.getBoundingClientRect(); ctx.spark(stage, (r.left + r.width / 2 - s.left) / s.width, (r.top - s.top) / s.height, ["💖", "✨", "⭐"], 6); st.candy--; refresh(); setTimeout(() => c.remove(), 500); } else { c.dataset.open = "1"; c.style.transform = "scale(1.3)"; ctx.sfx.pop(); ctx.toast("Unwrapped! Tap again to eat it 😋"); } }; wrap.appendChild(c); }
  refresh(); return () => {};
}

// snacks: take three bites, then the boost kicks in
function playSnack(snack, stage, ctx) {
  let bites = 0;
  const el = document.createElement("div"); el.className = "bigemoji"; el.textContent = snack.emoji; stage.appendChild(el);
  ctx.setTip(`Tap the ${snack.name.toLowerCase()} to take a bite! (${snack.desc})`);
  el.onpointerdown = () => { if (bites >= 3) return; bites++; ctx.sfx.pop(); el.style.transform = `scale(${1 - bites * 0.22}) rotate(${bites * 15}deg)`; const r = el.getBoundingClientRect(), s = stage.getBoundingClientRect(); ctx.spark(stage, (r.left + r.width / 2 - s.left) / s.width, (r.top + r.height / 2 - s.top) / s.height, ["💖", "✨", "😋"], 4);
    if (bites >= 3) { el.textContent = "😋"; el.style.transform = ""; ctx.sfx.win(); ctx.setTip("All gone — delicious! Your boost is ready. 🎉"); ctx.onEaten && ctx.onEaten(snack); } };
  return () => {};
}

function playPack(prize, stage, ctx) {
  const st = ctx.state; const setId = prize.set, set = CARD_SETS[setId];
  st.cards = st.cards || {}; st.cards[setId] = st.cards[setId] || []; st.foils = st.foils || {}; st.foils[setId] = st.foils[setId] || [];
  const packsLeft = () => st.prizes[prize.id] || 0;
  ctx.box.classList.add("wide");
  const wrap = document.createElement("div"); wrap.className = "packwrap"; stage.appendChild(wrap);
  const btns = document.createElement("div"); btns.className = "pbtns"; ctx.box.appendChild(btns);
  let view = "pack", bBinder;
  const binderLabel = () => `📒 My ${set.name} binder (${st.cards[setId].length})`;
  function render() {
    wrap.innerHTML = ""; btns.innerHTML = "";
    bBinder = document.createElement("button"); bBinder.className = "act btn-blue"; bBinder.style.fontSize = "14px"; bBinder.textContent = view === "binder" ? "🎴 Back to packs" : binderLabel(); bBinder.onclick = () => { view = view === "binder" ? "pack" : "binder"; ctx.sfx.tap(); render(); }; btns.appendChild(bBinder);
    if (view === "binder") {
      ctx.setTip(`📒 Your ${set.name} collection — ${new Set(st.cards[setId]).size}/${set.cards.length} different cards · ${st.foils[setId].length} foils`);
      const b = document.createElement("div"); b.className = "binder";
      if (!st.cards[setId].length) b.innerHTML = `<div class="empty" style="margin:auto">No cards yet — open a pack!</div>`;
      const counts = {}; st.cards[setId].forEach((i) => (counts[i] = (counts[i] || 0) + 1));
      set.cards.forEach((c, i) => { if (!counts[i]) return; const d = document.createElement("div"); d.style.position = "relative"; d.innerHTML = cardHtml(setId, c, true, st.foils[setId].includes(i)); if (counts[i] > 1) d.innerHTML += `<span class="owned" style="position:absolute;top:-6px;right:-4px;font-size:10px;font-weight:900;background:#00c853;color:#fff;border-radius:999px;padding:2px 6px">×${counts[i]}</span>`; b.appendChild(d); });
      wrap.appendChild(b); return;
    }
    if (packsLeft() <= 0) { ctx.setTip("No unopened packs left — win more tickets and redeem another!"); wrap.innerHTML = `<div class="empty">📦 No packs left to open.<br><br>Check your binder or redeem a new pack at the Prize Counter!</div>`; return; }
    ctx.setTip(`🎴 Tap the pack to rip it open! (${packsLeft()} unopened · ${set.packSize} cards each)`);
    const pk = document.createElement("button"); pk.className = "pack"; pk.style.background = setId === "critters" ? "linear-gradient(160deg,#ffd000,#3d8bfd 60%,#0b3d91)" : "linear-gradient(160deg,#e94fff,#4c1d95 60%,#1a0a3a)";
    pk.innerHTML = `<div class="big">${set.back.sym}</div><div>${set.name}</div><div style="font-size:11px;opacity:.9">BOOSTER PACK • ${set.packSize} CARDS</div>`;
    pk.onclick = () => { if (pk.classList.contains("tearing")) return; pk.classList.add("tearing"); ctx.sfx.tear();
      setTimeout(() => { st.prizes[prize.id]--; const pulled = openPack(setId); pulled.forEach(({ c, foil }) => { const i = set.cards.indexOf(c); st.cards[setId].push(i); if (foil && !st.foils[setId].includes(i)) st.foils[setId].push(i); }); ctx.save(); ctx.rerender(); bBinder.textContent = binderLabel();
        wrap.innerHTML = ""; const row = document.createElement("div"); row.className = "cards"; let flipped = 0;
        pulled.forEach(({ c, foil }, i) => { const d = document.createElement("div"); d.innerHTML = cardHtml(setId, c, false, foil); const el = d.firstElementChild; el.style.animationDelay = `${i * 0.08}s`;
          el.onclick = () => { if (el.classList.contains("flipped")) return; el.classList.add("flipped"); flipped++; const big = ["s", "l", "e"].includes(c.r); (big ? ctx.sfx.win : ctx.sfx.flip)();
            if (big || foil) { ctx.toast(`${c.r === "e" ? "🌈 ENCHANTED" : c.r === "l" ? "⭐ LEGENDARY" : c.r === "s" ? "💎 SUPER RARE" : "✨ FOIL"}! ${c.n}${c.ver ? " — " + c.ver : ""}!`); const r = el.getBoundingClientRect(), s = stage.getBoundingClientRect(); ctx.spark(stage, (r.left + r.width / 2 - s.left) / s.width, (r.top + r.height / 2 - s.top) / s.height, ["✨", "🌟", "⭐"], 10); }
            if (flipped === pulled.length) { ctx.setTip(`All ${pulled.length} revealed! They're in your binder now 📒`); const again = document.createElement("button"); again.className = "act btn-pink"; again.style.fontSize = "14px"; again.textContent = packsLeft() > 0 ? `🎴 Open another (${packsLeft()} left)` : "📒 See binder"; again.onclick = () => { view = packsLeft() > 0 ? "pack" : "binder"; render(); }; btns.appendChild(again); } };
          row.appendChild(el); });
        wrap.appendChild(row); ctx.setTip("👆 Tap each card to flip it over! (the last one is your guaranteed foil)");
        const flipAll = document.createElement("button"); flipAll.className = "act btn-purple"; flipAll.style.fontSize = "14px"; flipAll.textContent = "Flip all"; flipAll.onclick = () => { row.querySelectorAll(".tcard:not(.flipped)").forEach((el) => el.click()); flipAll.remove(); }; btns.appendChild(flipAll);
      }, 550); };
    wrap.appendChild(pk);
  }
  render();
  return () => { btns.remove(); ctx.box.classList.remove("wide"); };
}

function playIpad(stage, ctx) {
  ctx.box.classList.add("wide"); ctx.setTip("📱 Tap the app to open it. The bar at the bottom is the Home button.");
  const pad = document.createElement("div"); pad.className = "ipad"; pad.innerHTML = `<div class="cam"></div><div class="scr"></div><div class="home" title="Home"></div>`; stage.appendChild(pad);
  const scr = pad.querySelector(".scr");
  const home = () => {
    scr.innerHTML = `<div class="homescreen"><div class="clock">${new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}</div><div style="font-size:13px;opacity:.9">Emmy's iPad</div>
      <div class="apps"><button class="app" id="appFidget"><div class="ico" style="background:linear-gradient(160deg,#3ea16a,#24734a)">🦊</div><div class="lbl">Fidget Trading</div></button><button class="app locked" disabled><div class="ico" style="background:#666">🔒</div><div class="lbl">Nothing else!</div></button></div></div>`;
    scr.querySelector("#appFidget").onclick = () => { ctx.sfx.tap(); scr.innerHTML = `<iframe src="game.html" title="Emmy's Fidget Trading" allow="autoplay"></iframe>`; ctx.setTip("🦊 Playing Emmy's Fidget Trading on your iPad! Tap the Home bar to go back."); };
  };
  pad.querySelector(".home").onclick = () => { ctx.sfx.tap(); home(); ctx.setTip("📱 Tap the app to open it."); };
  home();
  return () => { ctx.box.classList.remove("wide"); };
}
