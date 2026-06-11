import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { StackServiceBlock } from '../StackServiceBlock'
import type { CompositionLink, CompositionService } from '../../types/models/StackComposition'
import type { TemplateConfig } from '../../../deployment/types/models/TemplateConfig'
import { EngineKind } from '../../../deployment/types/enums/EngineKind'
import { ParamKind } from '../../../deployment/types/enums/ParamKind'

function template(): TemplateConfig {
  return {
    id: 'pg16',
    name: 'PostgreSQL',
    icon: 'database',
    description: '',
    engine: EngineKind.DOCKER,
    imageRepository: 'postgres',
    internalPort: 5432,
    secretEnv: 'POSTGRES_PASSWORD',
    versions: [
      { version: '16', isDefault: true, isLts: true, eolDate: null },
      { version: '15', isDefault: false, isLts: false, eolDate: null },
    ],
    params: [
      {
        key: 'db_name',
        label: 'Base',
        type: ParamKind.STRING,
        required: true,
        defaultValue: 'app',
        options: null,
        orderIndex: 0,
      },
      {
        key: 'admin_password',
        label: 'Mot de passe admin',
        type: ParamKind.SECRET,
        required: true,
        defaultValue: null,
        options: null,
        orderIndex: 1,
      },
    ],
  }
}

function service(): CompositionService {
  return {
    localId: 'svc-1',
    template: template(),
    alias: 'db',
    version: '16',
    params: { db_name: 'app', admin_password: 's3cr3t' },
  }
}

const noop = () => undefined

function renderBlock(overrides: Partial<Parameters<typeof StackServiceBlock>[0]> = {}) {
  const props = {
    service: service(),
    outgoingLinks: [] as readonly CompositionLink[],
    providers: [] as readonly CompositionService[],
    onAlias: noop,
    onVersion: noop,
    onParam: noop,
    onRemove: noop,
    onAddLink: noop,
    onRemoveLink: noop,
    onChangeLinkMappings: noop,
    ...overrides,
  }
  return { props, ...render(<StackServiceBlock {...props} />) }
}

describe('StackServiceBlock', () => {
  it('édite l’alias', async () => {
    const onAlias = vi.fn()
    renderBlock({ onAlias })

    await userEvent.type(screen.getByLabelText(/Alias du service/i), 'x')

    expect(onAlias).toHaveBeenCalled()
  })

  it('demande la suppression du service', async () => {
    const onRemove = vi.fn()
    renderBlock({ onRemove })

    await userEvent.click(screen.getByLabelText(/Supprimer db/i))

    expect(onRemove).toHaveBeenCalledTimes(1)
  })

  it('rend le paramètre secret en champ masqué (jamais en clair)', () => {
    renderBlock()

    const secretInput = screen.getByLabelText(/Mot de passe admin/i)
    expect(secretInput).toHaveAttribute('type', 'password')
  })

  it('propose de lier à un fournisseur disponible et émet l’ajout', async () => {
    const onAddLink = vi.fn()
    const provider: CompositionService = {
      localId: 'svc-2',
      template: { ...template(), id: 'cache', name: 'Redis' },
      alias: 'cache',
      version: '16',
      params: {},
    }
    renderBlock({ providers: [provider], onAddLink })

    await userEvent.selectOptions(screen.getByLabelText(/Lier db à un service/i), 'svc-2')
    await userEvent.click(screen.getByRole('button', { name: 'Lier' }))

    expect(onAddLink).toHaveBeenCalledWith('svc-2')
  })

  it('affiche les liens existants par alias du fournisseur', () => {
    const provider: CompositionService = {
      localId: 'svc-2',
      template: { ...template(), id: 'cache', name: 'Redis' },
      alias: 'cache',
      version: '16',
      params: {},
    }
    const link: CompositionLink = {
      localId: 'link-1',
      fromLocalId: 'svc-1',
      toLocalId: 'svc-2',
      varMappings: { DB_HOST: '{to.alias}' },
    }
    renderBlock({ providers: [provider], outgoingLinks: [link] })

    expect(screen.getByText('cache')).toBeInTheDocument()
  })
})
