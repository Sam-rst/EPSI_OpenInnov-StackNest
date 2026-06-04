import type { ReactNode } from 'react';
import { cn } from './cn';

export type BadgeTone = 'neutral' | 'cyan' | 'yellow' | 'success' | 'danger' | 'warn';

const TONES: Record<BadgeTone, string> = {
  neutral: 'bg-surface-sunken text-text-secondary border-border',
  cyan: 'bg-[color-mix(in_oklch,var(--brand-cyan)_14%,transparent)] text-cyan border-[color-mix(in_oklch,var(--brand-cyan)_30%,transparent)]',
  yellow:
    'bg-[color-mix(in_oklch,var(--brand-yellow)_18%,transparent)] text-[#9b5805] border-[color-mix(in_oklch,var(--brand-yellow)_36%,transparent)]',
  success:
    'bg-[color-mix(in_oklch,#22c55e_14%,transparent)] text-[#0e7d3a] border-[color-mix(in_oklch,#22c55e_30%,transparent)]',
  danger:
    'bg-[color-mix(in_oklch,#c42b1c_14%,transparent)] text-[#a52215] border-[color-mix(in_oklch,#c42b1c_30%,transparent)]',
  warn: 'bg-[color-mix(in_oklch,var(--brand-yellow)_14%,transparent)] text-[#9b5805] border-[color-mix(in_oklch,var(--brand-yellow)_30%,transparent)]',
};

interface BadgeProps {
  tone?: BadgeTone;
  className?: string;
  children: ReactNode;
}

export function Badge({ tone = 'neutral', className, children }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 px-2 h-5 text-[10px] font-semibold uppercase tracking-[0.08em] rounded-md border',
        TONES[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
