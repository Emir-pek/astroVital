/**
 * Routine (reminders) & gamification contracts.
 * SINGLE SOURCE OF TRUTH — mirror changes in docs/CONTRACTS.md.
 */
import type { MetricId } from './metrics';

/**
 * A recurring task in the mission timeline, e.g. "morning vitals at 07:30 MET".
 * Three tiers (ADR-035): daily / weekly / monthly. Which mission days a task falls on is decided by
 * `isScheduledOn(template, missionDay)` in `@core/utils`.
 */
export interface ReminderTemplate {
  id: string;
  /** Metric to measure, if the task is a measurement. */
  metric?: MetricId;
  /** i18n key of the task text. */
  taskKey: string;
  /** Time of day in mission time, "HH:mm" (24 h). */
  timeOfDayMET: string;
  /**
   * - `daily` / `twice_daily`: every mission day (twice_daily = second slot 12 h later).
   * - `weekly`: every 7 mission days starting at `anchorDay`.
   * - `monthly`: every 30 mission days starting at `anchorDay`.
   */
  repeat: 'daily' | 'twice_daily' | 'weekly' | 'monthly';
  /**
   * Rest day: skip every N-th mission day (daily / twice_daily only).
   * E.g. 7 → skipped on days 7, 14, 21 … (exercise 6 days a week).
   */
  restEveryNDays?: number;
  /** First mission day (1-based) for weekly / monthly tasks. Default 1. */
  anchorDay?: number;
  /** Source IDs (sources.config) backing this task and its frequency. */
  sourceIds?: string[];
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
