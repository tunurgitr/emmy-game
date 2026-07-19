import { TIERS, makeOffer, evaluate, pick, reseed, TOYS, TONE_COLORS } from "./toys.js";

reseed();

let state = { coins: 100, streak: 0, offer: makeOffer() };

const $ = (id) => document.getElementById(id);

function toyCard(toy) {
  const tier = TIERS[toy.tier];
  return `
    <div class="toy" style="--g:${tier.glow}">
      <span class="tier" style="background:${tier.color}">${tier.label}</span>
      <div class="face">${toy.emoji}</div>
      <div class="name">${toy.name}</div>
      <div class="val">🪙 ${toy.value}</div>
    </div>`;
}

function render() {
  $("coins").textContent = state.coins;
  $("streak").textContent = state.streak;
  $("theirs").innerHTML = state.offer.theirs.map(toyCard).join("");
  $("yours").innerHTML = state.offer.yours.map(toyCard).join("");

  const e = evaluate(state.offer.theirs, state.offer.yours);
  const stars = "⭐".repeat(e.rating) + "☆".repeat(5 - e.rating);
  $("verdict").innerHTML = `
    <div class="emoji">${e.emoji}</div>
    <div class="label" style="color:${TONE_COLORS[e.tone]}">${e.label}</div>
    <div class="stars">${stars}</div>
    <div class="values">You get <b class="get">🪙${e.get}</b> · You give <b class="give">🪙${e.give}</b></div>`;
}

function newOffer() {
  state.offer = makeOffer();
  render();
}

function accept() {
  const e = evaluate(state.offer.theirs, state.offer.yours);
  state.coins += Math.max(1, e.net + 10); // reward; good trades pay more
  if (e.rating >= 4) { state.streak++; celebrate(); }
  else state.streak = 0;
  document.body.classList.add("flash");
  setTimeout(() => document.body.classList.remove("flash"), 500);
  newOffer();
}

function decline() {
  state.streak = 0;
  newOffer();
}

function askMore() {
  // Add a toy to THEIR side (you get more) — makes the deal better.
  state.offer.theirs.push(pick(TOYS));
  render();
}

$("accept").onclick = accept;
$("decline").onclick = decline;
$("add").onclick = askMore;

// ---- confetti celebration ----
const canvas = $("confetti");
const ctx = canvas.getContext("2d");
let bits = [];
function resize() { canvas.width = innerWidth; canvas.height = innerHeight; }
resize(); addEventListener("resize", resize);
function celebrate() {
  const colors = ["#ff4d94", "#3d8bfd", "#00c853", "#ffb020", "#b558f6"];
  for (let i = 0; i < 120; i++) {
    bits.push({
      x: innerWidth / 2, y: innerHeight / 3,
      vx: (Math.random() - 0.5) * 14, vy: Math.random() * -12 - 4,
      c: colors[i % colors.length], r: Math.random() * 6 + 4, a: 1,
    });
  }
}
function loop() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  bits.forEach((b) => {
    b.x += b.vx; b.y += b.vy; b.vy += 0.4; b.a -= 0.012;
    ctx.globalAlpha = Math.max(0, b.a);
    ctx.fillStyle = b.c;
    ctx.fillRect(b.x, b.y, b.r, b.r);
  });
  bits = bits.filter((b) => b.a > 0);
  ctx.globalAlpha = 1;
  requestAnimationFrame(loop);
}
loop();

render();
