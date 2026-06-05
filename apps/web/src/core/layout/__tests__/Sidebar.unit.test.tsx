import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'

import { Sidebar } from '../Sidebar'

function renderSidebar(props?: { isOpen?: boolean; onDismiss?: () => void }) {
  const onDismiss = props?.onDismiss ?? vi.fn()
  render(
    <MemoryRouter initialEntries={['/catalog']}>
      <Sidebar isOpen={props?.isOpen ?? false} onDismiss={onDismiss} />
    </MemoryRouter>,
  )
  return { onDismiss }
}

describe('Sidebar', () => {
  it('expose un landmark de navigation principal habillé des tokens de surface', () => {
    renderSidebar()

    const nav = screen.getByRole('navigation', { name: /navigation principale/i })
    expect(nav).toHaveClass('bg-surface-elevated')
    expect(nav).toHaveClass('border-border')
  })

  it('reflète l’état ouvert/fermé du drawer via data-open', () => {
    renderSidebar({ isOpen: true })

    expect(screen.getByRole('navigation', { name: /navigation principale/i })).toHaveAttribute(
      'data-open',
      'true',
    )
  })

  it('compose en-tête, navigation, espace de travail et carte de coût', () => {
    renderSidebar()

    expect(screen.getByText('StackNest')).toBeInTheDocument()
    expect(screen.getByText('StackNest Lab')).toBeInTheDocument()
    expect(screen.getByText('Coût ce mois')).toBeInTheDocument()
    expect(screen.getAllByRole('link')).toHaveLength(6)
  })

  it('referme le drawer au clic sur un lien de navigation', async () => {
    const user = userEvent.setup()
    const { onDismiss } = renderSidebar({ isOpen: true })

    await user.click(screen.getByRole('link', { name: /catalogue/i }))

    expect(onDismiss).toHaveBeenCalled()
  })

  it('referme le drawer au clic sur l’overlay mobile', async () => {
    const user = userEvent.setup()
    const { onDismiss } = renderSidebar({ isOpen: true })

    await user.click(screen.getByRole('button', { name: /fermer la navigation/i }))

    expect(onDismiss).toHaveBeenCalled()
  })

  it('ne rend pas d’overlay quand le drawer est fermé', () => {
    renderSidebar({ isOpen: false })

    expect(screen.queryByRole('button', { name: /fermer la navigation/i })).not.toBeInTheDocument()
  })
})
