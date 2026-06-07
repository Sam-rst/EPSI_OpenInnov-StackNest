import { useState } from 'react'

import { Avatar, Icon } from '../../../shared/components/ui'

interface TopBarUserProps {
  name: string
  role: string
  /** Déclenche la déconnexion (mutation gérée par le parent). */
  onLogout: () => void
  /** Couleur de la pastille d'initiales (jaune de marque par défaut). */
  color?: string
}

/** Bloc utilisateur de la TopBar : avatar + identité + menu (déconnexion). */
export function TopBarUser({ name, role, onLogout, color = '#fea21f' }: TopBarUserProps) {
  const [open, setOpen] = useState(false)

  return (
    <div className="relative">
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
        <Icon name="chevron-down" size={12} className="opacity-50" />
      </button>

      {open && (
        <div
          role="menu"
          className="bg-surface-elevated border-border absolute right-0 z-20 mt-2 min-w-44 overflow-hidden rounded-lg border py-1 shadow-lg"
        >
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setOpen(false)
              onLogout()
            }}
            className="text-text-secondary hover:bg-surface-sunken hover:text-text-primary block w-full px-3 py-2 text-left text-[13px]"
          >
            Déconnexion
          </button>
        </div>
      )}
    </div>
  )
}
