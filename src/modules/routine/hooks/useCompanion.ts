import { useMemo } from 'react';
import { useHealthStore } from '@core/store';
import { useCrewHealth } from '@modules/assessment';
import { decideCompanion, type CompanionState } from '../services/companion';
import { useGamification } from './useGamification';
import { useReminders } from './useReminders';

/**
 * What the astronaut companion says right now (ADR-043). `crewId` defaults to the signed-in
 * astronaut. Only that person's own status, reminders and progress go in — the companion never
 * mentions another crew member. Visual (mood → look) belongs to visualization.
 */
export function useCompanion(crewId?: string): CompanionState {
  const selectedCrewId = useHealthStore((s) => s.selectedCrewId);
  const targetId = crewId ?? selectedCrewId ?? '';
  const health = useCrewHealth(targetId);
  const { reminders } = useReminders(targetId);
  const { streakDays, newBadgesToday, today } = useGamification(targetId);

  return useMemo(
    () =>
      decideCompanion({
        crewId: targetId,
        missionDay: today,
        overall: health.overall,
        reminders,
        streakDays,
        newBadges: newBadgesToday,
      }),
    [targetId, today, health.overall, reminders, streakDays, newBadgesToday],
  );
}
