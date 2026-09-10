# Catan Portfolio

A personal portfolio laid out as a hand-drawn Catan-style hex board. Full concept and content
spec: `SPEC.md`. Art asset inventory and swap plan: `ART.md`. `TIME_MACHINE.md` is a *shelved*
feature — designed, partly built, rolled back — kept because its content layer (the `dates:`,
`term:` and `from:` keys in `content/`) is still in the repo and inert.

## Stack

Vanilla HTML/CSS/JS + Vite, no framework. Native `<dialog>` for modals. Deploys to GitHub Pages
(`asarode06.github.io`, a user-page repo — served from the domain root, no base path).

## Commands

```
npm install       # once
npm run dev        # dev server with hot reload
npm run build       # production build to dist/
npm run preview      # serve the production build locally
```

Pushing to `main` deploys automatically via `.github/workflows/deploy.yml`. One-time manual step:
in the repo's Settings → Pages, set "Source" to "GitHub Actions".

## Structure

- `src/data.js` — board *structure* only: the hex grid's shape, which resource each tile is made
  of, its number token, the colour palette, the development deck's composition and the victory-
  point values, and the handful of outbound URLs. No prose.
- `content/*.md` — every word on the site. See "Where the writing lives" below.
- `plugins/content.js` — the Vite plugin that parses `content/*.md` at build time and exposes it
  as the virtual module `virtual:content`. No markdown parser reaches the browser.
- `plugins/images.js` — the Vite plugin that renders every photo under `public/experiences/` and
  `public/projects/` to a ladder of WebP widths (320/640/1024/1600, capped at the original) with
  `sharp`, and hands `content.js` a `srcset` for each. Each surface supplies its own `sizes` — a
  print in a pile says `150px`, the viewer says `min(70vw, 880px)` — so the browser fetches a
  rung that matches what it's about to paint. That's the difference between a five-photo pile
  costing 9MB and costing 62KB. Derivatives are content-hashed into `public/_img/` (gitignored,
  so dev and build serve them the same way with no middleware) and the source photos are dropped
  from `dist/` at the end, since nothing on the page points at them any more. A cold build spends
  ~11s here; after that it's cached. **Drop originals in as they come off the camera — resizing
  or compressing them by hand only takes quality away from what this generates.**
- `src/content.js` — assembles that raw parse into what the render modules consume (`CONTENT`,
  `PROJECTS`, `TIMELINE`, `DECKS`, `DEV_CARDS`, `BONUS_CARDS`, `TRADE`, `DESERT_LINES`). Import
  written content from here, never from `data.js`.
- `src/geometry.js` — hex math (row/col → x/y) and the world padding constant.
- `src/rng.js` — seeded PRNG so filler-tile art/rotation and robber placement are stable within a
  browser tab but reshuffle on a fresh one.
- `src/camera.js` — the pan/zoom controller. The page never scrolls normally on desktop
  (`html,body{overflow:hidden}`); wheel/drag/keyboard input moves a CSS transform on `#world`
  instead. Mobile (<780px) never mounts this — see `src/mobile.js`.
- `src/board.js` / `src/road.js` / `src/chrome.js` — render the hexes+tokens+robber, the road
  timeline SVG overlay, and the world-space chrome (ports, bonus cards, dev deck, resource hand)
  into `#world`.
- `src/hud.js` — screen-fixed HUD: Trade button, dice roller, Resume-PDF corner link. Rolling a
  content tile's (now-unique) token flies the camera to it and auto-opens its modal.
- `src/modal.js` — the shared `<dialog>` for every tile/milestone/project-detail/contact/desert
  view, plus hash routing (`#projects`, `#projects/cipher-arena`) and arrow-key spatial nav.
  `main.js` calls `modal.route()` last, once everything a deep-linked hash might drive exists.
  Opening it grows the panel out of whatever was clicked — the hex, the road piece, the Trade
  button — and closing sinks it back; `originFor()` is what finds that element, and prev/next on
  an already-open modal settles in place instead of flying back out to the board.
- `src/experience.js` — the Experience tile is the one content tile with no modal. Clicking it
  lifts a copy of the road chain off the board (built by the same `buildRoadSvg` in `road.js`, so
  it starts pixel-identical to the real one), grows and lowers it while the board dims and the
  camera eases back, then floats a summary card above each settlement/city. Clicking a card
  expands it in place into a wide detail panel — that's where long-form text, photos and links
  go, since a row of six is height-limited by definition. Card heights are fitted to a budget
  measured against the real title height, so the row can never grow up into it; on a short window
  the collapsed cards drop their bullets (`tight`) and the subtitle is hidden (`compact`). Below
  780px there's no board to lift from, so it scrolls to the timeline section instead.
