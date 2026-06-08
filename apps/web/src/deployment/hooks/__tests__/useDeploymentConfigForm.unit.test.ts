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

  it('signale un nom vide avec un message inline (sans erreur tant que non touché)', () => {
    const { result } = renderHook(() => useDeploymentConfigForm(template))

    // Vierge : pas encore d'erreur affichée (champ non touché).
    expect(result.current.errors.name).toBeUndefined()

    act(() => {
      result.current.setName('')
    })

    expect(result.current.errors.name).toBeDefined()
    expect(result.current.isValid).toBe(false)
  })

  it('rejette un nom au mauvais format DNS (majuscules, espaces, underscore)', () => {
    const { result } = renderHook(() => useDeploymentConfigForm(template))

    const invalids = ['Ma-Base', 'ma base', 'ma_base', '-debut', 'fin-', 'a'.repeat(64)]
    for (const value of invalids) {
      act(() => {
        result.current.setName(value)
      })
      expect(result.current.isValid).toBe(false)
      expect(result.current.errors.name).toBeDefined()
    }
  })

  it('accepte un nom au format label DNS (minuscules, chiffres, tirets)', () => {
    const { result } = renderHook(() => useDeploymentConfigForm(template))

    act(() => {
      result.current.setName('ma-base-01')
    })

    expect(result.current.errors.name).toBeUndefined()
    expect(result.current.isValid).toBe(true)
  })

  it('bloque tant qu’un paramètre requis est vide, débloque une fois rempli', () => {
    const requiredTemplate: TemplateConfig = {
      ...template,
      params: [
        {
          key: 'db_name',
          label: 'Nom de la base',
          type: ParamKind.STRING,
          required: true,
          defaultValue: null,
          options: null,
          orderIndex: 0,
        },
      ],
    }
    const { result } = renderHook(() => useDeploymentConfigForm(requiredTemplate))

    act(() => {
      result.current.setName('ma-base')
    })

    // Nom valide mais param requis vide → toujours invalide + erreur sur le param.
    expect(result.current.isValid).toBe(false)
    expect(result.current.errors.params.db_name).toBeDefined()

    act(() => {
      result.current.setParam('db_name', 'app')
    })

    expect(result.current.errors.params.db_name).toBeUndefined()
    expect(result.current.isValid).toBe(true)
  })

  it('n’exige pas les paramètres optionnels vides', () => {
    const optionalTemplate: TemplateConfig = {
      ...template,
      params: [
        {
          key: 'note',
          label: 'Note',
          type: ParamKind.STRING,
          required: false,
          defaultValue: null,
          options: null,
          orderIndex: 0,
        },
      ],
    }
    const { result } = renderHook(() => useDeploymentConfigForm(optionalTemplate))

    act(() => {
      result.current.setName('ma-base')
    })

    expect(result.current.isValid).toBe(true)
    expect(result.current.errors.params.note).toBeUndefined()
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
