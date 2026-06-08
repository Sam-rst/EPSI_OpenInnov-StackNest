import { Link } from 'react-router-dom'

import { Badge } from '../../../shared/components/ui'
import { toneForStatus } from '../../../deployment/types/enums/DeploymentStatus'
import type { Deployment } from '../../../deployment/types/models/Deployment'

interface ContextAsideProps {
  /** Déploiements de l'utilisateur (lecture seule, slice déploiement). */
  deployments: readonly Deployment[]
  loading: boolean
  isError: boolean
}

/** Carte d'un déploiement actif : nom + accès, liée à sa page de détail. */
function DeploymentCard({ deployment }: { deployment: Deployment }) {
  return (
    <Link
      to={`/deployments/${deployment.id}`}
      className="border-border bg-surface hover:border-cyan block rounded-md border p-3 transition"
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-text-primary truncate text-[12.5px] font-medium">
          {deployment.name}
        </span>
        <Badge tone={toneForStatus(deployment.status)}>{deployment.statusLabel}</Badge>
      </div>
      {deployment.accessUrl && (
        <div className="text-text-muted mt-1 truncate font-mono text-[11px]">
          {deployment.accessUrl}
        </div>
      )}
    </Link>
  )
}

/**
 * Colonne de droite (280px) : déploiements actifs de l'utilisateur, en lecture
 * seule via la slice déploiement. Donne le contexte de l'assistant et permet de
 * rebondir vers le détail d'une ressource. États vide/chargement/erreur honnêtes.
 */
export function ContextAside({ deployments, loading, isError }: ContextAsideProps) {
  return (
    <aside className="border-border bg-surface-elevated flex h-full flex-col overflow-y-auto border-l">
      <div className="border-border border-b p-4">
        <div className="text-text-muted font-mono text-[11px] tracking-[0.14em] uppercase">
          Déploiements actifs
        </div>
        <div className="text-text-secondary mt-1 text-[12px]">Contexte de l'assistant</div>
      </div>

      <div className="flex flex-col gap-2 p-3">
        {loading && (
          <p className="text-text-muted text-[12px]" role="status" aria-live="polite">
            Chargement des déploiements…
          </p>
        )}

        {!loading && isError && (
          <p className="text-text-muted text-[12px]">
            Liste des déploiements indisponible pour le moment.
          </p>
        )}

        {!loading && !isError && deployments.length === 0 && (
          <p className="text-text-muted text-[12px]">
            Aucun déploiement actif. L'assistant pourra t'en proposer un.
          </p>
        )}

        {!loading &&
          !isError &&
          deployments.map((deployment) => (
            <DeploymentCard key={deployment.id} deployment={deployment} />
          ))}
      </div>
    </aside>
  )
}
