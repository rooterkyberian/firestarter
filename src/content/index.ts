/**
 * Firestarter Content Script
 * Main entry point for the Tinder enhancement extension
 */

import { Storage } from '@shared/storage';
import { FirestarterSettings, ProfileData } from '@shared/types/settings';
import { initSentry } from '@shared/observability/sentry';

initSentry('content');
import { addGlobalStyle } from '@shared/utils/dom';
import { debounce } from '@shared/utils/helpers';
import {
  setupKeyboardShortcuts,
  expandProfile,
} from '@features/keyboardShortcuts';
import {
  autoRejectProfile,
  formatRejectionReason,
  describeRejectionReason,
  shouldReject,
} from '@features/autoSwipe';
import { addSocialLinks } from '@features/socialExtractor';
import {
  analyzeProfile,
  getProfileFingerprint,
} from '@features/profileAnalyzer';
import { capturePage } from '@features/recorder';
import { promptForCaptureTitle } from '@features/recorder/titlePrompt';

/**
 * Show a transient notification via the background service worker.
 *
 * `chrome.runtime` becomes `undefined` once the extension context is invalidated
 * — e.g. the extension was reloaded at chrome://extensions while this Tinder tab
 * stayed open, leaving this stale content script running with its bridge torn
 * down. Guard (and try/catch the send) so an action like an auto-reject doesn't
 * throw an uncaught "Cannot read properties of undefined (reading 'sendMessage')"
 * instead of just silently skipping a now-impossible notification.
 */
function notify(message: string): void {
  if (!chrome?.runtime?.id) {
    console.warn(
      'Firestarter: extension context invalidated — reload this Tinder tab to restore notifications'
    );
    return;
  }
  try {
    chrome.runtime.sendMessage({
      type: 'SHOW_NOTIFICATION',
      payload: { title: 'Firestarter', message },
    });
  } catch (err) {
    console.warn('Firestarter: notification send failed', err);
  }
}

/**
 * Capture the whole page: ask for a title via the in-page popup, then persist
 * the capture and report the result. A cancelled popup (Escape / Cancel) aborts
 * the capture silently. Triggered by the `capture-page` keyboard command (which
 * the background worker forwards here as `CAPTURE_PAGE`) or the popup's
 * "Capture page" button.
 */
async function handleCapture(): Promise<void> {
  console.log('Firestarter: capture requested');
  const title = await promptForCaptureTitle();
  if (title === null) {
    console.log('Firestarter: capture cancelled');
    return;
  }

  const result = await capturePage(title);
  const message = result.ok
    ? `Captured "${title || 'untitled'}" — ${result.count} saved`
    : `Capture failed: ${result.reason}`;
  console.log(`Firestarter: ${message}`);
  notify(message);
}

/**
 * Settings are loaded once and kept in sync via Storage.onSettingsChanged, so
 * changes from the popup take effect immediately on an already-open Tinder tab
 * without re-reading storage on every DOM mutation.
 */
let currentSettings: FirestarterSettings | null = null;

/** Fingerprint of the card we last processed, to avoid re-processing/looping. */
let lastFingerprint: string | null = null;

/**
 * Signature of the profile *data* we last evaluated. The photo/aria fingerprint
 * above is computed before analysis and can't be derived for every card, so this
 * content-level signature is the authoritative "no new data" guard: if a card
 * re-triggers the observer but analyses to identical data, we skip re-evaluating
 * the rejection rules (and re-showing the confirmation dialog).
 */
let lastEvaluatedSignature: string | null = null;

/** Guards against overlapping runs while we expand + analyse a card. */
let processing = false;

/**
 * Stable, order-independent signature of a profile's analysed data. Interests
 * (a Set) and social handles are sorted so cosmetic ordering changes don't read
 * as new data.
 */
function profileSignature(profile: ProfileData): string {
  return JSON.stringify({
    distance: profile.distance,
    bio: profile.bio,
    height: profile.height,
    lookingFor: profile.lookingFor,
    interests: Array.from(profile.interests).sort(),
    socialMedia: Object.entries(profile.socialMedia).sort(([a], [b]) =>
      a.localeCompare(b)
    ),
  });
}

async function ensureSettings(): Promise<FirestarterSettings> {
  if (!currentSettings) {
    currentSettings = await Storage.getSettings();
  }
  return currentSettings;
}

/**
 * Check if we're on the recs/matches page
 */
function isRecsLocation(): boolean {
  return !!window.location.pathname.match(/^\/app\/(recs|matches)\b/);
}

/**
 * Handle profile view change.
 *
 * Expanding the card mutates the DOM, which re-triggers the observer; the
 * fingerprint guard and `processing` flag ensure each card is handled exactly
 * once instead of looping. When a fingerprint can't be derived, the post-analysis
 * `profileSignature` guard still skips re-evaluating a profile with no new data.
 */
