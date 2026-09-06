// ==========================================================================
//  Emmy's Arcade — prize counter catalog + the interactive "play with it" views.
//
//  Each prize: { id, name, emoji, cost, desc, kind, big?, stack? }
//    stack = true  → can be redeemed again and again (card packs, candy)
//  playPrize(prize, stage, ctx) mounts the interaction into `stage` and returns
//  a cleanup function. ctx = { sfx, tone, makeSustain, toast, state, save,
//  setTip, box, spark(stage, x, y, marks, n) }
// ==========================================================================
import { emoji as drawEmoji, text as drawText, circle, rnd, clamp, pick } from "./canvas2d.js";

export const PRIZES = [
  { id: "candy",   name: "Candy Bag",        emoji: "🍬", cost: 30,   kind: "candy",  stack: true,  desc: "A bag of 10 candies. Tap to unwrap & munch!" },
  { id: "bouncy",  name: "Bouncy Ball",      emoji: "🏐", cost: 60,   kind: "bouncy", desc: "Super bouncy! Flick it around." },
  { id: "yoyo",    name: "Glow Yo-Yo",       emoji: "🪀", cost: 70,   kind: "toy3d",  desc: "A real 3D yo-yo — flick it to spin.",
    toy: { name: "Glow Yo-Yo", play: "flick", parts: ["✨", "💫"], model3d: { shape: "yoyo", finish: "holo", colors: ["#00e5ff", "#ff3dd6", "#ffffff"] } } },
  { id: "slime",   name: "Galaxy Slime",     emoji: "🫧", cost: 80,   kind: "toy3d",  desc: "Squishy sparkly slime. Hold to squish!",
    toy: { name: "Galaxy Slime", play: "squish", parts: ["✨", "🌟", "💜"], model3d: { shape: "blob", finish: "goo", colors: ["#7a3cff", "#c084fc"] } } },
  { id: "wand",    name: "Glow Wand",        emoji: "🪄", cost: 120,  kind: "wand",   desc: "Draw glowing rainbow trails in the dark!" },
  { id: "bear",    name: "Teddy Bear Stuffy", emoji: "🧸", cost: 150,  kind: "toy3d",  desc: "A soft, squishable teddy. Hold to squish!",
    toy: { name: "Teddy Bear", play: "squish", parts: ["❤️", "🧸"], model3d: { shape: "ball", finish: "plush", colors: ["#c68642", "#8d5a2b", "#e6b980"], cute: true, params: { ears: true } } } },
  { id: "pokepack", name: "Pokémon Pack",    emoji: "🃏", cost: 200,  kind: "pack",   stack: true, set: "pokemon", desc: "5 cards! Tap to rip it open. Collect 'em all!" },
  { id: "lorpack", name: "Lorcana Pack",     emoji: "✨", cost: 250,  kind: "pack",   stack: true, set: "lorcana", desc: "5 Lorcana cards. Ink your collection!" },
  { id: "unicorn", name: "Unicorn Stuffy",   emoji: "🦄", cost: 400,  kind: "toy3d",  desc: "A magical plush unicorn to squish.",
    toy: { name: "Unicorn Stuffy", play: "squish", parts: ["🌈", "⭐", "🦄"], model3d: { shape: "ball", finish: "plush", colors: ["#ffd1dc", "#e6ccff", "#bfeaff", "#fff8dc"], cute: true, params: { horn: true, ears: true } } } },
  { id: "axolotl", name: "GIANT Axolotl",    emoji: "🦎", cost: 900,  kind: "toy3d",  big: true, desc: "The biggest, squishiest prize on the wall!",
    toy: { name: "Giant Axolotl", play: "squish", parts: ["💗", "🫧", "🌸"], model3d: { shape: "ball", finish: "plush", colors: ["#ff9ec7", "#ffc4dd", "#ff6fa8"], cute: true, params: { ovoid: true, ears: true } } } },
  { id: "ipad",    name: "iPad",             emoji: "📱", cost: 2500, kind: "ipad",   big: true, desc: "A real tablet! It has exactly one game on it…" },
  { id: "trophy",  name: "Champion Trophy",  emoji: "🏆", cost: 5000, kind: "toy3d",  big: true, desc: "Only for true arcade legends. Give it a polish!",
    toy: { name: "Arcade Champion Trophy", play: "pet", parts: ["✨", "🏆", "⭐"], model3d: { shape: "trophy", finish: "metal", colors: ["#ffd54a", "#e0a800", "#7a3cff"] } } },
];
export const prizeById = (id) => PRIZES.find((p) => p.id === id);

