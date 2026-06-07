import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import type { ReactNode } from 'react'

import { server } from '../../../../tests/mocks/server'
import { apiClient } from '../../../core/api/apiClient'
import { RegisterForm } from '../RegisterForm'

const API = (apiClient.defaults.baseURL ?? window.location.origin).replace(/\/$/, '')

function renderForm() {
  const queryClient = new QueryClient({ defaultOptions: { mutations: { retry: false } } })
  function Tree({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>{children}</MemoryRouter>
      </QueryClientProvider>
    )
  }
  return render(<RegisterForm />, { wrapper: Tree })
}

describe('RegisterForm', () => {
  it('rejette un mot de passe trop court avec un message de validation', async () => {
    renderForm()

    await userEvent.type(screen.getByLabelText('Adresse e-mail'), 'new@b.dev')
    await userEvent.type(screen.getByLabelText('Mot de passe'), 'court1')
    await userEvent.click(screen.getByRole('button', { name: /créer mon compte/i }))

    expect(await screen.findByText('Au moins 8 caractères')).toBeInTheDocument()
  })

  it('affiche une confirmation générique après inscription (anti-énumération)', async () => {
    server.use(http.post(`${API}/auth/register`, () => new HttpResponse(null, { status: 202 })))
    renderForm()

    await userEvent.type(screen.getByLabelText('Adresse e-mail'), 'new@b.dev')
    await userEvent.type(screen.getByLabelText('Mot de passe'), 'motdepasse1')
    await userEvent.click(screen.getByRole('button', { name: /créer mon compte/i }))

    expect(await screen.findByText(/vérifier votre adresse e-mail/i)).toBeInTheDocument()
  })
})
