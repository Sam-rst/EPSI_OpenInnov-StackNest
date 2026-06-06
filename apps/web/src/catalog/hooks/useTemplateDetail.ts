import { useQuery } from '@tanstack/react-query'

import { getTemplate } from '../services/templateService'
import type { TemplateDetail } from '../types/models/TemplateDetail'

/** Clé React Query d'une fiche détaillée de template. */
export function templateDetailQueryKey(id: string): readonly [string, string, string] {
  return ['catalog', 'template', id]
}

interface UseTemplateDetailResult {
  detail: TemplateDetail | undefined
  loading: boolean
  isError: boolean
}

/**
 * Charge la fiche détaillée d'un template via React Query
 * (`GET /catalog/templates/{id}`). La requête est désactivée tant que l'`id`
 * est absent (ex. paramètre de route non encore résolu).
 */
export function useTemplateDetail(id: string | undefined): UseTemplateDetailResult {
  const { data, isLoading, isError } = useQuery({
    queryKey: templateDetailQueryKey(id ?? ''),
    queryFn: () => getTemplate(id as string),
    enabled: Boolean(id),
  })

  return {
    detail: data,
    loading: isLoading,
    isError,
  }
}
