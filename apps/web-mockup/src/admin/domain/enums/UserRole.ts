import type { BadgeTone } from '@core/ui';

export const ROLE_FILTERS = ['Tous', 'Owner', 'Admin', 'Developer', 'Viewer'] as const;
export type RoleFilter = (typeof ROLE_FILTERS)[number];

export const ROLE_TONES: Record<string, BadgeTone> = {
  Owner: 'yellow',
  Admin: 'cyan',
  Developer: 'success',
  Viewer: 'neutral',
  'Owner · Admin': 'yellow',
};
