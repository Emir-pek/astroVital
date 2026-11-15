import { METRICS } from '@core/config/metrics.config';
import { RADIATION_SPE_DAILY_MULTIPLIER, THRESHOLDS } from '@core/config/thresholds.config';
import type { Assessment, AssessmentContext, Measurement } from '@core/types';
import { ESCALATION_ORDER, STATUS_ORDER } from '@core/utils/status';
import { roundToStep } from '@core/utils/format';
import { applyModifierToBands, findBand } from './bands';
import { finalizeEscalation } from './escalation';
import { buildRecommendations } from './recommendations';
import { cumulativeRadiation, isSolarParticleEvent } from './radiation';
import { evaluateSustained } from './sustained';
import { dailyLastValues, evaluateTrend, isMonotonicWorsening } from './trend';

/**
 * Evaluates ONE measurement in context (environment, crew baseline, history):
 *   1. pick the ThresholdBand, with the environment's modifiers applied (b' = b + shift ± widen)
 *   2. radiation (`basis: 'cumulativeSum'`) + the SPE rule (daily dose > 5x expected)
 *   3. trend (window % change) — can upgrade status; 3 consecutive worsening points → CMO
 *   4. sustained rules (consecutive days) — can upgrade status/escalation further
 *   5. escalation finalised (Mars/autonomous: flight_surgeon → emergency)
 *   6. plain-language summary/explanation + recommendations (mandatory "remeasure" on red)
 * Pure function: no store, no Date.now() — everything time-related comes from `ctx.now`.
 */
export function assessMeasurement(m: Measurement, ctx: AssessmentContext): Assessment {
  const threshold = THRESHOLDS[m.metric];
  const modifier = ctx.environment.thresholdModifiers[m.metric];
  const bands = applyModifierToBands(threshold.bands, modifier);

  const crewHistory = ctx.history.filter((h) => h.crewId === m.crewId);
  const metricHistory = crewHistory.filter((h) => h.metric === m.metric);

  const isRadiation = threshold.basis === 'cumulativeSum';
  const evaluatedValue = isRadiation
    ? cumulativeRadiation(ctx.crew, crewHistory, m.timestamp)
    : m.value;

  const band = findBand(evaluatedValue, bands);
  let status = band.status;
  let escalation = band.escalation;
  let summaryKey = band.messageKey;

  // SPE overrides the cumulative band outright — a spike matters regardless of career total.
  const spe = isRadiation
    ? isSolarParticleEvent(
        m.value,
        ctx.environment.expectedDailyRadiationMSv,
        RADIATION_SPE_DAILY_MULTIPLIER,
      )
    : false;
  if (spe) {
    status = 'warning';
    escalation = 'flight_surgeon';
    summaryKey = 'assessment.radiation.spe';
  }

  const daily = dailyLastValues(metricHistory, ctx.now);
  const trendResult = evaluateTrend(threshold.trend, daily);
  if (
    trendResult.statusOverride &&
    STATUS_ORDER[trendResult.statusOverride] > STATUS_ORDER[status]
  ) {
    status = trendResult.statusOverride;
  }
  // docs/THRESHOLDS.md § Eskalasyon kuralı 3: 3 consecutive worsening measurements → CMO,
  // when nothing stronger has already claimed the escalation.
  if (
    threshold.trend &&
    status !== 'nominal' &&
    ESCALATION_ORDER[escalation] < ESCALATION_ORDER.crew_medical_officer &&
    isMonotonicWorsening(daily, threshold.trend.deltaPct)
  ) {
    escalation = 'crew_medical_officer';
  }

  const sustainedRule = evaluateSustained(threshold.sustained, daily);
  if (
    sustainedRule &&
    (STATUS_ORDER[sustainedRule.status] > STATUS_ORDER[status] ||
      (STATUS_ORDER[sustainedRule.status] === STATUS_ORDER[status] &&
        ESCALATION_ORDER[sustainedRule.escalation] > ESCALATION_ORDER[escalation]))
  ) {
    status = sustainedRule.status;
    escalation = sustainedRule.escalation;
    summaryKey = sustainedRule.messageKey;
  }

  escalation = finalizeEscalation(escalation, ctx.environment);

  const step = METRICS[m.metric].step;
  const messageParams: Record<string, string | number> = {
    value: roundToStep(m.value, step),
  };
  if (isRadiation) messageParams.cumulative = roundToStep(evaluatedValue, step);

  return {
    metric: m.metric,
    crewId: m.crewId,
    status,
    escalation,
    value: evaluatedValue,
    trend: trendResult.trend,
    summaryKey,
    explanationKey: `assessment.explanation.${m.metric}`,
    messageParams,
    recommendations: buildRecommendations({
      metric: m.metric,
      status,
      escalation,
      isSolarParticleEvent: spe,
      environment: ctx.environment,
    }),
    sourceIds: [...threshold.sourceIds],
    measurementId: m.id,
  };
}
