import { describe, expect, it } from 'vitest'

import type { DeploymentDTO } from '../../types/dto/DeploymentDTO'
import type { DeploymentEventDTO } from '../../types/dto/DeploymentEventDTO'
import { DeploymentStatus } from '../../types/enums/DeploymentStatus'
import { EngineKind } from '../../types/enums/EngineKind'
import { mapDeploymentDto, mapDeploymentEventDto } from '../deploymentMapper'

const runningDto: DeploymentDTO = {
  id: 'dep-1',
  owner_id: 'user-1',
  template_id: 'pg16',
  template_name: 'PostgreSQL',
  template_icon: 'database',
  engine: 'docker',
  template_version: '16',
  image_repository: 'postgres',
  name: 'pg-prod',
  status: 'running',
  params: { db_name: 'app' },
  host: '10.0.0.5',
  published_port: 32769,
  created_at: '2026-06-07T10:00:00Z',
  updated_at: '2026-06-07T10:01:00Z',
}

describe('mapDeploymentDto', () => {
  it('mappe les enums, libellés et l’URL d’accès host:port', () => {
    const model = mapDeploymentDto(runningDto)

    expect(model.engine).toBe(EngineKind.DOCKER)
    expect(model.engineLabel).toBe('Docker')
    expect(model.status).toBe(DeploymentStatus.RUNNING)
    expect(model.statusLabel).toBe('En ligne')
    expect(model.image).toBe('postgres:16')
    expect(model.accessUrl).toBe('10.0.0.5:32769')
  })

  it('laisse image et accessUrl à null quand la ressource n’est pas provisionnée', () => {
    const pending: DeploymentDTO = {
      ...runningDto,
      status: 'pending',
      image_repository: null,
      host: null,
      published_port: null,
    }

    const model = mapDeploymentDto(pending)

    expect(model.status).toBe(DeploymentStatus.PENDING)
    expect(model.image).toBeNull()
    expect(model.accessUrl).toBeNull()
  })

  it('replie un moteur inconnu sur Docker (parcours par défaut)', () => {
    const model = mapDeploymentDto({ ...runningDto, engine: 'kubernetes' })

    expect(model.engine).toBe(EngineKind.DOCKER)
  })
})

describe('mapDeploymentEventDto', () => {
  it('mappe une transition de statut', () => {
    const dto: DeploymentEventDTO = { at: '2026-06-07T10:00:00Z', status: 'running' }

    const event = mapDeploymentEventDto(dto)

    expect(event.status).toBe(DeploymentStatus.RUNNING)
    expect(event.log).toBeUndefined()
  })

  it('mappe une ligne de log', () => {
    const dto: DeploymentEventDTO = {
      at: '2026-06-07T10:00:00Z',
      log: { time: '14:32:18', level: 'ok', message: 'Image récupérée' },
    }

    const event = mapDeploymentEventDto(dto)

    expect(event.log?.message).toBe('Image récupérée')
    expect(event.status).toBeUndefined()
  })

  it('mappe les accès transmis une seule fois', () => {
    const dto: DeploymentEventDTO = {
      at: '2026-06-07T10:00:00Z',
      status: 'running',
      access: { host: '10.0.0.5', port: 32769, user: 'admin', password: 'exemple-xyz' },
    }

    const event = mapDeploymentEventDto(dto)

    expect(event.access?.host).toBe('10.0.0.5')
    expect(event.access?.password).toBe('exemple-xyz')
  })
})
