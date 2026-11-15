import { BODY_REGION_IDS, BODY_REGIONS } from '@core/config/bodyRegions.config';
import { METRICS } from '@core/config/metrics.config';
import { getLatestByMetric } from '@core/store/selectors';
import type {
  Assessment,
  AssessmentContext,
  CrewHealthSummary,
  Escalation,
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
 * docs/THRESHOLDS.md § Eskalasyon kuralı 3, first clause: "aynı bölgede ≥2 sarı →
 * crew_medical_officer". A region-level aggregate floor — it does not change any individual
 * Assessment, only how high the crew's overall escalation is allowed to rest.
 */
function regionEscalationFloor(regions: RegionHealth[]): Escalation {
  const anyRegionHasTwoCautions = regions.some(
    (r) => r.assessments.filter((a) => a.status === 'caution').length >= 2,
  );
  return anyRegionHasTwoCautions ? 'crew_medical_officer' : 'self_care';
}

/**
 * Evaluates a crew member's LATEST value of every metric and aggregates:
 *   region status = worst assessment in region; overall = worst region;
 *   escalation = highest escalation of any assessment, raised to at least
 *   `crew_medical_officer` if any one region has ≥2 caution-status assessments.
 */
export function assessCrew(
  crewId: string,
  measurements: Measurement[],
  ctx: AssessmentContext,
): CrewHealthSummary {
  const latest = getLatestByMetric(measurements, crewId);
  const assessments = Object.values(latest).map((m) => assessMeasurement(m, ctx));
  const regions = buildRegions(assessments);
  const escalation = highestEscalation([
    ...assessments.map((a) => a.escalation),
    regionEscalationFloor(regions),
  ]);
  return {
    crewId,
    overall: worstStatus(regions.map((r) => r.status)),
    escalation,
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
