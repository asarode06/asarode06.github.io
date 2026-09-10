// The bridge between `content/*.md` and the render modules.
//
// plugins/content.js parses those files at build time and hands them over as `virtual:content`:
// one array per file, each entry a bag of frontmatter values plus two pre-rendered HTML strings
// (`html` for the teaser, `moreHtml` for whatever came after `<!--more-->`). This module turns
// that into the shapes the rest of the app actually wants, and is the only place that knows the
// two are related.
//
// The point of the split is that a project and a role are each written ONCE and read by several
// views at different sizes:
//
//   projects.md   → the Projects tile's card grid, each project's own modal, AND the wood deck
//   experience.md → the road on the board, the Experience showcase, each piece's modal, AND the
//                   wheat deck
//
// so `teaser` is what a size-limited view shows (a collapsed showcase card) and `body` is
// everything, for views with room. Nothing here re-renders markdown; it only sorts and relabels.
import RAW from 'virtual:content';
import { RESOURCE_KINDS, RESOURCE_ORDER, TILES } from './data.js';

const files = (name) => RAW[name] ?? [];

// `Label | https://example.com` → { label, href }. Anything without a pipe is treated as a bare
// URL and shown as itself.
function parseLinks(list) {
  return (Array.isArray(list) ? list : []).map((line) => {
    const at = line.lastIndexOf('|');
    if (at === -1) return { label: line.trim(), href: line.trim() };
    return { label: line.slice(0, at).trim(), href: line.slice(at + 1).trim() };
  });
}

// `A, B, C` → ['A', 'B', 'C']
function parseList(value) {
  if (Array.isArray(value)) return value;
  return typeof value === 'string' ? value.split(',').map((s) => s.trim()).filter(Boolean) : [];
}

// Both halves of a folded body, for the views that aren't height-limited.
function fullBody(e) {
  return e.moreHtml ? `${e.html}${e.moreHtml}` : e.html;
}

// The trailing chips-and-links block every long-form view appends under the prose. Built here
// rather than in each renderer so a project's stack looks the same on its card, in its modal,
// and in the Projects drill-down.
function tail({ stack, links }) {
  let html = '';
  if (stack.length) {
    html += `<div class="chips">${stack.map((s) => `<span class="chip">${escapeHtml(s)}</span>`).join('')}</div>`;
  }
  if (links.length) {
    // Every link opens in a new tab — leaving this page never abandons the board state
    // underneath. `mailto:` is the one exception: a new tab there just launches the mail
    // client and then sits blank.
    html += `<p class="links">${links
      .map((l) => `<a href="${l.href}"${l.href.startsWith('mailto:') ? '' : ' target="_blank" rel="noopener"'}>${escapeHtml(l.label)} →</a>`)
      .join(' · ')}</p>`;
  }
  return html;
}

function escapeHtml(s) {
  const d = document.createElement('div');
  d.textContent = s;
  return d.innerHTML;
}

function normalize(e) {
  const stack = parseList(e.stack);
  const links = parseLinks(e.links);
  return {
    id: e.id,
    title: e.title ?? '',
    subtitle: e.subtitle ?? '',
    stack,
    links,
    teaser: e.html,
    body: fullBody(e) + tail({ stack, links }),
    // Only the Experience showcase needs the halves apart: its collapsed card shows the teaser
    // and its expanded panel adds the rest below a rule, so the growth reveals rather than
    // reflows. Everything else reads `body`.
    extra: (e.moreHtml || '') + tail({ stack, links }),
  };
}

// -------------------------------------------------------------------- projects
export const PROJECTS = files('projects').map((e) => ({ ...normalize(e), inDeck: e.card !== 'no' }));

// -------------------------------------------------------------------- experience / the road
export const TIMELINE = files('experience').map((e) => ({
  ...normalize(e),
  dates: e.dates ?? '',
  piece: e.piece ?? 'settlement',
  inDeck: e.card !== 'no',
}));

// -------------------------------------------------------------------- tile modals
const TILE_ENTRIES = new Map(files('tiles').map((e) => [e.tile ?? e.id, e]));

