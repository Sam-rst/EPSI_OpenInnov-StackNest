import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { ThemeProvider } from '../../../theme/ThemeProvider'
import { TopBarActions } from '../TopBarActions'

function renderActions() {
  return render(
    <ThemeProvider>
      <TopBarActions />
    </ThemeProvider>,
  )
}

describe('TopBarActions', () => {
  it('rend un bouton de notifications', () => {
    renderActions()

    expect(screen.getByRole('button', { name: /notifications/i })).toBeInTheDocument()
  })

  it('rend la bascule de thème', () => {
    renderActions()

    expect(screen.getByRole('button', { name: /thème (clair|sombre)/i })).toBeInTheDocument()
  })
})
