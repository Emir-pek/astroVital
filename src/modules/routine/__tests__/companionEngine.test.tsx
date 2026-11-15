import { renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useHealthStore } from '@core/store';
import { useCrewHealth } from '@modules/assessment';
import { useCompanion } from '../index';

/**
 * Companion against the REAL assessment engine (PR #15) and the default demo
 * (mixed_mission, ISS, seed 2026) — docs/DEMO_CREW_STORIES.md "Beklenen durum tablosu".
 */
const NOW = new Date('2026-11-30T12:00:00.000Z');

describe('useCompanion × real engine × default demo', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(NOW);
    const s = useHealthStore.getState();
    s.resetAll();
    s.loadDemoData({ now: NOW });
  });
  afterEach(() => vi.useRealTimers());

  const as = (crewId: string) => {
    useHealthStore.getState().setSelectedCrew(crewId);
    return renderHook(() => ({ c: useCompanion(), h: useCrewHealth(crewId) })).result.current;
  };

  it('Kenji (warning) → alert, with the route to his status', () => {
    const { c, h } = as('crew-2');
    expect(h.overall).toBe('warning');
    expect(c).toMatchObject({ mood: 'alert', action: { route: '/' } });
  });

  it.each(['crew-1', 'crew-3', 'crew-4'])('%s is not alert', (id) => {
    expect(as(id).c.mood).not.toBe('alert');
  });

  it('matches the expected table (Lucas: nominal until the personal-baseline rule exists)', () => {
    expect(['crew-1', 'crew-2', 'crew-3', 'crew-4'].map((id) => as(id).h.overall)).toEqual([
      'nominal',
      'warning',
      'caution',
      'nominal', // expected advisory — rule missing in the engine (Engineer 3, ADR-031)
    ]);
  });
});
