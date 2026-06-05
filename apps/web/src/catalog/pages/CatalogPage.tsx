import { useNavigate } from 'react-router-dom'

import { CatalogEmpty } from '../components/CatalogEmpty'
import { CatalogGrid } from '../components/CatalogGrid'
import { CatalogHeader } from '../components/CatalogHeader'
import { CatalogFilters } from '../components/filters'
import { useCatalogFilters } from '../hooks/useCatalogFilters'
import { useCatalogTemplates } from '../hooks/useCatalogTemplates'

export function CatalogPage() {
  const navigate = useNavigate()
  const { items, loading } = useCatalogTemplates()
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

  const handleSelect = () => {
    navigate('/deployments/config')
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
          <CatalogGrid items={filtered} onSelect={handleSelect} />
          {!loading && filtered.length === 0 && <CatalogEmpty />}
        </div>
      </div>
    </div>
  )
}
