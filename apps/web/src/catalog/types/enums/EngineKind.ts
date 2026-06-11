/**
 * Moteur de provisioning d'un template — miroir de l'enum Postgres `engine_kind`
 * et de `app/catalog/domain/enums/engine_kind.py` côté API.
 *
 * Les valeurs (lowercase) sont celles renvoyées par l'API. Discrimine le rendu
 * d'une carte : un template `terraform` n'est pas encore déployable depuis l'UI
 * (carte bloquée), un template `docker` est pleinement configurable.
 */
export const EngineKind = {
  DOCKER: 'docker',
  TERRAFORM: 'terraform',
} as const

export type EngineKind = (typeof EngineKind)[keyof typeof EngineKind]
