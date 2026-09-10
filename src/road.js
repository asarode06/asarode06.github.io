// SVG road-and-settlement overlay running along the row-2 hexes (see SPEC.md §3).
//
// `buildRoadSvg` is factored out of the on-board render because the Experience showcase
// (experience.js) lifts a second, identical copy of this chain off the board and animates it —
// the copy has to start out pixel-for-pixel the same as the real one for the hand-off to read
// as the board's own roads rising up, so both go through this one builder.
//
// The chain is two stretches. Points 0..SOLID_END are the career so far, one solid polyline.
// Past that it's the dashed ghost running up to the hollow node: the road not travelled yet.
// The ghost is drawn as one element per segment, keyed by edge, because the Road Building card
// lets a visitor pave those two stretches for real (roadbuild.js) and a segment that's been
// built has to stop drawing its dashes under the new road.
import { boardSize, edgeKey, roadChain } from './geometry.js';
import { TIMELINE } from './content.js';

const NS = 'http://www.w3.org/2000/svg';

// Piece art is square and drawn centered on its node; a city is the bigger of the two.
export const PIECE_SIZE = { settlement: 34, city: 46, ghost: 34 };
export const MAX_PIECE = 46;

// Chain points 0..SOLID_END are the built career road; past that it's the dashed ghost. The
// last real piece stands on SOLID_END, so it's also where the player's network stops.
export const SOLID_END = 8;

export function buildRoadSvg({ onOpenMilestone, interactive = true, className = '' } = {}) {
  const chain = roadChain();
  const { width, height } = boardSize();

  const svg = document.createElementNS(NS, 'svg');
  svg.setAttribute('class', `road-layer${className ? ' ' + className : ''}`);
  svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
  if (!interactive) svg.setAttribute('aria-hidden', 'true');

  const solid = document.createElementNS(NS, 'polyline');
  solid.setAttribute('class', 'road-seg');
  solid.setAttribute('points', chain.slice(0, SOLID_END + 1).map((p) => p.join(',')).join(' '));
  svg.appendChild(solid);

  // One dashed line per ghost segment rather than one polyline over the lot, so roadbuild.js can
  // retire just the stretch a visitor paves. Same class and stroke, so the pair still reads as
  // one dashed run.
  const ghostEls = new Map();
  for (let i = SOLID_END; i < chain.length - 1; i++) {
    const [x1, y1] = chain[i];
    const [x2, y2] = chain[i + 1];
    const seg = document.createElementNS(NS, 'line');
    seg.setAttribute('class', 'road-seg ghost');
    seg.setAttribute('x1', x1);
    seg.setAttribute('y1', y1);
    seg.setAttribute('x2', x2);
    seg.setAttribute('y2', y2);
    svg.appendChild(seg);
    ghostEls.set(edgeKey(x1, y1, x2, y2), seg);
  }

  const nodeEls = new Map();

  TIMELINE.forEach((m, i) => {
    const [x, y] = chain[i * 2];
    const g = document.createElementNS(NS, 'g');
    g.setAttribute('class', 'node-btn');
    g.dataset.node = m.id; // modal.js grows a milestone's modal out of its piece on the board
    if (interactive) {
      g.setAttribute('tabindex', '0');
      g.setAttribute('role', 'button');
      g.setAttribute('aria-label', `${m.title}, ${m.dates}`);
    }

    const hit = document.createElementNS(NS, 'circle');
    hit.setAttribute('cx', x);
    hit.setAttribute('cy', y);
    hit.setAttribute('r', 18);
    hit.setAttribute('fill', 'transparent');
    g.appendChild(hit);

    const w = PIECE_SIZE[m.piece];
    if (m.piece === 'ghost') {
      const c = document.createElementNS(NS, 'circle');
      c.setAttribute('cx', x);
      c.setAttribute('cy', y);
      c.setAttribute('r', 11);
      c.setAttribute('fill', 'none');
      c.setAttribute('stroke', 'var(--player)');
      c.setAttribute('stroke-width', '3');
      c.setAttribute('stroke-dasharray', '4 4');
      g.appendChild(c);
    } else {
      const img = document.createElementNS(NS, 'image');
      img.setAttribute('href', `/art/pieces/${m.piece}.svg`);
      img.setAttribute('x', x - w / 2);
      img.setAttribute('y', y - w / 2);
      img.setAttribute('width', w);
      img.setAttribute('height', w);
      g.appendChild(img);
    }

    if (interactive) {
      const title = document.createElementNS(NS, 'title');
      title.textContent = `${m.title} · ${m.dates}`;
      g.appendChild(title);

      const open = () => onOpenMilestone?.(m.id);
      g.addEventListener('click', open);
      g.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          open();
        }
      });
    } else {
      g.style.pointerEvents = 'none';
    }

    svg.appendChild(g);
    nodeEls.set(m.id, g);
  });

  return { svg, nodeEls, ghostEls, chain };
}

export function renderRoad(boardEl, { onOpenMilestone } = {}) {
  const built = buildRoadSvg({ onOpenMilestone });
  boardEl.appendChild(built.svg);
  return built;
}
