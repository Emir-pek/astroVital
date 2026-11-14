/**
 * Metric & hazard contracts.
 * SINGLE SOURCE OF TRUTH — any change here must be mirrored in docs/CONTRACTS.md
 * and announced to the whole team (see CLAUDE.md > Architecture rules).
 */
import type { BodyRegionId } from './body';

/** Every health indicator AstroVital tracks. Required by the challenge + optional extras. */
export type MetricId =
  | 'systolicBP' // mmHg
  | 'diastolicBP' // mmHg
  | 'heartRate' // bpm (resting)
  | 'bloodGlucose' // mg/dL (fasting)
  | 'bodyTemp' // °C
  | 'sleepHours' // hours / 24 h
  | 'mood' // 1–5 self-report scale
  | 'spo2' // % peripheral oxygen saturation
  | 'respRate' // breaths / min
  | 'radiationDose' // mSv received during ONE mission day (personal dosimeter); cumulative is derived
  | 'exerciseMinutes'; // minutes / day

/** NASA Human Research Program "5 Hazards of Human Spaceflight" (RIDGE). */
export type HazardId =
  | 'radiation' // Space radiation
  | 'isolation' // Isolation & confinement
  | 'distance' // Distance from Earth
  | 'gravity' // Altered gravity fields
  | 'environment'; // Hostile / closed environment

/** Static description of a metric. Lives in `core/config/metrics.config.ts`. */
export interface MetricDefinition {
  id: MetricId;
  /** Canonical (storage) unit. UI may convert via `core/utils/units.ts`. */
  unit: string;
  /** i18n key, e.g. `metrics.heartRate.label`. */
  labelKey: string;
  /** i18n key — plain-language "what is this?" for a non-medical astronaut. */
  descriptionKey: string;
  /** Input validation bounds (physiologically plausible, NOT health thresholds). */
  min: number;
  max: number;
  /** Input step (also drives display precision). */
  step: number;
  /** Body-map regions this metric informs. */
  bodyRegions: BodyRegionId[];
  /** Which of the 5 hazards influence this metric. */
  hazards: HazardId[];
  /** i18n key — step-by-step "how do I measure this in space?". */
  measurementHowToKey: string;
}

/** Static description of a hazard. Lives in `core/config/hazards.config.ts`. */
export interface HazardDefinition {
  id: HazardId;
  labelKey: string;
  descriptionKey: string;
  /** i18n key — "what can I do about it?" (countermeasures). */
  countermeasuresKey: string;
  /** IDs from `core/config/sources.config.ts` (mirrors docs/SOURCES.md). */
  sourceIds: string[];
}
