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

/**
 * Check if we're on the recs/matches page
 */
function isRecsLocation(): boolean {
  return !!window.location.pathname.match(/^\/app\/(recs|matches)\b/);
}

/**
 * Handle profile view change
 */
async function handleProfileChange(): Promise<void> {
  const settings = await Storage.getSettings();

  if (!settings.activated) {
    return;
  }

  // Expand profile to see full info
  expandProfile();

  // Add social media links
  addSocialLinks();

  // Auto-reject if criteria met
  const wasRejected = autoRejectProfile(settings, (reason) => {
    // Show notification about rejection
    chrome.runtime.sendMessage({
      type: 'SHOW_NOTIFICATION',
      payload: {
        title: 'Firestarter',
        message: formatRejectionReason(reason),
      },
    });

    // Schedule next profile check after swipe
    setTimeout(() => handleProfileChange(), 250);
  });

  if (wasRejected) {
    console.log('Profile auto-rejected');
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
  const settings = await Storage.getSettings();
  const newActivated = !settings.activated;

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
