import type { ReactNode } from 'react'

interface FormFieldProps {
  id: string
  label: string
  error?: string
  children: ReactNode
}

/** Champ de formulaire : libellé associé, slot d'input et message d'erreur. */
export function FormField({ id, label, error, children }: FormFieldProps) {
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="text-text-secondary text-[12.5px] font-medium">
        {label}
      </label>
      {children}
      {error && <span className="text-error text-[11.5px]">{error}</span>}
    </div>
  )
}
