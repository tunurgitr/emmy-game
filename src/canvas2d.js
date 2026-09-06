// ==========================================================================
//  Emmy's Arcade — mini-games, part 1.
//
//  Every game is a plain object: { id, name, emoji, cost, c1, c2, tip, payout,
//  create(api) } where create() returns a controller:
//    { update(dt), draw(g), onDown(p), onMove(p), onUp(p), onKey(key), dispose() }
//  The harness (arcade.js) owns the canvas (logical 800×600), the loop and the
//  input plumbing, and gives each game an `api`:
//    api.W / api.H           logical size
//    api.setScore(text)      HUD text (top right)
//    api.setTip(text)        hint under the stage
//    api.finish(tickets, title, detail)   end the game and pay out
//    api.sfx.*               short sound effects
//    api.keys                Set of currently-held keys ("ArrowLeft", " ", ...)
// ==========================================================================

export const rnd = (a, b) => a + Math.random() * (b - a);
export const ri = (a, b) => Math.floor(rnd(a, b + 1));
export const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
export const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
export const dist = (a, b, c, d) => Math.hypot(a - c, b - d);

export function emoji(g, e, x, y, size, rot = 0) {
  g.save(); g.translate(x, y); if (rot) g.rotate(rot);
  g.font = `${size}px "Segoe UI Emoji", "Apple Color Emoji", "Noto Color Emoji", sans-serif`;
  g.textAlign = "center"; g.textBaseline = "middle"; g.fillText(e, 0, size * 0.06); g.restore();
}
export function text(g, s, x, y, size = 20, color = "#fff", align = "center", weight = 900) {
  g.save(); g.font = `${weight} ${size}px system-ui, sans-serif`; g.fillStyle = color; g.textAlign = align; g.textBaseline = "middle"; g.fillText(s, x, y); g.restore();
}
export function rrect(g, x, y, w, h, r, fill, stroke, lw = 2) {
  g.beginPath(); g.roundRect(x, y, w, h, r);
  if (fill) { g.fillStyle = fill; g.fill(); }
  if (stroke) { g.strokeStyle = stroke; g.lineWidth = lw; g.stroke(); }
}
export function circle(g, x, y, r, fill, stroke, lw = 2) {
  g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2);
  if (fill) { g.fillStyle = fill; g.fill(); }
  if (stroke) { g.strokeStyle = stroke; g.lineWidth = lw; g.stroke(); }
}
// tiny particle system shared by all games
export function makeParts() {
  const ps = [];
  return {
    burst(x, y, color, n = 12, speed = 220, life = 0.6, size = 5) {
      for (let i = 0; i < n; i++) { const a = Math.random() * Math.PI * 2, s = speed * rnd(0.3, 1); ps.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, t: life * rnd(0.6, 1), color, size }); }
    },
    update(dt) { for (let i = ps.length - 1; i >= 0; i--) { const p = ps[i]; p.t -= dt; if (p.t <= 0) { ps.splice(i, 1); continue; } p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 300 * dt; } },
    draw(g) { for (const p of ps) { g.globalAlpha = clamp(p.t * 2, 0, 1); circle(g, p.x, p.y, p.size, p.color); } g.globalAlpha = 1; },
  };
}
export function hud(g, W, left, right) {
  rrect(g, 0, 0, W, 38, 0, "rgba(0,0,0,.45)");
  text(g, left, 14, 19, 17, "#fff", "left"); text(g, right, W - 14, 19, 17, "#ffd54a", "right");
}
const fmtT = (t) => `⏱ ${Math.max(0, Math.ceil(t))}s`;

