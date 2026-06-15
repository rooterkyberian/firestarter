/**
 * In-page "title" popup for the card recorder.
 *
 * Rendered as a self-contained overlay injected into the page (rather than a
 * native `prompt()`, which is unstyleable and blocked in some contexts). The
 * caller awaits a single answer: the typed title, or `null` if the user
 * cancelled (Cancel button, Escape, or backdrop click).
 *
 * Styles are set inline so Tinder's stylesheet can't bleed in, and keydown
 * events are stopped at the overlay so typing a title never triggers the page's
 * or Firestarter's keyboard shortcuts.
 */

const OVERLAY_ID = 'firestarter-title-prompt';

/**
 * Show the popup and resolve with the entered title (trimmed, may be empty if
 * the user saves without typing) or `null` if cancelled. If a popup is already
 * open, the existing one is focused and the call resolves to `null`.
 */
export function promptForCaptureTitle(): Promise<string | null> {
  return new Promise((resolve) => {
    const existing = document.getElementById(OVERLAY_ID);
    if (existing) {
      existing.querySelector('input')?.focus();
      resolve(null);
      return;
    }

    const overlay = document.createElement('div');
    overlay.id = OVERLAY_ID;
    overlay.style.cssText = [
      'position:fixed',
      'inset:0',
      'z-index:2147483647',
      'display:flex',
      'align-items:center',
      'justify-content:center',
      'background:rgba(0,0,0,0.5)',
      'font-family:system-ui,-apple-system,sans-serif',
    ].join(';');

    const dialog = document.createElement('div');
    dialog.style.cssText = [
      'background:#fff',
      'color:#111',
      'min-width:320px',
      'max-width:90vw',
      'padding:20px',
      'border-radius:12px',
      'box-shadow:0 10px 40px rgba(0,0,0,0.3)',
      'box-sizing:border-box',
    ].join(';');

    const label = document.createElement('label');
    label.textContent = 'Title for this capture';
    label.style.cssText =
      'display:block;font-size:14px;font-weight:600;margin-bottom:8px';

    const input = document.createElement('input');
    input.type = 'text';
    input.placeholder = 'e.g. bio with Instagram handle';
    input.style.cssText = [
      'width:100%',
      'box-sizing:border-box',
      'padding:8px 10px',
      'font-size:14px',
      'border:1px solid #ccc',
      'border-radius:8px',
      'margin-bottom:16px',
    ].join(';');

    const buttonRow = document.createElement('div');
    buttonRow.style.cssText =
      'display:flex;gap:8px;justify-content:flex-end';

    const cancelBtn = document.createElement('button');
    cancelBtn.type = 'button';
    cancelBtn.textContent = 'Cancel';
    cancelBtn.style.cssText = [
      'padding:8px 14px',
      'font-size:14px',
      'border:1px solid #ccc',
      'border-radius:8px',
      'background:#fff',
      'color:#111',
      'cursor:pointer',
    ].join(';');

    const saveBtn = document.createElement('button');
    saveBtn.type = 'button';
    saveBtn.textContent = 'Save';
    saveBtn.style.cssText = [
      'padding:8px 14px',
      'font-size:14px',
      'border:none',
      'border-radius:8px',
      'background:#fe3c72',
      'color:#fff',
      'cursor:pointer',
    ].join(';');

    let settled = false;
    function close(result: string | null): void {
      if (settled) return;
      settled = true;
      overlay.remove();
      resolve(result);
    }

    // Stop keystrokes from reaching the page / Firestarter shortcut listeners.
    overlay.addEventListener('keydown', (e) => {
      e.stopPropagation();
      if (e.key === 'Enter') {
        e.preventDefault();
        close(input.value.trim());
      } else if (e.key === 'Escape') {
        e.preventDefault();
        close(null);
      }
    });

    overlay.addEventListener('mousedown', (e) => {
      // Backdrop click (but not clicks inside the dialog) cancels.
      if (e.target === overlay) {
        close(null);
      }
    });

    saveBtn.addEventListener('click', () => close(input.value.trim()));
    cancelBtn.addEventListener('click', () => close(null));

    buttonRow.append(cancelBtn, saveBtn);
    dialog.append(label, input, buttonRow);
    overlay.append(dialog);
    document.body.append(overlay);

    input.focus();
  });
}
