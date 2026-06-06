import { useNavigate } from 'react-router-dom'

import type { CatalogItem } from '../domain/models/CatalogItem'
import { CatalogEmpty } from '../components/CatalogEmpty'
import { CatalogError } from '../components/CatalogError'
import { CatalogGrid } from '../components/CatalogGrid'
import { CatalogHeader } from '../components/CatalogHeader'
import { CatalogFilters } from '../components/filters'
import { useCatalogFilters } from '../hooks/useCatalogFilters'
import { useCatalogTemplates } from '../hooks/useCatalogTemplates'

export function CatalogPage() {
  const navigate = useNavigate()
  const { items, loading, isError } = useCatalogTemplates()
  const {
    search,
    setSearch,
    categories,
    filterCategory,
    setFilterCategory,
    providers,
    filterProvider,
    setFilterProvider,
    filtered,
  } = useCatalogFilters(items)

  const handleSelect = (item: CatalogItem) => {
    navigate(`/catalog/${item.id}`)
  }

  return (
    <div className="p-8">
      <CatalogHeader count={filtered.length} />
      <div className="grid gap-6 lg:grid-cols-[220px_1fr]">
        <CatalogFilters
          search={search}
          setSearch={setSearch}
          categories={categories}
          filterCategory={filterCategory}
          setFilterCategory={setFilterCategory}
          providers={providers}
          filterProvider={filterProvider}
          setFilterProvider={setFilterProvider}
          allItems={items}
        />
        <div>
          {isError ? (
            <CatalogError />
          ) : (
            <>
              <CatalogGrid items={filtered} onSelect={handleSelect} />
              {!loading && filtered.length === 0 && <CatalogEmpty />}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
