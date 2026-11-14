import { BellRing } from 'lucide-react';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { METRICS } from '@core/config/metrics.config';
import { useCrew } from '@core/store';
import { Card, EmptyState, StatusBadge } from '@core/ui';
import { ESCALATION_ORDER, STATUS_ORDER } from '@core/utils/status';
import { useAllCrewHealth } from '../hooks/useCrewHealth';

export interface AlertCenterProps {
  /** Dashboard widget mode: fewer details. */
  compact?: boolean;
  /** Max alerts to show. */
  limit?: number;
}

/**
 * Prioritised list of non-nominal assessments across the crew.
 * Sorting/aggregation is real; alerts appear automatically once the engine stops being a stub.
 * TODO(Engineer 3, P1): acknowledge button (module-local persisted store), escalation contact
 * info (incl. Mars comm delay), link to RecommendationList.
 */
export function AlertCenter({ compact = false, limit }: AlertCenterProps) {
  const { t } = useTranslation();
  const summaries = useAllCrewHealth();
  const crew = useCrew();

  const alerts = useMemo(() => {
    const list = summaries
      .flatMap((s) => s.assessments)
      .filter((a) => a.status !== 'nominal')
      .sort(
        (a, b) =>
          ESCALATION_ORDER[b.escalation] - ESCALATION_ORDER[a.escalation] ||
          STATUS_ORDER[b.status] - STATUS_ORDER[a.status],
      );
    return limit ? list.slice(0, limit) : list;
  }, [summaries, limit]);

  return (
    <Card title={t('assessment.alerts.title')}>
      {alerts.length === 0 ? (
        <EmptyState
          icon={<BellRing aria-hidden="true" className="size-6" />}
          title={t('assessment.alerts.empty')}
        />
      ) : (
        <ul className="flex flex-col gap-2">
          {alerts.map((a) => {
            const name = crew.find((c) => c.id === a.crewId)?.name ?? a.crewId;
            const metric = t(METRICS[a.metric].labelKey);
            return (
              <li
                key={`${a.crewId}-${a.metric}`}
                className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-surface-2 p-3"
              >
                <div>
                  <p className="font-medium">
                    {name} — {metric}
                  </p>
                  {!compact && (
                    <p className="text-sm text-muted">
                      {t(a.summaryKey, { metric, ...a.messageParams })}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <StatusBadge size="sm" status={a.status} label={t(`status.${a.status}`)} />
                  {!compact && (
                    <span className="text-xs text-muted">{t(`escalation.${a.escalation}`)}</span>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}
