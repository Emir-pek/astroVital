import { CORE_ROUTINE } from '@core/config/environments.config';
import { METRICS } from '@core/config/metrics.config';
import type {
  CrewMember,
  EnvironmentProfile,
  GenerateHistoryOptions,
  Measurement,
  MetricId,
  ReminderTemplate,
} from '@core/types';
import { clamp, roundToStep } from '@core/utils/format';
import { isScheduledOn } from '@core/utils/routineSchedule';
import { MS_PER_DAY, MS_PER_MINUTE, parseTimeOfDay, startOfUtcDay } from '@core/utils/time';
import { createRng, type Rng } from './prng';
import { SCENARIOS, type ScenarioContext, type ScenarioDefinition } from './scenarios';

/** Day-to-day measurement noise (1 SD) in canonical units. */
const NOISE_SD: Record<MetricId, number> = {
  systolicBP: 5,
  diastolicBP: 4,
  heartRate: 4,
  bloodGlucose: 6,
  bodyTemp: 0.15,
  sleepHours: 0.5,
  mood: 0.45,
  spo2: 0.7,
  respRate: 1.2,
  radiationDose: 0, // multiplicative noise, see below
  exerciseMinutes: 14,
};

/** Fallback baseline if a crew member lacks one. */
const DEFAULT_BASELINE: Record<MetricId, number> = {
  systolicBP: 117,
  diastolicBP: 76,
  heartRate: 64,
  bloodGlucose: 90,
  bodyTemp: 36.7,
  sleepHours: 7.2,
  mood: 4,
  spo2: 98,
  respRate: 14,
  radiationDose: 0.5,
  exerciseMinutes: 130,
};

/** Environment effect on the "expected" value (beyond the threshold modifiers). */
const environmentOffset = (metric: MetricId, env: EnvironmentProfile): number => {
  switch (metric) {
    // Microgravity: core temperature runs warmer (Stahn 2017).
    case 'bodyTemp':
      return env.gravityG < 0.05 ? 0.3 : 0;
    // Exercise expectations are lower in cramped rover cabins.
    case 'exerciseMinutes':
      return env.id === 'rover' ? -60 : 0;
    default:
      return 0;
  }
};

/** Minutes after midnight; splits morning and evening slots of the same metric. */
const NOON_MIN = 12 * 60;

/** Metrics recorded together with another metric's reminder (one cuff reading → both values). */
const SCHEDULE_ALIAS: Partial<Record<MetricId, MetricId>> = { diastolicBP: 'systolicBP' };

type Half = 'am' | 'pm';

/** Reminder template for `metric` in the given half of the day, if the environment has one. */
const templateFor = (
  env: EnvironmentProfile,
  metric: MetricId,
  half: Half,
): ReminderTemplate | undefined => {
  const scheduled = SCHEDULE_ALIAS[metric] ?? metric;
  return env.reminderSchedule.find(
    (t) => t.metric === scheduled && (half === 'am') === parseTimeOfDay(t.timeOfDayMET) < NOON_MIN,
  );
};

/**
 * "Data = schedule" (ADR-040) applies to environments whose schedule contains the whole shared
 * CORE_ROUTINE. Others (today: rover, own schedule — environment differences are a separate decision)
 * keep the legacy ADR-016 behaviour for slots their schedule does not cover.
 */
const followsCoreRoutine = (env: EnvironmentProfile): boolean =>
  CORE_ROUTINE.every((c) => env.reminderSchedule.some((t) => t.id === c.id));

/** Legacy day rule (rover only): CORE_ROUTINE frequency by template id, unknown id → every day. */
const legacyScheduledOn = (templateId: string, missionDay: number): boolean => {
  const template = CORE_ROUTINE.find((t) => t.id === templateId);
  return template ? isScheduledOn(template, missionDay) : true;
};

interface SlotMetric {
  metric: MetricId;
  circadian?: number;
}

/**
 * One data-entry moment of the day. Metrics of a slot share timestamp (and groupId when `grouped`).
 * Legacy fields (`legacy*`) are used only in legacy mode for metrics without a schedule item.
 */
interface SlotDef {
  slot: string;
  half: Half;
  jitterMin: number;
  grouped?: boolean;
  metrics: SlotMetric[];
  legacyMinute: number;
  /** Legacy day rule: CORE_ROUTINE id, 'coin' (≈50 % of days, ADR-016) or undefined = every day. */
  legacyRule?: string;
}

const SLOTS: SlotDef[] = [
  {
    slot: 'wake',
    half: 'am',
    jitterMin: 10,
    metrics: [{ metric: 'sleepHours' }],
    legacyMinute: 420,
  },
  {
    slot: 'am',
    half: 'am',
    jitterMin: 15,
    grouped: true,
    metrics: [
      { metric: 'systolicBP' },
      { metric: 'diastolicBP' },
      { metric: 'heartRate' },
      { metric: 'spo2' },
      { metric: 'respRate' },
      { metric: 'bodyTemp', circadian: -0.15 },
    ],
    legacyMinute: 450,
  },
  {
    slot: 'glu',
    half: 'am',
    jitterMin: 10,
    metrics: [{ metric: 'bloodGlucose' }],
    legacyMinute: 460,
    legacyRule: 'fasting-glucose',
  },
  {
    slot: 'pm',
    half: 'pm',
    jitterMin: 30,
    grouped: true,
    metrics: [
      { metric: 'systolicBP', circadian: 3 },
      { metric: 'diastolicBP', circadian: 2 },
      { metric: 'heartRate', circadian: 5 },
      { metric: 'bodyTemp', circadian: 0.25 },
    ],
    legacyMinute: 1140,
    legacyRule: 'coin',
  },
  {
    slot: 'ex',
    half: 'pm',
    jitterMin: 30,
    metrics: [{ metric: 'exerciseMinutes' }],
    legacyMinute: 1020,
    legacyRule: 'exercise',
  },
  {
    slot: 'dose',
    half: 'pm',
    jitterMin: 10,
    metrics: [{ metric: 'radiationDose' }],
    legacyMinute: 1230,
  },
  { slot: 'mood', half: 'pm', jitterMin: 20, metrics: [{ metric: 'mood' }], legacyMinute: 1260 },
];

