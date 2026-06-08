import { describe, expect, it } from 'vitest'

import type { DeploymentConfigValues } from '../../../hooks/useDeploymentConfigForm'
import { EngineKind } from '../../../types/enums/EngineKind'
import { ParamKind } from '../../../types/enums/ParamKind'
import { RESOURCE_PRESETS, type ResourcePreset } from '../../../types/models/ResourcePreset'
import type { TemplateConfig } from '../../../types/models/TemplateConfig'
import { MASKED_SECRET, buildDockerPreviewLines } from '../dockerPreviewLines'

const template: TemplateConfig = {
  id: 'pg16',
  name: 'PostgreSQL',
  icon: 'database',
  description: '',
  engine: EngineKind.DOCKER,
  imageRepository: 'postgres',
  internalPort: 5432,
  secretEnv: 'POSTGRES_PASSWORD',
  versions: [{ version: '16', isDefault: true, isLts: false, eolDate: null }],
  params: [
    {
      key: 'app_secret',
      label: 'Secret applicatif',
      type: ParamKind.SECRET,
      required: false,
      defaultValue: null,
      options: null,
      orderIndex: 0,
    },
  ],
}

const values: DeploymentConfigValues = {
  name: 'ma-base',
  env: 'prod',
  version: '16',
  params: { app_secret: 'ne-doit-pas-apparaitre' },
  preset: RESOURCE_PRESETS[1] as ResourcePreset,
}

describe('buildDockerPreviewLines', () => {
  it('construit l’image effective repository:version', () => {
    const text = buildDockerPreviewLines(template, values)
      .map((line) => line.text)
      .join('\n')

    expect(text).toContain('postgres:16')
    expect(text).toContain('--name stacknest-ma-base')
    expect(text).toContain('--publish <hôte>:5432')
  })

  it('masque le secret d’env et les params de type secret (aucune valeur réelle)', () => {
    const text = buildDockerPreviewLines(template, values)
      .map((line) => line.text)
      .join('\n')

    expect(text).toContain(`POSTGRES_PASSWORD=${MASKED_SECRET}`)
    expect(text).toContain(`app_secret=${MASKED_SECRET}`)
    expect(text).not.toContain('ne-doit-pas-apparaitre')
  })

  it('reste honnête quand l’image n’est pas connue (placeholder)', () => {
    const text = buildDockerPreviewLines({ ...template, imageRepository: null }, values)
      .map((line) => line.text)
      .join('\n')

    expect(text).toContain('<image>:16')
  })
})
