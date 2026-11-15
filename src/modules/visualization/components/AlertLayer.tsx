import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { METRICS } from '@core/config/metrics.config';
import { useLatestByMetric } from '@core/store';
import type { Assessment } from '@core/types';
import { AlertStrip, RedAlertDialog, Sheet, StatusLine, type AlertStripLayout } from '@core/ui';
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

/** The alert queue of one astronaut (PRIVACY: assessments of anyone else are dropped). */
function useAlertQueue(crewId: string, assessments: Assessment[], now: Date) {
  const acknowledged = useAlertAckStore((s) => s.acknowledged);
  const snoozedUntil = useAlertAckStore((s) => s.snoozedUntil);
  return useMemo(
    () =>
      buildAlertQueue(
        assessments.filter((a) => a.crewId === crewId),
        { acknowledged, snoozedUntil },
        now,
      ),
    [assessments, crewId, acknowledged, snoozedUntil, now],
  );
}

/** Labels and texts shared by the red alert and the strip of one astronaut. */
function useAlertTexts() {
  const { t, i18n } = useTranslation();
  const lang = i18n.language;
  const metricLabel = (a: Assessment): string => t(METRICS[a.metric].labelKey);
  const valueText = (a: Assessment): string =>
    `${formatNumber(a.value, METRICS[a.metric].step, lang)} ${METRICS[a.metric].unit}`;
  const summary = (a: Assessment): string =>
    t(a.summaryKey, { metric: metricLabel(a), ...a.messageParams });
  return { t, metricLabel, valueText, summary };
}

interface AlertStripBlockProps extends AlertLayerViewProps {
  layout: AlertStripLayout;
}

/**
 * The strip (alerts to act on, worst first) and the "What should I do?" sheet it opens. Renders
 * nothing while there is nothing to act on.
 */
function AlertStripBlock({ crewId, assessments, now, layout }: AlertStripBlockProps) {
  const { t, metricLabel, valueText, summary } = useAlertTexts();
  const snooze = useAlertAckStore((s) => s.snooze);
  const [detailKey, setDetailKey] = useState<string | null>(null);
  const queue = useAlertQueue(crewId, assessments, now);
  const detail = queue.strip.find((a) => alertKey(a) === detailKey) ?? null;
  if (queue.strip.length === 0) return null;

  return (
    <>
      <AlertStrip
        layout={layout}
        label={t('visualization.alerts.label')}
        items={queue.strip.map((a) => ({
          id: alertKey(a),
          status: a.status === 'nominal' ? 'advisory' : a.status,
          title: `${metricLabel(a)} · ${valueText(a)}`,
          detail: summary(a),
        }))}
        emptyText=""
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

export interface AlertLayerViewOptions {
  /**
   * Whether the shell shows the strip in its own full-width row (default). The Status page sets
   * this to false and places the strip above its vitals rail instead (`AlertPanel`, ADR-036), so
   * the figure and its labels never scroll away while an alert is active.
   */
  strip?: boolean;
}

/**
 * Alert model of the app: unacknowledged warnings block the screen (red full-screen alert),
 * everything else sits in the strip, which takes its own row only while it has something to act
 * on — the calm all-clear line lives in the page header (`AlertSummaryView`, ADR-036).
 * PRIVACY: only alerts of `crewId` are ever rendered.
 */
export function AlertLayerView({
  strip = true,
  ...props
}: AlertLayerViewProps & AlertLayerViewOptions) {
  const { t, metricLabel, valueText, summary } = useAlertTexts();
  const acknowledge = useAlertAckStore((s) => s.acknowledge);
  const queue = useAlertQueue(props.crewId, props.assessments, props.now);

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
      {strip && queue.strip.length > 0 && (
        <div className="px-6 pt-3 pb-4">
          <AlertStripBlock {...props} layout="row" />
        </div>
      )}
    </>
  );
}

/**
 * The strip as a narrow stacked card for a page column (Status page, above the vitals rail).
 * Renders nothing while there is nothing to act on.
 */
export function AlertPanelView(props: AlertLayerViewProps) {
  return <AlertStripBlock {...props} layout="stacked" />;
}

/**
 * The all-clear form of the strip: one line that shares the page-header row. Renders nothing
 * while the strip has items (the strip then takes its own row, AlertLayerView).
 */
export function AlertSummaryView({
  crewId,
  assessments,
  lastMeasuredAt,
  now,
}: AlertLayerViewProps) {
  const { t, i18n } = useTranslation();
  const queue = useAlertQueue(crewId, assessments, now);
  if (queue.strip.length > 0) return null;
  return (
    <StatusLine
      status={lastMeasuredAt ? 'nominal' : 'none'}
      label={t('visualization.alerts.label')}
      text={
        lastMeasuredAt
          ? t('visualization.alerts.allNominal', {
              when: formatRelative(lastMeasuredAt, i18n.language),
            })
          : t('visualization.alerts.noData')
      }
    />
  );
}

export interface AlertLayerProps {
  crewId: string;
}

/** Store data the alert views need, for the signed-in astronaut. */
function useAlertInputs(crewId: string): AlertLayerViewProps {
  const health = useCrewHealth(crewId);
  const latest = useLatestByMetric(crewId);
  const now = useNow();
  const lastMeasuredAt = useMemo(() => {
    const stamps = Object.values(latest).map((m) => m.timestamp);
    return stamps.length > 0 ? stamps.sort().at(-1)! : null;
  }, [latest]);
  return { crewId, assessments: health.assessments, lastMeasuredAt, now };
}

/**
 * Store-connected alert layer (red alert + strip row) for the signed-in astronaut; mounted once
 * by the app shell. On the Status page the shell passes `strip={false}` (the page shows `AlertPanel`).
 */
export function AlertLayer({ crewId, strip = true }: AlertLayerProps & AlertLayerViewOptions) {
  return <AlertLayerView {...useAlertInputs(crewId)} strip={strip} />;
}

/** Store-connected stacked strip for a page column (the Status page places it above the rail). */
export function AlertPanel({ crewId }: AlertLayerProps) {
  return <AlertPanelView {...useAlertInputs(crewId)} />;
}

/** Store-connected all-clear line; the page header shows it on every page. */
export function AlertSummary({ crewId }: AlertLayerProps) {
  return <AlertSummaryView {...useAlertInputs(crewId)} />;
}
