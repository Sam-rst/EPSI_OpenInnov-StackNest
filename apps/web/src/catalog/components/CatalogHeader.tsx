import { useNavigate } from 'react-router-dom'

import { Button } from '../../shared/components/ui'
import { useIsAdmin } from '../hooks/useIsAdmin'

interface CatalogHeaderProps {
  count: number
}

/**
 * En-tête de la page catalogue : titre + compteur, et actions d'administration
 * (import, création) réservées aux admins — « Nouvelle ressource » mène à l'écran
 * d'admin du catalogue. Les non-admins ne voient pas ces actions.
 */
export function CatalogHeader({ count }: CatalogHeaderProps) {
  const plural = count > 1 ? 's' : ''
  const isAdmin = useIsAdmin()
  const navigate = useNavigate()

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
      {isAdmin && (
        <div className="flex items-center gap-2">
          <Button variant="secondary" icon="upload">
            Importer un module
          </Button>
          <Button variant="primary" icon="plus" onClick={() => navigate('/catalog/admin')}>
            Nouvelle ressource
          </Button>
        </div>
      )}
    </div>
  )
}
