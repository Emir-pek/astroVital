import { THRESHOLDS } from '@core/config/thresholds.config';
import type { Assessment, AssessmentContext, Measurement } from '@core/types';

/**
 * Evaluates ONE measurement in context (environment, crew baseline, history).
 *
 * PHASE 0 STUB — always returns green / self_care.
 * Engineer 3 replaces the body with the real rules engine (docs/modules/assessment.md):
 *   1. pick ThresholdBand (with environment modifiers: b' = b + shift ± widen)
 *   2. radiation: basis 'cumulativeSum' + SPE rule (daily > 5× expected)
 *   3. trend (moving average / slope over threshold.trend.windowDays)
 *   4. sustained rules (consecutive days)
 *   5. escalation (incl. Mars: flight_surgeon → emergency + autonomous protocol)
 *   6. plain-language summary/explanation + recommendations (+ mandatory "remeasure" on red)
 * MUST stay a pure function (no store, no Date.now — use ctx.now).
 */
export function assessMeasurement(m: Measurement, _ctx: AssessmentContext): Assessment {
  return {
    metric: m.metric,
    crewId: m.crewId,
    status: 'green',
    escalation: 'self_care',
    value: m.value,
    trend: 'unknown',
    summaryKey: 'assessment.stub.summary',
    explanationKey: 'assessment.stub.explanation',
    recommendations: [],
    sourceIds: [...THRESHOLDS[m.metric].sourceIds],
    measurementId: m.id,
  };
}
