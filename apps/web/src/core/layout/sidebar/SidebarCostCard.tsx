import { Icon } from '../../../shared/components/ui'

interface SidebarCostCardProps {
  /** Montant dépensé ce mois, en euros. */
  amount: number
  /** Variation vs. mois précédent, en pourcentage signé (ex. 8 = +8 %). */
  changePercent: number
  /** Part du budget consommée, en pourcentage (largeur de la barre). */
  budgetPercent: number
}

/** Préfixe explicite du signe : "+8" pour une hausse, "-5" pour une baisse. */
const formatChange = (changePercent: number): string => {
  const sign = changePercent >= 0 ? '+' : ''
  return `${sign}${changePercent} % vs. mois dernier`
}

/**
 * Carte récapitulative du coût mensuel en pied de Sidebar. Les données
 * proviennent du seam `useMonthlyCost` via la Sidebar conteneur.
 */
export function SidebarCostCard({ amount, changePercent, budgetPercent }: SidebarCostCardProps) {
  return (
    <div className="border-border bg-surface m-3 rounded-md border p-3.5">
      <div className="flex items-center justify-between">
        <span className="text-text-primary text-[11.5px] font-semibold">Coût ce mois</span>
        <Icon name="trending-up" size={13} className="text-success" />
      </div>
      <p className="text-text-primary mt-1 font-mono text-[20px] font-bold">{amount}&nbsp;€</p>
      <p className="text-text-muted mt-1 text-[11px]">{formatChange(changePercent)}</p>
      <div
        role="progressbar"
        aria-label="Budget consommé"
        aria-valuenow={budgetPercent}
        aria-valuemin={0}
        aria-valuemax={100}
        className="bg-surface-sunken mt-2.5 h-1.5 overflow-hidden rounded-full"
      >
        <div className="bg-cyan h-full" style={{ width: `${budgetPercent}%` }} />
      </div>
    </div>
  )
}
