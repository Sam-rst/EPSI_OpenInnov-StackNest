import { MOCKUP_RESOURCES } from './catalogMockup.data';
import { MockupHeader } from './MockupHeader';
import { MockupResourceCard } from './MockupResourceCard';

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
  );
}
