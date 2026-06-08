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
  preset: ResourcePreset
  onVersion: (value: string) => void
  onParam: (key: string, value: string) => void
  onPreset: (preset: ResourcePreset) => void
}

const SELECT_CLASS =
  'border-border bg-surface focus:border-cyan h-10 w-full rounded-md border px-3 font-mono text-[13px] text-text-primary outline-none transition'

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
        <select
          id="dep-version"
          value={version}
          onChange={(event) => onVersion(event.target.value)}
          className={SELECT_CLASS}
        >
          {versions.map((entry) => (
            <option key={entry.version} value={entry.version}>
              {versionLabel(entry)}
            </option>
          ))}
        </select>
      </Field>

      {params.length > 0 && (
        <div className="mt-4 space-y-3">
          {params.map((param) => (
            <ParamField
              key={param.key}
              param={param}
              value={paramValues[param.key] ?? ''}
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
