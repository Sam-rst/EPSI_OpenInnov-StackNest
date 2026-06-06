import { RequireAdmin } from '../components/admin/RequireAdmin'
import { CatalogAdminContent } from './CatalogAdminContent'

/** Écran d'administration du catalogue, réservé aux administrateurs. */
export function CatalogAdminPage() {
  return (
    <RequireAdmin>
      <CatalogAdminContent />
    </RequireAdmin>
  )
}
