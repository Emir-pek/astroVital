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
    await user.click(tr);
    expect(onChange).toHaveBeenCalledWith('tr');
    onChange.mockClear();
    await user.click(screen.getByRole('radio', { name: 'English' }));
    expect(onChange).not.toHaveBeenCalled();
  });
});
