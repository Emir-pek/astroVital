/**
 * Simulation contracts (demo data — there is no real dataset for this challenge).
 * SINGLE SOURCE OF TRUTH — mirror changes in docs/CONTRACTS.md.
 */
import type { CrewMember } from './crew';
import type { EnvironmentProfile } from './environment';

export type ScenarioId =
  | 'nominal'
  | 'space_adaptation'
  | 'solar_particle_event'
  | 'isolation_stress'
  | 'fever_dehydration'
  | 'orthostatic_return';

export interface GenerateHistoryOptions {
  /** PRNG seed — same seed + same options ⇒ identical output. */
  seed: number;
  crew: CrewMember[];
  environment: EnvironmentProfile;
  scenario: ScenarioId;
  /** Number of mission days to generate (30–180 recommended). */
  days: number;
  /** Last generated day (keeps the function pure). Usually "now". */
  end: Date;
}
