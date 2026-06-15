import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';
import {
  readdirSync,
  renameSync,
  readFileSync,
  writeFileSync,
  rmSync,
} from 'fs';
import { execSync } from 'child_process';
import webExtension from 'vite-plugin-web-extension';
import { sentryVitePlugin } from '@sentry/vite-plugin';

/**
 * Build identity surfaced in the popup so you can tell exactly which build is
 * loaded — the manifest version plus the git commit (with a `-dirty` suffix for
 * uncommitted changes) and the build timestamp. Git lookups degrade gracefully
 * to 'unknown' so a build never fails outside a git checkout.
 */
function git(cmd: string): string {
  try {
    return execSync(`git ${cmd}`, { stdio: ['ignore', 'pipe', 'ignore'] })
      .toString()
      .trim();
  } catch {
    return '';
  }
}

const pkg = JSON.parse(
  readFileSync(resolve(__dirname, 'package.json'), 'utf-8')
) as { version: string };

const BUILD_INFO = {
  version: pkg.version,
  sha: (git('rev-parse --short HEAD') || 'unknown') + (git('status --porcelain') ? '-dirty' : ''),
  time: new Date().toISOString().slice(0, 16).replace('T', ' ') + 'Z',
};

/**
 * Sentry release name, shared between the runtime SDK (injected via the
 * `__SENTRY_RELEASE__` define and read in src/shared/observability/sentry.ts)
 * and the source-map upload plugin below, so uploaded artifacts always match the
 * release the events are tagged with. The time is sanitized (space/colon ->
 * hyphen) because Sentry release names can't contain whitespace.
 */
const SENTRY_RELEASE = `firestarter@${BUILD_INFO.version}+${BUILD_INFO.sha}.${BUILD_INFO.time.replace(
  /[ :]/g,
  '-'
)}`;

/**
 * vite-plugin-web-extension emits files with colons in the name (e.g. virtual:temp.js.js).
 * Colons are invalid on Windows/NTFS and rejected by actions/upload-artifact.
 * This plugin renames those files post-build and updates all references.
 *
 * TODO: this is a workaround for the bundler emitting `virtual:` module ids
 * verbatim. Re-check on each vite-plugin-web-extension bump — if upstream stops
 * emitting colon-named chunks, this whole plugin can be deleted.
 */
function sanitizeOutputFileNames(outDir: string): Plugin {
  return {
    name: 'sanitize-output-filenames',
    closeBundle() {
      const dir = resolve(__dirname, outDir);

      // public/popup.html is the popup ENTRY (manifest -> public/popup.html,
      // built to dist/public/popup.html with a bundled script). But it also
      // lives in Vite's publicDir, so Vite ALSO copies it verbatim to
      // dist/popup.html — where it still points at the raw ../src/popup/index.tsx
      // and, if opened, throws `process`/`document is not defined`. The real
      // popup is dist/public/popup.html; delete the stray root copy.
      const strayPopup = resolve(dir, 'popup.html');
      try {
        if (readFileSync(strayPopup, 'utf-8').includes('src/popup/index.tsx')) {
          rmSync(strayPopup);
        }
      } catch {
        // not present in this sub-build's output — nothing to remove
      }

      const renames = new Map<string, string>();

      for (const file of readdirSync(dir)) {
        if (file.includes(':')) {
          const sanitized = file.replace(/:/g, '_');
          renameSync(resolve(dir, file), resolve(dir, sanitized));
          renames.set(file, sanitized);
        }
      }

      if (renames.size === 0) return;

      // Update references in HTML and other text files
      const textFiles = readdirSync(dir, { recursive: true }) as string[];
      for (const rel of textFiles) {
        const full = resolve(dir, rel);
        try {
          const content = readFileSync(full, 'utf-8');
          let updated = content;
          for (const [old, sanitized] of renames) {
            updated = updated.replaceAll(old, sanitized);
          }
          if (updated !== content) {
            writeFileSync(full, updated);
          }
        } catch {
          // skip binary files / directories
        }
      }
    },
  };
}

/**
 * Source maps are uploaded to Sentry only for non-dev builds and only when a
 * SENTRY_AUTH_TOKEN is present (CI / release builds). Without a token the plugin
 * is skipped entirely so ordinary local `npm run build`s don't fail. We emit
 * 'hidden' source maps (generated, but no `sourceMappingURL` comment in the
 * shipped JS) and delete the .map files after upload so they never get packaged
 * into the published extension.
 */
const SENTRY_AUTH_TOKEN = process.env.SENTRY_AUTH_TOKEN;

