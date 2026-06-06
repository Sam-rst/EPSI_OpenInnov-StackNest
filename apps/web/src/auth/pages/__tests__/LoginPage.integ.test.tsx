import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import type { ReactNode } from 'react'

import { AuthProvider } from '../../providers/AuthProvider'
import { LoginPage } from '../LoginPage'

function renderPage() {
  const queryClient = new QueryClient()
  function Tree({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        <AuthProvider
          value={{
            isAuthenticated: false,
            isInitializing: false,
            user: null,
            setSession: () => undefined,
            clearSession: () => undefined,
          }}
        >
          <MemoryRouter>{children}</MemoryRouter>
        </AuthProvider>
      </QueryClientProvider>
    )
  }
  return render(<LoginPage />, { wrapper: Tree })
}

describe('LoginPage', () => {
  it('rend le titre, les champs et le bouton de connexion', () => {
    renderPage()

    expect(screen.getByRole('heading', { level: 1, name: /connexion/i })).toBeInTheDocument()
    expect(screen.getByLabelText('Adresse e-mail')).toBeInTheDocument()
    expect(screen.getByLabelText('Mot de passe')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /se connecter/i })).toBeInTheDocument()
  })

  it('propose un lien vers la création de compte', () => {
    renderPage()

    const link = screen.getByRole('link', { name: /créer un compte/i })
    expect(link).toHaveAttribute('href', '/register')
  })
})
