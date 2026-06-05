import type { FeatureKind } from '../../data/features.data'
import { InnerCatalog } from './inner/InnerCatalog'
import { InnerChat } from './inner/InnerChat'
import { InnerLogs } from './inner/InnerLogs'
import { InnerTerraform } from './inner/InnerTerraform'

interface FeatureInnerProps {
  kind: FeatureKind
}

/** Sélectionne la démo interne correspondant au type de feature. */
export function FeatureInner({ kind }: FeatureInnerProps) {
  if (kind === 'catalog') {
    return <InnerCatalog />
  }
  if (kind === 'chat') {
    return <InnerChat />
  }
  if (kind === 'tf') {
    return <InnerTerraform />
  }
  return <InnerLogs />
}
