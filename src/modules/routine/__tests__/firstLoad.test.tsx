import { act, render, renderHook } from '@testing-library/react';
import type { ReactNode } from 'react';
import { I18nextProvider } from 'react-i18next';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ENVIRONMENTS } from '@core/config/environments.config';
import { i18n } from '@core/i18n';
import { DEMO_CREW } from '@core/simulation';
import { useHealthStore } from '@core/store';
import { ToastProvider } from '@core/ui';
import {
  DemoRoutineSync,
  generateDemoCompletions,
  ReminderNotifier,
  useGamification,
  useReminders,
  useRoutineStore,
  type ReminderInstance,
} from '../index';

/** Same order as the app providers: bootstrap (inline below), sync, notifier. */
function Bootstrap() {
  const { measurements, demoLoadedAt, settings, loadDemoData } = useHealthStore.getState();
  if (settings.autoLoadDemo && measurements.length === 0 && demoLoadedAt === null) loadDemoData();
  return null;
}
function Shell({ children }: { children?: ReactNode }) {
  return (
    <I18nextProvider i18n={i18n}>
      <ToastProvider>
        <DemoRoutineSync />
        <ReminderNotifier />
        {children}
      </ToastProvider>
    </I18nextProvider>
  );
}

const toasts = () =>
  [...document.querySelectorAll('[role=status] > div')].map((d) => d.textContent ?? '');

/** Fresh device at `iso`: empty storage, demo loaded by the bootstrap on first render. */
const firstLoad = (iso: string) => {
  vi.setSystemTime(new Date(iso));
  localStorage.clear();
  useRoutineStore.getState().resetRoutine();
  useHealthStore.getState().resetAll();
  useHealthStore.setState({ demoLoadedAt: null, measurements: [] });
  // Like the app: the notifier's first effect sees the empty store, then the demo arrives.
  const view = render(<Shell />);
  act(() => {
    render(<Bootstrap />);
  });
  return view;
};

const todayOf = (crewId: string): ReminderInstance[] =>
  renderHook(() => useReminders(crewId)).result.current.reminders;
const missedIds = (crewId: string) =>
  todayOf(crewId)
    .filter((r) => r.status === 'missed')
    .map((r) => r.template.id)
    .sort();

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date', 'setInterval', 'clearInterval'] });
});
afterEach(() => vi.useRealTimers());

describe('generateDemoCompletions', () => {
  const start = '2026-11-01T00:00:00.000Z';
  const schedule = ENVIRONMENTS.iss.reminderSchedule;

  it('ticks every manual task on time up to now; Kenji skips the last 2 days (mixed_mission)', () => {
    const now = new Date('2026-11-29T23:00:00.000Z'); // day 29: weekly summary day
    const out = generateDemoCompletions({
      schedule,
      missionStart: start,
      now,
      crew: DEMO_CREW,
      scenario: 'mixed_mission',
    });
    const of = (id: string) => out.filter((c) => c.crewId === id).map((c) => c.missionDay);
    expect(of('crew-1')).toEqual([1, 1, 1, 8, 15, 22, 29]); // weekly ×5, monthly exam + survey on day 1
    expect(of('crew-2')).toEqual([1, 1, 1, 8, 15, 22]); // ill on days 28–29
    expect(out.every((c) => Date.parse(c.at) <= now.getTime())).toBe(true);
  });

  it('nothing in the future; other scenarios: everyone complete', () => {
    const out = generateDemoCompletions({
      schedule,
      missionStart: start,
      now: new Date('2026-11-29T10:05:00.000Z'), // before 10:00 + 10 min
      crew: DEMO_CREW,
      scenario: 'nominal',
    });
    expect(out.some((c) => c.missionDay === 29)).toBe(false);
    expect(out.filter((c) => c.crewId === 'crew-2').length).toBe(7 - 1);
  });
});

describe('first load on a fresh device (default demo)', () => {
  it.each(['09:00', '14:59', '19:45', '23:30'])(
    'day 30 %s: no burst of toasts; Mira has nothing missed; others only their story',
    (hhmm) => {
      firstLoad(`2026-11-30T${hhmm}:00.000Z`);
      expect(toasts()).toEqual([]);
      expect(missedIds('crew-1')).toEqual([]);
      expect(missedIds('crew-3')).toEqual([]);
      expect(missedIds('crew-4')).toEqual([]);
      // Kenji (ill, last 2 days): exercise 17:30 and mood 21:00 once their grace window is over
      const kenji = {
        '09:00': [],
        '14:59': [],
        '19:45': ['exercise'],
        '23:30': ['evening-mood', 'exercise'],
      };
      expect(missedIds('crew-2')).toEqual(kenji[hhmm as keyof typeof kenji]);
    },
  );

  it('weekly summary day (day 29 of 29): Mira ticked it, Kenji (ill) did not', () => {
    vi.setSystemTime(new Date('2026-11-29T14:59:00.000Z'));
    localStorage.clear();
    useRoutineStore.getState().resetRoutine();
    useHealthStore.getState().resetAll();
    useHealthStore.getState().updateSettings({ historyDays: 29 });
    useHealthStore.setState({ demoLoadedAt: null, measurements: [] });
    render(<Shell />);
    act(() => {
      render(<Bootstrap />);
    });
    expect(toasts()).toEqual([]);
    expect(missedIds('crew-1')).toEqual([]);
    expect(missedIds('crew-2')).toEqual(['weekly-health-summary']);
  });

  it('XP / streak table of DEMO_CREW_STORIES.md (day 30, 23:30, manual tasks included)', () => {
    firstLoad('2026-11-30T23:30:00.000Z');
    const row = (id: string) => {
      const g = renderHook(() => useGamification(id)).result.current;
      return [g.xp, g.level, g.streakDays, g.longestStreak];
    };
    expect(['crew-1', 'crew-2', 'crew-3', 'crew-4'].map(row)).toEqual([
      [3080, 5, 30, 30],
      [3005, 5, 0, 28],
      [3050, 5, 2, 21],
      [3060, 5, 3, 24],
    ]);
  });

  it('during the session, a task that becomes due IS announced (once)', () => {
    firstLoad('2026-11-30T16:20:00.000Z'); // exercise 17:30 opens at 16:30
    expect(toasts()).toEqual([]);
    vi.setSystemTime(new Date('2026-11-30T16:31:00.000Z'));
    act(() => {
      vi.advanceTimersByTime(60_000); // the reminder ticker (useNow 60 s)
    });
    expect(toasts()).toEqual(['Time for: Exercise session.']);
  });

  it('switching astronaut does not dump that person’s past tasks as toasts', () => {
    firstLoad('2026-11-30T23:30:00.000Z');
    act(() => useHealthStore.getState().setSelectedCrew('crew-2'));
    expect(toasts()).toEqual([]);
  });
});
