import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import type { CatalogItem } from '../../domain/models/CatalogItem'
import { EngineKind } from '../../types/enums/EngineKind'
import { CatalogCard } from '../CatalogCard'

const ITEM: CatalogItem = {
  id: 'pg',
  name: 'PostgreSQL',
  icon: 'database',
  category: 'Database',
  provider: 'Docker',
  engine: EngineKind.DOCKER,
  tags: ['SQL', 'Persistant'],
  description: 'Base relationnelle managée.',
  popular: true,
  deployable: true,
}

const TERRAFORM_ITEM: CatalogItem = {
  id: 'k8s',
  name: 'Cluster Kubernetes',
  icon: 'boxes',
  category: 'Machine virtuelle',
  provider: 'Terraform',
  engine: EngineKind.TERRAFORM,
  tags: ['K8s', 'Cluster'],
  description: 'Cluster Kubernetes managé.',
  popular: false,
  deployable: true,
}

const RUNTIME_ITEM: CatalogItem = {
  id: 'node',
  name: 'Conteneur Node.js',
  icon: 'box',
  category: 'Runtime',
  provider: 'Docker',
  engine: EngineKind.DOCKER,
  tags: ['Runtime', 'JS'],
  description: 'Image Node LTS prête à déployer.',
  popular: false,
  deployable: false,
}

describe('CatalogCard', () => {
  it('affiche le nom, la méta et la description', () => {
    render(<CatalogCard item={ITEM} onSelect={vi.fn()} />)

    expect(screen.getByText('PostgreSQL')).toBeInTheDocument()
    expect(screen.getByText('Database · via Docker')).toBeInTheDocument()
    expect(screen.getByText('Base relationnelle managée.')).toBeInTheDocument()
  })

  it('affiche les tags', () => {
    render(<CatalogCard item={ITEM} onSelect={vi.fn()} />)

    expect(screen.getByText('SQL')).toBeInTheDocument()
    expect(screen.getByText('Persistant')).toBeInTheDocument()
  })

  it('affiche le badge « Populaire » pour un item populaire', () => {
    render(<CatalogCard item={ITEM} onSelect={vi.fn()} />)

    expect(screen.getByText('Populaire')).toBeInTheDocument()
  })

  it('masque le badge « Populaire » sinon', () => {
    render(<CatalogCard item={{ ...ITEM, popular: false }} onSelect={vi.fn()} />)

    expect(screen.queryByText('Populaire')).not.toBeInTheDocument()
  })

  it('rend une icône', () => {
    const { container } = render(<CatalogCard item={ITEM} onSelect={vi.fn()} />)

    expect(container.querySelector('svg')).not.toBeNull()
  })

  it('appelle onSelect avec l’item au clic', async () => {
    const onSelect = vi.fn()
    render(<CatalogCard item={ITEM} onSelect={onSelect} />)

    await userEvent.click(screen.getByRole('button'))

    expect(onSelect).toHaveBeenCalledWith(ITEM)
  })
})

describe('CatalogCard — responsivité (anti-débordement)', () => {
  it('ne tronque pas le nom et laisse le badge passer à la ligne sur une carte étroite', () => {
    render(<CatalogCard item={ITEM} onSelect={vi.fn()} />)

    const name = screen.getByText('PostgreSQL')
    // Le nom (parfois long, ex. « Conteneur Node.js ») est essentiel : jamais tronqué à « P… ».
    expect(name).not.toHaveClass('truncate')
    // La rangée titre + badge peut wrapper pour ne jamais écraser le nom.
    expect(name.parentElement).toHaveClass('flex-wrap')
  })

  it('tronque la méta « catégorie · provider »', () => {
    render(<CatalogCard item={ITEM} onSelect={vi.fn()} />)

    expect(screen.getByText('Database · via Docker')).toHaveClass('truncate')
  })

  it('garde le CTA « Configurer » sur une seule ligne', () => {
    render(<CatalogCard item={ITEM} onSelect={vi.fn()} />)

    const cta = screen.getByText('Configurer →')
    expect(cta).toHaveClass('whitespace-nowrap')
    expect(cta).toHaveClass('shrink-0')
  })

  it('empêche le badge « Populaire » de se faire écraser', () => {
    render(<CatalogCard item={ITEM} onSelect={vi.fn()} />)

    expect(screen.getByText('Populaire')).toHaveClass('shrink-0')
  })
})

