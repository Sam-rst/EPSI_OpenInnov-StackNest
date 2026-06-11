import { useState } from 'react'

import { Button, Icon } from '../../shared/components/ui'

interface StackVarMappingEditorProps {
  /** Mappings courants `{ ENV_VAR : expression }`. */
  varMappings: Record<string, string>
  /** Remplace l'ensemble des mappings (édition contrôlée par le parent). */
  onChange: (varMappings: Record<string, string>) => void
}

const INPUT_CLASS =
  'border-border bg-surface focus:border-cyan h-9 w-full rounded-md border px-2.5 font-mono text-[12px] text-text-primary outline-none transition'

/**
 * Éditeur de `var_mappings` d'un lien : une ligne par variable (clé →
 * expression), ajout / suppression / édition. Les expressions (`{to.alias}`,
 * `{to.secret}`…) sont résolues worker-side : aucune valeur sensible n'est saisie
 * ni affichée ici. Pré-rempli par les défauts dérivés du fournisseur.
 */
export function StackVarMappingEditor({ varMappings, onChange }: StackVarMappingEditorProps) {
  const [newKey, setNewKey] = useState('')

  const entries = Object.entries(varMappings)

  const setValue = (key: string, value: string): void => {
    onChange({ ...varMappings, [key]: value })
  }

  const removeKey = (key: string): void => {
    const next = Object.fromEntries(
      Object.entries(varMappings).filter(([entryKey]) => entryKey !== key),
    )
    onChange(next)
  }

  const addKey = (): void => {
    const key = newKey.trim()
    if (key.length === 0 || key in varMappings) {
      return
    }
    onChange({ ...varMappings, [key]: '' })
    setNewKey('')
  }

  return (
    <div className="space-y-2">
      {entries.length === 0 && (
        <p className="text-text-muted text-[11.5px]">Aucune variable mappée.</p>
      )}
      {entries.map(([key, value]) => (
        <div key={key} className="flex items-center gap-2">
          <span className="text-text-secondary w-36 shrink-0 font-mono text-[12px]">{key}</span>
          <input
            aria-label={`Expression pour ${key}`}
            value={value}
            onChange={(event) => setValue(key, event.target.value)}
            className={INPUT_CLASS}
          />
          <button
            type="button"
            onClick={() => removeKey(key)}
            aria-label={`Retirer ${key}`}
            className="text-text-muted hover:text-error shrink-0 transition"
          >
            <Icon name="x" size={14} />
          </button>
        </div>
      ))}
      <div className="flex items-center gap-2 pt-1">
        <input
          aria-label="Nouvelle variable"
          placeholder="NOUVELLE_VARIABLE"
          value={newKey}
          onChange={(event) => setNewKey(event.target.value)}
          className={INPUT_CLASS}
        />
        <Button type="button" variant="secondary" size="sm" icon="plus" onClick={addKey}>
          Ajouter
        </Button>
      </div>
    </div>
  )
}
