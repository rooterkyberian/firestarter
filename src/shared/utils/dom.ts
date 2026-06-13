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
 * Simulate keyboard event
 */
export function press(
  { keyCode, charCode, key }: Partial<KeyboardEvent>,
  evtTarget: HTMLElement | null = null
): void {
  if (!evtTarget) {
    evtTarget = document.getElementsByTagName('body')[0] as HTMLElement;
  }

  const commonKeyEventData = {
    altKey: false,
    bubbles: true,
    cancelBubble: false,
    cancelable: true,
    charCode: 0,
    composed: true,
    ctrlKey: false,
    currentTarget: null,
    defaultPrevented: true,
    detail: 0,
    eventPhase: 0,
  };

  const evtData = { ...commonKeyEventData, keyCode, charCode, key };
  evtTarget.dispatchEvent(new KeyboardEvent('keydown', evtData));
  evtTarget.dispatchEvent(new KeyboardEvent('keyup', evtData));
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
 * Find element with fallback selectors.
 * Returns the first match, or null if none match. Stays quiet on the common
 * "no match yet" case (Tinder's DOM mutates constantly); only an actually
 * invalid selector earns a one-time warning.
 */
const warnedSelectors = new Set<string>();

export function findElement(selectors: string[]): Element | null {
  for (const selector of selectors) {
    try {
      const el = document.querySelector(selector);
      if (el) return el;
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
