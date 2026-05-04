import { Card } from '@core/ui';
import { COST_SERIES } from '../../data/dashboard.fixtures';
import { CostsChartHeader } from './CostsChartHeader';
import { CostsChartSvg } from './CostsChartSvg';

const computeStats = (series: ReadonlyArray<number>) => {
  const total = series.reduce((a, b) => a + b, 0);
  return { total, average: Math.round(total / series.length) };
};

export function CostsChart() {
  const { total, average } = computeStats(COST_SERIES);
  return (
    <Card className="p-6">
      <CostsChartHeader total={total} average={average} />
      <CostsChartSvg series={COST_SERIES} />
      <div className="flex items-center justify-between mt-3 text-[10.5px] font-mono text-text-muted">
        <span>il y a 30 j</span>
        <span>
          <span className="inline-block w-2 h-0.5 align-middle bg-sun mr-1" />
          moyenne
        </span>
        <span>aujourd'hui</span>
      </div>
    </Card>
  );
}
