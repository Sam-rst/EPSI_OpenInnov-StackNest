import { Icon } from '../../shared/components/ui'
import type { StackLinkModel } from '../types/models/Stack'

interface StackWiringRowProps {
  link: StackLinkModel
}

/**
 * Affichage **lecture seule** d'un lien (câblage) du détail d'une stack :
 * « consommateur → fournisseur » par alias, suivi des `var_mappings` résolus
 * (variable → expression). À distinguer de `StackLinkRow`, qui est l'éditeur de
 * liens du builder. Aucune valeur sensible : les expressions sont résolues
 * worker-side, sans secret.
 */
export function StackWiringRow({ link }: StackWiringRowProps) {
  const mappings = Object.entries(link.varMappings)

  return (
    <div className="border-border bg-surface-elevated rounded-md border p-3">
      <div className="text-text-primary flex items-center gap-2 text-[13px] font-medium">
        <span className="font-mono">{link.fromAlias}</span>
        <Icon name="arrow-right" size={14} className="text-cyan" />
        <span className="font-mono">{link.toAlias}</span>
      </div>
      {mappings.length > 0 && (
        <dl className="mt-2 space-y-1">
          {mappings.map(([variable, expression]) => (
            <div key={variable} className="flex items-center gap-2 text-[12px]">
              <dt className="text-text-secondary font-mono">{variable}</dt>
              <span className="text-text-muted">=</span>
              <dd className="text-text-muted font-mono">{expression}</dd>
            </div>
          ))}
        </dl>
      )}
    </div>
  )
}