// ==========================================================================
//  🎡 TICKET WHEEL — flick the wheel; tickets where it stops.
// ==========================================================================
const WHEEL_SEGS = [
  { v: 5, c: "#ff3dd6" }, { v: 20, c: "#3d8bfd" }, { v: 2, c: "#ffd54a" }, { v: 50, c: "#00c853" },
  { v: 10, c: "#ff9800" }, { v: 5, c: "#7a3cff" }, { v: 200, c: "#ffffff", jackpot: true }, { v: 10, c: "#00e5ff" },
  { v: 25, c: "#f4433f" }, { v: 5, c: "#3d8bfd" }, { v: 100, c: "#ffd54a" }, { v: 15, c: "#ff3dd6" },
];
export const wheel = {
  id: "wheel", name: "Ticket Wheel", emoji: "🎡", cost: 2, c1: "#ff3dd6", c2: "#7a0060", payout: "2–200 🎟️",
  tip: "👆 Drag the wheel and let go to spin it! (or tap SPIN)",
  create(api) {
    const { W, H } = api; const cx = W / 2, cy = H / 2 + 10, R = 200;
    let ang = 0, vel = 0, spinning = false, done = false, dragging = false, lastA = 0, lastT = 0, result = null, endT = 0;
    const parts = makeParts();
    const n = WHEEL_SEGS.length, seg = (Math.PI * 2) / n;
    const angleOf = (p) => Math.atan2(p.y - cy, p.x - cx);
    const startSpin = (v) => { vel = v; spinning = true; api.sfx.spin(); api.setTip("🎡 Round and round it goes…"); };
    return {
      onDown(p) {
        if (done || spinning) return;
        if (p.y > H - 78 || p.y < 60) startSpin(rnd(9, 15));
        else if (dist(p.x, p.y, cx, cy) <= R + 20) { dragging = true; lastA = angleOf(p); lastT = performance.now(); vel = 0; }
      },
      onMove(p) {
        if (!dragging) return;
        const a = angleOf(p); let d = a - lastA; if (d > Math.PI) d -= Math.PI * 2; if (d < -Math.PI) d += Math.PI * 2;
        ang += d; const now = performance.now(); const dt = Math.max(0.008, (now - lastT) / 1000);
        vel = vel * 0.5 + (d / dt) * 0.5; lastA = a; lastT = now;
      },
      onUp() { if (!dragging) return; dragging = false; if (Math.abs(vel) > 2) startSpin(clamp(vel, -18, 18)); else vel = 0; },
      update(dt) {
        parts.update(dt);
        if (spinning) {
          ang += vel * dt; vel *= Math.pow(0.35, dt);
          if (Math.abs(vel) > 0.2) { const idx = Math.floor(((ang % seg) + seg) % seg / seg * 2); if (idx !== this._tick) { this._tick = idx; api.sfx.tick(); } }
          else { spinning = false; vel = 0; done = true;
            // pointer is at the top (−90°). Which segment is under it?
            const under = ((-Math.PI / 2 - ang) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2);
            result = WHEEL_SEGS[Math.floor(under / seg)];
            parts.burst(cx, cy - R, result.c, 40, 300, 1);
            api.setTip(result.jackpot ? "🎉 JACKPOT!!! 🎉" : `You won ${result.v} tickets!`);
            (result.v >= 50 ? api.sfx.win : api.sfx.ding)(); endT = 1.4;
          }
        }
        if (done && endT > 0) { endT -= dt; if (endT <= 0) api.finish(result.v, result.jackpot ? "🎉 JACKPOT! 🎉" : "The wheel says…", `${result.v} tickets!`); }
        return true;
      },
      draw(g) {
        // backdrop
        const bg = g.createRadialGradient(cx, cy, 50, cx, cy, 500); bg.addColorStop(0, "#3b1f7a"); bg.addColorStop(1, "#120826"); g.fillStyle = bg; g.fillRect(0, 0, W, H);
        text(g, "🎡 TICKET WHEEL", W / 2, 30, 26, "#fff");
        // wheel
        g.save(); g.translate(cx, cy); g.rotate(ang);
        for (let i = 0; i < n; i++) {
          const s = WHEEL_SEGS[i]; g.beginPath(); g.moveTo(0, 0); g.arc(0, 0, R, i * seg, (i + 1) * seg); g.closePath();
          g.fillStyle = s.c; g.fill(); g.strokeStyle = "rgba(255,255,255,.7)"; g.lineWidth = 3; g.stroke();
          g.save(); g.rotate(i * seg + seg / 2); g.translate(R * 0.68, 0); g.rotate(Math.PI / 2);
          text(g, s.jackpot ? "★" : String(s.v), 0, 0, s.jackpot ? 40 : 30, s.c === "#ffd54a" || s.c === "#ffffff" ? "#4a2b00" : "#fff"); g.restore();
        }
        circle(g, 0, 0, R, null, "#ffd54a", 10);
        for (let i = 0; i < n; i++) { const a = i * seg; circle(g, Math.cos(a) * R, Math.sin(a) * R, 7, (Math.floor(performance.now() / 250) + i) % 2 ? "#fff" : "#ffd54a"); }
        circle(g, 0, 0, 34, "#fff", "#ffd54a", 6); g.restore();
        emoji(g, "⭐", cx, cy, 34);
        // pointer
        g.fillStyle = "#f4433f"; g.beginPath(); g.moveTo(cx - 22, cy - R - 34); g.lineTo(cx + 22, cy - R - 34); g.lineTo(cx, cy - R + 14); g.closePath(); g.fill(); g.strokeStyle = "#fff"; g.lineWidth = 3; g.stroke();
        // spin button
        if (!spinning && !done) { rrect(g, cx - 70, H - 62, 140, 48, 24, "#00c853", "#fff", 3); text(g, "SPIN!", cx, H - 38, 24); }
        parts.draw(g);
        if (result) { text(g, result.jackpot ? "🎉 JACKPOT! 200 🎟️" : `+${result.v} 🎟️`, W / 2, H - 40, 34, "#ffd54a"); }
      },
    };
  },
};

