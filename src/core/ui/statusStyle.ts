import { CircleCheck, Info, OctagonAlert, TriangleAlert, type LucideIcon } from 'lucide-react';
import type { Status } from '@core/types';

/** Colour + icon per status — colour is never the only cue (colour-blind safe). */
export const STATUS_STYLE: Record<Status, { icon: LucideIcon; className: string }> = {
  nominal: { icon: CircleCheck, className: 'text-ok border-ok/40 bg-ok/10' },
  // TODO(Task 3): switch to the blue advisory token once tokens land.
  advisory: { icon: Info, className: 'text-accent border-accent/40 bg-accent/10' },
  caution: { icon: TriangleAlert, className: 'text-warn border-warn/40 bg-warn/10' },
  warning: { icon: OctagonAlert, className: 'text-crit border-crit/50 bg-crit/10' },
};
