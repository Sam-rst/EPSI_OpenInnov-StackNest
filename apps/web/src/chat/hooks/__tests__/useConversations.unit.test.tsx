import { act, renderHook, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { createQueryWrapper } from '../../../../tests/utils/queryWrapper'
import type { Conversation } from '../../types/models/Conversation'
import { useConversations } from '../useConversations'

const {
  listConversationsMock,
  createConversationMock,
  renameConversationMock,
  deleteConversationMock,
} = vi.hoisted(() => ({
  listConversationsMock: vi.fn(),
  createConversationMock: vi.fn(),
  renameConversationMock: vi.fn(),
  deleteConversationMock: vi.fn(),
}))

vi.mock('../../services/chatService', () => ({
  listConversations: listConversationsMock,
  createConversation: createConversationMock,
  renameConversation: renameConversationMock,
  deleteConversation: deleteConversationMock,
}))

function conversation(overrides: Partial<Conversation> = {}): Conversation {
  return {
    id: 'c1',
    title: 'Fil',
    createdAt: '2026-06-08T10:00:00Z',
    updatedAt: '2026-06-08T11:00:00Z',
    relativeWhen: 'il y a 1 h',
    ...overrides,
  }
}

describe('useConversations', () => {
  afterEach(() => {
    vi.clearAllMocks()
  })

  it('charge et expose les fils mappés', async () => {
    listConversationsMock.mockResolvedValue([conversation()])

    const { result } = renderHook(() => useConversations(), { wrapper: createQueryWrapper() })

    await waitFor(() => {
      expect(result.current.conversations).toHaveLength(1)
    })
    expect(result.current.conversations[0]?.title).toBe('Fil')
  })

  it('crée un fil puis réinvalide la liste', async () => {
    listConversationsMock.mockResolvedValue([])
    createConversationMock.mockResolvedValue(conversation({ id: 'c-new', title: 'Nouveau' }))

    const { result } = renderHook(() => useConversations(), { wrapper: createQueryWrapper() })
    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    await act(async () => {
      await result.current.create('Nouveau')
    })

    expect(createConversationMock).toHaveBeenCalledWith('Nouveau')
    // Liste rechargée après l'invalidation (2 appels : initial + invalidation).
    await waitFor(() => {
      expect(listConversationsMock.mock.calls.length).toBeGreaterThanOrEqual(2)
    })
  })

  it('renomme et supprime via les bons appels de service', async () => {
    listConversationsMock.mockResolvedValue([conversation()])
    renameConversationMock.mockResolvedValue(conversation({ title: 'Renommé' }))
    deleteConversationMock.mockResolvedValue(undefined)

    const { result } = renderHook(() => useConversations(), { wrapper: createQueryWrapper() })
    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    await act(async () => {
      await result.current.rename('c1', 'Renommé')
      await result.current.remove('c1')
    })

    expect(renameConversationMock).toHaveBeenCalledWith('c1', 'Renommé')
    expect(deleteConversationMock).toHaveBeenCalledWith('c1')
  })
})