- `src/cards.js` — the resource hand and the card-flip panel. Owns the five decks, which cards
  the visitor holds, the robber payouts, and the flip: clicking a card turns it over in place and
  the same box then grows into a centred reading panel over a darkened board (closing runs it
  backwards). The panel is a plain overlay, not the shared `<dialog>` — `.rc-panel` is sized once
  by JS and clipped by the animating box, so the text is revealed rather than reflowed each
  frame. Hashes are `#card/<id>` and route through `modal.js` like everything else.
- `src/photos.js` — photos, everywhere they appear. A run of images in any authored prose is
  dealt out by `plugins/content.js` as a `.photo-stack`: a pile of same-size prints tossed at
  angles decided at build time from a hash of each file's own URL, so a pile is stable but never
  looks patterned. Hovering fans the pile; clicking a print opens this module's viewer, which
  lays the pile out as a collage — the chosen print centred, its neighbours peeking past the
  screen edges, click an edge (or arrow-key, or swipe) to bring it in. One delegated capture
  listener on `document` is the whole wiring: no surface that shows prose knows the viewer
  exists. It's a `<dialog>` because the tile modal is one, and only a dialog stacks above the
  browser's top layer. Nothing is ever captioned.
- `src/dev.js` — the development deck, and the one place on the site where clicking something
  changes the *game* rather than opening writing. A draw is a play: the top card turns over at the
  pile showing its art and its real Catan rules text, then runs its effect — Knight arms the
  robber (the same `board.armRobber` a rolled 7 uses) and three of them win Largest Army, Year of
  Plenty and Monopoly open the shared bank picker, Road Building hands off to `roadbuild.js`,
  Library is a victory point. Once the effect resolves the card drops into a pile below the deck
  and stays face-up for the session, grouped by type and overlapping exactly the way the resource
  hand stacks one resource. `DEV_DECK` in `data.js` is the real 25-card Catan mix and it does not
  reshuffle — it empties. `chrome.js` only decides where the pile sits, the same split `cards.js`
  has with the hand.
- `src/victory.js` — the score, bottom-left. Most of it is standing on the board before anything
  is clicked: the road's three settlements and two cities score 1 and 2 apiece, and Longest Road
  is 2 more, so a visitor starts at 9 of 10 and the deck closes the gap. Reaching the target is a
  celebration, not an ending — the banner is dismissible, nothing is disabled, and the counter
  keeps climbing past 10 for the rest of the session.
- `src/roadbuild.js` — the free roads the Road Building card places, under Catan's real
  placement rule: a road has to touch your own network at one of its ends, so the dashed ghosts
  are the frontier of the red road rather than all 64 free edges, and placing the first of the
  two free roads extends that frontier for the second. `geometry.boardEdges()` is the 72 lines a
  road could sit on across the 19 hexes, keyed by the shared `edgeKey`/`nodeKey` there; both what
  the career road along row 2 occupies and which intersections it reaches are worked out here
  rather than there, since both are facts about the session and not the shape of the board. All
  six settlements and cities sit on that chain, which is why seeding the network from it needs no
  separate piece list. The chain's dashed tail past `SOLID_END` is the one place the game and the
  writing touch: those two segments *are* buildable, so a visitor who draws Road Building can
  pave the road to graduation, and it's reachable rather than free, since the last real city
  stands on `SOLID_END` and the far segment only opens once the near one is paved. `road.js`
  draws that tail as one keyed line per segment for exactly this reason, and hands over
  `ghostEls` so a paved segment's dashes can be retired: the career road paints above the build
  layer, so dashes left showing through a finished road would read as a rendering slip. The
  pieces are decoration, nothing scores them.
- `src/mobile.js` — the <780px fallback: normal scrolling page, 19 tiles grouped by resource.
  No dice and no robber down here, so `main.js` deals the whole deck face-up instead of gating
  cards behind a mechanic that doesn't exist at this width.

## One panel, three entrances

The three detail surfaces — the tile `<dialog>`, the panel a resource card flips into, and an
Experience card once it's expanded — deliberately look identical once they land. They share the
`/* shared panel chrome */` section of `style.css`: `.panel` for the surface, then `.panel-head`
(icon · eyebrow · title · subtitle · round close), `.panel-body` for prose, `.panel-foot` for the
strip along the bottom. All three fill the same slots.

