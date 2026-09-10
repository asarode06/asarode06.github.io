// One shared <dialog> drives every modal in the site: tile modals, road milestones, the
// Projects two-layer drill-down, the Trade contact form, and the desert easter egg.
// URL hashes go two deep (#projects, #projects/cipher-arena) so a section — or a single
// project — is linkable and the browser back button works.
//
// The Experience tile is the one exception: it has no modal at all. It hands off to the
// road-chain showcase (experience.js) through the openExperience/closeExperience callbacks, but
// still routes through here so #experience is linkable and the back button behaves the same as
// it does for every other section.
import {
  NAV_ORDER,
  RESOURCE_COLORS,
  RESUME_URL,
  TILES,
  CONTACT_LINKS,
  FORMSPREE_ENDPOINT,
} from './data.js';
// Every word rendered below is authored in content/*.md and compiled to HTML at build time — see
// src/content.js. Nothing in this module writes prose; it only decides which pre-rendered block
// goes in which slot.
import { CONTENT, TIMELINE, PROJECTS, DESERT_LINES, TRADE } from './content.js';
import { hexCenter, nearestInDirection } from './geometry.js';

function esc(s) {
  const d = document.createElement('div');
  d.textContent = s;
  return d.innerHTML;
}

function chip(text) {
  return `<span class="chip">${esc(text)}</span>`;
}

function cap(s) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function reducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

// Kept in step with the panel-rise / panel-fade timings in style.css.
const CLOSE_MS = 300;

