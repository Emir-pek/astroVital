import type { MetricId, RegionHealth, Status } from '@core/types';
import { worstStatus } from '@core/utils';

/** Level of the LED box edges (`<html data-led>`, tokens.css "LED box edges"). */
export type LedLevel = Status;

/**
 * LED level for the signed-in astronaut = worst status of any body region, counting only
 * assessments that belong to `crewId` and whose metric is still fresh — the same rule the body
 * map uses (`regionDisplayStatus`), so the box edges never disagree with the figure:
 *   - stale readings never raise the level (no false warning from old data);
 *   - no crew, no data or only stale data → 'nominal', which the CSS draws as a dim neutral
 *     accent ring, not as a "healthy" colour.
 * Pure: the caller decides staleness (it owns `now` and the environment).
 */
export function ledLevel(
  regions: readonly RegionHealth[],
  crewId: string | null,
  isMetricStale: (metric: MetricId) => boolean,
): LedLevel {
  if (!crewId) return 'nominal';
  const statuses: Status[] = [];
  for (const region of regions) {
    for (const a of region.assessments) {
      if (a.crewId === crewId && !isMetricStale(a.metric)) statuses.push(a.status);
    }
  }
  return worstStatus(statuses);
}
