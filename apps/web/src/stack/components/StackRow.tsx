import type { ChangeEvent, KeyboardEvent, MouseEvent } from 'react'
import { useNavigate } from 'react-router-dom'

import { Badge, Icon } from '../../shared/components/ui'
import { toneForStackStatus } from '../types/enums/StackStatus'
import type { StackSummary } from '../types/models/Stack'
import { formatStackDate } from './formatStackDate'

interface StackRowProps {
  stack: StackSummary
  selected: boolean
  onToggleSelect: (id: string) => void
}

/** Touches qui activent un lien accessible (parité avec un clic). */
const ACTIVATION_KEYS: ReadonlySet<string> = new Set(['Enter', ' '])

/**
 * Ligne de la table des stacks : sélection · nom · nb de services · statut · date.
 * Toute la ligne est un lien accessible vers le détail (clic + clavier Enter/Espace) ;
 * la case à cocher de tête, elle, ne déclenche pas la navigation (sélection isolée).
 */
export function StackRow({ stack, selected, onToggleSelect }: StackRowProps) {
  const navigate = useNavigate()
  const detailPath = `/stacks/${stack.id}`
  const serviceLabel = stack.serviceCount > 1 ? 'services' : 'service'

  function goToDetail() {
    navigate(detailPath)
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTableRowElement>) {
    if (ACTIVATION_KEYS.has(event.key)) {
      event.preventDefault()
      goToDetail()
    }
  }

  function handleSelect(event: ChangeEvent<HTMLInputElement> | MouseEvent) {
    event.stopPropagation()
    onToggleSelect(stack.id)
  }

  return (
    <tr
      role="link"
      tabIndex={0}
      aria-label={`Voir la stack ${stack.name}`}
      onClick={goToDetail}
      onKeyDown={handleKeyDown}
      className="border-border hover:bg-surface-sunken focus-visible:ring-cyan cursor-pointer border-t transition outline-none focus-visible:ring-2 focus-visible:ring-inset"
    >
      <td className="w-10 px-4 py-3" onClick={(event) => event.stopPropagation()}>
        <input
          type="checkbox"
          checked={selected}
          onChange={handleSelect}
          aria-label={`Sélectionner la stack ${stack.name}`}
          className="accent-cyan h-4 w-4 cursor-pointer align-middle"
        />
      </td>
      <td className="px-4 py-3">
        <span className="text-text-primary inline-flex items-center gap-2 font-medium">
          <Icon name="layers" size={15} className="text-cyan" />
          {stack.name}
        </span>
      </td>
      <td className="text-text-secondary px-4 py-3 text-[12px]">
        {stack.serviceCount} {serviceLabel}
      </td>
      <td className="px-4 py-3">
        <Badge tone={toneForStackStatus(stack.status)}>{stack.statusLabel}</Badge>
      </td>
      <td className="text-text-muted px-4 py-3 text-[12px]">{formatStackDate(stack.createdAt)}</td>
      <td className="px-4 py-3 text-right">
        <span className="text-cyan inline-flex items-center gap-1 text-[12.5px] font-medium">
          Voir
          <Icon name="arrow-right" size={13} />
        </span>
      </td>
    </tr>
  )
}
