// Below ~780px the camera/board is dropped entirely for a normal scrolling page (SPEC.md §10).
import { TILES, FILLER_TYPES, RESOURCE_COLORS, PORTS } from './data.js';
import { TIMELINE, DEV_CARDS } from './content.js';

const RESOURCE_ORDER = ['brick', 'wheat', 'wood', 'sheep', 'ore', 'desert'];
const RESOURCE_LABELS = {
  brick: 'Brick',
  wheat: 'Wheat',
  wood: 'Wood',
  sheep: 'Sheep',
  ore: 'Ore',
  desert: 'Desert',
};

export function renderMobile(stackEl, { mountHand, fillerCounts = {}, onOpenTile, onOpenMilestone, onDesertClick, onTrade } = {}) {
  let html = '';

  // ---------------------------------------------------------------- ports link row
  html += `<div class="m-ports">${PORTS.map(
    (p) =>
      `<a href="${p.href}" ${p.href.startsWith('mailto:') ? '' : 'target="_blank" rel="noopener"'}>${esc(p.label)}</a>`
  ).join('')}</div>`;

  html += `<button type="button" class="m-trade" data-trade>Trade</button>`;

  // ---------------------------------------------------------------- resource hand strip
  // There's no dice roller and no robber down here, so the whole deck is dealt face-up (see
  // main.js) — the cards themselves are mounted by src/cards.js once this markup is in place.
  html += `
    <section class="m-group m-hand-group">
      <h2>Resource cards</h2>
      <p class="m-hand-note">One card per resource, each about a different corner of the work. Tap one to turn it over.</p>
      <div class="m-hand" data-hand></div>
    </section>`;

  // ---------------------------------------------------------------- dev card, single button
  // On the board a dev card is played: it moves the robber, empties a deck, lays down roads. None
  // of those exist down here — there is no board, no dice and no robber — so the draw is the card
  // itself and its rules text, the same way the dice and the robber are simply absent rather than
  // faked. The victory-point counter is hidden at this width for the same reason (see style.css).
  html += `
    <button type="button" class="m-dev" data-dev>Draw a development card</button>
    <div class="m-dev-card panel" data-dev-fact hidden>
      <img class="m-dev-art" alt="">
      <div class="m-dev-text">
        <span class="dev-head"><span class="dev-eyebrow">development</span><span class="dev-type"></span></span>
        <div class="dev-body"></div>
      </div>
    </div>`;

  // ---------------------------------------------------------------- 19 hexes, grouped by resource
  RESOURCE_ORDER.forEach((resource) => {
    const content = TILES.filter((t) => t.type === resource);
    const fillerCount = FILLER_TYPES.includes(resource) ? (fillerCounts[resource] ?? 0) : 0;
    if (!content.length && !fillerCount) return;
    html += `<section class="m-group" data-group="${resource}" style="--accent:${RESOURCE_COLORS[resource]}">
      <h2>${RESOURCE_LABELS[resource]}</h2>`;
    content.forEach((t) => {
      html += `<button type="button" class="m-tile" data-tile="${t.id}"><img src="/art/tiles/${t.id}.svg" alt="">${esc(t.title)}</button>`;
    });
    for (let i = 0; i < fillerCount; i++) {
      html += `<div class="m-tile m-filler" aria-label="Unclaimed land"><img src="/art/tiles/filler-${resource}.svg" alt="">Unclaimed</div>`;
    }
    html += `</section>`;
  });

  // ---------------------------------------------------------------- road as a vertical timeline
  // Labelled "Experience" to match the tile: on mobile there's no board to lift the road chain
  // off, so the Experience tile just scrolls down to this list instead (see revealTimeline).
  html += `<section class="m-group m-timeline" id="m-experience"><h2>Experience</h2>`;
  TIMELINE.forEach((m) => {
    html += `<button type="button" class="m-tile m-milestone ${m.piece}" data-milestone="${m.id}">
      <img src="/art/pieces/${m.piece === 'ghost' ? 'settlement' : m.piece}.svg" alt="">
      <span>${esc(m.title)}<small>${esc(m.dates)}</small></span>
    </button>`;
  });
  html += `</section>`;

  stackEl.innerHTML = html;

  mountHand?.(stackEl.querySelector('[data-hand]'));

  stackEl.querySelectorAll('[data-tile]').forEach((b) =>
    b.addEventListener('click', () => (b.dataset.tile === 'desert' ? onDesertClick?.() : onOpenTile?.(b.dataset.tile)))
  );
  stackEl.querySelectorAll('[data-milestone]').forEach((b) => b.addEventListener('click', () => onOpenMilestone?.(b.dataset.milestone)));
  stackEl.querySelector('[data-trade]')?.addEventListener('click', () => onTrade?.());

  // No flip down here (there is no deck to turn a card off), so the drawn card just appears as
  // the same face-up card the desktop deck turns into. Cycles through all five rather than
  // picking at random, which out of five would repeat often enough to look broken.
  const devBtn = stackEl.querySelector('[data-dev]');
  const devFact = stackEl.querySelector('[data-dev-fact]');
  let devQueue = [];
  devBtn?.addEventListener('click', () => {
    if (!devQueue.length) devQueue = DEV_CARDS.map((_, i) => i).sort(() => Math.random() - 0.5);
    const card = DEV_CARDS[devQueue.pop()];
    devFact.hidden = false;
    devFact.querySelector('.m-dev-art').src = `/art/cards/${card.art}.svg`;
    devFact.querySelector('.dev-type').textContent = card.title;
    devFact.querySelector('.dev-body').innerHTML = card.html;
  });

  // The mobile stand-in for the desktop road-chain showcase: scroll the timeline into view and
  // flash it, so tapping Experience still lands you on every role at once.
  function revealTimeline() {
    const section = stackEl.querySelector('.m-timeline');
    if (!section) return;
    const smooth = !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    section.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto', block: 'start' });
    section.classList.remove('flash');
    void section.offsetWidth; // restart the flash even if it's already running
    section.classList.add('flash');
  }

  return { revealTimeline };
}

function esc(s) {
  const d = document.createElement('div');
  d.textContent = s;
  return d.innerHTML;
}
