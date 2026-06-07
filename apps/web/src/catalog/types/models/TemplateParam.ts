import type { ParamType } from '../enums/ParamType'

/** Paramètre de provisioning enrichi pour l'affichage (fiche détail). */
export interface TemplateParam {
  key: string
  label: string
  type: ParamType
  required: boolean
  /** Valeur par défaut, ou `null`. */
  defaultValue: string | null
  /** Choix possibles pour un type `select`, sinon `null`. */
  options: readonly string[] | null
  orderIndex: number
}
