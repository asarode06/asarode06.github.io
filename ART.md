# Art asset pack

Every file under `public/art/` is an SVG sized so that swapping in a real drawing later is a
file-for-file replacement with no layout or code changes — keep the filenames and viewBox
dimensions and nothing else has to change.

Two visual registers live here, on purpose. The **pieces, tokens and cards** are hand-drawn-*style*
placeholders (wobbly outlines, flat fills, one ink color) meant to be swapped for scans. The
**tiles** are not: they're the board's background, so they were redrawn as flat colour plus a
quiet repeating texture. See "Tile design language" below before touching one.

See `SPEC.md` §7 for how to actually draw the real set.

---

## Swap plan

| Asset group | viewBox | Notes |
|---|---|---|
| Tiles (`tiles/`) | `0 0 200 231` | Pointy-top hex, width 200, height 200 × 1.1547 |
| Tokens (`tokens/`) | `0 0 72 72` | Circular |
| Settlement | `0 0 48 48` | |
| City | `0 0 64 48` | |
| Road | `0 0 72 20` | Rotated via CSS |
| Robber | `0 0 48 64` | |
| Port | `0 0 72 72` | |
| Label banner | `0 0 180 52` | Sits behind each content tile's title text (new asset, not in the original SPEC.md list) |
| Resource / dev cards | `0 0 90 130` | |
| Bonus cards | `0 0 160 110` | |

When you scan your own drawings, export at these aspect ratios and the board won't move.

---

## Files

### `tiles/` — 12 hexes

**Content tiles** (clickable, carry a number token + title banner). Each is its resource's
terrain plus one small line crest in the upper wedge — the section's identity, not a picture of
it.

- `education.svg` — brick. Graduation cap.
- `resume.svg` — brick. Sheet of paper with a dog-ear.
- `experience.svg` — wheat. Briefcase.
- `about-me.svg` — sheep. Head-and-shoulders.
- `projects.svg` — wood. Application window with a prompt caret.
- `skills.svg` — ore. Cut gem.
- `desert.svg` — the joke tile. Carries neither token nor banner, so its cactus sits in the
  middle of the hex instead of up in the wedge.

**Filler tiles** (12 slots dealt across the 5 resources — 3/3/2/2/2, reshuffled per session, not
clickable, no token) — `board.js` seeds a shuffle of these plus a random 60/120/180° rotation and
horizontal mirror per slot so the repeats aren't obvious. Every resource is guaranteed at least
one, because dropping the robber on a plain tile is how a visitor earns that resource's cards.

- `filler-brick.svg`, `filler-wheat.svg`, `filler-wood.svg`, `filler-sheep.svg`, `filler-ore.svg`

Fillers are the same terrain as their content siblings with the crest left off, so a plain hex
recedes and a claimed one reads as claimed.

### Tile design language

Every hex — content, filler and desert — is the same five layers in the same order, and nothing
else. Match this if you redraw one, or the board stops looking like one board.

1. **Silhouette.** An exactly regular pointy-top hexagon filling the viewBox:
   `M100 0 200 57.75 200 173.25 100 231 0 173.25 0 57.75Z`. Exact matters twice — `.tile`'s
   `clip-path` is the same hexagon, and `board.js` rotates fillers by 60/120/180°, which only
   maps the shape onto itself if it's regular. `.tile img` renders it at 106% with a −3% margin,
   so the art overscans the clip and no seam can open at a tile edge.
2. **Terrain texture.** One small motif tiled through a `<pattern>` (cells run 38–46 units, i.e.
   ~28–34 px on screen at the default zoom). Drawn twice: a light copy nudged 1.3 units down at
   38% opacity, then an ink copy at 18% — an impression in the surface rather than a drawing on
   it. Motifs are open line-work with no fill, and stay ~2 units clear of the cell's bottom edge
   so the nudge never clips at a cell boundary. Line-based motifs (wheat furrows, brick courses)
   run past the cell edges so they tile continuously.
