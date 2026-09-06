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

A **walkable 3D arcade** (Three.js, all procedural geometry) modelled on a big timber-truss family arcade hall: wood plank walls, a pitched wooden ceiling with king-post trusses and warm pendant lights, patterned carpet, log columns, daylight windows, a **climbable rock wall**, an **open Snack Shack** with a chef, balloons under the roof, and glowing arcade cabinets everywhere. Everyone in the arcade has a modelled human face (eyes that blink, brows, nose, smile, hair styles) — no emoji faces.

### Two ways to play
- **🏖️ Sandbox mode** — unlimited money. Load your card as much as you like.
- **💼 Regular mode** — start with $5 and **earn money by working**: a 60-second **Snack Shack shift** (take orders, tap the right snacks in order, ring the bell — speed earns tips) or a **Prize Booth shift** (hand kids the plushie on their ticket receipt). Do a good job and you get paid; wrong orders earn nothing. Money buys card credits and snacks.
- Progress saves separately per mode; switch anytime from the top bar.

### Staying comfy — hunger, thirst & bathroom
Three little bars under your tickets slowly drain while you play. When one empties you can't start a game until you fix it: **grab a bite** at the Snack Shack (which hands you a wrapper — drop it in a **🗑️ trash can** for +5 tickets), **drink** at the **🚰 water fountain**, or visit the **🚻 restrooms** by the entrance (a short, friendly hand-washing animation refills the bar). Everything stays kid-appropriate.

### Make it yours
**👕 My look** lets you customize your character live: skin tone, hair color and style (long, short, ponytail, curly, bun), eye color, expression, shirt, pants, shoes and a hat. Faces are soft and friendly — simple eyes, gentle smiles, blinking.

### Controller support
Plug in any standard gamepad: left stick walks, right stick looks, **A** interacts / starts / taps (an on-screen cursor appears inside games so every tap game works), **B** goes back. Turbo Racer steers with the left stick, VR Blaster looks with the right stick, and Dance Floor uses the D-pad or face buttons.

### Walking around
- Third-person camera. On iPad: an always-visible **virtual joystick** (bottom-left) plus drag-to-look on the right, or just **tap the floor / a machine** and Emmy walks there. Desktop: WASD/arrows + mouse drag, `E`/Enter to interact.
- Walk up to anything glowing and a "▶ Play" prompt appears; the camera **flies in** and the game plays in **first-person**.
- **💳 Card kiosk** (entrance) turns money into credits. **🍕 Snack Shack** sells snacks for money — every snack gives a boost (double tickets, a free game, +50% tickets, or instant tickets). **🏪 Prize Counter** trades tickets for prizes and is where you sign up for a Prize Booth shift.

### Games — 20 machines, each a real 3D scene (payouts are generous: every win ×1.5)
| | |
|---|---|
| **🏎️ Turbo Racer** — sit-down bike, first-person highway | **🦾 Claw Machine** — a real claw crane full of *shaped* plushies (bear, panda, frog, dino, octopus, whale, star, gift, unicorn, duck); what you grab goes on your shelf |
| **🥽 VR Blaster** — drag to look, blast UFOs and asteroids | **🎡 Ticket Wheel** — a real spinning prize wheel, 2–200 tickets |
| **🔫 Laser Tag** — neon arena, robots behind barriers | **🏒 Air Hockey** — drag your paddle, first to 5 |
| **🎣 Gone Fishin'** — dock, animated water, 3D reel gauge | **🎳 Skee-Ball** — roll up the lane into tilted rings |
| **🐹 Whack-a-Mole** · **🏀 Hoop Shot** | **🪙 Coin Pusher** — drop coins, the bar shoves the pile off the edge |
| **🎈 Balloon Darts** — swipe to throw darts at drifting balloons | **🎳 Bowling** — swipe to roll, curve with a sideways swipe, strikes pay big |
| **🕺 Dance Floor** — rhythm game on a lit dance floor (tap pads or arrow keys) | **🧗 Rock Wall** — FREE: tap the glowing holds to climb to the bell |
| **🦆 Duck Pond Toss** — toss soft beanbags to splash the ducks, targets and gold stars gliding by | **🔨 Strongman Hammer** — time the power meter, ring the bell |
| **🍾 Ring Toss** — toss rings onto bottle necks (gold bottle = 10) | **🧠 Memory Match** — flip 3D tiles, find all 8 pairs |
| **⚽ Penalty Kick** — swipe past a diving goalie in front of a cheering crowd | |

### Prize Counter — every prize is interactive (and affordable)
| Prize | What you can do with it |
|---|---|
| 🍬 Candy Bag (15🎟️) | Unwrap and munch 10 candies |
| 🏐 Bouncy Ball (30) · 🪄 Glow Wand (60) | Bounce physics · draw glowing rainbow light trails |
| 🪀 Yo-Yo · 🫧 Slime · 🧸 Teddy · 🦄 Unicorn · 🦎 GIANT Axolotl · 🏆 Trophy (40–1200) | **Real 3D toys** — hold to squish, flick to spin, polish |
| 🦾 Claw plushies | The actual shaped plush you grabbed — hold to squish, drag to spin |
| 🃏 **Critter Clash Pack** (80) | 10 original monster battle cards with procedural illustrated art, HP, attacks, weakness, rarity marks and a reverse-holo |
| ✨ **Inkbound Pack** (100) | 12 original character cards in six inks (Amber, Amethyst, Emerald, Ruby, Sapphire, Steel): hex ink cost, inkable ring, strength/willpower shields, lore diamonds, six rarity gems (circle → hexagon), one guaranteed foil; collect them in a binder |
| 📱 iPad (600) | A tablet with exactly **one** app installed: Emmy's Fidget Trading, playable inside it |

All characters, creatures and card sets are original — nothing licensed.

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
| `src/arcade3d/games1.js` … `games4.js` | The 20 first-person 3D games + the 2 jobs (each is a `{create(api) → {scene, camera, update…}}` controller) |
| `src/arcade3d/lib.js` | Shared Three.js helpers — textures, materials, particles, the human-faced kid character, shaped plushies |
| `src/arcade-prizes.js` + `src/canvas2d.js` | Prize catalog, snack menu, the two card sets with SVG art generator, and the interactive prize views |
| `src/toys.js` | Toy catalog, rarity tiers, and trade/offer/box logic |
| `src/fidget3d.js` | Lazy-loaded Three.js scene — procedural 3D toy archetypes |
| `mockups.html`, `mockup-a.html`, `mockup-b.html` | Early design mockups (kept for reference) |
| `.github/workflows/deploy.yml` | Auto-builds & deploys to GitHub Pages on push to `main` |

### Deployment
Pushing to `main` triggers a GitHub Actions workflow that builds the site and deploys it to GitHub Pages automatically.

---

*Made with 💜 for Emmy.*
