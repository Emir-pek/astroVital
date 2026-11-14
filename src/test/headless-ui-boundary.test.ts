import { describe, expect, it } from 'vitest';

/**
 * U-12: headless UI libraries — Base UI (@base-ui/react) and Radix (radix-ui, @radix-ui/*) —
 * may be imported only inside src/core/ui (ADR-029, ADR-034). Both are allowed there.
 * ESLint enforces the same rule; this test keeps it visible in `npm test`.
 */
const sources = import.meta.glob('/src/**/*.{ts,tsx}', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>;

const HEADLESS_IMPORT = /from\s+["'](@base-ui\/react|radix-ui|@radix-ui\/)/;

describe('dependency guard', () => {
  it('U-12: Base UI / Radix are imported only inside src/core/ui', () => {
    const offenders = Object.entries(sources)
      .filter(([path]) => !path.startsWith('/src/core/ui/'))
      .filter(([path]) => !path.endsWith('/headless-ui-boundary.test.ts'))
      .filter(([, code]) => HEADLESS_IMPORT.test(code))
      .map(([path]) => path);
    expect(offenders).toEqual([]);
  });
});
