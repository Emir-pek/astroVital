import type { BodyRegionDefinition, BodyRegionId, HazardId, MetricId } from '@core/types';
import { METRIC_IDS, METRICS } from './metrics.config';

export const BODY_REGION_IDS: readonly BodyRegionId[] = [
  'brain',
  'eyes',
  'heart',
  'lungs',
  'blood',
  'bones',
  'muscles',
  'immune',
  'kidneys',
  'whole_body',
] as const;

/** Metrics that inform a region — derived from METRICS so the two can never drift. */
const metricsFor = (region: BodyRegionId): MetricId[] =>
  METRIC_IDS.filter((id) => METRICS[id].bodyRegions.includes(region));

const region = (
  id: BodyRegionId,
  hazards: HazardId[],
  sourceIds: string[],
): BodyRegionDefinition => ({
  id,
  labelKey: `body.${id}.label`,
  functionKey: `body.${id}.function`,
  spaceRiskKey: `body.${id}.spaceRisk`,
  metrics: metricsFor(id),
  hazards,
  sourceIds,
});

export const BODY_REGIONS: Record<BodyRegionId, BodyRegionDefinition> = {
  brain: region('brain', ['isolation', 'distance', 'radiation'], ['nasa-hrp-risks']),
  // No numeric metric yet: SANS is followed with ultrasound (optic nerve sheath) in P1.
  eyes: region('eyes', ['gravity', 'radiation'], ['nasa-sans', 'nasa-hrp-risks']),
  heart: region('heart', ['gravity', 'radiation'], ['nasa-hrp-risks']),
  lungs: region('lungs', ['environment'], ['nasa-hrp-risks']),
  blood: region('blood', ['gravity', 'environment'], ['nasa-hrp-risks']),
  bones: region('bones', ['gravity'], ['nasa-hrp-risks', 'nasa-iss-exercise']),
  muscles: region('muscles', ['gravity'], ['nasa-hrp-risks', 'nasa-iss-exercise']),
  immune: region('immune', ['radiation', 'isolation', 'environment'], ['nasa-hrp-risks']),
  kidneys: region('kidneys', ['gravity', 'environment'], ['nasa-hrp-risks']),
  whole_body: region('whole_body', ['radiation'], ['csa-radiation', 'nasa-std-3001']),
};
