/**
 * Keyboard Shortcuts Feature
 * Provides keyboard navigation and controls for Tinder
 */

import { resolve } from '@shared/selectors/registry';

/**
 * Find the front card's info bar — the bottom overlay button showing name / age
 * / distance, which Tinder expands into the full profile when clicked.
 *
 * Identified by semantic attributes, NOT class names (Tinder rehashes classes
 * every build): a `[role="button"]`/`<button>` wrapping the schema.org
 * `[itemprop="name"]`. This marker is present ONLY on collapsed cards — once a
 * card is expanded the name is no longer a button — so "an info bar exists" is
 * also our class-free "is collapsed" signal.
 *
 * Tinder preloads the next card(s) too, so several info bars coexist; we
 * hit-test each to find the one actually on top (the front card). When
 * hit-testing can't help (e.g. a background tab with empty layout boxes) we fall
 * back to the last bar in DOM order, which is the front of Tinder's stack.
 */
function findFrontInfoButton(): HTMLElement | null {
  const candidates = Array.from(
    document.querySelectorAll<HTMLElement>('[role="button"], button')
  ).filter((el) => el.querySelector('[itemprop="name"]'));

  for (const el of candidates) {
    const rect = el.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) continue;
    const onTop = document.elementFromPoint(
      rect.left + rect.width / 2,
      rect.top + rect.height / 2
    );
    if (onTop && el.contains(onTop)) return el;
  }

  return candidates[candidates.length - 1] ?? null;
}

/**
 * Expand the current rec card to reveal the full bio and interests. Returns
 * true when it actually triggered an expansion (the card was collapsed), so
 * callers know to wait for the expand animation before reading the card.
 *
 * Clicks the front card's info bar — a real click React's onClick honors
 * deterministically. When no info bar exists the card is already expanded (or
 * absent): a no-op returning false, safe to call on every DOM mutation.
 *
 * (We deliberately don't also fire a synthetic ArrowUp here: it's the manual
 * expand key but may *toggle*, which would re-collapse the card we just opened.)
 */
export function expandProfile(): boolean {
  const infoButton = findFrontInfoButton();
  if (!infoButton) return false;

  infoButton.click();
  return true;
}

/**
 * Revert last choice (undo swipe)
 */
export function revertChoice(): void {
  // Find and click "Back" button
  const backButton = resolve('backLink') as HTMLElement | null;
  if (backButton) {
    backButton.click();

    // After closing profile, click Rewind button
    setTimeout(() => {
      const rewindButton = resolve('rewindButton') as HTMLElement | null;
      if (rewindButton) {
        rewindButton.click();
      }
    }, 50);
  }
}

/**
 * Navigate to next image in profile
 */
export function nextImage(): void {
  const profileCard = resolve('profileCard');
  if (!profileCard) return;

  let imgBtns = Array.from(profileCard.querySelectorAll('button')).filter(
    (imgBtn) => imgBtn.textContent?.match(/([\d]\/)+/)
  );

  if (imgBtns.length === 0) return;

  // Filter buttons from the same parent (exclude Instagram section buttons)
  const firstParent = imgBtns[0]?.parentElement;
  imgBtns = imgBtns.filter((imgBtn) => imgBtn.parentElement === firstParent);

  // Find active button and click next one
  let previousWasActive = false;
  for (const imgBtn of [...imgBtns, ...imgBtns]) {
    if (previousWasActive) {
      imgBtn.click();
      break;
    }
    previousWasActive = imgBtn.classList.contains('bullet--active');
  }
}

/**
 * Setup keyboard event listeners
 */
export function setupKeyboardShortcuts(onToggleActivation: () => void): void {
  // Note: card capture is NOT handled here. In-page keydowns are unreliable
  // (the page or the OS — e.g. Linux's Alt+Shift layout switch — can swallow
  // them), so capture uses a browser-level `commands` entry instead. See the
  // manifest's `commands` and the background worker.
  document.addEventListener('keydown', (e) => {
    switch (e.code) {
      case 'NumpadDecimal':
        // Reload page
        location.reload();
        break;

      case 'Numpad0':
        // Next image
        nextImage();
        break;

      case 'PageDown':
        // Revert last choice
        revertChoice();
        break;

      case 'Insert':
        // Toggle activation
        onToggleActivation();
        break;

      default:
        // Log for debugging
        console.log('keydown', e.code);
    }
  });
}