// --------------------------------------------------------------------------
//  Trading card sets (emoji art — kid-friendly fan versions)
// --------------------------------------------------------------------------
const RAR = { c: { label: "Common", color: "#9fb4c7", w: 60 }, u: { label: "Uncommon", color: "#4caf78", w: 25 }, r: { label: "Rare", color: "#3d8bfd", w: 10 }, h: { label: "Holo Rare ✨", color: "#ffd000", w: 4 }, s: { label: "SECRET RARE 🌈", color: "#e94fff", w: 1 } };
export const CARD_SETS = {
  pokemon: {
    name: "Pokémon", back: "⚡", label: "HP", cards: [
      { n: "Pikachu", e: "⚡", t: "Electric", hp: 60, r: "u" }, { n: "Charmander", e: "🔥", t: "Fire", hp: 50, r: "c" }, { n: "Squirtle", e: "💧", t: "Water", hp: 50, r: "c" }, { n: "Bulbasaur", e: "🌱", t: "Grass", hp: 50, r: "c" },
      { n: "Eevee", e: "🦊", t: "Normal", hp: 50, r: "c" }, { n: "Jigglypuff", e: "🎤", t: "Fairy", hp: 60, r: "c" }, { n: "Meowth", e: "🐱", t: "Normal", hp: 50, r: "c" }, { n: "Psyduck", e: "🦆", t: "Water", hp: 50, r: "c" },
      { n: "Snorlax", e: "😴", t: "Normal", hp: 130, r: "u" }, { n: "Gengar", e: "👻", t: "Ghost", hp: 90, r: "u" }, { n: "Magikarp", e: "🐟", t: "Water", hp: 30, r: "c" }, { n: "Ditto", e: "🟣", t: "Normal", hp: 50, r: "c" },
      { n: "Charizard", e: "🐉", t: "Fire", hp: 150, r: "h" }, { n: "Mewtwo", e: "🧬", t: "Psychic", hp: 130, r: "h" }, { n: "Gyarados", e: "🌊", t: "Water", hp: 130, r: "r" }, { n: "Dragonite", e: "🐲", t: "Dragon", hp: 140, r: "r" },
      { n: "Lapras", e: "🦕", t: "Water", hp: 120, r: "r" }, { n: "Vulpix", e: "🦊", t: "Fire", hp: 50, r: "c" }, { n: "Togepi", e: "🥚", t: "Fairy", hp: 40, r: "u" }, { n: "Lucario", e: "🐺", t: "Fighting", hp: 110, r: "r" },
      { n: "Mew", e: "🌸", t: "Psychic", hp: 60, r: "s" }, { n: "Rayquaza", e: "🐉", t: "Dragon", hp: 160, r: "s" }, { n: "Sylveon", e: "🎀", t: "Fairy", hp: 90, r: "u" }, { n: "Gardevoir", e: "💚", t: "Psychic", hp: 110, r: "r" },
    ] },
  lorcana: {
    name: "Lorcana", back: "✨", label: "Lore", cards: [
      { n: "Mickey Mouse — Brave Little Tailor", e: "🐭", t: "Steel • Hero", hp: 5, r: "u" }, { n: "Elsa — Snow Queen", e: "❄️", t: "Amethyst • Queen", hp: 4, r: "r" }, { n: "Stitch — Rock Star", e: "👽", t: "Amber • Alien", hp: 3, r: "u" },
      { n: "Simba — Future King", e: "🦁", t: "Amber • Prince", hp: 2, r: "c" }, { n: "Ariel — On Human Legs", e: "🧜‍♀️", t: "Sapphire • Princess", hp: 3, r: "c" }, { n: "Maleficent — Sorceress", e: "🐉", t: "Amethyst • Villain", hp: 4, r: "r" },
      { n: "Moana — Of Motunui", e: "🌊", t: "Sapphire • Princess", hp: 3, r: "c" }, { n: "Olaf — Friendly Snowman", e: "⛄", t: "Amethyst • Ally", hp: 1, r: "c" }, { n: "Rapunzel — Gifted with Healing", e: "🌞", t: "Amber • Princess", hp: 4, r: "r" },
      { n: "Genie — On the Job", e: "🧞", t: "Sapphire • Ally", hp: 2, r: "u" }, { n: "Baymax — Personal Healthcare", e: "🤖", t: "Sapphire • Robot", hp: 2, r: "c" }, { n: "Stitch — New Dog", e: "🐶", t: "Amber • Alien", hp: 1, r: "c" },
      { n: "Tinker Bell — Giant Fairy", e: "🧚", t: "Emerald • Fairy", hp: 4, r: "u" }, { n: "Scar — Shameless Firebrand", e: "😼", t: "Ruby • Villain", hp: 3, r: "u" }, { n: "Mulan — Imperial Soldier", e: "⚔️", t: "Ruby • Hero", hp: 3, r: "c" },
      { n: "Belle — Strange but Special", e: "📖", t: "Sapphire • Princess", hp: 3, r: "c" }, { n: "Hades — Lord of the Underworld", e: "🔥", t: "Amethyst • Villain", hp: 4, r: "r" }, { n: "Mickey Mouse — Wayward Sorcerer", e: "🧙", t: "Amethyst • Sorcerer", hp: 5, r: "h" },
      { n: "Elsa — Spirit of Winter", e: "💎", t: "Amethyst • Queen", hp: 6, r: "h" }, { n: "Cinderella — Ballroom Sensation", e: "👠", t: "Amber • Princess", hp: 3, r: "c" }, { n: "Donald Duck — Boisterous Fowl", e: "🦆", t: "Emerald • Ally", hp: 2, r: "c" },
      { n: "The Queen — Wicked and Vain", e: "🍎", t: "Amethyst • Villain", hp: 3, r: "u" }, { n: "Aurora — Dreaming Guardian", e: "🌹", t: "Amber • Princess", hp: 3, r: "c" }, { n: "Enchanted Mickey — Enchanted", e: "🌈", t: "Enchanted • Legend", hp: 7, r: "s" },
    ] },
};
function rollCard(set, minRar) {
  const order = ["c", "u", "r", "h", "s"]; const mi = order.indexOf(minRar || "c");
  const pool = set.cards.filter((c) => order.indexOf(c.r) >= mi);
  const tot = pool.reduce((s, c) => s + RAR[c.r].w, 0); let r = Math.random() * tot;
  for (const c of pool) { r -= RAR[c.r].w; if (r <= 0) return c; } return pool[0];
}
export function openPack(setId) { const set = CARD_SETS[setId]; return [rollCard(set), rollCard(set), rollCard(set), rollCard(set, "u"), rollCard(set, Math.random() < 0.3 ? "r" : "u")]; }
export function cardHtml(setId, c, flipped) {
  const set = CARD_SETS[setId], r = RAR[c.r];
  return `<div class="tcard ${setId} ${c.r === "h" || c.r === "s" ? "holo" : ""} ${flipped ? "flipped" : ""}" style="--rc:${r.color}"><div class="inner">
    <div class="f back">${set.back}</div>
    <div class="f front"><span class="hp">${set.label} ${c.hp}</span><div class="art">${c.e}</div><div class="nm">${c.n}</div><div class="ty">${c.t}</div><span class="rar" title="${r.label}">${c.r === "s" ? "🌈" : c.r === "h" ? "✨" : c.r === "r" ? "★" : c.r === "u" ? "◆" : "●"}</span></div>
  </div></div>`;
}

