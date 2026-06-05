import { Button } from '../../shared/components/ui'

interface DashboardHeaderProps {
  /** Navigation vers le catalogue (seule action honnête tant qu'il n'y a rien à exporter). */
  onBrowseCatalog: () => void
}

/**
 * En-tête du dashboard : titre + sous-titre neutre (aucun nom de workspace ni
 * période inventés) et CTA unique vers le catalogue. L'export CSV / nouveau
 * déploiement du mockup sont volontairement absents : rien à exporter en l'état.
 */
export function DashboardHeader({ onBrowseCatalog }: DashboardHeaderProps) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-text-primary text-[28px] font-bold tracking-[-0.02em]">
          Tableau de bord
        </h1>
        <p className="text-text-secondary mt-1 text-[13.5px]">
          Vue d'ensemble de tes ressources et de ton activité
        </p>
      </div>
      <Button variant="primary" icon="plus" onClick={onBrowseCatalog}>
        Parcourir le catalogue
      </Button>
    </div>
  )
}
