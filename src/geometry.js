// Hex-board geometry. Pointy-top hexes, rows of 3-4-5-4-3 (see SPEC.md §9).
import { ROWS } from './data.js';

export { ROWS };

export const TW = 140; // tile width
export const TH = TW * 1.1547; // tile height
export const VSTEP = TH * 0.75; // vertical step between rows

// Padding around the board inside the pannable world, so the sand coastline, the ports/docks
// sitting on it, and the bonus-cards/dev-deck/resource-hand chrome all have room outside the
// hex grid itself without the camera's home view cropping them.
export const WORLD_PAD = 320;

export function boardSize() {
  return { width: 5 * TW, height: 4 * VSTEP + TH };
}

export function worldSize() {
  const b = boardSize();
  return { width: b.width + 2 * WORLD_PAD, height: b.height + 2 * WORLD_PAD };
}

// The road timeline's zig-zag chain, in board-local coordinates: 11 points running along the
// upper edges of the row-2 hexes (see SPEC.md §3). Even points sit on the lower vertices and are
// the six milestone nodes; odd points are the peaks between them. Shared by the on-board road
// overlay (road.js) and the Experience showcase (experience.js) so the two can never drift.
export function roadChain() {
  const R = TW / Math.sqrt(3);
  const row2Cy = 2 * VSTEP + TH / 2;
  const yLow = row2Cy - R / 2;
  const yHigh = row2Cy - R;
  const pts = [];
  for (let k = 0; k <= 10; k++) pts.push([k * (TW / 2), k % 2 === 0 ? yLow : yHigh]);
  return pts;
}

// An intersection and an edge, each as a string. Coordinates are rounded to a tenth of a pixel
// so the same point reached two different ways keys the same, and an edge sorts its two ends so
// a line resolves identically whichever end you name first. That's what lets a career-road
// segment (roadChain), a hex edge (boardEdges) and a road the visitor places all be compared as
// plain strings, in road.js and roadbuild.js as well as here.
export function nodeKey(x, y) {
  return `${x.toFixed(1)},${y.toFixed(1)}`;
}

export function edgeKey(x1, y1, x2, y2) {
  return [nodeKey(x1, y1), nodeKey(x2, y2)].sort().join('|');
}

// Every edge of every hex on the board, deduped: the 72 lines a road could sit on, in
// board-local coordinates. Two neighbouring hexes share an edge, and edgeKey is what makes that
// shared edge resolve to one entry rather than two. Used by roadbuild.js for the Road Building
// dev card. Which of the 72 are legal on a given turn is decided there, not here: part of the
// career road (roadChain above) sits on them, and Catan only lets you build where your own
// network already reaches.
export function boardEdges() {
  const R = TW / Math.sqrt(3);
  const key = (a, b) => edgeKey(a.x, a.y, b.x, b.y);
  const edges = new Map();
  ROWS.forEach((n, row) => {
    for (let col = 0; col < n; col++) {
      const c = hexCenter(row, col);
      // Pointy-top: a vertex at the top and bottom, and four at the half-height corners.
      const v = [
        { x: c.x, y: c.y - R },
        { x: c.x + TW / 2, y: c.y - R / 2 },
        { x: c.x + TW / 2, y: c.y + R / 2 },
        { x: c.x, y: c.y + R },
        { x: c.x - TW / 2, y: c.y + R / 2 },
        { x: c.x - TW / 2, y: c.y - R / 2 },
      ];
      for (let i = 0; i < 6; i++) {
        const a = v[i];
        const b = v[(i + 1) % 6];
        const k = key(a, b);
        if (edges.has(k)) continue;
        edges.set(k, { id: k, x1: a.x, y1: a.y, x2: b.x, y2: b.y });
      }
    }
  });
  return [...edges.values()];
}

// Top-left corner of a hex, in board-local coordinates (origin at the board's own top-left).
export function hexTopLeft(row, col) {
  const n = ROWS[row];
  const left = (5 - n) * (TW / 2) + col * TW;
  const top = row * VSTEP;
  return { left, top };
}

export function hexCenter(row, col) {
  const { left, top } = hexTopLeft(row, col);
  return { x: left + TW / 2, y: top + TH / 2 };
}

// Given a set of {id, x, y} candidates and a direction from a current point, find the best
// match: it must lie mostly in that direction and is picked by smallest weighted distance.
// Used for arrow-key navigation between content tiles in modal.js.
export function nearestInDirection(from, dir, candidates) {
  const vecs = {
    up: { x: 0, y: -1 },
    down: { x: 0, y: 1 },
    left: { x: -1, y: 0 },
    right: { x: 1, y: 0 },
  };
  const v = vecs[dir];
  if (!v) return null;
  let best = null;
  let bestScore = Infinity;
  for (const c of candidates) {
    const dx = c.x - from.x;
    const dy = c.y - from.y;
    const dist = Math.hypot(dx, dy);
    if (dist < 1) continue;
    const dot = (dx * v.x + dy * v.y) / dist; // -1..1, how aligned with the requested direction
    if (dot < 0.35) continue; // must be roughly in that direction, not sideways/behind
    const score = dist / dot; // closer and more aligned wins
    if (score < bestScore) {
      bestScore = score;
      best = c;
    }
  }
  return best;
}
