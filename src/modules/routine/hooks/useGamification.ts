import { useCallback, useMemo } from 'react';
import { useNow } from '@core/hooks';
import { useActiveEnvironment, useHealthStore } from '@core/store';
import type { Mission } from '@core/types';
import {
  computeBadges,
  computeTeamScore,
  computeXp,
  currentStreak,
  DAILY_MISSION_IDS,
  dailyMissionsFor,
  longestStreak,
  type BadgeId,
} from '../services/gamification';
import { levelForXp, levelProgress } from '../services/levels';
import { currentMissionDay, expandRange, groupByCrew } from '../services/reminderEngine';
import { useRoutineStore } from '../store/useRoutineStore';
import { REMINDER_TICK_MS } from './useReminders';

export interface GamificationApi {
  /** Crew member the personal numbers belong to (argument, else the signed-in astronaut). */
  crewId: string | null;
  xp: number;
  level: number;
  /** 0–1 inside the current level. */
  levelProgress: number;
  streakDays: number;
  longestStreak: number;
  badges: BadgeId[];
  /** Badges first earned today (for a celebration). */
  newBadgesToday: BadgeId[];
  /** UTC mission day the numbers refer to. */
  today: number;
  /** Today's daily health missions (completedAt set when ticked). */
  missions: Mission[];
  /** 0–100, adherence of the whole crew over the last 7 mission days. Always the whole crew. */
  teamScore: number;
  /** Ticks today's daily mission for this crew member. False if unknown id or already ticked. */
  completeMission: (missionId: string) => boolean;
}

/**
 * Gamification of one crew member (ADR-050). XP, streak and badges are DERIVED from the reminder
 * history (+ daily mission ticks) — never from a measurement value.
 */
export function useGamification(crewId?: string): GamificationApi {
  const now = useNow(REMINDER_TICK_MS);
  const selectedCrewId = useHealthStore((s) => s.selectedCrewId);
  const measurements = useHealthStore((s) => s.measurements);
  const crew = useHealthStore((s) => s.crew);
  const missionStart = useHealthStore((s) => s.settings.missionStart);
  const env = useActiveEnvironment();
  const completions = useRoutineStore((s) => s.completions);
  const allTicks = useRoutineStore((s) => s.dailyMissionCompletions);
  const completeDailyMission = useRoutineStore((s) => s.completeDailyMission);

  const targetId = crewId ?? selectedCrewId;
  const today = currentMissionDay(missionStart, now);

  const history = useMemo(
    () =>
      expandRange(
        { schedule: env.reminderSchedule, missionStart, now, measurements, crew, completions },
        1,
        today,
      ),
    [env, missionStart, now, measurements, crew, completions, today],
  );

  const personal = useMemo(() => {
    const mine = targetId ? (groupByCrew(history)[targetId] ?? []) : [];
    const ticks = allTicks.filter((t) => t.crewId === targetId);
    const xp = computeXp(mine, ticks);
    const badges = computeBadges(mine, ticks, today);
    const before = computeBadges(
      mine.filter((r) => r.missionDay < today),
      ticks.filter((t) => t.missionDay < today),
      today - 1,
    );
    return {
      xp,
      level: levelForXp(xp),
      levelProgress: levelProgress(xp),
      streakDays: currentStreak(mine, today),
      longestStreak: longestStreak(mine, today),
      badges,
      newBadgesToday: badges.filter((b) => !before.includes(b)),
      missions: dailyMissionsFor(ticks, today),
    };
  }, [history, allTicks, targetId, today]);

  const teamScore = useMemo(() => computeTeamScore(history, today), [history, today]);

  const completeMission = useCallback(
    (missionId: string): boolean => {
      if (!targetId || today < 1 || !DAILY_MISSION_IDS.includes(missionId)) return false;
      return completeDailyMission({
        crewId: targetId,
        missionId,
        missionDay: today,
        at: new Date().toISOString(), // event time of the click
      });
    },
    [targetId, today, completeDailyMission],
  );

  return { crewId: targetId, today, ...personal, teamScore, completeMission };
}
