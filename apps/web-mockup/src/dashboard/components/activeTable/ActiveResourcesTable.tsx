import { Card } from '@core/ui';
import { TEAM_MEMBERS } from '@core/data/team';
import { ACTIVE_RESOURCES } from '../../data/dashboard.fixtures';
import { ActiveTableHeader, ActiveTableToolbar } from './ActiveTableHeader';
import { ActiveTableRow } from './ActiveTableRow';

const memberMap = Object.fromEntries(TEAM_MEMBERS.map((m) => [m.id, m]));

export function ActiveResourcesTable() {
  return (
    <Card className="mt-5 overflow-hidden">
      <ActiveTableToolbar />
      <table className="w-full text-[12.5px]">
        <ActiveTableHeader />
        <tbody>
          {ACTIVE_RESOURCES.map((resource) => (
            <ActiveTableRow key={resource.id} resource={resource} owner={memberMap[resource.owner]} />
          ))}
        </tbody>
      </table>
    </Card>
  );
}
