import { BODY_REGION_IDS, BODY_REGIONS } from '@core/config/bodyRegions.config';
import { METRICS } from '@core/config/metrics.config';
import { getLatestByMetric } from '@core/store/selectors';
import type {
  Assessment,
  AssessmentContext,
  CrewHealthSummary,
  Measurement,
  RegionHealth,
} from '@core/types';
import { highestEscalation, worstStatus } from '@core/utils/status';
import { assessMeasurement } from './assessMeasurement';

/** Groups assessments into body regions; region status = worst assessment in it. */
export function buildRegions(assessments: Assessment[]): RegionHealth[] {
  return BODY_REGION_IDS.map((region) => {
    const def = BODY_REGIONS[region];
    const inRegion = assessments.filter((a) => METRICS[a.metric].bodyRegions.includes(region));
    return {
      region,
      status: worstStatus(inRegion.map((a) => a.status)),
      assessments: inRegion,
      functionKey: def.functionKey,
      spaceRiskKey: def.spaceRiskKey,
    };
  });
}

/**
 * Evaluates a crew member's LATEST value of every metric and aggregates:
 *   region status = worst assessment in region; overall = worst region;
 *   escalation = highest escalation of any assessment.
 * Aggregation is final; only assessMeasurement is a stub in Phase 0.
 * TODO(Engineer 3): region rule "≥2 caution in one region → crew_medical_officer".
 */
export function assessCrew(
  crewId: string,
  measurements: Measurement[],
  ctx: AssessmentContext,
): CrewHealthSummary {
  const latest = getLatestByMetric(measurements, crewId);
  const assessments = Object.values(latest).map((m) => assessMeasurement(m, ctx));
  const regions = buildRegions(assessments);
  return {
    crewId,
    overall: worstStatus(regions.map((r) => r.status)),
    escalation: highestEscalation(assessments.map((a) => a.escalation)),
    regions,
    assessments,
    generatedAt: ctx.now.toISOString(),
  };
}

/** Summary used when a crew member has no data / does not exist. */
export function emptySummary(crewId: string, now: Date): CrewHealthSummary {
  return {
    crewId,
    overall: 'nominal',
    escalation: 'self_care',
    regions: buildRegions([]),
    assessments: [],
    generatedAt: now.toISOString(),
  };
}
