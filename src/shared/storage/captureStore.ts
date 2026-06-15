/**
 * Persistence for recorded selector captures.
 *
 * Captures live in chrome.storage.local (NEVER synced — they describe real
 * profiles) and are FIFO-capped. The stored HTML is RAW, and stays raw through
 * export too — anonymization is a deliberate, separate step taken only when
 * turning a capture into a committed test fixture (`anonymizeHtml`). Alongside
 * the HTML each capture holds the selector pass/fail report and a small
 * extraction summary.
 */

import { SelectorReport } from '@shared/selectors/registry';

/** Summary of what the extractors found (flags/counts + the non-PII intent). */
export interface CaptureSummary {
  distanceFound: boolean;
  heightFound: boolean;
  interestsCount: number;
  socialNetworks: string[];
  /** Relationship intent label, e.g. "Long-term partner" (fixed enum, not PII). */
  lookingFor: string | null;
}

export interface Capture {
  /** User-supplied label for the capture (optional; set via the title popup). */
  title?: string;
  capturedAt: string;
  url: string;
  appVersion: string;
  /** Raw whole-page HTML. Anonymize via `anonymizeHtml` when committing a fixture. */
  html: string;
  report: SelectorReport;
  extracted: CaptureSummary;
}

export const MAX_CAPTURES = 50;
const CAPTURES_KEY = 'firestarter_captures';

export class CaptureStore {
  static async getAll(): Promise<Capture[]> {
    return new Promise((resolve) => {
      chrome.storage.local.get(CAPTURES_KEY, (result) => {
        resolve((result[CAPTURES_KEY] as Capture[]) ?? []);
      });
    });
  }

  /** Append a capture (oldest dropped past MAX_CAPTURES); returns the new count. */
  static async add(capture: Capture): Promise<number> {
    const all = await this.getAll();
    all.push(capture);
    const trimmed = all.slice(-MAX_CAPTURES);
    await new Promise<void>((resolve) => {
      chrome.storage.local.set({ [CAPTURES_KEY]: trimmed }, () => resolve());
    });
    return trimmed.length;
  }

  static async count(): Promise<number> {
    return (await this.getAll()).length;
  }

  static async clear(): Promise<void> {
    return new Promise((resolve) => {
      chrome.storage.local.remove(CAPTURES_KEY, () => resolve());
    });
  }
}
