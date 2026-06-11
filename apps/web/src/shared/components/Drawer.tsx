import { useEffect, type ReactNode } from 'react'

import { cn } from '../lib/cn'
import { Icon } from './ui'

interface DrawerProps {
  /** Tiroir ouvert (rendu) ou fermé (rien dans le DOM). */
  open: boolean
  /** Titre affiché en en-tête et exposé comme nom accessible du dialog. */
  title: string
  onClose: () => void
  /** Côté d'apparition du panneau (gauche par défaut). */
  side?: 'left' | 'right'
  children: ReactNode
}

/**
 * Tiroir coulissant en superposition (pattern « burger » mobile). Panneau latéral
 * + arrière-plan assombri ; se ferme via le bouton ×, le clic sur l'arrière-plan
 * ou la touche Échap. Réutilisable (≥ 2 usages : conversations + déploiements du
 * chat). Accessible : `role="dialog"`, `aria-modal`, nom = `title`.
 */
export function Drawer({ open, title, onClose, side = 'left', children }: DrawerProps) {
  useEffect(() => {
    if (!open) {
      return
    }
    const onKeyDown = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') {
        onClose()
      }
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [open, onClose])

  if (!open) {
    return null
  }

  return (
    <div role="dialog" aria-modal="true" aria-label={title} className="fixed inset-0 z-50 flex">
      <div
        data-testid="drawer-backdrop"
        aria-hidden="true"
        onClick={onClose}
        className="absolute inset-0 bg-black/40"
      />
      <div
        className={cn(
          'border-border bg-surface-elevated relative z-10 flex h-full w-[85%] max-w-[320px] flex-col',
          side === 'left' ? 'border-r' : 'ml-auto border-l',
        )}
      >
        <div className="border-border flex items-center justify-between border-b p-3">
          <span className="text-text-primary text-[13px] font-semibold">{title}</span>
          <button
            type="button"
            aria-label="Fermer"
            onClick={onClose}
            className="text-text-muted hover:text-text-primary hover:bg-surface inline-flex h-7 w-7 items-center justify-center rounded"
          >
            <Icon name="x" size={16} />
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto">{children}</div>
      </div>
    </div>
  )
}
