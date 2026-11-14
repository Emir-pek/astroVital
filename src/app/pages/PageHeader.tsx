import type { ReactNode } from 'react';

export function PageHeader({
  title,
  subtitle,
  actions,
}: {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-touch-gap">
      <div>
        <h1 className="text-title font-semibold text-text">{title}</h1>
        {subtitle && <p className="mt-1 max-w-3xl text-body text-text-2">{subtitle}</p>}
      </div>
      {actions}
    </div>
  );
}
