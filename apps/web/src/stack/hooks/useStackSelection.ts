import { useCallback, useMemo, useState } from 'react'

interface UseStackSelectionResult {
  /** Identifiants sélectionnés présents dans la liste, dans son ordre. */
  selectedIds: readonly string[]
  selectedCount: number
  /** Vrai si tous les identifiants disponibles sont sélectionnés (liste non vide). */
  allSelected: boolean
  isSelected: (id: string) => boolean
  toggle: (id: string) => void
  /** Sélectionne tout si incomplet, sinon vide la sélection. */
  toggleAll: () => void
  clear: () => void
}

/**
 * Sélection multiple pour les actions groupées de la liste des stacks. Maintient
 * un ensemble d'identifiants cochés mais ne l'expose qu'**intersecté** avec la
 * liste disponible : les stacks disparues (ex. après une destruction en masse)
 * sont ignorées à la lecture, sans jamais cibler une ressource inexistante — pas
 * d'effet de synchronisation nécessaire.
 */
export function useStackSelection(availableIds: readonly string[]): UseStackSelectionResult {
  const [selected, setSelected] = useState<ReadonlySet<string>>(() => new Set())

  const toggle = useCallback((id: string) => {
    setSelected((current) => {
      const next = new Set(current)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }, [])

  const allSelected = availableIds.length > 0 && availableIds.every((id) => selected.has(id))

  const toggleAll = useCallback(() => {
    setSelected((current) => {
      const everySelected = availableIds.length > 0 && availableIds.every((id) => current.has(id))
      return everySelected ? new Set() : new Set(availableIds)
    })
  }, [availableIds])

  const clear = useCallback(() => setSelected(new Set()), [])

  const selectedIds = useMemo(
    () => availableIds.filter((id) => selected.has(id)),
    [availableIds, selected],
  )

  return {
    selectedIds,
    selectedCount: selectedIds.length,
    allSelected,
    isSelected: (id: string) => selected.has(id),
    toggle,
    toggleAll,
    clear,
  }
}
