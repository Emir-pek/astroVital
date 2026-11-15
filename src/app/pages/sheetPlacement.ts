import type { SheetBounds } from '@core/ui';

export interface SheetPlace {
  width: number;
  bounds: SheetBounds;
}

/**
 * Sheet geometry that covers `rect` (a viewport rect, e.g. the Status page's right column)
 * exactly: same width, same top, bottom and right edges. Pure; the viewport size is a parameter.
 */
export function placeOver(
  rect: Pick<DOMRect, 'top' | 'bottom' | 'right' | 'width'>,
  viewport: { width: number; height: number },
): SheetPlace {
  return {
    width: Math.round(rect.width),
    bounds: {
      top: Math.round(rect.top),
      bottom: Math.max(0, Math.round(viewport.height - rect.bottom)),
      right: Math.max(0, Math.round(viewport.width - rect.right)),
    },
  };
}
