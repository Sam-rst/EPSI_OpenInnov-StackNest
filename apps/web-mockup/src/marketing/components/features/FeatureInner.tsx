import { InnerCatalog } from './inner/InnerCatalog';
import { InnerChat } from './inner/InnerChat';
import { InnerTerraform } from './inner/InnerTerraform';
import { InnerLogs } from './inner/InnerLogs';
import type { FeatureKind } from './features.data';

interface FeatureInnerProps {
  kind: FeatureKind;
}

export function FeatureInner({ kind }: FeatureInnerProps) {
  if (kind === 'catalog') return <InnerCatalog />;
  if (kind === 'chat') return <InnerChat />;
  if (kind === 'tf') return <InnerTerraform />;
  return <InnerLogs />;
}
