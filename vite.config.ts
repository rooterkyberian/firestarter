import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';
import webExtension from 'vite-plugin-web-extension';

// https://vitejs.dev/config/
export default defineConfig({
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
