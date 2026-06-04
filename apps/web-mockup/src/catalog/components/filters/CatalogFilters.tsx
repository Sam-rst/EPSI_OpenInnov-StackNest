import type { CatalogItem } from '../../domain/models/CatalogItem';
import { SearchFilter } from './SearchFilter';
import { FilterList } from './FilterList';
import { ChatOpsHint } from './ChatOpsHint';

interface CatalogFiltersProps {
  search: string;
  setSearch: (value: string) => void;
  categories: ReadonlyArray<string>;
  filterCategory: string;
  setFilterCategory: (value: string) => void;
  providers: ReadonlyArray<string>;
  filterProvider: string;
  setFilterProvider: (value: string) => void;
  allItems: ReadonlyArray<CatalogItem>;
}

const countCategory = (items: ReadonlyArray<CatalogItem>, category: string): number =>
  category === 'Tous' ? items.length : items.filter((it) => it.category === category).length;

export function CatalogFilters({
  search, setSearch,
  categories, filterCategory, setFilterCategory,
  providers, filterProvider, setFilterProvider,
  allItems,
}: CatalogFiltersProps) {
  const categoryEntries = categories.map((c) => ({ value: c, count: countCategory(allItems, c) }));
  const providerEntries = providers.map((p) => ({ value: p }));

  return (
    <aside className="space-y-5">
      <SearchFilter value={search} onChange={setSearch} />
      <FilterList
        label="Catégorie"
        entries={categoryEntries}
        active={filterCategory}
        onSelect={setFilterCategory}
        showCount
      />
      <FilterList
        label="Provider"
        entries={providerEntries}
        active={filterProvider}
        onSelect={setFilterProvider}
      />
      <ChatOpsHint />
    </aside>
  );
}
