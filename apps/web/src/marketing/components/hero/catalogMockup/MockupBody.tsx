import { MOCKUP_RESOURCES } from '../../../data/catalogMockup.data'
import { MockupHeader } from './MockupHeader'
import { MockupResourceCard } from './MockupResourceCard'

/** Corps du mockup catalogue : en-tête + grille de ressources. */
export function MockupBody() {
  return (
    <div className="p-6">
      <MockupHeader />
      <div className="grid grid-cols-3 gap-3">
        {MOCKUP_RESOURCES.map((resource) => (
          <MockupResourceCard key={resource.name} resource={resource} />
        ))}
      </div>
    </div>
  )
}
