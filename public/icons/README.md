# Extension Icons

These icons are **generated at build time** — they are not committed to the repo.

`scripts/generate-icons.js` rasterizes a single inline flame-themed SVG into
`icon16.png`, `icon32.png`, `icon48.png`, and `icon128.png` using `sharp`.

- Runs automatically via the `prebuild` npm script before every `npm run build`.
- Run manually with `npm run generate-icons`.

To change the artwork, edit the `SVG` constant in `scripts/generate-icons.js`.
