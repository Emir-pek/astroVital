export { DEMO_CREW } from './crew';
export { generateHistory } from './generator';
export { createRng, mulberry32, type Rng } from './prng';
export {
  SCENARIO_IDS,
  SCENARIOS,
  type ScenarioContext,
  type ScenarioDefinition,
  type ScenarioEffect,
} from './scenarios';

/** Default demo parameters (Settings page can change them). */
export const DEMO_DEFAULTS = {
  seed: 2026,
  days: 30,
} as const;
