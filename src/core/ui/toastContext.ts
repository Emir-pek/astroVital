import { createContext, useContext } from 'react';
import type { Status } from '@core/types';

export interface ToastInput {
  /** Already-translated message. */
  message: string;
  tone?: Status | 'info';
  /** ms; default 4000. */
  durationMs?: number;
}

export interface ToastApi {
  show: (toast: ToastInput) => void;
}

export const ToastContext = createContext<ToastApi | null>(null);

/** In-app toast notifications (requires <ToastProvider> — mounted by the app shell). */
export const useToast = (): ToastApi => {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used inside <ToastProvider>');
  return ctx;
};
