import { useState } from 'react'

import { ParamField } from '../../deployment/components/config/ParamField'
import { Badge, Button, Icon, Select } from '../../shared/components/ui'
import type { CompositionLink, CompositionService } from '../types/models/StackComposition'
import { StackLinkRow } from './StackLinkRow'

interface StackServiceBlockProps {
  service: CompositionService
  /** Liens dont ce service est le **consommateur** (`from`). */
  outgoingLinks: readonly CompositionLink[]
  /** Autres services pouvant être ciblés comme fournisseurs (alias + localId). */
  providers: readonly CompositionService[]
  onAlias: (alias: string) => void
  onVersion: (version: string) => void
  onParam: (key: string, value: string) => void
  onRemove: () => void
  onAddLink: (toLocalId: string) => void
  onRemoveLink: (linkLocalId: string) => void
  onChangeLinkMappings: (linkLocalId: string, varMappings: Record<string, string>) => void
}

const CONTROL_CLASS =
  'border-border bg-surface focus:border-cyan h-9 rounded-md border px-2.5 text-[13px] text-text-primary outline-none transition'

// Surcharge la taille de la primitive Select pour ce bloc compact (h-9, 13px,
// sans-serif), en gardant la place du chevron (pr-8).
const SELECT_CLASS = 'h-9 px-2.5 pr-8 font-sans text-[13px]'

/**
 * Bloc d'un service dans la « stack en cours » : alias éditable, version,
 * formulaire de params (réutilise `ParamField` de la config déploiement),
 * éditeur de liens sortants (« Lier à… » + mappings) et suppression.
 *
 * Compound (>100 lignes) : délègue chaque lien à `StackLinkRow`. Les params
 * `secret` restent masqués par l'input `password` de `ParamField` — cohérent
 * avec l'invariant de sécurité (aucun secret affiché en clair).
 */
export function StackServiceBlock({
  service,
  outgoingLinks,
  providers,
  onAlias,
  onVersion,
  onParam,
  onRemove,
  onAddLink,
  onRemoveLink,
  onChangeLinkMappings,
}: StackServiceBlockProps) {
  const [linkTarget, setLinkTarget] = useState('')
  const linkedTargets = new Set(outgoingLinks.map((link) => link.toLocalId))
  const availableProviders = providers.filter((provider) => !linkedTargets.has(provider.localId))
  const providerByLocalId = new Map(providers.map((provider) => [provider.localId, provider]))

  const handleAddLink = (): void => {
    if (linkTarget.length === 0) {
      return
    }
    onAddLink(linkTarget)
    setLinkTarget('')
  }

  return (
    <article className="border-border bg-surface-elevated rounded-lg border p-4">
      <header className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span className="text-cyan flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-[color-mix(in_oklch,var(--color-cyan)_14%,transparent)]">
            <Icon name={service.template.icon} size={17} />
          </span>
          <div>
            <div className="text-text-primary text-[13.5px] font-semibold">
              {service.template.name}
            </div>
            <Badge tone="neutral">{service.template.id}</Badge>
          </div>
        </div>
        <button
          type="button"
          onClick={onRemove}
          aria-label={`Supprimer ${service.alias}`}
          className="text-text-muted hover:text-error transition"
        >
          <Icon name="trash-2" size={16} />
        </button>
      </header>

      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <label className="block">
          <span className="text-text-secondary mb-1.5 block text-[12px] font-medium">Alias</span>
          <input
            aria-label={`Alias du service ${service.template.name}`}
            value={service.alias}
            onChange={(event) => onAlias(event.target.value)}
            className={`${CONTROL_CLASS} w-full font-mono`}
          />
        </label>
        <div className="block">
          <span className="text-text-secondary mb-1.5 block text-[12px] font-medium">Version</span>
          <Select
            aria-label={`Version de ${service.template.name}`}
            value={service.version}
            onChange={onVersion}
            className={SELECT_CLASS}
          >
            {service.template.versions.map((version) => (
              <option key={version.version} value={version.version}>
                {version.version}
              </option>
            ))}
          </Select>
        </div>
      </div>

      {service.template.params.length > 0 && (
        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
          {service.template.params.map((param) => (
            <ParamField
              key={param.key}
              param={param}
              value={service.params[param.key] ?? ''}
              onChange={(value) => onParam(param.key, value)}
            />
          ))}
        </div>
      )}

      <div className="mt-4 space-y-2">
        {outgoingLinks.map((link) => (
          <StackLinkRow
            key={link.localId}
            link={link}
            provider={providerByLocalId.get(link.toLocalId)}
            onChangeMappings={(varMappings) => onChangeLinkMappings(link.localId, varMappings)}
            onRemove={() => onRemoveLink(link.localId)}
          />
        ))}
        {availableProviders.length > 0 && (
          <div className="flex items-center gap-2">
            <div className="flex-1">
              <Select
                aria-label={`Lier ${service.alias} à un service`}
                value={linkTarget}
                onChange={setLinkTarget}
                className={SELECT_CLASS}
              >
                <option value="">Lier à…</option>
                {availableProviders.map((provider) => (
                  <option key={provider.localId} value={provider.localId}>
                    {provider.alias}
                  </option>
                ))}
              </Select>
            </div>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              icon="link"
              disabled={linkTarget.length === 0}
              onClick={handleAddLink}
            >
              Lier
            </Button>
          </div>
        )}
      </div>
    </article>
  )
}
