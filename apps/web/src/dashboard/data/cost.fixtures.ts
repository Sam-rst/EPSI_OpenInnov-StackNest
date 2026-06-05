import type { MonthlyCost } from '../domain/models/MonthlyCost'

/**
 * Coût mensuel honnête à zéro tant que l'API dashboard n'est pas branchée
 * (Vague 2). Aucun montant inventé : tout est à zéro. Les métriques réelles
 * remplaceront ces valeurs sans changer la signature.
 */
export const MONTHLY_COST_FIXTURE: MonthlyCost = {
  amount: 0,
  changePercent: 0,
  budgetPercent: 0,
}
