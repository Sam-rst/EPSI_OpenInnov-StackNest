interface ChatEmptyStateProps {
  /** Émet une suggestion cliquée comme un message utilisateur (D2). */
  onSuggestion: (content: string) => void
}

/**
 * État vide accueillant du fil + suggestions de prompts cliquables (D2).
 *
 * STUB de la vague FONDATION : rend un placeholder honnête respectant sa prop
 * (`onSuggestion` câblé sur `send`). L'agent SHELL (vague 2) soigne l'accueil et
 * propose de vraies suggestions de prompts.
 */
export function ChatEmptyState({ onSuggestion }: ChatEmptyStateProps) {
  return (
    <div className="text-text-muted flex flex-col items-center gap-3 text-center text-[13px]">
      <p>Décris ton besoin pour démarrer.</p>
      <button
        type="button"
        onClick={() => onSuggestion('Je veux un PostgreSQL 16 isolé')}
        className="border-border rounded-md border px-3 py-1.5"
      >
        Je veux un PostgreSQL 16 isolé
      </button>
    </div>
  )
}
