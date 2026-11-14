import { describe, expect, it } from 'vitest';

/**
 * docs/SETUP_CHECK.md "Bağımlılık kaydı" must list EVERY package.json dependency with its exact
 * version range, and nothing else. If this fails after `npm install <pkg>`: add/update the row
 * in docs/SETUP_CHECK.md § 5 in the same commit (see § 6 of that file).
 */
const pkgRaw = import.meta.glob('/package.json', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>;

const docRaw = import.meta.glob('/docs/SETUP_CHECK.md', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>;

interface PackageJson {
  engines?: { node?: string };
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
}

const pkg = JSON.parse(Object.values(pkgRaw)[0] ?? '{}') as PackageJson;
const doc = (Object.values(docRaw)[0] ?? '').replace(/\r\n/g, '\n');

const declared: Record<string, string> = { ...pkg.dependencies, ...pkg.devDependencies };

/** Parses `| \`name\` | \`range\` | ...` rows between the DEPS markers. */
const registry = (): Map<string, string> => {
  const start = doc.indexOf('<!-- DEPS:BEGIN -->');
  const end = doc.indexOf('<!-- DEPS:END -->');
  const rows = new Map<string, string>();
  if (start === -1 || end === -1) return rows;
  for (const line of doc.slice(start, end).split('\n')) {
    const m = /^\|\s*`([^`]+)`\s*\|\s*`([^`]+)`\s*\|/.exec(line.trim());
    if (m?.[1] && m[2]) rows.set(m[1], m[2]);
  }
  return rows;
};

describe('docs/SETUP_CHECK.md dependency registry', () => {
  const rows = registry();

  it('has the DEPS markers and rows', () => {
    expect(rows.size).toBeGreaterThan(0);
  });

  it('lists every package.json dependency with the exact range', () => {
    const problems = Object.entries(declared)
      .filter(([name, range]) => rows.get(name) !== range)
      .map(([name, range]) =>
        rows.has(name)
          ? `${name}: package.json "${range}" ≠ SETUP_CHECK "${rows.get(name)}"`
          : `${name}@${range}: missing in SETUP_CHECK.md`,
      );
    expect(problems, 'Update docs/SETUP_CHECK.md § 5').toEqual([]);
  });

  it('does not list packages that were removed from package.json', () => {
    const stale = [...rows.keys()].filter((name) => !(name in declared));
    expect(stale, 'Remove these rows from docs/SETUP_CHECK.md § 5').toEqual([]);
  });

  it('documents the required Node version (engines.node)', () => {
    expect(doc).toContain(`\`${pkg.engines?.node ?? '?'}\``);
  });
});
