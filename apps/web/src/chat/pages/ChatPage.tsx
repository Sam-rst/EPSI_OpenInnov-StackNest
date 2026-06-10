import { useMemo, useState } from 'react'

import { useDeployments } from '../../deployment/hooks/useDeployments'
import { ContextAside } from '../components/aside/ContextAside'
import { ChatComposer } from '../components/composer/ChatComposer'
import { MessageList } from '../components/messages/MessageList'
import { ConversationsSidebar } from '../components/sidebar/ConversationsSidebar'
import { useChatStream } from '../hooks/useChatStream'
import { useConfirmAction } from '../hooks/useConfirmAction'
import { useConversation } from '../hooks/useConversation'
import { useConversations } from '../hooks/useConversations'
import { useRejectAction } from '../hooks/useRejectAction'

/** Titre par défaut d'un fil créé sans saisie explicite. */
const NEW_CONVERSATION_TITLE = 'Nouvelle conversation'

/**
 * Écran Chat IA — assistant guidé avec confirmation. Layout 3 colonnes :
 * `ConversationsSidebar` (fils) | `MessageList` + `ChatComposer` (échange) |
 * `ContextAside` (déploiements actifs). Branché sur l'API REST `/chat` + le flux
 * SSE de la conversation (tokens, message, action proposée puis résolue).
 *
 * Les messages d'amorce du fil (`useConversation`) sont fusionnés avec les
 * messages live du tour courant (`useChatStream`). Confirmer/Annuler une action
 * délègue au back ; le résultat (« Exécutée » / « Échec » / « Annulée ») revient
 * par le flux SSE (`action_result`), qui met à jour le statut de la carte.
 */
export function ChatPage() {
  const conversations = useConversations()
  // Sélection explicite de l'utilisateur (undefined tant qu'il n'a rien choisi).
  const [selectedId, setSelectedId] = useState<string | undefined>(undefined)
  const { confirm } = useConfirmAction()
  const { reject } = useRejectAction()
  const deployments = useDeployments()

  // Fil effectif : la sélection explicite prime, sinon le premier fil chargé.
  // Dérivé au rendu (pas d'effet/setState) — pattern « you might not need an effect ».
  const activeId = selectedId ?? conversations.conversations[0]?.id

  const { seedMessages } = useConversation(activeId ?? '')
  const stream = useChatStream(activeId ?? '')

  const messages = useMemo(
    () => [...seedMessages, ...stream.messages],
    [seedMessages, stream.messages],
  )

  const handleCreate = (): void => {
    void conversations.create(NEW_CONVERSATION_TITLE).then((created) => setSelectedId(created.id))
  }

  const handleRename = (id: string, currentTitle: string): void => {
    const next = globalThis.prompt('Renommer la conversation', currentTitle)
    if (next && next.trim().length > 0) {
      void conversations.rename(id, next.trim())
    }
  }

  const handleDelete = (id: string): void => {
    void conversations.remove(id).then(() => {
      if (selectedId === id) {
        setSelectedId(undefined)
      }
    })
  }

  // Confirmer délègue au back (202) ; le résultat (« Exécutée » / « Échec »)
  // revient par le flux SSE (`action_result`), sans optimisme local trompeur.
  const handleConfirmAction = (actionId: string): void => {
    void confirm(actionId)
  }

  // Annuler est la décision propre de l'utilisateur : on marque « Annulée » dès le
  // clic (honnête) et on délègue au back. Le `action_result` qui suivra ne
  // redégrade pas une action déjà annulée (cf. réducteur de `useChatStream`).
  const handleRejectAction = (actionId: string): void => {
    stream.rejectActionLocally(actionId)
    void reject(actionId)
  }

  return (
    <div className="grid h-[calc(100vh-3.5rem)] grid-cols-1 md:grid-cols-[260px_1fr] xl:grid-cols-[260px_1fr_280px]">
      {/* Titre accessible : la mise en page 3 colonnes n'affiche pas de bandeau
          de titre, mais l'écran reste annoncé aux lecteurs d'écran. */}
      <h1 className="sr-only">Chat IA</h1>

      <ConversationsSidebar
        conversations={conversations.conversations}
        activeId={activeId}
        loading={conversations.loading}
        onSelect={setSelectedId}
        onCreate={handleCreate}
        onRename={handleRename}
        onDelete={handleDelete}
      />

      <div className="flex min-w-0 flex-col">
        <MessageList
          messages={messages}
          streamingText={stream.streamingText}
          isStreaming={stream.isStreaming}
          error={stream.error}
          onConfirmAction={handleConfirmAction}
          onRejectAction={handleRejectAction}
        />
        <ChatComposer
          onSend={stream.send}
          disabled={activeId === undefined || stream.isStreaming}
        />
      </div>

      <div className="hidden xl:block">
        <ContextAside
          deployments={deployments.deployments}
          loading={deployments.loading}
          isError={deployments.isError}
        />
      </div>
    </div>
  )
}
