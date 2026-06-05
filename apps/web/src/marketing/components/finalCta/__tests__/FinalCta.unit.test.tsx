import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { FinalCta } from '../FinalCta'

describe('FinalCta', () => {
  it('affiche le titre final et une accroche honnête (CA5)', () => {
    render(<FinalCta onCta={vi.fn()} />)

    expect(
      screen.getByRole('heading', { name: /démarre ton premier déploiement/i }),
    ).toBeInTheDocument()
    expect(screen.getByText(/aucune carte de crédit requise/i)).toBeInTheDocument()
  })

  it('déclenche onCta au clic sur le bouton de démarrage', async () => {
    const onCta = vi.fn()
    render(<FinalCta onCta={onCta} />)

    await userEvent.click(screen.getByRole('button', { name: /démarrer maintenant/i }))

    expect(onCta).toHaveBeenCalledTimes(1)
  })
})
