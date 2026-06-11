import { useState } from 'react'

import { Button, Icon } from '../../shared/components/ui'
import type { CompositionLink, CompositionService } from '../types/models/StackComposition'
import { StackVarMappingEditor } from './StackVarMappingEditor'

interface StackLinkRowProps {
  link: CompositionLink
  /** Service fournisseur ciblé (pour afficher son alias). */
  provider: CompositionService | undefined
  onChangeMappings: (varMappings: Record<string, string>) => void
  onRemove: () => void
}

/**
 * Une ligne de lien déjà établi sur un bloc consommateur : rappelle le
 * fournisseur ciblé (par alias), permet de déplier l'éditeur de `var_mappings`
 * et de retirer le lien.
 */
export function StackLinkRow({ link, provider, onChangeMappings, onRemove }: StackLinkRowProps) {
  const [open, setOpen] = useState(false)
  const providerAlias = provider?.alias ?? '?'

  return (
    <div className="border-border bg-surface-sunken rounded-md border p-3">
      <div className="flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          className="text-text-primary flex items-center gap-2 text-[12.5px] font-medium"
          aria-expanded={open}
        >
          <Icon name={open ? 'chevron-down' : 'chevron-right'} size={14} className="text-cyan" />
          <Icon name="link" size={13} className="text-cyan" />
          Lié à <span className="font-mono">{providerAlias}</span>
          <span className="text-text-muted">
            ({Object.keys(link.varMappings).length} variable
            {Object.keys(link.varMappings).length > 1 ? 's' : ''})
          </span>
        </button>
        <button
          type="button"
          onClick={onRemove}
          aria-label={`Retirer le lien vers ${providerAlias}`}
          className="text-text-muted hover:text-error shrink-0 transition"
        >
          <Icon name="trash-2" size={14} />
        </button>
      </div>
      {open && (
        <div className="mt-3">
          <StackVarMappingEditor varMappings={link.varMappings} onChange={onChangeMappings} />
          <p className="text-text-muted mt-2 flex items-start gap-1.5 text-[11px] leading-relaxed">
            <Icon name="info" size={12} className="text-cyan mt-0.5 shrink-0" />
            Expressions résolues au déploiement (ex. <code>{'{to.alias}'}</code> → DNS du service).
          </p>
        </div>
      )}
      {!open && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="mt-2"
          onClick={() => setOpen(true)}
        >
          Modifier les variables
        </Button>
      )}
    </div>
  )
}
