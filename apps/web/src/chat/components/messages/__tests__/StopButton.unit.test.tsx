import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { StopButton } from '../StopButton'

describe('StopButton', () => {
  it('affiche le libellé d’arrêt de génération', () => {
    render(<StopButton onStop={vi.fn()} />)

    expect(screen.getByRole('button', { name: /Arrêter la génération/ })).toBeInTheDocument()
  })

  it('appelle onStop au clic', async () => {
    const user = userEvent.setup()
    const onStop = vi.fn()
    render(<StopButton onStop={onStop} />)

    await user.click(screen.getByRole('button', { name: /Arrêter la génération/ }))

    expect(onStop).toHaveBeenCalledTimes(1)
  })
})
