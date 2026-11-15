import { METRICS, METRIC_IDS, THRESHOLDS } from '@core/config';
import type { Assessment, EnvironmentProfile, Measurement, MetricId } from '@core/types';
import type { DisplayStatus, GaugeBand } from '@core/ui';
import { STATUS_ORDER, isStale } from '@core/utils';

export type VitalCardId = MetricId | 'bloodPressure';

export const PRIMARY_CARDS: readonly VitalCardId[] = [
  'heartRate',
  'bloodPressure',
  'spo2',
  'bodyTemp',
  'sleepHours',
  'mood',
];

export interface VitalCardModel {
  id: VitalCardId;
  metrics: MetricId[];
  labelKey: string;
  values: number[];
  unit: string;
  step: number;
  status: DisplayStatus;
  direction: 'up' | 'down' | null;
  measuredAt: string | null;
  gauge: { value: number; min: number; max: number; bands: GaugeBand[] } | null;
}

interface CardInput {
  latest: Partial<Record<MetricId, Measurement>>;
  assessments: Assessment[];
  env: EnvironmentProfile;
  now: Date;
}

const BP_METRICS: readonly MetricId[] = ['systolicBP', 'diastolicBP'];

/**
 * Which side of the nominal band a value is on. Environment modifiers are ignored:
 * the arrow is only shown for non-nominal statuses, so the side is unambiguous.
 */
export function outOfRangeDirection(metric: MetricId, value: number): 'up' | 'down' | null {
  const nominal = THRESHOLDS[metric].bands.find((b) => b.status === 'nominal');
  if (!nominal) return null;
  if (nominal.max !== undefined && value >= nominal.max) return 'up';
  if (nominal.min !== undefined && value < nominal.min) return 'down';
  return null;
}

/** Non-nominal threshold bands clipped to the metric's plausible range. */
export function gaugeBands(metric: MetricId): GaugeBand[] {
  const { min: lo, max: hi } = METRICS[metric];
  const bands: GaugeBand[] = [];
  for (const b of THRESHOLDS[metric].bands) {
    if (b.status === 'nominal') continue;
    const from = Math.max(b.min ?? -Infinity, lo);
    const to = Math.min(b.max ?? Infinity, hi);
    if (from < to) bands.push({ from, to, status: b.status });
  }
  return bands;
}

function buildCard(id: VitalCardId, input: CardInput): VitalCardModel {
  const metrics: MetricId[] = id === 'bloodPressure' ? [...BP_METRICS] : [id];
  const primary: MetricId = id === 'bloodPressure' ? 'systolicBP' : id;
  const def = METRICS[primary];
  const measurements = metrics.flatMap((m) => {
    const found = input.latest[m];
    return found ? [found] : [];
  });
  const lead = input.latest[primary];
  const anyStale = measurements.some((m) => isStale(m.timestamp, m.metric, input.env, input.now));
  const own = input.assessments.filter((a) => metrics.includes(a.metric));

  let status: DisplayStatus = 'none';
  let direction: 'up' | 'down' | null = null;
  if (measurements.length > 0) {
    if (anyStale) status = 'stale';
    else if (own.length > 0) {
      const worst = own.reduce((w, a) => (STATUS_ORDER[a.status] > STATUS_ORDER[w.status] ? a : w));
      status = worst.status;
      const value = input.latest[worst.metric]?.value;
      if (worst.status !== 'nominal' && value !== undefined) {
        direction = outOfRangeDirection(worst.metric, value);
      }
    }
  }

  const gauge =
    lead && THRESHOLDS[primary].basis !== 'cumulativeSum'
      ? { value: lead.value, min: def.min, max: def.max, bands: gaugeBands(primary) }
      : null;

  return {
    id,
    metrics,
    labelKey: id === 'bloodPressure' ? 'visualization.vitals.bloodPressure' : def.labelKey,
    values: measurements.map((m) => m.value),
    unit: def.unit,
    step: def.step,
    status,
    direction,
    measuredAt: lead?.timestamp ?? measurements[0]?.timestamp ?? null,
    gauge,
  };
}

/**
 * Cards for the Status screen: the six primary cards always, then any other metric whose
 * card is neither nominal nor empty, so no problem stays hidden.
 */
export function buildVitalCards(input: CardInput): VitalCardModel[] {
  const primary = PRIMARY_CARDS.map((id) => buildCard(id, input));
  const extras = METRIC_IDS.filter((m) => !PRIMARY_CARDS.includes(m) && !BP_METRICS.includes(m))
    .map((m) => buildCard(m, input))
    .filter((c) => c.status !== 'nominal' && c.status !== 'none');
  return [...primary, ...extras];
}

/** Rail order: what needs attention first; the primary order is kept within each status. */
const SEVERITY: Record<DisplayStatus, number> = {
  warning: 5,
  caution: 4,
  advisory: 3,
  stale: 2,
  none: 1,
  nominal: 0,
};

/** Non-nominal cards first (warning → caution → advisory → stale → no data), stable otherwise. */
export function sortBySeverity(cards: readonly VitalCardModel[]): VitalCardModel[] {
  return [...cards].sort((a, b) => SEVERITY[b.status] - SEVERITY[a.status]);
}
