import { Icon } from '@core/ui';

export function CatalogEmpty() {
  return (
    <div className="text-center py-20 rounded-lg border border-dashed border-border text-text-muted">
      <Icon name="search-x" size={28} className="mx-auto mb-3 opacity-60" />
      <div className="text-[13.5px] font-medium text-text-secondary">Aucune ressource ne correspond.</div>
      <div className="text-[12px] mt-1">Essaie d'élargir tes filtres ou demande au ChatOps.</div>
    </div>
  );
}
