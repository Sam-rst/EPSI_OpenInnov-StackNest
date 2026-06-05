import { renderHook } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { useMonthlyCost } from '../useMonthlyCost'

describe('useMonthlyCost', () => {
  it('renvoie un coût honnête à zéro (aucun montant inventé)', () => {
    const { result } = renderHook(() => useMonthlyCost())

    expect(result.current.amount).toBe(0)
  })

  it('expose une variation et une part de budget à zéro tant qu’il n’y a pas de données', () => {
    const { result } = renderHook(() => useMonthlyCost())

    expect(result.current.changePercent).toBe(0)
    expect(result.current.budgetPercent).toBe(0)
  })
})
