import { Avatar, Badge, Icon, StatusDot } from '@core/ui';
import type { TeamMember } from '@core/data/team';
import type { ActiveResource } from '../../data/dashboard.fixtures';
import { envBadgeTone } from './envBadgeTone';

interface ActiveTableRowProps {
  resource: ActiveResource;
  owner?: TeamMember;
}

export function ActiveTableRow({ resource, owner }: ActiveTableRowProps) {
  const ownerName = owner?.name ?? resource.owner;
  const ownerFirst = ownerName.split(' ')[0] ?? ownerName;

  return (
    <tr className="border-t border-hairline hover:bg-surface-sunken transition">
      <td className="px-5 py-3 font-mono font-medium text-text-primary">{resource.name}</td>
      <td className="px-3 py-3 text-text-secondary">{resource.type}</td>
      <td className="px-3 py-3"><Badge tone={envBadgeTone(resource.env)}>{resource.env}</Badge></td>
      <td className="px-3 py-3"><StatusDot status={resource.status} /></td>
      <td className="px-3 py-3 font-mono text-right text-text-primary">{resource.cost}</td>
      <td className="px-3 py-3">
        <div className="flex items-center gap-2">
          <Avatar name={ownerName} color={owner?.color} size={22} />
          <span className="text-text-secondary">{ownerFirst}</span>
        </div>
      </td>
      <td className="px-3 py-3 text-text-muted">{resource.created}</td>
      <td className="px-3 py-3 text-right">
        <button
          type="button"
          className="w-7 h-7 rounded inline-flex items-center justify-center hover:bg-surface-elevated text-text-muted"
        >
          <Icon name="more-horizontal" size={14} />
        </button>
      </td>
    </tr>
  );
}
