import { Trophy } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Card, EmptyState, PlaceholderNotice } from '@core/ui';
import { useGamification } from '../hooks/useGamification';

/** STUB. TODO(Engineer 1, P1): mission cards, XP bar, streak flame, badges, team score. */
export function MissionBoard() {
  const { t } = useTranslation();
  const g = useGamification();

  return (
    <Card title={t('routine.missions.title')}>
      <PlaceholderNotice text={t('common.stubNotice', { owner: 'Engineer 1' })} />
      <dl className="mb-4 grid grid-cols-3 gap-3 text-center">
        <div className="rounded-lg bg-surface-2 p-3">
          <dt className="text-xs text-muted">{t('routine.missions.xp')}</dt>
          <dd className="font-mono text-xl">{g.xp}</dd>
        </div>
        <div className="rounded-lg bg-surface-2 p-3">
          <dt className="text-xs text-muted">{t('routine.missions.level', { level: g.level })}</dt>
          <dd className="font-mono text-xl">
            {t('routine.missions.streak', { count: g.streakDays })}
          </dd>
        </div>
        <div className="rounded-lg bg-surface-2 p-3">
          <dt className="text-xs text-muted">{t('routine.missions.teamScore')}</dt>
          <dd className="font-mono text-xl">{g.teamScore}</dd>
        </div>
      </dl>
      {g.missions.length === 0 && (
        <EmptyState
          icon={<Trophy aria-hidden="true" className="size-6" />}
          title={t('routine.missions.empty')}
        />
      )}
    </Card>
  );
}
