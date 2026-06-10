import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { MarkdownContent } from '../MarkdownContent'

describe('MarkdownContent', () => {
  it('rend le gras (**texte**) en <strong>', () => {
    const { container } = render(<MarkdownContent content="Un **mot** fort" />)

    expect(container.querySelector('strong')).toHaveTextContent('mot')
  })

  it('rend une liste à puces en <ul><li>', () => {
    const { container } = render(<MarkdownContent content={'- un\n- deux\n- trois'} />)

    expect(container.querySelectorAll('li')).toHaveLength(3)
  })

  it('rend un bloc de code en <pre><code>', () => {
    const { container } = render(<MarkdownContent content={'```bash\ndocker ps\n```'} />)

    const pre = container.querySelector('pre')
    expect(pre).toBeInTheDocument()
    expect(pre?.querySelector('code')).toHaveTextContent('docker ps')
  })

  it('rend les tableaux GFM', () => {
    const { container } = render(<MarkdownContent content={'| A | B |\n| - | - |\n| 1 | 2 |'} />)

    expect(container.querySelector('table')).toBeInTheDocument()
  })

  it('échappe le HTML brut (sécurité : pas d’injection)', () => {
    const { container } = render(
      <MarkdownContent content={'Avant <img src=x onerror="alert(1)"> après'} />,
    )

    // Le HTML brut ne doit jamais être interprété : aucun <img> rendu.
    expect(container.querySelector('img')).toBeNull()
    expect(screen.getByText(/onerror/)).toBeInTheDocument()
  })

  it('n’exécute pas les balises script injectées', () => {
    const { container } = render(<MarkdownContent content={'<script>alert(1)</script> texte'} />)

    expect(container.querySelector('script')).toBeNull()
  })
})
