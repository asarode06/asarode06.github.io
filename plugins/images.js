// Build-time image pipeline: one photo in, a ladder of WebP derivatives out.
//
// Photos are authored as ordinary files under `public/experiences/` and `public/projects/` — a
// phone screenshot or a camera JPEG, whatever came off the device, several megabytes each. What
// the browser should actually fetch is nowhere near that: the same photo appears as a 150px
// print in a pile and, only if someone clicks it, as a ~900px print in the viewer. Shipping the
// original for both is how five thumbnails cost 9MB.
//
// So this plugin renders each source image to WebP at a ladder of widths and hands the URLs to
// plugins/content.js, which writes them into the markup as a `srcset`. The browser then picks a
// candidate off that ladder using the `sizes` hint each surface supplies — `150px` for a print
// in a pile, `70vw` for the viewer — which is the whole trick: one `srcset`, and the same photo
// costs ~20KB in a pile and only pays for the big version when it's actually being looked at.
//
// Derivatives are written into `public/_img/` (gitignored) rather than emitted as build assets,
// because the dev server and the build both already serve `public/` verbatim — no middleware, no
// asset plumbing, and what you see in dev is byte-for-byte what ships. Names carry a hash of the
// source bytes, so a rebuild regenerates nothing and editing a photo can't be cached stale.
//
// The originals are never referenced by the page (`src` points at the largest derivative), so
// the build deletes them out of `dist/` at the end — they're the authoring source, not a web
// asset. Only files this plugin actually replaced are removed; anything it didn't process is
// left exactly where it is.
//
// NOTE: the manifest is built in `buildStart`, which Vite runs before it loads any module — so
// it is always populated by the time content.js parses the markdown. A photo added while the dev
// server is running needs a restart to be picked up.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import sharp from 'sharp';

// The rungs of the ladder. Anything wider than the source is dropped, and the source's own width
// is added on the end (capped), so a 1179px phone screenshot ladders 320/640/1024/1179 rather
// than being upscaled to 1600.
const WIDTHS = [320, 640, 1024, 1600];
const MAX_WIDTH = 1600;
const QUALITY = 76;
// Motion hides compression the way a still never can, and an animated file pays for its quality
// once per frame — so a clip is worth encoding harder than a photograph.
const ANIMATED_QUALITY = 58;

const EXTS = new Set(['.png', '.jpg', '.jpeg', '.webp', '.gif']);
const OUT_DIR = '_img';
// Everything under public/ is a photo to be rendered down except these two: `art` is the
// hand-drawn board art, which is referenced by literal path from the JS and CSS rather than
// through the content pipeline (rewriting or pruning any of it would break the board), and
// `_img` is this plugin's own output. Anything else — a new `extras/` folder, say — is picked
// up without touching this file.
const SKIP_DIRS = new Set([OUT_DIR, 'art']);

// url (as authored in markdown, e.g. "/projects/CipherArena/landing.png") → what to render for it.
const manifest = new Map();

/**
 * What content.js needs to write an <img> for one authored URL: the ladder, a `src` that is
 * itself already optimised, and the intrinsic size so the browser can hold the space.
 * Returns null for anything this plugin didn't process, which is the signal to leave the
 * original markup alone.
 */
export function imageFor(url) {
  return manifest.get(url) ?? null;
}

function hashOf(buf) {
  return crypto.createHash('sha256').update(buf).digest('hex').slice(0, 8);
}

function walk(dir) {
  const out = [];
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(full));
    else if (EXTS.has(path.extname(entry.name).toLowerCase())) out.push(full);
  }
  return out;
}

