import { render, screen } from '@testing-library/react'
import { useQueryClient } from '@tanstack/react-query'
import { describe, expect, it } from 'vitest'
import { AppProviders } from '../AppProviders'

function QueryClientProbe() {
  const client = useQueryClient()
  return <span data-testid="probe">{client ? 'client-disponible' : 'aucun-client'}</span>
}

describe('AppProviders', () => {
  it('fournit un QueryClient aux composants enfants', () => {
    render(
      <AppProviders>
        <QueryClientProbe />
      </AppProviders>,
    )

    expect(screen.getByTestId('probe')).toHaveTextContent('client-disponible')
  })

  it('rend ses enfants', () => {
    render(
      <AppProviders>
        <p>contenu enfant</p>
      </AppProviders>,
    )

    expect(screen.getByText('contenu enfant')).toBeInTheDocument()
  })
})
