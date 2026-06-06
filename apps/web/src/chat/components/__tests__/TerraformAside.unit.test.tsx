import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { TerraformAside } from '../TerraformAside'

describe('TerraformAside', () => {
  it('affiche le titre de l’aperçu Terraform', () => {
    render(<TerraformAside />)

    expect(screen.getByText('Aperçu Terraform')).toBeInTheDocument()
  })

  it('rend un état vide honnête sans fabriquer de HCL', () => {
    const { container } = render(<TerraformAside />)

    expect(screen.getByText(/aucun plan à prévisualiser/i)).toBeInTheDocument()
    expect(container.querySelector('pre')).toBeNull()
    expect(screen.queryByText(/docker_container/i)).toBeNull()
  })
})
