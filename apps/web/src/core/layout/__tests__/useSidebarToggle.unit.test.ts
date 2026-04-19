import { act, renderHook } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { useSidebarToggle } from '../useSidebarToggle'

describe('useSidebarToggle', () => {
  it('est ferme par defaut', () => {
    const { result } = renderHook(() => useSidebarToggle())

    expect(result.current.isOpen).toBe(false)
  })

  it('respecte la valeur initiale fournie', () => {
    const { result } = renderHook(() => useSidebarToggle(true))

    expect(result.current.isOpen).toBe(true)
  })

  it('bascule l"etat via toggle', () => {
    const { result } = renderHook(() => useSidebarToggle())

    act(() => {
      result.current.toggle()
    })
    expect(result.current.isOpen).toBe(true)

    act(() => {
      result.current.toggle()
    })
    expect(result.current.isOpen).toBe(false)
  })

  it('open() met a true meme si deja ouvert', () => {
    const { result } = renderHook(() => useSidebarToggle(true))

    act(() => {
      result.current.open()
    })
    expect(result.current.isOpen).toBe(true)
  })

  it('close() met a false', () => {
    const { result } = renderHook(() => useSidebarToggle(true))

    act(() => {
      result.current.close()
    })
    expect(result.current.isOpen).toBe(false)
  })
})
