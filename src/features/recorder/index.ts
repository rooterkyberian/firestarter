/**
 * Recorder Feature
 * Captures the entire current page as an anonymized fixture plus a report of
 * which selectors resolved — triggered manually (keyboard command or popup
 * button).
 */

import { analyzeProfileWithReport } from '@features/profileAnalyzer';
import { CaptureStore, Capture } from '@shared/storage/captureStore';

export interface CaptureResult {
  ok: boolean;
  count?: number;
  reason?: string;
}

/**
 * Capture the whole page: run the instrumented selector analysis, take the
 * verbatim outerHTML of the entire document, and persist it with the report.
 * Unlike a card-only capture this never depends on a profile card being on
 * screen, so it always succeeds (useful for debugging selector drift, where the
 * card itself may be exactly what failed to resolve).
 *
 * The stored HTML is RAW (not anonymized): anonymization is deferred to export
 * (see CaptureStore / the popup), so debugging sees real data and only data that
 * leaves the device is scrubbed. Captures live in chrome.storage.local and are
 * never synced.
 *
 * An optional `title` (collected from the title popup) is stored alongside the
 * capture to make recorded fixtures easier to identify later.
 */
export async function capturePage(title?: string): Promise<CaptureResult> {
  const { data, report } = analyzeProfileWithReport();

  const trimmedTitle = title?.trim();

  const capture: Capture = {
    ...(trimmedTitle ? { title: trimmedTitle } : {}),
    capturedAt: new Date().toISOString(),
    url: window.location.href,
    appVersion: chrome.runtime.getManifest().version,
    // Whole-page snapshot, verbatim. Anonymized at export time, not here.
    html: document.documentElement.outerHTML,
    report,
    extracted: {
      distanceFound: data.distance !== null,
      heightFound: data.height !== null,
      interestsCount: data.interests.size,
      socialNetworks: Object.keys(data.socialMedia),
      lookingFor: data.lookingFor,
    },
  };

  const count = await CaptureStore.add(capture);
  return { ok: true, count };
}
