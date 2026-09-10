# The time machine — a shelved feature, written down

**Status: not built.** This was designed, partly implemented, and then rolled back. Nothing in
this document is live. It is kept so the idea and its decisions survive, and so a future attempt
starts from a plan rather than from scratch.

The content layer it needs is *already in the repo* — see "What already exists" at the bottom.
That was deliberate: the dates are worth having on their own.

---

## The problem it solves

Every settlement and city on the road is standing the moment the page loads. A visitor starts at
9 of the 10 points needed and one Library card ends the game. There is no scarcity, because
there is no **time** — the board shows a finished career all at once.

The time machine adds that missing axis. A button opens a slider running from the month the first
role started (Dec 2024) to a little past graduation (May 2028). Travel to a month and the board
becomes what it was then:

- roles that hadn't started are dashed ghost rings instead of settlements and cities
- projects that didn't exist aren't in the wood deck
- classes not yet passed aren't in the brick deck
- skills not yet learned aren't in the ore deck
- the score falls to whatever was actually standing — in Dec 2024, a single settlement, one point

Ten becomes a long way off, and the only way to close the gap is to **build**: pay real Catan
costs for the settlements, cities and roads the future is going to put there anyway.

An era is a sandbox. Leaving the present snapshots it; returning restores it and throws away
everything done while away.

---

## Decisions already made

These were settled with the site's owner and should not be relitigated without reason.

| decision | choice |
| --- | --- |
| VP baseline | **9/10** in the present: 3 settlements + 2 cities = 7, plus Longest Road = 2 |
| Longest Road | held only while **5+ pieces** stand; it leaves its slot in the deep past, showing the same hollow dashed outline Largest Army uses before it's earned |
| Build costs | **real Catan**: settlement = wood+brick+wheat+sheep, city = 3 ore + 2 wheat, road = wood+brick |
| When you can build | **past only.** In the present and future everything is already built |
| Fun facts (sheep) | **exempt entirely** — no dates, never filtered, in the deck at every era. Also guarantees one deck is never empty, which keeps the deep past playable |
| Travel rule | present → era → present only. No era-to-era hops |
| Returning | discards the era outright: cards drawn, roads laid, pieces built |

### The graduation ending

Sliding to May 2028 builds the graduation settlement: 8 from pieces + 2 for Longest Road = **10,
an instant win**. This was judged deliberate and worth keeping — travelling to your own
graduation ending the game is the best thing the mechanic can do — and it costs nothing, since
coming home discards it.

---

## Architecture

### `src/timeline.js` — the only place a date is parsed

Turns authored text into an integer month index counted from Jan 2000, so nothing downstream ever
sees a string it has to understand:

- `parseMonth("Mar 2025")` — accepts the 3-letter abbreviation or the full name, with or without
  a trailing dot (`Aug. 2026` is what a pasted résumé gives you). **Must match one of them
  exactly**: matching on a 3-letter prefix reads a typo'd `Marchish 2025` as March and silently
  puts the entry in the wrong place on the board. This bug was written and caught during the
  first attempt — don't reintroduce it.
- `parseRange("Mar 2025 - Jun 2025")` → `{start, end}`; a single month gives `start === end`;
  en/em dashes accepted; `- Present` gives `end: Infinity`.
- `parseTerm("Fall 2025")` → the month the term **ended** (Dec), because that's when the class was
  earned. Fall→Dec, Spring→May, Summer→Aug.
- `formatMonth` / `formatShort` / `formatSpan` for display.
- `computeRange(starts)` — the slider's span, derived from content so adding an entry outside the
  current bounds moves the slider on its own.
- `presentMonth(range)` — read from `new Date()` and clamped into range, so the board ages by
  itself: a role starting next spring becomes a settlement that spring with nothing to edit.

A bad date must **throw**, naming the file and entry. The failure mode to avoid is a typo reading
as "never happened", which makes an entry vanish from its deck at every point on the timeline.

### `src/timemachine.js` — the slider, the trip, the state machine

