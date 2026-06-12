import { Icon } from '../../shared/components/ui'
import type { SortDir } from '../hooks/useStackCatalogFilters'

interface StackCatalogFilterBarProps {
  search: string
  onSearch: (value: string) => void
  categories: readonly string[]
  filterCategory: string
  onFilterCategory: (value: string) => void
  popularOnly: boolean
  onPopularOnly: (value: boolean) => void
  sortDir: SortDir
  onSortDir: (value: SortDir) => void
}

const SELECT_CLASS =
  'border-border bg-surface text-text-primary focus:border-cyan h-9 w-full rounded-md border px-2 text-[12.5px] outline-none transition'

/**
 * Barre de recherche / tri / filtre du volet catalogue du builder : trouver vite
 * un service à composer. Recherche par nom, filtre par catégorie, restriction aux
 * services populaires et tri alphabétique (A→Z / Z→A).
 */
export function StackCatalogFilterBar({
  search,
  onSearch,
  categories,
  filterCategory,
  onFilterCategory,
  popularOnly,
  onPopularOnly,
  sortDir,
  onSortDir,
}: StackCatalogFilterBarProps) {
  return (
    <div className="space-y-2.5">
      <div className="relative">
        <Icon
          name="search"
          size={14}
          className="text-text-muted pointer-events-none absolute top-1/2 left-2.5 -translate-y-1/2"
        />
        <input
          type="search"
          value={search}
          onChange={(event) => onSearch(event.target.value)}
          placeholder="Rechercher un service…"
          aria-label="Rechercher un service"
          className="border-border bg-surface text-text-primary focus:border-cyan h-9 w-full rounded-md border pr-2 pl-8 text-[12.5px] transition outline-none"
        />
      </div>

      <div className="flex gap-2">
        <label className="flex-1">
          <span className="sr-only">Filtrer par catégorie</span>
          <select
            value={filterCategory}
            onChange={(event) => onFilterCategory(event.target.value)}
            aria-label="Filtrer par catégorie"
            className={SELECT_CLASS}
          >
            {categories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </label>
        <label className="w-24">
          <span className="sr-only">Trier</span>
          <select
            value={sortDir}
            onChange={(event) => onSortDir(event.target.value as SortDir)}
            aria-label="Trier"
            className={SELECT_CLASS}
          >
            <option value="asc">A → Z</option>
            <option value="desc">Z → A</option>
          </select>
        </label>
      </div>

      <label className="text-text-secondary flex cursor-pointer items-center gap-2 text-[12.5px]">
        <input
          type="checkbox"
          checked={popularOnly}
          onChange={(event) => onPopularOnly(event.target.checked)}
          className="accent-cyan h-3.5 w-3.5"
        />
        Populaires uniquement
      </label>
    </div>
  )
}
