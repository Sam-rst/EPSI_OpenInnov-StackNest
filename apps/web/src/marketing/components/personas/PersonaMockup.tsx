import type { PersonaMockupKey } from '../../data/personas.data'
import { PersonaMockupLead } from './PersonaMockupLead'
import { PersonaMockupSenior } from './PersonaMockupSenior'
import { PersonaMockupStudent } from './PersonaMockupStudent'

interface PersonaMockupProps {
  mockup: PersonaMockupKey
}

/** Sélectionne le visuel illustratif correspondant au persona actif. */
export function PersonaMockup({ mockup }: PersonaMockupProps) {
  if (mockup === 'student') {
    return <PersonaMockupStudent />
  }
  if (mockup === 'senior') {
    return <PersonaMockupSenior />
  }
  return <PersonaMockupLead />
}
