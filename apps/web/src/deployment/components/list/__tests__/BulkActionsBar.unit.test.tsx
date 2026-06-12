import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { BulkAction } from '../../../types/enums/BulkAction'
import { BulkActionsBar } from '../BulkActionsBar'

interface BarProps {
  count?: number
  availability?: { canStart: boolean; canStop: boolean; canDestroy: boolean }
  onAction?: (action: BulkAction) => void
  onClear?: () => void
  isRunning?: boolean
}

function renderBar({
  count = 2,
  availability = { canStart: true, canStop: true, canDestroy: true },
  onAction = vi.fn(),
  onClear = vi.fn(),
  isRunning = false,
}: BarProps = {}) {
  return render(
    <BulkActionsBar
      count={count}
      availability={availability}
      onAction={onAction}
      onClear={onClear}
      isRunning={isRunning}
    />,
  )
}

describe('BulkActionsBar', () => {
  it('n’est pas rendue quand aucun déploiement n’est sélectionné', () => {
    const { container } = renderBar({ count: 0 })
    expect(container).toBeEmptyDOMElement()
  })

  it('affiche le compteur de sélection', () => {
    renderBar({ count: 3 })
    expect(screen.getByText(/3 sélectionnés/)).toBeInTheDocument()
  })

  it('accorde le compteur au singulier', () => {
    renderBar({ count: 1 })
    expect(screen.getByText(/1 sélectionné/)).toBeInTheDocument()
  })

  it('déclenche stop et start sans confirmation', async () => {
    const onAction = vi.fn()
    const user = userEvent.setup()
    renderBar({ onAction })

    await user.click(screen.getByRole('button', { name: /Arrêter/ }))
    expect(onAction).toHaveBeenCalledWith(BulkAction.STOP)

    await user.click(screen.getByRole('button', { name: /Démarrer/ }))
    expect(onAction).toHaveBeenCalledWith(BulkAction.START)
  })

  it('demande confirmation avant la suppression groupée', async () => {
    const onAction = vi.fn()
    const user = userEvent.setup()
    renderBar({ onAction })

    await user.click(screen.getByRole('button', { name: /Supprimer/ }))

    // La modale s'ouvre, l'action n'est pas encore exécutée.
    expect(onAction).not.toHaveBeenCalled()
    const dialog = screen.getByRole('dialog')
    expect(dialog).toBeInTheDocument()

    await user.click(within(dialog).getByRole('button', { name: 'Supprimer' }))
    expect(onAction).toHaveBeenCalledWith(BulkAction.DELETE)
  })

  it('annule la suppression groupée sans exécuter l’action', async () => {
    const onAction = vi.fn()
    const user = userEvent.setup()
    renderBar({ onAction })

    await user.click(screen.getByRole('button', { name: /Supprimer/ }))
    await user.click(screen.getByRole('button', { name: 'Annuler' }))

    expect(onAction).not.toHaveBeenCalled()
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('désactive les actions non applicables selon la disponibilité', () => {
    renderBar({ availability: { canStart: false, canStop: true, canDestroy: true } })

    expect(screen.getByRole('button', { name: /Démarrer/ })).toBeDisabled()
    expect(screen.getByRole('button', { name: /Arrêter/ })).toBeEnabled()
  })

  it('désactive toutes les actions pendant l’exécution', () => {
    renderBar({ isRunning: true })

    expect(screen.getByRole('button', { name: /Arrêter/ })).toBeDisabled()
    expect(screen.getByRole('button', { name: /Démarrer/ })).toBeDisabled()
    expect(screen.getByRole('button', { name: /Supprimer/ })).toBeDisabled()
  })

  it('permet de vider la sélection', async () => {
    const onClear = vi.fn()
    const user = userEvent.setup()
    renderBar({ onClear })

    await user.click(screen.getByRole('button', { name: /Désélectionner/ }))
    expect(onClear).toHaveBeenCalledTimes(1)
  })
})
