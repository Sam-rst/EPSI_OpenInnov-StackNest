import { Button } from '../../shared/components/ui'

interface CatalogHeaderProps {
  count: number
}

export function CatalogHeader({ count }: CatalogHeaderProps) {
  const plural = count > 1 ? 's' : ''

  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-text-primary text-[28px] font-bold tracking-[-0.02em]">
          Catalogue de ressources
        </h1>
        <p className="text-text-secondary mt-1 text-[13.5px]">
          {count} ressource{plural} disponible{plural} · provisionnable en moins d'une minute
        </p>
      </div>
      <div className="flex items-center gap-2">
        <Button variant="secondary" icon="upload">
          Importer un module
        </Button>
        <Button variant="primary" icon="plus">
          Nouvelle ressource
        </Button>
      </div>
    </div>
  )
}
