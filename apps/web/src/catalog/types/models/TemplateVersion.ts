/** Version d'un template enrichie pour l'affichage (fiche détail). */
export interface TemplateVersion {
  version: string
  isDefault: boolean
  isLts: boolean
  /** Date de fin de support (ISO `YYYY-MM-DD`) ou `null`. */
  eolDate: string | null
}