export default defineConfig(({ mode }) => {
  const uploadSourcemaps = mode !== 'development' && !!SENTRY_AUTH_TOKEN;

  return {
  // React's jsx-runtime (and other deps) branch on `process.env.NODE_ENV` at
  // runtime. The browser has no `process` global, so unless we statically
  // replace this the popup throws `ReferenceError: process is not defined` on
  // load. Define it from the build mode so the dead branch is eliminated.
  define: {
    'process.env.NODE_ENV': JSON.stringify(
      mode === 'development' ? 'development' : 'production'
    ),
    // Belt-and-suspenders: any *other* `process.env.X` access from a dependency
    // (e.g. the Sentry SDK) resolves to `undefined` instead of throwing
    // `ReferenceError: process is not defined` in the browser. esbuild matches
    // the longest define key, so the NODE_ENV replacement above still wins.
    'process.env': '{}',
    __BUILD_INFO__: JSON.stringify(BUILD_INFO),
    __SENTRY_RELEASE__: JSON.stringify(SENTRY_RELEASE),
  },
  // Test config lives in vitest.config.ts so tests don't load the extension
  // build plugins (which crash on teardown outside of `vite build`).
  plugins: [
    react(),
    webExtension({
      manifest: () => ({
        manifest_version: 3,
        name: 'Firestarter - Enhanced Tinder Experience',
        version: '2.0.0',
        description:
          'Improved Tinder UI with keyboard shortcuts, auto-filtering, and enhanced profile information',
        author: 'RooTer',
        // unlimitedStorage: captures now store the raw whole page (anonymized
        // only at export), which is far larger than the old scrubbed HTML and
        // would otherwise risk silently blowing storage.local's ~10MB quota.
        permissions: ['storage', 'unlimitedStorage', 'notifications'],
        host_permissions: ['https://tinder.com/*', 'https://*.tinder.com/*'],
        action: {
          default_popup: 'public/popup.html',
          default_icon: {
            16: 'icons/icon16.png',
            32: 'icons/icon32.png',
            48: 'icons/icon48.png',
            128: 'icons/icon128.png',
          },
        },
        icons: {
          16: 'icons/icon16.png',
          32: 'icons/icon32.png',
          48: 'icons/icon48.png',
          128: 'icons/icon128.png',
        },
        background: {
          service_worker: 'src/background/index.ts',
          type: 'module',
        },
        commands: {
          'capture-page': {
            // Registered at the browser level so the page (and the Linux
            // Alt+Shift layout-switch combo) can't swallow it. Rebindable at
            // chrome://extensions/shortcuts.
            suggested_key: {
              default: 'Ctrl+Shift+Y',
              mac: 'Command+Shift+Y',
            },
            description: 'Firestarter: capture the current page',
          },
        },
        content_scripts: [
          {
            matches: ['https://tinder.com/*', 'https://*.tinder.com/*'],
            js: ['src/content/index.ts'],
            run_at: 'document_idle',
          },
        ],
        web_accessible_resources: [
          {
            resources: ['icons/*.png'],
            matches: ['https://tinder.com/*'],
          },
        ],
      }),
    }),
    sanitizeOutputFileNames('dist'),
    // Must come after the build plugins so it can read the emitted bundles +
    // source maps. Injects debug IDs and uploads maps for SENTRY_RELEASE, then
    // deletes them from dist. Skipped (falsy, ignored by Vite) without a token.
    uploadSourcemaps &&
      sentryVitePlugin({
        org: 'kyberiannet',
        project: 'firestarter',
        authToken: SENTRY_AUTH_TOKEN,
        release: { name: SENTRY_RELEASE },
        sourcemaps: {
          filesToDeleteAfterUpload: ['dist/**/*.map'],
        },
        telemetry: false,
      }),
  ],
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
      '@shared': resolve(__dirname, './src/shared'),
      '@features': resolve(__dirname, './src/features'),
    },
  },
  build: {
    outDir: 'dist',
    // Dev: inline-friendly maps for debugging. Release builds with a Sentry
    // token: 'hidden' maps (emitted for upload, no sourceMappingURL in the
    // shipped JS, deleted post-upload). Otherwise: none.
    sourcemap: mode === 'development' ? true : uploadSourcemaps ? 'hidden' : false,
    // NOTE: do NOT set rollupOptions.input here. vite-plugin-web-extension runs
    // a separate sub-build per manifest entry (popup, background, content) and a
    // global `input` override is applied to ALL of them — which made every
    // sub-build compile public/popup.html, so the background and content scripts
    // shipped the popup's React app instead of their own code. The plugin
    // derives each entry from the manifest; let it.
  },
  };
});
