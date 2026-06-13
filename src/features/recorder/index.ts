/**
 * Recorder Feature
 * Captures the current Tinder card as an anonymized fixture plus a report of
 * which selectors resolved — triggered manually via a keyboard shortcut.
 */

import { resolve } from '@shared/selectors/registry';
import { analyzeProfileWithReport } from '@features/profileAnalyzer';
import { CaptureStore, Capture } from '@shared/storage/captureStore';
import { anonymize } from './anonymize';

export interface CaptureResult {
  ok: boolean;
  count?: number;
  reason?: string;
}

/**
 * Capture the currently-displayed card: run the instrumented analysis, take the
 * card's anonymized outerHTML, and persist it with the selector report.
 */
export async function captureCurrentCard(): Promise<CaptureResult> {
  const card = resolve('profileCard');
  if (!card) {
    return { ok: false, reason: 'no profile card on screen' };
  }

  const { data, report } = analyzeProfileWithReport();

  const capture: Capture = {
    capturedAt: new Date().toISOString(),
    url: window.location.href,
    appVersion: chrome.runtime.getManifest().version,
    html: anonymize(card),
    report,
    extracted: {
      distanceFound: data.distance !== null,
      heightFound: data.height !== null,
      interestsCount: data.interests.size,
      socialNetworks: Object.keys(data.socialMedia),
    },
  };

  const count = await CaptureStore.add(capture);
  return { ok: true, count };
}
