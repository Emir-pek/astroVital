import { clsx } from 'clsx';
import type { ButtonHTMLAttributes, ReactNode, Ref } from 'react';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
export type ButtonSize = 'md' | 'lg';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  /** Both sizes meet the ≥104 px touch target (currently identical; kept for API compatibility). */
  size?: ButtonSize;
  icon?: ReactNode;
  ref?: Ref<HTMLButtonElement>;
}

const VARIANTS: Record<ButtonVariant, string> = {
  primary: 'bg-accent text-bg',
  secondary: 'bg-raised text-text',
  ghost: 'text-text hover:bg-raised',
  // Reversed video: only inside the red full-screen warning.
  danger: 'bg-warning-fill text-on-warning-fill',
};

// Both sizes are glove-sized; `size` is kept for backward compatibility.
const SIZES: Record<ButtonSize, string> = {
  md: 'min-h-touch min-w-touch px-6 text-body',
  lg: 'min-h-touch min-w-touch px-6 text-body',
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
        'inline-flex items-center justify-center gap-2 rounded-button font-medium transition',
        'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus',
        // Disabled keeps >= 6:1 text contrast: no opacity, a dashed outline instead.
        'disabled:cursor-not-allowed disabled:border-2 disabled:border-dashed disabled:border-line disabled:bg-transparent disabled:text-text-3',
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