```
        Dec 2024                                              May 2028
   ┌───────────────────────────────────────────────────────────────┐
   │   ●══════════════════●        ●═══════●          ◆ now        │  role bars, project/class pips
   │ ▏▏▏▎▏▏▏▎▏▏▏▎▏▏▏▎▏▏▏▎▏▏▏▎▏▏▏▎▏▏▏▎▏▏▏▎▏▏▏▎▏▏▏▎▏▏▏▎▏▏▏▎▏▏▏▎ │  month ticks, ▲ notch
   └───────────────────────────────────────────────────────────────┘
       2025          2026          2027          2028                 year labels
                     March 2025
              [ Travel to March 2025 ]
```

Three stacked strips share one percentage scale, so a month lands in the same column in all three.
Roles are **bars** (a role occupies time); projects and class completions are **pips**, coloured by
resource. Drag, click, arrow keys; PageUp/Down step a year, Home/End jump to the ends.

Screen-fixed button under Trade at top-left. Away from the present the button stops being a verb
and becomes a **readout** of the month you're in — the one thing you need on screen while the rest
of the board is quietly lying about the date.

**The trip**: scrim to near-black, the month readout winds past one month at a time, concentric
ripples expand from centre, and the board is swapped **at the darkest point** so the change is
never seen half-done. That's the whole reason it exists rather than re-rendering in place. ~1.6s.
Under `prefers-reduced-motion`, cut instead.

While away the slider is frozen and the only action is **Return to the present**, with a line
warning what will be discarded.

### `src/build.js` — spending cards on pieces

Buildable = road nodes that are rings *now* but real pieces *in the present*. Graduation is
therefore never buildable by hand: it isn't standing in the present either, so the only way to see
it is to slide past May 2028 and let it happen. What you get is what it becomes — no putting a
city where a settlement belongs.

A node you can afford gets a pulsing halo; one you can't stays visible but inert, because seeing
what you can't afford is what tells you which resource to go and rob. The refusal message must
distinguish **"you need one more wood"** from **"no project existed yet in Dec 2024"** — the second
is the interesting answer and it's the mechanic explaining itself.

Roads reuse the ghost-edge picker in `roadbuild.js`. The Road Building dev card keeps giving two
away, as in Catan; this is the paid path.

### The snapshot/restore contract

The one piece of design worth preserving above all else. Every stateful module exposes
**`snapshot()`** and **`restore(snap)`**, and **`main.js` is the only caller**, in one place, in
one order:

```
leaving  → snapshot cards/dev/roads/builder/victory, then set them all to the target month
returning → restore all five from that snapshot, discard the era
```

No other module knows the time machine exists. That is what makes "everything you did in 1806
stays in 1806" a property of the wiring rather than a list of things somebody has to remember to
undo.

Order matters when leaving:

```js
board.disarmRobber();
cards.setEra(month);      // fresh opening hand for that era
devCards.reshuffle();     // an era gets its own shuffle
roads.restore([]);
builder.setEra(month);
road.setEra(month, builder.builtByHand);
victory.reset(road.standing());
builder.refresh();
```

### Changes to existing modules

- **`cards.js`** — every deck read goes through an era-filtered `deckOf(resource)`, never `DECKS`
  directly, so rewinding genuinely removes cards from play. `setEra` deals the era's opening hand
  (the first card of each deck *that had happened*, preserving the "first entry is dealt" rule the
  content files document). Adds `holdings()`, `shortfall(cost)`, `spend(cost)` — spend newest-first
  so the strongest card of each deck is the last thing spent — and an `onHandChange` hook so build
  affordances restyle themselves.
- **`victory.js`** — `setPieces(standing)` replaces the constants; Longest Road is derived from
  the count and fires `onLongestRoad` so `chrome.js` can take the award card away.
- **`road.js`** — ghosting derived from the era; the solid/ghost split follows the last
  **contiguous** built piece, so a settlement bought out of order doesn't drag a road across a gap.
- **`chrome.js`** — `setBonus(id, held)` replacing `awardBonus`; both award cards use the same
  slot, and `locked:` in the content only decides which starts out held.
- **`experience.js`** — the showcase's road copy and its cards must be rebuilt **per open**, not
  once at construction, or they won't match the board underneath. And the board's road SVG must be
  passed as a **getter**, not an element: re-rendering replaces the node, and a captured reference
  goes stale, leaving the real road visible under the showcase copy.
