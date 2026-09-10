// World-space "board chrome": ports, bonus cards, dev-card deck, resource hand.
// All of it lives inside #world and pans/zooms with the board — only Trade/Resume/dice are
// screen-fixed HUD (see hud.js).
import { WORLD_PAD, boardSize, worldSize } from './geometry.js';
import { PORTS } from './data.js';
import { BONUS_CARDS } from './content.js';

const NS = 'http://www.w3.org/2000/svg';
const BEAM_HALF = 5.5; // half-width of a pier plank
const BEAM_END_GAP = 15; // stops the plank short of the ship's hull instead of running under it

// One wooden pier plank, from a coastal tile vertex out toward the ship. Drawn as a filled,
// outlined quad with cross-slats rather than a stroked line — a bare 2px stroke reads as a
// stray pencil mark next to art this chunky, especially once the camera zooms out.
function appendPlank(svg, from, to) {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const len = Math.hypot(dx, dy) || 1;
  const ux = dx / len;
  const uy = dy / len;
  const end = { x: from.x + ux * (len - BEAM_END_GAP), y: from.y + uy * (len - BEAM_END_GAP) };
  const px = -uy * BEAM_HALF; // half-width offset, perpendicular to the plank
  const py = ux * BEAM_HALF;
  const fmt = (x, y) => `${x.toFixed(1)},${y.toFixed(1)}`;

  const plank = document.createElementNS(NS, 'polygon');
  plank.setAttribute('class', 'port-plank');
  plank.setAttribute(
    'points',
    [
      fmt(from.x + px, from.y + py),
      fmt(end.x + px, end.y + py),
      fmt(end.x - px, end.y - py),
      fmt(from.x - px, from.y - py),
    ].join(' ')
  );
  svg.appendChild(plank);

  // Three slats across the plank, so it reads as decking rather than a bar.
  const slats = [];
  for (let i = 1; i <= 3; i++) {
    const t = i / 4;
    const cx = from.x + (end.x - from.x) * t;
    const cy = from.y + (end.y - from.y) * t;
    slats.push(`M ${fmt(cx + px, cy + py)} L ${fmt(cx - px, cy - py)}`);
  }
  const slat = document.createElementNS(NS, 'path');
  slat.setAttribute('class', 'port-slat');
  slat.setAttribute('d', slats.join(' '));
  svg.appendChild(slat);
}

export function renderChrome(worldEl, { mountHand, mountDev, portAnchors } = {}) {
  const { width: boardW, height: boardH } = boardSize();

  // ---------------------------------------------------------------- ports (docks on the coast)
  // Each port anchors to the two real vertices of one tile's coastal edge — matching how a dock
  // straddles a settlement-corner pair on the physical board — with two pier planks converging
  // on a ship just offshore, instead of one image pinned to a single approximate point.
  const portsLayer = document.createElement('div');
  portsLayer.className = 'ports-layer';

  const world = worldSize();
  const pierSvg = document.createElementNS(NS, 'svg');
  pierSvg.setAttribute('class', 'port-piers');
  pierSvg.setAttribute('viewBox', `0 0 ${world.width} ${world.height}`);
  pierSvg.style.width = world.width + 'px';
  pierSvg.style.height = world.height + 'px';
  portsLayer.appendChild(pierSvg);

  PORTS.forEach((port) => {
    const pt = portAnchors?.[port.anchor];
    if (!pt) return;

    appendPlank(pierSvg, pt.v1, pt.ship);
    appendPlank(pierSvg, pt.v2, pt.ship);

    const a = document.createElement('a');
    a.className = 'port';
    a.href = port.href;
    if (!port.href.startsWith('mailto:')) {
      a.target = '_blank';
      a.rel = 'noopener';
    }
    a.setAttribute('aria-label', `${port.label} (opens outside this site)`);
    a.innerHTML = `
      <span class="port-ship" style="left:${pt.ship.x}px; top:${pt.ship.y}px">
        <img src="/art/pieces/port.svg" alt="">
      </span>
      <span class="port-label" style="left:${pt.labelX}px; top:${pt.labelY}px">${port.label}</span>`;
    portsLayer.appendChild(a);
  });
  worldEl.appendChild(portsLayer);

  // ---------------------------------------------------------------- bonus cards (left edge)
  const bonusLayer = document.createElement('div');
  bonusLayer.className = 'bonus-layer';
  bonusLayer.style.left = WORLD_PAD - 300 + 'px';
  bonusLayer.style.top = WORLD_PAD + boardH / 2 + 'px';
  // A `locked` award (Largest Army) isn't yours yet, so showing the card would be a lie. Its slot
  // holds a hollow dashed outline with the award's name in it until it's earned; awardBonus()
  // then fades the outline out and the real card in. The card is built either way — the slot is
  // what's toggled — so nothing has to be re-rendered at the moment of winning it.
  const bonusSlots = new Map();
  BONUS_CARDS.forEach((card) => {
    const slot = document.createElement('div');
    slot.className = 'bonus-slot' + (card.locked ? ' locked' : '');
    const el = document.createElement('div');
    el.className = 'bonus-card';
    el.innerHTML = `
      <img src="/art/cards/${card.art}.svg" alt="">
      <div class="bonus-body">
        <h3>${card.title}</h3>
        ${card.html}
      </div>`;
    slot.appendChild(el);
    if (card.locked) {
      const ghost = document.createElement('div');
      ghost.className = 'bonus-ghost';
      ghost.textContent = card.title;
      ghost.setAttribute('aria-label', `${card.title} (not earned yet)`);
      slot.appendChild(ghost);
    }
    bonusSlots.set(card.id, slot);
    bonusLayer.appendChild(slot);
  });
  worldEl.appendChild(bonusLayer);

  function awardBonus(id) {
    bonusSlots.get(id)?.classList.add('won');
  }

  // ---------------------------------------------------------------- dev card deck (right edge)
  // The deck itself, the cards drawn off it and everything they do belong to src/dev.js — the
  // same split the resource hand uses. All that's decided here is where on the board the pile
  // sits, and that the played cards fan out underneath it, well clear of the resource hand along
  // the bottom edge.
  //
  // The offset has to clear the east port, whose ship and "Email" label sit ~90-170px off the
  // board's right edge (see PORT_EDGES in coastline.js) at exactly the height of the deck — park
  // the pile any closer and it lands on top of the dock. Overshooting the world's right edge is
  // the lesser worry: the camera allows WIGGLE_WORLD (140px) of pan past it on every side, so the
  // fan's outer corner stays reachable.
  const devLayer = document.createElement('div');
  devLayer.className = 'dev-layer';
  devLayer.style.left = WORLD_PAD + boardW + 170 + 'px';
  devLayer.style.top = WORLD_PAD + boardH / 2 - 190 + 'px';
  mountDev?.(devLayer);
  worldEl.appendChild(devLayer);

  // ---------------------------------------------------------------- resource hand (bottom edge)
  // The cards themselves belong to src/cards.js, which owns the decks, the robber payouts, and
  // the flip animation — chrome.js only decides where on the board the hand sits.
  const handLayer = document.createElement('div');
  handLayer.className = 'hand-layer';
  handLayer.style.left = WORLD_PAD + boardW / 2 + 'px';
  handLayer.style.top = WORLD_PAD + boardH + 92 + 'px';
  const caption = document.createElement('p');
  caption.className = 'hand-caption';
  caption.textContent = 'Click a card to turn it over. Roll a 7 to rob a tile for more.';
  handLayer.appendChild(caption);
  mountHand?.(handLayer);
  worldEl.appendChild(handLayer);

  return { awardBonus };
}
