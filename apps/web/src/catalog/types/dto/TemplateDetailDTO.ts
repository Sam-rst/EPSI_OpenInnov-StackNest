import type { TemplateCardDTO } from './TemplateCardDTO'
import type { TemplateParamDTO } from './TemplateParamDTO'
import type { TemplateVersionDTO } from './TemplateVersionDTO'

/**
 * Miroir exact de la réponse `GET /catalog/templates/{id}` (fiche riche).
 * Contrat figé : carte + `versions[]` + `params[]`.
 */
export interface TemplateDetailDTO extends TemplateCardDTO {
  versions: TemplateVersionDTO[]
  params: TemplateParamDTO[]
}
