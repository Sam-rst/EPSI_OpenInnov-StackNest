import { act, renderHook, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { HttpResponse, http } from 'msw'

import { server } from '../../../../tests/mocks/server'
import { createQueryWrapper } from '../../../../tests/utils/queryWrapper'
import { useBulkDeleteStacks } from '../useBulkDeleteStacks'

describe('useBulkDeleteStacks', () => {
  afterEach(() => server.resetHandlers())

  it('détruit chaque stack sélectionnée (DELETE /stacks/{id})', async () => {
    const deleted: string[] = []
    server.use(
      http.delete('*/stacks/:id', ({ params }) => {
        deleted.push(params.id as string)
        return new HttpResponse(null, { status: 204 })
      }),
    )

    const { result } = renderHook(() => useBulkDeleteStacks(), {
      wrapper: createQueryWrapper(),
    })

    await act(async () => {
      await result.current.mutateAsync(['s1', 's2'])
    })

    expect(deleted.sort()).toEqual(['s1', 's2'])
  })

  it('remonte une erreur si une destruction échoue', async () => {
    server.use(http.delete('*/stacks/:id', () => new HttpResponse(null, { status: 500 })))

    const { result } = renderHook(() => useBulkDeleteStacks(), {
      wrapper: createQueryWrapper(),
    })

    act(() => {
      result.current.mutate(['s1'])
    })

    await waitFor(() => expect(result.current.isError).toBe(true))
  })
})
