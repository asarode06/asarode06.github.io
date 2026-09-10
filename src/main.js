import './style.css';
import { renderCoastline } from './coastline.js';
import { renderBoard } from './board.js';
import { renderRoad } from './road.js';
import { renderChrome } from './chrome.js';
import { initHud } from './hud.js';
import { initModal } from './modal.js';
import { createExperience } from './experience.js';
import { createResourceCards } from './cards.js';
import { createDevCards } from './dev.js';
import { createVictory } from './victory.js';
import { createRoadBuilder } from './roadbuild.js';
import { initPhotos } from './photos.js';
import { renderMobile } from './mobile.js';
import { createCamera } from './camera.js';
import { worldSize } from './geometry.js';

function reducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

// Matches the CSS breakpoint where the board/camera give way to the plain scrolling page.
function isMobile() {
  return window.matchMedia('(max-width: 780px)').matches;
}

// Links and images are natively draggable in every browser (the "ghost image + no-drop cursor"
// the browser shows on a click-drag) — that fights the board's own drag-to-pan and the ports/
// resume link are exactly what people end up dragging by accident. `-webkit-user-drag: none` in
// CSS covers Chrome/Safari; this covers Firefox too, and is the one thing that reliably works
// everywhere, so it's simplest to just kill native drag globally rather than chase which
// elements might trigger it.
window.addEventListener('dragstart', (e) => e.preventDefault());

// The Experience tile has no modal — it hands off to the road-chain showcase, or on mobile to
// the timeline section of the scrolling page. Both `experience` and `mobile` are constructed
// further down, so these are lazy: nothing calls them until modal.route() runs at the very end.
const modalEl = document.getElementById('modal');
const modal = initModal({
  modalEl,
  iconEl: document.getElementById('m-icon'),
  tokenEl: document.getElementById('m-token'),
  eyebrowEl: document.getElementById('m-eyebrow'),
  titleEl: document.getElementById('m-title'),
  subEl: document.getElementById('m-sub'),
  closeEl: document.getElementById('m-close'),
  bodyEl: document.getElementById('m-body'),
  navEl: document.getElementById('m-nav'),
  openExperience: () => (isMobile() ? mobile.revealTimeline() : experience.show()),
  closeExperience: (opts) => experience.hide(opts),
  openCard: (id) => cards.show(id),
  closeCard: (opts) => cards.hide(opts),
});

// Photos. Every run of images in authored prose renders as a pile of prints, and this is what
// one opens into — a single delegated listener, so no surface that shows prose has to know the
// viewer exists.
const photos = initPhotos({
  viewerEl: document.getElementById('photo-viewer'),
  stageEl: document.getElementById('pv-stage'),
  countEl: document.getElementById('pv-count'),
  closeEl: document.getElementById('pv-close'),
});

// The resource hand. On mobile there's no dice and no robber, so there's no way to earn the
// locked cards — hand the whole deck over instead of gating content behind a mechanic that
// isn't there. (A desktop-width visitor who shrinks the window mid-session keeps whatever
// they were dealt; the two hands render from the same state either way.)
const cards = createResourceCards({
  overlayEl: document.getElementById('rc-overlay'),
  unlockAll: isMobile(),
  onActivate: (id) => modal.openCard(id),
  onClosed: () => modal.onCardClosed(),
});

// -------------------------------------------------------------------- desktop board + camera
const viewportEl = document.getElementById('viewport');
const worldEl = document.getElementById('world');

const { portAnchors } = renderCoastline(worldEl);
const board = renderBoard(worldEl, {
  onOpenTile: (id) => modal.openTile(id),
  onDesertClick: () => modal.openDesert(),
  onRobbed: (resource) => cards.grant(resource),
});
const road = renderRoad(board.boardEl, { onOpenMilestone: (id) => modal.openMilestone(id) });

