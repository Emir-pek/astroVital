import { z } from 'zod';
import { ENVIRONMENT_IDS } from '@core/config/environments.config';
import { METRIC_IDS } from '@core/config/metrics.config';
import { SCENARIO_IDS } from '@core/simulation';
import type { AppSettings } from '@core/store';
import type { CrewMember, Measurement } from '@core/types';
import type { TaskCompletion } from './reminderEngine';
import type { DailyMissionCompletion } from '../store/useRoutineStore';

/**
 * Backup export / import (ADR-052). PURE: build and parse JSON only — the store wiring is in
 * `exportData` / `importData` (hooks-free, see index). Import is a RESTORE: it replaces
 * measurements, crew, settings and routine completions. Each measurement keeps its original
 * `source` (keyboard, camera, simulated …) — provenance stays visible after a restore.
 */

export const EXPORT_FORMAT = 'astrovital-export';
export const EXPORT_VERSION = 1;

export interface ExportSnapshot {
  measurements: Measurement[];
  crew: CrewMember[];
  settings: AppSettings;
  routine: {
    completions: TaskCompletion[];
    dailyMissionCompletions: DailyMissionCompletion[];
  };
}

const enumOf = <T extends string>(values: readonly T[]) => z.enum(values as [T, ...T[]]);
const iso = z.iso.datetime({ offset: true });

const measurementSchema = z.object({
  id: z.string().min(1),
  crewId: z.string().min(1),
  metric: enumOf(METRIC_IDS),
  value: z.number().finite(),
  timestamp: iso,
  source: z.enum(['keyboard', 'click', 'camera', 'ultrasound', 'simulated', 'import']),
  environment: enumOf(ENVIRONMENT_IDS),
  groupId: z.string().optional(),
  confidence: z.number().min(0).max(1).optional(),
  note: z.string().optional(),
  attachmentId: z.string().optional(),
});

const crewSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  role: z.string(),
  age: z.number().int().positive(),
  sex: z.enum(['F', 'M']),
  avatarColor: z.string(),
  baseline: z.partialRecord(enumOf(METRIC_IDS), z.number().finite()),
  priorRadiationMSv: z.number().min(0).optional(),
});

const settingsSchema = z.object({
  language: z.enum(['en', 'tr']),
  units: z.object({ temperature: z.enum(['C', 'F']), glucose: z.enum(['mg/dL', 'mmol/L']) }),
  scenario: enumOf(SCENARIO_IDS),
  seed: z.number().int(),
  historyDays: z.number().int().min(1),
  missionStart: iso,
  notificationsEnabled: z.boolean().default(false),
  autoLoadDemo: z.boolean().default(true),
});

const exportSchema = z.object({
  format: z.literal(EXPORT_FORMAT),
  version: z.literal(EXPORT_VERSION),
  exportedAt: iso,
  measurements: z.array(measurementSchema),
  crew: z.array(crewSchema).min(1),
  settings: settingsSchema,
  routine: z
    .object({
      completions: z.array(
        z.object({
          crewId: z.string(),
          templateId: z.string(),
          missionDay: z.number().int(),
          at: iso,
        }),
      ),
      dailyMissionCompletions: z.array(
        z.object({
          crewId: z.string(),
          missionId: z.string(),
          missionDay: z.number().int(),
          at: iso,
        }),
      ),
    })
    .default({ completions: [], dailyMissionCompletions: [] }),
});

/** Serialises a snapshot as pretty JSON with a format header. */
export const buildExportJson = (snapshot: ExportSnapshot, now: Date): string =>
  JSON.stringify(
    {
      format: EXPORT_FORMAT,
      version: EXPORT_VERSION,
      exportedAt: now.toISOString(),
      measurements: snapshot.measurements,
      crew: snapshot.crew,
      settings: snapshot.settings,
      routine: snapshot.routine,
    },
    null,
    2,
  );

export type ImportResult =
  | { ok: true; snapshot: ExportSnapshot }
  | {
      ok: false;
      /** Short English reason (for logs / developer); the UI shows its own translated text. */
      error: 'invalidJson' | 'invalidFormat' | 'unknownCrew';
      /** Human-readable details, e.g. "measurements.3.metric: Invalid option". At most 10. */
      issues: string[];
    };

/** Parses and validates an export file. Never throws. */
export const parseImportJson = (json: string): ImportResult => {
  let raw: unknown;
  try {
    raw = JSON.parse(json);
  } catch (e) {
    return {
      ok: false,
      error: 'invalidJson',
      issues: [e instanceof Error ? e.message : String(e)],
    };
  }
  const parsed = exportSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      ok: false,
      error: 'invalidFormat',
      issues: parsed.error.issues
        .slice(0, 10)
        .map((i) => `${i.path.join('.') || '(root)'}: ${i.message}`),
    };
  }
  const data = parsed.data;
  const crewIds = new Set(data.crew.map((c) => c.id));
  const orphans = data.measurements.filter((m) => !crewIds.has(m.crewId));
  if (orphans.length > 0) {
    return {
      ok: false,
      error: 'unknownCrew',
      issues: [...new Set(orphans.map((m) => `measurement crewId "${m.crewId}" is not in crew`))],
    };
  }
  return {
    ok: true,
    snapshot: {
      measurements: data.measurements as Measurement[],
      crew: data.crew as CrewMember[],
      settings: data.settings,
      routine: data.routine,
    },
  };
};
