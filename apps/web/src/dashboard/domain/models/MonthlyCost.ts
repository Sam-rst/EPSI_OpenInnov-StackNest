/** Récapitulatif du coût mensuel affiché dans la carte de pied de Sidebar. */
export interface MonthlyCost {
  /** Montant dépensé ce mois, en euros. */
  amount: number
  /** Variation vs. mois précédent, en pourcentage signé (ex. 8 = +8 %). */
  changePercent: number
  /** Part du budget consommée, en pourcentage (largeur de la barre). */
  budgetPercent: number
}
