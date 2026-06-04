import { useNavigate } from 'react-router-dom';
import { ROUTES } from '@core/routing/routes';
import { useConfigState } from '../hooks/useConfigState';
import { useFlashLines } from '../hooks/useFlashLines';
import { INSTANCE_SIZES } from '../data/sizes';
import { ConfigHeader } from '../components/config/ConfigHeader';
import { IdentityCard } from '../components/config/IdentityCard';
import { CapacityCard } from '../components/config/CapacityCard';
import { OptionsCard } from '../components/config/OptionsCard';
import { TerraformPreview } from '../components/config/TerraformPreview';
import { CostEstimate } from '../components/config/CostEstimate';

const FALLBACK_RESOURCE = {
  name: 'PostgreSQL 16',
  desc: 'Base relationnelle managée, backups & replicas.',
  icon: 'database',
};

export function ConfigPage() {
  const navigate = useNavigate();
  const state = useConfigState();
  const sizeObj = INSTANCE_SIZES.find((s) => s.id === state.size) ?? INSTANCE_SIZES[1]!;
  const flashedKeys = useFlashLines({
    name: state.name, version: state.version, size: state.size,
    storage: state.storage, env: state.env, region: state.region, backups: state.backups,
  });

  return (
    <div className="p-8 max-w-[1400px] mx-auto">
      <ConfigHeader
        resourceName={FALLBACK_RESOURCE.name}
        resourceDesc={FALLBACK_RESOURCE.desc}
        resourceIcon={FALLBACK_RESOURCE.icon}
      />
      <div className="grid gap-5 grid-cols-1 lg:grid-cols-2">
        <div className="space-y-5">
          <IdentityCard
            name={state.name} env={state.env} region={state.region}
            onName={state.setName} onEnv={state.setEnv} onRegion={state.setRegion}
          />
          <CapacityCard
            version={state.version} size={state.size} storage={state.storage}
            onVersion={state.setVersion} onSize={state.setSize} onStorage={state.setStorage}
          />
          <OptionsCard backups={state.backups} onBackups={state.setBackups} />
        </div>
        <div className="space-y-5">
          <TerraformPreview state={state} sizeObj={sizeObj} flashedKeys={flashedKeys} />
          <CostEstimate
            size={sizeObj}
            storage={state.storage}
            backups={state.backups}
            onPlan={() => undefined}
            onDeploy={() => navigate(ROUTES.app.deploy)}
          />
        </div>
      </div>
    </div>
  );
}
