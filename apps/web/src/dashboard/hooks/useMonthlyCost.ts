import { MONTHLY_COST_FIXTURE } from '../data/cost.fixtures'
import type { MonthlyCost } from '../domain/models/MonthlyCost'

/**
 * Fournit le coût mensuel consommé par le shell (carte de pied de Sidebar).
 *
 * Vague 1 (rendu) : renvoie une fixture (coût de démo).
 * Vague 2 (dashboard) : lira les métriques réelles via l'API dashboard sans
 *   changer la signature — la Sidebar reste inchangée.
 */
export function useMonthlyCost(): MonthlyCost {
  return MONTHLY_COST_FIXTURE
}
