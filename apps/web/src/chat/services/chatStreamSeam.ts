import { buildScriptedAnswerFrames, type ScriptedStreamFrame } from '../data/stream.fixtures'

/**
 * SEAM du flux SSE de chat. En display-only, rejoue des trames scriptées
 * (`token`/`message`/`action_proposed`) au rythme d'un vrai streaming, en
 * honorant l'`AbortSignal` (cleanup au démontage / changement de fil).
 *
 * Contrat réel visé : `GET /chat/conversations/{id}/stream` ouvert via
 * `@microsoft/fetch-event-source` (header `Authorization: Bearer <access>`,
 * refresh sur 401), exactement comme `useDeploymentEvents`. Au branchement, on
 * remplace le corps de `openChatStream` par cet appel ; la signature (callback
 * par trame `{event, data}` + signal d'abandon) reste identique côté hook.
 */

/** Délai (ms) entre deux trames scriptées : simule la cadence du streaming. */
const FRAME_INTERVAL_MS = 120

/** Callback invoqué pour chaque trame SSE (nom d'événement + data JSON brut). */
export type StreamFrameHandler = (frame: ScriptedStreamFrame) => void

/**
 * Ouvre le flux de réponse de l'assistant pour `userMessage` dans `conversationId`.
 * Émet les trames scriptées une à une via `onFrame`, jusqu'à épuisement ou
 * abandon. Renvoie une promesse résolue à la fin du flux (ou à l'abandon).
 */
export function openChatStream(
  conversationId: string,
  userMessage: string,
  onFrame: StreamFrameHandler,
  signal: AbortSignal,
): Promise<void> {
  void conversationId
  void userMessage

  const frames = buildScriptedAnswerFrames()

  return new Promise<void>((resolve) => {
    if (signal.aborted) {
      resolve()
      return
    }

    let index = 0
    let timer: ReturnType<typeof setTimeout> | undefined

    const stop = (): void => {
      if (timer !== undefined) {
        clearTimeout(timer)
      }
      signal.removeEventListener('abort', stop)
      resolve()
    }

    const pump = (): void => {
      if (signal.aborted || index >= frames.length) {
        stop()
        return
      }
      onFrame(frames[index])
      index += 1
      timer = setTimeout(pump, FRAME_INTERVAL_MS)
    }

    signal.addEventListener('abort', stop)
    timer = setTimeout(pump, FRAME_INTERVAL_MS)
  })
}
