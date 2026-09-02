# Catan Portfolio — Placeholder Asset Pack

Stand-in SVG assets for the MVP build. Every file is hand-drawn *in style* (wobbly outlines,
flat fills, one ink color) so that swapping in real scanned drawings later is a file-for-file
replacement with no layout changes.

Open `board.html` in a browser to see the whole thing assembled.

---

## Swap plan

Keep the filenames and the viewBox dimensions and nothing else has to change.

| Asset group | viewBox | Notes |
|---|---|---|
| Tiles | `0 0 200 231` | Pointy-top hex, width 200, height 200 × 1.1547 |
| Tokens | `0 0 72 72` | Circular |
| Settlement | `0 0 48 48` | |
| City | `0 0 64 48` | |
| Road | `0 0 72 20` | Rotate via CSS |
| Robber | `0 0 48 64` | |
| Port | `0 0 72 72` | |
| Resource / dev cards | `0 0 90 130` | |
| Bonus cards | `0 0 160 110` | |

When you scan your own drawings, export at these aspect ratios and the board will not move.

---

## Files

### `tiles/` — 11 hexes

**Content tiles** (unique art, clickable, carry a number token)

- `education.svg` — brick. Tower on a hill.
- `resume.svg` — brick. Document with a dog-ear.
- `research.svg` — wheat. Field where the furrows are a waveform.
- `about-me.svg` — sheep. One sheep facing the viewer.
- `projects.svg` — wood. Three trees, two felled logs.
- `skills.svg` — ore. The only mountain on the board.
- `desert.svg` — the joke tile. No token.

**Filler tiles** (reused, not clickable, no token)

- `filler-brick.svg`, `filler-wheat.svg`, `filler-wood.svg`, `filler-sheep.svg`

Each filler is used three times. Rotate by 60/120/180° or mirror in CSS so repeats aren't
obvious. `board.html` does not do this yet — worth adding.

### `tokens/` — 10 number tokens

`token-2` through `token-12`, no 7. Pip count is `6 − |7 − n|`, matching the real game. Six
and eight render in red with five pips.

Board uses: 5 (Education), 8 (Resume), 6 (Research), 8 (About me), 6 (Projects), 9 (Skills).

### `pieces/`

- `settlement.svg` — timeline milestone
- `city.svg` — full-time role (AAOI, Vanguard)
- `road.svg` — timeline segment
- `road-ghost.svg` — dashed, for the unbuilt segment to graduation
- `robber.svg` — sits on a random filler tile each load
- `port.svg` — coastal external link marker

### `cards/`

- `card-brick.svg`, `card-wheat.svg`, `card-wood.svg`, `card-sheep.svg`, `card-ore.svg` — the
  tech-stack hand. Overlay stack names as HTML text on top of the blank card body.
- `card-dev-back.svg` — development card deck
- `bonus-longest-road.svg` — REU Research Award, AWS certification, arXiv publication
- `bonus-largest-army.svg` — FTC Robotics State Control/Software Award, 2nd at RoboTech

### `textures/paper.svg`

Tileable paper grain. Applied as a repeating background in `board.html`. Replace with a scan
of your actual paper — that single swap does more for the handmade feel than any other asset.

---

## `board.html`

A working single-file MVP. No build step, no dependencies. Open it directly or serve it with
`python3 -m http.server`.

What it does:

- Renders all 19 hexes from a `TILES` map using axial row/column math
- Clip-path on each tile so overlapping bounding boxes don't steal clicks
- Number tokens on the six content tiles only — the token is the clickability affordance
- Road chain with settlements, cities, and a dashed ghost segment to graduation
- Native `<dialog>` modals with ESC-to-close and focus trapping for free
- URL hashes (`#projects`, `#aaoi`) so tiles and milestones are linkable
- Fixed "Resume (PDF)" link that bypasses the board entirely
- Vertical stacked fallback below 780px
- `prefers-reduced-motion` respected

What it does not do yet — the day-three list from the spec:

- Ports on the coastline
- Dice roll that highlights matching tokens
- Draggable robber
- Development card flip
- Clicking a resource card to highlight tiles using that stack
- Two-layer navigation inside Projects (`#projects/cipher-arena`)
- Filler tile rotation and mirroring

Drop `Akash_Sarode.pdf` next to `board.html` and the resume links will work.

---

## Palette

```
ink     #2E2823
paper   #F4EDE0
player  #C0462B
brick   #C4703F
wheat   #E0B152
wood    #3F6B3A
sheep   #9DBE6A
ore     #78838F
desert  #D9C79E
```

Keep this palette when you redraw. Six colors plus ink — the constraint is doing real work.

---

## Fonts

`board.html` asks for Caveat / Patrick Hand and falls back to a system script face. For the
real thing, run your own handwriting through [Calligraphr](https://calligraphr.com) and
self-host the result.
