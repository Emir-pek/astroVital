import { describe, expect, it } from 'vitest';
import { ENVIRONMENTS } from '@core/config/environments.config';
import { THRESHOLDS } from '@core/config/thresholds.config';
import { METRICS } from '@core/config/metrics.config';
import {
  createRng,
  DEMO_CREW,
  DEMO_DEFAULTS,
  generateHistory,
  MIXED,
  mulberry32,
  SCENARIO_IDS,
} from '@core/simulation';
import type { GenerateHistoryOptions, Measurement, MetricId, Status } from '@core/types';
import { isScheduledOn, parseTimeOfDay } from '@core/utils';

const END = new Date('2026-11-14T22:00:00.000Z');

const opts = (over: Partial<GenerateHistoryOptions> = {}): GenerateHistoryOptions => ({
  seed: 42,
  crew: DEMO_CREW,
  environment: ENVIRONMENTS.iss,
  scenario: 'nominal',
  days: 30,
  end: END,
  ...over,
});

describe('prng', () => {
  it('mulberry32 is deterministic for a seed', () => {
    const a = mulberry32(7);
    const b = mulberry32(7);
    const seqA = Array.from({ length: 5 }, a);
    const seqB = Array.from({ length: 5 }, b);
    expect(seqA).toEqual(seqB);
    seqA.forEach((x) => {
      expect(x).toBeGreaterThanOrEqual(0);
      expect(x).toBeLessThan(1);
    });
  });

  it('createRng.int stays within inclusive bounds', () => {
    const rng = createRng(1);
    for (let i = 0; i < 500; i++) {
      const v = rng.int(-3, 3);
      expect(v).toBeGreaterThanOrEqual(-3);
      expect(v).toBeLessThanOrEqual(3);
    }
  });
});