// --------------------------------------------------------------------------
//  Interactions
// --------------------------------------------------------------------------
export function playPrize(prize, stage, ctx) {
  switch (prize.kind) {
    case "toy3d": return playToy3d(prize, stage, ctx);
    case "bouncy": return playBouncy(stage, ctx);
    case "wand": return playWand(stage, ctx);
    case "candy": return playCandy(prize, stage, ctx);
    case "pack": return playPack(prize, stage, ctx);
    case "ipad": return playIpad(stage, ctx);
    default: return () => {};
  }
}

// ---- 3D toys (stuffies, slime, yo-yo, trophy) reuse the Fidget Zone engine ----
const TIPS3D = { squish: "🖐️ Press and hold to squish it! 🔄 Drag around it to spin it", flick: "👆 Flick it to spin! 🔄 Drag to turn it around", pet: "🖐️ Stroke it to give it a shine ✨ 🔄 Drag to turn" };
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

// ---- Bouncy ball: flick it, it bounces around the box ----
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
    b.vy += 1400 * dt; b.x += b.vx * dt; b.y += b.vy * dt; b.rot += b.vx * dt / b.r;
    let hit = false;
    if (b.y > H - b.r) { b.y = H - b.r; if (Math.abs(b.vy) > 60) hit = true; b.vy = -b.vy * 0.86; b.vx *= 0.99; }
    if (b.y < b.r) { b.y = b.r; b.vy = -b.vy * 0.86; hit = true; }
    if (b.x < b.r) { b.x = b.r; b.vx = -b.vx * 0.9; hit = true; } if (b.x > W - b.r) { b.x = W - b.r; b.vx = -b.vx * 0.9; hit = true; }
    if (hit) { bounces++; ctx.tone(300 + Math.min(600, Math.hypot(b.vx, b.vy) / 3), 0.07, { type: "sine", vol: 0.12, slideTo: 200 }); }
    trail.push({ x: b.x, y: b.y }); if (trail.length > 14) trail.shift();
    g.clearRect(0, 0, W, H);
    trail.forEach((t, i) => circle(g, t.x, t.y, b.r * (i / trail.length) * 0.8, `rgba(255,61,214,${i / trail.length * 0.25})`));
    g.save(); g.translate(b.x, b.y); g.rotate(b.rot); const grad = g.createRadialGradient(-10, -10, 4, 0, 0, b.r); grad.addColorStop(0, "#fff"); grad.addColorStop(0.3, "#ff3dd6"); grad.addColorStop(1, "#7a0060"); circle(g, 0, 0, b.r, grad);
    g.strokeStyle = "rgba(255,255,255,.5)"; g.lineWidth = 3; g.beginPath(); g.arc(0, 0, b.r * 0.7, 0.3, 2.2); g.stroke(); g.restore();
    drawText(g, `bounces: ${bounces}`, W - 14, H - 16, 14, "rgba(255,255,255,.6)", "right", 700);
  }
  raf = requestAnimationFrame(frame); window.addEventListener("resize", size);
  return () => { cancelAnimationFrame(raf); window.removeEventListener("resize", size); };
}

