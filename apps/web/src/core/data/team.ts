export interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: string;
  team: string;
  last: string;
  color: string;
}

export const TEAM_MEMBERS: ReadonlyArray<TeamMember> = [
  { id: 'yassine', name: 'Yassine Zouitni',   email: 'yassine.zouitni@stacknest.dev',   role: 'Owner · Admin', team: 'Plateforme', last: 'il y a 2 min',  color: '#fea21f' },
  { id: 'samuel',  name: 'Samuel Ressiot',    email: 'samuel.ressiot@stacknest.dev',    role: 'Developer',     team: 'Plateforme', last: 'il y a 14 min', color: '#0d9297' },
  { id: 'antony',  name: 'Antony Lozano',     email: 'antony.lozano@stacknest.dev',     role: 'Viewer',        team: 'Backend',    last: 'il y a 1 h',    color: '#fea21f' },
  { id: 'remi',    name: 'Remi Reze',         email: 'remi.reze@stacknest.dev',         role: 'Viewer',        team: 'Backend',    last: 'il y a 3 h',    color: '#0d9297' },
  { id: 'thomas',  name: 'Thomas Bremard',    email: 'thomas.bremard@stacknest.dev',    role: 'Viewer',        team: 'Frontend',   last: 'hier',          color: '#fea21f' },
  { id: 'julien',  name: 'Julien Volmerange', email: 'julien.volmerange@stacknest.dev', role: 'Viewer',        team: 'Frontend',   last: 'il y a 2 j',    color: '#0d9297' },
  { id: 'mahe',    name: 'Mahe Pernot',       email: 'mahe.pernot@stacknest.dev',       role: 'Viewer',        team: 'DevRel',     last: 'il y a 4 j',    color: '#fea21f' },
];
