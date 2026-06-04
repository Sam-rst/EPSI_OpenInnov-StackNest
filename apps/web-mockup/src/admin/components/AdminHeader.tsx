import { Button } from '@core/ui';

interface AdminHeaderProps {
  memberCount: number;
}

export function AdminHeader({ memberCount }: AdminHeaderProps) {
  return (
    <div className="flex items-end justify-between mb-6 flex-wrap gap-4">
      <div>
        <h1 className="text-[28px] font-bold tracking-[-0.02em] text-text-primary">
          Équipe & permissions
        </h1>
        <p className="text-[13px] mt-1 text-text-secondary">
          {memberCount} membres · 4 rôles · RBAC complet
        </p>
      </div>
      <div className="flex items-center gap-2">
        <Button variant="secondary" icon="upload">Importer CSV</Button>
        <Button variant="primary" icon="user-plus">Inviter un membre</Button>
      </div>
    </div>
  );
}
