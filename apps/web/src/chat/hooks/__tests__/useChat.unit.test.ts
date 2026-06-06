import { act, renderHook, waitFor } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { useChat } from '../useChat'

describe('useChat (display-only, seam ChatOps)', () => {
  it('démarre en chargement puis expose des listes vides (aucune donnée fabriquée)', async () => {
    const { result } = renderHook(() => useChat())

    expect(result.current.loading).toBe(true)

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.conversations).toEqual([])
    expect(result.current.messages).toEqual([])
    expect(result.current.activeConversationId).toBeNull()
  })

  it('send ne fabrique aucun message ni réponse d’IA (seam vide)', async () => {
    const { result } = renderHook(() => useChat())

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    await act(async () => {
      await result.current.send('Je veux un environnement de dev')
    })

    expect(result.current.messages).toEqual([])
  })
})
