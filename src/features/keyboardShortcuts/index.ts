/**
 * Keyboard Shortcuts Feature
 * Provides keyboard navigation and controls for Tinder
 */

import { press, findByXPath } from '@shared/utils/dom';
import { SELECTORS } from '@shared/utils/selectors';

/**
 * Expand profile view
 */
export function expandProfile(): void {
  press({
    keyCode: 38,
    key: 'ArrowUp',
    code: 'ArrowUp',
  });

  const recCards = document.getElementsByClassName('recCard');
  if (recCards && recCards.length > 0) {
    (recCards[0] as HTMLElement).click();
  }
}

/**
 * Revert last choice (undo swipe)
 */
export function revertChoice(): void {
  // Find and click "Back" button
  const backButton = findByXPath("//a[contains(., 'Back')]");
  if (backButton) {
    backButton.click();

    // After closing profile, click Rewind button
    setTimeout(() => {
      const rewindButton = findByXPath("//button[contains(., 'Rewind')]");
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
  const profileCard = document.querySelector('.profileCard__card');
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
