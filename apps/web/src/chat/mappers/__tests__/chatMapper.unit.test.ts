import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { ActionKind } from '../../types/enums/ActionKind'
import { ActionStatus } from '../../types/enums/ActionStatus'
import { MessageRole } from '../../types/enums/MessageRole'
import type { ActionProposalDTO } from '../../types/dto/ActionProposalDTO'
import type { ConversationDTO } from '../../types/dto/ConversationDTO'
import type { MessageDTO } from '../../types/dto/MessageDTO'
import {
  mapActionProposalDto,
  mapConversationDto,
  mapMessageDto,
  mapStreamEvent,
} from '../chatMapper'

function conversationDto(overrides: Partial<ConversationDTO> = {}): ConversationDTO {
  return {
    id: 'c1',
    title: 'Env de dev Node + Postgres',
    created_at: '2026-06-08T10:00:00Z',
    updated_at: '2026-06-08T11:30:00Z',
    ...overrides,
  }
}

function proposalDto(overrides: Partial<ActionProposalDTO> = {}): ActionProposalDTO {
  return {
    id: 'a1',
    kind: 'deploy',
    status: 'proposed',
    intent: 'Déployer un PostgreSQL 16 isolé pour Yassine',
    template_id: 'pg16',
    version: '16',
    image: 'postgres:16-alpine',
    params: { db_name: 'app' },
    quotas: { CPU: '1 vCPU' },
    ...overrides,
  }
}

describe('chatMapper', () => {
  beforeEach(() => {
    // Horloge figée : libellés relatifs déterministes.
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-06-08T12:00:00Z'))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('mapConversationDto', () => {
    it('mappe identité + titre et calcule un libellé relatif', () => {
      const conversation = mapConversationDto(conversationDto())

      expect(conversation.id).toBe('c1')
      expect(conversation.title).toBe('Env de dev Node + Postgres')
      expect(conversation.relativeWhen).toBe('il y a 30 min')
    })

    it('affiche « à l’instant » pour un fil tout juste mis à jour', () => {
      const conversation = mapConversationDto(
        conversationDto({ updated_at: '2026-06-08T11:59:30Z' }),
      )

      expect(conversation.relativeWhen).toBe("à l'instant")
    })

    it('retombe sur la date de création quand le fil est vide', () => {
      const conversation = mapConversationDto(
        conversationDto({ created_at: '2026-06-08T11:00:00Z', updated_at: null }),
      )

      expect(conversation.relativeWhen).toBe('il y a 1 h')
    })
  })

  describe('mapActionProposalDto', () => {
    it('normalise kind/status et aplatit params + quotas en listes', () => {
      const proposal = mapActionProposalDto(proposalDto())

      expect(proposal.kind).toBe(ActionKind.DEPLOY)
      expect(proposal.status).toBe(ActionStatus.PROPOSED)
      expect(proposal.templateId).toBe('pg16')
      expect(proposal.params).toEqual([{ label: 'db_name', value: 'app' }])
      expect(proposal.quotas).toEqual([{ label: 'CPU', value: '1 vCPU' }])
    })

    it('retombe sur des valeurs sûres pour des enums inconnus', () => {
      const proposal = mapActionProposalDto(proposalDto({ kind: 'mystère', status: 'bizarre' }))

      expect(proposal.kind).toBe(ActionKind.DEPLOY)
      expect(proposal.status).toBe(ActionStatus.PROPOSED)
    })
  })

  describe('mapMessageDto', () => {
    it('mappe un message utilisateur sans action', () => {
      const dto: MessageDTO = {
        id: 'm1',
        role: 'user',
        content: 'Je veux un Postgres isolé',
        created_at: '2026-06-08T11:58:00Z',
        action: null,
      }

      const message = mapMessageDto(dto)

      expect(message.role).toBe(MessageRole.USER)
      expect(message.content).toBe('Je veux un Postgres isolé')
      expect(message.action).toBeUndefined()
    })

    it('mappe un message assistant porteur d’une action', () => {
      const dto: MessageDTO = {
        id: 'm2',
        role: 'assistant',
        content: 'Voici ce que je propose :',
        created_at: '2026-06-08T11:59:00Z',
        action: proposalDto(),
      }

      const message = mapMessageDto(dto)

      expect(message.role).toBe(MessageRole.ASSISTANT)
      expect(message.action?.kind).toBe(ActionKind.DEPLOY)
    })
  })

  describe('mapStreamEvent', () => {
    it('mappe un token', () => {
      const event = mapStreamEvent('token', JSON.stringify({ delta: 'Post' }))
      expect(event).toEqual({ type: 'token', delta: 'Post' })
    })

    it('mappe un message finalisé', () => {
      const messageDto: MessageDTO = {
        id: 'm3',
        role: 'assistant',
        content: 'Terminé.',
        created_at: '2026-06-08T12:00:00Z',
        action: null,
      }
      const event = mapStreamEvent('message', JSON.stringify({ message: messageDto }))

      expect(event).toEqual({
        type: 'message',
        message: expect.objectContaining({ id: 'm3', role: MessageRole.ASSISTANT }),
      })
    })

    it('mappe une proposition d’action', () => {
      const event = mapStreamEvent('action_proposed', JSON.stringify({ action: proposalDto() }))

      expect(event.type).toBe('action_proposed')
      if (event.type === 'action_proposed') {
        expect(event.action.kind).toBe(ActionKind.DEPLOY)
      }
    })

    it('mappe un résultat d’action et normalise le statut', () => {
      const event = mapStreamEvent(
        'action_result',
        JSON.stringify({
          action_id: 'a1',
          status: 'executed',
          deployment_id: 'dep-1',
          message: 'Ressource prête',
        }),
      )

      expect(event).toEqual({
        type: 'action_result',
        actionId: 'a1',
        status: ActionStatus.EXECUTED,
        deploymentId: 'dep-1',
        message: 'Ressource prête',
      })
    })

    it('mappe une erreur', () => {
      const event = mapStreamEvent('error', JSON.stringify({ message: 'Quota dépassé' }))
      expect(event).toEqual({ type: 'error', message: 'Quota dépassé' })
    })

    it('lève sur un événement inconnu', () => {
      expect(() => mapStreamEvent('inconnu', '{}')).toThrow()
    })
  })
})
