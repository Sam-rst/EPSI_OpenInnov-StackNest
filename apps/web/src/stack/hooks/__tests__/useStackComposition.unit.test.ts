import { StrictMode, createElement, type ReactNode } from 'react'
import { act, renderHook } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { useStackComposition } from '../useStackComposition'
import type { TemplateConfig } from '../../../deployment/types/models/TemplateConfig'
import { EngineKind } from '../../../deployment/types/enums/EngineKind'
import { ParamKind } from '../../../deployment/types/enums/ParamKind'

function postgres(): TemplateConfig {
  return {
    id: 'pg16',
    name: 'PostgreSQL',
    icon: 'database',
    description: '',
    engine: EngineKind.DOCKER,
    imageRepository: 'postgres',
    internalPort: 5432,
    secretEnv: 'POSTGRES_PASSWORD',
    versions: [
      { version: '16', isDefault: true, isLts: true, eolDate: null },
      { version: '15', isDefault: false, isLts: false, eolDate: null },
    ],
    params: [
      {
        key: 'db_name',
        label: 'Base',
        type: ParamKind.STRING,
        required: true,
        defaultValue: 'app',
        options: null,
        orderIndex: 0,
      },
    ],
  }
}

function api(): TemplateConfig {
  return {
    id: 'node20',
    name: 'Node',
    icon: 'box',
    description: '',
    engine: EngineKind.DOCKER,
    imageRepository: 'node',
    internalPort: 3000,
    secretEnv: null,
    versions: [{ version: '20', isDefault: true, isLts: true, eolDate: null }],
    params: [],
  }
}

describe('useStackComposition', () => {
  it('ajoute un service avec alias dérivé, version par défaut et params initiaux', () => {
    const { result } = renderHook(() => useStackComposition())

    act(() => result.current.addService(postgres()))

    expect(result.current.services).toHaveLength(1)
    const service = result.current.services[0]
    expect(service?.alias).toBe('postgresql')
    expect(service?.version).toBe('16')
    expect(service?.params.db_name).toBe('app')
  })

  it('génère des alias uniques quand on ajoute deux fois le même template', () => {
    const { result } = renderHook(() => useStackComposition())

    act(() => result.current.addService(postgres()))
    act(() => result.current.addService(postgres()))

    const aliases = result.current.services.map((service) => service.alias)
    expect(new Set(aliases).size).toBe(2)
  })

  it('édite l’alias, la version et un paramètre d’un service', () => {
    const { result } = renderHook(() => useStackComposition())
    act(() => result.current.addService(postgres()))
    const localId = result.current.services[0]?.localId as string

    act(() => result.current.setAlias(localId, 'db'))
    act(() => result.current.setVersion(localId, '15'))
    act(() => result.current.setParam(localId, 'db_name', 'prod'))

    expect(result.current.services[0]?.alias).toBe('db')
    expect(result.current.services[0]?.version).toBe('15')
    expect(result.current.services[0]?.params.db_name).toBe('prod')
  })

  it('supprime un service et les liens qui le référencent', () => {
    const { result } = renderHook(() => useStackComposition())
    act(() => result.current.addService(postgres()))
    act(() => result.current.addService(api()))
    const dbId = result.current.services[0]?.localId as string
    const apiId = result.current.services[1]?.localId as string

    act(() => result.current.addLink(apiId, dbId))
    expect(result.current.links).toHaveLength(1)

    act(() => result.current.removeService(dbId))

    expect(result.current.services).toHaveLength(1)
    expect(result.current.links).toHaveLength(0)
  })

  it('ajoute un lien avec mappings par défaut dérivés du fournisseur', () => {
    const { result } = renderHook(() => useStackComposition())
    act(() => result.current.addService(postgres()))
    act(() => result.current.addService(api()))
    const dbId = result.current.services[0]?.localId as string
    const apiId = result.current.services[1]?.localId as string

    act(() => result.current.addLink(apiId, dbId))

    const link = result.current.links[0]
    expect(link?.fromLocalId).toBe(apiId)
    expect(link?.toLocalId).toBe(dbId)
    expect(link?.varMappings.DB_HOST).toBe('{to.alias}')
    expect(link?.varMappings.DB_PASSWORD).toBe('{to.secret}')
  })

  it('expose la validation (invalide tant qu’aucun service)', () => {
    const { result } = renderHook(() => useStackComposition())

    expect(result.current.validation.valid).toBe(false)

    act(() => result.current.addService(postgres()))

    expect(result.current.validation.valid).toBe(true)
  })

  it('construit un payload prêt pour l’API', () => {
    const { result } = renderHook(() => useStackComposition())
    act(() => result.current.addService(postgres()))
    const localId = result.current.services[0]?.localId as string
    act(() => result.current.setAlias(localId, 'db'))

    const payload = result.current.buildPayload('ma-stack')

    expect(payload.name).toBe('ma-stack')
    expect(payload.services[0]?.alias).toBe('db')
    expect(payload.services[0]?.template_id).toBe('pg16')
  })

  it('sous StrictMode, un seul appel addLink crée un seul lien (updater pur)', () => {
    const strictWrapper = ({ children }: { children: ReactNode }) =>
      createElement(StrictMode, null, children)
    const { result } = renderHook(() => useStackComposition(), { wrapper: strictWrapper })
    act(() => result.current.addService(postgres()))
    act(() => result.current.addService(api()))
    const dbId = result.current.services[0]?.localId as string
    const apiId = result.current.services[1]?.localId as string

    act(() => result.current.addLink(apiId, dbId))

    expect(result.current.links).toHaveLength(1)
    expect(result.current.links[0]?.fromLocalId).toBe(apiId)
    expect(result.current.links[0]?.toLocalId).toBe(dbId)
    expect(result.current.links[0]?.varMappings.DB_HOST).toBe('{to.alias}')
  })

  it('édite les mappings d’un lien existant', () => {
    const { result } = renderHook(() => useStackComposition())
    act(() => result.current.addService(postgres()))
    act(() => result.current.addService(api()))
    const dbId = result.current.services[0]?.localId as string
    const apiId = result.current.services[1]?.localId as string
    act(() => result.current.addLink(apiId, dbId))
    const linkId = result.current.links[0]?.localId as string

    act(() => result.current.setLinkMappings(linkId, { DB_HOST: '{to.alias}', EXTRA: 'x' }))

    expect(result.current.links[0]?.varMappings).toEqual({ DB_HOST: '{to.alias}', EXTRA: 'x' })
  })
})
