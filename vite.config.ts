import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';
import { readdirSync, renameSync, readFileSync, writeFileSync } from 'fs';
import webExtension from 'vite-plugin-web-extension';

/**
 * vite-plugin-web-extension emits files with colons in the name (e.g. virtual:temp.js.js).
 * Colons are invalid on Windows/NTFS and rejected by actions/upload-artifact.
 * This plugin renames those files post-build and updates all references.
 */
function sanitizeOutputFileNames(outDir: string): Plugin {
  return {
    name: 'sanitize-output-filenames',
    closeBundle() {
      const dir = resolve(__dirname, outDir);
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

export default defineConfig({
  test: {
    environment: 'jsdom',
    include: ['src/**/*.test.{ts,tsx}'],
  },
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
        permissions: ['storage', 'notifications'],
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
    sourcemap: process.env.NODE_ENV === 'development',
    rollupOptions: {
      input: {
        popup: resolve(__dirname, 'public/popup.html'),
      },
    },
  },
});
