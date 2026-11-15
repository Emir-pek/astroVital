import type { Mission } from '@core/types';
import type { ReminderInstance } from './reminderEngine';

/**
 * Gamification rules (ADR-042). PURE and DERIVED from adherence history — nothing here is a stored
 * counter, so XP cannot be inflated by clicking twice and the demo crew has history XP too.
 * RULE: rewards ADHERENCE only. No function in this file reads a measurement value — the inputs are
 * reminder instances (status + time) and daily mission ticks.
 */

/** XP per reminder occurrence by status (manual completions follow the same table). */
export const XP_BY_STATUS = {
  done: 10,
  late: 5,
  missed: 0,
  due: 0,
  upcoming: 0,
} as const satisfies Record<ReminderInstance['status'], number>;

/** XP for ticking a daily health mission (once per crew member and mission day). */
export const DAILY_MISSION_XP = 5;

/** Daily health missions ticked by hand. */
export const DAILY_MISSIONS: readonly Omit<Mission, 'completedAt'>[] = [
  { id: 'hydration', titleKey: 'routine.daily.hydration', xp: DAILY_MISSION_XP, type: 'hydration' },
  {
    id: 'sleep-hygiene',
    titleKey: 'routine.daily.sleepHygiene',
    xp: DAILY_MISSION_XP,
    type: 'sleep',
  },
  { id: 'crew-chat', titleKey: 'routine.daily.crewChat', xp: DAILY_MISSION_XP, type: 'social' },
  { id: 'learn', titleKey: 'routine.daily.learn', xp: DAILY_MISSION_XP, type: 'learning' },
];

export const DAILY_MISSION_IDS = DAILY_MISSIONS.map((m) => m.id);

export type BadgeId =
  'streak-7' | 'streak-30' | 'exercise-week' | 'monthly-exam-done' | 'crew-player';

/** All badges in display order. */
export const BADGE_IDS: readonly BadgeId[] = [
  'streak-7',
  'streak-30',
  'exercise-week',
  'monthly-exam-done',
  'crew-player',
];

/** i18n segment of each badge: `routine.badges.<segment>.name` / `.description`. */
export const BADGE_I18N: Record<BadgeId, string> = {
  'streak-7': 'streak7',
  'streak-30': 'streak30',
  'exercise-week': 'exerciseWeek',
  'monthly-exam-done': 'monthlyExamDone',
  'crew-player': 'crewPlayer',
};

/** Planned exercise sessions per 7-day mission week (ADR-035: 6 days a week). */
export const EXERCISE_SESSIONS_PER_WEEK = 6;
/** Crew-chat ticks needed for the crew-player badge. */
export const CREW_PLAYER_CHATS = 5;
/** Window of the team score, in mission days (today included). */
export const TEAM_SCORE_DAYS = 7;

/** Minimal shape of a daily mission tick. */
export interface MissionTick {
  missionId: string;
  missionDay: number;
}

const isCompleted = (r: ReminderInstance) => r.status === 'done' || r.status === 'late';
const isOpen = (r: ReminderInstance) => r.status === 'upcoming' || r.status === 'due';

/** Total XP of one crew member. */
export const computeXp = (
  instances: readonly ReminderInstance[],
  ticks: readonly MissionTick[],
): number =>
  instances.reduce((sum, r) => sum + XP_BY_STATUS[r.status], 0) + ticks.length * DAILY_MISSION_XP;

/**
 * Per-day verdict for streaks: 'kept' (every metric task done/late), 'broken' (one missed),
 * 'pending' (today, something still open, nothing missed), 'none' (no metric task that day).
 */
type DayVerdict = 'kept' | 'broken' | 'pending' | 'none';

const dayVerdicts = (
  instances: readonly ReminderInstance[],
  today: number,
): Map<number, DayVerdict> => {
  const byDay = new Map<number, ReminderInstance[]>();
  for (const r of instances) {
    if (!r.template.metric) continue; // streaks count measurements only
    const list = byDay.get(r.missionDay);
    if (list) list.push(r);
    else byDay.set(r.missionDay, [r]);
  }
  const out = new Map<number, DayVerdict>();
  for (let d = 1; d <= today; d++) {
    const list = byDay.get(d) ?? [];
    if (list.length === 0) out.set(d, 'none');
    else if (list.some((r) => r.status === 'missed')) out.set(d, 'broken');
    else if (list.some(isOpen)) out.set(d, 'pending');
    else out.set(d, 'kept');
  }
  return out;
};