describe('CatalogCard — moteur Docker (carte active)', () => {
  it('rend un bouton activé et cliquable', () => {
    render(<CatalogCard item={ITEM} onSelect={vi.fn()} />)

    const button = screen.getByRole('button')
    expect(button).not.toBeDisabled()
    expect(button).not.toHaveAttribute('aria-disabled', 'true')
  })

  it('affiche le CTA « Configurer » et pas de bandeau de blocage', () => {
    render(<CatalogCard item={ITEM} onSelect={vi.fn()} />)

    expect(screen.getByText('Configurer →')).toBeInTheDocument()
    expect(screen.queryByText('Bientôt disponible')).not.toBeInTheDocument()
  })
})

describe('CatalogCard — moteur Terraform (carte bloquée)', () => {
  it('affiche le bandeau « Bientôt disponible »', () => {
    render(<CatalogCard item={TERRAFORM_ITEM} onSelect={vi.fn()} />)

    expect(screen.getByText('Bientôt disponible')).toBeInTheDocument()
  })

  it('marque la carte comme désactivée (aria-disabled)', () => {
    render(<CatalogCard item={TERRAFORM_ITEM} onSelect={vi.fn()} />)

    expect(screen.getByRole('button')).toHaveAttribute('aria-disabled', 'true')
  })

  it("n'appelle pas onSelect au clic", async () => {
    const onSelect = vi.fn()
    render(<CatalogCard item={TERRAFORM_ITEM} onSelect={onSelect} />)

    await userEvent.click(screen.getByRole('button'))

    expect(onSelect).not.toHaveBeenCalled()
  })

  it('expose un tooltip explicatif au survol', () => {
    render(<CatalogCard item={TERRAFORM_ITEM} onSelect={vi.fn()} />)

    expect(screen.getByRole('button')).toHaveAttribute(
      'title',
      'Déploiements Terraform bientôt disponibles',
    )
  })

  it('grise visuellement la carte', () => {
    render(<CatalogCard item={TERRAFORM_ITEM} onSelect={vi.fn()} />)

    expect(screen.getByRole('button').className).toMatch(/opacity-/)
  })

  it("masque le CTA « Configurer » d'une carte active", () => {
    render(<CatalogCard item={TERRAFORM_ITEM} onSelect={vi.fn()} />)

    expect(screen.queryByText('Configurer →')).not.toBeInTheDocument()
  })
})

describe('CatalogCard — runtime non déployable (carte bloquée)', () => {
  it('affiche le bandeau « Bientôt disponible »', () => {
    render(<CatalogCard item={RUNTIME_ITEM} onSelect={vi.fn()} />)

    expect(screen.getByText('Bientôt disponible')).toBeInTheDocument()
  })

  it('marque la carte comme désactivée (aria-disabled)', () => {
    render(<CatalogCard item={RUNTIME_ITEM} onSelect={vi.fn()} />)

    expect(screen.getByRole('button')).toHaveAttribute('aria-disabled', 'true')
  })

  it("n'appelle pas onSelect au clic", async () => {
    const onSelect = vi.fn()
    render(<CatalogCard item={RUNTIME_ITEM} onSelect={onSelect} />)

    await userEvent.click(screen.getByRole('button'))

    expect(onSelect).not.toHaveBeenCalled()
  })

  it('expose un tooltip spécifique au runtime (et non le tooltip Terraform)', () => {
    render(<CatalogCard item={RUNTIME_ITEM} onSelect={vi.fn()} />)

    expect(screen.getByRole('button')).toHaveAttribute('title', 'Déploiement bientôt disponible')
  })

  it('grise visuellement la carte', () => {
    render(<CatalogCard item={RUNTIME_ITEM} onSelect={vi.fn()} />)

    expect(screen.getByRole('button').className).toMatch(/opacity-/)
  })

  it('masque le CTA « Configurer »', () => {
    render(<CatalogCard item={RUNTIME_ITEM} onSelect={vi.fn()} />)

    expect(screen.queryByText('Configurer →')).not.toBeInTheDocument()
  })
})
