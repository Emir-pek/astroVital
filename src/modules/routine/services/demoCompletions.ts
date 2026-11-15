import { MIXED } from '@core/simulation';
import type { ReminderTemplate, ScenarioId } from '@core/types';
import { isScheduledOn } from '@core/utils/routineSchedule';
import { MS_PER_MINUTE, parseTimeOfDay } from '@core/utils/time';
import { currentMissionDay, missionDayBounds, type TaskCompletion } from './reminderEngine';

/** Demo crew tick a manual task this many minutes after its scheduled time (inside the window). */
export const DEMO_MANUAL_DELAY_MIN = 10;

export interface DemoCompletionsInput {
  schedule: readonly ReminderTemplate[];
  missionStart: string;
  /** Moment the demo was loaded — nothing after it is produced. */
  now: Date;
  /** Crew in demo order (the index drives the story). */
  crew: readonly { id: string }[];
  scenario: ScenarioId;
}

/**
 * Manual completions that go with the simulated history (ADR-048 "data follows the schedule"): tasks
 * without a metric (weekly health summary, monthly exam / survey, crew check-in …) are ticked on
 * time on every scheduled day up to `now`, so a crew member with a flawless story never shows a
 * missed task. Story exception (mixed_mission): Kenji, ill, skips them on the last
 * `MIXED.kenjiSkipLastDays` days. PURE and deterministic.
 */
export const generateDemoCompletions = ({
  schedule,
  missionStart,
  now,
  crew,
  scenario,
}: DemoCompletionsInput): TaskCompletion[] => {
  const today = currentMissionDay(missionStart, now);
  const manual = schedule.filter((t) => !t.metric);
  const out: TaskCompletion[] = [];
  crew.forEach((member, crewIndex) => {
    for (let day = 1; day <= today; day++) {
      const ill =
        scenario === 'mixed_mission' && crewIndex === 1 && day > today - MIXED.kenjiSkipLastDays;
      if (ill) continue;
      for (const t of manual) {
        if (!isScheduledOn(t, day)) continue;
        const at =
          missionDayBounds(missionStart, day).start +
          (parseTimeOfDay(t.timeOfDayMET) + DEMO_MANUAL_DELAY_MIN) * MS_PER_MINUTE;
        if (at > now.getTime()) continue;
        out.push({
          crewId: member.id,
          templateId: t.id,
          missionDay: day,
          at: new Date(at).toISOString(),
        });
      }
    }
  });
  return out;
};
