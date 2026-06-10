import { Avatar } from '../../../shared/components/ui'
import { cn } from '../../../shared/lib/cn'
import { MessageRole } from '../../types/enums/MessageRole'
import type { Message as MessageModel } from '../../types/models/Message'
import { ActionCard } from './ActionCard'
import { AssistantAvatar } from './AssistantAvatar'
import { DeploymentActionCta } from './DeploymentActionCta'
import { MarkdownContent } from './MarkdownContent'
import { parseDeploymentAction } from './parseDeploymentAction'
import { relativeTime } from './relativeTime'

interface MessageProps {
  message: MessageModel
  onConfirmAction: (actionId: string) => void
  onRejectAction: (actionId: string) => void
}

const USER_BUBBLE = 'bg-cyan text-white rounded-br-sm'
const ASSISTANT_BUBBLE = 'bg-surface-elevated border border-border text-text-primary rounded-bl-sm'

/**
 * Corps d'un message assistant : si le contenu décrit un déploiement en JSON brut
 * (petit modèle), on affiche le CTA fallback (C2) ; sinon le contenu est rendu en
 * Markdown sûr (C1). Le HTML brut n'est jamais interprété.
 */
function AssistantBody({ content }: { content: string }) {
  const deployment = parseDeploymentAction(content)
  if (deployment !== null) {
    return (
      <DeploymentActionCta
        templateId={deployment.templateId}
        precedingText={deployment.precedingText}
      />
    )
  }
  return <MarkdownContent content={content} />
}

/**
 * Bulle d'un message. Le contenu **utilisateur** reste du texte brut ; le contenu
 * **assistant** est rendu en Markdown (C1) ou remplacé par un CTA de déploiement
 * (C2). Avatars cohérents et horodatage relatif (F3). Un message assistant
 * porteur d'une action structurée affiche la carte de confirmation sous la bulle.
 * Reçoit un modèle `Message`, jamais un DTO.
 */
export function Message({ message, onConfirmAction, onRejectAction }: MessageProps) {
  const isUser = message.role === MessageRole.USER
  const timeLabel = relativeTime(message.createdAt)

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
          {isUser ? (
            <p className="whitespace-pre-wrap">{message.content}</p>
          ) : (
            <AssistantBody content={message.content} />
          )}
        </div>
        {timeLabel !== '' && (
          <time dateTime={message.createdAt} className="text-text-muted mt-1 px-1 text-[11px]">
            {timeLabel}
          </time>
        )}
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
