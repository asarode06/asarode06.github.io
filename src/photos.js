// The photo viewer — what a pile of prints opens into.
//
// Every run of images in authored prose is dealt out as a pile by plugins/content.js: one
// `<button class="photo">` per image inside a `.photo-stack`, each print carrying the tilt and
// offset it was given at build time. This module is the other half of that. One delegated
// listener picks up a click on any print anywhere on the site — a tile modal, a flipped resource
// card, an expanded Experience card, the mobile page — and lays that pile out as a collage: the
// print you picked in the middle, the edges of the ones either side of it showing past the edges
// of the screen, and nothing to click but the photos themselves.
//
// It's a <dialog> because the tile modal is one too: a modal dialog renders in the browser's top
// layer, and the only thing that stacks above the top layer is another dialog opened after it.
//
// Nothing here knows what a project or a role is — it reads the pile it was handed straight out
// of the DOM, which is what lets one viewer serve every surface without any of them wiring it up.
const CLOSE_MS = 200; // keep in step with the .pv.closing animation in style.css
const SWIPE_PX = 44; // horizontal travel that counts as a flick rather than a click
// What a slide is actually painted at, kept in step with `.pv-slide img`'s max-width in
// style.css. It's the hint the browser picks a rung off `srcset` with — see plugins/images.js.
const SLIDE_SIZES = 'min(70vw, 880px)';

function reducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export function initPhotos({ viewerEl, stageEl, countEl, closeEl } = {}) {
  let slides = []; // one <button> per photo, all of them live for the whole visit to a pile
  let cur = 0;
  let closeTimer = 0;

  // ------------------------------------------------------------------ layout
  // Every slide is positioned off the centre of the screen by how far it is from the one being
  // looked at, so navigating is a matter of re-labelling them and letting CSS move them: the
  // current print slides out to an edge and the next one straightens up into the middle. Two
  // steps out is as far as the labels go — anything further is parked off-screen at the same
  // place, waiting to come in from behind its neighbour.
  function place() {
    slides.forEach((slide, i) => {
      const d = i - cur;
      const far = Math.abs(d) > 1;
      slide.dataset.pos = String(Math.max(-2, Math.min(2, d)));
      // Only the two neighbours are actionable: they're the whole navigation.
      slide.tabIndex = d === 0 || far ? -1 : 0;
      slide.setAttribute('aria-hidden', far ? 'true' : 'false');
    });
    countEl.textContent = slides.length > 1 ? `${cur + 1} / ${slides.length}` : '';
  }

  function goTo(i) {
    if (!slides.length) return;
    cur = Math.max(0, Math.min(slides.length - 1, i));
    place();
  }

  // ------------------------------------------------------------------ open / close
  function build(photos) {
    stageEl.replaceChildren();
    slides = photos.map((photo, i) => {
      const slide = document.createElement('button');
      slide.type = 'button';
      slide.className = 'pv-slide';
      // A print is never quite square on the board. Alternating and small, so the collage reads
      // as hand-laid rather than as a carousel with a rotation effect bolted on.
      slide.style.setProperty('--r', `${(i % 2 ? 1 : -1) * (1.1 + (i % 3) * 0.7)}deg`);
      const img = document.createElement('img');
      img.src = photo.src;
      img.alt = photo.alt;
      img.decoding = 'async';
      if (photo.srcset) {
        // The same ladder the print in the pile was built from — only the hint changes. The pile
        // asked for a 150px rung; a slide is most of the screen wide, so this asks for a big one
        // and the browser fetches it now, which is the first time anyone has actually looked at
        // this photo. See plugins/images.js.
        img.srcset = photo.srcset;
        img.sizes = SLIDE_SIZES;
      }
      if (photo.width && photo.height) {
        // So the frame is the right shape before the big rung arrives, rather than snapping to
        // it on load — the print underneath is standing in for it in the meantime.
        img.width = photo.width;
        img.height = photo.height;
      }
      // The pile's thumbnail is already decoded and sitting in cache, so it fills the frame as a
      // soft placeholder and the full-size photo paints over it when it lands.
      if (photo.thumb) img.style.backgroundImage = `url("${photo.thumb}")`;
      slide.appendChild(img);
      slide.addEventListener('click', () => goTo(i)); // the current one resolves to itself
      stageEl.appendChild(slide);
      return slide;
    });
  }

  function open(photos, index) {
    if (!photos.length) return;
    cancelClose();
    build(photos);
    goTo(index);
    if (!viewerEl.open) viewerEl.showModal();
    // Left alone, the dialog hands focus to whichever neighbouring print is first in the DOM,
    // which reads as one of them being picked out. The close button is the neutral place to be.
    closeEl.focus({ preventScroll: true });
  }

  function cancelClose() {
    if (!closeTimer) return;
    clearTimeout(closeTimer);
    closeTimer = 0;
    viewerEl.classList.remove('closing');
  }

  function close() {
    if (!viewerEl.open || closeTimer) return;
    if (reducedMotion()) {
      viewerEl.close();
      return;
    }
    viewerEl.classList.add('closing');
    closeTimer = setTimeout(() => {
      closeTimer = 0;
      viewerEl.classList.remove('closing');
      viewerEl.close();
    }, CLOSE_MS);
  }

  // ------------------------------------------------------------------ the way in
  // Capture, not bubble: a print can sit inside something that is itself clickable — a collapsed
  // Experience card is the one that matters — and a click on a photo should open the photo
  // rather than doing both things at once.
  document.addEventListener(
    'click',
    (e) => {
      const print = e.target instanceof Element ? e.target.closest('.photo') : null;
      const stack = print?.closest('.photo-stack');
      if (!stack) return;
      e.preventDefault();
      e.stopPropagation();
      const prints = [...stack.querySelectorAll('.photo')];
      const photos = prints.map((p) => {
        const img = p.querySelector('img');
        return {
          src: img?.getAttribute('src') || '',
          // Deliberately not `currentSrc`: that's the 150px rung the pile chose, and blowing it
          // up to fill the screen is exactly what this whole pipeline exists to avoid. Handing
          // the ladder over instead lets the viewer ask for a rung that suits its own size.
          srcset: img?.getAttribute('srcset') || '',
          thumb: img?.currentSrc || '',
          width: img?.getAttribute('width') || '',
          height: img?.getAttribute('height') || '',
          alt: img?.alt || '',
        };
      });
      open(photos, Math.max(0, prints.indexOf(print)));
    },
    true
  );

  // ------------------------------------------------------------------ the ways out and along
  viewerEl.addEventListener('keydown', (e) => {
    const step = { ArrowLeft: -1, ArrowRight: 1 }[e.key];
    if (step) {
      e.preventDefault();
      goTo(cur + step);
      return;
    }
    if (e.key === 'Home' || e.key === 'End') {
      e.preventDefault();
      goTo(e.key === 'Home' ? 0 : slides.length - 1);
    }
  });

  // Escape reaches the dialog first and would close it outright, skipping the fade.
  viewerEl.addEventListener('cancel', (e) => {
    if (reducedMotion()) return;
    e.preventDefault();
    close();
  });

  // The stage covers the whole screen, so "the backdrop" is the part of it no print is on.
  stageEl.addEventListener('click', (e) => {
    if (e.target === stageEl) close();
  });
  closeEl.addEventListener('click', close);

  // Flicking through on a touchscreen, where the neighbours only peek in by a thumb's width.
  let swipeFrom = null;
  stageEl.addEventListener('pointerdown', (e) => {
    swipeFrom = { x: e.clientX, id: e.pointerId };
  });
  stageEl.addEventListener('pointerup', (e) => {
    if (!swipeFrom || swipeFrom.id !== e.pointerId) return;
    const dx = e.clientX - swipeFrom.x;
    swipeFrom = null;
    if (Math.abs(dx) < SWIPE_PX) return;
    // A flick has already moved the pile, so don't let the click it ends with move it again.
    stageEl.addEventListener('click', (c) => c.stopPropagation(), { capture: true, once: true });
    goTo(cur + (dx < 0 ? 1 : -1));
  });
  stageEl.addEventListener('pointercancel', () => (swipeFrom = null));

  return { isOpen: () => viewerEl.open, close };
}
