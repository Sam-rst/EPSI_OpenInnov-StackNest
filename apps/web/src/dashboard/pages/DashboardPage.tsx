import { useNavigate } from 'react-router-dom'

import { EmptyState } from '../../shared/components/EmptyState'
import { DashboardHeader } from '../components/DashboardHeader'
import { DashboardSection } from '../components/DashboardSection'
import { KpiGrid } from '../components/KpiGrid'

/**
 * Page d'accueil / dashboard — coquille display-only (Vague 1). Reproduit la
 * structure du mockup (en-tête, grille KPI, sections « Ressources actives » et
 * « Activité récente ») en états honnêtes : KPI à zéro et EmptyState explicites,
 * sans aucune donnée ni identité fictive. Le branchement des métriques réelles
 * (API dashboard, hook React Query) relève d'un ticket dédié et bloqué.
 */
export function DashboardPage() {
  const navigate = useNavigate()
  const browseCatalog = () => {
    navigate('/catalog')
  }

  return (
    <div className="mx-auto max-w-[1400px]">
      <DashboardHeader onBrowseCatalog={browseCatalog} />
      <KpiGrid />
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[1fr_340px]">
        <DashboardSection title="Ressources actives">
          <EmptyState
            icon="layers"
            title="Aucune ressource déployée"
            description="Provisionne ta première ressource pour la voir apparaître ici."
            actionLabel="Parcourir le catalogue"
            onAction={browseCatalog}
          />
        </DashboardSection>
        <DashboardSection title="Activité récente">
          <EmptyState
            icon="activity"
            title="Aucune activité récente"
            description="Les actions de ton équipe s'afficheront ici dès le premier déploiement."
          />
        </DashboardSection>
      </div>
    </div>
  )
}
