import { describe, expect, it } from 'vitest'

import type { TemplateConfigDTO } from '../../types/dto/TemplateConfigDTO'
import { EngineKind } from '../../types/enums/EngineKind'
import { ParamKind } from '../../types/enums/ParamKind'
import { mapTemplateConfigDto } from '../templateConfigMapper'

const dockerDto: TemplateConfigDTO = {
  id: 'pg16',
  name: 'PostgreSQL',
  icon: 'database',
  description: 'Base relationnelle managée.',
  engine: 'docker',
  image_repository: 'postgres',
  internal_port: 5432,
  secret_env: 'POSTGRES_PASSWORD',
  versions: [
    { version: '15', is_default: false, is_lts: true, eol_date: null },
    { version: '16', is_default: true, is_lts: false, eol_date: '2028-11-09' },
  ],
  params: [
    {
      key: 'db_name',
      label: 'Nom de la base',
      type: 'string',
      required: true,
      default_value: 'app',
      options: null,
      order_index: 1,
    },
    {
      key: 'tls',
      label: 'TLS',
      type: 'bool',
      required: false,
      default_value: 'false',
      options: null,
      order_index: 0,
    },
  ],
}

describe('mapTemplateConfigDto', () => {
  it('mappe le moteur, le descripteur et trie les params par order_index', () => {
    const model = mapTemplateConfigDto(dockerDto)

    expect(model.engine).toBe(EngineKind.DOCKER)
    expect(model.imageRepository).toBe('postgres')
    expect(model.secretEnv).toBe('POSTGRES_PASSWORD')
    expect(model.params.map((p) => p.key)).toEqual(['tls', 'db_name'])
    expect(model.params[0]?.type).toBe(ParamKind.BOOL)
  })

  it('replie un moteur inconnu sur Docker', () => {
    const model = mapTemplateConfigDto({ ...dockerDto, engine: 'nomad' })

    expect(model.engine).toBe(EngineKind.DOCKER)
  })

  it('reconnaît un template Terraform', () => {
    const model = mapTemplateConfigDto({ ...dockerDto, engine: 'terraform' })

    expect(model.engine).toBe(EngineKind.TERRAFORM)
  })
})
