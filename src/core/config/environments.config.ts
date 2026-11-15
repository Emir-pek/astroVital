import type { EnvironmentId, EnvironmentProfile, ReminderTemplate } from '@core/types';
import { MARS_SOL_SEC } from '@core/utils/time';

export const ENVIRONMENT_IDS: readonly EnvironmentId[] = [
  'iss',
  'spacecraft',
  'rover',
  'lunar_base',
  'mars_base',
] as const;

/**
 * Shared routine in three tiers — daily / weekly / monthly (ADR-035, docs/ROUTINE_SCHEDULE.md).
 * Environments add items via `withExtra`. Times are mission-day "HH:mm" (unchanged; a separate
 * decision). Which mission days a task falls on: `isScheduledOn` in `@core/utils`.
 * Also drives demo-data frequency in `core/simulation` (ADR-016 → ADR-035).
 */
export const CORE_ROUTINE: ReminderTemplate[] = [
  // ── Daily ──
  {
    id: 'sleep-log',
    metric: 'sleepHours',
    taskKey: 'routine.task.sleepLog',
    timeOfDayMET: '06:15',
    repeat: 'daily',
    sourceIds: [
      'nasa-standard-measures',
      'ntrs-2018-standard-measures',
      'esa-outpost42-daily-schedule',
      'clickorlando-2020-day-in-space',
      'nasa-std-3001-v1-medops',
    ],
  },
  {
    id: 'morning-bp',
    metric: 'systolicBP',
    taskKey: 'routine.task.morningVitals',
    timeOfDayMET: '06:30',
    repeat: 'daily',
    sourceIds: [
      'csa-bio-monitor',
      'esa-outpost42-daily-schedule',
      'clickorlando-2020-day-in-space',
      'nasa-std-3001-v1-medops',
    ],
  },
  {
    id: 'morning-hr',
    metric: 'heartRate',
    taskKey: 'routine.task.restingHeartRate',
    timeOfDayMET: '06:30',
    repeat: 'daily',
    sourceIds: [
      'csa-bio-monitor',
      'esa-outpost42-daily-schedule',
      'clickorlando-2020-day-in-space',
      'nasa-std-3001-v1-medops',
    ],
  },
  {
    id: 'morning-spo2',
    metric: 'spo2',
    taskKey: 'routine.task.spo2',
    timeOfDayMET: '06:30',
    repeat: 'daily',
    sourceIds: [
      'csa-bio-monitor',
      'esa-outpost42-daily-schedule',
      'clickorlando-2020-day-in-space',
      'nasa-std-3001-v1-medops',
    ],
  },
  {
    id: 'morning-resp',
    metric: 'respRate',
    taskKey: 'routine.task.respRate',
    timeOfDayMET: '06:30',
    repeat: 'daily',
    sourceIds: ['csa-bio-monitor'],
  },
  {
    id: 'morning-temp',
    metric: 'bodyTemp',
    taskKey: 'routine.task.temperature',
    timeOfDayMET: '06:30',
    repeat: 'daily',
    sourceIds: [
      'csa-bio-monitor',
      'esa-outpost42-daily-schedule',
      'clickorlando-2020-day-in-space',
      'nasa-std-3001-v1-medops',
    ],
  },
  {
    id: 'exercise',
    metric: 'exerciseMinutes',
    taskKey: 'routine.task.exercise',
    timeOfDayMET: '17:30',
    repeat: 'daily',
    restEveryNDays: 7,
    sourceIds: [
      'ntrs-2011-iss-exercise-conditioning',
      'ntrs-2009-iss-exrx',
      'nasa-std-3001-v1-medops',
    ],
  },
  {
    id: 'dosimeter',
    metric: 'radiationDose',
    taskKey: 'routine.task.dosimeter',
    timeOfDayMET: '19:30',
    repeat: 'daily',
    sourceIds: [
      'pmc-2024-iss-radiation-crew-dosimetry',
      'esa-pesquet-blog-presleep',
      'nasa-std-3001-v1-medops',
    ],
  },
  {
    id: 'evening-mood',
    metric: 'mood',
    taskKey: 'routine.task.mood',
    timeOfDayMET: '21:00',
    repeat: 'daily',
    sourceIds: ['nasa-standard-measures', 'esa-pesquet-blog-presleep', 'nasa-std-3001-v1-medops'],
  },
  // ── Weekly ──
  // Not a routine ISS item; weekly because glucose is a challenge indicator (ROUTINE_SCHEDULE.md).
  {
    id: 'fasting-glucose',
    metric: 'bloodGlucose',
    taskKey: 'routine.task.fastingGlucose',
    timeOfDayMET: '06:30',
    repeat: 'weekly',
    anchorDay: 1,
    sourceIds: [
      'ntrs-2006-iss-health-fitness',
      'esa-outpost42-daily-schedule',
      'clickorlando-2020-day-in-space',
      'nasa-std-3001-v1-medops',
    ],
  },
  {
    id: 'weekly-health-summary',
    taskKey: 'routine.task.weeklyHealthSummary',
    timeOfDayMET: '10:00',
    repeat: 'weekly',
    sourceIds: [
      'ntrs-2006-iss-health-fitness',
      'nasa-podcast-crew-health-consoles',
      'nasa-std-3001-v1-medops',
    ],
  },
  // ── Monthly (every 30 mission days) ──
  {
    id: 'monthly-health-exam',
    taskKey: 'routine.task.monthlyHealthExam',
    timeOfDayMET: '10:00',
    repeat: 'monthly',
    sourceIds: ['ntrs-2006-iss-health-fitness', 'nasa-std-3001-v1-medops'],
  },
  {
    id: 'monthly-sleep-team-survey',
    taskKey: 'routine.task.monthlySleepTeamSurvey',
    timeOfDayMET: '21:00',
    repeat: 'monthly',
    sourceIds: [
      'ntrs-2018-standard-measures',
      'esa-pesquet-blog-presleep',
      'nasa-std-3001-v1-medops',
    ],
  },
];

