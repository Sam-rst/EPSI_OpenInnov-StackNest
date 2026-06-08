import { useMemo, useState } from 'react'

import type { DeploymentWriteDTO } from '../types/dto/DeploymentWriteDTO'
import { RESOURCE_PRESETS, type ResourcePreset } from '../types/models/ResourcePreset'
import type { TemplateConfig, TemplateConfigParam } from '../types/models/TemplateConfig'
import { validateDeploymentName } from './deploymentNameValidation'

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

/**
 * Erreurs de validation du formulaire, pour un affichage inline (#5) : message
 * sur le nom (#3) et par paramètre requis vide (#2). `undefined`/clé absente =
 * pas d'erreur. Le message du nom n'apparaît qu'une fois le champ touché.
 */
export interface DeploymentConfigErrors {
  name?: string
  params: Record<string, string>
}

interface UseDeploymentConfigFormResult {
  values: DeploymentConfigValues
  isValid: boolean
  errors: DeploymentConfigErrors
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

/** Message d'erreur français standard pour un paramètre requis laissé vide. */
const REQUIRED_PARAM_MESSAGE = 'Ce paramètre est requis.'

/** Calcule les erreurs des paramètres requis laissés vides (#2). */
function computeParamErrors(
  params: readonly TemplateConfigParam[],
  values: Record<string, string>,
): Record<string, string> {
  const errors: Record<string, string> = {}
  for (const param of params) {
    if (param.required && (values[param.key] ?? '').trim().length === 0) {
      errors[param.key] = REQUIRED_PARAM_MESSAGE
    }
  }
  return errors
}

/**
 * Gère l'état du formulaire de configuration Docker : identité (nom/env),
 * capacité (version, params dynamiques, preset cpu/mém) et construction du
 * payload `POST /deployments`.
 *
 * Validation (avant l'appel API) : le nom doit être un label DNS valide (#3) et
 * tout paramètre `required` doit être renseigné (#2). Les messages sont exposés
 * via `errors` pour un affichage inline (#5) ; le message du nom n'apparaît
 * qu'une fois le champ touché, pour ne pas crier au chargement.
 */
export function useDeploymentConfigForm(template: TemplateConfig): UseDeploymentConfigFormResult {
  const [name, setName] = useState('')
  const [nameTouched, setNameTouched] = useState(false)
  const [env, setEnv] = useState<DeploymentEnv>('dev')
  const [version, setVersion] = useState(() => defaultVersion(template))
  const [params, setParams] = useState<Record<string, string>>(() => initialParams(template.params))
  const [preset, setPreset] = useState<ResourcePreset>(MEDIUM_PRESET)

  const handleSetName = (value: string): void => {
    setNameTouched(true)
    setName(value)
  }

  const setParam = (key: string, value: string): void => {
    setParams((previous) => ({ ...previous, [key]: value }))
  }

  const nameError = validateDeploymentName(name)
  const paramErrors = useMemo(
    () => computeParamErrors(template.params, params),
    [template.params, params],
  )
  const isValid = nameError === undefined && Object.keys(paramErrors).length === 0

  const errors = useMemo<DeploymentConfigErrors>(
    () => ({ name: nameTouched ? nameError : undefined, params: paramErrors }),
    [nameTouched, nameError, paramErrors],
  )

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

  return {
    values,
    isValid,
    errors,
    setName: handleSetName,
    setEnv,
    setVersion,
    setParam,
    setPreset,
    buildPayload,
  }
}
