/** Pure geometry for the half-circle gauge. Angles are degrees: 180 = left (min), 0 = right (max). */

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
