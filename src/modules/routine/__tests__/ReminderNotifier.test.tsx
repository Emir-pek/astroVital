import { act, renderHook, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useHealthStore } from '@core/store';
import { renderWithProviders } from '@test/renderWithProviders';
import { ReminderNotifier, useNotificationSettings, useRoutineStore } from '../index';
import { notifyKey, pendingAnnouncements } from '../services/notifications';
import type { ReminderInstance } from '../services/reminderEngine';

const START = '2026-11-01T00:00:00.000Z';
const day = (d: number, hhmm: string) =>
  new Date(
    Date.parse(START) +
      (d - 1) * 86_400_000 +
      (Number(hhmm.slice(0, 2)) * 60 + Number(hhmm.slice(3))) * 60_000,
  );

const notificationSpy = vi.fn();
class FakeNotification {
  static permission: NotificationPermission = 'granted';
  static requestPermission = vi.fn(() => Promise.resolve(FakeNotification.permission));
  constructor(title: string, options?: NotificationOptions) {
    notificationSpy(title, options);
  }
}

let ids: string[] = [];

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date', 'setInterval', 'clearInterval'] });
  vi.setSystemTime(day(3, '05:00')); // nothing due yet (sleep-log opens 05:15)
  vi.stubGlobal('Notification', FakeNotification);
  notificationSpy.mockClear();
  const s = useHealthStore.getState();
  s.resetAll();
  s.setActiveEnvironment('iss');
  s.updateSettings({ missionStart: START });
  useRoutineStore.getState().resetRoutine();
  ids = s.crew.map((c) => c.id);
  s.setSelectedCrew(ids[0] ?? null);
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

describe('pendingAnnouncements', () => {
  const r = (id: string, status: ReminderInstance['status']) =>
    ({ id, status }) as unknown as ReminderInstance;

  it('returns due and missed items not yet announced', () => {
    const list = [r('a', 'due'), r('b', 'missed'), r('c', 'done'), r('d', 'upcoming')];
    expect(pendingAnnouncements(list, [notifyKey(r('a', 'due'))])).toEqual({
      due: [],
      missed: [list[1]],
    });
  });

  it('an item announced as due is announced again once when it becomes missed', () => {
    expect(pendingAnnouncements([r('a', 'missed')], ['a#due']).missed).toHaveLength(1);
  });
});

describe('useNotificationSettings', () => {
  it('enables only after the browser grants permission; disabling never prompts', async () => {
    FakeNotification.permission = 'default';
    FakeNotification.requestPermission.mockImplementationOnce(() => Promise.resolve('denied'));
    const { result } = renderHook(() => useNotificationSettings());
    await act(async () => {
      await result.current.setEnabled(true);
    });
    expect(result.current.enabled).toBe(false);
    expect(result.current.permission).toBe('denied');

    FakeNotification.requestPermission.mockImplementationOnce(() => Promise.resolve('granted'));
    await act(async () => {
      await result.current.setEnabled(true);
    });
    expect(result.current.enabled).toBe(true);

    FakeNotification.requestPermission.mockClear();
    await act(async () => {
      await result.current.setEnabled(false);
    });
    expect(result.current.enabled).toBe(false);
    expect(FakeNotification.requestPermission).not.toHaveBeenCalled();
    FakeNotification.permission = 'granted';
  });
});

/** Moves the clock and fires the shared minute ticker (useNow 60 s). */
const advanceTo = (when: Date) => {
  vi.setSystemTime(when);
  act(() => {
    vi.advanceTimersByTime(60_000);
  });
};

describe('<ReminderNotifier/>', () => {
  it('announces once (one grouped toast) when tasks open during the session; never again after re-mount', () => {
    const first = renderWithProviders(<ReminderNotifier />); // 05:00, nothing due
    expect(screen.queryByText(/tasks are due now/)).toBeNull();
    advanceTo(day(3, '06:40')); // sleep-log + 6 morning vitals open
    expect(screen.getAllByText(/tasks are due now/)).toHaveLength(1);
    const keys = useRoutineStore.getState().notifiedIds[ids[0] ?? ''] ?? [];
    expect(keys.length).toBeGreaterThan(1);
    first.unmount();

    renderWithProviders(<ReminderNotifier />);
    expect(screen.queryByText(/tasks are due now/)).toBeNull();
  });

  it('opening the app when tasks are already due/missed: no burst, marked as seen', () => {
    vi.setSystemTime(day(3, '09:00')); // morning tasks missed, nothing new
    renderWithProviders(<ReminderNotifier />);
    expect(screen.queryByText(/missed|due now/)).toBeNull();
    expect(useRoutineStore.getState().notifiedIds[ids[0] ?? '']?.length).toBeGreaterThan(0);
  });

  it('never announces another astronaut’s tasks', () => {
    renderWithProviders(<ReminderNotifier />);
    advanceTo(day(3, '06:40'));
    expect(Object.keys(useRoutineStore.getState().notifiedIds)).toEqual([ids[0]]);
  });

  it('switching the crew picker: the other person’s past tasks are not dumped; switching back repeats nothing', () => {
    renderWithProviders(<ReminderNotifier />);
    advanceTo(day(3, '06:40'));
    const [a, b] = ids as [string, string];
    act(() => useHealthStore.getState().setSelectedCrew(b));
    expect(Object.keys(useRoutineStore.getState().notifiedIds).sort()).toEqual([a, b].sort());
    const before = useRoutineStore.getState().notifiedIds[a]?.length;
    act(() => useHealthStore.getState().setSelectedCrew(a));
    expect(useRoutineStore.getState().notifiedIds[a]?.length).toBe(before);
    expect(screen.getAllByText(/tasks are due now/)).toHaveLength(1); // only a's, during the session
  });

  it('no browser notification while the user switch is off', () => {
    renderWithProviders(<ReminderNotifier />);
    advanceTo(day(3, '06:40'));
    expect(notificationSpy).not.toHaveBeenCalled();
  });

  it('browser notification when switched on and permission granted', () => {
    useRoutineStore.getState().setNotificationsEnabled(true);
    renderWithProviders(<ReminderNotifier />);
    advanceTo(day(3, '06:40'));
    expect(notificationSpy).toHaveBeenCalledTimes(1);
    expect(notificationSpy.mock.calls[0]?.[0]).toBe('AstroVital reminder');
  });

  it('no browser notification when permission is denied, even if switched on', () => {
    FakeNotification.permission = 'denied';
    useRoutineStore.getState().setNotificationsEnabled(true);
    renderWithProviders(<ReminderNotifier />);
    advanceTo(day(3, '06:40'));
    expect(notificationSpy).not.toHaveBeenCalled();
    FakeNotification.permission = 'granted';
  });
});
