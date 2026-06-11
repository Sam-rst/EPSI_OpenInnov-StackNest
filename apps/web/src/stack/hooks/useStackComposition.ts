import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import type {
  TemplateConfig,
  TemplateConfigParam,
} from '../../deployment/types/models/TemplateConfig'
import type { StackWriteDTO } from '../types/dto/StackWriteDTO'
import type { CompositionLink, CompositionService } from '../types/models/StackComposition'
import { type CompositionValidationResult, validateComposition } from './compositionValidation'
import { buildStackPayload } from './compositionPayload'
import { defaultLinkMappings } from './defaultLinkMappings'

interface UseStackCompositionResult {
  services: readonly CompositionService[]
  links: readonly CompositionLink[]
  validation: CompositionValidationResult
  addService: (template: TemplateConfig) => void
  removeService: (localId: string) => void
  setAlias: (localId: string, alias: string) => void
  setVersion: (localId: string, version: string) => void
  setParam: (localId: string, key: string, value: string) => void
  addLink: (fromLocalId: string, toLocalId: string) => void
  removeLink: (localId: string) => void
  setLinkMappings: (localId: string, varMappings: Record<string, string>) => void
  buildPayload: (name: string) => StackWriteDTO
}

/** Compteur monotone : identifiants locaux stables pour services et liens. */
let localIdSequence = 0
function nextLocalId(prefix: string): string {
  localIdSequence += 1
  return `${prefix}-${localIdSequence}`
}

/** Slug d'alias à partir du nom du template (minuscules, tirets, DNS-safe). */
function slugify(name: string): string {
  const slug = name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
  return slug.length > 0 ? slug : 'service'
}

/** Rend un alias unique parmi ceux déjà pris (suffixe numérique si collision). */
function uniqueAlias(base: string, taken: ReadonlySet<string>): string {
  if (!taken.has(base)) {
    return base
  }
  let suffix = 2
  while (taken.has(`${base}-${suffix}`)) {
    suffix += 1
  }
  return `${base}-${suffix}`
}

/** Version par défaut d'un template (celle marquée `isDefault`, sinon la 1re). */
function defaultVersion(template: TemplateConfig): string {
  const preferred = template.versions.find((version) => version.isDefault)
  return preferred?.version ?? template.versions[0]?.version ?? ''
}

/** Valeurs initiales des params (valeur par défaut du template, ou chaîne vide). */
function initialParams(params: readonly TemplateConfigParam[]): Record<string, string> {
  return Object.fromEntries(params.map((param) => [param.key, param.defaultValue ?? '']))
}

/**
 * État de composition du builder de stack : la liste des services ajoutés depuis
 * le catalogue (alias éditable, version, params) et les liens dirigés entre eux.
 *
 * À l'ajout, l'alias est dérivé du nom du template et rendu unique (suffixe si
 * collision) ; la version par défaut et les params par défaut sont pré-remplis.
 * À l'ajout d'un lien, les `var_mappings` par défaut sont dérivés du descripteur
 * du fournisseur (cf. `defaultLinkMappings`). Supprimer un service retire aussi
 * les liens qui le référencent. Expose la validation (pré-déploiement) et la
 * construction du payload `POST /stacks`.
 */
export function useStackComposition(): UseStackCompositionResult {
  const [services, setServices] = useState<CompositionService[]>([])
  const [links, setLinks] = useState<CompositionLink[]>([])

  /**
   * Miroir des services lisible hors d'un updater de state. Permet à `addLink`
   * de résoudre le template fournisseur sans imbriquer `setLinks` dans
   * l'updater de `setServices` (updater impur, double-invoqué sous StrictMode).
   * Synchronisé via effet (jamais écrit pendant le rendu).
   */
  const servicesRef = useRef(services)
  useEffect(() => {
    servicesRef.current = services
  }, [services])

  const addService = useCallback((template: TemplateConfig): void => {
    setServices((previous) => {
      const taken = new Set(previous.map((service) => service.alias))
      const alias = uniqueAlias(slugify(template.name), taken)
      const service: CompositionService = {
        localId: nextLocalId('svc'),
        template,
        alias,
        version: defaultVersion(template),
        params: initialParams(template.params),
      }
      return [...previous, service]
    })
  }, [])

  const removeService = useCallback((localId: string): void => {
    setServices((previous) => previous.filter((service) => service.localId !== localId))
    setLinks((previous) =>
      previous.filter((link) => link.fromLocalId !== localId && link.toLocalId !== localId),
    )
  }, [])

  const updateService = useCallback((localId: string, patch: Partial<CompositionService>): void => {
    setServices((previous) =>
      previous.map((service) => (service.localId === localId ? { ...service, ...patch } : service)),
    )
  }, [])

  const setAlias = useCallback(
    (localId: string, alias: string) => updateService(localId, { alias }),
    [updateService],
  )

  const setVersion = useCallback(
    (localId: string, version: string) => updateService(localId, { version }),
    [updateService],
  )

  const setParam = useCallback((localId: string, key: string, value: string): void => {
    setServices((previous) =>
      previous.map((service) =>
        service.localId === localId
          ? { ...service, params: { ...service.params, [key]: value } }
          : service,
      ),
    )
  }, [])

  const addLink = useCallback((fromLocalId: string, toLocalId: string): void => {
    const provider = servicesRef.current.find((service) => service.localId === toLocalId)
    if (provider === undefined) {
      return
    }
    const varMappings = defaultLinkMappings(provider.template)
    setLinks((previous) => [
      ...previous,
      { localId: nextLocalId('link'), fromLocalId, toLocalId, varMappings },
    ])
  }, [])

  const removeLink = useCallback((localId: string): void => {
    setLinks((previous) => previous.filter((link) => link.localId !== localId))
  }, [])

  const setLinkMappings = useCallback(
    (localId: string, varMappings: Record<string, string>): void => {
      setLinks((previous) =>
        previous.map((link) => (link.localId === localId ? { ...link, varMappings } : link)),
      )
    },
    [],
  )

  const validation = useMemo(() => validateComposition(services, links), [services, links])

  const buildPayload = useCallback(
    (name: string): StackWriteDTO => buildStackPayload(name, services, links),
    [services, links],
  )

  return {
    services,
    links,
    validation,
    addService,
    removeService,
    setAlias,
    setVersion,
    setParam,
    addLink,
    removeLink,
    setLinkMappings,
    buildPayload,
  }
}