- **`mobile.js`** — no time machine below 780px, alongside the dice, robber and VP chip that are
  already absent. Date chips still show.

### Dates, shown quietly

A `.when` chip, one step lighter than its neighbours: appended to a card panel's eyebrow
(`Project · Mar 2025 – Jun 2025`), in each Projects grid item, and under the title in a hand
card's hover tip.

---

## What already exists in the repo

The content layer was written and **kept** through the rollback. It is inert but correct:

- `content/projects.md` — every project carries `dates:`; Project Euler was removed.
- `content/resource-cards.md` — brick cards carry `term:` (the semester they ended);
  ore cards carry `from:` (the id of the role/project the skill came from, so the date is derived
  and can't drift); four class cards were added to cover the résumé's core-course list, with
  placeholder prose still to be replaced.
- `content/experience.md` — graduation carries `dates: May 2028` like everything else, but its
  `piece:` was put **back to `ghost`** when the code was rolled back, because the derived version
  needs code that no longer exists (see "Before restarting").

The dates, from the résumé and transcript:

| thing | when |
| --- | --- |
| Urban Audio Sensing Lab | Dec 2024 – May 2026 (settlement) |
| AI Makerspace Nexus | Aug 2025 – Dec 2025 (settlement) |
| Bits of Good: Juno | Jan 2026 – May 2026 (settlement) |
| Applied Optoelectronics | May 2026 – Aug 2026 (city) |
| Vanguard | Sep 2026 – Apr 2027 (city) |
| Graduation | May 2028 |
| Cipher Arena | Mar 2025 – Jun 2025 |
| Edwin IO (résumé: "Gesture Control") | Jun 2025 – Jul 2025 |
| LockedOut | Mar 2025 |
| Inflation ETF Quant Project | May 2025 |
| SustainaView | Sep 2025 |
| Object Oriented Programming (CS 1331) | Fall 2024 |
| Data Structures & Algorithms (CS 1332) | Spring 2025 |
| Design & Analysis of Algorithms (CS 3510) | Fall 2025 |
| Artificial Intelligence (CS 3600) | Fall 2025 |
| Low Level Programming (CS 2110) | Fall 2025 |
| Systems & Networks (CS 2200) | Spring 2026 |
| Machine Learning (CS 4641) | Spring 2026 |
| PyTorch | from `uasl` |
| Docker | from `cipher-arena` |
| Kubernetes, Redis | from `aaoi` |

> **Note:** the résumé also lists Gesture Control, which this site calls Edwin IO. Same project.

---

## Before restarting

Two things to know.

**1. Ghosting is currently authored, not derived.** `piece: ghost` on graduation is special-cased
in five places — `road.js` (`PIECE_SIZE.ghost` and the dashed-ring branch), `experience.js`,
`mobile.js`, `modal.js`, and `PIECE_VP` in `data.js`. Deriving it from `dates` instead deletes all
five special cases and makes *every* piece ghostable for free, which is why the first attempt did
it that way. Doing so means changing graduation back to `piece: settlement` — and until the code
lands, that change alone makes graduation render as an ordinary settlement worth a point, which
puts the score at 10 on load.

**2. `id` slugs.** Ore cards point at projects by id, and most projects have no explicit `id:` —
`plugins/content.js` slugifies the title (`Cipher Arena` → `cipher-arena`). Any `from:` must
resolve against that, and should throw at startup listing the valid ids if it doesn't.

## Verification, when it is built

1. `npm run build` — proves every `dates:`, `term:` and `from:` key parses.
2. **The present must be pixel-identical to today**: 5 pieces, graduation dashed, 9 points, one
   card per resource. This is the regression that matters most.
3. Dec 2024: one settlement, five rings, 1 point, no wood card, Longest Road slot empty. Try to
   build — it should refuse and say wood doesn't exist yet.
4. Sep 2025: four projects in wood, two classes in brick, two skills in ore. Rob, draw, buy a
   road, build `juno`.
5. Return — every one of those is gone and the board matches step 2. Travel again to confirm the
   cycle repeats.
6. May 2028: graduation builds, score hits 10, banner fires. Return: back to 9.
7. Below 780px: no button, date chips present, nothing throws.
8. `prefers-reduced-motion`: travel cuts rather than animates.
