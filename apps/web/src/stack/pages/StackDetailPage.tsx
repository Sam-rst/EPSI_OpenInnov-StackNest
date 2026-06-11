import { Link, useNavigate, useParams } from 'react-router-dom'

import { EmptyState } from '../../shared/components/EmptyState'
import { Badge, Button, Icon } from '../../shared/components/ui'
import { StackServiceRow } from '../components/StackServiceRow'
import { useDeleteStack } from '../hooks/useDeleteStack'
import { useStack } from '../hooks/useStack'
import { useStackEvents } from '../hooks/useStackEvents'
import { labelForStackStatus, toneForStackStatus } from '../types/enums/StackStatus'

function BackLink() {
  return (
    <Link
      to="/stacks"
      className="text-text-muted hover:text-cyan mb-6 inline-flex items-center gap-1.5 text-[13px] font-medium transition"
    >
      <Icon name="arrow-left" size={14} />
      Retour aux stacks
    </Link>
  )
}

/**
 * Détail d'une stack (`/stacks/{id}`) : statut **global** + liste des
 * **services** avec statut / accès (gestion 2 niveaux, cf. design § Lifecycle).
 *
 * Live via SSE `GET /stacks/{id}/events` (lot 3). **Dégradation propre** : tant
 * qu'aucune trame n'est reçue (endpoint absent / erreur), on affiche les statuts
 * REST chargés par `useStack`. Le statut live prime dès qu'une trame arrive.
 */
export function StackDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { stack, loading, isError } = useStack(id)
  const events = useStackEvents(id)
  const deleteStack = useDeleteStack(id ?? '')

  if (loading) {
    return (
      <div className="mx-auto max-w-[1280px] p-8">
        <BackLink />
        <p className="text-text-muted text-[13.5px]">Chargement de la stack…</p>
      </div>
    )
  }

  if (isError || !stack) {
    return (
      <div className="mx-auto max-w-[1280px] p-8">
        <BackLink />
        <EmptyState
          icon="layers"
          title="Stack introuvable"
          description="Cette stack n'existe pas ou n'est plus disponible."
        />
      </div>
    )
  }

  // Statut global : le flux SSE prime dès qu'il a émis une trame ; sinon on
  // retombe sur le statut persisté (REST) — dégradation propre si l'endpoint
  // SSE n'existe pas encore (lot 3 en parallèle).
  const globalStatus = events.hasProgressed ? events.status : stack.status

  const handleDelete = async (): Promise<void> => {
    await deleteStack.mutateAsync()
    navigate('/stacks')
  }

  return (
    <div className="mx-auto max-w-[1280px] p-8">
      <BackLink />

      <header className="mb-6 flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="text-cyan flex h-11 w-11 items-center justify-center rounded-md bg-[color-mix(in_oklch,var(--color-cyan)_14%,transparent)]">
            <Icon name="layers" size={20} />
          </span>
          <div>
            <h1 className="text-text-primary text-[22px] font-bold">{stack.name}</h1>
            <div className="mt-1 flex items-center gap-2">
              <Badge tone={toneForStackStatus(globalStatus)}>
                {labelForStackStatus(globalStatus)}
              </Badge>
              <span className="text-text-muted text-[12px]">
                {stack.services.length} service{stack.services.length > 1 ? 's' : ''}
              </span>
            </div>
          </div>
        </div>
        <Button
          variant="danger"
          icon="trash-2"
          disabled={deleteStack.isPending}
          onClick={() => void handleDelete()}
        >
          {deleteStack.isPending ? 'Suppression…' : 'Détruire la stack'}
        </Button>
      </header>

      <section>
        <h2 className="text-text-secondary mb-3 text-[13px] font-semibold tracking-wide uppercase">
          Services
        </h2>
        {stack.services.length === 0 ? (
          <p className="text-text-muted text-[13px]">Aucun service dans cette stack.</p>
        ) : (
          <div className="space-y-2">
            {stack.services.map((service) => (
              <StackServiceRow
                key={service.id}
                service={service}
                liveStatus={events.serviceStatuses[service.alias]}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
