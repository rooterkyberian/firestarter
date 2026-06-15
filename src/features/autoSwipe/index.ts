/**
 * Auto Swipe Feature
 * Automatically swipes left based on configurable criteria
 */

import { FirestarterSettings, ProfileData } from '@shared/types/settings';
import { press } from '@shared/utils/dom';
import { arrayAsString } from '@shared/utils/helpers';
import { confirmRejection } from './confirmPrompt';

export interface RejectionReason {
  type: 'distance' | 'height' | 'interests' | 'lookingFor' | 'social' | 'regexp';
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
export function shouldReject(
  settings: FirestarterSettings,
  profile: ProfileData
): RejectionReason | null {
  // Check distance
  if (
    settings.filterDistanceEnabled &&
    profile.distance &&
    profile.distance > settings.distanceLimit
  ) {
    return {
      type: 'distance',
      details: profile.distance,
    };
  }

  // Check interests blacklist
  if (settings.filterInterestsEnabled && profile.interests.size > 0) {
    const hasBlacklistedInterest = settings.interestsBlacklist.some(
      (interest) => profile.interests.has(interest)
    );
    if (hasBlacklistedInterest) {
      return {
        type: 'interests',
        details: Array.from(profile.interests),
      };
    }
  }

  // Check "Looking for" relationship intent blacklist
  if (
    settings.filterLookingForEnabled &&
    profile.lookingFor &&
    settings.lookingForBlacklist.includes(profile.lookingFor)
  ) {
    return {
      type: 'lookingFor',
      details: profile.lookingFor,
    };
  }

  // Check height
  if (
    settings.filterHeightEnabled &&
    profile.height &&
    profile.height > settings.heightLimit
  ) {
    return {
      type: 'height',
      details: profile.height,
    };
  }

  // Check social media for VIP indicators
  if (settings.filterSocialEnabled) {
    for (const [socialNetworkName, name] of Object.entries(
      profile.socialMedia
    )) {
      if (name.toLowerCase().includes('vip')) {
        return {
          type: 'social',
          details: { [socialNetworkName]: name },
        };
      }
    }
  }

  // Check required regexp
  if (settings.filterRegexpEnabled && settings.requiredRegexp && profile.bio) {
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
 * Auto-reject profile if criteria met.
 *
 * Resolves `true` if the profile was swiped left, `false` otherwise. A
 * confirmation dialog stating the reason is shown first; it auto-confirms after
 * `settings.autoRejectCountdown` seconds (or waits indefinitely when that is 0).
 * Declining (or dismissing) the dialog keeps the profile and resolves `false`.
 */
export async function autoRejectProfile(
  settings: FirestarterSettings,
  profile: ProfileData,
  onReject?: (reason: RejectionReason) => void
): Promise<boolean> {
  if (!settings.autoSwipeLeft) {
    return false;
  }

  const rejectionReason = shouldReject(settings, profile);
  if (!rejectionReason) {
    return false;
  }

  const confirmed = await confirmRejection(
    describeRejectionReason(rejectionReason),
    settings.autoRejectCountdown
  );
  if (!confirmed) {
    console.log('Auto-rejection cancelled by user');
    return false;
  }

  if (onReject) {
    onReject(rejectionReason);
  }

  swipeLeft();
  return true;
}

/**
 * Human-readable, present-tense reason shown in the confirmation dialog
 * (distinct from formatRejectionReason, which is past-tense for notifications).
 */
export function describeRejectionReason(reason: RejectionReason): string {
  switch (reason.type) {
    case 'distance':
      return `This profile is ${reason.details} km away, beyond your distance limit.`;
    case 'height':
      return `This profile's height (${reason.details} cm) is above your limit.`;
    case 'interests':
      return `This profile has a blacklisted interest. Interests: ${arrayAsString([
        reason.details,
      ])}`;
    case 'lookingFor':
      return `This profile is looking for "${reason.details}", which you reject.`;
    case 'social':
      return `This profile's social handle looks like a VIP/promo account: ${arrayAsString(
        [reason.details]
      )}`;
    case 'regexp':
      return `This profile's bio did not match your required pattern.`;
    default:
      return `This profile matched a rejection rule (${reason.type}).`;
  }
}

/**
 * Format rejection reason for display
 */
export function formatRejectionReason(reason: RejectionReason): string {
  return `Swiped left due to ${reason.type}: ${arrayAsString([reason.details])}`;
}
