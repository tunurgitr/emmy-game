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
// how many points it takes to make one coin, by rarity (rarer games pay better)
export const COIN_RATE = { common: 6, uncommon: 6, rare: 6, epic: 6, legendary: 6, mythic: 5, secret: 4 };

// odds are in percent and printed in the shop
export const BAGS = {
  bag: { name: "Snack Bag", ico: "🛍️", look: "bag", price: 12, desc: "A greasy little paper bag. Smells amazing.", odds: { common: 55, uncommon: 26, rare: 12, epic: 4.5, legendary: 1.8, mythic: 0.5, secret: 0.2 } },
  box: { name: "Mystery Pizza Box", ico: "📦", look: "box", price: 30, desc: "A real pizza box! Better odds inside.", odds: { common: 28, uncommon: 30, rare: 24, epic: 11, legendary: 5, mythic: 1.5, secret: 0.5 } },
  party: { name: "Party Box", ico: "🎉", look: "party", price: 75, desc: "Always Rare or better! Balloons included.", odds: { rare: 45, epic: 30, legendary: 16, mythic: 7, secret: 2 } },
  gold: { name: "Golden Oven Crate", ico: "👑", look: "gold", price: 180, desc: "Always Epic or better. Fit for a pizza queen!", odds: { epic: 42, legendary: 33, mythic: 18, secret: 7 } },
};
export const BAG_IDS = Object.keys(BAGS);
