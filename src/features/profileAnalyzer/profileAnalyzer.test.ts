import { describe, it, expect, beforeEach } from 'vitest';
import {
  bioExtractHeight,
  bioGetSocial,
  getLookingFor,
  getBio,
  getHeight,
} from './index';

describe('bioExtractHeight', () => {
  it('extracts 3-digit cm height', () => {
    expect(bioExtractHeight('I am 175cm tall')).toBe(175);
  });

  it('extracts height without cm suffix', () => {
    expect(bioExtractHeight('Height: 180')).toBe(180);
  });

  it('extracts height from decimal meters (1.75)', () => {
    expect(bioExtractHeight('1.75')).toBe(175);
  });

  it('extracts height from decimal meters (1.65)', () => {
    expect(bioExtractHeight('I am 1.65 tall')).toBe(165);
  });

  it('returns null when no height found', () => {
    expect(bioExtractHeight('Just a regular bio')).toBeNull();
  });

  it('returns null for numbers outside valid range', () => {
    expect(bioExtractHeight('I have 500 friends')).toBeNull();
  });

  it('returns null for numbers below valid range', () => {
    expect(bioExtractHeight('I am 100cm')).toBeNull();
  });

  it('picks first valid height when multiple present', () => {
    expect(bioExtractHeight('175cm and 180cm')).toBe(175);
  });
});

describe('bioGetSocial', () => {
  it('extracts instagram handle with ig prefix', () => {
    const result = bioGetSocial('ig: cooluser');
    expect(result.instagram).toBe('cooluser');
  });

  it('extracts instagram handle with instagram prefix', () => {
    const result = bioGetSocial('instagram: myhandle');
    expect(result.instagram).toBe('myhandle');
  });

  it('extracts snapchat handle', () => {
    const result = bioGetSocial('snap: mysnap123');
    expect(result.snapchat).toBe('mysnap123');
  });

  it('extracts facebook handle', () => {
    const result = bioGetSocial('fb: john_doe');
    expect(result.facebook).toBe('john_doe');
  });

  it('extracts multiple social handles', () => {
    const result = bioGetSocial('ig: myinsta snap: mysnap');
    expect(result.instagram).toBe('myinsta');
    expect(result.snapchat).toBe('mysnap');
  });

  it('returns empty object when no social found', () => {
    const result = bioGetSocial('Just a normal bio without social media');
    expect(Object.keys(result)).toHaveLength(0);
  });

  it('ignores handles shorter than 4 chars', () => {
    const result = bioGetSocial('ig: ab');
    expect(result.instagram).toBeUndefined();
  });
});

describe('getLookingFor', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it('reads a known relationship intent from the profile card', () => {
    document.body.innerHTML =
      '<div class="profileCard__card"><ul><li>Long-term partner</li><li>180cm</li></ul></div>';
    expect(getLookingFor()).toBe('Long-term partner');
  });

  it('matches a multi-word intent label (whitespace-insensitive)', () => {
    document.body.innerHTML =
      '<div class="profileCard__card">Looking for\n  Short-term, open to long</div>';
    expect(getLookingFor()).toBe('Short-term, open to long');
  });

  it('falls back to the document when no card is resolvable', () => {
    document.body.innerHTML = '<section>New friends</section>';
    expect(getLookingFor()).toBe('New friends');
  });

  it('returns null when no intent label is present', () => {
    document.body.innerHTML =
      '<div class="profileCard__card">just a bio about hiking</div>';
    expect(getLookingFor()).toBeNull();
  });
});

// Mirrors Tinder's expanded layout: header name, structured chips in <li>, the
// relationship intent, passion pills, and one free-prose bio block.
const EXPANDED_CARD = `
  <div class="profileCard__card">
    <div>Real Person, 29</div>
    <section><ul>
      <li><span>12 km away</span></li>
      <li><span>178 cm</span></li>
    </ul></section>
    <div><h2>X</h2><div>Long-term partner</div></div>
    <div><h2>About</h2><div>Coffee snob, weekend climber, fluent in sarcasm.</div></div>
    <ul><li><span>Coffee</span></li><li><span>Hiking</span></li></ul>
  </div>`;

describe('getBio (structural)', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it('extracts the free-prose block, ignoring chips/intent/name/passions', () => {
    document.body.innerHTML = EXPANDED_CARD;
    expect(getBio()).toBe('Coffee snob, weekend climber, fluent in sarcasm.');
  });

  it('returns null when the card has no bio prose', () => {
    document.body.innerHTML = `
      <div class="profileCard__card">
        <div>Real Person, 29</div>
        <ul><li><span>178 cm</span></li></ul>
      </div>`;
    expect(getBio()).toBeNull();
  });

  it('falls back to the legacy hr+div selector', () => {
    document.body.innerHTML =
      '<div class="profileCard__card"><hr /><div>Bio after a divider</div></div>';
    expect(getBio()).toBe('Bio after a divider');
  });
});

describe('getHeight', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it('reads a structured height chip (cm)', () => {
    document.body.innerHTML = EXPANDED_CARD;
    expect(getHeight()).toBe(178);
  });

  it('reads a height chip in meters', () => {
    document.body.innerHTML =
      '<div class="profileCard__card"><ul><li><span>1.82 m</span></li></ul></div>';
    expect(getHeight()).toBe(182);
  });

  it('falls back to height mentioned in the bio', () => {
    document.body.innerHTML =
      '<div class="profileCard__card"><hr /><div>Hi, I am 165cm and love books</div></div>';
    expect(getHeight()).toBe(165);
  });

  it('ignores out-of-range numbers', () => {
    document.body.innerHTML =
      '<div class="profileCard__card"><ul><li><span>250 cm</span></li></ul></div>';
    expect(getHeight()).toBeNull();
  });
});
