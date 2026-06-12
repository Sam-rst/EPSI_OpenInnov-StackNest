/**
 * État de sélection d'une ligne/carte de déploiement, injecté par la liste.
 * Quand `undefined`, la sélection multiple est désactivée (aucune case affichée).
 */
export interface RowSelection {
  selected: boolean
  onToggle: () => void
}
