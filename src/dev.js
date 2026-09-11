// The development deck: drawing a card, and what each card actually does.
//
// This is to the deck what cards.js is to the resource hand — the game layer. chrome.js only
// decides where on the board the pile sits and calls mountDeck(); everything about what happens
// when you click it lives here.
//
// A draw is a *play*. The top card turns over and grows at the pile, showing its art, its name
// and its real Catan rules text, then runs its effect against the board:
//
//   knight          arms the robber, exactly as rolling a 7 does, and pays out a resource card.
//                   Three of them wins Largest Army — which is why the deck is knight-heavy.
//   year-of-plenty  opens the bank picker for two resources.
//   monopoly        opens the bank picker for one, then takes every remaining card of it.
//   road-building   hands off to roadbuild.js for two free roads off the existing network.
//   library         a victory point, and nothing to resolve.
//
// Once the effect resolves the card drops into the played pile below the deck and stays there,
// face up, for the rest of the session — grouped by type and overlapping exactly the way the
// resource hand stacks cards of one resource, so a fistful of knights stays compact.
//
// The deck is the real 25 (see DEV_DECK in data.js) and it does not reshuffle: it runs out.
import { DEV_CARDS, DEV_BY_ID } from './content.js';
import { DEV_DECK, LARGEST_ARMY_KNIGHTS, RESOURCE_KINDS, RESOURCE_ORDER } from './data.js';

// Kept in step with .dev-card's transition in style.css.
const FLIP_MS = 560;
// How long a card with no interaction (Library) stays big at the pile before joining the pile.
const LINGER_MS = 1900;

function reducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function esc(s) {
  const d = document.createElement('div');
  d.textContent = s;
  return d.innerHTML;
}

