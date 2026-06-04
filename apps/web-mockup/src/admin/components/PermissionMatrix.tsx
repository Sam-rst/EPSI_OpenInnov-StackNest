import { Button, Card, Icon } from '@core/ui';
import { PERMISSION_ROLES, PERMISSIONS } from '../data/permissions';

const PermissionCell = ({ value }: { value: 0 | 1 }) => (
  <td className="px-3 py-2.5 text-center">
    {value === 1 ? (
      <Icon name="check" size={14} className="text-success inline" />
    ) : (
      <Icon name="minus" size={14} className="opacity-30 inline" />
    )}
  </td>
);

export function PermissionMatrix() {
  return (
    <Card className="mt-6 p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-[15px] font-semibold tracking-tight text-text-primary">
            Matrice des permissions
          </h2>
          <p className="text-[12px] mt-0.5 text-text-muted">
            Définit ce que chaque rôle peut faire dans le workspace.
          </p>
        </div>
        <Button variant="ghost" size="sm" icon="pencil">Personnaliser</Button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-[12.5px]">
          <thead>
            <tr className="text-text-muted">
              <th className="text-left py-2 font-medium text-[11px] font-mono uppercase tracking-wider">
                Permission
              </th>
              {PERMISSION_ROLES.map((role) => (
                <th key={role} className="px-3 py-2 font-medium text-[11px] font-mono uppercase tracking-wider text-center">
                  {role}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {PERMISSIONS.map((row) => (
              <tr key={row.label} className="border-t border-hairline">
                <td className="py-2.5 text-text-primary">{row.label}</td>
                {row.perms.map((value, i) => (
                  <PermissionCell key={i} value={value} />
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
