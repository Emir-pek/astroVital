import type { TFunction } from 'i18next';
import { HAZARD_IDS, HAZARDS } from '@core/config/hazards.config';
import type { Status } from '@core/types';
import { BADGE_I18N, BADGE_IDS, STREAK_MILESTONES, type BadgeId } from './gamification';
import type { ReminderInstance } from './reminderEngine';

/**
 * Astronaut companion ("pet") logic (ADR-051). PURE. It only ever talks about ONE crew member — the
 * caller passes that person's own summary and reminders; nothing about anyone else goes in.
 * Language: short, plain, no diagnosis; the app is a prototype, not a medical device.
 */

export type CompanionMood = 'cheerful' | 'neutral' | 'concerned' | 'alert';

export interface CompanionAction {
  /** Hash-router path, e.g. '/', '/measure', '/routine' (docs/CONTRACTS.md § Rotalar). */
  route: string;
  labelKey: string;
}

export interface CompanionState {
  mood: CompanionMood;
  /** i18n key of the message. */
  messageKey: string;
  /** Interpolation values for `messageKey` (numbers only — no health values). */
  params?: Record<string, number>;
  /**
   * i18n key of the thing the message is about (a task or badge name); translate it and pass it as
   * `{{subject}}`. `formatCompanionMessage` does this.
   */
  subjectKey?: string;
  action?: CompanionAction;
}

export interface CompanionInput {
  crewId: string;
  /** UTC mission day (drives the rotating tip). */
  missionDay: number;
  /** Overall status of THIS crew member (assessment engine). */
  overall: Status;
  /** THIS crew member's reminders of today. */
  reminders: readonly ReminderInstance[];
  streakDays: number;
  /** Badges earned today (not before). */
  newBadges: readonly BadgeId[];
}

/** Learn content the neutral tip rotates through (hazard countermeasures, plain language). */
export const COMPANION_TIP_KEYS: readonly string[] = HAZARD_IDS.map(
  (id) => HAZARDS[id].countermeasuresKey,
);

/** Small stable hash of a string (FNV-1a) — deterministic tip choice, no Math.random. */
const hash = (s: string): number => {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
};

/** Tip of the day for a crew member: changes daily, differs between crew members, never random. */
export const tipKeyFor = (crewId: string, missionDay: number): string => {
  const n = COMPANION_TIP_KEYS.length;
  const i = (((hash(crewId) + missionDay) % n) + n) % n;
  return COMPANION_TIP_KEYS[i] ?? COMPANION_TIP_KEYS[0] ?? 'hazards.isolation.countermeasures';
};

/**
 * Priority: (1) warning → alert · (2) a missed task → concerned · (3) a task due now → neutral ·
 * (4) streak milestone or badge earned today → cheerful · (5) neutral tip of the day.
 */
export function decideCompanion(input: CompanionInput): CompanionState {
  if (input.overall === 'warning') {
    return {
      mood: 'alert',
      messageKey: 'routine.companion.alert',
      action: { route: '/', labelKey: 'routine.companion.openStatus' },
    };
  }

  const missed = input.reminders.filter((r) => r.status === 'missed');
  if (missed.length > 0) {
    const first = missed[0];
    return {
      mood: 'concerned',
      messageKey:
        missed.length === 1 ? 'routine.companion.missedOne' : 'routine.companion.missedMany',
      params: { count: missed.length },
      ...(missed.length === 1 && first ? { subjectKey: first.template.taskKey } : {}),
      action: { route: '/routine', labelKey: 'routine.companion.openRoutine' },
    };
  }

  const due = input.reminders.find((r) => r.status === 'due');
  if (due) {
    return {
      mood: 'neutral',
      messageKey: 'routine.companion.due',
      subjectKey: due.template.taskKey,
      action: due.template.metric
        ? { route: '/measure', labelKey: 'routine.companion.openMeasure' }
        : { route: '/routine', labelKey: 'routine.companion.openRoutine' },
    };
  }

  const badge = BADGE_IDS.find((b) => input.newBadges.includes(b));
  if (badge) {
    return {
      mood: 'cheerful',
      messageKey: 'routine.companion.badge',
      subjectKey: `routine.badges.${BADGE_I18N[badge]}.name`,
    };
  }
  if ((STREAK_MILESTONES as readonly number[]).includes(input.streakDays)) {
    return {
      mood: 'cheerful',
      messageKey: 'routine.companion.streak',
      params: { count: input.streakDays },
    };
  }

  return {
    mood: 'neutral',
    messageKey: 'routine.companion.tip',
    subjectKey: tipKeyFor(input.crewId, input.missionDay),
  };
}

/** Translates a companion message (subject translated first, then interpolated as `{{subject}}`). */
export const formatCompanionMessage = (
  t: TFunction,
  c: Pick<CompanionState, 'messageKey' | 'params' | 'subjectKey'>,
): string =>
  t(c.messageKey, { ...c.params, ...(c.subjectKey ? { subject: t(c.subjectKey) } : {}) });
