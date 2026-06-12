import { useNavigate } from 'react-router-dom'

import { Badge, Icon } from '../../shared/components/ui'
import {
  labelForServiceStatus,
  type ServiceStatus,
  toneForServiceStatus,
} from '../types/enums/ServiceStatus'
import type { StackServiceModel } from '../types/models/Stack'

interface StackServiceRowProps {
  /** Identifiant de la stack parente (pour la navigation vers le détail service). */
  stackId: string
  service: StackServiceModel
  /** Statut live (SSE) prioritaire ; sinon on retombe sur le statut REST. */
  liveStatus: ServiceStatus | undefined
}

/**
 * Ligne de service dans le détail d'une stack (niveau « service ») : alias,
 * template/version, statut (live SSE prioritaire, sinon REST) et accès
 * (`host:port` publié) quand disponible. Toute la ligne est cliquable vers la
 * page détail du service (`/stacks/{id}/services/{alias}`). Aucun secret n'y
 * figure (les params `secret` arrivent déjà masqués de l'API).
 */
export function StackServiceRow({ stackId, service, liveStatus }: StackServiceRowProps) {
  const navigate = useNavigate()
  const status = liveStatus ?? service.status
  const access = service.publishedPort !== null ? `localhost:${service.publishedPort}` : undefined

  return (
    <button
      type="button"
      onClick={() => navigate(`/stacks/${stackId}/services/${service.alias}`)}
      aria-label={`Voir le service ${service.alias}`}
      className="border-border bg-surface-elevated hover:border-cyan focus-visible:ring-cyan flex w-full items-center justify-between gap-3 rounded-md border p-3 text-left transition outline-none focus-visible:ring-2"
    >
      <div className="flex min-w-0 items-center gap-2.5">
        <Icon name="box" size={15} className="text-cyan shrink-0" />
        <div className="min-w-0">
          <div className="text-text-primary truncate font-mono text-[13px] font-semibold">
            {service.alias}
          </div>
          <div className="text-text-muted truncate text-[11.5px]">
            {service.templateId} · v{service.version}
            {access && <span className="ml-2 font-mono">{access}</span>}
          </div>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <Badge tone={toneForServiceStatus(status)}>{labelForServiceStatus(status)}</Badge>
        <Icon name="chevron-right" size={15} className="text-text-muted" />
      </div>
    </button>
  )
}
