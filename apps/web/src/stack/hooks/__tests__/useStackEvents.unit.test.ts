import { describe, expect, it } from 'vitest'

import { reduceStackEvent, INITIAL_STACK_EVENTS_STATE } from '../useStackEvents'
import { ServiceStatus } from '../../types/enums/ServiceStatus'
import { StackStatus } from '../../types/enums/StackStatus'

describe('reduceStackEvent', () => {
  it('met à jour le statut global de la stack', () => {
    const next = reduceStackEvent(INITIAL_STACK_EVENTS_STATE, { status: 'provisioning' })

    expect(next.status).toBe(StackStatus.PROVISIONING)
    expect(next.isDone).toBe(false)
  })

  it('met à jour le statut d’un service ciblé par alias', () => {
    const next = reduceStackEvent(INITIAL_STACK_EVENTS_STATE, {
      status: 'partial',
      alias: 'db',
      service_status: 'running',
    })

    expect(next.status).toBe(StackStatus.PARTIAL)
    expect(next.serviceStatuses.db).toBe(ServiceStatus.RUNNING)
  })

  it('marque terminé sur un statut terminal (running)', () => {
    const next = reduceStackEvent(INITIAL_STACK_EVENTS_STATE, { status: 'running' })

    expect(next.isDone).toBe(true)
  })

  it('marque terminé sur échec et destruction', () => {
    expect(reduceStackEvent(INITIAL_STACK_EVENTS_STATE, { status: 'failed' }).isDone).toBe(true)
    expect(reduceStackEvent(INITIAL_STACK_EVENTS_STATE, { status: 'destroyed' }).isDone).toBe(true)
  })

  it('accumule les statuts de plusieurs services sans en perdre', () => {
    const afterDb = reduceStackEvent(INITIAL_STACK_EVENTS_STATE, {
      status: 'provisioning',
      alias: 'db',
      service_status: 'running',
    })
    const afterApi = reduceStackEvent(afterDb, {
      status: 'running',
      alias: 'api',
      service_status: 'running',
    })

    expect(afterApi.serviceStatuses.db).toBe(ServiceStatus.RUNNING)
    expect(afterApi.serviceStatuses.api).toBe(ServiceStatus.RUNNING)
  })
})
