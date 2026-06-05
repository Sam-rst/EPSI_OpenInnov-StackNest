import type { ReactNode } from 'react'

interface DashboardSectionProps {
  /** Titre de la section affiché en heading de niveau 2. */
  title: string
  /** Corps de la section (état vide, liste, tableau…). */
  children: ReactNode
}

/**
 * Carte de section du dashboard : un titre de niveau 2 + son corps. Sert de
 * conteneur cohérent (charte) pour « Ressources actives » et « Activité
 * récente », chacune rendant un EmptyState tant qu'il n'y a pas de données.
 */
export function DashboardSection({ title, children }: DashboardSectionProps) {
  return (
    <section className="border-border bg-surface-elevated rounded-lg border p-5">
      <h2 className="text-text-primary mb-4 text-[15px] font-semibold tracking-tight">{title}</h2>
      {children}
    </section>
  )
}
