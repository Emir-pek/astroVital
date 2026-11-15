import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { renderWithProviders } from '@test/renderWithProviders';
import { Segmented } from '../Segmented';
import { Sheet } from '../Sheet';

describe('Sheet', () => {
  it('close button calls onOpenChange(false)', async () => {
    const onOpenChange = vi.fn();
    renderWithProviders(
      <Sheet open onOpenChange={onOpenChange} title="Settings" closeLabel="Close">
        <p>Body</p>
      </Sheet>,
    );
    expect(screen.getByText('Body')).toBeInTheDocument();
    const close = screen.getByRole('button', { name: 'Close' });
    expect(close).toHaveClass('size-touch');
    await userEvent.setup().click(close);
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('is a right-hand drawer that can be swiped away to the right', () => {
    renderWithProviders(
      <Sheet open onOpenChange={vi.fn()} title="Settings" closeLabel="Close">
        <p>Body</p>
      </Sheet>,
    );
    const popup = screen.getByRole('dialog', { name: 'Settings' });
    expect(popup).toHaveAttribute('data-swipe-direction', 'right');
    expect(popup).toHaveClass('av-sheet', 'max-w-full');
    expect(popup).toHaveStyle({ width: '480px' });
  });

  it('takes a caller width but never narrower than 360 px', () => {
    const { unmount } = renderWithProviders(
      <Sheet open onOpenChange={vi.fn()} title="Narrow" closeLabel="Close" width={404.4}>
        <p>Body</p>
      </Sheet>,
    );
    expect(screen.getByRole('dialog', { name: 'Narrow' })).toHaveStyle({ width: '404px' });
    unmount();
    renderWithProviders(
      <Sheet open onOpenChange={vi.fn()} title="Tiny" closeLabel="Close" width={120}>
        <p>Body</p>
      </Sheet>,
    );
    expect(screen.getByRole('dialog', { name: 'Tiny' })).toHaveStyle({ width: '360px' });
  });

  it('dims the page by default: modal, the backdrop covers the page', () => {
    renderWithProviders(
      <Sheet open onOpenChange={vi.fn()} title="Dim" closeLabel="Close">
        <p>Body</p>
      </Sheet>,
    );
    expect(document.querySelector('.av-sheet-overlay')).toHaveClass('bg-black/60', 'inset-0');
    expect(screen.getByRole('dialog', { name: 'Dim' })).toHaveAttribute('data-backdrop', 'dim');
  });

  it('with a clear backdrop the rest of the page stays usable and does not close the sheet', async () => {
    const onOpenChange = vi.fn();
    const onOutside = vi.fn();
    renderWithProviders(
      <>
        <button type="button" onClick={onOutside}>
          Emergency
        </button>
        <Sheet open onOpenChange={onOpenChange} title="Clear" closeLabel="Close" backdrop="clear">
          <p>Body</p>
        </Sheet>
      </>,
    );
    // No backdrop layer at all, so nothing sits between the finger and the page.
    expect(document.querySelector('.av-sheet-overlay')).toBeNull();
    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: 'Emergency' }));
    expect(onOutside).toHaveBeenCalledTimes(1);
    expect(onOpenChange).not.toHaveBeenCalledWith(false);
    expect(screen.getByRole('dialog', { name: 'Clear' })).toBeInTheDocument();
    // Escape still closes it.
    await user.click(screen.getByText('Body'));
    await user.keyboard('{Escape}');
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('defaults to full height at the right edge; bounds make it a floating panel inside a box', () => {
    const { unmount } = renderWithProviders(
      <Sheet open onOpenChange={vi.fn()} title="Docked" closeLabel="Close">
        <p>Body</p>
      </Sheet>,
    );
    const docked = screen.getByRole('dialog', { name: 'Docked' });
    expect(docked.parentElement).toHaveStyle({ inset: '0px' });
    expect(docked).toHaveClass('rounded-panel', 'rounded-r-none', 'p-panel');
    unmount();

    renderWithProviders(
      <Sheet
        open
        onOpenChange={vi.fn()}
        title="Floating"
        closeLabel="Close"
        backdrop="clear"
        width={380}
        bounds={{ top: 196, bottom: 53, right: 24 }}
      >
        <p>Body</p>
      </Sheet>,
    );
    const floating = screen.getByRole('dialog', { name: 'Floating' });
    // Below the top bar (128 px) and the page header, above the disclaimer row, inset from the edge.
    expect(floating.parentElement).toHaveStyle({
      top: '196px',
      bottom: '53px',
      right: '24px',
      width: '380px',
    });
    expect(floating).toHaveClass('rounded-panel', 'h-full');
    expect(floating).not.toHaveClass('rounded-r-none');
    expect(floating).toHaveStyle({ width: '100%' });
  });
});

describe('Segmented', () => {
  it('calls onChange with the clicked value and ignores empty', async () => {
    const onChange = vi.fn();
    renderWithProviders(
      <Segmented
        label="Language"
        value="en"
        options={[
          { value: 'en', label: 'English' },
          { value: 'tr', label: 'Turkce' },
        ]}
        onChange={onChange}
      />,
    );
    const user = userEvent.setup();
    const tr = screen.getByRole('radio', { name: 'Turkce' });
    expect(tr).toHaveClass('min-h-touch');
    expect(tr).toHaveAttribute('aria-checked', 'false');
    expect(screen.getByRole('radio', { name: 'English' })).toHaveAttribute('aria-checked', 'true');
    await user.click(tr);
    expect(onChange).toHaveBeenCalledWith('tr');
    onChange.mockClear();
    await user.click(screen.getByRole('radio', { name: 'English' }));
    expect(onChange).not.toHaveBeenCalled();
  });
});
