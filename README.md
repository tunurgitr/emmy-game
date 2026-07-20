# 🎉 Emmy's Fidget Trading

A cheerful, [neal.fun](https://neal.fun)-style **fidget-toy trading game** for kids (built for a 10-year-old named Emmy). Trade fidget toys with a friendly buddy, haggle for coins, collect all the rarities, open mystery boxes, and play with each toy in its own satisfying way.

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
| `game.html` + `src/game.js` | The main game (UI, state, turns, boxes, fidget zone, chat) |
| `src/toys.js` | Toy catalog, rarity tiers, and trade/offer/box logic |
| `src/fidget3d.js` | Lazy-loaded Three.js scene — procedural 3D toy archetypes |
| `index.html` | Title screen |
| `mockups.html`, `mockup-a.html`, `mockup-b.html` | Early design mockups (kept for reference) |
| `.github/workflows/deploy.yml` | Auto-builds & deploys to GitHub Pages on push to `main` |

### Deployment
Pushing to `main` triggers a GitHub Actions workflow that builds the site and deploys it to GitHub Pages automatically.

---

*Made with 💜 for Emmy.*
