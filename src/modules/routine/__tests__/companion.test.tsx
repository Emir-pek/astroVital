import { renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { i18n } from '@core/i18n';
import { useHealthStore } from '@core/store';
import type { CrewHealthSummary, ReminderTemplate, Status } from '@core/types';
import {
  COMPANION_TIP_KEYS,
  decideCompanion,
  formatCompanionMessage,
  tipKeyFor,
  type CompanionInput,
} from '../services/companion';
import type { ReminderInstance } from '../services/reminderEngine';

/** Overall status per crew id used by the mocked assessment engine (default: nominal = stub). */
const overallByCrew = vi.hoisted(() => new Map<string, Status>());
vi.mock('@modules/assessment', () => ({
  useCrewHealth: (crewId: string) =>
    ({
      crewId,
      overall: overallByCrew.get(crewId) ?? 'nominal',
      escalation: 'self_care',
      regions: [],
      assessments: [],
      generatedAt: '2026-11-03T00:00:00.000Z',
    }) satisfies CrewHealthSummary as CrewHealthSummary,
}));

// Imported after the mock is registered.
const { useCompanion } = await import('../hooks/useCompanion');
const { useRoutineStore } = await import('../store/useRoutineStore');

const r = (
  status: ReminderInstance['status'],
  over: Partial<ReminderTemplate> = {},
): ReminderInstance => ({
  id: `a:${over.id ?? 'morning-hr'}:3:0`,
  crewId: 'a',
  template: {
    id: 'morning-hr',
    metric: 'heartRate',
    taskKey: 'routine.task.restingHeartRate',
    timeOfDayMET: '06:30',
    repeat: 'daily',
    ...over,
  },
  missionDay: 3,
  occurrence: 0,
  dueAt: '2026-11-03T06:30:00.000Z',
  status,
});

const base: CompanionInput = {
  crewId: 'a',
  missionDay: 3,
  overall: 'nominal',
  reminders: [],
  streakDays: 3,
  newBadges: [],
};

describe('decideCompanion priority', () => {
  it('(1) warning beats everything → alert with a route to the status screen', () => {
    const c = decideCompanion({
      ...base,
      overall: 'warning',
      reminders: [r('missed'), r('due')],
      newBadges: ['streak-7'],
      streakDays: 7,
    });
    expect(c).toMatchObject({ mood: 'alert', action: { route: '/' } });
  });

  it.each<Status>(['nominal', 'advisory', 'caution'])('%s is not an alert', (overall) => {
    expect(decideCompanion({ ...base, overall }).mood).not.toBe('alert');
  });

  it('(2) missed → concerned, gentle, links to routine', () => {
    const one = decideCompanion({ ...base, reminders: [r('missed'), r('due')] });
    expect(one).toMatchObject({
      mood: 'concerned',
      messageKey: 'routine.companion.missedOne',
      subjectKey: 'routine.task.restingHeartRate',
      action: { route: '/routine' },
    });
    const many = decideCompanion({ ...base, reminders: [r('missed'), r('missed')] });
    expect(many).toMatchObject({
      messageKey: 'routine.companion.missedMany',
      params: { count: 2 },
    });
  });

  it('(3) due → neutral "time for X"; measurement tasks link to /measure', () => {
    expect(decideCompanion({ ...base, reminders: [r('done'), r('due')] })).toMatchObject({
      mood: 'neutral',
      messageKey: 'routine.companion.due',
      action: { route: '/measure' },
    });
    expect(
      decideCompanion({ ...base, reminders: [r('due', { id: 'weekly', metric: undefined })] })
        .action?.route,
    ).toBe('/routine');
  });

  it('(4) badge earned today or streak milestone → cheerful', () => {
    expect(decideCompanion({ ...base, newBadges: ['crew-player'] })).toMatchObject({
      mood: 'cheerful',
      subjectKey: 'routine.badges.crewPlayer.name',
    });
    expect(decideCompanion({ ...base, streakDays: 7 })).toMatchObject({
      mood: 'cheerful',
      params: { count: 7 },
    });
    expect(decideCompanion({ ...base, streakDays: 8 }).mood).toBe('neutral');
  });

  it('(5) otherwise a neutral tip from Learn content, deterministic per day and person', () => {
    const c = decideCompanion(base);
    expect(c.mood).toBe('neutral');
    expect(COMPANION_TIP_KEYS).toContain(c.subjectKey);
    expect(decideCompanion(base)).toEqual(c);
    const days = new Set(Array.from({ length: 5 }, (_, d) => tipKeyFor('a', d + 1)));
    expect(days.size).toBe(COMPANION_TIP_KEYS.length); // rotates through every tip
  });

  it('formats messages in plain language with no diagnosis words', () => {
    const t = i18n.getFixedT('en');
    const text = formatCompanionMessage(t, decideCompanion({ ...base, reminders: [r('missed')] }));
    expect(text).toBe(
      'You missed: Resting heart rate. No stress — do it when you can and record it.',
    );
    for (const lang of ['en', 'tr'] as const) {
      const all = JSON.stringify(i18n.getResourceBundle(lang, 'translation').routine.companion);
      expect(all).not.toMatch(
        /diagnos(is|ed)|you have [a-z]+ (disease|infection)|teşhis(in| edildi)/i,
      );
    }
  });
});

describe('useCompanion', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date('2026-11-03T12:00:00.000Z'));
    overallByCrew.clear();
    const s = useHealthStore.getState();
    s.resetAll();
    s.setActiveEnvironment('iss');
    s.updateSettings({ missionStart: '2026-11-01T00:00:00.000Z' });
    useRoutineStore.getState().resetRoutine();
  });
  afterEach(() => vi.useRealTimers());

  it('engine stub (always nominal) → never alert', () => {
    const { result } = renderHook(() => useCompanion());
    expect(result.current.mood).not.toBe('alert');
  });

  it("another astronaut's warning never leaks into the signed-in astronaut's companion", () => {
    const [a, b] = useHealthStore.getState().crew.map((c) => c.id) as [string, string];
    useHealthStore.getState().setSelectedCrew(a);
    overallByCrew.set(b, 'warning');
    const { result } = renderHook(() => useCompanion());
    expect(result.current.mood).not.toBe('alert');

    overallByCrew.set(a, 'warning');
    const { result: mine } = renderHook(() => useCompanion());
    expect(mine.current.mood).toBe('alert');
  });

  it("another astronaut's measurements do not change my reminders message", () => {
    const [a, b] = useHealthStore.getState().crew.map((c) => c.id) as [string, string];
    useHealthStore.getState().setSelectedCrew(a);
    const { result: before } = renderHook(() => useCompanion());
    useHealthStore.getState().addMeasurement({
      crewId: b,
      metric: 'heartRate',
      value: 190,
      timestamp: '2026-11-03T06:35:00.000Z',
      source: 'keyboard',
      environment: 'iss',
    });
    const { result: after } = renderHook(() => useCompanion());
    expect(after.current).toEqual(before.current);
  });
});