export const CONTENT = Object.fromEntries(
  TILES.map((t) => {
    const e = TILE_ENTRIES.get(t.id);
    if (!e) {
      throw new Error(
        `content/tiles.md has no entry for the "${t.id}" tile. Every tile in TILES ` +
          `(src/data.js) needs one: add a block with \`tile: ${t.id}\`.`
      );
    }
    const stack = parseList(e.stack);
    const links = parseLinks(e.links);
    return [
      t.id,
      {
        title: e.title ?? t.title,
        subtitle: e.subtitle ?? '',
        body: fullBody(e) + tail({ stack, links }),
        // `wood | Languages | Python, C++` — the Skills tile's coloured groups.
        groups: (Array.isArray(e.groups) ? e.groups : []).map((row) => {
          const [resource, label, items] = row.split('|').map((s) => s.trim());
          return { resource, label, items: parseList(items) };
        }),
        // The desert easter egg cycles these one click at a time.
        lines: Array.isArray(e.lines) ? e.lines : [],
      },
    ];
  })
);

export const DESERT_LINES = CONTENT.desert?.lines ?? ['Nothing grows here.'];

// -------------------------------------------------------------------- resource decks
// wood and wheat are the projects and the roles above — the same entries, relabelled as cards,
// which is what makes a wood card and the Projects drill-down show identical text. brick, ore
// and sheep have no tile counterpart, so they're authored in content/resource-cards.md.
function asCard(entry, resource, extra = {}) {
  return {
    id: entry.id,
    resource,
    title: entry.title,
    subtitle: entry.subtitle,
    label: RESOURCE_KINDS[resource].label,
    html: entry.body,
    ...extra,
  };
}

const AUTHORED_CARDS = files('resource-cards').map((e) => {
  const n = normalize(e);
  return { ...asCard(n, e.resource), label: e.label || RESOURCE_KINDS[e.resource]?.label || e.resource };
});

export const DECKS = new Map(
  RESOURCE_ORDER.map((resource) => {
    if (resource === 'wood') {
      return [resource, PROJECTS.filter((p) => p.inDeck).map((p) => asCard(p, 'wood'))];
    }
    if (resource === 'wheat') {
      return [
        resource,
        TIMELINE.filter((r) => r.inDeck).map((r) =>
          asCard(r, 'wheat', { subtitle: [r.subtitle, r.dates].filter(Boolean).join(' · ') })
        ),
      ];
    }
    return [resource, AUTHORED_CARDS.filter((c) => c.resource === resource)];
  })
);

export const CARDS = RESOURCE_ORDER.flatMap((r) => DECKS.get(r));

// -------------------------------------------------------------------- extras
const EXTRAS = files('extras');

// A dev card's `id` is wired to a mechanic in src/dev.js and to a copy count in DEV_DECK, so
// unlike everything else here these five are not free-form: an id that exists in one place and
// not the other is a bug, which is why dev.js resolves them through DEV_BY_ID rather than by
// position in this array.
export const DEV_CARDS = EXTRAS.filter((e) => e.type === 'dev-card').map((e) => ({
  id: e.id,
  title: e.title,
  art: e.art,
  banner: e.banner ?? '',
  html: e.html,
}));

export const DEV_BY_ID = new Map(DEV_CARDS.map((c) => [c.id, c]));

export const BONUS_CARDS = EXTRAS.filter((e) => e.type === 'bonus').map((e) => ({
  id: e.id,
  title: e.title,
  art: e.art,
  // A locked award isn't shown until it's earned in play — chrome.js leaves a hollow outlined
  // slot in its place until then.
  locked: e.locked === 'yes',
  html: e.html,
}));

const tradeEntry = EXTRAS.find((e) => e.type === 'trade');
export const TRADE = {
  title: tradeEntry?.title ?? 'Trade',
  subtitle: tradeEntry?.subtitle ?? '',
  body: tradeEntry ? fullBody(tradeEntry) : '',
};
