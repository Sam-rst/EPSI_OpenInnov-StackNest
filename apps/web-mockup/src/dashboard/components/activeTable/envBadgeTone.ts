import type { BadgeTone } from '@core/ui';

export const envBadgeTone = (env: string): BadgeTone => {
  if (env === 'prod') return 'cyan';
  if (env === 'staging') return 'yellow';
  return 'neutral';
};
