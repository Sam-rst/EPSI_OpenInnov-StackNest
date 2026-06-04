import { useState } from 'react';
import { TEAM_MEMBERS } from '@core/data/team';
import { AdminHeader } from '../components/AdminHeader';
import { RoleFilters } from '../components/RoleFilters';
import { TeamTable } from '../components/TeamTable';
import { PermissionMatrix } from '../components/PermissionMatrix';
import type { RoleFilter } from '../domain/enums/UserRole';

const filterTeam = (filter: RoleFilter) =>
  filter === 'Tous' ? TEAM_MEMBERS : TEAM_MEMBERS.filter((m) => m.role.includes(filter));

export function AdminPage() {
  const [filter, setFilter] = useState<RoleFilter>('Tous');
  const filtered = filterTeam(filter);

  return (
    <div className="p-8 max-w-[1280px] mx-auto">
      <AdminHeader memberCount={TEAM_MEMBERS.length} />
      <RoleFilters team={TEAM_MEMBERS} active={filter} onSelect={setFilter} />
      <TeamTable members={filtered} />
      <PermissionMatrix />
    </div>
  );
}
