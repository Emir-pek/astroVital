import type { Status } from '@core/types';

/** Pure geometry for the half-circle gauge. Angles are degrees: 180 = left (min), 0 = right (max). */

/** One stretch of the scale with the status a value inside it falls into. */
export interface GaugeSegment {
  from: number;
  to: number;
  status: Status;
}

/**
 * Splits min..max into consecutive segments: the given (non-nominal) threshold bands, clipped to
 * the scale, and nominal segments for every gap between them.
 */
export function gaugeSegments(
  min: number,
  max: number,
  bands: ReadonlyArray<{ from: number; to: number; status: Exclude<Status, 'nominal'> }>,
): GaugeSegment[] {
  if (max <= min) return [];
  const clipped = bands
    .map((b) => ({ from: Math.max(min, b.from), to: Math.min(max, b.to), status: b.status }))
    .filter((b) => b.from < b.to)
    .sort((a, b) => a.from - b.from);
  const out: GaugeSegment[] = [];
  let cursor = min;
  for (const b of clipped) {
    if (b.from > cursor) out.push({ from: cursor, to: b.from, status: 'nominal' });
    const from = Math.max(cursor, b.from);
    if (b.to > from) out.push({ from, to: b.to, status: b.status });
    cursor = Math.max(cursor, b.to);
  }
  if (cursor < max) out.push({ from: cursor, to: max, status: 'nominal' });
  return out;
}

/**
 * Index of the segment a value falls into (lower bound inclusive, so a value on a threshold
 * belongs to the band above it); values off the scale count as the end segments.
 */
export function segmentIndexAt(segments: readonly GaugeSegment[], value: number): number {
  if (segments.length === 0) return -1;
  const index = segments.findIndex((s) => value < s.to);
  return index === -1 ? segments.length - 1 : index;
}

/** Maps a value onto 180..0 degrees; out-of-range values are clamped. */
export function valueToAngle(value: number, min: number, max: number): number {
  if (max <= min) return 180;
  const t = Math.min(1, Math.max(0, (value - min) / (max - min)));
  return 180 - t * 180;
}

const round = (n: number): number => Math.round(n * 100) / 100 + 0;

/** Point on the circle; angle measured counter-clockwise from the +x axis, SVG y points down. */
export function polarPoint(
  cx: number,
  cy: number,
  r: number,
  deg: number,
): { x: number; y: number } {
  const rad = (deg * Math.PI) / 180;
  return { x: round(cx + r * Math.cos(rad)), y: round(cy - r * Math.sin(rad)) };
}

/** SVG path `d` for an arc from `fromDeg` to `toDeg` (the gauge sweeps from the left over the top). */
export function arcPath(cx: number, cy: number, r: number, fromDeg: number, toDeg: number): string {
  const start = polarPoint(cx, cy, r, fromDeg);
  const end = polarPoint(cx, cy, r, toDeg);
  const largeArc = Math.abs(fromDeg - toDeg) > 180 ? 1 : 0;
  const sweep = toDeg < fromDeg ? 1 : 0;
  return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArc} ${sweep} ${end.x} ${end.y}`;
}
