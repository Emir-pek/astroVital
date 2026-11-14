import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Navigate, useNavigate, useParams } from 'react-router';
import { METRIC_IDS, METRICS } from '@core/config/metrics.config';
import { useCrew, useCrewMember, useHealthStore } from '@core/store';
import type { BodyRegionId, MetricId } from '@core/types';
import { EmptyState } from '@core/ui';
import {
  BodyMap,
  MetricTrendChart,
  RegionDetailPanel,
  TREND_RANGES,
  VitalsGrid,
  type TrendRange,
} from '@modules/visualization';
import { PageHeader } from './PageHeader';

/** `/crew` → redirect to the selected (or first) crew member. */
export function CrewIndexRedirect() {
  const selected = useHealthStore((s) => s.selectedCrewId);
  const crew = useCrew();
  const id = selected ?? crew[0]?.id;
  return id ? <Navigate to={`/crew/${id}`} replace /> : <Navigate to="/" replace />;
}

/** `/crew/:id` — BodyMap + RegionDetailPanel + VitalsGrid + MetricTrendChart. */
export function CrewMemberPage() {
  const { t } = useTranslation();
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const member = useCrewMember(id);
  const crew = useCrew();
  const setSelectedCrew = useHealthStore((s) => s.setSelectedCrew);

  const [region, setRegion] = useState<BodyRegionId | null>(null);
  const [metric, setMetric] = useState<MetricId>('heartRate');
  const [range, setRange] = useState<TrendRange>('30d');

  useEffect(() => {
    if (member) setSelectedCrew(member.id);
  }, [member, setSelectedCrew]);

  if (!member) return <EmptyState title={t('pages.crew.notFound')} />;

  return (
    <>
      <PageHeader
        title={`${member.name} — ${member.role}`}
        subtitle={t('pages.crew.subtitle')}
        actions={
          <label className="flex items-center gap-2 text-sm">
            <span className="text-muted">{t('pages.crew.selectCrew')}</span>
            <select
              value={member.id}
              onChange={(e) => navigate(`/crew/${e.target.value}`)}
              className="min-h-10 rounded-lg border border-border bg-surface-2 px-2"
            >
              {crew.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>
        }
      />
      <div className="grid gap-4 lg:grid-cols-2">
        <BodyMap crewId={member.id} selectedRegion={region} onRegionSelect={setRegion} />
        <RegionDetailPanel crewId={member.id} region={region} />
      </div>
      <div className="mt-4">
        <VitalsGrid crewId={member.id} />
      </div>
      <div className="mt-4 flex flex-col gap-3">
        <div className="flex flex-wrap gap-3 text-sm">
          <label className="flex items-center gap-2">
            <span className="text-muted">{t('pages.crew.metricLabel')}</span>
            <select
              value={metric}
              onChange={(e) => setMetric(e.target.value as MetricId)}
              className="min-h-10 rounded-lg border border-border bg-surface-2 px-2"
            >
              {METRIC_IDS.map((m) => (
                <option key={m} value={m}>
                  {t(METRICS[m].labelKey)}
                </option>
              ))}
            </select>
          </label>
          <label className="flex items-center gap-2">
            <span className="text-muted">{t('pages.crew.rangeLabel')}</span>
            <select
              value={range}
              onChange={(e) => setRange(e.target.value as TrendRange)}
              className="min-h-10 rounded-lg border border-border bg-surface-2 px-2"
            >
              {TREND_RANGES.map((r) => (
                <option key={r} value={r}>
                  {t(`visualization.trend.range.${r}`)}
                </option>
              ))}
            </select>
          </label>
        </div>
        <MetricTrendChart crewId={member.id} metric={metric} range={range} />
      </div>
    </>
  );
}
