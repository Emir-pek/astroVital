import { describe, expect, it } from 'vitest';
import { contrastRatio, parseColorTokens } from '../contrast';

describe('contrastRatio', () => {
  it('matches known WCAG ratios and is symmetric', () => {
    expect(contrastRatio('#FFFFFF', '#000000')).toBeCloseTo(21, 1);
    expect(contrastRatio('#F4F6FB', '#0E1530')).toBeCloseTo(16.6, 1);
    expect(contrastRatio('#0E1530', '#F4F6FB')).toBeCloseTo(16.6, 1);
  });
});

describe('parseColorTokens', () => {
  it('collects hex tokens for :root and env blocks, ignoring non-hex values', () => {
    expect(
      parseColorTokens(":root{--av-bg:#0E1530;--av-x:1px} [data-env='mars_base']{--av-bg:#14142C}"),
    ).toEqual({ root: { bg: '#0E1530' }, env: { mars_base: { bg: '#14142C' } } });
  });
});