// ---- Glow wand: draw rainbow light trails ----
function playWand(stage, ctx) {
  ctx.setTip("🪄 Drag to draw with light! Tap ✨ to clear.");
  const cv = document.createElement("canvas"); cv.style.cssText = "position:absolute;inset:0;width:100%;height:100%;touch-action:none;cursor:crosshair;background:#06031a;border-radius:20px"; stage.appendChild(cv);
  const g = cv.getContext("2d"); let W = 1, H = 1; const size = () => { const r = stage.getBoundingClientRect(); W = cv.width = Math.max(50, r.width); H = cv.height = Math.max(50, r.height); }; size();
  const clear = document.createElement("button"); clear.className = "pclose"; clear.style.cssText = "top:auto;bottom:10px;right:10px;left:auto"; clear.textContent = "✨"; clear.title = "Clear"; stage.appendChild(clear);
  const strokes = []; let cur = null, hue = 0, raf = 0, snd = null;
  const pos = (e) => { const r = cv.getBoundingClientRect(); return { x: (e.clientX - r.left) * (W / r.width), y: (e.clientY - r.top) * (H / r.height) }; };
  cv.onpointerdown = (e) => { cv.setPointerCapture(e.pointerId); cur = { pts: [pos(e)], born: performance.now() }; strokes.push(cur); snd = ctx.makeSustain("sine"); snd.setVol(0.05); };
  cv.onpointermove = (e) => { if (!cur) return; const p = pos(e); cur.pts.push(p); hue = (hue + 3) % 360; if (snd) snd.setFreq(300 + (1 - p.y / H) * 600); if (cur.pts.length % 6 === 0) ctx.spark(stage, p.x / W, p.y / H, ["✨"], 1); };
  cv.onpointerup = cv.onpointercancel = () => { cur = null; if (snd) { snd.stop(); snd = null; } };
  clear.onclick = () => { strokes.length = 0; ctx.sfx.pop(); };
  function frame(now) { raf = requestAnimationFrame(frame); g.fillStyle = "rgba(6,3,26,.35)"; g.fillRect(0, 0, W, H);
    for (let i = 0; i < 30; i++) circle(g, (i * 97.3) % W, (i * 53.7 + now / 60) % H, 1.2, "rgba(255,255,255,.4)");
    g.lineCap = "round"; g.lineJoin = "round";
    strokes.forEach((s, si) => { if (s.pts.length < 2) return; for (let k = 1; k < s.pts.length; k++) { const h = (si * 40 + k * 4 + now / 20) % 360; g.strokeStyle = `hsla(${h},100%,65%,.95)`; g.shadowColor = `hsl(${h},100%,60%)`; g.shadowBlur = 18; g.lineWidth = 7; g.beginPath(); g.moveTo(s.pts[k - 1].x, s.pts[k - 1].y); g.lineTo(s.pts[k].x, s.pts[k].y); g.stroke(); } });
    g.shadowBlur = 0;
    if (cur) { const p = cur.pts[cur.pts.length - 1]; drawEmoji(g, "🪄", p.x + 22, p.y - 22, 40, -0.7); }
  }
  raf = requestAnimationFrame(frame); window.addEventListener("resize", size);
  return () => { cancelAnimationFrame(raf); window.removeEventListener("resize", size); if (snd) snd.stop(); };
}