// ==========================================================================
//  🕹️ CLAW MACHINE — hold to move the claw, release to drop & grab.
// ==========================================================================
const CLAW_PRIZES = [
  { e: "🧸", v: 15, grip: 0.8 }, { e: "🐙", v: 12, grip: 0.85 }, { e: "🦄", v: 25, grip: 0.7 }, { e: "🐸", v: 10, grip: 0.9 },
  { e: "🐼", v: 18, grip: 0.75 }, { e: "🦖", v: 20, grip: 0.7 }, { e: "⭐", v: 40, grip: 0.55 }, { e: "🎁", v: 60, grip: 0.45 }, { e: "🐳", v: 14, grip: 0.8 },
];
export const claw = {
  id: "claw", name: "Claw Machine", emoji: "🦾", cost: 3, c1: "#00e5ff", c2: "#0a4a6e", payout: "up to 100 🎟️",
  tip: "👇 Hold to move the claw, let go to drop it! 3 tries.",
  create(api) {
    const { W, H } = api;
    const floorY = H - 70, chuteX = 70;
    let x = W / 2, dir = 1, holding = false, phase = "idle", y = 90, tries = 3, won = 0, grabbed = null, openness = 1, t = 0;
    const parts = makeParts();
    const prizes = [];
    for (let i = 0; i < 9; i++) { const p = pick(CLAW_PRIZES); prizes.push({ ...p, x: 150 + i * 62 + rnd(-10, 10), y: floorY - 26 - rnd(0, 8), wob: rnd(0, 6) }); }
    const score = () => api.setScore(`🎟️ ${won}   •   ${"🕹️".repeat(tries)}`);
    score();
    return {
      onDown() { if (phase === "idle") { holding = true; phase = "move"; api.sfx.motor(); } },
      onUp() { if (phase === "move") { holding = false; phase = "drop"; api.sfx.tap(); } },
      onKey(k) { if (k === " " || k === "Enter") { if (phase === "idle") { holding = true; phase = "move"; } else if (phase === "move") { holding = false; phase = "drop"; } } },
      update(dt) {
        t += dt; parts.update(dt);
        if (phase === "move") { x += dir * 170 * dt; if (x > W - 70) { x = W - 70; dir = -1; } if (x < 130) { x = 130; dir = 1; } }
        else if (phase === "drop") { y += 260 * dt; openness = 1; if (y >= floorY - 60) { phase = "grab"; t = 0; } }
        else if (phase === "grab") {
          openness = Math.max(0, openness - dt * 3.5);
          if (openness === 0 && t > 0.45) {
            let best = null, bd = 60;
            for (const p of prizes) { const d = Math.abs(p.x - x); if (d < bd) { bd = d; best = p; } }
            if (best && Math.random() < best.grip * (1 - bd / 90)) { grabbed = best; api.sfx.ding(); api.setTip("Got one! Hold on tight…"); }
            else { api.setTip("Missed! Try again…"); api.sfx.miss(); }
            phase = "lift"; t = 0;
          }
        }
        else if (phase === "lift") {
          y -= 200 * dt;
          if (grabbed) { grabbed.x = x; grabbed.y = y + 42; if (Math.random() < 0.002) { grabbed = null; api.setTip("Oh no, it slipped! 😱"); api.sfx.miss(); } }
          if (y <= 90) { y = 90; phase = "carry"; }
        }
        else if (phase === "carry") {
          x -= 220 * dt; if (grabbed) { grabbed.x = x; grabbed.y = y + 42; }
          if (x <= chuteX) { x = chuteX; phase = "release"; t = 0; openness = 0; }
        }
        else if (phase === "release") {
          openness = Math.min(1, openness + dt * 3);
          if (grabbed) { grabbed.y += 400 * dt; if (grabbed.y > H + 30) { won += grabbed.v; api.sfx.win(); parts.burst(chuteX, floorY, "#ffd54a", 30); api.setTip(`+${grabbed.v} tickets! 🎟️`); prizes.splice(prizes.indexOf(grabbed), 1); grabbed = null; score(); } }
          else if (openness >= 1) { tries--; score(); if (tries <= 0) { api.finish(won, won ? "Nice grabbing!" : "The claw was slippery…", `${won} tickets`); } else phase = "return"; }
        }
        else if (phase === "return") { x += 220 * dt; if (x >= W / 2) { x = W / 2; phase = "idle"; api.setTip("👇 Hold to move the claw, let go to drop it!"); } }
        return true;
      },
      draw(g) {
        g.fillStyle = "#10203a"; g.fillRect(0, 0, W, H);
        // cabinet glass box
        rrect(g, 30, 50, W - 60, H - 90, 18, "rgba(90,200,255,.08)", "#00e5ff", 6);
        // floor of prizes
        g.fillStyle = "#e91e63"; g.fillRect(36, floorY, W - 72, H - 40 - floorY);
        for (let i = 0; i < 40; i++) circle(g, 40 + i * 19, floorY + 12 + (i % 2) * 8, 5, ["#ff9ec7", "#ffd54a", "#00e5ff"][i % 3]);
        // chute
        rrect(g, 40, floorY - 20, 60, 60, 8, "#111", "#ffd54a", 3); text(g, "PRIZE ↓", 70, floorY - 34, 12, "#ffd54a");
        // prizes
        for (const p of prizes) if (p !== grabbed) emoji(g, p.e, p.x, p.y + Math.sin(t * 2 + p.wob) * 1.5, 46);
        // rail + cable
        g.fillStyle = "#89a"; g.fillRect(36, 56, W - 72, 10);
        g.strokeStyle = "#ccc"; g.lineWidth = 3; g.beginPath(); g.moveTo(x, 62); g.lineTo(x, y); g.stroke();
        // claw
        g.save(); g.translate(x, y); g.fillStyle = "#c0c8d0"; g.strokeStyle = "#556"; g.lineWidth = 3;
        circle(g, 0, 0, 16, "#dfe6ee", "#556", 3);
        for (const s of [-1, 1]) {
          g.save(); g.rotate(s * (0.15 + openness * 0.55)); g.beginPath(); g.moveTo(0, 8); g.quadraticCurveTo(s * 34, 30, s * 22, 62); g.lineTo(s * 12, 60); g.quadraticCurveTo(s * 22, 30, 0, 18); g.closePath(); g.fill(); g.stroke(); g.restore();
        }
        g.restore();
        if (grabbed) emoji(g, grabbed.e, grabbed.x, grabbed.y, 46);
        parts.draw(g);
        if (phase === "idle") text(g, "HOLD to move → let go to DROP", W / 2, H - 20, 16, "#00e5ff");
        hud(g, W, `🦾 Tries: ${tries}`, `🎟️ ${won}`);
      },
    };
  },
};

