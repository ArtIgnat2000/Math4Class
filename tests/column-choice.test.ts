import { describe, expect, it } from 'vitest';
import { parseColumnChoice } from '../src/engine/column-choice';

describe('written column options', () => {
  it('reads a printed sum or difference with spaces as thousands separators', () => {
    expect(parseColumnChoice('48 679 + 32 976 = 81 655')).toEqual({
      operator: '+',
      top: '48679',
      bottom: '32976',
      result: '81655',
    });
    expect(parseColumnChoice('72 435 − 25 796 = 46 639')).toEqual({
      operator: '−',
      top: '72435',
      bottom: '25796',
      result: '46639',
    });
    expect(parseColumnChoice('9 999 + 1 = 10 000')).toEqual({
      operator: '+',
      top: '9999',
      bottom: '1',
      result: '10000',
    });
  });

  it('leaves ordinary labels and malformed columns as plain text', () => {
    for (const label of [
      '700',
      '2 600 + 20',
      '15 − 3 · 2',
      '(15 − 3) · 2',
      '19 см',
      '48 679 + 32 976 = 1',
      '48 679 + 32 976 = 1 234 567',
      '+ 48 679 = 81 655',
      '48 679 + 32 976 =',
      'a + b = c',
      '48 679 × 32 976 = 81 655',
    ])
      expect(parseColumnChoice(label), label).toBeNull();
  });

  it('tolerates non-breaking spaces copied from other editors', () => {
    expect(parseColumnChoice('48\u00a0679 + 32\u00a0976 = 81\u00a0655')).toEqual({
      operator: '+',
      top: '48679',
      bottom: '32976',
      result: '81655',
    });
    expect(parseColumnChoice('  72 435  −  25 796  =  46 639  ')).toEqual({
      operator: '−',
      top: '72435',
      bottom: '25796',
      result: '46639',
    });
  });
});
