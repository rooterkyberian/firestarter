import { DEFAULT_SETTINGS, FirestarterSettings } from '../types/settings';

/**
 * Storage utility for Chrome extension
 * Replaces GM_getValue/GM_setValue from userscript
 */
export class Storage {
  private static SETTINGS_KEY = 'firestarter_settings';

  /**
   * Get settings from Chrome storage
   */
  static async getSettings(): Promise<FirestarterSettings> {
    return new Promise((resolve) => {
      chrome.storage.sync.get(this.SETTINGS_KEY, (result) => {
        const settings = result[this.SETTINGS_KEY] as FirestarterSettings | undefined;
        resolve(settings || DEFAULT_SETTINGS);
      });
    });
  }

  /**
   * Save settings to Chrome storage
   */
  static async saveSettings(settings: Partial<FirestarterSettings>): Promise<void> {
    const current = await this.getSettings();
    const updated = { ...current, ...settings };

    return new Promise((resolve) => {
      chrome.storage.sync.set({ [this.SETTINGS_KEY]: updated }, () => {
        resolve();
      });
    });
  }

  /**
   * Get a single setting value
   */
  static async getSetting<K extends keyof FirestarterSettings>(
    key: K
  ): Promise<FirestarterSettings[K]> {
    const settings = await this.getSettings();
    return settings[key];
  }

  /**
   * Set a single setting value
   */
  static async setSetting<K extends keyof FirestarterSettings>(
    key: K,
    value: FirestarterSettings[K]
  ): Promise<void> {
    return this.saveSettings({ [key]: value } as Partial<FirestarterSettings>);
  }

  /**
   * Listen for settings changes
   */
  static onSettingsChanged(
    callback: (settings: FirestarterSettings) => void
  ): void {
    chrome.storage.onChanged.addListener((changes, areaName) => {
      if (areaName === 'sync' && changes[this.SETTINGS_KEY]) {
        callback(changes[this.SETTINGS_KEY].newValue as FirestarterSettings);
      }
    });
  }

  /**
   * Reset settings to defaults
   */
  static async resetSettings(): Promise<void> {
    return new Promise((resolve) => {
      chrome.storage.sync.set({ [this.SETTINGS_KEY]: DEFAULT_SETTINGS }, () => {
        resolve();
      });
    });
  }
}
