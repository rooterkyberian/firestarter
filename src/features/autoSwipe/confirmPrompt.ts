/**
 * In-page confirmation popup shown before an auto-rejection swipe.
 *
 * Modelled on the recorder's title prompt: a self-contained overlay with inline
 * styles (so Tinder's stylesheet can't bleed in) and keydown events stopped at
 * the overlay (so the page's / Firestarter's keyboard shortcuts don't fire while
 * it's open). The caller awaits a single boolean: `true` to proceed with the
 * swipe, `false` to keep the profile (Cancel button, Escape, or backdrop click).
 *
 * When `countdownSeconds > 0` the dialog auto-confirms (resolves `true`) after
 * that many seconds unless the user acts first; `0` waits indefinitely. Always
 * shown before an auto-reject — see `autoRejectProfile`.
 */

const OVERLAY_ID = 'firestarter-reject-confirm';

/**
 * Show the confirmation popup with the given human-readable reason and resolve
 * with `true` to reject or `false` to keep. If a popup is already open, the call
 * resolves to `false` (don't reject) so concurrent cards can't stack dialogs.
 *
 * `countdownSeconds`: a positive value auto-confirms after that many seconds
 * (the remaining time is shown on the Reject button); `0` disables the countdown
 * and waits indefinitely for a manual choice.
 */
export function confirmRejection(
  reason: string,
  countdownSeconds: number
): Promise<boolean> {
  return new Promise((resolve) => {
    if (document.getElementById(OVERLAY_ID)) {
      resolve(false);
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

    const title = document.createElement('div');
    title.textContent = 'Auto-reject this profile?';
    title.style.cssText =
      'font-size:16px;font-weight:600;margin-bottom:8px';

    // textContent (not innerHTML): the reason can include profile-derived text.
    const body = document.createElement('p');
    body.textContent = reason;
    body.style.cssText =
      'font-size:14px;color:#444;margin:0 0 16px;line-height:1.4';

    const buttonRow = document.createElement('div');
    buttonRow.style.cssText = 'display:flex;gap:8px;justify-content:flex-end';

    const cancelBtn = document.createElement('button');
    cancelBtn.type = 'button';
    cancelBtn.textContent = 'Keep';
    cancelBtn.style.cssText = [
      'padding:8px 14px',
      'font-size:14px',
      'border:1px solid #ccc',
      'border-radius:8px',
      'background:#fff',
      'color:#111',
      'cursor:pointer',
    ].join(';');

    const rejectBtn = document.createElement('button');
    rejectBtn.type = 'button';
    rejectBtn.style.cssText = [
      'padding:8px 14px',
      'font-size:14px',
      'border:none',
      'border-radius:8px',
      'background:#fe3c72',
      'color:#fff',
      'cursor:pointer',
    ].join(';');

    // Countdown state: with a positive countdown the Reject button shows the
    // remaining seconds and the dialog auto-confirms when it reaches zero; with
    // 0 there is no timer and the dialog waits indefinitely.
    let remaining = Math.floor(countdownSeconds);
    let timer: ReturnType<typeof setInterval> | null = null;
    const renderRejectLabel = (): void => {
      rejectBtn.textContent =
        remaining > 0 ? `Reject (R) — ${remaining}s` : 'Reject (R)';
    };
    renderRejectLabel();

    let settled = false;
    function close(result: boolean): void {
      if (settled) return;
      settled = true;
      if (timer !== null) clearInterval(timer);
      overlay.remove();
      resolve(result);
    }

    // Stop keystrokes from reaching the page / Firestarter shortcut listeners.
    // Enter or R confirms the rejection; Escape keeps the profile.
    overlay.addEventListener('keydown', (e) => {
      e.stopPropagation();
      if (e.key === 'Enter' || e.key === 'R') {
        e.preventDefault();
        close(true);
      } else if (e.key === 'Escape') {
        e.preventDefault();
        close(false);
      }
    });

    overlay.addEventListener('mousedown', (e) => {
      // Backdrop click (but not clicks inside the dialog) keeps the profile.
      if (e.target === overlay) {
        close(false);
      }
    });

    rejectBtn.addEventListener('click', () => close(true));
    cancelBtn.addEventListener('click', () => close(false));

    buttonRow.append(cancelBtn, rejectBtn);
    dialog.append(title, body, buttonRow);
    overlay.append(dialog);
    document.body.append(overlay);

    rejectBtn.focus();

    // Tick the countdown once per second; auto-confirm (reject) at zero.
    if (remaining > 0) {
      timer = setInterval(() => {
        remaining -= 1;
        if (remaining <= 0) {
          close(true);
        } else {
          renderRejectLabel();
        }
      }, 1000);
    }
  });
}
