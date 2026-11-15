import type { Measurement, ReminderTemplate } from '@core/types';
import { isScheduledOn } from '@core/utils/routineSchedule';
import { MS_PER_DAY, MS_PER_MINUTE, missionDayFor, parseTimeOfDay } from '@core/utils/time';
import { DUE_GRACE_MIN, EARLY_WINDOW_MIN, TWICE_DAILY_OFFSET_MIN } from './reminderConfig';

/**
 * Reminder status engine (ADR-049). PURE — `now` is a parameter, no clock, no store.
 *
 * Status of one occurrence (dueAt = scheduled time):
 *   now < dueAt − EARLY                         → upcoming
 *   matched event in [dueAt − EARLY, dueAt + GRACE] → done
 *   matched event in (dueAt + GRACE, end of day]    → late
 *   no match, now ≤ dueAt + GRACE               → due
 *   no match, now > dueAt + GRACE               → missed
 * The day is the UTC mission day (ADR-030): on Mars only the clock label says "Sol".
 */

export type ReminderStatus = 'upcoming' | 'due' | 'done' | 'late' | 'missed';

/** A task without a metric marked as done by hand (weekly summary, monthly exam, crew chat …). */
export interface TaskCompletion {
  crewId: string;
  templateId: string;
  /** UTC mission day (1-based) the task belongs to. */
  missionDay: number;
  /** ISO timestamp of the click. */
  at: string;
}

export interface ReminderInstance {
  /** `${crewId}:${templateId}:${missionDay}:${occurrence}` — stable across renders and reloads. */
  id: string;
  crewId: string;
  template: ReminderTemplate;
  missionDay: number;
  /** 0 = first slot of the day, 1 = second slot of a `twice_daily` task. */
  occurrence: number;
  /** ISO timestamp of this occurrence. */
  dueAt: string;
  status: ReminderStatus;
  /** ISO timestamp of the measurement / manual completion that satisfied it (done / late only). */
  completedAt?: string;
  /** How it was satisfied: a measurement of `template.metric`, or a manual completion. */
  completedBy?: 'measurement' | 'manual';
}

export interface ExpandRemindersInput {
  schedule: readonly ReminderTemplate[];
  /** ISO timestamp of mission day 1, 00:00 UTC. */
  missionStart: string;
  now: Date;
  measurements: readonly Measurement[];
  /** Only `id` is read — no health data. */
  crew: readonly { id: string }[];
  completions: readonly TaskCompletion[];
}

/** Bounds of a UTC mission day. */
export const missionDayBounds = (
  missionStart: string,
  missionDay: number,
): { start: number; end: number } => {
  const start = Date.parse(missionStart) + (missionDay - 1) * MS_PER_DAY;
  return { start, end: start + MS_PER_DAY };
};

/** UTC mission day of `now` (Earth days, also on Mars — ADR-030). */
export const currentMissionDay = (missionStart: string, now: Date): number =>
  missionDayFor(missionStart, now);

export const reminderId = (
  crewId: string,
  templateId: string,
  missionDay: number,
  occurrence: number,
): string => `${crewId}:${templateId}:${missionDay}:${occurrence}`;

interface Slot {
  template: ReminderTemplate;
  occurrence: number;
  dueMs: number;
}

/** Scheduled slots of one mission day (no crew, no status). */
const slotsForDay = (
  schedule: readonly ReminderTemplate[],
  missionStart: string,
  missionDay: number,
): Slot[] => {
  const { start } = missionDayBounds(missionStart, missionDay);
  const slots: Slot[] = [];
  for (const template of schedule) {
    if (!isScheduledOn(template, missionDay)) continue;
    const dueMs = start + parseTimeOfDay(template.timeOfDayMET) * MS_PER_MINUTE;
    slots.push({ template, occurrence: 0, dueMs });
    if (template.repeat === 'twice_daily') {
      slots.push({
        template,
        occurrence: 1,
        dueMs: dueMs + TWICE_DAILY_OFFSET_MIN * MS_PER_MINUTE,
      });
    }
  }
  return slots.sort((a, b) => a.dueMs - b.dueMs || a.template.id.localeCompare(b.template.id));
};

/** Event that can satisfy an occurrence: a measurement (by metric) or a manual completion (by template). */
interface MatchEvent {
  key: string;
  ms: number;
}

const measurementKey = (crewId: string, metric: string) => `${crewId}|m|${metric}`;
const manualKey = (crewId: string, templateId: string) => `${crewId}|t|${templateId}`;
const slotKey = (crewId: string, template: ReminderTemplate) =>
  template.metric ? measurementKey(crewId, template.metric) : manualKey(crewId, template.id);

/**
 * Pre-indexed events for many days (history). Events after `now` are ignored (cannot be in the past).
 * Keys hold sorted millisecond timestamps.
 */
export interface EventIndex {
  byKey: Map<string, number[]>;
}

