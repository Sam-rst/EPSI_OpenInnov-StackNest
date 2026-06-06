import { Icon } from '../../shared/components/ui'
import { ChatComposer } from '../components/composer/ChatComposer'
import { MessageList } from '../components/messages/MessageList'
import { ConversationsSidebar } from '../components/sidebar/ConversationsSidebar'
import { TerraformAside } from '../components/TerraformAside'
import { useChat } from '../hooks/useChat'

/**
 * Page Chat (ChatOps) — display-only.
 *
 * Reproduit fidèlement la mise en page du mockup (sidebar conversations · zone
 * messages + composer · aperçu Terraform) MAIS avec des états vides honnêtes :
 * aucune fausse conversation, aucun faux message d'IA, aucune fausse identité.
 * Le composer est rendu mais aucun envoi réel ni appel LLM n'a lieu — tout
 * passe par le seam `chatService`, prêt à brancher l'API ChatOps à venir.
 */
export function ChatPage() {
  const { conversations, messages, activeConversationId, selectConversation, send } = useChat()

  return (
    <div className="flex h-[calc(100vh-56px)] flex-col">
      <header className="border-border flex items-center gap-2 border-b px-6 py-3">
        <span className="text-cyan flex h-7 w-7 items-center justify-center rounded-md bg-[color-mix(in_oklch,var(--color-cyan)_14%,transparent)]">
          <Icon name="sparkles" size={15} />
        </span>
        <h1 className="text-text-primary text-base font-semibold">Chat ChatOps</h1>
        <span className="text-text-muted ml-2 font-mono text-[11px]">
          Provisionne en langage naturel
        </span>
      </header>
      <div className="grid flex-1 grid-cols-[260px_1fr_280px] overflow-hidden">
        <ConversationsSidebar
          conversations={conversations}
          activeId={activeConversationId}
          onSelect={selectConversation}
        />
        <div className="flex flex-col overflow-hidden">
          <MessageList messages={messages} />
          <ChatComposer onSend={send} />
        </div>
        <TerraformAside />
      </div>
    </div>
  )
}
