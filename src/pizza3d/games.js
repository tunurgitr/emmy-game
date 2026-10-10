// ==========================================================================
//  Emmy's Pizza Plus — the catalog: every clicker game, the rarities, and
//  the mystery bags & boxes (with their real, printed odds).
// ==========================================================================
import { GAMES_A } from "./games-a.js";
import { GAMES_B } from "./games-b.js";
import { GAMES_C } from "./games-c.js";

export const RARITIES = {
  common: { name: "Common", color: "#c9a26b", order: 0, dupe: 3 },
  uncommon: { name: "Uncommon", color: "#43b04a", order: 1, dupe: 5 },
  rare: { name: "Rare", color: "#2f8cff", order: 2, dupe: 9 },
  epic: { name: "Epic", color: "#a04dff", order: 3, dupe: 16 },
  legendary: { name: "Legendary", color: "#ff9800", order: 4, dupe: 30 },
  mythic: { name: "Mythic", color: "#ff3d7f", order: 5, dupe: 60 },
  secret: { name: "Cheesy Secret", color: "#ffc400", order: 6, dupe: 120, rainbow: true },
};
export const RARITY_IDS = Object.keys(RARITIES);
export const CATALOG = [...GAMES_A, ...GAMES_B, ...GAMES_C];
export const byId = (id) => CATALOG.find((g) => g.id === id);
// coins a game has paid out = COIN_K × √(points ÷ base) — so the first taps pay
// and huge helper-made piles don't rain coins (rarer games pay a bit better)
export const COIN_K = { common: 0.7, uncommon: 0.75, rare: 0.8, epic: 0.9, legendary: 1, mythic: 1.15, secret: 1.3 };
export const coinsFor = (game, total) => Math.floor(COIN_K[game.rar] * Math.sqrt(Math.max(0, total) / (game.base || 1)));

// odds are in percent and printed in the shop
export const BAGS = {
  bag: { name: "Snack Bag", ico: "🛍️", look: "bag", price: 12, desc: "A greasy little paper bag. Smells amazing.", odds: { common: 54.5, uncommon: 26, rare: 12, epic: 4.5, legendary: 1.5, mythic: 0.5, secret: 1 } },
  box: { name: "Mystery Pizza Box", ico: "📦", look: "box", price: 30, desc: "A real pizza box! Better odds inside.", odds: { common: 27, uncommon: 29, rare: 24, epic: 11, legendary: 5, mythic: 1.5, secret: 2.5 } },
  party: { name: "Party Box", ico: "🎉", look: "party", price: 75, desc: "Always Rare or better! Balloons included.", odds: { rare: 42, epic: 28, legendary: 15, mythic: 7, secret: 8 } },
  gold: { name: "Golden Oven Crate", ico: "👑", look: "gold", price: 180, desc: "Always Epic or better. Fit for a pizza queen!", odds: { epic: 38, legendary: 30, mythic: 17, secret: 15 } },
};
export const BAG_IDS = Object.keys(BAGS);
