import type { Conversation } from '../../domain/models/Conversation'

interface ConversationItemProps {
  conversation: Conversation
  active: boolean
  onSelect: (id: string) => void
}

const BASE_BUTTON = 'w-full text-left p-2.5 rounded-md transition'
const ACTIVE_BUTTON = 'bg-[color-mix(in_oklch,var(--color-cyan)_10%,transparent)]'

/** Entrée de la liste des conversations récentes. */
export function ConversationItem({ conversation, active, onSelect }: ConversationItemProps) {
  return (
    <li>
      <button
        type="button"
        onClick={() => onSelect(conversation.id)}
        className={`${BASE_BUTTON} ${active ? ACTIVE_BUTTON : 'hover:bg-surface-sunken'}`}
      >
        <div
          className={`truncate text-[12.5px] font-medium ${active ? 'text-cyan' : 'text-text-primary'}`}
        >
          {conversation.title}
        </div>
        <div className="text-text-muted mt-0.5 text-[10.5px]">{conversation.updatedLabel}</div>
      </button>
    </li>
  )
}
