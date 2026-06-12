import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'

import { DeploymentStatus } from '../../../types/enums/DeploymentStatus'
import type { Deployment } from '../../../types/models/Deployment'
import { DeploymentRow } from '../DeploymentRow'

function deployment(overrides: Partial<Deployment> = {}): Deployment {
  return {
    id: 'dep-1',
    templateId: 'pg16',
    templateName: 'PostgreSQL',
    version: '16',
    name: 'postgres-prod',
    status: DeploymentStatus.RUNNING,
    statusLabel: 'En ligne',
    params: {},
    host: '10.0.0.5',
    port: 32769,
    accessUrl: '10.0.0.5:32769',
    connectionUsername: 'postgres',
    createdAt: '2026-06-07T09:12:00Z',
    updatedAt: '2026-06-07T09:13:10Z',
    ...overrides,
  }
}

interface RowSelectionStub {
  selected?: boolean
  onToggle?: () => void
}

/** Une `<tr>` ne peut être montée seule : on l'enveloppe dans une vraie table. */
function renderRow(model: Deployment, selection?: RowSelectionStub) {
  const rowSelection = selection
    ? { selected: selection.selected ?? false, onToggle: selection.onToggle ?? vi.fn() }
    : undefined
  return render(
    <MemoryRouter initialEntries={['/deployments']}>
      <Routes>
        <Route
          path="/deployments"
          element={
            <table>
              <tbody>
                <DeploymentRow deployment={model} selection={rowSelection} />
              </tbody>
            </table>
          }
        />
        <Route path="/deployments/:id" element={<div>Page détail dep-1</div>} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('DeploymentRow', () => {
  it('affiche le nom, le template+version, le statut, l’accès et la date', () => {
    renderRow(deployment())

    expect(screen.getByText('postgres-prod')).toBeInTheDocument()
    expect(screen.getByText(/PostgreSQL · 16/)).toBeInTheDocument()
    expect(screen.getByText('En ligne')).toBeInTheDocument()
    expect(screen.getByText('10.0.0.5:32769')).toBeInTheDocument()
  })

  it('expose la ligne entière comme un lien accessible vers le détail', () => {
    renderRow(deployment())

    const row = screen.getByRole('link', { name: /postgres-prod/ })
    expect(row).toBeInTheDocument()
  })

  it('navigue vers le détail au clic sur n’importe quelle partie de la ligne', async () => {
    const user = userEvent.setup()
    renderRow(deployment())

    await user.click(screen.getByText('10.0.0.5:32769'))

    expect(screen.getByText('Page détail dep-1')).toBeInTheDocument()
  })

  it('navigue vers le détail à la touche Entrée (support clavier)', async () => {
    const user = userEvent.setup()
    renderRow(deployment())

    const row = screen.getByRole('link', { name: /postgres-prod/ })
    row.focus()
    await user.keyboard('{Enter}')

    expect(screen.getByText('Page détail dep-1')).toBeInTheDocument()
  })

  it('navigue vers le détail à la touche Espace (parité avec un lien natif)', async () => {
    const user = userEvent.setup()
    renderRow(deployment())

    const row = screen.getByRole('link', { name: /postgres-prod/ })
    row.focus()
    await user.keyboard('[Space]')

    expect(screen.getByText('Page détail dep-1')).toBeInTheDocument()
  })

  it('est focusable au clavier et signale l’interactivité (curseur pointeur)', () => {
    renderRow(deployment())

    const row = screen.getByRole('link', { name: /postgres-prod/ })
    expect(row).toHaveAttribute('tabindex', '0')
    expect(row.className).toMatch(/cursor-pointer/)
  })

  it('n’affiche pas de case à cocher quand la sélection est désactivée', () => {
    renderRow(deployment())

    expect(screen.queryByRole('checkbox')).not.toBeInTheDocument()
  })

  it('affiche une case à cocher quand la sélection est active', () => {
    renderRow(deployment(), { selected: true })

    expect(screen.getByRole('checkbox', { name: /postgres-prod/ })).toBeChecked()
  })

  it('coche/décoche via onToggle sans naviguer vers le détail (stopPropagation)', async () => {
    const onToggle = vi.fn()
    const user = userEvent.setup()
    renderRow(deployment(), { selected: false, onToggle })

    await user.click(screen.getByRole('checkbox', { name: /postgres-prod/ }))

    expect(onToggle).toHaveBeenCalledTimes(1)
    expect(screen.queryByText('Page détail dep-1')).not.toBeInTheDocument()
  })
})
