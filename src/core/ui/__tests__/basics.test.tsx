import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { renderWithProviders } from '@test/renderWithProviders';
import { Button } from '../Button';
import { StatusBadge } from '../StatusBadge';

describe('core/ui basics', () => {
  it.each(['nominal', 'advisory', 'caution', 'warning', 'stale', 'none'] as const)(
    'StatusBadge %s carries colour + icon + text',
    (s) => {
      renderWithProviders(<StatusBadge status={s} label={`L-${s}`} />);
      const el = screen.getByText(`L-${s}`).closest('[data-status]');
      expect(el).toHaveAttribute('data-status', s);
      expect(el?.querySelector('svg')).not.toBeNull();
      expect(el?.className).toMatch(/text-(nominal|advisory|caution|warning|text-3)/);
    },
  );

  it.each(['md', 'lg'] as const)('Button %s is glove-sized', (size) => {
    renderWithProviders(<Button size={size}>Go</Button>);
    expect(screen.getByRole('button', { name: 'Go' })).toHaveClass('min-h-touch', 'min-w-touch');
  });
});
