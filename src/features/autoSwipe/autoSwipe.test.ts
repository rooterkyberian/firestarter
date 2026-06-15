import { describe, it, expect } from 'vitest';
import {
  formatRejectionReason,
  describeRejectionReason,
  shouldReject,
  RejectionReason,
} from './index';
import { DEFAULT_SETTINGS, ProfileData } from '@shared/types/settings';

const baseProfile: ProfileData = {
  distance: null,
  bio: null,
  height: null,
  interests: new Set(),
  socialMedia: {},
  lookingFor: null,
};

describe('formatRejectionReason', () => {
  it('formats distance rejection', () => {
    const reason: RejectionReason = { type: 'distance', details: 100 };
    expect(formatRejectionReason(reason)).toBe(
      'Swiped left due to distance: 100'
    );
  });

  it('formats height rejection', () => {
    const reason: RejectionReason = { type: 'height', details: 190 };
    expect(formatRejectionReason(reason)).toBe(
      'Swiped left due to height: 190'
    );
  });

  it('formats interests rejection', () => {
    const reason: RejectionReason = {
      type: 'interests',
      details: ['Astrology', 'Crypto'],
    };
    expect(formatRejectionReason(reason)).toContain(
      'Swiped left due to interests:'
    );
  });

  it('formats lookingFor rejection', () => {
    const reason: RejectionReason = {
      type: 'lookingFor',
      details: 'Short-term fun',
    };
    expect(formatRejectionReason(reason)).toBe(
      'Swiped left due to lookingFor: Short-term fun'
    );
  });

  it('formats regexp rejection', () => {
    const reason: RejectionReason = {
      type: 'regexp',
      details: 'Bio did not match required regexp',
    };
    expect(formatRejectionReason(reason)).toBe(
      'Swiped left due to regexp: Bio did not match required regexp'
    );
  });
});

describe('describeRejectionReason', () => {
  it('states the lookingFor intent', () => {
    const reason: RejectionReason = {
      type: 'lookingFor',
      details: 'Short-term fun',
    };
    expect(describeRejectionReason(reason)).toContain('Short-term fun');
  });

  it('states the distance', () => {
    const reason: RejectionReason = { type: 'distance', details: 100 };
    expect(describeRejectionReason(reason)).toContain('100 km');
  });

  it('states the height', () => {
    const reason: RejectionReason = { type: 'height', details: 190 };
    expect(describeRejectionReason(reason)).toContain('190 cm');
  });
});

describe('shouldReject — per-filter switches', () => {
  it('skips the distance rule when filterDistanceEnabled is false', () => {
    const profile = { ...baseProfile, distance: 999 };
    expect(shouldReject(DEFAULT_SETTINGS, profile)?.type).toBe('distance');
    expect(
      shouldReject(
        { ...DEFAULT_SETTINGS, filterDistanceEnabled: false },
        profile
      )
    ).toBeNull();
  });

  it('skips the lookingFor rule when filterLookingForEnabled is false', () => {
    const settings = {
      ...DEFAULT_SETTINGS,
      lookingForBlacklist: ['Short-term fun'],
    };
    const profile = { ...baseProfile, lookingFor: 'Short-term fun' };
    expect(shouldReject(settings, profile)?.type).toBe('lookingFor');
    expect(
      shouldReject({ ...settings, filterLookingForEnabled: false }, profile)
    ).toBeNull();
  });

  it('skips the height rule when filterHeightEnabled is false', () => {
    const profile = { ...baseProfile, height: 200 };
    expect(shouldReject(DEFAULT_SETTINGS, profile)?.type).toBe('height');
    expect(
      shouldReject({ ...DEFAULT_SETTINGS, filterHeightEnabled: false }, profile)
    ).toBeNull();
  });
});

describe('shouldReject — lookingFor', () => {
  it('rejects when the intent is blacklisted', () => {
    const settings = {
      ...DEFAULT_SETTINGS,
      lookingForBlacklist: ['Short-term fun'],
    };
    const profile = { ...baseProfile, lookingFor: 'Short-term fun' };
    expect(shouldReject(settings, profile)).toEqual({
      type: 'lookingFor',
      details: 'Short-term fun',
    });
  });

  it('keeps profiles whose intent is not blacklisted', () => {
    const settings = {
      ...DEFAULT_SETTINGS,
      lookingForBlacklist: ['Short-term fun'],
    };
    const profile = { ...baseProfile, lookingFor: 'Long-term partner' };
    expect(shouldReject(settings, profile)).toBeNull();
  });

  it('keeps profiles with no detected intent', () => {
    const settings = {
      ...DEFAULT_SETTINGS,
      lookingForBlacklist: ['Short-term fun'],
    };
    expect(shouldReject(settings, baseProfile)).toBeNull();
  });
});
