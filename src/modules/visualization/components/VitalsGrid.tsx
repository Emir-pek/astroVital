import { useTranslation } from 'react-i18next';
import { METRIC_IDS, METRICS } from '@core/config/metrics.config';
import { useLatestByMetric } from '@core/store';
import { Card, StatusBadge } from '@core/ui';
import { formatNumber, formatRelative } from '@core/utils/format';
import { useCrewHealth } from '@modules/assessment';

export interface VitalsGridProps {
  crewId: string;
}

/**
 * Latest value per metric.
 * TODO(Engineer 4, P1): sparklines, unit preferences (°F / mmol/L via core/utils/units),
 * animated value changes, source icon (camera/keyboard/...).
 */
export function VitalsGrid({ crewId }: VitalsGridProps) {
  const { t, i18n } = useTranslation();
  const latest = useLatestByMetric(crewId);
  const health = useCrewHealth(crewId);

  return (
    <Card title={t('visualization.vitals.title')}>
      <ul className="grid grid-cols-2 gap-3 lg:grid-cols-3">
        {METRIC_IDS.map((id) => {
          const def = METRICS[id];
          const m = latest[id];
          const a = health.assessments.find((x) => x.metric === id);
          return (
            <li key={id} className="rounded-lg border border-border bg-surface-2 p-3">
              <p className="text-xs text-muted">{t(def.labelKey)}</p>
              {m ? (
                <>
                  <p className="font-mono text-2xl">
                    {formatNumber(m.value, def.step, i18n.language)}
                    <span className="ml-1 text-sm text-muted">{def.unit}</span>
                  </p>
                  <div className="mt-1 flex items-center justify-between gap-2">
                    {a && (
                      <StatusBadge size="sm" status={a.status} label={t(`status.${a.status}`)} />
                    )}
                    <span className="text-[11px] text-muted">
                      {formatRelative(m.timestamp, i18n.language)}
                    </span>
                  </div>
                </>
              ) : (
                <p className="text-sm text-muted">{t('common.noData')}</p>
              )}
            </li>
          );
        })}
      </ul>
    </Card>
  );
}
