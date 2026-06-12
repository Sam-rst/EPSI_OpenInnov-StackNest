import type { ReactNode } from 'react'

import { cn } from '../../lib/cn'

export type BadgeTone = 'neutral' | 'cyan' | 'yellow' | 'success' | 'danger' | 'warn'

interface BadgeProps {
  tone?: BadgeTone
  className?: string
  children: ReactNode
}

/**
 * Tons sémantiques de la charte. Contraste piloté par thème : en clair, texte
 * sombre saturé sur fond translucide ; en sombre, texte clair (variante `dark:`)
 * car la même teinte foncée deviendrait illisible sur surface bleu nuit. Les fonds
 * sont plus opaques en sombre pour rester perceptibles. Ratios visés ≥ AA (4.5:1).
 */
const TONES: Record<BadgeTone, string> = {
  neutral: 'bg-surface-sunken text-text-secondary border-border',
  cyan: 'bg-[color-mix(in_oklch,var(--color-cyan)_16%,transparent)] dark:bg-[color-mix(in_oklch,var(--color-cyan)_26%,transparent)] text-cyan-700 dark:text-[#5fd6db] border-[color-mix(in_oklch,var(--color-cyan)_34%,transparent)]',
  yellow:
    'bg-[color-mix(in_oklch,var(--color-yellow)_28%,transparent)] dark:bg-[color-mix(in_oklch,var(--color-yellow)_24%,transparent)] text-[#7a4604] dark:text-[#ffd07a] border-[color-mix(in_oklch,var(--color-yellow)_48%,transparent)]',
  success:
    'bg-[color-mix(in_oklch,#22c55e_20%,transparent)] dark:bg-[color-mix(in_oklch,#22c55e_24%,transparent)] text-[#0a6b32] dark:text-[#6ee7a0] border-[color-mix(in_oklch,#22c55e_40%,transparent)]',
  danger:
    'bg-[color-mix(in_oklch,#c42b1c_20%,transparent)] dark:bg-[color-mix(in_oklch,#c42b1c_28%,transparent)] text-[#911c10] dark:text-[#ff9b8f] border-[color-mix(in_oklch,#c42b1c_40%,transparent)]',
  warn: 'bg-[color-mix(in_oklch,var(--color-yellow)_28%,transparent)] dark:bg-[color-mix(in_oklch,var(--color-yellow)_24%,transparent)] text-[#7a4604] dark:text-[#ffd07a] border-[color-mix(in_oklch,var(--color-yellow)_46%,transparent)]',
}

const BASE =
  'inline-flex items-center gap-1 px-2 h-5 text-[10px] font-semibold uppercase tracking-[0.08em] rounded-md border'

/** Pastille de statut/catégorie aux tons sémantiques de la charte. */
export function Badge({ tone = 'neutral', className, children }: BadgeProps) {
  return <span className={cn(BASE, TONES[tone], className)}>{children}</span>
}
