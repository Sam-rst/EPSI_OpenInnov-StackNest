export interface ApiKey {
  name: string;
  token: string;
  created: string;
  last: string;
}

export const API_KEYS: ReadonlyArray<ApiKey> = [
  { name: 'CI / GitHub Actions', token: 'sn_live_••••a8f2', created: 'il y a 12 j', last: 'il y a 2 h' },
  { name: 'Terraform local',     token: 'sn_live_••••3e7c', created: 'il y a 30 j', last: 'hier' },
];
