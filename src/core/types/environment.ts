/**
 * Mission environment contracts (adaptation to spacecraft / station / rover / Moon / Mars).
 * SINGLE SOURCE OF TRUTH — mirror changes in docs/CONTRACTS.md.
 */
import type { MetricId } from './metrics';
import type { ReminderTemplate } from './routine';

export type EnvironmentId = 'spacecraft' | 'iss' | 'rover' | 'lunar_base' | 'mars_base';

/**
 * Adjusts a metric's threshold bands for an environment.
 * For every band boundary `b` (see ThresholdBand), with `c` = centre of the green band:
 *   b' = b + shift + sign(b - c) * widen
 * - `shift`  moves all boundaries (e.g. +0.3 °C on ISS: core temp runs higher in microgravity).
 * - `widen`  moves boundaries away from (positive) or toward (negative) the green centre.
 * Implemented by the assessment engine (Engineer 3).
 */
export interface ThresholdModifier {
  shift?: number;
  widen?: number;
}

export interface EnvironmentProfile {
  id: EnvironmentId;
  labelKey: string;
  /** i18n key — short description shown in the environment picker. */
  descriptionKey: string;
  /** Surface/ambient gravity in g: 0 (ISS, transit), ~0.16 (Moon), ~0.38 (Mars). */
  gravityG: number;
  /** Typical daily effective dose (mSv/day) — baseline for spike (SPE) detection. */
  expectedDailyRadiationMSv: number;
  /** One-way signal delay to Earth in seconds, [min, max]. */
  oneWayCommDelaySec: [number, number];
  /** Time to reach definitive care on Earth. `Infinity` = no practical evacuation. */
  evacuationTimeHours: number;
  /** Drives escalation wording: ground-led vs. crew-led (autonomous) medicine. */
  medicalCapability: 'full_ground_support' | 'limited' | 'autonomous';
  thresholdModifiers: Partial<Record<MetricId, ThresholdModifier>>;
  /** Default measurement schedule for this environment (routine module). */
  reminderSchedule: ReminderTemplate[];
  /** Source IDs backing the numbers above. */
  sourceIds: string[];
}
