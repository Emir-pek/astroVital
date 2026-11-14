import { useMemo } from 'react';
import { ENVIRONMENTS } from '@core/config/environments.config';
import { useHealthStore } from '@core/store';
import type { CrewHealthSummary } from '@core/types';
import { assessCrew, emptySummary } from '../engine/assessCrew';

/** Live health summary for one crew member (re-computed when data/environment changes). */
export function useCrewHealth(crewId: string): CrewHealthSummary {
  const measurements = useHealthStore((s) => s.measurements);
  const crew = useHealthStore((s) => s.crew);
  const envId = useHealthStore((s) => s.activeEnvironment);

  return useMemo(() => {
    const now = new Date();
    const member = crew.find((c) => c.id === crewId);
    if (!member) return emptySummary(crewId, now);
    const history = measurements.filter((m) => m.crewId === crewId);
    return assessCrew(crewId, history, {
      environment: ENVIRONMENTS[envId],
      crew: member,
      history,
      now,
    });
  }, [measurements, crew, envId, crewId]);
}

/** Summaries for the whole crew (AlertCenter, CrewOverview). */
export function useAllCrewHealth(): CrewHealthSummary[] {
  const measurements = useHealthStore((s) => s.measurements);
  const crew = useHealthStore((s) => s.crew);
  const envId = useHealthStore((s) => s.activeEnvironment);

  return useMemo(() => {
    const now = new Date();
    return crew.map((member) => {
      const history = measurements.filter((m) => m.crewId === member.id);
      return assessCrew(member.id, history, {
        environment: ENVIRONMENTS[envId],
        crew: member,
        history,
        now,
      });
    });
  }, [measurements, crew, envId]);
}
