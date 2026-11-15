import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { renderWithProviders } from '@test/renderWithProviders';
import { Card } from '../Card';
import { EmptyState } from '../EmptyState';
import { Modal } from '../Modal';
import { PlaceholderNotice } from '../PlaceholderNotice';
import { StatusBadge } from '../StatusBadge';
import { StatusLine } from '../StatusLine';
import { Tile } from '../Tile';

describe('box roles', () => {
  it('Card is a Panel: gradient, 24 px radius and padding, soft shadow', () => {
    renderWithProviders(<Card title="Units">body</Card>);
    const panel = screen.getByRole('heading', { name: 'Units' }).closest('section');
    expect(panel).toHaveClass('card-surface', 'rounded-panel', 'p-panel', 'shadow-soft');
  });

  it('Tile is raised, 20 px radius and 16 px padding, without shadow, as any list element', () => {
    renderWithProviders(
      <ul>
        <Tile as="li" className="flex gap-4">
          Mira
        </Tile>
      </ul>,
    );
    const tile = screen.getByRole('listitem');
    expect(tile).toHaveClass('bg-raised', 'rounded-tile', 'p-tile', 'flex', 'gap-4');
    expect(tile.className).not.toMatch(/shadow/);
  });

  it('EmptyState and PlaceholderNotice are Tiles with text of at least 16 px', () => {
    renderWithProviders(
      <>
        <PlaceholderNotice text="Being built" />
        <EmptyState title="Nothing yet" description="Add a measurement" />
      </>,
    );
    expect(screen.getByText('Being built')).toHaveClass('rounded-tile', 'p-tile', 'text-label');
    const empty = screen.getByText('Nothing yet').parentElement;
    expect(empty).toHaveClass('rounded-tile', 'p-tile');
    expect(screen.getByText('Add a measurement')).toHaveClass('text-label');
  });

  it('badges and the status line are Pills', () => {
    renderWithProviders(
      <>
        <StatusBadge status="caution" label="Caution" />
        <StatusLine status="nominal" text="All nominal" label="Alerts" />
      </>,
    );
    expect(screen.getByText('Caution')).toHaveClass('rounded-pill');
    expect(screen.getByRole('region', { name: 'Alerts' })).toHaveClass('rounded-pill');
  });

  it('Modal is a Panel with a glove-sized close button and body text of at least 16 px', async () => {
    const onClose = vi.fn();
    renderWithProviders(
      <Modal open onClose={onClose} title="Reset?" closeLabel="Close">
        All data will be deleted.
      </Modal>,
    );
    const dialog = screen.getByRole('dialog', { name: 'Reset?' });
    expect(dialog).toHaveClass('card-surface', 'rounded-panel', 'p-panel', 'shadow-soft');
    expect(dialog.className).not.toMatch(/border-border/);
    expect(screen.getByText('All data will be deleted.')).toHaveClass('text-body');
    const close = screen.getByRole('button', { name: 'Close' });
    expect(close).toHaveClass('size-touch');
    await userEvent.setup().click(close);
    expect(onClose).toHaveBeenCalled();
  });
});
