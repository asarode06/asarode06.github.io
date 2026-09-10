// The Experience showcase — the one content tile that deliberately doesn't open a modal.
//
// Individually clickable settlements and cities are easy to miss, so this tile exists to show
// all of them at once. Clicking it lifts the board's own road chain off the map: a copy of the
// road SVG (built by the same road.js builder, so it starts pixel-for-pixel identical) is placed
// exactly over the real one, the real one is hidden, and then the copy grows and slides down the
// screen while the board dims behind it and the camera eases back. Once it lands, a summary card
// rises above every piece.
//
// Those cards are deliberately teasers: a row of six can only ever be so tall, so clicking one
// expands it into a full-screen-ish panel with room for long-form text, photos, a stack list and
// links (see the optional TIMELINE fields in data.js). The row is the overview; the expanded card
// is where the depth lives.
import { WORLD_PAD, boardSize, roadChain } from './geometry.js';
// One entry per role, authored in content/experience.md and pre-rendered at build time. `teaser`
// is everything above that entry's `<!--more-->` and `extra` is everything below it, which is
// exactly the collapsed/expanded split these cards need — see src/content.js.
import { TIMELINE } from './content.js';
import { buildRoadSvg, MAX_PIECE } from './road.js';

const CHAIN = roadChain();
const NODES = TIMELINE.map((_, i) => CHAIN[i * 2]);
const NODE_Y = NODES[0][1]; // every milestone sits on an even chain point, so they share a y
const SPAN = NODES[NODES.length - 1][0] - NODES[0][0];
const MID_X = NODES[0][0] + SPAN / 2;
const GAPS = NODES.length - 1;

const LIFT_MS = 900;
const FOCUS_MS = 420; // keep in step with .exp-card's geometry transition in style.css
const CARD_STAGGER_MS = 70;
const EASE = 'cubic-bezier(.215,.61,.355,1)'; // easeOutCubic — matches the camera's own tween
const CAMERA_ZOOM_OUT = 0.82;

const GUTTER = 40; // screen px kept clear at the left/right edges
const CARD_FILL = 0.94; // card width as a fraction of the space one card is allotted
const MAX_LIFT_SCALE = 2.4;
const STEM = 22; // gap between a card's bottom edge and the top of its piece
const ROW_GAP = 14; // vertical gap between the two rows in staggered mode
const HEAD_GAP = 12; // clearance between the overlay title and the tallest card

// A row shorter than this can't hold bullets and a Read-more affordance without the bullets
// becoming a two-line scroll stub, which reads as broken. Under it the collapsed card drops to
// title/dates/summary and leans on expanding for the rest — a teaser, not a truncated card.
const TIGHT_ROW = 200;

// Below this the six-across row stops being readable, so the cards split into two staggered
// rows: each row then only has to fit three cards, which buys back close to double the width.
// Every other card climbs above its neighbours, and because a lifted card is still narrower than
// the space between the two cards flanking it, its tether drops through a clear corridor.
const MIN_CARD_W = 176;

// Under this viewport height the overlay's subtitle is dropped — on a short window that line is
// pure decoration and the vertical space it costs comes straight out of the cards.
const COMPACT_VH = 660;

// Card text is sized off this reference width so the cards read the same on a 1280px laptop and
// on an ultrawide — the layout scales, the type only drifts within a narrow band.
const REF_CARD_W = 215;

// A collapsed card is the shared panel design (see the "shared panel chrome" section of
// style.css) rendered small — `--type-scale` is the only difference between a teaser in the row
// and the full panel it expands into, and this is the fraction the teaser runs at.
const COLLAPSED_SCALE = 0.72;

// Expanded (focused) card. Scale 1 and a width in the same band as the tile modal and the
// resource-card panel, so all three land at the same size and the same type.
const FOCUS_MAX_W = 760;
const FOCUS_MARGIN = 28;
const FOCUS_TYPE_SCALE = 1;

function esc(s) {
  const d = document.createElement('div');
  d.textContent = s;
  return d.innerHTML;
}

function reducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

// offsetHeight rounds to the nearest integer, so a card whose content is 189.6px tall measures
// 190 but one at 189.4 measures 189 — and pinning it to 189 leaves a fraction of a line
// overflowing, which is enough for the browser to show a scrollbar. Always round up instead.
function naturalHeight(el) {
  return Math.ceil(el.getBoundingClientRect().height);
}

