import { act, renderHook } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { EngineKind } from '../../types/enums/EngineKind'
import { ParamKind } from '../../types/enums/ParamKind'
import type { TemplateConfig } from '../../types/models/TemplateConfig'
import { useDeploymentConfigForm } from '../useDeploymentConfigForm'

const template: TemplateConfig = {
  id: 'pg16',
  name: 'PostgreSQL',
  icon: 'database',
  description: 'Base relationnelle managée.',
  engine: EngineKind.DOCKER,
  imageRepository: 'postgres',
  internalPort: 5432,
  secretEnv: 'POSTGRES_PASSWORD',
  versions: [
    { version: '15', isDefault: false, isLts: true, eolDate: null },
    { version: '16', isDefault: true, isLts: false, eolDate: null },
  ],
  params: [
    {
      key: 'db_name',
      label: 'Nom de la base',
      type: ParamKind.STRING,
      required: true,
      defaultValue: 'app',
      options: null,
      orderIndex: 0,
    },
  ],
}

describe('useDeploymentConfigForm', () => {
  it('initialise depuis le template (version par défaut, valeurs des params, preset M)', () => {
    const { result } = renderHook(() => useDeploymentConfigForm(template))

    expect(result.current.values.version).toBe('16')
    expect(result.current.values.params.db_name).toBe('app')
    expect(result.current.values.preset.id).toBe('medium')
    expect(result.current.values.env).toBe('dev')
  })

  it('invalide tant que le nom est vide, valide ensuite', () => {
    const { result } = renderHook(() => useDeploymentConfigForm(template))

    expect(result.current.isValid).toBe(false)

    act(() => {
      result.current.setName('ma-base')
    })

    expect(result.current.values.name).toBe('ma-base')
    expect(result.current.isValid).toBe(true)
  })

  it('met à jour un paramètre dynamique', () => {
    const { result } = renderHook(() => useDeploymentConfigForm(template))

    act(() => {
      result.current.setParam('db_name', 'prod_db')
    })

    expect(result.current.values.params.db_name).toBe('prod_db')
  })

  it('construit le payload de création (version, env, params, limits)', () => {
    const { result } = renderHook(() => useDeploymentConfigForm(template))

    act(() => {
      result.current.setName('ma-base')
    })

    const payload = result.current.buildPayload()

    expect(payload.template_id).toBe('pg16')
    expect(payload.version).toBe('16')
    expect(payload.name).toBe('ma-base')
    expect(payload.limits).toEqual({ cpu: 1, memory_mb: 1024 })
    expect(payload.params.db_name).toBe('app')
  })
})
