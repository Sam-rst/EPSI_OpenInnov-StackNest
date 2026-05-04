export interface ActiveSession {
  device: string;
  location: string;
  active: boolean;
  last: string;
}

export const ACTIVE_SESSIONS: ReadonlyArray<ActiveSession> = [
  { device: 'MacBook Pro · Chrome 130', location: 'Paris, FR · 192.168.1.42', active: true,  last: 'maintenant' },
  { device: 'iPhone 15 · Safari',       location: 'Paris, FR',                  active: false, last: 'il y a 3 h' },
  { device: 'Linux · Firefox',          location: 'Lyon, FR',                   active: false, last: 'hier' },
];

export const deviceIcon = (device: string): string => {
  if (device.includes('iPhone')) return 'smartphone';
  if (device.includes('Linux')) return 'terminal';
  return 'laptop';
};
