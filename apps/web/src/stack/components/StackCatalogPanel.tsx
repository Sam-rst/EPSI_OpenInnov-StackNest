import { CatalogCard } from '../../catalog/components/CatalogCard'
import type { CatalogItem } from '../../catalog/domain/models/CatalogItem'
import { EngineKind } from '../../catalog/types/enums/EngineKind'
import { useCatalogTemplates } from '../../catalog/hooks/useCatalogTemplates'
import { Icon } from '../../shared/components/ui'

interface StackCatalogPanelProps {
  /** Appelé quand l'utilisateur ajoute un template à la stack (clic carte). */
  onAdd: (item: CatalogItem) => void
}

/**
 * Volet catalogue du builder : réutilise `CatalogCard` mais ne propose que les
 * templates **Docker actifs** (les Terraform bloqués ne sont pas composables en
 * stack — cf. design § Builder). Le clic sur une carte ajoute le service à la
 * composition en cours via `onAdd`.
 */
export function StackCatalogPanel({ onAdd }: StackCatalogPanelProps) {
  const { items, loading, isError } = useCatalogTemplates()
  const dockerItems = items.filter((item) => item.engine === EngineKind.DOCKER)

  return (
    <aside className="border-border bg-surface-elevated flex flex-col rounded-lg border">
      <header className="border-border flex items-center gap-2 border-b px-4 py-3">
        <Icon name="layout-grid" size={15} className="text-cyan" />
        <span className="text-text-primary text-[13px] font-semibold">Catalogue</span>
      </header>
      <div className="space-y-3 overflow-y-auto p-4" style={{ maxHeight: 640 }}>
        {loading && <p className="text-text-muted text-[12.5px]">Chargement du catalogue…</p>}
        {!loading && isError && (
          <p className="text-error text-[12.5px]">Impossible de charger le catalogue.</p>
        )}
        {!loading && !isError && dockerItems.length === 0 && (
          <p className="text-text-muted text-[12.5px]">Aucun service Docker disponible.</p>
        )}
        {!loading &&
          !isError &&
          dockerItems.map((item) => <CatalogCard key={item.id} item={item} onSelect={onAdd} />)}
      </div>
    </aside>
  )
}
