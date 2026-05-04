import { Avatar, Card } from '@core/ui';
import { TEAM_MEMBERS } from '@core/data/team';
import { RECENT_ACTIVITIES } from '../data/dashboard.fixtures';

const memberMap = Object.fromEntries(TEAM_MEMBERS.map((m) => [m.id, m]));

export function ActivityFeed() {
  return (
    <Card className="p-5">
      <h2 className="text-[15px] font-semibold tracking-tight mb-4 text-text-primary">
        Activité récente
      </h2>
      <ul className="space-y-3.5">
        {RECENT_ACTIVITIES.map((activity, i) => {
          const member = memberMap[activity.who];
          const displayName = member?.name ?? activity.who;
          const firstName = displayName.split(' ')[0] ?? displayName;
          return (
            <li key={i} className="flex items-start gap-2.5 text-[12.5px]">
              <Avatar name={displayName} color={member?.color} size={26} />
              <div className="flex-1 min-w-0">
                <span className="font-medium text-text-primary">{firstName}</span>
                <span className="text-text-muted"> {activity.what} </span>
                <span className="font-mono text-[11.5px] text-cyan">{activity.target}</span>
                <div className="text-[11px] mt-0.5 text-text-muted">{activity.when}</div>
              </div>
            </li>
          );
        })}
      </ul>
    </Card>
  );
}
