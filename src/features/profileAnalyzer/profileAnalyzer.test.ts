import { describe, it, expect } from 'vitest';
import { bioExtractHeight, bioGetSocial } from './index';

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
