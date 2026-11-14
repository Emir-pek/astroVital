import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { SNOOZE_MS, type AlertAckState } from '../services/alertQueue';

interface AlertAckStore extends AlertAckState {
  acknowledge: (key: string, now: Date) => void;
  snooze: (key: string, now: Date) => void;
  reset: () => void;
}

export const useAlertAckStore = create<AlertAckStore>()(
  persist(
    (set) => ({
      acknowledged: {},
      snoozedUntil: {},
      acknowledge: (key, now) =>
        set((s) => ({ acknowledged: { ...s.acknowledged, [key]: now.toISOString() } })),
      snooze: (key, now) =>
        set((s) => ({
          snoozedUntil: {
            ...s.snoozedUntil,
            [key]: new Date(now.getTime() + SNOOZE_MS).toISOString(),
          },
        })),
      reset: () => set({ acknowledged: {}, snoozedUntil: {} }),
    }),
    {
      name: 'astrovital:alerts',
      version: 1,
      storage: createJSONStorage(() => localStorage),
    },
  ),
);
