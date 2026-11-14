import { describe, expect, it } from 'vitest';

/**
 * docs/CONTRACTS.md must contain every src/core/types/*.ts file VERBATIM.
 * If this fails after you changed a type: run `npm run docs:contracts` and announce the change.
 */
const typeFiles = import.meta.glob('../*.ts', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>;

const docs = import.meta.glob('/docs/CONTRACTS.md', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>;

const normalize = (s: string) => s.replace(/\r\n/g, '\n').trimEnd();

describe('docs/CONTRACTS.md ↔ src/core/types', () => {
  const contracts = normalize(Object.values(docs)[0] ?? '');

  it('CONTRACTS.md exists', () => {
    expect(contracts.length).toBeGreaterThan(0);
  });

  it.each(Object.entries(typeFiles))('%s is copied verbatim', (_path, src) => {
    expect(contracts.includes(normalize(src))).toBe(true);
  });
});