// ---- Candy bag: unwrap & eat ----
function playCandy(prize, stage, ctx) {
  const st = ctx.state; st.candy = st.candy ?? 0;
  const refresh = () => { ctx.setTip(st.candy > 0 ? `🍬 ${st.candy} candies left — tap one to unwrap it!` : "All gone! 😋 Redeem another bag for more."); if (st.candy <= 0) { st.prizes[prize.id] = 0; ctx.rerender(); } ctx.save(); };
  const wrap = document.createElement("div"); wrap.style.cssText = "display:flex;flex-wrap:wrap;gap:14px;justify-content:center;align-content:center;padding:14px;width:100%"; stage.appendChild(wrap);
  const CANDIES = ["🍬", "🍭", "🍫", "🍡", "🧁", "🍩", "🍪", "🍰"];
  const build = () => { wrap.innerHTML = ""; for (let i = 0; i < st.candy; i++) { const c = document.createElement("div"); c.textContent = CANDIES[i % CANDIES.length]; c.style.cssText = "font-size:54px;cursor:pointer;transition:transform .15s;filter:drop-shadow(0 6px 10px rgba(0,0,0,.4))"; c.onpointerenter = () => (c.style.transform = "scale(1.15) rotate(-8deg)"); c.onpointerleave = () => (c.style.transform = "");
      c.onpointerdown = () => { if (c.dataset.open) { c.textContent = "😋"; c.style.pointerEvents = "none"; ctx.sfx.ding(); const r = c.getBoundingClientRect(), s = stage.getBoundingClientRect(); ctx.spark(stage, (r.left + r.width / 2 - s.left) / s.width, (r.top - s.top) / s.height, ["💖", "✨", "⭐"], 6); st.candy--; refresh(); setTimeout(() => { c.remove(); }, 500); }
        else { c.dataset.open = "1"; c.style.transform = "scale(1.3)"; ctx.sfx.pop(); ctx.toast("Unwrapped! Tap again to eat it 😋"); } }; wrap.appendChild(c); } };
  build(); refresh();
  return () => {};
}

