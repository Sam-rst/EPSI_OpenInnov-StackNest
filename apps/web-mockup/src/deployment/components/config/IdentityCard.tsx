import { Card } from '@core/ui';
import { Field } from '../forms/Field';
import { Select } from '../forms/Select';

const ENVS = ['dev', 'staging', 'prod', 'lab'] as const;
const REGIONS = ['eu-west-3', 'eu-west-1', 'eu-central-1', 'us-east-1'] as const;

interface IdentityCardProps {
  name: string;
  env: string;
  region: string;
  onName: (v: string) => void;
  onEnv: (v: string) => void;
  onRegion: (v: string) => void;
}

const inputClass =
  'w-full h-10 px-3 rounded-md border border-border bg-surface text-[13px] text-text-primary font-mono outline-none focus:border-cyan focus:ring-2 focus:ring-[color-mix(in_oklch,var(--brand-cyan)_30%,transparent)]';

export function IdentityCard({ name, env, region, onName, onEnv, onRegion }: IdentityCardProps) {
  return (
    <Card className="p-5">
      <div className="text-[12px] font-mono uppercase tracking-[0.14em] mb-4 text-text-muted">Identité</div>
      <Field label="Nom de la ressource" hint="Doit être unique dans le workspace">
        <input value={name} onChange={(e) => onName(e.target.value)} className={inputClass} />
      </Field>
      <div className="grid grid-cols-2 gap-3 mt-3">
        <Field label="Environnement">
          <Select value={env} onChange={onEnv} options={ENVS} />
        </Field>
        <Field label="Région">
          <Select value={region} onChange={onRegion} options={REGIONS} />
        </Field>
      </div>
    </Card>
  );
}
