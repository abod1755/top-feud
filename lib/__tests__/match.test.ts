import { describe, expect, it } from 'vitest';

import { normalizeArabic, isMatch, findAnswerIndex } from '@/lib/match';

describe('normalizeArabic', () => {
  it('normalizes alef variants and diacritics', () => {
    expect(normalizeArabic('أحْمَد')).toBe('احمد');
    expect(normalizeArabic('آدم')).toBe('ادم');
  });
  it('normalizes taa marbuta and alef maqsura', () => {
    expect(normalizeArabic('كرة')).toBe('كره');
    expect(normalizeArabic('مصطفى')).toBe('مصطفي');
  });
  it('strips tatweel and punctuation and collapses spaces', () => {
    expect(normalizeArabic('الـسعودية!')).toBe('السعوديه');
    expect(normalizeArabic('كرة   قدم')).toBe('كره قدم');
  });
});

describe('isMatch', () => {
  it('matches exact after normalization', () => {
    expect(isMatch('احمد', 'أحمد')).toBe(true);
  });
  it('ignores the definite article', () => {
    expect(isMatch('رياض', 'الرياض')).toBe(true);
  });
  it('tolerates a single typo on longer words', () => {
    expect(isMatch('كانفارو', 'كانافارو')).toBe(true);
  });
  it('rejects clearly different answers', () => {
    expect(isMatch('مصر', 'السعودية')).toBe(false);
  });
  it('rejects empty input', () => {
    expect(isMatch('', 'احمد')).toBe(false);
  });
});

describe('findAnswerIndex', () => {
  const answers = [{ text: 'السعودية' }, { text: 'مصر' }, { text: 'الإمارات' }];
  it('finds an unrevealed match', () => {
    expect(findAnswerIndex('مصر', answers, new Set())).toBe(1);
  });
  it('skips already revealed answers', () => {
    expect(findAnswerIndex('السعودية', answers, new Set([0]))).toBe(-1);
  });
  it('returns -1 when nothing matches', () => {
    expect(findAnswerIndex('قطر', answers, new Set())).toBe(-1);
  });
});
