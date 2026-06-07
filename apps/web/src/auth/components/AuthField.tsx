import { forwardRef, type InputHTMLAttributes } from 'react'

import { cn } from '../../shared/lib/cn'

interface AuthFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  id: string
  label: string
  /** Message d'erreur de validation (issu de react-hook-form). */
  error?: string
}

const INPUT_BASE = [
  'h-11 w-full rounded-md border bg-surface-elevated px-3.5 text-[13.5px] text-text-primary',
  'focus:border-cyan focus:outline-none focus:ring-2 focus:ring-cyan/30',
]

/** Champ de formulaire d'authentification : label, input contrôlé et message d'erreur accessible. */
export const AuthField = forwardRef<HTMLInputElement, AuthFieldProps>(function AuthField(
  { id, label, error, className, ...rest },
  ref,
) {
  const errorId = `${id}-error`

  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="text-text-secondary block text-[12px] font-medium">
        {label}
      </label>
      <input
        ref={ref}
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errorId : undefined}
        className={cn(INPUT_BASE, error ? 'border-error' : 'border-border', className)}
        {...rest}
      />
      {error && (
        <p id={errorId} role="alert" className="text-error text-[12px]">
          {error}
        </p>
      )}
    </div>
  )
})
