import { useEffect, useRef } from 'react'

import type { ChatStreamStatus } from '../../types/models/ChatStreamState'
import type { Message as MessageModel } from '../../types/models/Message'
import { Message } from './Message'
import { StreamingBubble } from './StreamingBubble'
import { ThinkingBubble } from './ThinkingBubble'

interface MessageListProps {
  /** Messages figés du fil (utilisateur + assistant finalisés). */
  messages: readonly MessageModel[]
  /** Phase du tour courant : pilote l'affichage du feedback de génération. */
  streamStatus: ChatStreamStatus
  /** Texte du tour assistant en cours (buffer de tokens), ou chaîne vide. */
  streamingText: string
  /** Abandonne la génération en cours (A3). */
  onStop: () => void
  /** Confirme une action proposée portée par un message assistant. */
  onConfirmAction: (actionId: string) => void
  /** Rejette une action proposée portée par un message assistant. */
  onRejectAction: (actionId: string) => void
}

/** Le tour est en cours (l'assistant réfléchit ou génère) : génération arrêtable. */
function isGenerating(status: ChatStreamStatus): boolean {
  return status === 'thinking' || status === 'streaming'
}

/**
 * Zone centrale scrollable des messages. Affiche les messages figés, le feedback
 * de génération (bulle « réfléchit » dès l'envoi, puis bulle de streaming qui se
 * remplit) et un bouton d'arrêt pendant la génération. Auto-scroll en bas à chaque
 * nouveau contenu.
 *
 * Signature de props FIGÉE en vague FONDATION (`messages`, `streamStatus`,
 * `streamingText`, `onStop` + handlers d'action). La richesse visuelle (auto-scroll
 * fin, curseur, markdown, horodatage) est l'affaire de l'agent MESSAGES (vague 2).
 */
export function MessageList({
  messages,
  streamStatus,
  streamingText,
  onStop,
  onConfirmAction,
  onRejectAction,
}: MessageListProps) {
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const node = scrollRef.current
    if (node) {
      node.scrollTop = node.scrollHeight
    }
  }, [messages, streamingText, streamStatus])

  const thinking = streamStatus === 'thinking'
  const streaming = streamStatus === 'streaming' && streamingText.length > 0

  return (
    <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 md:p-8">
      <div className="mx-auto flex max-w-[760px] flex-col gap-5">
        {messages.map((message) => (
          <Message
            key={message.id}
            message={message}
            onConfirmAction={onConfirmAction}
            onRejectAction={onRejectAction}
          />
        ))}
        {thinking && <ThinkingBubble />}
        {streaming && <StreamingBubble text={streamingText} />}
        {isGenerating(streamStatus) && (
          <button
            type="button"
            onClick={onStop}
            className="text-text-muted self-start text-[12px] underline"
          >
            Arrêter la génération
          </button>
        )}
      </div>
    </div>
  )
}
