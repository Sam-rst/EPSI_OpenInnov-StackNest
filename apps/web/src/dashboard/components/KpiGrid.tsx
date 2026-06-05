import { KpiCard } from './KpiCard'

interface KpiDescriptor {
  label: string
  value: string
  icon: string
}

/**
 * Indicateurs du dashboard en état honnête : valeurs à zéro tant que l'API
 * dashboard n'est pas branchée (Vague 2). Ce ne sont pas des données métier
 * fictives — juste les libellés FR de la grille et les zéros structurels.
 */
const KPIS: readonly KpiDescriptor[] = [
  { label: 'Ressources actives', value: '0', icon: 'layers' },
  { label: 'Coût ce mois', value: '0 €', icon: 'wallet' },
  { label: 'Déploiements / 24h', value: '0', icon: 'rocket' },
  { label: 'Échecs (7j)', value: '0', icon: 'alert-triangle' },
]

/** Grille responsive des 4 indicateurs clés (2 colonnes mobile → 4 desktop). */
export function KpiGrid() {
  return (
    <div className="mb-5 grid grid-cols-2 gap-4 lg:grid-cols-4">
      {KPIS.map((kpi) => (
        <KpiCard key={kpi.label} label={kpi.label} value={kpi.value} icon={kpi.icon} />
      ))}
    </div>
  )
}
