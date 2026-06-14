import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createRef } from 'react'
import { describe, expect, it, vi } from 'vitest'

import { Checkbox } from '../Checkbox'

describe('Checkbox', () => {
  it('rend une case accessible via aria-label', () => {
    render(<Checkbox checked={false} onChange={vi.fn()} aria-label="Sélectionner pg" />)

    const checkbox = screen.getByRole('checkbox', { name: 'Sélectionner pg' })
    expect(checkbox).toBeInTheDocument()
    expect(checkbox).not.toBeChecked()
  })

  it('rend une case accessible via un label visible', () => {
    render(<Checkbox checked onChange={vi.fn()} label="Populaires uniquement" />)

    expect(screen.getByRole('checkbox', { name: 'Populaires uniquement' })).toBeChecked()
  })

  it('reflète l’état coché', () => {
    render(<Checkbox checked onChange={vi.fn()} aria-label="Coché" />)

    expect(screen.getByRole('checkbox', { name: 'Coché' })).toBeChecked()
  })

  it('appelle onChange avec le nouvel état coché (booléen)', async () => {
    const onChange = vi.fn()
    const user = userEvent.setup()
    render(<Checkbox checked={false} onChange={onChange} aria-label="Activer" />)

    await user.click(screen.getByRole('checkbox', { name: 'Activer' }))

    expect(onChange).toHaveBeenCalledWith(true)
  })

  it('appelle onChange au clic sur le label visible (hit-area étendue)', async () => {
    const onChange = vi.fn()
    const user = userEvent.setup()
    render(<Checkbox checked={false} onChange={onChange} label="Populaires uniquement" />)

    await user.click(screen.getByText('Populaires uniquement'))

    expect(onChange).toHaveBeenCalledWith(true)
  })

  it('expose l’état indéterminé sur l’élément input', () => {
    render(<Checkbox checked={false} indeterminate onChange={vi.fn()} aria-label="Tout" />)

    expect(screen.getByRole('checkbox', { name: 'Tout' })).toHaveProperty('indeterminate', true)
  })

  it('porte cursor-pointer pour signaler la cliquabilité', () => {
    render(<Checkbox checked={false} onChange={vi.fn()} aria-label="Activer" />)

    expect(screen.getByRole('checkbox', { name: 'Activer' })).toHaveClass('cursor-pointer')
  })

  it('désactive la case quand disabled', () => {
    render(<Checkbox checked={false} onChange={vi.fn()} aria-label="Activer" disabled />)

    expect(screen.getByRole('checkbox', { name: 'Activer' })).toBeDisabled()
  })

  it('n’appelle pas onChange quand disabled', async () => {
    const onChange = vi.fn()
    const user = userEvent.setup()
    render(<Checkbox checked={false} onChange={onChange} aria-label="Activer" disabled />)

    await user.click(screen.getByRole('checkbox', { name: 'Activer' }))

    expect(onChange).not.toHaveBeenCalled()
  })

  it('propage les gestionnaires natifs supplémentaires (onClick)', async () => {
    const onClick = vi.fn()
    const user = userEvent.setup()
    render(<Checkbox checked={false} onChange={vi.fn()} aria-label="Activer" onClick={onClick} />)

    await user.click(screen.getByRole('checkbox', { name: 'Activer' }))

    expect(onClick).toHaveBeenCalledOnce()
  })

  it('transmet la ref vers l’input natif', () => {
    const ref = createRef<HTMLInputElement>()
    render(<Checkbox ref={ref} checked={false} onChange={vi.fn()} aria-label="Activer" />)

    expect(ref.current).toBeInstanceOf(HTMLInputElement)
  })
})
