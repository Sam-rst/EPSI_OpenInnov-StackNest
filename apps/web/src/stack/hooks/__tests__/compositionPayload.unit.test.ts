import { describe, expect, it } from 'vitest'

import { buildStackPayload } from '../compositionPayload'
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

function service(localId: string, alias: string, templateId: string): CompositionService {
  return {
    localId,
    template: template(templateId),
    alias,
    version: '16',
    params: { db_name: 'app' },
  }
}

function link(from: string, to: string): CompositionLink {
  return {
    localId: `${from}-${to}`,
    fromLocalId: from,
    toLocalId: to,
    varMappings: { DB_HOST: '{to.alias}' },
  }
}

describe('buildStackPayload', () => {
  it('construit le payload avec ordre incrémental et template_id du fournisseur', () => {
    const payload = buildStackPayload(
      'ma-stack',
      [service('s1', 'db', 'pg16'), service('s2', 'api', 'node20')],
      [],
    )

    expect(payload.name).toBe('ma-stack')
    expect(payload.services).toEqual([
      { template_id: 'pg16', version: '16', alias: 'db', params: { db_name: 'app' }, order: 0 },
      { template_id: 'node20', version: '16', alias: 'api', params: { db_name: 'app' }, order: 1 },
    ])
  })

  it('exprime les liens par alias (from_alias / to_alias)', () => {
    const payload = buildStackPayload(
      'ma-stack',
      [service('s1', 'db', 'pg16'), service('s2', 'api', 'node20')],
      [link('s2', 's1')],
    )

    expect(payload.links).toEqual([
      { from_alias: 'api', to_alias: 'db', var_mappings: { DB_HOST: '{to.alias}' } },
    ])
  })

  it('nettoie le nom et les alias (trim)', () => {
    const payload = buildStackPayload('  ma-stack  ', [service('s1', '  db  ', 'pg16')], [])

    expect(payload.name).toBe('ma-stack')
    expect(payload.services[0]?.alias).toBe('db')
  })

  it('ignore un lien dont un service est introuvable (défensif)', () => {
    const payload = buildStackPayload('ma-stack', [service('s1', 'db', 'pg16')], [link('s2', 's1')])

    expect(payload.links).toHaveLength(0)
  })
})
