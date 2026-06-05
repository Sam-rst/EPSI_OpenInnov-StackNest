import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { Icon } from '../Icon'

describe('Icon', () => {
  it('rend une icône lucide pour un nom kebab-case connu', () => {
    const { container } = render(<Icon name="search" />)
    const svg = container.querySelector('svg')

    expect(svg).not.toBeNull()
    expect(svg).toHaveClass('lucide')
  })

  it('applique la taille fournie en largeur et hauteur', () => {
    const { container } = render(<Icon name="search" size={28} />)
    const svg = container.querySelector('svg')

    expect(svg).toHaveAttribute('width', '28')
    expect(svg).toHaveAttribute('height', '28')
  })

  it('résout les noms multi-segments (kebab-case → PascalCase)', () => {
    const { container } = render(<Icon name="arrow-up-right" />)

    expect(container.querySelector('svg')).not.toBeNull()
  })

  it('rend null pour un nom inconnu', () => {
    const { container } = render(<Icon name="definitely-not-an-icon" />)

    expect(container.querySelector('svg')).toBeNull()
  })

  it('transmet la className fournie', () => {
    const { container } = render(<Icon name="search" className="text-cyan" />)

    expect(container.querySelector('svg')).toHaveClass('text-cyan')
  })
})
