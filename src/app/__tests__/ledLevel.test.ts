import { describe, expect, it } from 'vitest';
import { buildRegions } from '@modules/assessment';
import type { Assessment, MetricId, Status } from '@core/types';
import { ledLevel } from '../providers/ledLevel';

const CREW = 'c1';

function assessment(metric: MetricId, status: Status, crewId = CREW): Assessment {
  return {
    metric,
    crewId,
    status,
    escalation: 'self_care',
    value: 0,
    trend: 'stable',
    summaryKey: 'x',
    explanationKey: 'x',
    recommendations: [],
    sourceIds: [],
  };
}

const fresh = () => false;
const allStale = () => true;

describe('ledLevel (LED box edges, <html data-led>)', () => {
  it('is nominal without a signed-in astronaut, even if regions hold alerts', () => {
    const regions = buildRegions([assessment('heartRate', 'warning')]);
    expect(ledLevel(regions, null, fresh)).toBe('nominal');
  });

  it('is nominal without data', () => {
    expect(ledLevel(buildRegions([]), CREW, fresh)).toBe('nominal');
  });

  it('takes the worst fresh status of any region', () => {
    const regions = buildRegions([
      assessment('heartRate', 'advisory'),
      assessment('sleepHours', 'caution'),
      assessment('spo2', 'nominal'),
    ]);
    expect(ledLevel(regions, CREW, fresh)).toBe('caution');
  });

  it('shows warning for a fresh warning', () => {
    const regions = buildRegions([assessment('spo2', 'warning')]);
    expect(ledLevel(regions, CREW, fresh)).toBe('warning');
  });

  it('never raises the level from stale data (no false warning)', () => {
    const regions = buildRegions([assessment('heartRate', 'warning')]);
    expect(ledLevel(regions, CREW, allStale)).toBe('nominal');
  });

  it('ignores only the stale metrics: a stale warning does not hide a fresh caution', () => {
    const regions = buildRegions([
      assessment('heartRate', 'warning'),
      assessment('sleepHours', 'caution'),
    ]);
    expect(ledLevel(regions, CREW, (m) => m === 'heartRate')).toBe('caution');
  });

  it('ignores assessments of another astronaut (privacy)', () => {
    const regions = buildRegions([assessment('heartRate', 'warning', 'someone-else')]);
    expect(ledLevel(regions, CREW, fresh)).toBe('nominal');
  });
});
