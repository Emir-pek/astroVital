import { describe, expect, it } from 'vitest';
import { arcPath, gaugeSegments, segmentIndexAt, valueToAngle } from '../arcMath';

describe('valueToAngle', () => {
  it('maps min to 180 and max to 0, clamping out-of-range values', () => {
    expect(valueToAngle(0, 0, 100)).toBe(180);
    expect(valueToAngle(100, 0, 100)).toBe(0);
    expect(valueToAngle(50, 0, 100)).toBe(90);
    expect(valueToAngle(-5, 0, 100)).toBe(180);
    expect(valueToAngle(500, 0, 100)).toBe(0);
  });

  it('U-06: a degenerate range (max <= min) is safe', () => {
    expect(valueToAngle(5, 10, 10)).toBe(180);
    expect(valueToAngle(5, 10, 0)).toBe(180);
  });
});

describe('arcPath', () => {
  it('builds an SVG arc between two angles', () => {
    const d = arcPath(60, 60, 52, 180, 0);
    expect(d.startsWith('M 8 60')).toBe(true);
    expect(d).toContain('A 52 52 0 0 1');
    expect(d.endsWith('112 60')).toBe(true);
  });
});

describe('gaugeSegments', () => {
  it('fills the gaps between threshold bands with nominal segments', () => {
    expect(
      gaugeSegments(30, 220, [
        { from: 0, to: 40, status: 'caution' },
        { from: 100, to: 130, status: 'caution' },
        { from: 130, to: 400, status: 'warning' },
      ]),
    ).toEqual([
      { from: 30, to: 40, status: 'caution' },
      { from: 40, to: 100, status: 'nominal' },
      { from: 100, to: 130, status: 'caution' },
      { from: 130, to: 220, status: 'warning' },
    ]);
  });

  it('is one nominal segment without bands and empty for a degenerate range', () => {
    expect(gaugeSegments(0, 10, [])).toEqual([{ from: 0, to: 10, status: 'nominal' }]);
    expect(gaugeSegments(10, 10, [])).toEqual([]);
  });

  it('drops bands outside the scale and tolerates overlaps', () => {
    expect(
      gaugeSegments(0, 10, [
        { from: 20, to: 30, status: 'warning' },
        { from: 6, to: 9, status: 'caution' },
        { from: 8, to: 12, status: 'warning' },
      ]),
    ).toEqual([
      { from: 0, to: 6, status: 'nominal' },
      { from: 6, to: 9, status: 'caution' },
      { from: 9, to: 10, status: 'warning' },
    ]);
  });
});

describe('segmentIndexAt', () => {
  const segments = gaugeSegments(0, 100, [{ from: 60, to: 100, status: 'caution' }]);

  it('finds the segment of a value; a threshold value belongs to the band above', () => {
    expect(segmentIndexAt(segments, 10)).toBe(0);
    expect(segmentIndexAt(segments, 60)).toBe(1);
    expect(segmentIndexAt(segments, 100)).toBe(1);
  });

  it('maps off-scale values to the end segments', () => {
    expect(segmentIndexAt(segments, -5)).toBe(0);
    expect(segmentIndexAt(segments, 500)).toBe(1);
    expect(segmentIndexAt([], 5)).toBe(-1);
  });
});
