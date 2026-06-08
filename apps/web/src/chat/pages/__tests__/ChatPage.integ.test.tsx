import { act, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { HttpResponse, http } from 'msw'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { server } from '../../../../tests/mocks/server'
import { createQueryWrapper } from '../../../../tests/utils/queryWrapper'
import { resetConversationStore } from '../../data/conversations.fixtures'
import type { ScriptedStreamFrame } from '../../data/stream.fixtures'
import type { StreamFrameHandler } from '../../services/chatStreamSeam'
import { ChatStreamEventName } from '../../types/models/ChatStreamEvent'
import { ChatPage } from '../ChatPage'

/**
 * On mocke le seam SSE (`openChatStream`) : le test capture le handler de trames
 * et pilote le flux (token → message → action_proposed). Les déploiements de
 * l'aside passent par MSW (`GET /deployments`). Le scénario complet : envoi →
 * bulle qui se remplit → carte d'action → confirmation → aside.
 */
const { openChatStreamMock } = vi.hoisted(() => ({ openChatStreamMock: vi.fn() }))

vi.mock('../../services/chatStreamSeam', () => ({ openChatStream: openChatStreamMock }))

let capturedOnFrame: StreamFrameHandler | undefined

function emit(frame: ScriptedStreamFrame): void {
  capturedOnFrame?.(frame)
}

function tokenFrame(delta: string): ScriptedStreamFrame {
  return { event: ChatStreamEventName.TOKEN, data: JSON.stringify({ delta }) }
}

function messageFrame(content: string): ScriptedStreamFrame {
  return {
    event: ChatStreamEventName.MESSAGE,
    data: JSON.stringify({
      message: {
        id: 'm-final',
        role: 'assistant',
        content,
        created_at: '2026-06-08T12:00:00Z',
        action: null,
      },
    }),
  }
}

function actionFrame(): ScriptedStreamFrame {
  return {
    event: ChatStreamEventName.ACTION_PROPOSED,
    data: JSON.stringify({
      action: {
        id: 'act-1',
        kind: 'deploy',
        status: 'proposed',
        intent: 'Déployer un PostgreSQL 16 isolé',
        template_id: 'pg16',
        version: '16',
        image: 'postgres:16-alpine',
        params: { 'Base de données': 'app' },
        quotas: { CPU: '1 vCPU' },
      },
    }),
  }
}

function renderChat() {
  const Wrapper = createQueryWrapper()
  return render(
    <Wrapper>
      <MemoryRouter initialEntries={['/chat']}>
        <ChatPage />
      </MemoryRouter>
    </Wrapper>,
  )
}

describe('ChatPage (parcours chat IA display-only)', () => {
  beforeEach(() => {
    resetConversationStore()
    capturedOnFrame = undefined
    openChatStreamMock.mockReset()
    openChatStreamMock.mockImplementation(
      (_id: string, _msg: string, onFrame: StreamFrameHandler) => {
        capturedOnFrame = onFrame
        return new Promise<void>(() => {
          // jamais résolu : le flux reste « ouvert » sous le contrôle du test
        })
      },
    )

    server.use(
      http.get('*/deployments', () =>
        HttpResponse.json([
          {
            id: 'dep-1',
            template_id: 'pg16',
            template_version: '16',
            name: 'postgres-prod',
            status: 'running',
            params: {},
            host: '10.0.0.5',
            published_port: 32769,
            access_url: '10.0.0.5:32769',
            created_at: '2026-06-08T10:00:00Z',
            updated_at: '2026-06-08T11:00:00Z',
          },
        ]),
      ),
    )
  })

  afterEach(() => {
    vi.clearAllMocks()
    server.resetHandlers()
  })

  it('affiche les 3 colonnes : fils, message d’accueil, déploiements actifs', async () => {
    renderChat()

    expect(await screen.findByText(/Env de dev Node \+ Postgres/)).toBeInTheDocument()
    expect(await screen.findByText(/Décris-moi ton besoin/)).toBeInTheDocument()
    expect(await screen.findByText('postgres-prod')).toBeInTheDocument()
  })

  it('envoie un message, remplit la bulle puis propose une action confirmable', async () => {
    const user = userEvent.setup()
    renderChat()
    await screen.findByText(/Env de dev Node \+ Postgres/)

    const textarea = screen.getByRole('textbox')
    await user.type(textarea, 'Je veux un Postgres isolé')
    await user.click(screen.getByRole('button', { name: /Envoyer/ }))

    // Le message utilisateur apparaît.
    expect(screen.getByText('Je veux un Postgres isolé')).toBeInTheDocument()

    // La bulle de streaming se remplit token par token.
    act(() => {
      emit(tokenFrame('Je prépare '))
      emit(tokenFrame('une proposition…'))
    })
    await waitFor(() => {
      expect(screen.getByText(/Je prépare une proposition…/)).toBeInTheDocument()
    })

    // Message final + carte d'action proposée.
    act(() => {
      emit(messageFrame('Voici ce que je propose :'))
      emit(actionFrame())
    })
    await waitFor(() => {
      expect(screen.getByText(/Déployer un PostgreSQL 16 isolé/)).toBeInTheDocument()
    })
    expect(screen.getByText('Base de données')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Confirmer/ })).toBeEnabled()
  })

  it('confirme l’action : la carte passe « Exécutée »', async () => {
    const user = userEvent.setup()
    renderChat()
    await screen.findByText(/Env de dev Node \+ Postgres/)

    await user.type(screen.getByRole('textbox'), 'go')
    await user.click(screen.getByRole('button', { name: /Envoyer/ }))

    act(() => {
      emit(messageFrame('Proposition :'))
      emit(actionFrame())
    })
    await screen.findByRole('button', { name: /Confirmer/ })

    await user.click(screen.getByRole('button', { name: /Confirmer/ }))

    await waitFor(() => {
      expect(screen.getByText('Exécutée')).toBeInTheDocument()
    })
  })

  it('crée une nouvelle conversation', async () => {
    const user = userEvent.setup()
    renderChat()
    await screen.findByText(/Env de dev Node \+ Postgres/)

    // Avant création : seul le bouton porte ce libellé.
    expect(screen.getAllByText('Nouvelle conversation')).toHaveLength(1)

    await user.click(screen.getByRole('button', { name: /Nouvelle conversation/ }))

    // Après création : le bouton + le nouveau fil dans la liste.
    await waitFor(() => {
      expect(screen.getAllByText('Nouvelle conversation').length).toBeGreaterThan(1)
    })
  })
})
