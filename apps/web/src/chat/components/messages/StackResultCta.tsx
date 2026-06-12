import { useNavigate } from 'react-router-dom'

import { Button } from '../../../shared/components/ui'

interface StackResultCtaProps {
  /** Stack créée par l'action `compose_stack` confirmée (cible de la navigation). */
  stackId: string
}

/** Construit l'URL du détail de suivi de la stack créée. */
function detailUrlFor(stackId: string): string {
  return `/stacks/${stackId}`
}

/**
 * CTA affiché sous une carte d'action `compose_stack` exécutée avec succès :
 * « Voir la stack → » mène au suivi de la stack créée. Parallèle au CTA
 * déploiement : un appel à l'action VISIBLE plutôt qu'une redirection automatique
 * qui éjecterait l'utilisateur du chat — il décide quand basculer vers le suivi.
 */
export function StackResultCta({ stackId }: StackResultCtaProps) {
  const navigate = useNavigate()

  return (
    <div className="mt-3">
      <Button
        variant="cyan"
        size="sm"
        iconRight="arrow-right"
        onClick={() => navigate(detailUrlFor(stackId))}
      >
        Voir la stack
      </Button>
    </div>
  )
}
