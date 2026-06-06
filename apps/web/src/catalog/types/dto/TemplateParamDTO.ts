/**
 * Miroir d'un paramètre de template dans `TemplateDetailDTO.params[]`.
 * Contrat figé : `{key, label, type, required, default_value, options, order_index}`.
 */
export interface TemplateParamDTO {
  key: string
  label: string
  /** Valeur brute de l'enum `param_type` (ex. « string », « select »). */
  type: string
  required: boolean
  /** Valeur par défaut sérialisée en texte, ou `null`. */
  default_value: string | null
  /** Choix possibles pour un paramètre de type `select`, sinon `null`. */
  options: string[] | null
  order_index: number
}
