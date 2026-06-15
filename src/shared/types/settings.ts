export interface FirestarterSettings {
  activated: boolean;
  autoSwipeLeft: boolean;
  /**
   * Seconds the auto-reject confirmation dialog counts down before swiping left
   * on its own. The dialog (stating the reason) is always shown first; with a
   * positive value it auto-confirms after that many seconds unless dismissed,
   * and `0` disables the countdown so it waits indefinitely for a manual choice.
   */
  autoRejectCountdown: number;
  distanceLimit: number;
  heightLimit: number;
  interestsBlacklist: string[];
  /**
   * "Looking for" relationship intents to auto-reject, matched verbatim against
   * the labels in `relationshipIntents` (e.g. "Short-term fun").
   */
  lookingForBlacklist: string[];
  requiredRegexp: string;
  /**
   * Per-filter master switches. When a filter is disabled its rule is skipped
   * entirely in `shouldReject`, regardless of its configured value. Each
   * corresponds to a `RejectionReason['type']`.
   */
  filterDistanceEnabled: boolean;
  filterHeightEnabled: boolean;
  filterInterestsEnabled: boolean;
  filterLookingForEnabled: boolean;
  filterSocialEnabled: boolean;
  filterRegexpEnabled: boolean;
}

export const DEFAULT_SETTINGS: FirestarterSettings = {
  activated: true,
  autoSwipeLeft: false,
  autoRejectCountdown: 3,
  distanceLimit: 60,
  heightLimit: 175,
  interestsBlacklist: ['Astrology'],
  lookingForBlacklist: [],
  requiredRegexp: '',
  filterDistanceEnabled: true,
  filterHeightEnabled: true,
  filterInterestsEnabled: true,
  filterLookingForEnabled: true,
  filterSocialEnabled: true,
  filterRegexpEnabled: true,
};

export interface ProfileData {
  distance: number | null;
  bio: string | null;
  height: number | null;
  interests: Set<string>;
  socialMedia: SocialMedia;
  /** Relationship intent, e.g. "Long-term partner" (Tinder's "Looking for"). */
  lookingFor: string | null;
}

export interface SocialMedia {
  instagram?: string;
  snapchat?: string;
  facebook?: string;
}
