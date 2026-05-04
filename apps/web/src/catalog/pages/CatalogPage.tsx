import { useNavigate } from 'react-router-dom';
import { ROUTES } from '@core/routing/routes';
import { CATALOG_ITEMS } from '../data/catalog.fixtures';
import { useCatalogFilters } from '../hooks/useCatalogFilters';
import { CatalogHeader } from '../components/CatalogHeader';
import { CatalogFilters } from '../components/filters';
import { CatalogGrid } from '../components/CatalogGrid';
import { CatalogEmpty } from '../components/CatalogEmpty';
import type { CatalogItem } from '../domain/models/CatalogItem';

export function CatalogPage() {
  const navigate = useNavigate();
  const filters = useCatalogFilters(CATALOG_ITEMS);
  const { filtered } = filters;

  const handleSelect = (_item: CatalogItem) => {
    navigate(ROUTES.app.config);
  };

  return (
    <div className="p-8">
      <CatalogHeader count={filtered.length} />
      <div className="grid gap-6" style={{ gridTemplateColumns: '220px 1fr' }}>
        <CatalogFilters
          search={filters.search}
          setSearch={filters.setSearch}
          categories={filters.categories}
          filterCategory={filters.filterCategory}
          setFilterCategory={filters.setFilterCategory}
          providers={filters.providers}
          filterProvider={filters.filterProvider}
          setFilterProvider={filters.setFilterProvider}
          allItems={CATALOG_ITEMS}
        />
        <div>
          <CatalogGrid items={filtered} onSelect={handleSelect} />
          {filtered.length === 0 && <CatalogEmpty />}
        </div>
      </div>
    </div>
  );
}
