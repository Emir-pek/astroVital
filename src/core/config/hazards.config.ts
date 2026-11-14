import type { HazardDefinition, HazardId } from '@core/types';

/** NASA HRP "RIDGE" order: Radiation, Isolation, Distance, Gravity, Environment. */
export const HAZARD_IDS: readonly HazardId[] = [
  'radiation',
  'isolation',
  'distance',
  'gravity',
  'environment',
] as const;

export const HAZARDS: Record<HazardId, HazardDefinition> = {
  radiation: {
    id: 'radiation',
    labelKey: 'hazards.radiation.label',
    descriptionKey: 'hazards.radiation.description',
    countermeasuresKey: 'hazards.radiation.countermeasures',
    sourceIds: ['nasa-hrp-5-hazards', 'csa-radiation', 'nasa-std-3001'],
  },
  isolation: {
    id: 'isolation',
    labelKey: 'hazards.isolation.label',
    descriptionKey: 'hazards.isolation.description',
    countermeasuresKey: 'hazards.isolation.countermeasures',
    sourceIds: ['nasa-hrp-5-hazards', 'nasa-hrp-risks'],
  },
  distance: {
    id: 'distance',
    labelKey: 'hazards.distance.label',
    descriptionKey: 'hazards.distance.description',
    countermeasuresKey: 'hazards.distance.countermeasures',
    sourceIds: ['nasa-hrp-5-hazards', 'nasa-mars-comm-delay'],
  },
  gravity: {
    id: 'gravity',
    labelKey: 'hazards.gravity.label',
    descriptionKey: 'hazards.gravity.description',
    countermeasuresKey: 'hazards.gravity.countermeasures',
    sourceIds: ['nasa-hrp-5-hazards', 'nasa-hrp-risks', 'nasa-sans'],
  },
  environment: {
    id: 'environment',
    labelKey: 'hazards.environment.label',
    descriptionKey: 'hazards.environment.description',
    countermeasuresKey: 'hazards.environment.countermeasures',
    sourceIds: ['nasa-hrp-5-hazards', 'nasa-hrp-risks'],
  },
};
