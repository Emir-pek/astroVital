import type { Assessment } from '@core/types';
import { MS_PER_HOUR } from '@core/utils';

/** A caution/advisory stays hidden from the strip this long after "snooze". */
export const SNOOZE_MS = 2 * MS_PER_HOUR;

export interface AlertAckState {
  /** alert key -> ISO time of acknowledgement. */
  acknowledged: Record<string, string>;
  /** alert key -> ISO time until which the alert is snoozed. */
  snoozedUntil: Record<string, string>;
}

/** A new measurement of the same metric is a new alert. */
export const alertKey = (a: Assessment): string =>
  `${a.crewId}:${a.metric}:${a.measurementId ?? 'latest'}`;

/**
 * Splits assessments into the blocking full-screen alerts (unacknowledged
 * warnings) and the alert strip. Warnings can never be snoozed.
 */
export function buildAlertQueue(
  assessments: Assessment[],
  state: AlertAckState,
  now: Date,
): { blocking: Assessment[]; strip: Assessment[] } {
  const isSnoozed = (a: Assessment): boolean =>
    Date.parse(state.snoozedUntil[alertKey(a)] ?? '') > now.getTime();
  const isAcked = (a: Assessment): boolean => alertKey(a) in state.acknowledged;

  const warnings = assessments.filter((a) => a.status === 'warning');
  const visible = (status: Assessment['status']): Assessment[] =>
    assessments.filter((a) => a.status === status && !isSnoozed(a));

  return {
    blocking: warnings.filter((a) => !isAcked(a)),
    strip: [...warnings.filter(isAcked), ...visible('caution'), ...visible('advisory')],
  };
}
