import { Button } from '@core/ui';

interface CatalogHeaderProps {
  count: number;
}

export function CatalogHeader({ count }: CatalogHeaderProps) {
  const plural = count > 1 ? 's' : '';
  return (
    <div className="flex items-end justify-between mb-6 flex-wrap gap-4">
      <div>
        <h1 className="text-[28px] font-bold tracking-[-0.02em] text-text-primary">
          Catalogue de ressources
        </h1>
        <p className="text-[13.5px] mt-1 text-text-secondary">
          {count} ressource{plural} disponible{plural} · provisionnable en moins d'une minute
        </p>
      </div>
      <div className="flex items-center gap-2">
        <Button variant="secondary" icon="upload">Importer un module</Button>
        <Button variant="primary" icon="plus">Nouvelle ressource</Button>
      </div>
    </div>
  );
}
