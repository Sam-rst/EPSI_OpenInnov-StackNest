import type { TeamMember } from '@core/data/team';
import { ROLE_FILTERS, type RoleFilter } from '../domain/enums/UserRole';

interface RoleFiltersProps {
  team: ReadonlyArray<TeamMember>;
  active: RoleFilter;
  onSelect: (filter: RoleFilter) => void;
}

const countByFilter = (team: ReadonlyArray<TeamMember>, filter: RoleFilter): number =>
  filter === 'Tous' ? team.length : team.filter((m) => m.role.includes(filter)).length;

export function RoleFilters({ team, active, onSelect }: RoleFiltersProps) {
  return (
    <div className="flex items-center gap-2 mb-5">
      {ROLE_FILTERS.map((filter) => {
        const isActive = active === filter;
        return (
          <button
            key={filter}
            type="button"
            onClick={() => onSelect(filter)}
            className={`px-3 h-8 rounded-md text-[12.5px] font-medium transition ${
              isActive ? 'bg-night text-white' : 'border border-border text-text-secondary'
            }`}
          >
            {filter}{' '}
            <span className="ml-1.5 opacity-60 font-mono text-[10.5px]">
              {countByFilter(team, filter)}
            </span>
          </button>
        );
      })}
    </div>
  );
}
