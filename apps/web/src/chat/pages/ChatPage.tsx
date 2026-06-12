import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

import { Drawer } from '../../shared/components/Drawer'
import { Icon } from '../../shared/components/ui'
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
  const navigate = useNavigate()
  // Fil actif porté par l'URL (`/chat/:id`) : un fil ouvert est partageable et
  // rechargeable. `/chat` sans id ouvre le fil le plus récent (redirection ci-dessous).
  const { id: routeId } = useParams<{ id: string }>()
  // Tiroir mobile ouvert : la sidebar (conversations) et l'aside (déploiements)
  // deviennent des tiroirs sous leur breakpoint inline (cf. rendu). null = fermé.
  const [openDrawer, setOpenDrawer] = useState<'conversations' | 'deployments' | null>(null)
  const { confirm } = useConfirmAction()
  const { reject } = useRejectAction()
  const deployments = useDeployments()

  // Fil le plus récent (liste déjà triée par `useConversations`) : ouvert par
  // défaut quand l'URL ne porte pas d'id.
  const mostRecentId = conversations.conversations[0]?.id
  // Fil effectif : l'id de l'URL prime ; sinon on retombe sur le plus récent.
  const activeId = routeId ?? mostRecentId

  // `/chat` sans id → on aligne l'URL sur le fil le plus récent (redirection douce,
  // `replace` pour ne pas empiler une entrée d'historique parasite).
  useEffect(() => {
    if (routeId === undefined && mostRecentId !== undefined) {
      navigate(`/chat/${mostRecentId}`, { replace: true })
    }
  }, [routeId, mostRecentId, navigate])

  const { seedMessages } = useConversation(activeId ?? '')
  const stream = useChatStream(activeId ?? '')

  // Amorce REST + messages live du tour. `useChatStream` miroite ses messages
  // figés dans le cache du seed (Fix 3 : persistance au changement de page) : on
  // déduplique donc par `id` pour ne pas afficher deux fois un message présent
  // dans les deux sources. Le live prime (statut d'action le plus à jour).
  const messages = useMemo(() => {
    const liveById = new Map(stream.messages.map((message) => [message.id, message]))
    const fromSeed = seedMessages.filter((message) => !liveById.has(message.id))
    return [...fromSeed, ...stream.messages]
  }, [seedMessages, stream.messages])

  // Sélectionner un fil = naviguer vers son URL (le fil actif suit l'URL).
  const handleSelect = (id: string): void => {
    navigate(`/chat/${id}`)
  }

  const handleCreate = (): void => {
    void conversations.create(NEW_CONVERSATION_TITLE).then((created) => {
      navigate(`/chat/${created.id}`)
    })
  }

  // Le renommage est saisi inline dans la sidebar (ConversationItem) : on reçoit
  // directement le nouveau libellé (déjà trimmé, non vide) — plus de prompt navigateur.
  const handleRename = (id: string, newTitle: string): void => {
    void conversations.rename(id, newTitle)
  }

  const handleDelete = (id: string): void => {
    void conversations.remove(id).then(() => {
      // On quitte le fil supprimé : retour à `/chat`, qui rouvrira le plus récent.
      if (activeId === id) {
        navigate('/chat')
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

  const closeDrawer = (): void => setOpenDrawer(null)

  // Panneaux définis une fois, rendus à deux endroits : en colonne (desktop) et
  // en tiroir (mobile). Sélectionner/créer un fil ferme le tiroir (no-op desktop).
  const sidebar = (
    <ConversationsSidebar
      conversations={conversations.conversations}
      activeId={activeId}
      loading={conversations.loading}
      onSelect={(id) => {
        handleSelect(id)
        closeDrawer()
      }}
      onCreate={() => {
        handleCreate()
        closeDrawer()
      }}
      onRename={handleRename}
      onDelete={handleDelete}
    />
  )
  const aside = (
    <ContextAside
      deployments={deployments.deployments}
      loading={deployments.loading}
      isError={deployments.isError}
    />
  )

  return (
    // h-full (et non une hauteur fixe en vh) : la page remplit EXACTEMENT la zone
    // <main> de l'AppLayout (qui porte déjà le padding), sans la déborder — sinon
    // le <main> scrollait toute la page. overflow-hidden ici + overflow-y-auto sur
    // chacune des colonnes ⇒ chaque colonne scrolle indépendamment, jamais la page.
    // Responsive : sidebar inline ≥ md, aside inline ≥ xl ; en-dessous, tiroirs.
    <>
      <div className="grid h-full grid-cols-1 overflow-hidden md:grid-cols-[260px_1fr] xl:grid-cols-[260px_1fr_280px]">
        {/* Titre accessible : la mise en page n'affiche pas de bandeau de titre,
            mais l'écran reste annoncé aux lecteurs d'écran. */}
        <h1 className="sr-only">Chat IA</h1>

        {/* Sidebar en colonne à partir de md ; en tiroir en-dessous (cf. plus bas). */}
        <div className="hidden md:block">{sidebar}</div>

        {/* min-h-0 : la colonne centrale est un enfant flex du grid ; sans cette
            contrainte, MessageList grandirait avec son contenu au lieu de scroller
            en interne, ce qui pousserait le composer hors de l'écran. Avec min-h-0,
            MessageList scrolle et le composer (shrink-0) reste fixe en bas. */}
        <div className="flex min-h-0 min-w-0 flex-col">
          {/* Barre mobile : accès aux tiroirs sous xl. Le bouton « Conversations »
              ne sert plus dès md (la sidebar est alors en colonne) ; « Déploiements »
              reste utile jusqu'à xl (l'aside n'apparaît en colonne qu'à partir de xl). */}
          <div className="border-border flex shrink-0 items-center gap-1.5 border-b p-2 xl:hidden">
            <button
              type="button"
              onClick={() => setOpenDrawer('conversations')}
              className="text-text-secondary hover:text-text-primary hover:bg-surface-sunken inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-[12.5px] font-medium md:hidden"
            >
              <Icon name="menu" size={15} />
              Conversations
            </button>
            <button
              type="button"
              onClick={() => setOpenDrawer('deployments')}
              className="text-text-secondary hover:text-text-primary hover:bg-surface-sunken inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-[12.5px] font-medium"
            >
              <Icon name="server" size={15} />
              Déploiements actifs
            </button>
          </div>
          {isThreadEmpty ? (
            <div className="flex min-h-0 flex-1 items-center justify-center p-6">
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

        {/* Aside des déploiements en colonne à partir de xl ; en tiroir en-dessous. */}
        <div className="hidden xl:block">{aside}</div>
      </div>

      {/* Tiroirs mobiles : mêmes panneaux, présentés en superposition coulissante.
          Les boutons d'ouverture sont masqués au-delà de leur breakpoint, donc ces
          tiroirs ne s'ouvrent que sur petit écran. */}
      <Drawer
        open={openDrawer === 'conversations'}
        title="Conversations"
        side="left"
        onClose={closeDrawer}
      >
        {sidebar}
      </Drawer>
      <Drawer
        open={openDrawer === 'deployments'}
        title="Déploiements actifs"
        side="right"
        onClose={closeDrawer}
      >
        {aside}
      </Drawer>
    </>
  )
}
