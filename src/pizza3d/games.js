// ==========================================================================
//  Emmy's Pizza Plus — the catalog: every clicker game, the rarities, and
//  the mystery bags & boxes (with their real, printed odds).
// ==========================================================================
import { GAMES_A } from "./games-a.js";
import { GAMES_B } from "./games-b.js";
import { GAMES_C } from "./games-c.js";
import { GAMES_D } from "./games-d.js";
import { GAMES_E } from "./games-e.js";
import { GAMES_F } from "./games-f.js";
import { GAMES_G } from "./games-g.js";
import { GAMES_H } from "./games-h.js";
import { GAMES_I } from "./games-i.js";
import { GAMES_J } from "./games-j.js";

// twenty rarities, rarest last. `cls` gives the chip a special shimmer.
const R = (name, color, dupe, k, more = {}) => ({ name, color, dupe, k, ...more });
export const RARITIES = {
  common: R("Common", "#c9a26b", 3, 0.7),
  uncommon: R("Uncommon", "#43b04a", 5, 0.75),
  shiny: R("Shiny", "#7aa6c2", 7, 0.78),
  rare: R("Rare", "#2f8cff", 9, 0.8),
  superrare: R("Super Rare", "#12b5a5", 12, 0.85),
  sparkly: R("Sparkly", "#ff6fb5", 14, 0.88),
  epic: R("Epic", "#a04dff", 16, 0.9),
  mega: R("Mega", "#5cb800", 22, 0.95),
  legendary: R("Legendary", "#ff9800", 30, 1),
  ultra: R("Ultra", "#e8322a", 42, 1.08),
  mythic: R("Mythic", "#ff3d7f", 60, 1.15),
  magical: R("Magical", "#00a6c8", 72, 1.18),
  cosmic: R("Cosmic", "#3b3fd6", 85, 1.2),
  galactic: R("Galactic", "#24306e", 100, 1.25),
  secret: R("Cheesy Secret", "#ffc400", 120, 1.3, { rainbow: true, cls: "rainbow" }),
  golden: R("Golden Crust", "#e0a800", 200, 1.5, { cls: "goldshine" }),
  diamond: R("Diamond Dough", "#5fd3f3", 240, 1.55, { cls: "iceshine" }),
  royal: R("Royal Pepperoni", "#b0174a", 280, 1.6, { cls: "royalshine" }),
  celestial: R("Celestial", "#c99cff", 330, 1.7, { cls: "pastelshine" }),
  infinity: R("Infinity Pizza", "#ff5d8f", 400, 1.8, { rainbow: true, cls: "infinityshine" }),
};
Object.values(RARITIES).forEach((r, i) => (r.order = i));
export const RARITY_IDS = Object.keys(RARITIES);
export const CATALOG = [...GAMES_A, ...GAMES_B, ...GAMES_C, ...GAMES_D, ...GAMES_E, ...GAMES_F, ...GAMES_G, ...GAMES_H, ...GAMES_I, ...GAMES_J];
export const byId = (id) => CATALOG.find((g) => g.id === id);
// coins a game has paid out = k × √(points ÷ base) — so the first taps pay
// and huge helper-made piles don't rain coins (rarer games pay a bit better)
export const coinsFor = (game, total) => Math.floor(RARITIES[game.rar].k * Math.sqrt(Math.max(0, total) / (game.base || 1)));

// odds are in percent and printed in the shop (each box adds up to 100)
export const BAGS = {
  bag: { name: "Snack Bag", ico: "🛍️", look: "bag", price: 12, desc: "A greasy little paper bag. Smells amazing.", odds: { common: 45, uncommon: 25, shiny: 13, rare: 8, superrare: 4, sparkly: 2.2, epic: 1.2, mega: 0.5, secret: 1, golden: 0.1 } },
  box: { name: "Mystery Pizza Box", ico: "📦", look: "box", price: 30, desc: "A real pizza box! Better odds inside.", odds: { common: 18, uncommon: 20, shiny: 16, rare: 15, superrare: 10, sparkly: 7, epic: 5.5, mega: 3, legendary: 2, ultra: 1, mythic: 0.4, secret: 2, golden: 0.1 } },
  party: { name: "Party Box", ico: "🎉", look: "party", price: 75, desc: "Always Rare or better! Balloons included.", odds: { rare: 22, superrare: 18, sparkly: 15, epic: 13, mega: 10, legendary: 8, ultra: 5, mythic: 3, magical: 1.5, cosmic: 0.8, galactic: 0.2, secret: 3, golden: 0.5 } },
  gold: { name: "Golden Oven Crate", ico: "👑", look: "gold", price: 180, desc: "Always Epic or better. Fit for a pizza queen!", odds: { epic: 18, mega: 16, legendary: 15, ultra: 12, mythic: 10, magical: 8, cosmic: 6, galactic: 4, secret: 5, golden: 3, diamond: 1.5, royal: 1, celestial: 0.4, infinity: 0.1 } },
  star: { name: "Starlight Capsule", ico: "🌠", look: "star", price: 400, desc: "Always Mythic or better! It hums a little song.", odds: { mythic: 15, magical: 15, cosmic: 15, galactic: 13, secret: 12, golden: 10, diamond: 8, royal: 6, celestial: 4, infinity: 2 } },
};
export const BAG_IDS = Object.keys(BAGS);
