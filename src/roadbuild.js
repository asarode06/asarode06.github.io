// Free road placement, what the Road Building dev card hands off to.
//
// The career road along row 2 (road.js) is fixed: it's the timeline and it can't be edited. This
// is the other kind of road, the one a player lays down themselves. Arming lights up the free
// edges as faint dashed ghosts; hovering one previews a road on it; clicking places it for good.
// The pieces are decoration, nothing scores them and nothing reads them back: they're just
// yours, and they stay for the session.
//
// Catan's placement rule is the reason not every free edge lights up. A road has to touch your
// own network at one of its two ends, meaning one of your roads, settlements or cities already
// reaches that intersection. So the ghosts are the frontier of the red network rather than the
// whole board, and placing a road extends that frontier: the second of the two free roads can
// build off the first.
//
// The 72 board edges come from geometry.boardEdges(). What the career road occupies, and which
// intersections it reaches, are worked out here rather than there, since both are facts about
// this session and not about the shape of the board.
//
// The chain's last two segments are the exception, and the one place the game and the writing
// touch. They're the dashed ghost road running up to the hollow node: the career that hasn't
// happened yet. Building there is allowed, so a visitor can pave the road to graduation, and
// paving it is the reward for having got a Road Building card out of the deck. The ghost is
// only ever *reachable*, never a shortcut: the last real city stands on point SOLID_END, so the
// first ghost segment is legal off that city and the second only once the first is built. What
// a paved segment covers is retired from the dashed underlay (road.js hands over `ghostEls`),
// since the career road is painted above this layer and dashes showing through a finished road
// would just look like a rendering slip.
import { boardEdges, edgeKey, nodeKey, roadChain } from './geometry.js';
import { SOLID_END } from './road.js';

const NS = 'http://www.w3.org/2000/svg';

function reducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export function createRoadBuilder({ boardEl, onToast, ghostEls } = {}) {
  const chain = roadChain();

  // Edges no road can go on: the solid career road only. The dashed tail past SOLID_END is left
  // out on purpose, which is what makes it buildable.
  const taken = new Set();
  for (let i = 0; i < SOLID_END; i++) {
    taken.add(edgeKey(chain[i][0], chain[i][1], chain[i + 1][0], chain[i + 1][1]));
  }

  // Intersections the red network reaches. Seeded with the solid career road's endpoints, which
  // is also every settlement and city on the board, since all six pieces sit on this chain.
  const network = new Set();
  for (let i = 0; i <= SOLID_END; i++) network.add(nodeKey(chain[i][0], chain[i][1]));

  const svg = document.createElementNS(NS, 'svg');
  svg.setAttribute('class', 'build-layer');
  svg.setAttribute('viewBox', `0 0 ${parseFloat(boardEl.style.width)} ${parseFloat(boardEl.style.height)}`);
  boardEl.appendChild(svg);

  // Two groups so placed roads always paint over the ghosts, whatever order things happen in.
  const ghostG = document.createElementNS(NS, 'g');
  const builtG = document.createElementNS(NS, 'g');
  svg.append(ghostG, builtG);

  let armed = 0; // roads still to place
  let onDone = null;

  function line(cls, e, width) {
    const l = document.createElementNS(NS, 'line');
    l.setAttribute('class', cls);
    l.setAttribute('x1', e.x1);
    l.setAttribute('y1', e.y1);
    l.setAttribute('x2', e.x2);
    l.setAttribute('y2', e.y2);
    if (width) l.setAttribute('stroke-width', width);
    return l;
  }

  // A road is legal if it's free and one of its ends is already reached by the network.
  function connects(e) {
    return network.has(nodeKey(e.x1, e.y1)) || network.has(nodeKey(e.x2, e.y2));
  }

  function place(e) {
    taken.add(e.id);
    // The new road reaches both of its own intersections, so the frontier grows from here.
    network.add(nodeKey(e.x1, e.y1));
    network.add(nodeKey(e.x2, e.y2));
    const road = line('built-road', e);
    if (!reducedMotion()) road.classList.add('fresh');
    builtG.appendChild(road);
    // Paved over a stretch of the dashed career ghost: that stretch is a real road now.
    const paved = ghostEls?.get(e.id);
    if (paved) paved.remove();
    armed -= 1;
    if (armed > 0) {
      onToast?.(
        paved
          ? 'Road built, and the road to graduation with it. One more to place.'
          : 'Road built. One more to place.'
      );
      renderGhosts();
    } else {
      const done = onDone;
      disarm();
      onToast?.('Both roads built. They stay where you put them.');
      done?.();
    }
  }

  function renderGhosts() {
    ghostG.innerHTML = '';
    if (!armed) return;
    const legal = boardEdges().filter((e) => !taken.has(e.id) && connects(e));
    // Nothing left to build off. Better to hand the turn back than to leave the card unresolved
    // with no edge on the board that would resolve it.
    if (!legal.length) {
      const done = onDone;
      disarm();
      onToast?.('No room left to build: every road off your network is already placed.');
      done?.();
      return;
    }
    for (const e of legal) {
      const g = document.createElementNS(NS, 'g');
      g.setAttribute('class', 'ghost-road');
      g.appendChild(line('ghost-road-line', e));
      // A separate fat transparent line does the hit-testing: the dashed ghost itself is thin
      // enough that catching it with a mouse would be a chore.
      g.appendChild(line('ghost-road-hit', e, 22));
      g.addEventListener('click', (ev) => {
        ev.stopPropagation();
        place(e);
      });
      ghostG.appendChild(g);
    }
  }

  function arm(count, done) {
    armed = count;
    onDone = done ?? null;
    svg.classList.add('armed');
    renderGhosts();
  }

  function disarm() {
    armed = 0;
    onDone = null;
    svg.classList.remove('armed');
    ghostG.innerHTML = '';
  }

  return { arm, disarm, isArmed: () => armed > 0, svg };
}
