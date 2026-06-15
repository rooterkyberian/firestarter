import { useEffect, useState } from 'react';
import { useSettingsStore } from '@shared/config/store';
import { CaptureStore } from '@shared/storage/captureStore';
import { relationshipIntents } from '@features/profileAnalyzer/relationshipIntents';

/**
 * Per-filter enable checkbox shown in each filter card's header. Toggling it off
 * makes `shouldReject` skip that rule entirely (see `filter*Enabled` settings).
 */
function FilterToggle({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label
      className="flex items-center gap-1.5 text-xs text-gray-500 cursor-pointer select-none"
      title="Enable this filter"
    >
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
      />
      Enabled
    </label>
  );
}

export function App() {
  const settings = useSettingsStore();
  // Stable action reference (zustand never recreates it), so the load-on-mount
  // effect runs exactly once without depending on the whole settings object.
  const loadSettings = useSettingsStore((state) => state.loadSettings);
  const [interestsInput, setInterestsInput] = useState('');
  const [captureCount, setCaptureCount] = useState(0);

  useEffect(() => {
    CaptureStore.count().then(setCaptureCount);
  }, []);

  const handleExportCaptures = async () => {
    const captures = await CaptureStore.getAll();
    // Exported verbatim (raw). Anonymization is a deliberate, separate step done
    // when turning a capture into a committed test fixture — see
    // `anonymizeHtml` in features/recorder/anonymize.ts — not on capture/export.
    const blob = new Blob([JSON.stringify(captures, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `firestarter-captures-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleClearCaptures = async () => {
    await CaptureStore.clear();
    setCaptureCount(0);
  };

  // Trigger a capture on the active tab directly — a reliable path that doesn't
  // depend on the browser-level keyboard command being registered. The content
  // script shows the title popup in the page, so we close this popup to get out
  // of the way.
  const handleCapturePage = async () => {
    const [tab] = await chrome.tabs.query({
      active: true,
      currentWindow: true,
    });
    if (tab?.id) {
      chrome.tabs.sendMessage(tab.id, { type: 'CAPTURE_PAGE' }, () => {
        void chrome.runtime.lastError;
      });
    }
    window.close();
  };

  useEffect(() => {
    // Load settings when popup opens
    loadSettings();
  }, [loadSettings]);

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

  const toggleLookingFor = (intent: string, checked: boolean) => {
    const next = checked
      ? [...settings.lookingForBlacklist, intent]
      : settings.lookingForBlacklist.filter((i) => i !== intent);
    settings.updateSettings({ lookingForBlacklist: next });
  };

  return (
    <div className="w-96 bg-gray-50 p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">
          🔥 Firestarter
        </h1>
        <p className="text-sm text-gray-600">Enhanced Tinder Experience</p>
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

        {/* Auto-reject countdown */}
        <div className="p-4 bg-white rounded-lg shadow-sm">
          <label className="text-sm font-medium text-gray-900">
            Reject Countdown (seconds)
          </label>
          <input
            type="number"
            value={settings.autoRejectCountdown}
            onChange={(e) =>
              settings.updateSettings({
                autoRejectCountdown: Math.max(0, Number(e.target.value)),
              })
            }
            className="mt-2 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            min="0"
            max="60"
          />
          <p className="text-xs text-gray-500 mt-1">
            A confirmation dialog appears before each auto-reject and confirms
            itself after this many seconds. 0 = wait indefinitely (always ask).
          </p>
        </div>

        {/* Distance Limit */}
        <div className="p-4 bg-white rounded-lg shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium text-gray-900">
              Distance Limit (km)
            </label>
            <FilterToggle
              checked={settings.filterDistanceEnabled}
              onChange={(v) =>
                settings.updateSettings({ filterDistanceEnabled: v })
              }
            />
          </div>
          <input
            type="number"
            value={settings.distanceLimit}
            disabled={!settings.filterDistanceEnabled}
            onChange={(e) =>
              settings.updateSettings({ distanceLimit: Number(e.target.value) })
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:bg-gray-100"
            min="1"
            max="500"
          />
          <p className="text-xs text-gray-500 mt-1">
            Reject profiles farther than this distance
          </p>
        </div>

        {/* Height Limit */}
        <div className="p-4 bg-white rounded-lg shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium text-gray-900">
              Height Limit (cm)
            </label>
            <FilterToggle
              checked={settings.filterHeightEnabled}
              onChange={(v) =>
                settings.updateSettings({ filterHeightEnabled: v })
              }
            />
          </div>
          <input
            type="number"
            value={settings.heightLimit}
            disabled={!settings.filterHeightEnabled}
            onChange={(e) =>
              settings.updateSettings({ heightLimit: Number(e.target.value) })
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:bg-gray-100"
            min="140"
            max="220"
          />
          <p className="text-xs text-gray-500 mt-1">
            Reject profiles with height above this value
          </p>
        </div>

        {/* Interests Blacklist */}
        <div className="p-4 bg-white rounded-lg shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium text-gray-900">
              Interests Blacklist
            </label>
            <FilterToggle
              checked={settings.filterInterestsEnabled}
              onChange={(v) =>
                settings.updateSettings({ filterInterestsEnabled: v })
              }
            />
          </div>
          <input
            type="text"
            value={interestsInput}
            disabled={!settings.filterInterestsEnabled}
            onChange={(e) => handleInterestsChange(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:bg-gray-100"
            placeholder="Astrology, Crypto, etc."
          />
          <p className="text-xs text-gray-500 mt-1">
            Comma-separated list of interests to filter out
          </p>
        </div>

        {/* Looking For Blacklist */}
        <div className="p-4 bg-white rounded-lg shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium text-gray-900">
              Reject "Looking for"
            </label>
            <FilterToggle
              checked={settings.filterLookingForEnabled}
              onChange={(v) =>
                settings.updateSettings({ filterLookingForEnabled: v })
              }
            />
          </div>
          <div
            className={`space-y-2 ${
              settings.filterLookingForEnabled ? '' : 'opacity-50'
            }`}
          >
            {relationshipIntents.map((intent) => (
              <label
                key={intent}
                className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={settings.lookingForBlacklist.includes(intent)}
                  disabled={!settings.filterLookingForEnabled}
                  onChange={(e) => toggleLookingFor(intent, e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                {intent}
              </label>
            ))}
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Auto-reject profiles whose relationship intent is checked
          </p>
        </div>

        {/* Required Regexp */}
        <div className="p-4 bg-white rounded-lg shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium text-gray-900">
              Required Bio Pattern (regex)
            </label>
            <FilterToggle
              checked={settings.filterRegexpEnabled}
              onChange={(v) =>
                settings.updateSettings({ filterRegexpEnabled: v })
              }
            />
          </div>
          <input
            type="text"
            value={settings.requiredRegexp}
            disabled={!settings.filterRegexpEnabled}
            onChange={(e) =>
              settings.updateSettings({ requiredRegexp: e.target.value })
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:bg-gray-100"
            placeholder="e.g., travel|adventure"
          />
          <p className="text-xs text-gray-500 mt-1">
            Reject if bio doesn't match this pattern
          </p>
        </div>

        {/* Social VIP filter */}
        <div className="p-4 bg-white rounded-lg shadow-sm">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-gray-900">
              Reject VIP/promo accounts
            </label>
            <FilterToggle
              checked={settings.filterSocialEnabled}
              onChange={(v) =>
                settings.updateSettings({ filterSocialEnabled: v })
              }
            />
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Reject when a linked social handle looks like a "VIP" account
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
          <li>
            <kbd className="px-1 bg-white rounded">Insert</kbd> - Toggle
            activation
          </li>
          <li>
            <kbd className="px-1 bg-white rounded">PageDown</kbd> - Undo last
            swipe
          </li>
          <li>
            <kbd className="px-1 bg-white rounded">Numpad 0</kbd> - Next image
          </li>
          <li>
            <kbd className="px-1 bg-white rounded">Numpad .</kbd> - Reload page
          </li>
          <li>
            <kbd className="px-1 bg-white rounded">Ctrl+Shift+Y</kbd> - Capture
            current card (dev)
          </li>
        </ul>
      </div>

      {/* Developer: selector captures */}
      <div className="mt-4 p-4 bg-amber-50 rounded-lg border border-amber-200">
        <h3 className="text-sm font-semibold text-amber-900 mb-1">
          🛠️ Developer
        </h3>
        <p className="text-xs text-amber-800 mb-3">
          {captureCount} anonymized page capture
          {captureCount === 1 ? '' : 's'} stored. Press{' '}
          <kbd className="px-1 bg-white rounded">Ctrl+Shift+Y</kbd> on Tinder, or
          use the button below, to record one.
        </p>
        <button
          onClick={handleCapturePage}
          className="w-full mb-2 py-2 px-3 text-xs font-medium rounded-md bg-rose-600 text-white hover:bg-rose-700 transition-colors"
        >
          📸 Capture page
        </button>
        <div className="flex gap-2">
          <button
            onClick={handleExportCaptures}
            disabled={captureCount === 0}
            className="flex-1 py-2 px-3 text-xs font-medium rounded-md bg-amber-600 text-white hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Export captures
          </button>
          <button
            onClick={handleClearCaptures}
            disabled={captureCount === 0}
            className="flex-1 py-2 px-3 text-xs font-medium rounded-md bg-gray-200 text-gray-800 hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Clear
          </button>
        </div>
      </div>

      {/* Build identity — which build is currently loaded. */}
      <p
        className="mt-4 text-center text-[10px] text-gray-400"
        title={`Built ${__BUILD_INFO__.time}`}
      >
        v{__BUILD_INFO__.version} · {__BUILD_INFO__.sha} · {__BUILD_INFO__.time}
      </p>
    </div>
  );
}
