import { describe, expect, it } from 'vitest';
import { ENVIRONMENTS } from '@core/config/environments.config';
import { METRICS } from '@core/config/metrics.config';
import { createRng, DEMO_CREW, generateHistory, mulberry32, SCENARIO_IDS } from '@core/simulation';
import type { GenerateHistoryOptions } from '@core/types';

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

  describe('slot times come from the environment schedule (ADR-036)', () => {
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

    it('ISS: wake 06:15, morning vitals + glucose 06:30, exercise 17:30, evening 19:30, mood 21:00', () => {
      const out = generateHistory(opts());
      within(out, 'sleepHours', 6 * 60 + 15, 10);
      ['systolicBP', 'diastolicBP', 'heartRate', 'spo2', 'respRate', 'bodyTemp'].forEach((m) =>
        within(out, m, 6 * 60 + 30, 15, AM),
      );
      within(out, 'bloodGlucose', 6 * 60 + 30, 10);
      within(out, 'exerciseMinutes', 17 * 60 + 30, 30);
      within(out, 'radiationDose', 19 * 60 + 30, 10);
      ['systolicBP', 'heartRate'].forEach((m) => within(out, m, 19 * 60 + 30, 30, PM));
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
});
