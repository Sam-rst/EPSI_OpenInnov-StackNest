import { Badge, Icon } from '../../shared/components/ui'
import { cn } from '../../shared/lib/cn'
import type { CatalogItem } from '../domain/models/CatalogItem'
import { EngineKind } from '../types/enums/EngineKind'

interface CatalogCardProps {
  item: CatalogItem
  onSelect: (item: CatalogItem) => void
}

const CARD_BASE = 'relative w-full text-left rounded-lg border p-5 transition'

const CARD_ACTIVE =
  'group border-border bg-surface-elevated hover:border-cyan hover:-translate-y-0.5 hover:shadow-[0_12px_30px_-14px_rgba(13,146,151,0.4)]'

const CARD_BLOCKED = 'border-border bg-surface-elevated opacity-60 cursor-not-allowed'

const TERRAFORM_TOOLTIP = 'Déploiements Terraform bientôt disponibles'
const NOT_DEPLOYABLE_TOOLTIP = 'Déploiement bientôt disponible'

interface BlockState {
  blocked: boolean
  /** Tooltip explicatif, présent uniquement quand la carte est bloquée. */
  tooltip?: string
}

/**
 * Détermine si la carte est bloquée et pourquoi. Deux raisons distinctes, chacune
 * avec son tooltip : moteur Terraform (pas encore supporté) ou template marqué
 * non déployable (runtime langage). Le moteur prime sur le flag (message le plus
 * spécifique à la nature de la ressource).
 */
function resolveBlock(item: CatalogItem): BlockState {
  if (item.engine === EngineKind.TERRAFORM) {
    return { blocked: true, tooltip: TERRAFORM_TOOLTIP }
  }
  if (!item.deployable) {
    return { blocked: true, tooltip: NOT_DEPLOYABLE_TOOLTIP }
  }
  return { blocked: false }
}

export function CatalogCard({ item, onSelect }: CatalogCardProps) {
  const { blocked: isBlocked, tooltip } = resolveBlock(item)

  return (
    <button
      type="button"
      onClick={isBlocked ? undefined : () => onSelect(item)}
      disabled={isBlocked}
      aria-disabled={isBlocked}
      title={tooltip}
      className={cn(CARD_BASE, isBlocked ? CARD_BLOCKED : CARD_ACTIVE)}
    >
      {isBlocked && (
        <span className="absolute top-3 right-3 z-10">
          <Badge tone="warn">Bientôt disponible</Badge>
        </span>
      )}
      <div className="flex items-start gap-3">
        <span className="text-cyan flex h-11 w-11 shrink-0 items-center justify-center rounded-md bg-[color-mix(in_oklch,var(--color-cyan)_14%,transparent)]">
          <Icon name={item.icon} size={20} />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <div className="text-text-primary min-w-0 text-[14.5px] font-semibold break-words">
              {item.name}
            </div>
            {item.popular && (
              <Badge tone="yellow" className="shrink-0">
                Populaire
              </Badge>
            )}
          </div>
          <div className="text-text-muted mt-0.5 truncate text-[11.5px]">
            {item.category} · via {item.provider}
          </div>
        </div>
        {!isBlocked && (
          <Icon
            name="arrow-up-right"
            size={14}
            className="text-cyan shrink-0 opacity-0 transition group-hover:opacity-100"
          />
        )}
      </div>
      <p className="text-text-secondary mt-3 text-[13px] leading-relaxed">{item.description}</p>
      <div className="mt-4 flex items-center justify-between gap-2">
        <div className="flex min-w-0 flex-wrap items-center gap-1.5">
          {item.tags.map((tag) => (
            <Badge key={tag} tone="neutral">
              {tag}
            </Badge>
          ))}
        </div>
        {isBlocked ? (
          <span className="text-text-muted shrink-0 text-[12px] font-medium whitespace-nowrap">
            Indisponible
          </span>
        ) : (
          <span className="text-cyan shrink-0 text-[12px] font-medium whitespace-nowrap">
            Configurer →
          </span>
        )}
      </div>
    </button>
  )
}
