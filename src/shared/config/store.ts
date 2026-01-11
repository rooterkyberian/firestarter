import { create } from 'zustand';
import { FirestarterSettings, DEFAULT_SETTINGS } from '../types/settings';
import { Storage } from '../storage';

interface SettingsStore extends FirestarterSettings {
  // Actions
  updateSettings: (settings: Partial<FirestarterSettings>) => Promise<void>;
  loadSettings: () => Promise<void>;
  resetSettings: () => Promise<void>;
  toggleActivated: () => Promise<void>;
}

export const useSettingsStore = create<SettingsStore>((set, get) => ({
  // Initial state from defaults
  ...DEFAULT_SETTINGS,

  // Load settings from storage
  loadSettings: async () => {
    const settings = await Storage.getSettings();
    set(settings);
  },

  // Update settings (partial update)
  updateSettings: async (updates: Partial<FirestarterSettings>) => {
    const current = get();
    const newSettings = { ...current, ...updates };

    // Remove actions from settings object before saving
    const {
      updateSettings,
      loadSettings,
      resetSettings,
      toggleActivated,
      ...settingsOnly
    } = newSettings as SettingsStore;

    await Storage.saveSettings(settingsOnly);
    set(settingsOnly);
  },

  // Reset to defaults
  resetSettings: async () => {
    await Storage.resetSettings();
    set(DEFAULT_SETTINGS);
  },

  // Quick toggle for activation
  toggleActivated: async () => {
    const current = get();
    await get().updateSettings({ activated: !current.activated });
  },
}));

// Listen for settings changes from other parts of the extension
Storage.onSettingsChanged((settings) => {
  useSettingsStore.setState(settings);
});
