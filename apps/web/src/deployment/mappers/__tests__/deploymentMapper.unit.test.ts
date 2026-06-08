import { describe, expect, it } from 'vitest'

import type { DeploymentDTO } from '../../types/dto/DeploymentDTO'
import type { DeploymentEventDTO } from '../../types/dto/DeploymentEventDTO'
import { DeploymentStatus } from '../../types/enums/DeploymentStatus'
import { mapDeploymentDto, mapDeploymentEventDto } from '../deploymentMapper'

const runningDto: DeploymentDTO = {
  id: 'dep-1',
  template_id: 'pg16',
  template_version: '16',
  name: 'pg-prod',
  status: 'running',
  params: { db_name: 'app' },
  host: '10.0.0.5',
  published_port: 32769,
  access_url: '10.0.0.5:32769',
  created_at: '2026-06-07T10:00:00Z',
  updated_at: '2026-06-07T10:01:00Z',
}

describe('mapDeploymentDto', () => {
  it('mappe le statut, son libellé et l’URL d’accès fournie par l’API', () => {
    const model = mapDeploymentDto(runningDto)

    expect(model.templateId).toBe('pg16')
    expect(model.version).toBe('16')
    expect(model.status).toBe(DeploymentStatus.RUNNING)
    expect(model.statusLabel).toBe('En ligne')
    expect(model.accessUrl).toBe('10.0.0.5:32769')
  })

  it('laisse host/port/accessUrl à null quand la ressource n’est pas provisionnée', () => {
    const pending: DeploymentDTO = {
      ...runningDto,
      status: 'pending',
      host: null,
      published_port: null,
      access_url: null,
    }

    const model = mapDeploymentDto(pending)

    expect(model.status).toBe(DeploymentStatus.PENDING)
    expect(model.host).toBeNull()
    expect(model.port).toBeNull()
    expect(model.accessUrl).toBeNull()
  })

  it('replie un statut inconnu sur pending (état initial neutre)', () => {
    const model = mapDeploymentDto({ ...runningDto, status: 'unknown' })

    expect(model.status).toBe(DeploymentStatus.PENDING)
  })
})

describe('mapDeploymentEventDto', () => {
  function frame(overrides: Partial<DeploymentEventDTO> & { status: string }): DeploymentEventDTO {
    return { message: null, access_url: null, secret: null, ...overrides }
  }

  it('mappe une transition de statut sans message (aucun log)', () => {
    const event = mapDeploymentEventDto(frame({ status: 'provisioning' }))

    expect(event.status).toBe(DeploymentStatus.PROVISIONING)
    expect(event.log).toBeUndefined()
    expect(event.access).toBeUndefined()
  })

  it('dérive une ligne de log du message, avec un niveau déduit du statut', () => {
    const ok = mapDeploymentEventDto(frame({ status: 'running', message: 'Ressource prête' }))
    expect(ok.log?.message).toBe('Ressource prête')
    expect(ok.log?.level).toBe('ok')

    const err = mapDeploymentEventDto(frame({ status: 'failed', message: 'Échec du pull' }))
    expect(err.log?.level).toBe('err')

    const info = mapDeploymentEventDto(frame({ status: 'provisioning', message: 'Pull…' }))
    expect(info.log?.level).toBe('info')
  })

  it('dérive l’accès (url + secret) transmis une seule fois au running', () => {
    const event = mapDeploymentEventDto(
      frame({ status: 'running', access_url: '10.0.0.5:32769', secret: 'mdp-xyz' }),
    )

    expect(event.access).toEqual({ url: '10.0.0.5:32769', password: 'mdp-xyz' })
  })

  it('ne produit aucun accès tant que l’url ou le secret manque', () => {
    const noSecret = mapDeploymentEventDto(frame({ status: 'running', access_url: '10.0.0.5:1' }))
    expect(noSecret.access).toBeUndefined()
  })
})