const withExtra = (...extra: ReminderTemplate[]): ReminderTemplate[] => [...CORE_ROUTINE, ...extra];

/**
 * Environment profiles. Numbers are configurable starting points; every value is backed
 * by `sourceIds` (docs/SOURCES.md) and justified in docs/THRESHOLDS.md § Ortam düzeltmeleri.
 */
export const ENVIRONMENTS: Record<EnvironmentId, EnvironmentProfile> = {
  iss: {
    id: 'iss',
    labelKey: 'environments.iss.label',
    descriptionKey: 'environments.iss.description',
    gravityG: 0,
    // Observed range ~0.3–0.8 mSv/day depending on solar cycle & orbit; midpoint used.
    expectedDailyRadiationMSv: 0.5,
    oneWayCommDelaySec: [0, 1],
    evacuationTimeHours: 24,
    medicalCapability: 'full_ground_support',
    thresholdModifiers: {
      // Core body temperature rises up to ~1 °C in long-duration microgravity (Stahn 2017).
      // Conservative +0.3 °C so a real fever is not masked.
      bodyTemp: { shift: 0.3 },
    },
    reminderSchedule: withExtra({
      id: 'evening-hr',
      metric: 'heartRate',
      taskKey: 'routine.task.eveningHeartRate',
      timeOfDayMET: '19:30',
      repeat: 'daily',
      sourceIds: ['esa-pesquet-blog-presleep', 'nasa-std-3001-v1-medops'],
    }),
    sourceIds: ['csa-radiation', 'stahn-2017-core-temp', 'nasa-iss-exercise'],
  },
  spacecraft: {
    id: 'spacecraft',
    labelKey: 'environments.spacecraft.label',
    descriptionKey: 'environments.spacecraft.description',
    gravityG: 0,
    // MSL/RAD cruise measurement: ~1.84 mSv/day in deep-space transit (Zeitlin 2013).
    expectedDailyRadiationMSv: 1.8,
    // Deep-space transit (e.g. to Mars): delay grows from seconds to ~20+ minutes.
    oneWayCommDelaySec: [5, 1340],
    evacuationTimeHours: Number.POSITIVE_INFINITY,
    medicalCapability: 'limited',
    thresholdModifiers: {
      bodyTemp: { shift: 0.3 },
    },
    reminderSchedule: withExtra({
      id: 'crew-checkin',
      taskKey: 'routine.task.crewCheckin',
      timeOfDayMET: '18:00',
      repeat: 'daily',
    }),
    sourceIds: ['zeitlin-2013-msl-rad', 'stahn-2017-core-temp', 'nasa-hrp-5-hazards'],
  },
  rover: {
    id: 'rover',
    labelKey: 'environments.rover.label',
    descriptionKey: 'environments.rover.description',
    // Assumption: pressurised rover on a lunar sortie (see docs/DECISIONS.md ADR-011).
    gravityG: 0.16,
    expectedDailyRadiationMSv: 1.3,
    oneWayCommDelaySec: [1.25, 1.4],
    evacuationTimeHours: 8, // drive back to base
    medicalCapability: 'limited',
    thresholdModifiers: {
      // Small cabin volume → CO₂ build-up risk: treat SpO₂/respiration more strictly.
      spo2: { shift: 1 },
      respRate: { widen: -1 },
      // Short sorties in cramped cabin: lower exercise expectation (nominal ≥ 60 min).
      exerciseMinutes: { shift: -60 },
    },
    reminderSchedule: [
      {
        id: 'rover-spo2',
        metric: 'spo2',
        taskKey: 'routine.task.spo2',
        timeOfDayMET: '08:00',
        repeat: 'twice_daily',
      },
      {
        id: 'rover-hr',
        metric: 'heartRate',
        taskKey: 'routine.task.restingHeartRate',
        timeOfDayMET: '08:00',
        repeat: 'twice_daily',
      },
      {
        id: 'rover-mood',
        metric: 'mood',
        taskKey: 'routine.task.mood',
        timeOfDayMET: '21:00',
        repeat: 'daily',
      },
      {
        id: 'rover-dosimeter',
        metric: 'radiationDose',
        taskKey: 'routine.task.dosimeter',
        timeOfDayMET: '20:30',
        repeat: 'daily',
      },
    ],
    sourceIds: ['zhang-2020-lunar-surface', 'nasa-hrp-5-hazards'],
  },
  lunar_base: {
    id: 'lunar_base',
    labelKey: 'environments.lunar_base.label',
    descriptionKey: 'environments.lunar_base.description',
    gravityG: 0.166,
    // Chang'E 4 LND: ~1.37 mSv/day dose equivalent on the lunar surface (Zhang 2020).
    expectedDailyRadiationMSv: 1.3,
    oneWayCommDelaySec: [1.25, 1.4],
    evacuationTimeHours: 120, // ~3–5 days back to Earth; worst case used
    medicalCapability: 'limited',
    thresholdModifiers: {
      exerciseMinutes: { shift: -30 },
    },
    reminderSchedule: withExtra(),
    sourceIds: ['zhang-2020-lunar-surface', 'nasa-hrp-5-hazards'],
  },
  mars_base: {
    id: 'mars_base',
    labelKey: 'environments.mars_base.label',
    descriptionKey: 'environments.mars_base.description',
    gravityG: 0.38,
    // Curiosity RAD on Gale crater surface: ~0.64 mSv/day (Hassler 2014).
    expectedDailyRadiationMSv: 0.64,
    oneWayCommDelaySec: [240, 1440],
    evacuationTimeHours: Number.POSITIVE_INFINITY,
    // One sol = 24 h 39 min 35.244 s — mission clock shows "Sol N" (ADR-030).
    dayLengthSec: MARS_SOL_SEC,
    dayLabelKey: 'time.sol',
    medicalCapability: 'autonomous',
    thresholdModifiers: {
      exerciseMinutes: { shift: -30 },
    },
    reminderSchedule: withExtra(
      {
        id: 'crew-checkin',
        taskKey: 'routine.task.crewCheckin',
        timeOfDayMET: '18:00',
        repeat: 'daily',
      },
      {
        id: 'weekly-report',
        taskKey: 'routine.task.weeklySurgeonReport',
        timeOfDayMET: '10:00',
        repeat: 'weekly',
      },
    ),
    sourceIds: ['hassler-2014-mars-surface', 'nasa-mars-comm-delay', 'nasa-hrp-5-hazards'],
  },
};

export const getEnvironment = (id: EnvironmentId): EnvironmentProfile => ENVIRONMENTS[id];
