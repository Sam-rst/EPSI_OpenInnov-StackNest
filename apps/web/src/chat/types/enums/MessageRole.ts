/**
 * Rôle d'un message dans un fil de discussion — miroir du contrat back
 * (`chat_message.role`). `tool` couvre les messages issus d'une action exécutée
 * (récap d'un déploiement lancé), distincts des tours `user` / `assistant`.
 */
export const MessageRole = {
  USER: 'user',
  ASSISTANT: 'assistant',
  TOOL: 'tool',
} as const

export type MessageRole = (typeof MessageRole)[keyof typeof MessageRole]
