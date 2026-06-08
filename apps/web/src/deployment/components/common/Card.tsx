import type { ReactNode } from 'react'

import { cn } from '../../../shared/lib/cn'

interface CardProps {
  className?: string
  children: ReactNode
}

/** Conteneur visuel de la feature déploiement (surface élevée, bord charté). */
export function Card({ className, children }: CardProps) {
  return (
    <div className={cn('border-border bg-surface-elevated rounded-lg border', className)}>
      {children}
    </div>
  )
}
