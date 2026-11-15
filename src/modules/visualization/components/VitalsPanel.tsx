import { clsx } from 'clsx';
import { useId, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useActiveEnvironment, useLatestByMetric } from '@core/store';
import { BOX, VitalRow } from '@core/ui';
import { formatNumber, formatRelative } from '@core/utils';
import { useCrewHealth } from '@modules/assessment';
import { useNow } from '../hooks/useNow';
import { buildVitalCards, sortBySeverity, type VitalCardModel } from '../services/vitalCards';

export interface VitalsPanelProps {
  crewId: string;
}

/**
 * The vitals rail of the Status screen (spec §7.1, ADR-036): one card, one compact row per vital
 * (value, status, out-of-range arrow, mini gauge), what needs attention first. If more rows than
 * fit appear (extra non-nominal metrics), the list scrolls inside the rail, not the page.
 */
export function VitalsPanel({ crewId }: VitalsPanelProps) {
  const { t, i18n } = useTranslation();
  const latest = useLatestByMetric(crewId);
  const health = useCrewHealth(crewId);
  const env = useActiveEnvironment();
  const now = useNow();
  const lang = i18n.language;

  const cards = useMemo(
    () => sortBySeverity(buildVitalCards({ latest, assessments: health.assessments, env, now })),
    [latest, health.assessments, env, now],
  );

  const measuredText = (card: VitalCardModel): string => {
    if (!card.measuredAt) return t('common.noData');
    const when = formatRelative(card.measuredAt, lang);
    return card.status === 'stale'
      ? t('visualization.vitals.staleText', { when })
      : t('common.lastMeasured', { when });
  };

  const titleId = useId();

  return (
    // A flush Panel: the rows carry the panel's horizontal padding so the dividers stay inset.
    <div className={clsx(BOX.panelFlush, 'flex h-full min-h-0 flex-col')}>
      <h2 id={titleId} className="px-panel pt-tile pb-1 text-label font-semibold text-text-2">
        {t('visualization.vitals.title')}
      </h2>
      <ul
        aria-labelledby={titleId}
        className="flex min-h-0 flex-1 flex-col divide-y divide-line overflow-y-auto px-panel pb-2"
      >
        {cards.map((card) => {
          const label = t(card.labelKey);
          const statusLabel =
            card.status === 'stale' || card.status === 'none'
              ? t(`visualization.status.${card.status}`)
              : t(`status.${card.status}`);
          return (
            <li key={card.id} className="min-h-[88px] flex-1">
              <VitalRow
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
                    ? {
                        ...card.gauge,
                        label: t('visualization.vitals.gauge', { metric: label }),
                        offScaleLabel: t('visualization.vitals.offScale'),
                      }
                    : undefined
                }
              />
            </li>
          );
        })}
      </ul>
    </div>
  );
}
