import { Icon } from '../../shared/components/ui'

/** État d'erreur honnête affiché quand le chargement du catalogue échoue. */
export function CatalogError() {
  return (
    <div className="border-error/40 text-text-muted rounded-lg border border-dashed py-20 text-center">
      <Icon name="cloud-off" size={28} className="text-error mx-auto mb-3 opacity-70" />
      <div className="text-text-secondary text-[13.5px] font-medium">Catalogue indisponible</div>
      <div className="mt-1 text-[12px]">
        Impossible de charger le catalogue pour le moment. Réessaie dans un instant.
      </div>
    </div>
  )
}
