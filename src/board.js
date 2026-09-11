// Renders the 19 hexes (tokens, filler variety, robber, content-tile labels) into the world layer.
import { ROWS, TW, TH, WORLD_PAD, hexTopLeft, hexCenter, boardSize } from './geometry.js';
import { TILES, FILLER_TYPES } from './data.js';
import { getSessionRng, seededShuffle } from './rng.js';

const ROTATIONS = [0, 60, 120, 180];

// Deal the plain (unclaimed) hexes out across the resources as evenly as the slot count allows,
// then shuffle. Spreading rather than repeating a fixed count is what guarantees every resource
// — ore included — has at least one plain tile the robber can be dropped on, which is the only
// way to earn that resource's remaining cards. Whoever gets the leftover slots varies per seed.
export function buildFillerMultiset(slots, rng) {
  const base = Math.floor(slots / FILLER_TYPES.length);
  const extra = slots % FILLER_TYPES.length;
  const lucky = seededShuffle(FILLER_TYPES, rng).slice(0, extra);
  const pool = FILLER_TYPES.flatMap((type) =>
    Array(base + (lucky.includes(type) ? 1 : 0)).fill(type)
  );
  return seededShuffle(pool, rng);
}

export function renderBoard(worldEl, { onOpenTile, onDesertClick, onRobbed } = {}) {
  const boardEl = document.createElement('div');
  boardEl.className = 'board';
  boardEl.style.left = WORLD_PAD + 'px';
  boardEl.style.top = WORLD_PAD + 'px';
  // All children are position:absolute, so the board wouldn't otherwise get an intrinsic size —
  // the road-layer SVG (inset:0) and anything else sized off this box needs it set explicitly.
  const { width: boardW, height: boardH } = boardSize();
  boardEl.style.width = boardW + 'px';
  boardEl.style.height = boardH + 'px';
  worldEl.appendChild(boardEl);

  const rng = getSessionRng();
  const tileByKey = new Map(TILES.map((t) => [`${t.row}-${t.col}`, t]));

  const fillerSlots = ROWS.reduce((n, r) => n + r, 0) - TILES.length;
  const fillerMultiset = buildFillerMultiset(fillerSlots, rng);
  let fillerCursor = 0;

  // How many plain tiles each resource ended up with this session — the mobile page lists the
  // same board as a flat set of sections, so it reads the counts from here rather than
  // re-deriving (and drifting from) them.
  const fillerCounts = fillerMultiset.reduce((acc, type) => {
    acc[type] = (acc[type] ?? 0) + 1;
    return acc;
  }, {});

  const tileEls = new Map();
  const fillerEls = [];

  ROWS.forEach((n, row) => {
    for (let col = 0; col < n; col++) {
      const key = `${row}-${col}`;
      const data = tileByKey.get(key);
      const { left, top } = hexTopLeft(row, col);

      const el = document.createElement(data ? 'button' : 'div');
      el.className = 'tile ' + (data ? `content ${data.type}` : 'filler');
      el.style.left = left + 'px';
      el.style.top = top + 'px';

      if (data) {
        el.type = 'button';
        el.dataset.tileId = data.id;
        el.setAttribute('aria-label', `${data.title} tile`);
        const img = document.createElement('img');
        img.src = `/art/tiles/${data.id}.svg`;
        img.alt = '';
        el.appendChild(img);

        if (data.id !== 'desert') {
          const label = document.createElement('span');
          label.className = 'tile-label';
          // The banner's flat plate (between its swallowtail ends) only holds so much text before
          // the ribbon's fold lines start running through the letters — so size the whole banner
          // off the title length instead of using one width for everyone: short titles ("Skills")
          // get a snug ribbon, long ones ("Experience") get the room they need. Calibrated so a
          // 6-letter title lands near the old fixed 64% and a 10-letter one near the old 88%,
          // clamped to stay inside the hex's full-width band (see .tile-label's own comment).
          label.style.width = `${Math.min(92, Math.max(60, 28 + 6 * data.title.length))}%`;
          label.innerHTML = `<img class="tile-label-bg" src="/art/pieces/label-banner.svg" alt=""><span class="tile-label-text">${data.title}</span>`;
          el.appendChild(label);
        }

        el.addEventListener('click', () => {
          if (data.id === 'desert') onDesertClick?.();
          else onOpenTile?.(data.id);
        });
        tileEls.set(data.id, el);
      } else {
        const filler = fillerMultiset[fillerCursor++];
        el.dataset.resource = filler; // the robber reads this to know which deck to deal from
        const img = document.createElement('img');
        img.src = `/art/tiles/filler-${filler}.svg`;
        img.alt = '';
        const rot = ROTATIONS[Math.floor(rng() * ROTATIONS.length)];
        const mirror = rng() < 0.5 ? -1 : 1;
        img.style.transform = `rotate(${rot}deg) scaleX(${mirror})`;
        el.appendChild(img);
        el.setAttribute('aria-label', `Unclaimed ${filler} land`);
        fillerEls.push(el);
      }
      boardEl.appendChild(el);

      if (data && data.token) {
        const t = document.createElement('img');
        t.className = 'token';
        t.src = `/art/tokens/token-${data.token}.svg`;
        t.alt = '';
        t.style.left = left + TW / 2 + 'px';
        t.style.top = top + TH * 0.68 + 'px';
        boardEl.appendChild(t);
      }
    }
  });

  // Robber lands on a random filler tile from the same seeded roll. `robberTile` follows him
  // from there: Catan's rule is that a move has to *move* him, so the tile he's standing on is
  // never a legal target and is left out of the arming below.
  const robberSpot = fillerEls[Math.floor(rng() * fillerEls.length)];
  let robberTile = robberSpot;
  const robber = document.createElement('img');
  robber.className = 'robber';
  robber.src = '/art/pieces/robber.svg';
  robber.alt = 'The robber';
  positionRobberOn(robber, robberSpot);
  boardEl.appendChild(robber);

  // A translucent preview of the robber that snaps to whatever filler tile is under the
  // cursor while a move is armed — makes "click here to move the robber" unambiguous without
  // relying on a cursor-icon change alone.
  const ghostRobber = document.createElement('img');
  ghostRobber.className = 'robber robber-ghost';
  ghostRobber.src = '/art/pieces/robber.svg';
  ghostRobber.alt = '';
  ghostRobber.hidden = true;
  boardEl.appendChild(ghostRobber);

  function positionRobberOn(robberEl, tileEl) {
    const left = parseFloat(tileEl.style.left);
    const top = parseFloat(tileEl.style.top);
    robberEl.style.left = left + TW / 2 + 'px';
    robberEl.style.top = top + TH / 2 + 'px';
  }

  // ---------------------------------------------------------------- robber arming (roll a 7)
  // Dropping the robber on a plain tile is how the player earns extra resource cards, so arming
  // takes a per-resource count of what's still in each deck: tiles whose deck is exhausted are
  // still legal robber spots (it's the robber, he goes where you put him) but say up front that
  // there's nothing left to take, rather than paying out silence on the click. The one tile that
  // is never offered is the one he's standing on.
  // `onResolve` is how a Knight dev card learns that its robber move has been made — a 7 rolled
  // on the dice passes nothing and just lets onRobbed do the paying out.
  //
  // Pending resolvers deliberately outlive a disarm and a re-arm. A visitor who draws a knight and
  // then rolls a 7 before moving the robber re-arms it with no callback of its own; the knight is
  // still waiting, and it is the *move* that settles it, not which arming asked for it. Without
  // that, the deck would sit stuck on a card whose effect could never finish.
  let armed = false;
  const pendingResolvers = [];
  function armRobber(remaining = {}, onResolve = null) {
    armed = true;
    if (onResolve) pendingResolvers.push(onResolve);
    fillerEls.forEach((f) => {
      if (f === robberTile) return; // he's already here; robbing it again would be a free re-take
      const left = remaining[f.dataset.resource];
      const dry = left === 0;
      f.classList.add('armable');
      f.classList.toggle('depleted', dry);
      f.title = dry
        ? `No ${f.dataset.resource} cards left to take`
        : `Rob this ${f.dataset.resource} tile${left ? ` (${left} card${left === 1 ? '' : 's'} left)` : ''}`;
    });
  }
  function disarmRobber() {
    armed = false;
    ghostRobber.hidden = true;
    fillerEls.forEach((f) => {
      f.classList.remove('armable', 'depleted');
      f.removeAttribute('title');
    });
  }
  fillerEls.forEach((f) => {
    f.addEventListener('click', () => {
      if (!armed || f === robberTile) return;
      positionRobberOn(robber, f);
      robberTile = f;
      disarmRobber();
      onRobbed?.(f.dataset.resource);
      // Drained rather than iterated: a resolver may arm the robber again (a knight drawn out of
      // another knight's payout would), and that new one must not be settled by this same move.
      pendingResolvers.splice(0).forEach((done) => done(f.dataset.resource));
    });
    f.addEventListener('pointerenter', () => {
      if (!armed || f === robberTile) return;
      positionRobberOn(ghostRobber, f);
      ghostRobber.hidden = false;
    });
    f.addEventListener('pointerleave', () => {
      ghostRobber.hidden = true;
    });
  });

  // ---------------------------------------------------------------- helpers used by camera/dice/hand
  function worldCenterOf(id) {
    const data = TILES.find((t) => t.id === id);
    if (!data) return null;
    const c = hexCenter(data.row, data.col);
    return { x: c.x + WORLD_PAD, y: c.y + WORLD_PAD };
  }

  function pulseTile(id) {
    const el = tileEls.get(id);
    if (!el) return;
    el.classList.remove('pulse');
    // restart the animation even if it's already mid-pulse
    void el.offsetWidth;
    el.classList.add('pulse');
    clearTimeout(el._pulseTimer);
    el._pulseTimer = setTimeout(() => el.classList.remove('pulse'), 1200);
  }

  return {
    boardEl,
    tileEls,
    fillerEls,
    fillerCounts,
    worldCenterOf,
    pulseTile,
    armRobber,
    disarmRobber,
  };
}
