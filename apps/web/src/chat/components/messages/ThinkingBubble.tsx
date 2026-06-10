import { AssistantAvatar } from './AssistantAvatar'

/** Délais d'animation des trois points (effet de vague séquentielle). */
const DOT_DELAYS = ['0ms', '160ms', '320ms'] as const

/**
 * Bulle « l'assistant réfléchit » affichée dès l'envoi, avant le 1er token (A1).
 *
 * Comble le silence (10-40 s constaté en QA) par un feedback vivant : avatar
 * assistant + trois points qui rebondissent en vague (shimmer de réflexion). Le
 * libellé est masqué visuellement mais lu par les lecteurs d'écran
 * (`role=status` + `aria-live=polite`) pour annoncer l'attente sans surcharger
 * l'interface.
 */
export function ThinkingBubble() {
  return (
    <div className="flex gap-3" role="status" aria-live="polite">
      <AssistantAvatar />
      <div className="bg-surface-elevated border-border flex items-center gap-1.5 rounded-2xl rounded-bl-sm border px-4 py-3.5">
        <span className="sr-only">L'assistant réfléchit…</span>
        {DOT_DELAYS.map((delay) => (
          <span
            key={delay}
            data-testid="thinking-dot"
            aria-hidden="true"
            className="bg-text-muted h-2 w-2 animate-bounce rounded-full"
            style={{ animationDelay: delay }}
          />
        ))}
      </div>
    </div>
  )
}
