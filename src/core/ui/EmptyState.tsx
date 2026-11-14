import { clsx } from 'clsx';
import type { ReactNode } from 'react';

export interface EmptyStateProps {
  icon?: ReactNode;
  /** Already-translated texts. */
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}

export function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div
      className={clsx(
        'flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border p-6 text-center',
        className,
      )}
    >
      {icon && <div className="text-muted">{icon}</div>}
      <p className="font-medium text-text">{title}</p>
      {description && <p className="max-w-prose text-sm text-muted">{description}</p>}
      {action}
    </div>
  );
}
