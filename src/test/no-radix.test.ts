import { describe, expect, it } from 'vitest';

/** U-12: the behaviour layer is Base UI (@base-ui/react); no Radix import may come back. */
const sources = import.meta.glob('/src/**/*.{ts,tsx}', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>;

describe('dependency guard', () => {
  it('U-12: no source file imports radix', () => {
    const offenders = Object.entries(sources)
      .filter(([path]) => !path.endsWith('/no-radix.test.ts'))
      .filter(([, code]) => /from\s+['"](@radix-ui\/|radix-ui)/.test(code))
      .map(([path]) => path);
    expect(offenders).toEqual([]);
  });
});
