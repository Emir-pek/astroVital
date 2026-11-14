import { X } from 'lucide-react';
import { Dialog } from 'radix-ui';
import type { ReactNode } from 'react';

export interface SheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  closeLabel: string;
  children: ReactNode;
}

/** Right-hand side sheet (480 px). Slides in with a 300 ms opacity + transform transition. */
export function Sheet({ open, onOpenChange, title, closeLabel, children }: SheetProps) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="av-sheet-overlay fixed inset-0 z-40 bg-black/60 data-[state=open]:animate-[av-fade-in_300ms_ease-out] data-[state=closed]:animate-[av-fade-out_300ms_ease-out]" />
        <Dialog.Content
          aria-describedby={undefined}
          className="av-sheet fixed right-0 top-0 z-50 flex h-full w-[480px] max-w-full flex-col gap-touch-gap overflow-y-auto bg-surface p-6 shadow-soft data-[state=open]:animate-[av-sheet-in_300ms_ease-out] data-[state=closed]:animate-[av-sheet-out_300ms_ease-out]"
        >
          <header className="flex items-center justify-between gap-touch-gap">
            <Dialog.Title className="text-headline font-semibold">{title}</Dialog.Title>
            <Dialog.Close
              aria-label={closeLabel}
              className="inline-flex size-touch shrink-0 items-center justify-center rounded-button bg-raised text-text focus-visible:outline-2 focus-visible:outline-focus"
            >
              <X aria-hidden="true" className="size-8" />
            </Dialog.Close>
          </header>
          <div className="text-body">{children}</div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
