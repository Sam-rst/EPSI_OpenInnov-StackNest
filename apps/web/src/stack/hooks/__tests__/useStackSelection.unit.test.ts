import { act, renderHook } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { useStackSelection } from '../useStackSelection'

const IDS = ['a', 'b', 'c'] as const

describe('useStackSelection', () => {
  it('démarre sans sélection', () => {
    const { result } = renderHook(() => useStackSelection(IDS))

    expect(result.current.selectedIds).toEqual([])
    expect(result.current.selectedCount).toBe(0)
    expect(result.current.allSelected).toBe(false)
  })

  it('bascule la sélection d’un identifiant', () => {
    const { result } = renderHook(() => useStackSelection(IDS))

    act(() => result.current.toggle('a'))
    expect(result.current.isSelected('a')).toBe(true)
    expect(result.current.selectedCount).toBe(1)

    act(() => result.current.toggle('a'))
    expect(result.current.isSelected('a')).toBe(false)
    expect(result.current.selectedCount).toBe(0)
  })

  it('sélectionne et désélectionne tout', () => {
    const { result } = renderHook(() => useStackSelection(IDS))

    act(() => result.current.toggleAll())
    expect(result.current.allSelected).toBe(true)
    expect(result.current.selectedIds).toEqual(['a', 'b', 'c'])

    act(() => result.current.toggleAll())
    expect(result.current.allSelected).toBe(false)
    expect(result.current.selectedIds).toEqual([])
  })

  it('vide la sélection', () => {
    const { result } = renderHook(() => useStackSelection(IDS))

    act(() => result.current.toggle('b'))
    act(() => result.current.clear())

    expect(result.current.selectedCount).toBe(0)
  })

  it('élague les identifiants disparus de la liste (stacks supprimées)', () => {
    const { result, rerender } = renderHook(({ ids }) => useStackSelection(ids), {
      initialProps: { ids: IDS as readonly string[] },
    })

    act(() => result.current.toggleAll())
    expect(result.current.selectedCount).toBe(3)

    rerender({ ids: ['a'] })

    expect(result.current.selectedIds).toEqual(['a'])
    expect(result.current.allSelected).toBe(true)
  })

  it('allSelected reste faux quand la liste est vide', () => {
    const { result } = renderHook(() => useStackSelection([]))

    expect(result.current.allSelected).toBe(false)
  })
})
