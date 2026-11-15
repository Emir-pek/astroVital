import { beforeEach, describe, expect, it } from 'vitest';
import { useHealthStore } from '@core/store';
import { exportData, importData, parseImportJson, useRoutineStore } from '../index';

const NOW = new Date('2026-11-14T22:00:00.000Z');

describe('export / import (ADR-044)', () => {
  beforeEach(() => {
    useHealthStore.getState().resetAll();
    useRoutineStore.getState().resetRoutine();
    useHealthStore.getState().loadDemoData({ days: 30, now: NOW });
  });

  it('round-trips measurements, crew, settings and routine completions; sources are kept', () => {
    useHealthStore.getState().addMeasurement({
      crewId: useHealthStore.getState().crew[0]?.id ?? '',
      metric: 'heartRate',
      value: 64,
      timestamp: '2026-11-14T06:31:00.000Z',
      source: 'camera',
      confidence: 0.8,
      environment: 'iss',
    });
    useRoutineStore.getState().addCompletion({
      crewId: 'crew-1',
      templateId: 'weekly-health-summary',
      missionDay: 29,
      at: '2026-11-13T10:05:00.000Z',
    });
    const before = useHealthStore.getState();
    const json = exportData(NOW);

    useHealthStore.getState().resetAll();
    useRoutineStore.getState().resetRoutine();
    const result = importData(json);

    expect(result.ok).toBe(true);
    const after = useHealthStore.getState();
    expect(after.measurements).toEqual(before.measurements);
    expect(after.crew).toEqual(before.crew);
    expect(after.settings).toEqual(before.settings);
    expect(new Set(after.measurements.map((m) => m.source))).toEqual(
      new Set(['simulated', 'camera']),
    );
    expect(useRoutineStore.getState().completions).toHaveLength(1);
    expect(after.demoLoadedAt).not.toBeNull();
  });

  it('rejects invalid JSON and leaves data untouched', () => {
    const count = useHealthStore.getState().measurements.length;
    const r = importData('{not json');
    expect(r).toMatchObject({ ok: false, error: 'invalidJson' });
    expect(useHealthStore.getState().measurements).toHaveLength(count);
  });

  it('reports where the file is wrong', () => {
    const doc = JSON.parse(exportData(NOW)) as {
      measurements: { metric: string; value: unknown }[];
    };
    const [first] = doc.measurements;
    if (first) {
      first.metric = 'heartbeat';
      first.value = 'fast';
    }
    const r = parseImportJson(JSON.stringify(doc));
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.error).toBe('invalidFormat');
      expect(r.issues.some((i) => i.startsWith('measurements.0.metric'))).toBe(true);
      expect(r.issues.some((i) => i.startsWith('measurements.0.value'))).toBe(true);
    }
  });

  it('rejects other files and measurements of unknown crew members', () => {
    expect(parseImportJson('{"hello":1}')).toMatchObject({ ok: false, error: 'invalidFormat' });
    const doc = JSON.parse(exportData(NOW)) as { measurements: { crewId: string }[] };
    if (doc.measurements[0]) doc.measurements[0].crewId = 'ghost';
    expect(parseImportJson(JSON.stringify(doc))).toMatchObject({ ok: false, error: 'unknownCrew' });
  });
});
