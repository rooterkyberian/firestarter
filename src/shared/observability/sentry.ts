/**
 * Sentry error monitoring, shared across all three extension contexts
 * (background service worker, content script, popup).
 *
 * The DSN is a public client key — safe to ship in the bundle. The project is
 * `firestarter` in the `kyberiannet` Sentry org.
 *
 * NOTE: we deliberately do NOT call `Sentry.init()`. The SDK refuses to run via
 * the global `init()` inside a browser extension (it logs
 * "You cannot use Sentry.init() in a browser extension") because that path
 * installs *global* handlers and integrations that would capture errors from the
 * host page (Tinder) and any other extension sharing the content script's
 * globals. Instead we build an isolated `BrowserClient` bound to a private
 * `Scope`, with the global integrations filtered out, exactly as the docs
 * prescribe: https://docs.sentry.io/platforms/javascript/best-practices/browser-extensions/
 */

import {
  BrowserClient,
  Scope,
  defaultStackParser,
  getDefaultIntegrations,
  makeFetchTransport,
} from '@sentry/browser';

const DSN =
  'https://8d1811e86456e4d86f10ea9ae6bc3297@o93098.ingest.us.sentry.io/4511566133788672';

/** Which part of the extension a given Sentry client is reporting from. */
export type SentryContext = 'background' | 'content' | 'popup';

/**
 * Integrations that rely on patching globals (window.onerror, fetch/XHR,
 * history, console …). They are unsafe in an extension — in the content script
 * they would attribute the host page's errors to us — so we drop them and wire
 * our own scoped global handlers below instead.
 */
const GLOBAL_INTEGRATIONS = ['BrowserApiErrors', 'Breadcrumbs', 'GlobalHandlers'];

/** The isolated scope for this context; null until initSentry runs. */
let sentryScope: Scope | null = null;

/**
 * Initialize Sentry for the given extension context. Call this once, as early
 * as possible, in each entry point (background, content, popup).
 */
export function initSentry(context: SentryContext): void {
  const integrations = getDefaultIntegrations({}).filter(
    (integration) => !GLOBAL_INTEGRATIONS.includes(integration.name)
  );

  const client = new BrowserClient({
    dsn: DSN,
    transport: makeFetchTransport,
    stackParser: defaultStackParser,
    integrations,
    // Build-stamped release name (version + git SHA + build time), shared with
    // the source-map upload plugin in vite.config.ts so uploaded artifacts match
    // the release these events are tagged with.
    release: __SENTRY_RELEASE__,
    environment: import.meta.env.PROD ? 'production' : 'development',
    // Only report errors originating from our own extension code, never from the
    // host page or other extensions sharing the content-script's globals. The
    // event-filters integration (kept above) reads this.
    allowUrls: [/^chrome-extension:\/\//],
    // Errors only for now — no performance tracing.
    tracesSampleRate: 0,
  });

  const scope = new Scope();
  scope.setClient(client);
  scope.setTag('extension.context', context);
  client.init();

  sentryScope = scope;
  installGlobalHandlers(scope);
}

/**
 * Report an exception manually to this context's isolated scope. No-op if
 * `initSentry` hasn't run yet.
 */
export function captureException(error: unknown): void {
  sentryScope?.captureException(error);
}

/**
 * Stand-in for the filtered-out GlobalHandlers integration: catch unhandled
 * errors / rejections and route them to our isolated scope only. `allowUrls`
 * still drops any frame that isn't our chrome-extension:// bundle, so the host
 * page's errors never reach Sentry. `globalThis` covers both the
 * window (content/popup) and the service-worker global (background).
 */
function installGlobalHandlers(scope: Scope): void {
  globalThis.addEventListener?.('error', (event) => {
    const err = (event as ErrorEvent).error ?? (event as ErrorEvent).message;
    if (err != null) scope.captureException(err);
  });
  globalThis.addEventListener?.('unhandledrejection', (event) => {
    const reason = (event as PromiseRejectionEvent).reason;
    if (reason != null) scope.captureException(reason);
  });
}