interface SlotInput {
  member: CrewMember;
  crewIndex: number;
  dayIndex: number;
  ts: number;
  slot: string;
  metrics: SlotMetric[];
  groupId?: string;
}

/**
 * Generates a deterministic measurement history.
 * PURE: identical options ⇒ identical output (no Date.now, no Math.random).
 * Measurements later than `end` are not produced.
 *
 * Data = schedule (ADR-035 frequency, ADR-039 times, ADR-040 content): a metric is produced on a
 * mission day only if the active environment's schedule has a reminder for it that falls on that day,
 * at that reminder's time (± a few minutes of entry noise).
 */
export const generateHistory = ({
  seed,
  crew,
  environment,
  scenario,
  days,
  end,
}: GenerateHistoryOptions): Measurement[] => {
  const rng = createRng(seed);
  const def = SCENARIOS[scenario];
  const endMs = end.getTime();
  const firstDayMs = startOfUtcDay(end).getTime() - (days - 1) * MS_PER_DAY;
  const out: Measurement[] = [];
  const strict = followsCoreRoutine(environment);

  const emit = (input: SlotInput) => {
    if (input.ts > endMs) return;
    const ctx: ScenarioContext = {
      dayIndex: input.dayIndex,
      days,
      crewIndex: input.crewIndex,
      environment,
    };
    for (const { metric, circadian = 0 } of input.metrics) {
      const value = sampleValue(rng, def, input.member, metric, environment, ctx, circadian);
      out.push({
        id: `sim-${seed}-${input.member.id}-d${input.dayIndex}-${input.slot}-${metric}`,
        crewId: input.member.id,
        metric,
        value,
        timestamp: new Date(input.ts).toISOString(),
        source: 'simulated',
        environment: environment.id,
        ...(input.groupId ? { groupId: input.groupId } : {}),
      });
    }
  };

  crew.forEach((member, crewIndex) => {
    for (let dayIndex = 0; dayIndex < days; dayIndex++) {
      const day = firstDayMs + dayIndex * MS_PER_DAY;
      // History starts on mission day 1 (store sets missionStart to the first generated day).
      const missionDay = dayIndex + 1;

      for (const s of SLOTS) {
        let minute: number | undefined;
        const metrics: SlotMetric[] = [];
        let legacyChecked = false;
        let legacyOn = true;
        for (const m of s.metrics) {
          const t = templateFor(environment, m.metric, s.half);
          if (t) {
            if (!isScheduledOn(t, missionDay)) continue;
            minute ??= parseTimeOfDay(t.timeOfDayMET);
            metrics.push(m);
          } else if (!strict) {
            // Legacy mode (rover): metric without a schedule item keeps its ADR-016 behaviour.
            if (!legacyChecked) {
              legacyChecked = true;
              legacyOn =
                s.legacyRule === 'coin'
                  ? rng.chance(0.5)
                  : s.legacyRule === undefined || legacyScheduledOn(s.legacyRule, missionDay);
            }
            if (legacyOn) metrics.push(m);
          }
        }
        if (metrics.length === 0) continue;
        // Realism noise: entries are made a few minutes around the scheduled time.
        const ts =
          day + ((minute ?? s.legacyMinute) + rng.int(-s.jitterMin, s.jitterMin)) * MS_PER_MINUTE;
        emit({
          member,
          crewIndex,
          dayIndex,
          ts,
          slot: s.slot,
          metrics,
          ...(s.grouped && metrics.length > 1
            ? { groupId: `sim-${seed}-${member.id}-d${dayIndex}-${s.slot}` }
            : {}),
        });
      }
    }
  });

  return out.sort((a, b) => a.timestamp.localeCompare(b.timestamp));
};

const sampleValue = (
  rng: Rng,
  def: ScenarioDefinition,
  member: CrewMember,
  metric: MetricId,
  environment: EnvironmentProfile,
  ctx: ScenarioContext,
  circadian: number,
): number => {
  const meta = METRICS[metric];
  let value: number;
  if (metric === 'radiationDose') {
    // Daily dose ≈ environment expectation with ±12 % variation (log-normal-ish, always > 0).
    value = environment.expectedDailyRadiationMSv * Math.exp(rng.normal(0, 0.12));
  } else {
    const baseline = member.baseline[metric] ?? DEFAULT_BASELINE[metric];
    value =
      baseline +
      environmentOffset(metric, environment) +
      circadian +
      rng.normal(0, NOISE_SD[metric]);
  }
  const { add = 0, mul = 1 } = def.effect(metric, ctx);
  value = value * mul + add;
  if (metric === 'mood') value = Math.round(value);
  return clamp(roundToStep(value, meta.step), meta.min, meta.max);
};
