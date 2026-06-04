import { Link } from 'react-router-dom';
import { Badge, Button, Icon } from '@core/ui';
import { ROUTES } from '@core/routing/routes';

interface DeployHeaderProps {
  isDone: boolean;
}

export function DeployHeader({ isDone }: DeployHeaderProps) {
  return (
    <>
      <Link to={ROUTES.app.catalog} className="flex items-center gap-1.5 text-[12.5px] mb-3 text-text-muted hover:opacity-80">
        <Icon name="arrow-left" size={13} /> Retour
      </Link>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-[26px] font-bold tracking-[-0.02em] text-text-primary">
              Déploiement de pg-prod-eu
            </h1>
            {isDone ? <Badge tone="success">Réussi</Badge> : <Badge tone="cyan">En cours</Badge>}
          </div>
          <p className="text-[12.5px] mt-1 font-mono text-text-muted">
            run-2024-11-05-1432 · démarré il y a {isDone ? '21 s' : 'quelques instants'} · par Yassine Zouitni
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" icon="download">Exporter logs</Button>
          {isDone ? (
            <Button variant="primary" icon="external-link">Voir la ressource</Button>
          ) : (
            <Button variant="danger" icon="square">Annuler</Button>
          )}
        </div>
      </div>
    </>
  );
}
