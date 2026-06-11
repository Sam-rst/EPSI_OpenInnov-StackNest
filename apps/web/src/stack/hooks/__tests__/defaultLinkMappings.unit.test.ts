import { describe, expect, it } from 'vitest'

import { defaultLinkMappings } from '../defaultLinkMappings'
import type { TemplateConfig } from '../../../deployment/types/models/TemplateConfig'
import { EngineKind } from '../../../deployment/types/enums/EngineKind'
import { ParamKind } from '../../../deployment/types/enums/ParamKind'

function templateConfig(overrides: Partial<TemplateConfig> = {}): TemplateConfig {
  return {
    id: 'pg16',
    name: 'PostgreSQL',
    icon: 'database',
    description: '',
    engine: EngineKind.DOCKER,
    imageRepository: 'postgres',
    internalPort: 5432,
    secretEnv: 'POSTGRES_PASSWORD',
    versions: [{ version: '16', isDefault: true, isLts: true, eolDate: null }],
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
    ...overrides,
  }
}

describe('defaultLinkMappings', () => {
  it('propose host/port/password/db pour un fournisseur typé base de données', () => {
    const mappings = defaultLinkMappings(templateConfig())

    expect(mappings.DB_HOST).toBe('{to.alias}')
    expect(mappings.DB_PORT).toBe('{to.port}')
    expect(mappings.DB_PASSWORD).toBe('{to.secret}')
    expect(mappings.DB_NAME).toBe('{to.db_name}')
  })

  it('assemble une URL de connexion quand secret + port sont disponibles', () => {
    const mappings = defaultLinkMappings(templateConfig())

    expect(mappings.DATABASE_URL).toContain('{to.alias}')
    expect(mappings.DATABASE_URL).toContain('{to.port}')
    expect(mappings.DATABASE_URL).toContain('{to.secret}')
  })

  it('n’ajoute pas DB_PASSWORD pour un fournisseur sans secret', () => {
    const mappings = defaultLinkMappings(templateConfig({ secretEnv: null }))

    expect(mappings.DB_PASSWORD).toBeUndefined()
    expect(mappings.DB_HOST).toBe('{to.alias}')
  })

  it('n’ajoute pas DB_PORT pour un fournisseur sans port interne', () => {
    const mappings = defaultLinkMappings(templateConfig({ internalPort: null }))

    expect(mappings.DB_PORT).toBeUndefined()
  })

  it('n’ajoute pas DB_NAME quand le fournisseur n’a pas de paramètre db_name', () => {
    const mappings = defaultLinkMappings(templateConfig({ params: [] }))

    expect(mappings.DB_NAME).toBeUndefined()
  })

  it('propose toujours au moins l’hôte (fallback DNS par alias)', () => {
    const mappings = defaultLinkMappings(
      templateConfig({ secretEnv: null, internalPort: null, params: [] }),
    )

    expect(mappings).toEqual({ DB_HOST: '{to.alias}' })
  })
})
