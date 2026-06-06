import type { ChatMessage } from '../../domain/models/ChatMessage'
import { ChatEmptyState } from './ChatEmptyState'
import { MessageBubble } from './MessageBubble'

interface MessageListProps {
  messages: readonly ChatMessage[]
}

/**
 * Zone scrollable des messages. Affiche l'état vide honnête tant qu'aucun
 * message n'existe (display-only : aucune conversation n'est fabriquée).
 */
export function MessageList({ messages }: MessageListProps) {
  if (messages.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center overflow-y-auto p-8">
        <div className="w-full max-w-[480px]">
          <ChatEmptyState />
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto p-8">
      <div className="mx-auto max-w-[760px] space-y-5">
        {messages.map((message) => (
          <MessageBubble key={message.id} message={message} />
        ))}
      </div>
    </div>
  )
}
