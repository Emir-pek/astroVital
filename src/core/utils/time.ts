/** Mission Elapsed Time (MET) helpers. Pure functions — pass `now` explicitly. */

export const MS_PER_MINUTE = 60_000;
export const MS_PER_HOUR = 3_600_000;
export const MS_PER_DAY = 86_400_000;

export interface MetParts {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  /** true if `now` is before mission start. */
  negative: boolean;
}

export const computeMET = (missionStart: Date | string, now: Date): MetParts => {
  const start = typeof missionStart === 'string' ? new Date(missionStart) : missionStart;
  const diff = now.getTime() - start.getTime();
  const abs = Math.abs(diff);
  return {
    days: Math.floor(abs / MS_PER_DAY),
    hours: Math.floor((abs % MS_PER_DAY) / MS_PER_HOUR),
    minutes: Math.floor((abs % MS_PER_HOUR) / MS_PER_MINUTE),
    seconds: Math.floor((abs % MS_PER_MINUTE) / 1000),
    negative: diff < 0,
  };
};

const pad = (n: number, len = 2): string => String(n).padStart(len, '0');

/** "012/04:33:10" (DDD/HH:MM:SS) — NASA-style MET display. */
export const formatMET = (parts: MetParts): string =>
  `${parts.negative ? '-' : ''}${pad(parts.days, 3)}/${pad(parts.hours)}:${pad(parts.minutes)}:${pad(parts.seconds)}`;

/** Earth day in seconds (default day length for every environment). */
export const EARTH_DAY_SEC = 86_400;
/** Mars solar day (sol): 24 h 39 min 35.244 s. */
export const MARS_SOL_SEC = 88_775.244;

/**
 * 1-based local day count since mission start for a given day length (Earth day or Mars sol).
 * Day of mission start = 1. Before mission start returns 0 or a negative number
 * (−1 = the day before start, and so on). All arithmetic is in UTC milliseconds.
 */
export const missionDayFor = (
  missionStart: Date | string,
  now: Date,
  dayLengthSec: number = EARTH_DAY_SEC,
): number => {
  const start = typeof missionStart === 'string' ? new Date(missionStart) : missionStart;
  const elapsedMs = now.getTime() - start.getTime();
  return Math.floor(elapsedMs / (dayLengthSec * 1000)) + 1;
};

/** Mission day number, 1-based (day of mission start = 1). Earth days; kept for compatibility. */
export const missionDay = (missionStart: Date | string, now: Date): number =>
  missionDayFor(missionStart, now, EARTH_DAY_SEC);

/**
 * Time of day within the current local day as "HH:MM:SS" (hours may exceed 23 on a long sol,
 * e.g. "24:39:35" just before a new sol starts).
 */
export const formatTimeInDay = (
  missionStart: Date | string,
  now: Date,
  dayLengthSec: number = EARTH_DAY_SEC,
): string => {
  const start = typeof missionStart === 'string' ? new Date(missionStart) : missionStart;
  const dayMs = dayLengthSec * 1000;
  const elapsed = now.getTime() - start.getTime();
  const inDay = ((elapsed % dayMs) + dayMs) % dayMs;
  const h = Math.floor(inDay / MS_PER_HOUR);
  const m = Math.floor((inDay % MS_PER_HOUR) / MS_PER_MINUTE);
  const s = Math.floor((inDay % MS_PER_MINUTE) / 1000);
  return `${pad(h)}:${pad(m)}:${pad(s)}`;
};

/** Parses "HH:mm" into minutes after mission-day midnight. Throws on invalid input. */
export const parseTimeOfDay = (hhmm: string): number => {
  const match = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(hhmm);
  if (!match) throw new Error(`Invalid time of day "${hhmm}" (expected HH:mm)`);
  return Number(match[1]) * 60 + Number(match[2]);
};

/** Start of the given UTC day. */
export const startOfUtcDay = (d: Date): Date =>
  new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