Two knobs are per-surface. `--accent` tints the header band (the tile's resource, the card's
resource, player-red for the road) and is deliberately **not** defined at `:root`, so anything
that doesn't set it falls back rather than tinting the wrong thing. `--type-scale` multiplies
every size in the shared rules; it defaults to 1 and only `experience.js` moves it, which is how
a collapsed Experience teaser is the same design at ~72% and expanding it just grows to 1.

What each surface's own section owns is geometry and its entrance animation, and nothing else —
if you find yourself restating a colour, a border or a type size there, it belongs in the shared
section instead.

## Where the writing lives

Every word on the site is authored as markdown in `content/`, parsed at build time, and shipped
as pre-rendered HTML strings. Each file's own header comment is its full reference — read that
before editing it.

| file | what it feeds |
| --- | --- |
| `tiles.md` | the modal behind each of the seven board hexes |
| `projects.md` | the Projects tile's grid **and** the wood deck |
| `experience.md` | the road, the Experience showcase, each piece's modal **and** the wheat deck |
| `resource-cards.md` | the brick, ore and sheep decks |
| `extras.md` | dev cards, award cards, the Trade blurb |

The five dev cards in `extras.md` are the one place where the writing is *not* free-form: each
entry's `id` is wired to an effect in `src/dev.js` and a copy count in `DEV_DECK`, so renaming or
removing one needs a matching change in both. The bodies are the rules text printed on the real
Catan cards. An award card marked `locked: yes` (Largest Army) stays a hollow outlined slot on the
board until it's earned in play.

The format is one `+++` fenced header per entry, then markdown:

```
+++
title: Cipher Arena
subtitle: Real-time multiplayer cryptogram game
stack: JavaScript, TypeScript
links:
  - Source on GitHub | https://github.com/asarode06
+++

The teaser everyone sees.

<!--more-->

The long-form half, shown wherever there's room for it.
```

Frontmatter values are strings, except a bare `key:` which opens an indented `- item` list.
`<!--more-->` folds the body: views with a height limit (a collapsed showcase card) show only
what's above it, views without one show the lot. A malformed entry fails the build with the file
and line rather than silently vanishing.

**Projects and roles are written once.** A wood card *is* a project and a wheat card *is* a role
— the same entry, relabelled — so the panel you reach by flipping a card and the one you reach
through the Projects tile or the road are the same words by construction, not by being kept in
sync. Order matters in those two files: it sets the Projects grid order and the road's
left-to-right order, and the first entry is the card dealt into the starting hand (the rest are
earned by rolling a 7 and robbing a plain tile of that resource). `card: no` keeps an entry out
of its deck while leaving it on its tile.

Photos are linked as plain markdown images — `![Alt](/experiences/BitsOfGood/juno-poster.png)`.
Real photos, screenshots and documents live in `public/experiences/<role>/` and
`public/projects/<project>/` (that's what those folders are for: the `public/art/` tree is the
hand-drawn board art, these are the actual pictures); drawn art for a project or role still goes
in `public/art/projects/` or `public/art/experience/`. Photos in the first two are resized and
converted to WebP at build time by `plugins/images.js`, so put the full-size original in and let
the build worry about weight. A paragraph
that is nothing but images is dealt out as a *pile* of prints — see `src/photos.js`. Captions
don't exist anywhere on the site: a markdown title after the URL is dropped on the floor, and
anything a photo needs said about it belongs in the prose around it.

Adding a whole new collection works too — drop in `content/awards.md` and it appears as
`content.awards`, no plugin change needed; only `src/content.js` needs to know what to do with
it.

## Known follow-ups

- `public/resume/Akash_Sarode.pdf` doesn't exist yet — drop the real file there (the Resume tile,
  the fixed corner link, and one of the ports all point to it).
- `FORMSPREE_ENDPOINT` in `src/data.js` is a placeholder — sign up at formspree.io and swap in the
  real form id, or the Trade modal just shows a "not configured yet" fallback with plain links.
- Placeholder art in `public/art/pieces/`, `tokens/` and `cards/` is meant to be replaced with
  real scanned drawings — see `ART.md` for the swap plan. The tiles are *not* placeholders: they
  were redrawn as flat colour plus a quiet repeating texture, and `ART.md`'s "Tile design
  language" is the spec any new hex has to match.
- Most entries in `content/resource-cards.md` are marked *Placeholder content* in the body —
  the brick, ore and sheep decks need a real pass. `projects.md` and `experience.md` carry real
  material, with a couple of `*Placeholder*` paragraphs flagged inline.
