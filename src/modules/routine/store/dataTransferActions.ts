import { useHealthStore } from '@core/store';
import { buildExportJson, parseImportJson, type ImportResult } from '../services/dataTransfer';
import { useRoutineStore } from './useRoutineStore';

/**
 * Store wiring of backup export / import (ADR-052). No UI: the Settings buttons (visualization)
 * call these. `exportData` returns the JSON text; saving it as a file is the caller's job.
 */
export function exportData(now: Date = new Date()): string {
  const { measurements, crew, settings } = useHealthStore.getState();
  const { completions, dailyMissionCompletions } = useRoutineStore.getState();
  return buildExportJson(
    { measurements, crew, settings, routine: { completions, dailyMissionCompletions } },
    now,
  );
}

/**
 * Validates and RESTORES a backup: replaces measurements, crew, settings and routine completions.
 * On invalid input nothing changes and the result says why.
 */
export function importData(json: string): ImportResult {
  const result = parseImportJson(json);
  if (!result.ok) return result;
  const { measurements, crew, settings, routine } = result.snapshot;
  useHealthStore.getState().replaceData({ measurements, crew, settings });
  useRoutineStore.setState({
    completions: routine.completions,
    dailyMissionCompletions: routine.dailyMissionCompletions,
    // Announcements belong to the old data set; start fresh.
    notifiedIds: {},
  });
  return result;
}
