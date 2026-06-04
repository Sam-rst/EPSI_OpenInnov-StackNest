import { useMemo, useState } from 'react';
import type { CatalogItem } from '../domain/models/CatalogItem';

interface UseCatalogFiltersResult {
  filterCategory: string;
  filterProvider: string;
  search: string;
  setFilterCategory: (value: string) => void;
  setFilterProvider: (value: string) => void;
  setSearch: (value: string) => void;
  categories: ReadonlyArray<string>;
  providers: ReadonlyArray<string>;
  filtered: ReadonlyArray<CatalogItem>;
}

const matchesSearch = (item: CatalogItem, search: string): boolean => {
  if (!search) return true;
  const q = search.toLowerCase();
  return item.name.toLowerCase().includes(q) || item.desc.toLowerCase().includes(q);
};

export function useCatalogFilters(items: ReadonlyArray<CatalogItem>): UseCatalogFiltersResult {
  const [filterCategory, setFilterCategory] = useState('Tous');
  const [filterProvider, setFilterProvider] = useState('Tous');
  const [search, setSearch] = useState('');

  const categories = useMemo(
    () => ['Tous', ...Array.from(new Set(items.map((it) => it.category)))],
    [items],
  );
  const providers = useMemo(
    () => ['Tous', ...Array.from(new Set(items.map((it) => it.provider)))],
    [items],
  );

  const filtered = useMemo(
    () =>
      items.filter(
        (item) =>
          (filterCategory === 'Tous' || item.category === filterCategory) &&
          (filterProvider === 'Tous' || item.provider === filterProvider) &&
          matchesSearch(item, search),
      ),
    [items, filterCategory, filterProvider, search],
  );

  return {
    filterCategory, filterProvider, search,
    setFilterCategory, setFilterProvider, setSearch,
    categories, providers, filtered,
  };
}
