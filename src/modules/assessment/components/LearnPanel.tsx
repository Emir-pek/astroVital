import { useTranslation } from 'react-i18next';
import { HAZARD_IDS, HAZARDS } from '@core/config/hazards.config';
import { METRIC_IDS, METRICS } from '@core/config/metrics.config';
import type { MetricId, Status } from '@core/types';
import { Card, PlaceholderNotice, StatusBadge } from '@core/ui';

export interface LearnPanelProps {
  /** Show only one metric (e.g. from an alert). Omit = all metrics + the 5 hazards. */
  metric?: MetricId;
}

const STATUSES: Status[] = ['nominal', 'advisory', 'caution', 'warning'];

/**
 * Plain-language education: "What is it? / How to measure in space? / How does space affect
 * it? / What do the colours mean?" — never assume the astronaut knows medicine.
 * STUB: texts come from i18n; Engineer 3 adds per-metric "space effect", threshold tables,
 * sources and illustrations (P1).
 */
export function LearnPanel({ metric }: LearnPanelProps) {
  const { t } = useTranslation();
  const metrics = metric ? [metric] : METRIC_IDS;

  return (
    <div className="flex flex-col gap-6">
      <PlaceholderNotice text={t('common.stubNotice', { owner: 'Engineer 3' })} />

      <section aria-labelledby="learn-metrics">
        <h2 id="learn-metrics" className="mb-3 text-lg font-semibold">
          {t('assessment.learn.metricsTitle')}
        </h2>
        <div className="grid gap-4 md:grid-cols-2">
          {metrics.map((id) => {
            const def = METRICS[id];
            return (
              <Card key={id} title={`${t(def.labelKey)} (${def.unit})`}>
                <h3 className="text-sm font-semibold text-accent">
                  {t('assessment.learn.whatIs')}
                </h3>
                <p className="mb-2 text-sm text-muted">{t(def.descriptionKey)}</p>
                <h3 className="text-sm font-semibold text-accent">{t('assessment.learn.howTo')}</h3>
                <p className="text-sm text-muted">{t(def.measurementHowToKey)}</p>
              </Card>
            );
          })}
        </div>
      </section>

      <section aria-labelledby="learn-colors">
        <h2 id="learn-colors" className="mb-3 text-lg font-semibold">
          {t('assessment.learn.colors')}
        </h2>
        <ul className="flex flex-col gap-2">
          {STATUSES.map((s) => (
            <li key={s} className="flex items-center gap-3">
              <StatusBadge status={s} label={t(`status.${s}`)} />
              <span className="text-sm text-muted">{t(`status.meaning.${s}`)}</span>
            </li>
          ))}
        </ul>
      </section>

      {!metric && (
        <section aria-labelledby="learn-hazards">
          <h2 id="learn-hazards" className="mb-3 text-lg font-semibold">
            {t('assessment.learn.hazardsTitle')}
          </h2>
          <div className="grid gap-4 md:grid-cols-2">
            {HAZARD_IDS.map((id) => (
              <Card key={id} title={t(HAZARDS[id].labelKey)}>
                <p className="mb-2 text-sm text-muted">{t(HAZARDS[id].descriptionKey)}</p>
                <p className="text-sm">{t(HAZARDS[id].countermeasuresKey)}</p>
              </Card>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
