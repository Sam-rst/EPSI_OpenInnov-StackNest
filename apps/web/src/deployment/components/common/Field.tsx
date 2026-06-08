import type { ReactNode } from 'react'

interface FieldProps {
  label: string
  hint?: string
  htmlFor?: string
  /** Message d'erreur de validation : affiché en rouge, masque l'indice (#5). */
  error?: string
  children: ReactNode
}

/**
 * Champ de formulaire libellé (label + indice optionnel) de la feature
 * déploiement. En présence d'une `error`, affiche le message en rouge à la place
 * de l'indice — pour expliquer *pourquoi* le champ est invalide (#5).
 */
export function Field({ label, hint, htmlFor, error, children }: FieldProps) {
  const describedById = error && htmlFor ? `${htmlFor}-error` : undefined

  return (
    <label className="block" htmlFor={htmlFor}>
      <span className="text-text-secondary mb-1.5 block text-[12px] font-medium">{label}</span>
      {children}
      {error ? (
        <span id={describedById} role="alert" className="text-error mt-1 block text-[11px]">
          {error}
        </span>
      ) : (
        hint && <span className="text-text-muted mt-1 block text-[11px]">{hint}</span>
      )}
    </label>
  )
}
