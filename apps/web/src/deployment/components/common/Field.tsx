import type { ReactNode } from 'react'

interface FieldProps {
  label: string
  hint?: string
  htmlFor?: string
  children: ReactNode
}

/** Champ de formulaire libellé (label + indice optionnel) de la feature déploiement. */
export function Field({ label, hint, htmlFor, children }: FieldProps) {
  return (
    <label className="block" htmlFor={htmlFor}>
      <span className="text-text-secondary mb-1.5 block text-[12px] font-medium">{label}</span>
      {children}
      {hint && <span className="text-text-muted mt-1 block text-[11px]">{hint}</span>}
    </label>
  )
}
