import { AssistantAvatar } from './AssistantAvatar'

interface StreamingBubbleProps {
  /** Texte accumulé du tour assistant en cours. */
  text: string
}

/**
 * Bulle de la réponse assistant en cours de génération : affiche le texte
 * accumulé suivi d'un curseur clignotant. Rendue tant que le flux n'a pas figé
 * le message final.
 */
export function StreamingBubble({ text }: StreamingBubbleProps) {
  return (
    <div className="flex gap-3" role="status" aria-live="polite">
      <AssistantAvatar />
      <div className="bg-surface-elevated border-border text-text-primary max-w-[80%] rounded-2xl rounded-bl-sm border px-4 py-3 text-[13.5px] leading-relaxed">
        <span className="whitespace-pre-wrap">{text}</span>
        <span className="bg-cyan ml-0.5 inline-block h-3.5 w-1.5 animate-pulse align-middle" />
      </div>
    </div>
  )
}
