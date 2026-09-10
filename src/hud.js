// Screen-fixed HUD: Trade button, dice roller, Resume corner link. These sit outside #world so
// they're always reachable no matter how far the camera has panned or zoomed.
import { tileByToken } from './data.js';

const PIPS = {
  1: [4],
  2: [0, 8],
  3: [0, 4, 8],
  4: [0, 2, 6, 8],
  5: [0, 2, 4, 6, 8],
  6: [0, 2, 3, 5, 6, 8],
};

function reducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function renderDie(value) {
  const cells = Array.from({ length: 9 }, (_, i) => (PIPS[value].includes(i) ? '<i class="pip"></i>' : '<i></i>'));
  return `<span class="die">${cells.join('')}</span>`;
}

export function initHud({ tradeBtn, resumeLink, diceHudEl, announceEl, onTrade, onRoll } = {}) {
  tradeBtn?.addEventListener('click', () => onTrade?.());

  let rolls = 0;
  let rolling = false;

  const wrap = document.createElement('div');
  wrap.className = 'dice';
  wrap.innerHTML = `
    <button type="button" class="dice-roll" aria-label="Roll two dice">
      <span class="dice-faces">${renderDie(1)}${renderDie(1)}</span>
    </button>
    <span class="dice-count">Rolls: <b>0</b></span>`;
  diceHudEl.appendChild(wrap);

  const btn = wrap.querySelector('.dice-roll');
  const faces = wrap.querySelector('.dice-faces');
  const countEl = wrap.querySelector('b');

  function setFaces(a, b) {
    faces.innerHTML = renderDie(a) + renderDie(b);
  }

  function finish(a, b) {
    rolling = false;
    setFaces(a, b);
    const sum = a + b;
    rolls += 1;
    countEl.textContent = String(rolls);
    const tile = sum === 7 ? null : tileByToken(sum);
    if (announceEl) {
      announceEl.textContent = tile
        ? `Rolled ${sum}: opening ${tile.title}`
        : sum === 7
          ? 'Rolled 7: the robber stirs'
          : `Rolled ${sum}`;
    }
    onRoll?.(sum, tile);
  }

  btn.addEventListener('click', () => {
    if (rolling) return;
    rolling = true;
    const finalA = 1 + Math.floor(Math.random() * 6);
    const finalB = 1 + Math.floor(Math.random() * 6);

    if (reducedMotion()) {
      finish(finalA, finalB);
      return;
    }

    let ticks = 0;
    const maxTicks = 9;
    const interval = setInterval(() => {
      ticks += 1;
      setFaces(1 + Math.floor(Math.random() * 6), 1 + Math.floor(Math.random() * 6));
      if (ticks >= maxTicks) {
        clearInterval(interval);
        finish(finalA, finalB);
      }
    }, 70);
  });

  return {
    get rolls() {
      return rolls;
    },
  };
}
