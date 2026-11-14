import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';
import type { Assessment, MetricId, Status } from '@core/types';
import { renderWithProviders } from '@test/renderWithProviders';
import { AlertLayerView } from '../components/AlertLayer';
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

const renderLayer = (assessments: Assessment[], crewId = 'crew-1') =>
  renderWithProviders(
    <AlertLayerView
      crewId={crewId}
      assessments={assessments}
      lastMeasuredAt="2026-11-14T10:00:00Z"
      now={now}
    />,
  );

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
  });
});
