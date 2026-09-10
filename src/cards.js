// The resource hand: five decks of content cards, and the flip-into-a-panel animation.
//
// The decks themselves are assembled in src/content.js out of `content/*.md`, compiled to
// pre-rendered HTML at build time — so no markdown parser ships to the browser and opening a
// card costs one innerHTML assignment. Two of the five decks are the *same* writing as a tile
// elsewhere on the board (wood cards are the projects, wheat cards are the roles), which is why
// this module takes them ready-made rather than filtering a flat list itself.
//
// The game layer: one card per resource is dealt at the start. The rest sit face-down in their
// deck until the player rolls a 7 and drops the robber on a plain tile — robbing a wood tile
// deals the next wood card, and so on, so the board's own mechanic is what unlocks the content.
import { CARDS, DECKS } from './content.js';
import { RESOURCE_KINDS, RESOURCE_ORDER } from './data.js';

const BY_ID = new Map(CARDS.map((c) => [c.id, c]));

// Panel geometry. The inner panel is laid out once at this size and the animating box clips it,
// so growing from card to panel never reflows the card's text.
const PANEL_MAX_W = 720;
const PANEL_MAX_H = 620;
const PANEL_MARGIN = 24;
const PANEL_BORDER = 3; // .rc-back's border, which the inner panel has to sit inside

// Kept in step with the transition timings in style.css (.rc-flip / .rc-overlay).
const OPEN_MS = 760;
const CLOSE_MS = 700;

function reducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function esc(s) {
  const d = document.createElement('div');
  d.textContent = s;
  return d.innerHTML;
}

function panelRect() {
  const w = Math.min(PANEL_MAX_W, window.innerWidth - PANEL_MARGIN * 2);
  const h = Math.min(PANEL_MAX_H, window.innerHeight - PANEL_MARGIN * 2);
  return {
    width: w,
    height: h,
    left: (window.innerWidth - w) / 2,
    top: (window.innerHeight - h) / 2,
  };
}

