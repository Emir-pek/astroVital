import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import type { TaskCompletion } from '../services/reminderEngine';

/** A daily health mission ticked by hand (hydration, lights out on time, crew chat, learn). */
export interface DailyMissionCompletion {
  crewId: string;
  missionId: string;
  /** UTC mission day (1-based). */
  missionDay: number;
  at: string;
}

export interface RoutineState {
  /** Manual completions of tasks without a metric (weekly summary, monthly exam, …). */
  completions: TaskCompletion[];
  /** Reminder ids already announced (toast / browser notification), per crew member. */
  notifiedIds: Record<string, string[]>;
  dailyMissionCompletions: DailyMissionCompletion[];
  /** User opted in to browser notifications (in-app toasts are always on). Default false. */
  notificationsEnabled: boolean;
  /** Companion speech bubble open (true) or collapsed to the avatar (false). Default false. */
  companionOpen: boolean;
  /**
   * `demoLoadedAt` of the demo whose manual completions were generated (`DemoRoutineSync`); null =
   * none yet. Lets the sync run exactly once per demo load and never over imported data.
   */
  demoCompletionsFor: string | null;

  /** Adds a completion unless the same crew/template/day already has one at the same time. */
  addCompletion: (c: TaskCompletion) => void;
  /** Ticks a daily mission once per crew member and mission day. Returns false if already ticked. */
  completeDailyMission: (c: DailyMissionCompletion) => boolean;
  markNotified: (crewId: string, ids: readonly string[]) => void;
  setNotificationsEnabled: (enabled: boolean) => void;
  setCompanionOpen: (open: boolean) => void;
  /** Replaces all manual completions with a demo's generated ones (demo (re)load). */
  setDemoCompletions: (forDemo: string, completions: TaskCompletion[]) => void;
  resetRoutine: () => void;
}

/** Notified ids kept per crew member (oldest dropped) — enough for several days of reminders. */
export const NOTIFIED_KEEP = 300;

export const ROUTINE_STORE_KEY = 'astrovital:routine';

const initial = () => ({
  completions: [] as TaskCompletion[],
  notifiedIds: {} as Record<string, string[]>,
  dailyMissionCompletions: [] as DailyMissionCompletion[],
  notificationsEnabled: false,
  companionOpen: false,
  demoCompletionsFor: null as string | null,
});

/**
 * Persisted schema version. 1 → 2: `companionOpen` (default false). 2 → 3: `demoCompletionsFor`
 * (default null → the current demo gets its manual completions once).
 */
export const ROUTINE_STORE_VERSION = 3;

/** Upgrades persisted routine state. PURE; unknown shapes pass through. */
export const migrateRoutineState = (persisted: unknown, version: number): unknown => {
  if (typeof persisted !== 'object' || persisted === null) return persisted;
  let state: Record<string, unknown> = { ...persisted };
  if (version < 2) state = { ...state, companionOpen: false };
  if (version < 3) state = { ...state, demoCompletionsFor: null };
  return state;
};

/**
 * Module-local persisted state of @modules/routine (ADR-005). Holds only adherence facts
 * (what was done, when) — never health values. XP and streaks are DERIVED, not stored (ADR-050).
 */
export const useRoutineStore = create<RoutineState>()(
  persist(
    (set, get) => ({
      ...initial(),

      addCompletion: (c) =>
        set((s) =>
          s.completions.some(
            (x) =>
              x.crewId === c.crewId &&
              x.templateId === c.templateId &&
              x.missionDay === c.missionDay &&
              x.at === c.at,
          )
            ? s
            : { completions: [...s.completions, c] },
        ),

      completeDailyMission: (c) => {
        const exists = get().dailyMissionCompletions.some(
          (x) =>
            x.crewId === c.crewId && x.missionId === c.missionId && x.missionDay === c.missionDay,
        );
        if (exists) return false;
        set((s) => ({ dailyMissionCompletions: [...s.dailyMissionCompletions, c] }));
        return true;
      },

      markNotified: (crewId, ids) =>
        set((s) => {
          const prev = s.notifiedIds[crewId] ?? [];
          const fresh = ids.filter((id) => !prev.includes(id));
          if (fresh.length === 0) return s;
          return {
            notifiedIds: { ...s.notifiedIds, [crewId]: [...prev, ...fresh].slice(-NOTIFIED_KEEP) },
          };
        }),

      setNotificationsEnabled: (enabled) => set({ notificationsEnabled: enabled }),

      setCompanionOpen: (open) => set({ companionOpen: open }),

      setDemoCompletions: (forDemo, completions) =>
        set({ completions, demoCompletionsFor: forDemo }),

      resetRoutine: () => set(initial()),
    }),
    {
      name: ROUTINE_STORE_KEY,
      version: ROUTINE_STORE_VERSION,
      storage: createJSONStorage(() => localStorage),
      migrate: migrateRoutineState,
      partialize: (s) => ({
        completions: s.completions,
        notifiedIds: s.notifiedIds,
        dailyMissionCompletions: s.dailyMissionCompletions,
        notificationsEnabled: s.notificationsEnabled,
        companionOpen: s.companionOpen,
        demoCompletionsFor: s.demoCompletionsFor,
      }),
    },
  ),
);
