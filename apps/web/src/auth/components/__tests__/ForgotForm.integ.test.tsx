import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'
import type { ReactNode } from 'react'

import { server } from '../../../../tests/mocks/server'
import { apiClient } from '../../../core/api/apiClient'
import { ForgotForm } from '../ForgotForm'

const API = (apiClient.defaults.baseURL ?? window.location.origin).replace(/\/$/, '')

function renderForm() {
  const queryClient = new QueryClient({ defaultOptions: { mutations: { retry: false } } })
  function Tree({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  }
  return render(<ForgotForm />, { wrapper: Tree })
}

describe('ForgotForm', () => {
  it('valide le format de l’email', async () => {
    renderForm()

    await userEvent.type(screen.getByLabelText('Adresse e-mail'), 'pas-un-email')
    await userEvent.click(screen.getByRole('button', { name: /envoyer le lien/i }))

    expect(await screen.findByText('Adresse e-mail invalide')).toBeInTheDocument()
  })

  it('affiche une confirmation générique après la demande (anti-énumération)', async () => {
    let body: unknown
    server.use(
      http.post(`${API}/auth/forgot`, async ({ request }) => {
        body = await request.json()
        return new HttpResponse(null, { status: 202 })
      }),
    )
    renderForm()

    await userEvent.type(screen.getByLabelText('Adresse e-mail'), 'a@b.dev')
    await userEvent.click(screen.getByRole('button', { name: /envoyer le lien/i }))

    expect(await screen.findByText(/un lien de réinitialisation/i)).toBeInTheDocument()
    expect(body).toEqual({ email: 'a@b.dev' })
  })
})
