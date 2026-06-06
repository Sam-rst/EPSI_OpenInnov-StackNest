import { describe, expect, it } from 'vitest'

import { listConversations, listMessages, sendMessage } from '../chatService'

describe('chatService (seam ChatOps, contract-first)', () => {
  it('listConversations résout une liste vide (aucune conversation fabriquée)', async () => {
    const conversations = await listConversations()

    expect(conversations).toEqual([])
  })

  it('listMessages résout une liste vide quel que soit l’identifiant', async () => {
    const messages = await listMessages('peu-importe')

    expect(messages).toEqual([])
  })

  it('sendMessage ne déclenche aucun appel LLM et ne fabrique aucune réponse', async () => {
    const result = await sendMessage('conv-1', 'Je veux un environnement de dev')

    expect(result).toEqual([])
  })
})
