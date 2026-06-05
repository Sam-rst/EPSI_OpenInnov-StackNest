import { Icon } from '../../shared/components/ui'

export function CatalogEmpty() {
  return (
    <div className="border-border text-text-muted rounded-lg border border-dashed py-20 text-center">
      <Icon name="search-x" size={28} className="mx-auto mb-3 opacity-60" />
      <div className="text-text-secondary text-[13.5px] font-medium">
        Aucune ressource ne correspond.
      </div>
      <div className="mt-1 text-[12px]">Essaie d'élargir tes filtres ou demande au ChatOps.</div>
    </div>
  )
}
