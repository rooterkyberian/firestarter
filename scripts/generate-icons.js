#!/usr/bin/env node

/**
 * Generate extension icons from a single inline SVG source.
 *
 * The PNGs are build artifacts (gitignored) so we never commit binaries.
 * `npm run build` runs this via the `prebuild` step, and the generated files
 * land in `public/icons/`, which vite-plugin-web-extension copies to dist root.
 */

import { mkdir, writeFile } from 'fs/promises';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';
import sharp from 'sharp';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUTPUT_DIR = resolve(__dirname, '../public/icons');
const SIZES = [16, 32, 48, 128];

/**
 * Flame-themed icon. Rendered on a dark rounded square so it stays legible at
 * 16px in the toolbar. viewBox is 128x128; sharp rescales to each target size.
 */
const SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128" viewBox="0 0 128 128">
  <defs>
    <linearGradient id="flame" x1="0" y1="1" x2="0" y2="0">
      <stop offset="0" stop-color="#ff4500"/>
      <stop offset="0.55" stop-color="#ff8c00"/>
      <stop offset="1" stop-color="#ffd700"/>
    </linearGradient>
  </defs>
  <rect width="128" height="128" rx="28" fill="#111111"/>
  <path fill="url(#flame)" d="M64 18c6 16-8 24-8 38 0 8 5 13 5 13s-12-3-12-18c0-3 .5-6 .5-6C40 60 34 74 34 88c0 20 14 32 30 32s30-12 30-32c0-22-18-34-22-54-1.5-6-4-11-8-16z"/>
  <path fill="#fff6cc" opacity="0.85" d="M64 70c3 7-3 11-3 18 0 7 6 11 6 11-9-1-15-7-15-16 0-7 6-11 12-13z"/>
</svg>`;

async function generateIcons() {
  await mkdir(OUTPUT_DIR, { recursive: true });
  const svg = Buffer.from(SVG);

  for (const size of SIZES) {
    const out = resolve(OUTPUT_DIR, `icon${size}.png`);
    await sharp(svg, { density: 384 }).resize(size, size).png().toFile(out);
    console.log(`🔥 generated icons/icon${size}.png`);
  }
}

generateIcons().catch((error) => {
  console.error('❌ Error generating icons:', error);
  process.exit(1);
});
