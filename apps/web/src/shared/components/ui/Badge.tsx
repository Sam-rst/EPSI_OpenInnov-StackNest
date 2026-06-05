import type { ReactNode } from 'react'

import { cn } from '../../lib/cn'

export type BadgeTone = 'neutral' | 'cyan' | 'yellow' | 'success' | 'danger' | 'warn'

interface BadgeProps {
  tone?: BadgeTone
  className?: string
  children: ReactNode
}

const TONES: Record<BadgeTone, string> = {
  neutral: 'bg-surface-sunken text-text-secondary border-border',
  cyan: 'bg-[color-mix(in_oklch,var(--color-cyan)_14%,transparent)] text-cyan border-[color-mix(in_oklch,var(--color-cyan)_30%,transparent)]',
  yellow:
    'bg-[color-mix(in_oklch,var(--color-yellow)_18%,transparent)] text-[#9b5805] border-[color-mix(in_oklch,var(--color-yellow)_36%,transparent)]',
  success:
    'bg-[color-mix(in_oklch,#22c55e_14%,transparent)] text-[#0e7d3a] border-[color-mix(in_oklch,#22c55e_30%,transparent)]',
  danger:
    'bg-[color-mix(in_oklch,#c42b1c_14%,transparent)] text-[#a52215] border-[color-mix(in_oklch,#c42b1c_30%,transparent)]',
  warn: 'bg-[color-mix(in_oklch,var(--color-yellow)_14%,transparent)] text-[#9b5805] border-[color-mix(in_oklch,var(--color-yellow)_30%,transparent)]',
}

const BASE =
  'inline-flex items-center gap-1 px-2 h-5 text-[10px] font-semibold uppercase tracking-[0.08em] rounded-md border'

/** Pastille de statut/catégorie aux tons sémantiques de la charte. */
export function Badge({ tone = 'neutral', className, children }: BadgeProps) {
  return <span className={cn(BASE, TONES[tone], className)}>{children}</span>
}
