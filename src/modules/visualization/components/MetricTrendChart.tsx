import { LineChart } from 'lucide-react';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { METRICS } from '@core/config/metrics.config';
import { useMetricSeries } from '@core/store';
import type { MetricId } from '@core/types';
import { Card, EmptyState, PlaceholderNotice } from '@core/ui';
import { filterByRange, type TrendRange } from '../services/timeRange';

export interface MetricTrendChartProps {
  crewId: string;
  metric: MetricId;
  range: TrendRange;
}

/**
 * STUB: shows the number of points only.
 * TODO(Engineer 4, P1): Recharts line chart, green/yellow/red ReferenceArea bands from
 * THRESHOLDS (+ environment modifiers), anomaly dots, live update while simulation runs.
 */
export function MetricTrendChart({ crewId, metric, range }: MetricTrendChartProps) {
  const { t } = useTranslation();
  const series = useMetricSeries(crewId, metric);
  const points = useMemo(() => filterByRange(series, range, new Date()), [series, range]);

  return (
    <Card
      title={`${t('visualization.trend.title')} — ${t(METRICS[metric].labelKey)} (${t(`visualization.trend.range.${range}`)})`}
      placeholder
    >
      <PlaceholderNotice text={t('common.stubNotice', { owner: 'Engineer 4' })} />
      <EmptyState
        icon={<LineChart aria-hidden="true" className="size-8" />}
        title={t('visualization.trend.points', { count: points.length })}
      />
    </Card>
  );
}
