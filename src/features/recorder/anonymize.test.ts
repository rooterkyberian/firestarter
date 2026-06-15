import { describe, it, expect, beforeEach } from 'vitest';
import { anonymize, anonymizeHtml, synthesizeText } from './anonymize';
import { analyzeProfile } from '@features/profileAnalyzer';

// A card stuffed with obvious fake PII to prove none of it survives.
const REAL_CARD = `
<div class="profileCard__card">
  <div class="photo" aria-label="Jane Doe, 29" alt="Jane at the beach"
       style="background-image: url('https://media.tinder.example/u/realuser/secret-photo.jpg');"></div>
  <div class="name">Jane Doe, 29</div>
  <div class="location">47 km away</div>
  <hr />
  <div class="bio">Hi I'm Jane! 172cm. msg me ig: realjane_99</div>
  <div class="passions"><span>Travel</span><span>Coffee</span></div>
  <button>REPORT Jane Doe</button>
</div>`;

function anonymizeRealCard(): string {
  const root = document.createElement('div');
  root.innerHTML = REAL_CARD;
  return anonymize(root.firstElementChild as Element);
}

beforeEach(() => {
  document.body.innerHTML = '';
});

describe('synthesizeText', () => {
  it('preserves whitespace, interests, bullets and the REPORT prefix', () => {
    expect(synthesizeText('  ')).toBe('  ');
    expect(synthesizeText('Travel')).toBe('Travel');
    expect(synthesizeText('1/5')).toBe('1/5');
    expect(synthesizeText('REPORT Jane Doe')).toBe('REPORT Someone');
  });

  it('preserves "Looking for" relationship-intent labels verbatim', () => {
    expect(synthesizeText('Long-term partner')).toBe('Long-term partner');
    expect(synthesizeText('Still figuring it out')).toBe(
      'Still figuring it out'
    );
  });

  it('synthesizes token-bearing text and redacts free prose', () => {
    expect(synthesizeText('Real Name, 30')).toBe('redacted');
    expect(synthesizeText('99 km away')).toBe('12 km away');
    expect(synthesizeText('I am 172cm and ig: realhandle')).toBe(
      '180cm ig: example_handle'
    );
  });
});

describe('anonymize', () => {
  it('removes real PII from text and attributes', () => {
    const out = anonymizeRealCard();

    for (const pii of [
      'Jane',
      'realjane_99',
      'realuser',
      'secret-photo',
      '47 km away',
      '172',
    ]) {
      expect(out).not.toContain(pii);
    }

    for (const synthetic of [
      'example.invalid',
      '180cm',
      '12 km away',
      'ig: example_handle',
      'REPORT Someone',
    ]) {
      expect(out).toContain(synthetic);
    }

    // Structure + interest chips preserved
    expect(out).toContain('profileCard__card');
    expect(out).toContain('background-image');
    expect(out).toContain('Travel');
    expect(out).toContain('Coffee');
  });

  it('does not mutate the live DOM', () => {
    const root = document.createElement('div');
    root.innerHTML = REAL_CARD;
    anonymize(root.firstElementChild as Element);
    expect(root.innerHTML).toContain('Jane Doe');
  });

  it('keeps the anonymized card extractable by analyzeProfile', () => {
    document.body.innerHTML = anonymizeRealCard();
    const data = analyzeProfile();

    expect(data.distance).toBe(12);
    expect(data.height).toBe(180);
    expect(data.socialMedia.instagram).toBe('example_handle');
    expect(data.interests.has('Travel')).toBe(true);
    expect(data.interests.has('Coffee')).toBe(true);
  });
});

describe('anonymizeHtml', () => {
  it('scrubs PII from a raw HTML string but keeps it extractable', () => {
    const raw = `<!DOCTYPE html><html><body>${REAL_CARD}</body></html>`;
    const out = anonymizeHtml(raw);

    expect(out).not.toContain('Jane');
    expect(out).not.toContain('realjane_99');
    expect(out).toContain('12 km away');
    expect(out).toContain('Travel');

    // Round-trips back into a parseable, extractable document.
    document.body.innerHTML = out;
    expect(analyzeProfile().distance).toBe(12);
  });

  it('preserves a relationship-intent label through a raw capture', () => {
    const raw = `<html><body><div class="profileCard__card">
      <div>Real Person, 28</div><div>Long-term partner</div></body></html>`;
    expect(anonymizeHtml(raw)).toContain('Long-term partner');
  });
});
