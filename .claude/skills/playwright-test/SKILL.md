---
name: playwright-test
description: Use Playwright to actually launch and drive this site (dev server + headless Chromium) to verify a change — screenshots, clicking tiles/modals, simulating the camera's pan/zoom/drag gestures, dice rolls, and reading live app state. Use whenever a change to src/ needs to be visually or behaviorally confirmed rather than just built. Triggers on "test this", "verify the change works", "screenshot the site", "check the board renders", "does the camera still work", "playwright".
---

# Testing this site with Playwright

This is a Vite + vanilla-JS site with no test framework and no CI. The only way to know a change
actually works is to launch it and drive it like a user would — build success and "the code looks
right" are not verification. This skill is the concrete how-to for that, distilled from the
mistakes made building the site's pan/zoom camera and coastline (bugs that were invisible in the
code and only showed up once real screenshots and real geometry were checked).

**Playwright is already a project devDependency** (`package.json` → `devDependencies.playwright`)
with Chromium already downloaded to the user's `ms-playwright` cache — don't reach for
`chromium-cli` (not installed in this environment) and don't `npx playwright install` again
unless a version bump actually requires a different browser build.

## The loop

1. **Start the dev server in the background, waiting for it to actually respond:**

   ```bash
   lsof -ti:5173 -sTCP:LISTEN 2>/dev/null | xargs -r kill 2>/dev/null   # free the port first
   nohup npm run dev -- --port 5173 --strictPort > /tmp/vite-dev.log 2>&1 & disown
   timeout 30 bash -c 'until curl -sf http://localhost:5173 >/dev/null; do sleep 1; done' \
     && echo UP || (echo FAIL; cat /tmp/vite-dev.log)
   ```

   Don't `sleep N` and hope — poll the port. Always free the port first or you'll get
   `EADDRINUSE` on the next run (npm doesn't forward SIGTERM to the Vite process it spawns, so
   killing the `npm run dev &` job doesn't free the port — kill by port instead, as above).

2. **Write a throwaway `.mjs` driver script** into the scratchpad directory (never into the repo)
   and run it with plain `node` — Playwright resolves from the project's own `node_modules` as
   long as the script runs with a working directory inside (or a require path reaching) this
   project:

   ```js
   import { chromium } from 'playwright';
   const browser = await chromium.launch();
   const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
   const errors = [];
   page.on('pageerror', (e) => errors.push(String(e)));
   page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });

   await page.goto('http://localhost:5173', { waitUntil: 'networkidle' });
   await page.waitForSelector('.tile.content');
   await page.waitForTimeout(300); // let the camera's setHome() settle

   // ...interact, screenshot, evaluate...

   console.log('errors:', JSON.stringify(errors));
   await browser.close();
   ```

   Save screenshots to `.tmp-shots/` at the repo root (already covered by a `.gitignore`-style
   habit — delete the directory when done; never commit them) and `Read` them back as images to
   actually look at the result. **A script that runs without throwing is not verification — look
   at the picture, and check `errors` is empty.**

3. **Kill the dev server and delete `.tmp-shots/` when done.**

   ```bash
   lsof -ti:5173 -sTCP:LISTEN 2>/dev/null | xargs -r kill 2>/dev/null
   rm -rf .tmp-shots
   ```

## Recipes specific to this app

- **Wait for real content, not a fixed sleep**: `await page.waitForSelector('.tile.content')`
  after `goto`, then a short `waitForTimeout(300)` — the desktop camera's `setHome()` runs on
  load and needs a beat to settle before coordinates are meaningful.

- **Click a tile by id**: `page.click('.tile.content[data-tile-id="skills"]')`. Content tile ids:
  `education`, `resume`, `experience`, `about-me`, `projects`, `skills`, `desert` (see
  `src/data.js`'s `TILES`).

- **Open/close modals**: `await page.waitForSelector('dialog#modal[open]')` after a click;
  `page.keyboard.press('Escape')` or click `#m-close` to close. Check
  `document.getElementById('modal').open` via `evaluate` for the ground truth, not just visual
  inspection — a closed dialog can still be in the DOM.

- **Camera pan** (plain wheel): `await page.mouse.move(x, y)` then
  `await page.mouse.wheel(deltaX, deltaY)`. **Zoom** (ctrl+wheel):
  wrap the same wheel call in `page.keyboard.down('Control')` / `up('Control')`. A single large
  `deltaY` (e.g. `-2000`) saturates the zoom to `maxScale` in one step — useful for reaching a
  known extreme fast rather than simulating a realistic gesture.

- **Drag-to-pan**: `mouse.move` → `mouse.down()` → `mouse.move(..., { steps: 8-10 })` → `mouse.up()`.
  Use real drag gestures (not just `wheel`) at least once per camera-related change — wheel-pan
  and drag-pan share the same `panBy()`/`clamp()` code path in `src/camera.js`, but a regression
  in the pointer-event wiring specifically (as happened with `setPointerCapture` silently eating
  every tile click) will only show up by testing the actual gesture, not its cheaper proxy.

- **Read live camera state**: the transform is inline, not computed — parse it directly rather
  than trusting `getBoundingClientRect` math by hand:

  ```js
  const { x, y, scale } = await page.evaluate(() => {
    const t = document.getElementById('world').style.transform;
    return {
      x: parseFloat(t.match(/translate\(([-\d.]+)px/)[1]),
      y: parseFloat(t.match(/translate\([-\d.]+px, ([-\d.]+)px/)[1]),
      scale: parseFloat(t.match(/scale\(([\d.]+)\)/)[1]),
    };
  });
  ```

  To get the world-space coordinate at a specific screen point (e.g. "what map coordinate is at
  the viewport's right edge right now"): `(viewportWidthOrX - x) / scale`.

- **Dice rolls need deterministic `Math.random`.** Override it via `addInitScript` *before*
  `goto`, and emulate reduced motion so `hud.js` skips the rolling-animation ticks and consumes
  exactly two `Math.random()` calls per roll (after the one call `board.js` makes at load for the
  filler-tile seed):

  ```js
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.addInitScript((queue) => {
    const q = queue.slice();
    const real = Math.random;
    Math.random = () => (q.length ? q.shift() : real());
  }, [0.1, 0.9, 0.4]); // [seed, die-a, die-b] — pick die values to target a specific sum
  ```

  `1 + Math.floor(r * 6)` maps `r` to a die face; e.g. `r=0.9` → 6, `r=0.4` → 3 (sum 9 → Experience).

- **Mobile breakpoint**: `chromium.launch()` then `newPage({ viewport: { width: 390, height: 844 } })`
  and a fresh `goto` (don't just `setViewportSize` mid-session if you need `fullPage` screenshots
  — see the overflow gotcha below). The mobile layout is a normal scrolling page (`.stack`), not
  the camera — verify `document.getElementById('viewport')`'s computed `display` is `none` and
  `.stack`'s is `block` at this width.

## Gotchas actually hit building this site (don't re-learn these the hard way)

- **`el.getBoundingClientRect()` on a *rotated* element returns its axis-aligned bounding box**,
  which is bigger than the element and tells you almost nothing about where a specific point
  inside it (e.g. a rotation pivot) actually renders. To verify a specific point's true screen
  position, inject a tiny unrotated marker `div` at that exact coordinate instead and read
  *its* rect:

  ```js
  await page.evaluate(() => {
    const dot = document.createElement('div');
    dot.style.cssText = 'position:absolute; left:Xpx; top:Ypx; width:6px; height:6px; margin:-3px; background:magenta;';
    document.getElementById('world').appendChild(dot);
  });
  ```

  Then screenshot a tight `clip` region around it. This is the single most reliable technique for
  debugging "is this element actually where the math says it should be" — used to resolve the
  dock/port placement bugs.

- **Two elements with different explicit `z-index` values compare across the *whole page*, not
  just against their visual neighbors** — an element painted earlier in the DOM but given
  `z-index: 1` will render *above* a later sibling that has no `z-index` at all (auto = stacking
  level 0, below any positive value). This silently hid the entire hex board under the sand
  coastline once the coastline got a `z-index`. When two elements are meant to stack by DOM order
  alone, **neither** should have an explicit `z-index` — check `getComputedStyle(el).zIndex` for
  unintended values before assuming a paint-order bug is something else.

- **`viewportEl.setPointerCapture()` on a container silently breaks every `click` on children
  underneath it** once a `pointerdown` fires inside — the browser can retarget the following
  `mouseup`/`click` to the capturing element instead of whatever's visually under the cursor. A
  drag-to-pan container that also needs to let clicks through to buttons inside it should track
  drag state manually (`pointerdown`/`pointermove`/`pointerup` + a moved-threshold flag) and
  *not* call `setPointerCapture`, unless the pointer is expected to leave the capturing element's
  bounds mid-drag (rare when the container already covers the whole viewport).

- **A bound/margin/threshold computed from one arbitrary viewport size does not generalize.**
  The camera's pan-bound math depends on the live viewport's aspect ratio vs. the world's aspect
  ratio — a constant tuned against a single `newPage({ viewport: ... })` size can pass every
  automated check and still be wrong in the user's actual (differently-sized) browser window.
  **Test viewport-dependent logic at more than one size** (e.g. 1440×900 and something
  narrower/taller), and prefer deriving thresholds from `viewportEl.getBoundingClientRect()` at
  call time over hardcoding a number that only happens to work for whatever window the test used.

- **Full-page screenshots can be misleadingly blank** if the scrollable element isn't what you
  think it is. If `page.screenshot({ fullPage: true })` looks cut short, check
  `document.documentElement.scrollHeight` vs `document.body.scrollHeight` — a `height: 100%` /
  `overflow: auto` combination on both `html` and `body` can turn `body` into its own clipped
  inner scroll container instead of letting the page grow, which throws off Playwright's
  full-page sizing even though the DOM content is all genuinely there.

## What "verified" means here

Before calling a UI change done:

1. `npm run build` succeeds (catches import/syntax errors Vite's dev server tolerates).
2. A Playwright script drives the actual interaction the change touches, end to end, and the
   resulting screenshot is `Read` back and actually looked at.
3. `page.on('pageerror'/'console')` shows no errors during the interaction.
4. For anything viewport-size- or zoom-dependent, checked at more than one size/zoom level, not
   just the default.
