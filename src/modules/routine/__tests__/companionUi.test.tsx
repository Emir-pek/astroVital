import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type * as FramerMotion from 'framer-motion';
import { I18nextProvider } from 'react-i18next';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { i18n } from '@core/i18n';
import { ToastProvider } from '@core/ui';
import type { CompanionMood, CompanionState } from '../services/companion';

/** Reduced-motion preference per test (framer-motion hook). */
const motionPref = vi.hoisted(() => ({ reduce: false }));
vi.mock('framer-motion', async (importOriginal) => {
  const actual = await importOriginal<typeof FramerMotion>();
  return { ...actual, useReducedMotion: () => motionPref.reduce };
});

/** Companion output per test (logic is tested elsewhere; here only the UI). */
const state = vi.hoisted(() => ({ current: null as CompanionState | null }));
vi.mock('../hooks/useCompanion', () => ({
  useCompanion: () => state.current,
}));

const { CompanionAvatar } = await import('../components/companion/CompanionAvatar');
const { CompanionDock } = await import('../components/companion/CompanionDock');
const { useRoutineStore, ROUTINE_STORE_KEY, migrateRoutineState } =
  await import('../store/useRoutineStore');

const MOODS: CompanionMood[] = ['cheerful', 'neutral', 'concerned', 'alert'];

function Where() {
  return <p data-testid="where">{useLocation().pathname}</p>;
}

const renderDock = () =>
  render(
    <I18nextProvider i18n={i18n}>
      <ToastProvider>
        <MemoryRouter initialEntries={['/']}>
          <CompanionDock />
          <Routes>
            <Route path="*" element={<Where />} />
          </Routes>
        </MemoryRouter>
      </ToastProvider>
    </I18nextProvider>,
  );

beforeEach(() => {
  useRoutineStore.getState().resetRoutine();
  state.current = {
    mood: 'neutral',
    messageKey: 'routine.companion.tip',
    subjectKey: 'hazards.gravity.countermeasures',
  };
});
afterEach(() => {
  motionPref.reduce = false;
});

describe('<CompanionAvatar/>', () => {
  it.each(MOODS)('%s renders with its mood marker', (mood) => {
    const { container } = render(<CompanionAvatar mood={mood} />);
    expect(container.querySelector(`svg[data-mood="${mood}"]`)).not.toBeNull();
  });

  it('calm moods breathe and blink; concerned and alert are still', () => {
    for (const mood of MOODS) {
      const { container, unmount } = render(<CompanionAvatar mood={mood} />);
      const calm = mood === 'cheerful' || mood === 'neutral';
      expect(container.querySelector('[data-breathing="true"]') !== null).toBe(calm);
      expect(container.querySelector('[data-blinking="true"]') !== null).toBe(calm);
      unmount();
    }
  });

  it('reduced motion: no animation in any mood', () => {
    motionPref.reduce = true;
    for (const mood of MOODS) {
      const { container, unmount } = render(<CompanionAvatar mood={mood} />);
      expect(container.querySelector('svg')).toHaveAttribute('data-animated', 'false');
      expect(container.querySelector('[data-breathing="true"]')).toBeNull();
      expect(container.querySelector('[data-blinking="true"]')).toBeNull();
      unmount();
    }
  });
});

describe('<CompanionDock/>', () => {
  it.each([
    ['cheerful', 'On track'],
    ['neutral', 'Ready'],
    ['concerned', 'Reminder'],
    ['alert', 'Attention'],
  ] as const)('%s → icon + text label on the ≥104 px trigger', (mood, label) => {
    state.current = {
      mood,
      messageKey: 'routine.companion.tip',
      subjectKey: 'hazards.gravity.countermeasures',
    };
    renderDock();
    const trigger = screen.getByRole('button', { name: new RegExp(`Companion: ${label}`) });
    expect(trigger).toHaveAttribute('data-mood', mood);
    expect(trigger).toHaveClass('min-h-touch', 'min-w-touch');
    expect(within(trigger).getByText(label)).toBeInTheDocument();
  });

  it('opens the bubble; the action button navigates to the route and collapses', async () => {
    const user = userEvent.setup();
    state.current = {
      mood: 'concerned',
      messageKey: 'routine.companion.missedOne',
      params: { count: 1 },
      subjectKey: 'routine.task.sleepLog',
      action: { route: '/routine', labelKey: 'routine.companion.openRoutine' },
    };
    renderDock();
    await user.click(screen.getByRole('button', { name: /Companion: Reminder/ }));
    const bubble = await screen.findByRole('dialog');
    expect(within(bubble).getByText(/You missed: Log last night's sleep/)).toBeInTheDocument();
    const go = within(bubble).getByRole('button', { name: 'Open routine' });
    expect(go).toHaveClass('min-h-touch');
    await user.click(go);
    expect(screen.getByTestId('where')).toHaveTextContent('/routine');
    expect(useRoutineStore.getState().companionOpen).toBe(false);
  });

  it('announces the message politely even while collapsed', () => {
    renderDock();
    const live = screen.getByTestId('companion-live');
    expect(live).toHaveAttribute('aria-live', 'polite');
    expect(live).toHaveTextContent(/^Tip: Exercise every day/);
  });

  it('open / collapsed is persisted', async () => {
    const user = userEvent.setup();
    renderDock();
    await user.click(screen.getByRole('button', { name: /Companion/ }));
    expect(useRoutineStore.getState().companionOpen).toBe(true);
    expect(JSON.parse(localStorage.getItem(ROUTINE_STORE_KEY) ?? '{}').state.companionOpen).toBe(
      true,
    );
    await user.click(screen.getByRole('button', { name: 'Hide' }));
    expect(useRoutineStore.getState().companionOpen).toBe(false);
  });

  it('store v1 → v2 adds companionOpen = false', () => {
    expect(migrateRoutineState({ completions: [] }, 1)).toEqual({
      completions: [],
      companionOpen: false,
    });
  });
});
