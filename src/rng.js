// Seeded PRNG so filler-tile art/rotation and robber placement are stable within a session
// (reload the tab, board looks the same) but reshuffle on a fresh tab, per SPEC.md §2.

export function mulberry32(seed) {
  let s = seed >>> 0;
  return function () {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const SEED_KEY = 'catan-board-seed';

export function getSessionRng() {
  let seed;
  try {
    const stored = sessionStorage.getItem(SEED_KEY);
    if (stored) {
      seed = Number(stored);
    } else {
      seed = Math.floor(Math.random() * 2 ** 31);
      sessionStorage.setItem(SEED_KEY, String(seed));
    }
  } catch {
    // sessionStorage unavailable (private mode, etc.) — fall back to a fresh, non-persisted seed
    seed = Math.floor(Math.random() * 2 ** 31);
  }
  return mulberry32(seed);
}

// Fisher-Yates shuffle using a supplied RNG, so it's reproducible for a given seed.
export function seededShuffle(array, rng) {
  const a = array.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
