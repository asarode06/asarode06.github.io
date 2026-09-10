// Pan/zoom camera for the board. The page itself never scrolls (html/body overflow:hidden —
// see style.css); instead wheel/drag/keyboard input moves a CSS transform on the world layer.
// Desktop-only: main.js never constructs this below the ~780px mobile breakpoint.

// A fixed, absolute region of the MAP itself (world-space units) that the camera is allowed to
// look at — not a screen-pixel slack, which would represent a different amount of the actual
// map at every zoom level.
//
// The rule, like any real map app: the viewport's visible span is clamped so it can never show
// more than the allowed margin past the map's edge — so the farthest-right (etc.) point you can
// ever bring into view is the exact same map coordinate whether you're zoomed all the way in or
// dragging at a middling zoom; it just takes more dragging to get there when zoomed in, exactly
// like panning across Google Maps. That constraint has no solution once the viewport (in map
// units) is already wider than the whole allowed span — there's nowhere left to reveal, so it
// falls back to centering. `minScale` (below) is deliberately kept just below that crossover
// point on the more restrictive axis, so "fully zoomed out" is exactly the state where the
// whole map is shown centered with no panning possible or needed, while the initial/default
// zoom sits above that threshold and always has real wiggle room.
//
// The margin is NOT a single hardcoded world-unit constant — the viewport's aspect ratio vs. the
// world's own aspect ratio already hands one axis a bunch of "free" slack at the fit scale (e.g.
// a wide window against a nearly-square board leaves horizontal slack before any margin is even
// applied), and that free amount is different per axis and per window size. A fixed margin sized
// to satisfy the tightest axis at one arbitrary window size can be far too small (no real wiggle)
// or unnecessarily huge at a different size/aspect ratio. So instead each axis gets its own
// margin, computed live from the current viewport: whatever slack that axis already has for free
// at the fit scale, plus a fixed WIGGLE_WORLD of *real* pan range on top — guaranteeing the same
// minimum wiggle in every direction regardless of window size/aspect ratio.
const WIGGLE_WORLD = 140;
const DEFAULT_MAX_SCALE = 2.5;

function clamp1D(v, lo, hi) {
  return Math.min(Math.max(v, lo), hi);
}

function clampAxis(pos, worldSize, viewportSize, scale, margin) {
  const allowedSpan = worldSize + 2 * margin;
  const viewportSpanInWorld = viewportSize / scale;
  if (viewportSpanInWorld >= allowedSpan) {
    return (viewportSize - worldSize * scale) / 2;
  }
  const max = margin * scale;
  const min = viewportSize - (worldSize + margin) * scale;
  return clamp1D(pos, min, max);
}

function reducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export function createCamera({ viewportEl, worldEl, worldWidth, worldHeight, isModalOpen }) {
  let x = 0;
  let y = 0;
  let scale = 1;
  let minScale = 0.1; // real value set by setHome() below, before anything else runs
  const maxScale = DEFAULT_MAX_SCALE;
  let tweenHandle = null;

  worldEl.style.width = worldWidth + 'px';
  worldEl.style.height = worldHeight + 'px';
  worldEl.style.transformOrigin = '0 0';

  function apply() {
    worldEl.style.transform = `translate(${x}px, ${y}px) scale(${scale})`;
  }

  function clamp() {
    const rect = viewportEl.getBoundingClientRect();
    const { marginX, marginY } = computeMargins(rect);
    x = clampAxis(x, worldWidth, rect.width, scale, marginX);
    y = clampAxis(y, worldHeight, rect.height, scale, marginY);
  }

  function stopTween() {
    if (tweenHandle) {
      cancelAnimationFrame(tweenHandle);
      tweenHandle = null;
    }
  }

  function set(nx, ny, nscale) {
    stopTween();
    x = nx;
    y = ny;
    scale = Math.min(Math.max(nscale, minScale), maxScale);
    clamp();
    apply();
  }

  function tweenTo(nx, ny, nscale, duration = 700) {
    stopTween();
    if (reducedMotion()) {
      set(nx, ny, nscale);
      return;
    }
    const startX = x;
    const startY = y;
    const startScale = scale;
    const targetScale = Math.min(Math.max(nscale, minScale), maxScale);
    const t0 = performance.now();
    const ease = (t) => 1 - Math.pow(1 - t, 3); // easeOutCubic
    function step(now) {
      const t = Math.min(1, (now - t0) / duration);
      const e = ease(t);
      x = startX + (nx - startX) * e;
      y = startY + (ny - startY) * e;
      scale = startScale + (targetScale - startScale) * e;
      clamp();
      apply();
      if (t < 1) {
        tweenHandle = requestAnimationFrame(step);
      } else {
        tweenHandle = null;
      }
    }
    tweenHandle = requestAnimationFrame(step);
  }

  function fitScale(rect) {
    return Math.min(rect.width / worldWidth, rect.height / worldHeight) * 1.15;
  }

  // Per-axis pan margin (world units), derived live from the current viewport: whatever slack
  // that axis already gets for free at the fit scale (because the viewport's aspect ratio isn't
  // the same as the world's), plus a fixed WIGGLE_WORLD of guaranteed real pan range on top.
  function computeMargins(rect) {
    const home = fitScale(rect);
    const slackX = Math.max(0, rect.width / home - worldWidth);
    const slackY = Math.max(0, rect.height / home - worldHeight);
    return {
      marginX: slackX / 2 + WIGGLE_WORLD,
      marginY: slackY / 2 + WIGGLE_WORLD,
    };
  }

  // The scale at which the whole allowed region (map + margin on every side) fits the viewport
  // on both axes at once — the true "fully zoomed out" limit. Below this scale there'd be
  // nothing new to reveal by panning, so this is also where minScale is pinned: it's always at
  // or below fitScale (never blocks the initial view), but strictly less than it whenever
  // there's room to, so the default view still has real wiggle room to pan within before hitting
  // the fully-zoomed-out state.
  function fullMapScale(rect, margins) {
    return Math.min(
      rect.width / (worldWidth + 2 * margins.marginX),
      rect.height / (worldHeight + 2 * margins.marginY)
    );
  }

  function setHome(animate = false) {
    const rect = viewportEl.getBoundingClientRect();
    const home = fitScale(rect);
    const margins = computeMargins(rect);
    minScale = Math.min(fullMapScale(rect, margins), home);
    const nx = (rect.width - worldWidth * home) / 2;
    const ny = (rect.height - worldHeight * home) / 2;
    if (animate) tweenTo(nx, ny, home);
    else set(nx, ny, home);
  }

  function panBy(dx, dy) {
    stopTween();
    x += dx;
    y += dy;
    clamp();
    apply();
  }

  function zoomAt(clientX, clientY, factor) {
    stopTween();
    const rect = viewportEl.getBoundingClientRect();
    const vx = clientX - rect.left;
    const vy = clientY - rect.top;
    const worldX = (vx - x) / scale;
    const worldY = (vy - y) / scale;
    const newScale = Math.min(Math.max(scale * factor, minScale), maxScale);
    x = vx - worldX * newScale;
    y = vy - worldY * newScale;
    scale = newScale;
    clamp();
    apply();
  }

  // Frame a world-space point centered in the viewport at a given scale — used for the dice
  // "fly to the matching tile" reveal.
  function flyTo(worldX, worldY, targetScale, duration = 700) {
    const rect = viewportEl.getBoundingClientRect();
    const nx = rect.width / 2 - worldX * targetScale;
    const ny = rect.height / 2 - worldY * targetScale;
    tweenTo(nx, ny, targetScale, duration);
  }

  // Ease the zoom in/out about the viewport center without moving what's under it — the
  // Experience showcase uses this to pull the board back while the road chain lifts off it.
  function nudgeZoom(factor, duration = 700) {
    const rect = viewportEl.getBoundingClientRect();
    const cx = rect.width / 2;
    const cy = rect.height / 2;
    const worldX = (cx - x) / scale;
    const worldY = (cy - y) / scale;
    const target = Math.min(Math.max(scale * factor, minScale), maxScale);
    tweenTo(cx - worldX * target, cy - worldY * target, target, duration);
  }

  // Ease back to a state captured earlier via getState().
  function tweenToState(state, duration = 700) {
    if (!state) return;
    tweenTo(state.x, state.y, state.scale, duration);
  }

  // ---------------------------------------------------------------- input wiring
  let dragging = false;
  let dragMoved = false;
  let lastX = 0;
  let lastY = 0;

  function onWheel(e) {
    e.preventDefault();
    const scaleFactor = e.deltaMode === 1 ? 16 : 1; // "line" delta mode → approximate px
    if (e.ctrlKey) {
      const factor = Math.exp(-e.deltaY * 0.012);
      zoomAt(e.clientX, e.clientY, factor);
    } else {
      panBy(-e.deltaX * scaleFactor, -e.deltaY * scaleFactor);
    }
  }

  function onPointerDown(e) {
    if (e.button !== undefined && e.button !== 0) return;
    dragging = true;
    dragMoved = false;
    lastX = e.clientX;
    lastY = e.clientY;
    // Deliberately no setPointerCapture: the viewport already covers the whole window, and
    // capturing here would retarget the eventual click away from whatever tile is underneath,
    // silently breaking every tile button.
  }

  function onPointerMove(e) {
    if (!dragging) return;
    const dx = e.clientX - lastX;
    const dy = e.clientY - lastY;
    if (Math.abs(dx) + Math.abs(dy) > 3) dragMoved = true;
    if (dragMoved) {
      panBy(dx, dy);
      lastX = e.clientX;
      lastY = e.clientY;
    }
  }

  function onPointerUp() {
    dragging = false;
  }

  // Suppress the click that follows a drag so panning never fires a tile's onClick.
  function onClickCapture(e) {
    if (dragMoved) {
      e.stopPropagation();
      e.preventDefault();
      dragMoved = false;
    }
  }

  function onKeyDown(e) {
    if (isModalOpen?.()) return;
    const PAN = 60;
    switch (e.key) {
      case 'ArrowUp':
        panBy(0, PAN);
        break;
      case 'ArrowDown':
        panBy(0, -PAN);
        break;
      case 'ArrowLeft':
        panBy(PAN, 0);
        break;
      case 'ArrowRight':
        panBy(-PAN, 0);
        break;
      case '+':
      case '=': {
        const rect = viewportEl.getBoundingClientRect();
        zoomAt(rect.left + rect.width / 2, rect.top + rect.height / 2, 1.2);
        break;
      }
      case '-':
      case '_': {
        const rect = viewportEl.getBoundingClientRect();
        zoomAt(rect.left + rect.width / 2, rect.top + rect.height / 2, 1 / 1.2);
        break;
      }
      case '0':
        setHome(true);
        break;
      default:
        return;
    }
    e.preventDefault();
  }

  viewportEl.addEventListener('wheel', onWheel, { passive: false });
  viewportEl.addEventListener('pointerdown', onPointerDown);
  viewportEl.addEventListener('pointermove', onPointerMove);
  viewportEl.addEventListener('pointerup', onPointerUp);
  viewportEl.addEventListener('pointercancel', onPointerUp);
  viewportEl.addEventListener('click', onClickCapture, { capture: true });
  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('resize', () => setHome(false));

  setHome(false);

  return {
    setHome,
    flyTo,
    panBy,
    zoomAt,
    nudgeZoom,
    tweenToState,
    getState: () => ({ x, y, scale }),
    destroy() {
      stopTween();
      viewportEl.removeEventListener('wheel', onWheel);
      viewportEl.removeEventListener('pointerdown', onPointerDown);
      viewportEl.removeEventListener('pointermove', onPointerMove);
      viewportEl.removeEventListener('pointerup', onPointerUp);
      viewportEl.removeEventListener('pointercancel', onPointerUp);
      viewportEl.removeEventListener('click', onClickCapture, { capture: true });
      window.removeEventListener('keydown', onKeyDown);
    },
  };
}
