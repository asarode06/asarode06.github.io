// Single source of truth for board layout + all written content.
// Render code (board.js, road.js, chrome.js, modal.js) loops over this — nothing is hand-placed.

export const ROWS = [3, 4, 5, 4, 3];

export const RESOURCE_COLORS = {
  brick: '#C4703F',
  wheat: '#E0B152',
  wood: '#3F6B3A',
  sheep: '#9DBE6A',
  ore: '#78838F',
  desert: '#D9C79E',
};

// Every resource gets plain (unclaimed) tiles on the board, ore included — the robber has to be
// able to land on one of each, since that's how a player earns extra resource cards. See
// buildFillerMultiset() in board.js for how the 12 filler slots are dealt out.
export const FILLER_TYPES = ['brick', 'wheat', 'wood', 'sheep', 'ore'];

// What a card of each resource is *about*. The resource hand is the site's second layer of
// content: one card per resource to start with, more earned by robbing (see src/cards.js).
// The cards themselves are authored in content/resource-cards.md and compiled at build time.
export const RESOURCE_KINDS = {
  wood: { label: 'Project', blurb: 'a project I built' },
  wheat: { label: 'Experience', blurb: 'somewhere I worked' },
  brick: { label: 'Class', blurb: 'a class I took' },
  ore: { label: 'Skill', blurb: 'a skill and where I got it' },
  sheep: { label: 'Fun fact', blurb: 'something random about me' },
};

export const RESOURCE_ORDER = ['wood', 'wheat', 'brick', 'ore', 'sheep'];

// -------------------------------------------------------------------- development deck
// The real Catan mix, 25 cards: knight-heavy on purpose, so Largest Army (3 knights) is the
// usual route to a win rather than a rare one. The deck does NOT reshuffle — it empties, and
// the pile says how many are left. What each id *does* is src/dev.js; what each card *says* is
// content/extras.md. This is only how many of each are in the pile.
export const DEV_DECK = {
  knight: 14,
  library: 5,
  'road-building': 2,
  'year-of-plenty': 2,
  monopoly: 2,
};

// -------------------------------------------------------------------- victory points
// The road's pieces are already on the board and already count, exactly as they would in a real
// game: three settlements and two cities is 7, and Longest Road — the career itself — is 2 more.
// That puts a visitor at 9 before they draw anything, so one Library (10) or Largest Army (11)
// wins. Reaching the target sets off a celebration; it does not end anything, and the count
// keeps climbing past it for the rest of the session.
export const PIECE_VP = { settlement: 1, city: 2, ghost: 0 };
export const BONUS_VP = 2; // each of Longest Road / Largest Army, same as the real game
export const LARGEST_ARMY_KNIGHTS = 3;
export const VICTORY_TARGET = 10;

export const CONTACT_EMAIL = 'asarode9@gatech.edu';
export const GITHUB_URL = 'https://github.com/asarode06';
export const LINKEDIN_URL = 'https://linkedin.com/in/akashsarode/';
export const ARXIV_URL = 'https://arxiv.org/abs/2509.19295';
export const RESUME_URL = '/resume/Akash_Sarode.pdf';

// Where the Trade modal's contact form posts. GitHub Pages can't take a form submission itself,
// so this is a Cloudflare Worker deployed out of `worker/` that relays the message into a chat
// channel — see worker/README.md for how to stand it up and what to paste here. Until the URL
// below is real the modal shows a "not wired up yet" fallback and still lists the plain contact
// links, so the tile is never a dead end.
export const CONTACT_ENDPOINT = 'https://catan-portfolio-contact.asarode.workers.dev';

// -------------------------------------------------------------------- board tiles
// Deviates from SPEC.md's token table on purpose: the spec repeats 6 and 8 (Experience/Projects
// both 6; Resume/About me both 8), which makes a dice roll ambiguous. Every content tile below
// gets a unique token so a roll can target exactly one section for the dice auto-open feature.
// Desert and filler tiles carry no token, same as real Catan and the original spec.
export const TILES = [
  { id: 'education', type: 'brick', token: 5, row: 0, col: 0, title: 'Education' },
  { id: 'desert', type: 'desert', token: null, row: 0, col: 2, title: 'Desert' },
  { id: 'experience', type: 'wheat', token: 9, row: 1, col: 3, title: 'Experience' },
  { id: 'resume', type: 'brick', token: 6, row: 2, col: 0, title: 'Resume' },
  { id: 'about-me', type: 'sheep', token: 8, row: 2, col: 2, title: 'About me' },
  { id: 'projects', type: 'wood', token: 4, row: 3, col: 3, title: 'Projects' },
  { id: 'skills', type: 'ore', token: 10, row: 4, col: 0, title: 'Skills' },
];

// -------------------------------------------------------------------- written content
// It isn't here. Every word on this site — tile modals, projects, roles, resource cards, dev
// cards, award cards, the desert gag, the Trade blurb — is authored as markdown in `content/*.md`
// and compiled to HTML at build time by plugins/content.js. `src/content.js` assembles it into
// the shapes the render modules consume; import from there, not from this file.
//
// What stays here is *structure*: the board's shape, which resource each hex is made of, what
// token it carries, the colour palette, and the handful of URLs the site links out to. Those are
// layout and configuration, not writing.

// Order the prev/next modal footer cycles through. Desert is a joke tile, not part of the
// "six content tiles" the modal spec describes, so it's reachable by click/arrow-key but sits
// outside the linear prev/next loop.
export const NAV_ORDER = ['education', 'experience', 'resume', 'about-me', 'projects', 'skills'];

export function tileByToken(token) {
  return TILES.find((t) => t.token === token) ?? null;
}

// -------------------------------------------------------------------- ports (coastline links)
export const PORTS = [
  { id: 'github', label: 'GitHub', href: GITHUB_URL, anchor: 'top-left' },
  { id: 'linkedin', label: 'LinkedIn', href: LINKEDIN_URL, anchor: 'top-right' },
  { id: 'email', label: 'Email', href: `mailto:${CONTACT_EMAIL}`, anchor: 'right' },
  { id: 'resume-port', label: 'Resume (PDF)', href: RESUME_URL, anchor: 'bottom-right' },
  { id: 'arxiv', label: 'Published paper', href: ARXIV_URL, anchor: 'bottom-left' },
];

// Trade / contact modal body
export const CONTACT_LINKS = [
  { label: CONTACT_EMAIL, href: `mailto:${CONTACT_EMAIL}` },
  { label: 'GitHub', href: GITHUB_URL },
  { label: 'LinkedIn', href: LINKEDIN_URL },
];