function typeScaleFor(cardW) {
  return COLLAPSED_SCALE * Math.min(1.1, Math.max(0.82, cardW / REF_CARD_W));
}

// Where the lifted chain ends up. The outer two cards overhang the chain's ends by half a card
// each, so that overhang has to come out of the usable width before the chain itself gets scaled
// to fit: with the chain span S and a card taking `rows` node-gaps of width, S*scale + cardW =
// usable solves to the scale below.
function fitScale(usable, rows) {
  return Math.min(usable / (SPAN * (1 + (rows * CARD_FILL) / GAPS)), MAX_LIFT_SCALE);
}

function heroLayout(headerH) {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const usable = vw - 2 * GUTTER;

  // One card per node-gap if that's still readable; otherwise two rows, where each card gets the
  // two node-gaps that separate it from its same-row neighbours.
  let scale = fitScale(usable, 1);
  const staggered = ((SPAN * scale) / GAPS) * CARD_FILL < MIN_CARD_W;
  if (staggered) scale = fitScale(usable, 2);
  const cardW = ((SPAN * scale) / GAPS) * CARD_FILL * (staggered ? 2 : 1);

  // Leave a proportional strip of sea below the chain rather than a fixed one, so a tall window
  // hands the extra height to the cards instead of to empty space under the road.
  const chainY = vh - Math.min(150, Math.max(64, vh * 0.16));
  const cardBottomY = chainY - (MAX_PIECE / 2) * scale - STEM;
  return {
    vh,
    scale,
    cardW,
    cardBottomY,
    staggered,
    // Every pixel the cards are allowed to occupy, measured against the real title's real
    // height — guessing at it is what let a short window push the top row up through the title.
    budget: Math.max(80, cardBottomY - headerH - HEAD_GAP),
    tx: vw / 2 - MID_X * scale,
    ty: chainY - NODE_Y * scale,
  };
}

