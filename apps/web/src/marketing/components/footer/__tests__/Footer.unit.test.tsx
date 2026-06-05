import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { ThemeContext } from '../../../../core/theme/ThemeContext'
import type { ThemeContextValue } from '../../../../core/theme/ThemeContext'
import { FOOTER_COLUMNS } from '../../../data/footer.data'
import { Footer } from '../Footer'

function renderFooter(overrides: Partial<ThemeContextValue> = {}) {
  const value: ThemeContextValue = {
    theme: 'light',
    setTheme: vi.fn(),
    toggleTheme: vi.fn(),
    ...overrides,
  }
  render(
    <ThemeContext.Provider value={value}>
      <Footer />
    </ThemeContext.Provider>,
  )
  return value
}

describe('Footer', () => {
  it('affiche les colonnes de navigation du footer', () => {
    renderFooter()
    for (const column of FOOTER_COLUMNS) {
      expect(screen.getByText(column.title)).toBeInTheDocument()
    }
  })

  it('affiche le copyright StackNest', () => {
    renderFooter()
    expect(screen.getByText(/StackNest — EPSI OpenInnov/i)).toBeInTheDocument()
  })

  it('bascule le thème au clic sur le bouton dédié', async () => {
    const user = userEvent.setup()
    const value = renderFooter({ theme: 'dark' })
    await user.click(screen.getByRole('button', { name: /thème/i }))
    expect(value.toggleTheme).toHaveBeenCalledTimes(1)
  })
})
