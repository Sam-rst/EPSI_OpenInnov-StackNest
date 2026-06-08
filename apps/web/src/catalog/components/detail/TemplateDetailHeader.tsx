import { useNavigate } from 'react-router-dom'

import { Badge, Button, Icon } from '../../../shared/components/ui'
import type { TemplateDetail } from '../../types/models/TemplateDetail'

interface TemplateDetailHeaderProps {
  detail: TemplateDetail
}

/**
 * En-tête de la fiche détail : icône, nom, catégorie/provider, tags, description
 * et bouton « Déployer » menant à la configuration du template
 * (`/deployments/config?template=:id`).
 */
export function TemplateDetailHeader({ detail }: TemplateDetailHeaderProps) {
  const navigate = useNavigate()

  return (
    <div className="border-border bg-surface-elevated rounded-lg border p-6">
      <div className="flex items-start gap-4">
        <span className="text-cyan flex h-14 w-14 shrink-0 items-center justify-center rounded-md bg-[color-mix(in_oklch,var(--color-cyan)_14%,transparent)]">
          <Icon name={detail.icon} size={26} />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <h1 className="text-text-primary text-[24px] font-bold tracking-[-0.02em]">
              {detail.name}
            </h1>
            {detail.popular && <Badge tone="yellow">Populaire</Badge>}
          </div>
          <p className="text-text-muted mt-1 text-[12.5px]">
            {detail.categoryLabel} · via {detail.provider}
          </p>
        </div>
        <Button
          variant="cyan"
          icon="rocket"
          onClick={() => navigate(`/deployments/config?template=${detail.id}`)}
        >
          Déployer
        </Button>
      </div>

      <p className="text-text-secondary mt-4 text-[14px] leading-relaxed">{detail.description}</p>

      {detail.tags.length > 0 && (
        <div className="mt-4 flex flex-wrap items-center gap-1.5">
          {detail.tags.map((tag) => (
            <Badge key={tag} tone="neutral">
              {tag}
            </Badge>
          ))}
        </div>
      )}
    </div>
  )
}
