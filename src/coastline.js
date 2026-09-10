// The sandy coastline ring drawn behind the hex board, plus the coastal anchor points ports/
// docks attach to. Unlike a single big hexagon pushed out around the board's 8 hull points,
// the real board's coast hugs the actual zigzag outline of the 19 tiles (rows of 3-4-5-4-3
// pointy-top hexes) — every edge tile contributes its own boundary edges, so the sand has the
// same bumpy, tile-by-tile contour the physical board does, just offset outward by SAND_PAD.
import { TW, TH, WORLD_PAD, ROWS, hexTopLeft, boardSize } from './geometry.js';

const SAND_PAD = 26; // how far the sand extends past the tiles — a beach, not a second board
const FILLET_RADIUS = 13; // corner-rounding radius applied to the offset coastline
const MITER_LIMIT = 3; // caps the offset's outward spike at sharp concave (reflex) corners
const NS = 'http://www.w3.org/2000/svg';

// The 6 corners of one tile, board-local, clockwise from the top point — matches the .tile
// clip-path polygon (50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%) exactly.
function hexCorners(row, col) {
  const { left, top } = hexTopLeft(row, col);
  return [
    [left + TW / 2, top],
    [left + TW, top + 0.25 * TH],
    [left + TW, top + 0.75 * TH],
    [left + TW / 2, top + TH],
    [left, top + 0.75 * TH],
    [left, top + 0.25 * TH],
  ];
}

const ptKey = (p) => `${Math.round(p[0] * 10)},${Math.round(p[1] * 10)}`;
const edgeKey = (p1, p2) => {
  const a = ptKey(p1);
  const b = ptKey(p2);
  return a < b ? `${a}|${b}` : `${b}|${a}`;
};

// Walks every tile's 6 edges and keeps the ones that belong to only one tile — those are
// exactly the board's outer boundary. Their directed order (as emitted by their owning tile,
// always the same rotational sense) chains them straight into an ordered loop with no separate
// sorting pass needed.
function buildBoundaryLoop() {
  const edges = new Map();
  ROWS.forEach((n, row) => {
    for (let col = 0; col < n; col++) {
      const corners = hexCorners(row, col);
      for (let i = 0; i < 6; i++) {
        const p1 = corners[i];
        const p2 = corners[(i + 1) % 6];
        const key = edgeKey(p1, p2);
        const existing = edges.get(key);
        if (existing) existing.count++;
        else edges.set(key, { count: 1, p1, p2 });
      }
    }
  });

  const boundary = [...edges.values()].filter((e) => e.count === 1);
  const byStart = new Map(boundary.map((e) => [ptKey(e.p1), e]));
  const loop = [];
  let current = boundary[0];
  const startKey = ptKey(current.p1);
  for (let guard = 0; guard < boundary.length; guard++) {
    loop.push(current.p1);
    const nextKey = ptKey(current.p2);
    if (nextKey === startKey) break;
    current = byStart.get(nextKey);
  }
  return loop;
}

function centroid(points) {
  const cx = points.reduce((s, p) => s + p[0], 0) / points.length;
  const cy = points.reduce((s, p) => s + p[1], 0) / points.length;
  return [cx, cy];
}

// The outward unit normal of a directed edge — "outward" resolved by which of the two
// perpendiculars points away from the board's centroid, so it's correct regardless of winding.
function outwardNormal(p1, p2, center) {
  const dx = p2[0] - p1[0];
  const dy = p2[1] - p1[1];
  const len = Math.hypot(dx, dy) || 1;
  let nx = dy / len;
  let ny = -dx / len;
  const midX = (p1[0] + p2[0]) / 2;
  const midY = (p1[1] + p2[1]) / 2;
  if (nx * (midX - center[0]) + ny * (midY - center[1]) < 0) {
    nx = -nx;
    ny = -ny;
  }
  return [nx, ny];
}

// Grows the true tile-boundary loop outward by `dist`: each edge's line is pushed out along its
// own outward normal, and each vertex becomes the mitred meeting point of its two neighboring
// pushed edges. A miter limit keeps the sharp reflex corners between tiles from spiking out.
function offsetLoop(loop, center, dist) {
  const n = loop.length;
  const normals = loop.map((p, i) => outwardNormal(p, loop[(i + 1) % n], center));
  return loop.map((p, i) => {
    const nPrev = normals[(i - 1 + n) % n];
    const nNext = normals[i];
    let bx = nPrev[0] + nNext[0];
    let by = nPrev[1] + nNext[1];
    const blen = Math.hypot(bx, by);
    if (blen < 1e-6) return [p[0] + nNext[0] * dist, p[1] + nNext[1] * dist];
    bx /= blen;
    by /= blen;
    const cosHalf = bx * nNext[0] + by * nNext[1];
    const miter = Math.min(dist / Math.max(cosHalf, 0.2), dist * MITER_LIMIT);
    return [p[0] + bx * miter, p[1] + by * miter];
  });
}

