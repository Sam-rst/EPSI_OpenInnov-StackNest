import { useMutation, useQueryClient, type UseMutationResult } from '@tanstack/react-query'

import { createTemplate, deleteTemplate, updateTemplate } from '../services/templateService'
import type { TemplateWriteDTO } from '../types/dto/TemplateWriteDTO'
import type { TemplateDetail } from '../types/models/TemplateDetail'
import { CATALOG_TEMPLATES_QUERY_KEY } from './useCatalogTemplates'

interface UpdateArgs {
  id: string
  payload: TemplateWriteDTO
}

interface UseTemplateMutationsResult {
  create: UseMutationResult<TemplateDetail, Error, TemplateWriteDTO>
  update: UseMutationResult<TemplateDetail, Error, UpdateArgs>
  remove: UseMutationResult<void, Error, string>
}

/**
 * Mutations admin du catalogue (create / update / delete). Chaque mutation
 * invalide la liste du catalogue pour rafraîchir l'écran après succès.
 */
export function useTemplateMutations(): UseTemplateMutationsResult {
  const queryClient = useQueryClient()

  const invalidateList = (): Promise<void> =>
    queryClient.invalidateQueries({ queryKey: CATALOG_TEMPLATES_QUERY_KEY })

  const create = useMutation({
    mutationFn: (payload: TemplateWriteDTO) => createTemplate(payload),
    onSuccess: invalidateList,
  })

  const update = useMutation({
    mutationFn: ({ id, payload }: UpdateArgs) => updateTemplate(id, payload),
    onSuccess: invalidateList,
  })

  const remove = useMutation({
    mutationFn: (id: string) => deleteTemplate(id),
    onSuccess: invalidateList,
  })

  return { create, update, remove }
}
