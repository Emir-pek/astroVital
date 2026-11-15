import { clsx } from 'clsx';
import { AnimatePresence, motion } from 'framer-motion';
import { useCallback, useMemo, useRef, useState, type ReactNode } from 'react';
import { BOX } from './box';
import { ToastContext, type ToastApi, type ToastInput } from './toastContext';

interface ActiveToast extends Required<Omit<ToastInput, 'durationMs'>> {
  id: number;
}

const TONE: Record<ActiveToast['tone'], string> = {
  info: 'border-line',
  nominal: 'border-nominal',
  advisory: 'border-advisory',
  caution: 'border-caution',
  warning: 'border-warning',
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ActiveToast[]>([]);
  const nextId = useRef(1);

  const show = useCallback(({ message, tone = 'info', durationMs = 4000 }: ToastInput) => {
    const id = nextId.current++;
    setToasts((t) => [...t, { id, message, tone }]);
    window.setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), durationMs);
  }, []);

  const api = useMemo<ToastApi>(() => ({ show }), [show]);

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div
        role="status"
        aria-live="polite"
        // Above the always-visible disclaimer row, aligned with the page's right gutter.
        className="pointer-events-none fixed right-panel bottom-16 z-50 flex w-96 flex-col gap-touch-gap"
      >
        <AnimatePresence>
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 40 }}
              className={clsx(
                BOX.panel,
                'pointer-events-auto border-2 text-body text-text',
                TONE[toast.tone],
              )}
            >
              {toast.message}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}
