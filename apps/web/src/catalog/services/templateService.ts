import { apiClient } from '../../core/api/apiClient'
import type { CatalogItem } from '../domain/models/CatalogItem'
import { mapCardDtoToCatalogItem, mapDetailDtoToTemplateDetail } from '../mappers/templateMapper'
import type { TemplateCardDTO } from '../types/dto/TemplateCardDTO'
import type { TemplateDetailDTO } from '../types/dto/TemplateDetailDTO'
import type { TemplateWriteDTO } from '../types/dto/TemplateWriteDTO'
import type { TemplateDetail } from '../types/models/TemplateDetail'

const TEMPLATES_PATH = '/catalog/templates'

/**
 * Accès au catalogue via l'API (`GET /catalog/templates`).
 * Renvoie le catalogue complet en cartes légères (filtrage assuré côté client).
 */
export async function listTemplates(): Promise<readonly CatalogItem[]> {
  const { data } = await apiClient.get<TemplateCardDTO[]>(TEMPLATES_PATH)
  return data.map(mapCardDtoToCatalogItem)
}

/** Récupère la fiche détaillée d'un template (`GET /catalog/templates/{id}`). */
export async function getTemplate(id: string): Promise<TemplateDetail> {
  const { data } = await apiClient.get<TemplateDetailDTO>(`${TEMPLATES_PATH}/${id}`)
  return mapDetailDtoToTemplateDetail(data)
}

/** Crée un template (admin — `POST /catalog/templates`). */
export async function createTemplate(payload: TemplateWriteDTO): Promise<TemplateDetail> {
  const { data } = await apiClient.post<TemplateDetailDTO>(TEMPLATES_PATH, payload)
  return mapDetailDtoToTemplateDetail(data)
}

/** Met à jour un template (admin — `PUT /catalog/templates/{id}`). */
export async function updateTemplate(
  id: string,
  payload: TemplateWriteDTO,
): Promise<TemplateDetail> {
  const { data } = await apiClient.put<TemplateDetailDTO>(`${TEMPLATES_PATH}/${id}`, payload)
  return mapDetailDtoToTemplateDetail(data)
}

/** Supprime un template (admin — `DELETE /catalog/templates/{id}`). */
export async function deleteTemplate(id: string): Promise<void> {
  await apiClient.delete(`${TEMPLATES_PATH}/${id}`)
}
