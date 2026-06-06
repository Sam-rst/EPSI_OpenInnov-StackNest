import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { AuthContext } from '../../../../auth/contexts/AuthContext'
import { RequireAdmin } from '../RequireAdmin'

function renderGuard(value: { isAuthenticated: boolean; isAdmin?: boolean }) {
  return render(
    <AuthContext.Provider value={value}>
      <RequireAdmin>
        <div>Zone admin</div>
      </RequireAdmin>
    </AuthContext.Provider>,
  )
}

describe('RequireAdmin', () => {
  it('rend les enfants quand l’utilisateur est admin', () => {
    renderGuard({ isAuthenticated: true, isAdmin: true })

    expect(screen.getByText('Zone admin')).toBeInTheDocument()
  })

  it('bloque l’accès (403 honnête) quand l’utilisateur n’est pas admin', () => {
    renderGuard({ isAuthenticated: true, isAdmin: false })

    expect(screen.queryByText('Zone admin')).not.toBeInTheDocument()
    expect(screen.getByText('Accès réservé aux administrateurs')).toBeInTheDocument()
  })
})