// ==========================================================================
//  🏎️ RACING — steer with your finger / arrow keys, dodge traffic, grab coins.
// ==========================================================================
export const race = {
  id: "race", name: "Turbo Racer", emoji: "🏎️", cost: 3, c1: "#f4433f", c2: "#6a0000", payout: "up to 80 🎟️",
  tip: "👈👉 Drag left/right (or arrow keys) to steer. Dodge cars, grab coins! 30 seconds.",
  create(api) {
    const { W, H } = api; const roadL = 160, roadR = W - 160, lanes = [0.2, 0.5, 0.8];
    const laneX = (i) => roadL + (roadR - roadL) * lanes[i];
    let px = W / 2, targetX = W / 2, speed = 380, distTr = 0, coins = 0, time = 30, lives = 3, hurt = 0, scroll = 0, spawnT = 0, over = false;
    const cars = [], coinsArr = [], parts = makeParts();
    const OTHER = ["🚗", "🚙", "🚕", "🚌", "🛻"];
    const spawn = () => {
      const lane = ri(0, 2), x = laneX(lane);
      if (Math.random() < 0.65) { if (!cars.some((c) => c.lane === lane && c.y < 120)) cars.push({ lane, x, y: -80, e: pick(OTHER), sp: rnd(120, 220) }); }
      else coinsArr.push({ x, y: -40 });
    };
    return {
      onDown(p) { targetX = p.x; }, onMove(p) { targetX = p.x; },
      update(dt) {
        if (over) return true;
        parts.update(dt);
        if (api.keys.has("ArrowLeft")) targetX = px - 200 * dt * 8; if (api.keys.has("ArrowRight")) targetX = px + 200 * dt * 8;
        targetX = clamp(targetX, roadL + 30, roadR - 30);
        px += (targetX - px) * Math.min(1, dt * 9);
        time -= dt; speed = Math.min(700, speed + 8 * dt); if (hurt > 0) hurt -= dt;
        const s = hurt > 0 ? speed * 0.45 : speed;
        distTr += s * dt; scroll = (scroll + s * dt) % 80;
        spawnT -= dt; if (spawnT <= 0) { spawn(); spawnT = rnd(0.45, 0.9) * (400 / s); }
        for (let i = cars.length - 1; i >= 0; i--) { const c = cars[i]; c.y += (s - c.sp) * dt; if (c.y > H + 80) cars.splice(i, 1);
          else if (hurt <= 0 && Math.abs(c.x - px) < 42 && Math.abs(c.y - (H - 110)) < 60) { hurt = 1.4; lives--; api.sfx.crash(); parts.burst(px, H - 110, "#ff9800", 25); if (lives <= 0) { over = true; this.end(); } } }
        for (let i = coinsArr.length - 1; i >= 0; i--) { const c = coinsArr[i]; c.y += s * dt; if (c.y > H + 40) coinsArr.splice(i, 1);
          else if (Math.abs(c.x - px) < 40 && Math.abs(c.y - (H - 110)) < 50) { coinsArr.splice(i, 1); coins++; api.sfx.coin(); parts.burst(c.x, c.y, "#ffd54a", 10, 150, 0.4, 3); } }
        api.setScore(`🪙 ${coins}   📏 ${Math.floor(distTr / 100)}m   ${"❤️".repeat(Math.max(0, lives))}`);
        if (time <= 0) { over = true; this.end(); }
        return true;
      },
      end() { const tix = clamp(Math.floor(distTr / 300) + coins * 2, 1, 80); api.finish(tix, lives > 0 ? "🏁 Finish line!" : "💥 Crashed out!", `${Math.floor(distTr / 100)}m and ${coins} coins → ${tix} tickets`); },
      draw(g) {
        g.fillStyle = "#2e7d32"; g.fillRect(0, 0, W, H);
        for (let i = -1; i < 9; i++) { emoji(g, "🌳", 60, i * 80 + scroll, 40); emoji(g, "🌲", W - 60, i * 80 + scroll + 40, 40); }
        g.fillStyle = "#37474f"; g.fillRect(roadL, 0, roadR - roadL, H);
        g.fillStyle = "#ffeb3b"; g.fillRect(roadL, 0, 6, H); g.fillRect(roadR - 6, 0, 6, H);
        g.fillStyle = "#fff"; for (let k = 1; k < 3; k++) { const x = roadL + (roadR - roadL) * (k / 3); for (let i = -1; i < 9; i++) g.fillRect(x - 3, i * 80 + scroll, 6, 40); }
        for (const c of coinsArr) emoji(g, "🪙", c.x, c.y, 30);
        for (const c of cars) emoji(g, c.e, c.x, c.y, 52, Math.PI / 2);
        if (hurt <= 0 || Math.floor(hurt * 10) % 2) emoji(g, "🏎️", px, H - 110, 56, Math.PI / 2);
        parts.draw(g);
        hud(g, W, fmtT(time), `${Math.floor(speed / 4)} km/h`);
      },
    };
  },
};