export default function imagesPlugin({ dirs = null, quiet = false } = {}) {
  let publicDir;
  let outAbs;
  let distDir;

  async function derive(file) {
    const buf = fs.readFileSync(file);
    const hash = hashOf(buf);
    const meta = await sharp(buf).metadata();
    // A GIF that moves stays moving: opened with `animated`, sharp resizes every frame and webp
    // writes them back out as an animated WebP, frame delays and loop count intact. Read the
    // metadata *without* it, though — animated input reports the height of the whole frame strip
    // (94 frames of 288px as one 27072px image), and what's wanted here is one frame.
    const animated = (meta.pages ?? 1) > 1;
    // An image whose orientation lives in EXIF reports its pre-rotation dimensions; sharp's
    // autoOrient (applied on resize below) swaps them, so swap here too or every portrait photo
    // claims to be landscape and the browser holds the wrong box for it.
    const rotated = !animated && (meta.orientation ?? 1) >= 5;
    const srcW = rotated ? meta.height : meta.width;
    const srcH = rotated ? meta.width : meta.height;
    if (!srcW || !srcH) return null;

    const widths = [...new Set([...WIDTHS.filter((w) => w < srcW), Math.min(srcW, MAX_WIDTH)])].sort(
      (a, b) => a - b
    );

    const base = path.basename(file, path.extname(file));
    const rel = path.relative(publicDir, file).split(path.sep).join('/');
    const entries = [];

    for (const w of widths) {
      const name = `${base}-${hash}-${w}.webp`;
      const abs = path.join(outAbs, name);
      if (!fs.existsSync(abs)) {
        const pipeline = sharp(buf, { animated });
        // autoOrient is for EXIF-rotated camera stills; an animated pipeline has no orientation
        // tag to read and is left alone rather than run through it.
        if (!animated) pipeline.autoOrient();
        await pipeline
          .resize({ width: w, withoutEnlargement: true })
          .webp({ quality: animated ? ANIMATED_QUALITY : QUALITY, effort: 4 })
          .toFile(abs);
      }
      entries.push({ name, width: w });
    }

    const widest = entries[entries.length - 1];
    return {
      url: '/' + rel,
      source: file,
      // Largest first is irrelevant to the browser but makes the attribute readable.
      srcset: entries.map((e) => `/${OUT_DIR}/${e.name} ${e.width}w`).join(', '),
      src: `/${OUT_DIR}/${widest.name}`,
      width: srcW,
      height: srcH,
      files: entries.map((e) => e.name),
    };
  }

  async function build(root) {
    publicDir = path.resolve(root, 'public');
    outAbs = path.join(publicDir, OUT_DIR);
    fs.mkdirSync(outAbs, { recursive: true });

    // Every folder under public/ except the two that aren't photo libraries, so dropping in a
    // new one is enough — no list here to keep in step with the filesystem.
    const roots =
      dirs ??
      fs
        .readdirSync(publicDir, { withFileTypes: true })
        .filter((e) => e.isDirectory() && !SKIP_DIRS.has(e.name))
        .map((e) => e.name);
    const sources = roots.flatMap((d) => walk(path.join(publicDir, d)));
    manifest.clear();

    const started = Date.now();
    let rendered = 0;
    const keep = new Set();

    for (const file of sources) {
      const before = fs.readdirSync(outAbs).length;
      const entry = await derive(file);
      if (!entry) continue;
      manifest.set(entry.url, entry);
      entry.files.forEach((f) => keep.add(f));
      if (fs.readdirSync(outAbs).length !== before) rendered++;
    }

    // Anything left over is a derivative of a photo that has since been edited or deleted.
    for (const name of fs.readdirSync(outAbs)) {
      if (!keep.has(name)) fs.rmSync(path.join(outAbs, name), { force: true });
    }

    if (!quiet && manifest.size) {
      const note = rendered
        ? `${rendered} photo${rendered === 1 ? '' : 's'} newly rendered in ${((Date.now() - started) / 1000).toFixed(1)}s`
        : 'all cached';
      console.log(`images: ${manifest.size} photos → ${keep.size} webp derivatives (${note})`);
    }
  }

  return {
    name: 'images',
    configResolved(config) {
      distDir = path.resolve(config.root, config.build.outDir);
    },
    // Before Vite loads a single module, so content.js can rely on the manifest being ready.
    async buildStart() {
      await build(this.environment?.config?.root ?? process.cwd());
    },
    // The originals are the authoring source; nothing on the page points at them any more, and
    // they're 10-50x the size of what does. Only the ones with derivatives are dropped.
    closeBundle() {
      if (!distDir || !fs.existsSync(distDir)) return;
      let freed = 0;
      for (const entry of manifest.values()) {
        const shipped = path.join(distDir, entry.url);
        if (!fs.existsSync(shipped)) continue;
        freed += fs.statSync(shipped).size;
        fs.rmSync(shipped, { force: true });
      }
      if (!quiet && freed) {
        console.log(`images: ${(freed / 1048576).toFixed(1)}MB of source photos left out of the build`);
      }
    },
  };
}
