import { Card } from '../common/Card'

const ROW_COUNT = 4

/** Squelette de chargement de la liste des déploiements (placeholders animés). */
export function DeploymentsSkeleton() {
  return (
    <Card className="divide-border divide-y p-0">
      {Array.from({ length: ROW_COUNT }).map((_, index) => (
        <div key={index} className="flex items-center gap-4 px-4 py-3.5">
          <div className="bg-surface-sunken h-4 w-32 animate-pulse rounded" />
          <div className="bg-surface-sunken h-4 w-24 animate-pulse rounded" />
          <div className="bg-surface-sunken ml-auto h-4 w-20 animate-pulse rounded" />
        </div>
      ))}
    </Card>
  )
}
