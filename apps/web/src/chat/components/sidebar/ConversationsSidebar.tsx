import { Button } from '../../../shared/components/ui'
import type { Conversation } from '../../domain/models/Conversation'
import { ConversationItem } from './ConversationItem'

interface ConversationsSidebarProps {
  conversations: readonly Conversation[]
  activeId: string | null
  onSelect: (id: string) => void
}

/**
 * Barre latérale des conversations. Display-only : aucune conversation n'est
 * fabriquée — la liste vide affiche un état vide honnête.
 */
export function ConversationsSidebar({
  conversations,
  activeId,
  onSelect,
}: ConversationsSidebarProps) {
  const hasConversations = conversations.length > 0

  return (
    <aside className="border-border bg-surface-elevated flex flex-col border-r">
      <div className="p-3">
        <Button variant="primary" icon="plus" className="w-full">
          Nouvelle conversation
        </Button>
      </div>
      <div className="text-text-muted mb-1.5 px-3 font-mono text-[10px] tracking-[0.14em] uppercase">
        Récentes
      </div>
      {hasConversations ? (
        <ul className="flex-1 space-y-0.5 overflow-y-auto px-2">
          {conversations.map((conversation) => (
            <ConversationItem
              key={conversation.id}
              conversation={conversation}
              active={activeId === conversation.id}
              onSelect={onSelect}
            />
          ))}
        </ul>
      ) : (
        <p className="text-text-muted flex-1 px-3 text-[12px] leading-relaxed">
          Aucune conversation
        </p>
      )}
    </aside>
  )
}
