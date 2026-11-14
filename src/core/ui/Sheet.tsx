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
        <Dialog.Overlay className="fixed inset-0 z-40 bg-black/60 transition-opacity duration-300 ease-out data-[state=closed]:opacity-0 data-[state=open]:opacity-100" />
        <Dialog.Content
          aria-describedby={undefined}
          className="fixed right-0 top-0 z-50 flex h-full w-[480px] max-w-full translate-x-full flex-col gap-touch-gap overflow-y-auto bg-surface p-6 opacity-0 shadow-soft transition-[transform,opacity] duration-300 ease-out data-[state=open]:translate-x-0 data-[state=open]:opacity-100"
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
