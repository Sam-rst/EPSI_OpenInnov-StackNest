import { useMemo, useState } from 'react'

import { useDeployments } from '../../deployment/hooks/useDeployments'
import { ContextAside } from '../components/aside/ContextAside'
import { ChatComposer } from '../components/composer/ChatComposer'
import { ChatEmptyState } from '../components/empty/ChatEmptyState'
import { ChatError } from '../components/errors/ChatError'
import { MessageList } from '../components/messages/MessageList'
import { ConversationsSidebar } from '../components/sidebar/ConversationsSidebar'
import { useChatStream } from '../hooks/useChatStream'
import { useConfirmAction } from '../hooks/useConfirmAction'
import { useConversation } from '../hooks/useConversation'
import { useConversations } from '../hooks/useConversations'
import { useRejectAction } from '../hooks/useRejectAction'
import type { ChatStreamState } from '../types/models/ChatStreamState'

/** Titre par défaut d'un fil créé sans saisie explicite. */
const NEW_CONVERSATION_TITLE = 'Nouvelle conversation'

/**
 * Construit l'annonce courtoise pour la région `aria-live` (F1) à partir de l'état
 * du tour. On reste au niveau du *statut* (réflexion / réponse / erreur) sans
 * relire le contenu du fil, qui est l'affaire des messages eux-mêmes. Chaîne vide
 * = rien à annoncer (repos), pour ne pas polluer le lecteur d'écran.
 */
function buildLiveStatus(state: ChatStreamState): string {
  if (state.isReconnecting) {
    return 'Reconnexion au chat en cours.'
  }
  switch (state.status) {
    case 'thinking':
      return "L'assistant réfléchit…"
    case 'streaming':
      return "L'assistant rédige sa réponse…"
    case 'error':
      return state.error?.message ?? 'Une erreur est survenue.'
    default:
      return ''
  }
}

/**
 * Écran Chat IA — assistant guidé avec confirmation. Layout 3 colonnes :
 * `ConversationsSidebar` (fils) | `MessageList` + `ChatComposer` (échange) |
 * `ContextAside` (déploiements actifs). Branché sur l'API REST `/chat` + le flux
 * SSE de la conversation (tokens, message, action proposée puis résolue).
 *
 * Le tour de conversation est piloté par la machine d'état riche de `useChatStream`
 * (`state.status` : idle → thinking → streaming → done | error). `MessageList`
 * affiche le feedback de génération, `ChatError` l'échec contextualisé + la
 * reconnexion, et `ChatEmptyState` accueille un fil encore vide. Le composer est
 * verrouillé pendant la génération (`canSend`).
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

  const isThreadEmpty = activeId !== undefined && messages.length === 0

  // A5 : une réponse est en cours de génération (composer verrouillé + « Envoi… »).
  const isGenerating = stream.state.status === 'thinking' || stream.state.status === 'streaming'

  // F1 : statut courtois annoncé aux lecteurs d'écran sans dupliquer le fil
  // (MESSAGES annonce le contenu) — on se limite aux transitions du tour.
  const liveStatus = buildLiveStatus(stream.state)

  return (
    // h-full (et non une hauteur fixe en vh) : la page remplit EXACTEMENT la zone
    // <main> de l'AppLayout (qui porte déjà le padding), sans la déborder — sinon
    // le <main> scrollait toute la page. overflow-hidden ici + overflow-y-auto sur
    // chacune des 3 colonnes ⇒ chaque colonne scrolle indépendamment, jamais la page.
    <div className="grid h-full grid-cols-1 overflow-hidden md:grid-cols-[260px_1fr] xl:grid-cols-[260px_1fr_280px]">
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
        {isThreadEmpty ? (
          <div className="flex flex-1 items-center justify-center p-6">
            <ChatEmptyState onSuggestion={stream.send} />
          </div>
        ) : (
          <MessageList
            messages={messages}
            streamStatus={stream.state.status}
            streamingText={stream.state.streamingText}
            onStop={stream.stop}
            onConfirmAction={handleConfirmAction}
            onRejectAction={handleRejectAction}
          />
        )}
        {/* F1 : annonce courtoise de l'état du tour aux lecteurs d'écran. Visuellement
            masquée — le feedback visible est porté par la bulle « réfléchit » et `ChatError`. */}
        <div role="status" aria-live="polite" className="sr-only">
          {liveStatus}
        </div>
        <div className="mx-auto w-full max-w-[760px] px-6">
          <ChatError
            error={stream.state.error}
            onRetry={stream.retry}
            isReconnecting={stream.state.isReconnecting}
          />
        </div>
        <ChatComposer
          onSend={stream.send}
          disabled={activeId === undefined || !stream.canSend}
          pending={isGenerating}
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
