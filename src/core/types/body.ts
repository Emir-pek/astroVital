/**
 * Body-map contracts (clickable human figure).
 * SINGLE SOURCE OF TRUTH — mirror changes in docs/CONTRACTS.md.
 */
import type { HazardId, MetricId } from './metrics';

/** Regions of the interactive body map. `whole_body` = systemic effects (e.g. radiation). */
export type BodyRegionId =
  | 'brain'
  | 'eyes'
  | 'heart'
  | 'lungs'
  | 'blood' // blood & metabolism
  | 'bones'
  | 'muscles'
  | 'immune'
  | 'kidneys'
  | 'whole_body';

/** Static description of a body region. Lives in `core/config/bodyRegions.config.ts`. */
export interface BodyRegionDefinition {
  id: BodyRegionId;
  labelKey: string;
  /** i18n key — what this organ/system does (plain language). */
  functionKey: string;
  /** i18n key — how spaceflight threatens it. */
  spaceRiskKey: string;
  /** Metrics shown for this region (derived from MetricDefinition.bodyRegions). */
  metrics: MetricId[];
  hazards: HazardId[];
  sourceIds: string[];
}