// ==========================================================================
//  🔫 LASER TAG — zap the robots, don't zap your friends!
// ==========================================================================
export const laser = {
  id: "laser", name: "Laser Tag", emoji: "🔫", cost: 3, c1: "#7a3cff", c2: "#22105a", payout: "up to 75 🎟️",
  tip: "👆 Tap the robots 🤖 to zap them! Don't zap the kids 🧒. 30 seconds.",
  create(api) {
    const { W, H } = api; let time = 30, hits = 0, oops = 0, spawnT = 0, over = false, combo = 0;
    const bots = [], beams = [], parts = makeParts();
    const spots = [[120, 200], [300, 160], [500, 170], [680, 210], [200, 330], [420, 300], [620, 340], [110, 450], [340, 470], [560, 460], [720, 440]];
    return {
      onDown(p) {
        if (over) return;
        beams.push({ x: p.x, y: p.y, t: 0.15 }); api.sfx.laser();
        let hit = null; for (const b of bots) if (b.alive && dist(p.x, p.y, b.x, b.y - b.up * 20) < 38 + b.up * 10) hit = b;
        if (hit) { hit.alive = false; hit.t = 0.4;
          if (hit.friend) { oops++; combo = 0; api.sfx.miss(); api.setTip("Oops! That was a friend! 😅 −3"); parts.burst(hit.x, hit.y, "#f44336", 10); }
          else { combo++; hits++; api.sfx.ding(); parts.burst(hit.x, hit.y, "#00e5ff", 18); api.setTip(combo >= 3 ? `🔥 ${combo}x combo!` : "Zap! 🤖"); }
        } else combo = 0;
        api.setScore(`🤖 ${hits}   😅 ${oops}`);
      },
      update(dt) {
        if (over) return true; time -= dt; parts.update(dt);
        spawnT -= dt; if (spawnT <= 0) { spawnT = rnd(0.35, 0.8) - Math.min(0.25, (30 - time) * 0.008); const s = pick(spots); if (!bots.some((b) => b.sx === s[0] && b.sy === s[1])) bots.push({ sx: s[0], sy: s[1], x: s[0], y: s[1], up: 0, alive: true, life: rnd(0.9, 1.6), friend: Math.random() < 0.22, t: 0 }); }
        for (let i = bots.length - 1; i >= 0; i--) { const b = bots[i];
          if (b.alive) { b.up = Math.min(1, b.up + dt * 5); b.life -= dt; if (b.life <= 0) { b.alive = false; b.t = 0.25; } }
          else { b.t -= dt; b.up = Math.max(0, b.up - dt * 4); if (b.t <= 0) bots.splice(i, 1); } }
        for (let i = beams.length - 1; i >= 0; i--) { beams[i].t -= dt; if (beams[i].t <= 0) beams.splice(i, 1); }
        if (time <= 0) { over = true; const tix = clamp(hits * 3 - oops * 3, 0, 75); api.finish(tix, hits >= 15 ? "🏆 Laser champion!" : "Game over!", `${hits} robots zapped, ${oops} oopsies → ${tix} tickets`); }
        return true;
      },
      draw(g) {
        const bg = g.createLinearGradient(0, 0, 0, H); bg.addColorStop(0, "#0a0620"); bg.addColorStop(1, "#1e0b4a"); g.fillStyle = bg; g.fillRect(0, 0, W, H);
        // neon grid floor
        g.strokeStyle = "rgba(0,229,255,.35)"; g.lineWidth = 2;
        for (let i = 0; i <= 10; i++) { g.beginPath(); g.moveTo(W / 2 + (i - 5) * 40, 150); g.lineTo(W / 2 + (i - 5) * 300, H); g.stroke(); }
        for (let i = 0; i < 8; i++) { const y = 150 + Math.pow(i / 7, 1.8) * (H - 150); g.beginPath(); g.moveTo(0, y); g.lineTo(W, y); g.stroke(); }
        // barriers
        for (const s of spots) rrect(g, s[0] - 46, s[1] - 2, 92, 26, 6, "#3a2a7a", "#ff3dd6", 2);
        for (const b of bots) { if (b.up <= 0) continue; g.save(); g.beginPath(); g.rect(b.x - 60, b.y - 90, 120, 90); g.clip(); emoji(g, b.friend ? "🧒" : "🤖", b.x, b.y + 30 - b.up * 60, 58 + b.up * 6); g.restore(); if (!b.alive && !b.friend && b.t > 0.2) emoji(g, "💥", b.x, b.y - 30, 60); }
        for (const s of spots) rrect(g, s[0] - 46, s[1] - 2, 92, 26, 6, "#3a2a7a", "#ff3dd6", 2);
        for (const bm of beams) { g.strokeStyle = `rgba(0,229,255,${bm.t * 6})`; g.lineWidth = 5; g.beginPath(); g.moveTo(W / 2, H + 10); g.lineTo(bm.x, bm.y); g.stroke(); circle(g, bm.x, bm.y, 14 * (bm.t * 6), "rgba(255,255,255,.8)"); }
        emoji(g, "🔫", W / 2 + 60, H - 30, 90, -0.9);
        parts.draw(g);
        hud(g, W, fmtT(time), `🤖 ${hits}  😅 ${oops}`);
      },
    };
  },
};

