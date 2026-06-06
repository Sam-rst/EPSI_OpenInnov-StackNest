import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, renderHook, waitFor } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'
import type { ReactNode } from 'react'

import { server } from '../../../../tests/mocks/server'
import { apiClient } from '../../../core/api/apiClient'
import { useRegister } from '../useRegister'

const API = (apiClient.defaults.baseURL ?? window.location.origin).replace(/\/$/, '')

function wrapper({ children }: { children: ReactNode }) {
  const queryClient = new QueryClient({
    defaultOptions: { mutations: { retry: false } },
  })
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
}

describe('useRegister', () => {
  it('poste les identifiants et résout (202 générique)', async () => {
    let body: unknown
    server.use(
      http.post(`${API}/auth/register`, async ({ request }) => {
        body = await request.json()
        return new HttpResponse(null, { status: 202 })
      }),
    )

    const { result } = renderHook(() => useRegister(), { wrapper })

    await act(async () => {
      await result.current.mutateAsync({ email: 'new@b.dev', password: 'motdepasse1' })
    })

    expect(body).toEqual({ email: 'new@b.dev', password: 'motdepasse1' })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
  })
})
