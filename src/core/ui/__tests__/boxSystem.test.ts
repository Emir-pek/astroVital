import { describe, expect, it } from 'vitest';
import { BOX } from '../box';

/**
 * Box system guard (spec §5.2, tokens.css): boxes use the three roles (Panel / Tile / Pill) and
 * their tokens, so every page reads as one product. Source code may not use Tailwind's stock radii
 * (`rounded-lg`, `rounded-full` …) or the legacy `rounded-card`, stock text sizes (`text-sm` …,
 * all below or beside the 16/18/24/28/40 px scale), stock shadows (`shadow-xl` …) or the legacy
 * colour aliases (`text-muted`, `bg-surface-2`, `border-border`, `text-ok/warn/crit`).
 */
const sources = import.meta.glob(['/src/**/*.{ts,tsx}', '!/src/**/__tests__/**', '!/src/test/**'], {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>;

const RULES: { name: string; re: RegExp }[] = [
  { name: 'radius', re: /^rounded(-[a-z]{1,2})?(-(xs|sm|md|lg|xl|[2-4]xl|full|card))?$/ },
  { name: 'text size', re: /^text-(xs|sm|base|lg|xl|[2-9]xl)$/ },
  { name: 'shadow', re: /^shadow-(2xs|xs|sm|md|lg|xl|2xl|inner)$/ },
  {
    name: 'legacy alias',
    re: /^(text|bg|border|ring|divide|fill|stroke|outline)-(ok|warn|crit|muted|surface-2|border)(\/\d+)?$/,
  },
];

/**
 * Files of other modules that still use the old classes (CHANGELOG 2026-11-15 "Ekip ne yapmalı").
 * Their owners migrate them to the box roles and then REMOVE the file from this list — the test
 * fails if a listed file is already clean, so the list only shrinks. Never add a file here.
 */
const PENDING_MIGRATION = new Set([
  '/src/modules/intake/components/MeasurementForm.tsx',
  '/src/modules/intake/components/QuickLogPanel.tsx',
  '/src/modules/routine/components/MetClock.tsx',
  '/src/modules/assessment/components/AlertCenter.tsx',
  '/src/modules/assessment/components/LearnPanel.tsx',
  '/src/modules/assessment/components/RecommendationList.tsx',
]);

/** Class-like tokens inside string literals, without variant prefixes (`hover:`, `data-x:` …). */
function classTokens(source: string): string[] {
  const tokens: string[] = [];
  for (const m of source.matchAll(/(['"`])((?:\\.|(?!\1)[^\\])*)\1/g)) {
    for (const raw of (m[2] ?? '').split(/[\s{}()$]+/)) {
      const token = raw.slice(raw.lastIndexOf(':') + 1).replace(/^!/, '');
      if (token) tokens.push(token);
    }
  }
  return tokens;
}

function violations(source: string): string[] {
  return classTokens(source).flatMap((token) =>
    RULES.filter((r) => r.re.test(token)).map((r) => `${r.name}: ${token}`),
  );
}

describe('box system', () => {
  it('defines the three roles from tokens only', () => {
    expect(BOX.panel).toBe('card-surface rounded-panel p-panel shadow-soft');
    expect(BOX.tile).toBe('bg-raised rounded-tile p-tile');
    expect(BOX.pill).toBe('rounded-pill');
  });

  it('flags stock radii, small text, stock shadows and legacy aliases', () => {
    const bad = `className="rounded-lg p-3 text-sm shadow-xl bg-surface-2 hover:text-muted rounded-card rounded"`;
    expect(violations(bad)).toEqual([
      'radius: rounded-lg',
      'text size: text-sm',
      'shadow: shadow-xl',
      'legacy alias: bg-surface-2',
      'legacy alias: text-muted',
      'radius: rounded-card',
      'radius: rounded',
    ]);
    const good = `className="rounded-panel rounded-tile rounded-pill rounded-button rounded-r-none text-label text-warning shadow-soft"`;
    expect(violations(good)).toEqual([]);
  });

  it('src uses only the box roles and the type scale', () => {
    const found: string[] = [];
    for (const [path, source] of Object.entries(sources)) {
      const v = violations(source);
      if (v.length > 0 && !PENDING_MIGRATION.has(path)) found.push(`${path}: ${v.join(', ')}`);
    }
    expect(found).toEqual([]);
  });

  it('the pending-migration list only lists files that still need it', () => {
    for (const path of PENDING_MIGRATION) {
      expect(sources[path], `${path} no longer exists`).toBeDefined();
      expect(
        violations(sources[path] ?? ''),
        `${path} is clean — remove it from the list`,
      ).not.toEqual([]);
    }
  });
});
