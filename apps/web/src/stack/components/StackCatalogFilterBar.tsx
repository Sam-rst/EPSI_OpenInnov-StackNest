import { Checkbox, Icon, Select } from '../../shared/components/ui'
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

// Surcharge la taille par défaut de la primitive Select pour la barre compacte
// (h-9, 12.5px, sans-serif), en conservant la place du chevron (pr-8).
const SELECT_CLASS = 'h-9 px-2 pr-8 font-sans text-[12.5px]'

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
        <div className="flex-1">
          <Select
            value={filterCategory}
            onChange={onFilterCategory}
            aria-label="Filtrer par catégorie"
            className={SELECT_CLASS}
          >
            {categories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </Select>
        </div>
        <div className="w-24">
          <Select
            value={sortDir}
            onChange={(value) => onSortDir(value as SortDir)}
            aria-label="Trier"
            className={SELECT_CLASS}
          >
            <option value="asc">A → Z</option>
            <option value="desc">Z → A</option>
          </Select>
        </div>
      </div>

      <Checkbox checked={popularOnly} onChange={onPopularOnly} label="Populaires uniquement" />
    </div>
  )
}
