import { describe, expect, it } from 'vitest'

import { DeploymentStatus } from '../../../types/enums/DeploymentStatus'
import { bulkActionAvailability } from '../bulkActionAvailability'

describe('bulkActionAvailability', () => {
  it('aucune sélection : aucune action applicable', () => {
    expect(bulkActionAvailability([])).toEqual({
      canStart: false,
      canStop: false,
      canDestroy: false,
    })
  })

  it('un running : stop + destroy applicables, start non', () => {
    expect(bulkActionAvailability([DeploymentStatus.RUNNING])).toEqual({
      canStart: false,
      canStop: true,
      canDestroy: true,
    })
  })

  it('un stopped : start + destroy applicables, stop non', () => {
    expect(bulkActionAvailability([DeploymentStatus.STOPPED])).toEqual({
      canStart: true,
      canStop: false,
      canDestroy: true,
    })
  })

  it('sélection mixte running + stopped : start, stop et destroy applicables', () => {
    expect(bulkActionAvailability([DeploymentStatus.RUNNING, DeploymentStatus.STOPPED])).toEqual({
      canStart: true,
      canStop: true,
      canDestroy: true,
    })
  })

  it('failed : destroy seulement (ni start ni stop)', () => {
    expect(bulkActionAvailability([DeploymentStatus.FAILED])).toEqual({
      canStart: false,
      canStop: false,
      canDestroy: true,
    })
  })

  it('statuts transitoires (provisioning) : aucune action applicable', () => {
    expect(bulkActionAvailability([DeploymentStatus.PROVISIONING])).toEqual({
      canStart: false,
      canStop: false,
      canDestroy: false,
    })
  })

  it('destroyed/destroying : destroy non applicable (déjà terminal)', () => {
    expect(bulkActionAvailability([DeploymentStatus.DESTROYED])).toEqual({
      canStart: false,
      canStop: false,
      canDestroy: false,
    })
    expect(bulkActionAvailability([DeploymentStatus.DESTROYING])).toEqual({
      canStart: false,
      canStop: false,
      canDestroy: false,
    })
  })

  it('est « au mieux » : une action est proposée dès qu’au moins un sélectionné l’autorise', () => {
    const availability = bulkActionAvailability([
      DeploymentStatus.RUNNING,
      DeploymentStatus.PROVISIONING,
    ])

    expect(availability.canStop).toBe(true)
    expect(availability.canDestroy).toBe(true)
  })
})
