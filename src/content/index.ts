/**
 * Firestarter Content Script
 * Main entry point for the Tinder enhancement extension
 */

import { Storage } from '@shared/storage';
import { FirestarterSettings } from '@shared/types/settings';
import { addGlobalStyle } from '@shared/utils/dom';
import { debounce } from '@shared/utils/helpers';
import {
  setupKeyboardShortcuts,
  expandProfile,
} from '@features/keyboardShortcuts';
import { autoRejectProfile, formatRejectionReason } from '@features/autoSwipe';
import { addSocialLinks } from '@features/socialExtractor';
import {
  analyzeProfile,
  getProfileFingerprint,
} from '@features/profileAnalyzer';
import { captureCurrentCard } from '@features/recorder';

/** Show a transient notification via the background service worker. */
function notify(message: string): void {
  chrome.runtime.sendMessage({
    type: 'SHOW_NOTIFICATION',
    payload: { title: 'Firestarter', message },
  });
}

/** Capture the current card (Alt+Shift+C) and report the result. */
async function handleCapture(): Promise<void> {
  const result = await captureCurrentCard();
  notify(
    result.ok
      ? `Captured card — ${result.count} saved`
      : `Capture failed: ${result.reason}`
  );
}

/**
 * Settings are loaded once and kept in sync via Storage.onSettingsChanged, so
 * changes from the popup take effect immediately on an already-open Tinder tab
 * without re-reading storage on every DOM mutation.
 */
let currentSettings: FirestarterSettings | null = null;

/** Fingerprint of the card we last processed, to avoid re-processing/looping. */
let lastFingerprint: string | null = null;

/** Guards against overlapping runs while we expand + analyse a card. */
let processing = false;

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
 * once instead of looping. When a fingerprint can't be derived we fall back to
 * the `processing` flag alone, which still throttles repeated runs.
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
    // Expand to reveal full bio/interests, then let the expanded content render
    // before analysing it once.
    expandProfile();
    await new Promise((resolve) => setTimeout(resolve, 300));

    const profile = analyzeProfile();
    lastFingerprint = fingerprint;

    addSocialLinks(profile);

    const wasRejected = autoRejectProfile(settings, profile, (reason) => {
      chrome.runtime.sendMessage({
        type: 'SHOW_NOTIFICATION',
        payload: {
          title: 'Firestarter',
          message: formatRejectionReason(reason),
        },
      });
    });

    if (wasRejected) {
      // The next card is a different profile; clear the guard so it's processed.
      lastFingerprint = null;
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

  chrome.runtime.sendMessage({
    type: 'SHOW_NOTIFICATION',
    payload: {
      title: 'Firestarter',
      message: `Firestarter ${newActivated ? 'activated' : 'deactivated'}`,
    },
  });

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

  // Setup styles
  setupStyles();

  // Setup keyboard shortcuts
  setupKeyboardShortcuts(toggleActivation, handleCapture);

  // Wait a bit for Tinder to load
  setTimeout(() => {
    setupProfileObserver();
    console.log('Firestarter: Ready!');
  }, 2000);
}

// Start the extension
initialize();
