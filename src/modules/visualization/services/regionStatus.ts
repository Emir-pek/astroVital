import type { MetricId, RegionHealth } from '@core/types';
import type { DisplayStatus } from '@core/ui';
import { worstStatus } from '@core/utils';

/** Display status of a body region: stale data never shows as a health status. */
export function regionDisplayStatus(
  region: RegionHealth,
  isMetricStale: (metric: MetricId) => boolean,
): DisplayStatus {
  if (region.assessments.length === 0) return 'none';
  const fresh = region.assessments.filter((a) => !isMetricStale(a.metric));
  if (fresh.length === 0) return 'stale';
  return worstStatus(fresh.map((a) => a.status));
}
