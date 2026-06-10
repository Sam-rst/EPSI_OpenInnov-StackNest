import { useRef, useState, type FormEvent, type KeyboardEvent } from 'react'

import { Icon } from '../../../shared/components/ui'
import { cn } from '../../../shared/lib/cn'

interface ChatComposerProps {
  onSend: (content: string) => void
  /** Désactive la saisie/envoi (ex. aucun fil sélectionné, génération en cours). */
  disabled: boolean
  /** Une réponse est en cours de génération : affiche « Envoi… » + verrouille (A5). */
  pending?: boolean
}

const DISCLAIMER =
  'StackNest IA peut produire des erreurs. Vérifie toujours le récap avant de confirmer.'

/**
 * Libellé discret du modèle (F4). L'API n'expose pas le modèle exact côté front :
 * on affiche un libellé statique honnête (LLM local par défaut, cf. stack Ollama).
 */
const MODEL_LABEL = 'IA locale'

/**
 * Zone de saisie en langage naturel. Le bouton pièce-jointe (trombone) est
 * volontairement absent au MVP. Envoi au clic ou via Ctrl/⌘ + Entrée. Affiche un
 * disclaimer honnête sur la faillibilité de l'assistant + un indicateur discret
 * du modèle (F4).
 *
 * Pendant une génération (`pending`), la saisie est verrouillée et le bouton
 * affiche « Envoi… » (A5). Après chaque envoi, le focus revient au champ (F2) ;
 * la touche Échap vide le brouillon en cours (F2).
 */
export function ChatComposer({ onSend, disabled, pending = false }: ChatComposerProps) {
  const [draft, setDraft] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const isLocked = disabled || pending
  const canSend = !isLocked && draft.trim().length > 0

  const submit = (): void => {
    const trimmed = draft.trim()
    if (isLocked || trimmed.length === 0) {
      return
    }
    onSend(trimmed)
    setDraft('')
    // F2 : on rend la main au champ pour enchaîner sans repasser à la souris.
    textareaRef.current?.focus()
  }

  const handleSubmit = (event: FormEvent): void => {
    event.preventDefault()
    submit()
  }

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>): void => {
    if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) {
      event.preventDefault()
      submit()
      return
    }
    // F2 : Échap annule la saisie en cours (vide le brouillon).
    if (event.key === 'Escape') {
      event.preventDefault()
      setDraft('')
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
            ref={textareaRef}
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isLocked}
            rows={1}
            aria-label="Décris ton besoin"
            placeholder="Décris ton besoin… (ex. « Postgres 16 + Redis isolé pour Yassine »)"
            className="text-text-primary min-h-[40px] flex-1 resize-none bg-transparent px-2 py-2 text-[13.5px] outline-none disabled:opacity-60"
          />
          <button
            type="submit"
            disabled={!canSend}
            aria-label={pending ? 'Envoi en cours' : 'Envoyer'}
            className={cn(
              'inline-flex h-9 w-9 items-center justify-center rounded-md transition',
              'bg-yellow text-[#3a2a00] hover:brightness-105 disabled:opacity-50',
            )}
          >
            <Icon
              name={pending ? 'loader-circle' : 'arrow-up'}
              size={14}
              className={cn(pending && 'animate-spin')}
            />
          </button>
        </form>
        <div className="text-text-muted mt-2 flex items-center justify-between gap-3 font-mono text-[10.5px]">
          <span className="flex items-center gap-2">
            {pending && (
              <span className="text-cyan inline-flex items-center gap-1" role="status">
                <Icon name="loader-circle" size={11} className="animate-spin" />
                Envoi…
              </span>
            )}
            <span className="inline-flex items-center gap-1" title="Modèle servi en local (Ollama)">
              <Icon name="cpu" size={11} />
              {MODEL_LABEL}
            </span>
          </span>
          <span aria-hidden="true">⌘/Ctrl ↵ pour envoyer</span>
        </div>
        <p className="text-text-muted mt-1 font-mono text-[10.5px]">{DISCLAIMER}</p>
      </div>
    </div>
  )
}
