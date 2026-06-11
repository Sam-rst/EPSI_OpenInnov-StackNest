import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

import type { CatalogItem } from '../../catalog/domain/models/CatalogItem'
import { getTemplateConfig } from '../../deployment/services/templateConfigService'
import { deploymentErrorMessage } from '../../deployment/services/deploymentErrorMessage'
import { EmptyState } from '../../shared/components/EmptyState'
import { Button, Icon } from '../../shared/components/ui'
import { StackCatalogPanel } from '../components/StackCatalogPanel'
import { StackServiceBlock } from '../components/StackServiceBlock'
import { StackValidationSummary } from '../components/StackValidationSummary'
import { useCreateStack } from '../hooks/useCreateStack'
import { useStackComposition } from '../hooks/useStackComposition'

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

const NAME_INPUT_CLASS =
  'border-border bg-surface focus:border-cyan h-11 w-full rounded-md border px-3 text-[14px] text-text-primary outline-none transition'

/**
 * Builder de stack (`/stacks/new`) : volet catalogue à gauche, composition à
 * droite (nom + blocs de services + liens). « Déployer la stack » crée la stack
 * (`POST /stacks`) puis redirige vers `/stacks/{id}`.
 *
 * Ajouter un service depuis le catalogue charge sa fiche complète
 * (`getTemplateConfig`) pour disposer des versions / params / descripteur (clé
 * des mappings de liens par défaut). La validation (alias, ≥ 1 service, cycles)
 * conditionne le bouton ; toute erreur d'appel est affichée (jamais silencieuse).
 */
export function StackBuilderPage() {
  const navigate = useNavigate()
  const composition = useStackComposition()
  const createStack = useCreateStack()
  const [name, setName] = useState('')
  const [submitError, setSubmitError] = useState<string | undefined>(undefined)

  const handleAdd = async (item: CatalogItem): Promise<void> => {
    setSubmitError(undefined)
    try {
      const template = await getTemplateConfig(item.id)
      composition.addService(template)
    } catch (error) {
      setSubmitError(deploymentErrorMessage(error))
    }
  }

  const handleDeploy = async (): Promise<void> => {
    setSubmitError(undefined)
    try {
      const { id } = await createStack.mutateAsync(composition.buildPayload(name))
      navigate(`/stacks/${id}`)
    } catch (error) {
      setSubmitError(deploymentErrorMessage(error))
    }
  }

  const nameValid = name.trim().length > 0
  const canDeploy = composition.validation.valid && nameValid && !createStack.isPending
  const errors = nameValid
    ? composition.validation.errors
    : ['Donne un nom à la stack.', ...composition.validation.errors]

  return (
    <div className="mx-auto max-w-[1400px] p-8">
      <BackLink />
      <header className="mb-6">
        <h1 className="text-text-primary text-[22px] font-bold">Composer une stack</h1>
        <p className="text-text-muted mt-1 text-[13.5px]">
          Ajoute des services, configure-les et lie-les, puis déploie le tout comme un projet Docker
          Compose.
        </p>
      </header>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[340px_1fr]">
        <StackCatalogPanel onAdd={(item) => void handleAdd(item)} />

        <div className="space-y-5">
          <label className="block">
            <span className="text-text-secondary mb-1.5 block text-[12px] font-medium">
              Nom de la stack
            </span>
            <input
              aria-label="Nom de la stack"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="ex. mon-app-complete"
              className={NAME_INPUT_CLASS}
            />
          </label>

          {composition.services.length === 0 ? (
            <EmptyState
              icon="layers"
              title="Stack vide"
              description="Ajoute un service depuis le catalogue pour commencer la composition."
            />
          ) : (
            composition.services.map((service) => (
              <StackServiceBlock
                key={service.localId}
                service={service}
                outgoingLinks={composition.links.filter(
                  (link) => link.fromLocalId === service.localId,
                )}
                providers={composition.services.filter(
                  (provider) => provider.localId !== service.localId,
                )}
                onAlias={(alias) => composition.setAlias(service.localId, alias)}
                onVersion={(version) => composition.setVersion(service.localId, version)}
                onParam={(key, value) => composition.setParam(service.localId, key, value)}
                onRemove={() => composition.removeService(service.localId)}
                onAddLink={(toLocalId) => composition.addLink(service.localId, toLocalId)}
                onRemoveLink={(linkLocalId) => composition.removeLink(linkLocalId)}
                onChangeLinkMappings={(linkLocalId, varMappings) =>
                  composition.setLinkMappings(linkLocalId, varMappings)
                }
              />
            ))
          )}

          <StackValidationSummary errors={errors} />

          {submitError && (
            <p role="alert" className="text-error text-[13px]">
              {submitError}
            </p>
          )}

          <Button
            variant="cyan"
            size="lg"
            icon="rocket"
            className="w-full"
            disabled={!canDeploy}
            onClick={() => void handleDeploy()}
          >
            {createStack.isPending ? 'Déploiement…' : 'Déployer la stack'}
          </Button>
        </div>
      </div>
    </div>
  )
}
