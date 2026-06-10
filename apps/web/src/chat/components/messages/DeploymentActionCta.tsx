import { useNavigate } from 'react-router-dom'

import { Button, Icon } from '../../../shared/components/ui'
import { MarkdownContent } from './MarkdownContent'

interface DeploymentActionCtaProps {
  /** Template du catalogue à préremplir dans la config. */
  templateId: string
  /** Texte d'accompagnement (hors bloc JSON), affiché au-dessus du CTA. */
  precedingText: string
}

/** Construit l'URL de config déploiement préremplie pour le template détecté. */
function configUrlFor(templateId: string): string {
  return `/deployments/config?template=${templateId}`
}

/**
 * Fallback d'action (C2) : quand un message assistant décrit un déploiement en
 * JSON brut (petit modèle), on remplace le JSON par un CTA actionnable. Le texte
 * d'accompagnement éventuel reste rendu en Markdown ; le bouton préremplit la
 * config de déploiement existante plutôt que d'exposer la structure technique.
 */
export function DeploymentActionCta({ templateId, precedingText }: DeploymentActionCtaProps) {
  const navigate = useNavigate()

  return (
    <div>
      {precedingText !== '' && <MarkdownContent content={precedingText} />}
      <div className="border-cyan/40 bg-cyan/5 mt-2 rounded-lg border p-3.5">
        <div className="flex items-center gap-2">
          <span className="text-cyan flex h-7 w-7 items-center justify-center rounded-md bg-[color-mix(in_oklch,var(--color-cyan)_14%,transparent)]">
            <Icon name="rocket" size={14} />
          </span>
          <p className="text-text-primary text-[13px] font-medium">
            Un déploiement est prêt à être configuré.
          </p>
        </div>
        <div className="mt-3">
          <Button
            variant="cyan"
            size="sm"
            icon="sliders-horizontal"
            onClick={() => navigate(configUrlFor(templateId))}
          >
            Configurer ce déploiement
          </Button>
        </div>
      </div>
    </div>
  )
}
