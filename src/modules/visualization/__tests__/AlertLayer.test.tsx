import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';
import type { Assessment, MetricId, Status } from '@core/types';
import { renderWithProviders } from '@test/renderWithProviders';
import { AlertLayerView, AlertPanelView, AlertSummaryView } from '../components/AlertLayer';
import { useAlertAckStore } from '../store/useAlertAckStore';

const now = new Date('2026-11-14T12:00:00Z');

const assessment = (
  metric: MetricId,
  status: Status,
  value: number,
  crewId = 'crew-1',
): Assessment => ({
  metric,
  crewId,
  status,
  escalation: status === 'warning' ? 'crew_medical_officer' : 'self_care',
  value,
  trend: 'unknown',
  summaryKey: 'thresholds.high',
  explanationKey: 'assessment.stub.explanation',
  recommendations: [],
  sourceIds: [],
  measurementId: [crewId, metric].join('-'),
});

/** The shell mounts the layer; every page header mounts the summary. Render both, like the app. */
const renderLayer = (
  assessments: Assessment[],
  crewId = 'crew-1',
  lastMeasuredAt: string | null = '2026-11-14T10:00:00Z',
) => {
  const props = { crewId, assessments, lastMeasuredAt, now };
  return renderWithProviders(
    <>
      <AlertSummaryView {...props} />
      <AlertLayerView {...props} />
    </>,
  );
};

describe('<AlertLayerView/>', () => {
  beforeEach(() => useAlertAckStore.getState().reset());

  it('F-01: every warning must be acknowledged before the red alert closes', async () => {
    const user = userEvent.setup();
    renderLayer([assessment('bodyTemp', 'warning', 39.4), assessment('heartRate', 'warning', 150)]);
    expect(screen.getByRole('alertdialog')).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: 'I saw it' })).toHaveLength(2);

    await user.click(screen.getAllByRole('button', { name: 'I saw it' })[0]!);
    expect(screen.getByRole('alertdialog')).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: 'I saw it' })).toHaveLength(1);

    await user.click(screen.getByRole('button', { name: 'I saw it' }));
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();

    // Acknowledged warnings stay visible in the strip (red cannot be snoozed).
    const strip = screen.getByRole('region', { name: 'Alerts' });
    expect(strip.querySelector('[data-status="warning"]')).not.toBeNull();
    expect(screen.getByRole('button', { name: '1 more' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Snooze 2 h' })).not.toBeInTheDocument();
  });

  it('I-06: never shows alerts of another astronaut', () => {
    renderLayer([assessment('heartRate', 'warning', 150, 'crew-2')]);
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
    expect(screen.getByText(/All indicators nominal/)).toBeInTheDocument();
  });

  it('F-05: caution comes before advisory; snooze hides only the snoozed alert', async () => {
    const user = userEvent.setup();
    renderLayer([
      assessment('sleepHours', 'advisory', 6.4),
      assessment('heartRate', 'caution', 105),
    ]);
    const strip = screen.getByRole('region', { name: 'Alerts' });
    expect(strip.querySelector('[data-status]')).toHaveAttribute('data-status', 'caution');

    await user.click(screen.getByRole('button', { name: 'Snooze 2 h' }));
    expect(strip.querySelector('[data-status="caution"]')).toBeNull();
    expect(strip.querySelector('[data-status="advisory"]')).not.toBeNull();
  });

  it('F-05: shows the all-nominal line with the age of the last measurement', () => {
    renderLayer([assessment('heartRate', 'nominal', 62)]);
    expect(screen.getByText(/All indicators nominal . last measurement/)).toBeInTheDocument();
    // Exactly one "Alerts" region: the one-line summary, no empty strip row.
    expect(screen.getAllByRole('region', { name: 'Alerts' })).toHaveLength(1);
  });

  it('says there is no data yet instead of "all nominal" before the first measurement', () => {
    renderLayer([], 'crew-1', null);
    expect(screen.getByText(/No measurements yet/)).toBeInTheDocument();
    expect(screen.queryByText(/All indicators nominal/)).not.toBeInTheDocument();
  });

  it('hides the summary line while the strip has an alert to act on', () => {
    renderLayer([assessment('heartRate', 'caution', 105)]);
    expect(screen.queryByText(/All indicators nominal/)).not.toBeInTheDocument();
    const strip = screen.getByRole('region', { name: 'Alerts' });
    expect(strip.querySelector('[data-status="caution"]')).not.toBeNull();
  });

  it('Status page: without the shell row the strip moves to the stacked panel', () => {
    const props = {
      crewId: 'crew-1',
      assessments: [assessment('heartRate', 'caution', 105)],
      lastMeasuredAt: '2026-11-14T10:00:00Z',
      now,
    };
    renderWithProviders(
      <>
        <AlertLayerView {...props} strip={false} />
        <AlertPanelView {...props} />
      </>,
    );
    const strips = screen.getAllByRole('region', { name: 'Alerts' });
    expect(strips).toHaveLength(1);
    expect(strips[0]).toHaveAttribute('data-layout', 'stacked');
    expect(strips[0]!.querySelector('[data-status="caution"]')).not.toBeNull();
  });

  it('the stacked panel renders nothing while there is nothing to act on', () => {
    renderWithProviders(
      <AlertPanelView
        crewId="crew-1"
        assessments={[assessment('heartRate', 'nominal', 62)]}
        lastMeasuredAt="2026-11-14T10:00:00Z"
        now={now}
      />,
    );
    expect(screen.queryByRole('region', { name: 'Alerts' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('the red alert still blocks the screen when the shell row is off', () => {
    renderWithProviders(
      <AlertLayerView
        crewId="crew-1"
        assessments={[assessment('bodyTemp', 'warning', 39.4)]}
        lastMeasuredAt="2026-11-14T10:00:00Z"
        now={now}
        strip={false}
      />,
    );
    expect(screen.getByRole('alertdialog')).toBeInTheDocument();
  });
});
