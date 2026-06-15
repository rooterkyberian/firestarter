#!/usr/bin/env node

/**
 * Remove the dist/ build output before a fresh build.
 *
 * Why this exists: vite-plugin-web-extension runs a separate sub-build per
 * manifest entry (popup, background, content), so Vite's own `emptyOutDir` can't
 * be used — each pass would wipe the previous pass's output. With no cleaning,
 * stale chunks from earlier builds linger in dist/ (e.g. an old `virtual_temp.js.js`)
 * and can be loaded by Chrome, resurrecting bugs that were already fixed in the
 * current sources. Cleaning once, up front, keeps dist/ to exactly this build.
 */

import { rm } from 'fs/promises';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
await rm(resolve(root, 'dist'), { recursive: true, force: true });
