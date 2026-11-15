import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { renderWithProviders } from '@test/renderWithProviders';
import { PageHeader } from '../pages/PageHeader';
import { placeOver } from '../pages/sheetPlacement';

describe('placeOver (region sheet over the Status right column)', () => {
  it('covers the column exactly: same width, top, bottom and right edges', () => {
    // 1180 × 820: column from y 196 to 767 (disclaimer row starts at 779), right gutter 24 px.
    const place = placeOver(
      { top: 196.4, bottom: 767, right: 1156, width: 378.2 },
      { width: 1180, height: 820 },
    );
    expect(place).toEqual({ width: 378, bounds: { top: 196, bottom: 53, right: 24 } });
  });

  it('never returns negative insets', () => {
    const place = placeOver(
      { top: 0, bottom: 900, right: 1200, width: 400 },
      { width: 1180, height: 820 },
    );
    expect(place.bounds).toEqual({ top: 0, bottom: 0, right: 0 });
  });
});

describe('PageHeader', () => {
  it('keeps title and status in row 1 and the subtitle with the actions in row 2', () => {
    renderWithProviders(
      <PageHeader
        title="History"
        subtitle="How your numbers changed."
        actions={<button>7 d</button>}
      />,
    );
    const title = screen.getByRole('heading', { level: 1, name: 'History' });
    expect(title).toHaveClass('col-start-1', 'row-start-1');
    expect(screen.getByText('How your numbers changed.')).toHaveClass('col-start-1', 'row-start-2');
    expect(screen.getByRole('button', { name: '7 d' }).parentElement).toHaveClass(
      'col-start-2',
      'row-start-2',
    );
  });

  it('lets the subtitle use the full width when there are no actions', () => {
    renderWithProviders(<PageHeader title="Measure" subtitle="Type it or tap it." />);
    expect(screen.getByText('Type it or tap it.')).toHaveClass('col-span-2', 'row-start-2');
  });
});