// ==========================================================================
//  🏒 AIR HOCKEY — first to 5 vs the robot.
// ==========================================================================
export const hockey = {
  id: "hockey", name: "Air Hockey", emoji: "🏒", cost: 3, c1: "#3d8bfd", c2: "#0a2a6e", payout: "up to 60 🎟️",
  tip: "🖐️ Drag your red paddle (bottom). First to 5 wins!",
  create(api) {
    const { W, H } = api; const goalW = 200, R = 22, PR = 32;
    let you = 0, bot = 0, over = false, pause = 0.8, msg = "Ready?";
    const puck = { x: W / 2, y: H / 2, vx: 0, vy: 0 };
    const me = { x: W / 2, y: H - 90, px: W / 2, py: H - 90, tx: W / 2, ty: H - 90 };
    const ai = { x: W / 2, y: 90 };
    const parts = makeParts();
    const reset = (toMe) => { puck.x = W / 2; puck.y = toMe ? H / 2 + 80 : H / 2 - 80; puck.vx = 0; puck.vy = 0; pause = 0.8; };
    const collide = (p) => { const d = dist(puck.x, puck.y, p.x, p.y); if (d < R + PR && d > 0) { const nx = (puck.x - p.x) / d, ny = (puck.y - p.y) / d; puck.x = p.x + nx * (R + PR + 1); puck.y = p.y + ny * (R + PR + 1);
      const pvx = (p.vx || 0), pvy = (p.vy || 0); const rel = (puck.vx - pvx) * nx + (puck.vy - pvy) * ny; if (rel < 0) { puck.vx -= 2 * rel * nx; puck.vy -= 2 * rel * ny; } puck.vx += pvx * 0.6; puck.vy += pvy * 0.6; api.sfx.click(); } };
    return {
      onDown(p) { me.tx = p.x; me.ty = p.y; }, onMove(p) { me.tx = p.x; me.ty = p.y; },
      update(dt) {
        if (over) return true; parts.update(dt);
        // player paddle (bottom half only)
        me.px = me.x; me.py = me.y; me.x += (clamp(me.tx, PR, W - PR) - me.x) * Math.min(1, dt * 18); me.y += (clamp(me.ty, H / 2 + PR, H - PR) - me.y) * Math.min(1, dt * 18);
        me.vx = (me.x - me.px) / dt; me.vy = (me.y - me.py) / dt;
        // ai paddle
        const aim = puck.y < H / 2 ? { x: puck.x, y: puck.y - 10 } : { x: W / 2 + (puck.x - W / 2) * 0.5, y: 90 };
        const opx = ai.x, opy = ai.y; ai.x += clamp(aim.x - ai.x, -1, 1) * Math.min(Math.abs(aim.x - ai.x), 330 * dt); ai.y += clamp(aim.y - ai.y, -1, 1) * Math.min(Math.abs(aim.y - ai.y), 260 * dt); ai.y = clamp(ai.y, PR, H / 2 - PR); ai.vx = (ai.x - opx) / dt; ai.vy = (ai.y - opy) / dt;
        if (pause > 0) { pause -= dt; return true; }
        puck.x += puck.vx * dt; puck.y += puck.vy * dt; puck.vx *= Math.pow(0.7, dt); puck.vy *= Math.pow(0.7, dt);
        const sp = Math.hypot(puck.vx, puck.vy); if (sp > 900) { puck.vx *= 900 / sp; puck.vy *= 900 / sp; }
        if (puck.x < R) { puck.x = R; puck.vx = Math.abs(puck.vx); api.sfx.tap(); } if (puck.x > W - R) { puck.x = W - R; puck.vx = -Math.abs(puck.vx); api.sfx.tap(); }
        const inGoal = Math.abs(puck.x - W / 2) < goalW / 2;
        if (puck.y < R) { if (inGoal) { you++; msg = "GOAL! 🎉"; api.sfx.win(); parts.burst(puck.x, 0, "#ffd54a", 30); reset(false); } else { puck.y = R; puck.vy = Math.abs(puck.vy); } }
        if (puck.y > H - R) { if (inGoal) { bot++; msg = "Robot scores 🤖"; api.sfx.miss(); reset(true); } else { puck.y = H - R; puck.vy = -Math.abs(puck.vy); } }
        collide(me); collide(ai);
        api.setScore(`YOU ${you} — ${bot} 🤖`);
        if (you >= 5 || bot >= 5) { over = true; const win = you > bot; const tix = 5 + you * 5 + (win ? 25 : 0); api.finish(tix, win ? "🏆 You win!" : "So close!", `${you}–${bot} → ${tix} tickets`); }
        return true;
      },
      draw(g) {
        g.fillStyle = "#e8f4ff"; g.fillRect(0, 0, W, H);
        g.strokeStyle = "#3d8bfd"; g.lineWidth = 4; g.beginPath(); g.moveTo(0, H / 2); g.lineTo(W, H / 2); g.stroke(); circle(g, W / 2, H / 2, 70, null, "#3d8bfd", 4);
        rrect(g, W / 2 - goalW / 2, -10, goalW, 24, 8, "#111"); rrect(g, W / 2 - goalW / 2, H - 14, goalW, 24, 8, "#111");
        for (let i = 0; i < 12; i++) for (let j = 0; j < 9; j++) circle(g, 40 + i * 66, 40 + j * 65, 2, "#cfe3ff");
        circle(g, ai.x, ai.y, PR, "#3d8bfd", "#1a4fa0", 4); circle(g, ai.x, ai.y, 12, "#8ec0ff");
        circle(g, me.x, me.y, PR, "#f4433f", "#a01010", 4); circle(g, me.x, me.y, 12, "#ff9c9c");
        circle(g, puck.x, puck.y, R, "#222", "#555", 3); circle(g, puck.x, puck.y, 8, "#444");
        parts.draw(g);
        if (pause > 0) text(g, msg, W / 2, H / 2 - 110, 30, "#1a4fa0");
        text(g, `${you}`, 40, H - 60, 44, "#f4433f"); text(g, `${bot}`, 40, 60, 44, "#3d8bfd");
      },
    };
  },
};
