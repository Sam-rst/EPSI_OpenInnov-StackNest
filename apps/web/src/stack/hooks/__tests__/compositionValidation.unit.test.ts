import { describe, expect, it } from 'vitest'

import { hasCycle, validateComposition } from '../compositionValidation'
import type { CompositionLink, CompositionService } from '../../types/models/StackComposition'
import type { TemplateConfig } from '../../../deployment/types/models/TemplateConfig'
import { EngineKind } from '../../../deployment/types/enums/EngineKind'

function template(id: string): TemplateConfig {
  return {
    id,
    name: id,
    icon: 'box',
    description: '',
    engine: EngineKind.DOCKER,
    imageRepository: id,
    internalPort: null,
    secretEnv: null,
    versions: [{ version: '1', isDefault: true, isLts: false, eolDate: null }],
    params: [],
  }
}

function service(localId: string, alias: string): CompositionService {
  return { localId, template: template(localId), alias, version: '1', params: {} }
}

function link(from: string, to: string): CompositionLink {
  return { localId: `${from}-${to}`, fromLocalId: from, toLocalId: to, varMappings: {} }
}

describe('hasCycle', () => {
  it('détecte un cycle direct A→B→A', () => {
    expect(hasCycle([link('a', 'b'), link('b', 'a')])).toBe(true)
  })

  it('détecte un cycle indirect A→B→C→A', () => {
    expect(hasCycle([link('a', 'b'), link('b', 'c'), link('c', 'a')])).toBe(true)
  })

  it('accepte un graphe acyclique (DAG)', () => {
    expect(hasCycle([link('a', 'b'), link('a', 'c'), link('b', 'c')])).toBe(false)
  })

  it('considère une auto-boucle comme un cycle', () => {
    expect(hasCycle([link('a', 'a')])).toBe(true)
  })
})

describe('validateComposition', () => {
  it('valide une composition correcte (>=1 service, alias uniques, DAG)', () => {
    const result = validateComposition(
      [service('s1', 'db'), service('s2', 'api')],
      [link('s2', 's1')],
    )

    expect(result.valid).toBe(true)
    expect(result.errors).toHaveLength(0)
  })

  it('refuse une composition vide (>= 1 service requis)', () => {
    const result = validateComposition([], [])

    expect(result.valid).toBe(false)
    expect(result.errors).toContain('Ajoute au moins un service à la stack.')
  })

  it('refuse un alias vide', () => {
    const result = validateComposition([service('s1', '   ')], [])

    expect(result.valid).toBe(false)
    expect(result.errors.some((message) => message.includes('alias'))).toBe(true)
  })

  it('refuse des alias dupliqués', () => {
    const result = validateComposition([service('s1', 'db'), service('s2', 'db')], [])

    expect(result.valid).toBe(false)
    expect(result.errors.some((message) => message.toLowerCase().includes('unique'))).toBe(true)
  })

  it('refuse un cycle de dépendances', () => {
    const result = validateComposition(
      [service('s1', 'a'), service('s2', 'b')],
      [link('s1', 's2'), link('s2', 's1')],
    )

    expect(result.valid).toBe(false)
    expect(result.errors.some((message) => message.toLowerCase().includes('cycle'))).toBe(true)
  })

  it('refuse un lien vers soi-même', () => {
    const result = validateComposition([service('s1', 'a')], [link('s1', 's1')])

    expect(result.valid).toBe(false)
    expect(result.errors.some((message) => message.toLowerCase().includes('lui-même'))).toBe(true)
  })

  it('refuse un alias non conforme (caractères interdits)', () => {
    const result = validateComposition([service('s1', 'DB Service!')], [])

    expect(result.valid).toBe(false)
  })
})
