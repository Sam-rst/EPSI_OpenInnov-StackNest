import { DashboardHeader } from '../components/DashboardHeader';
import { KpiGrid } from '../components/KpiGrid';
import { CostsChart } from '../components/costsChart/CostsChart';
import { ActivityFeed } from '../components/ActivityFeed';
import { ActiveResourcesTable } from '../components/activeTable/ActiveResourcesTable';

export function DashboardPage() {
  return (
    <div className="p-8 max-w-[1400px] mx-auto">
      <DashboardHeader />
      <KpiGrid />
      <div className="grid gap-5 grid-cols-1 xl:grid-cols-[1fr_320px]">
        <CostsChart />
        <ActivityFeed />
      </div>
      <ActiveResourcesTable />
    </div>
  );
}
