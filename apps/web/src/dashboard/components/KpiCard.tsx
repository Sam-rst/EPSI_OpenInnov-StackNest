import { Icon } from '../../shared/components/ui'

interface KpiCardProps {
  /** Libellé de l'indicateur (ex. « Ressources actives »). */
  label: string
  /** Valeur formatée prête à afficher (ex. « 0 », « 0 € »). */
  value: string
  /** Nom d'icône lucide en kebab-case (ex. « layers », « wallet »). */
  icon: string
}

/**
 * Carte d'indicateur clé du dashboard, en état honnête (valeur à zéro tant que
 * l'API dashboard n'est pas branchée). Volontairement sans variation/delta : on
 * n'invente aucune tendance avant d'avoir des données réelles.
 */
export function KpiCard({ label, value, icon }: KpiCardProps) {
  return (
    <div className="border-border bg-surface-elevated rounded-lg border p-5">
      <div className="flex items-center justify-between">
        <span className="text-text-muted font-mono text-[11px] tracking-[0.14em] uppercase">
          {label}
        </span>
        <span className="text-cyan flex h-7 w-7 items-center justify-center rounded-md bg-[color-mix(in_oklch,var(--color-cyan)_14%,transparent)]">
          <Icon name={icon} size={13} />
        </span>
      </div>
      <div className="text-text-primary mt-2 text-[36px] font-bold tracking-[-0.025em]">
        {value}
      </div>
    </div>
  )
}
