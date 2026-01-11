/**
 * Auto Swipe Feature
 * Automatically swipes left based on configurable criteria
 */

import { FirestarterSettings } from '@shared/types/settings';
import { analyzeProfile } from '../profileAnalyzer';
import { press } from '@shared/utils/dom';
import { arrayAsString } from '@shared/utils/helpers';

export interface RejectionReason {
  type: 'distance' | 'height' | 'interests' | 'social' | 'regexp';
  details: unknown;
}

/**
 * Swipe left (reject)
 */
export function swipeLeft(): void {
  press({ key: 'ArrowLeft', code: 'ArrowLeft', keyCode: 37 });
}

/**
 * Swipe right (like)
 */
export function swipeRight(): void {
  press({ key: 'ArrowRight', code: 'ArrowRight', keyCode: 39 });
}

/**
 * Check if profile should be rejected based on settings
 * Returns rejection reason if should reject, null otherwise
 */
export function shouldReject(settings: FirestarterSettings): RejectionReason | null {
  const profile = analyzeProfile();

  // Check distance
  if (profile.distance && profile.distance > settings.distanceLimit) {
    return {
      type: 'distance',
      details: profile.distance,
    };
  }

  // Check interests blacklist
  if (profile.interests.size > 0) {
    const hasBlacklistedInterest = settings.interestsBlacklist.some((interest) =>
      profile.interests.has(interest)
    );
    if (hasBlacklistedInterest) {
      return {
        type: 'interests',
        details: Array.from(profile.interests),
      };
    }
  }

  // Check height
  if (profile.height && profile.height > settings.heightLimit) {
    return {
      type: 'height',
      details: profile.height,
    };
  }

  // Check social media for VIP indicators
  for (const [socialNetworkName, name] of Object.entries(profile.socialMedia)) {
    if (name.toLowerCase().includes('vip')) {
      return {
        type: 'social',
        details: { [socialNetworkName]: name },
      };
    }
  }

  // Check required regexp
  if (settings.requiredRegexp && profile.bio) {
    const requiredRegexp = settings.requiredRegexp.trim();
    if (requiredRegexp && !profile.bio.match(RegExp(requiredRegexp, 'i'))) {
      return {
        type: 'regexp',
        details: 'Bio did not match required regexp',
      };
    }
  }

  return null;
}

/**
 * Auto-reject profile if criteria met
 * Returns true if rejected, false otherwise
 */
export function autoRejectProfile(
  settings: FirestarterSettings,
  onReject?: (reason: RejectionReason) => void
): boolean {
  if (!settings.autoSwipeLeft) {
    return false;
  }

  const rejectionReason = shouldReject(settings);

  if (rejectionReason) {
    console.log('Auto-rejecting due to:', rejectionReason);

    if (onReject) {
      onReject(rejectionReason);
    }

    swipeLeft();
    return true;
  }

  return false;
}

/**
 * Format rejection reason for display
 */
export function formatRejectionReason(reason: RejectionReason): string {
  return `Swiped left due to ${reason.type}: ${arrayAsString([reason.details])}`;
}
