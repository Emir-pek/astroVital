import type { ReminderTemplate } from '@core/types';

export type ReminderStatus = 'upcoming' | 'due' | 'done' | 'missed';

export interface ReminderInstance {
  template: ReminderTemplate;
  /** ISO timestamp of this occurrence. */
  dueAt: string;
  status: ReminderStatus;
}

export interface RemindersApi {
  /** Today's occurrences (all statuses), sorted by dueAt. */
  reminders: ReminderInstance[];
  /** Subset currently due. */
  due: ReminderInstance[];
  /** Subset missed (past due, no matching measurement). */
  missed: ReminderInstance[];
}

/**
 * STUB — returns empty lists.
 * TODO(Engineer 1, P1): expand activeEnvironment.reminderSchedule for the current mission day
 * (core/utils/time: missionDay, parseTimeOfDay), mark 'done' when a matching measurement
 * exists, 'missed' when past due; fire toast + Notification API (if permitted).
 */
export function useReminders(): RemindersApi {
  return { reminders: [], due: [], missed: [] };
}
