import { PersonaMockupStudent } from './PersonaMockupStudent';
import { PersonaMockupSenior } from './PersonaMockupSenior';
import { PersonaMockupLead } from './PersonaMockupLead';
import type { PersonaMockupKey } from './personas.data';

interface PersonaMockupProps {
  mockup: PersonaMockupKey;
}

export function PersonaMockup({ mockup }: PersonaMockupProps) {
  if (mockup === 'student') return <PersonaMockupStudent />;
  if (mockup === 'senior') return <PersonaMockupSenior />;
  return <PersonaMockupLead />;
}
