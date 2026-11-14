import { useTranslation } from 'react-i18next';
import { BODY_REGIONS } from '@core/config/bodyRegions.config';
import { METRICS } from '@core/config/metrics.config';
import type { BodyRegionId } from '@core/types';
import { Card, EmptyState, StatusBadge } from '@core/ui';
import { formatNumber } from '@core/utils/format';
import { RecommendationList, useCrewHealth } from '@modules/assessment';

export interface RegionDetailPanelProps {
  crewId: string;
  region: BodyRegionId | null;
}

/**
 * Region function + space risk + related metrics + recommendations.
 * TODO(Engineer 4, P0): slide-in animation (Framer Motion), hazard chips, mini trend per metric,
 * "Learn more" link to LearnPanel.
 */
export function RegionDetailPanel({ crewId, region }: RegionDetailPanelProps) {
  const { t } = useTranslation();
  const health = useCrewHealth(crewId);

  if (!region) {
    return (
      <Card title={t('visualization.regionDetail.title')}>
        <EmptyState title={t('visualization.regionDetail.empty')} />
      </Card>
    );
  }

  const def = BODY_REGIONS[region];
  const regionHealth = health.regions.find((r) => r.region === region);
  const assessments = regionHealth?.assessments ?? [];

  return (
    <Card
      title={t(def.labelKey)}
      actions={
        regionHealth && (
          <StatusBadge status={regionHealth.status} label={t(`status.${regionHealth.status}`)} />
        )
      }
    >
      <h3 className="text-sm font-semibold text-accent">
        {t('visualization.regionDetail.function')}
      </h3>
      <p className="mb-3 text-sm text-muted">{t(def.functionKey)}</p>
      <h3 className="text-sm font-semibold text-accent">
        {t('visualization.regionDetail.spaceRisk')}
      </h3>
      <p className="mb-3 text-sm text-muted">{t(def.spaceRiskKey)}</p>

      <h3 className="mb-2 text-sm font-semibold text-accent">
        {t('visualization.regionDetail.metrics')}
      </h3>
      {assessments.length === 0 ? (
        <p className="mb-3 text-sm text-muted">{t('visualization.regionDetail.noMetrics')}</p>
      ) : (
        <ul className="mb-3 flex flex-col gap-1">
          {assessments.map((a) => {
            const m = METRICS[a.metric];
            return (
              <li key={a.metric} className="flex items-center justify-between text-sm">
                <span>{t(m.labelKey)}</span>
                <span className="flex items-center gap-2 font-mono">
                  {formatNumber(a.value, m.step)} {m.unit}
                  <StatusBadge size="sm" status={a.status} label={t(`status.${a.status}`)} />
                </span>
              </li>
            );
          })}
        </ul>
      )}

      <h3 className="mb-2 text-sm font-semibold text-accent">
        {t('assessment.recommendations.title')}
      </h3>
      <RecommendationList recommendations={assessments.flatMap((a) => a.recommendations)} />
    </Card>
  );
}
