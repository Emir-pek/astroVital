import { useEffect, useMemo } from 'react';
import { useNow } from '@core/hooks';
import { useActiveEnvironment, useHealthStore, useLatestByMetric } from '@core/store';
import type { MetricId } from '@core/types';
import { isStale } from '@core/utils';
import { useCrewHealth } from '@modules/assessment';
import { ledLevel } from './ledLevel';

/** Staleness is re-checked once a minute, so the edge calms down when data ages. */
const AGE_TICK_MS = 60_000;

/**
 * Sets <html data-led="nominal|advisory|caution|warning"> from the signed-in astronaut's worst
 * fresh region status, so every Panel's LED edge (tokens.css) — including popups, sheets and
 * toasts rendered in portals — shows the same state. Follows crew switches, new data and data
 * ageing; removes the attribute on unmount.
 */
export function LedSync() {
  const crewId = useHealthStore((s) => s.selectedCrewId);
  const id = crewId ?? '';
  const health = useCrewHealth(id);
  const latest = useLatestByMetric(id);
  const env = useActiveEnvironment();
  const now = useNow(AGE_TICK_MS);

  const level = useMemo(() => {
    const isMetricStale = (metric: MetricId): boolean => {
      const measurement = latest[metric];
      return measurement ? isStale(measurement.timestamp, metric, env, now) : true;
    };
    return ledLevel(health.regions, crewId, isMetricStale);
  }, [health.regions, crewId, latest, env, now]);

  useEffect(() => {
    const root = document.documentElement;
    root.dataset.led = level;
    return () => {
      delete root.dataset.led;
    };
  }, [level]);

  return null;
}
