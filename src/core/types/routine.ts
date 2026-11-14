/**
 * Routine (reminders) & gamification contracts.
 * SINGLE SOURCE OF TRUTH — mirror changes in docs/CONTRACTS.md.
 */
import type { MetricId } from './metrics';

/** A recurring task in the mission timeline, e.g. "morning vitals at 07:30 MET". */
export interface ReminderTemplate {
  id: string;
  /** Metric to measure, if the task is a measurement. */
  metric?: MetricId;
  /** i18n key of the task text. */
  taskKey: string;
  /** Time of day in mission time, "HH:mm" (24 h). */
  timeOfDayMET: string;
  repeat: 'daily' | 'twice_daily' | 'weekly';
}

/**
 * A health-supporting task that awards XP.
 * RULE: XP rewards ADHERENCE (measuring, exercising, sleeping on schedule),
 * never "good values" — we must not incentivise falsified entries.
 */
export interface Mission {
  id: string;
  titleKey: string;
  xp: number;
  type: 'measurement' | 'exercise' | 'sleep' | 'hydration' | 'social' | 'learning';
  /** ISO timestamp; undefined = open. */
  completedAt?: string;
}
