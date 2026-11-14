import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { renderWithProviders } from '@test/renderWithProviders';
import { Menu, Select } from '../index';

describe('Menu (Base UI re-export)', () => {
  it('keeps the popup closed until the trigger is pressed, then fires item clicks', async () => {
    const onPick = vi.fn();
    renderWithProviders(
      <Menu.Root>
        <Menu.Trigger>Crew</Menu.Trigger>
        <Menu.Portal>
          <Menu.Positioner>
            <Menu.Popup>
              <Menu.Item onClick={onPick}>Settings</Menu.Item>
            </Menu.Popup>
          </Menu.Positioner>
        </Menu.Portal>
      </Menu.Root>,
    );
    expect(screen.queryByText('Settings')).not.toBeInTheDocument();
    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: 'Crew' }));
    await user.click(await screen.findByRole('menuitem', { name: 'Settings' }));
    expect(onPick).toHaveBeenCalledTimes(1);
  });
});

describe('Select (Base UI re-export)', () => {
  it('renders a combobox trigger with the current value', () => {
    renderWithProviders(
      <Select.Root value="iss" items={[{ value: 'iss', label: 'ISS' }]}>
        <Select.Trigger aria-label="Environment">
          <Select.Value />
        </Select.Trigger>
      </Select.Root>,
    );
    expect(screen.getByRole('combobox', { name: 'Environment' })).toHaveTextContent('ISS');
  });
});
