import type { CrewMember, Measurement } from '@core/types';

/**
 * Career-cumulative radiation dose at the moment of `uptoTimestampIso` (inclusive):
 * `priorRadiationMSv + Σ daily doses so far` (docs/THRESHOLDS.md "basis: cumulativeSum").
 * `history` is one crew member's full measurement history (any order, any metric).
 */
export function cumulativeRadiation(
  crew: Pick<CrewMember, 'priorRadiationMSv'>,
  history: Measurement[],
  uptoTimestampIso: string,
): number {
  const prior = crew.priorRadiationMSv ?? 0;
  const sumSoFar = history
    .filter((m) => m.metric === 'radiationDose' && m.timestamp <= uptoTimestampIso)
    .reduce((total, m) => total + m.value, 0);
  return prior + sumSoFar;
}

/**
 * Solar Particle Event heuristic (docs/THRESHOLDS.md § Eskalasyon kuralı 6): a single day's dose
 * spiking past `multiplier` × the environment's expected daily dose is treated as a suspected
 * SPE — red, flight surgeon, shelter — regardless of where the cumulative dose sits.
 */
export function isSolarParticleEvent(
  dailyDoseMSv: number,
  expectedDailyRadiationMSv: number,
  multiplier: number,
): boolean {
  return dailyDoseMSv > multiplier * expectedDailyRadiationMSv;
}
