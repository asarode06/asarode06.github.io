<!--
================================================================================
  EXTRAS — the smaller pieces of writing scattered around the board.
================================================================================

  Everything here needs a `type:` line saying what it is, because unlike the
  other content files this one holds several different kinds of thing.

    type: dev-card   one card in the development deck on the right of the board.
                     Drawing one turns it face up and *plays* it: it does
                     something to the board, then joins the pile of played cards
                     under the deck. See src/dev.js.
                     Keys: id (which effect it runs — `knight`,
                     `year-of-plenty`, `road-building`, `monopoly`, `library`;
                     src/dev.js has a handler per id and src/data.js's DEV_DECK
                     says how many copies are in the deck), title (the name on
                     the card), art (a filename in public/art/cards/, without
                     the .svg), and an optional banner (the line printed across
                     the top of the face, e.g. "1 Victory Point!").
                     Body: the card's rules text, as printed on the real Catan
                     card. Keep it to a couple of lines — the face is small and
                     does not scroll.
                     NOTE these five are not free-form flavour: each id is wired
                     to a mechanic, so renaming or removing one needs a matching
                     change in src/data.js and src/dev.js.

    type: bonus      one of the two award cards on the left of the board.
                     Keys: title, art (a filename in public/art/cards/,
                     without the .svg), and optionally `locked: yes` — a locked
                     card is not shown until it is earned in play, leaving a
                     hollow outlined slot in its place (Largest Army is earned
                     with 3 knights).
                     Body: a bullet list of what you won.

    type: trade      the Trade / contact modal. There should be exactly one.
                     Keys: title, subtitle.
                     Body: shown above the form. The form itself and the list of
                     contact links are wired up in src/data.js, since those are
                     URLs rather than writing.

  Bodies are markdown. Add an award by copying a block.
================================================================================
-->

+++
type: dev-card
id: knight
title: Knight
art: dev-knight
+++

Move the robber. Steal 1 resource from the owner of a settlement or city
adjacent to the robber's new hex.

+++
type: dev-card
id: year-of-plenty
title: Year of Plenty
art: dev-year-of-plenty
+++

Take any 2 resources from the bank. Add them to your hand. They can be 2 of the
same or 2 different resources.

+++
type: dev-card
id: road-building
title: Road Building
art: dev-road-building
+++

Place 2 new roads as if you had just built them.

+++
type: dev-card
id: monopoly
title: Monopoly
art: dev-monopoly
+++

When you play this card, announce 1 type of resource. All other players must
give you all of their resources of that type.

+++
type: dev-card
id: library
title: Library
art: dev-library
banner: 1 Victory Point!
+++

Reveal this card on your turn if, with it, you reach the number of points
required for victory.

+++
type: bonus
id: longest-road
title: Longest Road
art: bonus-longest-road
+++

- REU Research Award
- AWS Certified Cloud Practitioner
- ML Audio publication

+++
type: bonus
id: largest-army
title: Largest Army
art: bonus-largest-army
locked: yes
+++

- 2nd place, RoboTech Hackathon
- FTC Robotics: State Control/Software Award

+++
type: trade
id: trade
title: Trade
subtitle: Send a message, or just reach out directly.
+++

Hey, wanna trade with me? I can give you 1 ore for 4 brick! I know the bank is offering you the same thing but come onnnnn. My ore is shinier trust.
