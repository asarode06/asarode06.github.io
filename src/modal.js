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
  CONTACT_EMAIL,
  CONTACT_ENDPOINT,
} from './data.js';
// Every word rendered below is authored in content/*.md and compiled to HTML at build time — see
// src/content.js. Nothing in this module writes prose; it only decides which pre-rendered block
// goes in which slot.
import { CONTENT, TIMELINE, PROJECTS, DESERT_LINES, TRADE, RESUME } from './content.js';
import { hexCenter, nearestInDirection } from './geometry.js';

// What the résumé sheet is actually painted at, kept in step with `--print-w` on .resume-sheet
// in style.css. Same arrangement as SLIDE_SIZES in photos.js: whoever displays a photo owns the
// hint the browser picks its rung off `srcset` with.
const RESUME_SHEET_W = '128px';

// The résumé, as text. An image of a Letter page needs to be painted about 900px wide before
// 10pt type is comfortable, and a phone can't paint it wider than the screen — so the document is
// authored again as words in content/resume.md and set here at the site's own reading size. The
// PDF is still offered underneath, and the page image still sits there as a print, because the
// file is what a recruiter actually files away.
function resumeHtml() {
  return RESUME.map(
    (section) => `<section class="cv-section">
      <h3 class="cv-heading">${esc(section.name)}</h3>
      ${section.entries.map(resumeEntry).join('')}
    </section>`
  ).join('');
}

