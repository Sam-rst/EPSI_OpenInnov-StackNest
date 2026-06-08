import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'

import { ActionKind } from '../../../types/enums/ActionKind'
import { ActionStatus } from '../../../types/enums/ActionStatus'
import type { ActionProposal } from '../../../types/models/ActionProposal'
import { ActionCard } from '../ActionCard'

const navigateMock = vi.fn()

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom')
  return { ...actual, useNavigate: () => navigateMock }
})

function proposal(overrides: Partial<ActionProposal> = {}): ActionProposal {
  return {
    id: 'act-1',
    kind: ActionKind.DEPLOY,
    status: ActionStatus.PROPOSED,
    intent: 'Déployer un PostgreSQL 16 isolé pour Yassine',
    templateId: 'pg16',
    version: '16',
    image: 'postgres:16-alpine',
    params: [{ label: 'Base de données', value: 'app' }],
    quotas: [{ label: 'CPU', value: '1 vCPU' }],
    ...overrides,
  }
}

function renderCard(overrides: Partial<Parameters<typeof ActionCard>[0]> = {}) {
  const props = {
    action: proposal(),
    onConfirm: vi.fn(),
    onReject: vi.fn(),
    ...overrides,
  }
  render(
    <MemoryRouter>
      <ActionCard {...props} />
    </MemoryRouter>,
  )
  return props
}

describe('ActionCard', () => {
  it('affiche la reformulation d’intention et le récap', () => {
    renderCard()

    expect(screen.getByText(/Déployer un PostgreSQL 16 isolé/)).toBeInTheDocument()
    expect(screen.getByText('Base de données')).toBeInTheDocument()
    expect(screen.getByText('app')).toBeInTheDocument()
    expect(screen.getByText('CPU')).toBeInTheDocument()
    expect(screen.getByText('1 vCPU')).toBeInTheDocument()
    expect(screen.getByText(/postgres:16-alpine/)).toBeInTheDocument()
  })

  it('confirme l’action', async () => {
    const user = userEvent.setup()
    const { onConfirm } = renderCard()

    await user.click(screen.getByRole('button', { name: /Confirmer/ }))

    expect(onConfirm).toHaveBeenCalledWith('act-1')
  })

  it('annule l’action', async () => {
    const user = userEvent.setup()
    const { onReject } = renderCard()

    await user.click(screen.getByRole('button', { name: /Annuler/ }))

    expect(onReject).toHaveBeenCalledWith('act-1')
  })

  it('« Modifier » navigue vers la config déploiement préremplie', async () => {
    const user = userEvent.setup()
    renderCard()

    await user.click(screen.getByRole('button', { name: /Modifier/ }))

    expect(navigateMock).toHaveBeenCalledWith('/deployments/config?template=pg16')
  })

  it('désactive les boutons et affiche le statut une fois exécutée', () => {
    renderCard({ action: proposal({ status: ActionStatus.EXECUTED }) })

    expect(screen.getByText('Exécutée')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Confirmer/ })).toBeDisabled()
  })
})
