import { Button } from '../../../shared/components/ui'
import type { Conversation } from '../../types/models/Conversation'
import { ConversationItem } from './ConversationItem'

interface ConversationsSidebarProps {
  conversations: readonly Conversation[]
  activeId: string | undefined
  loading: boolean
  onSelect: (id: string) => void
  onCreate: () => void
  onRename: (id: string, currentTitle: string) => void
  onDelete: (id: string) => void
}

/**
 * Colonne de gauche (260px) : création + liste des fils de discussion. Pilotée
 * par des modèles `Conversation` et des callbacks ; aucune logique de données.
 */
export function ConversationsSidebar({
  conversations,
  activeId,
  loading,
  onSelect,
  onCreate,
  onRename,
  onDelete,
}: ConversationsSidebarProps) {
  return (
    <aside className="border-border bg-surface-elevated flex h-full flex-col border-r">
      <div className="p-3">
        <Button variant="cyan" icon="plus" className="w-full" onClick={onCreate}>
          Nouvelle conversation
        </Button>
      </div>

      <div className="text-text-muted mb-1.5 px-3 font-mono text-[10px] tracking-[0.14em] uppercase">
        Récentes
      </div>

      {loading && (
        <p className="text-text-muted px-3 text-[12px]" role="status" aria-live="polite">
          Chargement des conversations…
        </p>
      )}

      {!loading && conversations.length === 0 && (
        <p className="text-text-muted px-3 text-[12px]">
          Aucune conversation pour l'instant. Démarres-en une nouvelle.
        </p>
      )}

      <ul className="flex-1 space-y-0.5 overflow-y-auto px-2">
        {conversations.map((conversation) => (
          <ConversationItem
            key={conversation.id}
            conversation={conversation}
            active={conversation.id === activeId}
            onSelect={onSelect}
            onRename={onRename}
            onDelete={onDelete}
          />
        ))}
      </ul>
    </aside>
  )
}
