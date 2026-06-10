import { describe, expect, it } from 'vitest'

import { DeploymentStatus } from '../../../types/enums/DeploymentStatus'
import { DeploymentStep } from '../../../types/enums/DeploymentStep'
import { stepperViewForStatus } from '../stepperView'

describe('stepperViewForStatus (#15)', () => {
  it('affiche le stepper en provisioning (pending → validation, provisioning → pull)', () => {
    expect(stepperViewForStatus(DeploymentStatus.PENDING)).toMatchObject({
      show: true,
      failed: false,
      currentStep: DeploymentStep.VALIDATION,
    })
    expect(stepperViewForStatus(DeploymentStatus.PROVISIONING)).toMatchObject({
      show: true,
      failed: false,
      currentStep: DeploymentStep.PULL_IMAGE,
    })
  })

  it('affiche le stepper complété (Prêt) quand running, sans spinner d’étape', () => {
    expect(stepperViewForStatus(DeploymentStatus.RUNNING)).toMatchObject({
      show: true,
      failed: false,
      completed: true,
      currentStep: DeploymentStep.READY,
    })
  })

  it('ne marque PAS complété tant que le provisioning est en cours', () => {
    expect(stepperViewForStatus(DeploymentStatus.PENDING).completed).toBe(false)
    expect(stepperViewForStatus(DeploymentStatus.PROVISIONING).completed).toBe(false)
    expect(stepperViewForStatus(DeploymentStatus.FAILED).completed).toBe(false)
  })

  it('marque le stepper en échec quand failed (pas de spinner Validation trompeur)', () => {
    expect(stepperViewForStatus(DeploymentStatus.FAILED)).toMatchObject({
      show: true,
      failed: true,
    })
  })

  it('masque le stepper pour les états de cycle de vie (stopped/destroying/destroyed)', () => {
    expect(stepperViewForStatus(DeploymentStatus.STOPPED).show).toBe(false)
    expect(stepperViewForStatus(DeploymentStatus.DESTROYING).show).toBe(false)
    expect(stepperViewForStatus(DeploymentStatus.DESTROYED).show).toBe(false)
  })
})
