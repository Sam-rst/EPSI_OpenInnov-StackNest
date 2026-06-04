import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ThemeToggle } from '../ThemeToggle'
import { ThemeProvider } from '../../../core/theme/ThemeProvider'

function renderWithTheme(className?: string) {
  return render(
    <ThemeProvider>
      <ThemeToggle className={className} />
    </ThemeProvider>,
  )
}

describe('ThemeToggle', () => {
  beforeEach(() => {
    vi.stubGlobal('matchMedia', vi.fn().mockReturnValue({ matches: false }))
  })

  afterEach(() => {
    window.localStorage.clear()
    document.documentElement.classList.remove('dark')
    vi.unstubAllGlobals()
  })

  it('propose de passer en thème sombre lorsque le thème courant est clair', () => {
    renderWithTheme()

    expect(screen.getByRole('button', { name: 'Activer le thème sombre' })).toBeInTheDocument()
  })

  it('bascule le thème et met à jour le libellé au clic', async () => {
    const user = userEvent.setup()
    renderWithTheme()

    await user.click(screen.getByRole('button', { name: 'Activer le thème sombre' }))

    expect(document.documentElement.classList.contains('dark')).toBe(true)
    expect(screen.getByRole('button', { name: 'Activer le thème clair' })).toBeInTheDocument()
  })

  it('transmet la className fournie', () => {
    renderWithTheme('ml-auto')

    expect(screen.getByRole('button')).toHaveClass('ml-auto')
  })
})