export const buildEventIndex = (
  measurements: readonly Measurement[],
  completions: readonly TaskCompletion[],
  now: Date,
): EventIndex => {
  const nowMs = now.getTime();
  const byKey = new Map<string, number[]>();
  const push = (e: MatchEvent) => {
    if (!(e.ms <= nowMs)) return; // also drops NaN
    const list = byKey.get(e.key);
    if (list) list.push(e.ms);
    else byKey.set(e.key, [e.ms]);
  };
  for (const m of measurements) {
    push({ key: measurementKey(m.crewId, m.metric), ms: Date.parse(m.timestamp) });
  }
  for (const c of completions)
    push({ key: manualKey(c.crewId, c.templateId), ms: Date.parse(c.at) });
  for (const list of byKey.values()) list.sort((a, b) => a - b);
  return { byKey };
};

const EARLY_MS = EARLY_WINDOW_MIN * MS_PER_MINUTE;
const GRACE_MS = DUE_GRACE_MIN * MS_PER_MINUTE;

/**
 * Occurrences of ONE mission day for every crew member, with status at `now`.
 * Matching: an event satisfies at most ONE occurrence — among the not-yet-satisfied occurrences of
 * the same crew + metric (or template) whose window [dueAt − EARLY, end of day] contains it, the one
 * whose dueAt is closest (so morning and evening heart rate never mix). Events are taken in time order.
 */
export const expandDay = (
  input: Omit<ExpandRemindersInput, 'measurements' | 'completions'> & { index: EventIndex },
  missionDay: number,
): ReminderInstance[] => {
  const { schedule, missionStart, now, crew, index } = input;
  if (missionDay < 1) return [];
  const nowMs = now.getTime();
  const { start: dayStart, end: dayEnd } = missionDayBounds(missionStart, missionDay);
  const slots = slotsForDay(schedule, missionStart, missionDay);
  const out: ReminderInstance[] = [];

  for (const member of crew) {
    // Group this member's slots by match key.
    const groups = new Map<string, Slot[]>();
    for (const s of slots) {
      const key = slotKey(member.id, s.template);
      const g = groups.get(key);
      if (g) g.push(s);
      else groups.set(key, [s]);
    }

    const matched = new Map<Slot, number>();
    for (const [key, group] of groups) {
      const events = index.byKey.get(key);
      if (!events) continue;
      const from = dayStart - EARLY_MS;
      for (const ms of events) {
        if (ms < from) continue;
        if (ms > dayEnd) break;
        let best: Slot | undefined;
        for (const s of group) {
          if (matched.has(s)) continue;
          if (ms < s.dueMs - EARLY_MS) continue;
          if (!best || Math.abs(ms - s.dueMs) < Math.abs(ms - best.dueMs)) best = s;
        }
        if (best) matched.set(best, ms);
      }
    }

    for (const s of slots) {
      const at = matched.get(s);
      let status: ReminderStatus;
      if (at !== undefined) status = at <= s.dueMs + GRACE_MS ? 'done' : 'late';
      else if (nowMs < s.dueMs - EARLY_MS) status = 'upcoming';
      else if (nowMs <= s.dueMs + GRACE_MS) status = 'due';
      else status = 'missed';
      out.push({
        id: reminderId(member.id, s.template.id, missionDay, s.occurrence),
        crewId: member.id,
        template: s.template,
        missionDay,
        occurrence: s.occurrence,
        dueAt: new Date(s.dueMs).toISOString(),
        status,
        ...(at !== undefined
          ? {
              completedAt: new Date(at).toISOString(),
              completedBy: s.template.metric ? ('measurement' as const) : ('manual' as const),
            }
          : {}),
      });
    }
  }
  return out;
};

/** Today's occurrences (UTC mission day of `now`) for every crew member, sorted by dueAt. */
export const expandReminders = (input: ExpandRemindersInput): ReminderInstance[] => {
  const day = currentMissionDay(input.missionStart, input.now);
  const index = buildEventIndex(input.measurements, input.completions, input.now);
  return expandDay({ ...input, index }, day);
};

/**
 * Occurrences of mission days [fromDay, toDay] (inclusive; clamped to ≥ 1). Used by gamification
 * (XP, streaks) — status per day exactly as `expandReminders` would have shown it at `now`.
 */
export const expandRange = (
  input: ExpandRemindersInput,
  fromDay: number,
  toDay: number,
): ReminderInstance[] => {
  const index = buildEventIndex(input.measurements, input.completions, input.now);
  const out: ReminderInstance[] = [];
  for (let d = Math.max(1, fromDay); d <= toDay; d++)
    out.push(...expandDay({ ...input, index }, d));
  return out;
};

/** Groups instances by crew id (keeps order). */
export const groupByCrew = (
  instances: readonly ReminderInstance[],
): Record<string, ReminderInstance[]> => {
  const out: Record<string, ReminderInstance[]> = {};
  for (const r of instances) (out[r.crewId] ??= []).push(r);
  return out;
};
