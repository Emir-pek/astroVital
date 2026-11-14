import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { renderWithProviders } from '@test/renderWithProviders';
import { AlertStrip, type AlertStripProps } from '../AlertStrip';
import { RedAlertDialog, type RedAlertDialogProps } from '../RedAlertDialog';

const stripProps = (over: Partial<AlertStripProps> = {}): AlertStripProps => ({
  label: 'Alerts',
  items: [],
  emptyText: 'All clear',
  whatToDoLabel: 'What to do?',
  onWhatToDo: vi.fn(),
  snoozeLabel: 'Snooze',
  onSnooze: vi.fn(),
  moreLabel: '2 more',
  ...over,
});

const redItems = [
  {
    id: 'a',
    title: 'SpO2 low',
    valueText: '84 %',
    description: 'Oxygen is low',
    steps: ['Sit down', 'Breathe'],
    escalationText: 'Call the CMO',
  },
  {
    id: 'b',
    title: 'Heart rate',
    valueText: '190 bpm',
    description: 'Too fast',
    steps: ['Rest'],
    escalationText: 'Call flight surgeon',
  },
];
const dlgProps = (over: Partial<RedAlertDialogProps> = {}): RedAlertDialogProps => ({
  items: redItems,
  heading: 'Urgent',
  whatToDoLabel: 'What should I do?',
  acknowledgeLabel: 'I saw it',
  stopBlinkingLabel: 'Stop blinking',
  onAcknowledge: vi.fn(),
  ...over,
});

describe('RedAlertDialog', () => {
  it('lists every warning with its own acknowledge button', async () => {
    const onAcknowledge = vi.fn();
    renderWithProviders(<RedAlertDialog {...dlgProps({ onAcknowledge })} />);
    const btns = screen.getAllByRole('button', { name: 'I saw it' });
    expect(btns).toHaveLength(2);
    await userEvent.setup().click(btns[0]!);
    expect(onAcknowledge).toHaveBeenCalledWith('a');
  });

  it('ESC does not close the red dialog', async () => {
    renderWithProviders(<RedAlertDialog {...dlgProps()} />);
    await userEvent.setup().keyboard('{Escape}');
    expect(screen.getByRole('alertdialog')).toBeInTheDocument();
  });

  it('"What should I do?" reveals steps inline', async () => {
    renderWithProviders(<RedAlertDialog {...dlgProps()} />);
    expect(screen.queryByText('Sit down')).toBeNull();
    await userEvent.setup().click(screen.getAllByRole('button', { name: 'What should I do?' })[0]!);
    expect(screen.getByText('Sit down')).toBeInTheDocument();
    expect(screen.getByText('Call the CMO')).toBeInTheDocument();
    expect(screen.getByRole('alertdialog')).toBeInTheDocument();
  });

  it('stop blinking removes av-blink', async () => {
    renderWithProviders(<RedAlertDialog {...dlgProps()} />);
    const dialog = screen.getByRole('alertdialog');
    expect(dialog.querySelectorAll('.av-blink').length).toBe(2);
    await userEvent.setup().click(screen.getByRole('button', { name: 'Stop blinking' }));
    expect(dialog.querySelectorAll('.av-blink').length).toBe(0);
  });

  it('a new warning blinks again after stop blinking', async () => {
    const { rerender } = renderWithProviders(<RedAlertDialog {...dlgProps()} />);
    await userEvent.setup().click(screen.getByRole('button', { name: 'Stop blinking' }));
    const dialog = screen.getByRole('alertdialog');
    expect(dialog.querySelectorAll('.av-blink').length).toBe(0);
    const extra = { ...redItems[0]!, id: 'c', title: 'New one' };
    rerender(<RedAlertDialog {...dlgProps({ items: [...redItems, extra] })} />);
    expect(screen.getByRole('alertdialog').querySelectorAll('.av-blink').length).toBe(3);
  });

  it('clicking outside the dialog content does not close it', () => {
    renderWithProviders(<RedAlertDialog {...dlgProps()} />);
    // The alert is modal, so dispatch raw events on the document outside the popup.
    fireEvent.pointerDown(document.body);
    fireEvent.mouseDown(document.body);
    fireEvent.click(document.body);
    expect(screen.getByRole('alertdialog')).toBeInTheDocument();
  });

  it('F-04 (B8): focus lands on the first "What should I do?" button when it opens', async () => {
    renderWithProviders(<RedAlertDialog {...dlgProps()} />);
    const first = screen.getAllByRole('button', { name: 'What should I do?' })[0]!;
    await waitFor(() => expect(first).toHaveFocus());
  });

  it('closed when items is empty', () => {
    renderWithProviders(<RedAlertDialog {...dlgProps({ items: [] })} />);
    expect(screen.queryByRole('alertdialog')).toBeNull();
  });

  it('every dialog button is glove-sized', () => {
    renderWithProviders(<RedAlertDialog {...dlgProps()} />);
    for (const b of within(screen.getByRole('alertdialog')).getAllByRole('button')) {
      expect(b).toHaveClass('min-h-touch');
    }
  });
});

describe('AlertStrip', () => {
  it('shows emptyText when no items', () => {
    renderWithProviders(<AlertStrip {...stripProps()} />);
    expect(screen.getByText('All clear')).toBeInTheDocument();
  });

  it('warning row has no snooze, caution row has snooze', () => {
    const { unmount } = renderWithProviders(
      <AlertStrip {...stripProps({ items: [{ id: 'w', status: 'warning', title: 'W' }] })} />,
    );
    expect(screen.queryByRole('button', { name: 'Snooze' })).toBeNull();
    expect(screen.getByRole('button', { name: 'What to do?' })).toBeInTheDocument();
    unmount();
    renderWithProviders(
      <AlertStrip {...stripProps({ items: [{ id: 'c', status: 'caution', title: 'C' }] })} />,
    );
    expect(screen.getByRole('button', { name: 'Snooze' })).toBeInTheDocument();
  });

  it('keeps given order and expands the rest', async () => {
    const onSnooze = vi.fn();
    renderWithProviders(
      <AlertStrip
        {...stripProps({
          onSnooze,
          items: [
            { id: 'x', status: 'caution', title: 'First', detail: 'd1' },
            { id: 'y', status: 'advisory', title: 'Second' },
            { id: 'z', status: 'warning', title: 'Third' },
          ],
        })}
      />,
    );
    expect(screen.getByText('First')).toBeInTheDocument();
    expect(screen.queryByText('Second')).toBeNull();
    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: '2 more' }));
    const titles = screen.getAllByText(/First|Second|Third/).map((e) => e.textContent);
    expect(titles).toEqual(['First', 'Second', 'Third']);
    await user.click(screen.getAllByRole('button', { name: 'Snooze' })[0]!);
    expect(onSnooze).toHaveBeenCalledWith('x');
  });

  it('every strip button is glove-sized', () => {
    renderWithProviders(
      <AlertStrip
        {...stripProps({
          items: [
            { id: 'a', status: 'caution', title: 'A' },
            { id: 'b', status: 'caution', title: 'B' },
          ],
        })}
      />,
    );
    for (const b of screen.getAllByRole('button')) expect(b).toHaveClass('min-h-touch');
  });
});
