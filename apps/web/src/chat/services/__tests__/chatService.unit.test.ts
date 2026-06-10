import { HttpResponse, http } from 'msw'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { apiClient } from '../../../core/api/apiClient'
import { server } from '../../../../tests/mocks/server'
import type { ConversationDetailDTO } from '../../types/dto/ConversationDetailDTO'
import type { ConversationDTO } from '../../types/dto/ConversationDTO'
import { MessageRole } from '../../types/enums/MessageRole'
import {
  confirmAction,
  createConversation,
  deleteConversation,
  getConversationMessages,
  listConversations,
  rejectAction,
  renameConversation,
  sendMessage,
} from '../chatService'

function conversationDto(overrides: Partial<ConversationDTO> = {}): ConversationDTO {
  return {
    id: 'c1',
    title: 'Env de dev Node + Postgres',
    created_at: '2026-06-08T10:00:00Z',
    updated_at: '2026-06-08T11:30:00Z',
    ...overrides,
  }
}

describe('chatService (API REST /chat)', () => {
  afterEach(() => {
    server.resetHandlers()
    vi.restoreAllMocks()
  })

  it('liste les fils et les mappe en modèles', async () => {
    server.use(
      http.get('*/chat/conversations', () =>
        HttpResponse.json([conversationDto(), conversationDto({ id: 'c2', title: 'Redis' })]),
      ),
    )

    const conversations = await listConversations()

    expect(conversations).toHaveLength(2)
    expect(conversations[0]?.title).toBe('Env de dev Node + Postgres')
    expect(conversations[0]?.relativeWhen).toBeTruthy()
  })

  it('récupère les messages d’amorce d’un fil (detail → messages)', async () => {
    const detail: ConversationDetailDTO = {
      conversation: conversationDto(),
      messages: [
        { id: 'm1', role: 'assistant', content: 'Bonjour', created_at: '2026-06-08T10:01:00Z' },
        { id: 'm2', role: 'user', content: 'Salut', created_at: '2026-06-08T10:02:00Z' },
      ],
    }
    server.use(http.get('*/chat/conversations/c1', () => HttpResponse.json(detail)))

    const messages = await getConversationMessages('c1')

    expect(messages).toHaveLength(2)
    expect(messages[0]?.role).toBe(MessageRole.ASSISTANT)
    expect(messages[0]?.content).toBe('Bonjour')
  })

  it('propage une erreur 404 pour un fil introuvable', async () => {
    server.use(
      http.get('*/chat/conversations/inconnu', () => new HttpResponse(null, { status: 404 })),
    )

    await expect(getConversationMessages('inconnu')).rejects.toThrow()
  })

  it('crée un fil (201) et renvoie le modèle', async () => {
    let received: Record<string, unknown> | undefined
    server.use(
      http.post('*/chat/conversations', async ({ request }) => {
        received = (await request.json()) as Record<string, unknown>
        return HttpResponse.json(conversationDto({ id: 'c-new', title: 'Nouveau' }), {
          status: 201,
        })
      }),
    )

    const conversation = await createConversation('Nouveau')

    expect(conversation.id).toBe('c-new')
    expect(conversation.title).toBe('Nouveau')
    expect(received).toEqual({ title: 'Nouveau' })
  })

  it('renomme un fil via PATCH et renvoie le titre à jour', async () => {
    let received: Record<string, unknown> | undefined
    server.use(
      http.patch('*/chat/conversations/c1', async ({ request }) => {
        received = (await request.json()) as Record<string, unknown>
        return HttpResponse.json(conversationDto({ title: 'Renommé' }))
      }),
    )

    const conversation = await renameConversation('c1', 'Renommé')

    expect(conversation.title).toBe('Renommé')
    expect(received).toEqual({ title: 'Renommé' })
  })

  it('supprime un fil via DELETE (204)', async () => {
    let called = false
    server.use(
      http.delete('*/chat/conversations/c1', () => {
        called = true
        return new HttpResponse(null, { status: 204 })
      }),
    )

    await expect(deleteConversation('c1')).resolves.toBeUndefined()
    expect(called).toBe(true)
  })

  it('envoie un message (202) sans corps de réponse', async () => {
    let received: Record<string, unknown> | undefined
    server.use(
      http.post('*/chat/conversations/c1/messages', async ({ request }) => {
        received = (await request.json()) as Record<string, unknown>
        return new HttpResponse(null, { status: 202 })
      }),
    )

    await expect(sendMessage('c1', 'Je veux un Postgres')).resolves.toBeUndefined()
    expect(received).toEqual({ content: 'Je veux un Postgres' })
  })

  it('laisse au LLM le temps de répondre : timeout généreux sur l’envoi (≠ défaut 10 s)', async () => {
    // Le back traite la passe LLM de façon synchrone avant son 202 (un tour avec
    // appel d'outil sur un LLM local CPU dépasse 60 s) : avec le timeout axios par
    // défaut (10 s), le POST échouait toujours → « Connexion interrompue », alors
    // que la réponse arrive bien ensuite par le flux SSE. L'envoi doit donc poser
    // un timeout largement supérieur.
    const postSpy = vi.spyOn(apiClient, 'post').mockResolvedValue({ data: undefined } as never)

    await sendMessage('c1', 'Déploie un Postgres')

    const config = postSpy.mock.calls[0]?.[2] as { timeout?: number } | undefined
    expect(config?.timeout).toBeGreaterThanOrEqual(120_000)
    postSpy.mockRestore()
  })

  it('confirme et rejette une action sur les bons endpoints (202)', async () => {
    const calls: string[] = []
    server.use(
      http.post('*/chat/actions/act-1/confirm', () => {
        calls.push('confirm')
        return new HttpResponse(null, { status: 202 })
      }),
      http.post('*/chat/actions/act-1/reject', () => {
        calls.push('reject')
        return new HttpResponse(null, { status: 202 })
      }),
    )

    await confirmAction('act-1')
    await rejectAction('act-1')

    expect(calls).toEqual(['confirm', 'reject'])
  })

  it('propage une erreur 409 sur une action invalide', async () => {
    server.use(
      http.post('*/chat/actions/act-1/confirm', () => new HttpResponse(null, { status: 409 })),
    )

    await expect(confirmAction('act-1')).rejects.toThrow()
  })
})
