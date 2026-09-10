// Victory points: the running total in the bottom-left corner, and what happens when it hits 10.
//
// The number is not invented for the dev deck — most of it is already standing on the board when
// the page loads. The road along row 2 is the career, and its pieces score exactly as they would
// in a real game: a settlement is 1, a city is 2, the dashed "graduation" ghost is 0 (it hasn't
// been built yet). Longest Road is the career itself, so it counts from the start too. That puts
// a visitor at 9 before they touch anything, which is the whole point — the deck is one draw away
// from finishing the game.
//
// Reaching VICTORY_TARGET is a celebration, not an ending. Nothing is disabled, nothing resets,
// and the count keeps climbing afterwards; the banner just doesn't come back a second time.
import { BONUS_VP, PIECE_VP, VICTORY_TARGET } from './data.js';
import { TIMELINE } from './content.js';

function reducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

// Confetti pieces are hexes and resource cards rather than generic rectangles — the board's own
// two shapes, tumbling.
const CONFETTI_COLORS = ['--wood', '--wheat', '--brick', '--ore', '--sheep', '--player'];
const CONFETTI_COUNT = 64;

export function createVictory({ hudEl, winEl, onWin } = {}) {
  const pieceVp = TIMELINE.reduce((n, m) => n + (PIECE_VP[m.piece] ?? 0), 0);

  const sources = {
    settlements: TIMELINE.filter((m) => m.piece === 'settlement').length * PIECE_VP.settlement,
    cities: TIMELINE.filter((m) => m.piece === 'city').length * PIECE_VP.city,
    longestRoad: BONUS_VP,
    largestArmy: 0,
    devCards: 0,
  };

  let won = false;

  function total() {
    return Object.values(sources).reduce((a, b) => a + b, 0);
  }

  // ------------------------------------------------------------------ the HUD chip
  hudEl.innerHTML = `
    <button type="button" class="vp-chip" aria-expanded="false">
      <b class="vp-count">0</b>
      <span class="vp-label">victory<br>points</span>
    </button>
    <div class="vp-breakdown" hidden></div>`;
  const chip = hudEl.querySelector('.vp-chip');
  const countEl = hudEl.querySelector('.vp-count');
  const breakdownEl = hudEl.querySelector('.vp-breakdown');

  const ROWS = [
    ['settlements', 'Settlements on the road'],
    ['cities', 'Cities on the road'],
    ['longestRoad', 'Longest Road'],
    ['largestArmy', 'Largest Army'],
    ['devCards', 'Library cards'],
  ];

  function renderBreakdown() {
    breakdownEl.innerHTML =
      ROWS.map(
        ([key, label]) =>
          `<p${sources[key] ? '' : ' class="none"'}><span>${label}</span><b>${sources[key]}</b></p>`
      ).join('') + `<p class="vp-total"><span>Total</span><b>${total()} / ${VICTORY_TARGET}</b></p>`;
  }

  function render({ bump = false } = {}) {
    const n = total();
    countEl.textContent = String(n);
    chip.setAttribute(
      'aria-label',
      `${n} victory point${n === 1 ? '' : 's'} of ${VICTORY_TARGET}. Opens the breakdown.`
    );
    hudEl.classList.toggle('is-won', won);
    renderBreakdown();
    if (bump && !reducedMotion()) {
      chip.classList.remove('bump');
      void chip.offsetWidth; // restart the pulse even on two points in a row
      chip.classList.add('bump');
    }
  }

  chip.addEventListener('click', () => {
    const open = breakdownEl.hidden;
    breakdownEl.hidden = !open;
    chip.setAttribute('aria-expanded', String(open));
  });
  document.addEventListener('click', (e) => {
    if (breakdownEl.hidden || hudEl.contains(e.target)) return;
    breakdownEl.hidden = true;
    chip.setAttribute('aria-expanded', 'false');
  });

  // ------------------------------------------------------------------ the win celebration
  const banner = winEl.querySelector('.win-card');
  const confettiEl = winEl.querySelector('.win-confetti');
  const closeBtn = winEl.querySelector('.win-close');

  function buildConfetti() {
    if (reducedMotion()) return;
    let html = '';
    for (let i = 0; i < CONFETTI_COUNT; i++) {
      const color = CONFETTI_COLORS[i % CONFETTI_COLORS.length];
      const style =
        `left:${(i / CONFETTI_COUNT) * 100 + (Math.random() * 3 - 1.5)}%;` +
        `--c:var(${color});` +
        `--spin:${Math.random() < 0.5 ? -1 : 1}turn;` +
        `--drift:${Math.round(Math.random() * 120 - 60)}px;` +
        `animation-delay:${(Math.random() * 1.6).toFixed(2)}s;` +
        `animation-duration:${(2.4 + Math.random() * 1.8).toFixed(2)}s`;
      html += `<i class="${i % 3 === 0 ? 'hex' : 'card'}" style="${style}"></i>`;
    }
    confettiEl.innerHTML = html;
  }

  function closeWin() {
    winEl.classList.remove('open');
    const finish = () => {
      winEl.hidden = true;
      confettiEl.innerHTML = '';
    };
    if (reducedMotion()) finish();
    else setTimeout(finish, 320);
  }

  closeBtn.addEventListener('click', closeWin);
  winEl.addEventListener('click', (e) => {
    if (e.target === winEl || e.target.classList.contains('win-scrim')) closeWin();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !winEl.hidden) closeWin();
  });

  function celebrate() {
    winEl.querySelector('.win-score').textContent = String(total());
    buildConfetti();
    winEl.hidden = false;
    // One frame before adding .open, so the entrance transition has a start state to run from.
    requestAnimationFrame(() => winEl.classList.add('open'));
    closeBtn.focus({ preventScroll: true });
    banner.setAttribute('tabindex', '-1');
    onWin?.();
  }

  // ------------------------------------------------------------------ scoring
  function set(key, value) {
    if (sources[key] === value) return;
    sources[key] = value;
    render({ bump: true });
    if (!won && total() >= VICTORY_TARGET) {
      won = true;
      render();
      // Let the point that won it land on the chip before the screen fills up.
      setTimeout(celebrate, reducedMotion() ? 0 : 700);
    }
  }

  render();

  return {
    /** Largest Army has been earned (3 knights). Worth the same 2 as Longest Road. */
    awardLargestArmy: () => set('largestArmy', BONUS_VP),
    /** How many Library cards are in the played pile. */
    setDevPoints: (n) => set('devCards', n),
    total,
    pieceVp,
    hasWon: () => won,
    isOpen: () => !winEl.hidden,
  };
}
