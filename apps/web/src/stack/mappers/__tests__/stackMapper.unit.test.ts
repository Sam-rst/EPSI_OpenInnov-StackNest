import { describe, expect, it } from 'vitest'

import { mapStackDetail, mapStackSummary } from '../stackMapper'
import type { StackDTO, StackServiceDTO } from '../../types/dto/StackDTO'
import { ServiceStatus } from '../../types/enums/ServiceStatus'
import { StackStatus } from '../../types/enums/StackStatus'

function serviceDto(overrides: Partial<StackServiceDTO> = {}): StackServiceDTO {
  return {
    id: 'svc-db',
    template_id: 'pg16',
    version: '16',
    alias: 'db',
    service_status: 'running',
    order_index: 0,
    params: { db_name: 'app' },
    published_port: 32769,
    container_ref: 'abc123',
    ...overrides,
  }
}

function stackDto(overrides: Partial<StackDTO> = {}): StackDTO {
  return {
    id: 'stack-1',
    owner_id: 'user-1',
    name: 'ma-stack',
    status: 'running',
    created_at: '2026-06-11T09:00:00Z',
    updated_at: '2026-06-11T09:05:00Z',
    ...overrides,
  }
}

describe('mapStackSummary', () => {
  it('mappe le résumé avec statut typé + libellé + nb de services', () => {
    const summary = mapStackSummary(
      stackDto({ services: [serviceDto(), serviceDto({ id: 'svc-api', alias: 'api' })] }),
    )

    expect(summary.id).toBe('stack-1')
    expect(summary.name).toBe('ma-stack')
    expect(summary.status).toBe(StackStatus.RUNNING)
    expect(summary.statusLabel).toBe('En ligne')
    expect(summary.serviceCount).toBe(2)
  })

  it('renvoie 0 service quand le résumé ne porte pas de services', () => {
    const summary = mapStackSummary(stackDto({ services: undefined }))

    expect(summary.serviceCount).toBe(0)
  })

  it('retombe sur le statut pending pour une valeur inconnue', () => {
    const summary = mapStackSummary(stackDto({ status: 'bogus' }))

    expect(summary.status).toBe(StackStatus.PENDING)
  })
})

describe('mapStackDetail', () => {
  it('mappe services et statuts', () => {
    const detail = mapStackDetail(
      stackDto({
        services: [
          serviceDto(),
          serviceDto({ id: 'svc-api', alias: 'api', service_status: 'provisioning' }),
        ],
        links: [],
      }),
    )

    expect(detail.services).toHaveLength(2)
    expect(detail.services[0]?.alias).toBe('db')
    expect(detail.services[0]?.status).toBe(ServiceStatus.RUNNING)
    expect(detail.services[1]?.status).toBe(ServiceStatus.PROVISIONING)
    expect(detail.services[1]?.statusLabel).toBe('Provisionnement')
  })

  it('réconcilie les ids de lien en alias lisibles', () => {
    const detail = mapStackDetail(
      stackDto({
        services: [serviceDto(), serviceDto({ id: 'svc-api', alias: 'api' })],
        links: [
          {
            id: 'link-1',
            from_service_id: 'svc-api',
            to_service_id: 'svc-db',
            var_mappings: { DB_HOST: '{to.alias}', DB_PASSWORD: '{to.secret}' },
          },
        ],
      }),
    )

    expect(detail.links).toHaveLength(1)
    expect(detail.links[0]?.fromAlias).toBe('api')
    expect(detail.links[0]?.toAlias).toBe('db')
    expect(detail.links[0]?.varMappings).toEqual({
      DB_HOST: '{to.alias}',
      DB_PASSWORD: '{to.secret}',
    })
  })

  it('retombe sur l’id brut quand un service lié est introuvable (défensif)', () => {
    const detail = mapStackDetail(
      stackDto({
        services: [serviceDto()],
        links: [
          {
            id: 'link-1',
            from_service_id: 'svc-orphan',
            to_service_id: 'svc-db',
            var_mappings: {},
          },
        ],
      }),
    )

    expect(detail.links[0]?.fromAlias).toBe('svc-orphan')
    expect(detail.links[0]?.toAlias).toBe('db')
  })
})
