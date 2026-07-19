import { TIERS, makeOffer, evaluate, pick, reseed, TOYS, sum, TONE_COLORS } from "./toys.js";

reseed();

const state = { coins: 100, offer: makeOffer(), collection: {} };
const $ = (id) => document.getElementById(id);

function toyEl(toy) {
  const tier = TIERS[toy.tier];
  return `
    <div class="toy" style="--c:${tier.color};--g:${tier.glow}">
      <div class="face">${toy.emoji}</div>
      <div class="name">${toy.name}</div>
      <div class="val">🪙 ${toy.value}</div>
    </div>`;
}

function render() {
  $("coins").textContent = state.coins;
  $("theirs").innerHTML = state.offer.theirs.map(toyEl).join("");
  $("yours").innerHTML = state.offer.yours.map(toyEl).join("");

  const e = evaluate(state.offer.theirs, state.offer.yours);
  $("getTotal").textContent = `🪙 ${e.get}`;
  $("giveTotal").textContent = `🪙 ${e.give}`;

  // Needle position: map ratio 0.5..2.0 -> 0..100%
  const pctRaw = ((e.ratio - 0.5) / (2.0 - 0.5)) * 100;
  const pct = Math.max(3, Math.min(97, pctRaw));
  $("needle").style.left = pct + "%";

  $("verdict").innerHTML = `<span class="em">${e.emoji}</span> <span style="color:${TONE_COLORS[e.tone]}">${e.label}</span>`;
  $("values").innerHTML = `You get <b class="get">🪙${e.get}</b> &nbsp;·&nbsp; You give <b class="give">🪙${e.give}</b> &nbsp;·&nbsp; ${"⭐".repeat(e.rating)}`;
}

function renderShelf() {
  const ids = Object.keys(state.collection);
  if (!ids.length) return;
  $("shelf").innerHTML = ids.map((id) => {
    const t = TOYS.find((x) => x.id === id);
    return `<div class="chip">${t.emoji}<span class="n">${state.collection[id]}</span></div>`;
  }).join("");
}

function newOffer() { state.offer = makeOffer(); render(); }

function accept() {
  const e = evaluate(state.offer.theirs, state.offer.yours);
  state.coins += Math.max(1, e.net + 10);
  state.offer.theirs.forEach((t) => { state.collection[t.id] = (state.collection[t.id] || 0) + 1; });
  renderShelf();
  if (e.rating >= 4) celebrate();
  newOffer();
}
function decline() { newOffer(); }
function addToy() { state.offer.theirs.push(pick(TOYS)); render(); }

$("accept").onclick = accept;
$("decline").onclick = decline;
$("add").onclick = addToy;

// confetti
const canvas = $("confetti"), ctx = canvas.getContext("2d");
let bits = [];
const resize = () => { canvas.width = innerWidth; canvas.height = innerHeight; };
resize(); addEventListener("resize", resize);
function celebrate() {
  const cs = ["#ffdf6b", "#5dffb0", "#b558f6", "#3d8bfd", "#ff8a8a"];
  for (let i = 0; i < 120; i++) bits.push({ x: innerWidth / 2, y: innerHeight / 2, vx: (Math.random() - .5) * 14, vy: Math.random() * -12 - 4, c: cs[i % cs.length], r: Math.random() * 6 + 4, a: 1 });
}
function loop() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  bits.forEach((b) => { b.x += b.vx; b.y += b.vy; b.vy += .4; b.a -= .012; ctx.globalAlpha = Math.max(0, b.a); ctx.fillStyle = b.c; ctx.fillRect(b.x, b.y, b.r, b.r); });
  bits = bits.filter((b) => b.a > 0); ctx.globalAlpha = 1; requestAnimationFrame(loop);
}
loop();

render();
renderShelf();
