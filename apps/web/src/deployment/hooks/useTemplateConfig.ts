import { useQuery } from '@tanstack/react-query'

import { getTemplateConfig } from '../services/templateConfigService'
import type { TemplateConfig } from '../types/models/TemplateConfig'

/** Clé React Query de la fiche de configuration d'un template. */
export function templateConfigQueryKey(id: string): readonly [string, string, string] {
  return ['deployment', 'template-config', id]
}

interface UseTemplateConfigResult {
  template: TemplateConfig | undefined
  loading: boolean
  isError: boolean
}

/**
 * Charge la fiche catalogue qui pilote la configuration de déploiement
 * (`GET /catalog/templates/{id}`). Désactivée tant que l'`id` est absent.
 */
export function useTemplateConfig(id: string | undefined): UseTemplateConfigResult {
  const { data, isLoading, isError } = useQuery({
    queryKey: templateConfigQueryKey(id ?? ''),
    queryFn: () => getTemplateConfig(id as string),
    enabled: Boolean(id),
  })

  return {
    template: data,
    loading: isLoading,
    isError,
  }
}
