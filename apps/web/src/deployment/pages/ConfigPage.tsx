import { Link, useSearchParams } from 'react-router-dom'

import { EmptyState } from '../../shared/components/EmptyState'
import { Icon } from '../../shared/components/ui'
import { ConfigHeader } from '../components/config/ConfigHeader'
import { DockerConfigForm } from '../components/config/DockerConfigForm'
import { TerraformComingSoon } from '../components/config/TerraformComingSoon'
import { useTemplateConfig } from '../hooks/useTemplateConfig'
import { EngineKind } from '../types/enums/EngineKind'

function MissingTemplate() {
  return (
    <EmptyState
      icon="package-x"
      title="Aucun template sélectionné"
      description="Choisis une ressource dans le catalogue pour la configurer."
    />
  )
}

function BackLink() {
  return (
    <Link
      to="/catalog"
      className="text-text-muted hover:text-cyan mb-6 inline-flex items-center gap-1.5 text-[13px] font-medium transition"
    >
      <Icon name="arrow-left" size={14} />
      Retour au catalogue
    </Link>
  )
}

/**
 * Page de configuration d'un déploiement. Lit `?template=:id`, charge la fiche
 * catalogue et branche le parcours selon le moteur : Docker → formulaire +
 * aperçu live ; Terraform → écran « à venir » (non déployable au MVP).
 */
export function ConfigPage() {
  const [searchParams] = useSearchParams()
  const templateId = searchParams.get('template') ?? undefined
  const { template, loading, isError } = useTemplateConfig(templateId)

  if (templateId === undefined) {
    return (
      <div className="p-8">
        <MissingTemplate />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-[1400px] p-8">
      {loading && (
        <>
          <BackLink />
          <p className="text-text-muted text-[13.5px]">Chargement du template…</p>
        </>
      )}

      {!loading && (isError || !template) && (
        <>
          <BackLink />
          <EmptyState
            icon="package-x"
            title="Template introuvable"
            description="Ce template n'existe pas ou n'est plus disponible dans le catalogue."
          />
        </>
      )}

      {!loading && !isError && template && (
        <>
          <ConfigHeader
            templateName={template.name}
            templateDescription={template.description}
            templateIcon={template.icon}
          />
          {template.engine === EngineKind.TERRAFORM ? (
            <TerraformComingSoon templateName={template.name} />
          ) : (
            <DockerConfigForm template={template} />
          )}
        </>
      )}
    </div>
  )
}
