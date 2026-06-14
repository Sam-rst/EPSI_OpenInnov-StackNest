import { Link, useNavigate, useParams } from 'react-router-dom'

import { BetaBanner } from '../../shared/components/BetaBanner'
import { EmptyState } from '../../shared/components/EmptyState'
import { Badge, Button, Icon } from '../../shared/components/ui'
import { StackServiceParams } from '../components/StackServiceParams'
import { StackWiringRow } from '../components/StackWiringRow'
import { useDeleteStack } from '../hooks/useDeleteStack'
import { useStack } from '../hooks/useStack'
import { useStackEvents } from '../hooks/useStackEvents'
import { selectStackService } from '../hooks/selectStackService'
import { labelForServiceStatus, toneForServiceStatus } from '../types/enums/ServiceStatus'

function BackLink({ stackId }: { stackId: string | undefined }) {
  return (
    <Link
      to={stackId ? `/stacks/${stackId}` : '/stacks'}
      className="text-text-muted hover:text-cyan mb-6 inline-flex items-center gap-1.5 text-[13px] font-medium transition"
    >
      <Icon name="arrow-left" size={14} />
      Retour à la stack
    </Link>
  )
}

function SectionTitle({ children }: { children: string }) {
  return (
    <h2 className="text-text-secondary mb-3 text-[13px] font-semibold tracking-wide uppercase">
      {children}
    </h2>
  )
}

/**
 * Détail d'un service membre d'une stack (`/stacks/{id}/services/{alias}`). Vue
 * **informationnelle** : image (template), version, statut (live SSE prioritaire,
 * sinon REST), port publié, référence conteneur, params non-secret et câblage
 * (liens entrants/sortants). Données dérivées du détail stack déjà chargé — aucun
 * appel supplémentaire.
 *
 * ⚠️ En v1, le back ne supporte pas le cycle de vie **par service** (Compose v1 :
 * lifecycle au niveau stack). On n'expose donc QUE l'action stack-level
 * (destruction de la stack). Les actions par service (stop/start/restart)
 * nécessitent une évolution back, à ticketer.
 */
export function StackServiceDetailPage() {
  const { id, alias } = useParams<{ id: string; alias: string }>()
  const navigate = useNavigate()
  const { stack, loading, isError } = useStack(id)
  const events = useStackEvents(id)
  const deleteStack = useDeleteStack(id ?? '')
  const view = selectStackService(stack, alias)

  if (loading) {
    return (
      <div className="mx-auto max-w-[1280px] p-8">
        <BackLink stackId={id} />
        <p className="text-text-muted text-[13.5px]">Chargement du service…</p>
      </div>
    )
  }

  if (isError || !view) {
    return (
      <div className="mx-auto max-w-[1280px] p-8">
        <BackLink stackId={id} />
        <EmptyState
          icon="box"
          title="Service introuvable"
          description="Ce service n'existe pas ou la stack n'est plus disponible."
        />
      </div>
    )
  }

  const { service, incoming, outgoing } = view
  const liveStatus = events.serviceStatuses[service.alias] ?? service.status
  const access = service.publishedPort !== null ? `localhost:${service.publishedPort}` : '—'

  const handleDestroyStack = async (): Promise<void> => {
    await deleteStack.mutateAsync()
    navigate(`/stacks/${id}`)
  }

  return (
    <div className="mx-auto max-w-[1280px] p-8">
      <BackLink stackId={id} />

      <BetaBanner className="mb-6" />

      <header className="mb-6 flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="text-cyan flex h-11 w-11 items-center justify-center rounded-md bg-[color-mix(in_oklch,var(--color-cyan)_14%,transparent)]">
            <Icon name="box" size={20} />
          </span>
          <div>
            <h1 className="text-text-primary font-mono text-[22px] font-bold">{service.alias}</h1>
            <div className="mt-1 flex items-center gap-2">
              <Badge tone={toneForServiceStatus(liveStatus)}>
                {labelForServiceStatus(liveStatus)}
              </Badge>
              {stack && <span className="text-text-muted text-[12px]">dans {stack.name}</span>}
            </div>
          </div>
        </div>
        <Button
          variant="danger"
          icon="trash-2"
          disabled={deleteStack.isPending}
          onClick={() => void handleDestroyStack()}
        >
          {deleteStack.isPending ? 'Suppression…' : 'Détruire la stack'}
        </Button>
      </header>

      <section className="mb-8">
        <SectionTitle>Informations</SectionTitle>
        <div className="border-border bg-surface-elevated grid grid-cols-1 gap-x-8 gap-y-3 rounded-lg border p-5 text-[13px] sm:grid-cols-2">
          <Info label="Image" value={service.templateId} mono />
          <Info label="Version" value={service.version} mono />
          <Info label="Accès" value={access} mono />
          <Info label="Conteneur" value={service.containerRef ?? '—'} mono />
        </div>
      </section>

      <section className="mb-8">
        <SectionTitle>Paramètres</SectionTitle>
        <div className="border-border bg-surface-elevated rounded-lg border p-5">
          <StackServiceParams params={service.params} />
        </div>
      </section>

      <section>
        <SectionTitle>Câblage</SectionTitle>
        {incoming.length === 0 && outgoing.length === 0 ? (
          <p className="text-text-muted text-[13px]">Ce service n'est lié à aucun autre.</p>
        ) : (
          <div className="space-y-4">
            {outgoing.length > 0 && (
              <div>
                <p className="text-text-muted mb-2 text-[12px]">Consomme (sortant)</p>
                <div className="space-y-2">
                  {outgoing.map((link) => (
                    <StackWiringRow key={link.id} link={link} />
                  ))}
                </div>
              </div>
            )}
            {incoming.length > 0 && (
              <div>
                <p className="text-text-muted mb-2 text-[12px]">Fournit (entrant)</p>
                <div className="space-y-2">
                  {incoming.map((link) => (
                    <StackWiringRow key={link.id} link={link} />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </section>
    </div>
  )
}

function Info({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-text-secondary">{label}</span>
      <span className={mono ? 'text-text-primary font-mono' : 'text-text-primary'}>{value}</span>
    </div>
  )
}