// ---- Trading card packs ----
function playPack(prize, stage, ctx) {
  const st = ctx.state; const setId = prize.set, set = CARD_SETS[setId];
  st.cards = st.cards || {}; st.cards[setId] = st.cards[setId] || [];
  const packsLeft = () => st.prizes[prize.id] || 0;
  const wrap = document.createElement("div"); wrap.className = "packwrap"; stage.appendChild(wrap);
  const btns = document.createElement("div"); btns.className = "pbtns"; ctx.box.appendChild(btns);
  let view = "pack";
  function render() {
    wrap.innerHTML = ""; btns.innerHTML = "";
    const bBinder = document.createElement("button"); bBinder.className = "act btn-blue"; bBinder.style.fontSize = "14px"; bBinder.textContent = view === "binder" ? "🎴 Back to packs" : `📒 My ${set.name} binder (${st.cards[setId].length})`; bBinder.onclick = () => { view = view === "binder" ? "pack" : "binder"; ctx.sfx.tap(); render(); }; btns.appendChild(bBinder);
    if (view === "binder") {
      ctx.setTip(`📒 Your ${set.name} collection — ${new Set(st.cards[setId]).size}/${set.cards.length} different cards`);
      const b = document.createElement("div"); b.className = "binder";
      if (!st.cards[setId].length) b.innerHTML = `<div class="empty" style="margin:auto">No cards yet — open a pack!</div>`;
      const counts = {}; st.cards[setId].forEach((i) => (counts[i] = (counts[i] || 0) + 1));
      set.cards.forEach((c, i) => { if (!counts[i]) return; const d = document.createElement("div"); d.innerHTML = cardHtml(setId, c, true); d.style.position = "relative"; if (counts[i] > 1) d.innerHTML += `<span class="owned" style="position:absolute;top:-6px;right:-4px;font-size:10px;font-weight:900;background:#00c853;color:#fff;border-radius:999px;padding:2px 6px">×${counts[i]}</span>`; b.appendChild(d); });
      wrap.appendChild(b); return;
    }
    if (packsLeft() <= 0) { ctx.setTip("No unopened packs left — win more tickets and redeem another!"); wrap.innerHTML = `<div class="empty">📦 No packs left to open.<br><br>Check your binder or redeem a new pack at the Prize Counter!</div>`; return; }
    ctx.setTip(`🎴 Tap the pack to rip it open! (${packsLeft()} unopened)`);
    const pk = document.createElement("button"); pk.className = "pack"; pk.style.background = setId === "pokemon" ? "linear-gradient(160deg,#ffd000,#ff6a00 60%,#c62828)" : "linear-gradient(160deg,#a855f7,#4c1d95 60%,#1e1b4b)";
    pk.innerHTML = `<div class="big">${set.back}</div><div>${set.name}</div><div style="font-size:11px;opacity:.9">BOOSTER PACK • 5 CARDS</div>`;
    pk.onclick = () => { if (pk.classList.contains("tearing")) return; pk.classList.add("tearing"); ctx.sfx.tear();
      setTimeout(() => { st.prizes[prize.id]--; const pulled = openPack(setId); pulled.forEach((c) => st.cards[setId].push(set.cards.indexOf(c))); ctx.save(); ctx.rerender(); bBinder.textContent = `📒 My ${set.name} binder (${st.cards[setId].length})`;
        wrap.innerHTML = ""; const row = document.createElement("div"); row.className = "cards"; let flipped = 0;
        pulled.forEach((c, i) => { const d = document.createElement("div"); d.innerHTML = cardHtml(setId, c, false); const el = d.firstElementChild; el.style.animationDelay = `${i * 0.1}s`;
          el.onclick = () => { if (el.classList.contains("flipped")) return; el.classList.add("flipped"); flipped++; (c.r === "s" || c.r === "h") ? ctx.sfx.win() : ctx.sfx.flip(); if (c.r === "s" || c.r === "h") { ctx.toast(`${c.r === "s" ? "🌈 SECRET RARE" : "✨ HOLO RARE"}! ${c.n}!`); const r = el.getBoundingClientRect(), s = stage.getBoundingClientRect(); ctx.spark(stage, (r.left + r.width / 2 - s.left) / s.width, (r.top + r.height / 2 - s.top) / s.height, ["✨", "🌟", "⭐"], 10); }
            if (flipped === 5) { ctx.setTip("All 5 revealed! They're in your binder now 📒"); const again = document.createElement("button"); again.className = "act btn-pink"; again.style.fontSize = "14px"; again.textContent = packsLeft() > 0 ? `🎴 Open another (${packsLeft()} left)` : "📒 See binder"; again.onclick = () => { view = packsLeft() > 0 ? "pack" : "binder"; render(); }; btns.appendChild(again); } };
          row.appendChild(el); });
        wrap.appendChild(row); ctx.setTip("👆 Tap each card to flip it over!");
        const flipAll = document.createElement("button"); flipAll.className = "act btn-purple"; flipAll.style.fontSize = "14px"; flipAll.textContent = "Flip all"; flipAll.onclick = () => { row.querySelectorAll(".tcard:not(.flipped)").forEach((el) => el.click()); flipAll.remove(); }; btns.appendChild(flipAll);
      }, 550); };
    wrap.appendChild(pk);
  }
  render();
  return () => { btns.remove(); };
}

