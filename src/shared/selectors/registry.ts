/**
 * Named selector registry with pass/fail instrumentation.
 *
 * Every brittle DOM lookup the extension relies on is given a stable NAME and a
 * typed strategy. Resolving by name (instead of inlining selectors at the call
 * site) lets us record which named lookups succeeded and which failed during a
 * single analyze pass — the data the in-app recorder exports and the fixture
 * tests assert against.
 *
 * The collector is dormant by default (zero overhead); only `analyzeProfileWithReport`
 * (or a test) turns it on, so normal content-script runs pay nothing.
 */

import { SELECTORS } from '@shared/utils/selectors';
import { queryFirst, findByXPath } from '@shared/utils/dom';

type Strategy =
  | { kind: 'css'; selectors: string[] }
  | { kind: 'xpath'; expression: string }
  | { kind: 'text'; tag: string; startsWith?: string; contains?: string };

/**
 * Element-locating selectors. Text/regex EXTRACTORS (distance, height, social,
 * interests-container) self-report via `recordOutcome` from their own functions,
 * since their logic doesn't fit a single querySelector/XPath strategy.
 */
const STRATEGIES = {
  profileCard: { kind: 'css', selectors: SELECTORS.profileCard },
  bioSection: { kind: 'css', selectors: SELECTORS.bioSection },
  cardPhoto: { kind: 'css', selectors: ['[style*="background-image"]'] },
  cardAriaLabel: { kind: 'css', selectors: ['[aria-label]'] },
  reportButton: { kind: 'text', tag: 'button', startsWith: 'REPORT ' },
  backLink: { kind: 'xpath', expression: "//a[contains(., 'Back')]" },
  rewindButton: {
    kind: 'xpath',
    expression: "//button[contains(., 'Rewind')]",
  },
  imageBullets: {
    kind: 'css',
    selectors: ['button.bullet', '[class*="bullet"]'],
  },
} satisfies Record<string, Strategy>;

export type ResolverName = keyof typeof STRATEGIES;

/** Names that report through `recordOutcome` rather than a generic strategy. */
export type CustomName =
  | 'interestsContainer'
  | 'distanceText'
  | 'lookingForText'
  | 'heightValue';

export interface SelectorOutcome {
  name: string;
  ok: boolean;
  /** Which concrete selector/strategy matched (for css, the selector string). */
  matchedBy?: string;
}

export interface SelectorReport {
  outcomes: SelectorOutcome[];
  /** Names that did not resolve — the actionable "what broke" list. */
  failed: string[];
}

let collector: Map<string, SelectorOutcome> | null = null;

/** Begin collecting selector outcomes. Pairs with `endReport`. */
export function startReport(): void {
  collector = new Map();
}

/** Stop collecting and return the de-duplicated report. */
export function endReport(): SelectorReport {
  const outcomes = collector ? Array.from(collector.values()) : [];
  collector = null;
  return {
    outcomes,
    failed: outcomes.filter((o) => !o.ok).map((o) => o.name),
  };
}

/**
 * Record an outcome for a named lookup. No-op unless a report is active.
 * De-dupes by name within a pass, preferring a success over a prior failure.
 */
export function recordOutcome(
  name: ResolverName | CustomName,
  ok: boolean,
  matchedBy?: string
): void {
  if (!collector) return;
  const existing = collector.get(name);
  if (!existing || (ok && !existing.ok)) {
    collector.set(name, { name, ok, ...(matchedBy ? { matchedBy } : {}) });
  }
}

function resolveStrategy(
  strategy: Strategy,
  root: ParentNode
): { element: Element; matchedBy: string } | null {
  switch (strategy.kind) {
    case 'css': {
      const hit = queryFirst(strategy.selectors, root);
      return hit ? { element: hit.element, matchedBy: hit.selector } : null;
    }
    case 'xpath': {
      const el = findByXPath(
        strategy.expression,
        root instanceof Node ? root : document
      );
      return el ? { element: el, matchedBy: strategy.expression } : null;
    }
    case 'text': {
      const els = Array.from(root.querySelectorAll(strategy.tag));
      const match = els.find((el) => {
        const text = (el as HTMLElement).innerText || el.textContent || '';
        if (strategy.startsWith && !text.startsWith(strategy.startsWith)) {
          return false;
        }
        if (strategy.contains && !text.includes(strategy.contains)) {
          return false;
        }
        return true;
      });
      return match
        ? {
            element: match,
            matchedBy: `${strategy.tag}:${strategy.startsWith ?? strategy.contains ?? '*'}`,
          }
        : null;
    }
  }
}

/**
 * Resolve a named selector, recording its outcome. Returns the element or null.
 * Pass a `root` to scope the lookup to a sub-tree (e.g. within the profile card).
 */
export function resolve(
  name: ResolverName,
  root: ParentNode = document
): Element | null {
  const hit = resolveStrategy(STRATEGIES[name], root);
  recordOutcome(name, hit !== null, hit?.matchedBy);
  return hit?.element ?? null;
}

/** All known selector names, for completeness probing / docs. */
export const SELECTOR_NAMES = Object.keys(STRATEGIES) as ResolverName[];
