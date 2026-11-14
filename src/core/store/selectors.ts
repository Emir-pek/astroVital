import { useMemo } from 'react';
import { ENVIRONMENTS } from '@core/config/environments.config';
import type { CrewMember, EnvironmentProfile, Measurement, MetricId } from '@core/types';
import { useHealthStore } from './useHealthStore';

/*
 * Pure selectors (testable without React) + memoised hooks.
 * Zustand v5: never return a NEW array/object straight from a store selector — it re-renders
 * forever. Select the raw slice, then derive with useMemo (pattern used below).
 */

export const getCrewMeasurements = (all: Measurement[], crewId: string): Measurement[] =>
  all.filter((m) => m.crewId === crewId).sort((a, b) => a.timestamp.localeCompare(b.timestamp));

export const getMetricSeries = (
  all: Measurement[],
  crewId: string,
  metric: MetricId,
): Measurement[] => getCrewMeasurements(all, crewId).filter((m) => m.metric === metric);

/** Latest measurement per metric for one crew member. */
export const getLatestByMetric = (
  all: Measurement[],
  crewId: string,
): Partial<Record<MetricId, Measurement>> => {
  const latest: Partial<Record<MetricId, Measurement>> = {};
  for (const m of all) {
    if (m.crewId !== crewId) continue;
    const prev = latest[m.metric];
    if (!prev || prev.timestamp < m.timestamp) latest[m.metric] = m;
  }
  return latest;
};

export const useCrew = (): CrewMember[] => useHealthStore((s) => s.crew);

export const useCrewMember = (crewId: string | undefined): CrewMember | undefined => {
  const crew = useHealthStore((s) => s.crew);
  return useMemo(() => crew.find((c) => c.id === crewId), [crew, crewId]);
};

export const useCrewMeasurements = (crewId: string): Measurement[] => {
  const all = useHealthStore((s) => s.measurements);
  return useMemo(() => getCrewMeasurements(all, crewId), [all, crewId]);
};

export const useMetricSeries = (crewId: string, metric: MetricId): Measurement[] => {
  const all = useHealthStore((s) => s.measurements);
  return useMemo(() => getMetricSeries(all, crewId, metric), [all, crewId, metric]);
};

export const useLatestByMetric = (crewId: string): Partial<Record<MetricId, Measurement>> => {
  const all = useHealthStore((s) => s.measurements);
  return useMemo(() => getLatestByMetric(all, crewId), [all, crewId]);
};

export const useActiveEnvironment = (): EnvironmentProfile => {
  const id = useHealthStore((s) => s.activeEnvironment);
  return ENVIRONMENTS[id];
};

export const useSettings = () => useHealthStore((s) => s.settings);
