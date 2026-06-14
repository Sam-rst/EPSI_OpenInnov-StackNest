import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { HttpResponse, http } from 'msw'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, describe, expect, it } from 'vitest'

import { BETA_BANNER_TEXT } from '../../../shared/components/BetaBanner'
import { server } from '../../../../tests/mocks/server'
import { createQueryWrapper } from '../../../../tests/utils/queryWrapper'
import type { StackDTO } from '../../types/dto/StackDTO'
import { StacksPage } from '../StacksPage'

function stackDto(overrides: Partial<StackDTO> = {}): StackDTO {
  return {
    id: 'stack-1',
    owner_id: 'user-1',
    name: 'ma-stack',
    status: 'running',
    services: [
      {
        id: 's1',
        template_id: 'pg16',
        version: '16',
        alias: 'db',
        service_status: 'running',
        order_index: 0,
        params: {},
        published_port: null,
        container_ref: null,
      },
    ],
    created_at: null,
    updated_at: null,
    ...overrides,
  }
}

function renderPage() {
  const Wrapper = createQueryWrapper()
  return render(
    <Wrapper>
      <MemoryRouter initialEntries={['/stacks']}>
        <Routes>
          <Route path="/stacks" element={<StacksPage />} />
          <Route path="/stacks/:id" element={<div>Détail stack</div>} />
          <Route path="/stacks/new" element={<div>Builder</div>} />
        </Routes>
      </MemoryRouter>
    </Wrapper>,
  )
}

/** Récupère la table desktop (le rendu monte aussi les cartes mobiles). */
function desktopTable(): HTMLElement {
  return screen.getByRole('table')
}

describe('StacksPage', () => {
  afterEach(() => {
    server.resetHandlers()
  })

  it('affiche un rappel bêta honnête en tête de page', async () => {
    server.use(http.get('*/stacks', () => HttpResponse.json([stackDto()])))

    renderPage()

    expect(await screen.findByText(BETA_BANNER_TEXT)).toBeInTheDocument()
  })

  it('liste les stacks dans une table avec nom, statut et nb de services', async () => {
    server.use(http.get('*/stacks', () => HttpResponse.json([stackDto()])))

    renderPage()

    expect(await screen.findByRole('table')).toBeInTheDocument()
    const table = desktopTable()
    expect(within(table).getByText('ma-stack')).toBeInTheDocument()
    expect(within(table).getByText('En ligne')).toBeInTheDocument()
    expect(within(table).getByText('1 service')).toBeInTheDocument()
  })

  it('rend aussi des cartes pour le responsive mobile', async () => {
    server.use(http.get('*/stacks', () => HttpResponse.json([stackDto()])))

    renderPage()
    await screen.findByRole('table')

    expect(screen.getByTestId('stacks-cards')).toBeInTheDocument()
  })

  it('navigue vers le détail au clic sur une ligne', async () => {
    server.use(http.get('*/stacks', () => HttpResponse.json([stackDto()])))

    renderPage()
    await screen.findByRole('table')

    await userEvent.click(within(desktopTable()).getByText('ma-stack'))

    expect(await screen.findByText('Détail stack')).toBeInTheDocument()
  })

  it('affiche la barre groupée et détruit la sélection après confirmation', async () => {
    const deleted: string[] = []
    server.use(
      http.get('*/stacks', () =>
        HttpResponse.json([stackDto(), stackDto({ id: 'stack-2', name: 'autre-stack' })]),
      ),
      http.delete('*/stacks/:id', ({ params }) => {
        deleted.push(params.id as string)
        return new HttpResponse(null, { status: 204 })
      }),
    )

    renderPage()
    await screen.findByRole('table')

    // Sélectionne une stack via sa case (dans la table desktop).
    await userEvent.click(within(desktopTable()).getByLabelText('Sélectionner la stack ma-stack'))

    // La barre groupée apparaît.
    const bar = screen.getByRole('region', { name: 'Actions groupées' })
    expect(within(bar).getByText('1 stack sélectionnée')).toBeInTheDocument()

    // Déclenche la destruction + confirme.
    await userEvent.click(within(bar).getByRole('button', { name: /Détruire la sélection/ }))
    const dialog = screen.getByRole('dialog')
    await userEvent.click(within(dialog).getByRole('button', { name: 'Détruire' }))

    await waitFor(() => expect(deleted).toEqual(['stack-1']))
  })

  it('sélectionne toutes les stacks via la case d’en-tête', async () => {
    server.use(
      http.get('*/stacks', () =>
        HttpResponse.json([stackDto(), stackDto({ id: 'stack-2', name: 'autre-stack' })]),
      ),
    )

    renderPage()
    await screen.findByRole('table')

    await userEvent.click(within(desktopTable()).getByLabelText('Tout sélectionner'))

    expect(screen.getByText('2 stacks sélectionnées')).toBeInTheDocument()
  })

  it('affiche un état vide honnête sans stack', async () => {
    server.use(http.get('*/stacks', () => HttpResponse.json([])))

    renderPage()

    expect(await screen.findByText('Aucune stack')).toBeInTheDocument()
  })

  it('expose une erreur avec réessai', async () => {
    server.use(http.get('*/stacks', () => new HttpResponse(null, { status: 500 })))

    renderPage()

    await waitFor(() => {
      expect(screen.getByText('Impossible de charger les stacks.')).toBeInTheDocument()
    })
  })
})
