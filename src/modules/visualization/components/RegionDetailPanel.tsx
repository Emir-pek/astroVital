import { useTranslation } from 'react-i18next';
import { BODY_REGIONS } from '@core/config/bodyRegions.config';
import { METRICS } from '@core/config/metrics.config';
import { useLatestByMetric } from '@core/store';
import type { BodyRegionId } from '@core/types';
import { StatusBadge, Tile } from '@core/ui';
import { formatNumber, formatRelative } from '@core/utils';
import { RecommendationList, useCrewHealth } from '@modules/assessment';

export interface RegionDetailPanelProps {
  crewId: string;
  region: BodyRegionId;
}

const HEADING = 'mb-2 text-headline font-semibold text-text';

/**
 * Learn / detail content of one body region. Section order is fixed and action comes first:
 * what to do, current values, why it matters, what it is, source and data age.
 */
export function RegionDetailPanel({ crewId, region }: RegionDetailPanelProps) {
  const { t, i18n } = useTranslation();
  const health = useCrewHealth(crewId);
  const latest = useLatestByMetric(crewId);
  const lang = i18n.language;

  const def = BODY_REGIONS[region];
  const assessments = health.regions.find((r) => r.region === region)?.assessments ?? [];
  const recommendations = assessments.flatMap((a) => a.recommendations);
  const sourceIds = [...new Set([...def.sourceIds, ...assessments.flatMap((a) => a.sourceIds)])];
  const newest = assessments
    .map((a) => latest[a.metric]?.timestamp)
    .filter((ts): ts is string => Boolean(ts))
    .sort()
    .at(-1);

  return (
    <div className="flex flex-col gap-6">
      <section>
        <h3 className={HEADING}>{t('visualization.regionDetail.whatToDo')}</h3>
        {recommendations.length > 0 ? (
          <RecommendationList recommendations={recommendations} />
        ) : (
          <p className="text-body text-text-2">{t('visualization.regionDetail.nothingToDo')}</p>
        )}
      </section>

      <section>
        <h3 className={HEADING}>{t('visualization.regionDetail.currentValues')}</h3>
        {assessments.length === 0 ? (
          <p className="text-body text-text-2">{t('visualization.regionDetail.noMetrics')}</p>
        ) : (
          <ul className="flex flex-col gap-3">
            {assessments.map((a) => {
              const metric = METRICS[a.metric];
              return (
                <Tile
                  as="li"
                  key={a.metric}
                  className="flex flex-wrap items-center justify-between gap-3"
                >
                  <span className="text-body text-text">{t(metric.labelKey)}</span>
                  <span className="flex items-center gap-3">
                    <span className="font-mono text-headline text-text">
                      {formatNumber(a.value, metric.step, lang)}
                      <span className="ml-1 text-label text-text-2">{metric.unit}</span>
                    </span>
                    <StatusBadge size="sm" status={a.status} label={t(`status.${a.status}`)} />
                  </span>
                </Tile>
              );
            })}
          </ul>
        )}
      </section>

      {assessments.length > 0 && (
        <section>
          <h3 className={HEADING}>{t('visualization.regionDetail.whyItMatters')}</h3>
          <ul className="flex flex-col gap-2 text-body text-text-2">
            {assessments.map((a) => (
              <li key={a.metric}>
                {t(a.explanationKey, { metric: t(METRICS[a.metric].labelKey), ...a.messageParams })}
              </li>
            ))}
          </ul>
        </section>
      )}

      <section>
        <h3 className={HEADING}>{t('visualization.regionDetail.function')}</h3>
        <p className="text-body text-text-2">{t(def.functionKey)}</p>
      </section>

      <section>
        <h3 className={HEADING}>{t('visualization.regionDetail.spaceRisk')}</h3>
        <p className="text-body text-text-2">{t(def.spaceRiskKey)}</p>
      </section>

      <section>
        <h3 className={HEADING}>{t('visualization.regionDetail.sourceAndAge')}</h3>
        <p className="text-label text-text-2">
          {t('common.sources')}: {sourceIds.length > 0 ? sourceIds.join(', ') : '—'}
        </p>
        <p className="text-label text-text-2">
          {newest
            ? t('common.lastMeasured', { when: formatRelative(newest, lang) })
            : t('common.noData')}
        </p>
      </section>
    </div>
  );
}
