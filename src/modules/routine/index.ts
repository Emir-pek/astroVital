/**
 * @modules/routine — PUBLIC API (the only file other modules may import).
 * Owner: Engineer 1. Contract: docs/CONTRACTS.md § routine.
 * Allowed deps: @core/*, @modules/assessment.
 */
export {
  ReminderCenter,
  REMINDER_STATUS_ICON,
  type ReminderCenterProps,
} from './components/ReminderCenter';
export { ReminderNotifier } from './components/ReminderNotifier';
export {
  useNotificationSettings,
  type NotificationSettingsApi,
} from './hooks/useNotificationSettings';
export {
  notificationPermission,
  requestNotificationPermission,
  type NotificationPermissionState,
} from './services/notifications';
export { MissionBoard, type MissionBoardProps } from './components/MissionBoard';
export {
  BADGE_IDS,
  DAILY_MISSIONS,
  DAILY_MISSION_XP,
  TEAM_SCORE_DAYS,
  XP_BY_STATUS,
  computeBadges,
  computeTeamScore,
  computeXp,
  currentStreak,
  longestStreak,
  type BadgeId,
  type MissionTick,
} from './services/gamification';
export { MetClock } from './components/MetClock';
export {
  useReminders,
  useMissedCount,
  REMINDER_TICK_MS,
  type ReminderInstance,
  type RemindersApi,
  type ReminderStatus,
} from './hooks/useReminders';
export { useGamification, type GamificationApi } from './hooks/useGamification';
export { levelForXp, levelProgress, XP_PER_LEVEL } from './services/levels';
export { DUE_GRACE_MIN, EARLY_WINDOW_MIN, TWICE_DAILY_OFFSET_MIN } from './services/reminderConfig';
export {
  currentMissionDay,
  expandRange,
  expandReminders,
  groupByCrew,
  type ExpandRemindersInput,
  type TaskCompletion,
} from './services/reminderEngine';
export {
  useRoutineStore,
  ROUTINE_STORE_KEY,
  type DailyMissionCompletion,
  type RoutineState,
} from './store/useRoutineStore';
