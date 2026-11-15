import { act, renderHook, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useHealthStore } from '@core/store';
import { renderWithProviders } from '@test/renderWithProviders';
import { ReminderCenter, useReminders, useRoutineStore } from '../index';

const START = '2026-11-01T00:00:00.000Z';
const day = (d: number, hhmm: string) =>
  new Date(
    Date.parse(START) +
      (d - 1) * 86_400_000 +
      (Number(hhmm.slice(0, 2)) * 60 + Number(hhmm.slice(3))) * 60_000,
  );

const setup = (now: Date) => {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(now);
  const s = useHealthStore.getState();
  s.resetAll();
  s.setActiveEnvironment('iss');
  s.updateSettings({ missionStart: START });
  useRoutineStore.getState().resetRoutine();
  return s.crew.map((c) => c.id);
};

afterEach(() => vi.useRealTimers());

describe('useReminders', () => {
  let ids: string[] = [];
  beforeEach(() => {
    ids = setup(day(3, '06:40'));
  });

  it('defaults to the signed-in astronaut and follows the crew picker', () => {
    const [first, second] = ids as [string, string];
    useHealthStore.getState().setSelectedCrew(first);
    useHealthStore.getState().addMeasurement({
      crewId: first,
      metric: 'heartRate',
      value: 60,
      timestamp: day(3, '06:35').toISOString(),
      source: 'keyboard',
      environment: 'iss',
    });
    const { result, rerender } = renderHook(() => useReminders());
    expect(result.current.crewId).toBe(first);
    expect(result.current.reminders.every((r) => r.crewId === first)).toBe(true);
    expect(result.current.reminders.find((r) => r.template.id === 'morning-hr')?.status).toBe(
      'done',
    );

    act(() => useHealthStore.getState().setSelectedCrew(second));
    rerender();
    expect(result.current.crewId).toBe(second);
    expect(result.current.reminders.find((r) => r.template.id === 'morning-hr')?.status).toBe(
      'due',
    );
  });

  it('byCrew covers the whole crew with task status only', () => {
    const { result } = renderHook(() => useReminders());
    expect(Object.keys(result.current.byCrew).sort()).toEqual([...ids].sort());
    const sample = result.current.byCrew[ids[0] ?? '']?.[0];
    expect(sample).toBeDefined();
    expect(sample).not.toHaveProperty('value');
  });

  it('counts missed reminders', () => {
    vi.setSystemTime(day(3, '08:20')); // sleep-log 06:15 + 120 min passed
    const { result } = renderHook(() => useReminders(ids[0]));
    expect(result.current.missed.map((r) => r.template.id)).toEqual(['sleep-log']);
    expect(result.current.missedCount).toBe(1);
  });

  it('follows the active environment schedule', () => {
    const { result, rerender } = renderHook(() => useReminders(ids[0]));
    expect(result.current.reminders.some((r) => r.template.id === 'evening-hr')).toBe(true);
    act(() => useHealthStore.getState().setActiveEnvironment('lunar_base'));
    rerender();
    expect(result.current.reminders.some((r) => r.template.id === 'evening-hr')).toBe(false);
  });

  it('completeTask only marks an open task without a metric', () => {
    vi.setSystemTime(day(8, '10:10'));
    const { result } = renderHook(() => useReminders(ids[0]));
    expect(result.current.completeTask(ids[0] ?? '', 'morning-hr')).toBe(false);
    let ok = false;
    act(() => {
      ok = result.current.completeTask(ids[0] ?? '', 'weekly-health-summary');
    });
    expect(ok).toBe(true);
    expect(useRoutineStore.getState().completions).toHaveLength(1);
    expect(
      result.current.reminders.find((r) => r.template.id === 'weekly-health-summary')?.status,
    ).toBe('done');
    expect(result.current.completeTask(ids[0] ?? '', 'weekly-health-summary')).toBe(false);
  });
});

describe('<ReminderCenter/>', () => {
  it('lists the signed-in astronaut’s tasks with text status; manual task can be ticked', async () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    const ids = setup(day(8, '10:10'));
    const user = userEvent.setup();
    useHealthStore.getState().setSelectedCrew(ids[0] ?? null);
    renderWithProviders(<ReminderCenter />);

    const item = screen.getByText(/Weekly health summary/).closest('li');
    expect(item).not.toBeNull();
    const row = within(item as HTMLElement);
    expect(row.getByText('Due now')).toBeInTheDocument();
    await user.click(row.getByRole('button', { name: 'Mark as done' }));
    expect(row.getByText('Done')).toBeInTheDocument();
    expect(screen.getAllByText('Missed').length).toBeGreaterThan(0);
  });
});