// The score is a real number, and most of it is already standing on the board: the road's three
// settlements and two cities, plus Longest Road, is 9 of the 10 needed. The development deck is
// what closes the gap — a Library, or the Largest Army that three knights earn.
const victory = createVictory({
  hudEl: document.getElementById('vp-hud'),
  winEl: document.getElementById('win-overlay'),
  onWin: () => {
    if (reducedMotion()) return;
    // The board celebrates too, one tile at a time, behind the banner.
    ['education', 'experience', 'resume', 'about-me', 'projects', 'skills'].forEach((id, i) =>
      setTimeout(() => board.pulseTile(id), 260 + i * 150)
    );
  },
});

// Free roads for the Road Building card. Decorative — nothing scores them — but they're placed
// on the board's real edges, under Catan's own connection rule, and they stay put for the
// session. `ghostEls` is the dashed tail of the career road: those two segments are legal to
// build on, and paving one takes its dashes off the board.
const roads = createRoadBuilder({
  boardEl: board.boardEl,
  onToast: (m) => cards.toast(m),
  ghostEls: road.ghostEls,
});

// `getCamera` is lazy for the same reason experience.js's is: the camera needs the world's size,
// which needs the chrome mounted, which is what this is being built for.
const devCards = createDevCards({
  board,
  cards,
  victory,
  roads,
  pickerEl: document.getElementById('bank-pick'),
  getCamera: () => camera,
  onLargestArmy: () => chrome.awardBonus('largest-army'),
});

const chrome = renderChrome(worldEl, {
  mountHand: (el) => cards.mountHand(el),
  mountDev: (el) => devCards.mountDeck(el),
  portAnchors,
});

const experience = createExperience({
  overlayEl: document.getElementById('exp-overlay'),
  boardRoadSvg: road.svg,
  getCamera: () => camera,
  onClose: () => modal.onExperienceClosed(),
});

const { width, height } = worldSize();
const camera = createCamera({
  viewportEl,
  worldEl,
  worldWidth: width,
  worldHeight: height,
  // Arrow keys and +/- must not drive the board out from under the showcase either.
  isModalOpen: () =>
    modalEl.open ||
    experience.isOpen() ||
    cards.isOpen() ||
    photos.isOpen() ||
    devCards.isOpen() ||
    victory.isOpen(),
});

document.getElementById('home-btn')?.addEventListener('click', () => camera.setHome(true));

initHud({
  tradeBtn: document.getElementById('trade-btn'),
  resumeLink: document.getElementById('resume-corner'),
  diceHudEl: document.getElementById('dice-hud'),
  announceEl: document.getElementById('dice-announce'),
  onTrade: () => modal.openContact(),
  onRoll: (sum, tile) => {
    if (tile) {
      board.pulseTile(tile.id);
      const center = board.worldCenterOf(tile.id);
      const openAfterFly = () => modal.openTile(tile.id);
      if (reducedMotion() || !center) {
        openAfterFly();
      } else {
        setTimeout(() => {
          camera.flyTo(center.x, center.y, 1.4);
          setTimeout(openAfterFly, 750);
        }, 350);
      }
    } else if (sum === 7) {
      board.armRobber(cards.remainingByResource());
      camera.setHome(true); // pan/zoom out so the whole map — and every tile the robber could land on — is visible
      cards.toast('Rolled 7: drop the robber on any plain tile to take that resource’s next card.');
    }
  },
});

// -------------------------------------------------------------------- mobile fallback
const mobile = renderMobile(document.getElementById('stack'), {
  mountHand: (el) => cards.mountHand(el),
  fillerCounts: board.fillerCounts,
  onOpenTile: (id) => modal.openTile(id),
  onOpenMilestone: (id) => modal.openMilestone(id),
  onDesertClick: () => modal.openDesert(),
  onTrade: () => modal.openContact(),
});

// Deferred until now on purpose: a deep-linked hash (#projects, #experience, …) can drive the
// camera and the showcase, so every one of them has to exist before the first route runs.
modal.route();
