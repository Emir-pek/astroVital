/**
 * @modules/routine — PUBLIC API (the only file other modules may import).
 * Owner: Engineer 1. Contract: docs/CONTRACTS.md § routine.
 * Allowed deps: @core/*, @modules/assessment.
 */
export { ReminderCenter, type ReminderCenterProps } from './components/ReminderCenter';
export { MissionBoard } from './components/MissionBoard';
export { MetClock } from './components/MetClock';
export {
  useReminders,
  type ReminderInstance,
  type RemindersApi,
  type ReminderStatus,
} from './hooks/useReminders';
export { useGamification, type GamificationApi } from './hooks/useGamification';
export { levelForXp, levelProgress, XP_PER_LEVEL } from './services/levels';
