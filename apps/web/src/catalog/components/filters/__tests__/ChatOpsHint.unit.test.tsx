import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import { describe, expect, it } from 'vitest'

import { ChatOpsHint } from '../ChatOpsHint'

function LocationProbe() {
  const location = useLocation()
  return <div data-testid="pathname">{location.pathname}</div>
}

function renderWithRouter() {
  return render(
    <MemoryRouter initialEntries={['/catalog']}>
      <ChatOpsHint />
      <Routes>
        <Route path="*" element={<LocationProbe />} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('ChatOpsHint', () => {
  it('affiche l’invite et le bouton ChatOps', () => {
    renderWithRouter()

    expect(screen.getByText(/Pas envie de chercher/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Ouvrir ChatOps/ })).toBeInTheDocument()
  })

  it('navigue vers /chat au clic', async () => {
    renderWithRouter()

    await userEvent.click(screen.getByRole('button', { name: /Ouvrir ChatOps/ }))

    expect(screen.getByTestId('pathname')).toHaveTextContent('/chat')
  })
})
