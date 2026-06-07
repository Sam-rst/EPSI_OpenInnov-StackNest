/**
 * Types de paramètres de provisioning — miroir de l'enum Postgres `param_type`
 * et de `app/catalog/domain/enums/param_type.py` côté API.
 *
 * Pilote le rendu du formulaire de déploiement (à venir, feature STN-3).
 */
export const ParamType = {
  STRING: 'string',
  INT: 'int',
  BOOL: 'bool',
  SELECT: 'select',
  SECRET: 'secret',
} as const

export type ParamType = (typeof ParamType)[keyof typeof ParamType]

/** Libellés français affichés dans la table des paramètres (fiche détail). */
export const PARAM_TYPE_LABELS: Record<ParamType, string> = {
  string: 'Texte',
  int: 'Entier',
  bool: 'Booléen',
  select: 'Liste de choix',
  secret: 'Secret',
}

/** Renvoie le libellé français d'un type de paramètre (ou la valeur brute si inconnu). */
export function labelForParamType(type: string): string {
  return PARAM_TYPE_LABELS[type as ParamType] ?? type
}