function resumeEntry(e) {
  let html = '';
  if (e.showTitle) {
    // Two rows that each push a left half against a right half: employer/dates, then role/place.
    // The right half is dropped entirely rather than left empty, so an entry with no location
    // closes up instead of leaving a gap where one would have been.
    html +=
      `<div class="cv-line"><h4>${esc(e.title)}</h4>` +
      (e.dates ? `<span class="cv-when">${esc(e.dates)}</span>` : '') +
      `</div>`;
    const left = e.subtitle || (e.stack.length ? e.stack.join(' · ') : '');
    if (left || e.location) {
      html +=
        `<div class="cv-line cv-sub">` +
        (left ? `<span${e.subtitle ? '' : ' class="cv-stack"'}>${esc(left)}</span>` : '<span></span>') +
        (e.location ? `<span class="cv-where">${esc(e.location)}</span>` : '') +
        `</div>`;
    }
  }
  if (e.rows.length) {
    html += `<dl class="cv-rows">${e.rows
      .map((r) => `<dt>${esc(r.label)}</dt><dd>${esc(r.value)}</dd>`)
      .join('')}</dl>`;
  }
  html += e.bullets; // already rendered markdown — the résumé's own bullet list
  return `<div class="cv-entry">${html}</div>`;
}

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
    // appended that can't sensibly be written by hand: the résumé's download line, the Skills
    // groups (which need their resource colours), and the Projects grid (whose cards are the
    // entries in content/projects.md).
    let html = data.body;

    // The résumé used to be an <embed>, i.e. the browser's own PDF plugin: its toolbar and grey
    // mat in the middle of a hand-drawn board, a US-Letter page squeezed into a 320px window,
    // and nothing at all on iOS, which won't render a PDF inline. It's a page — so it's a print,
    // authored as an ordinary markdown image in tiles.md and dealt out as a one-print pile like
    // every other photo. Two things make it read as a document rather than a snapshot: the pile
    // is tagged so CSS lays it out as a full uncropped sheet, and the PDF itself is offered
    // underneath, since a print is for looking at and the file is what a recruiter actually wants.
    if (id === 'resume') {
      html += resumeHtml();
      html +=
        `<p class="resume-get"><a href="${RESUME_URL}" target="_blank" rel="noopener" download>` +
        `Download the PDF</a></p>`;
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

    // Tagged after the fact rather than authored: plugins/content.js deals every run of images
    // out as the same pile, and which pile is a résumé is this tile's business, not the parser's.
    // `sizes` has to move with it — the build baked in the 150px a print is normally painted at,
    // and a sheet is painted at whatever the rule below says, so leaving it would hand the
    // browser a rung it has to upscale. See plugins/images.js.
    if (id === 'resume') {
      const sheet = bodyEl.querySelector('.photo-stack');
      const get = bodyEl.querySelector('.resume-get');
      if (sheet) {
        sheet.classList.add('resume-sheet');
        const img = sheet.querySelector('img');
        if (img) img.sizes = RESUME_SHEET_W;
      }
      // The print and the download button are one thing — "and here's the file itself" — so they
      // end up paired at the foot of the résumé rather than the print floating at the top where
      // it's authored. Moved rather than re-authored: the pile has to be dealt by the content
      // plugin to get its srcset, and only this tile knows where it wants it.
      if (sheet && get) {
        const file = document.createElement('div');
        file.className = 'resume-file';
        get.before(file);
        file.append(sheet, get);
      }
    }

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
  // The form posts to the Worker in `worker/` rather than to the page it came from, because
  // GitHub Pages has no server to post to. Until that endpoint is real the modal falls back to
  // the plain links, so the Trade tile is never a dead end.
  const contactConfigured = () => !CONTACT_ENDPOINT.includes('REPLACE_ME');

  // Submitting is deliberately not a page navigation. Everything else on this site keeps the
  // visitor inside one continuous board, and handing them off to a third party's thank-you page
  // would be the one click that throws them out of it — so the send happens in place and the
  // form is replaced by its own confirmation.
  function contactFormHtml() {
    return `
      <form class="contact-form" novalidate>
        <label>Name <input type="text" name="name" maxlength="120" autocomplete="name" required></label>
        <label>Email <input type="email" name="email" maxlength="200" autocomplete="email" required></label>
        <label>Message <textarea name="message" rows="4" maxlength="4000" required></textarea></label>
        <div class="hp" aria-hidden="true">
          <label>Website <input type="text" name="website" tabindex="-1" autocomplete="off"></label>
        </div>
        <div class="contact-actions">
          <button type="submit">Send</button>
          <span class="contact-status" role="status" aria-live="polite"></span>
        </div>
      </form>`;
  }

  function wireContactForm() {
    const form = bodyEl.querySelector('.contact-form');
    if (!form) return;
    // When the form was put on screen. The Worker drops anything that comes back too fast to
    // have been typed, which is the half of the spam defence that a bot can't see.
    const shownAt = Date.now();
    const button = form.querySelector('button[type="submit"]');
    const status = form.querySelector('.contact-status');

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (button.disabled) return;

      const data = Object.fromEntries(new FormData(form));
      if (!data.name?.trim() || !data.email?.trim() || !data.message?.trim()) {
        status.className = 'contact-status bad';
        status.textContent = 'Every field, please.';
        return;
      }

      button.disabled = true;
      status.className = 'contact-status';
      status.textContent = 'Sending…';

      try {
        const res = await fetch(CONTACT_ENDPOINT, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...data, t: shownAt }),
        });
        const out = await res.json().catch(() => ({}));
        if (res.ok && out.ok) {
          form.replaceWith(contactSentEl());
          return;
        }
        // A 4xx is something the visitor can fix and the Worker says what, so pass that through
        // as written. Anything else is the endpoint's problem, not theirs.
        const fixable = res.status >= 400 && res.status < 500 && out.error;
        throw Object.assign(new Error(out.error || ''), { fixable });
      } catch (err) {
        button.disabled = false;
        status.className = 'contact-status bad';
        if (err.fixable) status.textContent = err.message;
        // Failing that, the way out is the one the panel already lists underneath.
        else status.innerHTML = `That didn't go through. <a href="mailto:${CONTACT_EMAIL}">Email me</a> instead?`;
      }
    });
  }

  function contactSentEl() {
    const sent = document.createElement('p');
    sent.className = 'contact-sent';
    sent.setAttribute('role', 'status');
    sent.textContent = "Trade accepted. I'll get back to you.";
    return sent;
  }

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
    bodyEl.innerHTML = `
      ${TRADE.body}
      ${contactConfigured() ? contactFormHtml() : `<p class="embed-fallback">The contact form isn't wired up yet, so email me directly instead.</p>`}
      <p class="links">${CONTACT_LINKS.map((l) => `<a href="${l.href}" target="_blank" rel="noopener">${esc(l.label)}</a>`).join(' · ')}</p>`;
    wireContactForm();
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
