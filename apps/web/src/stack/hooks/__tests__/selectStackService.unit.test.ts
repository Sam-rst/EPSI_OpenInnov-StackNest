import { describe, expect, it } from 'vitest'

import type { StackDetailModel } from '../../types/models/Stack'
import { selectStackService } from '../selectStackService'

const stack: StackDetailModel = {
  id: 'stack-1',
  name: 'ma-stack',
  status: 'running',
  statusLabel: 'En ligne',
  services: [
    {
      id: 's-db',
      templateId: 'pg16',
      version: '16',
      alias: 'db',
      status: 'running',
      statusLabel: 'En ligne',
      orderIndex: 0,
      params: { db_name: 'app' },
      publishedPort: 32769,
      containerRef: 'c-db',
    },
    {
      id: 's-api',
      templateId: 'node20',
      version: '20',
      alias: 'api',
      status: 'running',
      statusLabel: 'En ligne',
      orderIndex: 1,
      params: {},
      publishedPort: null,
      containerRef: null,
    },
  ],
  links: [{ id: 'l1', fromAlias: 'api', toAlias: 'db', varMappings: { DB_HOST: '{to.alias}' } }],
  createdAt: null,
  updatedAt: null,
}

describe('selectStackService', () => {
  it('résout le service ciblé par alias', () => {
    const result = selectStackService(stack, 'db')

    expect(result?.service.alias).toBe('db')
    expect(result?.service.publishedPort).toBe(32769)
  })

  it('sépare les liens sortants (consommés par le service) et entrants', () => {
    const api = selectStackService(stack, 'api')
    expect(api?.outgoing.map((link) => link.toAlias)).toEqual(['db'])
    expect(api?.incoming).toEqual([])

    const db = selectStackService(stack, 'db')
    expect(db?.incoming.map((link) => link.fromAlias)).toEqual(['api'])
    expect(db?.outgoing).toEqual([])
  })

  it('renvoie undefined pour un alias inconnu', () => {
    expect(selectStackService(stack, 'inconnu')).toBeUndefined()
  })

  it('renvoie undefined si la stack est absente', () => {
    expect(selectStackService(undefined, 'db')).toBeUndefined()
  })
})
