import { act, renderHook } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { useDeploymentSelection } from '../useDeploymentSelection'

const IDS = ['dep-1', 'dep-2', 'dep-3'] as const

describe('useDeploymentSelection', () => {
  it('démarre sans aucune sélection', () => {
    const { result } = renderHook(() => useDeploymentSelection(IDS))

    expect(result.current.selectedIds).toEqual([])
    expect(result.current.count).toBe(0)
    expect(result.current.allSelected).toBe(false)
    expect(result.current.someSelected).toBe(false)
    expect(result.current.isSelected('dep-1')).toBe(false)
  })

  it('toggle ajoute puis retire un id', () => {
    const { result } = renderHook(() => useDeploymentSelection(IDS))

    act(() => result.current.toggle('dep-1'))
    expect(result.current.isSelected('dep-1')).toBe(true)
    expect(result.current.count).toBe(1)
    expect(result.current.someSelected).toBe(true)
    expect(result.current.allSelected).toBe(false)

    act(() => result.current.toggle('dep-1'))
    expect(result.current.isSelected('dep-1')).toBe(false)
    expect(result.current.count).toBe(0)
  })

  it('selectAll coche tous les ids visibles', () => {
    const { result } = renderHook(() => useDeploymentSelection(IDS))

    act(() => result.current.selectAll())

    expect(result.current.count).toBe(3)
    expect(result.current.allSelected).toBe(true)
    expect(result.current.someSelected).toBe(false)
    expect(result.current.selectedIds).toEqual(expect.arrayContaining([...IDS]))
  })

  it('clear vide la sélection', () => {
    const { result } = renderHook(() => useDeploymentSelection(IDS))

    act(() => result.current.selectAll())
    act(() => result.current.clear())

    expect(result.current.count).toBe(0)
    expect(result.current.allSelected).toBe(false)
  })

  it('toggleAll bascule entre tout coché et tout décoché', () => {
    const { result } = renderHook(() => useDeploymentSelection(IDS))

    act(() => result.current.toggleAll())
    expect(result.current.allSelected).toBe(true)

    act(() => result.current.toggleAll())
    expect(result.current.count).toBe(0)
  })

  it('someSelected (état indéterminé) vrai quand sélection partielle', () => {
    const { result } = renderHook(() => useDeploymentSelection(IDS))

    act(() => result.current.toggle('dep-1'))
    act(() => result.current.toggle('dep-2'))

    expect(result.current.someSelected).toBe(true)
    expect(result.current.allSelected).toBe(false)
  })

  it('purge les ids disparus quand la liste visible change (déploiement détruit/filtré)', () => {
    const { result, rerender } = renderHook(({ ids }) => useDeploymentSelection(ids), {
      initialProps: { ids: IDS as readonly string[] },
    })

    act(() => result.current.selectAll())
    expect(result.current.count).toBe(3)

    rerender({ ids: ['dep-1', 'dep-2'] })

    expect(result.current.selectedIds).toEqual(expect.arrayContaining(['dep-1', 'dep-2']))
    expect(result.current.isSelected('dep-3')).toBe(false)
    expect(result.current.count).toBe(2)
    expect(result.current.allSelected).toBe(true)
  })

  it('allSelected est faux quand la liste visible est vide', () => {
    const { result } = renderHook(() => useDeploymentSelection([]))

    expect(result.current.allSelected).toBe(false)
    expect(result.current.someSelected).toBe(false)
  })
})
