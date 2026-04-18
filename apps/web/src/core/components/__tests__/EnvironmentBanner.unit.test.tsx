import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { EnvironmentBanner } from '../EnvironmentBanner'

describe('EnvironmentBanner', () => {
  it('affiche le bandeau dev en bleu', () => {
    render(<EnvironmentBanner environment="dev" />)

    const banner = screen.getByRole('status')
    expect(banner).toHaveTextContent(/dev/i)
    expect(banner.className).toMatch(/bg-night/)
  })

  it('affiche le bandeau test en rouge', () => {
    render(<EnvironmentBanner environment="test" />)

    const banner = screen.getByRole('status')
    expect(banner).toHaveTextContent(/test/i)
    expect(banner.className).toMatch(/bg-error/)
  })

  it('affiche le bandeau preview en orange', () => {
    render(<EnvironmentBanner environment="preview" />)

    const banner = screen.getByRole('status')
    expect(banner).toHaveTextContent(/preview/i)
    expect(banner.className).toMatch(/bg-yellow/)
  })

  it("n'affiche rien en prod", () => {
    render(<EnvironmentBanner environment="prod" />)

    expect(screen.queryByRole('status')).not.toBeInTheDocument()
  })

  it("n'affiche rien si l'environnement est absent", () => {
    render(<EnvironmentBanner environment={undefined} />)

    expect(screen.queryByRole('status')).not.toBeInTheDocument()
  })

  it("n'affiche rien pour un environnement inconnu", () => {
    render(<EnvironmentBanner environment="autre" />)

    expect(screen.queryByRole('status')).not.toBeInTheDocument()
  })
})