/**
 * Current streak: consecutive mission days up to today on which every scheduled metric task was
 * done or late. Today counts once complete and does not break the streak while still open.
 * A rest day only removes exercise from that day's list, so it never breaks the streak.
 */
export const currentStreak = (instances: readonly ReminderInstance[], today: number): number => {
  const verdicts = dayVerdicts(instances, today);
  let streak = 0;
  for (let d = today; d >= 1; d--) {
    const v = verdicts.get(d);
    if (v === 'kept') streak++;
    else if (v === 'broken') break;
    // 'pending' (today) and 'none' neither count nor break
  }
  return streak;
};

/** Longest streak ever reached (badges stay earned). */
export const longestStreak = (instances: readonly ReminderInstance[], today: number): number => {
  const verdicts = dayVerdicts(instances, today);
  let best = 0;
  let run = 0;
  for (let d = 1; d <= today; d++) {
    const v = verdicts.get(d);
    if (v === 'kept') best = Math.max(best, ++run);
    else if (v === 'broken') run = 0;
  }
  return best;
};

/** True if some 7-day mission week (days 1–7, 8–14, …) had all 6 planned exercise sessions done. */
export const hasFullExerciseWeek = (instances: readonly ReminderInstance[]): boolean => {
  const weeks = new Map<number, ReminderInstance[]>();
  for (const r of instances) {
    if (r.template.metric !== 'exerciseMinutes') continue;
    const w = Math.floor((r.missionDay - 1) / 7);
    const list = weeks.get(w);
    if (list) list.push(r);
    else weeks.set(w, [r]);
  }
  for (const list of weeks.values()) {
    if (list.length >= EXERCISE_SESSIONS_PER_WEEK && list.every(isCompleted)) return true;
  }
  return false;
};

/** Earned badges of one crew member, in BADGE_IDS order. */
export const computeBadges = (
  instances: readonly ReminderInstance[],
  ticks: readonly MissionTick[],
  today: number,
): BadgeId[] => {
  const longest = longestStreak(instances, today);
  const earned: Record<BadgeId, boolean> = {
    'streak-7': longest >= 7,
    'streak-30': longest >= 30,
    'exercise-week': hasFullExerciseWeek(instances),
    'monthly-exam-done': instances.some(
      (r) => r.template.id === 'monthly-health-exam' && isCompleted(r),
    ),
    'crew-player': ticks.filter((t) => t.missionId === 'crew-chat').length >= CREW_PLAYER_CHATS,
  };
  return BADGE_IDS.filter((id) => earned[id]);
};

/**
 * Team score 0–100: share of the whole crew's metric tasks of the last TEAM_SCORE_DAYS mission days
 * that were done or late. Still-open tasks (upcoming/due) are left out until they resolve.
 * Adherence only — no health value. No resolved task ⇒ 0.
 */
export const computeTeamScore = (
  allCrewInstances: readonly ReminderInstance[],
  today: number,
): number => {
  const from = today - TEAM_SCORE_DAYS + 1;
  let planned = 0;
  let kept = 0;
  for (const r of allCrewInstances) {
    if (!r.template.metric || r.missionDay < from || r.missionDay > today || isOpen(r)) continue;
    planned++;
    if (isCompleted(r)) kept++;
  }
  return planned === 0 ? 0 : Math.round((kept / planned) * 100);
};

/** Today's daily missions of one crew member with their tick time. */
export const dailyMissionsFor = (
  ticks: readonly (MissionTick & { at: string })[],
  today: number,
): Mission[] =>
  DAILY_MISSIONS.map((m) => {
    const tick = ticks.find((t) => t.missionId === m.id && t.missionDay === today);
    return tick ? { ...m, completedAt: tick.at } : { ...m };
  });

/** Milestones the companion may celebrate (streak just reached 7/30, any badge). */
export const STREAK_MILESTONES = [7, 14, 30, 60, 90] as const;
