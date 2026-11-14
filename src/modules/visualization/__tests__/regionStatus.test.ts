import { describe, expect, it } from 'vitest';
import type { Assessment, MetricId, RegionHealth, Status } from '@core/types';
import { regionDisplayStatus } from '../services/regionStatus';

const a = (metric: MetricId, status: Status): Assessment => ({
  metric,
  crewId: 'c1',
  status,
  escalation: 'self_care',
  value: 1,
  trend: 'unknown',
  summaryKey: 's',
  explanationKey: 'e',
  recommendations: [],
  sourceIds: [],
});

const region = (assessments: Assessment[]): RegionHealth => ({
  region: 'heart',
  status: 'nominal',
  assessments,
  functionKey: 'f',
  spaceRiskKey: 'r',
});

describe('regionDisplayStatus', () => {
  it('is none without assessments', () => {
    expect(regionDisplayStatus(region([]), () => false)).toBe('none');
  });

  it('is stale when every assessment is stale', () => {
    const r = region([a('heartRate', 'caution'), a('spo2', 'nominal')]);
    expect(regionDisplayStatus(r, () => true)).toBe('stale');
  });

  it('ignores stale assessments when computing the worst status', () => {
    const r = region([a('heartRate', 'caution'), a('spo2', 'warning')]);
    expect(regionDisplayStatus(r, (m) => m === 'spo2')).toBe('caution');
  });
});
