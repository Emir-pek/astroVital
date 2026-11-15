import { clsx } from 'clsx';
import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import { useEffect, useId, type ReactNode } from 'react';
import { BOX } from './box';

export interface ModalProps {
  open: boolean;
  onClose: () => void;
  /** Already-translated title. */
  title: string;
  /** Accessible label for the close button (translated). */
  closeLabel: string;
  children?: ReactNode;
  footer?: ReactNode;
}

/** Accessible modal dialog (Escape closes, backdrop click closes, labelled by title). */
export function Modal({ open, onClose, title, closeLabel, children, footer }: ModalProps) {
  const titleId = useId();

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-panel"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            className={clsx(BOX.panel, 'w-full max-w-xl')}
            initial={{ scale: 0.95, y: 10 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.95, y: 10 }}
            onClick={(e) => e.stopPropagation()}
          >
            <header className="mb-4 flex items-center justify-between gap-touch-gap">
              <h2 id={titleId} className="text-headline font-semibold text-text">
                {title}
              </h2>
              <button
                type="button"
                aria-label={closeLabel}
                onClick={onClose}
                className="inline-flex size-touch shrink-0 items-center justify-center rounded-button bg-raised text-text"
              >
                <X aria-hidden="true" className="size-8" />
              </button>
            </header>
            <div className="text-body text-text-2">{children}</div>
            {footer && (
              <footer className="mt-6 flex flex-wrap justify-end gap-touch-gap">{footer}</footer>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
