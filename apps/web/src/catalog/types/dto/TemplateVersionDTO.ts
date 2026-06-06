/**
 * Miroir d'une version de template dans `TemplateDetailDTO.versions[]`.
 * Contrat figé : `{version, is_default, is_lts, eol_date}`.
 */
export interface TemplateVersionDTO {
  version: string
  is_default: boolean
  is_lts: boolean
  /** Date de fin de support (ISO `YYYY-MM-DD`) ou `null` si inconnue. */
  eol_date: string | null
}
