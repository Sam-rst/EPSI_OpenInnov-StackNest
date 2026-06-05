import type { CatalogItem } from '../../domain/models/CatalogItem'
import { ChatOpsHint } from './ChatOpsHint'
import { FilterList } from './FilterList'
import { SearchFilter } from './SearchFilter'

interface CatalogFiltersProps {
  search: string
  setSearch: (value: string) => void
  categories: readonly string[]
  filterCategory: string
  setFilterCategory: (value: string) => void
  providers: readonly string[]
  filterProvider: string
  setFilterProvider: (value: string) => void
  allItems: readonly CatalogItem[]
}

const countCategory = (items: readonly CatalogItem[], category: string): number =>
  category === 'Tous' ? items.length : items.filter((item) => item.category === category).length

export function CatalogFilters({
  search,
  setSearch,
  categories,
  filterCategory,
  setFilterCategory,
  providers,
  filterProvider,
  setFilterProvider,
  allItems,
}: CatalogFiltersProps) {
  const categoryEntries = categories.map((category) => ({
    value: category,
    count: countCategory(allItems, category),
  }))
  const providerEntries = providers.map((provider) => ({ value: provider }))

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
  )
}
