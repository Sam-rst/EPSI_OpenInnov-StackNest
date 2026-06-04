import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { LogoLockup } from '../LogoLockup'

describe('LogoLockup', () => {
  it('affiche le wordmark StackNest', () => {
    render(<LogoLockup />)

    expect(screen.getByText('StackNest')).toBeInTheDocument()
  })

  it('rend le symbole en décoratif pour éviter une double annonce du nom', () => {
    render(<LogoLockup />)

    expect(screen.queryByRole('img')).not.toBeInTheDocument()
  })

  it('transmet la variante au symbole', () => {
    const { container } = render(<LogoLockup variant="mono-cyan" />)

    const img = container.querySelector('img')
    expect(img).toHaveAttribute('src', '/assets/logo-mono-cyan.svg')
    expect(img).toHaveAttribute('alt', '')
  })
})
