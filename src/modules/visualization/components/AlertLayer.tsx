import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { METRICS } from '@core/config/metrics.config';
import { useLatestByMetric } from '@core/store';
import type { Assessment } from '@core/types';
import { AlertStrip, RedAlertDialog, Sheet } from '@core/ui';
import { formatNumber, formatRelative } from '@core/utils';
import { RecommendationList, useCrewHealth } from '@modules/assessment';
import { useNow } from '../hooks/useNow';
import { alertKey, buildAlertQueue } from '../services/alertQueue';
import { useAlertAckStore } from '../store/useAlertAckStore';

export interface AlertLayerViewProps {
  crewId: string;
  assessments: Assessment[];
  lastMeasuredAt: string | null;
  now: Date;
}

/**
 * Alert model of the app: unacknowledged warnings block the screen (red full-screen alert),
 * everything else sits in the strip. PRIVACY: only alerts of `crewId` are ever rendered.
 */
export function AlertLayerView({ crewId, assessments, lastMeasuredAt, now }: AlertLayerViewProps) {
  const { t, i18n } = useTranslation();
  const lang = i18n.language;
  const acknowledged = useAlertAckStore((s) => s.acknowledged);
  const snoozedUntil = useAlertAckStore((s) => s.snoozedUntil);
  const acknowledge = useAlertAckStore((s) => s.acknowledge);
  const snooze = useAlertAckStore((s) => s.snooze);
  const [detailKey, setDetailKey] = useState<string | null>(null);

  const queue = useMemo(
    () =>
      buildAlertQueue(
        assessments.filter((a) => a.crewId === crewId),
        { acknowledged, snoozedUntil },
        now,
      ),
    [assessments, crewId, acknowledged, snoozedUntil, now],
  );

  const metricLabel = (a: Assessment): string => t(METRICS[a.metric].labelKey);
  const valueText = (a: Assessment): string =>
    `${formatNumber(a.value, METRICS[a.metric].step, lang)} ${METRICS[a.metric].unit}`;
  const summary = (a: Assessment): string =>
    t(a.summaryKey, { metric: metricLabel(a), ...a.messageParams });

  const detail = queue.strip.find((a) => alertKey(a) === detailKey) ?? null;

  return (
    <>
      <RedAlertDialog
        items={queue.blocking.map((a) => ({
          id: alertKey(a),
          title: metricLabel(a),
          valueText: valueText(a),
          description: summary(a),
          steps: a.recommendations.flatMap((r) => r.stepsKeys).map((key) => t(key)),
          escalationText: t(`escalation.${a.escalation}`),
        }))}
        heading={t('visualization.alerts.redHeading')}
        whatToDoLabel={t('visualization.alerts.whatToDo')}
        acknowledgeLabel={t('visualization.alerts.acknowledge')}
        stopBlinkingLabel={t('visualization.alerts.stopBlinking')}
        onAcknowledge={(key) => acknowledge(key, new Date())}
      />

      <AlertStrip
        label={t('visualization.alerts.label')}
        items={queue.strip.map((a) => ({
          id: alertKey(a),
          status: a.status === 'nominal' ? 'advisory' : a.status,
          title: `${metricLabel(a)} · ${valueText(a)}`,
          detail: summary(a),
        }))}
        emptyText={
          lastMeasuredAt
            ? t('visualization.alerts.allNominal', { when: formatRelative(lastMeasuredAt, lang) })
            : t('visualization.alerts.noData')
        }
        whatToDoLabel={t('visualization.alerts.whatToDo')}
        onWhatToDo={setDetailKey}
        snoozeLabel={t('visualization.alerts.snooze')}
        onSnooze={(key) => snooze(key, new Date())}
        moreLabel={t('visualization.alerts.more', { count: queue.strip.length - 1 })}
      />

      <Sheet
        open={detail !== null}
        onOpenChange={(open) => {
          if (!open) setDetailKey(null);
        }}
        title={detail ? `${metricLabel(detail)} · ${valueText(detail)}` : ''}
        closeLabel={t('common.close')}
      >
        {detail && (
          <div className="flex flex-col gap-4">
            <p className="text-body text-text">{summary(detail)}</p>
            <RecommendationList recommendations={detail.recommendations} />
            <p className="text-body font-semibold text-text">
              {t(`escalation.${detail.escalation}`)}
            </p>
          </div>
        )}
      </Sheet>
    </>
  );
}

export interface AlertLayerProps {
  crewId: string;
}

/** Store-connected alert layer for the signed-in astronaut (mounted once by the app shell). */
export function AlertLayer({ crewId }: AlertLayerProps) {
  const health = useCrewHealth(crewId);
  const latest = useLatestByMetric(crewId);
  const now = useNow();
  const lastMeasuredAt = useMemo(() => {
    const stamps = Object.values(latest).map((m) => m.timestamp);
    return stamps.length > 0 ? stamps.sort().at(-1)! : null;
  }, [latest]);

  return (
    <AlertLayerView
      crewId={crewId}
      assessments={health.assessments}
      lastMeasuredAt={lastMeasuredAt}
      now={now}
    />
  );
}
