import { describe, it, expect, beforeEach, vi } from 'vitest';
import { expandProfile } from './index';

beforeEach(() => {
  document.body.innerHTML = '';
});

/**
 * Build a collapsed rec-card info bar: a [role="button"] wrapping an
 * [itemprop="name"], mirroring Tinder's bottom overlay (identified by semantic
 * attributes, not hashed classes). `name` lets tests see which bar was clicked.
 */
function infoBar(name: string): HTMLElement {
  const button = document.createElement('div');
  button.setAttribute('role', 'button');
  button.dataset.card = name;
  const nameEl = document.createElement('span');
  nameEl.setAttribute('itemprop', 'name');
  nameEl.textContent = name;
  button.appendChild(nameEl);
  document.body.appendChild(button);
  return button;
}

describe('expandProfile', () => {
  it('clicks the front card info bar and reports it expanded', () => {
    const back = infoBar('Back');
    const front = infoBar('Front');
    const backClick = vi.fn();
    const frontClick = vi.fn();
    back.addEventListener('click', backClick);
    front.addEventListener('click', frontClick);

    const expanded = expandProfile();

    // jsdom has no layout, so hit-testing degrades to the last bar in DOM order
    // — which is the front of Tinder's card stack.
    expect(expanded).toBe(true);
    expect(frontClick).toHaveBeenCalledTimes(1);
    expect(backClick).not.toHaveBeenCalled();
  });

  it('is a no-op returning false when no info bar is present (already expanded)', () => {
    // Expanded cards have no [itemprop="name"] info bar — only e.g. a heading.
    document.body.innerHTML = '<h1>Alex</h1><button>Report</button>';
    const onClick = vi.fn();
    document.querySelector('button')!.addEventListener('click', onClick);

    expect(expandProfile()).toBe(false);
    expect(onClick).not.toHaveBeenCalled();
  });
});
