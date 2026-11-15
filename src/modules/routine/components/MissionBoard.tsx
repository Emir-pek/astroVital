import { Award, CircleCheck, Info } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button, Card, Tile } from '@core/ui';
import { useGamification } from '../hooks/useGamification';
import { BADGE_I18N as BADGE_KEY } from '../services/gamification';

export interface MissionBoardProps {
  /** Crew member to show; default = the signed-in astronaut. */
  crewId?: string;
}

/**
 * XP, level, streak, badges, daily missions and team score (ADR-050). WORKING-PLAIN: logic complete,
 * look and layout belong to visualization (ADR-032, docs/HANDOFF_ENGINEER4.md). The rule text
 * ("XP rewards adherence, not good values") must stay visible.
 */
export function MissionBoard({ crewId }: MissionBoardProps) {
  const { t } = useTranslation();
  const g = useGamification(crewId);

  return (
    <Card title={t('routine.missions.title')}>
      <p className="mb-4 inline-flex items-start gap-2 text-label">
        <Info aria-hidden="true" className="size-6 shrink-0" />
        {t('routine.missions.rule')}
      </p>

      <dl className="mb-4 grid grid-cols-2 gap-touch-gap text-label">
        <Tile>
          <dt>{t('routine.missions.xp')}</dt>
          <dd className="font-mono">
            {g.xp} · {t('routine.missions.level', { level: g.level })}
          </dd>
        </Tile>
        <Tile>
          <dt>{t('routine.missions.streakLabel')}</dt>
          <dd className="font-mono">{t('routine.missions.streak', { count: g.streakDays })}</dd>
        </Tile>
        <Tile>
          <dt>{t('routine.missions.teamScore')}</dt>
          <dd className="font-mono">
            {t('routine.missions.teamScoreValue', { score: g.teamScore })}
          </dd>
        </Tile>
        <Tile>
          <dt>{t('routine.missions.badges')}</dt>
          <dd>
            {g.badges.length === 0
              ? t('routine.missions.noBadges')
              : g.badges.map((b) => t(`routine.badges.${BADGE_KEY[b]}.name`)).join(' · ')}
          </dd>
        </Tile>
      </dl>

      <h3 className="mb-2 text-label font-semibold">{t('routine.missions.dailyTitle')}</h3>
      <ul className="flex flex-col gap-touch-gap">
        {g.missions.map((m) => (
          <Tile
            as="li"
            key={m.id}
            className="flex items-center justify-between gap-touch-gap text-label"
          >
            <span>
              {t(m.titleKey)} · +{m.xp} XP
            </span>
            {m.completedAt ? (
              <span className="inline-flex items-center gap-2">
                <CircleCheck aria-hidden="true" className="size-6" />
                {t('routine.missions.ticked')}
              </span>
            ) : (
              <Button variant="secondary" onClick={() => g.completeMission(m.id)}>
                {t('routine.missions.tick')}
              </Button>
            )}
          </Tile>
        ))}
      </ul>

      {g.badges.length > 0 && (
        <ul className="mt-4 flex flex-col gap-2 text-label">
          {g.badges.map((b) => (
            <li key={b} className="inline-flex items-center gap-2">
              <Award aria-hidden="true" className="size-6" />
              {t(`routine.badges.${BADGE_KEY[b]}.description`)}
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
