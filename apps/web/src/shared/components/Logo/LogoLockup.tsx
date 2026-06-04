import { cn } from '../../lib/cn'
import { LogoMark } from './LogoMark'
import type { LogoVariant } from './logoSources'

interface LogoLockupProps {
  size?: number
  variant?: LogoVariant
  className?: string
}

/** Lockup = symbole (décoratif) + wordmark « StackNest » porteur du nom accessible. */
export function LogoLockup({ size = 28, variant = 'color', className }: LogoLockupProps) {
  return (
    <span className={cn('inline-flex items-center gap-2 select-none', className)}>
      <LogoMark size={size} variant={variant} alt="" />
      <span className="font-bold tracking-tight" style={{ fontSize: Math.round(size * 0.62) }}>
        StackNest
      </span>
    </span>
  )
}
