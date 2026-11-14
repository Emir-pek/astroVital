import { METRICS } from '@core/config/metrics.config';
import type {
  CrewMember,
  EnvironmentProfile,
  GenerateHistoryOptions,
  Measurement,
  MetricId,
} from '@core/types';
import { clamp, roundToStep } from '@core/utils/format';
import { MS_PER_DAY, MS_PER_MINUTE, startOfUtcDay } from '@core/utils/time';
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

interface SlotInput {
  member: CrewMember;
  crewIndex: number;
  dayIndex: number;
  ts: number;
  slot: string;
  metrics: { metric: MetricId; circadian?: number }[];
  groupId?: string;
}

/**
 * Generates a deterministic measurement history.
 * PURE: identical options ⇒ identical output (no Date.now, no Math.random).
 * Measurements later than `end` are not produced.
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
      const at = (h: number, m: number, jitterMin: number) =>
        day + (h * 60 + m + rng.int(-jitterMin, jitterMin)) * MS_PER_MINUTE;
      const base = { member, crewIndex, dayIndex };
      const morningGroup = `sim-${seed}-${member.id}-d${dayIndex}-am`;

      emit({ ...base, ts: at(7, 0, 10), slot: 'wake', metrics: [{ metric: 'sleepHours' }] });
      emit({
        ...base,
        ts: at(7, 30, 15),
        slot: 'am',
        groupId: morningGroup,
        metrics: [
          { metric: 'systolicBP' },
          { metric: 'diastolicBP' },
          { metric: 'heartRate' },
          { metric: 'spo2' },
          { metric: 'respRate' },
          { metric: 'bodyTemp', circadian: -0.15 },
        ],
      });
      // Fasting glucose every 3rd day (finger-stick supplies are limited).
      if (dayIndex % 3 === 0)
        emit({ ...base, ts: at(7, 40, 10), slot: 'glu', metrics: [{ metric: 'bloodGlucose' }] });
      // Optional evening vitals (≈ half of the days) → "1–2 measurements per day".
      if (rng.chance(0.5)) {
        emit({
          ...base,
          ts: at(19, 0, 30),
          slot: 'pm',
          groupId: `sim-${seed}-${member.id}-d${dayIndex}-pm`,
          metrics: [
            { metric: 'systolicBP', circadian: 3 },
            { metric: 'diastolicBP', circadian: 2 },
            { metric: 'heartRate', circadian: 5 },
            { metric: 'bodyTemp', circadian: 0.25 },
          ],
        });
      }
      emit({ ...base, ts: at(17, 0, 30), slot: 'ex', metrics: [{ metric: 'exerciseMinutes' }] });
      emit({ ...base, ts: at(20, 30, 10), slot: 'dose', metrics: [{ metric: 'radiationDose' }] });
      emit({ ...base, ts: at(21, 0, 20), slot: 'mood', metrics: [{ metric: 'mood' }] });
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
