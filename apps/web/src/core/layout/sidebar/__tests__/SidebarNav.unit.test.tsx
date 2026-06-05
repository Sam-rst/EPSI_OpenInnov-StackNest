import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'

import { SidebarNav } from '../SidebarNav'

function renderNav(path = '/catalog') {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <SidebarNav />
    </MemoryRouter>,
  )
}

describe('SidebarNav', () => {
  it('rend les deux sections Plateforme et Administration', () => {
    renderNav()

    expect(screen.getByText('Plateforme')).toBeInTheDocument()
    expect(screen.getByText('Administration')).toBeInTheDocument()
  })

  it('liste les 6 entrées de navigation', () => {
    renderNav()

    expect(screen.getAllByRole('link')).toHaveLength(6)
  })

  it('marque la route courante comme active (aria-current)', () => {
    renderNav('/catalog')

    expect(screen.getByRole('link', { name: /catalogue/i })).toHaveAttribute('aria-current', 'page')
    expect(screen.getByRole('link', { name: /dashboard/i })).not.toHaveAttribute('aria-current')
  })

  it('considère une sous-route comme active (préfixe)', () => {
    renderNav('/deployments/config')

    expect(screen.getByRole('link', { name: /déploiements/i })).toHaveAttribute(
      'aria-current',
      'page',
    )
  })
})
