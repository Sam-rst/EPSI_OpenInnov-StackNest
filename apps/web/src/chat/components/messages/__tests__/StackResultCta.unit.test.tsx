import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'

import { StackResultCta } from '../StackResultCta'

const navigateMock = vi.fn()

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom')
  return { ...actual, useNavigate: () => navigateMock }
})

function renderCta(stackId = 'stack-1') {
  render(
    <MemoryRouter>
      <StackResultCta stackId={stackId} />
    </MemoryRouter>,
  )
}

describe('StackResultCta', () => {
  it('affiche un CTA « Voir la stack »', () => {
    renderCta()

    expect(screen.getByRole('button', { name: /Voir la stack/ })).toBeInTheDocument()
  })

  it('navigue vers le détail de la stack au clic', async () => {
    const user = userEvent.setup()
    renderCta('stack-42')

    await user.click(screen.getByRole('button', { name: /Voir la stack/ }))

    expect(navigateMock).toHaveBeenCalledWith('/stacks/stack-42')
  })
})
