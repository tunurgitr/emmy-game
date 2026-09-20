# CLAUDE.md

Guidance for Claude Code working in this repo. See `README.md` for what the games are and
the full project layout.

## Browser verification — use Playwright, not Claude in Chrome

**Always verify UI changes with Playwright.** The Claude-in-Chrome extension is not
connected in this environment and its `mcp__claude-in-chrome__*` tools fail with
"Browser extension is not connected" — don't reach for them.

Playwright is a devDependency (`npm i` covers it) and the browsers are already installed
under `~/AppData/Local/ms-playwright`.

Typical loop:

```bash
npm run build
npx vite preview --port 4173 --strictPort   # run in background; dist/ is what it serves
node check.mjs                              # scratchpad script using chromium.launch()
```

Notes that save time:
- Write throwaway check scripts in the session scratchpad, not the repo. Node can't resolve
  `playwright` from outside the project, so import it by path:
  `import { chromium } from "file:///C:/Users/Jeff/source/repos/emmy-game/node_modules/playwright/index.mjs"`.
- `arcade.html` exposes `window.__arcade` (`state`, `mode`, `world`, `interact`,
  `startGame`, `closeGame`, `setMode`, `GAMES`) — drive and assert through it instead of
  clicking through 3D scenes. Wait for it with
  `page.waitForFunction(() => window.__arcade && window.__arcade.state)`.
- `game.html` opens the character picker over everything on a fresh profile; click
  `.avatar-opt` first or later clicks get intercepted.
- Seed or inspect progress through `localStorage` — every key is namespaced `emmy.*`
  (`emmy.fidget.save.v2`, `emmy.arcade.save.v2.<mode>`, `emmy.arcade.mode`,
  `emmy.arcade.avatar`, plus `emmy.muted` / `emmy.music` / `emmy.meterHidden` / `emmy.no3d`).
- Kill the preview server when finished (`netstat -ano | grep :4173`, then `taskkill //F //PID <pid>`).

## Conventions

- No frameworks. Plain ES modules bundled by Vite; Three.js is the only runtime dependency.
- Match the surrounding style: dense one-line helpers in the arcade code, section banner
  comments, kid-friendly copy in every string the player sees.
- Destructive actions in the UI (anything that erases progress) must ask for confirmation
  first, in-page — never `confirm()`/`alert()`.
- Pushing to `main` auto-deploys to GitHub Pages, so build before you push.
