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
    stackServices: [],
    stackLinks: [],
    ...overrides,
  }
}

function stackProposal(overrides: Partial<ActionProposal> = {}): ActionProposal {
  return proposal({
    kind: ActionKind.COMPOSE_STACK,
    intent: 'Composer la stack « mon-app » (2 services : db, api).',
    templateId: null,
    version: null,
    image: null,
    params: [],
    quotas: [],
    stackServices: [
      { alias: 'db', version: '16' },
      { alias: 'api', version: '20' },
    ],
    stackLinks: [{ from: 'api', to: 'db' }],
    ...overrides,
  })
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

  it('affiche un CTA « Voir le déploiement » une fois exécutée avec un déploiement', async () => {
    const user = userEvent.setup()
    renderCard({
      action: proposal({ status: ActionStatus.EXECUTED, deploymentId: 'dep-7' }),
    })

    const cta = screen.getByRole('button', { name: /Voir le déploiement/ })
    expect(cta).toBeInTheDocument()

    await user.click(cta)
    expect(navigateMock).toHaveBeenCalledWith('/deployments/dep-7')
  })

  it('n’affiche pas le CTA déploiement tant que l’action n’est pas exécutée', () => {
    renderCard({ action: proposal({ status: ActionStatus.PROPOSED }) })

    expect(screen.queryByRole('button', { name: /Voir le déploiement/ })).toBeNull()
  })

  describe('composition de stack', () => {
    it('affiche les services (alias + version) et le câblage', () => {
      renderCard({ action: stackProposal() })

      expect(screen.getByText(/Composer la stack/)).toBeInTheDocument()
      expect(screen.getByText('Services')).toBeInTheDocument()
      expect(screen.getByText('Câblage')).toBeInTheDocument()
      // db et api apparaissent dans les services ET dans le câblage (api -> db).
      expect(screen.getAllByText('db').length).toBeGreaterThanOrEqual(1)
      expect(screen.getAllByText('api').length).toBeGreaterThanOrEqual(1)
      // La version figée de chaque service est affichée.
      expect(screen.getByText('16')).toBeInTheDocument()
      expect(screen.getByText('20')).toBeInTheDocument()
    })

    it('affiche un CTA « Voir la stack » une fois exécutée avec une stack', async () => {
      const user = userEvent.setup()
      renderCard({
        action: stackProposal({ status: ActionStatus.EXECUTED, stackId: 'stack-7' }),
      })

      const cta = screen.getByRole('button', { name: /Voir la stack/ })
      expect(cta).toBeInTheDocument()

      await user.click(cta)
      expect(navigateMock).toHaveBeenCalledWith('/stacks/stack-7')
    })

    it('n’affiche pas le CTA stack tant que l’action n’est pas exécutée', () => {
      renderCard({ action: stackProposal({ status: ActionStatus.PROPOSED }) })

      expect(screen.queryByRole('button', { name: /Voir la stack/ })).toBeNull()
    })

    it('masque le bouton « Modifier » pour une composition de stack', () => {
      // « Modifier » ouvre la config déploiement (service unique) : hors sujet
      // pour une composition multi-services au MVP.
      renderCard({ action: stackProposal() })

      expect(screen.queryByRole('button', { name: /Modifier/ })).toBeNull()
    })
  })
})
