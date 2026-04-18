import { render, screen } from '@testing-library/react'
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'
import { ErrorBoundary } from './ErrorBoundary'

function Boom(): never {
  throw new Error('boom')
}

describe('ErrorBoundary', () => {
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>

  beforeAll(() => {
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(vi.fn())
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

  it('rend le fallback custom fourni en prop', () => {
    render(
      <ErrorBoundary fallback={<p>fallback custom</p>}>
        <Boom />
      </ErrorBoundary>,
    )

    expect(screen.getByText('fallback custom')).toBeInTheDocument()
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it("invoque onError avec l'erreur capturee", () => {
    const onError = vi.fn()

    render(
      <ErrorBoundary onError={onError}>
        <Boom />
      </ErrorBoundary>,
    )

    expect(onError).toHaveBeenCalledOnce()
    expect(onError.mock.calls[0][0]).toBeInstanceOf(Error)
    expect((onError.mock.calls[0][0] as Error).message).toBe('boom')
  })
})
