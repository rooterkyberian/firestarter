/**
 * Profile Analyzer Feature
 * Extracts and analyzes profile information (bio, distance, height, interests)
 */

import { PATTERNS, SELECTORS } from '@shared/utils/selectors';
import { findElement, xpathResultsToArray } from '@shared/utils/dom';
import {
  resolve,
  recordOutcome,
  startReport,
  endReport,
  SELECTOR_NAMES,
  SelectorReport,
} from '@shared/selectors/registry';
import { knownInterests } from './knownInterests';
import { relationshipIntents } from './relationshipIntents';
import { ProfileData, SocialMedia } from '@shared/types/settings';

/**
 * Compute a lightweight fingerprint identifying the currently-shown card.
 * Used to avoid re-processing (and looping on) the same profile.
 *
 * Prefers the first photo URL, which is stable whether the card is collapsed
 * or expanded; falls back to an aria-label (usually "Name, age"). Returns null
 * when no card is found, in which case callers fall back to throttling.
 */
export function getProfileFingerprint(): string | null {
  const card = resolve('profileCard');
  if (!card) return null;

  const photo = resolve('cardPhoto', card) as HTMLElement | null;
  const bg = photo?.style.backgroundImage;
  if (bg && bg !== 'none') {
    const match = bg.match(/url\(["']?(.*?)["']?\)/);
    if (match?.[1]) return match[1];
  }

  const labelled = resolve('cardAriaLabel', card);
  const label = labelled?.getAttribute('aria-label');
  if (label) return label;

  return null;
}

/**
 * Get distance from profile. Searches the profile card first (bounding the
 * region), then falls back to the whole document body.
 */
export function getDistance(): number | null {
  const card = findElement(SELECTORS.profileCard);
  const sources = [card?.textContent, document.body.textContent];

  for (const source of sources) {
    if (!source) continue;
    const match = source.match(PATTERNS.distance);
    if (match) {
      recordOutcome('distanceText', true);
      return Number(match[1]);
    }
  }

  recordOutcome('distanceText', false);
  return null;
}

const knownInterestSet = new Set(knownInterests);

/** A leaf text that is a structured field (not free-form bio prose). */
function isNonBioText(text: string): boolean {
  const t = text.toLowerCase();
  if (relationshipIntents.some((i) => t === i.toLowerCase())) return true; // "Looking for"
  if (knownInterestSet.has(text)) return true; // a passion chip
  if (PATTERNS.distance.test(text)) return true; // "12 km away"
  if (HEIGHT_CM.test(text) || HEIGHT_M.test(text)) return true; // "178 cm"
  if (/^.{1,40},\s*\d{1,3}$/.test(text)) return true; // "Name, age" header
  return false;
}

/**
 * Find the bio by structure rather than by class name (Tinder rehashes classes
 * every build). Tinder lays every *structured* field out as list chips
 * (`<ul>`/`<li>`), passion pills, the relationship-intent label, or a heading —
 * so the bio is the one free-prose text leaf left over. We take the longest such
 * leaf inside the card that isn't itself a structured field.
 */
function findBioByStructure(card: ParentNode): string | null {
  let best: string | null = null;
  for (const el of Array.from(card.querySelectorAll('div, span, p'))) {
    if (el.children.length > 0) continue; // text leaves only
    if (el.closest('ul, li, h1, h2, h3, h4, button, a, [role="button"]')) {
      continue; // part of a structured field / heading / control
    }
    const text = (el.textContent || '').replace(/\s+/g, ' ').trim();
    if (text.length < 2 || isNonBioText(text)) continue;
    if (!best || text.length > best.length) best = text;
  }
  return best;
}

/**
 * Get bio text from profile.
 *
 * Structure-first (class-free); falls back to the legacy named `bioSection`
 * selector for older/simple layouts and the jsdom fixtures.
 */
export function getBio(): string | null {
  const card = resolve('profileCard');

  const structural = card ? findBioByStructure(card) : null;
  if (structural) {
    recordOutcome('bioSection', true, 'structure');
    return structural;
  }

  const bioDiv = resolve('bioSection') as HTMLElement | null;
  if (!bioDiv) return null;
  // innerText is preferred (respects rendering) but is undefined outside a real
  // browser; fall back to textContent so this works under jsdom too.
  return bioDiv.innerText || bioDiv.textContent || null;
}

/** Height value chips, e.g. "178 cm" or "1.78 m" (whole-text match). */
const HEIGHT_CM = /^(\d{3})\s?cm$/i;
const HEIGHT_M = /^([12])[.,](\d{2})\s?m$/i;

/**
 * Find a structured height chip: a leaf node whose entire text is a height value
 * (Tinder shows height as an essentials chip, not in the bio). Class-free —
 * keyed on the value's shape + a plausible human range, not on markup.
 */
function findHeightChip(card: ParentNode): number | null {
  for (const el of Array.from(card.querySelectorAll('li, span, div'))) {
    if (el.children.length > 0) continue; // value leaf only
    const text = (el.textContent || '').replace(/\s+/g, ' ').trim();
    let cm: number | null = null;
    const mCm = text.match(HEIGHT_CM);
    const mM = text.match(HEIGHT_M);
    if (mCm) cm = Number(mCm[1]);
    else if (mM) cm = Math.round(Number(`${mM[1]}.${mM[2]}`) * 100);
    if (cm !== null && cm > 140 && cm < 230) return cm;
  }
  return null;
}

/**
 * Get height: prefer the structured essentials chip, fall back to a height
 * mentioned in the bio prose (older profiles / fixtures).
 */
export function getHeight(): number | null {
  const card = (resolve('profileCard') ?? document.body) as ParentNode;

  const fromChip = findHeightChip(card);
  if (fromChip !== null) {
    recordOutcome('heightValue', true, 'chip');
    return fromChip;
  }

  const bio = getBio();
  const fromBio = bio ? bioExtractHeight(bio) : null;
  recordOutcome('heightValue', fromBio !== null, fromBio !== null ? 'bio' : undefined);
  return fromBio;
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
  // A delimiter that won't occur in interest labels or profile text. NOT
  // U+FFFF: although unique, it's a Unicode *noncharacter*, and Chrome refuses
  // to load a content script containing one ("isn't UTF-8 encoded"). A C0
  // control char is just as absent from real text but encodes cleanly.
  const separator = '\u0001';
  const concatedList = knownInterests.join(separator) + separator;

  const profileCard = resolve('profileCard');
  if (!profileCard) {
    recordOutcome('interestsContainer', false);
    return new Set();
  }

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

  if (!interestsParentNode) {
    recordOutcome('interestsContainer', false);
    return new Set();
  }

  recordOutcome('interestsContainer', true);

  const interests = new Set(
    xpathResultsToArray(
      // Explicit result type: browsers default to ANY_TYPE, but jsdom requires
      // it. ORDERED_NODE_ITERATOR_TYPE works with iterateNext in both.
      document.evaluate(
        './/text()',
        interestsParentNode,
        null,
        XPathResult.ORDERED_NODE_ITERATOR_TYPE,
        null
      )
    ).map((textNode) => textNode.textContent || '')
  );

  return interests;
}

/**
 * Get the "Looking for" relationship intent (e.g. "Long-term partner").
 *
 * Matched by text against the known label enum rather than a DOM selector —
 * Tinder rehashes its class names every build, but the labels themselves are
 * stable. Scoped to the profile card when resolvable, else the whole document so
 * the collapsed card's intent pill is still read. Longest label first so
 * "Long-term, open to short" wins over a "Long-term" substring.
 */
export function getLookingFor(): string | null {
  const scope = (resolve('profileCard') ?? document.body) as HTMLElement;
  const haystack = (scope.innerText || scope.textContent || '')
    .toLowerCase()
    .replace(/\s+/g, ' ');

  const byLength = [...relationshipIntents].sort((a, b) => b.length - a.length);
  for (const intent of byLength) {
    if (haystack.includes(intent.toLowerCase())) {
      recordOutcome('lookingForText', true, intent);
      return intent;
    }
  }

  recordOutcome('lookingForText', false);
  return null;
}

/**
 * Get report button element
 */
export function getReportButton(): HTMLButtonElement | null {
  return resolve('reportButton') as HTMLButtonElement | null;
}

/**
 * Analyze complete profile and return all data
 */
export function analyzeProfile(): ProfileData {
  const bio = getBio();
  const distance = getDistance();
  const interests = getInterests();
  const lookingFor = getLookingFor();
  const height = getHeight();

  let socialMedia: SocialMedia = {};
  if (bio) {
    socialMedia = bioGetSocial(bio);
  }

  return {
    distance,
    bio,
    height,
    interests,
    socialMedia,
    lookingFor,
  };
}

/**
 * Analyze the profile while recording which named selectors resolved.
 *
 * Runs the normal analysis (which records bioSection, profileCard,
 * interestsContainer, distanceText, lookingForText, heightValue) and
 * additionally probes the remaining locators (fingerprint photo/aria-label,
 * report/back/rewind buttons, image bullets) so the report covers every
 * selector the extension depends on.
 */
export function analyzeProfileWithReport(): {
  data: ProfileData;
  report: SelectorReport;
} {
  startReport();
  const data = analyzeProfile();

  // Probe locators not exercised by analyzeProfile so the report is complete.
  getProfileFingerprint(); // records profileCard, cardPhoto, cardAriaLabel
  for (const name of SELECTOR_NAMES) {
    resolve(name); // de-duped; fills in reportButton/backLink/rewindButton/imageBullets
  }

  return { data, report: endReport() };
}
