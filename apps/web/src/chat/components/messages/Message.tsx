import { Avatar } from '../../../shared/components/ui'
import { cn } from '../../../shared/lib/cn'
import { MessageRole } from '../../types/enums/MessageRole'
import type { Message as MessageModel } from '../../types/models/Message'
import { ActionCard } from './ActionCard'
import { AssistantAvatar } from './AssistantAvatar'

interface MessageProps {
  message: MessageModel
  onConfirmAction: (actionId: string) => void
  onRejectAction: (actionId: string) => void
}

const USER_BUBBLE = 'bg-cyan text-white rounded-br-sm'
const ASSISTANT_BUBBLE = 'bg-surface-elevated border border-border text-text-primary rounded-bl-sm'

/**
 * Bulle d'un message. Le contenu est rendu en texte brut (jamais d'HTML). Un
 * message assistant porteur d'une action affiche la carte de confirmation sous
 * la bulle. Reçoit un modèle `Message`, jamais un DTO.
 */
export function Message({ message, onConfirmAction, onRejectAction }: MessageProps) {
  const isUser = message.role === MessageRole.USER

  return (
    <div className={cn('flex gap-3', isUser && 'justify-end')}>
      {!isUser && <AssistantAvatar />}
      <div className={cn('max-w-[80%]', isUser && 'flex flex-col items-end')}>
        <div
          className={cn(
            'rounded-2xl px-4 py-3 text-[13.5px] leading-relaxed',
            isUser ? USER_BUBBLE : ASSISTANT_BUBBLE,
          )}
        >
          <p className="whitespace-pre-wrap">{message.content}</p>
        </div>
        {message.action && (
          <div className="w-full">
            <ActionCard
              action={message.action}
              onConfirm={onConfirmAction}
              onReject={onRejectAction}
            />
          </div>
        )}
      </div>
      {isUser && <Avatar name="Vous" color="#fea21f" size={32} />}
    </div>
  )
}
