import { act } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { renderWithProviders } from '@test/renderWithProviders';
import { useHealthStore } from '@core/store';
import type { CrewHealthSummary, Measurement, Status } from '@core/types';
import type * as AssessmentModule from '@modules/assessment';
import { LedSync } from '../providers/LedSync';

/** Status the mocked engine reports for the selected astronaut's heart rate. */
let heartRateStatus: Status = 'nominal';

vi.mock('@modules/assessment', async (importOriginal) => {
  const real = await importOriginal<typeof AssessmentModule>();
  return {
    ...real,
    useCrewHealth: (crewId: string): CrewHealthSummary => {
      if (!crewId) return real.emptySummary(crewId, new Date());
      const assessments = [
        {
          metric: 'heartRate' as const,
          crewId,
          status: heartRateStatus,
          escalation: 'self_care' as const,
          value: 130,
          trend: 'stable' as const,
          summaryKey: 'x',
          explanationKey: 'x',
          recommendations: [],
          sourceIds: [],
        },
      ];
      return {
        ...real.emptySummary(crewId, new Date()),
        regions: real.buildRegions(assessments),
        assessments,
      };
    },
  };
});

function reading(crewId: string, timestamp: string): Measurement {
  return {
    id: 'm1',
    crewId,
    metric: 'heartRate',
    value: 130,
    timestamp,
    source: 'keyboard',
    environment: 'iss',
  };
}

const led = () => document.documentElement.dataset.led;

afterEach(() => {
  heartRateStatus = 'nominal';
});

describe('LedSync (<html data-led>)', () => {
  it('follows the signed-in astronaut and removes the attribute on unmount', () => {
    const crewId = useHealthStore.getState().selectedCrewId ?? 'c1';
    heartRateStatus = 'warning';
    act(() => {
      useHealthStore.setState({
        selectedCrewId: crewId,
        measurements: [reading(crewId, new Date().toISOString())],
      });
    });
    const { unmount } = renderWithProviders(<LedSync />);
    expect(led()).toBe('warning');

    // Signed out: nothing to show.
    act(() => useHealthStore.setState({ selectedCrewId: null }));
    expect(led()).toBe('nominal');

    unmount();
    expect(led()).toBeUndefined();
  });

  it('does not glow for an old (stale) warning', () => {
    const crewId = useHealthStore.getState().selectedCrewId ?? 'c1';
    heartRateStatus = 'warning';
    act(() => {
      useHealthStore.setState({
        selectedCrewId: crewId,
        measurements: [reading(crewId, '2000-01-01T00:00:00.000Z')],
      });
    });
    const { unmount } = renderWithProviders(<LedSync />);
    expect(led()).toBe('nominal');
    unmount();
  });
});
