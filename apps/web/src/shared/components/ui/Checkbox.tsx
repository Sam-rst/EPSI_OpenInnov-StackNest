import { forwardRef, useEffect, useRef, type InputHTMLAttributes, type ReactNode } from 'react'

import { cn } from '../../lib/cn'

interface CheckboxProps extends Omit<
  InputHTMLAttributes<HTMLInputElement>,
  'onChange' | 'type' | 'checked'
> {
  checked: boolean
  /** Notifie le nouvel état coché (et non l'événement). */
  onChange: (checked: boolean) => void
  /** Affiche l'état indéterminé (sélection partielle), ex. case « tout sélectionner ». */
  indeterminate?: boolean
  /** Libellé visible cliquable. Sinon fournir `aria-label` pour l'accessibilité. */
  label?: ReactNode
}

/*
 * `accent-cyan` colore la coche aux tokens de marque ; `cursor-pointer` et la
 * taille 1rem (h-4 w-4) rétablissent l'affordance que Preflight v4 retire aux
 * checkbox natifs. L'anneau de focus cyan signale le focus clavier.
 */
const BOX = [
  'accent-cyan h-4 w-4 shrink-0 cursor-pointer rounded',
  'outline-none focus-visible:ring-2 focus-visible:ring-cyan focus-visible:ring-offset-1',
  'disabled:cursor-not-allowed disabled:opacity-50',
]

/** Synchronise la propriété DOM `indeterminate` (non exprimable en JSX). */
function useIndeterminate(ref: React.RefObject<HTMLInputElement | null>, indeterminate: boolean) {
  useEffect(() => {
    if (ref.current) {
      ref.current.indeterminate = indeterminate
    }
  }, [ref, indeterminate])
}

/**
 * Case à cocher stylée de la charte : coche `accent-cyan`, anneau de focus,
 * état indéterminé et libellé accessible. Sans `label`, fournir `aria-label`.
 * Avec `label`, toute la zone label + case est cliquable (hit-area confortable).
 */
export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(function Checkbox(
  { checked, onChange, indeterminate = false, label, className, disabled, ...rest },
  forwardedRef,
) {
  const innerRef = useRef<HTMLInputElement>(null)
  useIndeterminate(innerRef, indeterminate)

  const setRefs = (node: HTMLInputElement | null): void => {
    innerRef.current = node
    if (typeof forwardedRef === 'function') {
      forwardedRef(node)
    } else if (forwardedRef) {
      forwardedRef.current = node
    }
  }

  const input = (
    <input
      ref={setRefs}
      type="checkbox"
      checked={checked}
      disabled={disabled}
      onChange={(event) => onChange(event.target.checked)}
      className={cn(BOX, className)}
      {...rest}
    />
  )

  if (label === undefined) {
    return input
  }

  return (
    <label
      className={cn(
        'text-text-secondary inline-flex cursor-pointer items-center gap-2 text-[12.5px]',
        disabled && 'cursor-not-allowed opacity-50',
      )}
    >
      {input}
      {label}
    </label>
  )
})
