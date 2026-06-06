import { EmptyState } from '../../../shared/components/EmptyState'

/**
 * État vide honnête de la zone de conversation : aucune donnée n'est fabriquée
 * (ni faux historique, ni faux assistant). Invite simplement à démarrer.
 */
export function ChatEmptyState() {
  return (
    <EmptyState
      icon="message-circle"
      title="Démarre une conversation"
      description="Décris ton besoin en français — type de ressource, taille, environnement. L'assistant ChatOps sera branché prochainement."
    />
  )
}
