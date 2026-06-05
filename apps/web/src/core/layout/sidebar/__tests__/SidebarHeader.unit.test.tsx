import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { SidebarHeader } from '../SidebarHeader'

describe('SidebarHeader', () => {
  it('affiche le wordmark StackNest', () => {
    render(<SidebarHeader />)

    expect(screen.getByText('StackNest')).toBeInTheDocument()
  })

  it('rend le symbole du logo', () => {
    render(<SidebarHeader />)

    expect(screen.getByRole('img', { name: 'StackNest' })).toBeInTheDocument()
  })

  it('affiche le badge de version', () => {
    render(<SidebarHeader />)

    expect(screen.getByText('v0.1.0')).toBeInTheDocument()
  })
})
