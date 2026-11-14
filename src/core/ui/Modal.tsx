import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import { useEffect, useId, type ReactNode } from 'react';

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
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            className="w-full max-w-md rounded-card border border-border bg-surface p-5"
            initial={{ scale: 0.95, y: 10 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.95, y: 10 }}
            onClick={(e) => e.stopPropagation()}
          >
            <header className="mb-3 flex items-start justify-between gap-4">
              <h2 id={titleId} className="text-lg font-semibold">
                {title}
              </h2>
              <button
                type="button"
                aria-label={closeLabel}
                onClick={onClose}
                className="rounded p-1 text-muted hover:text-text"
              >
                <X aria-hidden="true" className="size-5" />
              </button>
            </header>
            <div className="text-sm text-muted">{children}</div>
            {footer && <footer className="mt-5 flex justify-end gap-2">{footer}</footer>}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
