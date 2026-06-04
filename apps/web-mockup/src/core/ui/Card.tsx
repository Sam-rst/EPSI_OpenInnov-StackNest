import { forwardRef, type HTMLAttributes } from 'react';
import { cn } from './cn';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  hoverable?: boolean;
}

export const Card = forwardRef<HTMLDivElement, CardProps>(function Card(
  { hoverable = false, className, children, ...rest },
  ref,
) {
  return (
    <div
      ref={ref}
      className={cn(
        'bg-surface-elevated border border-border rounded-lg',
        hoverable &&
          'transition-[transform,box-shadow,border-color] duration-200 hover:border-cyan hover:-translate-y-0.5 hover:shadow-[0_8px_28px_-12px_rgba(13,146,151,0.35)]',
        className,
      )}
      {...rest}
    >
      {children}
    </div>
  );
});
