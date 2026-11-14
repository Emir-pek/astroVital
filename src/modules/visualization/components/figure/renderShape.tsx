import type { SVGProps } from 'react';
import type { Shape } from './geometry';

type Paint = Pick<
  SVGProps<SVGElement>,
  | 'fill'
  | 'fillOpacity'
  | 'stroke'
  | 'strokeWidth'
  | 'strokeOpacity'
  | 'strokeLinecap'
  | 'strokeLinejoin'
  | 'strokeDasharray'
  | 'opacity'
>;

/** Renders one geometry shape as the matching SVG element with the given paint. */
export function renderShape(shape: Shape, key: string, paint: Paint = {}) {
  switch (shape.kind) {
    case 'circle':
      return <circle key={key} cx={shape.cx} cy={shape.cy} r={shape.r} {...paint} />;
    case 'ellipse':
      return (
        <ellipse
          key={key}
          cx={shape.cx}
          cy={shape.cy}
          rx={shape.rx}
          ry={shape.ry}
          transform={shape.rotate ? `rotate(${shape.rotate} ${shape.cx} ${shape.cy})` : undefined}
          {...paint}
        />
      );
    case 'path':
      return <path key={key} d={shape.d} {...paint} />;
  }
}

/** A gradient stop whose colour is a CSS variable (set via style so var() always resolves). */
export function stop(at: number, color: string, opacity = 1) {
  return <stop key={at} offset={at} style={{ stopColor: color, stopOpacity: opacity }} />;
}

/** `var(--av-suit-<name>)` — suit illustration colours live in tokens.css. */
export const suit = (name: string): string => `var(--av-suit-${name})`;

/** Turns a React useId() value into a string that is safe inside url(#…). */
export const safeId = (raw: string): string => raw.replace(/[^a-zA-Z0-9_-]/g, '');
