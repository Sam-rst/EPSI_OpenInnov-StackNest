import type { ChatStreamError } from '../../types/models/ChatStreamState'

interface ChatErrorProps {
  /** Erreur typée du tour, ou `null` (rien à afficher). */
  error: ChatStreamError | null
  /** Réémet le dernier message utilisateur (B2). */
  onRetry: () => void
  /** Une reconnexion SSE est en cours : afficher la pastille plutôt que l'erreur (B4). */
  isReconnecting: boolean
}

/**
 * Affichage d'erreur du chat, contextualisé par type (B1) + pastille de
 * reconnexion (B4) + bouton « Réessayer » (B2).
 *
 * STUB de la vague FONDATION : rend un placeholder honnête respectant ses props
 * (message + retry + reconnexion). L'agent SHELL (vague 2) le distingue par type
 * (réseau / timeout / métier / auth) et soigne le design.
 */
export function ChatError({ error, onRetry, isReconnecting }: ChatErrorProps) {
  if (isReconnecting) {
    return (
      <div role="status" className="text-text-muted text-[12.5px]">
        Reconnexion…
      </div>
    )
  }

  if (error === null) {
    return null
  }

  return (
    <div role="alert" className="text-error flex items-center gap-2 text-[12.5px]">
      <span>{error.message}</span>
      <button type="button" onClick={onRetry} className="underline">
        Réessayer
      </button>
    </div>
  )
}
