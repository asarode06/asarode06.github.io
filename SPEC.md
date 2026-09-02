# Catan Portfolio — Build Spec

A personal portfolio site laid out as a hand-drawn Catan board. Six content tiles scattered
across a 19-hex island, a road chain carrying the work timeline, and Catan's own visual
grammar doing the navigation.

Target: shippable in three days with no prior design experience.

---

## 1. Core concept

The board is a **category map**, not a project list. Tiles are stable sections that never
change. Everything that grows over time — new jobs, new projects — grows *inside* a modal or
*along* the road, never by adding tiles.

Three layers of meaning, all readable by anyone who's played Catan and invisible to everyone
else:

| Catan element | Portfolio meaning |
|---|---|
| Number token on a tile | This tile is clickable |
| Roads + settlements | Work timeline, west to east |
| Cities vs settlements | Full-time roles vs shorter stints |
| Ports on the coast | External links |
| Resource cards in hand | Tech stack |
| Longest Road / Largest Army | Awards and certifications |
| Development card deck | Random fun facts |
| The robber | Sits on unclaimed land |
| Desert | The joke tile |

---

## 2. Board layout

Standard 19-hex island, pointy-top, rows of **3-4-5-4-3**.

### The six content tiles

Scattered across all five rows, both halves of the board, no two sharing an edge. This is
deliberate — it reads as a dealt board rather than a nav bar bent into hexes, and it forces
visitors to actually scan.

| Tile | Resource | Token | Row |
|---|---|---|---|
| Education | Brick | 5 | Row 1, left |
| Desert | — | none | Row 1, right |
| Research | Wheat | 6 | Row 2, right |
| Resume | Brick | 8 | Row 3, far left |
| About me | Sheep | 8 | Row 3, center |
| Projects | Wood | 6 | Row 4, right |
| Skills | Ore | 9 | Row 5, left |

**Skills is the only ore tile on the entire board.** Filler tiles use brick, wheat, wood, and
sheep only. That makes the single mountain a landmark.

**About me sits dead center**, directly under the road's midpoint. It's the hub and the first
place the eye lands.

### The twelve filler tiles

Random brick / wheat / wood / sheep. No labels, no tokens, no modals, not clickable.

- Draw **one** tile per resource type. Reuse each three times, rotated 60°/120°/180° and
  mirrored so they don't read as copy-paste.
- Randomize which filler lands where on page load, seeded so it's stable within a session.
- **Never randomize the six content tiles.** Their fixed positions are what repeat visitors
  remember.
- Hover shows a small "unclaimed" tooltip. Click does nothing.
- The robber sits on a random filler tile each load. Gives the dead space a reason to exist.

---

## 3. The road timeline

The centerpiece. A zigzag chain of roads and settlements running west to east across the
middle band of the board, along the upper edges of the row-3 hexes.

Six markers, chronological:

| # | Milestone | Dates | Piece |
|---|---|---|---|
| 1 | Urban Audio Sensing Lab | Dec 2024 – May 2026 | Settlement |
| 2 | AI Makerspace Nexus | Aug 2025 – Dec 2025 | Settlement |
| 3 | Bits of Good: Juno | Jan 2026 – May 2026 | Settlement |
| 4 | Applied Optoelectronics | May 2026 – Aug 2026 | **City** |
| 5 | Vanguard | Sep 2026 – Apr 2027 | **City** |
| 6 | Graduation | May 2028 | Ghosted outline |

Three details that make it land:

**Settlements are two vertices apart.** That's the real Catan placement rule, and it produces
the zigzag naturally. Players will register the board as legal without knowing why.

**Cities mark full-time industry roles.** Same ranking signal the number tokens give, but on
the thing that actually deserves ranking.

**The last segment is dashed and its settlement is a hollow outline.** Unbuilt road —
graduation hasn't happened. Instantly legible to anyone who's played.

### Interaction

- Hover a settlement → tooltip with title and dates
- Click a settlement → full modal (bullets, stack, links)
- Hover a road segment → highlights the span, shows duration
- Modals have prev/next to walk the timeline end to end
- The Longest Road bonus card sits at the east end of the chain

**This is the only part of the site that grows.** New role, new settlement, extend the road
east. Tiles stay untouched.

---

## 4. Board chrome

Everything outside the hexes.

**Ports on the coastline** — the only external links, so visitors learn "coast = leaves the
site."

- GitHub (`asarode06`)
- LinkedIn
- Email
- Resume PDF download
- arXiv paper

**Top-left — Trade button.** Opens the contact form. The only chrome element that opens a form
rather than leaving the site.

**Top-right — dice.** Click to roll 2d6; tiles with that token pulse. Roll a 7 and the robber
becomes draggable. Small roll counter.

**Left edge — the two bonus cards.** Drawn larger than dev cards, styled as real Catan bonus
cards.

- *Largest Army* — things you beat other people at: FTC Robotics State Control/Software Award,
  2nd at RoboTech Hackathon
- *Longest Road* — the sustained stuff: REU Research Award, AWS Certified Cloud Practitioner,
  and the arXiv publication

