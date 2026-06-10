import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import type { ActionProposedEventDTO } from '../../types/dto/ChatStreamEventDTO'
import type { ConversationDTO } from '../../types/dto/ConversationDTO'
import type { MessageDTO } from '../../types/dto/MessageDTO'
import { ActionKind } from '../../types/enums/ActionKind'
import { ActionStatus } from '../../types/enums/ActionStatus'
import { MessageRole } from '../../types/enums/MessageRole'
import { mapConversationDto, mapMessageDto, mapStreamEvent } from '../chatMapper'

function conversationDto(overrides: Partial<ConversationDTO> = {}): ConversationDTO {
  return {
    id: 'c1',
    title: 'Env de dev Node + Postgres',
    created_at: '2026-06-08T10:00:00Z',
    updated_at: '2026-06-08T11:30:00Z',
    ...overrides,
  }
}

function deployProposalDto(
  overrides: Partial<ActionProposedEventDTO> = {},
): ActionProposedEventDTO {
  return {
    action_id: 'a1',
    kind: 'deploy',
    restatement: 'Deployer PostgreSQL (version 16) sous le nom « db ».',
    recap: { template: 'PostgreSQL', version: '16', name: 'db', params: { db_name: 'app' } },
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

    it('retombe sur la date de création quand le fil est vide', () => {
      const conversation = mapConversationDto(
        conversationDto({ created_at: '2026-06-08T11:00:00Z', updated_at: null }),
      )

      expect(conversation.relativeWhen).toBe('il y a 1 h')
    })

    it('reste robuste quand les deux horodatages sont null', () => {
      const conversation = mapConversationDto(
        conversationDto({ created_at: null, updated_at: null }),
      )

      expect(conversation.createdAt).toBeNull()
      expect(conversation.relativeWhen).toBeTruthy()
    })
  })

  describe('mapMessageDto', () => {
    it('mappe un message utilisateur (jamais d’action en REST)', () => {
      const dto: MessageDTO = {
        id: 'm1',
        role: 'user',
        content: 'Je veux un Postgres isolé',
        created_at: '2026-06-08T11:58:00Z',
      }

      const message = mapMessageDto(dto)

      expect(message.role).toBe(MessageRole.USER)
      expect(message.content).toBe('Je veux un Postgres isolé')
      expect(message.action).toBeUndefined()
    })

    it('mappe un rôle inconnu vers assistant (repli sûr)', () => {
      const message = mapMessageDto({ id: 'm2', role: 'mystère', content: 'x', created_at: null })

      expect(message.role).toBe(MessageRole.ASSISTANT)
      expect(message.createdAt).toBeTruthy()
    })
  })

  describe('mapStreamEvent', () => {
    it('mappe un token', () => {
      const event = mapStreamEvent('token', JSON.stringify({ delta: 'Post' }))
      expect(event).toEqual({ type: 'token', delta: 'Post' })
    })

    it('mappe un message finalisé (texte seul) en modèle assistant', () => {
      const event = mapStreamEvent('message', JSON.stringify({ content: 'Terminé.' }))

      expect(event.type).toBe('message')
      if (event.type === 'message') {
        expect(event.message.role).toBe(MessageRole.ASSISTANT)
        expect(event.message.content).toBe('Terminé.')
        expect(event.message.id).toBeTruthy()
      }
    })

    it('mappe une proposition de déploiement (restatement + recap aplati)', () => {
      const event = mapStreamEvent('action_proposed', JSON.stringify(deployProposalDto()))

      expect(event.type).toBe('action_proposed')
      if (event.type === 'action_proposed') {
        const action = event.action
        expect(action.id).toBe('a1')
        expect(action.kind).toBe(ActionKind.DEPLOY)
        expect(action.status).toBe(ActionStatus.PROPOSED)
        expect(action.intent).toBe('Deployer PostgreSQL (version 16) sous le nom « db ».')
        expect(action.version).toBe('16')
        // Le récap est aplati en lignes affichables (params imbriqués déroulés).
        expect(action.params).toEqual([
          { label: 'template', value: 'PostgreSQL' },
          { label: 'version', value: '16' },
          { label: 'name', value: 'db' },
          { label: 'db_name', value: 'app' },
        ])
        expect(action.quotas).toEqual([])
      }
    })

    it('mappe une proposition de cycle de vie (recap deployment + status)', () => {
      const event = mapStreamEvent(
        'action_proposed',
        JSON.stringify(
          deployProposalDto({
            kind: 'stop',
            restatement: 'Arreter le deploiement « ma-base ».',
            recap: { deployment: 'ma-base', status: 'running' },
          }),
        ),
      )

      expect(event.type).toBe('action_proposed')
      if (event.type === 'action_proposed') {
        expect(event.action.kind).toBe(ActionKind.STOP)
        expect(event.action.version).toBeNull()
        expect(event.action.params).toEqual([
          { label: 'deployment', value: 'ma-base' },
          { label: 'status', value: 'running' },
        ])
      }
    })

    it('mappe un résultat d’action réussi vers le statut exécuté', () => {
      const event = mapStreamEvent(
        'action_result',
        JSON.stringify({ action_id: 'a1', kind: 'deploy', success: true, deployment_id: 'dep-1' }),
      )

      expect(event).toEqual({
        type: 'action_result',
        actionId: 'a1',
        status: ActionStatus.EXECUTED,
        deploymentId: 'dep-1',
        message: null,
      })
    })

    it('mappe un résultat d’action échoué vers le statut échec', () => {
      const event = mapStreamEvent(
        'action_result',
        JSON.stringify({ action_id: 'a2', kind: 'stop', success: false }),
      )

      expect(event.type).toBe('action_result')
      if (event.type === 'action_result') {
        expect(event.status).toBe(ActionStatus.FAILED)
        expect(event.deploymentId).toBeNull()
      }
    })

    it('mappe une erreur', () => {
      const event = mapStreamEvent('error', JSON.stringify({ message: 'Quota dépassé' }))
      expect(event).toEqual({ type: 'error', message: 'Quota dépassé' })
    })

    it('ignore une trame keepalive vide (heartbeat SSE) sans lever', () => {
      // @microsoft/fetch-event-source dispatche un message au nom/données vides
      // sur la ligne blanche qui termine le commentaire « : keepalive ». Sans ce
      // no-op explicite, chaque heartbeat (~15 s) ferait planter le flux SSE
      // (« Connexion interrompue ») dès que le LLM reste muet plus de 15 s.
      expect(() => mapStreamEvent('', '')).not.toThrow()
      expect(mapStreamEvent('', '')).toEqual({ type: 'keepalive' })
    })

    it('lève sur un événement nommé inconnu', () => {
      expect(() => mapStreamEvent('inconnu', '{}')).toThrow()
    })
  })
})
