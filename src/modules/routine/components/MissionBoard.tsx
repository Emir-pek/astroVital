import { clsx } from 'clsx';
import { Award, Check, CircleCheck, Flame, Info, Users } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button, Card, ProgressBar, Tile } from '@core/ui';
import { useGamification } from '../hooks/useGamification';
import { BADGE_I18N, BADGE_IDS } from '../services/gamification';
import { XP_PER_LEVEL } from '../services/levels';

export interface MissionBoardProps {
  /** Crew member to show; default = the signed-in astronaut. */
  crewId?: string;
}

/**
 * XP, level, streak, badges, daily missions and team score (ADR-050, spec §7.8). Rewards are for
 * adherence only — the rule sentence stays visible and nothing here shows or depends on a value.
 * Badges are plain line insignia (no glitter, no confetti); unearned ones are dimmed and say so.
 */
export function MissionBoard({ crewId }: MissionBoardProps) {
  const { t } = useTranslation();
  const g = useGamification(crewId);
  const inLevel = Math.round(g.levelProgress * XP_PER_LEVEL);

  return (
    <Card title={t('routine.missions.title')}>
      <div className="flex flex-col gap-touch-gap">
        <p className="inline-flex items-start gap-2 text-label text-text-2">
          <Info aria-hidden="true" className="size-5 shrink-0" strokeWidth={1.75} />
          {t('routine.missions.rule')}
        </p>

        <Tile className="flex flex-col gap-2">
          <div className="flex items-baseline justify-between gap-touch-gap">
            <span className="text-headline font-semibold text-text">
              {t('routine.missions.level', { level: g.level })}
            </span>
            <span className="font-mono text-body text-text-2">
              {t('routine.missions.xpTotal', { xp: g.xp })}
            </span>
          </div>
          <ProgressBar
            value={g.levelProgress}
            label={t('routine.missions.levelProgressLabel', { level: g.level + 1 })}
            valueText={t('routine.missions.levelProgress', { xp: inLevel, max: XP_PER_LEVEL })}
          />
        </Tile>

        <div className="grid grid-cols-2 gap-touch-gap">
          <Tile className="flex flex-col gap-1">
            <span className="inline-flex items-center gap-2 text-label text-text-2">
              <Flame aria-hidden="true" className="size-5" strokeWidth={1.75} />
              {t('routine.missions.streakLabel')}
            </span>
            <span className="font-mono text-headline text-text">
              {t('routine.missions.streak', { count: g.streakDays })}
            </span>
            <span className="text-label text-text-3">
              {t('routine.missions.longest', { count: g.longestStreak })}
            </span>
          </Tile>
          <Tile className="flex flex-col gap-1">
            <span className="inline-flex items-center gap-2 text-label text-text-2">
              <Users aria-hidden="true" className="size-5" strokeWidth={1.75} />
              {t('routine.missions.teamScore')}
            </span>
            <span className="font-mono text-headline text-text">{g.teamScore}%</span>
            <span className="text-label text-text-3">{t('routine.missions.teamScoreHint')}</span>
          </Tile>
        </div>

        <section aria-labelledby="routine-daily" className="flex flex-col gap-2">
          <h3 id="routine-daily" className="text-body font-semibold text-text">
            {t('routine.missions.dailyTitle')}
          </h3>
          <ul className="flex flex-col gap-touch-gap">
            {g.missions.map((m) => (
              <Tile
                as="li"
                key={m.id}
                className="flex min-h-touch items-center justify-between gap-touch-gap"
              >
                <span className="text-body text-text">
                  {t(m.titleKey)}
                  <span className="ml-2 font-mono text-label text-text-2">+{m.xp} XP</span>
                </span>
                {m.completedAt ? (
                  <span className="inline-flex items-center gap-2 text-label text-text-2">
                    <CircleCheck aria-hidden="true" className="size-6" strokeWidth={1.75} />
                    {t('routine.missions.ticked')}
                  </span>
                ) : (
                  <Button
                    variant="secondary"
                    icon={<Check aria-hidden="true" className="size-6" />}
                    onClick={() => g.completeMission(m.id)}
                  >
                    {t('routine.missions.tick')}
                  </Button>
                )}
              </Tile>
            ))}
          </ul>
        </section>

        <section aria-labelledby="routine-badges" className="flex flex-col gap-2">
          <h3 id="routine-badges" className="text-body font-semibold text-text">
            {t('routine.missions.badges')}
          </h3>
          <ul className="grid grid-cols-2 gap-touch-gap">
            {BADGE_IDS.map((b) => {
              const earned = g.badges.includes(b);
              return (
                <Tile
                  as="li"
                  key={b}
                  data-earned={earned}
                  className={clsx('flex items-start gap-3', !earned && 'opacity-60')}
                >
                  <Award
                    aria-hidden="true"
                    className={clsx('size-8 shrink-0', earned ? 'text-accent' : 'text-text-3')}
                    strokeWidth={1.5}
                  />
                  <span className="flex flex-col">
                    <span className="text-body font-semibold text-text">
                      {t(`routine.badges.${BADGE_I18N[b]}.name`)}
                    </span>
                    <span className="text-label text-text-2">
                      {earned
                        ? t(`routine.badges.${BADGE_I18N[b]}.description`)
                        : t('routine.missions.notYet')}
                    </span>
                  </span>
                </Tile>
              );
            })}
          </ul>
        </section>
      </div>
    </Card>
  );
}
