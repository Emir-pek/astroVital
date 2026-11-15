import { useCallback, useMemo } from 'react';
import { useNow } from '@core/hooks';
import { useActiveEnvironment, useHealthStore } from '@core/store';
import {
  currentMissionDay,
  expandReminders,
  groupByCrew,
  type ReminderInstance,
  type ReminderStatus,
} from '../services/reminderEngine';
import { useRoutineStore } from '../store/useRoutineStore';

export type { ReminderInstance, ReminderStatus };

/** Reminder refresh interval: statuses change on minute boundaries. */
export const REMINDER_TICK_MS = 60_000;

export interface RemindersApi {
  /** Crew member these lists belong to (argument, else the signed-in astronaut). */
  crewId: string | null;
  /** Today's occurrences of that crew member (all statuses), sorted by dueAt. */
  reminders: ReminderInstance[];
  /**
   * Today's occurrences of EVERY crew member, by crew id — task status only, no health values
   * (team views, ADR-032).
   */
  byCrew: Record<string, ReminderInstance[]>;
  /** Subset currently due. */
  due: ReminderInstance[];
  /** Subset done after the grace window (still today). */
  late: ReminderInstance[];
  /** Subset missed (grace window over, nothing recorded). */
  missed: ReminderInstance[];
  missedCount: number;
  /**
   * Marks a task WITHOUT a metric as done now (weekly summary, monthly exam, crew chat …).
   * Returns false when there is no such task today, it is not yet due, or it is already done.
   */
  completeTask: (crewId: string, templateId: string) => boolean;
}

/**
 * Today's reminders (ADR-049). `crewId` defaults to the signed-in astronaut (`selectedCrewId`).
 * Recomputed every minute and whenever measurements, environment or completions change.
 */
export function useReminders(crewId?: string): RemindersApi {
  const now = useNow(REMINDER_TICK_MS);
  const selectedCrewId = useHealthStore((s) => s.selectedCrewId);
  const measurements = useHealthStore((s) => s.measurements);
  const crew = useHealthStore((s) => s.crew);
  const missionStart = useHealthStore((s) => s.settings.missionStart);
  const env = useActiveEnvironment();
  const completions = useRoutineStore((s) => s.completions);
  const addCompletion = useRoutineStore((s) => s.addCompletion);

  const targetId = crewId ?? selectedCrewId;

  const byCrew = useMemo(
    () =>
      groupByCrew(
        expandReminders({
          schedule: env.reminderSchedule,
          missionStart,
          now,
          measurements,
          crew,
          completions,
        }),
      ),
    [env, missionStart, now, measurements, crew, completions],
  );

  const reminders = useMemo(() => (targetId ? (byCrew[targetId] ?? []) : []), [byCrew, targetId]);

  const lists = useMemo(
    () => ({
      due: reminders.filter((r) => r.status === 'due'),
      late: reminders.filter((r) => r.status === 'late'),
      missed: reminders.filter((r) => r.status === 'missed'),
    }),
    [reminders],
  );

  const completeTask = useCallback(
    (forCrew: string, templateId: string): boolean => {
      const at = new Date(); // event time of the click, not the minute ticker
      const today = expandReminders({
        schedule: env.reminderSchedule,
        missionStart,
        now: at,
        measurements: [],
        crew: [{ id: forCrew }],
        completions: useRoutineStore.getState().completions,
      });
      const open = today.find(
        (r) =>
          r.template.id === templateId &&
          !r.template.metric &&
          (r.status === 'due' || r.status === 'missed'),
      );
      if (!open) return false;
      addCompletion({
        crewId: forCrew,
        templateId,
        missionDay: currentMissionDay(missionStart, at),
        at: at.toISOString(),
      });
      return true;
    },
    [env, missionStart, addCompletion],
  );

  return {
    crewId: targetId,
    reminders,
    byCrew,
    ...lists,
    missedCount: lists.missed.length,
    completeTask,
  };
}

/** Number of today's missed reminders (default: the signed-in astronaut) — for a nav badge. */
export function useMissedCount(crewId?: string): number {
  return useReminders(crewId).missedCount;
}
