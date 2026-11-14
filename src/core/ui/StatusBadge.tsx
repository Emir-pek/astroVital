import { clsx } from 'clsx';
import { STATUS_STYLE, type DisplayStatus } from './statusStyle';

export interface StatusBadgeProps {
  status: DisplayStatus;
  /** Already-translated label (e.g. t('status.nominal')). Required: colour is never the only cue. */
  label: string;
  size?: 'sm' | 'md';
  className?: string;
}

/** Colour + icon + text — colour-blind safe by construction. */
export function StatusBadge({ status, label, size = 'md', className }: StatusBadgeProps) {
  const { icon: Icon, textClass: tone } = STATUS_STYLE[status];
  return (
    <span
      data-status={status}
      className={clsx(
        'inline-flex items-center gap-2 rounded-full bg-raised font-medium',
        size === 'sm' ? 'px-3 py-1 text-label' : 'px-4 py-1.5 text-body',
        tone,
        className,
      )}
    >
      <Icon aria-hidden="true" className={size === 'sm' ? 'size-4' : 'size-5'} />
      {label}
    </span>
  );
}
