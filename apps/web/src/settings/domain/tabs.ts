export type SettingsTabId = 'profile' | 'security' | 'integrations' | 'billing' | 'apikeys';

export interface SettingsTab {
  id: SettingsTabId;
  label: string;
  icon: string;
}

export const SETTINGS_TABS: ReadonlyArray<SettingsTab> = [
  { id: 'profile',      label: 'Profil',       icon: 'user' },
  { id: 'security',     label: 'Sécurité',     icon: 'shield' },
  { id: 'integrations', label: 'Intégrations', icon: 'plug' },
  { id: 'billing',      label: 'Facturation',  icon: 'wallet' },
  { id: 'apikeys',      label: 'Clés API',     icon: 'key' },
];
