import type { Measurement, MetricThreshold, Status } from '@core/types';

export type TrendDirection = 'improving' | 'stable' | 'worsening' | 'unknown';

export interface DailyPoint {
  /** UTC calendar day, `YYYY-MM-DD`. */
  date: string;
  /** Daily value — the day's LAST measurement (docs/modules/assessment.md). */
  value: number;
}

export interface TrendResult {
  trend: TrendDirection;
  /** Set when `trend === 'worsening'` — the status the metric's `trend` rule demands. */
  statusOverride?: Status;
}

/**
 * Reduces a metric's measurement history to one value per UTC calendar day — the day's LAST
 * measurement (docs/modules/assessment.md: "günlük değer = o günün son ölçümü"). Ascending by
 * date. `history` should already be filtered to one crew member + one metric.
 */
export function dailyLastValues(history: Measurement[], now: Date): DailyPoint[] {
  const today = now.toISOString().slice(0, 10);
  const byDay = new Map<string, Measurement>();
  for (const m of history) {
    const day = m.timestamp.slice(0, 10);
    if (day > today) continue; // ignore anything timestamped after "now"
    const prev = byDay.get(day);
    if (!prev || prev.timestamp < m.timestamp) byDay.set(day, m);
  }
  return [...byDay.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, m]) => ({ date, value: m.value }));
}

/** Whole days between two `YYYY-MM-DD` UTC dates. */
function daysBetween(a: string, b: string): number {
  return Math.round((Date.parse(`${b}T00:00:00Z`) - Date.parse(`${a}T00:00:00Z`)) / 86_400_000);
}

const mean = (points: DailyPoint[]): number =>
  points.reduce((sum, p) => sum + p.value, 0) / points.length;

/**
 * Worsening/improving/stable trend over `trendConfig.windowDays`, per docs/THRESHOLDS.md:
 * "sistolik 7 günde ±%10 → sarı; nabız 7 günde ±%15 → sarı; ruh hali 3 günde −%25 → kırmızı".
 *
 * The SIGN of `deltaPct` in the metric's config carries the "which direction is worse" rule,
 * so this stays generic across metrics: a positive `deltaPct` means an INCREASE of that size is
 * worsening (systolic, heart rate); a negative `deltaPct` means a DECREASE of that size is
 * worsening (mood). This is the "hareketli ortalama" half of the spec: the window's daily
 * points are split in half and the two halves' MEANS are compared, not just the two endpoint
 * values — one noisy day can no longer flip the verdict on its own (docs/DEMO_CREW_STORIES.md
 * flags exactly this risk for the integer 1–5 `mood` scale).
 */
export function evaluateTrend(
  trendConfig: MetricThreshold['trend'],
  daily: DailyPoint[],
): TrendResult {
  if (!trendConfig) return { trend: 'unknown' };
  const { windowDays, deltaPct, status } = trendConfig;
  if (daily.length < 2) return { trend: 'unknown' };

  const newest = daily[daily.length - 1]!;
  const window = daily.filter((d) => daysBetween(d.date, newest.date) <= windowDays);
  if (window.length < 2) return { trend: 'unknown' };

  const mid = Math.ceil(window.length / 2);
  const earlierMean = mean(window.slice(0, mid));
  const laterMean = mean(window.slice(mid));
  if (earlierMean === 0) return { trend: 'unknown' };

  const pctChange = ((laterMean - earlierMean) / Math.abs(earlierMean)) * 100;

  const worsening = deltaPct > 0 ? pctChange >= deltaPct : pctChange <= deltaPct;
  const improving = deltaPct > 0 ? pctChange <= -deltaPct : pctChange >= -deltaPct;

  if (worsening) return { trend: 'worsening', statusOverride: status };
  if (improving) return { trend: 'improving' };
  return { trend: 'stable' };
}

/**
 * docs/THRESHOLDS.md § Eskalasyon kuralı 3, second clause: "bir metrikte 3 ölçüm üst üste
 * kötüleşen trend → crew_medical_officer". Distinct from `evaluateTrend`'s %-change-over-window
 * check: this looks at the last `count` daily points and asks whether EVERY consecutive step
 * moved in the metric's "worse" direction (same sign convention as `deltaPct`).
 */
export function isMonotonicWorsening(daily: DailyPoint[], deltaPct: number, count = 3): boolean {
  if (daily.length < count) return false;
  const last = daily.slice(-count);
  for (let i = 1; i < last.length; i++) {
    const diff = last[i]!.value - last[i - 1]!.value;
    if (deltaPct > 0 ? diff <= 0 : diff >= 0) return false;
  }
  return true;
}
