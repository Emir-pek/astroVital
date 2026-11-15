import { clsx } from 'clsx';
import { X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router';
import { BOX, Button, Popover } from '@core/ui';
import { useCompanion } from '../../hooks/useCompanion';
import { formatCompanionMessage } from '../../services/companion';
import { useRoutineStore } from '../../store/useRoutineStore';
import { CompanionAvatar } from './CompanionAvatar';
import { MOOD_STYLE } from './moodStyle';

/**
 * The astronaut companion (ADR-051): a glove-sized avatar at the bottom of the left navigation that
 * opens a speech bubble to its right. Only the signed-in astronaut; the message is short and plain,
 * an action (if any) is one ≥ 104 px button. Open/collapsed is remembered (routine store).
 * Layering: the bubble sits at z-30, under the side sheet (z-40) and the red full-screen alert,
 * modal and toasts (z-50), so a warning always covers it. Message changes are announced politely.
 */
export function CompanionDock() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const companion = useCompanion();
  const open = useRoutineStore((s) => s.companionOpen);
  const setOpen = useRoutineStore((s) => s.setCompanionOpen);

  const { mood, action } = companion;
  const { icon: Icon, textClass } = MOOD_STYLE[mood];
  const moodLabel = t(`routine.companion.mood.${mood}`);
  const message = formatCompanionMessage(t, companion);

  return (
    <>
      <span className="sr-only" aria-live="polite" data-testid="companion-live">
        {message}
      </span>
      <Popover.Root open={open} onOpenChange={setOpen}>
        <Popover.Trigger
          aria-label={t('routine.companion.toggle', { mood: moodLabel })}
          data-mood={mood}
          className="mt-auto flex min-h-touch min-w-touch shrink-0 flex-col items-center justify-center gap-1 rounded-button text-label text-text-2 hover:bg-raised data-popup-open:bg-raised"
        >
          <CompanionAvatar mood={mood} size={56} />
          <span className={clsx('inline-flex items-center gap-1', textClass)}>
            <Icon aria-hidden="true" className="size-4 shrink-0" strokeWidth={1.75} />
            {moodLabel}
          </span>
        </Popover.Trigger>
        <Popover.Portal>
          <Popover.Positioner side="right" align="end" sideOffset={16} className="z-30">
            <Popover.Popup
              data-mood={mood}
              className={clsx(BOX.panel, 'flex w-[360px] flex-col gap-touch-gap outline-none')}
            >
              <div className="flex items-center gap-3">
                <CompanionAvatar mood={mood} size={48} />
                <Popover.Title
                  className={clsx(
                    'inline-flex items-center gap-2 text-body font-semibold',
                    textClass,
                  )}
                >
                  <Icon aria-hidden="true" className="size-5 shrink-0" strokeWidth={1.75} />
                  {moodLabel}
                </Popover.Title>
              </div>
              <Popover.Description className="text-body text-text">{message}</Popover.Description>
              <div className="flex flex-wrap gap-touch-gap">
                {action && (
                  <Button
                    onClick={() => {
                      setOpen(false);
                      void navigate(action.route);
                    }}
                  >
                    {t(action.labelKey)}
                  </Button>
                )}
                <Popover.Close className="inline-flex min-h-touch min-w-touch items-center justify-center gap-2 rounded-button bg-raised px-6 text-body text-text">
                  <X aria-hidden="true" className="size-6" />
                  {t('routine.companion.hide')}
                </Popover.Close>
              </div>
              <p className="text-label text-text-3">{t('routine.companion.disclaimer')}</p>
            </Popover.Popup>
          </Popover.Positioner>
        </Popover.Portal>
      </Popover.Root>
    </>
  );
}
