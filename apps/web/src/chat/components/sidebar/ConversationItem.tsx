import { Icon } from '../../../shared/components/ui'
import { cn } from '../../../shared/lib/cn'
import type { Conversation } from '../../types/models/Conversation'
import { displayConversationTitle } from './conversationTitle'

interface ConversationItemProps {
  conversation: Conversation
  active: boolean
  onSelect: (id: string) => void
  onRename: (id: string, currentTitle: string) => void
  onDelete: (id: string) => void
}

const BASE_ROW = 'group relative w-full rounded-md p-2.5 text-left transition'
const ACTIVE_ROW = 'bg-[color-mix(in_oklch,var(--color-cyan)_10%,transparent)]'

/**
 * Ligne de fil dans la sidebar : sélection au clic, actions renommer/supprimer
 * révélées au survol. Reçoit un modèle `Conversation`, jamais un DTO.
 */
export function ConversationItem({
  conversation,
  active,
  onSelect,
  onRename,
  onDelete,
}: ConversationItemProps) {
  // D3 : libellé dérivé (titre du 1er message, tronqué) ou repli « Nouvelle
  // conversation ». Le titre brut reste utilisé pour renommer (préremplissage).
  const title = displayConversationTitle(conversation.title)

  return (
    <li className={cn(BASE_ROW, active ? ACTIVE_ROW : 'hover:bg-surface-sunken')}>
      <button
        type="button"
        onClick={() => onSelect(conversation.id)}
        className="block w-full pr-12 text-left"
      >
        <span
          className={cn(
            'block truncate text-[12.5px] font-medium',
            active ? 'text-cyan' : 'text-text-primary',
          )}
        >
          {title}
        </span>
        <span className="text-text-muted mt-0.5 block text-[10.5px]">
          {conversation.relativeWhen}
        </span>
      </button>

      <div className="absolute top-2 right-1.5 flex items-center gap-0.5 opacity-0 transition group-hover:opacity-100 focus-within:opacity-100">
        <button
          type="button"
          aria-label={`Renommer « ${title} »`}
          onClick={() => onRename(conversation.id, conversation.title)}
          className="text-text-muted hover:text-cyan hover:bg-surface inline-flex h-6 w-6 items-center justify-center rounded"
        >
          <Icon name="pencil" size={13} />
        </button>
        <button
          type="button"
          aria-label={`Supprimer « ${title} »`}
          onClick={() => onDelete(conversation.id)}
          className="text-text-muted hover:text-error hover:bg-surface inline-flex h-6 w-6 items-center justify-center rounded"
        >
          <Icon name="trash-2" size={13} />
        </button>
      </div>
    </li>
  )
}
