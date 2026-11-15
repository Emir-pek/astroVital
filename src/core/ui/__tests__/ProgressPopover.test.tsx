import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { Popover, ProgressBar } from '../index';

describe('<ProgressBar/>', () => {
  it('exposes value, label and value text; clamps out-of-range values', () => {
    const { rerender } = render(
      <ProgressBar value={0.6} label="Level 2" valueText="420 / 700 XP" />,
    );
    const bar = screen.getByRole('progressbar', { name: 'Level 2' });
    expect(bar).toHaveAttribute('aria-valuenow', '60');
    expect(bar).toHaveAttribute('aria-valuetext', '420 / 700 XP');
    expect(screen.getByText('420 / 700 XP')).toBeInTheDocument();
    rerender(<ProgressBar value={4} label="Level 2" valueText="x" />);
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '100');
    rerender(<ProgressBar value={Number.NaN} label="Level 2" valueText="x" />);
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '0');
  });
});

describe('Popover (Base UI re-export)', () => {
  it('opens from its trigger and renders the popup content', async () => {
    const user = userEvent.setup();
    render(
      <Popover.Root>
        <Popover.Trigger>Open</Popover.Trigger>
        <Popover.Portal>
          <Popover.Positioner>
            <Popover.Popup>Hello</Popover.Popup>
          </Popover.Positioner>
        </Popover.Portal>
      </Popover.Root>,
    );
    expect(screen.queryByText('Hello')).toBeNull();
    await user.click(screen.getByRole('button', { name: 'Open' }));
    expect(await screen.findByText('Hello')).toBeInTheDocument();
  });
});
