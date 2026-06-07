import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Link } from 'react-router-dom'

import { cn } from '../../../shared/lib/cn'
import { Avatar, Icon } from '../../../shared/components/ui'
import { SIDEBAR_NAV } from '../navigation'

interface TopBarUserProps {
  name: string
  role: string
  /** Déclenche la déconnexion (mutation gérée par le parent). */
  onLogout: () => void
  /** Couleur de la pastille d'initiales (jaune de marque par défaut). */
  color?: string
}

/** Raccourcis du menu : on réutilise le groupe « admin » de la nav (DRY). */
const MENU_LINKS = SIDEBAR_NAV.filter((item) => item.group === 'admin')

/**
 * Bloc utilisateur de la TopBar : avatar + identité, et menu déroulant animé
 * (en-tête identité, raccourcis Équipe / Paramètres, déconnexion). Se ferme au
 * clic extérieur ou sur la touche Échap.
 */
export function TopBarUser({ name, role, onLogout, color = '#fea21f' }: TopBarUserProps) {
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) {
      return
    }
    const handlePointerDown = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false)
      }
    }
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('mousedown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [open])

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="group flex items-center gap-2.5"
      >
        <Avatar name={name} color={color} size={30} />
        <span className="hidden text-left md:block">
          <span className="text-text-primary block text-[12.5px] leading-tight font-semibold">
            {name}
          </span>
          <span className="text-text-muted block text-[11px] leading-tight">{role}</span>
        </span>
        <Icon
          name="chevron-down"
          size={12}
          className={cn('opacity-50 transition-transform duration-200', open && 'rotate-180')}
        />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            role="menu"
            initial={{ opacity: 0, scale: 0.96, y: -6 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -6 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className="bg-surface-elevated border-border absolute right-0 z-30 mt-2 w-60 origin-top-right overflow-hidden rounded-xl border shadow-xl"
          >
            <div className="border-border flex items-center gap-3 border-b px-3 py-3">
              <Avatar name={name} color={color} size={34} />
              <span className="min-w-0">
                <span className="text-text-primary block truncate text-[12.5px] font-semibold">
                  {name}
                </span>
                <span className="text-text-muted block text-[11px]">{role}</span>
              </span>
            </div>

            <div className="py-1">
              {MENU_LINKS.map((item) => (
                <Link
                  key={item.id}
                  to={item.to}
                  role="menuitem"
                  onClick={() => setOpen(false)}
                  className="text-text-secondary hover:bg-surface-sunken hover:text-text-primary flex items-center gap-2.5 px-3 py-2 text-[13px]"
                >
                  <Icon name={item.icon} size={16} className="text-text-muted" />
                  {item.label}
                </Link>
              ))}
            </div>

            <div className="border-border border-t py-1">
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  setOpen(false)
                  onLogout()
                }}
                className="text-error hover:bg-error/10 flex w-full items-center gap-2.5 px-3 py-2 text-left text-[13px] font-medium"
              >
                <Icon name="log-out" size={16} />
                Déconnexion
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
