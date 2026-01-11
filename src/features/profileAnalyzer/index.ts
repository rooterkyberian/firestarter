/**
 * Profile Analyzer Feature
 * Extracts and analyzes profile information (bio, distance, height, interests)
 */

import { PATTERNS, SELECTORS } from '@shared/utils/selectors';
import { findElement, xpathResultsToArray } from '@shared/utils/dom';
import { knownInterests } from './knownInterests';
import { ProfileData, SocialMedia } from '@shared/types/settings';

/**
 * Get distance from profile
 */
export function getDistance(): number | null {
  const match = document.body.innerHTML.match(PATTERNS.distance);
  if (!match) {
    return null;
  }
  return Number(match[1]);
}

/**
 * Get bio text from profile
 */
export function getBio(): string | null {
  const bioDiv = findElement(SELECTORS.bioSection) as HTMLElement;
  if (!bioDiv) return null;
  return bioDiv.innerText;
}

/**
 * Extract height from bio text
 */
export function bioExtractHeight(bio: string): number | null {
  const low = 140;
  const high = 195;

  const nums = Array.from(bio.matchAll(PATTERNS.heightCm))
    .map((m) => Number(m[1]))
    .map((n) => (n < 3 ? n * 100 : n))
    .filter((h) => h < high && h > low);

  if (nums.length > 0 && nums[0] !== undefined) {
    return nums[0];
  }
  return null;
}

/**
 * Extract social media handles from bio
 */
export function bioGetSocial(bio: string): SocialMedia {
  const social = {
    instagram: ['ig', 'instagram', 'inst', 'insta', 'instagram.com', '📸'],
    snapchat: ['snapchat', 's/c', 'snap', '👻', 's/c👻'],
    facebook: ['fb', 'facebook', 'facebook.com'],
  };

  const revertSocialMap: Record<string, string> = {};
  for (const [socialNetworkName, aliases] of Object.entries(social)) {
    aliases.forEach((alias) => {
      revertSocialMap[alias] = socialNetworkName;
    });
  }

  const allSocialNames = Object.values(social).flat();
  const re = RegExp(
    `\\b(${allSocialNames.join('|')})[:\\s@/]*([a-z\\d_-]{4,})(\\b|👻)`,
    'gi'
  );

  const foundSocialArr = Array.from(bio.matchAll(re)).map((m) => [
    revertSocialMap[m[1]!.toLowerCase()],
    m[2],
  ]);

  return Object.fromEntries(foundSocialArr.reverse()) as SocialMedia;
}

/**
 * Get interests from profile
 */
export function getInterests(): Set<string> {
  const separator = '\uFFFF';
  const concatedList = knownInterests.join(separator) + separator;

  const profileCard = findElement(SELECTORS.profileCard);
  if (!profileCard) return new Set();

  const xpath = `.//*[text() and contains("${concatedList}", concat(text(), "${separator}"))]/..`;
  const xpathResult = document.evaluate(
    xpath,
    profileCard,
    null,
    XPathResult.ORDERED_NODE_SNAPSHOT_TYPE
  );

  const interestsParentNode = xpathResult.snapshotItem(
    xpathResult.snapshotLength - 1
  );

  if (!interestsParentNode) return new Set();

  const interests = new Set(
    xpathResultsToArray(
      document.evaluate('.//text()', interestsParentNode)
    ).map((textNode) => textNode.textContent || '')
  );

  return interests;
}

/**
 * Get report button element
 */
export function getReportButton(): HTMLButtonElement | null {
  const reportBtns = Array.from(document.querySelectorAll('button')).filter(
    (btn) => btn.innerText.startsWith('REPORT ')
  );
  return reportBtns.length > 0 && reportBtns[0] ? reportBtns[0] : null;
}

/**
 * Analyze complete profile and return all data
 */
export function analyzeProfile(): ProfileData {
  const bio = getBio();
  const distance = getDistance();
  const interests = getInterests();

  let height: number | null = null;
  let socialMedia: SocialMedia = {};

  if (bio) {
    height = bioExtractHeight(bio);
    socialMedia = bioGetSocial(bio);
  }

  return {
    distance,
    bio,
    height,
    interests,
    socialMedia,
  };
}
