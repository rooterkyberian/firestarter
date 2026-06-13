import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

/**
 * Dedicated Vitest config so tests don't load the full extension build pipeline.
 * Loading vite.config.ts (with vite-plugin-web-extension) during tests crashes on
 * teardown because the plugin's closeBundle hook expects a dev runner that only
 * exists in `vite build`. Vitest prefers this file over vite.config.ts.
 */
export default defineConfig({
  test: {
    environment: 'jsdom',
    include: ['src/**/*.test.{ts,tsx}'],
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
      '@shared': resolve(__dirname, './src/shared'),
      '@features': resolve(__dirname, './src/features'),
    },
  },
});
