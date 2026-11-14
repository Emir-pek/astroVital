import type { MetricId } from '@core/types';

/** Storage is ALWAYS canonical (°C, mg/dL). Conversion happens only at the UI edge. */
export type TemperatureUnit = 'C' | 'F';
export type GlucoseUnit = 'mg/dL' | 'mmol/L';

export interface UnitPreferences {
  temperature: TemperatureUnit;
  glucose: GlucoseUnit;
}

export const DEFAULT_UNITS: UnitPreferences = { temperature: 'C', glucose: 'mg/dL' };

/** mg/dL per mmol/L for glucose (molar mass 180.16 g/mol). */
export const GLUCOSE_MGDL_PER_MMOLL = 18.016;

export const celsiusToFahrenheit = (c: number): number => (c * 9) / 5 + 32;
export const fahrenheitToCelsius = (f: number): number => ((f - 32) * 5) / 9;
export const mgdlToMmol = (mgdl: number): number => mgdl / GLUCOSE_MGDL_PER_MMOLL;
export const mmolToMgdl = (mmol: number): number => mmol * GLUCOSE_MGDL_PER_MMOLL;

/** Canonical → display value + unit label. */
export const toDisplay = (
  metric: MetricId,
  canonical: number,
  canonicalUnit: string,
  prefs: UnitPreferences,
): { value: number; unit: string } => {
  if (metric === 'bodyTemp' && prefs.temperature === 'F')
    return { value: celsiusToFahrenheit(canonical), unit: '°F' };
  if (metric === 'bloodGlucose' && prefs.glucose === 'mmol/L')
    return { value: mgdlToMmol(canonical), unit: 'mmol/L' };
  return { value: canonical, unit: canonicalUnit };
};

/** Display value (in user's unit) → canonical value for storage. */
export const toCanonical = (metric: MetricId, display: number, prefs: UnitPreferences): number => {
  if (metric === 'bodyTemp' && prefs.temperature === 'F') return fahrenheitToCelsius(display);
  if (metric === 'bloodGlucose' && prefs.glucose === 'mmol/L') return mmolToMgdl(display);
  return display;
};
