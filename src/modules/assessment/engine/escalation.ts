import type { EnvironmentProfile, Escalation } from '@core/types';

/**
 * docs/THRESHOLDS.md § Eskalasyon kuralı 2: a `flight_surgeon` call is upgraded to `emergency`
 * when the environment's medical capability is `autonomous` (Mars) — ground support cannot
 * respond in time, so the crew medical officer must act now; the flight surgeon is informed
 * asynchronously (see `engine/recommendations.ts`). Applied last, after every other rule has
 * produced its escalation, so it upgrades regardless of which rule raised `flight_surgeon`.
 */
export function finalizeEscalation(
  escalation: Escalation,
  environment: Pick<EnvironmentProfile, 'medicalCapability'>,
): Escalation {
  if (escalation === 'flight_surgeon' && environment.medicalCapability === 'autonomous') {
    return 'emergency';
  }
  return escalation;
}
