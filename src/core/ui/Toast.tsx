import { clsx } from 'clsx';
import { AnimatePresence, motion } from 'framer-motion';
import { useCallback, useMemo, useRef, useState, type ReactNode } from 'react';
import { ToastContext, type ToastApi, type ToastInput } from './toastContext';

interface ActiveToast extends Required<Omit<ToastInput, 'durationMs'>> {
  id: number;
}

const TONE: Record<ActiveToast['tone'], string> = {
  info: 'border-accent/50',
  nominal: 'border-ok/60',
  advisory: 'border-accent/60',
  caution: 'border-warn/60',
  warning: 'border-crit/70',
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
        className="pointer-events-none fixed right-4 bottom-4 z-50 flex w-80 flex-col gap-2"
      >
        <AnimatePresence>
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 40 }}
              className={clsx(
                'pointer-events-auto rounded-lg border-l-4 bg-surface-2 p-3 text-sm shadow-xl',
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
