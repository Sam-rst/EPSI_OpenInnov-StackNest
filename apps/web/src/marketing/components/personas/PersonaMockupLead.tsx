import { motion } from 'framer-motion';
import { Icon } from '@core/ui';

const BARS = [68, 72, 75, 64, 56, 48, 32, 28, 24, 18, 14, 12.4];
const SHADOW = 'shadow-[0_18px_60px_-20px_rgba(3,34,51,0.18)]';

const LINES = [
  { label: 'Postgres prod',    cost: '5,80 €' },
  { label: 'Redis cache',      cost: '3,20 €' },
  { label: '3 sandboxes équipe', cost: '3,40 €' },
];

export function PersonaMockupLead() {
  return (
    <div className="w-full max-w-[420px]">
      <div className={`rounded-xl border border-border bg-surface-elevated p-5 ${SHADOW}`}>
        <div className="flex items-end justify-between mb-4">
          <div>
            <div className="text-[11px] font-mono uppercase tracking-[0.14em] text-text-muted">Coût mensuel</div>
            <div className="text-[36px] font-bold tracking-[-0.02em] leading-[1.1] text-text-primary">12,40&nbsp;€</div>
          </div>
          <div className="inline-flex items-center gap-1 text-[11px] font-medium px-2 h-6 rounded bg-[color-mix(in_oklch,var(--brand-success)_18%,transparent)] text-success">
            <Icon name="trending-down" size={11} /> -68%
          </div>
        </div>
        <div className="flex items-end gap-1 h-14 mb-1.5">
          {BARS.map((value, i) => (
            <motion.div
              key={i}
              initial={{ height: 0 }}
              whileInView={{ height: `${(value / 75) * 100}%` }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: i * 0.04, ease: [0.22, 1, 0.36, 1] }}
              className={`flex-1 rounded-sm ${i === BARS.length - 1 ? 'bg-cyan' : 'bg-[color-mix(in_oklch,var(--text-muted)_28%,transparent)]'}`}
            />
          ))}
        </div>
        <div className="flex items-center justify-between text-[10px] font-mono mb-4 text-text-muted">
          <span>il y a 12 mois</span>
          <span className="text-cyan">maintenant</span>
        </div>
        <div className="border-t border-border pt-3 space-y-1.5 text-[12px]">
          {LINES.map((line) => (
            <div key={line.label} className="flex justify-between">
              <span className="text-text-secondary">{line.label}</span>
              <span className="font-mono text-text-primary">{line.cost}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
