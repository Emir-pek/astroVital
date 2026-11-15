import { Drawer } from '@base-ui/react/drawer';
import { clsx } from 'clsx';
import { X } from 'lucide-react';
import type { CSSProperties, ReactNode } from 'react';
import { BOX } from './box';

/** The default sheet width (px). */
export const SHEET_DEFAULT_WIDTH = 480;
/** Narrowest width a caller may ask for: the close button, title and body text still fit. */
export const SHEET_MIN_WIDTH = 360;

/** Where a sheet sits, as distances (CSS px) from the viewport's top, bottom and right edges. */
export interface SheetBounds {
  top: number;
  bottom: number;
  right: number;
}

export interface SheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  closeLabel: string;
  children: ReactNode;
  /**
   * Width in CSS px (default 480, never below 360, never wider than the viewport). A page can
   * size the sheet to a column it should cover, so the rest of the screen stays in view.
   */
  width?: number;
  /**
   * `dim` (default): a modal sheet — the page behind is darkened, focus stays in the sheet and a
   * tap outside closes it. `clear`: a non-modal sheet beside content the user just touched — the
   * page stays visible AND usable (focus is not trapped, taps outside reach the page and do not
   * close the sheet); it closes with its close button, Escape or a swipe to the right.
   */
  backdrop?: 'dim' | 'clear';
  /**
   * Default: full viewport height, flush with the right edge. With `bounds` the sheet becomes a
   * floating panel inside that box (e.g. below the top bar and above the disclaimer row, over one
   * column), so the app's chrome — the Emergency button above all — is never covered.
   */
  bounds?: SheetBounds;
}

/**
 * Right-hand side sheet, a Panel (box.ts). Closes with the close button, Escape or a swipe to the
 * right (glove-friendly), and with a tap on the dimmed backdrop. Motion lives in tokens.css
 * (.av-sheet*).
 */
export function Sheet({
  open,
  onOpenChange,
  title,
  closeLabel,
  children,
  width,
  backdrop = 'dim',
  bounds,
}: SheetProps) {
  const px = Math.max(SHEET_MIN_WIDTH, Math.round(width ?? SHEET_DEFAULT_WIDTH));
  const modal = backdrop === 'dim';
  const viewportStyle: CSSProperties = bounds
    ? { top: bounds.top, bottom: bounds.bottom, right: bounds.right, left: 'auto', width: px }
    : { inset: 0 };
  // The slide-out distance includes the gap to the screen edge, so a floating sheet leaves no sliver.
  const popupStyle = {
    width: bounds ? '100%' : px,
    '--av-sheet-offset': `${bounds?.right ?? 0}px`,
  } as CSSProperties;

  return (
    <Drawer.Root
      open={open}
      onOpenChange={(next) => onOpenChange(next)}
      swipeDirection="right"
      modal={modal}
      disablePointerDismissal={!modal}
    >
      <Drawer.Portal>
        {modal && (
          <Drawer.Backdrop
            data-backdrop="dim"
            className="av-sheet-overlay fixed inset-0 z-40 bg-black/60"
          />
        )}
        <Drawer.Viewport
          data-bounded={bounds ? '' : undefined}
          style={viewportStyle}
          className="fixed z-50 flex justify-end"
        >
          <Drawer.Popup
            data-backdrop={backdrop}
            style={popupStyle}
            className={clsx(
              BOX.panelFlush,
              'av-sheet h-full max-w-full overflow-y-auto overscroll-contain p-panel outline-none',
              // Docked to the screen edge: only the free (left) corners are rounded.
              !bounds && 'rounded-r-none',
            )}
          >
            <Drawer.Content className="flex flex-col gap-touch-gap">
              <header className="flex items-center justify-between gap-touch-gap">
                <Drawer.Title className="text-headline font-semibold">{title}</Drawer.Title>
                <Drawer.Close
                  aria-label={closeLabel}
                  className="inline-flex size-touch shrink-0 items-center justify-center rounded-button bg-raised text-text"
                >
                  <X aria-hidden="true" className="size-8" />
                </Drawer.Close>
              </header>
              <div className="text-body">{children}</div>
            </Drawer.Content>
          </Drawer.Popup>
        </Drawer.Viewport>
      </Drawer.Portal>
    </Drawer.Root>
  );
}
