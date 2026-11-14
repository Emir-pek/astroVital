import { useTranslation } from 'react-i18next';
import type { Recommendation } from '@core/types';
import { EmptyState, StatusBadge } from '@core/ui';

export interface RecommendationListProps {
  recommendations: Recommendation[];
}

/** Ordered, plain-language action list. STUB-level UI — Engineer 3 owns the final design. */
export function RecommendationList({ recommendations }: RecommendationListProps) {
  const { t } = useTranslation();
  if (recommendations.length === 0)
    return <EmptyState title={t('assessment.recommendations.empty')} />;

  return (
    <ol className="flex flex-col gap-3" aria-label={t('assessment.recommendations.title')}>
      {recommendations.map((r) => (
        <li key={r.id} className="rounded-lg border border-border bg-surface-2 p-3">
          <div className="mb-2 flex items-center justify-between gap-2">
            <span className="font-medium">{t(r.titleKey)}</span>
            <StatusBadge size="sm" status={r.urgency} label={t(`status.${r.urgency}`)} />
          </div>
          <ol className="list-decimal pl-5 text-sm text-muted">
            {r.stepsKeys.map((k) => (
              <li key={k}>{t(k)}</li>
            ))}
          </ol>
        </li>
      ))}
    </ol>
  );
}
