import { describe, expect, it } from 'vitest';
import { THRESHOLDS } from '@core/config/thresholds.config';
import { ENVIRONMENTS } from '@core/config/environments.config';
import type { ThresholdBand } from '@core/types';
import { applyModifier, applyModifierToBands, findBand, nominalCentre } from '../bands';

describe('applyModifier', () => {
  it('returns the boundary unchanged with no modifier', () => {
    expect(applyModifier(38, undefined, 36.8)).toBe(38);
  });

  it('leaves open-ended (undefined) boundaries untouched', () => {
    expect(applyModifier(undefined, { shift: 0.3 }, 36.8)).toBeUndefined();
  });

  it('shifts every boundary by the same amount regardless of side', () => {
    expect(applyModifier(36.1, { shift: 0.3 }, 36.8)).toBeCloseTo(36.4);
    expect(applyModifier(37.5, { shift: 0.3 }, 36.8)).toBeCloseTo(37.8);
  });

  it('negative widen narrows the band: boundaries move toward the centre', () => {
    // centre 16.5 (respRate nominal 12–21), rover's `widen: -1` (stricter SpO₂/resp cabin rule).
    expect(applyModifier(12, { widen: -1 }, 16.5)).toBe(13);
    expect(applyModifier(21, { widen: -1 }, 16.5)).toBe(20);
  });

  it('combines shift and widen additively', () => {
    expect(applyModifier(10, { shift: 2, widen: 1 }, 20)).toBe(11); // below centre: 10+2-1
    expect(applyModifier(30, { shift: 2, widen: 1 }, 20)).toBe(33); // above centre: 30+2+1
  });
});

describe('nominalCentre', () => {
  it('is the midpoint when both bounds are finite', () => {
    expect(nominalCentre(THRESHOLDS.bodyTemp.bands)).toBeCloseTo(36.8);
  });

  it('falls back to the single finite bound of an open-ended nominal band', () => {
    expect(nominalCentre(THRESHOLDS.spo2.bands)).toBe(95);
  });
});

describe('applyModifierToBands', () => {
  it('shifts the bodyTemp bands the way ISS does (+0.3 °C)', () => {
    const shifted = applyModifierToBands(
      THRESHOLDS.bodyTemp.bands,
      ENVIRONMENTS.iss.thresholdModifiers.bodyTemp,
    );
    const warning = shifted.find((b) => b.messageKey === 'thresholds.criticalHigh')!;
    expect(warning.min).toBeCloseTo(38.3);
    expect(warning.max).toBeCloseTo(39.8);
    const nominal = shifted.find((b) => b.status === 'nominal')!;
    expect(nominal.min).toBeCloseTo(36.4);
    expect(nominal.max).toBeCloseTo(37.8);
  });

  it('returns the same bands unchanged when there is no modifier for the metric', () => {
    const bands = applyModifierToBands(THRESHOLDS.heartRate.bands, undefined);
    expect(bands).toBe(THRESHOLDS.heartRate.bands);
  });
});

describe('findBand', () => {
  const bands: ThresholdBand[] = [
    { max: 10, status: 'warning', escalation: 'flight_surgeon', messageKey: 'a' },
    { min: 10, max: 20, status: 'nominal', escalation: 'self_care', messageKey: 'b' },
    { min: 20, status: 'warning', escalation: 'crew_medical_officer', messageKey: 'c' },
  ];

  it('matches the half-open interval [min, max)', () => {
    expect(findBand(10, bands).messageKey).toBe('b'); // lower bound inclusive
    expect(findBand(19.99, bands).messageKey).toBe('b');
    expect(findBand(20, bands).messageKey).toBe('c'); // upper bound exclusive on the lower band
  });

  it('matches an open lower bound below -Infinity', () => {
    expect(findBand(-1000, bands).messageKey).toBe('a');
  });

  it('matches an open upper bound above +Infinity', () => {
    expect(findBand(1_000_000, bands).messageKey).toBe('c');
  });

  it('reproduces the reported bug: 38.5 °C on ISS is warning, not nominal', () => {
    const shifted = applyModifierToBands(
      THRESHOLDS.bodyTemp.bands,
      ENVIRONMENTS.iss.thresholdModifiers.bodyTemp,
    );
    const band = findBand(38.5, shifted);
    expect(band.status).toBe('warning');
    expect(band.escalation).toBe('crew_medical_officer');
  });

  it('37.6 °C on ISS stays nominal because of the +0.3 shift', () => {
    const shifted = applyModifierToBands(
      THRESHOLDS.bodyTemp.bands,
      ENVIRONMENTS.iss.thresholdModifiers.bodyTemp,
    );
    expect(findBand(37.6, shifted).status).toBe('nominal');
  });

  it('37.6 °C with no environment shift (e.g. rover) is caution', () => {
    expect(findBand(37.6, THRESHOLDS.bodyTemp.bands).status).toBe('caution');
  });
});

describe('every metric: both boundaries of every band round-trip through findBand', () => {
  for (const [metric, threshold] of Object.entries(THRESHOLDS)) {
    it(`${metric}: each band is reachable at its lower bound`, () => {
      for (const band of threshold.bands) {
        const probe = band.min ?? (band.max ?? 0) - 1;
        expect(findBand(probe, threshold.bands)).toBe(band);
      }
    });
  }
});
