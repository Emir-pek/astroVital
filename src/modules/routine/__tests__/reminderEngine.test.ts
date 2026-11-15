import { describe, expect, it } from 'vitest';
import { ENVIRONMENTS } from '@core/config/environments.config';
import type { Measurement, MetricId, ReminderTemplate } from '@core/types';
import { DUE_GRACE_MIN, EARLY_WINDOW_MIN } from '../services/reminderConfig';
import {
  expandRange,
  expandReminders,
  type ExpandRemindersInput,
  type ReminderInstance,
  type TaskCompletion,
} from '../services/reminderEngine';

const START = '2026-11-01T00:00:00.000Z'; // mission day 1
const A = 'crew-a';
const B = 'crew-b';

const tpl = (over: Partial<ReminderTemplate> & { id: string }): ReminderTemplate => ({
  taskKey: `routine.task.${over.id}`,
  timeOfDayMET: '06:30',
  repeat: 'daily',
  ...over,
});

const MORNING_HR = tpl({ id: 'morning-hr', metric: 'heartRate', timeOfDayMET: '06:30' });
const EVENING_HR = tpl({ id: 'evening-hr', metric: 'heartRate', timeOfDayMET: '19:30' });
const EXERCISE = tpl({
  id: 'exercise',
  metric: 'exerciseMinutes',
  timeOfDayMET: '17:30',
  restEveryNDays: 7,
});
const WEEKLY = tpl({ id: 'weekly-health-summary', timeOfDayMET: '10:00', repeat: 'weekly' });
const MONTHLY = tpl({ id: 'monthly-health-exam', timeOfDayMET: '10:00', repeat: 'monthly' });
const ROVER_HR = tpl({
  id: 'rover-hr',
  metric: 'heartRate',
  timeOfDayMET: '08:00',
  repeat: 'twice_daily',
});

/** ISO time on mission day `day` at "HH:MM" (+ optional seconds). */
const at = (day: number, hhmm: string, sec = 0): string => {
  const [h, m] = hhmm.split(':').map(Number);
  return new Date(
    Date.parse(START) + (day - 1) * 86_400_000 + ((h ?? 0) * 60 + (m ?? 0)) * 60_000 + sec * 1000,
  ).toISOString();
};

let seq = 0;
const meas = (crewId: string, metric: MetricId, timestamp: string, value = 60): Measurement => ({
  id: `m${seq++}`,
  crewId,
  metric,
  value,
  timestamp,
  source: 'keyboard',
  environment: 'iss',
});

const run = (
  now: string,
  {
    schedule = [MORNING_HR],
    measurements = [],
    completions = [],
    crew = [{ id: A }],
  }: Partial<Omit<ExpandRemindersInput, 'now' | 'missionStart'>> = {},
): ReminderInstance[] =>
  expandReminders({
    schedule,
    missionStart: START,
    now: new Date(now),
    measurements,
    completions,
    crew,
  });

const statusOf = (list: ReminderInstance[], templateId: string, crewId = A, occ = 0) =>
  list.find((r) => r.template.id === templateId && r.crewId === crewId && r.occurrence === occ)
    ?.status;

describe('window constants', () => {
  it('match the ADR-049 rules', () => {
    expect(EARLY_WINDOW_MIN).toBe(60);
    expect(DUE_GRACE_MIN).toBe(120);
  });
});

describe('status without a measurement (due 06:30 on day 3)', () => {
  it.each([
    ['05:29', 'upcoming'], // −61 min
    ['05:30', 'due'], // −60 min
    ['06:30', 'due'],
    ['08:30', 'due'], // +120 min
    ['08:31', 'missed'], // +121 min
    ['23:59', 'missed'],
  ])('now %s → %s', (now, expected) => {
    expect(statusOf(run(at(3, now)), 'morning-hr')).toBe(expected);
  });
});

describe('status with a measurement (now = 23:59 on day 3)', () => {
  it.each([
    ['05:29', 'missed'], // before the early window: does not count
    ['05:30', 'done'], // −60 min
    ['08:30', 'done'], // +120 min
    ['08:31', 'late'], // +121 min
    ['23:59', 'late'], // still today
  ])('measured %s → %s', (measured, expected) => {
    const list = run(at(3, '23:59', 30), {
      measurements: [meas(A, 'heartRate', at(3, measured))],
    });
    expect(statusOf(list, 'morning-hr')).toBe(expected);
  });

  it('a measurement after midnight belongs to the next day (yesterday stays missed)', () => {
    const list = expandRange(
      {
        schedule: [MORNING_HR],
        missionStart: START,
        now: new Date(at(4, '00:10')),
        measurements: [meas(A, 'heartRate', at(4, '00:00', 1))],
        completions: [],
        crew: [{ id: A }],
      },
      3,
      3,
    );
    expect(list[0]?.status).toBe('missed');
  });

  it('ignores measurements after now', () => {
    const list = run(at(3, '06:00'), { measurements: [meas(A, 'heartRate', at(3, '06:40'))] });
    expect(statusOf(list, 'morning-hr')).toBe('due');
  });

  it('records when and how the task was satisfied', () => {
    const [r] = run(at(3, '07:00'), { measurements: [meas(A, 'heartRate', at(3, '06:35'))] });
    expect(r).toMatchObject({
      id: `${A}:morning-hr:3:0`,
      missionDay: 3,
      dueAt: at(3, '06:30'),
      completedAt: at(3, '06:35'),
      completedBy: 'measurement',
    });
  });
});

