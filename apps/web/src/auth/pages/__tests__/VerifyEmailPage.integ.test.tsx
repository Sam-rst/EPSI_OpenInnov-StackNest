import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import type { ReactNode } from 'react'

import { server } from '../../../../tests/mocks/server'
import { apiClient } from '../../../core/api/apiClient'
import { VerifyEmailPage } from '../VerifyEmailPage'

const API = (apiClient.defaults.baseURL ?? window.location.origin).replace(/\/$/, '')

function renderPage(initialEntry: string) {
  const queryClient = new QueryClient({ defaultOptions: { mutations: { retry: false } } })
  function Tree({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={[initialEntry]}>{children}</MemoryRouter>
      </QueryClientProvider>
    )
  }
  return render(<VerifyEmailPage />, { wrapper: Tree })
}

describe('VerifyEmailPage', () => {
  it('POST le token lu dans l’URL puis affiche un succès', async () => {
    let body: unknown
    server.use(
      http.post(`${API}/auth/verify`, async ({ request }) => {
        body = await request.json()
        return new HttpResponse(null, { status: 204 })
      }),
    )

    renderPage('/verify?token=abc123')

    expect(await screen.findByText(/adresse e-mail vérifiée/i)).toBeInTheDocument()
    expect(body).toEqual({ token: 'abc123' })
  })

  it('affiche une erreur si aucun token n’est présent', () => {
    renderPage('/verify')

    expect(screen.getByText(/lien.*invalide|lien.*expiré/i)).toBeInTheDocument()
  })

  it('affiche une erreur si le token est rejeté par l’API', async () => {
    server.use(http.post(`${API}/auth/verify`, () => new HttpResponse(null, { status: 400 })))

    renderPage('/verify?token=périmé')

    expect(await screen.findByText(/lien.*invalide|n.a pas pu être vérifiée/i)).toBeInTheDocument()
  })
})
