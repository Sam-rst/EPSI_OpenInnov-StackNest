import { Card } from '@core/ui';
import type { TeamMember } from '@core/data/team';
import { TeamTableRow } from './TeamTableRow';

interface TeamTableProps {
  members: ReadonlyArray<TeamMember>;
}

const COLUMNS = ['Membre', 'Rôle', 'Équipe', 'Dernière activité', ''];

export function TeamTable({ members }: TeamTableProps) {
  return (
    <Card className="overflow-hidden">
      <table className="w-full text-[12.5px]">
        <thead className="bg-surface-sunken">
          <tr className="text-[10.5px] font-mono uppercase tracking-[0.12em] text-text-muted">
            {COLUMNS.map((col, i) => (
              <th
                key={col || `empty-${i}`}
                className={`${i === 0 ? 'px-5' : 'px-3'} py-2.5 font-medium text-left`}
              >
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {members.map((member) => (
            <TeamTableRow key={member.id} member={member} />
          ))}
        </tbody>
      </table>
    </Card>
  );
}
