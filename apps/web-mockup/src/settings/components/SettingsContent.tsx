import type { SettingsTabId } from '../domain/tabs';
import { ProfileTab } from './tabs/ProfileTab';
import { SecurityTab } from './tabs/SecurityTab';
import { IntegrationsTab } from './tabs/IntegrationsTab';
import { BillingTab } from './tabs/BillingTab';
import { ApiKeysTab } from './tabs/ApiKeysTab';

interface SettingsContentProps {
  active: SettingsTabId;
}

export function SettingsContent({ active }: SettingsContentProps) {
  return (
    <div className="space-y-5">
      {active === 'profile' && <ProfileTab />}
      {active === 'security' && <SecurityTab />}
      {active === 'integrations' && <IntegrationsTab />}
      {active === 'billing' && <BillingTab />}
      {active === 'apikeys' && <ApiKeysTab />}
    </div>
  );
}
