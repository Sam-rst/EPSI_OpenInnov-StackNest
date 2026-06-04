import { motion } from 'framer-motion';
import { Card, CountUp, Icon } from '@core/ui';

export interface Kpi {
  label: string;
  value: number;
  suffix: string;
  icon: string;
  color: string;
  delta: string;
  up: boolean;
}

interface KpiCardProps {
  kpi: Kpi;
  index: number;
}

export function KpiCard({ kpi, index }: KpiCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.06 }}
    >
      <Card className="p-5">
        <div className="flex items-center justify-between">
          <div className="text-[11px] font-mono uppercase tracking-[0.14em] text-text-muted">
            {kpi.label}
          </div>
          <span
            className="w-7 h-7 rounded-md flex items-center justify-center"
            style={{ background: `color-mix(in oklch, ${kpi.color} 14%, transparent)`, color: kpi.color }}
          >
            <Icon name={kpi.icon} size={13} />
          </span>
        </div>
        <div className="font-bold tracking-[-0.025em] text-[36px] mt-2 text-text-primary">
          <CountUp to={kpi.value} suffix={kpi.suffix} />
        </div>
        <div className={`text-[11.5px] mt-1 font-mono ${kpi.up ? 'text-success' : 'text-danger'}`}>
          {kpi.delta} vs. période précédente
        </div>
      </Card>
    </motion.div>
  );
}