export function createResourceCards({ overlayEl, onActivate, onClosed, unlockAll = false } = {}) {
  // Which cards are in the hand. The first card of every deck starts there; the rest are earned.
  // A deep link to a locked card claims it outright — a shared URL has to resolve to something.
  const claimed = new Set(
    unlockAll ? CARDS.map((c) => c.id) : RESOURCE_ORDER.map((r) => DECKS.get(r)[0]?.id).filter(Boolean)
  );

  const mounts = []; // every rendered hand (the world-space one, and the mobile strip)
  let openId = null;
  let sourceEl = null; // the hand card the panel flew out of, hidden while it's open
  let lastFocus = null;
  let animTimer = 0;

  // ------------------------------------------------------------------ hand rendering
  function handCards() {
    return RESOURCE_ORDER.flatMap((r) => DECKS.get(r).filter((c) => claimed.has(c.id)));
  }

  function cardButton(card) {
    const el = document.createElement('button');
    el.type = 'button';
    el.className = `hand-card ${card.resource}`;
    el.dataset.cardId = card.id;
    el.setAttribute('aria-label', `${card.label}: ${card.title}. Opens the card.`);
    el.innerHTML =
      `<img src="/art/cards/card-${card.resource}.svg" alt="">` +
      `<span class="hand-tip"><b>${esc(card.title)}</b></span>`;
    el.addEventListener('click', () => onActivate?.(card.id));
    return el;
  }

  // Rebuilt wholesale rather than diffed: the hand is at most a couple of dozen buttons, and a
  // rebuild keeps the "same resource sits together, in deck order" invariant for free.
  function renderHand(el, { dealtId } = {}) {
    el.innerHTML = '';
    let lastResource = null;
    for (const card of handCards()) {
      const btn = cardButton(card);
      if (lastResource && card.resource === lastResource) btn.classList.add('same-resource');
      lastResource = card.resource;
      if (card.id === dealtId) btn.classList.add('dealt');
      el.appendChild(btn);
    }
    if (dealtId) {
      const fresh = el.querySelector(`[data-card-id="${dealtId}"]`);
      if (fresh) setTimeout(() => fresh.classList.remove('dealt'), 1400);
    }
  }

  function mountHand(container) {
    const el = document.createElement('div');
    el.className = 'hand';
    container.appendChild(el);
    mounts.push(el);
    renderHand(el);
    return el;
  }

  function refreshHands(opts) {
    mounts.forEach((el) => renderHand(el, opts));
  }

  // Prefer a hand that's actually on screen: both the world hand and the mobile strip exist in
  // the DOM at all times, and only one of them is displayed at a given viewport width.
  function findSourceEl(id) {
    for (const el of mounts) {
      const btn = el.querySelector(`[data-card-id="${id}"]`);
      if (btn && btn.offsetParent !== null) return btn;
    }
    return null;
  }

  // ------------------------------------------------------------------ the panel
  const scrim = overlayEl.querySelector('.rc-scrim');
  const flip = overlayEl.querySelector('.rc-flip');
  const frontImg = overlayEl.querySelector('.rc-front img');
  const iconEl = overlayEl.querySelector('.rc-icon');
  const panel = overlayEl.querySelector('.rc-panel');
  const kindEl = overlayEl.querySelector('.rc-kind');
  const titleEl = overlayEl.querySelector('.rc-panel-head h2');
  const subEl = overlayEl.querySelector('.rc-sub');
  const bodyEl = overlayEl.querySelector('.rc-panel-body');
  const closeBtn = overlayEl.querySelector('.rc-close');
  const deckEl = overlayEl.querySelector('.rc-deck');

  function setBox(rect) {
    flip.style.left = rect.left + 'px';
    flip.style.top = rect.top + 'px';
    flip.style.width = rect.width + 'px';
    flip.style.height = rect.height + 'px';
  }

  // The panel is pinned to its final size and clipped by the box above, never sized off it —
  // that's what keeps the card's text from being re-laid-out on every frame of the flight.
  function sizePanel(rect) {
    panel.style.width = rect.width - PANEL_BORDER * 2 + 'px';
    panel.style.height = rect.height - PANEL_BORDER * 2 + 'px';
  }

  function show(id) {
    const card = BY_ID.get(id);
    if (!card) return false;
    if (openId === id && !overlayEl.hidden) return true;
    // A previous card's close animation (or another open) may still be mid-flight — its
    // `openId` is already cleared, but the overlay is still visible and CSS is still
    // transitioning it. Snap that shut synchronously before starting a fresh open, or the new
    // card's animation layers on top of the old one and flashes the old card for a frame.
    if (openId || !overlayEl.hidden) hide({ silent: true, instant: true });

    // A deep link can name a card still face-down in its deck — claim it so the hand it flies
    // back into actually contains it.
    if (!claimed.has(id)) {
      claimed.add(id);
      refreshHands();
    }

    openId = id;
    lastFocus = document.activeElement;

    kindEl.textContent = card.label;
    titleEl.textContent = card.title;
    subEl.textContent = card.subtitle;
    subEl.hidden = !card.subtitle;
    bodyEl.innerHTML = card.html;
    bodyEl.scrollTop = 0;
    frontImg.src = `/art/cards/card-${card.resource}.svg`;
    iconEl.src = `/art/cards/card-${card.resource}.svg`;
    overlayEl.dataset.resource = card.resource;
    overlayEl.setAttribute('aria-label', `${card.label}: ${card.title}`);

    const deck = DECKS.get(card.resource) ?? [];
    const held = deck.filter((c) => claimed.has(c.id)).length;
    deckEl.textContent =
      `${card.resource} · card ${deck.indexOf(card) + 1} of ${deck.length}` +
      (held < deck.length ? ` · ${deck.length - held} still in the deck` : '');

    sourceEl = findSourceEl(id);
    const from = sourceEl?.getBoundingClientRect();
    const to = panelRect();
    sizePanel(to);

    overlayEl.hidden = false;
    document.body.classList.add('rc-open');
    clearTimeout(animTimer);

    if (reducedMotion() || !from) {
      flip.classList.add('instant');
      setBox(to);
      overlayEl.classList.add('open', 'landed');
      sourceEl?.classList.add('is-lifted');
      requestAnimationFrame(() => flip.classList.remove('instant'));
    } else {
      flip.classList.remove('instant', 'closing');
      overlayEl.classList.remove('open', 'landed');
      setBox(from);
      sourceEl.classList.add('is-lifted');
      // Two frames: one to commit the starting box, one to let the transition see the change.
      requestAnimationFrame(() =>
        requestAnimationFrame(() => {
          overlayEl.classList.add('open');
          setBox(to);
          animTimer = setTimeout(() => overlayEl.classList.add('landed'), OPEN_MS);
        })
      );
    }

    closeBtn.focus({ preventScroll: true });
    return true;
  }

  function hide({ silent = false, instant = false } = {}) {
    // Nothing open and nothing mid-animation — a genuine no-op, safe to skip.
    if (!openId && overlayEl.hidden) return;
    const id = openId;
    const wasOpen = !!openId;
    openId = null;
    clearTimeout(animTimer);
    overlayEl.classList.remove('landed');

    const finish = () => {
      overlayEl.hidden = true;
      overlayEl.classList.remove('open', 'closing');
      flip.classList.remove('closing', 'instant');
      document.body.classList.remove('rc-open');
      bodyEl.innerHTML = '';
      // Order matters: a visibility:hidden element can't take focus, so the card has to be
      // back in the hand before focus is handed to it.
      sourceEl?.classList.remove('is-lifted');
      sourceEl = null;
      const back = lastFocus?.isConnected ? lastFocus : findSourceEl(id);
      back?.focus({ preventScroll: true });
      lastFocus = null;
    };

    if (instant || reducedMotion()) {
      finish();
    } else {
      // Re-measure: the window may have been resized while the panel was up.
      const back = findSourceEl(id)?.getBoundingClientRect();
      if (!back) {
        finish();
      } else {
        flip.classList.add('closing');
        overlayEl.classList.remove('open');
        setBox(back);
        animTimer = setTimeout(finish, CLOSE_MS);
      }
    }

    if (!silent && wasOpen) onClosed?.();
  }

  // A resize while the panel is open would otherwise leave it off-centre, or larger than the
  // window. Snap rather than animate — this isn't a transition the reader asked for.
  window.addEventListener('resize', () => {
    if (!openId) return;
    const to = panelRect();
    flip.classList.add('instant');
    sizePanel(to);
    setBox(to);
    requestAnimationFrame(() => flip.classList.remove('instant'));
  });

  closeBtn.addEventListener('click', () => hide());
  scrim.addEventListener('click', () => hide());
  overlayEl.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      hide();
      return;
    }
    if (e.key !== 'Tab') return;
    // Light focus trap — this is a hand-rolled overlay, not a <dialog>, so nothing keeps Tab
    // from walking out into the board behind it.
    const focusables = overlayEl.querySelectorAll('button, [href], input, textarea, [tabindex]:not([tabindex="-1"])');
    if (!focusables.length) return;
    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  });

  // ------------------------------------------------------------------ robbing
  function remainingIn(resource) {
    return (DECKS.get(resource) ?? []).filter((c) => !claimed.has(c.id)).length;
  }

  function remainingByResource() {
    return Object.fromEntries(RESOURCE_ORDER.map((r) => [r, remainingIn(r)]));
  }

  // The robber landed on a plain tile of `resource`: deal the next card down in that deck.
  // Returns the card, or null when that deck is already empty.
  function grant(resource) {
    const next = (DECKS.get(resource) ?? []).find((c) => !claimed.has(c.id));
    const kind = RESOURCE_KINDS[resource]?.label?.toLowerCase() ?? resource;
    if (!next) {
      const total = (DECKS.get(resource) ?? []).length;
      const everything = RESOURCE_ORDER.every((r) => remainingIn(r) === 0);
      toast(
        everything
          ? `That deck is empty, and so is every other one. All ${CARDS.length} cards are in your hand.`
          : `No ${resource} left to steal: all ${total} ${kind} card${total === 1 ? '' : 's'} are already in your hand. Try another tile next 7.`
      );
      return null;
    }
    claimed.add(next.id);
    refreshHands({ dealtId: next.id });
    toast(`Robbed a ${resource} tile! New ${kind} card: “${next.title}”. Click it to flip it over.`);
    return next;
  }

  // Monopoly: every card still face-down in one deck comes over at once. The deal animation is
  // staggered rather than fired on all of them together, so a five-card sweep reads as a sweep
  // instead of one flash — `dealtId` only marks one card, hence the per-card delay here.
  function grantAll(resource) {
    const taken = (DECKS.get(resource) ?? []).filter((c) => !claimed.has(c.id));
    const kind = RESOURCE_KINDS[resource]?.label?.toLowerCase() ?? resource;
    if (!taken.length) {
      toast(`Monopoly on ${resource}, but every ${kind} card is already in your hand.`);
      return [];
    }
    taken.forEach((c) => claimed.add(c.id));
    refreshHands();
    taken.forEach((c, i) => {
      setTimeout(() => {
        mounts.forEach((el) => {
          const btn = el.querySelector(`[data-card-id="${c.id}"]`);
          if (!btn) return;
          btn.classList.add('dealt');
          setTimeout(() => btn.classList.remove('dealt'), 1400);
        });
      }, i * 130);
    });
    toast(
      `Monopoly on ${resource}, you take all ${taken.length} remaining ${kind} card${taken.length === 1 ? '' : 's'}.`
    );
    return taken;
  }

  // ------------------------------------------------------------------ toast
  // Top-centre, where the site's own title sits — so `body.toast-up` fades the header out for as
  // long as a message is up and back in behind it. The bottom of the screen is the resource
  // hand's, and a toast parked over the cards it is talking about was the worst place for it.
  const toastEl = document.createElement('div');
  toastEl.className = 'rc-toast';
  toastEl.setAttribute('role', 'status');
  toastEl.setAttribute('aria-live', 'polite');
  toastEl.hidden = true;
  document.body.appendChild(toastEl);
  let toastTimer = 0;

  function toast(message, ms = 6000) {
    toastEl.textContent = message;
    toastEl.hidden = false;
    // Restart the fade-in even if a message is already up.
    toastEl.classList.remove('up');
    void toastEl.offsetWidth;
    toastEl.classList.add('up');
    document.body.classList.add('toast-up');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      toastEl.classList.remove('up');
      // Dropped on the same tick the toast starts fading, so the title is coming back as the
      // message leaves rather than after a beat of empty space.
      document.body.classList.remove('toast-up');
      setTimeout(() => (toastEl.hidden = true), 350);
    }, ms);
  }

  return {
    mountHand,
    show,
    hide,
    toast,
    grant,
    grantAll,
    remainingIn,
    remainingByResource,
    isOpen: () => !!openId,
    has: (id) => BY_ID.has(id),
    count: CARDS.length,
  };
}
