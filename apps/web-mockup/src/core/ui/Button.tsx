import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { Icon } from './Icon';
import { cn } from './cn';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'cyan' | 'danger' | 'outline';
export type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** Nom d'icône lucide kebab-case (ex : "arrow-right"). */
  icon?: string;
  iconRight?: string;
  children?: ReactNode;
}

const SIZES: Record<ButtonSize, string> = {
  sm: 'h-8 px-3 text-xs gap-1.5',
  md: 'h-10 px-4 text-[13px] gap-2',
  lg: 'h-12 px-6 text-sm gap-2',
};

const VARIANTS: Record<ButtonVariant, string> = {
  primary:
    'bg-sun text-[#3a2a00] hover:brightness-105 active:brightness-95 shadow-[0_1px_0_rgba(255,255,255,0.25)_inset,0_1px_2px_rgba(0,0,0,0.08)]',
  secondary:
    'bg-surface-elevated text-text-primary border border-border hover:border-cyan hover:text-cyan',
  ghost: 'text-text-secondary hover:bg-surface-sunken hover:text-text-primary',
  cyan: 'bg-cyan text-white hover:brightness-110 shadow-[0_1px_0_rgba(255,255,255,0.15)_inset]',
  danger: 'bg-danger text-white hover:brightness-110',
  outline: 'border border-border text-text-primary hover:border-cyan hover:text-cyan',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'primary', size = 'md', icon, iconRight, className, children, ...rest },
  ref,
) {
  const iconSize = size === 'lg' ? 16 : 14;
  return (
    <button
      ref={ref}
      className={cn(
        'relative inline-flex items-center justify-center font-medium rounded-md',
        'transition-[background-color,color,border-color,filter,transform] duration-150',
        'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        SIZES[size],
        VARIANTS[variant],
        className,
      )}
      {...rest}
    >
      {icon && <Icon name={icon} size={iconSize} />}
      {children}
      {iconRight && <Icon name={iconRight} size={iconSize} />}
    </button>
  );
});
