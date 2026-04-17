import { render, screen } from '@testing-library/react'
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'
import { ErrorBoundary } from './ErrorBoundary'

function Boom(): never {
  throw new Error('boom')
}

describe('ErrorBoundary', () => {
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>

  beforeAll(() => {
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterAll(() => {
    consoleErrorSpy.mockRestore()
  })

  it('rend les enfants quand il n"y a pas d"erreur', () => {
    render(
      <ErrorBoundary>
        <p>contenu</p>
      </ErrorBoundary>,
    )

    expect(screen.getByText('contenu')).toBeInTheDocument()
  })

  it('rend le fallback quand un enfant lance une erreur', () => {
    render(
      <ErrorBoundary>
        <Boom />
      </ErrorBoundary>,
    )

    expect(screen.getByRole('alert')).toHaveTextContent(/une erreur/i)
  })
})
