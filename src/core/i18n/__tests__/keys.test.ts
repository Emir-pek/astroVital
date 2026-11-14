import { describe, expect, it } from 'vitest';
import {
  BODY_REGION_IDS,
  BODY_REGIONS,
  ENVIRONMENT_IDS,
  ENVIRONMENTS,
  HAZARD_IDS,
  HAZARDS,
  METRIC_IDS,
  METRICS,
  THRESHOLDS,
} from '@core/config';
import { SCENARIO_IDS, SCENARIOS } from '@core/simulation';
import en from '../en.json';
import tr from '../tr.json';

type Tree = { [k: string]: string | Tree };

const flatten = (obj: Tree, prefix = ''): string[] =>
  Object.entries(obj).flatMap(([k, v]) =>
    typeof v === 'string' ? [`${prefix}${k}`] : flatten(v, `${prefix}${k}.`),
  );

const enKeys = new Set(flatten(en as Tree));
const trKeys = new Set(flatten(tr as Tree));

describe('i18n resources', () => {
  it('EN and TR have exactly the same keys', () => {
    expect(
      [...enKeys].filter((k) => !trKeys.has(k)),
      'missing in tr.json',
    ).toEqual([]);
    expect(
      [...trKeys].filter((k) => !enKeys.has(k)),
      'missing in en.json',
    ).toEqual([]);
  });

  it('every i18n key referenced by config exists', () => {
    const referenced = [
      ...METRIC_IDS.flatMap((id) => {
        const m = METRICS[id];
        return [m.labelKey, m.descriptionKey, m.measurementHowToKey];
      }),
      ...HAZARD_IDS.flatMap((id) => {
        const h = HAZARDS[id];
        return [h.labelKey, h.descriptionKey, h.countermeasuresKey];
      }),
      ...BODY_REGION_IDS.flatMap((id) => {
        const r = BODY_REGIONS[id];
        return [r.labelKey, r.functionKey, r.spaceRiskKey];
      }),
      ...ENVIRONMENT_IDS.flatMap((id) => {
        const e = ENVIRONMENTS[id];
        return [
          e.labelKey,
          e.descriptionKey,
          e.dayLabelKey ?? 'time.missionDay',
          ...e.reminderSchedule.map((r) => r.taskKey),
        ];
      }),
      ...METRIC_IDS.flatMap((id) => {
        const t = THRESHOLDS[id];
        return [
          ...t.bands.map((b) => b.messageKey),
          ...(t.sustained ?? []).map((s) => s.messageKey),
        ];
      }),
      ...SCENARIO_IDS.flatMap((id) => [SCENARIOS[id].labelKey, SCENARIOS[id].descriptionKey]),
      ...['green', 'yellow', 'red'].flatMap((s) => [`status.${s}`, `status.meaning.${s}`]),
      ...['self_care', 'crew_medical_officer', 'flight_surgeon', 'emergency'].map(
        (e) => `escalation.${e}`,
      ),
      ...['improving', 'stable', 'worsening', 'unknown'].map((t) => `trend.${t}`),
      ...['keyboard', 'click', 'camera', 'ultrasound', 'simulated', 'import'].map(
        (s) => `source.${s}`,
      ),
    ];
    const missing = [...new Set(referenced)].filter((k) => !enKeys.has(k));
    expect(missing).toEqual([]);
  });
});
