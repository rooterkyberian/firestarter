/**
 * Centralized DOM selectors with fallback strategies.
 * Makes the extension more resilient to Tinder UI changes.
 *
 * Only valid CSS selectors belong here. Text-based lookups (Report / Back /
 * Rewind buttons, image bullets) are handled by XPath/text matching instead —
 * see `findByXPath` in `dom.ts`, `getReportButton` in the profileAnalyzer, and
 * the keyboard-shortcut helpers. CSS has no `:has-text()` pseudo-class.
 */

export const SELECTORS: Record<string, string[]> = {
  profileCard: [
    '.profileCard__card',
    '[class*="profileCard"]',
    '.recCard',
    '[data-testid="profile-card"]',
  ],
  bioSection: [
    'hr:first-of-type + div',
    '[class*="bio"]',
    '[data-testid="bio"]',
  ],
};

/**
 * Regular expressions for bio / card parsing.
 */
export const PATTERNS = {
  // Tolerates "12 km away" and "12 kilometers away" (locale/format variations).
  distance: /(\d+)\s*(?:km|kilomet(?:er|re)s?)\s+away/i,
  heightCm: /\b(\d{3}|\d\.\d\d)(cm)?\b/g,
} as const;