3. **Centre lift.** A white radial at 26% → 0, centred on the hex in `userSpaceOnUse` so it stays
   put under rotation. It fades the texture out exactly where the title banner (27–46% of the
   tile) and the number token (centred at 68%) sit — that's what keeps them legible without
   plating anything.
4. **Edge shade.** An ink radial, 0 out to 52% then up to 14%. Circular, same reason.
5. **Border.** The same hexagon scaled 0.928 about its centre, stroked ink at 30% / 2.4 units.
   That factor puts the stroke just inside the crop (the visible edge is at 0.943), so the
   border is fully drawn on every tile instead of half-eaten by the clip.

The crest on a content tile goes between 4 and 5, centred at `(100, 42)` and about 32 units
across — the gap between the top point and the title banner. Same two-pass emboss, one step
darker (ink at 58%).

**Safe zones**, in viewBox units: `y` 65–107 full width is the title banner, and `y` 124–186
between `x` 69 and 131 is the number token. Keep anything with structure out of both.

Lighting is deliberately radial rather than directional: three of the twelve filler slots get a
60/120/180° rotation each session, and a top-light gradient would rotate with them.

### `tokens/` — 10 number tokens

`token-2` through `token-12`, no 7. Pip count is `6 − |7 − n|`, matching the real game. Six and
eight render in red with five pips.

**Board token assignment deliberately deviates from `SPEC.md` §2** (which repeats 6 and 8): every
content tile now has a unique token so a dice roll can unambiguously auto-open one section. See
`src/data.js`'s `TILES` array for the current mapping and the reasoning in its comment.

### `pieces/`

- `settlement.svg` — timeline milestone
- `city.svg` — full-time role (AAOI, Vanguard)
- `road.svg` — timeline segment
- `road-ghost.svg` — dashed, for the unbuilt segment to graduation
- `robber.svg` — sits on a random filler tile each load, movable after rolling a 7
- `port.svg` — coastal external-link marker
- `label-banner.svg` — hand-wobbled ribbon behind each content tile's visible title (added in the
  Vite rebuild — not part of the original SPEC.md asset list)

### `cards/`

- `card-brick.svg`, `card-wheat.svg`, `card-wood.svg`, `card-sheep.svg`, `card-ore.svg` — the
  resource hand. Each is one content card (wood = a project, wheat = an experience, brick = a
  class, ore = a skill, sheep = a fun fact); the category caption is overlaid as HTML text near
  the foot of the blank card body, and the card is also the face that flips over when clicked —
  so the art wants a clean lower third and a readable back-of-card silhouette.
  Wood and wheat cards are the same entries as the Projects tile and the road (see
  `content/projects.md` and `content/experience.md`); brick, ore and sheep are their own.
- `card-dev-back.svg` — development card deck (front face while unflipped)
- `bonus-longest-road.svg` — REU Research Award, AWS certification, ML Audio publication
- `bonus-largest-army.svg` — FTC Robotics State Control/Software Award, 2nd at RoboTech

### `textures/paper.svg`

Tileable paper grain, applied as the page background. Replace with a scan of your actual paper —
this single swap does more for the handmade feel than any other asset.

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

Those six are the **accent** values, and they're what `RESOURCE_COLORS` in `src/data.js` hands to
`--accent` for a panel's header band and the mobile section chips — small areas that want the
saturation. The hexes themselves are large areas that sit under text, so they use a desaturated
**surface** set instead, baked into the tile SVGs:

```
brick   #CE9A72
wheat   #E3C075
wood    #7E9670
sheep   #BCC98C
ore     #A6AEB6
desert  #DED0AB
```

Same hue and the same reading order, roughly two steps lighter and flatter. They're opaque — the
old tiles were 55% over the sand coastline, which made a tile's colour depend on what happened to
be behind it.

## Fonts

The site asks for Caveat / Patrick Hand (Google Fonts) and falls back to a system script face.
For the real thing, run your own handwriting through [Calligraphr](https://calligraphr.com) and
self-host the result.
