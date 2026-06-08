import { HttpResponse, http } from 'msw'
import { afterEach, describe, expect, it } from 'vitest'

import { server } from '../../../../tests/mocks/server'
import type { DeploymentDTO } from '../../types/dto/DeploymentDTO'
import { DeploymentStatus } from '../../types/enums/DeploymentStatus'
import {
  createDeployment,
  destroyDeployment,
  getDeployment,
  listDeployments,
  regenerateDeploymentPassword,
  startDeployment,
  stopDeployment,
} from '../deploymentService'

/** Fabrique une réponse `DeploymentResponse` réaliste (surchargeable). */
function deploymentDto(overrides: Partial<DeploymentDTO> = {}): DeploymentDTO {
  return {
    id: 'dep-1',
    template_id: 'pg16',
    template_version: '16',
    name: 'ma-base',
    status: 'running',
    params: { db_name: 'app' },
    host: '10.0.0.5',
    published_port: 32769,
    access_url: '10.0.0.5:32769',
    created_at: '2026-06-07T09:12:00Z',
    updated_at: '2026-06-07T09:13:10Z',
    ...overrides,
  }
}

describe('deploymentService (API REST /deployments)', () => {
  afterEach(() => {
    server.resetHandlers()
  })

  it('liste les déploiements et les mappe en modèles', async () => {
    server.use(
      http.get('*/deployments', () =>
        HttpResponse.json([deploymentDto(), deploymentDto({ id: 'dep-2', name: 'cache' })]),
      ),
    )

    const deployments = await listDeployments()

    expect(deployments).toHaveLength(2)
    expect(deployments[0]?.name).toBe('ma-base')
    expect(deployments[0]?.statusLabel).toBe('En ligne')
    expect(deployments[0]?.accessUrl).toBe('10.0.0.5:32769')
  })

  it('récupère un déploiement par identifiant', async () => {
    server.use(http.get('*/deployments/dep-1', () => HttpResponse.json(deploymentDto())))

    const deployment = await getDeployment('dep-1')

    expect(deployment.id).toBe('dep-1')
    expect(deployment.status).toBe(DeploymentStatus.RUNNING)
    expect(deployment.accessUrl).toBe('10.0.0.5:32769')
  })

  it('propage une erreur 404 pour un déploiement introuvable', async () => {
    server.use(http.get('*/deployments/inconnu', () => new HttpResponse(null, { status: 404 })))

    await expect(getDeployment('inconnu')).rejects.toThrow()
  })

  it('crée un déploiement (201) et renvoie son identifiant', async () => {
    let received: Record<string, unknown> | undefined
    server.use(
      http.post('*/deployments', async ({ request }) => {
        received = (await request.json()) as Record<string, unknown>
        return HttpResponse.json(deploymentDto({ id: 'dep-new', status: 'pending' }), {
          status: 201,
        })
      }),
    )

    const result = await createDeployment({
      template_id: 'pg16',
      version: '16',
      name: 'ma-base',
      env: 'dev',
      params: { db_name: 'app' },
      limits: { cpu: 1, memory_mb: 512 },
    })

    expect(result.id).toBe('dep-new')
    // N'envoie que les champs acceptés par l'API (pas env/limits).
    expect(received).toEqual({
      template_id: 'pg16',
      version: '16',
      name: 'ma-base',
      params: { db_name: 'app' },
    })
  })

  it('propage une erreur 409 quand le template n’est pas déployable', async () => {
    server.use(http.post('*/deployments', () => new HttpResponse(null, { status: 409 })))

    await expect(
      createDeployment({
        template_id: 'bucket',
        version: '1',
        name: 'x',
        env: 'dev',
        params: {},
        limits: { cpu: 1, memory_mb: 512 },
      }),
    ).rejects.toThrow()
  })

  it('envoie les actions de cycle de vie sur les bons endpoints (202)', async () => {
    const calls: string[] = []
    const accept = (action: string) =>
      http.post(`*/deployments/dep-1/${action}`, () => {
        calls.push(action)
        return new HttpResponse(null, { status: 202 })
      })
    server.use(accept('stop'), accept('start'), accept('destroy'), accept('regenerate-password'))

    await stopDeployment('dep-1')
    await startDeployment('dep-1')
    await destroyDeployment('dep-1')
    await regenerateDeploymentPassword('dep-1')

    expect(calls).toEqual(['stop', 'start', 'destroy', 'regenerate-password'])
  })

  it('propage une erreur 401 sur une action non authentifiée', async () => {
    server.use(http.post('*/deployments/dep-1/stop', () => new HttpResponse(null, { status: 401 })))

    await expect(stopDeployment('dep-1')).rejects.toThrow()
  })
})
