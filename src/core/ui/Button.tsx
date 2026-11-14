import { clsx } from 'clsx';
import type { ButtonHTMLAttributes, ReactNode } from 'react';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
export type ButtonSize = 'md' | 'lg';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  /** `lg` = ≥56 px touch target, usable with EVA/IVA gloves. */
  size?: ButtonSize;
  icon?: ReactNode;
}

const VARIANTS: Record<ButtonVariant, string> = {
  primary: 'bg-accent text-bg hover:bg-accent-strong',
  secondary: 'bg-surface-2 text-text border border-border hover:border-accent',
  ghost: 'bg-transparent text-text hover:bg-surface-2',
  danger: 'bg-crit text-bg hover:brightness-110',
};

const SIZES: Record<ButtonSize, string> = {
  md: 'min-h-10 px-4 text-sm',
  lg: 'min-h-14 px-6 text-base',
};

export function Button({
  variant = 'primary',
  size = 'md',
  icon,
  className,
  children,
  type = 'button',
  ...rest
}: ButtonProps) {
  return (
    <button
      type={type}
      className={clsx(
        'inline-flex items-center justify-center gap-2 rounded-lg font-medium transition',
        'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus',
        'disabled:cursor-not-allowed disabled:opacity-50',
        VARIANTS[variant],
        SIZES[size],
        className,
      )}
      {...rest}
    >
      {icon}
      {children}
    </button>
  );
}
