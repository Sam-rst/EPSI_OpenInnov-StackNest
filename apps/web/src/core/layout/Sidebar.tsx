import { useMonthlyCost } from '../../dashboard/hooks/useMonthlyCost'
import { useCurrentWorkspace } from '../../workspace/hooks/useCurrentWorkspace'
import { cn } from '../../shared/lib/cn'
import { SidebarCostCard } from './sidebar/SidebarCostCard'
import { SidebarHeader } from './sidebar/SidebarHeader'
import { SidebarNav } from './sidebar/SidebarNav'
import { WorkspaceSwitcher } from './sidebar/WorkspaceSwitcher'

interface SidebarProps {
  isOpen: boolean
  onDismiss: () => void
}

/**
 * Navigation latérale du shell : en-tête de marque, sélecteur d'espace, items
 * groupés (Plateforme / Administration) et carte de coût. Colonne pleine hauteur
 * sur desktop ; drawer glissant contrôlé par le burger de la TopBar sous 768px.
 *
 * Le `<nav>` racine est l'unique landmark de navigation du shell (les sections
 * internes sont de simples groupes), ce qui garde l'arbre a11y lisible.
 */
export function Sidebar({ isOpen, onDismiss }: SidebarProps) {
  const workspace = useCurrentWorkspace()
  const cost = useMonthlyCost()

  return (
    <>
      {/* Overlay mobile derrière le drawer — masqué au-delà de 768px. */}
      {isOpen && (
        <button
          type="button"
          aria-label="Fermer la navigation"
          onClick={onDismiss}
          className="fixed inset-0 z-30 bg-black/30 md:hidden"
        />
      )}
      <nav
        id="app-sidebar"
        role="navigation"
        aria-label="Navigation principale"
        data-open={isOpen}
        className={cn(
          'bg-surface-elevated border-border fixed inset-y-0 left-0 z-40 flex w-60 -translate-x-full flex-col border-r transition-transform duration-200 ease-out',
          'data-[open=true]:translate-x-0 md:static md:translate-x-0',
        )}
      >
        <SidebarHeader />
        <WorkspaceSwitcher
          name={workspace.name}
          plan={workspace.plan}
          initials={workspace.initials}
        />
        <SidebarNav onNavigate={onDismiss} />
        <SidebarCostCard
          amount={cost.amount}
          changePercent={cost.changePercent}
          budgetPercent={cost.budgetPercent}
        />
      </nav>
    </>
  )
}
