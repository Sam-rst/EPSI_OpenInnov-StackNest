import { Badge, Icon } from '../../shared/components/ui'
import {
  labelForServiceStatus,
  type ServiceStatus,
  toneForServiceStatus,
} from '../types/enums/ServiceStatus'
import type { StackServiceModel } from '../types/models/Stack'

interface StackServiceRowProps {
  service: StackServiceModel
  /** Statut live (SSE) prioritaire ; sinon on retombe sur le statut REST. */
  liveStatus: ServiceStatus | undefined
}

/**
 * Ligne de service dans le détail d'une stack (niveau « service ») : alias,
 * template/version, statut (live SSE prioritaire, sinon REST) et accès
 * (`host:port` publié) quand disponible. Aucun secret n'y figure (les params
 * `secret` arrivent déjà masqués de l'API).
 */
export function StackServiceRow({ service, liveStatus }: StackServiceRowProps) {
  const status = liveStatus ?? service.status
  const access = service.publishedPort !== null ? `localhost:${service.publishedPort}` : undefined

  return (
    <div className="border-border bg-surface-elevated flex items-center justify-between gap-3 rounded-md border p-3">
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
      <Badge tone={toneForServiceStatus(status)}>{labelForServiceStatus(status)}</Badge>
    </div>
  )
}
