import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { SelectionCheckbox } from '../SelectionCheckbox'

describe('SelectionCheckbox', () => {
  it('rend une case accessible avec un libellé', () => {
    render(<SelectionCheckbox checked={false} onChange={vi.fn()} label="Sélectionner pg" />)

    const checkbox = screen.getByRole('checkbox', { name: 'Sélectionner pg' })
    expect(checkbox).toBeInTheDocument()
    expect(checkbox).not.toBeChecked()
  })

  it('reflète l’état coché', () => {
    render(<SelectionCheckbox checked onChange={vi.fn()} label="Sélectionner pg" />)

    expect(screen.getByRole('checkbox', { name: 'Sélectionner pg' })).toBeChecked()
  })

  it('appelle onChange au clic', async () => {
    const onChange = vi.fn()
    const user = userEvent.setup()
    render(<SelectionCheckbox checked={false} onChange={onChange} label="Sélectionner pg" />)

    await user.click(screen.getByRole('checkbox', { name: 'Sélectionner pg' }))

    expect(onChange).toHaveBeenCalledTimes(1)
  })

  it('stoppe la propagation du clic (ne déclenche pas la navigation de la ligne)', async () => {
    const onRowClick = vi.fn()
    const user = userEvent.setup()
    render(
      <div onClick={onRowClick}>
        <SelectionCheckbox checked={false} onChange={vi.fn()} label="Sélectionner pg" />
      </div>,
    )

    await user.click(screen.getByRole('checkbox', { name: 'Sélectionner pg' }))

    expect(onRowClick).not.toHaveBeenCalled()
  })

  it('expose l’état indéterminé sur l’élément input', () => {
    render(
      <SelectionCheckbox
        checked={false}
        indeterminate
        onChange={vi.fn()}
        label="Tout sélectionner"
      />,
    )

    const checkbox = screen.getByRole('checkbox', { name: 'Tout sélectionner' })
    expect(checkbox).toHaveProperty('indeterminate', true)
  })
})
