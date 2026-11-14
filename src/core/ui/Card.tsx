import { clsx } from 'clsx';
import type { HTMLAttributes, ReactNode } from 'react';

export interface CardProps extends Omit<HTMLAttributes<HTMLElement>, 'title'> {
  title?: ReactNode;
  /** Right-aligned header content (buttons, badges). */
  actions?: ReactNode;
  /** Visually marks the card as a stub / placeholder (dashed border). */
  placeholder?: boolean;
}

export function Card({ title, actions, placeholder, className, children, ...rest }: CardProps) {
  return (
    <section
      className={clsx(
        'rounded-[var(--av-radius)] border bg-surface p-4 shadow-lg shadow-black/20',
        placeholder ? 'border-dashed border-border/80' : 'border-border',
        className,
      )}
      {...rest}
    >
      {(title || actions) && (
        <header className="mb-3 flex items-center justify-between gap-2">
          {title && <h2 className="text-base font-semibold text-text">{title}</h2>}
          {actions}
        </header>
      )}
      {children}
    </section>
  );
}
