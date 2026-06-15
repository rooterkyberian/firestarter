/// <reference types="vite/client" />

/**
 * Build identity injected at build time via Vite `define` (see vite.config.ts).
 */
declare const __BUILD_INFO__: {
  /** package.json version (matches the manifest version). */
  version: string;
  /** Short git SHA, with a `-dirty` suffix when the tree had uncommitted changes. */
  sha: string;
  /** UTC build timestamp, `YYYY-MM-DD HH:MMZ`. */
  time: string;
};

/**
 * Sentry release name for this build, injected via Vite `define` (see
 * vite.config.ts). Shared by the runtime SDK and the source-map upload plugin.
 */
declare const __SENTRY_RELEASE__: string;
