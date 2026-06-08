import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { Button } from '../../../shared/components/ui'
import { CapacityCard } from './CapacityCard'
import { DockerPreview } from './DockerPreview'
import { IdentityCard } from './IdentityCard'
import { createDeployment } from '../../services/deploymentService'
import { useDeploymentConfigForm } from '../../hooks/useDeploymentConfigForm'
import type { TemplateConfig } from '../../types/models/TemplateConfig'

interface DockerConfigFormProps {
  template: TemplateConfig
}

/**
 * Formulaire de configuration Docker (engine === docker) : identité + capacité +
 * aperçu live, puis bouton Déployer qui crée le déploiement (seam display-only)
 * et navigue vers la page de suivi `/deployments/:id`.
 */
export function DockerConfigForm({ template }: DockerConfigFormProps) {
  const navigate = useNavigate()
  const form = useDeploymentConfigForm(template)
  const [submitting, setSubmitting] = useState(false)

  const handleDeploy = async (): Promise<void> => {
    setSubmitting(true)
    try {
      const { id } = await createDeployment(form.buildPayload())
      navigate(`/deployments/${id}`)
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
          onName={form.setName}
          onEnv={form.setEnv}
        />
        <CapacityCard
          versions={template.versions}
          params={template.params}
          version={form.values.version}
          paramValues={form.values.params}
          preset={form.values.preset}
          onVersion={form.setVersion}
          onParam={form.setParam}
          onPreset={form.setPreset}
        />
      </div>
      <div className="space-y-5">
        <DockerPreview template={template} values={form.values} />
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
