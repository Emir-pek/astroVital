import { clsx } from 'clsx';
import type { HTMLAttributes, ReactNode } from 'react';
import { BOX } from './box';

export interface CardProps extends Omit<HTMLAttributes<HTMLElement>, 'title'> {
  title?: ReactNode;
  /** Right-aligned header content (buttons, badges). */
  actions?: ReactNode;
  /** Visually marks the card as a stub / placeholder (dashed border). */
  placeholder?: boolean;
}

/**
 * The Panel box role (box.ts): a top-level container with surface gradient, 24 px radius,
 * 24 px padding and the soft shadow. Boxes inside it are `Tile`s; never nest a Card in a Card.
 */
export function Card({ title, actions, placeholder, className, children, ...rest }: CardProps) {
  return (
    <section
      className={clsx(BOX.panel, placeholder && 'border border-dashed border-line', className)}
      {...rest}
    >
      {(title || actions) && (
        <header className="mb-4 flex items-center justify-between gap-touch-gap">
          {title && <h2 className="text-headline font-semibold text-text">{title}</h2>}
          {actions}
        </header>
      )}
      {children}
    </section>
  );
}
