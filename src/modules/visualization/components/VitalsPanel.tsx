import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useActiveEnvironment, useLatestByMetric } from '@core/store';
import { ValueCard } from '@core/ui';
import { formatNumber, formatRelative } from '@core/utils';
import { useCrewHealth } from '@modules/assessment';
import { useNow } from '../hooks/useNow';
import { buildVitalCards, type VitalCardModel } from '../services/vitalCards';

export interface VitalsPanelProps {
  crewId: string;
}

/** Value cards of the Status screen: latest values, status, out-of-range arrow, data age. */
export function VitalsPanel({ crewId }: VitalsPanelProps) {
  const { t, i18n } = useTranslation();
  const latest = useLatestByMetric(crewId);
  const health = useCrewHealth(crewId);
  const env = useActiveEnvironment();
  const now = useNow();
  const lang = i18n.language;

  const cards = useMemo(
    () => buildVitalCards({ latest, assessments: health.assessments, env, now }),
    [latest, health.assessments, env, now],
  );

  const measuredText = (card: VitalCardModel): string => {
    if (!card.measuredAt) return t('common.noData');
    const when = formatRelative(card.measuredAt, lang);
    return card.status === 'stale'
      ? t('visualization.vitals.staleText', { when })
      : t('common.lastMeasured', { when });
  };

  return (
    <ul aria-label={t('visualization.vitals.title')} className="flex flex-col gap-touch-gap">
      {cards.map((card) => {
        const label = t(card.labelKey);
        const statusLabel =
          card.status === 'stale' || card.status === 'none'
            ? t(`visualization.status.${card.status}`)
            : t(`status.${card.status}`);
        return (
          <li key={card.id}>
            <ValueCard
              label={label}
              value={
                card.values.length > 0
                  ? card.values.map((v) => formatNumber(v, card.step, lang)).join('/')
                  : '—'
              }
              unit={card.unit}
              status={card.status}
              statusLabel={statusLabel}
              direction={card.direction}
              directionLabel={
                card.direction
                  ? t(`visualization.vitals.${card.direction === 'up' ? 'above' : 'below'}`)
                  : undefined
              }
              measuredText={measuredText(card)}
              gauge={
                card.gauge
                  ? { ...card.gauge, label: t('visualization.vitals.gauge', { metric: label }) }
                  : undefined
              }
            />
          </li>
        );
      })}
    </ul>
  );
}
