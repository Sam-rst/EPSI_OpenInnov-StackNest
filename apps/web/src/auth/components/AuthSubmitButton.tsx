import type { ReactNode } from 'react'

import { Button } from '../../shared/components/ui/Button'

interface AuthSubmitButtonProps {
  /** Indique une requête en cours : désactive le bouton et affiche un libellé d'attente. */
  isPending: boolean
  pendingLabel: string
  children: ReactNode
}

/** Bouton de soumission des formulaires d'authentification (pleine largeur, état d'attente). */
export function AuthSubmitButton({ isPending, pendingLabel, children }: AuthSubmitButtonProps) {
  return (
    <Button type="submit" variant="primary" size="lg" disabled={isPending} className="w-full">
      {isPending ? pendingLabel : children}
    </Button>
  )
}
