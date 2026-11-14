import type { Measurement } from '@core/types';
import { MS_PER_DAY, MS_PER_HOUR } from '@core/utils/time';

export type TrendRange = '24h' | '7d' | '30d' | 'all';
export const TREND_RANGES: readonly TrendRange[] = ['24h', '7d', '30d', 'all'] as const;

const RANGE_MS: Record<Exclude<TrendRange, 'all'>, number> = {
  '24h': 24 * MS_PER_HOUR,
  '7d': 7 * MS_PER_DAY,
  '30d': 30 * MS_PER_DAY,
};

/** Keeps measurements inside the range ending at `now`. Pure. */
export const filterByRange = (
  series: Measurement[],
  range: TrendRange,
  now: Date,
): Measurement[] => {
  if (range === 'all') return series;
  const from = now.getTime() - RANGE_MS[range];
  return series.filter((m) => {
    const t = Date.parse(m.timestamp);
    return t >= from && t <= now.getTime();
  });
};
