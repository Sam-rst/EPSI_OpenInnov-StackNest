import { Link } from 'react-router-dom';
import { Button, Icon } from '@core/ui';
import { ROUTES } from '@core/routing/routes';

interface ConfigHeaderProps {
  resourceName: string;
  resourceDesc: string;
  resourceIcon: string;
}

export function ConfigHeader({ resourceName, resourceDesc, resourceIcon }: ConfigHeaderProps) {
  return (
    <>
      <Link to={ROUTES.app.catalog} className="flex items-center gap-1.5 text-[12.5px] mb-3 text-text-muted hover:opacity-80 transition">
        <Icon name="arrow-left" size={13} /> Retour au catalogue
      </Link>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <span className="w-12 h-12 rounded-md flex items-center justify-center bg-[color-mix(in_oklch,var(--brand-cyan)_14%,transparent)] text-cyan">
            <Icon name={resourceIcon} size={24} />
          </span>
          <div>
            <h1 className="text-[24px] font-bold tracking-[-0.02em] text-text-primary">
              Configurer {resourceName}
            </h1>
            <p className="text-[12.5px] text-text-secondary">{resourceDesc}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost">Annuler</Button>
          <Button variant="secondary" icon="save">Enregistrer brouillon</Button>
        </div>
      </div>
    </>
  );
}
