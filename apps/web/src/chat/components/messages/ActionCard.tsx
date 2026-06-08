import { useNavigate } from 'react-router-dom'

import { Badge, Button, Icon } from '../../../shared/components/ui'
import { ACTION_KIND_LABELS } from '../../types/enums/ActionKind'
import {
  ACTION_STATUS_LABELS,
  ACTION_STATUS_TONES,
  ActionStatus,
} from '../../types/enums/ActionStatus'
import type { ActionProposal } from '../../types/models/ActionProposal'
import { ActionRecap } from './ActionRecap'

interface ActionCardProps {
  action: ActionProposal
  onConfirm: (actionId: string) => void
  onReject: (actionId: string) => void
}

/** Construit l'URL de config déploiement préremplie pour « Modifier ». */
function configUrlFor(action: ActionProposal): string {
  if (action.templateId === null) {
    return '/deployments/config'
  }
  return `/deployments/config?template=${action.templateId}`
}

/** Ligne d'identité de l'image figée (template + version + digest/tag). */
function ImageLine({ action }: { action: ActionProposal }) {
  if (action.image === null) {
    return null
  }
  return (
    <div className="border-border bg-code-bg mt-3 rounded-md border px-3 py-2 font-mono text-[11.5px]">
      <span className="text-text-muted">Image figée · </span>
      <span className="text-text-primary">{action.image}</span>
    </div>
  )
}

/**
 * Carte de confirmation avancée affichée sous un message assistant : bandeau de
 * reformulation d'intention, récap (image figée, params, quotas) et décision
 * Confirmer / Modifier / Annuler. « Modifier » préremplit la config déploiement
 * existante. Les boutons ne sont actifs qu'à l'état « à confirmer » ; un badge
 * de statut matérialise les états terminaux.
 */
export function ActionCard({ action, onConfirm, onReject }: ActionCardProps) {
  const navigate = useNavigate()
  const isPending = action.status === ActionStatus.PROPOSED

  return (
    <div className="border-border bg-surface mt-3 rounded-lg border p-3.5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-cyan flex h-7 w-7 items-center justify-center rounded-md bg-[color-mix(in_oklch,var(--color-cyan)_14%,transparent)]">
            <Icon name="rocket" size={14} />
          </span>
          <div className="text-text-secondary font-mono text-[10px] tracking-[0.12em] uppercase">
            {ACTION_KIND_LABELS[action.kind]}
          </div>
        </div>
        <Badge tone={ACTION_STATUS_TONES[action.status]}>
          {ACTION_STATUS_LABELS[action.status]}
        </Badge>
      </div>

      <p className="text-text-primary mt-2.5 text-[13.5px] leading-relaxed">{action.intent}</p>

      <ImageLine action={action} />
      <ActionRecap title="Paramètres" entries={action.params} />
      <ActionRecap title="Quotas" entries={action.quotas} />

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <Button
          variant="cyan"
          size="sm"
          icon="check"
          disabled={!isPending}
          onClick={() => onConfirm(action.id)}
        >
          Confirmer
        </Button>
        <Button
          variant="secondary"
          size="sm"
          icon="sliders-horizontal"
          disabled={!isPending}
          onClick={() => navigate(configUrlFor(action))}
        >
          Modifier
        </Button>
        <Button
          variant="ghost"
          size="sm"
          icon="x"
          disabled={!isPending}
          onClick={() => onReject(action.id)}
        >
          Annuler
        </Button>
      </div>
    </div>
  )
}
