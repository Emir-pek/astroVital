import { act, renderHook, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ENVIRONMENTS } from '@core/config/environments.config';
import { DEMO_CREW, generateHistory } from '@core/simulation';
import { useHealthStore } from '@core/store';
import type { Measurement, ReminderTemplate } from '@core/types';
import { renderWithProviders } from '@test/renderWithProviders';
import { MissionBoard, useGamification, useRoutineStore } from '../index';
import {
  computeBadges,
  computeTeamScore,
  computeXp,
  currentStreak,
  longestStreak,
} from '../services/gamification';
import { expandRange, type ReminderInstance } from '../services/reminderEngine';

const START = '2026-11-01T00:00:00.000Z';

const inst = (
  missionDay: number,
  status: ReminderInstance['status'],
  over: Partial<ReminderTemplate> = {},
  crewId = 'a',
): ReminderInstance => {
  const template: ReminderTemplate = {
    id: over.id ?? 'morning-hr',
    taskKey: 'x',
    timeOfDayMET: '06:30',
    repeat: 'daily',
    metric: 'heartRate',
    ...over,
  };
  return {
    id: `${crewId}:${template.id}:${missionDay}:0`,
    crewId,
    template,
    missionDay,
    occurrence: 0,
    dueAt: START,
    status,
  };
};

describe('computeXp', () => {
  it('done 10, late 5, missed/due/upcoming 0, daily mission 5', () => {
    const list = [
      inst(1, 'done'),
      inst(1, 'late'),
      inst(1, 'missed'),
      inst(2, 'due'),
      inst(2, 'upcoming'),
    ];
    expect(computeXp(list, [{ missionId: 'hydration', missionDay: 1 }])).toBe(10 + 5 + 5);
  });

  it('manual completion counts like a measurement (10)', () => {
    expect(
      computeXp([inst(1, 'done', { id: 'weekly-health-summary', metric: undefined })], []),
    ).toBe(10);
  });
});

describe('streaks', () => {
  it('counts consecutive kept days; a missed day breaks it', () => {
    const list = [inst(1, 'done'), inst(2, 'missed'), inst(3, 'done'), inst(4, 'late')];
    expect(currentStreak(list, 4)).toBe(2);
    expect(longestStreak(list, 4)).toBe(2);
  });

  it('today still open neither counts nor breaks', () => {
    expect(currentStreak([inst(1, 'done'), inst(2, 'done'), inst(3, 'due')], 3)).toBe(2);
    expect(currentStreak([inst(1, 'done'), inst(2, 'done'), inst(3, 'missed')], 3)).toBe(0);
  });

  it('rest day (no exercise instance) does not break; manual tasks are ignored', () => {
    const ex = { id: 'exercise', metric: 'exerciseMinutes' as const, restEveryNDays: 7 };
    const list = [
      inst(6, 'done', ex),
      inst(6, 'done'),
      inst(7, 'done'), // rest day: only the heart rate task exists
      inst(7, 'missed', { id: 'weekly-health-summary', metric: undefined }),
      inst(8, 'done', ex),
      inst(8, 'done'),
    ];
    expect(currentStreak(list, 8)).toBe(3);
  });
});

describe('badges', () => {
  const days = (n: number, status: ReminderInstance['status'] = 'done') =>
    Array.from({ length: n }, (_, i) => inst(i + 1, status));

  it('streak-7 and streak-30 stay earned once reached', () => {
    expect(computeBadges(days(6), [], 6)).toEqual([]);
    expect(computeBadges([...days(7), inst(8, 'missed')], [], 8)).toEqual(['streak-7']);
    expect(computeBadges(days(30), [], 30)).toEqual(['streak-7', 'streak-30']);
  });

  it('exercise-week needs all 6 planned sessions of one mission week', () => {
    const ex = (d: number, s: ReminderInstance['status']) =>
      inst(d, s, { id: 'exercise', metric: 'exerciseMinutes' });
    const full = [1, 2, 3, 4, 5, 6].map((d) => ex(d, 'done'));
    expect(computeBadges(full, [], 7)).toContain('exercise-week');
    expect(computeBadges([...full.slice(0, 5), ex(6, 'missed')], [], 7)).not.toContain(
      'exercise-week',
    );
  });

  it('monthly-exam-done and crew-player', () => {
    const exam = inst(1, 'late', { id: 'monthly-health-exam', metric: undefined });
    const chats = [1, 2, 3, 4, 5].map((d) => ({ missionId: 'crew-chat', missionDay: d }));
    expect(computeBadges([exam], chats, 5)).toEqual(['monthly-exam-done', 'crew-player']);
    expect(computeBadges([], chats.slice(0, 4), 5)).toEqual([]);
  });
});

