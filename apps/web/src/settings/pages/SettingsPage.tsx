import { useState } from 'react';
import type { SettingsTabId } from '../domain/tabs';
import { SettingsSidebar } from '../components/SettingsSidebar';
import { SettingsContent } from '../components/SettingsContent';

export function SettingsPage() {
  const [tab, setTab] = useState<SettingsTabId>('profile');

  return (
    <div className="p-8 max-w-[1180px] mx-auto">
      <div className="mb-6">
        <h1 className="text-[28px] font-bold tracking-[-0.02em] text-text-primary">Paramètres</h1>
        <p className="text-[13px] mt-1 text-text-secondary">
          Personnalise ton compte et ton workspace
        </p>
      </div>
      <div className="grid gap-6 grid-cols-[220px_1fr]">
        <SettingsSidebar active={tab} onSelect={setTab} />
        <SettingsContent active={tab} />
      </div>
    </div>
  );
}
