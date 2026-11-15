import type { BodyRegionId } from '@core/types';
import type { DisplayStatus } from '@core/ui';

/*
 * Types shared by BodyMap and the lazily loaded 3D stage. Kept free of three.js so importing them
 * never pulls the 3D chunk into the main bundle.
 */

/** A region anchor projected to body-map container px. */
export interface ProjectedPoint {
  x: number;
  y: number;
  /** False when the anchor is behind the camera (off any sensible screen position). */
  inFront: boolean;
}

export type Projection = Record<BodyRegionId, ProjectedPoint>;
/** True where the anchor sits on the far side of the turned figure (its leader is dimmed). */
export type BehindMap = Record<BodyRegionId, boolean>;

export interface FitBox {
  width: number;
  height: number;
}

export interface AstronautStageProps {
  statuses: Record<BodyRegionId, DisplayStatus>;
  selected: BodyRegionId | null;
  /** Size (CSS px) of the figure box the whole figure must fit in, centred in the stage. */
  fit: FitBox;
  /** A tap on the figure selected this region. */
  onSelect: (id: BodyRegionId) => void;
  /** A tap beside the figure (nothing hit). */
  onBackgroundTap: () => void;
  /** Called after every rendered frame with the anchors in container px. */
  onProject: (points: Projection, behind: BehindMap) => void;
  /** WebGL failed or its context was lost: the parent falls back to the SVG figure. */
  onContextLost: () => void;
}
