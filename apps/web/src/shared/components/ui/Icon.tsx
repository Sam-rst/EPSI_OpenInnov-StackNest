import * as LucideIcons from 'lucide-react'
import type { LucideIcon, LucideProps } from 'lucide-react'

import { cn } from '../../lib/cn'

interface IconProps extends Omit<LucideProps, 'size' | 'ref'> {
  /** Nom kebab-case (ex. « arrow-up-right », « search-x »). */
  name: string
  size?: number
}

const toPascalCase = (kebab: string): string =>
  kebab
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join('')

/**
 * Wrapper lucide-react acceptant des noms kebab-case.
 * Lookup runtime : « arrow-up-right » → ArrowUpRight.
 */
export function Icon({ name, size = 16, strokeWidth = 1.75, className, ...rest }: IconProps) {
  const componentName = toPascalCase(name)
  const Component = (LucideIcons as unknown as Record<string, LucideIcon | undefined>)[
    componentName
  ]

  if (!Component) {
    if (import.meta.env.DEV) {
      console.warn(`[Icon] « ${name} » → « ${componentName} » introuvable`)
    }
    return null
  }

  return (
    <Component
      size={size}
      strokeWidth={strokeWidth}
      className={cn('inline-block', className)}
      {...rest}
    />
  )
}
