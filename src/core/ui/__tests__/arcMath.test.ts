import { describe, expect, it } from 'vitest';
import { arcPath, valueToAngle } from '../arcMath';

describe('valueToAngle', () => {
  it('maps min to 180 and max to 0, clamping out-of-range values', () => {
    expect(valueToAngle(0, 0, 100)).toBe(180);
    expect(valueToAngle(100, 0, 100)).toBe(0);
    expect(valueToAngle(50, 0, 100)).toBe(90);
    expect(valueToAngle(-5, 0, 100)).toBe(180);
    expect(valueToAngle(500, 0, 100)).toBe(0);
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