// Rounds each corner with a small fillet instead of a full midpoint-to-midpoint smoothing pass
// — the latter cuts a good 25% of the way in from every vertex, which is exactly where the
// ports anchor, leaving a visible gap between the dock and the sand. A small fixed-radius
// fillet keeps the straight edges true to the offset hull and only softens the corners.
function roundedClosedPath(points, radius) {
  const n = points.length;
  const fmt = (p) => `${p[0].toFixed(1)},${p[1].toFixed(1)}`;
  const lerp = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
  let d = '';
  for (let i = 0; i < n; i++) {
    const prev = points[(i - 1 + n) % n];
    const cur = points[i];
    const next = points[(i + 1) % n];
    const tPrev = Math.min(radius / Math.hypot(cur[0] - prev[0], cur[1] - prev[1]), 0.45);
    const tNext = Math.min(radius / Math.hypot(next[0] - cur[0], next[1] - cur[1]), 0.45);
    const before = lerp(cur, prev, tPrev);
    const after = lerp(cur, next, tNext);
    d += (i === 0 ? `M ${fmt(before)} ` : `L ${fmt(before)} `) + `Q ${fmt(cur)} ${fmt(after)} `;
  }
  return d + 'Z';
}

// Which coastal tile edge each port straddles, as [row, col, edge] where edge indexes
// hexCorners() clockwise from the top point: 0=NE, 1=E, 2=SE, 3=SW, 4=W, 5=NW. Pinned by hand
// rather than picked by "closest to this direction" — the outward-facing edges of one corner
// tile sit only 60° apart, so an automatic pick happily chose two that faced each other and
// stacked the GitHub/LinkedIn labels on top of one another. The west side is deliberately
// portless: that's where the bonus cards sit.
const PORT_EDGES = {
  'top-left': [0, 0, 5],
  'top-right': [0, 2, 0],
  right: [2, 4, 1],
  'bottom-right': [4, 2, 2],
  'bottom-left': [4, 0, 3],
};

export function renderCoastline(worldEl) {
  const { width: boardW, height: boardH } = boardSize();
  const loop = buildBoundaryLoop();
  const center = centroid(loop);
  const sandOuter = offsetLoop(loop, center, SAND_PAD);

  const pad = SAND_PAD + 60;
  const svg = document.createElementNS(NS, 'svg');
  svg.setAttribute('class', 'coastline');
  svg.setAttribute('viewBox', `${-pad} ${-pad} ${boardW + pad * 2} ${boardH + pad * 2}`);
  svg.style.left = WORLD_PAD - pad + 'px';
  svg.style.top = WORLD_PAD - pad + 'px';
  svg.style.width = boardW + pad * 2 + 'px';
  svg.style.height = boardH + pad * 2 + 'px';

  const path = roundedClosedPath(sandOuter, FILLET_RADIUS);
  const sand = document.createElementNS(NS, 'path');
  sand.setAttribute('d', path);
  sand.setAttribute('class', 'sand-fill');
  svg.appendChild(sand);
  const outline = document.createElementNS(NS, 'path');
  outline.setAttribute('d', path);
  outline.setAttribute('class', 'sand-outline');
  svg.appendChild(outline);

  worldEl.appendChild(svg);

  // Coastal anchor points for the ports: the two true vertices of one real tile edge (the pier
  // planks start right on them, the way a dock straddles a settlement-corner pair in the actual
  // game), plus points just offshore for the ship and its label. Both distances are measured
  // from the tile edge, so they clear the sand by SHIP_DIST - SAND_PAD.
  const SHIP_DIST = SAND_PAD + 34;
  const LABEL_DIST = SHIP_DIST + 52;
  const toWorld = (p) => ({ x: p[0] + WORLD_PAD, y: p[1] + WORLD_PAD });

  const portAnchors = {};
  for (const [name, [row, col, edgeIndex]] of Object.entries(PORT_EDGES)) {
    const corners = hexCorners(row, col);
    const p1 = corners[edgeIndex];
    const p2 = corners[(edgeIndex + 1) % 6];
    const normal = outwardNormal(p1, p2, center);
    const midX = (p1[0] + p2[0]) / 2;
    const midY = (p1[1] + p2[1]) / 2;
    const ship = [midX + normal[0] * SHIP_DIST, midY + normal[1] * SHIP_DIST];
    const label = [midX + normal[0] * LABEL_DIST, midY + normal[1] * LABEL_DIST];
    portAnchors[name] = {
      v1: toWorld(p1),
      v2: toWorld(p2),
      ship: toWorld(ship),
      labelX: toWorld(label).x,
      labelY: toWorld(label).y,
    };
  }

  return { portAnchors };
}
