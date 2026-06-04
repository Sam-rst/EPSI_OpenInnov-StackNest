export const PERMISSION_ROLES = ['Owner', 'Admin', 'Developer', 'Viewer'] as const;

export interface PermissionRow {
  label: string;
  perms: ReadonlyArray<0 | 1>;
}

export const PERMISSIONS: ReadonlyArray<PermissionRow> = [
  { label: 'Voir les ressources',        perms: [1, 1, 1, 1] },
  { label: 'Créer une ressource',        perms: [1, 1, 1, 0] },
  { label: 'Détruire une ressource',     perms: [1, 1, 0, 0] },
  { label: 'Inviter / retirer membres',  perms: [1, 1, 0, 0] },
  { label: 'Modifier la facturation',    perms: [1, 0, 0, 0] },
  { label: 'Accès aux secrets',          perms: [1, 1, 0, 0] },
  { label: 'Modifier les rôles',         perms: [1, 0, 0, 0] },
];
