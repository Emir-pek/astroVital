import { Drawer } from '@base-ui/react/drawer';
import { X } from 'lucide-react';
import type { ReactNode } from 'react';

export interface SheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  closeLabel: string;
  children: ReactNode;
}

/**
 * Right-hand side sheet (480 px). Closes with the close button, the backdrop, Escape or a
 * swipe to the right (glove-friendly). Motion lives in tokens.css (.av-sheet*).
 */
export function Sheet({ open, onOpenChange, title, closeLabel, children }: SheetProps) {
  return (
    <Drawer.Root open={open} onOpenChange={(next) => onOpenChange(next)} swipeDirection="right">
      <Drawer.Portal>
        <Drawer.Backdrop className="av-sheet-overlay fixed inset-0 z-40 bg-black/60" />
        <Drawer.Viewport className="fixed inset-0 z-50 flex justify-end">
          <Drawer.Popup className="av-sheet h-full w-[480px] max-w-full overflow-y-auto overscroll-contain bg-surface p-6 shadow-soft outline-none">
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
