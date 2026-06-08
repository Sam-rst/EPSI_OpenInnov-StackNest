import { Button } from '../../../shared/components/ui'

interface ConfirmDialogProps {
  title: string
  description: string
  confirmLabel: string
  onConfirm: () => void
  onCancel: () => void
}

/** Modale de confirmation (actions destructrices, ex. détruire un déploiement). */
export function ConfirmDialog({
  title,
  description,
  confirmLabel,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={title}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
    >
      <div className="border-border bg-surface-elevated w-full max-w-sm rounded-lg border p-5 shadow-xl">
        <h2 className="text-text-primary text-[15px] font-semibold">{title}</h2>
        <p className="text-text-secondary mt-2 text-[13px] leading-relaxed">{description}</p>
        <div className="mt-5 flex justify-end gap-2">
          <Button variant="ghost" onClick={onCancel}>
            Annuler
          </Button>
          <Button variant="danger" onClick={onConfirm}>
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  )
}
