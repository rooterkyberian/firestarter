/**
 * Anonymize a captured DOM subtree via token-preserving synthesis.
 *
 * Goal: remove real PII (photo URLs, names, ages, bio prose, social handles)
 * while keeping the structure AND the *shape* of the tokens the extractors parse
 * — so a captured card can be dropped into __fixtures__/ and still exercise
 * distance/height/social/interests extraction without exposing a real person.
 *
 * Strategy:
 *  - Attributes: blank label/alt/title, placeholder any URL-bearing attribute,
 *    rewrite `background-image: url(...)` to a placeholder (keeping the property
 *    so the `[style*="background-image"]` selector still matches).
 *  - Text nodes: replaced with deterministic output. UI-chrome labels (known
 *    interests, image bullets, REPORT/Back/Rewind) are preserved so text/XPath
 *    locators still resolve; nodes containing extractor tokens are rewritten to
 *    synthetic equivalents; everything else becomes "redacted".
 *  - Comments are dropped.
 */

import { PATTERNS } from '@shared/utils/selectors';
import { bioExtractHeight, bioGetSocial } from '@features/profileAnalyzer';
import { knownInterests } from '@features/profileAnalyzer/knownInterests';

const PLACEHOLDER_URL = 'https://example.invalid/asset';
const PLACEHOLDER_PHOTO = 'https://example.invalid/photo.jpg';

const URL_ATTRS = new Set(['src', 'srcset', 'href', 'poster']);
const BLANK_ATTRS = new Set(['aria-label', 'alt', 'title']);
const URL_VALUE = /^(https?:|data:|blob:)/i;

/** Canonical alias per network, so `bioGetSocial` re-extracts the synthetic handle. */
const SOCIAL_ALIAS: Record<string, string> = {
  instagram: 'ig',
  snapchat: 'snap',
  facebook: 'fb',
};

const knownInterestSet = new Set(knownInterests);

/**
 * Turn a single text node's content into a PII-free synthetic equivalent.
 */
export function synthesizeText(raw: string): string {
  const trimmed = raw.trim();
  if (trimmed === '') return raw; // whitespace: keep structure intact

  // UI chrome / non-PII labels preserved verbatim so locators still resolve.
  if (knownInterestSet.has(trimmed)) return raw;
  if (/^\d+\s*\/\s*\d+$/.test(trimmed)) return raw; // image bullet "1/5"
  if (/^report\b/i.test(trimmed)) return 'REPORT Someone'; // keep prefix, drop name
  if (/^(back|rewind|show more|send compliment)$/i.test(trimmed)) return raw;

  // Synthesize from the token types present, dropping the original characters.
  const parts: string[] = [];
  if (PATTERNS.distance.test(raw)) parts.push('12 km away');
  if (bioExtractHeight(raw) !== null) parts.push('180cm');
  for (const network of Object.keys(bioGetSocial(raw))) {
    const alias = SOCIAL_ALIAS[network] ?? 'ig';
    parts.push(`${alias}: example_handle`);
  }

  return parts.length > 0 ? parts.join(' ') : 'redacted';
}

function anonymizeElement(el: Element): void {
  for (const attr of Array.from(el.attributes)) {
    const name = attr.name.toLowerCase();
    if (name === 'style') {
      el.setAttribute(
        attr.name,
        attr.value.replace(
          /url\((['"]?)(.*?)\1\)/gi,
          `url("${PLACEHOLDER_PHOTO}")`
        )
      );
    } else if (BLANK_ATTRS.has(name)) {
      el.setAttribute(attr.name, '');
    } else if (URL_ATTRS.has(name) || URL_VALUE.test(attr.value)) {
      el.setAttribute(attr.name, PLACEHOLDER_URL);
    }
  }

  for (const child of Array.from(el.childNodes)) {
    if (child.nodeType === Node.TEXT_NODE) {
      child.textContent = synthesizeText(child.textContent || '');
    } else if (child.nodeType === Node.ELEMENT_NODE) {
      anonymizeElement(child as Element);
    } else if (child.nodeType === Node.COMMENT_NODE) {
      child.remove();
    }
  }
}

/**
 * Return an anonymized HTML string for the given element (the live DOM is never
 * mutated — we clone first).
 */
export function anonymize(root: Element): string {
  const clone = root.cloneNode(true) as Element;
  anonymizeElement(clone);
  return clone.outerHTML;
}
