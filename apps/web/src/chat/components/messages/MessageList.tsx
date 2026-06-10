import { Icon } from '../../../shared/components/ui'
import type { ChatStreamStatus } from '../../types/models/ChatStreamState'
import type { Message as MessageModel } from '../../types/models/Message'
import { Message } from './Message'
import { StopButton } from './StopButton'
import { StreamingBubble } from './StreamingBubble'
import { ThinkingBubble } from './ThinkingBubble'
import { useAutoScroll } from './useAutoScroll'

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
 * remplit), un bouton d'arrêt pendant la génération (A3) et un bouton flottant
 * « ↓ » quand l'utilisateur a remonté (A4). Auto-scroll intelligent : suit le bas
 * tant que l'utilisateur n'a pas remonté pour relire.
 *
 * Signature de props FIGÉE en vague FONDATION (`messages`, `streamStatus`,
 * `streamingText`, `onStop` + handlers d'action) : non modifiée en vague 2.
 */
export function MessageList({
  messages,
  streamStatus,
  streamingText,
  onStop,
  onConfirmAction,
  onRejectAction,
}: MessageListProps) {
  const { scrollRef, onScroll, scrollToBottom, showScrollButton } = useAutoScroll([
    messages,
    streamingText,
    streamStatus,
  ])

  const thinking = streamStatus === 'thinking'
  const streaming = streamStatus === 'streaming' && streamingText.length > 0

  return (
    <div className="relative flex-1 overflow-hidden">
      <div ref={scrollRef} onScroll={onScroll} className="h-full overflow-y-auto p-6 md:p-8">
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
          {isGenerating(streamStatus) && <StopButton onStop={onStop} />}
        </div>
      </div>

      {showScrollButton && (
        <button
          type="button"
          onClick={scrollToBottom}
          aria-label="Revenir en bas"
          className="border-border bg-surface-elevated text-text-secondary hover:text-text-primary hover:border-border-strong absolute bottom-4 left-1/2 flex h-9 w-9 -translate-x-1/2 items-center justify-center rounded-full border shadow-md transition-colors"
        >
          <Icon name="arrow-down" size={18} />
        </button>
      )}
    </div>
  )
}
