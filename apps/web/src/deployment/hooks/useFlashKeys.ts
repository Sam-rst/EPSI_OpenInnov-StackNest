import { useEffect, useRef, useState } from 'react'

/** Durée (ms) du flash d'une ligne après changement de sa source. */
const FLASH_DURATION_MS = 700

/**
 * Maintient l'ensemble des clés « flashées » : quand une dépendance change, sa
 * clé est ajoutée puis retirée après un court délai. Pilote l'effet flash live
 * de l'aperçu Docker (repris du mockup, adapté). Les clés sont signées par une
 * empreinte sérialisée des dépendances.
 */
export function useFlashKeys(deps: Record<string, unknown>): ReadonlySet<string> {
  const [flashed, setFlashed] = useState<ReadonlySet<string>>(new Set())
  const previousRef = useRef<Record<string, string>>({})

  const signature = JSON.stringify(deps)

  useEffect(() => {
    const current: Record<string, string> = {}
    const changedKeys: string[] = []

    for (const key of Object.keys(deps)) {
      const serialized = JSON.stringify(deps[key])
      current[key] = serialized
      if (previousRef.current[key] !== undefined && previousRef.current[key] !== serialized) {
        changedKeys.push(key)
      }
    }
    previousRef.current = current

    if (changedKeys.length === 0) {
      return
    }

    // setState piloté depuis des callbacks (jamais synchrone en effet) : ajout
    // immédiat puis retrait différé du flash.
    const addTimer = setTimeout(() => {
      setFlashed((previous) => new Set([...previous, ...changedKeys]))
    }, 0)
    const removeTimer = setTimeout(() => {
      setFlashed((previous) => {
        const next = new Set(previous)
        for (const key of changedKeys) {
          next.delete(key)
        }
        return next
      })
    }, FLASH_DURATION_MS)

    return () => {
      clearTimeout(addTimer)
      clearTimeout(removeTimer)
    }
    // L'empreinte sérialisée capture tous les changements de `deps`.
  }, [signature]) // eslint-disable-line react-hooks/exhaustive-deps

  return flashed
}
