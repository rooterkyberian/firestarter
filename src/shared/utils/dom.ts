/**
 * DOM utility functions
 */

/**
 * Add global CSS styles to the page
 */
export function addGlobalStyle(css: string): void {
  const head = document.getElementsByTagName('head')[0];
  if (!head) {
    return;
  }
  const style = document.createElement('style');
  style.type = 'text/css';
  style.innerHTML = css;
  head.appendChild(style);
}

/**
 * Simulate a keyboard event (keydown + keyup).
 *
 * Dispatched on <body> by default so it bubbles to document/window where
 * Tinder's global key handlers live. Two non-obvious details matter for those
 * handlers to actually fire:
 *  - `code` must be forwarded (the old version dropped it); some handlers key off
 *    `event.code` rather than `event.key`.
 *  - The `KeyboardEvent` constructor silently ignores `keyCode`/`which`, leaving
 *    them 0. Legacy handlers (Tinder's arrow-key navigation among them) still
 *    read `keyCode`, so we define it on the instance after construction.
 */
export function press(
  { keyCode, key, code }: Partial<KeyboardEvent>,
  evtTarget: HTMLElement | null = null
): void {
  if (!evtTarget) {
    evtTarget = document.getElementsByTagName('body')[0] as HTMLElement;
  }

  const build = (type: 'keydown' | 'keyup'): KeyboardEvent => {
    const event = new KeyboardEvent(type, {
      key,
      code,
      bubbles: true,
      cancelable: true,
      composed: true,
    });
    if (keyCode != null) {
      Object.defineProperty(event, 'keyCode', {
        configurable: true,
        get: () => keyCode,
      });
      Object.defineProperty(event, 'which', {
        configurable: true,
        get: () => keyCode,
      });
    }
    return event;
  };

  evtTarget.dispatchEvent(build('keydown'));
  evtTarget.dispatchEvent(build('keyup'));
}

/**
 * Get or create a child node with specific ID
 */
export function getOrAddChildNode(
  parent: HTMLElement,
  id: string,
  tag: string = 'div'
): HTMLElement {
  let node = document.getElementById(id);
  if (!node) {
    node = document.createElement(tag);
    node.id = id;
    parent.appendChild(node);
  }
  return node;
}

/**
 * Create an anchor link element
 */
export function createLink(text: string, href: string): HTMLAnchorElement {
  const a = document.createElement('a');
  const linkText = document.createTextNode(text);
  a.appendChild(linkText);
  a.href = href;
  a.target = '_blank';
  return a;
}

/**
 * Convert XPath results to array
 */
export function xpathResultsToArray(xpathResult: XPathResult): Node[] {
  const nodes: Node[] = [];
  let node: Node | null;
  while ((node = xpathResult.iterateNext())) {
    nodes.push(node);
  }
  return nodes;
}

/**
 * Try a list of fallback selectors and return both the matched element and the
 * selector that matched (useful for instrumentation). Stays quiet on the common
 * "no match yet" case (Tinder's DOM mutates constantly); only an actually
 * invalid selector earns a one-time warning.
 */
const warnedSelectors = new Set<string>();

export function queryFirst(
  selectors: string[],
  root: ParentNode = document
): { element: Element; selector: string } | null {
  for (const selector of selectors) {
    try {
      const element = root.querySelector(selector);
      if (element) return { element, selector };
    } catch {
      if (!warnedSelectors.has(selector)) {
        warnedSelectors.add(selector);
        console.warn(`Firestarter: invalid selector skipped: ${selector}`);
      }
    }
  }
  return null;
}

/**
 * Find element with fallback selectors. Returns the first match, or null.
 */
export function findElement(
  selectors: string[],
  root: ParentNode = document
): Element | null {
  return queryFirst(selectors, root)?.element ?? null;
}

/**
 * Find element using XPath
 */
export function findByXPath(
  xpath: string,
  context: Node = document
): HTMLElement | null {
  const result = document.evaluate(
    xpath,
    context,
    null,
    XPathResult.FIRST_ORDERED_NODE_TYPE,
    null
  );
  return result.singleNodeValue as HTMLElement | null;
}
