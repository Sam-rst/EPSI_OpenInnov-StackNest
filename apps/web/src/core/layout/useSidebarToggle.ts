import { useCallback, useState } from 'react'

export interface SidebarToggle {
  isOpen: boolean
  open: () => void
  close: () => void
  toggle: () => void
}

/**
 * Etat d'ouverture de la Sidebar (mode drawer mobile).
 * Fermee par defaut pour respecter le pattern mobile-first.
 */
export function useSidebarToggle(initiallyOpen = false): SidebarToggle {
  const [isOpen, setIsOpen] = useState(initiallyOpen)

  const open = useCallback(() => {
    setIsOpen(true)
  }, [])
  const close = useCallback(() => {
    setIsOpen(false)
  }, [])
  const toggle = useCallback(() => {
    setIsOpen((prev) => !prev)
  }, [])

  return { isOpen, open, close, toggle }
}
