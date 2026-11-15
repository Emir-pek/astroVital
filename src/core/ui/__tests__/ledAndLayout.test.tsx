import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { renderWithProviders } from '@test/renderWithProviders';
import { Segmented } from '../Segmented';
import { StatusLine } from '../StatusLine';
import { VitalRow } from '../VitalRow';

// Only tokens.css is readable raw in tests (vitest.config.ts css.include); the LED panel lives there.
const css = import.meta.glob('/src/core/ui/tokens.css', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>;
const tokensCss = css['/src/core/ui/tokens.css'] ?? '';

describe('LED box edges (CSS contract, design 2026-11-15 §3.3)', () => {
  it('.card-surface lives in the components layer, so border utilities still win', () => {
    expect(tokensCss).not.toMatch(/@utility\s+card-surface/);
    expect(tokensCss).toMatch(/@layer components \{\s*\.card-surface \{/);
    // Defined exactly once (an unlayered copy would beat `border-warning` & co.).
    expect(tokensCss.match(/\.card-surface \{/g)).toHaveLength(1);
  });

  it('keeps the panel box size: padding shrinks by the LED width', () => {
    expect(tokensCss).toMatch(
      /--av-pad-panel:\s*calc\(var\(--av-pad-panel-base\)\s*-\s*var\(--av-led-width\)\)/,
    );
    expect(tokensCss).toMatch(/border:\s*var\(--av-led-width\)\s+solid\s+transparent/);
  });

  it('defines every LED level, and motion only for caution and warning', () => {
    for (const level of ['advisory', 'caution', 'warning']) {
      expect(tokensCss).toContain(`[data-led='${level}']`);
    }
    expect(tokensCss).toMatch(/\[data-led='caution'\][^}]*--av-led-anim:\s*av-led-run/);
    expect(tokensCss).toMatch(/\[data-led='warning'\][^}]*av-led-pulse/);
    expect(tokensCss).toMatch(/@property --av-led-pulse[^}]*inherits:\s*false/);
  });

  it('stops LED motion when reduced motion is requested', () => {
    const reduced = tokensCss.slice(
      tokensCss.lastIndexOf('@media (prefers-reduced-motion: reduce)'),
    );
    expect(reduced).toMatch(/\[data-led\]\s*\{\s*--av-led-anim:\s*none/);
  });
});

describe('language-stable kit parts (design 2026-11-15 §3.4)', () => {
  it('Segmented reserves the bold width of each label and can fill its slot', () => {
    renderWithProviders(
      <Segmented
        label="Range"
        value="7d"
        fill
        options={[
          { value: '24h', label: '24 h' },
          { value: '7d', label: '7 days' },
        ]}
        onChange={() => {}}
      />,
    );
    expect(screen.getByRole('radiogroup', { name: 'Range' })).toHaveClass('grid', 'w-full');
    const label = screen.getByText('7 days');
    expect(label).toHaveAttribute('data-label', '7 days');
    expect(label.className).toMatch(/after:content-\[attr\(data-label\)\]/);
    expect(screen.getByRole('radio', { name: '7 days' })).toBeInTheDocument();
  });

  it('StatusLine stays on one line with the full text in title', () => {
    renderWithProviders(<StatusLine status="nominal" text="All nominal" label="Alerts" />);
    const text = screen.getByText('All nominal');
    expect(text).toHaveClass('truncate');
    expect(text).toHaveAttribute('title', 'All nominal');
  });

  it('VitalRow reserves two lines for the stale hint', () => {
    renderWithProviders(
      <VitalRow
        label="Mood"
        value="4"
        unit="/5"
        status="stale"
        statusLabel="Stale data"
        measuredText="Last measured 1 day ago · measure again"
      />,
    );
    const hint = screen.getByText('Last measured 1 day ago · measure again');
    expect(hint).toHaveClass('line-clamp-2');
    expect(hint.closest('p')).toHaveClass('h-12');
  });
});
