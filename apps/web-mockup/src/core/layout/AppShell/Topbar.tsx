import { useLocation } from 'react-router-dom';
import { TOPBAR_TITLES } from './nav';
import { TopbarSearch } from './TopbarSearch';
import { TopbarActions } from './TopbarActions';
import { TopbarUser } from './TopbarUser';

const FALLBACK_TITLE = { t: 'StackNest', s: '' };

interface TopbarProps {
  onLogout: () => void;
}

export function Topbar({ onLogout }: TopbarProps) {
  const { pathname } = useLocation();
  const title = TOPBAR_TITLES[pathname] ?? FALLBACK_TITLE;

  return (
    <header className="h-14 shrink-0 flex items-center gap-4 px-6 border-b border-border bg-surface-elevated">
      <div className="flex-1 min-w-0">
        <div className="text-[14.5px] font-semibold truncate text-text-primary">{title.t}</div>
        <div className="text-[11.5px] truncate text-text-muted">{title.s}</div>
      </div>
      <TopbarSearch />
      <TopbarActions />
      <div className="h-6 w-px bg-border" />
      <TopbarUser onLogout={onLogout} />
    </header>
  );
}