describe('computeTeamScore', () => {
  it('last 7 days, whole crew, metric tasks, open tasks left out', () => {
    const list = [
      inst(1, 'missed'), // outside window (today 8 → days 2..8)
      inst(2, 'done', {}, 'a'),
      inst(2, 'missed', {}, 'b'),
      inst(8, 'late', {}, 'a'),
      inst(8, 'due', {}, 'b'),
      inst(8, 'done', { id: 'weekly-health-summary', metric: undefined }, 'b'),
    ];
    expect(computeTeamScore(list, 8)).toBe(67); // 2 of 3
    expect(computeTeamScore([], 8)).toBe(0);
  });
});

describe('value independence (ADR-050)', () => {
  it('changing measurement VALUES with the same timestamps changes no XP, streak or badge', () => {
    const end = new Date('2026-11-30T20:00:00.000Z');
    const env = ENVIRONMENTS.iss;
    const real = generateHistory({
      seed: 2026,
      crew: DEMO_CREW,
      environment: env,
      scenario: 'mixed_mission',
      days: 30,
      end,
    });
    const tampered: Measurement[] = real.map((m, i) => ({
      ...m,
      value: i % 2 === 0 ? m.value * 3 + 50 : -m.value,
    }));
    const summary = (ms: Measurement[]) => {
      const all = expandRange(
        {
          schedule: env.reminderSchedule,
          missionStart: START,
          now: end,
          measurements: ms,
          crew: DEMO_CREW,
          completions: [],
        },
        1,
        30,
      );
      return DEMO_CREW.map((c) => {
        const mine = all.filter((r) => r.crewId === c.id);
        return [
          computeXp(mine, []),
          currentStreak(mine, 30),
          longestStreak(mine, 30),
          computeBadges(mine, [], 30),
        ];
      }).concat([[computeTeamScore(all, 30)]]);
    };
    const baseline = summary(real);
    expect(baseline[0]?.[0]).toBeGreaterThan(0); // not a trivially empty comparison
    expect(summary(tampered)).toEqual(baseline);
  });
});

describe('useGamification / <MissionBoard/>', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date('2026-11-03T12:00:00.000Z')); // mission day 3
    const s = useHealthStore.getState();
    s.resetAll();
    s.setActiveEnvironment('iss');
    s.updateSettings({ missionStart: START });
    useRoutineStore.getState().resetRoutine();
  });
  afterEach(() => vi.useRealTimers());

  it('a daily mission gives XP once per day — clicking again cannot inflate it', () => {
    const { result } = renderHook(() => useGamification());
    const before = result.current.xp;
    let first = false;
    let second = true;
    act(() => {
      first = result.current.completeMission('hydration');
    });
    act(() => {
      second = result.current.completeMission('hydration');
    });
    expect([first, second]).toEqual([true, false]);
    expect(result.current.xp).toBe(before + 5);
    expect(result.current.completeMission('not-a-mission')).toBe(false);
  });

  it('defaults to the signed-in astronaut; team score is always the whole crew', () => {
    const [a, b] = useHealthStore.getState().crew.map((c) => c.id) as [string, string];
    useHealthStore.getState().setSelectedCrew(a);
    const { result, rerender } = renderHook(() => useGamification());
    expect(result.current.crewId).toBe(a);
    const team = result.current.teamScore;
    act(() => useHealthStore.getState().setSelectedCrew(b));
    rerender();
    expect(result.current.crewId).toBe(b);
    expect(result.current.teamScore).toBe(team);
  });

  it('MissionBoard shows the adherence rule and ticks a mission', async () => {
    const user = userEvent.setup();
    renderWithProviders(<MissionBoard />);
    expect(screen.getByText(/never how good a value is/)).toBeInTheDocument();
    const buttons = screen.getAllByRole('button', { name: 'Mark done' });
    expect(buttons).toHaveLength(4);
    await user.click(buttons[0] as HTMLElement);
    expect(screen.getByText('Done today')).toBeInTheDocument();
  });
});
