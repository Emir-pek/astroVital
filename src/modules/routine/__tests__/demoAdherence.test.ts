import { describe, expect, it } from 'vitest';
import { ENVIRONMENTS } from '@core/config/environments.config';
import { DEMO_CREW, DEMO_DEFAULTS, generateHistory } from '@core/simulation';
import { computeXp, currentStreak, longestStreak } from '../services/gamification';
import { expandRange, type ReminderInstance } from '../services/reminderEngine';

/**
 * Mixed-mission adherence stories (ADR-048, docs/DEMO_CREW_STORIES.md "Uyum"), default seed,
 * generated late on the last day so every task of the day is resolved.
 */
const DAYS = DEMO_DEFAULTS.days;
const END = new Date('2026-11-30T23:30:00.000Z');
const START = '2026-11-01T00:00:00.000Z';
const env = ENVIRONMENTS.iss;
const measurements = generateHistory({
  seed: DEMO_DEFAULTS.seed,
  crew: DEMO_CREW,
  environment: env,
  scenario: 'mixed_mission',
  days: DAYS,
  end: END,
});
const all = expandRange(
  {
    schedule: env.reminderSchedule,
    missionStart: START,
    now: END,
    measurements,
    crew: DEMO_CREW,
    completions: [],
  },
  1,
  DAYS,
);
const mine = (id: string) => all.filter((r) => r.crewId === id && r.template.metric);
const count = (list: ReminderInstance[], status: ReminderInstance['status'], templateId?: string) =>
  list.filter((r) => r.status === status && (!templateId || r.template.id === templateId)).length;

const [mira, kenji, selin, lucas] = ['crew-1', 'crew-2', 'crew-3', 'crew-4'].map(mine) as [
  ReminderInstance[],
  ReminderInstance[],
  ReminderInstance[],
  ReminderInstance[],
];

describe('mixed_mission adherence stories', () => {
  it('Mira: flawless — nothing late or missed, unbroken streak over the whole mission', () => {
    expect(count(mira, 'late') + count(mira, 'missed')).toBe(0);
    expect(currentStreak(mira, DAYS)).toBe(DAYS);
  });

  it('Kenji: exercise and evening mood missing on the last 2 days; one late morning block', () => {
    expect(count(kenji, 'missed', 'exercise')).toBe(2);
    expect(count(kenji, 'missed', 'evening-mood')).toBe(2);
    expect(count(kenji, 'late')).toBeGreaterThanOrEqual(1);
    expect(kenji.filter((r) => r.status === 'late').every((r) => r.missionDay === DAYS - 1)).toBe(
      true,
    );
  });

  it('Selin: 3 evening moods missing in the last 10 days', () => {
    const moods = selin.filter((r) => r.template.id === 'evening-mood' && r.missionDay > DAYS - 10);
    expect(count(moods, 'missed')).toBe(3);
  });

  it('Lucas: 2 exercise sessions missing in the last 7 days', () => {
    const ex = lucas.filter((r) => r.template.id === 'exercise' && r.missionDay > DAYS - 7);
    expect(count(ex, 'missed')).toBe(2);
  });

  it('the four astronauts now differ in XP and streak', () => {
    const xp = [mira, kenji, selin, lucas].map((l) => computeXp(l, []));
    const streaks = [mira, kenji, selin, lucas].map((l) => currentStreak(l, DAYS));
    expect(new Set(xp).size).toBe(4);
    expect(new Set(streaks).size).toBe(4);
    expect(Math.max(...xp)).toBe(xp[0]); // Mira leads
    expect(longestStreak(selin, DAYS)).toBeGreaterThan(currentStreak(selin, DAYS));
  });
});
