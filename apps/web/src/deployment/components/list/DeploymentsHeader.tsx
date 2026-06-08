import { Link } from 'react-router-dom'

import { Button } from '../../../shared/components/ui'

/** En-tête de la liste : titre + bouton « Nouveau déploiement » (→ catalogue). */
export function DeploymentsHeader() {
  return (
    <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
      <div>
        <h1 className="text-text-primary text-[24px] font-bold tracking-[-0.02em]">Déploiements</h1>
        <p className="text-text-muted text-[12.5px]">Tes ressources provisionnées et leur état.</p>
      </div>
      <Link to="/catalog">
        <Button variant="cyan" icon="plus">
          Nouveau déploiement
        </Button>
      </Link>
    </div>
  )
}
