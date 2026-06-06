import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import type { ReactNode } from 'react'

import { server } from '../../../../tests/mocks/server'
import { apiClient } from '../../../core/api/apiClient'
import { ResetForm } from '../ResetForm'

const API = (apiClient.defaults.baseURL ?? window.location.origin).replace(/\/$/, '')

function renderForm(token: string | null) {
  const queryClient = new QueryClient({ defaultOptions: { mutations: { retry: false } } })
  function Tree({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>{children}</MemoryRouter>
      </QueryClientProvider>
    )
  }
  return render(<ResetForm token={token} />, { wrapper: Tree })
}

describe('ResetForm', () => {
  it('affiche une erreur explicite si le lien ne porte pas de token', () => {
    renderForm(null)

    expect(screen.getByText(/lien.*invalide|lien.*expiré/i)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /réinitialiser/i })).not.toBeInTheDocument()
  })

  it('valide la politique de mot de passe', async () => {
    renderForm('reset-token')

    await userEvent.type(screen.getByLabelText('Nouveau mot de passe'), 'abc1')
    await userEvent.click(screen.getByRole('button', { name: /réinitialiser/i }))

    expect(await screen.findByText('Au moins 8 caractères')).toBeInTheDocument()
  })

  it('réinitialise le mot de passe puis affiche une confirmation', async () => {
    let body: unknown
    server.use(
      http.post(`${API}/auth/reset`, async ({ request }) => {
        body = await request.json()
        return new HttpResponse(null, { status: 204 })
      }),
    )
    renderForm('reset-token')

    await userEvent.type(screen.getByLabelText('Nouveau mot de passe'), 'nouveau123')
    await userEvent.click(screen.getByRole('button', { name: /réinitialiser/i }))

    expect(await screen.findByText('Mot de passe réinitialisé')).toBeInTheDocument()
    expect(body).toEqual({ token: 'reset-token', password: 'nouveau123' })
  })
})