describe('generateHistory', () => {
  it('same seed → identical output', () => {
    expect(generateHistory(opts())).toEqual(generateHistory(opts()));
  });

  it('different seed → different output', () => {
    const a = generateHistory(opts({ seed: 1 }));
    const b = generateHistory(opts({ seed: 2 }));
    expect(a.map((m) => m.value)).not.toEqual(b.map((m) => m.value));
  });

  it('produces every metric for every crew member, within input bounds, never after `end`', () => {
    const out = generateHistory(opts());
    for (const member of DEMO_CREW) {
      const metrics = new Set(out.filter((m) => m.crewId === member.id).map((m) => m.metric));
      expect(metrics.size).toBe(Object.keys(METRICS).length);
    }
    for (const m of out) {
      const def = METRICS[m.metric];
      expect(m.value).toBeGreaterThanOrEqual(def.min);
      expect(m.value).toBeLessThanOrEqual(def.max);
      expect(Date.parse(m.timestamp)).toBeLessThanOrEqual(END.getTime());
      expect(m.source).toBe('simulated');
      expect(m.environment).toBe('iss');
    }
  });

  it('ids are unique and output is sorted by time', () => {
    const out = generateHistory(opts());
    expect(new Set(out.map((m) => m.id)).size).toBe(out.length);
    const sorted = [...out].sort((a, b) => a.timestamp.localeCompare(b.timestamp));
    expect(out).toEqual(sorted);
  });

  it('mood is an integer 1–5', () => {
    const moods = generateHistory(opts()).filter((m) => m.metric === 'mood');
    moods.forEach((m) => expect(Number.isInteger(m.value)).toBe(true));
  });

  it('follows the reminder schedule: weekly glucose, exercise rest every 7th mission day (ADR-035)', () => {
    const out = generateHistory(opts());
    const first = Date.parse(out[0]?.timestamp ?? '');
    const dayStart = first - (first % 86_400_000);
    const missionDayOf = (iso: string) => Math.floor((Date.parse(iso) - dayStart) / 86_400_000) + 1;
    for (const member of DEMO_CREW) {
      const mine = out.filter((m) => m.crewId === member.id);
      const glucoseDays = mine
        .filter((m) => m.metric === 'bloodGlucose')
        .map((m) => missionDayOf(m.timestamp));
      expect(glucoseDays).toEqual([1, 8, 15, 22, 29]);
      const exerciseDays = mine
        .filter((m) => m.metric === 'exerciseMinutes')
        .map((m) => missionDayOf(m.timestamp));
      expect(exerciseDays).toHaveLength(30 - 4); // rest on days 7, 14, 21, 28
      [7, 14, 21, 28].forEach((d) => expect(exerciseDays).not.toContain(d));
      expect(exerciseDays).toContain(8);
    }
  });

  describe('slot times come from the environment schedule (ADR-039)', () => {
    const minuteOfDay = (iso: string) => {
      const d = new Date(iso);
      return d.getUTCHours() * 60 + d.getUTCMinutes();
    };
    /** [metric, filter, scheduled minute, jitter] — every measurement must lie within ±jitter. */
    const within = (
      out: ReturnType<typeof generateHistory>,
      metric: string,
      centre: number,
      jitter: number,
      pick: (min: number) => boolean = () => true,
    ) => {
      const mins = out.filter((m) => m.metric === metric).map((m) => minuteOfDay(m.timestamp));
      const sel = mins.filter(pick);
      expect(sel.length, metric).toBeGreaterThan(0);
      sel.forEach((min) => {
        expect(min, metric).toBeGreaterThanOrEqual(centre - jitter);
        expect(min, metric).toBeLessThanOrEqual(centre + jitter);
      });
    };
    const AM = (min: number) => min < 12 * 60;
    const PM = (min: number) => min >= 12 * 60;

    it('ISS: wake 06:15, morning vitals + glucose 06:30, exercise 17:30, evening HR 19:30, mood 21:00', () => {
      const out = generateHistory(opts());
      within(out, 'sleepHours', 6 * 60 + 15, 10);
      ['systolicBP', 'diastolicBP', 'heartRate', 'spo2', 'respRate', 'bodyTemp'].forEach((m) =>
        within(out, m, 6 * 60 + 30, 15, AM),
      );
      within(out, 'bloodGlucose', 6 * 60 + 30, 10);
      within(out, 'exerciseMinutes', 17 * 60 + 30, 30);
      within(out, 'radiationDose', 19 * 60 + 30, 10);
      within(out, 'heartRate', 19 * 60 + 30, 30, PM);
      within(out, 'mood', 21 * 60, 20);
    });

    it('systolic and diastolic of one group share timestamp and groupId', () => {
      const out = generateHistory(opts());
      const sys = out.filter((m) => m.metric === 'systolicBP');
      for (const s of sys) {
        const dia = out.find((m) => m.metric === 'diastolicBP' && m.groupId === s.groupId);
        expect(dia?.timestamp).toBe(s.timestamp);
      }
    });

    it('rover: own schedule (08:00) where it has an item, ADR-016 fallback where it has none', () => {
      const out = generateHistory(opts({ environment: ENVIRONMENTS.rover }));
      within(out, 'heartRate', 8 * 60, 15, AM);
      within(out, 'radiationDose', 20 * 60 + 30, 10);
      within(out, 'sleepHours', 7 * 60, 10);
      within(out, 'bloodGlucose', 7 * 60 + 40, 10);
      within(out, 'exerciseMinutes', 17 * 60, 30);
    });
  });

  it('every scenario runs', () => {
    for (const scenario of SCENARIO_IDS) {
      expect(generateHistory(opts({ scenario, days: 10 })).length).toBeGreaterThan(0);
    }
  });

  it('solar_particle_event creates a radiation spike > 5× the environment expectation', () => {
    const env = ENVIRONMENTS.spacecraft;
    const doses = generateHistory(opts({ scenario: 'solar_particle_event', environment: env }))
      .filter((m) => m.metric === 'radiationDose')
      .map((m) => m.value);
    expect(Math.max(...doses)).toBeGreaterThan(5 * env.expectedDailyRadiationMSv);
  });

  it('fever_dehydration raises crew-2 temperature on the last day', () => {
    const temps = generateHistory(opts({ scenario: 'fever_dehydration' })).filter(
      (m) => m.crewId === 'crew-2' && m.metric === 'bodyTemp',
    );
    const last = temps[temps.length - 1];
    expect(last?.value).toBeGreaterThanOrEqual(38);
  });

  it('same seed → identical output for mixed_mission', () => {
    expect(generateHistory(opts({ scenario: 'mixed_mission' }))).toEqual(
      generateHistory(opts({ scenario: 'mixed_mission' })),
    );
  });
});

