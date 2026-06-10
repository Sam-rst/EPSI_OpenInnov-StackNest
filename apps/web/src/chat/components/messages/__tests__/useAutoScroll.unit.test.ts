import { act, renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { useAutoScroll } from '../useAutoScroll'

/**
 * Crée un faux conteneur scrollable : jsdom ne calcule pas le layout, donc on
 * pilote `scrollTop`/`scrollHeight`/`clientHeight` à la main et on espionne
 * l'écriture de `scrollTop` (le hook « scrolle en bas » en y assignant scrollHeight).
 */
function fakeScrollNode(opts: { scrollHeight: number; clientHeight: number; scrollTop: number }) {
  let scrollTop = opts.scrollTop
  const node = {
    get scrollTop() {
      return scrollTop
    },
    set scrollTop(value: number) {
      scrollTop = value
    },
    scrollHeight: opts.scrollHeight,
    clientHeight: opts.clientHeight,
  }
  return node as unknown as HTMLDivElement
}

describe('useAutoScroll', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('scrolle en bas quand la dépendance change et que l’on est en bas', () => {
    const node = fakeScrollNode({ scrollHeight: 1000, clientHeight: 400, scrollTop: 600 })
    const { result, rerender } = renderHook(({ dep }) => useAutoScroll([dep]), {
      initialProps: { dep: 0 },
    })

    act(() => {
      result.current.scrollRef.current = node
    })
    rerender({ dep: 1 })

    // En bas (600 + 400 = 1000) → le hook colle au nouveau bas.
    expect(node.scrollTop).toBe(node.scrollHeight)
    expect(result.current.showScrollButton).toBe(false)
  })

  it('ne force pas le scroll si l’utilisateur a remonté', () => {
    const node = fakeScrollNode({ scrollHeight: 1000, clientHeight: 400, scrollTop: 100 })
    const { result, rerender } = renderHook(({ dep }) => useAutoScroll([dep]), {
      initialProps: { dep: 0 },
    })

    act(() => {
      result.current.scrollRef.current = node
    })
    // L'utilisateur a remonté : on enregistre la position via l'évènement scroll.
    act(() => {
      result.current.onScroll()
    })
    rerender({ dep: 1 })

    expect(node.scrollTop).toBe(100)
  })

  it('affiche le bouton « descendre » quand l’utilisateur a remonté', () => {
    const node = fakeScrollNode({ scrollHeight: 1000, clientHeight: 400, scrollTop: 100 })
    const { result } = renderHook(() => useAutoScroll([0]))

    act(() => {
      result.current.scrollRef.current = node
    })
    act(() => {
      result.current.onScroll()
    })

    expect(result.current.showScrollButton).toBe(true)
  })

  it('scrollToBottom recolle au bas et masque le bouton', () => {
    const node = fakeScrollNode({ scrollHeight: 1000, clientHeight: 400, scrollTop: 100 })
    const { result } = renderHook(() => useAutoScroll([0]))

    act(() => {
      result.current.scrollRef.current = node
    })
    act(() => {
      result.current.onScroll()
    })
    act(() => {
      result.current.scrollToBottom()
    })

    expect(node.scrollTop).toBe(node.scrollHeight)
    expect(result.current.showScrollButton).toBe(false)
  })
})
