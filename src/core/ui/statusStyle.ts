import { CircleCheck, OctagonAlert, TriangleAlert, type LucideIcon } from 'lucide-react';
import type { Status } from '@core/types';

/** Colour + icon per status — colour is never the only cue (colour-blind safe). */
export const STATUS_STYLE: Record<Status, { icon: LucideIcon; className: string }> = {
  green: { icon: CircleCheck, className: 'text-ok border-ok/40 bg-ok/10' },
  yellow: { icon: TriangleAlert, className: 'text-warn border-warn/40 bg-warn/10' },
  red: { icon: OctagonAlert, className: 'text-crit border-crit/50 bg-crit/10' },
};
