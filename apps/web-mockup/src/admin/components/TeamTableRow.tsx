import { Avatar, Badge, Icon } from '@core/ui';
import type { TeamMember } from '@core/data/team';
import { ROLE_TONES } from '../domain/enums/UserRole';

interface TeamTableRowProps {
  member: TeamMember;
}

export function TeamTableRow({ member }: TeamTableRowProps) {
  const tone = ROLE_TONES[member.role] ?? 'neutral';
  return (
    <tr className="border-t border-hairline hover:bg-surface-sunken transition">
      <td className="px-5 py-3">
        <div className="flex items-center gap-3">
          <Avatar name={member.name} color={member.color} size={32} />
          <div>
            <div className="font-medium text-text-primary">{member.name}</div>
            <div className="text-[11px] font-mono text-text-muted">{member.email}</div>
          </div>
        </div>
      </td>
      <td className="px-3 py-3"><Badge tone={tone}>{member.role}</Badge></td>
      <td className="px-3 py-3 text-text-secondary">{member.team}</td>
      <td className="px-3 py-3 font-mono text-[11.5px] text-text-muted">{member.last}</td>
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
