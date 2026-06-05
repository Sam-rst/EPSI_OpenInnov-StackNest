import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'

import type { NavItem } from '../../navigation'
import { SidebarNavItem } from '../SidebarNavItem'

const baseItem: NavItem = {
  id: 'catalog',
  label: 'Catalogue',
  icon: 'layout-grid',
  group: 'main',
  to: '/catalog',
}

function renderItem(item: NavItem, active = false) {
  return render(
    <MemoryRouter>
      <SidebarNavItem item={item} active={active} />
    </MemoryRouter>,
  )
}

describe('SidebarNavItem', () => {
  it('rend un lien vers la destination de l’item', () => {
    renderItem(baseItem)

    const link = screen.getByRole('link', { name: /catalogue/i })
    expect(link).toHaveAttribute('href', '/catalog')
  })

  it('affiche la pastille quand l’item en a une', () => {
    renderItem({ ...baseItem, id: 'chat', label: 'ChatOps IA', badge: 'Nouveau' })

    expect(screen.getByText('Nouveau')).toBeInTheDocument()
  })

  it('n’affiche pas de pastille quand l’item n’en a pas', () => {
    renderItem(baseItem)

    expect(screen.queryByText('Nouveau')).not.toBeInTheDocument()
  })

  it('met en avant l’item actif (couleur cyan)', () => {
    renderItem(baseItem, true)

    expect(screen.getByRole('link', { name: /catalogue/i })).toHaveClass('text-cyan')
  })

  it('rend l’item inactif en texte secondaire', () => {
    renderItem(baseItem, false)

    const link = screen.getByRole('link', { name: /catalogue/i })
    expect(link).toHaveClass('text-text-secondary')
    expect(link).not.toHaveClass('text-cyan')
  })
})
