/**
 * Background Service Worker
 * Handles extension lifecycle events and notifications
 */

import { Storage } from '@shared/storage';
import { DEFAULT_SETTINGS } from '@shared/types/settings';

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
