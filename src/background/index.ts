/**
 * Background Service Worker
 * Handles extension lifecycle events and notifications
 */

import { Storage } from '@shared/storage';
import { DEFAULT_SETTINGS } from '@shared/types/settings';
import { initSentry } from '@shared/observability/sentry';

initSentry('background');

/**
 * Handle extension installation
 */
chrome.runtime.onInstalled.addListener(async (details) => {
  if (details.reason === 'install') {
    console.log('Firestarter: First time installation');

    // Initialize default settings
    await Storage.saveSettings(DEFAULT_SETTINGS);

    // Show welcome notification
    chrome.notifications.create({
      type: 'basic',
      iconUrl: 'icons/icon128.png',
      title: 'Firestarter Installed!',
      message: 'Click the extension icon to configure your preferences.',
    });
  } else if (details.reason === 'update') {
    console.log('Firestarter: Extension updated');
  }
});

/**
 * Keyboard command (chrome://extensions/shortcuts). Registered at the browser
 * level so it fires reliably even where a page or the OS would swallow an
 * in-page keydown (e.g. Linux's Alt+Shift layout switch). We forward it to the
 * active tab's content script, which runs the capture + title popup.
 */
chrome.commands.onCommand.addListener(async (command) => {
  console.log('Firestarter: command received:', command);
  if (command !== 'capture-page') return;

  const [tab] = await chrome.tabs.query({
    active: true,
    currentWindow: true,
  });
  if (!tab?.id) return;

  // The content script only runs on Tinder; on any other tab there's no
  // receiver and sendMessage reports lastError, which we deliberately ignore.
  chrome.tabs.sendMessage(tab.id, { type: 'CAPTURE_PAGE' }, () => {
    void chrome.runtime.lastError;
  });
});

/**
 * Handle messages from content scripts
 */
chrome.runtime.onMessage.addListener((message, _sender, _sendResponse) => {
  if (message.type === 'SHOW_NOTIFICATION') {
    chrome.notifications.create({
      type: 'basic',
      iconUrl: 'icons/icon48.png',
      title: message.payload.title,
      message: message.payload.message,
      priority: 1,
    });
  }

  return false;
});

console.log('Firestarter: Background service worker loaded');
