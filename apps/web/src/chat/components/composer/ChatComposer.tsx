import { useState, type FormEvent, type KeyboardEvent } from 'react'

import { Icon } from '../../../shared/components/ui'
import { cn } from '../../../shared/lib/cn'

interface ChatComposerProps {
  onSend: (content: string) => void
  /** Désactive la saisie/envoi (ex. flux en cours, aucun fil sélectionné). */
  disabled: boolean
}

const DISCLAIMER =
  'StackNest IA peut produire des erreurs. Vérifie toujours le récap avant de confirmer.'

/**
 * Zone de saisie en langage naturel. Le bouton pièce-jointe (trombone) est
 * volontairement absent au MVP. Envoi au clic ou via Ctrl/⌘ + Entrée. Affiche un
 * disclaimer honnête sur la faillibilité de l'assistant.
 */
export function ChatComposer({ onSend, disabled }: ChatComposerProps) {
  const [draft, setDraft] = useState('')
  const canSend = !disabled && draft.trim().length > 0

  const submit = (): void => {
    const trimmed = draft.trim()
    if (disabled || trimmed.length === 0) {
      return
    }
    onSend(trimmed)
    setDraft('')
  }

  const handleSubmit = (event: FormEvent): void => {
    event.preventDefault()
    submit()
  }

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>): void => {
    if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) {
      event.preventDefault()
      submit()
    }
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
            onKeyDown={handleKeyDown}
            disabled={disabled}
            rows={1}
            aria-label="Décris ton besoin"
            placeholder="Décris ton besoin… (ex. « Postgres 16 + Redis isolé pour Yassine »)"
            className="text-text-primary min-h-[40px] flex-1 resize-none bg-transparent px-2 py-2 text-[13.5px] outline-none disabled:opacity-60"
          />
          <button
            type="submit"
            disabled={!canSend}
            aria-label="Envoyer"
            className={cn(
              'inline-flex h-9 w-9 items-center justify-center rounded-md transition',
              'bg-yellow text-[#3a2a00] hover:brightness-105 disabled:opacity-50',
            )}
          >
            <Icon name="arrow-up" size={14} />
          </button>
        </form>
        <div className="text-text-muted mt-2 flex items-center justify-between font-mono text-[10.5px]">
          <span>{DISCLAIMER}</span>
          <span aria-hidden="true">⌘/Ctrl ↵ pour envoyer</span>
        </div>
      </div>
    </div>
  )
}
