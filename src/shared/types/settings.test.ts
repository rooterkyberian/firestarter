import { describe, it, expect } from 'vitest';
import { DEFAULT_SETTINGS } from './settings';

describe('DEFAULT_SETTINGS', () => {
  it('has expected defaults', () => {
    expect(DEFAULT_SETTINGS.activated).toBe(true);
    expect(DEFAULT_SETTINGS.autoSwipeLeft).toBe(false);
    expect(DEFAULT_SETTINGS.distanceLimit).toBe(60);
    expect(DEFAULT_SETTINGS.heightLimit).toBe(175);
    expect(DEFAULT_SETTINGS.interestsBlacklist).toEqual(['Astrology']);
    expect(DEFAULT_SETTINGS.requiredRegexp).toBe('');
  });

  it('is a complete settings object', () => {
    const keys = Object.keys(DEFAULT_SETTINGS);
    expect(keys).toContain('activated');
    expect(keys).toContain('autoSwipeLeft');
    expect(keys).toContain('distanceLimit');
    expect(keys).toContain('heightLimit');
    expect(keys).toContain('interestsBlacklist');
    expect(keys).toContain('requiredRegexp');
  });
});
