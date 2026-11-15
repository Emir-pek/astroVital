import type { SustainedRule } from '@core/types';
import { ESCALATION_ORDER, STATUS_ORDER } from '@core/utils/status';
import type { DailyPoint } from './trend';

/** True if `days` are consecutive UTC calendar days (no gaps). */
function isConsecutive(days: DailyPoint[]): boolean {
  for (let i = 1; i < days.length; i++) {
    const prev = Date.parse(`${days[i - 1]!.date}T00:00:00Z`);
    const cur = Date.parse(`${days[i]!.date}T00:00:00Z`);
    if (cur - prev !== 86_400_000) return false;
  }
  return true;
}

/**
 * Consecutive-day rules (docs/modules/assessment.md § sustained), e.g. "sleep < 6.5 h for 3
 * days in a row → warning, CMO". Matches when the LAST `rule.days` consecutive calendar days
 * (ending on the most recent day of `daily`) all satisfy `min <= value < max`. A missing day
 * in that window (no measurement that day) breaks the streak — data absence is not assumed to
 * be bad, but it also cannot confirm the rule.
 *
 * Multiple rules can match at once (e.g. a 3-day and a 2-day sleep rule); returns the one with
 * the highest escalation, then status.
 */
export function evaluateSustained(
  rules: SustainedRule[] | undefined,
  daily: DailyPoint[],
): SustainedRule | undefined {
  if (!rules || rules.length === 0) return undefined;

  const matches = rules.filter((rule) => {
    if (daily.length < rule.days) return false;
    const window = daily.slice(-rule.days);
    if (!isConsecutive(window)) return false;
    return window.every(
      (d) =>
        (rule.min === undefined || d.value >= rule.min) &&
        (rule.max === undefined || d.value < rule.max),
    );
  });

  if (matches.length === 0) return undefined;
  return matches.reduce((worst, rule) => {
    if (ESCALATION_ORDER[rule.escalation] !== ESCALATION_ORDER[worst.escalation]) {
      return ESCALATION_ORDER[rule.escalation] > ESCALATION_ORDER[worst.escalation] ? rule : worst;
    }
    return STATUS_ORDER[rule.status] > STATUS_ORDER[worst.status] ? rule : worst;
  });
}
