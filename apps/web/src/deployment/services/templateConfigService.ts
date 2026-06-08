import { apiClient } from '../../core/api/apiClient'
import { mapTemplateConfigDto } from '../mappers/templateConfigMapper'
import type { TemplateConfigDTO } from '../types/dto/TemplateConfigDTO'
import type { TemplateConfig } from '../types/models/TemplateConfig'

const TEMPLATES_PATH = '/catalog/templates'

/**
 * Lit la fiche d'un template du catalogue (`GET /catalog/templates/{id}`) pour
 * piloter la configuration de déploiement. C'est le seul point où la feature
 * déploiement consomme le catalogue : la réponse porte déjà `engine` et le
 * descripteur de provisioning (image/port/secret). Endpoint réel (le catalogue
 * est livré) — ce n'est pas un seam fixtures.
 */
export async function getTemplateConfig(id: string): Promise<TemplateConfig> {
  const { data } = await apiClient.get<TemplateConfigDTO>(`${TEMPLATES_PATH}/${id}`)
  return mapTemplateConfigDto(data)
}
