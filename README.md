# 🎉 Emmy's Games

Two cheerful, [neal.fun](https://neal.fun)-style browser games for kids (built for a 10-year-old named Emmy), picked from one landing page:

- **🦊 Emmy's Fidget Trading** — trade fidget toys with a friendly buddy, haggle for coins, collect all the rarities, open mystery boxes, and play with each toy in its own satisfying way.
- **🕹️ Emmy's Arcade** — a *Sneaky Sasquatch*-style arcade simulator: load an arcade card with (unlimited!) money, win tickets in 10 mini-games, and trade them for prizes you can actually play with.

**▶ Play it live: https://tunurgitr.github.io/emmy-game/**

No downloads, no accounts, no ads — it runs entirely in the browser and saves your progress locally.

---

## ✨ Features

### Trading — take turns, back and forth
- **You and your buddy take turns starting the trade.** One round they lay toys down with a *hidden fair price* and you build your side to match; the next round it's **your turn** — you offer some toys first and they trade you something back. A banner always shows whose turn it is.
- **Live feedback.** On their turn, watch their **mood** (😠 → 🤔 → 😊); on your turn, they counter with real toys and the **deal meter** tells you if it's a good deal.
- **Accept / Decline / Ask for more.** "Ask for more" is push-your-luck — they might sweeten the deal, politely decline, or playfully take one back.
- **Two honest gauges:** the buddy's mood ("will they say yes?") and a separate **deal meter** ("is this good for *you*?"). The deal meter is **hideable** if you'd rather judge for yourself.

### Collection & rarities
- **67 fidget toys** across **9 rarity tiers**: Common · Uncommon · Rare · Epic · Legendary · **Mythic** · **Cosmic** · **Prismatic** · **Divine**.
- Every toy has its **own 3D model and its own way to play** — a rainbow slinky really is a rainbow coil you stretch, a spinner spins, a squishmallow squishes, a tangle twists, gears mesh, a Newton's cradle clicks.
- The **3D model is previewed right on every card** (backpack, trade mat, shop, and box reveals).
- **📖 Rarity Guide** legend showing every tier's color, value range, and toys — undiscovered toys appear as ❔ silhouettes, with a "Collected X/67" tracker.

### Mystery boxes 📦
- Four boxes with **printed odds**: Sparkle (35🪙), Rainbow (90🪙), Galaxy (250🪙), and the **Divine Box** (600🪙) — 100% Rare-or-better with the best shot at Prismatic and Divine toys.
- Start each new game with a **free welcome box**, plus a **free Rainbow box every 5 trades**.
- A visible **🍀 Lucky Meter** pity system (guaranteed Rare+ every 7 boxes), an epic+ safety net, and a guaranteed-good first box.
- Full **drop → shake → glow → burst → reveal** animation with a **NEW!** badge for first-time pulls.

### The Fidget Zone 🎮 — real 3D, one play style per toy
Tap any toy to *play* with it — most toys open as a **real, lit 3D object** you can spin around with your finger, with silicone, glossy plastic, chrome, glass, goo, plush, metal, and holographic finishes plus soft contact shadows. Every toy's model is built to look like the real thing (from ~20 procedural archetypes) and each maps to the interaction that actually fits it. The 3D engine ([Three.js](https://threejs.org), procedural geometry only — no model files) is **lazy-loaded**, and it falls back to a 2D version automatically if a device can't do WebGL.

Interactions include:

| | | |
|---|---|---|
| **Pop-it grid** (drag to pop a streak) | **Flick to spin** (spinners, rings, gears, yo-yos) | **Squish** (hold — always springs back, never pops) |
| **Stretch & snap** (noodles, bracelets) | **Coil stretch** (slinky boing) | **Twist** (tangles & chains) |
| **Tap-to-flip cube** (mash for a combo) | **Piano** (tap zones for notes) | **Petting** (stroke to purr — cute critters) |
| **Bubble shower** (pop falling minis) | **Snow-globe shake** (scrub & settle) | **Peel** (drag to reveal a surprise) |

Squishy and plushie toys get **cute kawaii faces** (like the beloved Mochi Squish) — mochi, unicorn, rainbow dragon, mermaid, axolotl, jellyfish, and more.

### Selling — a friendly chat 💬
Selling is a mini-conversation, not a vending machine. Your buddy makes a personal offer (~85% of value, a little random, extra excited for rare toys); you can **Deal**, ask **"Can you do better?"** (haggle up toward ~97%, with a rare generous jackpot), or **Keep it**.

### Make it yours
- **Pick your character** (kid or animal) on first run, changeable anytime.
- **Rename & re-skin your trading buddy** (16 characters + a custom name).
- **Sound effects** for everything (generated with the Web Audio API — no audio files), with a **mute toggle**.
- **Celebrations & confetti** for great trades and rare pulls.

### Built for touch
Tuned for iPad/touchscreens — big tap targets, no double-tap zoom lag, pointer-based drag/hold interactions, a tablet layout breakpoint, and respect for reduced-motion.

---

## 🕹️ Emmy's Arcade

A **walkable 3D arcade** (Three.js, all procedural geometry) modelled on a big timber-truss family arcade hall: wood plank walls, a pitched wooden ceiling with king-post trusses and warm pendant lights, patterned carpet, log columns, daylight windows, a climbing wall, a Snack Shack cabin, balloons under the roof, and glowing arcade cabinets everywhere.

- **Walk around in third-person.** On iPad: left thumb = virtual joystick, right thumb = drag to look, or just **tap the floor / tap a machine** and Emmy walks there. On desktop: WASD/arrows + mouse drag, `E`/Enter to interact.
- **Walk up to a machine** and a "▶ Play" prompt appears; the camera **flies into the cabinet** and the game plays in **first-person**.
- Your wallet has **unlimited money** — walk to the glowing **💳 card kiosk** by the entrance to load credits onto your arcade card. Games cost 2–4 credits and pay out 🎟️ tickets that fly onto your card.
- The **🏪 Prize Counter** at the back wall (with a clerk and shelves of prizes) is where tickets become prizes.

### Games — 10 machines, each a real 3D scene
| | |
|---|---|
| **🏎️ Turbo Racer** — sit-down motorbike cabinet; first-person highway with traffic, coins, trees | **🦾 Claw Machine** — look into the glass box; drag the claw over plush prizes, release to drop |
| **🥽 VR Blaster** — a VR pod; drag to look around space, tap to blast UFOs and asteroids | **🎡 Ticket Wheel** — a real spinning prize wheel; swipe to spin, 2–200 tickets (★ jackpot) |
| **🔫 Laser Tag** — neon arena behind a curtain; robots pop up behind barriers, don't zap the kids | **🏒 Air Hockey** — real table, drag your paddle on the surface, first to 5 vs the robot |
| **🎣 Gone Fishin'** — on a dock over animated water; cast, tap the ❗ bite, hold to keep the fish in the green zone | **🎳 Skee-Ball** — swipe to roll up the lane and ramp into tilted rings |
| **🐹 Whack-a-Mole** — moles pop out of a 3D table, tap to bonk with the hammer | **🏀 Hoop Shot** — swipe to shoot at a moving hoop with rim & backboard physics |

Every cabinet remembers your **best ticket haul**.

### Prize Counter — every prize is interactive
| Prize | What you can do with it |
|---|---|
| 🍬 Candy Bag | Unwrap and munch 10 candies |
| 🏐 Bouncy Ball | Flick it around a box with real bouncing physics |
| 🪀 Glow Yo-Yo · 🫧 Galaxy Slime · 🧸 Teddy · 🦄 Unicorn · 🦎 GIANT Axolotl · 🏆 Trophy | **Real 3D toys** rendered with the Fidget Zone engine — hold to **squish** the stuffies, flick the yo-yo, polish the trophy |
| 🪄 Glow Wand | Draw glowing rainbow light trails |
| 🃏 Pokémon Pack · ✨ Lorcana Pack | Rip open a 5-card booster, flip each card (holo & secret rares!), and keep a **binder** collection |
| 📱 iPad | A tablet with exactly **one** app installed: Emmy's Fidget Trading, playable right inside it |

Progress (card balance, tickets, prizes, card binders) saves locally, separately from the trading game.

---

## 🎨 Design decisions

- **3D toys, emoji everywhere else.** The Fidget Zone renders toys as procedural 3D models (real lighting/reflections, no asset files, generated at runtime so it works offline); the backpack, trade mat, and boxes stay emoji + CSS for speed. Three.js loads only when you open a toy.
- **Nothing that squishes ever pops.** Squishy toys deform and spring back with a happy sparkle at max squish — no sad bursting.
- **Kid-friendly, never predatory.** Mystery boxes use coins only (no real money), print their odds, always let you keep what you pull, use a *visible* pity meter, and have no dark patterns or FOMO timers.
- **Trading is the heart.** The shop (buy at ~0.85× value, with rarer toys showing up often) and boxes are coin *sinks*; trading and haggling are the best ways to grow your collection.
- **Warm, encouraging tone.** The buddy's dialogue is cheerful and forgiving — declining or cancelling never has a penalty.
- **Persistence.** Coins, inventory, collection, character, and settings are saved to `localStorage` (per domain).

---

## 🛠️ Tech & development

Plain **HTML/CSS/JavaScript** (ES modules) bundled with **[Vite](https://vitejs.dev)** — no frameworks. The only runtime dependency is **Three.js**, and it's dynamically imported into its own chunk that loads *only* when the Fidget Zone opens, so the base game bundle stays small.

```bash
npm install
npm run dev      # hot-reload dev server at http://localhost:5191
npm run build    # production build to dist/
npm run preview  # preview the production build
```

### Project layout
| Path | What |
|---|---|
| `index.html` | Landing page — pick Fidget Trading or the Arcade |
| `game.html` + `src/game.js` | Fidget Trading (UI, state, turns, boxes, fidget zone, chat) |
| `arcade.html` + `src/arcade.js` | Emmy's Arcade hub — HUD, arcade card, prize counter, first-person game harness |
| `src/arcade3d/world.js` | The walkable 3D hall: room, trusses, lights, cabinets, kiosk, prize counter, character, controls, camera fly-in |
| `src/arcade3d/games1.js`, `src/arcade3d/games2.js` | The 10 first-person 3D games (each is a `{create(api) → {scene, camera, update…}}` controller) |
| `src/arcade3d/lib.js` | Shared Three.js helpers — emoji sprites, text/wood/carpet textures, materials, particles, kid character |
| `src/arcade-prizes.js` + `src/canvas2d.js` | Prize catalog, card sets, and the interactive prize views (3D toys via `fidget3d.js`, iPad, packs…) |
| `src/toys.js` | Toy catalog, rarity tiers, and trade/offer/box logic |
| `src/fidget3d.js` | Lazy-loaded Three.js scene — procedural 3D toy archetypes |
| `mockups.html`, `mockup-a.html`, `mockup-b.html` | Early design mockups (kept for reference) |
| `.github/workflows/deploy.yml` | Auto-builds & deploys to GitHub Pages on push to `main` |

### Deployment
Pushing to `main` triggers a GitHub Actions workflow that builds the site and deploys it to GitHub Pages automatically.

---

*Made with 💜 for Emmy.*
