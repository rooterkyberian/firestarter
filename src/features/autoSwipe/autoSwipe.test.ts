import { describe, it, expect } from 'vitest';
import { formatRejectionReason, RejectionReason } from './index';

describe('formatRejectionReason', () => {
  it('formats distance rejection', () => {
    const reason: RejectionReason = { type: 'distance', details: 100 };
    expect(formatRejectionReason(reason)).toBe(
      'Swiped left due to distance: 100'
    );
  });

  it('formats height rejection', () => {
    const reason: RejectionReason = { type: 'height', details: 190 };
    expect(formatRejectionReason(reason)).toBe(
      'Swiped left due to height: 190'
    );
  });

  it('formats interests rejection', () => {
    const reason: RejectionReason = {
      type: 'interests',
      details: ['Astrology', 'Crypto'],
    };
    expect(formatRejectionReason(reason)).toContain(
      'Swiped left due to interests:'
    );
  });

  it('formats regexp rejection', () => {
    const reason: RejectionReason = {
      type: 'regexp',
      details: 'Bio did not match required regexp',
    };
    expect(formatRejectionReason(reason)).toBe(
      'Swiped left due to regexp: Bio did not match required regexp'
    );
  });
});
