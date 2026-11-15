import { beforeEach, describe, expect, it } from 'vitest';
import { getLatestByMetric, STORE_KEY, useHealthStore } from '@core/store';
import { SCENARIOS } from '@core/simulation';

const NOW = new Date('2026-11-14T22:00:00Z');

describe('useHealthStore', () => {
  beforeEach(() => {
    useHealthStore.getState().resetAll();
  });

  it('starts empty with the demo crew', () => {
    const s = useHealthStore.getState();
    expect(s.measurements).toHaveLength(0);
    expect(s.crew).toHaveLength(4);
  });

  it('loadDemoData is deterministic and sets missionStart', () => {
    useHealthStore.getState().loadDemoData({ seed: 9, days: 30, now: NOW });
    const first = useHealthStore.getState().measurements;
    useHealthStore.getState().loadDemoData({ seed: 9, days: 30, now: NOW });
    expect(useHealthStore.getState().measurements).toEqual(first);
    expect(first.length).toBeGreaterThan(1000);
    expect(useHealthStore.getState().settings.missionStart).toBe('2026-10-16T00:00:00.000Z');
  });

  it('addMeasurement generates an id and persists to localStorage', () => {
    const m = useHealthStore.getState().addMeasurement({
      crewId: 'crew-1',
      metric: 'heartRate',
      value: 72,
      timestamp: NOW.toISOString(),
      source: 'keyboard',
      environment: 'iss',
    });
    expect(m.id).toMatch(/^m_/);
    expect(localStorage.getItem(STORE_KEY)).toContain('"value":72');
  });

  it('getLatestByMetric picks the newest value per metric', () => {
    const add = useHealthStore.getState().addMeasurement;
    const base = {
      crewId: 'crew-1',
      metric: 'heartRate',
      source: 'keyboard',
      environment: 'iss',
    } as const;
    add({ ...base, value: 60, timestamp: '2026-11-14T08:00:00Z' });
    add({ ...base, value: 80, timestamp: '2026-11-14T09:00:00Z' });
    add({ ...base, value: 70, timestamp: '2026-11-14T07:00:00Z' });
    const latest = getLatestByMetric(useHealthStore.getState().measurements, 'crew-1');
    expect(latest.heartRate?.value).toBe(80);
  });

  it('applyScenario loads the scenario and optionally its recommended environment', () => {
    const s = useHealthStore.getState();
    s.setActiveEnvironment('iss');
    s.applyScenario('solar_particle_event', { withRecommendedEnvironment: false, now: NOW });
    expect(useHealthStore.getState().settings.scenario).toBe('solar_particle_event');
    expect(useHealthStore.getState().activeEnvironment).toBe('iss');
    expect(useHealthStore.getState().measurements.length).toBeGreaterThan(0);

    s.applyScenario('solar_particle_event', { withRecommendedEnvironment: true, now: NOW });
    expect(useHealthStore.getState().activeEnvironment).toBe(
      SCENARIOS.solar_particle_event.recommendedEnvironment,
    );
  });

  it('resetAll keeps language preference', () => {
    useHealthStore.getState().updateSettings({ language: 'tr' });
    useHealthStore.getState().resetAll();
    expect(useHealthStore.getState().settings.language).toBe('tr');
  });
});
