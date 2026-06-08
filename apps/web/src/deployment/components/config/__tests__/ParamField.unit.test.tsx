import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { ParamKind } from '../../../types/enums/ParamKind'
import type { TemplateConfigParam } from '../../../types/models/TemplateConfig'
import { ParamField } from '../ParamField'

function param(overrides: Partial<TemplateConfigParam> = {}): TemplateConfigParam {
  return {
    key: 'db_name',
    label: 'Nom de la base',
    type: ParamKind.STRING,
    required: true,
    defaultValue: null,
    options: null,
    orderIndex: 0,
    ...overrides,
  }
}

describe('ParamField', () => {
  it('affiche le message d’erreur inline quand le paramètre est invalide (#5)', () => {
    render(
      <ParamField param={param()} value="" error="Ce paramètre est requis." onChange={vi.fn()} />,
    )

    expect(screen.getByText('Ce paramètre est requis.')).toBeInTheDocument()
    expect(screen.getByLabelText(/Nom de la base/)).toHaveAttribute('aria-invalid', 'true')
  })

  it('borne un paramètre INT avec min/max/step du descripteur (#6)', () => {
    const intParam = param({
      key: 'replicas',
      label: 'Réplicas',
      type: ParamKind.INT,
      min: 1,
      max: 5,
      step: 1,
    })
    render(<ParamField param={intParam} value="2" onChange={vi.fn()} />)

    const input = screen.getByLabelText(/Réplicas/)
    expect(input).toHaveAttribute('type', 'number')
    expect(input).toHaveAttribute('min', '1')
    expect(input).toHaveAttribute('max', '5')
    expect(input).toHaveAttribute('step', '1')
  })

  it('rend un INT sans borne quand le descripteur n’en fournit pas (défensif)', () => {
    const intParam = param({ key: 'count', label: 'Nombre', type: ParamKind.INT })
    render(<ParamField param={intParam} value="" onChange={vi.fn()} />)

    const input = screen.getByLabelText(/Nombre/)
    expect(input).toHaveAttribute('type', 'number')
    expect(input).not.toHaveAttribute('min')
    expect(input).not.toHaveAttribute('max')
  })

  it('rend un champ secret en type password (jamais en clair)', () => {
    const secret = param({ key: 'token', label: 'Jeton', type: ParamKind.SECRET })
    render(<ParamField param={secret} value="s3cr3t" onChange={vi.fn()} />)

    expect(screen.getByLabelText(/Jeton/)).toHaveAttribute('type', 'password')
  })
})
