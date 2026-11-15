/**
 * Reminder time-window rules (ADR-049, docs/ROUTINE_SCHEDULE.md § Durum kuralları).
 * Tune here only — engine, hooks and tests read these constants.
 */

/** A task becomes actionable this many minutes BEFORE its scheduled time ('upcoming' → 'due'). */
export const EARLY_WINDOW_MIN = 60;

/** Grace after the scheduled time: done until then, afterwards 'late' (if done) or 'missed'. */
export const DUE_GRACE_MIN = 120;

/**
 * Second slot of a `twice_daily` task, minutes after the first one.
 * TEMPORARY (ADR-049): the environment-differences decision will set real times.
 */
export const TWICE_DAILY_OFFSET_MIN = 12 * 60;