**Right edge — development card deck.** Click to flip a random fun fact. Include a real Knight
card, a Victory Point card, and a Monopoly card that says you have too many side projects.

**Bottom edge — hand of resource cards.** Tech stack, grouped by resource:

- Wood — Python, C++, TypeScript, JavaScript, Java
- Ore — Kubernetes, Docker, AWS, GCP, Git
- Wheat — PyTorch, LangChain, Pandas, NumPy
- Brick — PostgreSQL, MongoDB, Redis
- Sheep — React, Next.js, SvelteKit, FastAPI

Hover to fan out. Clicking a card highlights every tile that uses it — genuinely useful
navigation disguised as a gimmick.

**Fixed corner — plain "Resume (PDF)" link.** Non-negotiable. Bypasses the entire board for
recruiters who won't play along.

---

## 5. Tile contents

**Education** — Georgia Tech, Intelligence + Systems & Architecture threads, GPA, expected
graduation May 2028, core coursework list.

**Resume** — Embedded PDF preview at top, prominent download button, then a short highlights
strip: GPA, threads, graduation date, and the three or four numbers worth scanning in five
seconds. Don't retype the resume as HTML — the PDF is the artifact, the page is the frame.

**Research** — Urban Audio Sensing Lab work and the arXiv paper
(*Audio-Based Pedestrian Detection in the Presence of Vehicular Noise*, arXiv:2509.19295).
Abstract, method summary, link.

**About me** — Two sections separated by a rule. Professional intro up top; personal below —
hobbies, Catan, and an explanation of the site's conceit. That last part belongs here because
it's the one place someone would look for it.

**Projects** — A card grid *inside* the modal. Cipher Arena, Gesture Control, SustainaView,
Basana. Adding a project is a data entry, not a board change. Clicking a card opens a detail
view in place with a back arrow.

**Skills** — Full stack, grouped, mirroring the resource-card categories.

**Desert** — The joke. Click it seven times for something dumb.

---

## 6. Modal spec

Keep every modal identically structured so they feel like a system.

```
┌─────────────────────────────────────┐
│ [hex icon] [token]   Title      [×] │  ← header strip in tile's resource color
├─────────────────────────────────────┤
│ Date range (if applicable)          │
│ One-line summary                    │
│                                     │
│ • 3–4 bullets                       │
│                                     │
│ [stack chips as mini resource cards]│
│ [links: repo, demo, paper]          │
├─────────────────────────────────────┤
│ ← prev tile          next tile →    │
└─────────────────────────────────────┘
```

**Two layers maximum, never three.**

- Layer 1 — tile modal
- Layer 2 — only Projects and Research have one (card grid → detail view, with back arrow)

**URL hashes go two deep:** `#projects` and `#projects/cipher-arena`. Browser back works, and
you can send a recruiter a direct link to a single project.

Use native `<dialog>` with `showModal()` — you get ESC-to-close, focus trapping, and a backdrop
for free. Arrow keys move between adjacent hexes.

---

## 7. Making the art

You don't need drawing skill. You need consistency.

### The rules that matter more than talent

1. **Draw everything in one sitting with one pen.** Consistent line weight is 80% of why
   drawings look professional. Micron 05 or a fine Sharpie.
2. **Pick six colors and stop.** Too many colors is the second-biggest tell.
3. **Draw at 4× final size and scale down.** Downscaling averages away shaky lines. This is the
   single biggest reason beginner art looks bad — people draw at final size and every flaw
   survives.
4. **Flat fills, wobbly outlines, no shading.** Cross-hatching if you want texture. Avoid
   gradients and anything implying rendering skill.
5. **Silhouettes are your friend.** A solid black sheep shape reads instantly and has no
   interior detail to get wrong.

### Option A — paper (preferred)

Real pen wobble reads as authentic; beginner stylus wobble reads as a mistake.

