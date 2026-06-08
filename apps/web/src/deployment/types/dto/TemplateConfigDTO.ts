/**
 * Miroir partiel de `GET /catalog/templates/{id}` consommé par la configuration
 * de déploiement. La feature déploiement lit le catalogue (descripteur de
 * provisioning + `engine`) sans dépendre du modèle UI du catalogue : seules les
 * métadonnées d'exécution nécessaires au formulaire Docker sont reprises ici.
 */
export interface TemplateConfigDTO {
  id: string
  name: string
  icon: string
  description: string
  /** Valeur brute de l'enum `engine_kind` (« docker » | « terraform »). */
  engine: string
  /** Dépôt d'image Docker (image effective `repository:version`), ou `null`. */
  image_repository: string | null
  /** Port écouté dans le conteneur (ex. 5432), ou `null`. */
  internal_port: number | null
  /** Variable d'env recevant le mot de passe généré, ou `null` si aucun secret. */
  secret_env: string | null
  versions: TemplateConfigVersionDTO[]
  params: TemplateConfigParamDTO[]
}

/** Version disponible d'un template (miroir `TemplateVersionDTO`). */
export interface TemplateConfigVersionDTO {
  version: string
  is_default: boolean
  is_lts: boolean
  eol_date: string | null
}

/** Paramètre de provisioning (miroir `TemplateParamDTO`). */
export interface TemplateConfigParamDTO {
  key: string
  label: string
  /** Valeur brute de l'enum `param_type` (string/int/bool/select/secret). */
  type: string
  required: boolean
  default_value: string | null
  options: string[] | null
  order_index: number
}
