import { renderHook } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { useMonthlyCost } from '../useMonthlyCost'

describe('useMonthlyCost', () => {
  it('renvoie le coût de démo du mois (487 €)', () => {
    const { result } = renderHook(() => useMonthlyCost())

    expect(result.current.amount).toBe(487)
  })

  it('expose la variation et la part de budget consommée', () => {
    const { result } = renderHook(() => useMonthlyCost())

    expect(result.current.changePercent).toBe(8)
    expect(result.current.budgetPercent).toBe(64)
  })
})
