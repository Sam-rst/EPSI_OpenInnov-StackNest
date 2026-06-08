/**
 * Type d'un paramètre de provisioning — miroir de l'enum Postgres `param_type`
 * et de `app/catalog/domain/enums/param_type.py`. Pilote le rendu dynamique du
 * formulaire de configuration Docker (un widget par type).
 */
export const ParamKind = {
  STRING: 'string',
  INT: 'int',
  BOOL: 'bool',
  SELECT: 'select',
  SECRET: 'secret',
} as const

export type ParamKind = (typeof ParamKind)[keyof typeof ParamKind]

const PARAM_KIND_VALUES: ReadonlySet<string> = new Set(Object.values(ParamKind))

/** Normalise un type brut en `ParamKind`, avec repli sur `STRING`. */
export function toParamKind(value: string): ParamKind {
  return PARAM_KIND_VALUES.has(value) ? (value as ParamKind) : ParamKind.STRING
}
