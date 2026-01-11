/**
 * Centralized DOM selectors with fallback strategies
 * Makes the extension more resilient to Tinder UI changes
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
  recsPage: ['div.recsPage', '[data-testid="recs-page"]', 'main'],
  recCard: ['.recCard', '[class*="recCard"]', '[data-testid="rec-card"]'],
  reportButton: ['button[aria-label*="Report"]', 'button:has-text("REPORT")'],
  backButton: [
    'button[aria-label="Back"]',
    'button:has-text("Back")',
    'a:has-text("Back")',
  ],
  rewindButton: ['button[aria-label="Rewind"]', 'button:has-text("Rewind")'],
  imageButtons: ['button[aria-label*="of"]', 'button.bullet'],
};

/**
 * Regular expressions for bio parsing
 */
export const PATTERNS = {
  distance: /(\d+) kilometers away/,
  heightCm: /\b(\d{3}|\d\.\d\d)(cm)?\b/g,
  socialMedia:
    /\b(ig|instagram|inst|insta|instagram\.com|📸|snapchat|s\/c|snap|👻|s\/c👻|fb|facebook|facebook\.com)[:\s@/]*([a-z\d_-]{4,})(\b|👻)/gi,
  vipIndicator: /vip/i,
} as const;
