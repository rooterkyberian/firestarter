import { describe, it, expect, beforeEach } from 'vitest';
import { analyzeProfileWithReport } from '@features/profileAnalyzer';
import type { SelectorReport } from './registry';
import basicCard from './__fixtures__/basic-card.html?raw';
import bioCard from './__fixtures__/card-with-bio.html?raw';
import socialCard from './__fixtures__/card-with-social.html?raw';
import changedDom from './__fixtures__/changed-dom.html?raw';

function loadCard(html: string): void {
  document.body.innerHTML = html;
}

function outcome(report: SelectorReport, name: string): boolean | undefined {
  return report.outcomes.find((o) => o.name === name)?.ok;
}

beforeEach(() => {
  document.body.innerHTML = '';
});

describe('analyzeProfileWithReport — basic card (photo only)', () => {
  it('resolves card-level selectors and reports the rest as failed', () => {
    loadCard(basicCard);
    const { data, report } = analyzeProfileWithReport();

    // Nothing extractable beyond identity
    expect(data.bio).toBeNull();
    expect(data.distance).toBeNull();
    expect(data.height).toBeNull();
    expect(data.interests.size).toBe(0);
    expect(data.socialMedia).toEqual({});

    // Card-level locators resolve
    expect(outcome(report, 'profileCard')).toBe(true);
    expect(outcome(report, 'cardPhoto')).toBe(true);
    expect(outcome(report, 'cardAriaLabel')).toBe(true);

    // The rest are reported as failures, not thrown
    expect(report.failed).toEqual(
      expect.arrayContaining([
        'bioSection',
        'interestsContainer',
        'distanceText',
        'reportButton',
      ])
    );
  });
});

describe('analyzeProfileWithReport — full bio card', () => {
  it('extracts distance, height, interests, social and reports success', () => {
    loadCard(bioCard);
    const { data, report } = analyzeProfileWithReport();

    expect(data.distance).toBe(12);
    expect(data.height).toBe(180);
    expect(data.bio).toContain('180cm');
    expect(data.interests.has('Travel')).toBe(true);
    expect(data.interests.has('Hiking')).toBe(true);
    expect(data.interests.has('Wine')).toBe(true);
    expect(data.socialMedia.instagram).toBe('example_handle');

    for (const name of [
      'profileCard',
      'bioSection',
      'interestsContainer',
      'distanceText',
      'reportButton',
    ]) {
      expect(outcome(report, name)).toBe(true);
    }
    expect(report.failed).not.toContain('profileCard');
  });
});

describe('analyzeProfileWithReport — social handles', () => {
  it('extracts multiple social handles from the bio', () => {
    loadCard(socialCard);
    const { data } = analyzeProfileWithReport();

    expect(data.socialMedia.instagram).toBe('cooluser');
    expect(data.socialMedia.snapchat).toBe('snappy123');
  });
});

describe('analyzeProfileWithReport — changed DOM (redesign)', () => {
  it('does not throw and reports the core selectors as failed', () => {
    loadCard(changedDom);

    let result!: ReturnType<typeof analyzeProfileWithReport>;
    expect(() => {
      result = analyzeProfileWithReport();
    }).not.toThrow();

    const { data, report } = result;
    expect(data.bio).toBeNull();
    expect(data.distance).toBeNull();
    expect(data.interests.size).toBe(0);

    expect(report.failed).toEqual(
      expect.arrayContaining(['profileCard', 'bioSection'])
    );
  });
});
