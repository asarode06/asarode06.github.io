import { defineConfig } from 'vite';
import content from './plugins/content.js';
import images from './plugins/images.js';

// asarode06.github.io is a user page, served from the domain root — no sub-path.
export default defineConfig({
  base: '/',
  // Parses every content/*.md file into `virtual:content` at build time, so the browser never
  // loads a markdown parser. See plugins/content.js, and src/content.js for the shapes it feeds.
  // `images` first: it renders the WebP ladder for every photo in buildStart, and `content`
  // reads that manifest as it turns the markdown into HTML.
  plugins: [images(), content()],
  build: {
    outDir: 'dist',
  },
});