const DAY_MS = 86_400_000;
const missionDayOf = (out: Measurement[], iso: string) => {
  const first = Date.parse(out[0]?.timestamp ?? '');
  const dayStart = first - (first % DAY_MS);
  return Math.floor((Date.parse(iso) - dayStart) / DAY_MS) + 1;
};
const minuteOfDay = (iso: string) => {
  const d = new Date(iso);
  return d.getUTCHours() * 60 + d.getUTCMinutes();
};

describe('data = schedule (ADR-040)', () => {
  const env = ENVIRONMENTS.iss;
  const out = generateHistory(opts());
  const alias = (m: MetricId): MetricId => (m === 'diastolicBP' ? 'systolicBP' : m);

  it('ISS: every measurement belongs to a reminder that falls on that day, near its time', () => {
    for (const m of out) {
      const day = missionDayOf(out, m.timestamp);
      const minute = minuteOfDay(m.timestamp);
      const match = env.reminderSchedule.find(
        (t) =>
          t.metric === alias(m.metric) &&
          isScheduledOn(t, day) &&
          Math.abs(parseTimeOfDay(t.timeOfDayMET) - minute) <= 30,
      );
      expect(match, `${m.metric} on day ${day} at ${minute} min`).toBeDefined();
    }
  });

  it('ISS: every reminder with a metric is answered on each of its scheduled days', () => {
    for (const member of DEMO_CREW) {
      const mine = out.filter((m) => m.crewId === member.id);
      for (const t of env.reminderSchedule) {
        if (!t.metric) continue;
        const target = parseTimeOfDay(t.timeOfDayMET);
        for (let day = 1; day <= 30; day++) {
          if (!isScheduledOn(t, day)) continue;
          const hit = mine.some(
            (m) =>
              m.metric === t.metric &&
              missionDayOf(out, m.timestamp) === day &&
              Math.abs(minuteOfDay(m.timestamp) - target) <= 30,
          );
          expect(hit, `${member.id} ${t.id} day ${day}`).toBe(true);
        }
      }
    }
  });

  it('ISS: no evening vitals besides the scheduled heart rate; other environments have none', () => {
    const evening = (o: Measurement[]) =>
      o.filter((m) => m.id.includes('-pm-')).map((m) => m.metric);
    expect(new Set(evening(out))).toEqual(new Set(['heartRate']));
    expect(evening(generateHistory(opts({ environment: ENVIRONMENTS.lunar_base })))).toEqual([]);
  });
});

