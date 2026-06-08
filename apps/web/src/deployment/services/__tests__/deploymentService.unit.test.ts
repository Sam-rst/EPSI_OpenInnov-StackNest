import { describe, expect, it } from 'vitest'

import { DeploymentStatus } from '../../types/enums/DeploymentStatus'
import { createDeployment, getDeployment, listDeployments } from '../deploymentService'

describe('deploymentService (seam display-only)', () => {
  it('liste les déploiements d’exemple mappés en modèles', async () => {
    const deployments = await listDeployments()

    expect(deployments.length).toBeGreaterThan(0)
    expect(deployments.every((d) => d.name.includes('exemple'))).toBe(true)
    expect(deployments[0]?.statusLabel).toBeTruthy()
  })

  it('récupère un déploiement d’exemple par identifiant', async () => {
    const deployment = await getDeployment('exemple-pg')

    expect(deployment.id).toBe('exemple-pg')
    expect(deployment.status).toBe(DeploymentStatus.RUNNING)
    expect(deployment.accessUrl).toBe('10.0.0.5:32769')
  })

  it('rejette avec une erreur honnête pour un identifiant inconnu', async () => {
    await expect(getDeployment('introuvable')).rejects.toThrow(/introuvable/i)
  })

  it('simule la création et renvoie un identifiant de déploiement', async () => {
    const result = await createDeployment({
      template_id: 'pg16',
      version: '16',
      name: 'ma-base-exemple',
      env: 'dev',
      params: { db_name: 'app' },
      limits: { cpu: 1, memory_mb: 512 },
    })

    expect(result.id).toBeTruthy()
  })
})
