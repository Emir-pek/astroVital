import type { ReminderTemplate } from '@core/types';

/** Mission days between two occurrences of a weekly / monthly task (ADR-035). */
export const WEEKLY_PERIOD_DAYS = 7;
export const MONTHLY_PERIOD_DAYS = 30;

type ScheduleRule = Pick<ReminderTemplate, 'repeat' | 'restEveryNDays' | 'anchorDay'>;

/**
 * True if the task falls on the given 1-based mission day (day of mission start = 1).
 * - daily / twice_daily: every day, except every `restEveryNDays`-th day when set.
 * - weekly: days anchorDay, anchorDay + 7, … ; monthly: anchorDay, anchorDay + 30, …
 * Days before mission start (≤ 0) and days before `anchorDay` are never scheduled. Pure.
 */
export const isScheduledOn = (template: ScheduleRule, missionDay: number): boolean => {
  if (!Number.isInteger(missionDay) || missionDay < 1) return false;
  switch (template.repeat) {
    case 'daily':
    case 'twice_daily': {
      const rest = template.restEveryNDays;
      return !(rest !== undefined && rest > 0 && missionDay % rest === 0);
    }
    case 'weekly':
    case 'monthly': {
      const period = template.repeat === 'weekly' ? WEEKLY_PERIOD_DAYS : MONTHLY_PERIOD_DAYS;
      const anchor = template.anchorDay ?? 1;
      return missionDay >= anchor && (missionDay - anchor) % period === 0;
    }
  }
};
