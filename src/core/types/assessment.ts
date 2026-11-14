/**
 * Assessment contracts — produced by @modules/assessment, consumed by visualization,
 * routine and app. SINGLE SOURCE OF TRUTH — mirror changes in docs/CONTRACTS.md.
 */
import type { BodyRegionId } from './body';
import type { CrewMember } from './crew';
import type { EnvironmentProfile } from './environment';
import type { Measurement } from './measurement';
import type { MetricId } from './metrics';

/** Traffic-light status. Always rendered as colour + icon + text (colour-blind safe). */
export type Status = 'green' | 'yellow' | 'red';

/** Who must act, in increasing order of severity. */
export type Escalation =
  | 'self_care' // astronaut follows guidance on their own
  | 'crew_medical_officer' // on-board CMO must be informed
  | 'flight_surgeon' // ground flight surgeons must be contacted
  | 'emergency'; // immediate action; on Mars = autonomous emergency protocol

/**
 * One band of a metric threshold. Interval is HALF-OPEN: min <= value < max.
 * Missing `min` = -Infinity, missing `max` = +Infinity. Bands of one metric must be
 * contiguous and non-overlapping (enforced by a unit test).
 */
export interface ThresholdBand {
  min?: number;
  max?: number;
  status: Status;
  escalation: Escalation;
  /** i18n key — plain-language meaning of this band. */
  messageKey: string;
}

/** Rule over consecutive days, e.g. "sleep < 6.5 h for 3 days in a row → red". */
export interface SustainedRule {
  days: number;
  /** Rule matches when the daily value is >= min (if set) ... */
  min?: number;
  /** ... and/or < max (if set). */
  max?: number;
  status: Status;
  escalation: Escalation;
  messageKey: string;
}

export interface MetricThreshold {
  metric: MetricId;
  /**
   * What the bands are compared against:
   * - 'value'          → the measurement's own value (default)
   * - 'cumulativeSum'  → priorRadiationMSv + sum of all values in history (radiation)
   */
  basis?: 'value' | 'cumulativeSum';
  bands: ThresholdBand[];
  /** Worsening trend rule: change of `deltaPct` % over `windowDays` → `status`. */
  trend?: { windowDays: number; deltaPct: number; status: Status };
  sustained?: SustainedRule[];
  /** IDs from core/config/sources.config.ts justifying these numbers. */
  sourceIds: string[];
}

export interface Recommendation {
  id: string;
  titleKey: string;
  /** Ordered, plain-language steps (i18n keys). */
  stepsKeys: string[];
  urgency: Status;
  category:
    | 'rest'
    | 'hydration'
    | 'exercise'
    | 'nutrition'
    | 'medication_consult'
    | 'radiation_shelter'
    | 'psych_support'
    | 'remeasure'
    | 'contact_cmo'
    | 'contact_flight_surgeon';
}

/** Result of evaluating ONE metric for ONE crew member. */
export interface Assessment {
  metric: MetricId;
  crewId: string;
  status: Status;
  escalation: Escalation;
  /** Value that was assessed (cumulative for radiation). */
  value: number;
  trend: 'improving' | 'stable' | 'worsening' | 'unknown';
  /** i18n key — one-line plain-language verdict. */
  summaryKey: string;
  /** i18n key — "why does this matter?" in plain language. */
  explanationKey: string;
  /** Interpolation values for summaryKey / explanationKey (e.g. { value: 142 }). */
  messageParams?: Record<string, string | number>;
  recommendations: Recommendation[];
  /** References into docs/SOURCES.md. */
  sourceIds: string[];
  /** id of the measurement that produced this assessment (latest one). */
  measurementId?: string;
}

export interface RegionHealth {
  region: BodyRegionId;
  /** Worst status among `assessments`; 'green' with empty assessments = no data. */
  status: Status;
  assessments: Assessment[];
  functionKey: string;
  spaceRiskKey: string;
}

export interface CrewHealthSummary {
  crewId: string;
  /** Worst region status. */
  overall: Status;
  /** Highest escalation across all assessments. */
  escalation: Escalation;
  regions: RegionHealth[];
  assessments: Assessment[];
  /** ISO timestamp. */
  generatedAt: string;
}

/** Everything the engine needs to evaluate a measurement. Pure input — no store access. */
export interface AssessmentContext {
  environment: EnvironmentProfile;
  crew: CrewMember;
  /** Crew member's measurement history (any order; engine sorts as needed). */
  history: Measurement[];
  now: Date;
}
