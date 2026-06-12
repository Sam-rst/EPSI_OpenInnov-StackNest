import { useCallback, useMemo, useState } from 'react'

/** Modèle de sélection multiple de la liste des déploiements. */
export interface DeploymentSelection {
  /** Ids actuellement sélectionnés (ordre non garanti). */
  selectedIds: readonly string[]
  /** Nombre de déploiements sélectionnés. */
  count: number
  /** Tous les ids visibles sont sélectionnés (et il y en a au moins un). */
  allSelected: boolean
  /** Sélection partielle (≥ 1 mais pas tous) → case d'en-tête indéterminée. */
  someSelected: boolean
  /** Indique si un id donné est sélectionné. */
  isSelected: (id: string) => boolean
  /** Bascule l'appartenance d'un id à la sélection. */
  toggle: (id: string) => void
  /** Sélectionne tous les ids visibles. */
  selectAll: () => void
  /** Vide la sélection. */
  clear: () => void
  /** Bascule entre « tout sélectionné » et « rien sélectionné ». */
  toggleAll: () => void
}

/**
 * Gère la sélection multiple d'une liste de déploiements via un `Set` d'ids.
 *
 * La sélection est dérivée des `visibleIds` à chaque rendu (intersection) : tout
 * id disparu de la liste (déploiement détruit, filtré, page rafraîchie) est ignoré
 * sans effet ni setState, pour ne jamais agir sur une cible absente. La case
 * d'en-tête « tout sélectionner » distingue trois états : vide, indéterminé
 * (partiel), coché.
 */
export function useDeploymentSelection(visibleIds: readonly string[]): DeploymentSelection {
  const [selected, setSelected] = useState<ReadonlySet<string>>(() => new Set())

  // Sélection effective : intersection de l'état et des ids encore visibles.
  const effective = useMemo(() => {
    const visible = new Set(visibleIds)
    return new Set([...selected].filter((id) => visible.has(id)))
  }, [selected, visibleIds])

  const isSelected = useCallback((id: string) => effective.has(id), [effective])

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

  const selectAll = useCallback(() => {
    setSelected(new Set(visibleIds))
  }, [visibleIds])

  const clear = useCallback(() => {
    setSelected(new Set())
  }, [])

  const count = effective.size
  const allSelected = visibleIds.length > 0 && count === visibleIds.length
  const someSelected = count > 0 && !allSelected

  const toggleAll = useCallback(() => {
    if (allSelected) {
      clear()
    } else {
      selectAll()
    }
  }, [allSelected, clear, selectAll])

  const selectedIds = useMemo(() => [...effective], [effective])

  return {
    selectedIds,
    count,
    allSelected,
    someSelected,
    isSelected,
    toggle,
    selectAll,
    clear,
    toggleAll,
  }
}
