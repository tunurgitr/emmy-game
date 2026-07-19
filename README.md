# 🎉 Emmy's Fidget Trading

A cheerful, [neal.fun](https://neal.fun)-style **fidget-toy trading game** for kids (built for a 10-year-old named Emmy). Trade fidget toys with a friendly buddy, haggle for coins, collect all the rarities, open mystery boxes, and play with each toy in its own satisfying way.

**▶ Play it live: https://tunurgitr.github.io/emmy-game/**

No downloads, no accounts, no ads — it runs entirely in the browser and saves your progress locally.

---

## ✨ Features

### Trading
- **Build your own trades.** Your buddy puts toys on the table and has a *hidden fair price*; you tap toys from your backpack to build your side, watch their **live mood** (😠 → 🤔 → 😊), then **Propose**.
- **Accept / Decline / Ask for more.** "Ask for more" is push-your-luck — they might add a toy, politely decline, or playfully take one back.
- **Two honest gauges:** the buddy's mood ("will they say yes?") and a separate **deal meter** ("is this good for *you*?"). The deal meter is **hideable** if you'd rather judge for yourself.

### Collection & rarities
- **51 fidget toys** across **7 rarity tiers**: Common · Uncommon · Rare · Epic · Legendary · **Mythic** · **Cosmic**.
- **📖 Rarity Guide** legend showing every tier's color, value range, and toys — undiscovered toys appear as ❔ silhouettes, with a "Collected X/51" tracker.

### Mystery boxes 📦
- Three boxes with **printed odds**: Sparkle (35🪙), Rainbow (90🪙), Galaxy (250🪙).
- A **free daily box**, plus a **free Rainbow box every 5 trades**.
- A visible **🍀 Lucky Meter** pity system (guaranteed Rare+ every 7 boxes), an epic+ safety net, and a guaranteed-good first box.
- Full **drop → shake → glow → burst → reveal** animation with a **NEW!** badge for first-time pulls.

### The Fidget Zone 🎮
Tap any toy to *play* with it. Each toy uses one of **12 distinct interactions**, themed with its own particles, colors, and sounds so no two feel the same:

| | | |
|---|---|---|
| **Pop-it grid** | **Flick spinner** (momentum) | **Stretch & boing** (hold) |
| **Rapid-fire combo** (mash) | **Piano** (tap zones for notes) | **Wind-up crank** (drag in circles) |
| **Bubble shower** (pop falling minis) | **Squeeze & burst** (hold till it pops) | **Petting** (stroke to purr) |
| **Stack tower** (stack till it topples) | **Snow-globe shake** (scrub & settle) | **Peel** (drag to reveal a surprise) |

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

- **Emoji + CSS art.** Toys and characters are emoji styled with CSS — cute, fast to iterate, zero asset files, works offline.
- **Kid-friendly, never predatory.** Mystery boxes use coins only (no real money), print their odds, always let you keep what you pull, use a *visible* pity meter, and have no dark patterns or FOMO timers.
- **Trading is the heart.** The shop (buy at ~1.1× value) and boxes are coin *sinks*; trading and haggling are the best ways to grow your collection.
- **Warm, encouraging tone.** The buddy's dialogue is cheerful and forgiving — declining or cancelling never has a penalty.
- **Persistence.** Coins, inventory, collection, character, and settings are saved to `localStorage` (per domain).

---

## 🛠️ Tech & development

Plain **HTML/CSS/JavaScript** (ES modules) bundled with **[Vite](https://vitejs.dev)** — no frameworks, no runtime dependencies.

```bash
npm install
npm run dev      # hot-reload dev server at http://localhost:5191
npm run build    # production build to dist/
npm run preview  # preview the production build
```

### Project layout
| Path | What |
|---|---|
| `game.html` + `src/game.js` | The main game (UI, state, boxes, fidget zone, chat) |
| `src/toys.js` | Toy catalog, rarity tiers, and trade/offer/box logic |
| `index.html` | Title screen |
| `mockups.html`, `mockup-a.html`, `mockup-b.html` | Early design mockups (kept for reference) |
| `.github/workflows/deploy.yml` | Auto-builds & deploys to GitHub Pages on push to `main` |

### Deployment
Pushing to `main` triggers a GitHub Actions workflow that builds the site and deploys it to GitHub Pages automatically.

---

*Made with 💜 for Emmy.*
