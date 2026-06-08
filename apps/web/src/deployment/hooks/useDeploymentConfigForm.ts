import { useMemo, useState } from 'react'

import type { DeploymentWriteDTO } from '../types/dto/DeploymentWriteDTO'
import { RESOURCE_PRESETS, type ResourcePreset } from '../types/models/ResourcePreset'
import type { TemplateConfig, TemplateConfigParam } from '../types/models/TemplateConfig'

/** Environnements logiques proposés à la configuration. */
export const DEPLOYMENT_ENVS = ['dev', 'staging', 'prod'] as const
export type DeploymentEnv = (typeof DEPLOYMENT_ENVS)[number]

/** Valeurs courantes du formulaire de configuration Docker. */
export interface DeploymentConfigValues {
  name: string
  env: DeploymentEnv
  version: string
  params: Record<string, string>
  preset: ResourcePreset
}

interface UseDeploymentConfigFormResult {
  values: DeploymentConfigValues
  isValid: boolean
  setName: (value: string) => void
  setEnv: (value: DeploymentEnv) => void
  setVersion: (value: string) => void
  setParam: (key: string, value: string) => void
  setPreset: (preset: ResourcePreset) => void
  buildPayload: () => DeploymentWriteDTO
}

const MEDIUM_PRESET = RESOURCE_PRESETS[1] as ResourcePreset

/** Version par défaut du template (celle marquée `isDefault`, sinon la première). */
function defaultVersion(template: TemplateConfig): string {
  const preferred = template.versions.find((version) => version.isDefault)
  return preferred?.version ?? template.versions[0]?.version ?? ''
}

/** Valeurs initiales des params (valeur par défaut du template, ou chaîne vide). */
function initialParams(params: readonly TemplateConfigParam[]): Record<string, string> {
  return Object.fromEntries(params.map((param) => [param.key, param.defaultValue ?? '']))
}

/**
 * Gère l'état du formulaire de configuration Docker : identité (nom/env),
 * capacité (version, params dynamiques, preset cpu/mém) et construction du
 * payload `POST /deployments`. Le nom est requis (validation minimale MVP).
 */
export function useDeploymentConfigForm(template: TemplateConfig): UseDeploymentConfigFormResult {
  const [name, setName] = useState('')
  const [env, setEnv] = useState<DeploymentEnv>('dev')
  const [version, setVersion] = useState(() => defaultVersion(template))
  const [params, setParams] = useState<Record<string, string>>(() => initialParams(template.params))
  const [preset, setPreset] = useState<ResourcePreset>(MEDIUM_PRESET)

  const setParam = (key: string, value: string): void => {
    setParams((previous) => ({ ...previous, [key]: value }))
  }

  const isValid = name.trim().length > 0

  const values = useMemo<DeploymentConfigValues>(
    () => ({ name, env, version, params, preset }),
    [name, env, version, params, preset],
  )

  const buildPayload = (): DeploymentWriteDTO => ({
    template_id: template.id,
    version,
    name: name.trim(),
    env,
    params,
    limits: { cpu: preset.cpu, memory_mb: preset.memoryMb },
  })

  return { values, isValid, setName, setEnv, setVersion, setParam, setPreset, buildPayload }
}
