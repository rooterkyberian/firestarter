import { useEffect, useState } from 'react';
import { useSettingsStore } from '@shared/config/store';

export function App() {
  const settings = useSettingsStore();
  const [interestsInput, setInterestsInput] = useState('');

  useEffect(() => {
    // Load settings when popup opens
    settings.loadSettings();
  }, []);

  useEffect(() => {
    // Update interests input when settings load
    setInterestsInput(settings.interestsBlacklist.join(', '));
  }, [settings.interestsBlacklist]);

  const handleInterestsChange = (value: string) => {
    setInterestsInput(value);
    const interests = value
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    settings.updateSettings({ interestsBlacklist: interests });
  };

  return (
    <div className="w-96 bg-gray-50 p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">
          🔥 Firestarter
        </h1>
        <p className="text-sm text-gray-600">
          Enhanced Tinder Experience
        </p>
      </div>

      {/* Settings Form */}
      <div className="space-y-4">
        {/* Activation Toggle */}
        <div className="flex items-center justify-between p-4 bg-white rounded-lg shadow-sm">
          <div>
            <label className="text-sm font-medium text-gray-900">
              Activated
            </label>
            <p className="text-xs text-gray-500 mt-0.5">
              Enable/disable all features
            </p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={settings.activated}
              onChange={(e) =>
                settings.updateSettings({ activated: e.target.checked })
              }
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
          </label>
        </div>

        {/* Auto Swipe Left */}
        <div className="flex items-center justify-between p-4 bg-white rounded-lg shadow-sm">
          <div>
            <label className="text-sm font-medium text-gray-900">
              Auto Swipe Left
            </label>
            <p className="text-xs text-gray-500 mt-0.5">
              Automatically reject based on filters
            </p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={settings.autoSwipeLeft}
              onChange={(e) =>
                settings.updateSettings({ autoSwipeLeft: e.target.checked })
              }
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
          </label>
        </div>

        {/* Distance Limit */}
        <div className="p-4 bg-white rounded-lg shadow-sm">
          <label className="block text-sm font-medium text-gray-900 mb-2">
            Distance Limit (km)
          </label>
          <input
            type="number"
            value={settings.distanceLimit}
            onChange={(e) =>
              settings.updateSettings({ distanceLimit: Number(e.target.value) })
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            min="1"
            max="500"
          />
          <p className="text-xs text-gray-500 mt-1">
            Reject profiles farther than this distance
          </p>
        </div>

        {/* Height Limit */}
        <div className="p-4 bg-white rounded-lg shadow-sm">
          <label className="block text-sm font-medium text-gray-900 mb-2">
            Height Limit (cm)
          </label>
          <input
            type="number"
            value={settings.heightLimit}
            onChange={(e) =>
              settings.updateSettings({ heightLimit: Number(e.target.value) })
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            min="140"
            max="220"
          />
          <p className="text-xs text-gray-500 mt-1">
            Reject profiles with height above this value
          </p>
        </div>

        {/* Interests Blacklist */}
        <div className="p-4 bg-white rounded-lg shadow-sm">
          <label className="block text-sm font-medium text-gray-900 mb-2">
            Interests Blacklist
          </label>
          <input
            type="text"
            value={interestsInput}
            onChange={(e) => handleInterestsChange(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Astrology, Crypto, etc."
          />
          <p className="text-xs text-gray-500 mt-1">
            Comma-separated list of interests to filter out
          </p>
        </div>

        {/* Required Regexp */}
        <div className="p-4 bg-white rounded-lg shadow-sm">
          <label className="block text-sm font-medium text-gray-900 mb-2">
            Required Bio Pattern (regex)
          </label>
          <input
            type="text"
            value={settings.requiredRegexp}
            onChange={(e) =>
              settings.updateSettings({ requiredRegexp: e.target.value })
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="e.g., travel|adventure"
          />
          <p className="text-xs text-gray-500 mt-1">
            Reject if bio doesn't match this pattern
          </p>
        </div>

        {/* Reset Button */}
        <button
          onClick={() => settings.resetSettings()}
          className="w-full py-2 px-4 bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium rounded-lg transition-colors"
        >
          Reset to Defaults
        </button>
      </div>

      {/* Keyboard Shortcuts Info */}
      <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
        <h3 className="text-sm font-semibold text-blue-900 mb-2">
          ⌨️ Keyboard Shortcuts
        </h3>
        <ul className="text-xs text-blue-800 space-y-1">
          <li><kbd className="px-1 bg-white rounded">Insert</kbd> - Toggle activation</li>
          <li><kbd className="px-1 bg-white rounded">PageDown</kbd> - Undo last swipe</li>
          <li><kbd className="px-1 bg-white rounded">Numpad 0</kbd> - Next image</li>
          <li><kbd className="px-1 bg-white rounded">Numpad .</kbd> - Reload page</li>
        </ul>
      </div>
    </div>
  );
}