describe('mixed_mission stories (ADR-038, docs/DEMO_CREW_STORIES.md)', () => {
  // Default demo parameters: seed 2026, ISS, 30 days, generated late on the last day.
  const out = generateHistory(
    opts({ scenario: 'mixed_mission', seed: DEMO_DEFAULTS.seed, days: DEMO_DEFAULTS.days }),
  );
  const series = (crewId: string, metric: MetricId) =>
    out.filter((m) => m.crewId === crewId && m.metric === metric);
  const values = (crewId: string, metric: MetricId) => series(crewId, metric).map((m) => m.value);
  const mean = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length;
  const onDays = (crewId: string, metric: MetricId, from: number, to: number) =>
    series(crewId, metric)
      .filter((m) => {
        const d = missionDayOf(out, m.timestamp);
        return d >= from && d <= to && !m.id.includes('-pm-');
      })
      .map((m) => m.value);
  const bandStatus = (metric: MetricId, v: number): Status => {
    const shift = ENVIRONMENTS.iss.thresholdModifiers[metric]?.shift ?? 0;
    const band = THRESHOLDS[metric].bands.find(
      (b) => v >= (b.min ?? -Infinity) + shift && v < (b.max ?? Infinity) + shift,
    );
    return band?.status ?? 'nominal';
  };
  const latestStatuses = (crewId: string) => {
    const metrics = [...new Set(out.filter((m) => m.crewId === crewId).map((m) => m.metric))];
    return metrics
      .filter((m) => m !== 'radiationDose') // cumulative rule, checked by the engine
      .map((metric) => {
        const v = values(crewId, metric).at(-1) ?? 0;
        return { metric, v, status: bandStatus(metric, v) };
      });
  };
  const baseline = (i: number) => DEMO_CREW[i]?.baseline ?? {};

  it('crew-1 Mira: nominal — every latest value in its nominal band, means near baseline', () => {
    latestStatuses('crew-1').forEach((r) => expect(r.status, `${r.metric}=${r.v}`).toBe('nominal'));
    expect(mean(values('crew-1', 'sleepHours'))).toBeCloseTo(baseline(0).sleepHours ?? 0, 0);
    expect(
      Math.abs(mean(onDays('crew-1', 'systolicBP', 1, 30)) - (baseline(0).systolicBP ?? 0)),
    ).toBeLessThan(3);
  });

  it('crew-2 Kenji: warning — early signs first, then fever ≥ 38 °C', () => {
    const last = DEMO_DEFAULTS.days;
    const preFrom = last - MIXED.kenjiPrecursorDays + 1; // mission days with early signs only
    const hrBase = mean(onDays('crew-2', 'heartRate', 1, preFrom - 1));
    expect(mean(onDays('crew-2', 'heartRate', preFrom, preFrom + 1)) - hrBase).toBeGreaterThan(3);
    onDays('crew-2', 'bodyTemp', preFrom, preFrom + 1).forEach((v) => expect(v).toBeLessThan(37.8));
    expect(values('crew-2', 'bodyTemp').at(-1)).toBeGreaterThanOrEqual(38);
    expect(bandStatus('bodyTemp', values('crew-2', 'bodyTemp').at(-1) ?? 0)).toBe('warning');
  });

  it('crew-3 Selin: caution — slow sleep/mood decline, no single warning-band value', () => {
    const sleepLast7 = mean(onDays('crew-3', 'sleepHours', 24, 30));
    expect(sleepLast7).toBeLessThan(7); // caution band 6–7
    expect(sleepLast7).toBeGreaterThanOrEqual(6.5); // above the "3 days < 6.5" sustained warning
    const moodFirst = mean(onDays('crew-3', 'mood', 1, 9));
    const moodLast = mean(onDays('crew-3', 'mood', 24, 30));
    expect(moodFirst - moodLast).toBeGreaterThan(0.8);
    const latest = latestStatuses('crew-3');
    expect(latest.some((r) => r.status === 'caution')).toBe(true);
    expect(latest.some((r) => r.status === 'warning')).toBe(false);
  });

  it('crew-4 Lucas: advisory — systolic ~ +9 over personal baseline, still in the nominal band', () => {
    const before = mean(onDays('crew-4', 'systolicBP', 1, 30 - MIXED.lucasDriftDays));
    const drift = mean(onDays('crew-4', 'systolicBP', 30 - MIXED.lucasDriftDays + 1, 30));
    expect(drift - before).toBeGreaterThan(6);
    expect(drift - before).toBeLessThan(12);
    const lowDays = onDays('crew-4', 'exerciseMinutes', 24, 30).filter((v) => v < 120);
    expect(lowDays).toHaveLength(4);
    lowDays.forEach((v) => expect(v).toBeGreaterThanOrEqual(60));
    latestStatuses('crew-4').forEach((r) => expect(r.status, `${r.metric}=${r.v}`).toBe('nominal'));
  });
});
