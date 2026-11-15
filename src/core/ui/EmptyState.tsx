import { clsx } from 'clsx';
import type { ReactNode } from 'react';
import { BOX } from './box';

export interface EmptyStateProps {
  icon?: ReactNode;
  /** Already-translated texts. */
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}

/** "Nothing here yet" message. A Tile (box.ts): it sits inside a panel. */
export function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div
      className={clsx(
        BOX.tile,
        'flex flex-col items-center justify-center gap-2 text-center',
        className,
      )}
    >
      {icon && <div className="text-text-2">{icon}</div>}
      <p className="text-body font-medium text-text">{title}</p>
      {description && <p className="max-w-prose text-label text-text-2">{description}</p>}
      {action}
    </div>
  );
}