// ---- iPad: a tablet with exactly one app ----
function playIpad(stage, ctx) {
  ctx.box.classList.add("wide"); ctx.setTip("📱 Tap the app to open it. The bar at the bottom is the Home button.");
  const pad = document.createElement("div"); pad.className = "ipad"; pad.innerHTML = `<div class="cam"></div><div class="scr"></div><div class="home" title="Home"></div>`; stage.appendChild(pad);
  const scr = pad.querySelector(".scr");
  const home = () => {
    scr.innerHTML = `<div class="homescreen"><div class="clock">${new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}</div><div style="font-size:13px;opacity:.9">Emmy's iPad</div>
      <div class="apps">
        <button class="app" id="appFidget"><div class="ico" style="background:linear-gradient(160deg,#3ea16a,#24734a)">🦊</div><div class="lbl">Fidget Trading</div></button>
        <button class="app locked" disabled><div class="ico" style="background:#666">🔒</div><div class="lbl">Nothing else!</div></button>
      </div></div>`;
    scr.querySelector("#appFidget").onclick = () => { ctx.sfx.tap(); scr.innerHTML = `<iframe src="game.html" title="Emmy's Fidget Trading" allow="autoplay"></iframe>`; ctx.setTip("🦊 Playing Emmy's Fidget Trading on your iPad! Tap the Home bar to go back."); };
  };
  pad.querySelector(".home").onclick = () => { ctx.sfx.tap(); home(); ctx.setTip("📱 Tap the app to open it."); };
  home();
  return () => { ctx.box.classList.remove("wide"); };
}
