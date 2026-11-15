import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useHealthStore } from '@core/store';
import { Segmented } from '@core/ui';
import { MetricTrendChart, TREND_RANGES, type TrendRange } from '@modules/visualization';
import { PageHeader } from './PageHeader';

/** Route "/history": trends of the measurements of the signed-in astronaut. */
export function HistoryPage() {
  const { t } = useTranslation();
  const crewId = useHealthStore((s) => s.selectedCrewId);
  const [range, setRange] = useState<TrendRange>('7d');
  return (
    <>
      <PageHeader
        title={t('pages.history.title')}
        subtitle={t('pages.history.subtitle')}
        actions={
          <Segmented
            label={t('pages.history.rangeLabel')}
            fill
            value={range}
            options={TREND_RANGES.map((r) => ({
              value: r,
              label: t(`visualization.trend.range.${r}`),
            }))}
            onChange={setRange}
          />
        }
      />
      {crewId && <MetricTrendChart crewId={crewId} metric="heartRate" range={range} />}
    </>
  );
}
