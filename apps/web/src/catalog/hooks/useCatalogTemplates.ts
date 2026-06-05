import { useEffect, useState } from 'react'

import type { CatalogItem } from '../domain/models/CatalogItem'
import { listTemplates } from '../services/templateService'

interface UseCatalogTemplatesResult {
  items: readonly CatalogItem[]
  loading: boolean
}

/**
 * Charge le catalogue via le seam `templateService`.
 * Vague 1 : résolution instantanée des fixtures.
 * Vague 2 : l'appel API passera par le même seam, sans changer ce hook.
 */
export function useCatalogTemplates(): UseCatalogTemplatesResult {
  const [items, setItems] = useState<readonly CatalogItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true

    void listTemplates().then((data) => {
      if (active) {
        setItems(data)
        setLoading(false)
      }
    })

    return () => {
      active = false
    }
  }, [])

  return { items, loading }
}
