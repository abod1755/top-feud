import { describe, expect, it } from 'vitest';

import { absoluteUrl, cn, formatNumber } from '@/lib/utils';

describe('cn', () => {
  it('merges class names', () => {
    expect(cn('a', 'b')).toBe('a b');
  });

  it('drops falsy values', () => {
    expect(cn('a', false, undefined, null, 'b')).toBe('a b');
  });

  it('dedupes conflicting tailwind utilities (last wins)', () => {
    expect(cn('px-2', 'px-4')).toBe('px-4');
  });
});

describe('formatNumber', () => {
  it('adds thousands separators', () => {
    expect(formatNumber(1234567)).toBe('1,234,567');
  });
});

describe('absoluteUrl', () => {
  it('joins base and path without double slashes', () => {
    expect(absoluteUrl('/explore', 'https://topfeud.gg/')).toBe('https://topfeud.gg/explore');
  });

  it('adds a leading slash when missing', () => {
    expect(absoluteUrl('explore', 'https://topfeud.gg')).toBe('https://topfeud.gg/explore');
  });
});
