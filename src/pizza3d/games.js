// ==========================================================================
//  Emmy's Pizza Plus — the catalog: every clicker game, the rarities, and
//  the mystery bags & boxes (with their real, printed odds).
// ==========================================================================
import { GAMES_A } from "./games-a.js";
import { GAMES_B } from "./games-b.js";
import { GAMES_C } from "./games-c.js";
import { GAMES_D } from "./games-d.js";

export const RARITIES = {
  common: { name: "Common", color: "#c9a26b", order: 0, dupe: 3 },
  uncommon: { name: "Uncommon", color: "#43b04a", order: 1, dupe: 5 },
  rare: { name: "Rare", color: "#2f8cff", order: 2, dupe: 9 },
  superrare: { name: "Super Rare", color: "#12b5a5", order: 3, dupe: 12 },
  epic: { name: "Epic", color: "#a04dff", order: 4, dupe: 16 },
  legendary: { name: "Legendary", color: "#ff9800", order: 5, dupe: 30 },
  mythic: { name: "Mythic", color: "#ff3d7f", order: 6, dupe: 60 },
  cosmic: { name: "Cosmic", color: "#3b3fd6", order: 7, dupe: 85 },
  secret: { name: "Cheesy Secret", color: "#ffc400", order: 8, dupe: 120, rainbow: true },
  golden: { name: "Golden Crust", color: "#e0a800", order: 9, dupe: 200, shine: true },
};
export const RARITY_IDS = Object.keys(RARITIES);
export const CATALOG = [...GAMES_A, ...GAMES_B, ...GAMES_C, ...GAMES_D];
export const byId = (id) => CATALOG.find((g) => g.id === id);
// coins a game has paid out = COIN_K × √(points ÷ base) — so the first taps pay
// and huge helper-made piles don't rain coins (rarer games pay a bit better)
export const COIN_K = { common: 0.7, uncommon: 0.75, rare: 0.8, superrare: 0.85, epic: 0.9, legendary: 1, mythic: 1.15, cosmic: 1.2, secret: 1.3, golden: 1.5 };
export const coinsFor = (game, total) => Math.floor(COIN_K[game.rar] * Math.sqrt(Math.max(0, total) / (game.base || 1)));

// odds are in percent and printed in the shop
export const BAGS = {
  bag: { name: "Snack Bag", ico: "🛍️", look: "bag", price: 12, desc: "A greasy little paper bag. Smells amazing.", odds: { common: 52, uncommon: 26, rare: 11, superrare: 5, epic: 3, legendary: 1.2, mythic: 0.4, cosmic: 0.2, secret: 1, golden: 0.2 } },
  box: { name: "Mystery Pizza Box", ico: "📦", look: "box", price: 30, desc: "A real pizza box! Better odds inside.", odds: { common: 24.5, uncommon: 27, rare: 21, superrare: 10, epic: 9, legendary: 4, mythic: 1.2, cosmic: 0.5, secret: 2.5, golden: 0.3 } },
  party: { name: "Party Box", ico: "🎉", look: "party", price: 75, desc: "Always Rare or better! Balloons included.", odds: { rare: 34, superrare: 18, epic: 22, legendary: 12, mythic: 5, cosmic: 2, secret: 6, golden: 1 } },
  gold: { name: "Golden Oven Crate", ico: "👑", look: "gold", price: 180, desc: "Always Epic or better. Fit for a pizza queen!", odds: { epic: 32, legendary: 27, mythic: 15, cosmic: 8, secret: 14, golden: 4 } },
};
export const BAG_IDS = Object.keys(BAGS);
