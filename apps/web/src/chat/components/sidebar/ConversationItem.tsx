import { useRef, useState, type KeyboardEvent } from 'react'

import { ConfirmDialog } from '../../../shared/components/ConfirmDialog'
import { Icon } from '../../../shared/components/ui'
import { cn } from '../../../shared/lib/cn'
import type { Conversation } from '../../types/models/Conversation'
import { displayConversationTitle } from './conversationTitle'

interface ConversationItemProps {
  conversation: Conversation
  active: boolean
  onSelect: (id: string) => void
  /** Renomme le fil avec le nouveau libellé saisi (déjà trimmé, non vide). */
  onRename: (id: string, newTitle: string) => void
  onDelete: (id: string) => void
}

const BASE_ROW = 'group relative w-full rounded-md p-2.5 text-left transition'
const ACTIVE_ROW = 'bg-[color-mix(in_oklch,var(--color-cyan)_10%,transparent)]'

/**
 * Ligne de fil dans la sidebar : sélection au clic, renommage **inline** (champ
 * éditable, sans modale navigateur) et suppression **avec confirmation** (modale
 * accessible partagée). Reçoit un modèle `Conversation`, jamais un DTO.
 */
export function ConversationItem({
  conversation,
  active,
  onSelect,
  onRename,
  onDelete,
}: ConversationItemProps) {
  // D3 : libellé dérivé (titre du 1er message, tronqué) ou repli « Nouvelle
  // conversation ». Le titre brut sert de valeur initiale au renommage.
  const title = displayConversationTitle(conversation.title)

  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(conversation.title)
  const [confirmingDelete, setConfirmingDelete] = useState(false)
  // Évite un double-commit (Entrée → blur) et un commit parasite après Échap :
  // une résolution clavier marque le blur suivant comme « déjà géré ».
  const skipBlur = useRef(false)

  const startEditing = (): void => {
    setDraft(conversation.title)
    setEditing(true)
  }

  const finishEditing = (shouldCommit: boolean): void => {
    if (shouldCommit) {
      const trimmed = draft.trim()
      if (trimmed.length > 0) {
        onRename(conversation.id, trimmed)
      }
    }
    setEditing(false)
  }

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>): void => {
    if (event.key === 'Enter') {
      event.preventDefault()
      skipBlur.current = true
      finishEditing(true)
    } else if (event.key === 'Escape') {
      event.preventDefault()
      skipBlur.current = true
      finishEditing(false)
    }
  }

  const handleBlur = (): void => {
    if (skipBlur.current) {
      skipBlur.current = false
      return
    }
    finishEditing(true)
  }

  return (
    <li className={cn(BASE_ROW, active ? ACTIVE_ROW : 'hover:bg-surface-sunken')}>
      {editing ? (
        <input
          autoFocus
          aria-label="Nouveau nom de la conversation"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={handleBlur}
          className="border-cyan bg-surface text-text-primary w-full rounded border px-2 py-1 text-[12.5px] outline-none"
        />
      ) : (
        <>
          <button
            type="button"
            onClick={() => onSelect(conversation.id)}
            className="block w-full pr-12 text-left"
          >
            <span
              className={cn(
                'block truncate text-[12.5px] font-medium',
                active ? 'text-cyan' : 'text-text-primary',
              )}
            >
              {title}
            </span>
            <span className="text-text-muted mt-0.5 block text-[10.5px]">
              {conversation.relativeWhen}
            </span>
          </button>

          <div className="absolute top-2 right-1.5 flex items-center gap-0.5 opacity-0 transition group-hover:opacity-100 focus-within:opacity-100">
            <button
              type="button"
              aria-label={`Renommer « ${title} »`}
              onClick={startEditing}
              className="text-text-muted hover:text-cyan hover:bg-surface inline-flex h-6 w-6 items-center justify-center rounded"
            >
              <Icon name="pencil" size={13} />
            </button>
            <button
              type="button"
              aria-label={`Supprimer « ${title} »`}
              onClick={() => setConfirmingDelete(true)}
              className="text-text-muted hover:text-error hover:bg-surface inline-flex h-6 w-6 items-center justify-center rounded"
            >
              <Icon name="trash-2" size={13} />
            </button>
          </div>
        </>
      )}

      {confirmingDelete && (
        <ConfirmDialog
          title="Supprimer la conversation"
          description={`« ${title} » et tous ses messages seront définitivement supprimés. Cette action est irréversible.`}
          confirmLabel="Supprimer"
          onConfirm={() => {
            setConfirmingDelete(false)
            onDelete(conversation.id)
          }}
          onCancel={() => setConfirmingDelete(false)}
        />
      )}
    </li>
  )
}
