export interface FirestarterSettings {
  activated: boolean;
  autoSwipeLeft: boolean;
  distanceLimit: number;
  heightLimit: number;
  interestsBlacklist: string[];
  requiredRegexp: string;
}

export const DEFAULT_SETTINGS: FirestarterSettings = {
  activated: true,
  autoSwipeLeft: false,
  distanceLimit: 60,
  heightLimit: 175,
  interestsBlacklist: ['Astrology'],
  requiredRegexp: '',
};

export interface ProfileData {
  distance: number | null;
  bio: string | null;
  height: number | null;
  interests: Set<string>;
  socialMedia: SocialMedia;
}

export interface SocialMedia {
  instagram?: string;
  snapchat?: string;
  facebook?: string;
}
