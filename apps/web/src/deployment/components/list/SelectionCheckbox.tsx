import { useEffect, useRef, type MouseEvent } from 'react'

interface SelectionCheckboxProps {
  checked: boolean
  /** Affiche l'état indéterminé (sélection partielle) sur la case d'en-tête. */
  indeterminate?: boolean
  onChange: () => void
  /** Libellé accessible (lecteurs d'écran), masqué visuellement. */
  label: string
}

/**
 * Case à cocher de sélection d'une ligne/carte de déploiement. Stoppe la
 * propagation du clic pour ne pas déclencher la navigation de la ligne cliquable
 * (la ligne reste un lien, la case sélectionne). Gère l'état indéterminé pour la
 * case d'en-tête « tout sélectionner ».
 */
export function SelectionCheckbox({
  checked,
  indeterminate = false,
  onChange,
  label,
}: SelectionCheckboxProps) {
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.indeterminate = indeterminate
    }
  }, [indeterminate])

  // Empêche le clic (et le mousedown du drag de focus) de remonter à la ligne.
  function stopBubbling(event: MouseEvent<HTMLElement>) {
    event.stopPropagation()
  }

  return (
    <input
      ref={inputRef}
      type="checkbox"
      checked={checked}
      aria-label={label}
      onChange={onChange}
      onClick={stopBubbling}
      className="accent-cyan border-border focus-visible:ring-cyan h-4 w-4 cursor-pointer rounded outline-none focus-visible:ring-2"
    />
  )
}
