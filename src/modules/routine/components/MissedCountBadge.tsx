import { clsx } from 'clsx';
import { CircleX } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { BOX } from '@core/ui';
import { useMissedCount } from '../hooks/useReminders';

/**
 * "N missed" pill for the navigation (spec §7.8): today's missed tasks of the signed-in astronaut
 * (or `crewId`). Renders nothing when there are none. Icon + number + word — never a bare red dot.
 * Not mounted yet: its place (e.g. next to the Routine menu item) is Engineer 4's call.
 */
export function MissedCountBadge({ crewId, className }: { crewId?: string; className?: string }) {
  const { t } = useTranslation();
  const count = useMissedCount(crewId);
  if (count === 0) return null;
  return (
    <span
      data-testid="missed-count"
      className={clsx(
        BOX.pill,
        'inline-flex items-center gap-1 bg-bg px-2 py-0.5 text-label text-text',
        className,
      )}
    >
      <CircleX aria-hidden="true" className="size-4 shrink-0" strokeWidth={1.75} />
      {t('routine.reminders.missedCount', { count })}
    </span>
  );
}
