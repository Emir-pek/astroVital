import { describe, expect, it } from 'vitest';
import { contrastRatio, parseColorTokens } from '@core/utils';

const raw = import.meta.glob('/src/core/ui/tokens.css', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>;

const tokens = parseColorTokens(Object.values(raw)[0] ?? '');
const MIN = 6;

const pairs: Array<[string, string]> = [
  ['text', 'bg'],
  ['text', 'surface'],
  ['text', 'raised'],
  ['text-2', 'raised'],
  ['text-3', 'raised'],
  ['accent', 'raised'],
  ['status-nominal', 'raised'],
  ['status-advisory', 'raised'],
  ['status-caution', 'raised'],
  ['status-warning', 'raised'],
  ['on-warning-fill', 'status-warning-fill'],
  ['bg', 'accent'],
];

describe('design token contrast', () => {
  it.each(pairs)('%s on %s is >= 6:1', (fg, bg) => {
    const a = tokens.root[fg];
    const b = tokens.root[bg];
    if (!a || !b) throw new Error(`missing token ${fg} or ${bg}`);
    expect(contrastRatio(a, b)).toBeGreaterThanOrEqual(MIN);
  });

  it('parses at least one env block', () => {
    expect(Object.keys(tokens.env).length).toBeGreaterThan(0);
  });

  it.each(Object.entries(tokens.env))('text-3 on env %s bg is >= 6:1', (_name, env) => {
    const bg = env['bg'];
    const fg = tokens.root['text-3'];
    if (!bg || !fg) throw new Error('missing bg or text-3');
    expect(contrastRatio(fg, bg)).toBeGreaterThanOrEqual(MIN);
  });
});
