import { clsx } from 'clsx';
import { CalendarClock, Check, UserRound } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useCrew } from '@core/store';
import { BOX, Button, Card, EmptyState, ProgressBar, Segmented, Tile } from '@core/ui';
import { useReminders, type ReminderInstance, type ReminderStatus } from '../hooks/useReminders';
import { REMINDER_STATUS_ICON } from './reminderStatusIcon';

export interface ReminderCenterProps {
  /** 'today' = dashboard widget; 'all' = full list. Both show today's tasks for now. */
  scope?: 'today' | 'all';
  /** Crew member to show; default = the signed-in astronaut. */
  crewId?: string;
}

/** Order on screen: what needs action first (spec §7.8: to do / overdue / done). */
const STATUS_ORDER: ReminderStatus[] = ['due', 'missed', 'upcoming', 'late', 'done'];

/** "HH:MM" (UTC) of an ISO timestamp. */
const hhmm = (iso: string): string => iso.slice(11, 16);

const sortForScreen = (list: ReminderInstance[]) =>
  [...list].sort(
    (a, b) =>
      STATUS_ORDER.indexOf(a.status) - STATUS_ORDER.indexOf(b.status) ||
      a.dueAt.localeCompare(b.dueAt),
  );

/** Status pill: icon + text (never colour alone). Only "due" takes the accent — it is the call to act. */
function ReminderStatusPill({ status }: { status: ReminderStatus }) {
  const { t } = useTranslation();
  const Icon = REMINDER_STATUS_ICON[status];
  return (
    <span
      data-status={status}
      className={clsx(
        BOX.pill,
        'inline-flex shrink-0 items-center gap-2 bg-bg px-3 py-1 text-label',
        status === 'due' ? 'font-semibold text-accent' : 'text-text-2',
      )}
    >
      <Icon aria-hidden="true" className="size-5" strokeWidth={1.75} />
      {t(`routine.reminders.status.${status}`)}
    </span>
  );
}

function MyTasks({ crewId }: { crewId?: string }) {
  const { t } = useTranslation();
  const { reminders, completeTask } = useReminders(crewId);
  const sorted = useMemo(() => sortForScreen(reminders), [reminders]);
  const finished = reminders.filter((r) => r.status === 'done' || r.status === 'late').length;
  const missed = reminders.filter((r) => r.status === 'missed').length;

  if (reminders.length === 0) {
    return (
      <EmptyState
        icon={<CalendarClock aria-hidden="true" className="size-8" strokeWidth={1.75} />}
        title={t('routine.reminders.empty')}
      />
    );
  }

  return (
    <div className="flex flex-col gap-touch-gap">
      <ProgressBar
        value={finished / reminders.length}
        label={t('routine.reminders.progressLabel')}
        valueText={t('routine.reminders.progress', {
          done: finished,
          total: reminders.length,
          missed,
        })}
      />
      <ul className="flex flex-col gap-touch-gap">
        {sorted.map((r) => {
          const manualOpen = !r.template.metric && (r.status === 'due' || r.status === 'missed');
          return (
            <Tile
              as="li"
              key={r.id}
              data-status={r.status}
              className={clsx(
                'flex min-h-touch items-center gap-touch-gap',
                r.status === 'due' && 'border-l-4 border-accent',
              )}
            >
              <span className="w-16 shrink-0 font-mono text-body text-text-2">{hhmm(r.dueAt)}</span>
              <span className="min-w-0 flex-1 text-body text-text">{t(r.template.taskKey)}</span>
              <ReminderStatusPill status={r.status} />
              {manualOpen && (
                <Button
                  variant="secondary"
                  icon={<Check aria-hidden="true" className="size-6" />}
                  onClick={() => completeTask(r.crewId, r.template.id)}
                >
                  {t('routine.reminders.markDone')}
                </Button>
              )}
            </Tile>
          );
        })}
      </ul>
      <p className="text-label text-text-3">{t('routine.reminders.utcNote')}</p>
    </div>
  );
}

/** Crew view: task adherence only — no health value, no health status (spec §7.7, ADR-032). */
function CrewTasks() {
  const { t } = useTranslation();
  const crew = useCrew();
  const { byCrew, crewId: me } = useReminders();

  return (
    <ul className="flex flex-col gap-touch-gap">
      {crew.map((member) => {
        const list = byCrew[member.id] ?? [];
        const finished = list.filter((r) => r.status === 'done' || r.status === 'late').length;
        const missed = list.filter((r) => r.status === 'missed').length;
        return (
          <Tile as="li" key={member.id} className="flex flex-col gap-2">
            <span className="inline-flex items-center gap-2 text-body text-text">
              <UserRound aria-hidden="true" className="size-5 text-text-2" strokeWidth={1.75} />
              <span className="font-semibold">{member.name}</span>
              <span className="text-label text-text-2">· {member.role}</span>
              {member.id === me && (
                <span className="text-label text-accent">{t('routine.reminders.you')}</span>
              )}
            </span>
            <ProgressBar
              value={list.length ? finished / list.length : 0}
              label={t('routine.reminders.crewProgressLabel', { name: member.name })}
              valueText={t('routine.reminders.progress', {
                done: finished,
                total: list.length,
                missed,
              })}
            />
          </Tile>
        );
      })}
    </ul>
  );
}

/**
 * Today's routine (ADR-049, spec §7.8). "Me" = the signed-in astronaut (or `crewId`): tasks
 * ordered by what needs action, five statuses as icon + text ('late' has its own icon and word),
 * manual tasks get a "Mark as done" button. "Crew" = everyone's task adherence only.
 */
export function ReminderCenter({ scope = 'today', crewId }: ReminderCenterProps) {
  const { t } = useTranslation();
  const [view, setView] = useState<'me' | 'crew'>('me');

  return (
    <Card
      title={t('routine.reminders.title')}
      data-scope={scope}
      actions={
        <Segmented
          label={t('routine.reminders.viewLabel')}
          value={view}
          options={[
            { value: 'me', label: t('routine.reminders.viewMe') },
            { value: 'crew', label: t('routine.reminders.viewCrew') },
          ]}
          onChange={setView}
        />
      }
    >
      {view === 'me' ? <MyTasks {...(crewId ? { crewId } : {})} /> : <CrewTasks />}
    </Card>
  );
}