function shuffle(list) {
  const a = [...list];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function createDevCards({
  board,
  cards,
  victory,
  roads,
  pickerEl,
  getCamera,
  onLargestArmy,
} = {}) {
  // Every id in DEV_DECK has to be a card someone actually wrote, or a draw would come up empty
  // halfway through a session rather than at build time. Fail loudly, here, at startup.
  const missing = Object.keys(DEV_DECK).filter((id) => !DEV_BY_ID.has(id));
  if (missing.length) {
    throw new Error(
      `DEV_DECK (src/data.js) names dev card${missing.length === 1 ? '' : 's'} ` +
        `"${missing.join('", "')}" that content/extras.md has no entry for.`
    );
  }

  let queue = shuffle(Object.entries(DEV_DECK).flatMap(([id, n]) => Array(n).fill(id)));
  const played = []; // ids, in the order they were drawn
  let knights = 0;
  let largestArmy = false;
  let busy = false; // a card is face-up at the pile and its effect hasn't resolved
  let openCardEl = null; // a played card currently blown up to reading size

  const mounts = []; // { deckBtn, pileEl, countEl } — the world deck; mobile mounts its own

  // ------------------------------------------------------------------ the face of a card
  function faceHtml(card, { foot = '' } = {}) {
    return `
      <span class="dev-art"><img src="/art/cards/${card.art}.svg" alt=""></span>
      <span class="dev-text">
        <span class="dev-head">
          <span class="dev-eyebrow">development</span>
          <span class="dev-type">${esc(card.title)}</span>
          ${card.banner ? `<span class="dev-banner">${esc(card.banner)}</span>` : ''}
        </span>
        <span class="dev-body">${card.html}</span>
        ${foot ? `<span class="dev-foot">${esc(foot)}</span>` : ''}
      </span>`;
  }

  // ------------------------------------------------------------------ the played pile
  function pileCardEl(id, index) {
    const card = DEV_BY_ID.get(id);
    const el = document.createElement('button');
    el.type = 'button';
    el.className = 'dev-played-card';
    el.dataset.devId = id;
    el.dataset.index = String(index);
    el.setAttribute('aria-label', `${card.title}. Opens the card.`);
    el.innerHTML =
      `<img src="/art/cards/${card.art}.svg" alt="">` +
      `<span class="hand-tip"><b>${esc(card.title)}</b></span>`;
    el.addEventListener('click', (e) => {
      e.stopPropagation();
      openPlayed(el, id);
    });
    return el;
  }

  // Rebuilt wholesale rather than diffed, for the same reason the resource hand is: the pile is
  // at most 25 buttons, and a rebuild keeps the "same type sits together, in deck order" grouping
  // true for free. Cards are laid out by card type rather than by draw order, so eleven knights
  // are one overlapping stack instead of eleven slots — `.same-type` is what pulls each card
  // back over its predecessor, exactly as `.same-resource` does in the hand.
  function renderPile(el, { freshIndex = -1 } = {}) {
    el.innerHTML = '';
    const byType = DEV_CARDS.map((c) => c.id).flatMap((id) =>
      played.map((p, i) => (p === id ? i : -1)).filter((i) => i !== -1)
    );
    let lastId = null;
    for (const i of byType) {
      const id = played[i];
      const btn = pileCardEl(id, i);
      if (id === lastId) btn.classList.add('same-type');
      lastId = id;
      if (i === freshIndex) btn.classList.add('dealt');
      el.appendChild(btn);
    }
    if (freshIndex >= 0) {
      const fresh = el.querySelector(`[data-index="${freshIndex}"]`);
      if (fresh) setTimeout(() => fresh.classList.remove('dealt'), 1400);
    }
  }

  function refreshPiles(opts) {
    mounts.forEach((m) => renderPile(m.pileEl, opts));
  }

  // A played card blown back up to reading size, in place. Not a modal — it's a card on the
  // board that got bigger, so it closes on the next click anywhere.
  function openPlayed(el, id) {
    if (openCardEl === el) return closePlayed();
    closePlayed();
    const card = DEV_BY_ID.get(id);
    openCardEl = el;
    el.classList.add('is-open');
    const face = document.createElement('span');
    face.className = 'dev-open-face panel';
    face.innerHTML = faceHtml(card, { foot: 'click anywhere to put it back' });
    el.appendChild(face);
  }

  function closePlayed() {
    if (!openCardEl) return;
    openCardEl.classList.remove('is-open');
    openCardEl.querySelector('.dev-open-face')?.remove();
    openCardEl = null;
  }

  document.addEventListener('click', () => closePlayed());
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closePlayed();
  });

  // ------------------------------------------------------------------ the bank picker
  // Year of Plenty and Monopoly both need "which resource?", so they share one overlay.
  let pickState = null;

  const pickGrid = pickerEl.querySelector('.pick-grid');
  const pickTitle = pickerEl.querySelector('.pick-title');
  const pickSub = pickerEl.querySelector('.pick-sub');

  function renderPicker() {
    if (!pickState) return;
    pickTitle.textContent = pickState.title;
    pickSub.textContent = pickState.sub();
    pickGrid.innerHTML = RESOURCE_ORDER.map((r) => {
      const left = cards.remainingIn(r);
      const kind = RESOURCE_KINDS[r]?.label ?? r;
      const out = left === 0;
      return `
        <button type="button" class="pick-card${out ? ' out' : ''}" data-resource="${r}"${out ? ' disabled' : ''}>
          <img src="/art/cards/card-${r}.svg" alt="">
          <span class="pick-name">${esc(kind)}</span>
          <span class="pick-left">${out ? 'none left' : `${left} left`}</span>
        </button>`;
    }).join('');
    pickGrid.querySelectorAll('[data-resource]').forEach((b) =>
      b.addEventListener('click', () => pickState?.onPick(b.dataset.resource))
    );
  }

  function openPicker({ title, sub, onPick, onCancel }) {
    pickState = { title, sub, onPick, onCancel };
    renderPicker();
    pickerEl.hidden = false;
    requestAnimationFrame(() => pickerEl.classList.add('open'));
    pickGrid.querySelector('button:not([disabled])')?.focus({ preventScroll: true });
  }

  function closePicker() {
    if (!pickerEl.hidden) {
      pickerEl.classList.remove('open');
      pickerEl.hidden = true;
    }
    pickState = null;
  }

  pickerEl.querySelector('.pick-cancel')?.addEventListener('click', () => {
    const cancel = pickState?.onCancel;
    closePicker();
    cancel?.();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape' || pickerEl.hidden) return;
    e.preventDefault();
    const cancel = pickState?.onCancel;
    closePicker();
    cancel?.();
  });

  // ------------------------------------------------------------------ effects
  // Each returns nothing and calls `done()` when the card has finished being played. `done` is
  // what puts the card into the pile and hands the deck back, so every path has to reach it —
  // including the ones the visitor walks away from.
  const EFFECTS = {
    knight(done) {
      knights += 1;
      getCamera?.()?.setHome(true);
      cards.toast('Knight: move the robber onto any other plain tile and take that resource’s next card.');
      board.armRobber(cards.remainingByResource(), () => {
        if (knights === LARGEST_ARMY_KNIGHTS && !largestArmy) {
          largestArmy = true;
          onLargestArmy?.(knights);
          victory?.awardLargestArmy();
          cards.toast(`Three knights! Largest Army is yours. +2 victory points.`);
        }
        done();
      });
    },

    'year-of-plenty'(done) {
      let picked = 0;
      const step = () => {
        if (picked >= 2 || RESOURCE_ORDER.every((r) => cards.remainingIn(r) === 0)) {
          closePicker();
          if (!picked) cards.toast('Year of Plenty: the bank is empty, nothing to take.');
          done();
          return;
        }
        openPicker({
          title: 'Year of Plenty',
          sub: () => `Take any 2 from the bank. ${2 - picked} to go.`,
          onPick: (r) => {
            picked += 1;
            cards.grant(r);
            step();
          },
          onCancel: done,
        });
      };
      step();
    },

    monopoly(done) {
      openPicker({
        title: 'Monopoly',
        sub: () => 'Name one resource and take every card of it that is still out there.',
        onPick: (r) => {
          closePicker();
          cards.grantAll(r);
          done();
        },
        onCancel: done,
      });
    },

    'road-building'(done) {
      getCamera?.()?.setHome(true);
      cards.toast('Road Building: place 2 free roads, each connected to your network.');
      roads.arm(2, done);
    },

    library(done) {
      victory?.setDevPoints(played.filter((id) => id === 'library').length + 1);
      cards.toast('Library: a hidden victory point. +1.');
      setTimeout(done, reducedMotion() ? 0 : LINGER_MS);
    },
  };

  // ------------------------------------------------------------------ drawing
  function draw(mount) {
    if (busy || !queue.length) return;
    busy = true;
    closePlayed();
    const id = queue.pop();
    const card = DEV_BY_ID.get(id);
    const { deckBtn } = mount;

    const foot = {
      knight: 'move the robber to another plain tile',
      'year-of-plenty': 'pick 2 resources',
      monopoly: 'name a resource',
      'road-building': 'place 2 roads',
      library: '',
    }[id];

    deckBtn.querySelector('.dev-back').innerHTML = faceHtml(card, { foot });
    deckBtn.classList.add('flipped');
    deckBtn.setAttribute('aria-label', `Drew ${card.title}`);

    // The card is face up before its effect starts — otherwise a visitor is asked to move the
    // robber by a card they haven't been shown yet.
    const start = () => EFFECTS[id](() => finish(id));
    if (reducedMotion()) start();
    else setTimeout(start, FLIP_MS);
  }

  function finish(id) {
    played.push(id);
    // Library scores as it's played, so its point has already been counted; recount anyway, so
    // the pile is the single source of truth for how many are held.
    victory?.setDevPoints(played.filter((p) => p === 'library').length);
    refreshPiles({ freshIndex: played.length - 1 });
    mounts.forEach(({ deckBtn }) => {
      deckBtn.classList.remove('flipped');
      // Emptied only once the card has finished turning back over — wiping it on the same frame
      // would blank the face while it's still pointing at the reader.
      const clear = () => {
        if (!deckBtn.classList.contains('flipped')) deckBtn.querySelector('.dev-back').innerHTML = '';
      };
      if (reducedMotion()) clear();
      else setTimeout(clear, FLIP_MS);
    });
    busy = false;
    renderDecks();
  }

  // ------------------------------------------------------------------ mounting
  function renderDecks() {
    mounts.forEach(({ deckBtn, countEl }) => {
      const left = queue.length;
      deckBtn.classList.toggle('spent', left === 0);
      deckBtn.disabled = left === 0;
      countEl.textContent = left
        ? `click to draw · ${left} left`
        : 'the deck is spent · every card is on the table';
      deckBtn.setAttribute(
        'aria-label',
        left ? `Draw a development card. ${left} left in the deck.` : 'The development deck is empty'
      );
    });
  }

  function mountDeck(container) {
    const deckBtn = document.createElement('button');
    deckBtn.type = 'button';
    deckBtn.className = 'dev-deck';
    deckBtn.innerHTML = `
      <span class="dev-pile" aria-hidden="true"><i></i><i></i></span>
      <span class="dev-card">
        <span class="dev-face dev-front"><img src="/art/cards/card-dev-back.svg" alt=""></span>
        <span class="dev-face dev-back panel"></span>
      </span>`;

    const countEl = document.createElement('p');
    countEl.className = 'dev-caption';

    const pileEl = document.createElement('div');
    pileEl.className = 'dev-played';

    const mount = { deckBtn, countEl, pileEl };
    deckBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      draw(mount);
    });

    container.append(deckBtn, countEl, pileEl);
    mounts.push(mount);
    renderDecks();
    renderPile(pileEl);
    return mount;
  }

  return {
    mountDeck,
    isOpen: () => !pickerEl.hidden || !!openCardEl,
    knights: () => knights,
    hasLargestArmy: () => largestArmy,
    remaining: () => queue.length,
  };
}
