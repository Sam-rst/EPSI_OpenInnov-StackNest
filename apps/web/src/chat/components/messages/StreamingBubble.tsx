import { AssistantAvatar } from './AssistantAvatar'
import { MarkdownContent } from './MarkdownContent'

interface StreamingBubbleProps {
  /** Texte accumulé du tour assistant en cours. */
  text: string
}

/**
 * Bulle de la réponse assistant en cours de génération (A2). Le texte accumulé
 * est rendu en Markdown au fil des tokens (gras, listes, blocs de code) et suivi
 * d'un caret clignotant matérialisant la frappe. Rendue tant que le flux n'a pas
 * figé le message final.
 */
export function StreamingBubble({ text }: StreamingBubbleProps) {
  return (
    <div className="flex gap-3" role="status" aria-live="polite">
      <AssistantAvatar />
      <div className="bg-surface-elevated border-border text-text-primary max-w-[80%] rounded-2xl rounded-bl-sm border px-4 py-3 leading-relaxed">
        <MarkdownContent content={text} />
        <span
          data-testid="stream-caret"
          aria-hidden="true"
          className="bg-cyan ml-0.5 inline-block h-3.5 w-1.5 animate-pulse align-middle"
        />
      </div>
    </div>
  )
}
