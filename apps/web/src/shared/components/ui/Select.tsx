import { forwardRef, type ReactNode, type SelectHTMLAttributes } from 'react'

import { cn } from '../../lib/cn'
import { Icon } from './Icon'

export interface SelectOption {
  value: string
  label: string
  disabled?: boolean
}

interface SelectProps extends Omit<
  SelectHTMLAttributes<HTMLSelectElement>,
  'onChange' | 'value' | 'size'
> {
  value: string
  /** Notifie la valeur choisie (et non l'événement) — API alignée sur Button/usages. */
  onChange: (value: string) => void
  /** Options déclaratives ; sinon passer des <option> en enfants. */
  options?: readonly SelectOption[]
  /** État invalide : pose `aria-invalid` et la bordure d'erreur. */
  invalid?: boolean
  children?: ReactNode
}

/*
 * Bordure/fond/texte pilotés par les tokens sémantiques (clair + sombre).
 * `appearance-none` retire le chevron natif (remplacé par une icône lucide),
 * `cursor-pointer` rétablit l'affordance que Preflight v4 retire aux <select>,
 * et `pr-9` réserve la place du chevron. La zone cliquable couvre tout le contrôle.
 */
const BASE = [
  'h-10 w-full cursor-pointer appearance-none rounded-md border bg-surface px-3 pr-9',
  'font-mono text-[13px] text-text-primary transition',
  'outline-none focus-visible:ring-2 focus-visible:ring-cyan focus-visible:border-cyan',
  'disabled:cursor-not-allowed disabled:opacity-50',
]

const BORDER_VALID = 'border-border hover:border-border-strong'
const BORDER_INVALID = 'border-error focus-visible:ring-error focus-visible:border-error'

/**
 * Select stylé de la charte : chevron lucide (décoratif, `pointer-events-none`
 * pour ne jamais intercepter le clic), zone cliquable pleine, anneau de focus
 * cyan, contraste clair + sombre. Notifie la valeur choisie via `onChange`.
 */
export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { value, onChange, options, invalid = false, className, children, ...rest },
  ref,
) {
  return (
    <div className="relative w-full">
      <select
        ref={ref}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        aria-invalid={invalid || undefined}
        className={cn(BASE, invalid ? BORDER_INVALID : BORDER_VALID, className)}
        {...rest}
      >
        {options
          ? options.map((option) => (
              <option key={option.value} value={option.value} disabled={option.disabled}>
                {option.label}
              </option>
            ))
          : children}
      </select>
      <Icon
        name="chevron-down"
        size={16}
        className="text-text-muted pointer-events-none absolute top-1/2 right-3 -translate-y-1/2"
      />
    </div>
  )
})
