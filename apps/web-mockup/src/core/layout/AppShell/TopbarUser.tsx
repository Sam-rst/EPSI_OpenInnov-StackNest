import { Avatar, Icon } from '@core/ui';

interface TopbarUserProps {
  onLogout: () => void;
  fullName?: string;
  role?: string;
  color?: string;
}

export function TopbarUser({
  onLogout,
  fullName = 'Yassine Zouitni',
  role = 'Owner · Admin · Plateforme',
  color = '#fea21f',
}: TopbarUserProps) {
  return (
    <button onClick={onLogout} className="flex items-center gap-2.5 group" type="button">
      <Avatar name={fullName} color={color} size={30} />
      <div className="hidden md:block text-left">
        <div className="text-[12.5px] font-semibold leading-tight text-text-primary">{fullName}</div>
        <div className="text-[11px] leading-tight text-text-muted">{role}</div>
      </div>
      <Icon name="chevron-down" size={12} className="opacity-50" />
    </button>
  );
}
