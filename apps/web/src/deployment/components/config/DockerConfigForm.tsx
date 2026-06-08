import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { Button } from '../../../shared/components/ui'
import { CapacityCard } from './CapacityCard'
import { DockerPreview } from './DockerPreview'
import { FormError } from '../common/FormError'
import { IdentityCard } from './IdentityCard'
import { createDeployment } from '../../services/deploymentService'
import { deploymentErrorMessage } from '../../services/deploymentErrorMessage'
import { useDeploymentConfigForm } from '../../hooks/useDeploymentConfigForm'
import type { TemplateConfig } from '../../types/models/TemplateConfig'

interface DockerConfigFormProps {
  template: TemplateConfig
}

/**
 * Formulaire de configuration Docker (engine === docker) : identité + capacité +
 * aperçu live, puis bouton Déployer qui crée le déploiement et navigue vers la
 * page de suivi `/deployments/:id`.
 *
 * L'échec d'appel n'est jamais silencieux (#1) : toute erreur (422/409/réseau)
 * est capturée et affichée en haut du formulaire avec le message de l'API.
 */
export function DockerConfigForm({ template }: DockerConfigFormProps) {
  const navigate = useNavigate()
  const form = useDeploymentConfigForm(template)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | undefined>(undefined)

  const handleDeploy = async (): Promise<void> => {
    setSubmitting(true)
    setSubmitError(undefined)
    try {
      const { id } = await createDeployment(form.buildPayload())
      navigate(`/deployments/${id}`)
    } catch (error) {
      setSubmitError(deploymentErrorMessage(error))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
      <div className="space-y-5">
        <IdentityCard
          name={form.values.name}
          env={form.values.env}
          nameError={form.errors.name}
          onName={form.setName}
          onEnv={form.setEnv}
        />
        <CapacityCard
          versions={template.versions}
          params={template.params}
          version={form.values.version}
          paramValues={form.values.params}
          paramErrors={form.errors.params}
          preset={form.values.preset}
          onVersion={form.setVersion}
          onParam={form.setParam}
          onPreset={form.setPreset}
        />
      </div>
      <div className="space-y-5">
        <DockerPreview template={template} values={form.values} />
        {submitError && <FormError message={submitError} />}
        <Button
          variant="cyan"
          icon="rocket"
          size="lg"
          className="w-full"
          disabled={!form.isValid || submitting}
          onClick={() => {
            void handleDeploy()
          }}
        >
          {submitting ? 'Déploiement…' : 'Déployer'}
        </Button>
      </div>
    </div>
  )
}
