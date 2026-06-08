import { describe, expect, it } from 'vitest'

import { MessageRole } from '../../types/enums/MessageRole'
import {
  confirmAction,
  createConversation,
  deleteConversation,
  getConversationMessages,
  listConversations,
  renameConversation,
  sendMessage,
} from '../chatService'

describe('chatService (seam display-only)', () => {
  it('liste des fils d’exemple mappés en modèles', async () => {
    const conversations = await listConversations()

    expect(conversations.length).toBeGreaterThan(0)
    expect(conversations[0]?.title).toContain('Exemple')
    expect(conversations[0]?.relativeWhen).toBeTruthy()
  })

  it('renvoie les messages d’amorce d’un fil', async () => {
    const messages = await getConversationMessages('c1')

    expect(messages.length).toBeGreaterThan(0)
    expect(messages[0]?.role).toBe(MessageRole.ASSISTANT)
  })

  it('renvoie une liste vide pour un fil sans amorce', async () => {
    const messages = await getConversationMessages('c2')

    expect(messages).toEqual([])
  })

  it('crée un fil et renvoie un modèle avec identifiant', async () => {
    const conversation = await createConversation('Nouveau besoin')

    expect(conversation.id).toBeTruthy()
    expect(conversation.title).toBe('Nouveau besoin')
  })

  it('renomme un fil (renvoie le titre mis à jour)', async () => {
    const conversation = await renameConversation('c1', 'Titre renommé')

    expect(conversation.id).toBe('c1')
    expect(conversation.title).toBe('Titre renommé')
  })

  it('supprime un fil sans erreur', async () => {
    await expect(deleteConversation('c1')).resolves.toBeUndefined()
  })

  it('envoie un message utilisateur et le renvoie mappé', async () => {
    const message = await sendMessage('c1', 'Je veux un Postgres isolé')

    expect(message.role).toBe(MessageRole.USER)
    expect(message.content).toBe('Je veux un Postgres isolé')
  })

  it('confirme une action sans erreur', async () => {
    await expect(confirmAction('act-1')).resolves.toBeUndefined()
  })
})
