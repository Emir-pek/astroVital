import type { ThresholdBand, ThresholdModifier } from '@core/types';

/**
 * Environment threshold-boundary formula (docs/THRESHOLDS.md § Ortam düzeltmeleri):
 *   b' = b + shift + sign(b - c) * widen
 * `shift` moves every boundary uniformly; `widen` moves a boundary away from (positive) or
 * toward (negative) the centre `c` of the metric's nominal (green) band. `±Infinity`
 * boundaries (open-ended bands) are left untouched — there is nothing to shift.
 */
export function applyModifier(
  boundary: number | undefined,
  modifier: ThresholdModifier | undefined,
  centre: number,
): number | undefined {
  if (boundary === undefined || !modifier) return boundary;
  const { shift = 0, widen = 0 } = modifier;
  const sign = Math.sign(boundary - centre);
  return boundary + shift + sign * widen;
}

/** Centre `c` of a metric's nominal band — midpoint of its bounds, or the one finite bound. */
export function nominalCentre(bands: ThresholdBand[]): number {
  const nominal = bands.find((b) => b.status === 'nominal');
  if (!nominal) return 0;
  const { min, max } = nominal;
  if (min !== undefined && max !== undefined) return (min + max) / 2;
  return min ?? max ?? 0;
}

/**
 * Applies an environment's threshold modifier to every band boundary of a metric.
 * Bands stay half-open `[min, max)`, contiguous and non-overlapping (the shift/widen is the
 * same additive transform on every boundary, so adjacency is preserved).
 */
export function applyModifierToBands(
  bands: ThresholdBand[],
  modifier: ThresholdModifier | undefined,
): ThresholdBand[] {
  if (!modifier) return bands;
  const centre = nominalCentre(bands);
  return bands.map((band) => ({
    ...band,
    min: applyModifier(band.min, modifier, centre),
    max: applyModifier(band.max, modifier, centre),
  }));
}

/**
 * Finds the band whose half-open interval `[min, max)` contains `value`.
 * Missing `min` = -Infinity, missing `max` = +Infinity. Bands are assumed contiguous and
 * non-overlapping (enforced by `src/core/config/__tests__/config.test.ts`), so at most one
 * band matches; falls back to the last band if `value` is outside every interval (should not
 * happen given the invariant, but keeps the engine total rather than throwing).
 */
export function findBand(value: number, bands: ThresholdBand[]): ThresholdBand {
  const match = bands.find(
    (b) => value >= (b.min ?? -Infinity) && value < (b.max ?? Number.POSITIVE_INFINITY),
  );
  return match ?? bands[bands.length - 1]!;
}
