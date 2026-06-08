import type { ActionProposalDTO } from '../types/dto/ActionProposalDTO'
import type { MessageDTO } from '../types/dto/MessageDTO'
import { ChatStreamEventName } from '../types/models/ChatStreamEvent'

/**
 * Trame SSE scriptée (display-only) : couple `event` (nom) + `data` (JSON brut),
 * fidèle à ce que le flux réel `GET /chat/conversations/{id}/stream` émettra.
 */
export interface ScriptedStreamFrame {
  event: string
  data: string
}

/**
 * Réponse d'exemple de l'assistant à un message utilisateur : quelques `token`
 * (la bulle se remplit), un `message` finalisé, puis une `action_proposed`
 * (carte de confirmation). Aucun credential réaliste n'est exposé : la
 * proposition décrit un déploiement à confirmer, pas un secret.
 */
const PROPOSED_ACTION: ActionProposalDTO = {
  id: 'act-exemple-1',
  kind: 'deploy',
  status: 'proposed',
  intent: 'Déployer un PostgreSQL 16 isolé, accès restreint, sur l’environnement dev',
  template_id: 'pg16',
  version: '16',
  image: 'postgres:16-alpine',
  params: {
    'Nom du conteneur': 'pg-sandbox-exemple',
    'Base de données': 'app',
    Réseau: 'sandbox-exemple (isolé)',
  },
  quotas: {
    CPU: '1 vCPU',
    Mémoire: '2 Go',
    Disque: '20 Go SSD',
  },
}

const FINAL_MESSAGE: MessageDTO = {
  id: 'm-exemple-assistant',
  role: 'assistant',
  content:
    'Voici ce que je propose pour ton besoin. Vérifie le récap ci-dessous, puis ' +
    'confirme, modifie les paramètres, ou annule.',
  created_at: new Date().toISOString(),
  action: PROPOSED_ACTION,
}

const TEXT_TOKENS = ['Compris. ', 'Je prépare ', 'une proposition ', 'de déploiement…']

/** Construit la séquence d'événements scriptés pour une réponse assistant. */
export function buildScriptedAnswerFrames(): readonly ScriptedStreamFrame[] {
  const tokenFrames: ScriptedStreamFrame[] = TEXT_TOKENS.map((delta) => ({
    event: ChatStreamEventName.TOKEN,
    data: JSON.stringify({ delta }),
  }))

  return [
    ...tokenFrames,
    { event: ChatStreamEventName.MESSAGE, data: JSON.stringify({ message: FINAL_MESSAGE }) },
    {
      event: ChatStreamEventName.ACTION_PROPOSED,
      data: JSON.stringify({ action: PROPOSED_ACTION }),
    },
  ]
}

/**
 * Trame `action_result` scriptée renvoyée après confirmation d'une action
 * (display-only) : l'action est marquée « exécutée » et pointe un déploiement
 * d'exemple, à afficher dans l'aside des déploiements actifs.
 */
export function buildActionResultFrame(actionId: string): ScriptedStreamFrame {
  return {
    event: ChatStreamEventName.ACTION_RESULT,
    data: JSON.stringify({
      action_id: actionId,
      status: 'executed',
      deployment_id: 'dep-exemple-1',
      message: 'Déploiement d’exemple lancé (démo — aucune ressource réelle créée).',
    }),
  }
}
