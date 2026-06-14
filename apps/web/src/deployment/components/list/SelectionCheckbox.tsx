import type { MouseEvent } from 'react'

import { Checkbox } from '../../../shared/components/ui'

interface SelectionCheckboxProps {
  checked: boolean
  /** Affiche l'état indéterminé (sélection partielle) sur la case d'en-tête. */
  indeterminate?: boolean
  onChange: () => void
  /** Libellé accessible (lecteurs d'écran), masqué visuellement. */
  label: string
}

/**
 * Case à cocher de sélection d'une ligne/carte de déploiement. S'appuie sur la
 * primitive `Checkbox` de la charte (affordance, focus, indéterminé). Stoppe la
 * propagation du clic pour ne pas déclencher la navigation de la ligne cliquable
 * (la ligne reste un lien, la case sélectionne).
 */
export function SelectionCheckbox({
  checked,
  indeterminate = false,
  onChange,
  label,
}: SelectionCheckboxProps) {
  // Empêche le clic de remonter à la ligne cliquable parente (navigation).
  function stopBubbling(event: MouseEvent<HTMLInputElement>) {
    event.stopPropagation()
  }

  return (
    <Checkbox
      checked={checked}
      indeterminate={indeterminate}
      aria-label={label}
      onChange={onChange}
      onClick={stopBubbling}
    />
  )
}
