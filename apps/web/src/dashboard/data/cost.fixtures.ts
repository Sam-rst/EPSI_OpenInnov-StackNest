import type { MonthlyCost } from '../domain/models/MonthlyCost'

/** Coût mensuel de démo servi tant que l'API dashboard n'est pas branchée (Vague 2). */
export const MONTHLY_COST_FIXTURE: MonthlyCost = {
  amount: 487,
  changePercent: 8,
  budgetPercent: 64,
}
