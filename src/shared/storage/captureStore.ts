/**
 * Persistence for recorded selector captures.
 *
 * Captures live in chrome.storage.local (NEVER synced — they describe real
 * profiles, even after anonymization) and are FIFO-capped. Each capture holds
 * only the anonymized HTML, the selector pass/fail report, and non-PII
 * extraction flags — no real extracted values.
 */

import { SelectorReport } from '@shared/selectors/registry';

/** Non-PII summary of what the extractors found (flags/counts, not values). */
export interface CaptureSummary {
  distanceFound: boolean;
  heightFound: boolean;
  interestsCount: number;
  socialNetworks: string[];
}

export interface Capture {
  capturedAt: string;
  url: string;
  appVersion: string;
  /** Anonymized card HTML — safe to drop into a fixture. */
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
