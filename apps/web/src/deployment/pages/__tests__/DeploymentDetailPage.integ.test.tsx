import { act, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { MemoryRouter, Route, Routes } from 'react-router-dom'

import { createQueryWrapper } from '../../../../tests/utils/queryWrapper'
import { DeploymentDetailPage } from '../DeploymentDetailPage'

function renderDetail(id: string) {
  const Wrapper = createQueryWrapper()
  return render(
    <Wrapper>
      <MemoryRouter initialEntries={[`/deployments/${id}`]}>
        <Routes>
          <Route path="/deployments/:id" element={<DeploymentDetailPage />} />
        </Routes>
      </MemoryRouter>
    </Wrapper>,
  )
}

describe('DeploymentDetailPage (suivi simulé)', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('affiche le header, le stepper et la console de logs', async () => {
    renderDetail('exemple-pg')

    // Laisse la requête React Query (seam) résoudre via les timers simulés.
    await act(async () => {
      await vi.advanceTimersByTimeAsync(500)
    })

    expect(screen.getByRole('heading', { name: 'postgresql-exemple' })).toBeInTheDocument()
    expect(screen.getByText('Validation')).toBeInTheDocument()
    expect(screen.getByText('Logs (exemple)')).toBeInTheDocument()
  })

  it('progresse jusqu’à running, révèle les accès et propose les actions', async () => {
    renderDetail('exemple-pg')

    await act(async () => {
      await vi.advanceTimersByTimeAsync(20000)
    })

    expect(screen.getByText('En ligne')).toBeInTheDocument()
    // Carte d'accès (exemple) visible au running.
    expect(screen.getByText('Accès (exemple)')).toBeInTheDocument()
    // Actions de cycle de vie disponibles depuis running.
    expect(screen.getByRole('button', { name: /Arrêter/ })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Détruire/ })).toBeInTheDocument()
  })

  it('affiche un état honnête quand le déploiement est introuvable', async () => {
    renderDetail('introuvable')

    await act(async () => {
      await vi.advanceTimersByTimeAsync(2000)
    })

    expect(screen.getByText('Déploiement introuvable')).toBeInTheDocument()
  })
})