async function handleProfileChange(): Promise<void> {
  if (processing) {
    return;
  }

  const settings = await ensureSettings();
  if (!settings.activated) {
    return;
  }

  const fingerprint = getProfileFingerprint();
  if (fingerprint && fingerprint === lastFingerprint) {
    return;
  }

  processing = true;
  try {
    // Expand to reveal full bio/interests, then let the expansion
    // animation/content render before analysing it once. The `processing` flag
    // held across this await serializes runs, so the observer re-firing on the
    // expansion's own DOM changes can't trigger a second click. expandProfile()
    // is a no-op (returns false) once the card is already expanded.
    if (expandProfile()) {
      await new Promise((resolve) => setTimeout(resolve, 400));
    }

    const profile = analyzeProfile();
    lastFingerprint = fingerprint;

    // Content-level dedup: if this analyses to the same data we already
    // evaluated, the observer just reported cosmetic DOM churn for the same
    // profile — skip re-running the rejection rules (and re-showing the
    // confirmation dialog) instead of retriggering on no new data.
    const signature = profileSignature(profile);
    if (signature === lastEvaluatedSignature) {
      return;
    }
    lastEvaluatedSignature = signature;

    // Dump the parsed profile for debugging/selector verification. interests is
    // a Set (not JSON-serializable), so expand it to an array first.
    console.log(
      'Firestarter: profile detected',
      JSON.stringify(
        { ...profile, interests: Array.from(profile.interests) },
        null,
        2
      )
    );

    addSocialLinks(profile);

    // Always evaluate the rejection rules and log a hit — whether or not
    // auto-swipe is on. With it off this is a "dry run" (no swipe happens);
    // autoRejectProfile below re-evaluates and performs the actual swipe.
    const rejection = shouldReject(settings, profile);
    if (rejection) {
      const prefix = settings.autoSwipeLeft
        ? 'auto-rejecting'
        : 'would auto-reject (auto-swipe off)';
      console.log(
        `Firestarter: ${prefix} — ${describeRejectionReason(rejection)}`,
        rejection
      );
    } else {
      // Always log the (non-)result so the per-profile evaluation is visible
      // even when nothing matches — this distinguishes "evaluated, no rule hit"
      // from "never evaluated". The gating flags are included so a mis-toggled
      // setting or a stale settings copy is obvious straight from the console.
      console.log('Firestarter: no rejection rule matched', {
        autoSwipeLeft: settings.autoSwipeLeft,
        autoRejectCountdown: settings.autoRejectCountdown,
        filtersEnabled: {
          distance: settings.filterDistanceEnabled,
          height: settings.filterHeightEnabled,
          interests: settings.filterInterestsEnabled,
          lookingFor: settings.filterLookingForEnabled,
          social: settings.filterSocialEnabled,
          regexp: settings.filterRegexpEnabled,
        },
      });
    }

    const wasRejected = await autoRejectProfile(settings, profile, (reason) => {
      notify(formatRejectionReason(reason));
    });

    if (wasRejected) {
      // The next card is a different profile; clear both guards so it's
      // processed even if it happens to fingerprint/analyse alike.
      lastFingerprint = null;
      lastEvaluatedSignature = null;
      console.log('Profile auto-rejected');
    }
  } finally {
    processing = false;
  }
}

/**
 * Setup MutationObserver to detect profile changes
 */
function setupProfileObserver(): void {
  const targetNode = document.body;
  const config = { attributes: false, childList: true, subtree: true };

  const debouncedHandler = debounce(() => {
    if (isRecsLocation()) {
      handleProfileChange();
    }
  }, 250);

  const mutationCallback: MutationCallback = (mutationsList) => {
    for (const mutation of mutationsList) {
      if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
        debouncedHandler();
        break;
      }
    }
  };

  const observer = new MutationObserver(mutationCallback);
  observer.observe(targetNode, config);

  console.log('Firestarter: Profile observer active');
}

/**
 * Add custom CSS styles
 */
function setupStyles(): void {
  addGlobalStyle(`
    .profileCard {
      height: initial !important;
    }

    .profileCard__slider__backLink {
      /* width: 375px !important; */
    }

    .Maw\\(650px\\) {
      max-width: initial !important;
    }

    .firestarterBtn {
      color: green;
      background: black;
    }

    #socialLinks {
      margin-top: 12px;
      padding: 8px;
      background: rgba(0, 0, 0, 0.05);
      border-radius: 8px;
    }

    #socialLinks a {
      font-weight: 500;
    }

    #socialLinks a:hover {
      text-decoration: underline !important;
    }
  `);
}

/**
 * Toggle activation state
 */
async function toggleActivation(): Promise<void> {
  const settings = await ensureSettings();
  const newActivated = !settings.activated;

  // Persist; the onSettingsChanged listener refreshes currentSettings.
  await Storage.setSetting('activated', newActivated);

  notify(`Firestarter ${newActivated ? 'activated' : 'deactivated'}`);

  console.log(`Firestarter: ${newActivated ? 'Activated' : 'Deactivated'}`);
}

/**
 * Initialize the extension
 */
async function initialize(): Promise<void> {
  console.log('Firestarter: Initializing...');

  // Seed settings and keep them in sync with the popup / other tabs.
  await ensureSettings();
  Storage.onSettingsChanged((settings) => {
    currentSettings = settings;
  });

  // Capture is driven by a browser-level keyboard command (forwarded by the
  // background worker) rather than an in-page keydown, so it can't be swallowed
  // by the page or the OS.
  chrome.runtime.onMessage.addListener((message) => {
    if (message?.type === 'CAPTURE_PAGE') {
      handleCapture();
    }
  });

  // Setup styles
  setupStyles();

  // Setup keyboard shortcuts
  setupKeyboardShortcuts(toggleActivation);

  // Wait a bit for Tinder to load
  setTimeout(() => {
    setupProfileObserver();
    console.log('Firestarter: Ready!');
  }, 2000);
}

// Start the extension
initialize();
