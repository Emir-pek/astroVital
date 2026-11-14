import { clsx } from 'clsx';
import type { Status } from '@core/types';
import { STATUS_STYLE } from './statusStyle';

export interface StatusBadgeProps {
  status: Status;
  /** Already-translated label (e.g. t('status.green')). Required: colour is never the only cue. */
  label: string;
  size?: 'sm' | 'md';
  className?: string;
}

/** Colour + icon + text — colour-blind safe by construction. */
export function StatusBadge({ status, label, size = 'md', className }: StatusBadgeProps) {
  const { icon: Icon, className: tone } = STATUS_STYLE[status];
  return (
    <span
      data-status={status}
      className={clsx(
        'inline-flex items-center gap-1.5 rounded-full border font-medium',
        size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-sm',
        tone,
        className,
      )}
    >
      <Icon aria-hidden="true" className={size === 'sm' ? 'size-3.5' : 'size-4'} />
      {label}
    </span>
  );
}
