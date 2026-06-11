import { HttpResponse, http } from 'msw'
import { afterEach, describe, expect, it } from 'vitest'

import { server } from '../../../../tests/mocks/server'
import { createStack, deleteStack, getStack, listStacks } from '../stackService'
import type { StackDTO } from '../../types/dto/StackDTO'
import { ServiceStatus } from '../../types/enums/ServiceStatus'
import { StackStatus } from '../../types/enums/StackStatus'

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

describe('stackService (API REST /stacks)', () => {
  afterEach(() => {
    server.resetHandlers()
  })

  it('liste les stacks et les mappe en résumés', async () => {
    server.use(
      http.get('*/stacks', () =>
        HttpResponse.json([stackDto(), stackDto({ id: 'stack-2', name: 'autre' })]),
      ),
    )

    const stacks = await listStacks()

    expect(stacks).toHaveLength(2)
    expect(stacks[0]?.name).toBe('ma-stack')
    expect(stacks[0]?.status).toBe(StackStatus.RUNNING)
    expect(stacks[0]?.statusLabel).toBe('En ligne')
  })

  it('récupère le détail d’une stack (services + liens par alias)', async () => {
    server.use(
      http.get('*/stacks/stack-1', () =>
        HttpResponse.json(
          stackDto({
            services: [
              {
                id: 'svc-db',
                template_id: 'pg16',
                version: '16',
                alias: 'db',
                service_status: 'running',
                order_index: 0,
                params: { db_name: 'app' },
                published_port: 32769,
                container_ref: 'abc',
              },
            ],
            links: [],
          }),
        ),
      ),
    )

    const detail = await getStack('stack-1')

    expect(detail.services).toHaveLength(1)
    expect(detail.services[0]?.alias).toBe('db')
    expect(detail.services[0]?.status).toBe(ServiceStatus.RUNNING)
  })

  it('propage une erreur 404 pour une stack introuvable', async () => {
    server.use(http.get('*/stacks/inconnu', () => new HttpResponse(null, { status: 404 })))

    await expect(getStack('inconnu')).rejects.toThrow()
  })

  it('crée une stack (201), envoie le corps attendu et renvoie l’id', async () => {
    let received: Record<string, unknown> | undefined
    server.use(
      http.post('*/stacks', async ({ request }) => {
        received = (await request.json()) as Record<string, unknown>
        return HttpResponse.json(stackDto({ id: 'stack-new', status: 'pending' }), { status: 201 })
      }),
    )

    const result = await createStack({
      name: 'ma-stack',
      services: [
        { template_id: 'pg16', version: '16', alias: 'db', params: { db_name: 'app' }, order: 0 },
      ],
      links: [{ from_alias: 'api', to_alias: 'db', var_mappings: { DB_HOST: '{to.alias}' } }],
    })

    expect(result.id).toBe('stack-new')
    expect(received).toEqual({
      name: 'ma-stack',
      services: [
        { template_id: 'pg16', version: '16', alias: 'db', params: { db_name: 'app' }, order: 0 },
      ],
      links: [{ from_alias: 'api', to_alias: 'db', var_mappings: { DB_HOST: '{to.alias}' } }],
    })
  })

  it('propage une erreur 422 quand la composition est invalide', async () => {
    server.use(http.post('*/stacks', () => new HttpResponse(null, { status: 422 })))

    await expect(createStack({ name: 'x', services: [], links: [] })).rejects.toThrow()
  })

  it('supprime une stack (204)', async () => {
    let called = false
    server.use(
      http.delete('*/stacks/stack-1', () => {
        called = true
        return new HttpResponse(null, { status: 204 })
      }),
    )

    await deleteStack('stack-1')

    expect(called).toBe(true)
  })
})
