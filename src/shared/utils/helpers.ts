/**
 * Helper utility functions
 */

/**
 * Convert array to string for display
 */
export function arrayAsString(arr: unknown[]): string {
  return arr
    .map((e) =>
      typeof e === 'object' ? JSON.stringify(e, toPlain) : String(e)
    )
    .join(' ');
}

/**
 * JSON replacer to handle Sets
 */
function toPlain(_key: string, value: unknown): unknown {
  if (typeof value === 'object' && value instanceof Set) {
    return Array.from(value);
  }
  return value;
}

/**
 * Debounce function
 */
export function debounce<T extends (...args: unknown[]) => void>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout> | null = null;

  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      func(...args);
    };

    if (timeout) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(later, wait);
  };
}

/**
 * Memoize expensive functions
 */
export function memoize<T extends (...args: unknown[]) => unknown>(
  fn: T
): T {
  const cache = new Map<string, ReturnType<T>>();

  return ((...args: Parameters<T>) => {
    const key = JSON.stringify(args);
    if (cache.has(key)) {
      return cache.get(key);
    }
    const result = fn(...args) as ReturnType<T>;
    cache.set(key, result);
    return result;
  }) as T;
}
