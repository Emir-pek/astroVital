import {
  CircleCheck,
  CircleDashed,
  Clock,
  Info,
  OctagonAlert,
  TriangleAlert,
  type LucideIcon,
} from 'lucide-react';
import type { Status } from '@core/types';

/** A status plus the two non-assessment display states (stale data, no data). */
export type DisplayStatus = Status | 'stale' | 'none';

/** Icon + text colour per status — colour is never the only cue (colour-blind safe). */
export const STATUS_STYLE: Record<DisplayStatus, { icon: LucideIcon; textClass: string }> = {
  nominal: { icon: CircleCheck, textClass: 'text-nominal' },
  advisory: { icon: Info, textClass: 'text-advisory' },
  caution: { icon: TriangleAlert, textClass: 'text-caution' },
  warning: { icon: OctagonAlert, textClass: 'text-warning' },
  stale: { icon: Clock, textClass: 'text-text-3' },
  none: { icon: CircleDashed, textClass: 'text-text-3' },
};

/** CSS variable per status, for SVG fills/strokes. */
export const STATUS_COLOR_VAR: Record<DisplayStatus, string> = {
  nominal: 'var(--av-status-nominal)',
  advisory: 'var(--av-status-advisory)',
  caution: 'var(--av-status-caution)',
  warning: 'var(--av-status-warning)',
  stale: 'var(--av-text-3)',
  none: 'var(--av-text-3)',
};
