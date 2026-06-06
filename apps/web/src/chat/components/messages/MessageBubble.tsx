import { Icon } from '../../../shared/components/ui'
import type { ChatMessage } from '../../domain/models/ChatMessage'
import { AssistantBubbleIcon } from './AssistantBubbleIcon'
import { PlanBubble } from './PlanBubble'

interface MessageBubbleProps {
  message: ChatMessage
}

const USER_BUBBLE = 'bg-cyan text-white rounded-br-sm'
const ASSISTANT_BUBBLE = 'bg-surface-elevated border border-border rounded-bl-sm text-text-primary'

function MessageContent({ message }: MessageBubbleProps) {
  if (message.kind === 'plan') {
    return <PlanBubble message={message} />
  }
  // Rendu en texte brut : aucune interprétation HTML (pas de dangerouslySetInnerHTML).
  return <div className="text-[13.5px] leading-relaxed">{message.text}</div>
}

/** Bulle de message (utilisateur à droite, assistant à gauche). */
export function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === 'user'

  return (
    <div className={`flex gap-3 ${isUser ? 'justify-end' : ''}`}>
      {!isUser && <AssistantBubbleIcon />}
      <div
        className={`max-w-[80%] rounded-2xl px-4 py-3 ${isUser ? USER_BUBBLE : ASSISTANT_BUBBLE}`}
      >
        <MessageContent message={message} />
      </div>
      {isUser && (
        <span className="bg-sun mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-[#3a2a00]">
          <Icon name="user" size={15} />
        </span>
      )}
    </div>
  )
}
