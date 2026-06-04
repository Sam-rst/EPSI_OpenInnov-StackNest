import { Card } from '@core/ui';
import { Field } from '../forms/Field';
import { Select } from '../forms/Select';
import { SizePicker } from './SizePicker';
import { StorageSlider } from './StorageSlider';
import type { InstanceSize } from '../../data/sizes';

const VERSIONS = ['16.4', '16.3', '16.2', '15.7', '15.6'] as const;

interface CapacityCardProps {
  version: string;
  size: InstanceSize['id'];
  storage: number;
  onVersion: (v: string) => void;
  onSize: (v: InstanceSize['id']) => void;
  onStorage: (v: number) => void;
}

export function CapacityCard({ version, size, storage, onVersion, onSize, onStorage }: CapacityCardProps) {
  return (
    <Card className="p-5">
      <div className="text-[12px] font-mono uppercase tracking-[0.14em] mb-4 text-text-muted">Capacité</div>
      <Field label="Version">
        <Select value={version} onChange={onVersion} options={VERSIONS} />
      </Field>
      <div className="mt-4">
        <SizePicker value={size} onChange={onSize} />
      </div>
      <div className="mt-5">
        <StorageSlider value={storage} onChange={onStorage} />
      </div>
    </Card>
  );
}
