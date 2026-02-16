import { describe, it, expect, vi } from 'vitest';
import { arrayAsString, debounce } from './helpers';

describe('arrayAsString', () => {
  it('joins strings with spaces', () => {
    expect(arrayAsString(['hello', 'world'])).toBe('hello world');
  });

  it('converts numbers to strings', () => {
    expect(arrayAsString([1, 2, 3])).toBe('1 2 3');
  });

  it('serializes objects as JSON', () => {
    expect(arrayAsString([{ key: 'value' }])).toBe('{"key":"value"}');
  });

  it('serializes Sets as arrays', () => {
    const result = arrayAsString([new Set(['a', 'b'])]);
    expect(result).toBe('["a","b"]');
  });

  it('handles mixed types', () => {
    expect(arrayAsString(['text', 42, true])).toBe('text 42 true');
  });

  it('handles empty array', () => {
    expect(arrayAsString([])).toBe('');
  });
});

describe('debounce', () => {
  it('delays function execution', async () => {
    vi.useFakeTimers();
    const fn = vi.fn();
    const debounced = debounce(fn, 100);

    debounced();
    expect(fn).not.toHaveBeenCalled();

    vi.advanceTimersByTime(100);
    expect(fn).toHaveBeenCalledOnce();

    vi.useRealTimers();
  });

  it('resets timer on subsequent calls', async () => {
    vi.useFakeTimers();
    const fn = vi.fn();
    const debounced = debounce(fn, 100);

    debounced();
    vi.advanceTimersByTime(50);
    debounced(); // reset
    vi.advanceTimersByTime(50);
    expect(fn).not.toHaveBeenCalled();

    vi.advanceTimersByTime(50);
    expect(fn).toHaveBeenCalledOnce();

    vi.useRealTimers();
  });
});
