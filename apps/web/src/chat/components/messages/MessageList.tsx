import { useEffect, useRef } from 'react'

import { Icon } from '../../../shared/components/ui'
import type { Message as MessageModel } from '../../types/models/Message'
import { Message } from './Message'
import { StreamingBubble } from './StreamingBubble'

interface MessageListProps {
  messages: readonly MessageModel[]
  /** Texte du tour assistant en cours (buffer de tokens), ou chaîne vide. */
  streamingText: string
  isStreaming: boolean
  /** Erreur métier honnête à afficher, ou `undefined`. */
  error: string | undefined
  onConfirmAction: (actionId: string) => void
  onRejectAction: (actionId: string) => void
}

/** Bandeau d'erreur honnête (échec métier remonté par le flux). */
function ErrorBanner({ message }: { message: string }) {
  return (
    <div className="border-error/40 flex items-center gap-2 rounded-md border bg-[color-mix(in_oklch,#c42b1c_8%,transparent)] px-3 py-2 text-[12.5px] text-[#a52215]">
      <Icon name="triangle-alert" size={14} />
      <span>{message}</span>
    </div>
  )
}

/**
 * Zone centrale scrollable des messages. Affiche les messages figés, la bulle de
 * streaming pendant la génération, et une bannière d'erreur honnête le cas
 * échéant. Auto-scroll en bas à chaque nouveau contenu.
 */
export function MessageList({
  messages,
  streamingText,
  isStreaming,
  error,
  onConfirmAction,
  onRejectAction,
}: MessageListProps) {
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const node = scrollRef.current
    if (node) {
      node.scrollTop = node.scrollHeight
    }
  }, [messages, streamingText, isStreaming, error])

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
        {isStreaming && streamingText.length > 0 && <StreamingBubble text={streamingText} />}
        {error && <ErrorBanner message={error} />}
      </div>
    </div>
  )
}
