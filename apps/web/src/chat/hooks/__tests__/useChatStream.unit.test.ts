import { act, renderHook, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import type { ScriptedStreamFrame } from '../../data/stream.fixtures'
import type { StreamFrameHandler } from '../../services/chatStreamSeam'
import { ActionStatus } from '../../types/enums/ActionStatus'
import { MessageRole } from '../../types/enums/MessageRole'
import { ChatStreamEventName } from '../../types/models/ChatStreamEvent'
import { useChatStream } from '../useChatStream'

/**
 * On mocke le seam SSE (`openChatStream`) : chaque ouverture capture le handler
 * de trames et le signal, pour piloter le flux depuis le test (émission de
 * `token`/`message`/`action_proposed`, abandon) sans timers réels.
 */
const { openChatStreamMock } = vi.hoisted(() => ({ openChatStreamMock: vi.fn() }))

vi.mock('../../services/chatStreamSeam', () => ({
  openChatStream: openChatStreamMock,
}))

interface OpenedStream {
  onFrame: StreamFrameHandler
  signal: AbortSignal
  resolve: () => void
}

let opened: OpenedStream[] = []

function lastStream(): OpenedStream {
  const stream = opened.at(-1)
  if (stream === undefined) {
    throw new Error('Aucun flux ouvert.')
  }
  return stream
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
        intent: 'Déployer un Postgres',
        template_id: 'pg16',
        version: '16',
        image: 'postgres:16-alpine',
        params: {},
        quotas: {},
      },
    }),
  }
}

describe('useChatStream (réducteur SSE alimenté par le seam)', () => {
  beforeEach(() => {
    opened = []
    openChatStreamMock.mockReset()
    openChatStreamMock.mockImplementation(
      (_id: string, _msg: string, onFrame: StreamFrameHandler, signal: AbortSignal) =>
        new Promise<void>((resolve) => {
          opened.push({ onFrame, signal, resolve })
        }),
    )
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('démarre au repos, sans message ni streaming', () => {
    const { result } = renderHook(() => useChatStream('c1'))

    expect(result.current.messages).toHaveLength(0)
    expect(result.current.streamingText).toBe('')
    expect(result.current.isStreaming).toBe(false)
    expect(openChatStreamMock).not.toHaveBeenCalled()
  })

  it('ajoute le message utilisateur et ouvre le flux à l’envoi', () => {
    const { result } = renderHook(() => useChatStream('c1'))

    act(() => {
      result.current.send('Je veux un Postgres')
    })

    expect(result.current.messages).toHaveLength(1)
    expect(result.current.messages[0]?.role).toBe(MessageRole.USER)
    expect(result.current.messages[0]?.content).toBe('Je veux un Postgres')
    expect(result.current.isStreaming).toBe(true)
    expect(openChatStreamMock).toHaveBeenCalledTimes(1)
  })

  it('accumule les tokens dans streamingText', async () => {
    const { result } = renderHook(() => useChatStream('c1'))
    act(() => result.current.send('go'))
    const stream = lastStream()

    act(() => {
      stream.onFrame(tokenFrame('Post'))
      stream.onFrame(tokenFrame('gres'))
    })

    await waitFor(() => {
      expect(result.current.streamingText).toBe('Postgres')
    })
  })

  it('fige le message final, vide le buffer et attache l’action proposée', async () => {
    const { result } = renderHook(() => useChatStream('c1'))
    act(() => result.current.send('go'))
    const stream = lastStream()

    act(() => {
      stream.onFrame(tokenFrame('…'))
      stream.onFrame(messageFrame('Voici ma proposition'))
      stream.onFrame(actionFrame())
    })

    await waitFor(() => {
      expect(result.current.streamingText).toBe('')
    })
    // message utilisateur + message assistant final
    expect(result.current.messages).toHaveLength(2)
    const assistant = result.current.messages[1]
    expect(assistant?.role).toBe(MessageRole.ASSISTANT)
    expect(assistant?.content).toBe('Voici ma proposition')
    expect(assistant?.action?.status).toBe(ActionStatus.PROPOSED)
  })

  it('expose une erreur honnête sur une trame error', async () => {
    const { result } = renderHook(() => useChatStream('c1'))
    act(() => result.current.send('go'))
    const stream = lastStream()

    act(() => {
      stream.onFrame({
        event: ChatStreamEventName.ERROR,
        data: JSON.stringify({ message: 'Quota dépassé' }),
      })
    })

    await waitFor(() => {
      expect(result.current.error).toBe('Quota dépassé')
    })
  })

  it('abandonne le flux au démontage (cleanup via AbortController)', () => {
    const { result, unmount } = renderHook(() => useChatStream('c1'))
    act(() => result.current.send('go'))
    const stream = lastStream()

    expect(stream.signal.aborted).toBe(false)
    unmount()
    expect(stream.signal.aborted).toBe(true)
  })

  it('réinitialise l’état et abandonne le flux au changement de fil', async () => {
    const { result, rerender } = renderHook(({ id }) => useChatStream(id), {
      initialProps: { id: 'c1' },
    })
    act(() => result.current.send('go'))
    const firstStream = lastStream()
    expect(result.current.messages).toHaveLength(1)

    rerender({ id: 'c2' })

    expect(firstStream.signal.aborted).toBe(true)
    await waitFor(() => {
      expect(result.current.messages).toHaveLength(0)
    })
    expect(result.current.streamingText).toBe('')
  })

  it('marque une action comme exécutée sur action_result', async () => {
    const { result } = renderHook(() => useChatStream('c1'))
    act(() => result.current.send('go'))
    const stream = lastStream()

    act(() => {
      stream.onFrame(messageFrame('Proposition'))
      stream.onFrame(actionFrame())
    })
    await waitFor(() => {
      expect(result.current.messages).toHaveLength(2)
    })

    act(() => {
      stream.onFrame({
        event: ChatStreamEventName.ACTION_RESULT,
        data: JSON.stringify({
          action_id: 'act-1',
          status: 'executed',
          deployment_id: 'dep-1',
          message: 'Lancé',
        }),
      })
    })

    await waitFor(() => {
      expect(result.current.messages[1]?.action?.status).toBe(ActionStatus.EXECUTED)
    })
    expect(result.current.lastDeploymentId).toBe('dep-1')
  })

  it('applyActionResult fige l’action exécutée (résultat scripté du seam)', async () => {
    const { result } = renderHook(() => useChatStream('c1'))
    act(() => result.current.send('go'))
    const stream = lastStream()

    act(() => {
      stream.onFrame(messageFrame('Proposition'))
      stream.onFrame(actionFrame())
    })
    await waitFor(() => {
      expect(result.current.messages).toHaveLength(2)
    })

    act(() => {
      result.current.applyActionResult('act-1')
    })

    await waitFor(() => {
      expect(result.current.messages[1]?.action?.status).toBe(ActionStatus.EXECUTED)
    })
    expect(result.current.lastDeploymentId).toBeTruthy()
  })

  it('rejectActionLocally fige l’action annulée', async () => {
    const { result } = renderHook(() => useChatStream('c1'))
    act(() => result.current.send('go'))
    const stream = lastStream()

    act(() => {
      stream.onFrame(messageFrame('Proposition'))
      stream.onFrame(actionFrame())
    })
    await waitFor(() => {
      expect(result.current.messages).toHaveLength(2)
    })

    act(() => {
      result.current.rejectActionLocally('act-1')
    })

    await waitFor(() => {
      expect(result.current.messages[1]?.action?.status).toBe(ActionStatus.REJECTED)
    })
  })
})
