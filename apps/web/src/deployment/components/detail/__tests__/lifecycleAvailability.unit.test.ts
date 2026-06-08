import { describe, expect, it } from 'vitest'

import { DeploymentStatus } from '../../../types/enums/DeploymentStatus'
import { availableActions } from '../lifecycleAvailability'

describe('availableActions', () => {
  it('running : stop + régénérer + détruire', () => {
    expect(availableActions(DeploymentStatus.RUNNING)).toEqual({
      canStart: false,
      canStop: true,
      canRegenerate: true,
      canDestroy: true,
    })
  })

  it('stopped : start + détruire', () => {
    const actions = availableActions(DeploymentStatus.STOPPED)
    expect(actions.canStart).toBe(true)
    expect(actions.canStop).toBe(false)
    expect(actions.canDestroy).toBe(true)
  })

  it('provisioning : aucune action', () => {
    expect(availableActions(DeploymentStatus.PROVISIONING)).toEqual({
      canStart: false,
      canStop: false,
      canRegenerate: false,
      canDestroy: false,
    })
  })

  it('failed : détruire seulement', () => {
    const actions = availableActions(DeploymentStatus.FAILED)
    expect(actions.canDestroy).toBe(true)
    expect(actions.canStart).toBe(false)
  })
})
