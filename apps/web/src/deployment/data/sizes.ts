export interface InstanceSize {
  id: 'small' | 'medium' | 'large';
  cpu: string;
  ram: string;
  cost: number;
}

export const INSTANCE_SIZES: ReadonlyArray<InstanceSize> = [
  { id: 'small',  cpu: '1 vCPU', ram: '2 GB', cost: 9 },
  { id: 'medium', cpu: '2 vCPU', ram: '4 GB', cost: 24 },
  { id: 'large',  cpu: '4 vCPU', ram: '8 GB', cost: 56 },
];
