import { describe, it, expect, beforeEach } from 'vitest';
import { promptForCaptureTitle } from './titlePrompt';

const OVERLAY_ID = 'firestarter-title-prompt';

function overlay(): HTMLElement | null {
  return document.getElementById(OVERLAY_ID);
}

function input(): HTMLInputElement {
  return overlay()!.querySelector('input')!;
}

function button(text: string): HTMLButtonElement {
  return Array.from(overlay()!.querySelectorAll('button')).find(
    (b) => b.textContent === text
  ) as HTMLButtonElement;
}

beforeEach(() => {
  document.body.innerHTML = '';
});

describe('promptForCaptureTitle', () => {
  it('resolves with the trimmed title when Save is clicked', async () => {
    const pending = promptForCaptureTitle();
    input().value = '  card with bio  ';
    button('Save').click();

    await expect(pending).resolves.toBe('card with bio');
    expect(overlay()).toBeNull();
  });

  it('resolves with null when Cancel is clicked', async () => {
    const pending = promptForCaptureTitle();
    button('Cancel').click();

    await expect(pending).resolves.toBeNull();
    expect(overlay()).toBeNull();
  });

  it('submits on Enter and cancels on Escape', async () => {
    const onEnter = promptForCaptureTitle();
    input().value = 'typed';
    input().dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Enter', bubbles: true })
    );
    await expect(onEnter).resolves.toBe('typed');

    const onEscape = promptForCaptureTitle();
    overlay()!.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Escape', bubbles: true })
    );
    await expect(onEscape).resolves.toBeNull();
  });

  it('keeps keystrokes from reaching the page while typing a title', () => {
    let reachedDocument = false;
    document.addEventListener('keydown', () => {
      reachedDocument = true;
    });

    promptForCaptureTitle();
    input().dispatchEvent(
      new KeyboardEvent('keydown', { key: 'a', bubbles: true })
    );

    expect(reachedDocument).toBe(false);
  });

  it('does not open a second overlay while one is already showing', async () => {
    const first = promptForCaptureTitle();
    const second = promptForCaptureTitle();

    await expect(second).resolves.toBeNull();
    expect(document.querySelectorAll(`#${OVERLAY_ID}`)).toHaveLength(1);

    button('Cancel').click();
    await first;
  });
});
