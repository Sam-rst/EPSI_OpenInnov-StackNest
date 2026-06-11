import { renderHook, waitFor } from '@testing-library/react'
import { HttpResponse, http } from 'msw'
import { afterEach, describe, expect, it } from 'vitest'

import { server } from '../../../../tests/mocks/server'
import { createQueryWrapper } from '../../../../tests/utils/queryWrapper'
import { useCreateStack } from '../useCreateStack'

describe('useCreateStack', () => {
  afterEach(() => {
    server.resetHandlers()
  })

  it('crée une stack et renvoie son identifiant', async () => {
    server.use(
      http.post('*/stacks', () =>
        HttpResponse.json(
          { id: 'stack-new', owner_id: 'u1', name: 'ma-stack', status: 'pending' },
          { status: 201 },
        ),
      ),
    )

    const { result } = renderHook(() => useCreateStack(), { wrapper: createQueryWrapper() })

    result.current.mutate({
      name: 'ma-stack',
      services: [{ template_id: 'pg16', version: '16', alias: 'db', params: {}, order: 0 }],
      links: [],
    })

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    expect(result.current.data?.id).toBe('stack-new')
  })

  it('expose l’erreur quand la création échoue (422)', async () => {
    server.use(http.post('*/stacks', () => new HttpResponse(null, { status: 422 })))

    const { result } = renderHook(() => useCreateStack(), { wrapper: createQueryWrapper() })

    result.current.mutate({ name: 'x', services: [], links: [] })

    await waitFor(() => {
      expect(result.current.isError).toBe(true)
    })
  })
})
