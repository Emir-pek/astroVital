import type { Mission } from '@core/types';
import { levelForXp } from '../services/levels';

export interface GamificationApi {
  xp: number;
  level: number;
  streakDays: number;
  badges: string[];
  missions: Mission[];
  /** 0–100, adherence of the whole crew. */
  teamScore: number;
  completeMission: (missionId: string) => void;
}

/**
 * STUB — empty state.
 * TODO(Engineer 1, P1): module-local persisted zustand store ('astrovital:routine'),
 * daily missions (exercise, hydration, sleep hygiene, crew chat, measurement adherence),
 * streaks, badges, team score. RULE: reward adherence, never "good values".
 */
export function useGamification(): GamificationApi {
  const xp = 0;
  return {
    xp,
    level: levelForXp(xp),
    streakDays: 0,
    badges: [],
    missions: [],
    teamScore: 0,
    completeMission: () => undefined,
  };
}