describe('schedule days', () => {
  const ids = (day: number, schedule: ReminderTemplate[]) =>
    run(at(day, '12:00'), { schedule }).map((r) => r.template.id);

  it('rest day: no exercise on day 7 and 14, back on day 8', () => {
    expect(ids(7, [EXERCISE])).toEqual([]);
    expect(ids(14, [EXERCISE])).toEqual([]);
    expect(ids(8, [EXERCISE])).toEqual(['exercise']);
  });

  it('weekly on days 1, 8, 15 …; monthly on days 1, 31 …', () => {
    expect(ids(8, [WEEKLY])).toEqual(['weekly-health-summary']);
    expect(ids(9, [WEEKLY])).toEqual([]);
    expect(ids(31, [MONTHLY])).toEqual(['monthly-health-exam']);
    expect(ids(30, [MONTHLY])).toEqual([]);
  });

  it('nothing before the mission starts', () => {
    expect(run('2026-10-31T12:00:00.000Z')).toEqual([]);
  });

  it('twice_daily: second slot 12 h later, own id', () => {
    const list = run(at(2, '07:00'), { schedule: [ROVER_HR] });
    expect(list.map((r) => [r.id, r.dueAt])).toEqual([
      [`${A}:rover-hr:2:0`, at(2, '08:00')],
      [`${A}:rover-hr:2:1`, at(2, '20:00')],
    ]);
  });
});

describe('same metric twice a day (morning / evening heart rate)', () => {
  const schedule = [MORNING_HR, EVENING_HR];

  it('one measurement each → both done', () => {
    const list = run(at(3, '21:00'), {
      schedule,
      measurements: [meas(A, 'heartRate', at(3, '06:35')), meas(A, 'heartRate', at(3, '19:25'))],
    });
    expect(statusOf(list, 'morning-hr')).toBe('done');
    expect(statusOf(list, 'evening-hr')).toBe('done');
  });

  it('only a morning measurement → evening missed, not stolen', () => {
    const list = run(at(3, '21:40'), {
      schedule,
      measurements: [meas(A, 'heartRate', at(3, '06:35'))],
    });
    expect(statusOf(list, 'morning-hr')).toBe('done');
    expect(statusOf(list, 'evening-hr')).toBe('missed');
  });

  it('only an evening measurement → it satisfies the evening slot (closest), morning missed', () => {
    const list = run(at(3, '19:10'), {
      schedule,
      measurements: [meas(A, 'heartRate', at(3, '19:00'))],
    });
    expect(statusOf(list, 'evening-hr')).toBe('done');
    expect(statusOf(list, 'morning-hr')).toBe('missed');
  });

  it('a late morning measurement at noon counts for the morning only', () => {
    const list = run(at(3, '12:05'), {
      schedule,
      measurements: [meas(A, 'heartRate', at(3, '12:00'))],
    });
    expect(statusOf(list, 'morning-hr')).toBe('late');
    expect(statusOf(list, 'evening-hr')).toBe('upcoming');
  });
});

describe('manual tasks (no metric)', () => {
  const done = (time: string): TaskCompletion => ({
    crewId: A,
    templateId: 'weekly-health-summary',
    missionDay: 8,
    at: at(8, time),
  });

  it.each([
    [[], '10:30', 'due'],
    [[done('10:05')], '10:30', 'done'],
    [[done('13:00')], '13:05', 'late'],
    [[], '12:01', 'missed'],
  ] as const)('completions %j at %s → %s', (completions, now, expected) => {
    const list = run(at(8, now), { schedule: [WEEKLY], completions: [...completions] });
    expect(statusOf(list, 'weekly-health-summary')).toBe(expected);
  });

  it('a measurement never satisfies a manual task', () => {
    const list = run(at(8, '10:30'), {
      schedule: [WEEKLY],
      measurements: [meas(A, 'heartRate', at(8, '10:05'))],
    });
    expect(list[0]?.completedBy).toBeUndefined();
  });
});

describe('per crew member', () => {
  it("one astronaut's measurement never satisfies another's task", () => {
    const list = run(at(3, '07:00'), {
      crew: [{ id: A }, { id: B }],
      measurements: [meas(B, 'heartRate', at(3, '06:35'))],
    });
    expect(statusOf(list, 'morning-hr', A)).toBe('due');
    expect(statusOf(list, 'morning-hr', B)).toBe('done');
  });

  it('manual completions are per crew member too', () => {
    const list = run(at(8, '10:30'), {
      schedule: [WEEKLY],
      crew: [{ id: A }, { id: B }],
      completions: [
        { crewId: B, templateId: 'weekly-health-summary', missionDay: 8, at: at(8, '10:05') },
      ],
    });
    expect(statusOf(list, 'weekly-health-summary', A)).toBe('due');
    expect(statusOf(list, 'weekly-health-summary', B)).toBe('done');
  });
});

describe('Mars: day boundary stays the UTC mission day (ADR-030)', () => {
  it('00:30 UTC on day 3 is mission day 3 even though it is still Sol 2', () => {
    const list = run(at(3, '00:30'), { schedule: ENVIRONMENTS.mars_base.reminderSchedule });
    expect(list.length).toBeGreaterThan(0);
    expect(new Set(list.map((r) => r.missionDay))).toEqual(new Set([3]));
    expect(statusOf(list, 'sleep-log')).toBe('upcoming');
  });
});
