import { useState, type FormEvent } from 'react'

import { Icon } from '../../../shared/components/ui'

interface ChatComposerProps {
  /** Déclenché à la soumission d'un message non vide (texte déjà trimé). */
  onSend: (text: string) => void
}

/**
 * Champ de saisie du message. Rend l'UI fidèlement, mais aucun envoi réel ni
 * appel LLM n'a lieu : `onSend` passe par le seam `chatService` (vide tant que
 * le backend ChatOps n'est pas branché).
 */
export function ChatComposer({ onSend }: ChatComposerProps) {
  const [draft, setDraft] = useState('')
  const trimmed = draft.trim()

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    if (!trimmed) return
    onSend(trimmed)
    setDraft('')
  }

  return (
    <div className="border-border bg-surface-elevated border-t p-4">
      <div className="mx-auto max-w-[760px]">
        <form
          onSubmit={handleSubmit}
          className="border-border bg-surface focus-within:border-cyan flex items-end gap-2 rounded-lg border p-2"
        >
          <textarea
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            placeholder="Décris ton besoin… (ex : « Postgres 16 + Redis isolé »)"
            aria-label="Message"
            className="text-text-primary flex-1 resize-none bg-transparent px-2 py-2 text-[13.5px] outline-none"
            rows={1}
            style={{ minHeight: 40, maxHeight: 120 }}
          />
          <button
            type="submit"
            disabled={!trimmed}
            aria-label="Envoyer"
            className="bg-sun inline-flex h-9 w-9 items-center justify-center rounded-md text-[#3a2a00] transition hover:brightness-105 disabled:opacity-50"
          >
            <Icon name="arrow-up" size={14} />
          </button>
        </form>
        <div className="text-text-muted mt-2 flex items-center justify-between font-mono text-[10.5px]">
          <span>
            L'assistant ChatOps peut produire des erreurs. Toujours valider le plan avant l'apply.
          </span>
          <span>⌘ ↵ pour envoyer</span>
        </div>
      </div>
    </div>
  )
}
