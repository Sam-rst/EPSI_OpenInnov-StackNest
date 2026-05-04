import { Badge, Card, Icon } from '@core/ui';
import { Toggle } from '../forms/Toggle';

const TAGS = ['team:plateforme', 'managed-by:stacknest'];

interface OptionsCardProps {
  backups: boolean;
  onBackups: (checked: boolean) => void;
}

export function OptionsCard({ backups, onBackups }: OptionsCardProps) {
  return (
    <Card className="p-5">
      <div className="text-[12px] font-mono uppercase tracking-[0.14em] mb-4 text-text-muted">Options</div>
      <Toggle
        checked={backups}
        onChange={onBackups}
        label="Backups automatiques quotidiens"
        hint="Snapshots conservés 30 jours, restauration en 1 clic."
      />
      <div className="mt-3">
        <div className="text-[12px] font-medium mb-2 text-text-secondary">Tags</div>
        <div className="flex items-center gap-1.5 flex-wrap">
          {TAGS.map((tag) => (
            <Badge key={tag} tone="cyan">{tag}</Badge>
          ))}
          <button
            type="button"
            className="text-[11.5px] px-2 h-5 rounded border border-dashed border-border text-text-muted inline-flex items-center gap-1"
          >
            <Icon name="plus" size={11} /> ajouter
          </button>
        </div>
      </div>
    </Card>
  );
}
