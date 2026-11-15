import { useEffect } from 'react';
import { ENVIRONMENT_IDS, ENVIRONMENTS } from '@core/config/environments.config';
import { useHealthStore } from '@core/store';
import type { ReminderTemplate } from '@core/types';
import { generateDemoCompletions } from '../services/demoCompletions';
import { useRoutineStore } from '../store/useRoutineStore';

/** Manual (metric-less) tasks of every environment, once per id — so switching environment is covered. */
const ALL_MANUAL_TASKS: ReminderTemplate[] = [
  ...new Map(
    ENVIRONMENT_IDS.flatMap((id) => ENVIRONMENTS[id].reminderSchedule)
      .filter((t) => !t.metric)
      .map((t) => [t.id, t]),
  ).values(),
];

const sameTask = (
  a: { crewId: string; templateId: string; missionDay: number },
  b: { crewId: string; templateId: string; missionDay: number },
) => a.crewId === b.crewId && a.templateId === b.templateId && a.missionDay === b.missionDay;

/**
 * Renders nothing. After each demo load (`demoLoadedAt` changes), gives the simulated history the
 * manual completions its story implies (`generateDemoCompletions`, ADR-048), once per load.
 * A new demo replaces the previous demo's completions (they belonged to the old timeline); on the
 * first run after an upgrade the user's own ticks are kept. Imported or hand-entered data
 * (no simulated measurement) is left alone. Mounted once in the app providers.
 */
export function DemoRoutineSync() {
  const demoLoadedAt = useHealthStore((s) => s.demoLoadedAt);
  const syncedFor = useRoutineStore((s) => s.demoCompletionsFor);
  const setDemoCompletions = useRoutineStore((s) => s.setDemoCompletions);

  useEffect(() => {
    if (!demoLoadedAt || demoLoadedAt === syncedFor) return;
    const { measurements, crew, settings } = useHealthStore.getState();
    const own = useRoutineStore.getState().completions;
    if (!measurements.some((m) => m.source === 'simulated')) {
      setDemoCompletions(demoLoadedAt, own);
      return;
    }
    const generated = generateDemoCompletions({
      schedule: ALL_MANUAL_TASKS,
      missionStart: settings.missionStart,
      now: new Date(demoLoadedAt),
      crew,
      scenario: settings.scenario,
    });
    const kept =
      syncedFor === null ? own.filter((c) => !generated.some((g) => sameTask(g, c))) : [];
    setDemoCompletions(demoLoadedAt, [...generated, ...kept]);
  }, [demoLoadedAt, syncedFor, setDemoCompletions]);

  return null;
}
