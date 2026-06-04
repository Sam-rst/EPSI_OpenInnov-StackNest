import { INSTANCE_SIZES, type InstanceSize } from '../../data/sizes';

interface SizePickerProps {
  value: InstanceSize['id'];
  onChange: (value: InstanceSize['id']) => void;
}

const baseCard = 'text-left rounded-md border p-3 transition';
const activeCard = 'border-cyan bg-[color-mix(in_oklch,var(--brand-cyan)_8%,transparent)]';
const idleCard = 'border-border hover:border-text-muted';

export function SizePicker({ value, onChange }: SizePickerProps) {
  return (
    <div>
      <div className="text-[12px] font-medium mb-2 text-text-secondary">Taille de l'instance</div>
      <div className="grid grid-cols-3 gap-2">
        {INSTANCE_SIZES.map((size) => (
          <button
            key={size.id}
            type="button"
            onClick={() => onChange(size.id)}
            className={`${baseCard} ${value === size.id ? activeCard : idleCard}`}
          >
            <div className="text-[12px] font-semibold capitalize text-text-primary">{size.id}</div>
            <div className="text-[11px] mt-0.5 text-text-muted">{size.cpu} · {size.ram}</div>
            <div className="text-[12px] font-mono mt-2 text-cyan">{size.cost} €/mois</div>
          </button>
        ))}
      </div>
    </div>
  );
}
