import { CATALOG_ITEMS } from '../data/catalog.fixtures'
import type { CatalogItem } from '../domain/models/CatalogItem'

/**
 * Seam d'accès au catalogue (contract-first).
 *
 * Vague 1 (rendu) : sert les fixtures locales.
 * Vague 2 (backend) : cette implémentation basculera sur l'appel API
 *   (`GET /catalog/templates` + mapper DTO → CatalogItem) sans changer la
 *   signature — la page et le hook restent inchangés.
 */
export function listTemplates(): Promise<readonly CatalogItem[]> {
  return Promise.resolve(CATALOG_ITEMS)
}
