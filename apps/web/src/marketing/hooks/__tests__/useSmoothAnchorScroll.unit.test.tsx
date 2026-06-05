import { render } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { useSmoothAnchorScroll } from '../useSmoothAnchorScroll'

function Harness() {
  useSmoothAnchorScroll()
  return (
    <div>
      <a href="#cible">Aller à la cible</a>
      <a href="https://example.com">Lien externe</a>
      <section id="cible">Section cible</section>
    </div>
  )
}

describe('useSmoothAnchorScroll', () => {
  beforeEach(() => {
    Element.prototype.scrollIntoView = vi.fn()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('intercepte un clic sur une ancre interne et scrolle en douceur vers la cible', () => {
    const { getByText } = render(<Harness />)

    getByText('Aller à la cible').click()

    const target = document.getElementById('cible')
    expect(target?.scrollIntoView).toHaveBeenCalledWith({ behavior: 'smooth', block: 'start' })
  })

  it('ignore les liens qui ne sont pas des ancres internes', () => {
    const { getByText } = render(<Harness />)
    const externalLink = getByText('Lien externe')
    const clickEvent = new MouseEvent('click', { bubbles: true, cancelable: true })

    externalLink.dispatchEvent(clickEvent)

    expect(clickEvent.defaultPrevented).toBe(false)
  })
})
