import { cn } from '../../../shared/lib/cn'
import { RESOURCE_PRESETS, type ResourcePreset } from '../../types/models/ResourcePreset'

interface PresetPickerProps {
  value: ResourcePreset
  onChange: (preset: ResourcePreset) => void
}

const BASE_CARD = 'rounded-md border p-3 text-left transition'
const ACTIVE_CARD = 'border-cyan bg-[color-mix(in_oklch,var(--color-cyan)_8%,transparent)]'
const IDLE_CARD = 'border-border hover:border-text-muted'

function formatMemory(memoryMb: number): string {
  return memoryMb >= 1024 ? `${memoryMb / 1024} Go` : `${memoryMb} Mo`
}

/** Sélecteur de limites de ressources conteneur (presets S/M/L cpu/mémoire). */
export function PresetPicker({ value, onChange }: PresetPickerProps) {
  return (
    <div>
      <div className="text-text-secondary mb-2 text-[12px] font-medium">Limites de ressources</div>
      <div className="grid grid-cols-3 gap-2">
        {RESOURCE_PRESETS.map((preset) => (
          <button
            key={preset.id}
            type="button"
            onClick={() => onChange(preset)}
            className={cn(BASE_CARD, value.id === preset.id ? ACTIVE_CARD : IDLE_CARD)}
          >
            <div className="text-text-primary text-[13px] font-semibold">{preset.label}</div>
            <div className="text-text-muted mt-0.5 text-[11px]">
              {preset.cpu} vCPU · {formatMemory(preset.memoryMb)}
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}