export function initModal({
  modalEl,
  iconEl,
  tokenEl,
  eyebrowEl,
  titleEl,
  subEl,
  closeEl,
  bodyEl,
  navEl,
  openExperience,
  closeExperience,
  openCard,
  closeCard,
}) {
  let view = null; // { kind, id, parentId }
  let desertClicks = 0;

  // Arrow-key spatial nav candidates: the six content tiles plus desert, by world center.
  const navCandidates = TILES.map((t) => ({ id: t.id, ...hexCenter(t.row, t.col) }));

  function setHash(hash, replace = false) {
    const url = hash ? `#${hash}` : location.pathname + location.search;
    if (replace) history.replaceState(null, '', url);
    else history.pushState(null, '', url);
  }

  // Anything that opens a modal also takes over the screen, so the showcase has to stand down
  // first — silently, because whatever is opening owns the hash from here on.
  function leaveExperience() {
    closeExperience?.({ silent: true });
  }

  // Same deal for a flipped-open resource card: it's a full-screen overlay of its own.
  function leaveCards() {
    closeCard?.({ silent: true, instant: true });
  }

  // The header band every panel on the site shares: an icon, a small eyebrow pill, the title,
  // and a one-line subtitle. See the "shared panel chrome" section of style.css — the resource
  // card panel and an expanded Experience card fill in exactly the same slots.
  function setHeader({ icon, hex = true, token, eyebrow, title, sub, accent }) {
    iconEl.src = icon || '';
    iconEl.hidden = !icon;
    iconEl.classList.toggle('hex', !!hex);
    tokenEl.src = token || '';
    tokenEl.hidden = !token;
    eyebrowEl.textContent = eyebrow || '';
    titleEl.textContent = title;
    subEl.textContent = sub || '';
    modalEl.style.setProperty('--accent', accent || 'var(--paper)');
  }

  // ---------------------------------------------------------------- open / close animation
  // The panel grows out of whatever was clicked to summon it — a hex, a road piece, the Trade
  // button — which is this modal's answer to the resource card's flip and the road chain's lift.
  // Everything that opens a view names its origin element; anything unfound just grows from the
  // middle of the screen.
  function originFor(v) {
    if (!v) return null;
    const id = v.kind === 'detail' ? v.parentId : v.kind === 'desert' ? 'desert' : v.id;
    // Two candidates for most views: the hex on the board, and the row button that stands in for
    // it on the mobile page. Both are always in the DOM and only one of them is ever displayed,
    // so pick whichever actually has a box — a display:none element measures as a 0×0 rect at
    // the origin, which would fling the panel out of the top-left corner.
    const selectors = {
      tile: [`.tile.content[data-tile-id="${id}"]`, `.m-tile[data-tile="${id}"]`],
      detail: [`.tile.content[data-tile-id="${id}"]`, `.m-tile[data-tile="${id}"]`],
      desert: ['.tile.content[data-tile-id="desert"]', '.m-tile[data-tile="desert"]'],
      milestone: [`.road-layer:not(.exp-road) [data-node="${id}"]`, `.m-milestone[data-milestone="${id}"]`],
      contact: ['#trade-btn', '.m-trade'],
    }[v.kind];
    for (const sel of selectors ?? []) {
      const el = document.querySelector(sel);
      if (el && el.getBoundingClientRect().width > 0) return el;
    }
    return null;
  }

  function present(v) {
    const reopening = !modalEl.open;
    cancelClose();
    if (reopening) modalEl.showModal();
    if (reducedMotion()) return;

    // Recomputed on every present, a prev/next swap included, so closing always sinks back
    // towards whatever the panel is currently showing rather than the first thing it showed.
    const box = modalEl.getBoundingClientRect();
    const from = originFor(v)?.getBoundingClientRect();
    const cx = from ? from.left + from.width / 2 : window.innerWidth / 2;
    const cy = from ? from.top + from.height / 2 : window.innerHeight / 2;
    modalEl.style.setProperty('--from-x', `${Math.round(cx - (box.left + box.width / 2))}px`);
    modalEl.style.setProperty('--from-y', `${Math.round(cy - (box.top + box.height / 2))}px`);
    modalEl.style.setProperty(
      '--from-scale',
      from ? String(Math.min(0.55, Math.max(0.1, from.width / box.width))) : '0.86'
    );

    modalEl.classList.remove('opening', 'swapping');
    void modalEl.offsetWidth; // restart the animation even on a rapid second open
    // Already on screen (prev/next, an arrow key): it settles in place rather than flying back
    // out to a hex and returning.
    modalEl.classList.add(reopening ? 'opening' : 'swapping');
  }

  modalEl.addEventListener('animationend', (e) => {
    if (e.target === modalEl) modalEl.classList.remove('opening', 'swapping');
  });

  function renderNav(id) {
    const idx = NAV_ORDER.indexOf(id);
    if (idx === -1) {
      navEl.innerHTML = '';
      return;
    }
    const prev = NAV_ORDER[(idx - 1 + NAV_ORDER.length) % NAV_ORDER.length];
    const next = NAV_ORDER[(idx + 1) % NAV_ORDER.length];
    navEl.innerHTML = `
      <button type="button" class="nav-prev" data-nav="${prev}">← ${esc(CONTENT[prev].title)}</button>
      <button type="button" class="nav-next" data-nav="${next}">${esc(CONTENT[next].title)} →</button>`;
    navEl.querySelectorAll('[data-nav]').forEach((b) => {
      b.addEventListener('click', () => openTile(b.dataset.nav));
    });
  }

  function renderBack(parentId) {
    navEl.innerHTML = `<button type="button" class="nav-back">← ${esc(CONTENT[parentId].title)}</button>`;
    navEl.querySelector('.nav-back').addEventListener('click', () => openTile(parentId));
  }

  // ---------------------------------------------------------------- tile modals
  function openTile(id, { pushHash = true } = {}) {
    if (id === 'experience') {
      // No modal for this one — the board's road chain lifts off instead. Close first: the
      // dialog's own close handler wipes the hash, which would undo the one set just below.
      close({ instant: true });
      leaveCards();
      view = { kind: 'experience', id };
      if (pushHash) setHash(id);
      openExperience?.();
      return;
    }
    leaveExperience();
    leaveCards();
    const data = CONTENT[id];
    const tile = TILES.find((t) => t.id === id);
    if (!data || !tile) return;
    view = { kind: 'tile', id };

    setHeader({
      icon: `/art/tiles/${id}.svg`,
      token: tile.token ? `/art/tokens/token-${tile.token}.svg` : null,
      eyebrow: `${cap(tile.type)} tile${tile.token ? ` · rolls ${tile.token}` : ''}`,
      title: data.title,
      sub: data.summary,
      accent: RESOURCE_COLORS[tile.type],
    });

    // The tile's own prose, straight from content/tiles.md. Three tiles then get machinery
    // appended that can't sensibly be written by hand: the résumé's embedded PDF, the Skills
    // groups (which need their resource colours), and the Projects grid (whose cards are the
    // entries in content/projects.md).
    let html = data.body;

    if (id === 'resume') {
      html =
        `<embed class="resume-embed" src="${RESUME_URL}" type="application/pdf" aria-label="Résumé preview">` +
        `<p class="embed-fallback">Preview not loading? <a href="${RESUME_URL}" target="_blank" rel="noopener">Open the PDF directly</a>.</p>` +
        html;
    }

    if (data.groups?.length) {
      html += data.groups
        .map(
          (g) =>
            `<h3 style="color:${RESOURCE_COLORS[g.resource]}">${esc(g.label)}</h3><div class="chips">${g.items
              .map(chip)
              .join('')}</div>`
        )
        .join('');
    }

    const items = itemsFor(id);
    if (items.length) {
      html += `<div class="card-grid">${items
        .map(
          (item) =>
            `<button type="button" class="card-grid-item" data-item="${item.id}">
              <h4>${esc(item.title)}</h4><p>${esc(item.subtitle)}</p>
            </button>`
        )
        .join('')}</div>`;
    }

    bodyEl.innerHTML = html;

    bodyEl.querySelectorAll('[data-item]').forEach((b) => {
      b.addEventListener('click', () => openDetail(id, b.dataset.item));
    });

    renderNav(id);
    if (pushHash) setHash(id);
    present(view);
  }

  // ---------------------------------------------------------------- layer 2: item detail
  // Only the Projects tile drills down a second level, and its items are the very same entries
  // the wood deck is built from — so a project reads identically whether you arrive through the
  // tile or by flipping its card out of the hand.
  function itemsFor(parentId) {
    return parentId === 'projects' ? PROJECTS : [];
  }

  function findItem(parentId, itemId) {
    return itemsFor(parentId).find((i) => i.id === itemId);
  }

  function openDetail(parentId, itemId, { pushHash = true } = {}) {
    leaveExperience();
    leaveCards();
    const item = findItem(parentId, itemId);
    const tile = TILES.find((t) => t.id === parentId);
    if (!item || !tile) return;
    view = { kind: 'detail', id: itemId, parentId };

    setHeader({
      icon: `/art/tiles/${parentId}.svg`,
      token: null,
      eyebrow: CONTENT[parentId].title,
      title: item.title,
      sub: item.subtitle,
      accent: RESOURCE_COLORS[tile.type],
    });

    bodyEl.innerHTML = item.body;

    renderBack(parentId);
    if (pushHash) setHash(`${parentId}/${itemId}`);
    present(view);
  }

  // ---------------------------------------------------------------- road milestones
  function openMilestone(id, { pushHash = true } = {}) {
    leaveExperience();
    leaveCards();
    const m = TIMELINE.find((t) => t.id === id);
    if (!m) return;
    view = { kind: 'milestone', id };

    setHeader({
      icon: `/art/pieces/${m.piece === 'ghost' ? 'settlement' : m.piece}.svg`,
      hex: false,
      token: null,
      eyebrow: m.dates,
      title: m.title,
      sub: m.subtitle,
      accent: 'var(--player)',
    });

    // The whole entry, both halves of the fold. Only the collapsed showcase card is
    // height-limited enough to want `teaser` on its own.
    bodyEl.innerHTML = m.body;

    const idx = TIMELINE.findIndex((t) => t.id === id);
    const prev = TIMELINE[(idx - 1 + TIMELINE.length) % TIMELINE.length];
    const next = TIMELINE[(idx + 1) % TIMELINE.length];
    navEl.innerHTML = `
      <button type="button" class="nav-prev" data-nav="${prev.id}">← ${esc(prev.title)}</button>
      <button type="button" class="nav-next" data-nav="${next.id}">${esc(next.title)} →</button>`;
    navEl.querySelectorAll('[data-nav]').forEach((b) => b.addEventListener('click', () => openMilestone(b.dataset.nav)));

    if (pushHash) setHash(id);
    present(view);
  }

  // ---------------------------------------------------------------- resource cards
  // Like the Experience showcase, a resource card is its own overlay rather than this dialog —
  // but the hash lives here with every other route so #card/<id> is linkable and the back
  // button unwinds it the same way it unwinds a tile.
  function openCardView(id, { pushHash = true } = {}) {
    if (!openCard) return;
    close({ instant: true });
    leaveExperience();
    if (!openCard(id)) return; // unknown id (a stale link) — leave the board alone
    view = { kind: 'card', id };
    if (pushHash) setHash(`card/${id}`);
  }

  function onCardClosed() {
    if (view?.kind !== 'card') return;
    view = null;
    history.replaceState(null, '', location.pathname + location.search);
  }

  // ---------------------------------------------------------------- desert easter egg
  function openDesert() {
    leaveExperience();
    leaveCards();
    desertClicks = Math.min(desertClicks + 1, DESERT_LINES.length);
    view = { kind: 'desert' };
    setHeader({
      icon: '/art/tiles/desert.svg',
      token: null,
      eyebrow: `Desert · ${desertClicks} click${desertClicks === 1 ? '' : 's'}`,
      title: 'Desert',
      accent: RESOURCE_COLORS.desert,
    });
    bodyEl.innerHTML = `<p class="summary">${esc(DESERT_LINES[desertClicks - 1])}</p>`;
    navEl.innerHTML = '';
    setHash('desert');
    present(view);
  }

  // ---------------------------------------------------------------- trade / contact
  function openContact() {
    leaveExperience();
    leaveCards();
    view = { kind: 'contact' };
    setHeader({
      icon: '/art/pieces/port.svg',
      hex: false,
      token: null,
      eyebrow: 'Ports open',
      title: TRADE.title,
      sub: TRADE.subtitle,
      accent: 'var(--player)',
    });
    const configured = !FORMSPREE_ENDPOINT.includes('REPLACE_ME');
    bodyEl.innerHTML = `
      ${TRADE.body}
      ${
        configured
          ? `<form class="contact-form" action="${FORMSPREE_ENDPOINT}" method="POST">
              <label>Name <input type="text" name="name" required></label>
              <label>Email <input type="email" name="email" required></label>
              <label>Message <textarea name="message" rows="4" required></textarea></label>
              <button type="submit">Send</button>
            </form>`
          : `<p class="embed-fallback">The contact form isn't wired up yet, so email me directly instead.</p>`
      }
      <p class="links">${CONTACT_LINKS.map((l) => `<a href="${l.href}" target="_blank" rel="noopener">${esc(l.label)}</a>`).join(' · ')}</p>`;
    navEl.innerHTML = '';
    setHash('trade');
    present(view);
  }

  // ---------------------------------------------------------------- close + hash routing
  // Called back by experience.js when the user dismisses the showcase itself.
  function onExperienceClosed() {
    if (view?.kind !== 'experience') return;
    view = null;
    history.replaceState(null, '', location.pathname + location.search);
  }

  // The reverse of present(): the panel sinks back towards where it came from before the dialog
  // actually closes. `instant` is for the cases where something else is taking the screen (the
  // showcase, a resource card) and a 300ms rewind under it would just read as a glitch.
  let closeTimer = 0;

  function cancelClose() {
    if (!closeTimer) return;
    clearTimeout(closeTimer);
    closeTimer = 0;
    modalEl.classList.remove('closing');
  }

  function close({ instant = false } = {}) {
    if (!modalEl.open) return;
    if (instant || reducedMotion()) {
      cancelClose();
      modalEl.close();
      return;
    }
    if (closeTimer) return; // already sinking
    modalEl.classList.add('closing');
    closeTimer = setTimeout(() => {
      closeTimer = 0;
      modalEl.classList.remove('closing');
      modalEl.close();
    }, CLOSE_MS);
  }

  // Escape reaches the dialog before anything else does, and would close it outright.
  modalEl.addEventListener('cancel', (e) => {
    if (reducedMotion()) return;
    e.preventDefault();
    close();
  });

  // `dialog.close()` fires this asynchronously, so it can land *after* openTile() has already
  // handed the screen to the showcase — bail out rather than wipe the hash the showcase set.
  modalEl.addEventListener('close', () => {
    if (view?.kind === 'experience' || view?.kind === 'card') return;
    view = null;
    history.replaceState(null, '', location.pathname + location.search);
  });
  modalEl.addEventListener('click', (e) => {
    if (e.target === modalEl) close(); // click on ::backdrop area lands on the dialog element itself
  });
  // A dialog only reports its own box for pointer hits, so a click on the shadow's spill or the
  // ::backdrop lands on the element — but during the sink the panel is pointer-events: none, so
  // nothing can land at all. Nothing to guard beyond the `closeTimer` check in close().
  closeEl.addEventListener('click', close);

  function routeFromHash() {
    const h = location.hash.slice(1);
    if (!h) {
      close();
      leaveExperience();
    leaveCards();
      view = null;
      return;
    }
    const [a, b] = h.split('/');
    if (a === 'trade') openContact();
    else if (b && itemsFor(a).length) openDetail(a, b, { pushHash: false });
    else if (CONTENT[a]) openTile(a, { pushHash: false });
    else if (TIMELINE.some((t) => t.id === a)) openMilestone(a, { pushHash: false });
  }
  window.addEventListener('popstate', routeFromHash);

  // ---------------------------------------------------------------- arrow-key spatial nav
  modalEl.addEventListener('keydown', (e) => {
    const tag = document.activeElement?.tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA') return;
    const dirs = { ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right' };
    const dir = dirs[e.key];
    if (!dir || !view) return;
    const fromId = view.kind === 'tile' ? view.id : view.kind === 'detail' ? view.parentId : null;
    if (!fromId) return;
    const from = navCandidates.find((c) => c.id === fromId);
    if (!from) return;
    const target = nearestInDirection(from, dir, navCandidates.filter((c) => c.id !== fromId));
    if (!target) return;
    e.preventDefault();
    if (target.id === 'desert') openDesert();
    else openTile(target.id);
  });

  return {
    openTile,
    openMilestone,
    openDetail,
    openContact,
    openDesert,
    openCard: openCardView,
    close,
    onExperienceClosed,
    onCardClosed,
    // main.js calls this once everything is mounted — a deep-linked #hash can drive the camera
    // and the showcase, so neither may be constructed after the first route runs.
    route: routeFromHash,
    isOpen: () => modalEl.open,
  };
}