export function createExperience({ overlayEl, boardRoadSvg, getCamera, onClose } = {}) {
  const scrimEl = overlayEl.querySelector('.exp-scrim');
  const stageEl = overlayEl.querySelector('.exp-stage');
  const cardsEl = overlayEl.querySelector('.exp-cards');
  const headEl = overlayEl.querySelector('.exp-head');
  const closeBtn = overlayEl.querySelector('.exp-close');

  const { width: boardW, height: boardH } = boardSize();
  stageEl.style.width = boardW + 'px';
  stageEl.style.height = boardH + 'px';
  stageEl.appendChild(buildRoadSvg({ interactive: false, className: 'exp-road' }).svg);

  const cardEls = TIMELINE.map((m, i) => {
    const card = document.createElement('article');
    card.className = `exp-card panel ${m.piece}`;
    card.style.setProperty('--i', String(i));
    const icon = m.piece === 'ghost' ? 'settlement' : m.piece;
    // `.exp-extra` stays hidden until the card is expanded: the collapsed card shows only what
    // the author put above `<!--more-->`, and this is the part it grows into.
    const extra = m.extra;
    // Same header/body/footer slots the tile modal and the resource-card panel fill — see the
    // "shared panel chrome" section of style.css. A collapsed card is that panel at a smaller
    // `--type-scale`, so expanding it grows a miniature into the real thing rather than swapping
    // one design for another.
    //
    // The scroller is an inner element on purpose: the card itself has to stay overflow-visible
    // so its dashed tether (an ::after hanging below the bottom edge) isn't clipped away, and
    // the header band has to stay outside it so it can't scroll away on a capped panel.
    card.innerHTML =
      `<header class="exp-card-head panel-head">` +
      `<span class="panel-icons"><img class="panel-icon" src="/art/pieces/${icon}.svg" alt=""></span>` +
      `<div class="panel-head-text">` +
      `<span class="exp-card-dates panel-eyebrow">${esc(m.dates)}</span>` +
      `<h3>${esc(m.title)}</h3>` +
      `<p class="exp-card-summary panel-sub">${esc(m.summary)}</p>` +
      `</div>` +
      // Only shown once expanded — every panel on the site closes from the same corner.
      `<button type="button" class="exp-card-close panel-close" aria-label="Back to the road">&times;</button>` +
      `</header>` +
      `<div class="exp-card-scroll panel-body">` +
      m.teaser +
      (extra ? `<div class="exp-extra">${extra}</div>` : '') +
      `</div>` +
      `<button type="button" class="exp-card-more panel-foot" aria-expanded="false">` +
      `<span class="exp-more-open">${extra ? 'Read more' : 'Expand'} →</span>` +
      `<span class="exp-more-close">← Back to the road</span>` +
      `</button>`;
    cardsEl.appendChild(card);
    return card;
  });

  const moreBtns = cardEls.map((c) => c.querySelector('.exp-card-more'));
  const closeBtns = cardEls.map((c) => c.querySelector('.exp-card-close'));
  const collapsedRects = cardEls.map(() => null);

  let open = false;
  let focused = null; // index of the expanded card, or null
  let settleTimer = null;
  let cameraBefore = null;
  let timers = [];

  function clearTimers() {
    timers.forEach(clearTimeout);
    timers = [];
  }

  function after(ms, fn) {
    timers.push(setTimeout(fn, reducedMotion() ? 0 : ms));
  }

  // The transform that puts the lifted copy exactly where the real road sits on the board, for a
  // given camera state. The board is offset WORLD_PAD inside the world layer, and the world layer
  // is `translate(cam.x, cam.y) scale(cam.scale)` from a 0 0 origin — so this composes the two.
  function boardTransform(cam) {
    return { tx: cam.x + WORLD_PAD * cam.scale, ty: cam.y + WORLD_PAD * cam.scale, scale: cam.scale };
  }

  function setStage({ tx, ty, scale }, animate) {
    stageEl.style.transition = animate ? `transform ${LIFT_MS}ms ${EASE}` : 'none';
    stageEl.style.transform = `translate(${tx}px, ${ty}px) scale(${scale})`;
  }

  // The title's real footprint. Measured rather than assumed: it's two lines on a roomy window
  // and one on a short one, and the whole card budget is derived from it.
  function headerHeight() {
    overlayEl.classList.toggle('compact', window.innerHeight < COMPACT_VH);
    return headEl.offsetTop + headEl.offsetHeight;
  }

  function applyRect(card, r, animate) {
    if (!animate) card.style.transition = 'none';
    card.style.left = `${r.left}px`;
    card.style.bottom = `${r.bottom}px`;
    card.style.width = `${r.width}px`;
    card.style.height = `${r.height}px`;
    if (!animate) {
      void card.offsetWidth; // land the jump before transitions are handed back
      card.style.transition = '';
    }
  }

  // ------------------------------------------------------------------ collapsed row layout
  function placeCards(L) {
    cardsEl.style.setProperty('--stagger', `${reducedMotion() ? 0 : CARD_STAGGER_MS}ms`);
    const baseBottom = L.vh - L.cardBottomY;

    // Decided before measuring, since it changes what there is to measure.
    const perRow = L.staggered ? (L.budget - ROW_GAP) / 2 : L.budget;
    overlayEl.classList.toggle('tight', perRow < TIGHT_ROW);

    // Pass 1 — let every card take its natural height at the row's width, so the budget is spent
    // against what the content actually needs rather than against a fixed cap.
    cardEls.forEach((card, i) => {
      card.style.transition = 'none';
      card.style.left = `${L.tx + NODES[i][0] * L.scale}px`;
      card.style.bottom = `${baseBottom}px`;
      card.style.width = `${L.cardW}px`;
      card.style.height = 'auto';
      card.style.setProperty('--type-scale', String(typeScaleFor(L.cardW)));
    });
    const natural = cardEls.map(naturalHeight);
    const rowHeight = (idxs) => Math.max(...idxs.map((i) => natural[i]));

    // Pass 2 — fit those natural heights into the budget. One row spends it all; two rows split
    // it, shrinking proportionally only when what they want doesn't fit. Either way the total is
    // bounded by `budget`, so the top of the tallest card can never reach the title.
    let lowerH;
    let upperH = 0;
    if (L.staggered) {
      const idx = cardEls.map((_, i) => i);
      lowerH = rowHeight(idx.filter((i) => i % 2 === 0));
      upperH = rowHeight(idx.filter((i) => i % 2 === 1));
      const room = L.budget - ROW_GAP;
      if (lowerH + upperH > room) {
        lowerH = Math.floor((lowerH * room) / (lowerH + upperH));
        upperH = room - lowerH;
      }
    } else {
      lowerH = Math.min(rowHeight(cardEls.map((_, i) => i)), L.budget);
    }

    const lift = L.staggered ? lowerH + ROW_GAP : 0;
    cardEls.forEach((card, i) => {
      const raised = L.staggered && i % 2 === 1;
      collapsedRects[i] = {
        left: L.tx + NODES[i][0] * L.scale,
        bottom: baseBottom + (raised ? lift : 0),
        width: L.cardW,
        height: Math.min(natural[i], raised ? upperH : lowerH),
      };
      // Natural height above the row height means content was cut, which the CSS answers with a
      // fade rather than a scrollbar. Derived from the measurements already taken, so collapsing
      // back out of the expanded panel doesn't need to re-measure anything.
      card.classList.toggle('is-clipped', natural[i] > collapsedRects[i].height + 1);
      card.style.setProperty('--stem', `${STEM + (raised ? lift : 0)}px`);
      if (focused !== i) applyRect(card, collapsedRects[i], false);
    });

    // A card that was open when the window changed size stays open, re-fitted.
    if (focused !== null) focusCard(focused, { animate: false });
  }

  // ------------------------------------------------------------------ expand / collapse
  // What the card wants to be once expanded. Applied and torn down within one frame with
  // transitions off, so none of it is ever painted.
  function measureFocused(card, width) {
    const saved = {
      width: card.style.width,
      height: card.style.height,
      typeScale: card.style.getPropertyValue('--type-scale'),
    };
    card.style.transition = 'none';
    card.classList.add('is-focused');
    card.style.setProperty('--type-scale', String(FOCUS_TYPE_SCALE));
    card.style.width = `${width}px`;
    card.style.height = 'auto';
    const h = naturalHeight(card);
    card.classList.remove('is-focused');
    card.style.width = saved.width;
    card.style.height = saved.height;
    card.style.setProperty('--type-scale', saved.typeScale);
    void card.offsetWidth;
    card.style.transition = '';
    return h;
  }

  function focusCard(i, { animate = true } = {}) {
    const card = cardEls[i];
    // The long-form half has been `display: none` until this click, so nothing in it has been
    // fetched — its photos would otherwise start arriving into a panel that has already finished
    // opening. Flipping them off lazy starts that now, during the morph. (A print is a few KB
    // by the time plugins/images.js is done with it, so this is a head start, not a stall.)
    card.querySelectorAll('img[loading="lazy"]').forEach((img) => {
      img.loading = 'eager';
    });
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const headerH = headerHeight();
    const width = Math.min(FOCUS_MAX_W, vw - 2 * GUTTER);
    const wanted = measureFocused(card, width);
    const cap = vh - headerH - 2 * FOCUS_MARGIN;
    const height = Math.min(wanted, cap);

    focused = i;
    overlayEl.classList.add('focused');
    card.classList.add('is-focused');
    // Scrolling is switched on only once the box has finished growing (`is-settled`) and only
    // when the panel was actually cut short by the viewport (`is-capped`). A panel showing all of
    // its content is sized to exactly fit it, so it must never sprout a scrollbar.
    clearTimeout(settleTimer);
    card.classList.remove('is-settled');
    card.classList.toggle('is-capped', wanted > cap);
    const settle = () => card.classList.add('is-settled');
    if (animate && !reducedMotion()) settleTimer = setTimeout(settle, FOCUS_MS);
    else settle();
    card.style.setProperty('--type-scale', String(FOCUS_TYPE_SCALE));
    moreBtns[i].setAttribute('aria-expanded', 'true');
    applyRect(
      card,
      {
        left: vw / 2,
        // Centred in the band below the title rather than in the window, so it never rides up
        // under the heading the way the row used to.
        bottom: Math.max(FOCUS_MARGIN, (vh - headerH - height) / 2),
        width,
        height,
      },
      animate && !reducedMotion()
    );
    if (animate) moreBtns[i].focus({ preventScroll: true });
  }

  function collapseCard({ animate = true } = {}) {
    if (focused === null) return;
    const i = focused;
    const card = cardEls[i];
    focused = null;
    overlayEl.classList.remove('focused');
    clearTimeout(settleTimer);
    card.classList.remove('is-focused', 'is-settled', 'is-capped');
    card.style.setProperty('--type-scale', String(typeScaleFor(collapsedRects[i].width)));
    moreBtns[i].setAttribute('aria-expanded', 'false');
    applyRect(card, collapsedRects[i], animate && !reducedMotion());
    if (animate) moreBtns[i].focus({ preventScroll: true });
  }

  cardEls.forEach((card, i) => {
    closeBtns[i].addEventListener('click', (e) => {
      e.stopPropagation();
      collapseCard();
    });
    moreBtns[i].addEventListener('click', (e) => {
      e.stopPropagation();
      if (focused === i) collapseCard();
      else focusCard(i);
    });
    // Anywhere on a collapsed card expands it. Once expanded the card is a document, so clicks
    // inside are left alone for selecting text and following links.
    card.addEventListener('click', (e) => {
      if (focused !== null || e.target.closest('a')) return;
      focusCard(i);
    });
  });

  // ------------------------------------------------------------------ open / close
  function show() {
    if (open) return;
    open = true;
    clearTimers();

    const camera = getCamera();
    cameraBefore = camera.getState();

    overlayEl.hidden = false;
    document.body.classList.add('exp-open'); // fades the site header and HUD out from behind it
    boardRoadSvg.style.visibility = 'hidden'; // the copy is sitting exactly on top of it

    const hero = heroLayout(headerHeight());
    placeCards(hero);
    setStage(boardTransform(cameraBefore), false);
    void stageEl.offsetWidth; // commit the start transform before transitioning away from it

    requestAnimationFrame(() => {
      if (!open) return;
      overlayEl.classList.add('lit');
      setStage(hero, !reducedMotion());
      camera.nudgeZoom(CAMERA_ZOOM_OUT, LIFT_MS);
    });

    // The cards start arriving as the chain is settling, not after it has stopped dead.
    after(LIFT_MS - 220, () => overlayEl.classList.add('landed'));

    closeBtn.focus({ preventScroll: true });
    window.addEventListener('keydown', onKeyDown, true);
    window.addEventListener('resize', onResize);
  }

  function hide({ silent = false } = {}) {
    if (!open) return;
    open = false;
    clearTimers();
    window.removeEventListener('keydown', onKeyDown, true);
    window.removeEventListener('resize', onResize);

    collapseCard({ animate: false });
    overlayEl.classList.remove('landed', 'lit');
    document.body.classList.remove('exp-open');

    // Aim the chain at where the board's road *will* be once the camera has finished easing back,
    // not where it is mid-zoom-out — otherwise the two land in different places.
    setStage(boardTransform(cameraBefore), !reducedMotion());
    getCamera().tweenToState(cameraBefore, LIFT_MS);

    after(LIFT_MS, () => {
      overlayEl.hidden = true;
      boardRoadSvg.style.visibility = '';
    });

    if (!silent) onClose?.();
  }

  function onResize() {
    if (!open) return;
    // The camera snaps itself back to home on resize, so re-read it: that home view is now what
    // closing has to hand the chain back to.
    cameraBefore = getCamera().getState();
    const hero = heroLayout(headerHeight());
    placeCards(hero);
    setStage(hero, false);
  }

  function onKeyDown(e) {
    if (!open) return;
    // A native <dialog> — the photo viewer opened off a print in an expanded card — renders in
    // the browser's top layer, above this overlay, and owns the keyboard for as long as it's up.
    // This listener is on window in the capture phase, so without this it would answer Escape
    // first and collapse the card out from under whatever is sitting on top of it.
    if (document.querySelector('dialog[open]')) return;
    if (e.key === 'Escape') {
      e.preventDefault();
      e.stopPropagation();
      // Escape backs out one layer at a time: the expanded card first, then the showcase.
      if (focused !== null) collapseCard();
      else hide();
      return;
    }
    if (e.key !== 'Tab') return;
    // Keep focus inside the overlay — the board and HUD behind it are visually gone. When a card
    // is expanded the others are faded out, and offsetParent filters those back out of the ring.
    const usable = [...overlayEl.querySelectorAll('button, a[href]')].filter(
      (el) => el.offsetParent !== null && getComputedStyle(el).visibility !== 'hidden'
    );
    if (!usable.length) return;
    const first = usable[0];
    const last = usable[usable.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  }

  // Clicking off the cards backs out one layer, the same as Escape.
  function dismissOutside() {
    if (focused !== null) collapseCard();
    else hide();
  }
  scrimEl.addEventListener('click', dismissOutside);
  cardsEl.addEventListener('click', (e) => {
    if (e.target === cardsEl) dismissOutside(); // the gaps between the cards are still "outside"
  });
  closeBtn.addEventListener('click', () => hide());

  return { show, hide, isOpen: () => open };
}
