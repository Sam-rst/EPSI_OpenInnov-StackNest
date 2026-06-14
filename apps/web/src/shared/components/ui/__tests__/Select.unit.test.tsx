import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createRef } from 'react'
import { describe, expect, it, vi } from 'vitest'

import { Select } from '../Select'

const OPTIONS = [
  { value: 'asc', label: 'A → Z' },
  { value: 'desc', label: 'Z → A' },
]

describe('Select', () => {
  it('rend un select accessible avec sa valeur', () => {
    render(<Select aria-label="Trier" value="asc" onChange={vi.fn()} options={OPTIONS} />)

    const select = screen.getByRole('combobox', { name: 'Trier' })
    expect(select).toBeInTheDocument()
    expect(select).toHaveValue('asc')
  })

  it('rend les options fournies via la prop options', () => {
    render(<Select aria-label="Trier" value="asc" onChange={vi.fn()} options={OPTIONS} />)

    expect(screen.getByRole('option', { name: 'A → Z' })).toBeInTheDocument()
    expect(screen.getByRole('option', { name: 'Z → A' })).toBeInTheDocument()
  })

  it('rend les enfants <option> quand aucune prop options', () => {
    render(
      <Select aria-label="Env" value="dev" onChange={vi.fn()}>
        <option value="dev">dev</option>
        <option value="prod">prod</option>
      </Select>,
    )

    expect(screen.getByRole('option', { name: 'dev' })).toBeInTheDocument()
    expect(screen.getByRole('option', { name: 'prod' })).toBeInTheDocument()
  })

  it('appelle onChange avec la valeur sélectionnée (pas l’événement)', async () => {
    const onChange = vi.fn()
    const user = userEvent.setup()
    render(<Select aria-label="Trier" value="asc" onChange={onChange} options={OPTIONS} />)

    await user.selectOptions(screen.getByRole('combobox', { name: 'Trier' }), 'desc')

    expect(onChange).toHaveBeenCalledWith('desc')
  })

  it('affiche un chevron (icône lucide) décoratif', () => {
    const { container } = render(
      <Select aria-label="Trier" value="asc" onChange={vi.fn()} options={OPTIONS} />,
    )

    expect(container.querySelector('svg')).not.toBeNull()
  })

  it('rend une zone cliquable pleine : le select porte cursor-pointer', () => {
    render(<Select aria-label="Trier" value="asc" onChange={vi.fn()} options={OPTIONS} />)

    expect(screen.getByRole('combobox', { name: 'Trier' })).toHaveClass('cursor-pointer')
  })

  it('reflète aria-invalid quand invalid est vrai', () => {
    render(<Select aria-label="Trier" value="asc" onChange={vi.fn()} options={OPTIONS} invalid />)

    expect(screen.getByRole('combobox', { name: 'Trier' })).toHaveAttribute('aria-invalid', 'true')
  })

  it('n’expose pas aria-invalid quand invalid est faux', () => {
    render(<Select aria-label="Trier" value="asc" onChange={vi.fn()} options={OPTIONS} />)

    expect(screen.getByRole('combobox', { name: 'Trier' })).not.toHaveAttribute('aria-invalid')
  })

  it('désactive le select quand disabled', () => {
    render(<Select aria-label="Trier" value="asc" onChange={vi.fn()} options={OPTIONS} disabled />)

    expect(screen.getByRole('combobox', { name: 'Trier' })).toBeDisabled()
  })

  it('transmet l’id fourni', () => {
    render(
      <Select id="dep-env" aria-label="Env" value="dev" onChange={vi.fn()} options={OPTIONS} />,
    )

    expect(screen.getByRole('combobox', { name: 'Env' })).toHaveAttribute('id', 'dep-env')
  })

  it('transmet la className fournie', () => {
    render(
      <Select
        aria-label="Trier"
        value="asc"
        onChange={vi.fn()}
        options={OPTIONS}
        className="w-24"
      />,
    )

    expect(screen.getByRole('combobox', { name: 'Trier' })).toHaveClass('w-24')
  })

  it('transmet la ref vers le select natif', () => {
    const ref = createRef<HTMLSelectElement>()
    render(<Select ref={ref} aria-label="Trier" value="asc" onChange={vi.fn()} options={OPTIONS} />)

    expect(ref.current).toBeInstanceOf(HTMLSelectElement)
  })
})
