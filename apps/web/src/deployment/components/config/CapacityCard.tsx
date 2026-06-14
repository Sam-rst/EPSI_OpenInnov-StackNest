import { Select } from '../../../shared/components/ui'
import { Card } from '../common/Card'
import { Field } from '../common/Field'
import { ParamField } from './ParamField'
import { PresetPicker } from './PresetPicker'
import type { ResourcePreset } from '../../types/models/ResourcePreset'
import type { TemplateConfigParam, TemplateConfigVersion } from '../../types/models/TemplateConfig'

interface CapacityCardProps {
  versions: readonly TemplateConfigVersion[]
  params: readonly TemplateConfigParam[]
  version: string
  paramValues: Record<string, string>
  /** Erreurs de validation par clé de paramètre (requis vide), si présentes (#2 #5). */
  paramErrors?: Record<string, string>
  preset: ResourcePreset
  onVersion: (value: string) => void
  onParam: (key: string, value: string) => void
  onPreset: (preset: ResourcePreset) => void
}

function versionLabel(version: TemplateConfigVersion): string {
  if (version.isLts) return `${version.version} (LTS)`
  if (version.isDefault) return `${version.version} (par défaut)`
  return version.version
}

/** Carte Capacité : version, paramètres dynamiques du template et limites cpu/mém. */
export function CapacityCard({
  versions,
  params,
  version,
  paramValues,
  paramErrors,
  preset,
  onVersion,
  onParam,
  onPreset,
}: CapacityCardProps) {
  return (
    <Card className="p-5">
      <h2 className="text-text-muted mb-4 font-mono text-[12px] tracking-[0.14em] uppercase">
        Capacité
      </h2>
      <Field label="Version" htmlFor="dep-version">
        <Select id="dep-version" value={version} onChange={onVersion}>
          {versions.map((entry) => (
            <option key={entry.version} value={entry.version}>
              {versionLabel(entry)}
            </option>
          ))}
        </Select>
      </Field>

      {params.length > 0 && (
        <div className="mt-4 space-y-3">
          {params.map((param) => (
            <ParamField
              key={param.key}
              param={param}
              value={paramValues[param.key] ?? ''}
              error={paramErrors?.[param.key]}
              onChange={(value) => onParam(param.key, value)}
            />
          ))}
        </div>
      )}

      <div className="mt-5">
        <PresetPicker value={preset} onChange={onPreset} />
      </div>
    </Card>
  )
}