1. Draw on paper, one pen, one sitting
2. Scan at 600dpi or photograph in flat daylight
3. [Photopea](https://photopea.com) — threshold lines to clean black, knock out white
   background, export transparent PNG
4. Scan a **blank sheet of the same paper** and tile it as the page background. This single
   asset does more for "handmade" than any of your drawings.

### Option B — digital, no stylus

- **Excalidraw** — built on rough.js, so every stroke comes out deliberately sketchy. The
  hand-drawn look is applied automatically rather than depending on your hand. Works with
  mouse. Exports SVG.
- **Krita** — free desktop paint app with a brush stabilizer. Turn it up high; it smooths
  finger-on-touchscreen input in real time.
- **Your phone** — finger-on-phone is often more controllable than finger-on-laptop because
  you're bracing against a held device.
- **A $8 rubber-tip capacitive stylus** arrives next day and is the highest-leverage purchase
  in this project.

### Option C — rough.js in code

Call rough.js directly to render sketchy hexagons, roads, and settlements at runtime with a
`roughness` parameter. No drawing at all, deterministic-random wobble. Gets you all board
geometry and outlines for free — you'd only need to draw the icons inside each tile.

### Two shortcuts for icons

- **Trace something.** Drop a reference photo into a bottom layer at low opacity and draw over
  it. Removes the hardest part — knowing what shape a thing is.
- **Silhouettes only.** Solid shape plus wobbly outline is a complete, coherent style.

### Asset list — 11 drawings total

**Six unique hero tiles** (distinct scenes, not resource variants):

| Tile | Drawing |
|---|---|
| Education | Hillside with Tech Tower, or stacked books as the brick pile |
| Resume | A scroll or pinned document; quarry cutting it into shape |
| Research | Fields where the furrow lines are a spectrogram waveform |
| About me | Pasture, one sheep looking straight at the viewer. Center tile — make it the friendliest drawing. |
| Projects | Forest with a few trees already felled and stacked |
| Skills | The only mountain on the board. Play it up — most detailed tile. |

**Four filler tiles** — one each of brick, wheat, wood, sheep.

**One desert.**

Plus small pieces: settlement, city, road segment, number token, robber, port, resource card
back, dev card back, two bonus cards, paper background texture.

### Consistency warning

Mixing an Excalidraw hex with a Krita icon will look off even if both are individually fine.
Pick one tool and stay in it.

---

## 8. Tech stack

Keep the frontend boring. This is fundamentally eight modals, not an application.

- **Vanilla HTML/CSS/JS + Vite** — no dependency churn, no React state juggling
- **Native `<dialog>`** for modals
- **rough.js** (optional) for generated sketchy geometry
- **Squoosh** → WebP for all art. Scanned 600dpi PNGs are multiple MB each otherwise.
- **Vercel or GitHub Pages** — whichever you'll actually finish

Store tiles as a data array and render in a loop. Never hand-place 19 divs.

```js
const TILES = [
  { id: 'education', type: 'brick', token: 5,  row: 0, col: 0, title: 'Education' },
  { id: 'desert',    type: 'desert', token: null, row: 0, col: 2, title: 'Desert' },
  { id: 'research',  type: 'wheat', token: 6,  row: 1, col: 3, title: 'Research' },
  { id: 'resume',    type: 'brick', token: 8,  row: 2, col: 0, title: 'Resume' },
  { id: 'about',     type: 'sheep', token: 8,  row: 2, col: 2, title: 'About me' },
  { id: 'projects',  type: 'wood',  token: 6,  row: 3, col: 3, title: 'Projects' },
  { id: 'skills',    type: 'ore',   token: 9,  row: 4, col: 0, title: 'Skills' },
];
```

---

## 9. Board geometry

Pointy-top hexes. For a hex of width `w`:

```
height             = w * 1.1547
horizontal step    = w            (within a row)
vertical step      = height * 0.75 (between rows)
row offset         = w / 2        (for 4-tile rows relative to 5-tile row)
```

Rows have 3, 4, 5, 4, 3 tiles. Put each tile in a `position: absolute` div inside a
`position: relative` container and compute x/y from row/col. Ten lines of JS.

### Two gotchas that will eat an hour each

**Transparent PNGs have square bounding boxes**, so hexes overlap and clicks land on the wrong
tile. Fix with clip-path on the tile wrapper — it clips pointer events too:

```css
clip-path: polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%);
```

**Hand-drawn hexes won't tessellate perfectly.** Lean in — draw them slightly oversized so
edges overlap, and rotate each tile a random ±1.5°.

---

## 10. Mobile

Below ~700px, drop the board entirely. Don't try to preserve it — a 5-wide hex grid at 375px
makes each tile ~65px and unreadable.

- Same 19 hexes as a vertical single-column stack
- Grouped by resource with the type name as a section header
- Ports become a link row at top
- Resource hand becomes a horizontal scroll strip
- Dev cards become a single button
- The road becomes a normal vertical timeline
- Tapping a hex opens the same modal, full-screen

---

## 11. Non-negotiables

**Recruiters.** Some will open this on a phone and some won't know what Catan is. The fixed
"Resume (PDF)" corner link is what makes the whole conceit safe to attempt.

**Trademark.** Catan's board layout and hex mechanics are fine to riff on; the wordmark and
their specific tile illustrations are not. Draw your own art, keep "Settlers of Catan" out of
your title and metadata, and you're clear.

**Accessibility.** Respect `prefers-reduced-motion`. Give every tile a real `aria-label`. Ten
minutes of work.

---

## 12. Three-day schedule

**Day 1 — art**
Sketch the tile-to-section mapping on paper. Draw and scan all 11 tile assets plus the small
pieces. Clean up in Photopea, export WebP.

**Day 2 — build**
Board geometry and tile rendering. Native `<dialog>` modals. All content written and in place.
Road chain with settlements and cities.

**Day 3 — polish**
Ports, dice, resource hand, robber, bonus cards, dev cards, desert egg. Mobile fallback.
Accessibility pass. Deploy.

### Ship order if you run out of time

1. Board + modals + fixed resume link ← **this alone is the whole idea**
2. Road timeline
3. Ports
4. Dice
5. Resource hand
6. Bonus cards
7. Robber
8. Dev cards
9. Desert egg

Everything from #5 down is optional.
