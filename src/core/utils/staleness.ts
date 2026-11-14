import type { EnvironmentProfile, MetricId, ReminderTemplate } from '@core/types';
import { MS_PER_DAY, MS_PER_HOUR } from './time';

/** Interval between two scheduled measurements for each repeat rule. */
export const REPEAT_INTERVAL_MS: Record<ReminderTemplate['repeat'], number> = {
  twice_daily: 12 * MS_PER_HOUR,
  daily: MS_PER_DAY,
  weekly: 7 * MS_PER_DAY,
  monthly: 30 * MS_PER_DAY,
};

/** A value stays valid for this many scheduled intervals. */
export const VALIDITY_FACTOR = 1.5;

/** Validity window for metrics that have no reminder in the schedule. */
export const UNSCHEDULED_VALIDITY_MS = 48 * MS_PER_HOUR;

/** Metrics measured together share the schedule of the first one. */
const SCHEDULE_ALIAS: Partial<Record<MetricId, MetricId>> = {
  diastolicBP: 'systolicBP',
};

/** How long a measurement of `metric` stays trustworthy in `env`. */
export function maxValidityMs(metric: MetricId, env: EnvironmentProfile): number {
  const scheduled = SCHEDULE_ALIAS[metric] ?? metric;
  const intervals = env.reminderSchedule
    .filter((r) => r.metric === scheduled)
    .map((r) => REPEAT_INTERVAL_MS[r.repeat]);
  if (intervals.length === 0) return UNSCHEDULED_VALIDITY_MS;
  return Math.min(...intervals) * VALIDITY_FACTOR;
}

/** True when the measurement is older than its validity window (strictly). */
export function isStale(
  measuredAtIso: string,
  metric: MetricId,
  env: EnvironmentProfile,
  now: Date,
): boolean {
  const measuredAt = Date.parse(measuredAtIso);
  // Fail safe: an unparseable timestamp counts as stale.
  if (Number.isNaN(measuredAt)) return true;
  return now.getTime() - measuredAt > maxValidityMs(metric, env);
}
